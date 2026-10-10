import { describe, it, expect } from 'vitest';
import {
  mapEstadoAmexLabel,
  mapEstadoTibLabel,
  formatFechaModificado,
  formatFechaModificadoParts
} from '@/lib/excelExport';

describe('Dual Status Label Formatting & Mapping', () => {
  describe('mapEstadoAmexLabel', () => {
    it('defaults to "En Almacén" when null or undefined', () => {
      expect(mapEstadoAmexLabel(null)).toBe('En Almacén');
      expect(mapEstadoAmexLabel(undefined)).toBe('En Almacén');
      expect(mapEstadoAmexLabel('')).toBe('En Almacén');
    });

    it('maps all standard Estado AMEX keys accurately', () => {
      expect(mapEstadoAmexLabel('recibido')).toBe('En Almacén');
      expect(mapEstadoAmexLabel('en_almacen')).toBe('En Almacén');
      expect(mapEstadoAmexLabel('enalmacen')).toBe('En Almacén');
      expect(mapEstadoAmexLabel('listo_recojo')).toBe('Listo para Recojo');
      expect(mapEstadoAmexLabel('listorecojo')).toBe('Listo para Recojo');
      expect(mapEstadoAmexLabel('en_ruta')).toBe('En Ruta');
      expect(mapEstadoAmexLabel('enruta')).toBe('En Ruta');
      expect(mapEstadoAmexLabel('entregado')).toBe('Entregado');
    });

    it('handles unexpected strings gracefully with capitalized fallback', () => {
      expect(mapEstadoAmexLabel('personalizado')).toBe('Personalizado');
    });
  });

  describe('mapEstadoTibLabel', () => {
    it('defaults to "En Almacén" when null or undefined', () => {
      expect(mapEstadoTibLabel(null)).toBe('En Almacén');
      expect(mapEstadoTibLabel(undefined)).toBe('En Almacén');
      expect(mapEstadoTibLabel('')).toBe('En Almacén');
    });

    it('maps all standard Estado TIB keys accurately', () => {
      expect(mapEstadoTibLabel('Enviado')).toBe('Enviado');
      expect(mapEstadoTibLabel('enviado')).toBe('Enviado');
      expect(mapEstadoTibLabel('Recibido')).toBe('Recibido');
      expect(mapEstadoTibLabel('recibido')).toBe('Recibido');
      expect(mapEstadoTibLabel('EnAlmacen')).toBe('En Almacén');
      expect(mapEstadoTibLabel('EnRutaCarroAmex')).toBe('Enviado');
      expect(mapEstadoTibLabel('ListoParaRecojo')).toBe('Listo para Recojo');
      expect(mapEstadoTibLabel('Entregado')).toBe('Entregado');
      expect(mapEstadoTibLabel('EntregadoDomicilio')).toBe('Entregado');
      expect(mapEstadoTibLabel('RecogidoAlmacen')).toBe('Entregado');
    });

    it('preserves other custom statuses as-is', () => {
      expect(mapEstadoTibLabel('EnTransito')).toBe('EnTransito');
    });
  });

  describe('formatFechaModificado', () => {
    it('returns "—" when null, undefined or invalid date', () => {
      expect(formatFechaModificado(null)).toBe('—');
      expect(formatFechaModificado(undefined)).toBe('—');
      expect(formatFechaModificado('')).toBe('—');
      expect(formatFechaModificado('fecha-invalida')).toBe('—');
    });

    it('formats valid ISO dates to DD/MM/AAAA HH:mm:ss format matching TIB', () => {
      const date = new Date(2026, 9, 9, 16, 35, 33); // Oct 9, 2026 16:35:33
      const formatted = formatFechaModificado(date.toISOString());
      expect(formatted).toBe('09/10/2026 16:35:33');
    });

    it('correctly zero-pads single-digit days, months, hours, minutes, and seconds', () => {
      const date = new Date(2026, 0, 5, 8, 4, 7); // Jan 5, 2026 08:04:07
      const formatted = formatFechaModificado(date.toISOString());
      expect(formatted).toBe('05/01/2026 08:04:07');
    });
  });

  describe('formatFechaModificadoParts', () => {
    it('returns null when invalid', () => {
      expect(formatFechaModificadoParts(null)).toBeNull();
      expect(formatFechaModificadoParts('invalid')).toBeNull();
    });

    it('splits fecha and hora accurately', () => {
      const date = new Date(2026, 9, 9, 16, 35, 33);
      const parts = formatFechaModificadoParts(date.toISOString());
      expect(parts).toEqual({
        fecha: '09/10/2026',
        hora: '16:35:33'
      });
    });
  });
});
