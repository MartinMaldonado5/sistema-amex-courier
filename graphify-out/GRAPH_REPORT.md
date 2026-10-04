# Graph Report - sistema-amex-courier  (2026-10-03)

## Corpus Check
- 304 files · ~291,567 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1464 nodes · 3098 edges · 99 communities (79 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4517ae3a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useCobrosOperaciones.ts
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
- createClient
- ArmarPlanillaTab.tsx
- test-real-flow.mjs
- components/AdminUsersTab.tsx
- analyzer.ts
- components/ScannerTab.tsx
- package.json
- Paquete
- compilerOptions
- ui/index.ts
- dependencies
- useInventoryData.ts
- SoundSynthesizer
- types/index.ts
- paquetes.schema.ts
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
- batch-sync/route.ts
- cruzar-planilla/route.ts
- cobros/types.ts
- TipoEstadoEntrega
- ref_node_fs
- components/CobrosTab.tsx
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
- authorizeUser
- getR2ViewUrl
- useDashboardNavigation.ts
- login/route.ts
- useDashboardData.ts
- ref_node_path
- test-api-scanner-batch.mjs
- test-daily-tib-flow.mjs
- inventoryJobsWorkflow.test.ts
- r2/client.ts
- inventario-jobs/route.ts
- upload/route.ts
- matchesFuzzySearch
- uploadFileToR2
- ExcelExportDropdown.tsx
- components/AuditoriaTab.tsx
- CobroDeliveryModal.tsx

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 72 edges
2. `Cliente` - 51 edges
3. `Program` - 44 edges
4. `authorizeUser()` - 41 edges
5. `getSupabaseAdmin()` - 33 edges
6. `supabase` - 19 edges
7. `DniSlotData` - 18 edges
8. `SoundSynthesizer` - 16 edges
9. `compilerOptions` - 16 edges
10. `ClienteCobroLote` - 14 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `authorizeUser()`  [EXTRACTED]
  app/api/shalom-boletas/route.ts → lib/auth/guards.ts
- `NewPackageModalProps` --references--> `Cliente`  [EXTRACTED]
  components/modals/NewPackageModal.tsx → types/index.ts
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `ExcelExportDropdownProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/components/ExcelExportDropdown.tsx → types/index.ts
- `POST()` --calls--> `authorizeUser()`  [EXTRACTED]
  app/api/ai/analyze-invoice/route.ts → lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (99 total, 20 thin omitted)

### Community 0 - "useCobrosOperaciones.ts"
Cohesion: 0.12
Nodes (25): CobroPaymentModal(), CobroPaymentModalProps, CobrosExcelImporterModal(), CobrosExcelImporterModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes, ExcelCobrosParser, SheetParseResult (+17 more)

### Community 1 - "components/DniMatrixTab.tsx"
Cohesion: 0.06
Nodes (55): features_dni_matrix_components_dni_matrix, DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniMatrixTab(), DniSlotEditor(), DniSlotEditorProps, DniSlotsGrid() (+47 more)

### Community 2 - "Program"
Cohesion: 0.06
Nodes (42): Action, CellData, Dictionary, documentformat_openxml_packaging, documentformat_openxml_spreadsheet, HeaderInfo, IEnumerable, int (+34 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.06
Nodes (58): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, formatOperatorName() (+50 more)

### Community 4 - "dashboard/types.ts"
Cohesion: 0.15
Nodes (24): AnalyticsChartsSection(), AnalyticsChartsSectionProps, DailyTasksSection(), DailyTasksSectionProps, DashboardHeader(), DashboardHeaderProps, DashboardTab(), ExecutiveKpiGrid() (+16 more)

### Community 5 - "app/page.tsx"
Cohesion: 0.14
Nodes (18): DashboardPage(), NewClientModal, NewPackageModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPackageModalProps (+10 more)

### Community 6 - "Cliente"
Cohesion: 0.09
Nodes (35): FormatoEntregaTab, InvoicesTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab() (+27 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (48): ref_node_http, candidateEnvPaths, cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell(), fs, fsp (+40 more)

### Community 8 - "getSupabaseAdmin"
Cohesion: 0.20
Nodes (19): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, FuenteTibOpcion (+11 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.12
Nodes (27): features_boletas_shalom_components_boletas_shalom, BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid(), ShalomKpiGridProps (+19 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.17
Nodes (18): CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, Clientes360View, DirectorioClientesViewProps, RegistrarCobroDiarioModal(), RegistrarCobroDiarioModalProps (+10 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.16
Nodes (25): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosSheetPreview(), RotulosSheetPreviewProps, RotulosSlotEditor(), RotulosSlotEditorProps (+17 more)

### Community 12 - "createClient"
Cohesion: 0.39
Nodes (5): POST(), GET(), getSessionUser(), SessionUser, createClient()

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

### Community 19 - "Paquete"
Cohesion: 0.12
Nodes (19): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, InventoryTab, GestorAlmacenView(), GestorAlmacenViewProps, InventoryStatsCards(), InventoryStatsCardsProps (+11 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.08
Nodes (30): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP, ButtonProps, SIZE_MAP, VARIANT_MAP (+22 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): docx, file-saver, html5-qrcode, jspdf, jszip, next, openai, dependencies (+17 more)

### Community 23 - "useInventoryData.ts"
Cohesion: 0.21
Nodes (16): TableSkeleton(), KardexView(), KardexViewProps, EditPositionModal(), EditPositionModalProps, ShelfPositionModalProps, TransferModalProps, inventoryService (+8 more)

### Community 25 - "types/index.ts"
Cohesion: 0.11
Nodes (14): InventoryPagination, UseInventoryQueryOptions, BoletaShalomInput, DestinoRuta, EmbarqueMaster, EstadoDestinoRuta, EstadoHojaRuta, FiltrosBoletaShalom (+6 more)

### Community 26 - "paquetes.schema.ts"
Cohesion: 0.10
Nodes (19): CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema, TibFuenteSchema, AssignShelfSchema, CreatePaqueteInput, CreatePaqueteSchema (+11 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, @tailwindcss/postcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "excelExport.ts"
Cohesion: 0.20
Nodes (16): InventoryTab(), useInventoryData(), exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel(), exportKardexToExcel(), exportLiquidacionesToExcel() (+8 more)

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

### Community 45 - "batch-sync/route.ts"
Cohesion: 0.20
Nodes (12): handleBatchSync(), isValidUuid(), POST, scannerLogger, formatZodError(), validateBody(), validateQuery(), getAuthenticatedUser() (+4 more)

### Community 46 - "cruzar-planilla/route.ts"
Cohesion: 0.27
Nodes (12): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+4 more)

### Community 47 - "cobros/types.ts"
Cohesion: 0.24
Nodes (11): CobrosKpiCardsProps, CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, CobrosService, CobrosMetrics, CobrosSubtab (+3 more)

### Community 48 - "TipoEstadoEntrega"
Cohesion: 0.43
Nodes (6): BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal(), BulkStatusByWrModalProps, TipoEstadoAmex, TipoEstadoEntrega

### Community 49 - "ref_node_fs"
Cohesion: 0.33
Nodes (5): ref_node_fs, localQueue, resilientDB, resilientQueue, uploadedToDB

### Community 50 - "components/CobrosTab.tsx"
Cohesion: 0.18
Nodes (9): CobrosDailySheetView(), CobrosTab(), DirectorioClientesTab(), DirectorioClientesTabProps, DirectorioClientesView(), useCobrosOperaciones(), CobrosTabProps, CobrosTab (+1 more)

### Community 51 - "test-scanner-performance.mjs"
Cohesion: 0.32
Nodes (6): envContent, run(), supabase, testBatch, testCurrentSequentialMethod(), testOptimizedBatchMethod()

### Community 52 - "test-vps-300-filas.mjs"
Cohesion: 0.29
Nodes (6): buf, data, filas, instructivoPath, t0, wb

### Community 53 - "benchmark-comparativo-completo.mjs"
Cohesion: 0.13
Nodes (21): mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2(), __dirname (+13 more)

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
Cohesion: 0.10
Nodes (22): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+14 more)

### Community 82 - "authorizeUser"
Cohesion: 0.24
Nodes (12): GET(), getLimaDateString(), POST(), TibTipo, GET(), mapPaqueteRow(), POST(), DELETE() (+4 more)

### Community 83 - "getR2ViewUrl"
Cohesion: 0.19
Nodes (10): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, CobrosList(), VoucherViewerModal() (+2 more)

### Community 84 - "useDashboardNavigation.ts"
Cohesion: 0.36
Nodes (8): isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS, migrateLegacyHash(), PATH_TO_TAB, pathToTab(), TAB_TO_PATH, tabToPath()

### Community 85 - "login/route.ts"
Cohesion: 0.18
Nodes (12): POST(), cache, checkRateLimit(), lastCleanup, purgeExpired(), rateLimitExceededResponse(), RateLimitOptions, RateLimitRecord (+4 more)

### Community 86 - "useDashboardData.ts"
Cohesion: 0.73
Nodes (5): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData()

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
Cohesion: 0.29
Nodes (10): POST(), SLOTS, dynamic, GET(), getEnv(), getR2Client(), R2_BUCKET_NAME, R2_PUBLIC_DOMAIN (+2 more)

### Community 92 - "inventario-jobs/route.ts"
Cohesion: 0.25
Nodes (9): isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, DbInventoryOptions, GeneratedInventory, generateInventoryExcelBufferFromDb(), mapEstadoLabel() (+1 more)

### Community 93 - "upload/route.ts"
Cohesion: 0.73
Nodes (8): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName()

### Community 94 - "matchesFuzzySearch"
Cohesion: 0.50
Nodes (7): useCobrosData(), useVoucherForm(), cleanAlphanumeric(), extractDigits(), matchesFuzzySearch(), normalizeText(), stripLeadingZeros()

### Community 95 - "uploadFileToR2"
Cohesion: 0.43
Nodes (6): GET(), POST(), uploadFileToR2(), sanitizeFileNamePart(), uploadShalomBoletaFile(), uploadShalomBoletaPdf()

### Community 96 - "ExcelExportDropdown.tsx"
Cohesion: 0.32
Nodes (6): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryToolbar(), InventoryToolbarProps

### Community 98 - "CobroDeliveryModal.tsx"
Cohesion: 0.40
Nodes (4): CobroDeliveryModal(), CobroDeliveryModalProps, TipoRetirante, features_cobros_types_tiporetirante

## Knowledge Gaps
- **393 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+388 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `ExcelExportDropdown.tsx`, `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `app/page.tsx`, `Cliente`, `cobros/types.ts`, `TipoEstadoEntrega`, `DashboardTabContent.tsx`, `authorizeUser`, `components/CobrosTab.tsx`, `components/ScannerTab.tsx`, `useDashboardData.ts`, `useInventoryData.ts`, `types/index.ts`, `excelExport.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `app/page.tsx`, `CobrosDailySheetView.tsx`, `components/RotulosA4Tab.tsx`, `cobros/types.ts`, `DashboardTabContent.tsx`, `components/CobrosTab.tsx`, `Paquete`, `components/ScannerTab.tsx`, `useDashboardData.ts`, `useInventoryData.ts`, `types/index.ts`, `excelExport.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `getSupabaseAdmin()` connect `getSupabaseAdmin` to `batch-sync/route.ts`, `cruzar-planilla/route.ts`, `authorizeUser`, `benchmark-comparativo-completo.mjs`, `inventario-jobs/route.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _393 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useCobrosOperaciones.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12121212121212122 - nodes in this community are weakly interconnected._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06229797237731413 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.05835010060362173 - nodes in this community are weakly interconnected._