using System.Diagnostics;
using System.Globalization;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Xml;
using System.Xml.Linq;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;

internal static class Program
{
    private const long MaxExpandedWorkbookBytes = 1024L * 1024 * 1024;
    private const int MaxWorkbookEntries = 20_000;
    private const int UnmatchedSampleLimit = 500;
    private const int DuplicateSampleLimit = 200;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static readonly XNamespace MainNs = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private static readonly XmlReaderSettings SecureXmlSettings = new()
    {
        DtdProcessing = DtdProcessing.Prohibit,
        XmlResolver = null,
        IgnoreWhitespace = false,
        CloseInput = false,
    };

    private static readonly string[] SourceHeaders = ["WR", "TRACKING", "CLIENTE", "TIPOPAQUETE", "PESO", "ESTADO"];
    private static readonly string[] InventoryHeaders = ["GUIAWR", "CONSIGNATARIO", "TRACKING", "TIPOEMPAQUE", "PESOKG", "ESTADOENTREGA"];

    private sealed record HeaderInfo(int Row, Dictionary<string, int> Columns);
    private sealed record WorksheetInfo(WorksheetPart Part, string Name);
    private sealed record HeaderColumn(string Name, string Column);
    private sealed record WorkbookValidation(string FileName, string WorksheetName, int HeaderRow, IReadOnlyList<HeaderColumn> Headers);
    private sealed record CellData(string Text, CellKind Kind);
    private sealed record SourceRecord(CellData? Tracking, CellData? Client, CellData? Package, CellData? Weight, CellData? Status, double Modified, string Source);
    private sealed record UnmatchedRecord(string Wr, int Row);
    private enum CellKind { Blank, Text, Number, Boolean, Error }

    private sealed class CachedSourceData
    {
        public Dictionary<string, SourceRecord> Lookup { get; } = new(StringComparer.Ordinal);
        public long SourceRows { get; set; }
        public long DuplicateRows { get; set; }
        public Dictionary<string, int> DuplicateCounts { get; } = new(StringComparer.Ordinal);
        public List<WorkbookValidation> Validations { get; } = new(4);
        public Dictionary<string, long> FileMtimes { get; } = new(StringComparer.Ordinal);
        public DateTime LastWarmup { get; set; }
    }

    private static readonly object CacheLock = new();
    private static CachedSourceData GlobalCache = new();

    private static int Main(string[] args)
    {
        if (args.Length > 0 && (args[0] == "--daemon" || args[0] == "--server"))
        {
            int port = 10001;
            if (args.Length > 1 && int.TryParse(args[1], out int p)) port = p;
            RunDaemon(port);
            return 0;
        }

        if (args.Length != 6)
        {
            Console.Error.WriteLine("Uso: AmexInventoryProcessor <inventario.xlsx> <entregado.xlsx> <enviado.xlsx> <recibido.xlsx> <salida.xlsx> <sin-coincidencia.csv>");
            Console.Error.WriteLine("O bien: AmexInventoryProcessor --daemon [puerto]");
            return 2;
        }

        try
        {
            RunCli(args);
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(JsonSerializer.Serialize(new { ok = false, error = ex.Message }, JsonOptions));
            return 1;
        }
    }

    private static void RunCli(string[] args)
    {
        string inventoryPath = Path.GetFullPath(args[0]);
        string[] sourcePaths = args.Skip(1).Take(3).Select(Path.GetFullPath).ToArray();
        string outputPath = Path.GetFullPath(args[4]);
        string unmatchedCsvPath = Path.GetFullPath(args[5]);

        var report = ProcessInventory(inventoryPath, sourcePaths, outputPath, unmatchedCsvPath, ReportProgress);
        Console.Out.WriteLine(JsonSerializer.Serialize(report, JsonOptions));
    }

    private static CachedSourceData WarmUpSources(string[] sourcePaths, Action<string, string>? onStage = null)
    {
        lock (CacheLock)
        {
            bool dirty = false;
            foreach (var p in sourcePaths)
            {
                if (!File.Exists(p)) continue;
                long curTicks = File.GetLastWriteTimeUtc(p).Ticks;
                if (!GlobalCache.FileMtimes.TryGetValue(p, out long savedTicks) || savedTicks != curTicks)
                {
                    dirty = true;
                    break;
                }
            }

            if (!dirty && GlobalCache.Lookup.Count > 0)
            {
                return GlobalCache;
            }

            var newCache = new CachedSourceData();
            string[] sourceStageIds = ["reading-delivered", "reading-sent", "reading-received"];

            for (int fileIndex = 0; fileIndex < sourcePaths.Length; fileIndex++)
            {
                string sourcePath = sourcePaths[fileIndex];
                if (!File.Exists(sourcePath)) continue;

                string stageId = fileIndex < sourceStageIds.Length ? sourceStageIds[fileIndex] : "reading-source";
                onStage?.Invoke(stageId, $"Buscando encabezados y leyendo {Path.GetFileName(sourcePath)}.");

                ValidateXlsxContainer(sourcePath);
                using SpreadsheetDocument document = SpreadsheetDocument.Open(sourcePath, false);
                WorkbookPart workbookPart = document.WorkbookPart ?? throw new InvalidDataException("The source workbook has no workbook part.");
                WorksheetInfo firstWorksheet = FirstWorksheetInfo(workbookPart);
                WorksheetPart worksheetPart = firstWorksheet.Part;
                List<string> sharedStrings = ReadSharedStrings(workbookPart.SharedStringTablePart);
                HeaderInfo? headers = null;
                WorkbookValidation? validation = null;
                int[] selectedSourceColumns = [];
                int firstUsedRow = 0;
                long scannedRows = 0;

                foreach (XElement row in ReadRows(worksheetPart))
                {
                    scannedRows++;
                    int rowNumber = RowNumber(row);
                    if (firstUsedRow == 0 && row.Elements(MainNs + "c").Any())
                        firstUsedRow = rowNumber;
                    if (headers is null)
                    {
                        if (firstUsedRow > 0 && rowNumber > firstUsedRow + 24)
                            throw new InvalidDataException($"No se encontraron los encabezados requeridos en '{Path.GetFileName(sourcePath)}'.");
                        headers = TryFindHeaders(row, SourceHeaders, sharedStrings);
                        if (headers is null) continue;
                        selectedSourceColumns = SourceHeaders
                            .Select(header => headers.Columns[header])
                            .Concat(headers.Columns.ContainsKey("MODIFICADO") ? [headers.Columns["MODIFICADO"]] : [])
                            .ToArray();
                        validation = CreateValidation(sourcePath, firstWorksheet.Name, headers, SourceHeaders, includeModified: true);
                        newCache.Validations.Add(validation);
                        continue;
                    }

                    if (rowNumber <= headers.Row) continue;

                    Dictionary<int, CellData> values = ReadRowValues(row, sharedStrings, selectedSourceColumns);
                    string? key = GetKey(values, headers.Columns["WR"]);
                    if (key is null) continue;

                    newCache.SourceRows++;
                    double modified = headers.Columns.TryGetValue("MODIFICADO", out int modifiedColumn)
                        && values.TryGetValue(modifiedColumn, out CellData? modifiedValue)
                            ? DateRank(modifiedValue)
                            : 0d;

                    var record = new SourceRecord(
                        GetValue(values, headers.Columns["TRACKING"]),
                        GetValue(values, headers.Columns["CLIENTE"]),
                        GetValue(values, headers.Columns["TIPOPAQUETE"]),
                        GetValue(values, headers.Columns["PESO"]),
                        GetValue(values, headers.Columns["ESTADO"]),
                        modified,
                        Path.GetFileName(sourcePath));

                    if (newCache.Lookup.TryGetValue(key, out SourceRecord? previous))
                    {
                        newCache.DuplicateRows++;
                        newCache.DuplicateCounts[key] = newCache.DuplicateCounts.GetValueOrDefault(key) + 1;
                        if (modified > previous.Modified)
                            newCache.Lookup[key] = record;
                    }
                    else
                    {
                        newCache.Lookup.Add(key, record);
                    }
                }

                newCache.FileMtimes[sourcePath] = File.GetLastWriteTimeUtc(sourcePath).Ticks;
                onStage?.Invoke(stageId, $"{Path.GetFileName(sourcePath)}: {scannedRows:N0} filas recorridas.");
            }

            newCache.LastWarmup = DateTime.UtcNow;
            GlobalCache = newCache;
            return GlobalCache;
        }
    }

    private static object ProcessInventory(
        string inventoryPath,
        string[] sourcePaths,
        string outputPath,
        string unmatchedCsvPath,
        Action<string, string, long?, WorkbookValidation?>? onProgress = null)
    {
        if (string.Equals(inventoryPath, outputPath, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("The output path cannot overwrite the selected inventory.");

        var totalWatch = Stopwatch.StartNew();
        using Process currentProcess = Process.GetCurrentProcess();
        TimeSpan cpuAtStart = currentProcess.TotalProcessorTime;
        var stageWatch = new Stopwatch();
        var stageDurations = new Dictionary<string, double>(StringComparer.Ordinal);
        var inputValidations = new List<WorkbookValidation>(4);
        string? activeStage = null;

        void BeginStage(string stage, string message)
        {
            if (activeStage is not null)
                stageDurations[activeStage] = Math.Round(stageWatch.Elapsed.TotalSeconds, 2);
            activeStage = stage;
            stageWatch.Restart();
            onProgress?.Invoke(stage, message, null, null);
        }

        void FinishStage()
        {
            if (activeStage is not null)
            {
                stageDurations[activeStage] = Math.Round(stageWatch.Elapsed.TotalSeconds, 2);
                activeStage = null;
            }
        }

        BeginStage("validating", "Validando la estructura del inventario y fuentes.");
        ValidateXlsxContainer(inventoryPath);

        // Precalentamiento de fuentes TIB (0ms si el cache ya está en RAM y no hubo cambios)
        CachedSourceData cache = WarmUpSources(sourcePaths, (st, msg) => BeginStage(st, msg));
        inputValidations.AddRange(cache.Validations);

        BeginStage("validating-inventory", "Buscando la hoja y las columnas del inventario.");
        using (SpreadsheetDocument inventoryDocument = SpreadsheetDocument.Open(inventoryPath, false))
        {
            WorkbookPart workbookPart = inventoryDocument.WorkbookPart ?? throw new InvalidDataException("The inventory has no workbook part.");
            WorksheetInfo firstWorksheet = FirstWorksheetInfo(workbookPart);
            WorksheetPart worksheetPart = firstWorksheet.Part;
            List<string> sharedStrings = ReadSharedStrings(workbookPart.SharedStringTablePart);
            HeaderInfo headers = FindHeaders(worksheetPart, InventoryHeaders, sharedStrings, Path.GetFileName(inventoryPath));
            WorkbookValidation inventoryValidation = CreateValidation(inventoryPath, firstWorksheet.Name, headers, InventoryHeaders);
            inputValidations.Add(inventoryValidation);
            onProgress?.Invoke("validating-inventory", $"Hoja '{firstWorksheet.Name}': encabezados encontrados en fila {headers.Row}.", 0, inventoryValidation);

            BeginStage("matching", "Cruzando los WR y completando las filas del inventario.");

            string outputDirectory = Path.GetDirectoryName(outputPath) ?? Directory.GetCurrentDirectory();
            Directory.CreateDirectory(outputDirectory);
            string csvDirectory = Path.GetDirectoryName(unmatchedCsvPath) ?? Directory.GetCurrentDirectory();
            Directory.CreateDirectory(csvDirectory);
            string runToken = Guid.NewGuid().ToString("N");
            string workingOutputPath = outputPath + "." + runToken + ".tmp";
            string workingCsvPath = unmatchedCsvPath + "." + runToken + ".tmp";
            string entryName = worksheetPart.Uri.OriginalString.TrimStart('/');
            PatchCounts counts;
            try
            {
                File.Copy(inventoryPath, workingOutputPath, false);
                counts = PatchInventory(
                    workingOutputPath,
                    entryName,
                    headers,
                    sharedStrings,
                    cache.Lookup,
                    workingCsvPath,
                    rows => onProgress?.Invoke("matching", $"Cruzando el inventario: {rows:N0} filas recorridas.", rows, null));
                onProgress?.Invoke("matching", $"Cruce listo: {counts.Matched:N0} coincidencias y {counts.Unmatched:N0} sin coincidencia.", counts.Total, null);
                BeginStage("verifying", "Verificando y guardando el Excel completado.");
                using (SpreadsheetDocument check = SpreadsheetDocument.Open(workingOutputPath, false))
                    _ = FirstWorksheet(check.WorkbookPart ?? throw new InvalidDataException("The generated workbook has no workbook part."));
                File.Move(workingOutputPath, outputPath, true);
                File.Move(workingCsvPath, unmatchedCsvPath, true);
                FinishStage();
            }
            finally
            {
                TryDelete(workingOutputPath);
                TryDelete(workingCsvPath);
            }

            totalWatch.Stop();
            double cpuSeconds = Math.Round((currentProcess.TotalProcessorTime - cpuAtStart).TotalSeconds, 2);
            double peakWorkingSetMb = Math.Round(currentProcess.PeakWorkingSet64 / (1024d * 1024d), 1);
            var duplicateDetails = cache.DuplicateCounts
                .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                .Take(DuplicateSampleLimit)
                .Select(pair => new { wr = pair.Key, rows = pair.Value + 1, chosenSource = cache.Lookup.TryGetValue(pair.Key, out var rec) ? rec.Source : "" })
                .ToArray();

            return new
            {
                ok = true,
                totalInventory = counts.Total,
                matched = counts.Matched,
                unmatchedCount = counts.Unmatched,
                unmatchedSample = counts.UnmatchedSample,
                sourceRows = cache.SourceRows,
                uniqueWR = cache.Lookup.Count,
                duplicateRows = cache.DuplicateRows,
                duplicateWRs = duplicateDetails,
                inputValidations,
                stageSeconds = stageDurations,
                processingSeconds = Math.Round(totalWatch.Elapsed.TotalSeconds, 2),
                cpuSeconds,
                peakWorkingSetMb,
            };
        }
    }

    private static void RunDaemon(int port)
    {
        string prefix = $"http://127.0.0.1:{port}/";
        using var listener = new HttpListener();
        listener.Prefixes.Add(prefix);
        listener.Start();
        Console.WriteLine($"[daemon] AmexInventoryProcessor Daemon escuchando en {prefix}");

        string[] defaultSources = [
            "/app/cache/tib-active/delivered.xlsx",
            "/app/cache/tib-active/sent.xlsx",
            "/app/cache/tib-active/received.xlsx"
        ];
        if (defaultSources.Any(File.Exists))
        {
            Task.Run(() =>
            {
                try
                {
                    Console.WriteLine("[daemon-boot] Iniciando precalentamiento automático de fuentes...");
                    var sw = Stopwatch.StartNew();
                    WarmUpSources(defaultSources.Where(File.Exists).ToArray(), (st, msg) => Console.WriteLine($"[daemon-warmup] {st}: {msg}"));
                    Console.WriteLine($"[daemon-boot] Precalentamiento completado en {sw.ElapsedMilliseconds}ms. {GlobalCache.Lookup.Count:N0} WRs listos en RAM.");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[daemon-boot-error] {ex.Message}");
                }
            });
        }

        while (listener.IsListening)
        {
            try
            {
                var context = listener.GetContext();
                ThreadPool.QueueUserWorkItem(_ => HandleDaemonRequest(context));
            }
            catch (Exception) when (!listener.IsListening)
            {
                break;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[daemon-error] {ex.Message}");
            }
        }
    }

    private sealed record ProcessRequest(string? InventoryPath, string[]? SourcePaths, string? OutputPath, string? UnmatchedCsvPath);
    private sealed record WarmupRequest(string[]? SourcePaths);

    private static void HandleDaemonRequest(HttpListenerContext context)
    {
        var req = context.Request;
        var res = context.Response;
        res.Headers.Add("Access-Control-Allow-Origin", "*");

        try
        {
            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            string path = req.Url?.AbsolutePath ?? "/";

            if (req.HttpMethod == "GET" && path == "/health")
            {
                var health = new
                {
                    ok = true,
                    status = "daemon_online",
                    isWarm = GlobalCache.Lookup.Count > 0,
                    totalWrs = GlobalCache.Lookup.Count,
                    totalSourceRows = GlobalCache.SourceRows,
                    lastWarmup = GlobalCache.LastWarmup,
                };
                SendDaemonJson(res, 200, health);
                return;
            }

            if (req.HttpMethod == "POST" && path == "/warmup")
            {
                using var reader = new StreamReader(req.InputStream, Encoding.UTF8);
                string body = reader.ReadToEnd();
                var parsed = string.IsNullOrWhiteSpace(body) ? null : JsonSerializer.Deserialize<WarmupRequest>(body, JsonOptions);
                string[] sources = parsed?.SourcePaths ?? [
                    "/app/cache/tib-active/delivered.xlsx",
                    "/app/cache/tib-active/sent.xlsx",
                    "/app/cache/tib-active/received.xlsx"
                ];

                var sw = Stopwatch.StartNew();
                var cache = WarmUpSources(sources.Where(File.Exists).ToArray());
                var resp = new
                {
                    ok = true,
                    status = "warm",
                    totalWrs = cache.Lookup.Count,
                    sourceRows = cache.SourceRows,
                    elapsedMs = sw.ElapsedMilliseconds,
                };
                SendDaemonJson(res, 200, resp);
                return;
            }

            if (req.HttpMethod == "POST" && path == "/process")
            {
                using var reader = new StreamReader(req.InputStream, Encoding.UTF8);
                string body = reader.ReadToEnd();
                var pReq = JsonSerializer.Deserialize<ProcessRequest>(body, JsonOptions)
                    ?? throw new InvalidOperationException("Cuerpo de petición inválido.");

                if (string.IsNullOrWhiteSpace(pReq.InventoryPath) || string.IsNullOrWhiteSpace(pReq.OutputPath))
                    throw new InvalidOperationException("InventoryPath y OutputPath son requeridos.");

                var result = ProcessInventory(
                    pReq.InventoryPath,
                    pReq.SourcePaths ?? [],
                    pReq.OutputPath,
                    pReq.UnmatchedCsvPath ?? (pReq.OutputPath + ".unmatched.csv"));

                SendDaemonJson(res, 200, result);
                return;
            }

            SendDaemonJson(res, 404, new { ok = false, error = "Ruta no encontrada" });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[daemon-request-error] {ex.Message}");
            SendDaemonJson(res, 500, new { ok = false, error = ex.Message });
        }
    }

    private static void SendDaemonJson(HttpListenerResponse response, int statusCode, object data)
    {
        try
        {
            byte[] bytes = JsonSerializer.SerializeToUtf8Bytes(data, JsonOptions);
            response.StatusCode = statusCode;
            response.ContentType = "application/json; charset=utf-8";
            response.ContentLength64 = bytes.Length;
            using Stream output = response.OutputStream;
            output.Write(bytes, 0, bytes.Length);
        }
        catch { }
        finally
        {
            try { response.Close(); } catch { }
        }
    }

    private static void ReportProgress(string stage, string message, long? currentRows = null, WorkbookValidation? validation = null)
    {
        Console.Error.WriteLine($"PROGRESS:{JsonSerializer.Serialize(new { stage, message, currentRows, validation }, JsonOptions)}");
        Console.Error.Flush();
    }

    private static WorkbookValidation CreateValidation(
        string path,
        string worksheetName,
        HeaderInfo headers,
        IEnumerable<string> requiredHeaders,
        bool includeModified = false)
    {
        IEnumerable<string> names = includeModified && headers.Columns.ContainsKey("MODIFICADO")
            ? requiredHeaders.Append("MODIFICADO")
            : requiredHeaders;
        HeaderColumn[] columns = names
            .Select(name => new HeaderColumn(name, ColumnName(headers.Columns[name])))
            .ToArray();
        return new WorkbookValidation(Path.GetFileName(path), worksheetName, headers.Row, columns);
    }

    private static void ValidateXlsxContainer(string path)
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"No se encontró el archivo {Path.GetFileName(path)}.");
        if (!string.Equals(Path.GetExtension(path), ".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new InvalidDataException($"{Path.GetFileName(path)} no tiene extensión .xlsx.");

        using ZipArchive archive = ZipFile.OpenRead(path);
        if (archive.Entries.Count == 0 || archive.Entries.Count > MaxWorkbookEntries)
            throw new InvalidDataException($"{Path.GetFileName(path)} no es un libro .xlsx válido o contiene demasiados componentes.");
        long expandedBytes = 0;
        foreach (ZipArchiveEntry entry in archive.Entries)
        {
            expandedBytes = checked(expandedBytes + entry.Length);
            if (expandedBytes > MaxExpandedWorkbookBytes)
                throw new InvalidDataException($"{Path.GetFileName(path)} excede el límite de contenido descomprimido de 1 GB.");
        }
        if (archive.GetEntry("[Content_Types].xml") is null || archive.GetEntry("xl/workbook.xml") is null)
            throw new InvalidDataException($"{Path.GetFileName(path)} no contiene la estructura interna esperada de un Excel .xlsx.");
    }

    private static WorksheetPart FirstWorksheet(WorkbookPart workbookPart)
        => FirstWorksheetInfo(workbookPart).Part;

    private static WorksheetInfo FirstWorksheetInfo(WorkbookPart workbookPart)
    {
        Sheet sheet = workbookPart.Workbook.Sheets?.Elements<Sheet>().FirstOrDefault()
            ?? throw new InvalidDataException("The workbook has no worksheets.");
        string relationshipId = sheet.Id?.Value ?? throw new InvalidDataException("The first worksheet has no relationship id.");
        WorksheetPart worksheetPart = workbookPart.GetPartById(relationshipId) as WorksheetPart
            ?? throw new InvalidDataException("The first workbook item is not a worksheet.");
        return new WorksheetInfo(worksheetPart, sheet.Name?.Value ?? "Hoja 1");
    }

    private static List<string> ReadSharedStrings(SharedStringTablePart? part)
    {
        var strings = new List<string>();
        if (part is null)
            return strings;

        using Stream stream = part.GetStream(FileMode.Open, FileAccess.Read);
        using XmlReader reader = XmlReader.Create(stream, SecureXmlSettings);
        while (reader.Read())
        {
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "si" || reader.NamespaceURI != MainNs.NamespaceName)
                continue;
            using XmlReader subtree = reader.ReadSubtree();
            XElement sharedItem = XElement.Load(subtree, LoadOptions.None);
            strings.Add(string.Concat(sharedItem.Descendants(MainNs + "t").Select(node => node.Value)));
        }
        return strings;
    }

    private static IEnumerable<XElement> ReadRows(WorksheetPart worksheetPart)
    {
        using Stream stream = worksheetPart.GetStream(FileMode.Open, FileAccess.Read);
        using XmlReader reader = XmlReader.Create(stream, SecureXmlSettings);
        while (reader.Read())
        {
            if (reader.NodeType != XmlNodeType.Element || reader.LocalName != "row" || reader.NamespaceURI != MainNs.NamespaceName)
                continue;
            using XmlReader subtree = reader.ReadSubtree();
            yield return XElement.Load(subtree, LoadOptions.None);
        }
    }

    private static HeaderInfo FindHeaders(WorksheetPart worksheetPart, string[] required, List<string> sharedStrings, string label)
    {
        int firstUsedRow = 0;
        foreach (XElement row in ReadRows(worksheetPart))
        {
            int rowNumber = RowNumber(row);
            if (firstUsedRow == 0 && row.Elements(MainNs + "c").Any())
                firstUsedRow = rowNumber;
            if (firstUsedRow > 0 && rowNumber > firstUsedRow + 24)
                break;
            HeaderInfo? found = TryFindHeaders(row, required, sharedStrings);
            if (found is not null)
                return found;
        }
                throw new InvalidDataException($"No se encontraron los encabezados requeridos en '{label}'.");
    }

    private static HeaderInfo? TryFindHeaders(XElement row, string[] required, List<string> sharedStrings)
    {
        var columns = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (XElement cell in row.Elements(MainNs + "c"))
        {
            int column = ColumnNumber((string?)cell.Attribute("r") ?? string.Empty);
            string name = NormalizeHeader(ReadCell(cell, sharedStrings)?.Text ?? string.Empty);
            if (name.Length > 0 && !columns.ContainsKey(name))
            {
                columns.Add(name, column);
                // Alias comunes para compatibilidad con las exportaciones del ERP y reportes TIB
                if ((name == "TRACKINGUSA" || name == "TRACKINGNUMBER") && !columns.ContainsKey("TRACKING"))
                    columns.Add("TRACKING", column);
                if (name == "TRACKING" && !columns.ContainsKey("TRACKINGUSA"))
                    columns.Add("TRACKINGUSA", column);

                if ((name == "WR" || name == "GUIA" || name == "RECIBO" || name == "NUMERORECIBOBODEGA") && !columns.ContainsKey("GUIAWR"))
                    columns.Add("GUIAWR", column);
                if ((name == "GUIAWR" || name == "NUMERORECIBOBODEGA") && !columns.ContainsKey("WR"))
                    columns.Add("WR", column);

                if ((name == "CLIENTE" || name == "DESTINATARIO") && !columns.ContainsKey("CONSIGNATARIO"))
                    columns.Add("CONSIGNATARIO", column);
                if ((name == "CONSIGNATARIO" || name == "NOMBRECONSIGNATARIO") && !columns.ContainsKey("CLIENTE"))
                    columns.Add("CLIENTE", column);

                if ((name == "TIPOPAQUETE" || name == "TIPO" || name == "PAQUETE" || name == "TIPODEEMPAQUE") && !columns.ContainsKey("TIPOEMPAQUE"))
                    columns.Add("TIPOEMPAQUE", column);
                if ((name == "TIPOEMPAQUE" || name == "TIPODEEMPAQUE") && !columns.ContainsKey("TIPOPAQUETE"))
                    columns.Add("TIPOPAQUETE", column);

                if ((name == "PESO" || name == "PESOKGS" || name == "PESOFISICO" || name == "PESOFISICOKG") && !columns.ContainsKey("PESOKG"))
                    columns.Add("PESOKG", column);
                if ((name == "PESOKG" || name == "PESOKGS" || name == "PESOFISICOKG") && !columns.ContainsKey("PESO"))
                    columns.Add("PESO", column);

                if ((name == "ESTADO" || name == "ESTADODEENTREGA" || name == "ESTADOENTREGA" || name == "ESTADOTIB" || name == "ESTADODETIB") && !columns.ContainsKey("ESTADOENTREGA"))
                    columns.Add("ESTADOENTREGA", column);
                if ((name == "ESTADOENTREGA" || name == "ESTADODEENTREGA" || name == "ESTADO" || name == "ESTADOTIB" || name == "ESTADODETIB") && !columns.ContainsKey("ESTADO"))
                    columns.Add("ESTADO", column);
            }
        }
        return required.All(columns.ContainsKey) ? new HeaderInfo(RowNumber(row), columns) : null;
    }

    private static Dictionary<int, CellData> ReadRowValues(XElement row, List<string> sharedStrings, IEnumerable<int>? selectedColumns = null)
    {
        var values = new Dictionary<int, CellData>();
        HashSet<int>? selected = selectedColumns?.ToHashSet();
        foreach (XElement cell in row.Elements(MainNs + "c"))
        {
            string reference = (string?)cell.Attribute("r") ?? string.Empty;
            int column = ColumnNumber(reference);
            if (column == 0 || (selected is not null && !selected.Contains(column)))
                continue;
            CellData? value = ReadCell(cell, sharedStrings);
            if (value is not null)
                values[column] = value;
        }
        return values;
    }

    private static CellData? ReadCell(XElement cell, List<string> sharedStrings)
    {
        if (cell.Element(MainNs + "f") is not null)
            throw new InvalidDataException("Hay una fórmula en una columna TIB requerida. Exporta ese reporte con valores calculados y vuelve a intentarlo.");

        string type = (string?)cell.Attribute("t") ?? string.Empty;
        if (type == "inlineStr")
            return new CellData(string.Concat(cell.Descendants(MainNs + "t").Select(node => node.Value)), CellKind.Text);

        string? raw = cell.Element(MainNs + "v")?.Value;
        if (raw is null)
            return null;

        if (type == "s")
        {
            if (!int.TryParse(raw, NumberStyles.None, CultureInfo.InvariantCulture, out int index) || index < 0 || index >= sharedStrings.Count)
                throw new InvalidDataException("Invalid shared-string index in workbook.");
            return new CellData(sharedStrings[index], CellKind.Text);
        }
        if (type == "str") return new CellData(raw, CellKind.Text);
        if (type == "b") return new CellData(raw, CellKind.Boolean);
        if (type == "e") return new CellData(raw, CellKind.Error);
        return new CellData(raw, CellKind.Number);
    }

    private static CellData? GetValue(Dictionary<int, CellData> values, int column) =>
        values.TryGetValue(column, out CellData? value) ? value : null;

    private static string? GetKey(Dictionary<int, CellData> values, int column)
    {
        CellData? value = GetValue(values, column);
        if (value is null || string.IsNullOrWhiteSpace(value.Text))
            return null;

        string key = value.Kind == CellKind.Number && double.TryParse(value.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out double numeric)
            ? numeric.ToString("G", CultureInfo.CurrentCulture)
            : value.Text;
        key = key.Trim().ToUpperInvariant();
        return key.Length == 0 ? null : key;
    }

    private static double DateRank(CellData value)
    {
        if (value.Kind == CellKind.Number && double.TryParse(value.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out double serial))
            return serial;
        if (DateTime.TryParse(value.Text, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime date))
            return date.ToOADate();
        return 0d;
    }

    private static string NormalizeHeader(string value)
    {
        string decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (char character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                continue;
            char upper = char.ToUpperInvariant(character);
            if ((upper >= 'A' && upper <= 'Z') || (upper >= '0' && upper <= '9'))
                builder.Append(upper);
        }
        return builder.ToString();
    }

    private static int RowNumber(XElement row)
    {
        string? rowText = (string?)row.Attribute("r");
        return int.TryParse(rowText, NumberStyles.None, CultureInfo.InvariantCulture, out int number) ? number : 0;
    }

    private static int ColumnNumber(string cellReference)
    {
        int value = 0;
        foreach (char character in cellReference)
        {
            if (character < 'A' || character > 'Z')
                break;
            value = checked(value * 26 + character - 'A' + 1);
        }
        return value;
    }

    private static string ColumnName(int column)
    {
        var name = new StringBuilder();
        while (column > 0)
        {
            column--;
            name.Insert(0, (char)('A' + column % 26));
            column /= 26;
        }
        return name.ToString();
    }

    private sealed record PatchCounts(long Total, long Matched, long Unmatched, IReadOnlyList<UnmatchedRecord> UnmatchedSample);

    private static PatchCounts PatchInventory(
        string outputPath,
        string worksheetEntryName,
        HeaderInfo headers,
        List<string> sharedStrings,
        Dictionary<string, SourceRecord> lookup,
        string unmatchedCsvPath,
        Action<long> onRowsProcessed)
    {
        string tempXml = Path.Combine(Path.GetTempPath(), $"openxml-sheet-{Guid.NewGuid():N}.xml");
        long total = 0;
        long matched = 0;
        long unmatched = 0;
        long rowsScanned = 0;
        var unmatchedSample = new List<UnmatchedRecord>(UnmatchedSampleLimit);

        try
        {
            using var unmatchedWriter = new StreamWriter(unmatchedCsvPath, false, new UTF8Encoding(true));
            unmatchedWriter.WriteLine("WR,Fila inventario");
            using (ZipArchive archive = ZipFile.Open(outputPath, ZipArchiveMode.Update))
            {
                ZipArchiveEntry entry = archive.GetEntry(worksheetEntryName)
                    ?? throw new InvalidDataException("Could not locate the inventory worksheet in the xlsx package.");

                using (Stream compressedInput = entry.Open())
                using (FileStream xmlOutput = File.Create(tempXml))
                {
                    TransformWorksheet(compressedInput, xmlOutput, row =>
                    {
                        rowsScanned++;
                        if (rowsScanned % 10_000 == 0)
                            onRowsProcessed(rowsScanned);
                        int rowNumber = RowNumber(row);
                        if (rowNumber <= headers.Row)
                            return;

                        Dictionary<int, CellData> values = ReadRowValues(row, sharedStrings, [headers.Columns["GUIAWR"]]);
                        string? key = GetKey(values, headers.Columns["GUIAWR"]);
                        if (key is null)
                            return;

                        total++;
                        if (!lookup.TryGetValue(key, out SourceRecord? record))
                        {
                            unmatched++;
                            string wr = GetValue(values, headers.Columns["GUIAWR"])?.Text.Trim() ?? string.Empty;
                            if (unmatchedSample.Count < UnmatchedSampleLimit)
                                unmatchedSample.Add(new UnmatchedRecord(wr, rowNumber));
                            unmatchedWriter.Write(CsvField(wr));
                            unmatchedWriter.Write(',');
                            unmatchedWriter.WriteLine(rowNumber.ToString(CultureInfo.InvariantCulture));
                            return;
                        }

                        SetCell(row, headers.Columns["CONSIGNATARIO"], record.Client);
                        SetCell(row, headers.Columns["TRACKING"], NormalizeTracking(record.Tracking));
                        SetCell(row, headers.Columns["TIPOEMPAQUE"], record.Package);
                        SetCell(row, headers.Columns["PESOKG"], NormalizeWeight(record.Weight));
                        SetCell(row, headers.Columns["ESTADOENTREGA"], record.Status);
                        matched++;
                    });
                }

                entry.Delete();
                ZipArchiveEntry replacement = archive.CreateEntry(worksheetEntryName, CompressionLevel.Optimal);
                using (Stream replacementStream = replacement.Open())
                using (FileStream xmlInput = File.OpenRead(tempXml))
                    xmlInput.CopyTo(replacementStream);
            }
        }
        finally
        {
            if (File.Exists(tempXml))
                File.Delete(tempXml);
        }

        return new PatchCounts(total, matched, unmatched, unmatchedSample);
    }

    private static void TransformWorksheet(Stream input, Stream output, Action<XElement> transformRow)
    {
        using XmlReader reader = XmlReader.Create(input, SecureXmlSettings);
        var writerSettings = new XmlWriterSettings
        {
            Encoding = new UTF8Encoding(false),
            OmitXmlDeclaration = true,
            Indent = false,
            CloseOutput = false,
            NewLineHandling = NewLineHandling.None,
        };
        using XmlWriter writer = XmlWriter.Create(output, writerSettings);
        while (reader.Read())
        {
            if (reader.NodeType == XmlNodeType.XmlDeclaration)
                continue;
            CopyXmlNode(reader, writer, transformRow);
        }
        writer.Flush();
    }

    private static void CopyXmlNode(XmlReader reader, XmlWriter writer, Action<XElement> transformRow)
    {
        switch (reader.NodeType)
        {
            case XmlNodeType.Element:
            {
                if (reader.LocalName == "row" && reader.NamespaceURI == MainNs.NamespaceName)
                {
                    using XmlReader subtree = reader.ReadSubtree();
                    XElement row = XElement.Load(subtree, LoadOptions.None);
                    transformRow(row);
                    row.WriteTo(writer);
                    return;
                }

                int depth = reader.Depth;
                bool empty = reader.IsEmptyElement;
                writer.WriteStartElement(reader.Prefix, reader.LocalName, reader.NamespaceURI);
                if (reader.HasAttributes)
                {
                    while (reader.MoveToNextAttribute())
                        writer.WriteAttributeString(reader.Prefix, reader.LocalName, reader.NamespaceURI, reader.Value);
                    reader.MoveToElement();
                }
                if (empty)
                {
                    writer.WriteEndElement();
                    return;
                }
                while (reader.Read())
                {
                    if (reader.NodeType == XmlNodeType.EndElement && reader.Depth == depth)
                    {
                        writer.WriteFullEndElement();
                        return;
                    }
                    CopyXmlNode(reader, writer, transformRow);
                }
                throw new XmlException("Unexpected end of worksheet XML.");
            }
            case XmlNodeType.Text: writer.WriteString(reader.Value); break;
            case XmlNodeType.CDATA: writer.WriteCData(reader.Value); break;
            case XmlNodeType.Whitespace:
            case XmlNodeType.SignificantWhitespace: writer.WriteWhitespace(reader.Value); break;
            case XmlNodeType.Comment: writer.WriteComment(reader.Value); break;
            case XmlNodeType.ProcessingInstruction: writer.WriteProcessingInstruction(reader.Name, reader.Value); break;
            case XmlNodeType.DocumentType: throw new XmlException("Document type declarations are not allowed in xlsx worksheets.");
        }
    }

    private static void SetCell(XElement row, int column, CellData? value)
    {
        string reference = ColumnName(column) + RowNumber(row).ToString(CultureInfo.InvariantCulture);
        XElement? cell = row.Elements(MainNs + "c").FirstOrDefault(candidate => (string?)candidate.Attribute("r") == reference);
        if (cell is null)
        {
            cell = new XElement(MainNs + "c", new XAttribute("r", reference));
            XElement? nextCell = row.Elements(MainNs + "c")
                .FirstOrDefault(candidate => ColumnNumber((string?)candidate.Attribute("r") ?? string.Empty) > column);
            if (nextCell is null)
                row.Add(cell);
            else
                nextCell.AddBeforeSelf(cell);
        }

        cell.Elements().Remove();
        cell.SetAttributeValue("t", null);
        if (value is null || value.Kind == CellKind.Blank)
            return;

        switch (value.Kind)
        {
            case CellKind.Text:
                cell.SetAttributeValue("t", "inlineStr");
                var text = new XElement(MainNs + "t", value.Text);
                if (value.Text.Length > 0 && (char.IsWhiteSpace(value.Text[0]) || char.IsWhiteSpace(value.Text[^1])))
                    text.SetAttributeValue(XNamespace.Xml + "space", "preserve");
                cell.Add(new XElement(MainNs + "is", text));
                break;
            case CellKind.Number:
                cell.Add(new XElement(MainNs + "v", value.Text));
                break;
            case CellKind.Boolean:
                cell.SetAttributeValue("t", "b");
                cell.Add(new XElement(MainNs + "v", value.Text));
                break;
            case CellKind.Error:
                cell.SetAttributeValue("t", "e");
                cell.Add(new XElement(MainNs + "v", value.Text));
                break;
        }
    }

    private static CellData? NormalizeWeight(CellData? value)
    {
        if (value is null || value.Kind != CellKind.Text)
            return value;

        if (decimal.TryParse(value.Text, NumberStyles.Float, CultureInfo.CurrentCulture, out decimal currentCultureValue)
            || decimal.TryParse(value.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out currentCultureValue))
            return new CellData(currentCultureValue.ToString(CultureInfo.InvariantCulture), CellKind.Number);

        return value;
    }

    private static CellData? NormalizeTracking(CellData? value)
    {
        if (value is null)
            return null;
        if (value.Kind == CellKind.Number)
        {
            if (decimal.TryParse(value.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out decimal decimalValue))
                return new CellData(decimalValue.ToString("G29", CultureInfo.InvariantCulture), CellKind.Text);
            if (double.TryParse(value.Text, NumberStyles.Float, CultureInfo.InvariantCulture, out double doubleValue))
                return new CellData(doubleValue.ToString("G", CultureInfo.InvariantCulture), CellKind.Text);
        }
        return new CellData(value.Text, CellKind.Text);
    }

    private static string CsvField(string value)
    {
        string trimmed = value.TrimStart();
        if (trimmed.Length > 0 && trimmed[0] is '=' or '+' or '-' or '@' or '\t' or '\r')
            value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
    }

    private static void TryDelete(string path)
    {
        try
        {
            if (File.Exists(path))
                File.Delete(path);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
