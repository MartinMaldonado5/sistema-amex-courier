'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { generarTextoBulto } from '../types';
import { RotulosToolbar } from './RotulosToolbar';
import { Cliente } from '@/types';

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
  // Clientes para autocompletado
  clientes?: Cliente[];
  // Deshacer
  canUndo?: boolean;
  handleUndo?: () => void;
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
  clientes = [],
  canUndo = false,
  handleUndo,
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
  // Estado para autocompletado de directorio de clientes
  const [isClientSuggestionsOpen, setIsClientSuggestionsOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Coincidencias en Directorio de Clientes
  const clientMatches = useMemo(() => {
    if (!clientes || clientes.length === 0) return [];
    const term = (activeSlot.nombre || '').trim().toUpperCase();
    if (term.length < 2) return [];
    return clientes
      .filter((c) => {
        const nameMatch = c.nombre?.toUpperCase().includes(term);
        const docMatch = c.documentoIdentidad?.replace(/\D/g, '').includes(term);
        const phoneMatch = c.telefono?.replace(/\D/g, '').includes(term);
        return nameMatch || docMatch || phoneMatch;
      })
      .slice(0, 6);
  }, [clientes, activeSlot.nombre]);

  const handleSelectClient = (client: Cliente) => {
    const rawAgency = (client.transportistaPreferido || '').toUpperCase();
    let agencia = 'SHALOM';
    let agenciaOtra = '';
    if (rawAgency.includes('CRUZ')) {
      agencia = 'CRUZ DEL SUR';
    } else if (rawAgency.includes('OLVA')) {
      agencia = 'OLVA';
    } else if (rawAgency.includes('SHALOM')) {
      agencia = 'SHALOM';
    } else if (rawAgency) {
      agencia = 'OTRA';
      agenciaOtra = rawAgency;
    }

    const ubigeo = [client.departamento, client.provincia, client.distrito].filter(Boolean).join(' - ');
    const resolvedDestino = client.agenciaDestino || client.direccionEntrega || ubigeo || '';

    updateActiveSlot({
      nombre: client.nombre.toUpperCase(),
      dni: client.documentoIdentidad ? client.documentoIdentidad.replace(/\D/g, '').slice(0, 11) : '',
      celular: client.telefono ? client.telefono.replace(/\D/g, '').slice(0, 9) : '',
      agencia,
      agenciaOtra: agenciaOtra || undefined,
      destino: resolvedDestino.toUpperCase()
    });

    setIsClientSuggestionsOpen(false);
    playSound('complete');
  };

  // Validaciones reactivas visuales
  const dniLength = activeSlot.dni?.length || 0;
  let dniBadgeText = `${dniLength} / 11 dígitos`;
  let dniBadgeColor = '#94a3b8';
  if (dniLength === 8) {
    dniBadgeText = '✓ DNI Válido (8)';
    dniBadgeColor = '#34d399';
  } else if (dniLength === 11) {
    dniBadgeText = '✓ RUC Válido (11)';
    dniBadgeColor = '#34d399';
  } else if (dniLength > 0) {
    dniBadgeText = `⚠️ Incompleto (${dniLength} díg.)`;
    dniBadgeColor = '#f59e0b';
  }

  const celLength = activeSlot.celular?.length || 0;
  const startsWithNine = activeSlot.celular ? activeSlot.celular.startsWith('9') : true;
  let celBadgeText = `${celLength} / 9 dígitos`;
  let celBadgeColor = '#94a3b8';
  if (celLength > 0 && !startsWithNine) {
    celBadgeText = '⚠️ Debe iniciar con 9';
    celBadgeColor = '#f59e0b';
  } else if (celLength === 9) {
    celBadgeText = '✓ Celular Válido (9)';
    celBadgeColor = '#34d399';
  } else if (celLength > 0) {
    celBadgeText = `⚠️ Faltan dígitos (${celLength}/9)`;
    celBadgeColor = '#f59e0b';
  }

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

        <div className="slot-header-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Botón Deshacer (Undo) */}
          {handleUndo && (
            <button
              type="button"
              className="btn-clear-slot-header"
              onClick={handleUndo}
              disabled={!canUndo}
              style={{
                opacity: canUndo ? 1 : 0.45,
                cursor: canUndo ? 'pointer' : 'not-allowed',
                background: canUndo ? 'rgba(245, 158, 11, 0.15)' : undefined,
                color: canUndo ? '#fbbf24' : undefined,
                borderColor: canUndo ? 'rgba(245, 158, 11, 0.4)' : undefined
              }}
              title="Deshacer última acción (Ctrl + Z)"
            >
              <i className="fa-solid fa-arrow-rotate-left"></i>
              <span>Deshacer</span>
            </button>
          )}

          <button
            type="button"
            className="btn-smart-copy"
            onClick={handleSmartCopyToNextFreeSlot}
            title="Copiar este rótulo en el siguiente espacio libre (omite ocupados y crea hoja si es necesario)"
          >
            <i className="fa-solid fa-bolt-lightning"></i>
            <span>Copiar en siguiente espacio</span>
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
        canUndo={canUndo}
        handleUndo={handleUndo}
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
        {/* Remitente Oficial Fijo (No Modificable) */}
        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="rotulo-label" style={{ marginBottom: 0 }}>Remitente Oficial:</label>
            <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-lock"></i> Fijo por defecto (No modificable)
            </span>
          </div>
          <div className="rotulo-fixed-remitente-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-building-shield" style={{ color: '#38bdf8', fontSize: '0.95rem' }}></i>
              <span className="rotulo-fixed-remitente-name">AMEX COURIER PERÚ</span>
            </div>
            <span className="rotulo-fixed-remitente-badge">PREDETERMINADO</span>
          </div>
        </div>

        {/* Destinatario con Autocompletado desde Directorio de Clientes */}
        <div className="rotulo-field-group" ref={clientDropdownRef} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">Nombre(s) y Apellidos del Destinatario:</label>
            {clientes && clientes.length > 0 && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setIsClientSuggestionsOpen(!isClientSuggestionsOpen)}
                title="Buscar o autocompletar desde el Directorio de Clientes"
              >
                <i className="fa-solid fa-address-book"></i> Directorio ({clientes.length})
              </span>
            )}
          </div>
          <input
            type="text"
            className="rotulo-input"
            placeholder="Nombre completo o escribe para autocompletar..."
            value={activeSlot.nombre}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              updateActiveSlot({ nombre: val });
              setIsClientSuggestionsOpen(val.trim().length >= 2);
            }}
            onFocus={() => {
              if ((activeSlot.nombre || '').trim().length >= 2) {
                setIsClientSuggestionsOpen(true);
              }
            }}
            autoFocus
          />

          {/* Menú de sugerencias del directorio de clientes */}
          {isClientSuggestionsOpen && clientMatches.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#0f172a',
                border: '1.5px solid #38bdf8',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                zIndex: 100,
                maxHeight: '220px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase'
                }}
              >
                <i className="fa-solid fa-users" style={{ color: '#38bdf8' }}></i> Coincidencias en Directorio (1 clic para rellenar)
              </div>
              {clientMatches.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>
                      {client.nombre}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                      {client.documentoIdentidad ? `DNI/RUC: ${client.documentoIdentidad}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                    {client.telefono && <span>📞 {client.telefono}</span>}
                    {client.transportistaPreferido && <span>🚚 {client.transportistaPreferido}</span>}
                    {(client.agenciaDestino || client.distrito) && (
                      <span>📍 {client.agenciaDestino || client.distrito}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DNI con indicador y validación reactiva */}
        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">DNI / RUC / CE:</label>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                color: dniBadgeColor
              }}
            >
              {dniBadgeText}
            </span>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={11}
            className="rotulo-input rotulo-input-dni"
            placeholder="8 dígitos (DNI) u 11 dígitos (RUC)"
            value={activeSlot.dni}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 11);
              updateActiveSlot({ dni: onlyNums });
            }}
          />
        </div>

        {/* Celular con indicador y validación reactiva */}
        <div className="rotulo-field-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">Celular / Teléfono:</label>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                color: celBadgeColor
              }}
            >
              {celBadgeText}
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            className="rotulo-input rotulo-input-cel"
            placeholder="9 dígitos (iniciando en 9)"
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
              <label className="rotulo-label" title="Cantidad de rótulos">Cant. Rótulos:</label>
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
              <label className="rotulo-label" title="Total de cajas">Total Cajas:</label>
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
              <label className="rotulo-label" title="Siglas identificadoras o clave del envío (ej: CE150, CP 68)">
                Siglas / Código:
              </label>
              <input
                type="text"
                className="rotulo-input rotulo-input-siglas"
                placeholder="EJ: CE150"
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
