'use client';

import React from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { AVAILABLE_AGENCIES, MAX_SHEETS, getAgencyClass } from '../types';
import { AmexitoAiRotulosPanel } from './AmexitoAiRotulosPanel';

interface RotulosToolbarProps {
  activeSlot: RotuloSlotData;
  updateActiveSlot: (fields: Partial<RotuloSlotData>) => void;
  // AI props
  isAiCardExpanded: boolean;
  setIsAiCardExpanded: (expanded: boolean) => void;
  aiInputText: string;
  setAiInputText: (text: string) => void;
  aiImagePreview: string | null;
  setAiImagePreview: (preview: string | null) => void;
  isAiProcessing: boolean;
  handleProcessWithAmexito: () => void;
  handlePasteCapture: (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
  amexitoRef: React.RefObject<HTMLDivElement | null>;
  // Dropdown states & refs
  isAgencyDropdownOpen: boolean;
  setIsAgencyDropdownOpen: (open: boolean) => void;
  agencyDropdownRef: React.RefObject<HTMLDivElement | null>;
  isMasterActionsOpen: boolean;
  setIsMasterActionsOpen: (open: boolean) => void;
  masterActionsRef: React.RefObject<HTMLDivElement | null>;
  // Actions
  totalSheets: number;
  currentSheet: number;
  isExportingPdf: boolean;
  handlePrintDirect: () => void;
  handleDownloadPdf: () => void;
  handleAddNewSheet: () => void;
  handleDeleteCurrentSheet: () => void;
  handleClearActiveSlot: () => void;
  handleClearCurrentSheet: () => void;
  handleClearAll: () => void;
}

export const RotulosToolbar: React.FC<RotulosToolbarProps> = ({
  activeSlot,
  updateActiveSlot,
  isAiCardExpanded,
  setIsAiCardExpanded,
  aiInputText,
  setAiInputText,
  aiImagePreview,
  setAiImagePreview,
  isAiProcessing,
  handleProcessWithAmexito,
  handlePasteCapture,
  playSound,
  amexitoRef,
  isAgencyDropdownOpen,
  setIsAgencyDropdownOpen,
  agencyDropdownRef,
  isMasterActionsOpen,
  setIsMasterActionsOpen,
  masterActionsRef,
  totalSheets,
  currentSheet,
  isExportingPdf,
  handlePrintDirect,
  handleDownloadPdf,
  handleAddNewSheet,
  handleDeleteCurrentSheet,
  handleClearActiveSlot,
  handleClearCurrentSheet,
  handleClearAll
}) => {
  return (
    <div className="rotulo-top-toolbar-3col">
      {/* 1. IZQUIERDA: AMEXito IA */}
      <AmexitoAiRotulosPanel
        isAiCardExpanded={isAiCardExpanded}
        setIsAiCardExpanded={setIsAiCardExpanded}
        aiInputText={aiInputText}
        setAiInputText={setAiInputText}
        aiImagePreview={aiImagePreview}
        setAiImagePreview={setAiImagePreview}
        isAiProcessing={isAiProcessing}
        handleProcessWithAmexito={handleProcessWithAmexito}
        handlePasteCapture={handlePasteCapture}
        playSound={playSound}
        amexitoRef={amexitoRef}
      />

      {/* 2. MEDIO: Selector de Agencia de Envío */}
      <div className="rotulo-toolbar-col agency" ref={agencyDropdownRef}>
        <button
          type="button"
          className={`btn-toolbar-col btn-agency-col ${isAgencyDropdownOpen ? 'open' : ''} ${getAgencyClass(activeSlot.agencia)}`}
          onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
          title="Haz clic para seleccionar la agencia de envío"
        >
          <div className="btn-col-content">
            <span className="agency-col-icon">
              <i className={AVAILABLE_AGENCIES.find((a) => a.id === activeSlot.agencia)?.icon || 'fa-solid fa-truck-ramp-box'}></i>
            </span>
            <span className={`btn-col-title ${!activeSlot.agencia ? 'unselected-title' : ''}`}>
              {activeSlot.agencia === 'OTRA' && activeSlot.agenciaOtra?.trim()
                ? activeSlot.agenciaOtra
                : activeSlot.agencia || 'Elegir Agencia'}
            </span>
          </div>
          <div className="btn-col-right">
            <i className={`fa-solid ${isAgencyDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
          </div>
        </button>

        {isAgencyDropdownOpen && (
          <div className="agency-dropdown-menu">
            <div className="agency-dropdown-header">
              <i className="fa-solid fa-truck-ramp-box"></i>
              <span>SELECCIONAR AGENCIA ({AVAILABLE_AGENCIES.length})</span>
            </div>

            <div className="agency-dropdown-list">
              {AVAILABLE_AGENCIES.map((agency) => {
                const isSelected = activeSlot.agencia === agency.id;
                return (
                  <button
                    key={agency.id}
                    type="button"
                    className={`agency-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      updateActiveSlot({
                        agencia: agency.id,
                        agenciaOtra: agency.id === 'OTRA' ? (activeSlot.agenciaOtra || '') : undefined
                      });
                      setIsAgencyDropdownOpen(false);
                      playSound('click');
                    }}
                  >
                    <div
                      className="agency-item-icon-box"
                      style={{
                        background: `${agency.color}20`,
                        color: agency.color,
                        borderColor: `${agency.color}50`
                      }}
                    >
                      <i className={agency.icon}></i>
                    </div>

                    <div className="agency-item-info">
                      <span className="agency-item-name">{agency.name}</span>
                    </div>

                    {isSelected && (
                      <div className="agency-item-check">
                        <i className="fa-solid fa-check"></i>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. DERECHA: Botón Maestro de Acciones */}
      <div className="rotulo-toolbar-col actions" ref={masterActionsRef}>
        <button
          type="button"
          className={`btn-toolbar-col btn-actions-col ${isMasterActionsOpen ? 'open' : ''}`}
          onClick={() => {
            setIsMasterActionsOpen(!isMasterActionsOpen);
            playSound('click');
          }}
          title="Haz clic para ver opciones de impresión, PDF y limpieza"
        >
          <div className="btn-col-content">
            <span className="actions-col-icon">
              <i className="fa-solid fa-sliders"></i>
            </span>
            <span className="btn-col-title">Acciones</span>
          </div>
          <div className="btn-col-right">
            <span className="actions-badge-pill">
              {5 + (totalSheets < MAX_SHEETS ? 1 : 0) + (totalSheets > 1 ? 1 : 0)}
            </span>
            <i className={`fa-solid ${isMasterActionsOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
          </div>
        </button>

        {isMasterActionsOpen && (
          <div className="master-actions-dropdown-menu">
            <div className="master-actions-menu-header">
              <i className="fa-solid fa-sliders"></i>
              <span>ACCIONES RÁPIDAS</span>
            </div>

            <div className="master-actions-list">
              <button
                type="button"
                className="master-action-item print-item"
                onClick={() => {
                  setIsMasterActionsOpen(false);
                  handlePrintDirect();
                }}
                title="Imprimir directamente a escala real (Ctrl + P)"
              >
                <div className="master-action-icon-box print">
                  <i className="fa-solid fa-print"></i>
                </div>
                <span className="master-action-name">Imprimir A4</span>
              </button>

              <button
                type="button"
                className="master-action-item pdf-item"
                onClick={() => {
                  setIsMasterActionsOpen(false);
                  handleDownloadPdf();
                }}
                disabled={isExportingPdf}
                title="Descargar documento PDF listo para imprimir"
              >
                <div className="master-action-icon-box pdf">
                  {isExportingPdf ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <i className="fa-solid fa-file-pdf"></i>
                  )}
                </div>
                <span className="master-action-name">
                  {isExportingPdf ? 'Generando...' : 'Descargar PDF'}
                </span>
              </button>

              <div className="master-actions-divider"></div>

              {totalSheets < MAX_SHEETS && (
                <button
                  type="button"
                  className="master-action-item add-sheet-item"
                  onClick={() => {
                    setIsMasterActionsOpen(false);
                    handleAddNewSheet();
                  }}
                  title="Agregar una nueva hoja A4 (+5 rótulos)"
                >
                  <div className="master-action-icon-box add">
                    <i className="fa-solid fa-plus"></i>
                  </div>
                  <span className="master-action-name">Nueva Hoja</span>
                </button>
              )}

              {totalSheets > 1 && (
                <button
                  type="button"
                  className="master-action-item del-sheet-item"
                  onClick={() => {
                    setIsMasterActionsOpen(false);
                    handleDeleteCurrentSheet();
                  }}
                  title={`Eliminar la Hoja #${currentSheet} actual`}
                >
                  <div className="master-action-icon-box delete">
                    <i className="fa-solid fa-trash-can"></i>
                  </div>
                  <span className="master-action-name">Eliminar Hoja {currentSheet}</span>
                </button>
              )}

              <div className="master-actions-divider"></div>

              <button
                type="button"
                className="master-action-item clear-slot-item"
                onClick={() => {
                  setIsMasterActionsOpen(false);
                  handleClearActiveSlot();
                }}
                title={`Limpiar los datos del espacio #${activeSlot.id}`}
              >
                <div className="master-action-icon-box warning">
                  <i className="fa-solid fa-eraser"></i>
                </div>
                <span className="master-action-name">Limpiar Espacio #{activeSlot.id}</span>
              </button>

              <button
                type="button"
                className="master-action-item clear-sheet-item"
                onClick={() => {
                  setIsMasterActionsOpen(false);
                  handleClearCurrentSheet();
                }}
                title={`Limpiar los 5 espacios de la Hoja #${currentSheet}`}
              >
                <div className="master-action-icon-box warning">
                  <i className="fa-solid fa-broom"></i>
                </div>
                <span className="master-action-name">Limpiar Hoja #{currentSheet}</span>
              </button>

              <button
                type="button"
                className="master-action-item clear-all-item"
                onClick={() => {
                  setIsMasterActionsOpen(false);
                  handleClearAll();
                }}
                title="Reiniciar todas las hojas a 1 hoja limpia"
              >
                <div className="master-action-icon-box danger">
                  <i className="fa-solid fa-rotate-left"></i>
                </div>
                <span className="master-action-name">Reiniciar Todo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
