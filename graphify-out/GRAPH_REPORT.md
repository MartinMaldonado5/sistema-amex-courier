# Graph Report - sistema-amex-courier  (2026-10-09)

## Corpus Check
- 378 files · ~358,781 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1764 nodes · 3873 edges · 104 communities (83 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f5a0bd2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/InvoicesTab.tsx
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- main.py
- phoneUtils.ts
- components/FormatoEntregaTab.tsx
- worker.js
- authorizeUser
- components/BoletasShalomTab.tsx
- CobrosDailySheetView.tsx
- components/RotulosA4Tab.tsx
- app/page.tsx
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
- components/InventarioJobsTab.tsx
- SoundSynthesizer
- types/index.ts
- EstanteriaPosicion
- devDependencies
- components/InfoAmexTab.tsx
- useInventoryData.ts
- worker/package.json
- registry.ts
- What You Must Do When Invoked
- supabase.ts
- SmoothScrollManager
- scripts
- gen-certs.mjs
- whatsappGenerator.ts
- AmexInventoryProcessor.csproj
- next-env.d.ts
- vercel.json
- postcss.config.mjs
- ref_node_fs
- inventario-jobs/route.ts
- NewPackageModal.tsx
- test-daily-tib-flow.mjs
- Paquete
- InventoryFilterBar.tsx
- test-scanner-performance.mjs
- ref_node_path
- benchmark-comparativo-completo.mjs
- Find Skills
- proxy.ts
- batch-sync/route.ts
- cleanup-test-data.mjs
- graphify reference: extra exports and benchmark
- eslint.config.mjs
- FUENTE_VACIA_10bb5c65.md
- TipoEstadoEntrega
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
- docx
- lenis
- zod
- next
- @types/node
- DashboardTabContent.tsx
- components/InventoryTab.tsx
- openai
- createClient
- @supabase/ssr
- auditoria/route.ts
- vite
- manifestPdfGenerator.ts
- test-vps-300-filas.mjs
- r2/client.ts
- Logger
- inventario-jobs.schema.ts
- test-api-scanner-batch.mjs
- login/route.ts
- useDashboardData.ts
- components/AuditoriaTab.tsx
- inventoryJobsWorkflow.test.ts
- Despliegue en VPS (Hostinger / Ubuntu)
- extract_table_rows
- upload/route.ts
- paquetes.schema.ts
- inventory/index.ts

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 89 edges
2. `authorizeUser()` - 63 edges
3. `getSupabaseAdmin()` - 57 edges
4. `Program` - 54 edges
5. `Cliente` - 53 edges
6. `supabase` - 22 edges
7. `SmoothScrollManager` - 19 edges
8. `DniSlotData` - 18 edges
9. `getR2ViewUrl()` - 17 edges
10. `uploadFileToR2()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `authorizeUser()`  [EXTRACTED]
  app/api/shalom-boletas/route.ts → lib/auth/guards.ts
- `NewPackageModalProps` --references--> `Cliente`  [EXTRACTED]
  components/modals/NewPackageModal.tsx → types/index.ts
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `ThermalLabelModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/ThermalLabelModal.tsx → types/index.ts
- `ExcelExportDropdownProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/components/ExcelExportDropdown.tsx → types/index.ts

## Import Cycles
- None detected.

## Communities (104 total, 21 thin omitted)

### Community 0 - "components/InvoicesTab.tsx"
Cohesion: 0.19
Nodes (15): InvoicesTab, InvoiceControlPanel(), InvoiceControlPanelProps, InvoiceDocumentPreview(), InvoiceDocumentPreviewProps, features_invoices_components_invoices, InvoicesTab(), InvoicesTabProps (+7 more)

### Community 1 - "components/DniMatrixTab.tsx"
Cohesion: 0.06
Nodes (54): features_dni_matrix_components_dni_matrix, DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniMatrixTab(), DniSlotEditor(), DniSlotEditorProps, DniSlotsGrid() (+46 more)

### Community 2 - "Program"
Cohesion: 0.05
Nodes (50): Action, CachedSourceData, CellData, DateTime, Dictionary, documentformat_openxml_packaging, documentformat_openxml_spreadsheet, HeaderInfo (+42 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.07
Nodes (53): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, FormulaBar(), FormulaBarProps, features_live_sheets_components_live_sheets (+45 more)

### Community 4 - "main.py"
Cohesion: 0.09
Nodes (28): get, health_check(), process_manifest(), Procesa un PDF multipágina o imagen de manifiesto físico de TIB Courier: 1.…, detect_modalidad_omr(), ndarray, Detecta cuál casilla de verificación está marcada en el encabezado (DOMICILIO,…, clean_ocr_digits() (+20 more)

### Community 5 - "phoneUtils.ts"
Cohesion: 0.12
Nodes (27): ChoferCardParada(), ChoferCardParadaProps, DespachoRutasTab(), formatFechaCreacion(), RutaBuilderModal(), RutaBuilderModalProps, useDespachoRutas(), ViewModeDespacho (+19 more)

### Community 6 - "components/FormatoEntregaTab.tsx"
Cohesion: 0.18
Nodes (17): FormatoEntregaTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab(), getTodayFormatted() (+9 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (53): ref_node_http, bootWarmUpTibIndices(), candidateEnvPaths, checkProcessorDaemonReady(), cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell() (+45 more)

### Community 8 - "authorizeUser"
Cohesion: 0.12
Nodes (30): FuenteTibOpcion, GET(), DELETE(), GET(), GET(), getLimaDateString(), POST(), TibTipo (+22 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.07
Nodes (44): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom (+36 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.05
Nodes (74): CobroDeliveryModal(), CobroDeliveryModalProps, CobroPaymentModal(), CobroPaymentModalProps, CobrosDailySheetView(), CobrosDailySheetViewProps, CobrosExcelImporterModal(), CobrosExcelImporterModalProps (+66 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.13
Nodes (32): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosA4TabProps, RotulosHistoryModal(), RotulosHistoryModalProps, RotulosSheetDropdown() (+24 more)

### Community 12 - "app/page.tsx"
Cohesion: 0.18
Nodes (15): DashboardPage(), NewClientModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPkgFormData, DashboardTabContent() (+7 more)

### Community 13 - "ArmarPlanillaTab.tsx"
Cohesion: 0.16
Nodes (17): FilaResultadoCobro, ArmarPlanillaTab(), ArmarPlanillaTabProps, Fase, FiltroEstado, FuenteTibOpcion, aNumero(), aTexto() (+9 more)

### Community 14 - "test-real-flow.mjs"
Cohesion: 0.11
Nodes (17): batchId, envContent, filesToUpload, keys, r2AccessKey, r2AccountId, r2Root, r2SecretKey (+9 more)

### Community 15 - "components/AdminUsersTab.tsx"
Cohesion: 0.10
Nodes (19): AdminUsersTab(), AVATAR_GRADS, avatarGrad(), avatarInitials(), btnBlue, btnGreen, card, fmtDate() (+11 more)

### Community 16 - "analyzer.ts"
Cohesion: 0.15
Nodes (22): POST(), POST(), POST(), POST(), analyzeInvoiceDocument(), analyzeShalomBoletaPdf(), DEFAULT_OPENAI_MODEL, DNI_JSON_SCHEMA (+14 more)

### Community 17 - "excelExport.ts"
Cohesion: 0.14
Nodes (22): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryTable(), InventoryTableProps, exportClientesToExcel(), exportCobrosToExcel() (+14 more)

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
Nodes (25): @aws-sdk/s3-request-presigner, file-saver, html5-qrcode, jspdf, jszip, lucide-react, dependencies, @aws-sdk/client-s3 (+17 more)

### Community 23 - "components/InventarioJobsTab.tsx"
Cohesion: 0.16
Nodes (9): InventarioJobsTab, formatBytes(), FuenteKey, FUENTES, InventarioJobsTab(), Job, TibFileInfo, TibState (+1 more)

### Community 25 - "types/index.ts"
Cohesion: 0.09
Nodes (18): InventoryPagination, UseInventoryQueryOptions, parseAndMatchWrs(), parseBulkCodes(), parseLocation(), validateAndSimulateRelocation(), BoletaShalomInput, DestinoRuta (+10 more)

### Community 26 - "EstanteriaPosicion"
Cohesion: 0.27
Nodes (6): GestorAlmacenView(), GestorAlmacenViewProps, ShelfMatrixGridProps, EditPositionModal(), EditPositionModalProps, EstanteriaPosicion

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, tailwindcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "useInventoryData.ts"
Cohesion: 0.25
Nodes (13): UseInventoryDataProps, ShelfPositionModalProps, TransferModal(), TransferModalProps, inventoryService, BatchShelfData, DateFilterType, InventoryStats (+5 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "registry.ts"
Cohesion: 0.12
Nodes (25): Sidebar(), SidebarProps, OperatorHubTab, OperatorHubTab(), OperatorHubTabProps, isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS (+17 more)

### Community 32 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 33 - "supabase.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 34 - "SmoothScrollManager"
Cohesion: 0.08
Nodes (14): app_globals, metadata, viewport, SmoothScrollContext, SmoothScrollProvider(), SmoothScrollProviderProps, LENIS_CONFIG, ManagedScroller (+6 more)

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

### Community 44 - "ref_node_fs"
Cohesion: 0.33
Nodes (5): ref_node_fs, localQueue, resilientDB, resilientQueue, uploadedToDB

### Community 45 - "inventario-jobs/route.ts"
Cohesion: 0.17
Nodes (17): GET(), isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, GET(), mapPaqueteRow(), POST() (+9 more)

### Community 46 - "NewPackageModal.tsx"
Cohesion: 0.34
Nodes (11): NewPackageModal, NewPackageModal(), NewPackageModalProps, UBICACIONES_RAPIDAS, cleanWr(), getWrValidationError(), isValidWr(), smartFormatWr() (+3 more)

### Community 47 - "test-daily-tib-flow.mjs"
Cohesion: 0.33
Nodes (4): envContent, supabase, supabaseKey, supabaseUrl

### Community 48 - "Paquete"
Cohesion: 0.11
Nodes (27): BarcodeBoundingBox, CameraDeviceOption, MobileScannerModalProps, DirectorioClientesTabProps, DashboardTabContentProps, ScannerTab, DashboardScanExtra, DniLinkClientModalProps (+19 more)

### Community 49 - "InventoryFilterBar.tsx"
Cohesion: 0.42
Nodes (8): InventoryFilterBar(), InventoryFilterBarProps, DateFilterState, getDateFilterSummary(), initialDateFilter, isPackageInDateFilter(), MONTH_NAMES, toLocalDateString()

### Community 51 - "test-scanner-performance.mjs"
Cohesion: 0.32
Nodes (6): envContent, run(), supabase, testBatch, testCurrentSequentialMethod(), testOptimizedBatchMethod()

### Community 52 - "ref_node_path"
Cohesion: 0.29
Nodes (4): ref_node_path, invHeaders, invRows, outDir

### Community 53 - "benchmark-comparativo-completo.mjs"
Cohesion: 0.10
Nodes (26): POST(), mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2() (+18 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 56 - "batch-sync/route.ts"
Cohesion: 0.24
Nodes (9): handleBatchSync(), isValidUuid(), POST, scannerLogger, getAuthenticatedUser(), BatchSyncScannerInput, BatchSyncScannerSchema, ScannedLogItemInput (+1 more)

### Community 57 - "cleanup-test-data.mjs"
Cohesion: 0.20
Nodes (8): ref_node_url, __dirname, envPath, envVars, __filename, isProdSupabase, s3, supabase

### Community 58 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 61 - "TipoEstadoEntrega"
Cohesion: 0.29
Nodes (8): BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal(), BulkStatusByWrModalProps, EditPackageModal(), EditPackageModalProps, TipoEstadoAmex, TipoEstadoEntrega

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
Nodes (17): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+9 more)

### Community 82 - "components/InventoryTab.tsx"
Cohesion: 0.10
Nodes (19): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, useSmoothScroll(), TableSkeleton(), InventoryTab, InventoryTab(), InventoryTabProps (+11 more)

### Community 84 - "createClient"
Cohesion: 0.22
Nodes (10): POST(), GET(), GET(), POST(), getSessionUser(), SessionUser, sanitizeFileNamePart(), uploadShalomBoletaFile() (+2 more)

### Community 86 - "auditoria/route.ts"
Cohesion: 0.33
Nodes (8): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, authorizeAdmin()

### Community 88 - "manifestPdfGenerator.ts"
Cohesion: 0.50
Nodes (4): generateManifestDigitalPdf(), ManifestDataForPdf, ManifestRowForPdf, sanitizeText()

### Community 89 - "test-vps-300-filas.mjs"
Cohesion: 0.29
Nodes (6): buf, data, filas, instructivoPath, t0, wb

### Community 91 - "r2/client.ts"
Cohesion: 0.14
Nodes (24): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+16 more)

### Community 92 - "Logger"
Cohesion: 0.20
Nodes (5): ApiHandler, withErrorHandler(), LogEntry, Logger, LogLevel

### Community 93 - "inventario-jobs.schema.ts"
Cohesion: 0.33
Nodes (5): CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema, TibFuenteSchema

### Community 94 - "test-api-scanner-batch.mjs"
Cohesion: 0.33
Nodes (3): adminSupabase, envContent, serviceKey

### Community 95 - "login/route.ts"
Cohesion: 0.18
Nodes (12): POST(), cache, checkRateLimit(), lastCleanup, purgeExpired(), rateLimitExceededResponse(), RateLimitOptions, RateLimitRecord (+4 more)

### Community 96 - "useDashboardData.ts"
Cohesion: 0.46
Nodes (7): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData(), TipoEstadoTib, TipoMetodoEntrega

### Community 98 - "inventoryJobsWorkflow.test.ts"
Cohesion: 0.40
Nodes (3): ref_node_child_process, ref_node_os, tmpDir

### Community 101 - "Despliegue en VPS (Hostinger / Ubuntu)"
Cohesion: 0.33
Nodes (5): Despliegue en VPS (Hostinger / Ubuntu), Endpoints, Motor Python de Digitalización de Manifiestos TIB Courier, Opción 1: Con Docker (Recomendado), Opción 2: Con Python venv directo

### Community 102 - "extract_table_rows"
Cohesion: 0.50
Nodes (3): extract_table_rows(), ndarray, Detecta la tabla principal en la página utilizando operaciones morfológicas y…

### Community 105 - "upload/route.ts"
Cohesion: 0.36
Nodes (14): POST(), POST(), detectAndDeskew(), maxDuration, POST(), POST(), uploadFileToR2(), buildDniPath() (+6 more)

### Community 107 - "paquetes.schema.ts"
Cohesion: 0.14
Nodes (14): AssignShelfSchema, CreatePaqueteInput, CreatePaqueteSchema, EstadoEntregaSchema, EstadoTibSchema, QueryPaquetesInput, QueryPaquetesSchema, UbicacionSchema (+6 more)

### Community 109 - "inventory/index.ts"
Cohesion: 0.13
Nodes (17): InventoryHeader(), InventoryHeaderProps, InventorySelectionBar(), InventorySelectionBarProps, InventoryStatsCards(), InventoryStatsCardsProps, InventorySubTabs(), InventorySubTabsProps (+9 more)

## Knowledge Gaps
- **440 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+435 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `useDashboardData.ts`, `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `components/FormatoEntregaTab.tsx`, `CobrosDailySheetView.tsx`, `app/page.tsx`, `inventario-jobs/route.ts`, `inventory/index.ts`, `DashboardTabContent.tsx`, `components/InventoryTab.tsx`, `dashboard/types.ts`, `excelExport.ts`, `TipoEstadoEntrega`, `types/index.ts`, `EstanteriaPosicion`, `useInventoryData.ts`, `registry.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Paquete` to `useDashboardData.ts`, `components/DniMatrixTab.tsx`, `components/InvoicesTab.tsx`, `components/LiveSheetsTab.tsx`, `components/FormatoEntregaTab.tsx`, `CobrosDailySheetView.tsx`, `components/RotulosA4Tab.tsx`, `app/page.tsx`, `NewPackageModal.tsx`, `DashboardTabContent.tsx`, `components/InventoryTab.tsx`, `dashboard/types.ts`, `excelExport.ts`, `types/index.ts`, `useInventoryData.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `getSupabaseAdmin()` connect `authorizeUser` to `upload/route.ts`, `inventario-jobs/route.ts`, `createClient`, `benchmark-comparativo-completo.mjs`, `auditoria/route.ts`, `batch-sync/route.ts`, `r2/client.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _440 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06323396567299007 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.050774526678141134 - nodes in this community are weakly interconnected._
- **Should `components/LiveSheetsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0710868079289132 - nodes in this community are weakly interconnected._