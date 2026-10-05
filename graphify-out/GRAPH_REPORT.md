# Graph Report - sistema-amex-courier  (2026-10-05)

## Corpus Check
- 332 files · ~315,406 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1569 nodes · 3388 edges · 102 communities (81 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `603ec7e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/InvoicesTab.tsx
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- Cliente
- phoneUtils.ts
- components/FormatoEntregaTab.tsx
- worker.js
- getSupabaseAdmin
- components/BoletasShalomTab.tsx
- CobrosDailySheetView.tsx
- components/RotulosA4Tab.tsx
- inventario-jobs/route.ts
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
- ExcelExportDropdown.tsx
- SoundSynthesizer
- types/index.ts
- paquetes.schema.ts
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
- components/InventarioJobsTab.tsx
- batch-sync/route.ts
- scanner.ts
- cobros/types.ts
- useDashboardNavigation.ts
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
- useCobrosOperaciones.ts
- createClient
- getR2ViewUrl
- authorizeUser
- ref_node_path
- test-api-scanner-batch.mjs
- test-daily-tib-flow.mjs
- inventoryJobsWorkflow.test.ts
- r2/client.ts
- Logger
- components/CobrosTab.tsx
- components/ScannerTab.tsx
- cruzar-planilla/route.ts
- upload/route.ts
- components/AuditoriaTab.tsx
- TipoEstadoEntrega
- useDashboardData.ts
- login/route.ts
- useInventoryQuery.ts

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 75 edges
2. `Program` - 54 edges
3. `Cliente` - 53 edges
4. `authorizeUser()` - 43 edges
5. `getSupabaseAdmin()` - 34 edges
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
- `InvoicesTabProps` --references--> `Cliente`  [EXTRACTED]
  features/invoices/components/InvoicesTab.tsx → types/index.ts
- `POST()` --calls--> `authorizeUser()`  [EXTRACTED]
  app/api/ai/analyze-invoice/route.ts → lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (102 total, 21 thin omitted)

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
Nodes (55): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, MobileScannerModal() (+47 more)

### Community 4 - "Cliente"
Cohesion: 0.27
Nodes (10): NewPackageModalProps, DashboardTabContentProps, DashboardScanExtra, UseDashboardMetricsProps, DashboardTabId, DashboardTabProps, RotulosA4TabProps, Cliente (+2 more)

### Community 5 - "phoneUtils.ts"
Cohesion: 0.13
Nodes (27): ChoferCardParada(), ChoferCardParadaProps, DespachoRutasTab(), formatFechaCreacion(), RutaBuilderModal(), RutaBuilderModalProps, useDespachoRutas(), ViewModeDespacho (+19 more)

### Community 6 - "components/FormatoEntregaTab.tsx"
Cohesion: 0.17
Nodes (18): FormatoEntregaTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab(), FormatoEntregaTabProps (+10 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (53): ref_node_http, bootWarmUpTibIndices(), candidateEnvPaths, checkProcessorDaemonReady(), cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell() (+45 more)

### Community 8 - "getSupabaseAdmin"
Cohesion: 0.16
Nodes (22): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, FuenteTibOpcion (+14 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.12
Nodes (28): ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom, BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid() (+20 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.18
Nodes (17): CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, Clientes360View, DirectorioClientesViewProps, RegistrarCobroDiarioModal(), RegistrarCobroDiarioModalProps (+9 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.14
Nodes (31): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosHistoryModal(), RotulosHistoryModalProps, RotulosSheetDropdown(), RotulosSheetDropdownProps (+23 more)

### Community 12 - "inventario-jobs/route.ts"
Cohesion: 0.16
Nodes (15): GET(), isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, DbInventoryOptions, GeneratedInventory, generateInventoryExcelBufferFromDb() (+7 more)

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
Cohesion: 0.20
Nodes (16): InventoryTab(), useInventoryData(), exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel(), exportKardexToExcel(), exportLiquidacionesToExcel() (+8 more)

### Community 18 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 19 - "dashboard/types.ts"
Cohesion: 0.17
Nodes (21): AnalyticsChartsSection(), AnalyticsChartsSectionProps, DailyTasksSection(), DailyTasksSectionProps, DashboardHeader(), DashboardHeaderProps, DashboardTab(), DashboardTab (+13 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.08
Nodes (30): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP, ButtonProps, SIZE_MAP, VARIANT_MAP (+22 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): docx, file-saver, html5-qrcode, jspdf, jszip, next, openai, dependencies (+17 more)

### Community 23 - "ExcelExportDropdown.tsx"
Cohesion: 0.32
Nodes (6): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryToolbar(), InventoryToolbarProps

### Community 25 - "types/index.ts"
Cohesion: 0.10
Nodes (18): TableSkeleton(), KardexView(), KardexViewProps, parseLocation(), validateAndSimulateRelocation(), BoletaShalomInput, DestinoRuta, EmbarqueMaster (+10 more)

### Community 26 - "paquetes.schema.ts"
Cohesion: 0.10
Nodes (19): CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema, TibFuenteSchema, AssignShelfSchema, CreatePaqueteInput, CreatePaqueteSchema (+11 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, @tailwindcss/postcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "useInventoryData.ts"
Cohesion: 0.23
Nodes (13): ShelfMatrixGridProps, EditPositionModal(), EditPositionModalProps, ShelfPositionModalProps, TransferModalProps, inventoryService, BatchShelfData, InventoryStats (+5 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.14
Nodes (18): DashboardPage(), NewClientModal, NewPackageModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPkgFormData (+10 more)

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

### Community 46 - "scanner.ts"
Cohesion: 0.36
Nodes (8): BaseScanExtra, DeliveryScanExtra, GeneralScanExtra, LookupScanExtra, OnScanConfirmHandler, RelocateScanExtra, ScanWorkflowMode, SlottingScanExtra

### Community 47 - "cobros/types.ts"
Cohesion: 0.24
Nodes (11): CobrosKpiCardsProps, CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, CobrosService, CobrosMetrics, CobrosSubtab (+3 more)

### Community 48 - "useDashboardNavigation.ts"
Cohesion: 0.19
Nodes (15): isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS, getModuleByTabId(), getScannerSubmoduleById(), getScannerSubmoduleByTabId(), ModuleMetadata, SCANNER_SUBMODULES (+7 more)

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
Cohesion: 0.16
Nodes (16): deleteFileFromR2(), getFileFromR2(), __dirname, envPath, __filename, r2Root, REAL_FILES, runBenchmark() (+8 more)

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
Cohesion: 0.11
Nodes (19): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+11 more)

### Community 82 - "Paquete"
Cohesion: 0.14
Nodes (17): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, GestorAlmacenView(), GestorAlmacenViewProps, InventoryStatsCards(), InventoryStatsCardsProps, InventoryTabProps (+9 more)

### Community 83 - "useCobrosOperaciones.ts"
Cohesion: 0.10
Nodes (30): CobroDeliveryModal(), CobroDeliveryModalProps, CobroPaymentModal(), CobroPaymentModalProps, CobrosExcelImporterModal(), CobrosExcelImporterModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes (+22 more)

### Community 84 - "createClient"
Cohesion: 0.21
Nodes (11): POST(), GET(), GET(), POST(), getSessionUser(), SessionUser, uploadFileToR2(), sanitizeFileNamePart() (+3 more)

### Community 85 - "getR2ViewUrl"
Cohesion: 0.24
Nodes (8): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, CobrosList(), getR2ViewUrl()

### Community 86 - "authorizeUser"
Cohesion: 0.24
Nodes (12): GET(), getLimaDateString(), POST(), TibTipo, GET(), mapPaqueteRow(), POST(), DELETE() (+4 more)

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

### Community 93 - "components/CobrosTab.tsx"
Cohesion: 0.15
Nodes (11): CobrosDailySheetView(), CobrosTab(), DirectorioClientesTab(), DirectorioClientesTabProps, DirectorioClientesView(), useCobrosOperaciones(), VoucherViewerModal(), VoucherViewerModalProps (+3 more)

### Community 94 - "components/ScannerTab.tsx"
Cohesion: 0.19
Nodes (14): MobileScannerModalProps, useCobrosData(), useVoucherForm(), ScannerTab, formatOperatorName(), MobileScannerModal, ScannerTab(), ScannerTabProps (+6 more)

### Community 95 - "cruzar-planilla/route.ts"
Cohesion: 0.27
Nodes (12): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+4 more)

### Community 96 - "upload/route.ts"
Cohesion: 0.73
Nodes (8): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName()

### Community 98 - "TipoEstadoEntrega"
Cohesion: 0.43
Nodes (6): BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal(), BulkStatusByWrModalProps, TipoEstadoAmex, TipoEstadoEntrega

### Community 99 - "useDashboardData.ts"
Cohesion: 0.57
Nodes (6): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData(), TipoMetodoEntrega

### Community 100 - "login/route.ts"
Cohesion: 0.18
Nodes (12): POST(), cache, checkRateLimit(), lastCleanup, purgeExpired(), rateLimitExceededResponse(), RateLimitOptions, RateLimitRecord (+4 more)

## Knowledge Gaps
- **413 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+408 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `Cliente`, `components/FormatoEntregaTab.tsx`, `excelExport.ts`, `dashboard/types.ts`, `ExcelExportDropdown.tsx`, `types/index.ts`, `useInventoryData.ts`, `app/page.tsx`, `scanner.ts`, `cobros/types.ts`, `DashboardTabContent.tsx`, `authorizeUser`, `components/CobrosTab.tsx`, `components/ScannerTab.tsx`, `TipoEstadoEntrega`, `useDashboardData.ts`, `useInventoryQuery.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/InvoicesTab.tsx`, `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `useDashboardData.ts`, `components/FormatoEntregaTab.tsx`, `CobrosDailySheetView.tsx`, `components/RotulosA4Tab.tsx`, `scanner.ts`, `cobros/types.ts`, `DashboardTabContent.tsx`, `Paquete`, `dashboard/types.ts`, `useInventoryData.ts`, `excelExport.ts`, `types/index.ts`, `components/CobrosTab.tsx`, `components/ScannerTab.tsx`, `app/page.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `supabase` connect `components/LiveSheetsTab.tsx` to `useDashboardData.ts`, `phoneUtils.ts`, `components/RotulosA4Tab.tsx`, `components/InventarioJobsTab.tsx`, `cobros/types.ts`, `ui/index.ts`, `useInventoryData.ts`, `components/ScannerTab.tsx`, `app/page.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _413 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06229797237731413 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.050774526678141134 - nodes in this community are weakly interconnected._
- **Should `components/LiveSheetsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06835443037974684 - nodes in this community are weakly interconnected._