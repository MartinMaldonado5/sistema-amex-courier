import React from 'react';
import { DniSlotData, ZoomImageState } from '../types';

interface DniDropzonePanelProps {
  activeSlot: DniSlotData;
  activeSlotId: number;
  focusedSide: 'anverso' | 'reverso' | null;
  setFocusedSide: (side: 'anverso' | 'reverso' | null) => void;
  dragHoverSide: 'anverso' | 'reverso' | 'surface' | null;
  setDragHoverSide: (side: 'anverso' | 'reverso' | 'surface' | null) => void;
  previewZoom: number;
  setPreviewZoom: React.Dispatch<React.SetStateAction<number>>;
  setZoomImage: (zoom: ZoomImageState | null) => void;
  rotateSide: (side: 'anverso' | 'reverso', deg: number) => void;
  clearSide: (side: 'anverso' | 'reverso') => void;
  swapSides: () => void;
  padNum: (num: number) => string;
  extractBase64FromDataTransfer: (dt: DataTransfer) => Promise<string | null>;
  processImagePayload: (b64: string, side?: 'anverso' | 'reverso' | null) => Promise<void>;
}

export function DniDropzonePanel({
  activeSlot,
  activeSlotId,
  focusedSide,
  setFocusedSide,
  dragHoverSide,
  setDragHoverSide,
  previewZoom,
  setPreviewZoom,
  setZoomImage,
  rotateSide,
  clearSide,
  swapSides,
  padNum,
  extractBase64FromDataTransfer,
  processImagePayload
}: DniDropzonePanelProps) {
  return (
    <section className="active-panel">
      <div className="sheet-simulation-wrapper">
        <div
          className="sheet-surface layout-vertical"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragHoverSide(null);
            const b64 = await extractBase64FromDataTransfer(e.dataTransfer);
            if (b64) {
              await processImagePayload(b64, focusedSide);
            }
          }}
        >
          {/* CASILLA ANVERSO */}
          <div
            className={`dni-dropzone ${activeSlot.anverso ? 'has-image' : ''} ${
              focusedSide === 'anverso' ? 'active-target' : ''
            } ${dragHoverSide === 'anverso' ? 'drag-active' : ''}`}
            tabIndex={0}
            onClick={() => setFocusedSide('anverso')}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              if (dragHoverSide !== 'anverso') setDragHoverSide('anverso');
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide('anverso');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide(null);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide(null);
              const b64 = await extractBase64FromDataTransfer(e.dataTransfer);
              if (b64) {
                await processImagePayload(b64, 'anverso');
              }
            }}
          >
            <div className="dropzone-header">
              <div className="dropzone-title">
                <span className="side-badge front">1</span>
                <strong>ANVERSO (FRENTE)</strong>
              </div>
              <div className="dropzone-actions">
                {activeSlot.anverso && (
                  <>
                    <button
                      type="button"
                      className="action-btn"
                      title="Ver en grande / Pantalla Completa"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomImage({
                          url: activeSlot.anverso!,
                          title: `Anverso • Cupo #${padNum(activeSlotId)}${activeSlot.label ? ` (${activeSlot.label})` : ''}`,
                          rotation: activeSlot.anversoRotation || 0
                        });
                      }}
                    >
                      🔍
                    </button>
                    <div className="zoom-pill-group" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="zoom-btn"
                        title="Reducir tamaño imagen"
                        onClick={() => setPreviewZoom((z) => Math.max(0.8, Number((z - 0.08).toFixed(2))))}
                      >
                        −
                      </button>
                      <span
                        className="zoom-value"
                        title="Clic para reiniciar tamaño (178%)"
                        onClick={() => setPreviewZoom(1.78)}
                      >
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        className="zoom-btn"
                        title="Agrandar imagen para ocupar más fondo negro"
                        onClick={() => setPreviewZoom((z) => Math.min(2.8, Number((z + 0.08).toFixed(2))))}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  className="action-btn"
                  title="Rotar 90° izquierda"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateSide('anverso', 270);
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="action-btn"
                  title="Rotar 90° derecha"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateSide('anverso', 90);
                  }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  title="Eliminar anverso"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSide('anverso');
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {activeSlot.anverso ? (
              <div
                className="dropzone-preview"
                title="Haz clic para ampliar en grande o usa Ctrl+Rueda para zoom"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImage({
                    url: activeSlot.anverso!,
                    title: `Anverso • Cupo #${padNum(activeSlotId)}${activeSlot.label ? ` (${activeSlot.label})` : ''}`,
                    rotation: activeSlot.anversoRotation || 0
                  });
                }}
                onWheel={(e) => {
                  if (e.ctrlKey || e.altKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setPreviewZoom((z) => Math.min(2.2, Number((z + 0.05).toFixed(2))));
                    } else {
                      setPreviewZoom((z) => Math.max(0.8, Number((z - 0.05).toFixed(2))));
                    }
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSlot.anverso}
                  alt="Anverso"
                  style={{
                    transform: `rotate(${activeSlot.anversoRotation || 0}deg) scale(${previewZoom})`
                  }}
                />
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <div className="placeholder-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
                    <rect x="8" y="3" width="12" height="14" rx="2" />
                    <path d="M12 8v4" />
                    <path d="M10 10h4" />
                  </svg>
                </div>
                <div className="placeholder-text">
                  <span className="placeholder-main">
                    Haz clic o pega el <strong>Anverso</strong> aquí
                  </span>
                  <span className="placeholder-sub">
                    Copia en WhatsApp Web &rarr; presiona <kbd>Ctrl + V</kbd>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BOTÓN CENTRAL DE INTERCAMBIO */}
          <div className="swap-bar">
            <div className="swap-line"></div>
            <button
              type="button"
              className="btn-swap"
              onClick={swapSides}
              title="Intercambiar Anverso y Reverso si se pegaron invertidos"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Intercambiar Caras</span>
            </button>
            <div className="swap-line"></div>
          </div>

          {/* CASILLA REVERSO */}
          <div
            className={`dni-dropzone ${activeSlot.reverso ? 'has-image' : ''} ${
              focusedSide === 'reverso' ? 'active-target' : ''
            } ${dragHoverSide === 'reverso' ? 'drag-active' : ''}`}
            tabIndex={0}
            onClick={() => setFocusedSide('reverso')}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              if (dragHoverSide !== 'reverso') setDragHoverSide('reverso');
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide('reverso');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide(null);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragHoverSide(null);
              const b64 = await extractBase64FromDataTransfer(e.dataTransfer);
              if (b64) {
                await processImagePayload(b64, 'reverso');
              }
            }}
          >
            <div className="dropzone-header">
              <div className="dropzone-title">
                <span className="side-badge back">2</span>
                <strong>REVERSO (POSTERIOR)</strong>
              </div>
              <div className="dropzone-actions">
                {activeSlot.reverso && (
                  <>
                    <button
                      type="button"
                      className="action-btn"
                      title="Ver en grande / Pantalla Completa"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomImage({
                          url: activeSlot.reverso!,
                          title: `Reverso • Cupo #${padNum(activeSlotId)}${activeSlot.label ? ` (${activeSlot.label})` : ''}`,
                          rotation: activeSlot.reversoRotation || 0
                        });
                      }}
                    >
                      🔍
                    </button>
                    <div className="zoom-pill-group" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="zoom-btn"
                        title="Reducir tamaño imagen"
                        onClick={() => setPreviewZoom((z) => Math.max(0.8, Number((z - 0.08).toFixed(2))))}
                      >
                        −
                      </button>
                      <span
                        className="zoom-value"
                        title="Clic para reiniciar tamaño (178%)"
                        onClick={() => setPreviewZoom(1.78)}
                      >
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        className="zoom-btn"
                        title="Agrandar imagen para ocupar más fondo negro"
                        onClick={() => setPreviewZoom((z) => Math.min(2.8, Number((z + 0.08).toFixed(2))))}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
                <button
                  type="button"
                  className="action-btn"
                  title="Rotar 90° izquierda"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateSide('reverso', 270);
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="action-btn"
                  title="Rotar 90° derecha"
                  onClick={(e) => {
                    e.stopPropagation();
                    rotateSide('reverso', 90);
                  }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  title="Eliminar reverso"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSide('reverso');
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {activeSlot.reverso ? (
              <div
                className="dropzone-preview"
                title="Haz clic para ampliar en grande o usa Ctrl+Rueda para zoom"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImage({
                    url: activeSlot.reverso!,
                    title: `Reverso • Cupo #${padNum(activeSlotId)}${activeSlot.label ? ` (${activeSlot.label})` : ''}`,
                    rotation: activeSlot.reversoRotation || 0
                  });
                }}
                onWheel={(e) => {
                  if (e.ctrlKey || e.altKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setPreviewZoom((z) => Math.min(2.2, Number((z + 0.05).toFixed(2))));
                    } else {
                      setPreviewZoom((z) => Math.max(0.8, Number((z - 0.05).toFixed(2))));
                    }
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeSlot.reverso}
                  alt="Reverso"
                  style={{
                    transform: `rotate(${activeSlot.reversoRotation || 0}deg) scale(${previewZoom})`
                  }}
                />
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <div className="placeholder-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
                    <rect x="8" y="3" width="12" height="14" rx="2" />
                    <path d="M12 8v4" />
                    <path d="M10 10h4" />
                  </svg>
                </div>
                <div className="placeholder-text">
                  <span className="placeholder-main">
                    Haz clic o pega el <strong>Reverso</strong> aquí
                  </span>
                  <span className="placeholder-sub">
                    Copia en WhatsApp Web &rarr; presiona <kbd>Ctrl + V</kbd>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
