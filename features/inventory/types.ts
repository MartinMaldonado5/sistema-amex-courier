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
