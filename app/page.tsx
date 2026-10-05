'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Paquete
} from '@/types';
import dynamic from 'next/dynamic';
import HeaderBar from '@/components/HeaderBar';
import Sidebar from '@/components/Sidebar';
import { NewClientFormData } from '@/components/modals/NewClientModal';
import { NewPkgFormData } from '@/components/modals/NewPackageModal';
import { useDashboardNavigation, DashboardTabId } from '@/features/dashboard/hooks/useDashboardNavigation';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { useDashboardActions } from '@/features/dashboard/hooks/useDashboardActions';
import { useDashboardSession } from '@/features/dashboard/hooks/useDashboardSession';
import DashboardTabContent from '@/features/dashboard/components/DashboardTabContent';
import { EMPTY_CLIENT_FORM, EMPTY_PKG_FORM } from '@/features/dashboard/data/default-forms';
import { hasModuleAccess, getFirstAvailableTab } from '@/lib/navigation/registry';

const NewClientModal = dynamic(() => import('@/components/modals/NewClientModal'), { ssr: false });
const NewPackageModal = dynamic(() => import('@/components/modals/NewPackageModal'), { ssr: false });
const ThermalLabelModal = dynamic(() => import('@/components/modals/ThermalLabelModal'), { ssr: false });
const PdfViewerModal = dynamic(() => import('@/components/modals/PdfViewerModal'), { ssr: false });

export default function DashboardPage() {
  const {
    activeTab,
    isSidebarCollapsed,
    setActiveTab,
    setIsSidebarCollapsed
  } = useDashboardNavigation();

  const [targetCliente360, setTargetCliente360] = useState<string | undefined>(undefined);
  const [targetClienteCobros, setTargetClienteCobros] = useState<string | undefined>(undefined);

  const handleNavigateToClientes360 = useCallback((clienteNombre?: string) => {
    setTargetCliente360(clienteNombre);
    setActiveTab('directorio-clientes');
  }, [setActiveTab]);

  const handleNavigateToCobros = useCallback((clienteNombre?: string) => {
    setTargetClienteCobros(clienteNombre);
    setActiveTab('fico-cobros');
  }, [setActiveTab]);

  const { currentUser, isLoadingSession, logout: handleLogout } = useDashboardSession();

  // Redirección reactiva: Si el usuario entra a una pestaña no permitida, llevarlo al primer módulo autorizado
  useEffect(() => {
    if (!currentUser || isLoadingSession) return;
    if (!hasModuleAccess(currentUser, activeTab)) {
      const fallbackTab = getFirstAvailableTab(currentUser);
      if (fallbackTab && fallbackTab !== activeTab) {
        setActiveTab(fallbackTab as DashboardTabId);
      }
    }
  }, [currentUser, isLoadingSession, activeTab, setActiveTab]);

  const {
    clientes,
    paquetes,
    entregas,
    cobros,
    scannedLogs,
    setClientes,
    setPaquetes,
    setScannedLogs,
    fetchSupabaseData,
    isLoadingInitialData,
    isGlobalRefreshing
  } = useDashboardData();
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedThermalPkg, setSelectedThermalPkg] = useState<Paquete | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewPkgModalOpen, setIsNewPkgModalOpen] = useState(false);

  const [newClientForm, setNewClientForm] = useState<NewClientFormData>(EMPTY_CLIENT_FORM);
  const [newPkgForm, setNewPkgForm] = useState<NewPkgFormData>(EMPTY_PKG_FORM);

  const dashboardActions = useDashboardActions({
    newClientForm,
    newPkgForm,
    currentUser,
    setClientes,
    setPaquetes,
    setScannedLogs,
    setNewClientForm,
    setNewPkgForm,
    setIsNewClientModalOpen,
    setIsNewPkgModalOpen,
    emptyClientForm: EMPTY_CLIENT_FORM,
    emptyPkgForm: EMPTY_PKG_FORM
  });

  const {
    handleUpdatePackage,
    handleDeletePackage,
    handleAssignPackageLocation,
    handleSaveClient,
    handleSavePackage,
    openNewClientModal,
    openNewPkgModal,
    handleScanCode
  } = dashboardActions;

  const isTabAllowed = currentUser ? hasModuleAccess(currentUser, activeTab) : true;

  return (
    <div className="app-layout-shell">
      <HeaderBar
        currentUser={currentUser}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          isSidebarCollapsed={isSidebarCollapsed}
          onSelectTab={setActiveTab}
          onCloseSidebar={() => setIsSidebarCollapsed(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className={`main-content tab-${activeTab} ${['dni-matrix', 'rotulos-a4', 'boletas-shalom'].includes(activeTab) ? 'dark-tab-mode' : ''} ${activeTab === 'live-sheets' ? 'live-sheets-mode' : ''} ${activeTab === 'dni-matrix' ? 'dni-matrix-mode' : ''} ${activeTab === 'rotulos-a4' ? 'rotulos-mode' : ''} ${activeTab === 'boletas-shalom' ? 'boletas-shalom-mode' : ''} ${activeTab === 'fico-cobros' ? 'cobros-mode' : ''}`}>
          {!isTabAllowed ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '32px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(239, 68, 68, 0.15)', border: '1.5px solid rgba(239, 68, 68, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <i className="fa-solid fa-lock" style={{ fontSize: 28, color: '#f87171' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f8fafc', marginBottom: 8 }}>Acceso Restringido</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 440, marginBottom: 24, lineHeight: 1.5 }}>
                Tu usuario actual (<strong>{currentUser?.nombre}</strong> — Rol: <strong>{currentUser?.rol || 'Sin Rol'}</strong>) no cuenta con permisos asignados para visualizar este módulo.
              </p>
              <button
                onClick={() => setActiveTab(getFirstAvailableTab(currentUser) as DashboardTabId)}
                style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
              >
                <i className="fa-solid fa-arrow-left" /> Ir a mi módulo principal
              </button>
            </div>
          ) : (
            <DashboardTabContent
              activeTab={activeTab}
              isLoadingInitialData={isLoadingInitialData}
              isGlobalRefreshing={isGlobalRefreshing}
              paquetes={paquetes}
              clientes={clientes}
              entregas={entregas}
              cobros={cobros}
              scannedLogs={scannedLogs}
              currentUser={currentUser}
              targetCliente360={targetCliente360}
              targetClienteCobros={targetClienteCobros}
              onNavigateTab={setActiveTab}
              onNewPackage={openNewPkgModal}
              onPrintLabel={setSelectedThermalPkg}
              onViewPdf={setSelectedPdfUrl}
              onRefreshData={fetchSupabaseData}
              onUpdatePackage={handleUpdatePackage}
              onDeletePackage={handleDeletePackage}
              onNavigateToClientes360={handleNavigateToClientes360}
              onNavigateToCobros={handleNavigateToCobros}
              onOpenNewClientModal={openNewClientModal}
              onConfirmScan={handleScanCode}
              onSlotPackage={handleAssignPackageLocation}
              onUpdateLogs={setScannedLogs}
            />
          )}
        </main>
      </div>

      {/* Barra de Navegación Inferior para Celulares (Mobile Bottom Navigation) */}
      <nav className="mobile-bottom-nav" aria-label="Navegación Móvil de Almacén">
        {hasModuleAccess(currentUser, 'dashboard') && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-chart-pie"></i>
            <span>Panel</span>
          </button>
        )}

        {hasModuleAccess(currentUser, 'live-sheets') && (
          <button
            type="button"
            onClick={() => setActiveTab('live-sheets')}
            className={`mobile-nav-btn ${activeTab === 'live-sheets' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-table-list"></i>
            <span>Amex Excel</span>
          </button>
        )}

        {hasModuleAccess(currentUser, 'mm-lince') && (
          <button
            type="button"
            onClick={() => setActiveTab('mm-lince')}
            className={`mobile-nav-btn ${activeTab === 'mm-lince' || activeTab === 'mm-inventory' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-boxes-stacked"></i>
            <span>Inventario</span>
          </button>
        )}

        {hasModuleAccess(currentUser, 'fico-cobros') && (
          <button
            type="button"
            onClick={() => setActiveTab('fico-cobros')}
            className={`mobile-nav-btn ${activeTab === 'fico-cobros' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-receipt"></i>
            <span>Cobros</span>
          </button>
        )}

        {hasModuleAccess(currentUser, 'dni-matrix') && (
          <button
            type="button"
            onClick={() => setActiveTab('dni-matrix')}
            className={`mobile-nav-btn ${activeTab === 'dni-matrix' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-id-card"></i>
            <span>DNI</span>
          </button>
        )}

        {hasModuleAccess(currentUser, 'scanner') && (
          <button
            type="button"
            onClick={() => setActiveTab('mobile-scanner')}
            className={`mobile-nav-btn ${activeTab === 'mobile-scanner' || activeTab.startsWith('scanner-') ? 'active' : ''}`}
          >
            <i className="fa-solid fa-barcode"></i>
            <span>Escáner</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="mobile-nav-btn"
        >
          <i className="fa-solid fa-bars"></i>
          <span>Menú</span>
        </button>
      </nav>

      {/* Backdrop para cerrar el menú lateral en móviles */}
      {!isSidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {isNewClientModalOpen && (
        <NewClientModal
          form={newClientForm}
          onChange={setNewClientForm}
          onSave={handleSaveClient}
          onClose={() => setIsNewClientModalOpen(false)}
        />
      )}

      {isNewPkgModalOpen && (
        <NewPackageModal
          form={newPkgForm}
          clientes={clientes}
          onChange={setNewPkgForm}
          onSave={handleSavePackage}
          onClose={() => setIsNewPkgModalOpen(false)}
          isWarehouseMode={activeTab === 'mm-lince' || activeTab === 'mm-inventory'}
        />
      )}

      {selectedThermalPkg && (
        <ThermalLabelModal pkg={selectedThermalPkg} onClose={() => setSelectedThermalPkg(null)} />
      )}

      {selectedPdfUrl && (
        <PdfViewerModal url={selectedPdfUrl} onClose={() => setSelectedPdfUrl(null)} />
      )}
    </div>
  );
}
