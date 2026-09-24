'use client';

import React from 'react';
import './invoices.css';
import {
  useInvoice,
  InvoiceControlPanel,
  InvoiceDocumentPreview
} from '@/features/invoices';
import { Cliente } from '@/types';

interface InvoicesTabProps {
  clientes?: Cliente[];
}

export default function InvoicesTab({ clientes = [] }: InvoicesTabProps) {
  const {
    invoiceData,
    toastMessage,
    isExporting,
    historial,
    isHistorialOpen,
    setIsHistorialOpen,
    isPasteModalOpen,
    setIsPasteModalOpen,
    pasteRawText,
    setPasteRawText,
    updateInvoiceNumber,
    generateRandomInvoiceNumber,
    updateInvoiceDate,
    updateInvoiceDueDate,
    setTodayDates,
    updateBillTo,
    updateShipTo,
    copyBillToToShipTo,
    handleSelectCliente,
    addItem,
    removeItem,
    updateItem,
    updateInvoiceAmount,
    handleProcessPasteText,
    handleClearItems,
    handleResetToDefault,
    handleSaveToHistorial,
    handleRestoreFromHistorial,
    handleDeleteHistorialItem,
    handleExportDocx,
    handleExportPdf,
    handlePrint
  } = useInvoice();

  return (
    <div className="invoice-wrapper">
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

      {/* Grid Principal: Formulario de Control (Izquierda) + Hoja A4 Visual (Derecha) */}
      <div className="invoice-grid">
        <InvoiceControlPanel
          data={invoiceData}
          clientes={clientes}
          isExporting={isExporting}
          historial={historial}
          isHistorialOpen={isHistorialOpen}
          setIsHistorialOpen={setIsHistorialOpen}
          isPasteModalOpen={isPasteModalOpen}
          setIsPasteModalOpen={setIsPasteModalOpen}
          pasteRawText={pasteRawText}
          setPasteRawText={setPasteRawText}
          onUpdateInvoiceNumber={updateInvoiceNumber}
          onGenerateRandomNumber={generateRandomInvoiceNumber}
          onUpdateInvoiceDate={updateInvoiceDate}
          onUpdateInvoiceDueDate={updateInvoiceDueDate}
          onSetTodayDates={setTodayDates}
          onUpdateBillTo={updateBillTo}
          onUpdateShipTo={updateShipTo}
          onCopyBillToToShipTo={copyBillToToShipTo}
          onSelectCliente={handleSelectCliente}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
          onUpdateInvoiceAmount={updateInvoiceAmount}
          onProcessPasteText={handleProcessPasteText}
          onClearItems={handleClearItems}
          onResetToDefault={handleResetToDefault}
          onSaveToHistorial={handleSaveToHistorial}
          onRestoreFromHistorial={handleRestoreFromHistorial}
          onDeleteHistorialItem={handleDeleteHistorialItem}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
        />

        <InvoiceDocumentPreview data={invoiceData} />
      </div>
    </div>
  );
}
