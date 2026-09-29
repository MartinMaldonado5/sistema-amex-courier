import { BoletaShalom, ModalidadPagoShalom } from '@/types';

export interface StatsState {
  totalHoy: number;
  totalMes: number;
  montoTotalMes: number;
  destinosPopulares: { nombre: string; cantidad: number }[];
}

export interface FormFields {
  nro_orden: string;
  codigo: string;
  fecha_emision: string;
  destinatario_nombre: string;
  destinatario_dni: string;
  destinatario_telefono: string;
  destino: string;
  tipo_entrega: string;
  forma_pago: string;
  descripcion: string;
  cantidad: number;
  peso: number;
  monto_total: number;
  // Retrocompatibilidad
  numero_guia?: string;
  codigo_seguimiento?: string;
  destinatario_documento?: string;
  agencia_destino?: string;
  modalidad_pago?: ModalidadPagoShalom;
  contenido_bultos?: string;
  peso_total?: number;
}

export const DEFAULT_FORM: FormFields = {
  nro_orden: '',
  codigo: '',
  fecha_emision: new Date().toISOString().split('T')[0],
  destinatario_nombre: '',
  destinatario_dni: '',
  destinatario_telefono: '',
  destino: '',
  tipo_entrega: 'ENTREGAR EN AGENCIA',
  forma_pago: 'Pendiente de Pago',
  descripcion: 'BULTO',
  cantidad: 1,
  peso: 0,
  monto_total: 0,
  numero_guia: '',
  codigo_seguimiento: '',
  agencia_destino: 'ENTREGAR EN AGENCIA',
  modalidad_pago: 'PAGO_DESTINO',
  contenido_bultos: 'BULTO',
  peso_total: 0
};

export type UploadStage = 'DROPZONE' | 'ANALYZING' | 'REVIEW';
