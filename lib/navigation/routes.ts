export const TAB_TO_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'live-sheets': '/amex-excel',
  'mm-lince': '/inventario',
  'mm-inventory': '/inventario',
  'fico-cobros': '/cobros',
  'directorio-clientes': '/directorio-clientes',
  'clientes-360': '/directorio-clientes',
  'mobile-scanner': '/escaner',
  'scanner-slotting': '/escaner/asignar',
  'scanner-lookup': '/escaner/localizar',
  'scanner-delivery': '/escaner/despachar',
  'scanner-relocate': '/escaner/reasignar',
  'scanner-masivo': '/escaner/masivo',
  'dni-matrix': '/matriz-dni',
  'rotulos-a4': '/rotulos',
  'boletas-shalom': '/boletas-shalom',
  'formato-entrega': '/formato-entrega',
  'invoices-usa': '/invoices-usa',
  'info-amex': '/info-amex',
  'completar-inventario': '/completar-inventario',
  'auditoria': '/auditoria',
  'admin-usuarios': '/admin-usuarios',
  'despacho-rutas': '/despacho-rutas',
  'manifiestos-tib': '/manifiestos-tib',
  'configuracion': '/configuracion'
};

export const PATH_TO_TAB: Record<string, string> = {
  '/configuracion': 'configuracion',
  '/config': 'configuracion',
  '/configuracion-general': 'configuracion',
  '/auditoria': 'auditoria',
  '/dashboard': 'dashboard',
  '/amex-excel': 'live-sheets',
  '/inventario': 'mm-lince',
  '/cobros': 'fico-cobros',
  '/directorio-clientes': 'directorio-clientes',
  '/directorio': 'directorio-clientes',
  '/clientes': 'directorio-clientes',
  '/clientes-360': 'directorio-clientes',
  '/escaner': 'mobile-scanner',
  '/escaner/asignar': 'scanner-slotting',
  '/escaner/slotting': 'scanner-slotting',
  '/escaner/localizar': 'scanner-lookup',
  '/escaner/lookup': 'scanner-lookup',
  '/escaner/despachar': 'scanner-delivery',
  '/escaner/delivery': 'scanner-delivery',
  '/escaner/reasignar': 'scanner-relocate',
  '/escaner/relocate': 'scanner-relocate',
  '/escaner/reubicar': 'scanner-relocate',
  '/escaner/masivo': 'scanner-masivo',
  '/escaner/excel': 'scanner-masivo',
  '/matriz-dni': 'dni-matrix',
  '/rotulos': 'rotulos-a4',
  '/boletas-shalom': 'boletas-shalom',
  '/formato-entrega': 'formato-entrega',
  '/acta-entrega': 'formato-entrega',
  '/entrega': 'formato-entrega',
  '/invoices-usa': 'invoices-usa',
  '/invoices': 'invoices-usa',
  '/invoice': 'invoices-usa',
  '/facturas-usa': 'invoices-usa',
  '/facturas': 'invoices-usa',
  '/info-amex': 'info-amex',
  '/completar-inventario': 'completar-inventario',
  '/admin-usuarios': 'admin-usuarios',
  '/despacho-rutas': 'despacho-rutas',
  '/manifiestos-tib': 'manifiestos-tib',
  '/manifiesto': 'manifiestos-tib',
  '/manifiestos': 'manifiestos-tib',
  '/rutas': 'despacho-rutas',
  '/completar': 'completar-inventario',
  '/inventario-tib': 'completar-inventario',
  '/imagenes': 'info-amex',
  '/info': 'info-amex',
  '/info-imagenes': 'info-amex',
  // Aliases retrocompatibles
  '/live-sheets': 'live-sheets',
  '/sheets': 'live-sheets',
  '/mm-lince': 'mm-lince',
  '/mm-inventory': 'mm-lince',
  '/fico-cobros': 'fico-cobros',
  '/directorio clientes': 'directorio-clientes',
  '/clientes360': 'directorio-clientes',
  '/clientes 360': 'directorio-clientes',
  '/clientes%20360': 'directorio-clientes',
  '/crm-clientes': 'directorio-clientes',
  '/mobile-scanner': 'mobile-scanner',
  '/scanner': 'mobile-scanner',
  '/scanner-slotting': 'scanner-slotting',
  '/scanner-lookup': 'scanner-lookup',
  '/scanner-delivery': 'scanner-delivery',
  '/scanner-relocate': 'scanner-relocate',
  '/scanner-masivo': 'scanner-masivo',
  '/dni-matrix': 'dni-matrix',
  '/rotulos-a4': 'rotulos-a4'
};

/**
 * Convierte un tab ID en su URL limpia correspondiente
 */
export function tabToPath(tab: string): string {
  return TAB_TO_PATH[tab] || '/dashboard';
}

/**
 * Convierte un pathname en el tab ID y sub-ruta correspondiente
 */
export function pathToTab(pathname: string): { tab: string; sheetCode?: string } {
  let cleanPath = pathname.replace(/\/$/, '') || '/';
  try {
    cleanPath = decodeURI(cleanPath);
  } catch {
    // Si falla decodeURI, continúa con cleanPath tal cual
  }
  cleanPath = cleanPath.trim();

  // Detección de sub-ruta en Amex Excel: /amex-excel/d/:code
  if (cleanPath.startsWith('/amex-excel/d/')) {
    const sheetCode = cleanPath.replace('/amex-excel/d/', '').trim();
    return { tab: 'live-sheets', sheetCode };
  }

  // Rutas directas
  const tab = PATH_TO_TAB[cleanPath.toLowerCase()];
  if (tab) {
    return { tab };
  }

  // Soporte flexible para variantes de clientes (ej: /directorio-clientes, /clientes 360, /clientes/..., /cliente...)
  const normalized = cleanPath.toLowerCase().replace(/[\s_-]+/g, '');
  if (
    normalized.startsWith('/cliente') ||
    normalized.startsWith('/directorio') ||
    normalized.startsWith('/crmcliente')
  ) {
    return { tab: 'directorio-clientes' };
  }

  return { tab: 'dashboard' };
}

/**
 * Si el usuario entra con un hash legado (#...), lo traduce a su URL limpia correspondiente
 */
export function migrateLegacyHash(hash: string): string | null {
  if (!hash) return null;
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;

  // Caso libro directo: #d/CODIGO o #sheets:CODIGO
  if (raw.startsWith('d/')) {
    return `/amex-excel/d/${raw.replace('d/', '')}`;
  }
  if (raw.startsWith('sheets:')) {
    return `/amex-excel/d/${raw.replace('sheets:', '')}`;
  }

  // Casos de pestañas
  const tabMap: Record<string, string> = {
    'dashboard': '/dashboard',
    'live-sheets': '/amex-excel',
    'sheets': '/amex-excel',
    'mm-lince': '/inventario',
    'inventory': '/inventario',
    'mm-inventory': '/inventario',
    'fico-cobros': '/cobros',
    'cobros': '/cobros',
    'directorio-clientes': '/directorio-clientes',
    'directorio': '/directorio-clientes',
    'clientes': '/directorio-clientes',
    'clientes-360': '/directorio-clientes',
    'clientes360': '/directorio-clientes',
    'crm-clientes': '/directorio-clientes',
    'mobile-scanner': '/escaner',
    'scanner': '/escaner',
    'scanner-slotting': '/escaner/asignar',
    'slotting': '/escaner/asignar',
    'scanner-lookup': '/escaner/localizar',
    'lookup': '/escaner/localizar',
    'scanner-delivery': '/escaner/despachar',
    'delivery': '/escaner/despachar',
    'scanner-relocate': '/escaner/reasignar',
    'relocate': '/escaner/reasignar',
    'scanner-masivo': '/escaner/masivo',
    'masivo': '/escaner/masivo',
    'dni-matrix': '/matriz-dni',
    'dni': '/matriz-dni',
    'rotulos-a4': '/rotulos',
    'rotulos': '/rotulos',
    'boletas-shalom': '/boletas-shalom',
    'shalom': '/boletas-shalom',
    'admin-usuarios': '/admin-usuarios',
    'usuarios': '/admin-usuarios'
  };

  return tabMap[raw] || null;
}
