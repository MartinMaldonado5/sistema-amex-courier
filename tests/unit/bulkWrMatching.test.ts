import { describe, it, expect } from 'vitest';
import { Paquete } from '@/types';

// Función pura de extracción y matching para pruebas unitarias
export function parseAndMatchWrs(rawText: string, paquetes: Partial<Paquete>[]) {
  if (!rawText.trim()) {
    return { parsedCodes: [], matchedPackages: [], missingCodes: [] };
  }

  const rawItems = rawText
    .split(/[\n,;\t]+/)
    .map(item => item.trim())
    .filter(Boolean);

  const uniqueCodes = Array.from(new Set(rawItems.map(c => c.toUpperCase())));

  const matched: Partial<Paquete>[] = [];
  const missing: string[] = [];

  const wrMap = new Map<string, Partial<Paquete>>();
  const trackingMap = new Map<string, Partial<Paquete>>();

  paquetes.forEach(p => {
    if (p.numeroReciboBodega) {
      wrMap.set(p.numeroReciboBodega.trim().toUpperCase(), p);
    }
    if (p.trackingUsa) {
      trackingMap.set(p.trackingUsa.trim().toUpperCase(), p);
    }
  });

  uniqueCodes.forEach(code => {
    let match = wrMap.get(code) || trackingMap.get(code);

    if (!match) {
      const matchingPkg = paquetes.find(
        p =>
          p.numeroReciboBodega?.toUpperCase().includes(code) ||
          p.trackingUsa?.toUpperCase().includes(code)
      );
      if (matchingPkg) {
        match = matchingPkg;
      }
    }

    if (match) {
      if (!matched.some(m => m.id === match!.id)) {
        matched.push(match);
      }
    } else {
      missing.push(code);
    }
  });

  return {
    parsedCodes: uniqueCodes,
    matchedPackages: matched,
    missingCodes: missing
  };
}

describe('Bulk WR Parser & Matcher', () => {
  const samplePackages: Partial<Paquete>[] = [
    { id: '1', numeroReciboBodega: 'WR-1001', trackingUsa: '1Z999AAA', estadoAmex: 'recibido' },
    { id: '2', numeroReciboBodega: 'WR-1002', trackingUsa: 'TBA12345', estadoAmex: 'en_almacen' },
    { id: '3', numeroReciboBodega: 'WR-1003', trackingUsa: '94001000', estadoAmex: 'listo_recojo' }
  ];

  it('correctly matches multiple WRs separated by newlines and commas', () => {
    const input = `WR-1001\nwr-1002, 1Z999AAA`;
    const result = parseAndMatchWrs(input, samplePackages);

    expect(result.parsedCodes).toEqual(['WR-1001', 'WR-1002', '1Z999AAA']);
    expect(result.matchedPackages.length).toBe(2); // WR-1001 and WR-1002 (1Z999AAA points to same WR-1001)
    expect(result.missingCodes.length).toBe(0);
  });

  it('correctly identifies missing codes not in database', () => {
    const input = `WR-1001\nWR-9999\nWR-8888`;
    const result = parseAndMatchWrs(input, samplePackages);

    expect(result.matchedPackages.length).toBe(1);
    expect(result.missingCodes).toEqual(['WR-9999', 'WR-8888']);
  });

  it('matches by partial numbers or tracking codes', () => {
    const input = `TBA12345`;
    const result = parseAndMatchWrs(input, samplePackages);

    expect(result.matchedPackages.length).toBe(1);
    expect(result.matchedPackages[0].id).toBe('2');
  });

  it('handles empty input gracefully', () => {
    const result = parseAndMatchWrs('', samplePackages);
    expect(result.parsedCodes).toEqual([]);
    expect(result.matchedPackages).toEqual([]);
    expect(result.missingCodes).toEqual([]);
  });
});
