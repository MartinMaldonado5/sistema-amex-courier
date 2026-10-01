import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  cleanAlphanumeric,
  stripLeadingZeros,
  matchesFuzzySearch,
} from '@/lib/fuzzySearch';

describe('Fuzzy Search — Motor de Búsqueda Inteligente', () => {
  it('debe normalizar texto eliminando tildes y mayúsculas', () => {
    expect(normalizeText('Ángel Ramón PÉREZ')).toBe('angel ramon perez');
  });

  it('debe limpiar caracteres alfanuméricos ignorando guiones y espacios', () => {
    expect(cleanAlphanumeric('WR-0010452 / A1-P2')).toBe('wr0010452a1p2');
  });

  it('debe remover ceros a la izquierda para comparaciones numéricas', () => {
    expect(stripLeadingZeros('WR-000451')).toBe('451');
  });

  it('debe encontrar coincidencias parciales con matchesFuzzySearch', () => {
    const fields = ['WR-000448379', 'CARLOS GONZALEZ', '72345678', '1Z9999999999999999'];

    // Búsqueda por número sin ceros
    expect(matchesFuzzySearch('448379', fields)).toBe(true);

    // Búsqueda por apellido sin tilde
    expect(matchesFuzzySearch('gonzalez', fields)).toBe(true);

    // Búsqueda multi-término
    expect(matchesFuzzySearch('carlos 448379', fields)).toBe(true);

    // Búsqueda por DNI
    expect(matchesFuzzySearch('72345678', fields)).toBe(true);

    // Búsqueda no coincidente
    expect(matchesFuzzySearch('rodriguez', fields)).toBe(false);
  });
});
