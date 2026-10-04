# Graph Report - sistema-amex-courier  (2026-10-04)

## Corpus Check
- 311 files · ~296,664 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1492 nodes · 3175 edges · 94 communities (74 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5c684e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- excel-cobros-parser.ts
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- dashboard/types.ts
- app/page.tsx
- Cliente
- worker.js
- getSupabaseAdmin
- components/BoletasShalomTab.tsx
- CobrosDailySheetView.tsx
- components/RotulosA4Tab.tsx
- authorizeUser
- ArmarPlanillaTab.tsx
- test-real-flow.mjs
- components/AdminUsersTab.tsx
- analyzer.ts
- components/ScannerTab.tsx
- package.json
- useInventoryData.ts
- compilerOptions
- ui/index.ts
- dependencies
- Paquete
- SoundSynthesizer
- types/index.ts
- createClient
- devDependencies
- components/InfoAmexTab.tsx
- excelExport.ts
- worker/package.json
- Logger
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
- components/InventarioJobsTab.tsx
- paquetes/route.ts
- TipoEstadoEntrega
- cobros/types.ts
- Program.cs
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
- inventario-tib/route.ts
- components/CobrosTab.tsx
- useDashboardNavigation.ts
- useDashboardData.ts
- ref_node_path
- test-api-scanner-batch.mjs
- test-daily-tib-flow.mjs
- inventoryJobsWorkflow.test.ts
- r2/client.ts
- upload/route.ts
- matchesFuzzySearch
- components/AuditoriaTab.tsx

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 72 edges
2. `Program` - 54 edges
3. `Cliente` - 51 edges
4. `authorizeUser()` - 43 edges
5. `getSupabaseAdmin()` - 34 edges
6. `supabase` - 19 edges
7. `DniSlotData` - 18 edges
8. `SoundSynthesizer` - 16 edges
9. `compilerOptions` - 16 edges
10. `ClienteCobroLote` - 14 edges

## Surprising Connections (you probably didn't know these)
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `ExcelExportDropdownProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/components/ExcelExportDropdown.tsx → types/index.ts
- `EditPackageModalProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/modals/EditPackageModal.tsx → types/index.ts
- `UseLiveSheetsDataProps` --references--> `Paquete`  [EXTRACTED]
  features/live-sheets/hooks/useLiveSheetsData.ts → types/index.ts
- `RotulosA4TabProps` --references--> `Cliente`  [EXTRACTED]
  features/rotulos/components/RotulosA4Tab.tsx → types/index.ts

## Import Cycles
- None detected.

## Communities (94 total, 20 thin omitted)

### Community 0 - "excel-cobros-parser.ts"
Cohesion: 0.12
Nodes (19): CobroDeliveryModal(), CobroDeliveryModalProps, CobrosExcelImporterModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes, ExcelCobrosParser, SheetParseResult, WorkbookParseResult (+11 more)

### Community 1 - "components/DniMatrixTab.tsx"
Cohesion: 0.06
Nodes (54): DniMatrixTab, features_dni_matrix_components_dni_matrix, DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniMatrixTab(), DniSlotEditor(), DniSlotEditorProps (+46 more)

### Community 2 - "Program"
Cohesion: 0.06
Nodes (41): Action, CachedSourceData, CellData, DateTime, Dictionary, HeaderInfo, HttpListenerContext, HttpListenerResponse (+33 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.06
Nodes (59): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, formatOperatorName() (+51 more)

### Community 4 - "dashboard/types.ts"
Cohesion: 0.15
Nodes (25): AnalyticsChartsSection(), AnalyticsChartsSectionProps, DailyTasksSection(), DailyTasksSectionProps, DashboardHeader(), DashboardHeaderProps, DashboardTab(), DashboardTab (+17 more)

### Community 5 - "app/page.tsx"
Cohesion: 0.15
Nodes (17): DashboardPage(), NewClientModal, NewPackageModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPkgFormData (+9 more)

### Community 6 - "Cliente"
Cohesion: 0.08
Nodes (37): NewPackageModalProps, FormatoEntregaTab, InvoicesTab, DniLinkClientModalProps, DniMatrixTabProps, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview() (+29 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (53): ref_node_http, bootWarmUpTibIndices(), candidateEnvPaths, checkProcessorDaemonReady(), cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell() (+45 more)

### Community 8 - "getSupabaseAdmin"
Cohesion: 0.14
Nodes (27): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, FuenteTibOpcion (+19 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.08
Nodes (37): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom (+29 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.14
Nodes (26): CobroPaymentModal(), CobroPaymentModalProps, CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, Clientes360View, DirectorioClientesViewProps (+18 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.15
Nodes (27): RotulosA4Tab, AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosA4TabProps, RotulosSheetPreview(), RotulosSheetPreviewProps (+19 more)

### Community 12 - "authorizeUser"
Cohesion: 0.30
Nodes (9): DELETE(), GET(), PATCH(), GET(), POST(), authorizeUser(), sanitizeFileNamePart(), uploadShalomBoletaFile() (+1 more)

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

### Community 17 - "components/ScannerTab.tsx"
Cohesion: 0.32
Nodes (5): ScannerTab, formatOperatorName(), ScannerTab(), ScannerTabProps, ScannedLog

### Community 18 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 19 - "useInventoryData.ts"
Cohesion: 0.26
Nodes (12): TableSkeleton(), KardexView(), KardexViewProps, ShelfPositionModalProps, inventoryService, BatchShelfData, InventoryStats, SinglePositionData (+4 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.08
Nodes (30): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP, ButtonProps, SIZE_MAP, VARIANT_MAP (+22 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): docx, file-saver, html5-qrcode, jspdf, jszip, next, openai, dependencies (+17 more)

### Community 23 - "Paquete"
Cohesion: 0.13
Nodes (22): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, InventoryTab, GestorAlmacenView(), GestorAlmacenViewProps, InventoryStatsCards(), InventoryStatsCardsProps (+14 more)

### Community 25 - "types/index.ts"
Cohesion: 0.11
Nodes (14): InventoryPagination, UseInventoryQueryOptions, BoletaShalomInput, DestinoRuta, EmbarqueMaster, EstadoDestinoRuta, EstadoHojaRuta, FiltrosBoletaShalom (+6 more)

### Community 26 - "createClient"
Cohesion: 0.06
Nodes (36): POST(), POST(), GET(), getSessionUser(), SessionUser, cache, checkRateLimit(), lastCleanup (+28 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, @tailwindcss/postcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "excelExport.ts"
Cohesion: 0.15
Nodes (20): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryTab(), useInventoryData(), exportClientesToExcel(), exportCobrosToExcel() (+12 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "Logger"
Cohesion: 0.20
Nodes (5): ApiHandler, withErrorHandler(), LogEntry, Logger, LogLevel

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

### Community 39 - "next-env.d.ts"
Cohesion: 0.50
Nodes (3): NOTE: This file should not be edited, next_types_root_params_d, next_types_routes_d

### Community 40 - "vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, version

### Community 44 - "components/InventarioJobsTab.tsx"
Cohesion: 0.16
Nodes (9): InventarioJobsTab, formatBytes(), FuenteKey, FUENTES, InventarioJobsTab(), Job, TibFileInfo, TibState (+1 more)

### Community 45 - "paquetes/route.ts"
Cohesion: 0.18
Nodes (15): GET(), mapPaqueteRow(), POST(), handleBatchSync(), isValidUuid(), POST, scannerLogger, formatZodError() (+7 more)

### Community 46 - "TipoEstadoEntrega"
Cohesion: 0.29
Nodes (8): BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal(), BulkStatusByWrModalProps, EditPackageModal(), EditPackageModalProps, TipoEstadoAmex, TipoEstadoEntrega

### Community 47 - "cobros/types.ts"
Cohesion: 0.22
Nodes (12): CobrosKpiCardsProps, CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, CobrosService, features_cobros_types_cliente, CobrosMetrics (+4 more)

### Community 48 - "Program.cs"
Cohesion: 0.20
Nodes (9): documentformat_openxml_packaging, documentformat_openxml_spreadsheet, system_diagnostics, system_globalization, system_io_compression, system_text, system_text_json, system_xml (+1 more)

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
Nodes (21): mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, getFileFromR2(), ref_node_crypto, __dirname (+13 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 57 - "cleanup-test-data.mjs"
Cohesion: 0.22
Nodes (7): ref_node_url, __dirname, envPath, envVars, __filename, s3, supabase

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
Cohesion: 0.12
Nodes (18): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+10 more)

### Community 82 - "inventario-tib/route.ts"
Cohesion: 0.24
Nodes (10): GET(), getLimaDateString(), POST(), TibTipo, deleteFileFromR2(), uploadFileToR2(), __dirname, envPath (+2 more)

### Community 83 - "components/CobrosTab.tsx"
Cohesion: 0.15
Nodes (11): CobrosDailySheetView(), CobrosExcelImporterModal(), CobrosTab(), DirectorioClientesTab(), DirectorioClientesTabProps, DirectorioClientesView(), useCobrosOperaciones(), VoucherViewerModal() (+3 more)

### Community 84 - "useDashboardNavigation.ts"
Cohesion: 0.36
Nodes (8): isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS, migrateLegacyHash(), PATH_TO_TAB, pathToTab(), TAB_TO_PATH, tabToPath()

### Community 86 - "useDashboardData.ts"
Cohesion: 0.46
Nodes (7): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData(), TipoEstadoTib, TipoMetodoEntrega

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
Cohesion: 0.14
Nodes (24): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+16 more)

### Community 93 - "upload/route.ts"
Cohesion: 0.73
Nodes (8): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName()

### Community 94 - "matchesFuzzySearch"
Cohesion: 0.50
Nodes (7): useCobrosData(), useVoucherForm(), cleanAlphanumeric(), extractDigits(), matchesFuzzySearch(), normalizeText(), stripLeadingZeros()

## Knowledge Gaps
- **400 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+395 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `app/page.tsx`, `Cliente`, `paquetes/route.ts`, `TipoEstadoEntrega`, `cobros/types.ts`, `DashboardTabContent.tsx`, `components/ScannerTab.tsx`, `components/CobrosTab.tsx`, `useInventoryData.ts`, `useDashboardData.ts`, `types/index.ts`, `excelExport.ts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `app/page.tsx`, `CobrosDailySheetView.tsx`, `components/RotulosA4Tab.tsx`, `cobros/types.ts`, `DashboardTabContent.tsx`, `components/ScannerTab.tsx`, `components/CobrosTab.tsx`, `useInventoryData.ts`, `useDashboardData.ts`, `Paquete`, `types/index.ts`, `excelExport.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `authorizeUser()` connect `authorizeUser` to `getSupabaseAdmin`, `paquetes/route.ts`, `analyzer.ts`, `inventario-tib/route.ts`, `r2/client.ts`, `upload/route.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _400 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `excel-cobros-parser.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06293285155073773 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.061828952239911146 - nodes in this community are weakly interconnected._