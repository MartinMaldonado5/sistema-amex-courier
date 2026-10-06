import { describe, it, expect } from 'vitest';
import {
  SYSTEM_MODULES,
  getModuleByTabId,
  getScannerSubmoduleById,
  getScannerSubmoduleByTabId
} from '@/lib/navigation/registry';
import { tabToPath, pathToTab, migrateLegacyHash } from '@/lib/navigation/routes';

describe('Módulo de Navegación y Rutas — Suite de Pruebas', () => {
  describe('Registro Central de Módulos (lib/navigation/registry.ts)', () => {
    it('debe contener los 17 módulos del sistema configurados con números correlativos', () => {
      expect(SYSTEM_MODULES.length).toBe(17);
      const numbers = SYSTEM_MODULES.map(m => m.number);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);

      const despachoMod = getModuleByTabId('despacho-rutas');
      expect(despachoMod).toBeDefined();
      expect(despachoMod?.number).toBe(16);
      expect(despachoMod?.path).toBe('/despacho-rutas');

      const manifiestosTibMod = getModuleByTabId('manifiestos-tib');
      expect(manifiestosTibMod).toBeDefined();
      expect(manifiestosTibMod?.number).toBe(17);
      expect(manifiestosTibMod?.path).toBe('/manifiestos-tib');
    });

    it('el Módulo 6 (Escáner de Códigos) debe contener los 5 submódulos operativos', () => {
      const scannerMod = SYSTEM_MODULES.find(m => m.id === 'scanner');
      expect(scannerMod).toBeDefined();
      expect(scannerMod?.submodules?.length).toBe(5);

      const subIds = scannerMod?.submodules?.map(s => s.id);
      expect(subIds).toEqual(['slotting', 'lookup', 'delivery', 'relocate', 'masivo']);
    });

    it('debe recuperar módulos y submódulos mediante las funciones auxiliares de búsqueda', () => {
      const cobros = getModuleByTabId('fico-cobros');
      expect(cobros?.label).toBe('4. Cobros');
      expect(cobros?.path).toBe('/cobros');

      const relocateSub = getScannerSubmoduleById('relocate');
      expect(relocateSub?.label).toContain('6.4');
      expect(relocateSub?.path).toBe('/escaner/reasignar');

      const masivoSub = getScannerSubmoduleById('masivo');
      expect(masivoSub?.label).toContain('6.5');
      expect(masivoSub?.path).toBe('/escaner/masivo');

      const slottingSub = getScannerSubmoduleByTabId('scanner-slotting');
      expect(slottingSub?.id).toBe('slotting');
      expect(slottingSub?.path).toBe('/escaner/asignar');
    });
  });

  describe('Resolución de Rutas Limpias (lib/navigation/routes.ts)', () => {
    it('tabToPath debe mapear cada submódulo de escáner a su ruta limpia dedicada', () => {
      expect(tabToPath('scanner-slotting')).toBe('/escaner/asignar');
      expect(tabToPath('scanner-lookup')).toBe('/escaner/localizar');
      expect(tabToPath('scanner-delivery')).toBe('/escaner/despachar');
      expect(tabToPath('scanner-relocate')).toBe('/escaner/reasignar');
      expect(tabToPath('scanner-masivo')).toBe('/escaner/masivo');
      expect(tabToPath('mobile-scanner')).toBe('/escaner');
      expect(tabToPath('despacho-rutas')).toBe('/despacho-rutas');
    });

    it('tabToPath debe retornar /dashboard para pestañas desconocidas o por defecto', () => {
      expect(tabToPath('dashboard')).toBe('/dashboard');
      expect(tabToPath('pestaña-inexistente')).toBe('/dashboard');
    });

    it('pathToTab debe resolver URLs de submódulos de escáner hacia sus respectivos tabs', () => {
      expect(pathToTab('/escaner/asignar')).toEqual({ tab: 'scanner-slotting' });
      expect(pathToTab('/escaner/localizar')).toEqual({ tab: 'scanner-lookup' });
      expect(pathToTab('/escaner/despachar')).toEqual({ tab: 'scanner-delivery' });
      expect(pathToTab('/escaner/reasignar')).toEqual({ tab: 'scanner-relocate' });
      expect(pathToTab('/escaner/masivo')).toEqual({ tab: 'scanner-masivo' });
      expect(pathToTab('/escaner')).toEqual({ tab: 'mobile-scanner' });
      expect(pathToTab('/despacho-rutas')).toEqual({ tab: 'despacho-rutas' });
      expect(pathToTab('/rutas')).toEqual({ tab: 'despacho-rutas' });
    });

    it('pathToTab debe extraer dinámicamente el código de libro en rutas de Amex Excel', () => {
      const res = pathToTab('/amex-excel/d/LIBRO_LOTE_OCTUBRE');
      expect(res.tab).toBe('live-sheets');
      expect(res.sheetCode).toBe('LIBRO_LOTE_OCTUBRE');
    });

    it('pathToTab debe ser tolerante a mayúsculas y barras diagonales finales', () => {
      expect(pathToTab('/ESCANER/REASIGNAR/')).toEqual({ tab: 'scanner-relocate' });
      expect(pathToTab('/ESCANER/MASIVO/')).toEqual({ tab: 'scanner-masivo' });
      expect(pathToTab('/COBROS/')).toEqual({ tab: 'fico-cobros' });
    });

    it('migrateLegacyHash debe traducir hashes antiguos hacia rutas limpias modernas', () => {
      expect(migrateLegacyHash('#relocate')).toBe('/escaner/reasignar');
      expect(migrateLegacyHash('#scanner-relocate')).toBe('/escaner/reasignar');
      expect(migrateLegacyHash('#masivo')).toBe('/escaner/masivo');
      expect(migrateLegacyHash('#scanner-masivo')).toBe('/escaner/masivo');
      expect(migrateLegacyHash('#slotting')).toBe('/escaner/asignar');
      expect(migrateLegacyHash('#cobros')).toBe('/cobros');
      expect(migrateLegacyHash('#d/EXCEL999')).toBe('/amex-excel/d/EXCEL999');
      expect(migrateLegacyHash('')).toBeNull();
    });
  });
});
