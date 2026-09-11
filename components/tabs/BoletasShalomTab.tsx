'use client';

import React, { useState } from 'react';
import { BoletaShalom } from '@/types';
import './boletas-shalom.css';
import {
  useBoletasShalomData,
  ShalomHeader,
  ShalomKpiGrid,
  ShalomFilterBar,
  ShalomTable,
  ShalomPdfViewerPanel,
  ShalomUploadModal,
  ShalomEditModal,
  ShalomDeleteModal,
  shalomService
} from '@/features/boletas-shalom';

export default function BoletasShalomTab() {
  const {
    boletas,
    selectedBoleta,
    setSelectedBoleta,
    isLoading,
    copiedId,
    fetchError,
    stats,
    searchQuery,
    setSearchQuery,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    dayFilter,
    setDayFilter,
    destinoFilter,
    setDestinoFilter,
    modalidadFilter,
    setModalidadFilter,
    totalCount,
    yearOptions,
    fetchBoletas,
    handleCopy,
    handleClearFilters
  } = useBoletasShalomData();

  // Modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoleta, setEditingBoleta] = useState<BoletaShalom | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBoleta, setDeletingBoleta] = useState<BoletaShalom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Abrir modal de edición
  const handleOpenEdit = (boleta: BoletaShalom, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoleta(boleta);
    setIsEditModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDelete = (boleta: BoletaShalom, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBoleta(boleta);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingBoleta) return;
    setIsDeleting(true);
    try {
      await shalomService.deleteBoleta(deletingBoleta.id);
      setIsDeleteModalOpen(false);
      setDeletingBoleta(null);
      if (selectedBoleta && selectedBoleta.id === deletingBoleta.id) {
        setSelectedBoleta(null);
      }
      fetchBoletas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar boleta');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="boletas-shalom-theme">
      {/* Encabezado Principal */}
      <ShalomHeader
        isLoading={isLoading}
        onRefresh={() => fetchBoletas()}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* KPI Cards */}
      <ShalomKpiGrid stats={stats} />

      {/* Barra de Búsqueda y Filtros */}
      <ShalomFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        yearFilter={yearFilter}
        onYearChange={setYearFilter}
        yearOptions={yearOptions}
        monthFilter={monthFilter}
        onMonthChange={setMonthFilter}
        dayFilter={dayFilter}
        onDayChange={setDayFilter}
        destinoFilter={destinoFilter}
        onDestinoChange={setDestinoFilter}
        modalidadFilter={modalidadFilter}
        onModalidadChange={setModalidadFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Master-Detail Layout */}
      <div className={`shalom-main-layout ${selectedBoleta ? 'with-viewer' : ''}`}>
        {/* Tabla de Resultados */}
        <ShalomTable
          boletas={boletas}
          totalCount={totalCount}
          selectedBoleta={selectedBoleta}
          isLoading={isLoading}
          fetchError={fetchError}
          copiedId={copiedId}
          onSelectBoleta={setSelectedBoleta}
          onCopy={handleCopy}
          onOpenEdit={handleOpenEdit}
          onOpenDelete={handleOpenDelete}
          onRetry={() => fetchBoletas()}
        />

        {/* Visor de PDF Integrado In-App */}
        {selectedBoleta && (
          <ShalomPdfViewerPanel
            selectedBoleta={selectedBoleta}
            copiedId={copiedId}
            onCopy={handleCopy}
            onClose={() => setSelectedBoleta(null)}
          />
        )}
      </div>

      {/* Modal de Carga Asistida con OCR */}
      <ShalomUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSaved={() => fetchBoletas()}
      />

      {/* Modal de Edición */}
      <ShalomEditModal
        isOpen={isEditModalOpen}
        boleta={editingBoleta}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBoleta(null);
        }}
        onUpdated={(updatedBoleta) => {
          fetchBoletas();
          if (selectedBoleta && selectedBoleta.id === updatedBoleta.id) {
            setSelectedBoleta(updatedBoleta);
          }
        }}
      />

      {/* Modal de Eliminación */}
      <ShalomDeleteModal
        isOpen={isDeleteModalOpen}
        boleta={deletingBoleta}
        isDeleting={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBoleta(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
