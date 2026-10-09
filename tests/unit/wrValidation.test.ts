import { describe, it, expect } from 'vitest';
import {
  isValidWr,
  cleanWr,
  getWrValidationError,
  smartFormatWr,
  WR_LENGTH,
  WR_PREFIX
} from '@/lib/validations/wr';

describe('WR Validation & Canonical Rules — Suite de Pruebas', () => {
  it('debe tener las constantes reglamentarias de AMEX', () => {
    expect(WR_LENGTH).toBe(11);
    expect(WR_PREFIX).toBe('WR');
  });

  describe('cleanWr', () => {
    it('debe normalizar a mayúsculas y remover espacios en blanco', () => {
      expect(cleanWr(' wr000474478 ')).toBe('WR000474478');
      expect(cleanWr('Wr 000474478')).toBe('WR000474478');
      expect(cleanWr(null)).toBe('');
      expect(cleanWr(undefined)).toBe('');
    });
  });

  describe('isValidWr', () => {
    it('debe aceptar WRs canónicos válidos de exactamente 11 caracteres', () => {
      expect(isValidWr('WR000474478')).toBe(true);
      expect(isValidWr('wr000474478')).toBe(true);
      expect(isValidWr('Wr000475723')).toBe(true);
      expect(isValidWr('WR000459999')).toBe(true);
    });

    it('debe rechazar WRs con menos o más de 11 caracteres', () => {
      expect(isValidWr('WR123')).toBe(false); // 5 caracteres
      expect(isValidWr('WR00047447')).toBe(false); // 10 caracteres
      expect(isValidWr('WR0004744789')).toBe(false); // 12 caracteres
    });

    it('debe rechazar cadenas que no comiencen por WR', () => {
      expect(isValidWr('AB000474478')).toBe(false);
      expect(isValidWr('12000474478')).toBe(false);
      expect(isValidWr('00047447800')).toBe(false);
    });

    it('debe rechazar caracteres especiales o guiones en el cuerpo del WR', () => {
      expect(isValidWr('WR-00047447')).toBe(false);
      expect(isValidWr('WR 00047447')).toBe(false);
      expect(isValidWr('WR/00047447')).toBe(false);
    });
  });

  describe('getWrValidationError', () => {
    it('debe retornar null para WRs válidos', () => {
      expect(getWrValidationError('WR000474478')).toBeNull();
    });

    it('debe explicar el error cuando no comienza con WR', () => {
      const err = getWrValidationError('AB000474478');
      expect(err).toContain('debe comenzar obligatoriamente con "WR"');
    });

    it('debe explicar el error cuando la longitud es distinta de 11', () => {
      const err = getWrValidationError('WR123');
      expect(err).toContain('debe tener exactamente 11 caracteres');
      expect(err).toContain('actualmente tiene 5');
    });

    it('debe explicar el error cuando está vacío', () => {
      expect(getWrValidationError('')).toContain('es obligatorio');
    });
  });

  describe('smartFormatWr', () => {
    it('debe prepender "WR" si se ingresan 9 dígitos sin prefijo', () => {
      expect(smartFormatWr('000474478')).toBe('WR000474478');
      expect(smartFormatWr('000459999')).toBe('WR000459999');
    });

    it('no debe alterar códigos que ya tienen el prefijo WR', () => {
      expect(smartFormatWr('WR000474478')).toBe('WR000474478');
      expect(smartFormatWr('wr000474478')).toBe('WR000474478');
    });
  });
});
