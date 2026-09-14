export type EstadoPagoWR = 'PAGADO' | 'FALTA';
export type EstadoEntregaWR = 'EN_ALMACEN' | 'RECOGIDO' | 'ENTREGADO';
export type TipoRetirante = 'TITULAR' | 'FAMILIAR' | 'MOTORIZADO' | 'OTRO';
export type MetodoPagoCobro = 'YAPE' | 'PLIN' | 'BCP' | 'BBVA' | 'INTERBANK' | 'EFECTIVO' | 'OTRO';

export interface RegistroEntrega {
  tipoRetirante: TipoRetirante;
  nombreRetirante: string;
  dniRetirante?: string;
  tipoMotorizado?: 'DIDI' | 'UBER' | 'PEDIDOSYA' | 'PROPIO' | 'OTRO';
  placaVehiculo?: string;
  fechaHoraEntrega: string; // ej: "11/09/2026 15:38"
  registradoPor?: string;
  observaciones?: string;
}

export interface ItemCobroWR {
  id: string;
  wr: string; // ej: "WR000459529"
  trackingUsa?: string; // ej: "1Z2B11530323709731"
  cajaNumero?: string; // ej: "15", "10 Y 13", "CE176A1"
  pesoKg: number;
  precioUsd: number;
  estadoPago: EstadoPagoWR;
  pagadoEn?: string;
  pagoId?: string;
  montoPagadoUsd?: number;
  montoPagadoPen?: number;
  tipoCambioAplicado?: number;
  metodoPago?: MetodoPagoCobro;
  numeroOperacion?: string;
  comprobanteUrl?: string; // URL o DataURL del voucher bancario
  voucherCodigo?: string;
  estadoEntrega: EstadoEntregaWR;
  entregaInfo?: RegistroEntrega;
  consignatarioNombre?: string; // Si pertenece a una cuenta corporativa (ej. Daniel Sanchez dentro de CORP. FRAGMANI)
  notas?: string;
}

export interface VoucherCobroItem {
  id: string;
  codigoCobro: string; // ej: "VOU-20260912-101"
  voucherUrl: string;
  voucherKey?: string;
  metodoPago: MetodoPagoCobro;
  moneda: 'USD' | 'PEN';
  monto: number;
  numeroOperacion?: string;
  fecha: string;
  wrsLiquidados: string[]; // WRs que cubre este comprobante
  registradoPor?: string;
  notas?: string;
}

export interface ClienteCobroLote {
  id: string;
  clienteNombre: string; // ej: "MARYORI", "FLAVIO MENDOZA", "CORP. FRAGMANI"
  esCorporativo?: boolean; // true si es ej: "CLIENTE: CORP. FRAGMANI"
  subConsignatarios?: string[]; // lista de sub-destinatarios si es corporativo
  fechaLote: string; // ej: "COBRO 09.09" o "2026-09-09"
  hojaExcelOrigen?: string; // ej: "COBRO 09.09"
  itemsWR: ItemCobroWR[];
  totalPesoKg: number;
  totalPrecioUsd: number;
  totalPagadoUsd: number;
  totalPendienteUsd: number;
  estadoGlobalPago: 'PAGADO' | 'FALTA' | 'PARCIAL';
  estadoGlobalEntrega: 'EN_ALMACEN' | 'ENTREGADO' | 'PARCIAL';
  observacionesLote?: string;
  comprobanteUrl?: string; // Voucher principal o más reciente
  metodoPago?: MetodoPagoCobro;
  numeroOperacion?: string;
  vouchersList?: VoucherCobroItem[]; // Historial de vouchers vinculados a este cobro diario
  actualizadoEn: string;
}

export interface TransaccionPago {
  id: string;
  codigoPago: string; // ej: "PAG-20260912-001"
  clienteNombre: string;
  fechaPago: string;
  monedaCobrada: 'USD' | 'PEN';
  tipoCambioKambista: number; // ej: 3.765
  montoUsdTotal: number;
  montoPenTotal: number;
  metodoPago: MetodoPagoCobro;
  numeroOperacion?: string;
  comprobanteUrl?: string;
  wrsLiquidados: string[]; // WRs liquidados en este pago
  registradoPor: string;
  notas?: string;
  creadoEn: string;
}

export interface CotizacionKambista {
  compra: number;
  venta: number;
  actualizadoEn: string;
  origen: 'KAMBISTA_LIVE' | 'MANUAL_OPERADOR' | 'DEFAULT';
}

export interface ResumenCliente360 {
  clienteNombre: string;
  esCorporativo: boolean;
  totalWrsHistoricos: number;
  totalFacturadoUsd: number;
  totalPagadoUsd: number;
  deudaPendienteUsd: number;
  totalEntregados: number;
  totalEnAlmacen: number;
  totalPesoHistoricoKg: number;
  tarifaPorKgUsd: number;
  tarifaPersonalizada: boolean;
  lotesHistoricos: string[];
  subConsignatarios?: string[];
  historialWRs: ItemCobroWR[];
  historialPagos: TransaccionPago[];
}

export interface FiltrosCobrosLote {
  fechaLote: string; // "TODOS" o nombre del lote ej: "COBRO 09.09" o fecha específica
  mes?: string; // "TODOS" | "08" | "09" | etc.
  tipoPersona?: 'TODOS' | 'PARTICULAR' | 'CORPORATIVO';
  rangoMonto?: 'TODOS' | 'MENOR_20' | 'ENTRE_20_100' | 'MAYOR_100';
  filtroVoucher?: 'TODOS' | 'CON_VOUCHER' | 'SIN_VOUCHER';
  busqueda: string; // Busca por cliente, sub-consignatario, WR o tracking
  estadoPago: 'TODOS' | 'PAGADO' | 'FALTA' | 'PARCIAL';
  estadoEntrega: 'TODOS' | 'EN_ALMACEN' | 'ENTREGADO' | 'PARCIAL';
  soloCorporativos: boolean;
}
