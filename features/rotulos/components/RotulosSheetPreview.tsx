'use client';

import React from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { MAX_SHEETS, getAgencyClass } from '../types';

interface RotulosSheetPreviewProps {
  slots: RotuloSlotData[];
  currentSheetSlots: RotuloSlotData[];
  currentSheet: number;
  totalSheets: number;
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;
  setCurrentSheet: (sheet: number) => void;
  handleSelectSheet: (sheet: number) => void;
  handleAddNewSheet: () => void;
  handleDeleteCurrentSheet: () => void;
}

export const RotulosSheetPreview: React.FC<RotulosSheetPreviewProps> = ({
  slots,
  currentSheetSlots,
  currentSheet,
  totalSheets,
  activeSlotId,
  setActiveSlotId,
  setCurrentSheet,
  handleSelectSheet,
  handleAddNewSheet,
  handleDeleteCurrentSheet
}) => {
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);

  const renderStrip = (slot: RotuloSlotData, isInteractive = true) => {
    const hasData = Boolean(slot.nombre || slot.dni || slot.celular || slot.destino);
    const agencyClass = getAgencyClass(slot.agencia);
    const agencyDisplayName =
      slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
        ? slot.agenciaOtra
        : (slot.agencia || 'SIN AGENCIA');

    const sheetNum = Math.ceil(slot.id / 5);
    const slotInSheet = ((slot.id - 1) % 5) + 1;
    const isEditingThisSlot = isInteractive && slot.id === activeSlotId;

    return (
      <div
        key={slot.id}
        className={`rotulo-strip-preview ${isEditingThisSlot ? 'active' : ''}`}
        onClick={
          isInteractive
            ? () => {
                setActiveSlotId(slot.id);
                setCurrentSheet(sheetNum);
              }
            : undefined
        }
        title={isInteractive ? `Clic para editar Hoja ${sheetNum} — Espacio #${slotInSheet}` : undefined}
      >
        {hasData ? (
          <>
            <div className="strip-header">
              <div className="strip-header-left">
                <span className="strip-remitente">{(slot.remitente || 'AMEX COURIER PERÚ').toUpperCase()}</span>
                {isEditingThisSlot && (
                  <span className="strip-active-tag">
                    <i className="fa-solid fa-pen-nib"></i> EDITANDO ESPACIO #{slotInSheet}
                  </span>
                )}
              </div>
              {slot.observacion && (
                <span className="strip-bulto-badge">
                  <i className="fa-solid fa-box-archive" style={{ marginRight: '5px' }}></i>
                  {slot.observacion.toUpperCase()}
                </span>
              )}
            </div>

            <div className="strip-destinatario-row">
              <div className="strip-destinatario" title={slot.nombre}>
                {slot.nombre || 'NOMBRE Y APELLIDO'}
              </div>
              {slot.siglas?.trim() && (
                <div className="strip-siglas-badge" title="Siglas / Código de envío">
                  {slot.siglas.trim().toUpperCase()}
                </div>
              )}
            </div>

            <div className="strip-docs-column">
              <div className="strip-doc-line">
                <span className="strip-doc-label">DNI / RUC:</span>
                <strong className="strip-doc-value">{slot.dni || '—'}</strong>
              </div>
              <div className="strip-doc-line">
                <span className="strip-doc-label">CEL:</span>
                <strong className="strip-doc-value">{slot.celular || '—'}</strong>
              </div>
            </div>

            <div className="strip-agency-row">
              <span className={`strip-agency-badge ${agencyClass}`} title={`Agencia: ${agencyDisplayName}`}>
                {agencyDisplayName}
              </span>
              <div className="strip-destination-box">
                <span className="strip-destination-label">DESTINO:</span>
                <span className="strip-destination-value">
                  {slot.destino?.trim() ? slot.destino.trim().toUpperCase() : 'DESTINO NO ESPECIFICADO'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="strip-empty-placeholder">
            <span>
              <i className="fa-regular fa-square-plus" style={{ marginRight: '6px', opacity: 0.7 }}></i>
              [ Hoja {sheetNum} — Espacio #{slotInSheet} libre {isInteractive ? '• Clic para editar' : ''} ]
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rotulos-preview-container">
      {/* Barra Navegadora de Hojas A4 */}
      <div className="preview-sheet-navigator">
        <div className="sheet-nav-left">
          <div className="sheet-tabs-list">
            {Array.from({ length: totalSheets }, (_, i) => {
              const sheetNum = i + 1;
              const sheetSlots = slots.slice(i * 5, (i + 1) * 5);
              const filledCount = sheetSlots.filter((s) => Boolean(s.nombre?.trim() || s.destino?.trim())).length;
              const isActive = sheetNum === currentSheet;

              return (
                <button
                  key={sheetNum}
                  type="button"
                  className={`sheet-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectSheet(sheetNum)}
                  title={`Ver Hoja ${sheetNum} (${filledCount}/5 con datos)`}
                >
                  <i className="fa-regular fa-file"></i>
                  <span className="sheet-tab-name">Hoja {sheetNum}</span>
                  <span className={`sheet-tab-pill ${filledCount === 5 ? 'full' : filledCount > 0 ? 'partial' : 'empty'}`}>
                    {filledCount}/5
                  </span>
                </button>
              );
            })}
          </div>

          {totalSheets < MAX_SHEETS && (
            <button
              type="button"
              className="btn-add-sheet"
              onClick={handleAddNewSheet}
              title="Agregar una nueva hoja A4 (+5 rótulos)"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Nueva Hoja</span>
            </button>
          )}
        </div>

        <div className="sheet-nav-right">
          {/* Controles de Zoom para Vista Previa en Pantalla */}
          <div className="preview-zoom-controls" title="Ajustar tamaño visual de la hoja en pantalla">
            <button
              type="button"
              className="btn-zoom"
              onClick={() => setZoomLevel((prev) => Math.max(75, prev - 10))}
              disabled={zoomLevel <= 75}
              title="Reducir vista previa (-10%)"
            >
              <i className="fa-solid fa-magnifying-glass-minus"></i>
            </button>
            <button
              type="button"
              className="btn-zoom-reset"
              onClick={() => setZoomLevel(100)}
              title="Restablecer zoom a 100%"
            >
              <span>{zoomLevel}%</span>
            </button>
            <button
              type="button"
              className="btn-zoom"
              onClick={() => setZoomLevel((prev) => Math.min(135, prev + 10))}
              disabled={zoomLevel >= 135}
              title="Aumentar vista previa (+10%)"
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          </div>

          <span className="sheet-nav-total-pill">
            <i className="fa-solid fa-layer-group"></i>
            <span>{slots.length} rótulos ({totalSheets}/{MAX_SHEETS} {totalSheets === 1 ? 'hoja' : 'hojas'})</span>
          </span>

          {totalSheets > 1 && (
            <button
              type="button"
              className="btn-delete-current-sheet"
              onClick={handleDeleteCurrentSheet}
              title={`Eliminar la Hoja #${currentSheet} que estás visualizando`}
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Eliminar Hoja {currentSheet}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hoja A4 en Pantalla con Escala Visual y Altura Adaptativa */}
      <div
        className="rotulos-a4-sheet screen-only-sheet"
        style={zoomLevel !== 100 ? { zoom: `${zoomLevel}%` } : undefined}
      >
        {currentSheetSlots.map((slot) => renderStrip(slot, true))}
      </div>

      {/* Contenedor Oculto para Impresión (window.print()) con todas las hojas físicas */}
      <div className="print-sheets-wrapper">
        {Array.from({ length: totalSheets }, (_, sheetIdx) => {
          const pageSlots = slots.slice(sheetIdx * 5, (sheetIdx + 1) * 5);
          return (
            <div key={sheetIdx} className="rotulos-a4-sheet print-sheet-page">
              {pageSlots.map((slot) => renderStrip(slot, false))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
