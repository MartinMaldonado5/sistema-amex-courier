'use client';

import React, { useState } from 'react';
import { EstanteriaPosicion, Paquete } from '@/types';
import InventoryHeader from './InventoryHeader';
import InventorySubTabs from './InventorySubTabs';
import InventoryFilterBar from './InventoryFilterBar';
import InventorySelectionBar from './InventorySelectionBar';
import { copyPackagesTableAsImage } from '../utils/clipboardTableImage';

export interface InventoryToolbarProps {
  paquetes: Paquete[];
  filteredPaquetes: Paquete[];
  amexStatusCounts?: {
    total: number;
    activas?: number;
    recibido: number;
    en_almacen: number;
    listo_recojo: number;
    en_ruta: number;
    entregado: number;
  };
  onOpenBulkWrModal?: () => void;
  onOpenSyncTibImagesModal?: () => void;
  missingTibImagesCount?: number;
  activeSubTab: 'existencias' | 'movimientos' | 'matriz' | 'gestor';
  setActiveSubTab: (tab: 'existencias' | 'movimientos' | 'matriz' | 'gestor') => void;
  filteredCount: number;
  shelfGroups: { [key: string]: EstanteriaPosicion[] };
  posicionesCount: number;
  kardexCount: number;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  locationFilter: string;
  setLocationFilter: (s: string) => void;
  shelfFilter: string;
  setShelfFilter: (s: string) => void;
  floorFilter: string;
  setFloorFilter: (s: string) => void;
  packageTypeFilter: string;
  setPackageTypeFilter: (s: string) => void;
  statusFilter?: string;
  setStatusFilter?: (s: string) => void;
  statusAmexFilter?: string;
  setStatusAmexFilter?: (s: string) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenTransferModal: () => void;
  onOpenBatchStatusModal: () => void;
  onBatchDelete: () => void;
  onOpenNewPositionModal: () => void;
  onOpenMatrizModal?: () => void;
  onOpenGestorModal?: () => void;
  onOpenKardexModal?: () => void;
  onOpenSyncTibModal?: () => void;
  onExportExcel: () => void;
  onRefreshData?: () => Promise<void> | void;
  onNewPackage: () => void;
}

export default function InventoryToolbar({
  paquetes,
  filteredPaquetes,
  amexStatusCounts,
  onOpenBulkWrModal,
  onOpenSyncTibImagesModal,
  missingTibImagesCount,
  activeSubTab,
  setActiveSubTab,
  filteredCount,
  shelfGroups,
  posicionesCount,
  kardexCount,
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  shelfFilter,
  setShelfFilter,
  floorFilter,
  setFloorFilter,
  packageTypeFilter,
  setPackageTypeFilter,
  statusFilter,
  setStatusFilter,
  statusAmexFilter,
  setStatusAmexFilter,
  selectedIds,
  setSelectedIds,
  onOpenTransferModal,
  onOpenBatchStatusModal,
  onBatchDelete,
  onOpenNewPositionModal,
  onOpenSyncTibModal,
  onExportExcel,
  onRefreshData,
  onNewPackage
}: InventoryToolbarProps) {
  const [selectionCopyStatus, setSelectionCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');

  const handleCopySelectedImage = async () => {
    if (selectionCopyStatus === 'copying') return;
    const selectedPkgs = paquetes.filter(p => selectedIds.includes(p.id));
    if (selectedPkgs.length === 0) return;

    setSelectionCopyStatus('copying');
    try {
      const res = await copyPackagesTableAsImage(selectedPkgs);
      if (res.success) {
        setSelectionCopyStatus('copied');
        setTimeout(() => setSelectionCopyStatus('idle'), 3500);
      } else {
        alert(res.error || 'No se pudo copiar la imagen.');
        setSelectionCopyStatus('idle');
      }
    } catch {
      setSelectionCopyStatus('idle');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Breadcrumb sutil */}
      <div className="sap-breadcrumb" style={{ fontSize: '11.5px', color: '#64748b' }}>
        <span>Operaciones y Almacenes</span> / <span style={{ fontWeight: 700, color: '#334155' }}>3. Inventario</span>
      </div>

      {/* 1. Header Principal Unificado */}
      <InventoryHeader
        paquetes={paquetes}
        filteredPaquetes={filteredPaquetes}
        selectedIds={selectedIds}
        missingTibImagesCount={missingTibImagesCount}
        onOpenSyncTibModal={onOpenSyncTibModal}
        onOpenBulkWrModal={onOpenBulkWrModal}
        onOpenSyncTibImagesModal={onOpenSyncTibImagesModal}
        onExportExcel={onExportExcel}
        onRefreshData={onRefreshData}
        onNewPackage={onNewPackage}
      />

      {/* 2. Sub-Pestañas Limpias */}
      <InventorySubTabs
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        filteredCount={filteredCount}
        posicionesCount={posicionesCount}
        kardexCount={kardexCount}
        onOpenNewPositionModal={onOpenNewPositionModal}
      />

      {/* 3. Barra de Búsqueda y Filtros Rápidos (solo en Existencias) */}
      {activeSubTab === 'existencias' && (
        <InventoryFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          shelfFilter={shelfFilter}
          setShelfFilter={setShelfFilter}
          shelfGroups={shelfGroups}
          floorFilter={floorFilter}
          setFloorFilter={setFloorFilter}
          statusAmexFilter={statusAmexFilter}
          setStatusAmexFilter={setStatusAmexFilter}
          amexStatusCounts={amexStatusCounts}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          packageTypeFilter={packageTypeFilter}
          setPackageTypeFilter={setPackageTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalPaquetesCount={paquetes.length}
        />
      )}

      {/* 4. Barra Flotante de Acciones en Lote (cuando hay paquetes seleccionados) */}
      <InventorySelectionBar
        selectedCount={selectedIds.length}
        onOpenTransferModal={onOpenTransferModal}
        onOpenBatchStatusModal={onOpenBatchStatusModal}
        onBatchDelete={onBatchDelete}
        onClearSelection={() => setSelectedIds([])}
        onCopyImage={handleCopySelectedImage}
        copyStatus={selectionCopyStatus}
      />
    </div>
  );
}
