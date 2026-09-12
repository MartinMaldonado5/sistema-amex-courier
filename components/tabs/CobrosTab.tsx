'use client';

import React, { useState } from 'react';
import {
  useCobrosData,
  useVoucherForm,
  CobrosKpiCards,
  CobrosToolbar,
  CobrosList,
  NewVoucherForm,
  VoucherViewerModal,
  type CobrosTabProps,
  type CobroVoucher
} from '@/features/cobros';

export type { CobroVoucher };

export default function CobrosTab({
  paquetes = [],
  clientes = [],
  onUpdatePackage
}: CobrosTabProps) {
  const {
    subtab,
    setSubtab,
    cobros,
    loading,
    refreshing,
    searchTerm,
    setSearchTerm,
    methodFilter,
    setMethodFilter,
    metrics,
    filteredCobros,
    fetchCobros,
    handleUpdateStatus
  } = useCobrosData();

  // Visor de Voucher
  const [viewingVoucher, setViewingVoucher] = useState<CobroVoucher | null>(null);

  // Formulario y carga de Voucher
  const {
    voucherFile,
    setVoucherFile,
    voucherPreviewUrl,
    setVoucherPreviewUrl,
    isDragging,
    isSubmitting,
    formValues,
    setFormValues,
    selectedWrs,
    setSelectedWrs,
    wrSearchQuery,
    setWrSearchQuery,
    paquetesDisponibles,
    processImageFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSaveVoucher
  } = useVoucherForm({
    paquetes,
    setSubtab,
    onVoucherSaved: fetchCobros
  });

  return (
    <div className="tab-container" style={{ padding: '16px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* CABECERA PRINCIPAL Y PESTAÑAS */}
      <CobrosToolbar
        metrics={metrics}
        subtab={subtab}
        setSubtab={setSubtab}
        refreshing={refreshing}
        onRefresh={fetchCobros}
        allCobros={cobros}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        methodFilter={methodFilter}
        setMethodFilter={setMethodFilter}
      />

      {/* METRIC CARDS RESUMEN FINANCIERO */}
      <CobrosKpiCards
        metrics={metrics}
        setSubtab={setSubtab}
        setMethodFilter={setMethodFilter}
      />

      {/* SUBTAB 2: REGISTRAR / PEGAR VOUCHER */}
      {subtab === 'nuevo' && (
        <NewVoucherForm
          voucherFile={voucherFile}
          setVoucherFile={setVoucherFile}
          voucherPreviewUrl={voucherPreviewUrl}
          setVoucherPreviewUrl={setVoucherPreviewUrl}
          isDragging={isDragging}
          isSubmitting={isSubmitting}
          formValues={formValues}
          setFormValues={setFormValues}
          selectedWrs={selectedWrs}
          setSelectedWrs={setSelectedWrs}
          wrSearchQuery={wrSearchQuery}
          setWrSearchQuery={setWrSearchQuery}
          paquetesDisponibles={paquetesDisponibles}
          processImageFile={processImageFile}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleSaveVoucher={handleSaveVoucher}
          setSubtab={setSubtab}
        />
      )}

      {/* SUBTAB 1, 3, 4: LISTA / GRILLA DE VOUCHERS */}
      {subtab !== 'nuevo' && (
        <CobrosList
          loading={loading}
          cobros={filteredCobros}
          onOpenViewer={setViewingVoucher}
          onUpdateStatus={handleUpdateStatus}
          setSubtab={setSubtab}
        />
      )}

      {/* MODAL DE VISOR DE VOUCHER CON ZOOM Y ROTACIÓN */}
      <VoucherViewerModal
        voucher={viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
