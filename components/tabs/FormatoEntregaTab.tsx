'use client';

import React from 'react';
import './formato-entrega.css';
import {
  useFormatoEntrega,
  ActaControlPanel,
  ActaDocumentPreview
} from '@/features/formato-entrega';
import { Cliente, Paquete } from '@/types';

interface FormatoEntregaTabProps {
  clientes?: Cliente[];
  paquetes?: Paquete[];
}

export default function FormatoEntregaTab({
  clientes = [],
  paquetes = []
}: FormatoEntregaTabProps) {
  const {
    formData,
    rawPasteText,
    setRawPasteText,
    singlePackageInput,
    setSinglePackageInput,
    toastMessage,
    isExporting,
    historial,
    isHistorialOpen,
    setIsHistorialOpen,
    updateField,
    handleSelectCliente,
    handleLoadWarehousePackagesForClient,
    handleAddSinglePackage,
    handleProcessPasteText,
    handleRemovePackage,
    handleClearPackages,
    handleResetForm,
    handleRestoreFromHistorial,
    handleDeleteHistorialItem,
    handlePrint,
    handleExportPdf,
    handleExportDocx
  } = useFormatoEntrega(paquetes);

  return (
    <div className="formato-entrega-wrapper">
      {/* Toast Flotante de Notificaciones */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            border: '1.5px solid #38bdf8',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
            zIndex: 99999,
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <i className="fa-solid fa-circle-check text-sky-400"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid Principal: Panel de Control (Izquierda) + Hoja A4 Visual (Derecha) */}
      <div className="formato-entrega-grid">
        <ActaControlPanel
          formData={formData}
          clientes={clientes}
          rawPasteText={rawPasteText}
          singlePackageInput={singlePackageInput}
          isExporting={isExporting}
          historial={historial}
          isHistorialOpen={isHistorialOpen}
          onSetRawPasteText={setRawPasteText}
          onSetSinglePackageInput={setSinglePackageInput}
          onUpdateField={updateField}
          onSelectCliente={handleSelectCliente}
          onLoadWarehousePackages={handleLoadWarehousePackagesForClient}
          onAddSinglePackage={handleAddSinglePackage}
          onProcessPasteText={handleProcessPasteText}
          onRemovePackage={handleRemovePackage}
          onClearPackages={handleClearPackages}
          onResetForm={handleResetForm}
          onPrint={handlePrint}
          onExportPdf={handleExportPdf}
          onExportDocx={handleExportDocx}
          onOpenHistorial={setIsHistorialOpen}
          onRestoreHistorial={handleRestoreFromHistorial}
          onDeleteHistorialItem={handleDeleteHistorialItem}
        />

        <ActaDocumentPreview data={formData} />
      </div>
    </div>
  );
}
