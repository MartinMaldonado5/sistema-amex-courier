'use client';

import { useCallback, useEffect, useState } from 'react';
import { migrateLegacyHash, pathToTab, tabToPath } from '@/lib/navigation/routes';

export const VALID_DASHBOARD_TABS = [
  'dashboard',
  'live-sheets',
  'mm-lince',
  'mm-inventory',
  'fico-cobros',
  'directorio-clientes',
  'clientes-360',
  'mobile-scanner',
  'scanner-slotting',
  'scanner-lookup',
  'scanner-delivery',
  'dni-matrix',
  'rotulos-a4',
  'boletas-shalom',
  'formato-entrega',
  'invoices-usa',
  'invoices',
  'info-amex',
  'completar-inventario',
  'auditoria',
  'admin-usuarios'
] as const;

export type DashboardTabId = (typeof VALID_DASHBOARD_TABS)[number];

function isDashboardTab(value: string | null | undefined): value is DashboardTabId {
  return Boolean(value && VALID_DASHBOARD_TABS.includes(value as DashboardTabId));
}

/**
 * Centraliza la navegación del shell operativo:
 * URL limpia, compatibilidad con hashes antiguos, pestaña persistida y menú móvil.
 */
export function useDashboardNavigation() {
  const [activeTab, setActiveTabState] = useState<DashboardTabId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const legacyPath = migrateLegacyHash(window.location.hash);
      if (legacyPath) {
        window.history.replaceState(null, '', legacyPath);
      }

      const { tab: pathTab } = pathToTab(window.location.pathname);
      const savedTab = localStorage.getItem('amex_active_tab');
      const initialTab =
        isDashboardTab(pathTab) && window.location.pathname !== '/'
          ? pathTab
          : isDashboardTab(savedTab)
            ? savedTab
            : 'dashboard';

      setActiveTabState(initialTab);

      const targetPath = tabToPath(initialTab);
      if (window.location.pathname === '/' || window.location.pathname !== targetPath) {
        if (!window.location.pathname.startsWith('/amex-excel/d/')) {
          window.history.replaceState(null, '', targetPath);
        }
      }

      const handlePopState = () => {
        const { tab: currentTab } = pathToTab(window.location.pathname);
        if (!isDashboardTab(currentTab)) return;

        setActiveTabState(currentTab);
        try {
          localStorage.setItem('amex_active_tab', currentTab);
        } catch {
          // localStorage puede estar bloqueado por el navegador.
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (error) {
      console.warn('Error sincronizando la navegación del dashboard:', error);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    if (!isDashboardTab(tab)) return;

    setActiveTabState(tab);
    try {
      localStorage.setItem('amex_active_tab', tab);
      const cleanPath = tabToPath(tab);
      if (window.location.pathname !== cleanPath) {
        window.history.pushState(null, '', cleanPath);
      }
    } catch (error) {
      console.warn('Error guardando la pestaña activa:', error);
    }

    if (window.innerWidth <= 768) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  return {
    activeTab,
    isSidebarCollapsed,
    setActiveTab,
    setIsSidebarCollapsed
  };
}
