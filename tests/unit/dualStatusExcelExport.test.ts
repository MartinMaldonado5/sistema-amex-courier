import { describe, it, expect } from 'vitest';
import { mapEstadoAmexLabel, mapEstadoTibLabel } from '@/lib/excelExport';

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
});
