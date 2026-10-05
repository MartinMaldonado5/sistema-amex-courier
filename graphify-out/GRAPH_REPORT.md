# Graph Report - sistema-amex-courier  (2026-10-04)

## Corpus Check
- 337 files · ~314,801 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1599 nodes · 3417 edges · 98 communities (78 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57b01f4e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/InvoicesTab.tsx
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- dashboard/types.ts
- useDespachoRutas.ts
- components/FormatoEntregaTab.tsx
- worker.js
- getSupabaseAdmin
- components/BoletasShalomTab.tsx
- Cliente
- components/RotulosA4Tab.tsx
- authorizeUser
- ArmarPlanillaTab.tsx
- test-real-flow.mjs
- components/AdminUsersTab.tsx
- analyzer.ts
- excelExport.ts
- package.json
- components/DashboardTab.tsx
- compilerOptions
- ui/index.ts
- dependencies
- Paquete
- SoundSynthesizer
- types/index.ts
- upload/route.ts
- devDependencies
- components/InfoAmexTab.tsx
- useInventoryData.ts
- worker/package.json
- app/page.tsx
- What You Must Do When Invoked
- supabase.ts
- layout.tsx
- scripts
- analyze_phones_distritos.js
- whatsappGenerator.ts
- AmexInventoryProcessor.csproj
- next-env.d.ts
- vercel.json
- postcss.config.mjs
- components/InventarioJobsTab.tsx
- batch-sync/route.ts
- scanner.ts
- cobros/types.ts
- EstanteriaPosicion
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
- components/InventoryTab.tsx
- useCobrosOperaciones.ts
- createClient
- getR2ViewUrl
- DailyTasksSection.tsx
- ref_node_path
- test-api-scanner-batch.mjs
- test-daily-tib-flow.mjs
- inventoryJobsWorkflow.test.ts
- r2/client.ts
- inventario-jobs/route.ts
- components/CobrosTab.tsx
- matchesFuzzySearch
- ExcelExportDropdown.tsx
- ExecutiveKpiGrid.tsx
- components/AuditoriaTab.tsx

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
- `NewPackageModalProps` --references--> `Cliente`  [EXTRACTED]
  components/modals/NewPackageModal.tsx → types/index.ts
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `ExcelExportDropdownProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/components/ExcelExportDropdown.tsx → types/index.ts
- `EditPackageModalProps` --references--> `Paquete`  [EXTRACTED]
  features/inventory/modals/EditPackageModal.tsx → types/index.ts
- `InvoicesTabProps` --references--> `Cliente`  [EXTRACTED]
  features/invoices/components/InvoicesTab.tsx → types/index.ts

## Import Cycles
- None detected.

## Communities (98 total, 20 thin omitted)

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
Cohesion: 0.06
Nodes (63): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, MobileScannerModalProps (+55 more)

### Community 4 - "dashboard/types.ts"
Cohesion: 0.37
Nodes (9): AnalyticsChartsSectionProps, UseDashboardMetricsProps, DashboardTabProps, DeliveryChannelStat, PackageTypeStat, PaymentMethodStat, ShelfCapacityStat, CobroVoucher (+1 more)

### Community 5 - "useDespachoRutas.ts"
Cohesion: 0.15
Nodes (23): ChoferCardParada(), ChoferCardParadaProps, DespachoRutasTab(), RutaBuilderModal(), RutaBuilderModalProps, useDespachoRutas(), ViewModeDespacho, DespachoService (+15 more)

### Community 6 - "components/FormatoEntregaTab.tsx"
Cohesion: 0.17
Nodes (18): FormatoEntregaTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab(), FormatoEntregaTabProps (+10 more)

### Community 7 - "worker.js"
Cohesion: 0.06
Nodes (53): ref_node_http, bootWarmUpTibIndices(), candidateEnvPaths, checkProcessorDaemonReady(), cruzarFilasCobros(), crypto, downloadFromR2(), extractWrsFromCell() (+45 more)

### Community 8 - "getSupabaseAdmin"
Cohesion: 0.20
Nodes (18): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, GET() (+10 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.12
Nodes (28): ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom, BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid() (+20 more)

### Community 10 - "Cliente"
Cohesion: 0.18
Nodes (18): CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, Clientes360View, DirectorioClientesViewProps, RegistrarCobroDiarioModal(), RegistrarCobroDiarioModalProps (+10 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.13
Nodes (32): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosA4TabProps, RotulosHistoryModal(), RotulosHistoryModalProps, RotulosSheetDropdown() (+24 more)

### Community 12 - "authorizeUser"
Cohesion: 0.22
Nodes (12): FuenteTibOpcion, GET(), DELETE(), GET(), PATCH(), GET(), POST(), authorizeUser() (+4 more)

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
Cohesion: 0.23
Nodes (14): exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel(), exportKardexToExcel(), exportLiquidacionesToExcel(), exportPaquetesToExcel(), exportPickingOrderToExcel() (+6 more)

### Community 18 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 19 - "components/DashboardTab.tsx"
Cohesion: 0.22
Nodes (10): AnalyticsChartsSection(), DashboardHeader(), DashboardHeaderProps, DashboardTab(), DashboardTab, LivePackagesStream(), LivePackagesStreamProps, useDashboardMetrics() (+2 more)

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
Cohesion: 0.15
Nodes (11): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, InventoryStatsCards(), InventoryStatsCardsProps, InventoryTable(), InventoryTableProps, UseInventoryDataProps (+3 more)

### Community 25 - "types/index.ts"
Cohesion: 0.12
Nodes (14): parseLocation(), validateAndSimulateRelocation(), BoletaShalomInput, DestinoRuta, EmbarqueMaster, EstadoDestinoRuta, EstadoHojaRuta, FiltrosBoletaShalom (+6 more)

### Community 26 - "upload/route.ts"
Cohesion: 0.10
Nodes (31): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName() (+23 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, @tailwindcss/postcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "useInventoryData.ts"
Cohesion: 0.24
Nodes (14): BatchStatusModalProps, BulkStatusByWrModalProps, ShelfPositionModalProps, TransferModal(), TransferModalProps, inventoryService, BatchShelfData, InventoryStats (+6 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.05
Nodes (45): DashboardPage(), NewClientModal, NewPackageModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPackageModalProps (+37 more)

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

### Community 36 - "analyze_phones_distritos.js"
Cohesion: 0.05
Nodes (34): ref_fs, ref_path, filePath, path, s1, s2, sOficial, workbook (+26 more)

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
Cohesion: 0.13
Nodes (23): POST(), GET(), mapPaqueteRow(), POST(), handleBatchSync(), isValidUuid(), POST, scannerLogger (+15 more)

### Community 46 - "scanner.ts"
Cohesion: 0.36
Nodes (8): BaseScanExtra, DeliveryScanExtra, GeneralScanExtra, LookupScanExtra, OnScanConfirmHandler, RelocateScanExtra, ScanWorkflowMode, SlottingScanExtra

### Community 47 - "cobros/types.ts"
Cohesion: 0.22
Nodes (12): CobrosKpiCardsProps, CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, VoucherViewerModalProps, CobrosService, CobrosMetrics (+4 more)

### Community 48 - "EstanteriaPosicion"
Cohesion: 0.27
Nodes (6): GestorAlmacenView(), GestorAlmacenViewProps, ShelfMatrixGridProps, EditPositionModal(), EditPositionModalProps, EstanteriaPosicion

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
Nodes (23): POST(), mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2() (+15 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 57 - "cleanup-test-data.mjs"
Cohesion: 0.22
Nodes (7): __dirname, envPath, envVars, __filename, isProdSupabase, s3, supabase

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

### Community 82 - "components/InventoryTab.tsx"
Cohesion: 0.15
Nodes (13): TableSkeleton(), InventoryTab, InventoryTab(), InventoryTabProps, KardexView(), KardexViewProps, useInventoryData(), BatchStatusModal() (+5 more)

### Community 83 - "useCobrosOperaciones.ts"
Cohesion: 0.10
Nodes (29): CobroDeliveryModal(), CobroDeliveryModalProps, CobroPaymentModal(), CobroPaymentModalProps, CobrosExcelImporterModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes, ExcelCobrosParser (+21 more)

### Community 84 - "createClient"
Cohesion: 0.39
Nodes (5): POST(), GET(), getSessionUser(), SessionUser, createClient()

### Community 85 - "getR2ViewUrl"
Cohesion: 0.22
Nodes (9): PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, CobrosList(), VoucherViewerModal() (+1 more)

### Community 86 - "DailyTasksSection.tsx"
Cohesion: 0.67
Nodes (3): DailyTasksSection(), DailyTasksSectionProps, DailyTaskItem

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
Nodes (25): aNumero(), construirIndiceDesdeEnviado(), dynamic, esKeyValida(), FilaCruzarInput, indiceKeyPara(), leerIndice(), limpiar() (+17 more)

### Community 92 - "inventario-jobs/route.ts"
Cohesion: 0.17
Nodes (14): GET(), isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, DbInventoryOptions, GeneratedInventory, generateInventoryExcelBufferFromDb() (+6 more)

### Community 93 - "components/CobrosTab.tsx"
Cohesion: 0.18
Nodes (9): CobrosDailySheetView(), CobrosExcelImporterModal(), CobrosTab(), DirectorioClientesTab(), DirectorioClientesTabProps, DirectorioClientesView(), useCobrosOperaciones(), CobrosTabProps (+1 more)

### Community 94 - "matchesFuzzySearch"
Cohesion: 0.50
Nodes (7): useCobrosData(), useVoucherForm(), cleanAlphanumeric(), extractDigits(), matchesFuzzySearch(), normalizeText(), stripLeadingZeros()

### Community 95 - "ExcelExportDropdown.tsx"
Cohesion: 0.32
Nodes (6): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, InventoryToolbar(), InventoryToolbarProps

### Community 96 - "ExecutiveKpiGrid.tsx"
Cohesion: 0.67
Nodes (3): ExecutiveKpiGrid(), ExecutiveKpiGridProps, ExecutiveKpis

## Knowledge Gaps
- **439 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+434 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `components/FormatoEntregaTab.tsx`, `batch-sync/route.ts`, `scanner.ts`, `cobros/types.ts`, `EstanteriaPosicion`, `DashboardTabContent.tsx`, `components/InventoryTab.tsx`, `components/DashboardTab.tsx`, `useInventoryData.ts`, `excelExport.ts`, `types/index.ts`, `components/CobrosTab.tsx`, `ExcelExportDropdown.tsx`, `app/page.tsx`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/InvoicesTab.tsx`, `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `dashboard/types.ts`, `components/FormatoEntregaTab.tsx`, `components/RotulosA4Tab.tsx`, `scanner.ts`, `cobros/types.ts`, `DashboardTabContent.tsx`, `components/InventoryTab.tsx`, `useInventoryData.ts`, `excelExport.ts`, `types/index.ts`, `components/CobrosTab.tsx`, `app/page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `supabase` connect `components/LiveSheetsTab.tsx` to `useDespachoRutas.ts`, `components/RotulosA4Tab.tsx`, `components/InventarioJobsTab.tsx`, `cobros/types.ts`, `ui/index.ts`, `useInventoryData.ts`, `app/page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _439 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06229797237731413 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.050774526678141134 - nodes in this community are weakly interconnected._
- **Should `components/LiveSheetsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057387057387057384 - nodes in this community are weakly interconnected._