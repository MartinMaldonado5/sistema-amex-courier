# Graph Report - sistema-amex-courier  (2026-10-01)

## Corpus Check
- 281 files · ~269,979 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .css 9, (none) 5, .example 1)

## Summary
- 1360 nodes · 3321 edges · 75 communities (63 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4797bbd9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useCobrosOperaciones.ts
- docx-exporter.ts
- Program
- components/LiveSheetsTab.tsx
- DashboardTabContent.tsx
- app/page.tsx
- Cliente
- worker.js
- guards.ts
- components/BoletasShalomTab.tsx
- r2/client.ts
- components/RotulosA4Tab.tsx
- authorizeUser
- dashboard/types.ts
- test-real-flow.mjs
- components/AdminUsersTab.tsx
- analyzer.ts
- components/InventoryTab.tsx
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
- components/ScannerTab.tsx
- worker/package.json
- upload/route.ts
- What You Must Do When Invoked
- supabase.ts
- layout.tsx
- scripts
- gen-certs.mjs
- whatsappGenerator.ts
- AmexInventoryProcessor.csproj
- vercel.json
- postcss.config.mjs
- cobros/types.ts
- next
- CobrosDailySheetView.tsx
- supabase/client.ts
- components/DniMatrixTab.tsx
- test-daily-tib-flow.mjs
- dni-matrix/types.ts
- react
- logger
- syncDb.ts
- Find Skills
- inventario-jobs/route.ts
- components/CobrosTab.tsx
- benchmark-comparativo-completo.mjs
- graphify reference: extra exports and benchmark
- paquetes/route.ts
- DniMatrixDB
- DniDropzonePanel.tsx
- graphify reference: query, path, explain
- CobroDeliveryModal.tsx
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

## God Nodes (most connected - your core abstractions)
1. `react` - 115 edges
2. `Paquete` - 65 edges
3. `lucide-react` - 56 edges
4. `Cliente` - 51 edges
5. `Program` - 41 edges
6. `authorizeUser()` - 37 edges
7. `next` - 32 edges
8. `getSupabaseAdmin()` - 27 edges
9. `DashboardTabContent()` - 19 edges
10. `Skeleton()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `NewPackageModalProps` --references--> `Cliente`  [EXTRACTED]
  components/modals/NewPackageModal.tsx → types/index.ts
- `PasteWrListModalProps` --references--> `Paquete`  [EXTRACTED]
  components/modals/PasteWrListModal.tsx → types/index.ts
- `PdfViewerModal()` --calls--> `getR2ViewUrl()`  [EXTRACTED]
  components/modals/PdfViewerModal.tsx → lib/r2/client.ts
- `InventoryToolbarProps` --references--> `EstanteriaPosicion`  [EXTRACTED]
  features/inventory/components/InventoryToolbar.tsx → types/index.ts
- `UseLiveSheetsDataProps` --references--> `Paquete`  [EXTRACTED]
  features/live-sheets/hooks/useLiveSheetsData.ts → types/index.ts

## Import Cycles
- None detected.

## Communities (75 total, 12 thin omitted)

### Community 0 - "useCobrosOperaciones.ts"
Cohesion: 0.12
Nodes (21): CobroPaymentModal(), CobroPaymentModalContent(), CobroPaymentModalProps, CobrosDailySheetViewProps, CobrosExcelImporterModal(), CobrosExcelImporterModalContent(), CobrosExcelImporterModalProps, INITIAL_COBROS_LOTES (+13 more)

### Community 1 - "docx-exporter.ts"
Cohesion: 0.22
Nodes (17): useDniExport(), buildExpedienteChildren(), DNI_SIZE_PRESETS, DniSizeConfig, exportMasterDocx(), exportToDirectoryFolder(), exportZipDocx(), normalizeImage() (+9 more)

### Community 2 - "Program"
Cohesion: 0.06
Nodes (15): CellData, CellKind, Blank, Boolean, Error, Number, Text, HeaderColumn (+7 more)

### Community 3 - "components/LiveSheetsTab.tsx"
Cohesion: 0.08
Nodes (48): NewSheetModal(), NewSheetModalProps, ParsedItem, PasteWrListModal(), PasteWrListModalProps, MobileScannerModal(), FormulaBar(), FormulaBarProps (+40 more)

### Community 4 - "DashboardTabContent.tsx"
Cohesion: 0.09
Nodes (50): BoletasShalomSkeleton(), CobrosSkeleton(), DashboardSkeleton(), DeliveriesSkeleton(), DniMatrixSkeleton(), EntregasSkeleton(), FormatoEntregaSkeleton(), InventorySkeleton() (+42 more)

### Community 5 - "app/page.tsx"
Cohesion: 0.08
Nodes (36): DashboardPage(), NewClientModal, NewPackageModal, PdfViewerModal, ThermalLabelModal, HeaderBar(), HeaderBarProps, NewClientFormData (+28 more)

### Community 6 - "Cliente"
Cohesion: 0.10
Nodes (31): ActaControlPanel(), ActaControlPanelProps, ActaDocumentPreview(), ActaDocumentPreviewProps, FormatoEntregaTab(), FormatoEntregaTabProps, getTodayFormatted(), useFormatoEntrega() (+23 more)

### Community 7 - "worker.js"
Cohesion: 0.07
Nodes (42): candidateEnvPaths, crypto, downloadFromR2(), fs, fsp, getOrSyncCachedTibFile(), getTibCacheFilePath(), getTibCacheMetaPath() (+34 more)

### Community 8 - "guards.ts"
Cohesion: 0.20
Nodes (20): GET(), POST(), requireAdmin(), GET(), POST(), requireAdmin(), RESTORABLE_MODULES, GET() (+12 more)

### Community 9 - "components/BoletasShalomTab.tsx"
Cohesion: 0.13
Nodes (26): BoletasShalomTab(), ShalomFilterBar(), ShalomFilterBarProps, ShalomHeader(), ShalomHeaderProps, ShalomKpiGrid(), ShalomKpiGridProps, ShalomPdfViewerPanel() (+18 more)

### Community 10 - "r2/client.ts"
Cohesion: 0.29
Nodes (9): POST(), SLOTS, dynamic, GET(), getEnv(), getR2Client(), R2_BUCKET_NAME, R2_PUBLIC_DOMAIN (+1 more)

### Community 11 - "components/RotulosA4Tab.tsx"
Cohesion: 0.18
Nodes (22): AmexitoAiRotulosPanel(), AmexitoAiRotulosPanelProps, RotulosA4Tab(), RotulosSheetPreview(), RotulosSheetPreviewProps, RotulosSlotEditor(), RotulosSlotEditorProps, RotulosToolbar() (+14 more)

### Community 12 - "authorizeUser"
Cohesion: 0.19
Nodes (15): POST(), GET(), DELETE(), GET(), PATCH(), GET(), POST(), authorizeUser() (+7 more)

### Community 13 - "dashboard/types.ts"
Cohesion: 0.17
Nodes (23): AnalyticsChartsSection(), AnalyticsChartsSectionProps, DailyTasksSection(), DailyTasksSectionProps, DashboardHeader(), DashboardHeaderProps, DashboardTab(), ExecutiveKpiGrid() (+15 more)

### Community 14 - "test-real-flow.mjs"
Cohesion: 0.11
Nodes (17): batchId, envContent, filesToUpload, keys, r2AccessKey, r2AccountId, r2Root, r2SecretKey (+9 more)

### Community 15 - "components/AdminUsersTab.tsx"
Cohesion: 0.09
Nodes (22): AdminUsersTab(), saveRole(), saveUser(), showToast(), toggleActivo(), AVATAR_GRADS, avatarGrad(), avatarInitials() (+14 more)

### Community 16 - "analyzer.ts"
Cohesion: 0.14
Nodes (23): POST(), POST(), POST(), POST(), analyzeInvoiceDocument(), analyzeShalomBoletaPdf(), DEFAULT_OPENAI_MODEL, DNI_JSON_SCHEMA (+15 more)

### Community 17 - "components/InventoryTab.tsx"
Cohesion: 0.13
Nodes (23): ThermalLabelModal(), Modal(), GestorAlmacenView(), InventoryStatsCards(), InventoryTab(), InventoryTabProps, InventoryTable(), InventoryToolbar() (+15 more)

### Community 18 - "package.json"
Cohesion: 0.09
Nodes (22): eslintConfig, @aws-sdk/client-s3, name, private, version, @aws-sdk/s3-request-presigner, docx, eslint (+14 more)

### Community 19 - "Paquete"
Cohesion: 0.13
Nodes (15): ThermalLabelModalProps, BarcodeBoundingBox, CameraDeviceOption, MobileScannerModalProps, MAX_WIDTH_MAP, LivePackagesStreamProps, GestorAlmacenViewProps, InventoryStatsCardsProps (+7 more)

### Community 20 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 21 - "ui/index.ts"
Cohesion: 0.11
Nodes (21): Badge(), BadgeProps, DOT_MAP, getVariantFromStatus(), VARIANT_MAP, ButtonProps, SIZE_MAP, VARIANT_MAP (+13 more)

### Community 22 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, docx, file-saver, html5-qrcode, jspdf, jszip (+10 more)

### Community 23 - "useInventoryData.ts"
Cohesion: 0.26
Nodes (13): KardexViewProps, EditPositionModalProps, ShelfPositionModalProps, TransferModalProps, inventoryService, BatchShelfData, InventoryStats, SinglePositionData (+5 more)

### Community 25 - "types/index.ts"
Cohesion: 0.10
Nodes (18): InventoryPagination, UseInventoryQueryOptions, BatchStatusModalProps, BoletaShalomInput, DestinoRuta, EmbarqueMaster, EstadoDestinoRuta, EstadoHojaRuta (+10 more)

### Community 26 - "paquetes.schema.ts"
Cohesion: 0.09
Nodes (24): LoginInput, LoginSchema, UserUpdateInput, UserUpdateSchema, CreateInventarioJobInput, CreateInventarioJobSchema, PresignUploadInput, PresignUploadSchema (+16 more)

### Community 27 - "devDependencies"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, eslint-config-next, selfsigned, supabase, tailwindcss, @tailwindcss/postcss, @types/file-saver (+7 more)

### Community 28 - "components/InfoAmexTab.tsx"
Cohesion: 0.32
Nodes (6): InfoAmexTab(), AMEX_INFO_IMAGES, AmexInfoImage, copyImageToClipboard(), copyTextToClipboard(), downloadImage()

### Community 29 - "components/ScannerTab.tsx"
Cohesion: 0.19
Nodes (15): useInventoryData(), MobileScannerModal, ScannerTab(), ScannerTabProps, exportClientesToExcel(), exportCobrosToExcel(), exportEntregasToExcel(), exportHojaDeRutaToExcel() (+7 more)

### Community 30 - "worker/package.json"
Cohesion: 0.17
Nodes (11): dependencies, @aws-sdk/client-s3, description, engines, node, @aws-sdk/client-s3, name, private (+3 more)

### Community 31 - "upload/route.ts"
Cohesion: 0.73
Nodes (8): POST(), buildDniPath(), buildEntregaPath(), buildInvoicePath(), buildManifiestoPath(), buildVoucherPath(), getDateSegments(), sanitizeFileName()

### Community 32 - "What You Must Do When Invoked"
Cohesion: 0.07
Nodes (26): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+18 more)

### Community 33 - "supabase.ts"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 34 - "layout.tsx"
Cohesion: 0.32
Nodes (5): metadata, RootLayout(), viewport, SmoothScrollProvider(), SmoothScrollProviderProps

### Community 35 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, dev:https, lint, local, start, test (+2 more)

### Community 36 - "gen-certs.mjs"
Cohesion: 0.25
Nodes (4): selfsigned, certDir, certPath, keyPath

### Community 37 - "whatsappGenerator.ts"
Cohesion: 0.50
Nodes (3): generateDriverWhatsAppUrl(), sanitizePeruvianPhoneNumber(), WhatsAppMessageParams

### Community 38 - "AmexInventoryProcessor.csproj"
Cohesion: 0.50
Nodes (3): net8.0, DocumentFormat.OpenXml (3.3.0), Microsoft.NET.Sdk

### Community 40 - "vercel.json"
Cohesion: 0.50
Nodes (3): framework, outputDirectory, version

### Community 44 - "cobros/types.ts"
Cohesion: 0.15
Nodes (14): PhotoItem, PhotoViewerModal(), PhotoViewerModalProps, CobrosKpiCardsProps, CobrosList(), CobrosListProps, CobrosToolbarProps, NewVoucherFormProps (+6 more)

### Community 45 - "next"
Cohesion: 0.13
Nodes (13): POST(), cache, checkRateLimit(), lastCleanup, purgeExpired(), rateLimitExceededResponse(), RateLimitOptions, RateLimitRecord (+5 more)

### Community 46 - "CobrosDailySheetView.tsx"
Cohesion: 0.18
Nodes (14): Client360Modal, DirectorioClienteModal(), DirectorioClienteModalContent(), DirectorioClienteModalProps, Clientes360View, DirectorioClientesViewProps, RegistrarCobroDiarioModal(), RegistrarCobroDiarioModalContent() (+6 more)

### Community 47 - "supabase/client.ts"
Cohesion: 0.19
Nodes (13): useCobrosData(), useVoucherForm(), UseVoucherFormProps, CobrosService, AuditLogEntry, registrarAuditoria(), cleanAlphanumeric(), extractDigits() (+5 more)

### Community 48 - "components/DniMatrixTab.tsx"
Cohesion: 0.18
Nodes (14): DniMatrixTab(), DniSlotEditor(), DniSlotsGrid(), DniToolbar(), useDniMatrixState(), DniConfigModal(), DniDeleteConfirmModal(), DniDeleteConfirmModalProps (+6 more)

### Community 49 - "test-daily-tib-flow.mjs"
Cohesion: 0.13
Nodes (9): vitest, write-excel-file, invHeaders, invRows, outDir, envContent, supabase, supabaseKey (+1 more)

### Community 50 - "dni-matrix/types.ts"
Cohesion: 0.24
Nodes (9): DniSlotsGridProps, DniToolbarProps, DniFilterType, DniMatrixTabProps, DniStats, ToastMessage, compressFileForAi(), compressImageForAi() (+1 more)

### Community 51 - "react"
Cohesion: 0.27
Nodes (8): DniSlotEditorProps, UseDniExportProps, DniConfigModalProps, DniLinkClientModalProps, DniPreviewModalProps, DniSlotData, DniPrintSize, react

### Community 52 - "logger"
Cohesion: 0.19
Nodes (4): ApiHandler, LogEntry, logger, LogLevel

### Community 53 - "syncDb.ts"
Cohesion: 0.21
Nodes (13): mapEstadoEntrega(), normalizeKey(), ParsedRow, syncCompletedExcelToDatabase(), SyncDbResult, deleteFileFromR2(), getFileFromR2(), uploadFileToR2() (+5 more)

### Community 54 - "Find Skills"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 55 - "inventario-jobs/route.ts"
Cohesion: 0.26
Nodes (10): GET(), isXlsxKey(), POST(), SOURCE_KEY_FIELD, VALID_SOURCES, DbInventoryOptions, GeneratedInventory, generateInventoryExcelBufferFromDb() (+2 more)

### Community 56 - "components/CobrosTab.tsx"
Cohesion: 0.27
Nodes (8): CobrosDailySheetView(), CobrosTab(), DirectorioClientesTab(), DirectorioClientesTabProps, DirectorioClientesView(), useCobrosOperaciones(), VoucherViewerModal(), CobrosTabProps

### Community 57 - "benchmark-comparativo-completo.mjs"
Cohesion: 0.18
Nodes (9): __dirname, envPath, __filename, r2Root, REAL_FILES, s3, sleep(), supabase (+1 more)

### Community 58 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 59 - "paquetes/route.ts"
Cohesion: 0.54
Nodes (6): GET(), mapPaqueteRow(), POST(), formatZodError(), validateBody(), validateQuery()

### Community 61 - "DniDropzonePanel.tsx"
Cohesion: 0.43
Nodes (5): DniDropzonePanel(), DniDropzonePanelProps, toDisplayAngle(), DniZoomModalProps, ZoomImageState

### Community 62 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 63 - "CobroDeliveryModal.tsx"
Cohesion: 0.47
Nodes (4): CobroDeliveryModal(), CobroDeliveryModalContent(), CobroDeliveryModalProps, TipoRetirante

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

## Knowledge Gaps
- **351 isolated node(s):** `RESTORABLE_MODULES`, `SLOTS`, `VALID_SOURCES`, `SOURCE_KEY_FIELD`, `TibTipo` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 468 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `useCobrosOperaciones.ts`, `docx-exporter.ts`, `components/LiveSheetsTab.tsx`, `DashboardTabContent.tsx`, `app/page.tsx`, `Cliente`, `components/BoletasShalomTab.tsx`, `components/RotulosA4Tab.tsx`, `dashboard/types.ts`, `components/AdminUsersTab.tsx`, `components/InventoryTab.tsx`, `package.json`, `Paquete`, `ui/index.ts`, `useInventoryData.ts`, `types/index.ts`, `components/InfoAmexTab.tsx`, `components/ScannerTab.tsx`, `layout.tsx`, `cobros/types.ts`, `CobrosDailySheetView.tsx`, `supabase/client.ts`, `components/DniMatrixTab.tsx`, `dni-matrix/types.ts`, `components/CobrosTab.tsx`, `DniDropzonePanel.tsx`, `CobroDeliveryModal.tsx`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `layout.tsx`, `DashboardTabContent.tsx`, `app/page.tsx`, `guards.ts`, `r2/client.ts`, `authorizeUser`, `analyzer.ts`, `package.json`, `logger`, `inventario-jobs/route.ts`, `paquetes/route.ts`, `components/ScannerTab.tsx`, `upload/route.ts`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Paquete` connect `Paquete` to `components/LiveSheetsTab.tsx`, `DashboardTabContent.tsx`, `app/page.tsx`, `Cliente`, `cobros/types.ts`, `dashboard/types.ts`, `supabase/client.ts`, `components/InventoryTab.tsx`, `dni-matrix/types.ts`, `react`, `useInventoryData.ts`, `components/CobrosTab.tsx`, `types/index.ts`, `paquetes/route.ts`, `components/ScannerTab.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `RESTORABLE_MODULES`, `SLOTS`, `VALID_SOURCES` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useCobrosOperaciones.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11596638655462185 - nodes in this community are weakly interconnected._
- **Should `Program` be split into smaller, more focused modules?**
  _Cohesion score 0.05639097744360902 - nodes in this community are weakly interconnected._
- **Should `components/LiveSheetsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08198757763975155 - nodes in this community are weakly interconnected._