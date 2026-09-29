'use client';

import dynamic from 'next/dynamic';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Cliente,
  CobroVoucher,
  OrdenEntrega,
  Paquete,
  ScannedLog
} from '@/types';
import type { DashboardTabId } from '@/features/dashboard/hooks/useDashboardNavigation';
import type { DashboardScanExtra } from '@/features/dashboard/hooks/useDashboardActions';
import {
  BoletasShalomSkeleton,
  CobrosSkeleton,
  DashboardSkeleton,
  DniMatrixSkeleton,
  FormatoEntregaSkeleton,
  InvoicesSkeleton,
  InventorySkeleton,
  LiveSheetsSkeleton,
  PageSkeleton,
  RotulosA4Skeleton,
  ScannerSkeleton
} from '@/components/ui/Skeleton';

const DashboardTab = dynamic(() => import('./DashboardTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const InventoryTab = dynamic(() => import('@/features/inventory/components/InventoryTab'), {
  ssr: false,
  loading: () => <InventorySkeleton />
});

const CobrosTab = dynamic(() => import('@/features/cobros/components/CobrosTab'), {
  ssr: false,
  loading: () => <CobrosSkeleton />
});

const DirectorioClientesTab = dynamic(() => import('@/features/cobros/components/DirectorioClientesTab'), {
  ssr: false,
  loading: () => <CobrosSkeleton />
});

const ScannerTab = dynamic(() => import('@/features/scanner/components/ScannerTab'), {
  ssr: false,
  loading: () => <ScannerSkeleton />
});

const LiveSheetsTab = dynamic(() => import('@/features/live-sheets/components/LiveSheetsTab'), {
  ssr: false,
  loading: () => <LiveSheetsSkeleton />
});

const DniMatrixTab = dynamic(() => import('@/features/dni-matrix/components/DniMatrixTab'), {
  ssr: false,
  loading: () => <DniMatrixSkeleton />
});

const RotulosA4Tab = dynamic(() => import('@/features/rotulos/components/RotulosA4Tab'), {
  ssr: false,
  loading: () => <RotulosA4Skeleton />
});

const BoletasShalomTab = dynamic(() => import('@/features/boletas-shalom/components/BoletasShalomTab'), {
  ssr: false,
  loading: () => <BoletasShalomSkeleton />
});

const FormatoEntregaTab = dynamic(() => import('@/features/formato-entrega/components/FormatoEntregaTab'), {
  ssr: false,
  loading: () => <FormatoEntregaSkeleton />
});

const InvoicesTab = dynamic(() => import('@/features/invoices/components/InvoicesTab'), {
  ssr: false,
  loading: () => <InvoicesSkeleton />
});

const InfoAmexTab = dynamic(() => import('@/features/info-amex/components/InfoAmexTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const InventarioJobsTab = dynamic(() => import('@/features/inventory-jobs/components/InventarioJobsTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const AuditoriaTab = dynamic(() => import('@/features/auditoria/components/AuditoriaTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const AdminUsersTab = dynamic(() => import('@/features/admin-users/components/AdminUsersTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

interface DashboardTabContentProps {
  activeTab: DashboardTabId;
  isLoadingInitialData: boolean;
  isGlobalRefreshing: boolean;
  paquetes: Paquete[];
  clientes: Cliente[];
  entregas: OrdenEntrega[];
  cobros: CobroVoucher[];
  scannedLogs: ScannedLog[];
  currentUser: { nombre: string; email: string; rol: string; id?: string } | null;
  targetCliente360?: string;
  targetClienteCobros?: string;
  onNavigateTab: (tabId: string) => void;
  onNewPackage: () => void;
  onPrintLabel: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
  onRefreshData: () => Promise<void>;
  onUpdatePackage: (pkg: Paquete) => void;
  onDeletePackage: (id: string) => void;
  onNavigateToClientes360: (clienteNombre?: string) => void;
  onNavigateToCobros: (clienteNombre?: string) => void;
  onOpenNewClientModal: () => void;
  onConfirmScan: (code: string, format: string, extra?: DashboardScanExtra) => void;
  onSlotPackage: (code: string, location: string) => void;
  onUpdateLogs: Dispatch<SetStateAction<ScannedLog[]>>;
}

export default function DashboardTabContent({
  activeTab,
  isLoadingInitialData,
  isGlobalRefreshing,
  paquetes,
  clientes,
  entregas,
  cobros,
  scannedLogs,
  currentUser,
  targetCliente360,
  targetClienteCobros,
  onNavigateTab,
  onNewPackage,
  onPrintLabel,
  onViewPdf,
  onRefreshData,
  onUpdatePackage,
  onDeletePackage,
  onNavigateToClientes360,
  onNavigateToCobros,
  onOpenNewClientModal,
  onConfirmScan,
  onSlotPackage,
  onUpdateLogs
}: DashboardTabContentProps) {
  if (isLoadingInitialData) {
    return <PageSkeleton activeTab={activeTab} />;
  }

  return (
    <>
      {activeTab === 'dashboard' && (
        <DashboardTab
          paquetes={paquetes}
          clientes={clientes}
          entregas={entregas}
          cobros={cobros}
          onNavigateTab={onNavigateTab}
          onNewPackage={onNewPackage}
          onPrintLabel={onPrintLabel}
          onViewPdf={onViewPdf}
          onRefreshData={onRefreshData}
        />
      )}

      {activeTab === 'live-sheets' && (
        <LiveSheetsTab
          paquetes={paquetes}
          clientes={clientes}
          onViewPdf={onViewPdf}
          currentUser={currentUser}
        />
      )}

      {(activeTab === 'mm-lince' || activeTab === 'mm-inventory') && (
        <InventoryTab
          paquetes={paquetes}
          clientes={clientes}
          onNewPackage={onNewPackage}
          onViewPdf={onViewPdf}
          onUpdatePackage={onUpdatePackage}
          onDeletePackage={onDeletePackage}
          onRefreshData={onRefreshData}
        />
      )}

      {activeTab === 'fico-cobros' && (
        <CobrosTab
          paquetes={paquetes}
          clientes={clientes}
          onUpdatePackage={onUpdatePackage}
          onNavigateToClientes360={onNavigateToClientes360}
          filterClienteInicial={targetClienteCobros}
        />
      )}

      {(activeTab === 'directorio-clientes' || activeTab === 'clientes-360') && (
        <DirectorioClientesTab
          paquetes={paquetes}
          clientes={clientes}
          initialClientName={targetCliente360}
          onNavigateToCobros={onNavigateToCobros}
          onOpenNewClientModal={onOpenNewClientModal}
        />
      )}

      {activeTab === 'mobile-scanner' && (
        <ScannerTab
          scannedLogs={scannedLogs}
          paquetes={paquetes}
          clientes={clientes}
          currentUser={currentUser}
          onConfirm={onConfirmScan}
          onSlotPackage={onSlotPackage}
          onUpdateLogs={onUpdateLogs}
          onRefreshData={onRefreshData}
        />
      )}

      {activeTab === 'dni-matrix' && (
        <DniMatrixTab
          paquetes={paquetes}
          clientes={clientes}
          onGlobalRefresh={onRefreshData}
          isRefreshing={isGlobalRefreshing}
        />
      )}

      {activeTab === 'rotulos-a4' && <RotulosA4Tab clientes={clientes} />}
      {activeTab === 'boletas-shalom' && <BoletasShalomTab />}

      {activeTab === 'formato-entrega' && (
        <FormatoEntregaTab clientes={clientes} paquetes={paquetes} />
      )}

      {(activeTab === 'invoices-usa' || activeTab === 'invoices') && (
        <InvoicesTab clientes={clientes} />
      )}

      {activeTab === 'info-amex' && <InfoAmexTab />}
      {activeTab === 'completar-inventario' && <InventarioJobsTab />}
      {activeTab === 'auditoria' && <AuditoriaTab />}
      {activeTab === 'admin-usuarios' && <AdminUsersTab />}
    </>
  );
}
