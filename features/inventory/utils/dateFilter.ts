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

/**
 * Convierte un DateFilterState en límites ISO (fechaDesde, fechaHasta) para consultas SQL.
 */
export function resolveDateFilterRange(
  filter: DateFilterState,
  referenceNow: Date = new Date()
): { fechaDesde: string | null; fechaHasta: string | null } {
  if (filter.type === 'ALL') {
    return { fechaDesde: null, fechaHasta: null };
  }

  const todayStr = toLocalDateString(referenceNow);

  switch (filter.type) {
    case 'TODAY':
      return {
        fechaDesde: `${todayStr}T00:00:00.000Z`,
        fechaHasta: `${todayStr}T23:59:59.999Z`
      };

    case 'YESTERDAY': {
      const yest = new Date(referenceNow);
      yest.setDate(referenceNow.getDate() - 1);
      const yestStr = toLocalDateString(yest);
      return {
        fechaDesde: `${yestStr}T00:00:00.000Z`,
        fechaHasta: `${yestStr}T23:59:59.999Z`
      };
    }

    case 'LAST_7_DAYS': {
      const sevenDaysAgo = new Date(referenceNow);
      sevenDaysAgo.setDate(referenceNow.getDate() - 7);
      const minStr = toLocalDateString(sevenDaysAgo);
      return {
        fechaDesde: `${minStr}T00:00:00.000Z`,
        fechaHasta: `${todayStr}T23:59:59.999Z`
      };
    }

    case 'THIS_MONTH': {
      const y = referenceNow.getFullYear();
      const m = referenceNow.getMonth();
      const firstDay = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDayDate = new Date(y, m + 1, 0);
      const lastDay = toLocalDateString(lastDayDate);
      return {
        fechaDesde: `${firstDay}T00:00:00.000Z`,
        fechaHasta: `${lastDay}T23:59:59.999Z`
      };
    }

    case 'LAST_MONTH': {
      const y = referenceNow.getFullYear();
      const prevMonth = referenceNow.getMonth() - 1;
      const targetDate = new Date(y, prevMonth, 1);
      const ty = targetDate.getFullYear();
      const tm = targetDate.getMonth();
      const firstDay = `${ty}-${String(tm + 1).padStart(2, '0')}-01`;
      const lastDay = toLocalDateString(new Date(ty, tm + 1, 0));
      return {
        fechaDesde: `${firstDay}T00:00:00.000Z`,
        fechaHasta: `${lastDay}T23:59:59.999Z`
      };
    }

    case 'THIS_YEAR': {
      const y = referenceNow.getFullYear();
      return {
        fechaDesde: `${y}-01-01T00:00:00.000Z`,
        fechaHasta: `${y}-12-31T23:59:59.999Z`
      };
    }

    case 'EXACT_DAY': {
      if (!filter.exactDate) return { fechaDesde: null, fechaHasta: null };
      return {
        fechaDesde: `${filter.exactDate}T00:00:00.000Z`,
        fechaHasta: `${filter.exactDate}T23:59:59.999Z`
      };
    }

    case 'MONTH_YEAR': {
      const ty = filter.year || referenceNow.getFullYear();
      const tm = (filter.month || (referenceNow.getMonth() + 1)) - 1;
      const firstDay = `${ty}-${String(tm + 1).padStart(2, '0')}-01`;
      const lastDay = toLocalDateString(new Date(ty, tm + 1, 0));
      return {
        fechaDesde: `${firstDay}T00:00:00.000Z`,
        fechaHasta: `${lastDay}T23:59:59.999Z`
      };
    }

    case 'YEAR': {
      const ty = filter.year || referenceNow.getFullYear();
      return {
        fechaDesde: `${ty}-01-01T00:00:00.000Z`,
        fechaHasta: `${ty}-12-31T23:59:59.999Z`
      };
    }

    case 'CUSTOM_RANGE': {
      const start = filter.startDate?.trim() || '';
      const end = filter.endDate?.trim() || '';
      return {
        fechaDesde: start ? `${start}T00:00:00.000Z` : null,
        fechaHasta: end ? `${end}T23:59:59.999Z` : null
      };
    }

    default:
      return { fechaDesde: null, fechaHasta: null };
  }
}
