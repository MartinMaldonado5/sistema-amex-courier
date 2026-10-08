import { Paquete, Cliente, TipoUbicacion, EstanteriaPosicion, MovimientoKardex, AlmacenSede, TipoEstadoEntrega } from '@/types';

export interface BatchShelfData {
  almacenCodigo: string;
  codigoEstante: string;
  cantidadPisos: number;
  capacidadPorPiso: number;
  pesoPorPiso: number;
  zonaTipo: string;
  descripcion: string;
}

export interface SinglePositionData {
  almacenCodigo: string;
  codigoEstante: string;
  nivelPiso: string;
  zonaTipo: string;
  capacidadMaxPaquetes: number;
  pesoMaxKg: number;
  descripcion: string;
}

export interface TransferFormData {
  targetUbicacion: TipoUbicacion;
  targetAnaquel: string;
  targetPiso: string;
  motivo: string;
  operador: string;
}

export interface InventoryStats {
  total: number;
  enAlmacen: number;
  enRuta: number;
  entregados: number;
  listosRecojo: number;
  pesoTotalKg: number;
}

export type DateFilterType =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_YEAR'
  | 'EXACT_DAY'
  | 'MONTH_YEAR'
  | 'YEAR'
  | 'CUSTOM_RANGE';

export interface DateFilterState {
  type: DateFilterType;
  exactDate?: string; // YYYY-MM-DD
  month?: number; // 1-12
  year?: number; // YYYY
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}
