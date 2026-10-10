/**
 * Registro Central de Módulos y Navegación del Sistema AMEX Courier
 * 
 * Centraliza la definición de tabs, submódulos, rutas canónicas,
 * metadatos de iconos, categorías y matriz de permisos para mantener
 * cohesión en Sidebar, Header, Mobile Nav y sincronización de URL.
 */

export interface SubmoduleMetadata {
  id: string;
  tabId: string;
  label: string;
  shortLabel: string;
  path: string;
  icon: string;
  accentColor: string;
}

export interface ModuleMetadata {
  id: string;
  tabId: string;
  number: number;
  label: string;
  shortLabel: string;
  path: string;
  icon: string;
  category: 'operaciones' | 'documentacion' | 'sistema';
  submodules?: SubmoduleMetadata[];
  allowedRoles?: string[];
  permissionKey: string;
  permissionAliases?: string[];
}

export const SCANNER_SUBMODULES: SubmoduleMetadata[] = [
  {
    id: 'slotting',
    tabId: 'scanner-slotting',
    label: '6.1 📦 Asignar Anaquel',
    shortLabel: 'Asignar Anaquel',
    path: '/escaner/asignar',
    icon: 'fa-solid fa-layer-group',
    accentColor: '#38bdf8'
  },
  {
    id: 'lookup',
    tabId: 'scanner-lookup',
    label: '6.2 🔍 Localizar 360°',
    shortLabel: 'Localizar 360°',
    path: '/escaner/localizar',
    icon: 'fa-solid fa-magnifying-glass-location',
    accentColor: '#4ade80'
  },
  {
    id: 'delivery',
    tabId: 'scanner-delivery',
    label: '6.3 🚚 Despachar',
    shortLabel: 'Despachar',
    path: '/escaner/despachar',
    icon: 'fa-solid fa-truck-fast',
    accentColor: '#c084fc'
  },
  {
    id: 'relocate',
    tabId: 'scanner-relocate',
    label: '6.4 🔄 Reasignar Ubicación',
    shortLabel: 'Reasignar Ubicación',
    path: '/escaner/reasignar',
    icon: 'fa-solid fa-right-left',
    accentColor: '#fb923c'
  },
  {
    id: 'masivo',
    tabId: 'scanner-masivo',
    label: '6.5 📋 Asignación Masiva',
    shortLabel: 'Asignación Masiva',
    path: '/escaner/masivo',
    icon: 'fa-solid fa-file-excel',
    accentColor: '#10b981'
  }
];

export const SYSTEM_MODULES: ModuleMetadata[] = [
  {
    id: 'dashboard',
    tabId: 'dashboard',
    number: 1,
    label: '1. Panel Operativo',
    shortLabel: 'Panel',
    path: '/dashboard',
    icon: 'fa-solid fa-chart-pie',
    category: 'operaciones',
    permissionKey: 'dashboard',
    permissionAliases: ['panel']
  },
  {
    id: 'live-sheets',
    tabId: 'live-sheets',
    number: 2,
    label: '2. Amex Excel',
    shortLabel: 'Excel',
    path: '/amex-excel',
    icon: 'fa-solid fa-table-list',
    category: 'operaciones',
    permissionKey: 'live_sheets',
    permissionAliases: ['live-sheets', 'excel']
  },
  {
    id: 'mm-lince',
    tabId: 'mm-lince',
    number: 3,
    label: '3. Inventario',
    shortLabel: 'Inventario',
    path: '/inventario',
    icon: 'fa-solid fa-boxes-stacked',
    category: 'operaciones',
    permissionKey: 'inventario',
    permissionAliases: ['mm-lince', 'mm_lince', 'mm-inventory']
  },
  {
    id: 'fico-cobros',
    tabId: 'fico-cobros',
    number: 4,
    label: '4. Cobros',
    shortLabel: 'Cobros',
    path: '/cobros',
    icon: 'fa-solid fa-receipt',
    category: 'operaciones',
    permissionKey: 'cobros',
    permissionAliases: ['fico-cobros', 'fico_cobros']
  },
  {
    id: 'directorio-clientes',
    tabId: 'directorio-clientes',
    number: 5,
    label: '5. Directorio de Clientes',
    shortLabel: 'Clientes',
    path: '/directorio-clientes',
    icon: 'fa-solid fa-users',
    category: 'operaciones',
    permissionKey: 'directorio_clientes',
    permissionAliases: ['directorio-clientes', 'clientes', 'clientes-360']
  },
  {
    id: 'scanner',
    tabId: 'mobile-scanner',
    number: 6,
    label: '6. Escáner de Códigos',
    shortLabel: 'Escáner',
    path: '/escaner',
    icon: 'fa-solid fa-barcode',
    category: 'operaciones',
    permissionKey: 'scanner',
    permissionAliases: ['escaner', 'mobile-scanner', 'mobile_scanner'],
    submodules: SCANNER_SUBMODULES
  },
  {
    id: 'dni-matrix',
    tabId: 'dni-matrix',
    number: 7,
    label: '7. Procesador de DNI',
    shortLabel: 'Matriz DNI',
    path: '/matriz-dni',
    icon: 'fa-solid fa-id-card',
    category: 'documentacion',
    permissionKey: 'dni_matrix',
    permissionAliases: ['dni-matrix']
  },
  {
    id: 'rotulos-a4',
    tabId: 'rotulos-a4',
    number: 8,
    label: '8. Rótulos Agencias',
    shortLabel: 'Rótulos A4',
    path: '/rotulos',
    icon: 'fa-solid fa-tags',
    category: 'documentacion',
    permissionKey: 'rotulos',
    permissionAliases: ['rotulos-a4', 'rotulos_a4']
  },
  {
    id: 'boletas-shalom',
    tabId: 'boletas-shalom',
    number: 9,
    label: '9. Boletas Shalom',
    shortLabel: 'Boletas Shalom',
    path: '/boletas-shalom',
    icon: 'fa-solid fa-receipt',
    category: 'documentacion',
    permissionKey: 'boletas_shalom',
    permissionAliases: ['boletas-shalom']
  },
  {
    id: 'formato-entrega',
    tabId: 'formato-entrega',
    number: 10,
    label: '10. Formato de Entrega',
    shortLabel: 'Acta Entrega',
    path: '/formato-entrega',
    icon: 'fa-solid fa-file-signature',
    category: 'documentacion',
    permissionKey: 'formato_entrega',
    permissionAliases: ['formato-entrega']
  },
  {
    id: 'invoices-usa',
    tabId: 'invoices-usa',
    number: 11,
    label: '11. Facturas / Invoices USA',
    shortLabel: 'Invoices USA',
    path: '/invoices-usa',
    icon: 'fa-solid fa-file-invoice-dollar',
    category: 'documentacion',
    permissionKey: 'invoices',
    permissionAliases: ['invoices-usa', 'invoices_usa']
  },
  {
    id: 'info-amex',
    tabId: 'info-amex',
    number: 12,
    label: '12. Info Imágenes AMEX',
    shortLabel: 'Info Imágenes',
    path: '/info-amex',
    icon: 'fa-solid fa-photo-film',
    category: 'sistema',
    permissionKey: 'info_amex',
    permissionAliases: ['info-amex']
  },
  {
    id: 'completar-inventario',
    tabId: 'completar-inventario',
    number: 13,
    label: '13. Completar Inventario',
    shortLabel: 'Sync TIB',
    path: '/completar-inventario',
    icon: 'fa-solid fa-cloud-arrow-up',
    category: 'sistema',
    permissionKey: 'completar_inventario',
    permissionAliases: ['completar-inventario', 'completar_tib', 'completar-tib']
  },
  {
    id: 'auditoria',
    tabId: 'auditoria',
    number: 14,
    label: '14. Auditoría & Gobernanza',
    shortLabel: 'Auditoría',
    path: '/auditoria',
    icon: 'fa-solid fa-shield-halved',
    category: 'sistema',
    permissionKey: 'auditoria',
    permissionAliases: []
  },
  {
    id: 'admin-usuarios',
    tabId: 'admin-usuarios',
    number: 15,
    label: '15. Gestión de Usuarios',
    shortLabel: 'Usuarios',
    path: '/admin-usuarios',
    icon: 'fa-solid fa-user-gear',
    category: 'sistema',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRADOR'],
    permissionKey: 'admin_usuarios',
    permissionAliases: ['admin-usuarios', 'usuarios']
  },
  {
    id: 'despacho-rutas',
    tabId: 'despacho-rutas',
    number: 16,
    label: '16. Rutas & Despacho Chofer',
    shortLabel: 'Despacho Chofer',
    path: '/despacho-rutas',
    icon: 'fa-solid fa-route',
    category: 'operaciones',
    permissionKey: 'despacho_rutas',
    permissionAliases: ['despacho-rutas']
  },
  {
    id: 'manifiestos-tib',
    tabId: 'manifiestos-tib',
    number: 17,
    label: '17. Manifiestos TIB',
    shortLabel: 'Manifiestos TIB',
    path: '/manifiestos-tib',
    icon: 'fa-solid fa-file-invoice',
    category: 'documentacion',
    permissionKey: 'manifiestos_tib',
    permissionAliases: ['manifiestos-tib', 'manifiestos']
  },
  {
    id: 'configuracion',
    tabId: 'configuracion',
    number: 18,
    label: '18. Configuración General',
    shortLabel: 'Configuración',
    path: '/configuracion',
    icon: 'fa-solid fa-gears',
    category: 'sistema',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRADOR'],
    permissionKey: 'configuracion',
    permissionAliases: ['configuracion-general', 'config']
  }
];

export function getModuleByTabId(tabId: string): ModuleMetadata | undefined {
  return SYSTEM_MODULES.find(m => m.tabId === tabId);
}

export function getScannerSubmoduleByTabId(tabId: string): SubmoduleMetadata | undefined {
  return SCANNER_SUBMODULES.find(s => s.tabId === tabId);
}

export function getScannerSubmoduleById(id: string): SubmoduleMetadata | undefined {
  return SCANNER_SUBMODULES.find(s => s.id === id);
}

export interface UserAccessContext {
  rol?: string;
  isAdmin?: boolean;
  permisos?: Record<string, unknown>;
}

/**
 * Evalúa si un usuario tiene autorización para acceder a una pestaña o módulo específico.
 * Soporta roles administradores globales, mapeo de submódulos y matrices de permisos booleanas/objetos.
 */
export function hasModuleAccess(
  user: UserAccessContext | null | undefined,
  tabOrModuleId: string
): boolean {
  if (!user) return false;

  // 1. Roles administradores siempre tienen acceso completo a todos los módulos
  const roleName = String(user.rol || '').trim().toLowerCase();
  if (user.isAdmin || roleName === 'admin' || roleName === 'administrador') {
    return true;
  }

  // 2. Si no hay permisos configurados o es un objeto vacío
  const permisos = user.permisos;
  if (!permisos || typeof permisos !== 'object' || Object.keys(permisos).length === 0) {
    return false;
  }

  // 3. El dashboard es el home adaptativo del sistema:
  // - Administradores acceden al Panel Operativo Global
  // - Operadores acceden a "Mi Estación de Trabajo" (OperatorHubTab)
  if (tabOrModuleId === 'dashboard') {
    return true;
  }

  // 4. Normalizar si se trata de un tab del escáner (incluyendo submódulos 6.1 a 6.4)
  const isScannerTab =
    tabOrModuleId === 'scanner' ||
    tabOrModuleId === 'mobile-scanner' ||
    tabOrModuleId.startsWith('scanner-');

  // Buscar el módulo al que corresponde la pestaña
  const targetModule = SYSTEM_MODULES.find(
    m =>
      m.id === tabOrModuleId ||
      m.tabId === tabOrModuleId ||
      (m.submodules && m.submodules.some(s => s.tabId === tabOrModuleId || s.id === tabOrModuleId)) ||
      m.permissionKey === tabOrModuleId ||
      (m.permissionAliases && m.permissionAliases.includes(tabOrModuleId))
  );

  // Módulos administrativos: restringidos a admin a menos que se otorgue explícitamente
  if (
    (targetModule?.id === 'admin-usuarios' || tabOrModuleId === 'admin-usuarios') &&
    !user.isAdmin &&
    roleName !== 'admin' &&
    roleName !== 'administrador'
  ) {
    const adminVal = permisos['admin_usuarios'] ?? permisos['admin-usuarios'] ?? permisos['usuarios'];
    if (adminVal !== true && !(typeof adminVal === 'object' && (adminVal as Record<string, unknown>)?.ver === true)) {
      return false;
    }
  }

  if (
    (targetModule?.id === 'configuracion' || tabOrModuleId === 'configuracion') &&
    !user.isAdmin &&
    roleName !== 'admin' &&
    roleName !== 'administrador'
  ) {
    const configVal = permisos['configuracion'] ?? permisos['configuracion_general'];
    if (configVal !== true && !(typeof configVal === 'object' && (configVal as Record<string, unknown>)?.ver === true)) {
      return false;
    }
  }

  // Reunir todas las claves posibles de permiso a verificar
  const keysToCheck: string[] = [];
  if (isScannerTab) {
    keysToCheck.push('scanner', 'escaner', 'mobile-scanner', 'mobile_scanner');
  }
  if (targetModule) {
    keysToCheck.push(targetModule.permissionKey);
    if (targetModule.permissionAliases) {
      keysToCheck.push(...targetModule.permissionAliases);
    }
    keysToCheck.push(targetModule.id, targetModule.tabId);
  } else {
    keysToCheck.push(tabOrModuleId);
  }

  // Evaluar si alguna de las claves está autorizada
  for (const k of keysToCheck) {
    if (k in permisos) {
      const val = permisos[k];
      if (typeof val === 'boolean') {
        return val;
      }
      if (typeof val === 'object' && val !== null) {
        const obj = val as Record<string, unknown>;
        if (typeof obj.ver === 'boolean') return obj.ver;
        return Object.values(obj).some(v => v === true);
      }
    }
  }

  return false;
}

/**
 * Retorna la lista de módulos del sistema permitidos para el usuario actual.
 */
export function getAvailableModulesForUser(
  user: UserAccessContext | null | undefined
): ModuleMetadata[] {
  if (!user) return [];
  return SYSTEM_MODULES.filter(m => hasModuleAccess(user, m.tabId));
}

/**
 * Retorna la primera pestaña autorizada a la que puede navegar el usuario.
 */
export function getFirstAvailableTab(
  user: UserAccessContext | null | undefined
): string {
  if (!user) return 'dashboard';
  const available = getAvailableModulesForUser(user);
  if (available.length > 0) {
    // Si tiene acceso al escáner pero su tabId es mobile-scanner, retornar su primer submódulo o mobile-scanner
    return available[0].tabId;
  }
  return 'dashboard';
}
