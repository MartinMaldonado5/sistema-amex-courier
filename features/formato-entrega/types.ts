export type LogoStyle = 'original' | 'clean' | 'badge';

export interface ActaEntregaData {
  id?: string;
  fecha: string;
  remitente: string;
  destinatario: string;
  paquetes: string[];
  cargoTexto: string;
  recibidoPorNombre: string;
  recibidoPorFecha: string;
  recibidoPorHora: string;
  logoStyle?: LogoStyle;
  notas?: string;
}

export interface ActaHistorialItem extends ActaEntregaData {
  id: string;
  creadoEn: string;
}

export const DEFAULT_ACTA_DATA: ActaEntregaData = {
  fecha: '',
  remitente: 'AMEX COURRIER',
  destinatario: '',
  paquetes: [
    'WR000459980',
    'WR000459791',
    'WR000459496',
    'WR000459274',
    'WR000458376',
    'WR000459957',
    'WR000459942',
    'WR000458494'
  ],
  cargoTexto: 'Certifico que he recibido el(los) paquete(s) indicado(s) Anteriormente en buen estado y conforme a lo descrito.',
  recibidoPorNombre: '',
  recibidoPorFecha: '',
  recibidoPorHora: '',
  logoStyle: 'clean',
  notas: ''
};
