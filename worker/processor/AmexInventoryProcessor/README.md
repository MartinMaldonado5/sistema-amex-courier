# Procesador AMEX con Open XML

Procesador C# usado por `server.js`. Lee cada hoja TIB por filas usando Open XML, crea un índice por WR y parchea una copia de la primera hoja del inventario. No abre Microsoft Excel ni carga todos los renglones de una hoja en memoria.

## Regla de datos

- `Tracking` se guarda siempre como texto. Los tracking numéricos se convierten a texto; los que ya son texto conservan ceros iniciales y caracteres exactamente.
- `Peso` se guarda como número cuando el valor de origen es numérico o puede interpretarse como número con la configuración regional actual.
- Los TIB deben contener valores, no fórmulas, en las columnas necesarias. Si encuentra una fórmula en esos campos, el proceso falla con un mensaje explícito en lugar de usar un valor calculado potencialmente desactualizado.

## Contrato del procesador

El ejecutable recibe seis argumentos: inventario, TIB entregado, TIB enviado, TIB recibido, ruta del inventario generado y ruta del CSV de guías sin coincidencia. Emite un único objeto JSON final por `stdout`. Durante el proceso envía eventos de etapa a `stderr` con el prefijo `PROGRESS:` e informa el avance cada 10.000 filas, sin volver a leer las hojas. Los errores van por `stderr` como JSON.

El JSON contiene conteos, las primeras 500 guías sin coincidencia, hasta 200 WR duplicados, hojas y encabezados reconocidos, tiempo por etapa, CPU y pico de memoria RAM. El CSV contiene la lista completa de guías que no coincidieron.

## Compilar/publicar para Windows x64

Requiere el SDK .NET 10 y acceso a NuGet para restaurar `DocumentFormat.OpenXml`.

```powershell
dotnet publish processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj `
  -c Release -r win-x64 --self-contained true `
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
  -o processor/AmexInventoryProcessor/publish/win-x64
```

La publicación es autónoma: el usuario final no necesita instalar .NET. `server.js` invoca `AmexInventoryProcessor.exe` con rutas de archivo, sin pasar por una terminal ni por PowerShell.

## Límites y validaciones

- Máximo de 20.000 componentes y 1 GiB de contenido descomprimido por libro `.xlsx`.
- Se busca la primera hoja de cada libro y los encabezados en sus primeras 25 filas.
- El original del inventario se copia antes de modificarlo.
- El servidor conserva cada ejecución durante 30 días, configurable con `RUN_RETENTION_DAYS`.
