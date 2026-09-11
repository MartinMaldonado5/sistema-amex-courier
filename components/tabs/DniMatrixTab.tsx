'use client';

import React from 'react';
import './dni-matrix.css';
import { dniDb } from '@/lib/dni-matrix/db';
import {
  DniMatrixTabProps,
  useDniMatrixState,
  useDniExport,
  DniDropzonePanel,
  DniSlotEditor,
  DniToolbar,
  DniSlotsGrid,
  DniConfigModal,
  DniPreviewModal,
  DniPdfConverterModal,
  DniLinkClientModal,
  DniDeleteConfirmModal,
  DniZoomModal
} from '@/features/dni-matrix';

export default function DniMatrixTab({
  paquetes = [],
  clientes = [],
  onGlobalRefresh,
  isRefreshing = false
}: DniMatrixTabProps) {
  // 1. Hook de Estado del Lote, Matriz, Arrastre/Pegado e IA
  const state = useDniMatrixState();

  // 2. Hook de Exportación DOCX, ZIP, PDF y Conversión Masiva
  const exportOps = useDniExport({
    slotsData: state.slotsData,
    printSize: state.printSize,
    showToast: state.showToast,
    playSound: state.playSound
  });

  return (
    <div className="dni-matrix-theme">
      {/* 1. CONTENEDOR PRINCIPAL: DOS PANELES */}
      <main className="main-workspace">
        {/* PANEL IZQUIERDO: ÁREA DE PEGADO Y PREVISUALIZACIÓN DNI */}
        <DniDropzonePanel
          activeSlot={state.activeSlot}
          activeSlotId={state.activeSlotId}
          focusedSide={state.focusedSide}
          setFocusedSide={state.setFocusedSide}
          dragHoverSide={state.dragHoverSide}
          setDragHoverSide={state.setDragHoverSide}
          previewZoom={state.previewZoom}
          setPreviewZoom={state.setPreviewZoom}
          setZoomImage={state.setZoomImage}
          rotateSide={state.rotateSide}
          clearSide={state.clearSide}
          swapSides={state.swapSides}
          padNum={state.padNum}
          extractBase64FromDataTransfer={state.extractBase64FromDataTransfer}
          processImagePayload={state.processImagePayload}
        />

        {/* COLUMNA DERECHA: EXPEDIENTE ACTIVO, BARRA DE ACCIONES Y MATRIZ DE CUPOS */}
        <div className="matrix-column">
          {/* Indicador de Expediente Activo, Metadatos y Navegación */}
          <DniSlotEditor
            activeSlot={state.activeSlot}
            activeSlotId={state.activeSlotId}
            totalSlots={state.totalSlots}
            activeStatus={state.activeStatus}
            isExtractingName={state.isExtractingName}
            padNum={state.padNum}
            updateSlot={state.updateSlot}
            jumpToNextIncompleteSlot={state.jumpToNextIncompleteSlot}
            handleExtractNameWithAi={state.handleExtractNameWithAi}
            setActiveSlotId={state.setActiveSlotId}
            playSound={state.playSound}
          />

          {/* Barra de Acciones y Herramientas Globales */}
          <DniToolbar
            soundEnabled={state.soundEnabled}
            setSoundEnabled={state.setSoundEnabled}
            onSaveSetting={(key, val) => dniDb.saveSetting(key, val)}
            showToast={state.showToast}
            isExporting={exportOps.isExporting}
            exportStatusMessage={exportOps.exportStatusMessage}
            showExportMenu={exportOps.showExportMenu}
            openUpwards={exportOps.openUpwards}
            exportMenuRef={exportOps.exportMenuRef}
            toggleExportMenu={exportOps.toggleExportMenu}
            setShowExportMenu={exportOps.setShowExportMenu}
            stats={state.stats}
            handleExportFolder={exportOps.handleExportFolder}
            handleExportMaster={exportOps.handleExportMaster}
            handleExportZip={exportOps.handleExportZip}
            handleExportPdfFolder={exportOps.handleExportPdfFolder}
            handleExportPdfZip={exportOps.handleExportPdfZip}
            setShowPdfModal={state.setShowPdfModal}
            setShowPreviewModal={state.setShowPreviewModal}
            setShowConfigModal={state.setShowConfigModal}
            onGlobalRefresh={onGlobalRefresh}
            isRefreshing={isRefreshing}
          />

          {/* PANEL DERECHO: MATRIZ DE CUPOS */}
          <DniSlotsGrid
            totalSlots={state.totalSlots}
            activeSlotId={state.activeSlotId}
            currentFilter={state.currentFilter}
            setCurrentFilter={state.setCurrentFilter}
            stats={state.stats}
            progressPercent={state.progressPercent}
            filteredSlotIds={state.filteredSlotIds}
            slotsData={state.slotsData}
            quickJumpVal={state.quickJumpVal}
            setQuickJumpVal={state.setQuickJumpVal}
            padNum={state.padNum}
            getSlotStatus={state.getSlotStatus}
            setActiveSlotId={state.setActiveSlotId}
            setFocusedSide={state.setFocusedSide}
            playSound={state.playSound}
          />
        </div>
      </main>

      {/* MODAL: AJUSTES Y CONFIGURACIÓN */}
      <DniConfigModal
        isOpen={state.showConfigModal}
        onClose={() => state.setShowConfigModal(false)}
        totalSlots={state.totalSlots}
        setTotalSlots={state.setTotalSlots}
        printSize={state.printSize}
        setPrintSize={state.setPrintSize}
        onOpenDeleteConfirm={() => state.setShowDeleteConfirmModal(true)}
        showToast={state.showToast}
      />

      {/* MODAL: VISTA PREVIA HOJA A4 REAL */}
      <DniPreviewModal
        isOpen={state.showPreviewModal}
        onClose={() => state.setShowPreviewModal(false)}
        activeSlot={state.activeSlot}
        activeSlotId={state.activeSlotId}
        printSize={state.printSize}
        padNum={state.padNum}
      />

      {/* MODAL: CONVERSOR DOCX A PDF */}
      <DniPdfConverterModal
        isOpen={state.showPdfModal}
        onClose={() => state.setShowPdfModal(false)}
        pdfFolderPath={exportOps.pdfFolderPath}
        onPickPdfFolder={exportOps.handlePickPdfFolder}
        pdfScanCount={exportOps.pdfScanCount}
        pdfDestOption={exportOps.pdfDestOption}
        setPdfDestOption={exportOps.setPdfDestOption}
        pdfConverting={exportOps.pdfConverting}
        pdfProgressMsg={exportOps.pdfProgressMsg}
        pdfProgressPercent={exportOps.pdfProgressPercent}
        pdfSuccessDone={exportOps.pdfSuccessDone}
        pdfConvertedInfo={exportOps.pdfConvertedInfo}
        pdfDirHandle={exportOps.pdfDirHandle}
        onStartPdfConversion={exportOps.handleStartPdfConversion}
      />

      {/* MODAL: VINCULAR CON CLIENTE O GUÍA AMEX */}
      <DniLinkClientModal
        isOpen={state.showAmexLinkModal}
        onClose={() => state.setShowAmexLinkModal(false)}
        activeSlotId={state.activeSlotId}
        activeSlot={state.activeSlot}
        clientes={clientes}
        paquetes={paquetes}
        updateSlot={state.updateSlot}
        showToast={state.showToast}
        padNum={state.padNum}
      />

      {/* MODAL: ZOOM / AMPLIAR DNI */}
      <DniZoomModal
        zoomImage={state.zoomImage}
        onClose={() => state.setZoomImage(null)}
      />

      {/* MODAL: CONFIRMACIÓN ELEGANTE DE BORRADO DE LOTE */}
      <DniDeleteConfirmModal
        isOpen={state.showDeleteConfirmModal}
        onClose={() => state.setShowDeleteConfirmModal(false)}
        totalSlots={state.totalSlots}
        padNum={state.padNum}
        onCleared={() => {
          state.setSlotsData({});
          state.setActiveSlotId(1);
          state.setShowDeleteConfirmModal(false);
          state.setShowConfigModal(false);
        }}
        showToast={state.showToast}
      />

      {/* TOAST CONTAINER FLOTANTE */}
      <div className="toast-container">
        {state.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
