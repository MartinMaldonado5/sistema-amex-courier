'use client';

import React from 'react';
import { Paquete, Cliente } from '@/types';
import ThermalLabelModal from '@/components/modals/ThermalLabelModal';
import Modal from '@/components/ui/Modal';
import {
  useInventoryData,
  InventoryStatsCards,
  InventoryToolbar,
  InventoryTable,
  KardexView,
  ShelfMatrixGrid,
  GestorAlmacenView,
  TransferModal,
  EditPackageModal,
  BatchStatusModal,
  ShelfPositionModal,
  EditPositionModal
} from '@/features/inventory';

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

    // Filtros Mapa Anaqueles
    shelfSearchTerm,
    setShelfSearchTerm,
    shelfZoneFilter,
    setShelfZoneFilter,
    shelfOccupancyFilter,
    setShelfOccupancyFilter,

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
    batchTargetStatus,
    setBatchTargetStatus,
    handleBatchStatusChange,
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
    handleExportExcel
  } = useInventoryData({
    paquetes,
    onUpdatePackage,
    onDeletePackage,
    onRefreshData
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Barra de herramientas, subpestañas y filtros */}
      <InventoryToolbar
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
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onOpenTransferModal={() => openTransferModal()}
        onOpenBatchStatusModal={() => setIsBatchStatusModalOpen(true)}
        onBatchDelete={handleBatchDelete}
        onOpenNewPositionModal={() => {
          setNewPositionMode('batch');
          setIsNewPositionModalOpen(true);
        }}
        onOpenMatrizModal={() => setIsMatrizModalOpen(true)}
        onOpenGestorModal={() => setIsGestorModalOpen(true)}
        onOpenKardexModal={() => setIsKardexModalOpen(true)}
        onExportExcel={handleExportExcel}
        onRefreshData={onRefreshData}
        onNewPackage={onNewPackage}
      />

      {/* Tarjetas de estadísticas globales WMS */}
      <InventoryStatsCards paquetes={paquetes} />

      {/* VISTA 1: Existencias y Almacén */}
      {activeSubTab === 'existencias' && (
        <InventoryTable
          filteredPaquetes={filteredPaquetes}
          paginatedPaquetes={paginatedPaquetes}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onOpenTransferModal={openTransferModal}
          onOpenEditModal={openEditModal}
          onSelectThermalPkg={setSelectedThermalPkg}
          onViewPdf={onViewPdf}
          onDeletePackage={handleDeletePackage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          totalPages={totalPages}
        />
      )}

      {/* VISTA 2: Mapa Visual de Anaqueles (Slotting Grid) */}
      {activeSubTab === 'matriz' && (
        <ShelfMatrixGrid
          shelfGroups={shelfGroups}
          paquetes={paquetes}
          shelfSearchTerm={shelfSearchTerm}
          setShelfSearchTerm={setShelfSearchTerm}
          shelfZoneFilter={shelfZoneFilter}
          setShelfZoneFilter={setShelfZoneFilter}
          shelfOccupancyFilter={shelfOccupancyFilter}
          setShelfOccupancyFilter={setShelfOccupancyFilter}
          onOpenNewPositionModal={() => {
            setNewPositionMode('batch');
            setIsNewPositionModalOpen(true);
          }}
          onOpenTransferModal={openTransferModal}
          onFilterShelf={(shelfCode, floorLevel) => {
            setShelfFilter(shelfCode);
            if (floorLevel) setFloorFilter(floorLevel);
            setActiveSubTab('existencias');
          }}
          onEditPosition={setEditingPosition}
        />
      )}

      {/* VISTA 3: Configurar Anaqueles & Parámetros WMS */}
      {activeSubTab === 'gestor' && (
        <GestorAlmacenView
          posicionesList={posicionesList}
          paquetes={paquetes}
          onOpenBatchShelfModal={() => {
            setNewPositionMode('batch');
            setIsNewPositionModalOpen(true);
          }}
          onOpenSinglePositionModal={() => {
            setNewPositionMode('single');
            setIsNewPositionModalOpen(true);
          }}
          onEditPosition={setEditingPosition}
          onFilterShelf={(shelfCode, floorLevel) => {
            setShelfFilter(shelfCode);
            setFloorFilter(floorLevel);
            setActiveSubTab('existencias');
          }}
          onDeletePosition={handleDeletePosition}
        />
      )}

      {/* VISTA 4: Kardex de Movimientos & Trazabilidad */}
      {activeSubTab === 'movimientos' && (
        <KardexView
          kardexList={kardexList}
          filteredKardex={filteredKardex}
          kardexSearch={kardexSearch}
          setKardexSearch={setKardexSearch}
          kardexTypeFilter={kardexTypeFilter}
          setKardexTypeFilter={setKardexTypeFilter}
          isLoadingKardex={isLoadingKardex}
          onRefreshKardex={fetchData}
          onOpenTransferModal={() => openTransferModal()}
        />
      )}

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
        onConfirm={handleBatchStatusChange}
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

      {/* Modal Pop-up: Mapa 3D Slotting */}
      <Modal
        isOpen={isMatrizModalOpen}
        onClose={() => setIsMatrizModalOpen(false)}
        title="🗺️ Mapa Visual de Anaqueles & Slotting"
        subtitle="Visualización y gestión espacial de estanterías en Almacén Lince"
        maxWidth="full"
      >
        <ShelfMatrixGrid
          shelfGroups={shelfGroups}
          paquetes={paquetes}
          shelfSearchTerm={shelfSearchTerm}
          setShelfSearchTerm={setShelfSearchTerm}
          shelfZoneFilter={shelfZoneFilter}
          setShelfZoneFilter={setShelfZoneFilter}
          shelfOccupancyFilter={shelfOccupancyFilter}
          setShelfOccupancyFilter={setShelfOccupancyFilter}
          onOpenNewPositionModal={() => {
            setNewPositionMode('batch');
            setIsNewPositionModalOpen(true);
          }}
          onOpenTransferModal={openTransferModal}
          onFilterShelf={(shelfCode, floorLevel) => {
            setShelfFilter(shelfCode);
            if (floorLevel) setFloorFilter(floorLevel);
            setIsMatrizModalOpen(false);
            setActiveSubTab('existencias');
          }}
          onEditPosition={setEditingPosition}
        />
      </Modal>

      {/* Modal Pop-up: Configuración de Anaqueles */}
      <Modal
        isOpen={isGestorModalOpen}
        onClose={() => setIsGestorModalOpen(false)}
        title="⚙️ Configurar Anaqueles & Parámetros WMS"
        subtitle="Administración de capacidades y zonas de almacenamiento"
        maxWidth="full"
      >
        <GestorAlmacenView
          posicionesList={posicionesList}
          paquetes={paquetes}
          onOpenBatchShelfModal={() => {
            setNewPositionMode('batch');
            setIsNewPositionModalOpen(true);
          }}
          onOpenSinglePositionModal={() => {
            setNewPositionMode('single');
            setIsNewPositionModalOpen(true);
          }}
          onEditPosition={setEditingPosition}
          onFilterShelf={(shelfCode, floorLevel) => {
            setShelfFilter(shelfCode);
            setFloorFilter(floorLevel);
            setIsGestorModalOpen(false);
            setActiveSubTab('existencias');
          }}
          onDeletePosition={handleDeletePosition}
        />
      </Modal>

      {/* Modal Pop-up: Kardex de Movimientos */}
      <Modal
        isOpen={isKardexModalOpen}
        onClose={() => setIsKardexModalOpen(false)}
        title="🔄 Kardex de Movimientos y Auditoría"
        subtitle="Historial de movimientos y trazabilidad física de paquetes"
        maxWidth="full"
      >
        <KardexView
          kardexList={kardexList}
          filteredKardex={filteredKardex}
          kardexSearch={kardexSearch}
          setKardexSearch={setKardexSearch}
          kardexTypeFilter={kardexTypeFilter}
          setKardexTypeFilter={setKardexTypeFilter}
          isLoadingKardex={isLoadingKardex}
          onRefreshKardex={fetchData}
          onOpenTransferModal={() => openTransferModal()}
        />
      </Modal>
    </div>
  );
}
