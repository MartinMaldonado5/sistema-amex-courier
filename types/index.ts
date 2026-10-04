// Definiciones de tipos en español para AMEX Courier ERP

export type TipoUbicacion = 'AmexLince' | 'Entregado';
export type TipoMetodoEntrega = 'RecojoLince' | 'CarroAmexDomicilio' | 'AgenciaProvincia';
export type TipoEstadoEntrega = 'EnAlmacen' | 'Enviado' | 'Recibido' | 'EnRutaCarroAmex' | 'EntregadoDomicilio' | 'RecogidoAlmacen' | 'ListoParaRecojo' | 'Entregado' | string;
export type TipoEstadoAmex = 'recibido' | 'en_almacen' | 'listo_recojo' | 'en_ruta' | 'entregado' | string;
export type TipoMonedaPago = 'PEN' | 'USD';

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  documentoIdentidad: string;        // DNI / RUC
  telefono?: string;
  email?: string;
  departamento: string;
  provincia: string;
  distrito: string;
  direccionEntrega?: string;
  transportistaPreferido?: string;
  agenciaDestino?: string;
  dniFrontalUrl?: string;
  dniReversoUrl?: string;
  creadoEn: string;
}

export interface Paquete {
  id: string;
  clienteId?: string;
  embarqueId?: string;
  numeroReciboBodega: string;        // Ej: WR000451
  trackingUsa: string;
  tipoEmpaque: string;               // CAJA, SOBRE, SACA
  numeroFactura?: string;
  dniConsignatario?: string;
  nombreConsignatario?: string;
  descripcion: string;
  pesoKg: number;
  valorDeclaradoUsd: number;
  ubicacionActual: TipoUbicacion;
  anaquel?: 'A1' | 'A2' | 'RECEPCION' | 'DESPACHO' | string;
  piso?: 'P1' | 'P2' | 'P3' | 'P4' | string;
  posicionEstante?: string;          // Ej: A1-P1, A1-P2, A1-P3, A1-P4, A2-P1, A2-P2, A2-P3, A2-P4
  metodoEntrega: TipoMetodoEntrega;
  estadoEntrega: TipoEstadoEntrega;  // Estado TIB
  estadoAmex: TipoEstadoAmex;        // Estado Operativo AMEX (por defecto 'recibido' al escanear)
  facturaPdfUrl?: string;
  usuarioEmail?: string;
  creadoPor?: string;
  creadoEn: string;
}

export interface EmbarqueMaster {
  id: string;
  codigoGuiaMaster: string;          // Ej: AMX0000001269
  referenciaSocio?: string;          // Ej: WR-TIB-8812
  almacenOrigen: string;
  almacenDestino: string;
  despachadoMiamiEn: string;
  recibidoPeruEn?: string;
  estado: 'EN_TRANSITO' | 'RECIBIDO_PERU' | 'COMPLETADO';
  notas?: string;
  creadoEn: string;
}

export interface OrdenLiquidacion {
  id: string;
  paqueteId: string;
  nombreCliente: string;
  montoFleteUsd: number;
  cargoAdminUsd: number;
  montoTotalUsd: number;
  montoPagado: number;
  monedaPago: TipoMonedaPago;
  metodoPago?: string;
  referenciaPago?: string;
  comprobantePagoUrl?: string;
  estaPagado: boolean;
  pagadoEn?: string;
  creadoEn: string;
}

export interface HistorialTrazabilidad {
  id: string;
  paqueteId: string;
  ubicacion: string;
  descripcionEvento: string;
  usuarioOperador?: string;
  fechaHora: string;
}

export interface UsuarioSession {
  id: string;
  usuario: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  permisosPersonalizados?: string;
  activo: boolean;
}

export interface AlmacenSede {
  id: string;
  codigo: string;                    // MIA, LIN, TGO
  nombre: string;
  tipo?: string;                     // HUB_INTERNACIONAL, CENTRAL_DISTRIBUCION, SUCURSAL_REGIONAL
  direccion?: string;
  ciudad?: string;
  pais?: string;
  esActivo: boolean;
  creadoEn?: string;
}

export interface EstanteriaPosicion {
  id: string;
  almacenId: string;
  codigoEstante: string;             // A1, A2, A3, REC, DSP
  nivelPiso: string;                 // P1, P2, P3, P4
  codigoPosicion: string;            // A1-P1, A1-P2, A2-P1...
  zonaTipo: string;                  // ALMACENAJE, RECEPCION, DESPACHO, DEVOLUCION
  capacidadMaxPaquetes: number;
  pesoMaxKg: number;
  descripcion?: string;
  creadoEn?: string;
}

export interface MovimientoKardex {
  id: string;
  paqueteId?: string;
  codigoPaquete: string;             // WR000451
  consignatario?: string;
  origenDescripcion: string;
  destinoDescripcion: string;
  tipoMovimiento: string;            // RECEPCION, SLOTTING, REUBICACION, DESPACHO, ENTREGA
  motivo?: string;
  usuarioOperador: string;
  usuarioEmail?: string;
  usuarioId?: string;
  creadoEn: string;
}

export interface ScannedLog {
  id: string;
  code: string;
  format: string;
  time: string;
  timestamp: number;
  location?: string;
  anaquel?: string;
  piso?: string;
  workflow?: 'slotting' | 'lookup' | 'delivery' | 'general';
  nombreConsignatario?: string;
  operadorEmail?: string;
  operadorNombre?: string;
  synced: boolean;
  syncedAt?: string;
}

export type TipoEstadoPicking = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'DESPACHADO';

export interface OrdenPicking {
  id: string;
  codigoOrden: string;               // Ej: PCK-SHALOM-20260824-001
  transportistaAgencia: string;      // SHALOM, OLVA COURIER, MARVISUR, CARRO AMEX
  destinoCiudad: string;
  estado: TipoEstadoPicking;
  operadorAsignado: string;
  totalPaquetes: number;
  recolectadosPaquetes: number;
  notas?: string;
  creadoPor: string;
  creadoEn: string;
  completadoEn?: string;
}

export interface ItemPicking {
  id: string;
  ordenPickingId: string;
  paqueteId?: string;
  codigoReciboBodega: string;        // Ej: WR000451
  trackingUsa?: string;
  consignatario?: string;
  dniConsignatario?: string;
  telefonoConsignatario?: string;
  ciudadDestino?: string;
  direccionDestino?: string;
  ubicacionAnaquel: string;          // Ej: A1-P2
  estadoItem: 'PENDIENTE' | 'RECOLECTADO';
  recolectadoEn?: string;
  recolectadoPor?: string;
  pesoKg: number;
  creadoEn?: string;
}

export interface OrdenEntrega {
  id: string;
  codigo_entrega: string;
  tipo_entrega: string;
  cliente_id?: string;
  cliente_nombre: string;
  cliente_documento?: string;
  receptor_nombre?: string;
  receptor_documento?: string;
  receptor_parentesco?: string;
  operador_asignado: string;
  estado: 'PENDIENTE_BUSQUEDA' | 'EN_BUSQUEDA' | 'LISTO_ENTREGA' | 'ENTREGADO';
  total_paquetes: number;
  paquetes_data: Array<{
    id?: string;
    numeroReciboBodega: string;
    posicionEstante?: string;
    pesoKg?: number;
    descripcion?: string;
    encontrado?: boolean;
  }>;
  fotos_evidencia: Array<{
    url: string;
    key?: string;
    fileName?: string;
    fecha?: string;
  }>;
  notas?: string;
  creado_en: string;
  entregado_en?: string;
}

export interface CobroVoucher {
  id: string;
  codigo_cobro: string;
  cliente_id?: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  monto: number;
  moneda: 'PEN' | 'USD';
  metodo_pago: 'YAPE' | 'PLIN' | 'BCP' | 'INTERBANK' | 'BBVA' | 'EFECTIVO' | 'OTRO';
  numero_operacion?: string;
  fecha_operacion?: string;
  voucher_url: string;
  voucher_key?: string;
  paquetes_wrs: Array<{
    id?: string;
    numeroReciboBodega: string;
    pesoKg?: number;
    descripcion?: string;
  }>;
  estado: 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';
  registrado_por: string;
  validado_por?: string;
  notas?: string;
  creado_en: string;
  validado_en?: string;
}
export type TipoProcesoCotejo =
  | 'RECEPCION_GENERAL'
  | 'RECEPCION_LINCE'
  | 'DESPACHO_RUTA'
  | 'INVENTARIO_ANAQUEL'
  | 'AUDITORIA'
  | 'OTRO';

export type TipoEstadoItemCotejo = 'PENDIENTE' | 'ESCANEADO' | 'NO_LISTADO' | 'OBSERVADO';

export interface HojaCotejo {
  id: string;
  libroId?: string | null;
  nombreHoja?: string | null;
  titulo: string;
  descripcion?: string;
  tipoProceso: TipoProcesoCotejo;
  estado: 'EN_PROCESO' | 'COMPLETADO' | 'ARCHIVADO' | 'ACTIVA';
  sedeId?: string;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  totalItems?: number;
  escaneadosCount?: number;
  noListadosCount?: number;
}

export interface ItemCotejo {
  id: string;
  hojaId: string;
  codigoWr: string;
  trackingUsa?: string;
  casillero?: string;
  consignatario?: string;
  pesoKg?: number;
  posicionEstante?: string;
  notas?: string;
  estado: TipoEstadoItemCotejo;
  escaneadoEn?: string;
  escaneadoPor?: string;
  vecesEscaneado: number;
  orden: number;
  creadoEn: string;
  actualizadoEn: string;
  // UI helper fields
  isJustScanned?: boolean;
  scannedByPeer?: string;
}

export type EstadoHojaRuta = 'PLANIFICADA' | 'EN_RUTA' | 'COMPLETADA' | 'CANCELADA';
export type EstadoDestinoRuta = 'PENDIENTE' | 'ENTREGADO' | 'NO_ATENDIO' | 'REPROGRAMADO';

export interface DestinoRuta {
  id: string;
  hojaRutaId: string;
  orden: number;
  clienteNombre: string;
  telefono: string;
  direccion: string;
  distrito: string;
  referencia?: string;
  codigosWrs: string[]; // List of WR codes: ["WR000451", "WR000452"]
  cantidadPaquetes: number;
  pesoTotalKg?: number;
  montoCobrar?: number;
  monedaCobro?: 'PEN' | 'USD';
  notasChofer?: string;
  estadoEntrega: EstadoDestinoRuta;
  entregadoEn?: string;
  observacionEntrega?: string;
}

export interface HojaRuta {
  id: string;
  codigoRuta: string;
  fechaRuta: string; // YYYY-MM-DD
  choferNombre: string;
  choferTelefono?: string;
  vehiculoPlaca: string;
  zonaSector: string;
  estado: EstadoHojaRuta;
  totalDestinos: number;
  totalPaquetes: number;
  montoTotalCobrar?: number;
  destinos?: DestinoRuta[];
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ==========================================
// Módulo 10: Boletas / Tickets de Shalom
// ==========================================
export type ModalidadPagoShalom = 'PAGO_DESTINO' | 'PAGADO' | 'CREDITO' | 'Pendiente de Pago' | string;

export interface BoletaShalom {
  id: string;
  // 13 Campos Esenciales Normalizados
  nro_orden?: string;             // Ej: 95294190
  codigo?: string;                // Ej: 7HH7
  fecha_emision: string;          // YYYY-MM-DD
  destinatario_nombre: string;    // Nombre / Razón Social
  destinatario_dni?: string;      // DNI / RUC Destinatario
  destinatario_telefono?: string; // Celular / Teléfono Destinatario
  destino: string;                // Dirección o ciudad destino
  tipo_entrega?: string;          // Ej: ENTREGAR EN AGENCIA o DOMICILIO
  forma_pago?: string;            // Ej: Pendiente de Pago, Cancelado
  descripcion?: string;           // Ej: BULTO, PAQUETE
  cantidad?: number;              // Ej: 1
  peso?: number;                  // Ej: 0.120 kg
  monto_total: number;            // Monto en Soles (PEN)
  // Storage & Cloudflare R2
  pdf_url: string;
  r2_key: string;
  // Gobernanza y Auditoría
  creado_por?: string;
  creado_en?: string;
  actualizado_en?: string;
  eliminado_en?: string | null;
  eliminado_por?: string | null;
  motivo_eliminacion?: string | null;
  // Retrocompatibilidad
  numero_guia?: string;
  codigo_seguimiento?: string;
  modalidad_pago?: ModalidadPagoShalom;
  agencia_destino?: string;
  destinatario_documento?: string;
  contenido_bultos?: string;
  peso_total?: number;
  storage_path?: string;
  hora_emision?: string;
  fecha_traslado?: string;
  origen?: string;
  remitente_nombre?: string;
  remitente_dni?: string;
  remitente_telefono?: string;
  unidad_medida?: string;
  observaciones?: string;
  moneda?: string;
  estado_envio?: string;
  archivo_nombre_original?: string;
  metadatos_ocr?: Record<string, any>;
}

export interface BoletaShalomInput {
  // 13 Campos Esenciales Normalizados
  nro_orden?: string;
  codigo?: string;
  fecha_emision: string;
  destinatario_nombre: string;
  destinatario_dni?: string;
  destinatario_telefono?: string;
  destino: string;
  tipo_entrega?: string;
  forma_pago?: string;
  descripcion?: string;
  cantidad?: number;
  peso?: number;
  monto_total: number;
  pdf_url: string;
  r2_key?: string;
  // Retrocompatibilidad
  numero_guia?: string;
  codigo_seguimiento?: string;
  modalidad_pago?: ModalidadPagoShalom;
  agencia_destino?: string;
  destinatario_documento?: string;
  contenido_bultos?: string;
  peso_total?: number;
  storage_path?: string;
  hora_emision?: string;
  fecha_traslado?: string;
  origen?: string;
  remitente_nombre?: string;
  remitente_dni?: string;
  remitente_telefono?: string;
  unidad_medida?: string;
  observaciones?: string;
  moneda?: string;
  archivo_nombre_original?: string;
  metadatos_ocr?: Record<string, any>;
}

export interface FiltrosBoletaShalom {
  q?: string;
  year?: string;
  month?: string;
  day?: string;
  destino?: string;
  modalidad?: string;
  page?: number;
  limit?: number;
}
