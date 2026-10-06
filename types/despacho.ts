/**
 * Tipos para el Módulo de Rutas y Despacho Móvil para Choferes (TMS Última Milla)
 */

export type EstadoRuta = 'BORRADOR' | 'EN_RUTA' | 'COMPLETADO' | 'CANCELADO';
export type EstadoParada = 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'NO_ENTREGADO' | 'REPROGRAMADO';
export type MonedaCobro = 'USD' | 'PEN';

export interface DespachoRuta {
  id: string;
  codigoRuta: string;
  nombreRuta: string;
  fechaDespacho: string;
  choferNombre: string;
  choferTelefono?: string | null;
  vehiculoPlaca?: string | null;
  estado: EstadoRuta;
  totalParadas: number;
  paradasEntregadas: number;
  notas?: string | null;
  creadoPor?: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface DespachoParada {
  id: string;
  rutaId: string;
  orden: number;
  destinatario: string;
  wrBultos: string;
  direccion: string;
  distrito: string;
  telefonoRaw: string;
  telefonoNormalizado: string;
  montoCobro: number;
  monedaCobro: MonedaCobro;
  estado: EstadoParada;
  motivoNoEntrega?: string | null;
  entregadoEn?: string | null;
  fotos?: string[];
  creadoEn: string;
}

export interface DespachoRutaConParadas extends DespachoRuta {
  paradas: DespachoParada[];
}

export interface CrearRutaInput {
  nombreRuta: string;
  choferNombre: string;
  choferTelefono?: string;
  vehiculoPlaca?: string;
  fechaDespacho?: string;
  notas?: string;
}

export interface CrearParadaInput {
  orden?: number;
  destinatario: string;
  wrBultos: string;
  direccion: string;
  distrito: string;
  telefono: string;
  montoCobro?: number;
  monedaCobro?: MonedaCobro;
}
