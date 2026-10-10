# Graph Report - sistema-amex-courier  (2026-10-10)

## Corpus Check
- 390 files · ~367,779 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1792 nodes · 3979 edges · 111 communities (88 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.74)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `00ee1b70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Paquete
- components/DniMatrixTab.tsx
- Program
- components/LiveSheetsTab.tsx
- main.py
- phoneUtils.ts
- useFormatoEntrega.ts
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
- Cliente
- compilerOptions
- ui/index.ts
- dependencies
- components/InventarioJobsTab.tsx
- SoundSynthesizer
- types/index.ts
- useInventoryData.ts
- devDependencies
- components/InfoAmexTab.tsx
- InventoryFilterBar.tsx
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
- useInvoice.ts
- cobros/types.ts
- getR2ViewUrl
- batch-sync/route.ts
- test-scanner-performance.mjs
- ref_node_path
- admin.ts
- Find Skills
- proxy.ts
- excel-cobros-parser.ts
- cleanup-test-data.mjs
- graphify reference: extra exports and benchmark
- eslint.config.mjs
- FUENTE_VACIA_10bb5c65.md
- useInventoryQuery.ts
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
- NewPackageModal.tsx
- lenis
- zod
- next
- @types/node
- useCobrosOperaciones.ts
- components/InventoryTab.tsx
- openai
- createClient
- @supabase/ssr
- server
- vite
- manifestPdfGenerator.ts
- test-vps-300-filas.mjs
- r2/client.ts
- Logger
- SyncTibModal.tsx
- components/CobrosTab.tsx
- SmoothScrollProvider.tsx
- matchesFuzzySearch
- components/AuditoriaTab.tsx
- manager.ts
- shalom-boletas/route.ts
- MockElement
- Despliegue en VPS (Hostinger / Ubuntu)
- extract_table_rows
- useDashboardNavigation.ts
- docx
- upload/route.ts
- Badge.tsx
- paquetes.schema.ts
- CobroDeliveryModal.tsx
- inventory/index.ts
- Button.tsx

## God Nodes (most connected - your core abstractions)
1. `Paquete` - 92 edges
2. `authorizeUser()` - 63 edges
3. `getSupabaseAdmin()` - 57 edges
4. `Program` - 54 edges
5. `Cliente` - 53 edges
6. `supabase` - 30 edges
7. `DniSlotData` - 20 edges
8. `SmoothScrollManager` - 19 edges
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
- `CobrosList()` --calls--> `getR2ViewUrl()`  [EXTRACTED]
  features/cobros/components/CobrosList.tsx → lib/r2/client.ts

## Import Cycles
- None detected.

## Communities (111 total, 23 thin omitted)

### Community 0 - "Paquete"
Cohesion: 0.12
Nodes (17): ConfiguracionTabProps, InventoryTable(), InventoryTableProps, RowActionsDropdown(), RowActionsDropdownProps, ShelfMatrixGridProps, UseInventoryDataProps, SearchPaquetesServerSideResult (+9 more)

### Community 1 - "components/DniMatrixTab.tsx"
Cohesion: 0.06
Nodes (59): features_dni_matrix_components_dni_matrix, DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniMatrixTab(), DniSlotEditor(), DniSlotEditorProps, DniSlotsGrid() (+51 more)

### Community 2 - "Program"
Cohesion: 0.05
Nodes (50): Action, CachedSourceData, CellData, DateTime, Dictionary, documentformat_openxml_packaging, documentformat_openxml_spreadsheet, HeaderInfo (+42 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.05
Nodes (64): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, BarcodeBoundingBox, CameraDeviceOption, MobileScannerModalProps (+56 more)

### Community 4 - "main.py"
Cohesion: 0.09
Nodes (28): get, health_check(), process_manifest(), Procesa un PDF multipágina o imagen de manifiesto físico de TIB Courier: 1.…, detect_modalidad_omr(), ndarray, Detecta cuál casilla de verificación está marcada en el encabezado (DOMICILIO,…, clean_ocr_digits() (+20 more)

### Community 5 - "phoneUtils.ts"
Cohesion: 0.12
Nodes (27): ChoferCardParada(), ChoferCardParadaProps, DespachoRutasTab(), formatFechaCreacion(), RutaBuilderModal(), RutaBuilderModalProps, useDespachoRutas(), ViewModeDespacho (+19 more)

### Community 6 - "useFormatoEntrega.ts"
Cohesion: 0.16
Nodes (20): FormatoEntregaTab, ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, features_formato_entrega_components_formato_entrega, FormatoEntregaTab(), FormatoEntregaTabProps (+12 more)

### Community 7 - "worker.js"
Cohesion: 0.07
Nodes (39): ref_node_http, candidateEnvPaths, checkProcessorDaemonReady(), crypto, downloadFromR2(), fs, fsp, http (+31 more)

### Community 8 - "authorizeUser"
Cohesion: 0.10
Nodes (36): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, FuenteTibOpcion (+28 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.12
Nodes (28): ShalomTableSkeleton(), features_boletas_shalom_components_boletas_shalom, BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid() (+20 more)

### Community 10 - "CobrosDailySheetView.tsx"
Cohesion: 0.13
Nodes (22): CobrosDailySheetViewProps, Client360Modal, DirectorioClienteModal(), DirectorioClienteModalProps, DirectorioClientesTabProps, Clientes360View, DirectorioClientesView(), DirectorioClientesViewProps (+14 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.14
Nodes (31): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, features_rotulos_components_rotulos_a4, RotulosA4Tab(), RotulosHistoryModal(), RotulosHistoryModalProps, RotulosSheetDropdown(), RotulosSheetDropdownProps (+23 more)

### Community 12 - "app/page.tsx"
Cohesion: 0.18
Nodes (13): DashboardPage(), NewClientModal, NewPackageModal, HeaderBar(), HeaderBarProps, NewClientFormData, NewClientModalProps, NewPkgFormData (+5 more)

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
Cohesion: 0.18
Nodes (18): badgeStyle(), dropdownItemStyle, ExcelExportDropdown(), ExcelExportDropdownProps, exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel() (+10 more)

### Community 18 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 19 - "Cliente"
Cohesion: 0.06
Nodes (57): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DniMatrixSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton(), InvoicesSkeleton(), LiveSheetsSkeleton() (+49 more)

### Community 20 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.24
Nodes (12): Input, InputProps, Select, SelectProps, Table, TableBody, TableCell, TableFooter (+4 more)

### Community 22 - "dependencies"
Cohesion: 0.08
Nodes (25): @aws-sdk/s3-request-presigner, file-saver, html5-qrcode, jspdf, jszip, lucide-react, dependencies, @aws-sdk/client-s3 (+17 more)

### Community 23 - "components/InventarioJobsTab.tsx"
Cohesion: 0.16
Nodes (9): InventarioJobsTab, formatBytes(), FuenteKey, FUENTES, InventarioJobsTab(), Job, TibFileInfo, TibState (+1 more)

### Community 25 - "types/index.ts"
Cohesion: 0.10
Nodes (27): mapCliente(), mapPaquete(), mapRealtimeCliente(), mapRealtimePaquete(), useDashboardData(), BatchStatusModal(), BatchStatusModalProps, BulkStatusByWrModal() (+19 more)

### Community 26 - "useInventoryData.ts"
Cohesion: 0.15
Nodes (19): GestorAlmacenView(), GestorAlmacenViewProps, EditPositionModal(), EditPositionModalProps, ShelfPositionModal(), ShelfPositionModalProps, TransferModal(), TransferModalProps (+11 more)

### Community 27 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, selfsigned, supabase, tailwindcss (+19 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.28
Nodes (8): InfoAmexTab, features_info_amex_components_infoamex, InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "InventoryFilterBar.tsx"
Cohesion: 0.39
Nodes (9): InventoryFilterBar(), InventoryFilterBarProps, DateFilterState, getDateFilterSummary(), initialDateFilter, isPackageInDateFilter(), MONTH_NAMES, resolveDateFilterRange() (+1 more)

### Community 30 - "worker/package.json"
Cohesion: 0.14
Nodes (13): dependencies, @aws-sdk/client-s3, xlsx, description, engines, node, @aws-sdk/client-s3, xlsx (+5 more)

### Community 31 - "registry.ts"
Cohesion: 0.17
Nodes (18): Sidebar(), SidebarProps, OperatorHubTab, OperatorHubTab(), OperatorHubTabProps, ScannerTabProps, getAvailableModulesForUser(), getFirstAvailableTab() (+10 more)

### Community 32 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 33 - "supabase.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

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
Cohesion: 0.17
Nodes (8): ref_node_fs, adminSupabase, envContent, serviceKey, localQueue, resilientDB, resilientQueue, uploadedToDB

### Community 45 - "inventario-jobs/route.ts"
Cohesion: 0.18
Nodes (16): GET(), isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, GET(), mapPaqueteRow(), POST() (+8 more)

### Community 46 - "useInvoice.ts"
Cohesion: 0.18
Nodes (16): InvoicesTab, InvoiceControlPanel(), InvoiceControlPanelProps, InvoiceDocumentPreview(), InvoiceDocumentPreviewProps, features_invoices_components_invoices, InvoicesTab(), InvoicesTabProps (+8 more)

### Community 47 - "cobros/types.ts"
Cohesion: 0.22
Nodes (12): CobrosKpiCardsProps, CobrosList(), CobrosListProps, CobrosToolbarProps, NewVoucherFormProps, UseVoucherFormProps, CobrosService, CobrosMetrics (+4 more)

### Community 48 - "getR2ViewUrl"
Cohesion: 0.12
Nodes (16): dynamic, GET(), PdfViewerModal, PdfViewerModal(), PdfViewerModalProps, PhotoItem, PhotoViewerModal(), PhotoViewerModalProps (+8 more)

### Community 49 - "batch-sync/route.ts"
Cohesion: 0.15
Nodes (17): POST(), handleBatchSync(), isValidUuid(), POST, scannerLogger, getAuthenticatedUser(), cache, checkRateLimit() (+9 more)

### Community 51 - "test-scanner-performance.mjs"
Cohesion: 0.32
Nodes (6): envContent, run(), supabase, testBatch, testCurrentSequentialMethod(), testOptimizedBatchMethod()

### Community 52 - "ref_node_path"
Cohesion: 0.15
Nodes (8): ref_node_path, invHeaders, invRows, outDir, envContent, supabase, supabaseKey, supabaseUrl

### Community 53 - "admin.ts"
Cohesion: 0.09
Nodes (28): POST(), mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2() (+20 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 56 - "excel-cobros-parser.ts"
Cohesion: 0.18
Nodes (13): CobrosExcelImporterModal(), CobrosExcelImporterModalProps, ExcelCobrosParser, SheetParseResult, WorkbookParseResult, ClienteCobroLote, EstadoEntregaWR, EstadoPagoWR (+5 more)

### Community 57 - "cleanup-test-data.mjs"
Cohesion: 0.14
Nodes (10): ref_node_child_process, ref_node_os, __dirname, envPath, envVars, __filename, isProdSupabase, s3 (+2 more)

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

### Community 75 - "NewPackageModal.tsx"
Cohesion: 0.30
Nodes (12): NewPackageModal(), NewPackageModalProps, UBICACIONES_RAPIDAS, useDashboardActions(), cleanWr(), getWrValidationError(), isValidWr(), smartFormatWr() (+4 more)

### Community 81 - "useCobrosOperaciones.ts"
Cohesion: 0.21
Nodes (11): CobroPaymentModal(), CobroPaymentModalProps, INITIAL_COBROS_LOTES, features_cobros_data_initial_lotes, features_cobros_types_clientecobrolote, MetodoPagoCobro, VoucherCobroItem, features_cobros_types_filtroscobroslote (+3 more)

### Community 82 - "components/InventoryTab.tsx"
Cohesion: 0.14
Nodes (14): ThermalLabelModal, ThermalLabelModal(), ThermalLabelModalProps, useSmoothScroll(), InventoryTab(), InventoryTabProps, useInventoryData(), ItemToProcess (+6 more)

### Community 84 - "createClient"
Cohesion: 0.39
Nodes (5): POST(), GET(), getSessionUser(), SessionUser, createClient()

### Community 86 - "server"
Cohesion: 0.25
Nodes (14): bootWarmUpTibIndices(), cruzarFilasCobros(), extractWrsFromCell(), getOrBuildTibLookup(), getOrSyncCachedTibFile(), getTibCacheFilePath(), getTibCacheMetaPath(), notifyProcessorDaemonWarmup() (+6 more)

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

### Community 93 - "SyncTibModal.tsx"
Cohesion: 0.20
Nodes (10): MAX_WIDTH_MAP, Modal(), ModalProps, formatBytes(), JobProgress, SyncTibModal(), SyncTibModalProps, TIB_CONFIG (+2 more)

### Community 94 - "components/CobrosTab.tsx"
Cohesion: 0.24
Nodes (7): CobrosDailySheetView(), CobrosTab(), DirectorioClientesTab(), useCobrosOperaciones(), VoucherViewerModal(), VoucherViewerModalProps, CobrosTabProps

### Community 95 - "SmoothScrollProvider.tsx"
Cohesion: 0.25
Nodes (6): app_globals, metadata, viewport, SmoothScrollContext, SmoothScrollProvider(), SmoothScrollProviderProps

### Community 96 - "matchesFuzzySearch"
Cohesion: 0.50
Nodes (7): useCobrosData(), useVoucherForm(), cleanAlphanumeric(), extractDigits(), matchesFuzzySearch(), normalizeText(), stripLeadingZeros()

### Community 97 - "components/AuditoriaTab.tsx"
Cohesion: 0.23
Nodes (8): TableSkeleton(), AuditoriaTab(), AuditRecord, AuditoriaTab, KardexView(), KardexViewProps, exportKardexToExcel(), MovimientoKardex

### Community 98 - "manager.ts"
Cohesion: 0.36
Nodes (6): LENIS_CONFIG, ManagedScroller, MODAL_BACKDROP_SELECTOR, PREVENT_ATTRIBUTE, SCROLL_ATTRIBUTE, SCROLL_SELECTOR

### Community 99 - "shalom-boletas/route.ts"
Cohesion: 0.48
Nodes (5): GET(), POST(), sanitizeFileNamePart(), uploadShalomBoletaFile(), uploadShalomBoletaPdf()

### Community 101 - "Despliegue en VPS (Hostinger / Ubuntu)"
Cohesion: 0.33
Nodes (5): Despliegue en VPS (Hostinger / Ubuntu), Endpoints, Motor Python de Digitalización de Manifiestos TIB Courier, Opción 1: Con Docker (Recomendado), Opción 2: Con Python venv directo

### Community 102 - "extract_table_rows"
Cohesion: 0.50
Nodes (3): extract_table_rows(), ndarray, Detecta la tabla principal en la página utilizando operaciones morfológicas y…

### Community 103 - "useDashboardNavigation.ts"
Cohesion: 0.31
Nodes (9): DashboardTabId, isDashboardTab(), useDashboardNavigation(), VALID_DASHBOARD_TABS, migrateLegacyHash(), PATH_TO_TAB, pathToTab(), TAB_TO_PATH (+1 more)

### Community 105 - "upload/route.ts"
Cohesion: 0.36
Nodes (14): POST(), POST(), detectAndDeskew(), maxDuration, POST(), POST(), uploadFileToR2(), buildDniPath() (+6 more)

### Community 106 - "Badge.tsx"
Cohesion: 0.40
Nodes (5): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP

### Community 107 - "paquetes.schema.ts"
Cohesion: 0.08
Nodes (23): LoginInput, LoginSchema, UserUpdateInput, UserUpdateSchema, CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema (+15 more)

### Community 108 - "CobroDeliveryModal.tsx"
Cohesion: 0.40
Nodes (4): CobroDeliveryModal(), CobroDeliveryModalProps, TipoRetirante, features_cobros_types_tiporetirante

### Community 109 - "inventory/index.ts"
Cohesion: 0.14
Nodes (14): InventoryHeader(), InventoryHeaderProps, InventorySelectionBar(), InventorySelectionBarProps, InventoryStatsCards(), InventoryStatsCardsProps, InventorySubTabsProps, InventoryToolbar() (+6 more)

### Community 110 - "Button.tsx"
Cohesion: 0.40
Nodes (3): ButtonProps, SIZE_MAP, VARIANT_MAP

## Knowledge Gaps
- **442 isolated node(s):** `RESTORABLE_MODULES`, `dynamic`, `maxDuration`, `TibItem`, `FilaCruzarInput` (+437 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Paquete` connect `Paquete` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `useFormatoEntrega.ts`, `CobrosDailySheetView.tsx`, `app/page.tsx`, `inventario-jobs/route.ts`, `inventory/index.ts`, `cobros/types.ts`, `excelExport.ts`, `components/InventoryTab.tsx`, `Cliente`, `types/index.ts`, `useInventoryData.ts`, `useInventoryQuery.ts`, `components/CobrosTab.tsx`, `registry.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `Cliente` connect `Cliente` to `components/DniMatrixTab.tsx`, `components/LiveSheetsTab.tsx`, `useFormatoEntrega.ts`, `CobrosDailySheetView.tsx`, `NewPackageModal.tsx`, `app/page.tsx`, `components/RotulosA4Tab.tsx`, `useInvoice.ts`, `cobros/types.ts`, `excelExport.ts`, `components/InventoryTab.tsx`, `types/index.ts`, `useInventoryData.ts`, `components/CobrosTab.tsx`, `registry.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `getSupabaseAdmin()` connect `authorizeUser` to `upload/route.ts`, `inventario-jobs/route.ts`, `getR2ViewUrl`, `batch-sync/route.ts`, `createClient`, `admin.ts`, `r2/client.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `dynamic`, `maxDuration` to the rest of the system?**
  _442 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Paquete` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `components/DniMatrixTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05877742946708464 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.050774526678141134 - nodes in this community are weakly interconnected._