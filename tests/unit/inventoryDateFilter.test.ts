import { describe, it, expect } from 'vitest';
import {
  isPackageInDateFilter,
  getDateFilterSummary,
  toLocalDateString,
  MONTH_NAMES,
  resolveDateFilterRange
} from '@/features/inventory/utils/dateFilter';
import { DateFilterState } from '@/features/inventory/types';

describe('Inventory Date Filter Utilities', () => {
  // Fecha fija de referencia para pruebas: 2026-10-08 14:00:00 (Local)
  const referenceNow = new Date('2026-10-08T14:00:00');

  const pkgToday = '2026-10-08T10:30:00';
  const pkgYesterday = '2026-10-07T18:00:00';
  const pkg5DaysAgo = '2026-10-03T12:00:00';
  const pkg15DaysAgo = '2026-09-23T08:00:00'; // Mes pasado (Septiembre)
  const pkgLastYear = '2025-10-08T10:00:00';

  it('correctly formats local date string YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 8); // Mes 9 es Octubre
    expect(toLocalDateString(d)).toBe('2026-10-08');
  });

  it('mode ALL returns true for any valid or missing date', () => {
    const filter: DateFilterState = { type: 'ALL' };
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(undefined, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(null, filter, referenceNow)).toBe(true);
  });

  it('mode TODAY matches only packages created today', () => {
    const filter: DateFilterState = { type: 'TODAY' };
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgYesterday, filter, referenceNow)).toBe(false);
    expect(isPackageInDateFilter(pkg5DaysAgo, filter, referenceNow)).toBe(false);
  });

  it('mode YESTERDAY matches packages created yesterday', () => {
    const filter: DateFilterState = { type: 'YESTERDAY' };
    expect(isPackageInDateFilter(pkgYesterday, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(false);
  });

  it('mode LAST_7_DAYS matches packages within 7 days', () => {
    const filter: DateFilterState = { type: 'LAST_7_DAYS' };
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgYesterday, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkg5DaysAgo, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkg15DaysAgo, filter, referenceNow)).toBe(false);
  });

  it('mode THIS_MONTH and LAST_MONTH match the respective months', () => {
    const thisMonthFilter: DateFilterState = { type: 'THIS_MONTH' };
    expect(isPackageInDateFilter(pkgToday, thisMonthFilter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkg5DaysAgo, thisMonthFilter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkg15DaysAgo, thisMonthFilter, referenceNow)).toBe(false); // Septiembre

    const lastMonthFilter: DateFilterState = { type: 'LAST_MONTH' };
    expect(isPackageInDateFilter(pkg15DaysAgo, lastMonthFilter, referenceNow)).toBe(true); // Septiembre
    expect(isPackageInDateFilter(pkgToday, lastMonthFilter, referenceNow)).toBe(false);
  });

  it('mode THIS_YEAR and YEAR match the year correctly', () => {
    const thisYearFilter: DateFilterState = { type: 'THIS_YEAR' };
    expect(isPackageInDateFilter(pkgToday, thisYearFilter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgLastYear, thisYearFilter, referenceNow)).toBe(false);

    const yearFilter: DateFilterState = { type: 'YEAR', year: 2025 };
    expect(isPackageInDateFilter(pkgLastYear, yearFilter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgToday, yearFilter, referenceNow)).toBe(false);
  });

  it('mode EXACT_DAY matches specific date', () => {
    const filter: DateFilterState = { type: 'EXACT_DAY', exactDate: '2026-10-03' };
    expect(isPackageInDateFilter(pkg5DaysAgo, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(false);
  });

  it('mode MONTH_YEAR matches specific month and year', () => {
    const filter: DateFilterState = { type: 'MONTH_YEAR', month: 9, year: 2026 }; // Septiembre 2026
    expect(isPackageInDateFilter(pkg15DaysAgo, filter, referenceNow)).toBe(true);
    expect(isPackageInDateFilter(pkgToday, filter, referenceNow)).toBe(false);
  });

  it('mode CUSTOM_RANGE filters accurately by start and end dates', () => {
    const rangeFilter: DateFilterState = {
      type: 'CUSTOM_RANGE',
      startDate: '2026-10-01',
      endDate: '2026-10-05'
    };
    expect(isPackageInDateFilter(pkg5DaysAgo, rangeFilter, referenceNow)).toBe(true); // Oct 3
    expect(isPackageInDateFilter(pkgToday, rangeFilter, referenceNow)).toBe(false); // Oct 8 (fuera de rango)
    expect(isPackageInDateFilter(pkg15DaysAgo, rangeFilter, referenceNow)).toBe(false); // Sep 23 (antes de rango)
  });

  it('generates readable summaries', () => {
    expect(getDateFilterSummary({ type: 'ALL' })).toBe('Todas las fechas');
    expect(getDateFilterSummary({ type: 'TODAY' })).toBe('Hoy');
    expect(getDateFilterSummary({ type: 'LAST_7_DAYS' })).toBe('Últimos 7 días');
    expect(getDateFilterSummary({ type: 'EXACT_DAY', exactDate: '2026-10-08' })).toBe('Día: 2026-10-08');
    expect(getDateFilterSummary({ type: 'MONTH_YEAR', month: 10, year: 2026 })).toBe('Octubre 2026');
    expect(getDateFilterSummary({ type: 'CUSTOM_RANGE', startDate: '2026-10-01', endDate: '2026-10-08' })).toBe(
      '2026-10-01 al 2026-10-08'
    );
  });

  it('resolveDateFilterRange converts filter state into valid ISO SQL boundaries', () => {
    expect(resolveDateFilterRange({ type: 'ALL' }, referenceNow)).toEqual({
      fechaDesde: null,
      fechaHasta: null
    });

    expect(resolveDateFilterRange({ type: 'TODAY' }, referenceNow)).toEqual({
      fechaDesde: '2026-10-08T00:00:00.000Z',
      fechaHasta: '2026-10-08T23:59:59.999Z'
    });

    expect(resolveDateFilterRange({ type: 'EXACT_DAY', exactDate: '2026-10-03' }, referenceNow)).toEqual({
      fechaDesde: '2026-10-03T00:00:00.000Z',
      fechaHasta: '2026-10-03T23:59:59.999Z'
    });

    expect(
      resolveDateFilterRange(
        { type: 'CUSTOM_RANGE', startDate: '2026-10-01', endDate: '2026-10-15' },
        referenceNow
      )
    ).toEqual({
      fechaDesde: '2026-10-01T00:00:00.000Z',
      fechaHasta: '2026-10-15T23:59:59.999Z'
    });
  });
});
