import { Paquete, Cliente } from '@/types';

export type { Paquete, Cliente };

export interface CobroVoucher {
  id: string;
  codigo_cobro: string;
  cliente_nombre: string;
  cliente_casillero?: string;
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

export interface CobrosMetrics {
  totalSoles: number;
  totalDolares: number;
  countYape: number;
  countBcp: number;
  countPlin: number;
  countPendientes: number;
  countValidados: number;
  totalVouchers: number;
}

export type CobrosSubtab = 'todos' | 'nuevo' | 'pendientes' | 'validados';

export interface CobrosTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  onUpdatePackage?: (pkg: Paquete) => void;
}

export interface VoucherFormValues {
  clienteNombre: string;
  clienteCasillero: string;
  clienteTelefono: string;
  monto: string;
  moneda: 'PEN' | 'USD';
  metodoPago: CobroVoucher['metodo_pago'];
  numeroOperacion: string;
  fechaOperacion: string;
  wrInput: string;
  notas: string;
}
