import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DniStats } from '../types';

interface DniToolbarProps {
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onSaveSetting: (key: string, val: any) => void;
  showToast: (text: string) => void;
  isExporting: boolean;
  exportStatusMessage: string;
  showExportMenu: boolean;
  openUpwards: boolean;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  toggleExportMenu: () => void;
  setShowExportMenu: (val: boolean) => void;
  stats: DniStats;
  handleExportFolder: () => void;
  handleExportMaster: () => void;
  handleExportZip: () => void;
  handleExportPdfFolder: () => void;
  handleExportPdfZip: () => void;
  setShowPdfModal: (val: boolean) => void;
  setShowPreviewModal: (val: boolean) => void;
  setShowConfigModal: (val: boolean) => void;
  onGlobalRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DniToolbar({
  soundEnabled,
  setSoundEnabled,
  onSaveSetting,
  showToast,
  isExporting,
  exportStatusMessage,
  showExportMenu,
  openUpwards,
  exportMenuRef,
  toggleExportMenu,
  setShowExportMenu,
  stats,
  handleExportFolder,
  handleExportMaster,
  handleExportZip,
  handleExportPdfFolder,
  handleExportPdfZip,
  setShowPdfModal,
  setShowPreviewModal,
  setShowConfigModal,
  onGlobalRefresh,
  isRefreshing = false
}: DniToolbarProps) {
  return (
    <div className="matrix-top-toolbar">
      <button
        onClick={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          onSaveSetting('soundEnabled', next);
          showToast(next ? 'Sonido activado' : 'Sonido silenciado');
        }}
        className="icon-button"
        title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
      >
        {soundEnabled ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>

      {/* BOTÓN MASTER DESPLEGABLE DE EXPORTACIÓN */}
      <div className="export-dropdown-wrapper" ref={exportMenuRef as any}>
        <button
          type="button"
          onClick={toggleExportMenu}
          className={`btn btn-primary export-master-btn ${showExportMenu ? 'active' : ''}`}
          title="Acciones de documentos, exportación, conversión y vista A4"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <div className="spinner-sm"></div>
              <span>{exportStatusMessage || 'Exportando...'}</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="12" y2="18"></line>
                <line x1="15" y1="15" x2="12" y2="18"></line>
              </svg>
              <span>Documentos y Acciones</span>
              <span className={`export-count-pill ${stats.ready > 0 ? 'ready' : ''}`}>
                {stats.ready}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: showExportMenu ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  opacity: 0.85
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </>
          )}
        </button>

        {showExportMenu && (
          <div className={`export-dropdown-menu ${openUpwards ? 'open-up' : 'open-down'}`}>
            <div className="export-menu-header">
              <div className="export-menu-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span>DOCUMENTOS Y ACCIONES (A4)</span>
              </div>
              <span className="export-menu-stats">
                {stats.ready} {stats.ready === 1 ? 'listo' : 'listos'} ({stats.ready} {stats.ready === 1 ? 'pág' : 'págs'})
              </span>
            </div>

            <div className="export-menu-items">
              {/* Opción 1: Escoger Carpeta */}
              <button
                type="button"
                className="export-menu-item opt-folder"
                disabled={isExporting || stats.ready === 0}
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportFolder();
                }}
              >
                <div className="export-item-icon folder-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <polyline points="12 11 12 17"></polyline>
                    <line x1="9" y1="14" x2="12" y2="17"></line>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Escoger Carpeta donde Guardar</div>
                  <div className="export-item-desc">Guarda los Word sueltos directamente (Sin comprimir)</div>
                </div>
              </button>

              {/* Opción 2: Word Maestro Único */}
              <button
                type="button"
                className="export-menu-item opt-master"
                disabled={isExporting || stats.ready === 0}
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportMaster();
                }}
              >
                <div className="export-item-icon master-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Word Maestro Único</div>
                  <div className="export-item-desc">1 archivo Word con todas las hojas</div>
                </div>
              </button>

              {/* Opción 3: Descargar en ZIP */}
              <button
                type="button"
                className="export-menu-item opt-zip"
                disabled={isExporting || stats.ready === 0}
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportZip();
                }}
              >
                <div className="export-item-icon zip-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8"></polyline>
                    <rect x="1" y="3" width="22" height="5"></rect>
                    <line x1="10" y1="12" x2="14" y2="12"></line>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Descargar en ZIP</div>
                  <div className="export-item-desc">Archivos .docx comprimidos</div>
                </div>
              </button>

              <div className="export-menu-divider"></div>

              {/* Opción 4: Escoger Carpeta para Guardar PDFs */}
              <button
                type="button"
                className="export-menu-item opt-pdf-folder"
                disabled={isExporting || stats.ready === 0}
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportPdfFolder();
                }}
              >
                <div className="export-item-icon pdf-folder-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <polyline points="12 11 12 17"></polyline>
                    <line x1="9" y1="14" x2="12" y2="17"></line>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Escoger Carpeta para PDFs</div>
                  <div className="export-item-desc">Guarda los PDF sueltos directamente (Sin comprimir)</div>
                </div>
              </button>

              {/* Opción 5: Descargar en PDF (.zip) */}
              <button
                type="button"
                className="export-menu-item opt-pdf-zip"
                disabled={isExporting || stats.ready === 0}
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportPdfZip();
                }}
              >
                <div className="export-item-icon pdf-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Descargar en PDF (.zip)</div>
                  <div className="export-item-desc">Archivos .pdf directos</div>
                </div>
              </button>

              <div className="export-menu-divider"></div>

              {/* Opción 6: Convertir a PDF */}
              <button
                type="button"
                className="export-menu-item opt-converter"
                onClick={() => {
                  setShowExportMenu(false);
                  setShowPdfModal(true);
                }}
              >
                <div className="export-item-icon converter-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Convertir a PDF</div>
                  <div className="export-item-desc">Convierte carpetas enteras de Word a PDF</div>
                </div>
              </button>

              <div className="export-menu-divider"></div>

              {/* Opción 7: Vista A4 */}
              <button
                type="button"
                className="export-menu-item opt-preview"
                onClick={() => {
                  setShowExportMenu(false);
                  setShowPreviewModal(true);
                }}
              >
                <div className="export-item-icon preview-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div className="export-item-text">
                  <div className="export-item-title">Vista A4</div>
                  <div className="export-item-desc">Previsualizar hoja de impresión A4</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setShowConfigModal(true)} className="btn btn-secondary" title="Ajustes de lote y cupos">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        <span>Ajustes</span>
      </button>

      {/* BOTÓN SINCRONIZAR INDEPENDIENTE */}
      {onGlobalRefresh && (
        <button
          type="button"
          onClick={onGlobalRefresh}
          className="btn btn-secondary sync-toolbar-btn"
          title="Sincronizar todos los módulos con Supabase"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
      )}
    </div>
  );
}
