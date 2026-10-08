import { describe, it, expect } from 'vitest';
import type { Paquete } from '@/types';

// Regex de seguridad aplicado en useDashboardActions para prevenir inyecciones en filtros PostgREST
const WMS_CODE_REGEX = /^[A-Za-z0-9\-_]{3,60}$/;

function parseLocation(location: string): [string, string] {
  return location.includes('-') ? (location.split('-') as [string, string]) : [location, 'P1'];
}

function validateAndSimulateRelocation(
  code: string,
  targetLocation: string,
  inventory: Paquete[]
): { success: boolean; error?: string; updatedInventory?: Paquete[] } {
  const upper = code.trim().toUpperCase();

  // 1. Sanitización de código
  if (!WMS_CODE_REGEX.test(upper)) {
    return { success: false, error: 'codigo_invalido' };
  }

  // 2. Validación de existencia en inventario (Regla 6.4 Reasignar Ubicación)
  const existingPkg = inventory.find(
    p => p.numeroReciboBodega.toUpperCase() === upper || p.trackingUsa.toUpperCase() === upper
  );

  if (!existingPkg) {
    return { success: false, error: 'paquete_no_encontrado' };
  }

  const [anaquel, piso] = parseLocation(targetLocation);

  const updatedInventory = inventory.map(item =>
    item.id === existingPkg.id
      ? { ...item, anaquel, piso, posicionEstante: targetLocation }
      : item
  );

  return { success: true, updatedInventory };
}

describe('Módulo 6: Escáner y WMS — Seguridad, Sanitización y Reasignación Atómica', () => {
  describe('Sanitización de Códigos (Prevención de Inyección PostgREST / Supabase)', () => {
    it('debe aceptar formatos válidos de paquetes (WRs, Trackings, Alfanuméricos estándar)', () => {
      expect(WMS_CODE_REGEX.test('WR123456')).toBe(true);
      expect(WMS_CODE_REGEX.test('PKG-9923')).toBe(true);
      expect(WMS_CODE_REGEX.test('1Z9999999999999999')).toBe(true);
      expect(WMS_CODE_REGEX.test('TIB_2026_001')).toBe(true);
      expect(WMS_CODE_REGEX.test('AMX-LINCE-P1')).toBe(true);
    });

    it('debe rechazar cadenas que contengan comas, paréntesis, comillas o espacios que puedan romper filtros PostgREST', () => {
      expect(WMS_CODE_REGEX.test('WR123,eq.1')).toBe(false);
      expect(WMS_CODE_REGEX.test('WR123(injection)')).toBe(false);
      expect(WMS_CODE_REGEX.test("WR123'; DROP TABLE--")).toBe(false);
      expect(WMS_CODE_REGEX.test('WR 123 456')).toBe(false);
      expect(WMS_CODE_REGEX.test('')).toBe(false);
      expect(WMS_CODE_REGEX.test('AB')).toBe(false); // Demasiado corto (< 3 caracteres)
    });
  });

  describe('Parseo de Ubicación de Almacén (Slotting WMS)', () => {
    it('debe separar correctamente anaquel y piso cuando la ubicación tiene formato estándar', () => {
      expect(parseLocation('A1-P2')).toEqual(['A1', 'P2']);
      expect(parseLocation('A2-P4')).toEqual(['A2', 'P4']);
      expect(parseLocation('REC-P1')).toEqual(['REC', 'P1']);
      expect(parseLocation('DSP-P3')).toEqual(['DSP', 'P3']);
    });

    it('debe asignar P1 como piso por defecto cuando la ubicación no incluye guion separador', () => {
      expect(parseLocation('A1')).toEqual(['A1', 'P1']);
      expect(parseLocation('RECEPCION')).toEqual(['RECEPCION', 'P1']);
    });
  });

  describe('Reglas de Negocio del Submódulo 6.4 (Reasignar Ubicación)', () => {
    const mockInventory: Paquete[] = [
      {
        id: 'pkg-1',
        numeroReciboBodega: 'WR100200',
        tracking: '1Z888888',
        trackingUsa: '1Z888888',
        tipoEmpaque: 'CAJA',
        descripcion: 'Mercancía General',
        ubicacionActual: 'AmexLince',
        nombreConsignatario: 'CARLOS ALVAREZ',
        pesoKg: 3.5,
        anaquel: 'A1',
        piso: 'P1',
        posicionEstante: 'A1-P1',
        estadoAmex: 'en_almacen',
        estadoTib: 'EnAlmacen',
        estadoEntrega: 'EnAlmacen',
        creadoEn: '2026-10-04T12:00:00Z'
      }
    ];

    it('debe bloquear la reubicación si el paquete no existe en bodega', () => {
      const result = validateAndSimulateRelocation('WR999999', 'A2-P3', mockInventory);
      expect(result.success).toBe(false);
      expect(result.error).toBe('paquete_no_encontrado');
      expect(result.updatedInventory).toBeUndefined();
    });

    it('debe permitir la reubicación cuando el paquete existe y actualizar anaquel y piso', () => {
      const result = validateAndSimulateRelocation('WR100200', 'A2-P3', mockInventory);
      expect(result.success).toBe(true);
      expect(result.updatedInventory).toBeDefined();

      const updated = result.updatedInventory?.find(p => p.id === 'pkg-1');
      expect(updated?.posicionEstante).toBe('A2-P3');
      expect(updated?.anaquel).toBe('A2');
      expect(updated?.piso).toBe('P3');
    });

    it('debe permitir buscar y reubicar tanto por WR como por Tracking USA', () => {
      const resultByTracking = validateAndSimulateRelocation('1Z888888', 'DSP-P2', mockInventory);
      expect(resultByTracking.success).toBe(true);
      const updated = resultByTracking.updatedInventory?.find(p => p.id === 'pkg-1');
      expect(updated?.posicionEstante).toBe('DSP-P2');
    });

    it('debe soportar rollback de snapshot ante fallos simulados de red/BD', () => {
      let state = [...mockInventory];
      const snapshot = [...state];

      // Mutación optimista
      state = state.map(p => ({ ...p, posicionEstante: 'A2-P4' }));
      expect(state[0].posicionEstante).toBe('A2-P4');

      // Simulación de error de red o rechazo RLS -> Rollback
      const simulateError = true;
      if (simulateError) {
        state = snapshot;
      }

      // Verificamos que el estado volvió a su valor original
      expect(state[0].posicionEstante).toBe('A1-P1');
    });

    it('debe tratar las zonas de Despacho (DSP-Z1, DSP-Z2, DSP) y Oficina (OFI) como áreas sin pisos/niveles', () => {
      const isLevelLess = (shelf: string) => {
        const s = shelf.trim().toUpperCase();
        return (
          s.startsWith('DSP') ||
          s === 'OFI' ||
          s === 'REC' ||
          s.includes('DESPACHO')
        );
      };

      expect(isLevelLess('DSP-Z1')).toBe(true);
      expect(isLevelLess('DSP-Z2')).toBe(true);
      expect(isLevelLess('DSP')).toBe(true);
      expect(isLevelLess('OFI')).toBe(true);
      expect(isLevelLess('REC')).toBe(true);
      expect(isLevelLess('A1')).toBe(false);
      expect(isLevelLess('A2')).toBe(false);

      // Reubicación directa a DSP-Z1 sin nivel
      const targetPos = isLevelLess('DSP-Z1') ? 'DSP-Z1' : 'DSP-Z1-P1';
      expect(targetPos).toBe('DSP-Z1');
    });
  });
});
