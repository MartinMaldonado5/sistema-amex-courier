export const TAB_TO_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'live-sheets': '/amex-excel',
  'mm-lince': '/inventario',
  'mm-inventory': '/inventario',
  'shp-entregas': '/entregas',
  'fico-cobros': '/cobros',
  'shp-deliveries': '/despacho',
  'wms-picking': '/picking',
  'mobile-scanner': '/escaner',
  'dni-matrix': '/matriz-dni',
  'rotulos-a4': '/rotulos',
  'boletas-shalom': '/boletas-shalom'
};

export const PATH_TO_TAB: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/amex-excel': 'live-sheets',
  '/inventario': 'mm-lince',
  '/entregas': 'shp-entregas',
  '/cobros': 'fico-cobros',
  '/despacho': 'shp-deliveries',
  '/picking': 'wms-picking',
  '/escaner': 'mobile-scanner',
  '/matriz-dni': 'dni-matrix',
  '/rotulos': 'rotulos-a4',
  '/boletas-shalom': 'boletas-shalom',
  // Aliases retrocompatibles
  '/live-sheets': 'live-sheets',
  '/sheets': 'live-sheets',
  '/mm-lince': 'mm-lince',
  '/mm-inventory': 'mm-lince',
  '/shp-entregas': 'shp-entregas',
  '/fico-cobros': 'fico-cobros',
  '/shp-deliveries': 'shp-deliveries',
  '/wms-picking': 'wms-picking',
  '/mobile-scanner': 'mobile-scanner',
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
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  // Detección de sub-ruta en Amex Excel: /amex-excel/d/:code
  if (cleanPath.startsWith('/amex-excel/d/')) {
    const sheetCode = cleanPath.replace('/amex-excel/d/', '').trim();
    return { tab: 'live-sheets', sheetCode };
  }

  // Rutas directas
  const tab = PATH_TO_TAB[cleanPath];
  if (tab) {
    return { tab };
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
    'shp-entregas': '/entregas',
    'entregas': '/entregas',
    'fico-cobros': '/cobros',
    'cobros': '/cobros',
    'shp-deliveries': '/despacho',
    'deliveries': '/despacho',
    'wms-picking': '/picking',
    'picking': '/picking',
    'mobile-scanner': '/escaner',
    'scanner': '/escaner',
    'dni-matrix': '/matriz-dni',
    'dni': '/matriz-dni',
    'rotulos-a4': '/rotulos',
    'rotulos': '/rotulos',
    'boletas-shalom': '/boletas-shalom',
    'shalom': '/boletas-shalom'
  };

  return tabMap[raw] || null;
}
