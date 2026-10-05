import { describe, it, expect } from 'vitest';
import {
  SYSTEM_MODULES,
  hasModuleAccess,
  getAvailableModulesForUser,
  getFirstAvailableTab
} from '@/lib/navigation/registry';

describe('Control de Acceso y Permisos por Módulo (lib/navigation/registry.ts)', () => {
  const adminUser = {
    nombre: 'Administrador AMEX',
    rol: 'Administrador',
    isAdmin: true,
    permisos: {
      cobros: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
      escaner: { ver: true, crear: true, editar: true, eliminar: true, exportar: true },
      inventario: { ver: true, crear: true, editar: true, eliminar: true, exportar: true }
    }
  };

  const angelUser = {
    nombre: 'Angel',
    rol: 'Operador Logístico',
    isAdmin: false,
    permisos: {
      cobros: false,
      rotulos: false,
      scanner: true,
      invoices: false,
      auditoria: true,
      dashboard: false,
      info_amex: true,
      dni_matrix: false,
      inventario: true,
      live_sheets: false,
      admin_usuarios: false,
      boletas_shalom: false,
      formato_entrega: false,
      directorio_clientes: false,
      completar_inventario: false,
      despacho_rutas: false
    }
  };

  const cobranzasUser = {
    nombre: 'Auxiliar Cobranzas',
    rol: 'Auxiliar de Cobranzas',
    isAdmin: false,
    permisos: {
      cobros: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
      escaner: { ver: false, crear: false, editar: false, eliminar: false, exportar: false },
      clientes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true },
      usuarios: { ver: false, gestionar: false },
      auditoria: { ver: false, restaurar: false },
      inventario: { ver: true, crear: false, editar: false, eliminar: false, exportar: true },
      completar_tib: { ver: false, crear: false, editar: false, eliminar: false, exportar: false }
    }
  };

  describe('hasModuleAccess — Validación para Administradores', () => {
    it('el administrador debe tener acceso irrestricto a todos los 16 módulos del sistema', () => {
      SYSTEM_MODULES.forEach(module => {
        expect(hasModuleAccess(adminUser, module.tabId)).toBe(true);
      });
    });

    it('el administrador debe tener acceso a todos los submódulos del escáner', () => {
      expect(hasModuleAccess(adminUser, 'scanner-slotting')).toBe(true);
      expect(hasModuleAccess(adminUser, 'scanner-lookup')).toBe(true);
      expect(hasModuleAccess(adminUser, 'scanner-delivery')).toBe(true);
      expect(hasModuleAccess(adminUser, 'scanner-relocate')).toBe(true);
    });
  });

  describe('hasModuleAccess — Validación del Caso Angel (Operador con Permisos Selectivos)', () => {
    it('Angel debe tener acceso ÚNICAMENTE a los 4 módulos asignados', () => {
      // Módulos asignados: inventario (mm-lince), escáner (mobile-scanner), info_amex, auditoria
      expect(hasModuleAccess(angelUser, 'mm-lince')).toBe(true);
      expect(hasModuleAccess(angelUser, 'mobile-scanner')).toBe(true);
      expect(hasModuleAccess(angelUser, 'info-amex')).toBe(true);
      expect(hasModuleAccess(angelUser, 'auditoria')).toBe(true);
    });

    it('Angel debe tener acceso a los submódulos del escáner porque scanner está activo', () => {
      expect(hasModuleAccess(angelUser, 'scanner-slotting')).toBe(true);
      expect(hasModuleAccess(angelUser, 'scanner-lookup')).toBe(true);
      expect(hasModuleAccess(angelUser, 'scanner-delivery')).toBe(true);
      expect(hasModuleAccess(angelUser, 'scanner-relocate')).toBe(true);
    });

    it('Angel NO debe tener acceso a los 12 módulos restantes no asignados', () => {
      const tabsBloqueados = [
        'dashboard',
        'live-sheets',
        'fico-cobros',
        'directorio-clientes',
        'dni-matrix',
        'rotulos-a4',
        'boletas-shalom',
        'formato-entrega',
        'invoices-usa',
        'completar-inventario',
        'admin-usuarios',
        'despacho-rutas'
      ];

      tabsBloqueados.forEach(tabId => {
        expect(hasModuleAccess(angelUser, tabId)).toBe(false);
      });
    });

    it('getAvailableModulesForUser debe retornar exactamente 4 módulos para Angel', () => {
      const modulosAngel = getAvailableModulesForUser(angelUser);
      const idsAngel = modulosAngel.map(m => m.id);
      expect(idsAngel).toEqual(['mm-lince', 'scanner', 'info-amex', 'auditoria']);
      expect(modulosAngel.length).toBe(4);
    });

    it('getFirstAvailableTab debe retornar el primer módulo operativo al que tiene acceso Angel', () => {
      expect(getFirstAvailableTab(angelUser)).toBe('mm-lince');
    });
  });

  describe('hasModuleAccess — Compatibilidad con permisos anidados en formato objeto ({ver: true})', () => {
    it('debe reconocer permisos booleanos y permisos estructurados tipo {ver: true}', () => {
      expect(hasModuleAccess(cobranzasUser, 'fico-cobros')).toBe(true);
      expect(hasModuleAccess(cobranzasUser, 'directorio-clientes')).toBe(true);
      expect(hasModuleAccess(cobranzasUser, 'mm-lince')).toBe(true);

      // Bloqueados con ver: false
      expect(hasModuleAccess(cobranzasUser, 'mobile-scanner')).toBe(false);
      expect(hasModuleAccess(cobranzasUser, 'auditoria')).toBe(false);
      expect(hasModuleAccess(cobranzasUser, 'admin-usuarios')).toBe(false);
    });
  });

  describe('hasModuleAccess — Casos de borde y usuarios sin permisos', () => {
    it('debe denegar acceso si el usuario es null o undefined', () => {
      expect(hasModuleAccess(null, 'dashboard')).toBe(false);
      expect(hasModuleAccess(undefined, 'mm-lince')).toBe(false);
    });

    it('debe denegar acceso si el usuario no tiene permisos configurados', () => {
      const emptyUser = { nombre: 'Sin Rol', rol: 'Invitado', permisos: {} };
      expect(hasModuleAccess(emptyUser, 'dashboard')).toBe(false);
      expect(hasModuleAccess(emptyUser, 'mobile-scanner')).toBe(false);
    });
  });
});
