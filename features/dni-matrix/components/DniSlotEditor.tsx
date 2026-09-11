import React from 'react';
import { DniSlotData } from '../types';

interface DniSlotEditorProps {
  activeSlot: DniSlotData;
  activeSlotId: number;
  totalSlots: number;
  activeStatus: 'ready' | 'partial' | 'empty';
  isExtractingName: boolean;
  padNum: (num: number) => string;
  updateSlot: (slot: DniSlotData) => Promise<void>;
  jumpToNextIncompleteSlot: () => void;
  handleExtractNameWithAi: () => Promise<void>;
  setActiveSlotId: (idOrFn: number | ((prev: number) => number)) => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
}

export function DniSlotEditor({
  activeSlot,
  activeSlotId,
  totalSlots,
  activeStatus,
  isExtractingName,
  padNum,
  updateSlot,
  jumpToNextIncompleteSlot,
  handleExtractNameWithAi,
  setActiveSlotId,
  playSound
}: DniSlotEditorProps) {
  return (
    <>
      {/* Indicador de Expediente Activo */}
      <div className="matrix-active-slot-header">
        <div className="active-badge-group">
          <div className="active-slot-info">
            <span className="active-tag">EXPEDIENTE ACTIVO</span>
            <h2 className="active-number">#{padNum(activeSlotId)}</h2>
          </div>
          <span
            className={`status-badge ${
              activeStatus === 'ready'
                ? 'status-ready'
                : activeStatus === 'partial'
                ? 'status-partial'
                : 'status-empty'
            }`}
          >
            {activeStatus === 'ready'
              ? 'COMPLETO (2/2) • Presiona ENTER ⏎'
              : activeStatus === 'partial'
              ? '1 CARA (1/2)'
              : 'VACÍO (0/2)'}
          </span>
        </div>
      </div>

      {/* Metadatos del expediente (Nombres y Apellidos) */}
      <div className="matrix-slot-metadata">
        <label className="metadata-label">Nombres y Apellidos:</label>
        <input
          type="text"
          className="metadata-input"
          placeholder="Ej: Luis Juan Perez Rojas"
          value={activeSlot.label || ''}
          onChange={(e) => updateSlot({ ...activeSlot, label: e.target.value.toUpperCase() })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
              jumpToNextIncompleteSlot();
            }
          }}
          maxLength={60}
        />
      </div>

      {/* Botón Inteligente AMEXito: Lectura Automática del Anverso */}
      <button
        type="button"
        className={`btn-ai-extract ${isExtractingName ? 'loading' : ''} ${!activeSlot.anverso ? 'unready' : ''}`}
        onClick={handleExtractNameWithAi}
        disabled={isExtractingName}
        title={
          activeSlot.anverso
            ? 'Extraer automáticamente nombres y apellidos del Anverso con AMEXito'
            : 'Carga primero la imagen del anverso del DNI para usar a AMEXito'
        }
      >
        {isExtractingName ? (
          <>
            <div className="spinner-ai"></div>
            <span className="ai-btn-text">AMEXito está leyendo el DNI...</span>
          </>
        ) : (
          <>
            <div className="ai-btn-left">
              <span className="ai-robot-icon">🤖</span>
              <span className="ai-btn-text">Extraer Nombres y Apellidos con AMEXito</span>
            </div>
            <span className="ai-badge-chip">AMEXito IA</span>
          </>
        )}
      </button>

      {/* Barra de Navegación del Expediente Activo */}
      <div className="matrix-active-nav-bar">
        <div className="matrix-nav-row">
          <button
            type="button"
            className="btn btn-secondary nav-btn"
            disabled={activeSlotId <= 1}
            onClick={() => {
              if (activeSlotId > 1) {
                playSound('click');
                setActiveSlotId((prev) => prev - 1);
              }
            }}
            title="Ir al cupo anterior (Flecha Izquierda)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>
              Anterior <kbd>&larr;</kbd>
            </span>
          </button>

          <div className="nav-center-info">
            <span>
              Cupo {activeSlotId} de {totalSlots}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary nav-btn"
            disabled={activeSlotId >= totalSlots}
            onClick={() => {
              if (activeSlotId < totalSlots) {
                playSound('click');
                setActiveSlotId((prev) => prev + 1);
              }
            }}
            title="Ir al siguiente cupo (Flecha Derecha)"
          >
            <span>
              Siguiente <kbd>&rarr;</kbd>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <button
          type="button"
          className="btn btn-success nav-btn-cta full-cta"
          onClick={jumpToNextIncompleteSlot}
          title="Saltar de inmediato al próximo cupo vacío o incompleto (Enter)"
        >
          <div className="cta-content">
            <span className="pulse-dot"></span>
            <span className="cta-text">Siguiente Incompleto</span>
          </div>
          <kbd className="cta-kbd">Enter ⏎</kbd>
        </button>
      </div>
    </>
  );
}
