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
  const renderStrip = (slot: RotuloSlotData, isInteractive = true) => {
    const hasData = Boolean(slot.nombre || slot.dni || slot.celular || slot.destino);
    const agencyClass = getAgencyClass(slot.agencia);
    const agencyDisplayName =
      slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
        ? slot.agenciaOtra
        : slot.agencia;

    const sheetNum = Math.ceil(slot.id / 5);
    const slotInSheet = ((slot.id - 1) % 5) + 1;

    return (
      <div
        key={slot.id}
        className={`rotulo-strip-preview ${isInteractive && slot.id === activeSlotId ? 'active' : ''}`}
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
              <span className="strip-remitente">{(slot.remitente || 'AMEX COURIER PERÚ').toUpperCase()}</span>
              {slot.observacion && (
                <span className="strip-bulto-badge">
                  <i className="fa-solid fa-box-archive" style={{ marginRight: '5px' }}></i>
                  {slot.observacion.toUpperCase()}
                </span>
              )}
            </div>

            <div className="strip-destinatario-row">
              <div className="strip-destinatario">
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
              <span className={`strip-agency-badge ${agencyClass}`}>
                {agencyDisplayName}
              </span>
              <span className="strip-destination-text">
                DESTINO: {slot.destino || 'DESTINO NO ESPECIFICADO'}
              </span>
            </div>
          </>
        ) : (
          <div className="strip-empty-placeholder">
            <span>[ Hoja {sheetNum} — Espacio #{slotInSheet} libre ]</span>
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

      {/* Hoja A4 en Pantalla */}
      <div className="rotulos-a4-sheet screen-only-sheet">
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
