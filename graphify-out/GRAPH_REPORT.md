# Graph Report - sistema-amex-courier  (2026-10-05)

## Corpus Check
- 350 files · ~424,352 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1644 nodes · 3533 edges · 110 communities (87 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4c3076ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/InvoicesTab.tsx
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- main.py
- supabase/client.ts
- components/FormatoEntregaTab.tsx
- worker.js
- getSupabaseAdmin
- components/BoletasShalomTab.tsx
- CobrosDailySheetView.tsx
- components/RotulosA4Tab.tsx
- test-cruce-produccion.mjs
- ArmarPlanillaTab.tsx
- test-real-flow.mjs
- components/AdminUsersTab.tsx
- analyzer.ts
- excelExport.ts
- package.json
- dashboard/types.ts
- compilerOptions
- ui/index.ts
- dependencies
- useCobrosOperaciones.ts
- SoundSynthesizer
- types/index.ts
- validations.test.ts
- devDependencies
- components/InfoAmexTab.tsx
- useInventoryData.ts
- worker/package.json
- app/page.tsx
- What You Must Do When Invoked
- supabase.ts
- layout.tsx
- scripts
- gen-certs.mjs
- whatsappGenerator.ts
- AmexInventoryProcessor.csproj
- next-env.d.ts
- vercel.json
- postcss.config.mjs
- useDashboardData.ts
- batch-sync/route.ts
- Cliente
- cobros/types.ts
- components/ScannerTab.tsx
- ref_node_fs
- test-scanner-performance.mjs
- test-vps-300-filas.mjs
- benchmark-comparativo-completo.mjs
- Find Skills
- proxy.ts
- @aws-sdk/s3-request-presigner
- cleanup-test-data.mjs
- graphify reference: extra exports and benchmark
- eslint.config.mjs
- FUENTE_VACIA_10bb5c65.md
- lucide-react
- graphify reference: query, path, explain
- next.config.ts
- ✈️ SISTEMA AMEX COURIER - Plataforma Logística Integrada v2.0
- Procesador AMEX con Open XML
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- AGENTS.md
- rules/graphify.md
- extraction-spec.md
- workflows/graphify.md
- react-dom
- @supabase/supabase-js
- zod
- tailwindcss
- @types/node
- DashboardTabContent.tsx
- Paquete
- excel-cobros-parser.ts
- createClient
- components/CobrosTab.tsx
- authorizeUser
- ref_node_path
- test-api-scanner-batch.mjs
- test-daily-tib-flow.mjs
- inventoryJobsWorkflow.test.ts
- r2/client.ts
- Logger
- useDashboardNavigation.ts
- registry.ts
- CobroDeliveryModal.tsx
- next_types_root_params_d
- components/AuditoriaTab.tsx
- TipoEstadoEntrega
- ManifiestosTibTab.tsx
- next_types_routes_d
- Despliegue en VPS (Hostinger / Ubuntu)
- extract_table_rows
- paquetes/route.ts
- cruzar-planilla/route.ts
- upload/route.ts
- EstanteriaPosicion
- paquetes.schema.ts
- uploadFileToR2
- ExcelExportDropdown.tsx

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 81 edges
2. `Program` - 54 edges
3. `Cliente` - 53 edges
4. `authorizeUser()` - 50 edges
5. `getSupabaseAdmin()` - 41 edges
6. `supabase` - 22 edges
7. `DniSlotData` - 18 edges
8. `SoundSynthesizer` - 16 edges
9. `compilerOptions` - 16 edges
10. `RotuloSlotData` - 15 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `authorizeUser()`  [EXTRACTED]
  app/api/shalom-boletas/route.ts → lib/auth/guards.ts
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `ExcelExportDropdownProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/components/ExcelExportDropdown.tsx → types/index.ts
- `UseInventoryDataProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/hooks/useInventoryData.ts → types/index.ts
- `InvoicesTabProps` --references--> `Cliente`  [EXTRACTED]
  features/invoices/components/InvoicesTab.tsx → types/index.ts

## Import Cycles
- None detected.

## Communities (110 total, 23 thin omitted)

### Community 0 - "components/InvoicesTab.tsx"
Cohesion: 0.19
Nodes (15): InvoicesTab, InvoiceControlPanel(), InvoiceControlPanelProps, InvoiceDocumentPreview(), InvoiceDocumentPreviewProps, features_invoices_components_invoices, InvoicesTab(), InvoicesTabProps (+7 more)

### Community 1 - "components/DniMatrixTab.tsx"
Cohesion: 0.06
Nodes (55): features_dni_matrix_components_dni_matrix, DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniMatrixTab(), DniSlotEditor(), DniSlotEditorProps, DniSlotsGrid() (+47 more)

### Community 2 - "Program"
Cohesion: 0.05
Nodes (50): Action, CachedSourceData, CellData, DateTime, Dictionary, documentformat_openxml_packaging, documentformat_openxml_spreadsheet, HeaderInfo (+42 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.07
Nodes (53): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, LiveSheetsTab (+45 more)

### Community 4 - "main.py"
Cohesion: 0.09
Nodes (28): get, health_check(), process_manifest(), Procesa un PDF multipágina o imagen de manifiesto físico de TIB Courier: 1.…, detect_modalidad_omr(), ndarray, Detecta cuál casilla de verificación está marcada en el encabezado (DOMICILIO,…, clean_ocr_digits() (+20 more)

### Community 5 - "supabase/client.ts"
Cohesion: 0.07
Nodes (41): DespachoRutasTab, InventarioJobsTab, ChoferCardParada(), ChoferCardParadaProps, DespachoRutasTab(), formatFechaCreacion(), RutaBuilderModal(), RutaBuilderModalProps (+33 more)

### Community 6 - "components/FormatoEntregaTab.tsx"
Cohesion: 0.17
Nodes (18): FormatoEntregaTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab(), FormatoEntregaTabProps (+10 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (53): ref_node_http, bootWarmUpTibIndices(), candidateEnvPaths, checkProcessorDaemonReady(), cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell() (+45 more)

### Community 8 - "getSupabaseAdmin"
Cohesion: 0.16
Nodes (24): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, FuenteTibOpcion (+16 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.12
Nodes (28): ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom, BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid() (+20 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.13
Nodes (22): CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, DirectorioClientesTabProps, Clientes360View, DirectorioClientesView(), DirectorioClientesViewProps (+14 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.14
Nodes (31): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosHistoryModal(), RotulosHistoryModalProps, RotulosSheetDropdown(), RotulosSheetDropdownProps (+23 more)

### Community 12 - "test-cruce-produccion.mjs"
Cohesion: 0.24
Nodes (8): DbInventoryOptions, GeneratedInventory, generateInventoryExcelBufferFromDb(), mapEstadoLabel(), admin, bufferComp, jobId, t0

### Community 13 - "ArmarPlanillaTab.tsx"
Cohesion: 0.16
Nodes (17): FilaResultadoCobro, ArmarPlanillaTab(), ArmarPlanillaTabProps, Fase, FiltroEstado, FuenteTibOpcion, aNumero(), aTexto() (+9 more)

### Community 14 - "test-real-flow.mjs"
Cohesion: 0.11
Nodes (17): batchId, envContent, filesToUpload, keys, r2AccessKey, r2AccountId, r2Root, r2SecretKey (+9 more)

### Community 15 - "components/AdminUsersTab.tsx"
Cohesion: 0.11
Nodes (17): AdminUsersTab(), AVATAR_GRADS, avatarGrad(), avatarInitials(), btnBlue, btnGreen, card, fmtDate() (+9 more)

### Community 16 - "analyzer.ts"
Cohesion: 0.15
Nodes (22): POST(), POST(), POST(), POST(), analyzeInvoiceDocument(), analyzeShalomBoletaPdf(), DEFAULT_OPENAI_MODEL, DNI_JSON_SCHEMA (+14 more)

### Community 17 - "excelExport.ts"
Cohesion: 0.25
Nodes (13): exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel(), exportLiquidacionesToExcel(), exportPaquetesToExcel(), exportPickingOrderToExcel(), exportScannerLogsToExcel() (+5 more)

### Community 18 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 19 - "dashboard/types.ts"
Cohesion: 0.15
Nodes (25): AnalyticsChartsSection(), AnalyticsChartsSectionProps, DailyTasksSection(), DailyTasksSectionProps, DashboardHeader(), DashboardHeaderProps, DashboardTab(), DashboardTab (+17 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.08
Nodes (30): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP, ButtonProps, SIZE_MAP, VARIANT_MAP (+22 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): docx, file-saver, html5-qrcode, jspdf, jszip, next, openai, dependencies (+17 more)

### Community 23 - "useCobrosOperaciones.ts"
Cohesion: 0.21
Nodes (11): CobroPaymentModal(), CobroPaymentModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes, features_cobros_types_clientecobrolote, MetodoPagoCobro, VoucherCobroItem, features_cobros_types_filtroscobroslote (+3 more)

### Community 25 - "types/index.ts"
Cohesion: 0.10
Nodes (16): InventoryPagination, UseInventoryQueryOptions, parseLocation(), validateAndSimulateRelocation(), BoletaShalomInput, DestinoRuta, EmbarqueMaster, EstadoDestinoRuta (+8 more)

### Community 26 - "validations.test.ts"
Cohesion: 0.14
Nodes (13): LoginInput, LoginSchema, UserUpdateInput, UserUpdateSchema, CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema (+5 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, @tailwindcss/postcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "useInventoryData.ts"
Cohesion: 0.19
Nodes (17): InventoryTab(), KardexView(), KardexViewProps, useInventoryData(), UseInventoryDataProps, ShelfPositionModalProps, TransferModal(), TransferModalProps (+9 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.18
Nodes (15): DashboardPage(), NewClientModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPkgFormData, DashboardTabContent() (+7 more)

### Community 32 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 33 - "supabase.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 34 - "layout.tsx"
Cohesion: 0.29
Nodes (5): app_globals, metadata, viewport, SmoothScrollProvider(), SmoothScrollProviderProps

### Community 35 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:https, lint, local, start, test (+2 more)

### Community 36 - "gen-certs.mjs"
Cohesion: 0.29
Nodes (5): ref_fs, ref_path, certDir, certPath, keyPath

### Community 37 - "whatsappGenerator.ts"
Cohesion: 0.50
Nodes (3): generateDriverWhatsAppUrl(), sanitizePeruvianPhoneNumber(), WhatsAppMessageParams

### Community 38 - "AmexInventoryProcessor.csproj"
Cohesion: 0.50
Nodes (3): net8.0, DocumentFormat.OpenXml (3.3.0), Microsoft.NET.Sdk

### Community 40 - "vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, version

### Community 44 - "useDashboardData.ts"
Cohesion: 0.57
Nodes (6): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData(), TipoMetodoEntrega

### Community 45 - "batch-sync/route.ts"
Cohesion: 0.15
Nodes (16): handleBatchSync(), isValidUuid(), POST, scannerLogger, getAuthenticatedUser(), cache, checkRateLimit(), lastCleanup (+8 more)

### Community 46 - "Cliente"
Cohesion: 0.17
Nodes (15): NewPackageModal, NewPackageModalProps, MobileScannerModalProps, RotulosA4TabProps, ScannerTabProps, Cliente, BaseScanExtra, DeliveryScanExtra (+7 more)

### Community 47 - "cobros/types.ts"
Cohesion: 0.24
Nodes (11): CobrosKpiCardsProps, CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, CobrosService, CobrosMetrics, CobrosSubtab (+3 more)

### Community 48 - "components/ScannerTab.tsx"
Cohesion: 0.26
Nodes (10): useCobrosData(), useVoucherForm(), ScannerTab, formatOperatorName(), ScannerTab(), cleanAlphanumeric(), extractDigits(), matchesFuzzySearch() (+2 more)

### Community 49 - "ref_node_fs"
Cohesion: 0.33
Nodes (5): ref_node_fs, localQueue, resilientDB, resilientQueue, uploadedToDB

### Community 51 - "test-scanner-performance.mjs"
Cohesion: 0.32
Nodes (6): envContent, run(), supabase, testBatch, testCurrentSequentialMethod(), testOptimizedBatchMethod()

### Community 52 - "test-vps-300-filas.mjs"
Cohesion: 0.29
Nodes (6): buf, data, filas, instructivoPath, t0, wb

### Community 53 - "benchmark-comparativo-completo.mjs"
Cohesion: 0.12
Nodes (22): mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2(), ref_node_crypto (+14 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 57 - "cleanup-test-data.mjs"
Cohesion: 0.20
Nodes (8): ref_node_url, __dirname, envPath, envVars, __filename, isProdSupabase, s3, supabase

### Community 58 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 62 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 64 - "✈️ SISTEMA AMEX COURIER - Plataforma Logística Integrada v2.0"
Cohesion: 0.33
Nodes (5): ⚡ Comandos Rápidos, 🗄️ Esquema de Base de Datos en Supabase PostgreSQL (12 Tablas Activas), 🏛️ Estructura del Proyecto, ✈️ SISTEMA AMEX COURIER - Plataforma Logística Integrada v2.0, 🔐 Variables de entorno

### Community 65 - "Procesador AMEX con Open XML"
Cohesion: 0.33
Nodes (5): Compilar/publicar para Windows x64, Contrato del procesador, Límites y validaciones, Procesador AMEX con Open XML, Regla de datos

### Community 66 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 67 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 68 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 81 - "DashboardTabContent.tsx"
Cohesion: 0.10
Nodes (21): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+13 more)

### Community 82 - "Paquete"
Cohesion: 0.13
Nodes (19): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, InventoryStatsCards(), InventoryStatsCardsProps, InventoryTabProps, InventoryTable(), InventoryTableProps (+11 more)

### Community 83 - "excel-cobros-parser.ts"
Cohesion: 0.18
Nodes (13): CobrosExcelImporterModal(), CobrosExcelImporterModalProps, ExcelCobrosParser, SheetParseResult, WorkbookParseResult, ClienteCobroLote, EstadoEntregaWR, EstadoPagoWR (+5 more)

### Community 84 - "createClient"
Cohesion: 0.39
Nodes (5): POST(), GET(), getSessionUser(), SessionUser, createClient()

### Community 85 - "components/CobrosTab.tsx"
Cohesion: 0.13
Nodes (15): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, CobrosDailySheetView(), CobrosList() (+7 more)

### Community 86 - "authorizeUser"
Cohesion: 0.20
Nodes (13): GET(), getLimaDateString(), POST(), TibTipo, detectAndDeskew(), maxDuration, POST(), GET() (+5 more)

### Community 87 - "ref_node_path"
Cohesion: 0.29
Nodes (4): ref_node_path, invHeaders, invRows, outDir

### Community 88 - "test-api-scanner-batch.mjs"
Cohesion: 0.33
Nodes (3): adminSupabase, envContent, serviceKey

### Community 89 - "test-daily-tib-flow.mjs"
Cohesion: 0.33
Nodes (4): envContent, supabase, supabaseKey, supabaseUrl

### Community 90 - "inventoryJobsWorkflow.test.ts"
Cohesion: 0.40
Nodes (3): ref_node_child_process, ref_node_os, tmpDir

### Community 91 - "r2/client.ts"
Cohesion: 0.26
Nodes (12): dynamic, GET(), POST(), SLOTS, dynamic, GET(), getEnv(), getR2Client() (+4 more)

### Community 92 - "Logger"
Cohesion: 0.20
Nodes (5): ApiHandler, withErrorHandler(), LogEntry, Logger, LogLevel

### Community 93 - "useDashboardNavigation.ts"
Cohesion: 0.36
Nodes (8): isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS, migrateLegacyHash(), PATH_TO_TAB, pathToTab(), TAB_TO_PATH, tabToPath()

### Community 94 - "registry.ts"
Cohesion: 0.19
Nodes (16): Sidebar(), SidebarProps, OperatorHubTab, OperatorHubTab(), OperatorHubTabProps, getAvailableModulesForUser(), getFirstAvailableTab(), getModuleByTabId() (+8 more)

### Community 95 - "CobroDeliveryModal.tsx"
Cohesion: 0.40
Nodes (4): CobroDeliveryModal(), CobroDeliveryModalProps, TipoRetirante, features_cobros_types_tiporetirante

### Community 98 - "TipoEstadoEntrega"
Cohesion: 0.43
Nodes (6): BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal(), BulkStatusByWrModalProps, TipoEstadoAmex, TipoEstadoEntrega

### Community 99 - "ManifiestosTibTab.tsx"
Cohesion: 0.33
Nodes (4): ManifiestosTibTab, HeaderData, ManifestRow, ReconciliationData

### Community 101 - "Despliegue en VPS (Hostinger / Ubuntu)"
Cohesion: 0.33
Nodes (5): Despliegue en VPS (Hostinger / Ubuntu), Endpoints, Motor Python de Digitalización de Manifiestos TIB Courier, Opción 1: Con Docker (Recomendado), Opción 2: Con Python venv directo

### Community 102 - "extract_table_rows"
Cohesion: 0.50
Nodes (3): extract_table_rows(), ndarray, Detecta la tabla principal en la página utilizando operaciones morfológicas y…

### Community 103 - "paquetes/route.ts"
Cohesion: 0.28
Nodes (10): POST(), GET(), mapPaqueteRow(), POST(), formatZodError(), validateBody(), validateQuery(), CreatePaqueteSchema (+2 more)

### Community 104 - "cruzar-planilla/route.ts"
Cohesion: 0.27
Nodes (12): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+4 more)

### Community 105 - "upload/route.ts"
Cohesion: 0.73
Nodes (8): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName()

### Community 106 - "EstanteriaPosicion"
Cohesion: 0.27
Nodes (6): GestorAlmacenView(), GestorAlmacenViewProps, ShelfMatrixGridProps, EditPositionModal(), EditPositionModalProps, EstanteriaPosicion

### Community 107 - "paquetes.schema.ts"
Cohesion: 0.22
Nodes (8): AssignShelfSchema, CreatePaqueteInput, EstadoEntregaSchema, EstadoTibSchema, QueryPaquetesInput, UbicacionSchema, UpdatePaqueteInput, UpdatePaqueteSchema

### Community 108 - "uploadFileToR2"
Cohesion: 0.43
Nodes (6): GET(), POST(), uploadFileToR2(), sanitizeFileNamePart(), uploadShalomBoletaFile(), uploadShalomBoletaPdf()

### Community 109 - "ExcelExportDropdown.tsx"
Cohesion: 0.32
Nodes (6): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryToolbar(), InventoryToolbarProps

## Knowledge Gaps
- **421 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+416 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `components/FormatoEntregaTab.tsx`, `CobrosDailySheetView.tsx`, `excelExport.ts`, `dashboard/types.ts`, `types/index.ts`, `useInventoryData.ts`, `app/page.tsx`, `useDashboardData.ts`, `Cliente`, `cobros/types.ts`, `components/ScannerTab.tsx`, `DashboardTabContent.tsx`, `components/CobrosTab.tsx`, `registry.ts`, `TipoEstadoEntrega`, `paquetes/route.ts`, `EstanteriaPosicion`, `ExcelExportDropdown.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/InvoicesTab.tsx`, `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `components/FormatoEntregaTab.tsx`, `CobrosDailySheetView.tsx`, `components/RotulosA4Tab.tsx`, `useDashboardData.ts`, `cobros/types.ts`, `components/ScannerTab.tsx`, `DashboardTabContent.tsx`, `Paquete`, `dashboard/types.ts`, `excelExport.ts`, `components/CobrosTab.tsx`, `types/index.ts`, `useInventoryData.ts`, `app/page.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `authorizeUser()` connect `authorizeUser` to `paquetes/route.ts`, `getSupabaseAdmin`, `cruzar-planilla/route.ts`, `upload/route.ts`, `uploadFileToR2`, `batch-sync/route.ts`, `analyzer.ts`, `r2/client.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _421 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06229797237731413 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.050774526678141134 - nodes in this community are weakly interconnected._
- **Should `components/LiveSheetsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07219548315438726 - nodes in this community are weakly interconnected._