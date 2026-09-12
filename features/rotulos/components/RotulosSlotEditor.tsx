'use client';

import React from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { generarTextoBulto } from '../types';
import { RotulosToolbar } from './RotulosToolbar';

interface RotulosSlotEditorProps {
  activeSlot: RotuloSlotData;
  activeSheetNum: number;
  totalSheets: number;
  currentSheet: number;
  currentSheetSlots: RotuloSlotData[];
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;
  updateActiveSlot: (fields: Partial<RotuloSlotData>) => void;
  handleSmartCopyToNextFreeSlot: () => void;
  handleClearActiveSlot: () => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
  // Toolbar props
  isAiCardExpanded: boolean;
  setIsAiCardExpanded: (expanded: boolean) => void;
  aiInputText: string;
  setAiInputText: (text: string) => void;
  aiImagePreview: string | null;
  setAiImagePreview: (preview: string | null) => void;
  isAiProcessing: boolean;
  handleProcessWithAmexito: () => void;
  handlePasteCapture: (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => void;
  amexitoRef: React.RefObject<HTMLDivElement | null>;
  isAgencyDropdownOpen: boolean;
  setIsAgencyDropdownOpen: (open: boolean) => void;
  agencyDropdownRef: React.RefObject<HTMLDivElement | null>;
  isMasterActionsOpen: boolean;
  setIsMasterActionsOpen: (open: boolean) => void;
  masterActionsRef: React.RefObject<HTMLDivElement | null>;
  isExportingPdf: boolean;
  handlePrintDirect: () => void;
  handleDownloadPdf: () => void;
  handleAddNewSheet: () => void;
  handleDeleteCurrentSheet: () => void;
  handleClearCurrentSheet: () => void;
  handleClearAll: () => void;
  // Counters
  totalRotulos: string;
  totalCajas: string;
  handleTotalRotulosChange: (val: string) => void;
  handleTotalRotulosBlur: () => void;
  handleTotalCajasChange: (val: string) => void;
  handleTotalCajasBlur: () => void;
  handleNumericKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleNumericPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
}

export const RotulosSlotEditor: React.FC<RotulosSlotEditorProps> = ({
  activeSlot,
  activeSheetNum,
  totalSheets,
  currentSheet,
  currentSheetSlots,
  activeSlotId,
  setActiveSlotId,
  updateActiveSlot,
  handleSmartCopyToNextFreeSlot,
  handleClearActiveSlot,
  playSound,
  isAiCardExpanded,
  setIsAiCardExpanded,
  aiInputText,
  setAiInputText,
  aiImagePreview,
  setAiImagePreview,
  isAiProcessing,
  handleProcessWithAmexito,
  handlePasteCapture,
  amexitoRef,
  isAgencyDropdownOpen,
  setIsAgencyDropdownOpen,
  agencyDropdownRef,
  isMasterActionsOpen,
  setIsMasterActionsOpen,
  masterActionsRef,
  isExportingPdf,
  handlePrintDirect,
  handleDownloadPdf,
  handleAddNewSheet,
  handleDeleteCurrentSheet,
  handleClearCurrentSheet,
  handleClearAll,
  totalRotulos,
  totalCajas,
  handleTotalRotulosChange,
  handleTotalRotulosBlur,
  handleTotalCajasChange,
  handleTotalCajasBlur,
  handleNumericKeyDown,
  handleNumericPaste
}) => {
  return (
    <div className="rotulos-editor-card">
      {/* Cabecera del editor */}
      <div className="slot-editor-header">
        <div className="slot-badge-title">
          <div className="slot-sheet-pill">
            <i className="fa-solid fa-file-lines"></i>
            <span>Hoja {activeSheetNum} de {totalSheets}</span>
          </div>
          <div className="slot-number-pill">
            <i className="fa-solid fa-pen-to-square"></i>
            <span>Hoja {activeSheetNum} • Espacio #{((activeSlot.id - 1) % 5) + 1}</span>
          </div>
        </div>

        <div className="slot-header-actions">
          <button
            type="button"
            className="btn-smart-copy"
            onClick={handleSmartCopyToNextFreeSlot}
            title="Copiar este rótulo en el siguiente espacio libre (omite ocupados y crea hoja si es necesario)"
          >
            <i className="fa-solid fa-bolt-lightning"></i>
            <span>Copiar en sig. libre</span>
          </button>
          <button
            type="button"
            className="btn-clear-slot-header"
            onClick={handleClearActiveSlot}
            title={`Limpiar datos de Hoja ${activeSheetNum} — Espacio #${((activeSlot.id - 1) % 5) + 1}`}
          >
            <i className="fa-solid fa-eraser"></i>
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Selector Rápido de Rótulos de la Hoja Actual */}
      <div className="slot-quick-selector">
        <span className="slot-quick-label">
          <i className="fa-solid fa-list-ol"></i>
          <span>Espacios Hoja {currentSheet}:</span>
        </span>
        <div className="slot-quick-btns-row">
          {currentSheetSlots.map((s) => {
            const isSelected = s.id === activeSlotId;
            const hasData = Boolean(s.nombre?.trim() || s.destino?.trim());
            const inSheetNum = ((s.id - 1) % 5) + 1;
            return (
              <button
                key={s.id}
                type="button"
                className={`slot-quick-pill ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
                onClick={() => {
                  setActiveSlotId(s.id);
                  playSound('click');
                }}
                title={`Hoja ${currentSheet} — Espacio #${inSheetNum} ${hasData ? `(${s.nombre || 'Con datos'})` : '(Vacío)'}`}
              >
                <span className="slot-quick-num">#{inSheetNum}</span>
                <span className={`slot-status-dot ${hasData ? 'filled' : 'empty'}`}></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra superior de 3 columnas */}
      <RotulosToolbar
        activeSlot={activeSlot}
        updateActiveSlot={updateActiveSlot}
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
        isAgencyDropdownOpen={isAgencyDropdownOpen}
        setIsAgencyDropdownOpen={setIsAgencyDropdownOpen}
        agencyDropdownRef={agencyDropdownRef}
        isMasterActionsOpen={isMasterActionsOpen}
        setIsMasterActionsOpen={setIsMasterActionsOpen}
        masterActionsRef={masterActionsRef}
        totalSheets={totalSheets}
        currentSheet={currentSheet}
        isExportingPdf={isExportingPdf}
        handlePrintDirect={handlePrintDirect}
        handleDownloadPdf={handleDownloadPdf}
        handleAddNewSheet={handleAddNewSheet}
        handleDeleteCurrentSheet={handleDeleteCurrentSheet}
        handleClearActiveSlot={handleClearActiveSlot}
        handleClearCurrentSheet={handleClearCurrentSheet}
        handleClearAll={handleClearAll}
      />

      {/* Banner si seleccionó 'OTRA' agencia personalizada */}
      {activeSlot.agencia === 'OTRA' && (
        <div className="rotulo-otra-agencia-banner">
          <label className="rotulo-label">Nombre de Agencia Personalizada:</label>
          <input
            type="text"
            className="rotulo-input"
            placeholder="Escribe el nombre de la agencia (ej: Marvisur, Cavassa, Chancas...)"
            value={activeSlot.agenciaOtra || ''}
            onChange={(e) => updateActiveSlot({ agenciaOtra: e.target.value.toUpperCase() })}
            autoFocus
          />
        </div>
      )}

      {/* Formulario de Entrada */}
      <div className="rotulo-form">
        <div className="rotulo-field-group">
          <label className="rotulo-label">Nombre(s) y Apellidos del Destinatario:</label>
          <input
            type="text"
            className="rotulo-input"
            placeholder=""
            value={activeSlot.nombre}
            onChange={(e) => updateActiveSlot({ nombre: e.target.value.toUpperCase() })}
            autoFocus
          />
        </div>

        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">DNI / RUC / CE:</label>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                color: (activeSlot.dni?.length || 0) > 0 ? '#38bdf8' : '#94a3b8'
              }}
            >
              {activeSlot.dni?.length || 0} / 11 dígitos
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            className="rotulo-input rotulo-input-dni"
            placeholder="Hasta 11 dígitos numéricos"
            value={activeSlot.dni}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 11);
              updateActiveSlot({ dni: onlyNums });
            }}
          />
        </div>

        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">Celular / Teléfono:</label>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                color: (activeSlot.celular?.length || 0) === 9 ? '#34d399' : (activeSlot.celular?.length || 0) > 0 ? '#38bdf8' : '#94a3b8'
              }}
            >
              {activeSlot.celular?.length || 0} / 9 dígitos
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            className="rotulo-input rotulo-input-cel"
            placeholder="Hasta 9 dígitos numéricos"
            value={activeSlot.celular}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 9);
              updateActiveSlot({ celular: onlyNums });
            }}
          />
        </div>

        {/* Destino y Agencia de Entrega */}
        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">Destino / Agencia de Entrega:</label>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                color: (activeSlot.destino?.length || 0) >= 105 ? '#f87171' : '#94a3b8'
              }}
            >
              {activeSlot.destino?.length || 0} / 110 car.
            </span>
          </div>
          <input
            type="text"
            className="rotulo-input"
            maxLength={110}
            placeholder=""
            value={activeSlot.destino}
            onChange={(e) => updateActiveSlot({ destino: e.target.value.toUpperCase() })}
          />
        </div>

        {/* Control Logístico de Bultos y Total de Cajas */}
        <div className="rotulo-embalaje-card">
          <div className="embalaje-card-header">
            <span className="embalaje-card-title">
              <i className="fa-solid fa-boxes-packing"></i>
              <span>Bultos y Total de Cajas</span>
            </span>
          </div>

          <div className="rotulo-row-3">
            <div className="rotulo-field-group">
              <label className="rotulo-label">Cant. Rótulos:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rotulo-input"
                placeholder=""
                value={totalRotulos}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => handleTotalRotulosChange(e.target.value)}
                onBlur={handleTotalRotulosBlur}
                onPaste={handleNumericPaste}
                title="Cantidad de rótulos del pedido (solo números). Al poner 2 o 3 se duplican automáticamente en los espacios libres"
              />
            </div>

            <div className="rotulo-field-group">
              <label className="rotulo-label">Total Cajas:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rotulo-input"
                placeholder=""
                value={totalCajas}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => handleTotalCajasChange(e.target.value)}
                onBlur={handleTotalCajasBlur}
                onPaste={handleNumericPaste}
                title="Cantidad total de cajas enviadas por el cliente (solo números)"
              />
            </div>

            <div className="rotulo-field-group">
              <label className="rotulo-label">Siglas / Código:</label>
              <input
                type="text"
                className="rotulo-input rotulo-input-siglas"
                placeholder=""
                value={activeSlot.siglas || ''}
                onChange={(e) => updateActiveSlot({ siglas: e.target.value.toUpperCase() })}
                title="Siglas identificadoras o clave del envío (ej: CE150, CP 68)"
              />
            </div>
          </div>

          <div className="embalaje-preview-bar">
            <span className="embalaje-preview-label">Formato rótulo #{activeSlot.id}:</span>
            <strong className="embalaje-preview-value">
              {generarTextoBulto(activeSlot.numeroRotulo || 1, Number(totalRotulos) || 1, totalCajas || '1')}
              {activeSlot.siglas?.trim() ? ` • [${activeSlot.siglas.trim().toUpperCase()}]` : ''}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
