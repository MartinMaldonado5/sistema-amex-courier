'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { Paquete, Cliente } from '@/types';
import ThermalLabelModal from '@/components/modals/ThermalLabelModal';
import Modal from '@/components/ui/Modal';
import { useInventoryData } from '../hooks/useInventoryData';
import InventoryToolbar from './InventoryToolbar';
import InventoryTable from './InventoryTable';
import TransferModal from '../modals/TransferModal';
import EditPackageModal from '../modals/EditPackageModal';
import BatchStatusModal from '../modals/BatchStatusModal';
import ShelfPositionModal from '../modals/ShelfPositionModal';
import EditPositionModal from '../modals/EditPositionModal';
import SyncTibModal from '../modals/SyncTibModal';
import BulkStatusByWrModal from '../modals/BulkStatusByWrModal';
import TibImageModal from '../modals/TibImageModal';
import SyncTibImagesModal from '../modals/SyncTibImagesModal';
import '../styles/inventory.css';

export interface InventoryTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  onNewPackage: () => void;
  onViewPdf: (url: string) => void;
  onUpdatePackage?: (updated: Paquete) => void;
  onDeletePackage?: (id: string) => void;
  onRefreshData?: () => Promise<void> | void;
}

export default function InventoryTab({
  paquetes,
  clientes: _clientes,
  onNewPackage,
  onViewPdf,
  onUpdatePackage,
  onDeletePackage,
  onRefreshData
}: InventoryTabProps) {
  const {
    // Sub-pestañas
    activeSubTab,
    setActiveSubTab,

    // Filtros & Búsqueda
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
    amexStatusCounts,
    dateFilter,
    setDateFilter,
    resetDateFilter,

    // Paginación
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredPaquetes,
    paginatedPaquetes,

    // Kardex
    kardexList,
    filteredKardex,
    kardexSearch,
    setKardexSearch,
    kardexTypeFilter,
    setKardexTypeFilter,
    isLoadingKardex,
    fetchData,

    // Estanterías
    posicionesList,
    shelfGroups,

    // Selección múltiple
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleToggleSelect,

    // Modales & Formularios
    isTransferModalOpen,
    setIsTransferModalOpen,
    openTransferModal,
    transferData,
    setTransferData,
    handleExecuteTransfer,

    isEditModalOpen,
    setIsEditModalOpen,
    openEditModal,
    editFormData,
    setEditFormData,
    handleSaveEdit,

    isBatchStatusModalOpen,
    setIsBatchStatusModalOpen,
    isBulkWrModalOpen,
    setIsBulkWrModalOpen,
    batchTargetStatus,
    setBatchTargetStatus,
    batchTargetStatusAmex,
    setBatchTargetStatusAmex,
    handleBatchStatusChange,
    handleBulkStatusChangeDirect,
    handleBatchDelete,

    isNewPositionModalOpen,
    setIsNewPositionModalOpen,
    newPositionMode,
    setNewPositionMode,
    batchShelfData,
    setBatchShelfData,
    newPositionData,
    setNewPositionData,
    handleCreatePosition,
    handleCreateBatchShelf,

    editingPosition,
    setEditingPosition,
    handleUpdatePosition,
    handleDeletePosition,

    isGestorModalOpen,
    setIsGestorModalOpen,
    isMatrizModalOpen,
    setIsMatrizModalOpen,
    isKardexModalOpen,
    setIsKardexModalOpen,

    selectedThermalPkg,
    setSelectedThermalPkg,
    selectedPackageForAction,

    // Acciones
    handleDeletePackage,
    handleQuickDeliver,
    handleExportExcel,
    handleExportKardexExcel
  } = useInventoryData({
    paquetes,
    onUpdatePackage,
    onDeletePackage,
    onRefreshData
  });

  // Modal de Evidencia Fotográfica TIB
  const [selectedTibPkg, setSelectedTibPkg] = useState<Paquete | null>(null);
  const [isTibModalOpen, setIsTibModalOpen] = useState(false);

  const smoothScroll = useSmoothScroll();

  // Sincronizar dimensiones de Lenis al cambiar datos paginados, subpestañas o filtros
  useEffect(() => {
    const mainLenis = smoothScroll.getMain();
    if (mainLenis) {
      mainLenis.resize();
    }
  }, [paginatedPaquetes.length, activeSubTab, currentPage, pageSize, smoothScroll]);

  const handleOpenTibImage = (pkg: Paquete) => {
    setSelectedTibPkg(pkg);
    setIsTibModalOpen(true);
  };

  const handleTibImageLoaded = (wr: string, imageUrl: string, ticketUrl?: string) => {
    if (onUpdatePackage && selectedTibPkg && selectedTibPkg.numeroReciboBodega === wr) {
      onUpdatePackage({
        ...selectedTibPkg,
        tibImagenUrl: imageUrl,
        tibTicketPdfUrl: ticketUrl
      });
    }
  };

  // Modal de Sincronización Masiva de Fotos TIB
  const [isSyncTibImagesModalOpen, setIsSyncTibImagesModalOpen] = useState(false);

  const missingTibImagesCount = useMemo(() => {
    return paquetes.filter(
      (p) => Boolean(p.numeroReciboBodega && p.numeroReciboBodega.trim() !== '' && !p.tibImagenUrl)
    ).length;
  }, [paquetes]);

  const handleTibBulkPackageUpdated = (wr: string, imageUrl: string, ticketUrl?: string) => {
    if (onUpdatePackage) {
      const target = paquetes.find((p) => p.numeroReciboBodega === wr);
      if (target) {
        onUpdatePackage({
          ...target,
          tibImagenUrl: imageUrl,
          tibTicketPdfUrl: ticketUrl
        });
      }
    }
  };

  const [isSyncTibModalOpen, setIsSyncTibModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', padding: '16px 20px', boxSizing: 'border-box' }}>
      {/* Barra de herramientas, subpestañas y filtros */}
      <InventoryToolbar
        paquetes={paquetes}
        filteredPaquetes={filteredPaquetes}
        amexStatusCounts={amexStatusCounts}
        onOpenBulkWrModal={() => setIsBulkWrModalOpen(true)}
        onOpenSyncTibImagesModal={() => setIsSyncTibImagesModalOpen(true)}
        missingTibImagesCount={missingTibImagesCount}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        filteredCount={filteredPaquetes.length}
        shelfGroups={shelfGroups}
        posicionesCount={posicionesList.length}
        kardexCount={kardexList.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        shelfFilter={shelfFilter}
        setShelfFilter={setShelfFilter}
        floorFilter={floorFilter}
        setFloorFilter={setFloorFilter}
        packageTypeFilter={packageTypeFilter}
        setPackageTypeFilter={setPackageTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        statusAmexFilter={statusAmexFilter}
        setStatusAmexFilter={setStatusAmexFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        resetDateFilter={resetDateFilter}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onOpenTransferModal={() => openTransferModal()}
        onOpenBatchStatusModal={() => setIsBatchStatusModalOpen(true)}
        onBatchDelete={handleBatchDelete}
        onOpenNewPositionModal={() => {
          setNewPositionMode('batch');
          setIsNewPositionModalOpen(true);
        }}
        onOpenGestorModal={() => setIsGestorModalOpen(true)}
        onOpenKardexModal={() => setIsKardexModalOpen(true)}
        onOpenSyncTibModal={() => setIsSyncTibModalOpen(true)}
        onExportExcel={handleExportExcel}
        onRefreshData={onRefreshData}
        onNewPackage={onNewPackage}
      />

      {/* Tabla Principal de Existencias de Almacén */}
      <InventoryTable
        filteredPaquetes={filteredPaquetes}
        paginatedPaquetes={paginatedPaquetes}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onQuickDeliver={handleQuickDeliver}
        onOpenTransferModal={openTransferModal}
        onOpenEditModal={openEditModal}
        onSelectThermalPkg={setSelectedThermalPkg}
        onViewPdf={onViewPdf}
        onOpenTibImage={handleOpenTibImage}
        onDeletePackage={handleDeletePackage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        totalPages={totalPages}
      />

      {/* Modales de Gestión de Inventario */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        selectedPackageForAction={selectedPackageForAction}
        selectedIds={selectedIds}
        transferData={transferData}
        setTransferData={setTransferData}
        shelfGroups={shelfGroups}
        onConfirmTransfer={handleExecuteTransfer}
      />

      <EditPackageModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedPackage={selectedPackageForAction}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSave={handleSaveEdit}
      />

      <BatchStatusModal
        isOpen={isBatchStatusModalOpen}
        onClose={() => setIsBatchStatusModalOpen(false)}
        selectedCount={selectedIds.length}
        batchTargetStatus={batchTargetStatus}
        setBatchTargetStatus={setBatchTargetStatus}
        batchTargetStatusAmex={batchTargetStatusAmex}
        setBatchTargetStatusAmex={setBatchTargetStatusAmex}
        onConfirm={handleBatchStatusChange}
      />

      <BulkStatusByWrModal
        isOpen={isBulkWrModalOpen}
        onClose={() => setIsBulkWrModalOpen(false)}
        paquetes={paquetes}
        onApply={handleBulkStatusChangeDirect}
      />

      <ShelfPositionModal
        isOpen={isNewPositionModalOpen}
        onClose={() => setIsNewPositionModalOpen(false)}
        newPositionMode={newPositionMode}
        setNewPositionMode={setNewPositionMode}
        batchShelfData={batchShelfData}
        setBatchShelfData={setBatchShelfData}
        newPositionData={newPositionData}
        setNewPositionData={setNewPositionData}
        onCreateBatchShelf={handleCreateBatchShelf}
        onCreatePosition={handleCreatePosition}
      />

      <EditPositionModal
        editingPosition={editingPosition}
        setEditingPosition={setEditingPosition}
        onSave={handleUpdatePosition}
      />

      {/* Modal Pop-up: Rótulo Térmico 4x6 */}
      {selectedThermalPkg && (
        <ThermalLabelModal
          pkg={selectedThermalPkg}
          onClose={() => setSelectedThermalPkg(null)}
        />
      )}



      {/* Modal de Cruce Rápido con TIB del Día (Worker Hostinger) */}
      <SyncTibModal
        isOpen={isSyncTibModalOpen}
        onClose={() => setIsSyncTibModalOpen(false)}
        onRefreshData={onRefreshData}
      />

      {/* Modal de Foto y Evidencia TIB Individual */}
      <TibImageModal
        isOpen={isTibModalOpen}
        onClose={() => {
          setIsTibModalOpen(false);
          setSelectedTibPkg(null);
        }}
        paquete={selectedTibPkg}
        onImageLoaded={handleTibImageLoaded}
      />

      {/* Modal de Sincronización y Asignación Masiva de Fotos TIB */}
      <SyncTibImagesModal
        isOpen={isSyncTibImagesModalOpen}
        onClose={() => setIsSyncTibImagesModalOpen(false)}
        paquetesActuales={paquetes}
        onRefreshData={onRefreshData}
        onPackageUpdated={handleTibBulkPackageUpdated}
      />
    </div>
  );
}
