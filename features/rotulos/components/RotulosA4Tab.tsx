'use client';

import React from 'react';
import './rotulos-a4.css';
import { useRotulosState } from '../hooks/useRotulosState';
import { RotulosSlotEditor } from './RotulosSlotEditor';
import { RotulosSheetPreview } from './RotulosSheetPreview';
import { RotulosSheetDropdown } from './RotulosSheetDropdown';
import { RotulosHistoryModal } from './RotulosHistoryModal';
import {
  generarTextoBulto,
  MAX_SHEETS,
  AVAILABLE_AGENCIES,
  type AgencyOption,
  type RotuloSlotData
} from '../types';
import type { Cliente } from '@/types';

// Re-exportar tipos y utilidades para compatibilidad retroactiva
export { generarTextoBulto, MAX_SHEETS, AVAILABLE_AGENCIES };
export type { AgencyOption, RotuloSlotData };

interface RotulosA4TabProps {
  clientes?: Cliente[];
  currentUser?: { nombre?: string; email?: string; rol?: string; id?: string } | null;
}

export default function RotulosA4Tab({ clientes = [], currentUser }: RotulosA4TabProps) {
  const state = useRotulosState(currentUser);

  return (
    <div className="rotulos-module-wrapper">
      {/* Toast flotante */}
      {state.feedbackToast && (
        <div
          className="rotulo-toast-feedback no-print"
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

      {/* Barra Superior del Módulo: Título, Cloud Sync y Botón Historial */}
      <div className="rotulos-header-banner no-print">
        <div className="rotulos-header-title-box">
          <div className="rotulos-header-icon-badge">
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <h1 className="rotulos-header-title">Módulo 8: Rótulos A4 de Agencias</h1>
            <p className="rotulos-header-subtitle">
              Generador dinámico para Shalom, Olva Courier, Cruz del Sur y agencias nacionales
            </p>
          </div>
        </div>

        <div className="rotulos-header-actions-box">
          {/* Indicador de sincronización en tiempo real en la nube */}
          <div
            className={`rotulo-cloud-sync-pill status-${state.cloudSyncStatus}`}
            title={
              state.cloudSyncStatus === 'saving'
                ? 'Sincronizando cambios con Supabase...'
                : state.cloudSyncStatus === 'synced'
                ? 'Borrador respaldado en la nube en tiempo real'
                : 'Trabajando en modo local'
            }
          >
            {state.cloudSyncStatus === 'saving' && (
              <>
                <i className="fa-solid fa-arrows-rotate fa-spin"></i>
                <span>Sincronizando...</span>
              </>
            )}
            {state.cloudSyncStatus === 'synced' && (
              <>
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>Nube al día</span>
              </>
            )}
            {state.cloudSyncStatus === 'error' && (
              <>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Error nube</span>
              </>
            )}
            {state.cloudSyncStatus === 'offline' && (
              <>
                <i className="fa-solid fa-hard-drive"></i>
                <span>Borrador local</span>
              </>
            )}
          </div>

          {/* Botón Destacado: Historial de Rótulos */}
          <button
            type="button"
            className="btn-rotulo-history-trigger"
            onClick={() => state.setIsHistoryModalOpen(true)}
            title="Abrir historial de impresiones y reimpresión rápida"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Historial</span>
            {state.todayPrintedCount > 0 && (
              <span className="history-trigger-badge" title={`${state.todayPrintedCount} rótulos impresos hoy`}>
                {state.todayPrintedCount} hoy
              </span>
            )}
          </button>

          {/* Selector Desplegable Vertical de Hoja + Añadir Hoja */}
          <RotulosSheetDropdown
            currentSheet={state.currentSheet}
            totalSheets={state.totalSheets}
            slots={state.slots}
            handleSelectSheet={state.handleSelectSheet}
            handleAddNewSheet={state.handleAddNewSheet}
            handleDeleteCurrentSheet={state.handleDeleteCurrentSheet}
          />
        </div>
      </div>

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
          clientes={clientes}
          canUndo={state.canUndo}
          handleUndo={state.handleUndo}
          slotsAiData={state.slotsAiData}
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
          onOpenHistory={() => state.setIsHistoryModalOpen(true)}
          todayPrintedCount={state.todayPrintedCount}
        />

        <RotulosSheetPreview
          slots={state.slots}
          currentSheetSlots={state.currentSheetSlots}
          currentSheet={state.currentSheet}
          totalSheets={state.totalSheets}
          activeSlotId={state.activeSlotId}
          setActiveSlotId={state.setActiveSlotId}
          setCurrentSheet={state.setCurrentSheet}
          slotsAiData={state.slotsAiData}
          currentUser={currentUser}
        />
      </div>

      {/* Modal de Historial de Rótulos */}
      <RotulosHistoryModal
        isOpen={state.isHistoryModalOpen}
        onClose={() => state.setIsHistoryModalOpen(false)}
        onLoadIntoEditor={state.handleLoadFromHistory}
        currentUser={currentUser}
      />
    </div>
  );
}
