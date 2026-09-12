import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';

export type { RotuloSlotData };

export const MAX_SHEETS = 5;

export interface AgencyOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  badgeClass: string;
  color: string;
}

export const AVAILABLE_AGENCIES: AgencyOption[] = [
  {
    id: 'SHALOM',
    name: 'SHALOM',
    subtitle: 'Envíos y encomiendas a nivel nacional',
    icon: 'fa-solid fa-truck-fast',
    badgeClass: 'shalom',
    color: '#dc2626'
  },
  {
    id: 'OLVA',
    name: 'OLVA COURIER',
    subtitle: 'Entregas a agencias y domicilio',
    icon: 'fa-solid fa-box',
    badgeClass: 'olva',
    color: '#eab308'
  },
  {
    id: 'CRUZ DEL SUR',
    name: 'CRUZ DEL SUR',
    subtitle: 'Cruz del Sur Cargo y encomiendas',
    icon: 'fa-solid fa-bus',
    badgeClass: 'cruz',
    color: '#1e40af'
  },
  {
    id: 'OTRA',
    name: 'OTRA AGENCIA...',
    subtitle: 'Escribir nombre personalizado',
    icon: 'fa-solid fa-pen-to-square',
    badgeClass: 'otra',
    color: '#6366f1'
  }
];

export const DEFAULT_SLOTS: RotuloSlotData[] = [
  {
    id: 1,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  },
  {
    id: 2,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  },
  {
    id: 3,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  },
  {
    id: 4,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  },
  {
    id: 5,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  }
];

export function generarTextoBulto(
  numeroRotulo: number,
  totalRots: number,
  totalCjs: string | number
): string {
  const safeTotalRots = Math.max(1, Number(totalRots) || 1);
  const safeNumRot = Math.min(Math.max(1, Number(numeroRotulo) || 1), safeTotalRots);
  const rotText = `RÓTULO ${safeNumRot} DE ${safeTotalRots}`;
  if (!totalCjs || String(totalCjs).trim() === '') {
    return rotText;
  }
  const cjsNum = String(totalCjs).trim();
  const cjasWord = Number(cjsNum) === 1 ? 'CAJA' : 'CAJAS';
  return `${rotText} • TOTAL: ${cjsNum} ${cjasWord}`;
}

export function getAgencyClass(agencia: string): string {
  switch (agencia) {
    case 'SHALOM': return 'shalom';
    case 'CRUZ DEL SUR': return 'cruz';
    case 'OLVA': return 'olva';
    case 'MARVISUR': return 'marvisur';
    case 'MÓVIL BUS': return 'movil';
    case 'FLORES': return 'flores';
    case 'CIVA': return 'civa';
    case 'ANTEZANA': return 'antezana';
    default: return 'otra';
  }
}
