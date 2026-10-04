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
  // AI Slot Data
  slotsAiData?: Record<number, { text: string; image: string | null }>;
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
  onOpenHistory?: () => void;
  todayPrintedCount?: number;
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
  slotsAiData,
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
  handleNumericPaste,
  onOpenHistory,
  todayPrintedCount = 0
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
      {/* 1. Barra Superior del Editor: Selector de Espacios (1-5) + Acciones Rápidas Unificadas */}
      <div className="rotulos-editor-top-bar">
        <div className="slot-segmented-control" title={`Espacios de la Hoja ${activeSheetNum} de ${totalSheets}`}>
          {currentSheetSlots.map((s) => {
            const isSelected = s.id === activeSlotId;
            const hasData = Boolean(s.nombre?.trim() || s.destino?.trim());
            const hasAiData = Boolean(slotsAiData?.[s.id]?.text || slotsAiData?.[s.id]?.image);
            const inSheetNum = ((s.id - 1) % 5) + 1;
            return (
              <button
                key={s.id}
                type="button"
                className={`slot-segmented-btn ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''} ${hasAiData ? 'has-ai' : ''}`}
                onClick={() => {
                  setActiveSlotId(s.id);
                  playSound('click');
                }}
                title={`Hoja ${currentSheet} • Espacio #${inSheetNum} ${hasData ? `(${s.nombre || 'Con datos'})` : '(Vacío)'}${hasAiData ? ' • AMEXito IA listo' : ''}`}
              >
                <span className="slot-btn-num">#{inSheetNum}</span>
                {hasAiData && <span className="slot-ai-mini">🤖</span>}
                <span className={`slot-dot ${hasData ? 'filled' : ''}`}></span>
              </button>
            );
          })}
        </div>

        <div className="slot-top-actions">
          {handleUndo && (
            <button
              type="button"
              className="btn-slot-action undo"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Deshacer (Ctrl + Z)"
            >
              <i className="fa-solid fa-arrow-rotate-left"></i>
              <span className="btn-action-text">Deshacer</span>
            </button>
          )}

          <button
            type="button"
            className="btn-slot-action clear"
            onClick={handleClearActiveSlot}
            title={`Limpiar espacio #${((activeSlot.id - 1) % 5) + 1}`}
          >
            <i className="fa-solid fa-eraser"></i>
            <span className="btn-action-text">Limpiar</span>
          </button>

          <button
            type="button"
            className="btn-slot-action smart-copy"
            onClick={handleSmartCopyToNextFreeSlot}
            title="Copiar datos al siguiente espacio libre"
          >
            <i className="fa-solid fa-bolt-lightning"></i>
            <span>Copiar siguiente</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Herramientas: IA + Agencia + Acciones */}
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
        onOpenHistory={onOpenHistory}
        todayPrintedCount={todayPrintedCount}
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

      {/* 3. Formulario de Entrada en Grid Compacto (Cero Scroll) */}
      <div className="rotulo-form">
        {/* Fila 1: Destinatario con Autocompletado (Ancho Completo) */}
        <div className="rotulo-field-group" ref={clientDropdownRef} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="rotulo-label">Destinatario:</label>
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

        {/* Fila 2: Grid 2 Columnas: DNI y Celular */}
        <div className="rotulo-grid-2col">
          <div className="rotulo-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="rotulo-label">DNI / RUC / CE:</label>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: dniBadgeColor }}>
                {dniBadgeText}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              className="rotulo-input rotulo-input-dni"
              placeholder="8 (DNI) u 11 (RUC)"
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
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: celBadgeColor }}>
                {celBadgeText}
              </span>
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={9}
              className="rotulo-input rotulo-input-cel"
              placeholder="9 dígitos (inicia en 9)"
              value={activeSlot.celular}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 9);
                updateActiveSlot({ celular: onlyNums });
              }}
            />
          </div>
        </div>

        {/* Fila 3: Grid 2 Columnas: Destino y Siglas */}
        <div className="rotulo-grid-2col">
          <div className="rotulo-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="rotulo-label">Ciudad / Destino:</label>
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  color: (activeSlot.destino?.length || 0) >= 105 ? '#f87171' : '#94a3b8'
                }}
              >
                {activeSlot.destino?.length || 0}/110
              </span>
            </div>
            <input
              type="text"
              className="rotulo-input"
              maxLength={110}
              placeholder="Agencia o ciudad de destino..."
              value={activeSlot.destino}
              onChange={(e) => updateActiveSlot({ destino: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="rotulo-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="rotulo-label">Siglas / Código:</label>
              <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Opcional</span>
            </div>
            <input
              type="text"
              className="rotulo-input rotulo-input-siglas"
              placeholder="Ej: CE150, CP68"
              value={activeSlot.siglas || ''}
              onChange={(e) => updateActiveSlot({ siglas: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        {/* Fila 4: Bultos y Cajas en Formato Compacto */}
        <div className="rotulo-embalaje-card-compact">
          <div className="rotulo-grid-2col" style={{ marginBottom: 0 }}>
            <div className="rotulo-field-group" style={{ marginBottom: 0 }}>
              <label className="rotulo-label" style={{ fontSize: '0.75rem' }}>Cant. Rótulos:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rotulo-input rotulo-input-sm"
                value={totalRotulos}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => handleTotalRotulosChange(e.target.value)}
                onBlur={handleTotalRotulosBlur}
                onPaste={handleNumericPaste}
                title="Cantidad de rótulos (solo números)"
              />
            </div>

            <div className="rotulo-field-group" style={{ marginBottom: 0 }}>
              <label className="rotulo-label" style={{ fontSize: '0.75rem' }}>Total Cajas:</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rotulo-input rotulo-input-sm"
                value={totalCajas}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => handleTotalCajasChange(e.target.value)}
                onBlur={handleTotalCajasBlur}
                onPaste={handleNumericPaste}
                title="Cantidad total de cajas enviadas"
              />
            </div>
          </div>

          <div className="embalaje-preview-bar-compact">
            <i className="fa-solid fa-box-archive" style={{ color: '#38bdf8' }}></i>
            <span className="embalaje-preview-label">Formato:</span>
            <strong className="embalaje-preview-value">
              {generarTextoBulto(activeSlot.numeroRotulo || 1, Number(totalRotulos) || 1, totalCajas || '1')}
              {activeSlot.siglas?.trim() ? ` • [${activeSlot.siglas.trim().toUpperCase()}]` : ''}
            </strong>
          </div>
        </div>

        {/* Pie Sutil: Remitente Predeterminado (Informativo, 0 estorbo) */}
        <div className="rotulo-fixed-remitente-micro">
          <i className="fa-solid fa-shield-halved" style={{ color: '#38bdf8' }}></i>
          <span>Remitente: <strong>AMEX COURIER PERÚ</strong> (automático)</span>
        </div>
      </div>
    </div>
  );
};
