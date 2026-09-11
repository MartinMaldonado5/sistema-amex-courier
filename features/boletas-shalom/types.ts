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
  hora_emision: string;
  fecha_traslado: string;
  origen: string;
  destino: string;
  remitente_nombre: string;
  remitente_dni: string;
  remitente_telefono: string;
  destinatario_nombre: string;
  destinatario_dni: string;
  destinatario_telefono: string;
  tipo_entrega: string;
  forma_pago: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  peso: number;
  observaciones: string;
  monto_total: number;
  moneda: string;
  // retrocompatibilidad
  numero_guia?: string;
  codigo_seguimiento?: string;
  remitente_documento?: string;
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
  hora_emision: '',
  fecha_traslado: new Date().toISOString().split('T')[0],
  origen: 'AV. CORONEL JOSÉ LEAL 648, URB. FUNDO LOBATÓN, LINCE - LIMA',
  destino: '',
  remitente_nombre: 'QUINTANA CORNEJO BLANCA ESTHER',
  remitente_dni: '06779177',
  remitente_telefono: '982400043',
  destinatario_nombre: '',
  destinatario_dni: '',
  destinatario_telefono: '',
  tipo_entrega: 'ENTREGAR EN AGENCIA',
  forma_pago: 'Pendiente de Pago',
  descripcion: 'BULTO',
  cantidad: 1,
  unidad_medida: 'Volumen',
  peso: 0,
  observaciones: '',
  monto_total: 0,
  moneda: 'PEN',
  numero_guia: '',
  codigo_seguimiento: '',
  agencia_destino: 'ENTREGAR EN AGENCIA',
  modalidad_pago: 'PAGO_DESTINO',
  contenido_bultos: 'BULTO',
  peso_total: 0
};

export type UploadStage = 'DROPZONE' | 'ANALYZING' | 'REVIEW';
