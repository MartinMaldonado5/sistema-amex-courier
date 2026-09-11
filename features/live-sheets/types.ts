import {
  HojaCotejo,
  ItemCotejo,
  Paquete,
  Cliente,
  TipoProcesoCotejo,
  TipoEstadoItemCotejo
} from '@/types';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  isCurrent?: boolean;
  activeCell?: string;
  lastSeen?: string;
}

export const ANIMAL_ALIASES = [
  'Lince Veloz',
  'Halcón Expreso',
  'Puma Ágil',
  'Tigre Veloz',
  'Cóndor Andino',
  'Jaguar Dorado',
  'Gaviota Postal',
  'Lobo Nocturno',
  'Águila Real',
  'Pantera Negra',
  'Guepardo Flash',
  'Halcón Peregrino'
];

export const AVATAR_COLORS = [
  '#1a73e8', // Azul Google
  '#9333ea', // Morado Real
  '#059669', // Esmeralda
  '#d97706', // Ámbar / Dorado
  '#dc2626', // Rojo Rubí
  '#0891b2', // Cian WMS
  '#4f46e5', // Índigo
  '#db2777', // Magenta
  '#0d9488'  // Verde Turquesa
];

export interface SheetRow {
  id: string;
  nombre: string;
  codigoWarehouse: string;
  codigoTib: string;
  codigoEscaneado: string;
  estado: 'ENCONTRADO' | 'NO ENCONTRADO' | 'PENDIENTE' | '';
  nombreEscaneado: string;
  isSeparator?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  isManifestFound?: boolean;
  itemRef?: ItemCotejo;
  rawIndex?: number;
}

export interface ActiveCell {
  col: string;
  row: number;
  val: string;
  itemId?: string;
}

export interface EditingCell {
  col: string;
  row: number;
  itemId?: string;
}

export interface LiveSheetsTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  onViewPdf?: (url: string) => void;
  currentUser?: { nombre: string; rol: string } | null;
}

export interface SheetStats {
  total: number;
  encontrados: number;
  noEncontrados: number;
  pendientes: number;
  progreso: number;
}
