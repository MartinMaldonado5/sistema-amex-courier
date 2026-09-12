'use client';

import React from 'react';
import './rotulos-a4.css';
import {
  useRotulosState,
  RotulosSlotEditor,
  RotulosSheetPreview,
  generarTextoBulto,
  MAX_SHEETS,
  AVAILABLE_AGENCIES,
  type AgencyOption,
  type RotuloSlotData
} from '@/features/rotulos';

// Re-exportar tipos y utilidades para compatibilidad retroactiva
export { generarTextoBulto, MAX_SHEETS, AVAILABLE_AGENCIES };
export type { AgencyOption, RotuloSlotData };

export default function RotulosA4Tab() {
  const state = useRotulosState();

  return (
    <div className="rotulos-module-wrapper">
      {/* Toast flotante */}
      {state.feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            border: '1.5px solid #38bdf8',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {state.feedbackToast}
        </div>
      )}

      {/* Grid de Trabajo: Editor Lateral + Vista Previa A4 */}
      <div className="rotulos-workspace-grid">
        <RotulosSlotEditor
          activeSlot={state.activeSlot}
          activeSheetNum={state.activeSheetNum}
          totalSheets={state.totalSheets}
          currentSheet={state.currentSheet}
          currentSheetSlots={state.currentSheetSlots}
          activeSlotId={state.activeSlotId}
          setActiveSlotId={state.setActiveSlotId}
          updateActiveSlot={state.updateActiveSlot}
          handleSmartCopyToNextFreeSlot={state.handleSmartCopyToNextFreeSlot}
          handleClearActiveSlot={state.handleClearActiveSlot}
          playSound={state.playSound}
          isAiCardExpanded={state.isAiCardExpanded}
          setIsAiCardExpanded={state.setIsAiCardExpanded}
          aiInputText={state.aiInputText}
          setAiInputText={state.setAiInputText}
          aiImagePreview={state.aiImagePreview}
          setAiImagePreview={state.setAiImagePreview}
          isAiProcessing={state.isAiProcessing}
          handleProcessWithAmexito={state.handleProcessWithAmexito}
          handlePasteCapture={state.handlePasteCapture}
          amexitoRef={state.amexitoRef}
          isAgencyDropdownOpen={state.isAgencyDropdownOpen}
          setIsAgencyDropdownOpen={state.setIsAgencyDropdownOpen}
          agencyDropdownRef={state.agencyDropdownRef}
          isMasterActionsOpen={state.isMasterActionsOpen}
          setIsMasterActionsOpen={state.setIsMasterActionsOpen}
          masterActionsRef={state.masterActionsRef}
          isExportingPdf={state.isExportingPdf}
          handlePrintDirect={state.handlePrintDirect}
          handleDownloadPdf={state.handleDownloadPdf}
          handleAddNewSheet={state.handleAddNewSheet}
          handleDeleteCurrentSheet={state.handleDeleteCurrentSheet}
          handleClearCurrentSheet={state.handleClearCurrentSheet}
          handleClearAll={state.handleClearAll}
          totalRotulos={state.totalRotulos}
          totalCajas={state.totalCajas}
          handleTotalRotulosChange={state.handleTotalRotulosChange}
          handleTotalRotulosBlur={state.handleTotalRotulosBlur}
          handleTotalCajasChange={state.handleTotalCajasChange}
          handleTotalCajasBlur={state.handleTotalCajasBlur}
          handleNumericKeyDown={state.handleNumericKeyDown}
          handleNumericPaste={state.handleNumericPaste}
        />

        <RotulosSheetPreview
          slots={state.slots}
          currentSheetSlots={state.currentSheetSlots}
          currentSheet={state.currentSheet}
          totalSheets={state.totalSheets}
          activeSlotId={state.activeSlotId}
          setActiveSlotId={state.setActiveSlotId}
          setCurrentSheet={state.setCurrentSheet}
          handleSelectSheet={state.handleSelectSheet}
          handleAddNewSheet={state.handleAddNewSheet}
          handleDeleteCurrentSheet={state.handleDeleteCurrentSheet}
        />
      </div>
    </div>
  );
}
