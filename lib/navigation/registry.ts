/**
 * Registro Central de Módulos y Navegación del Sistema AMEX Courier
 * 
 * Centraliza la definición de tabs, submódulos, rutas canónicas,
 * metadatos de iconos y categorías para mantener cohesión en Sidebar,
 * Header, Mobile Nav y sincronización de URL.
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
    category: 'operaciones'
  },
  {
    id: 'live-sheets',
    tabId: 'live-sheets',
    number: 2,
    label: '2. Amex Excel',
    shortLabel: 'Excel',
    path: '/amex-excel',
    icon: 'fa-solid fa-table-list',
    category: 'operaciones'
  },
  {
    id: 'mm-lince',
    tabId: 'mm-lince',
    number: 3,
    label: '3. Inventario',
    shortLabel: 'Inventario',
    path: '/inventario',
    icon: 'fa-solid fa-boxes-stacked',
    category: 'operaciones'
  },
  {
    id: 'fico-cobros',
    tabId: 'fico-cobros',
    number: 4,
    label: '4. Cobros',
    shortLabel: 'Cobros',
    path: '/cobros',
    icon: 'fa-solid fa-receipt',
    category: 'operaciones'
  },
  {
    id: 'directorio-clientes',
    tabId: 'directorio-clientes',
    number: 5,
    label: '5. Directorio de Clientes',
    shortLabel: 'Clientes',
    path: '/directorio-clientes',
    icon: 'fa-solid fa-users',
    category: 'operaciones'
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
    category: 'documentacion'
  },
  {
    id: 'rotulos-a4',
    tabId: 'rotulos-a4',
    number: 8,
    label: '8. Rótulos Agencias',
    shortLabel: 'Rótulos A4',
    path: '/rotulos',
    icon: 'fa-solid fa-tags',
    category: 'documentacion'
  },
  {
    id: 'boletas-shalom',
    tabId: 'boletas-shalom',
    number: 9,
    label: '9. Boletas Shalom',
    shortLabel: 'Boletas Shalom',
    path: '/boletas-shalom',
    icon: 'fa-solid fa-receipt',
    category: 'documentacion'
  },
  {
    id: 'formato-entrega',
    tabId: 'formato-entrega',
    number: 10,
    label: '10. Formato de Entrega',
    shortLabel: 'Acta Entrega',
    path: '/formato-entrega',
    icon: 'fa-solid fa-file-signature',
    category: 'documentacion'
  },
  {
    id: 'invoices-usa',
    tabId: 'invoices-usa',
    number: 11,
    label: '11. Facturas / Invoices USA',
    shortLabel: 'Invoices USA',
    path: '/invoices-usa',
    icon: 'fa-solid fa-file-invoice-dollar',
    category: 'documentacion'
  },
  {
    id: 'info-amex',
    tabId: 'info-amex',
    number: 12,
    label: '12. Info Imágenes AMEX',
    shortLabel: 'Info Imágenes',
    path: '/info-amex',
    icon: 'fa-solid fa-photo-film',
    category: 'sistema'
  },
  {
    id: 'completar-inventario',
    tabId: 'completar-inventario',
    number: 13,
    label: '13. Completar Inventario',
    shortLabel: 'Sync TIB',
    path: '/completar-inventario',
    icon: 'fa-solid fa-cloud-arrow-up',
    category: 'sistema'
  },
  {
    id: 'auditoria',
    tabId: 'auditoria',
    number: 14,
    label: '14. Auditoría & Gobernanza',
    shortLabel: 'Auditoría',
    path: '/auditoria',
    icon: 'fa-solid fa-shield-halved',
    category: 'sistema'
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
    allowedRoles: ['ADMIN', 'SUPER_ADMIN']
  },
  {
    id: 'despacho-rutas',
    tabId: 'despacho-rutas',
    number: 16,
    label: '16. Rutas & Despacho Chofer',
    shortLabel: 'Despacho Chofer',
    path: '/despacho-rutas',
    icon: 'fa-solid fa-route',
    category: 'operaciones'
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
