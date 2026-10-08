import { DateFilterState } from '../types';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export const initialDateFilter: DateFilterState = {
  type: 'ALL',
  exactDate: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  startDate: '',
  endDate: ''
};

/**
 * Convierte un objeto Date a string local 'YYYY-MM-DD'
 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Evalúa si la fecha ISO de un paquete cumple con el filtro de fecha configurado.
 */
export function isPackageInDateFilter(
  pkgDateIso: string | undefined | null,
  filter: DateFilterState,
  referenceNow: Date = new Date()
): boolean {
  if (filter.type === 'ALL') {
    return true;
  }

  if (!pkgDateIso) {
    return false;
  }

  const itemDate = new Date(pkgDateIso);
  if (isNaN(itemDate.getTime())) {
    return false;
  }

  const pkgYear = itemDate.getFullYear();
  const pkgMonth = itemDate.getMonth() + 1;
  const pkgDateStr = toLocalDateString(itemDate);

  const todayStr = toLocalDateString(referenceNow);

  switch (filter.type) {
    case 'TODAY':
      return pkgDateStr === todayStr;

    case 'YESTERDAY': {
      const yest = new Date(referenceNow);
      yest.setDate(referenceNow.getDate() - 1);
      return pkgDateStr === toLocalDateString(yest);
    }

    case 'LAST_7_DAYS': {
      const sevenDaysAgo = new Date(referenceNow);
      sevenDaysAgo.setDate(referenceNow.getDate() - 7);
      const minStr = toLocalDateString(sevenDaysAgo);
      return pkgDateStr >= minStr && pkgDateStr <= todayStr;
    }

    case 'THIS_MONTH':
      return pkgYear === referenceNow.getFullYear() && pkgMonth === referenceNow.getMonth() + 1;

    case 'LAST_MONTH': {
      const prevDate = new Date(referenceNow.getFullYear(), referenceNow.getMonth() - 1, 1);
      return pkgYear === prevDate.getFullYear() && pkgMonth === prevDate.getMonth() + 1;
    }

    case 'THIS_YEAR':
      return pkgYear === referenceNow.getFullYear();

    case 'EXACT_DAY':
      if (!filter.exactDate) return true;
      return pkgDateStr === filter.exactDate;

    case 'MONTH_YEAR': {
      const targetMonth = filter.month || referenceNow.getMonth() + 1;
      const targetYear = filter.year || referenceNow.getFullYear();
      return pkgMonth === targetMonth && pkgYear === targetYear;
    }

    case 'YEAR': {
      const targetYear = filter.year || referenceNow.getFullYear();
      return pkgYear === targetYear;
    }

    case 'CUSTOM_RANGE': {
      const start = filter.startDate?.trim() || '';
      const end = filter.endDate?.trim() || '';
      if (start && pkgDateStr < start) return false;
      if (end && pkgDateStr > end) return false;
      return true;
    }

    default:
      return true;
  }
}

/**
 * Devuelve una etiqueta legible del filtro de fecha actual.
 */
export function getDateFilterSummary(filter: DateFilterState): string {
  switch (filter.type) {
    case 'ALL':
      return 'Todas las fechas';
    case 'TODAY':
      return 'Hoy';
    case 'YESTERDAY':
      return 'Ayer';
    case 'LAST_7_DAYS':
      return 'Últimos 7 días';
    case 'THIS_MONTH':
      return 'Este Mes';
    case 'LAST_MONTH':
      return 'Mes Pasado';
    case 'THIS_YEAR':
      return 'Este Año';
    case 'EXACT_DAY':
      return filter.exactDate ? `Día: ${filter.exactDate}` : 'Día Específico';
    case 'MONTH_YEAR': {
      const mIdx = (filter.month || 1) - 1;
      const mName = MONTH_NAMES[mIdx] || '';
      return `${mName} ${filter.year || ''}`;
    }
    case 'YEAR':
      return `Año ${filter.year || ''}`;
    case 'CUSTOM_RANGE':
      if (filter.startDate && filter.endDate) {
        return `${filter.startDate} al ${filter.endDate}`;
      } else if (filter.startDate) {
        return `Desde ${filter.startDate}`;
      } else if (filter.endDate) {
        return `Hasta ${filter.endDate}`;
      }
      return 'Rango Personalizado';
    default:
      return 'Filtro de Fecha';
  }
}
