import React from 'react';
import {
  Undo2,
  Redo2,
  Printer,
  Search,
  X,
  ClipboardPaste,
  Sparkles,
  Download,
  Zap,
  Camera,
  Volume2,
  VolumeX,
  Mic,
  ArrowRight
} from 'lucide-react';

interface LiveSheetsToolbarProps {
  onResetScans: () => void;
  onRefresh: () => void;
  onExportExcel: () => void;
  searchInSheet: string;
  setSearchInSheet: (val: string) => void;
  onOpenPasteModal: () => void;
  onLoadFromDatabase: () => void;
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement | null>;
  onManualScanSubmit: (e: React.FormEvent) => void;
  onOpenCameraScanner: () => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isVoiceEnabled?: boolean;
  setIsVoiceEnabled?: (val: boolean) => void;
  onSyncToMainPackages: () => void;
}

export function LiveSheetsToolbar({
  onResetScans,
  onRefresh,
  onExportExcel,
  searchInSheet,
  setSearchInSheet,
  onOpenPasteModal,
  onLoadFromDatabase,
  barcodeInput,
  setBarcodeInput,
  barcodeInputRef,
  onManualScanSubmit,
  onOpenCameraScanner,
  isMuted,
  setIsMuted,
  isVoiceEnabled,
  setIsVoiceEnabled,
  onSyncToMainPackages
}: LiveSheetsToolbarProps) {
  return (
    <div className="gsheet-toolbar">
      <div className="gsheet-tool-group">
        <button type="button" className="gsheet-btn-tool" onClick={onResetScans} title="Deshacer / Reiniciar">
          <Undo2 size={14} />
        </button>
        <button type="button" className="gsheet-btn-tool" onClick={onRefresh} title="Rehacer / Refrescar">
          <Redo2 size={14} />
        </button>
        <button type="button" className="gsheet-btn-tool" onClick={onExportExcel} title="Exportar a Excel">
          <Printer size={14} />
        </button>

        <div className="gsheet-divider" />

        {/* Buscador de celdas en la hoja */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '1px solid #dadce0',
            borderRadius: '14px',
            padding: '1px 8px',
            gap: '4px'
          }}
        >
          <Search size={13} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en hoja..."
            value={searchInSheet}
            onChange={e => setSearchInSheet(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '11.5px', width: '120px', color: '#202124' }}
          />
          {searchInSheet && (
            <button
              type="button"
              onClick={() => setSearchInSheet('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            >
              <X size={12} className="text-slate-400" />
            </button>
          )}
        </div>

        <div className="gsheet-divider" />

        {/* Botón Pegar de Google Sheets */}
        <button
          type="button"
          className="gsheet-btn-action paste"
          onClick={onOpenPasteModal}
          title="Pegar las 3 columnas de Google Sheets (NOMBRE, CODIGO WAREHOUSE, CODIGO TIB)"
        >
          <ClipboardPaste size={14} />
          <span>Pegar de Excel / Sheets</span>
        </button>

        {/* Botón Cargar de BD */}
        <button
          type="button"
          className="gsheet-btn-action secondary"
          onClick={onLoadFromDatabase}
          title="Cargar paquetes de Supabase"
        >
          <Sparkles size={14} className="text-sky-600" />
          <span>Cargar BD</span>
        </button>

        {/* Botón Exportar */}
        <button
          type="button"
          className="gsheet-btn-action export"
          onClick={onExportExcel}
          title="Descargar archivo .XLSX"
        >
          <Download size={14} />
          <span>Exportar XLSX</span>
        </button>
      </div>

      {/* Hero Scanner Gun Input */}
      <form onSubmit={onManualScanSubmit} className="gsheet-gun-input-wrap">
        <Zap size={16} className="gsheet-gun-icon" />
        <input
          ref={barcodeInputRef as any}
          type="text"
          className="gsheet-gun-input"
          value={barcodeInput}
          onChange={e => setBarcodeInput(e.target.value)}
          placeholder="Apunta y dispara la pistola de código de barras aquí..."
        />
        <button
          type="button"
          onClick={onOpenCameraScanner}
          className="gsheet-btn-tool"
          title="Escanear con Cámara en Celular/Tablet"
        >
          <Camera size={15} />
        </button>
      </form>

      {/* Audio y Sync Tools */}
      <div className="gsheet-tool-group">
        {/* Control de Voz Hablada */}
        {typeof isVoiceEnabled === 'boolean' && setIsVoiceEnabled && (
          <button
            type="button"
            className={`gsheet-btn-tool ${isVoiceEnabled ? 'active' : ''}`}
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            title={
              isVoiceEnabled
                ? 'Voz activada: dice el nombre del cliente o "No encontrado"'
                : 'Voz desactivada (clic para activar)'
            }
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0 8px', fontSize: '11px' }}
          >
            <Mic size={13} className={isVoiceEnabled ? 'text-emerald-600' : 'text-slate-400'} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{isVoiceEnabled ? 'Voz' : 'Voz Off'}</span>
          </button>
        )}

        <button
          type="button"
          className={`gsheet-btn-tool ${!isMuted ? 'active' : ''}`}
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Audio silenciado (clic para activar)' : 'Silenciar todo el audio'}
        >
          {isMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
        </button>

        <button
          type="button"
          className="gsheet-btn-action secondary"
          onClick={onSyncToMainPackages}
          title="Actualizar estado en inventario principal de Lince"
        >
          <ArrowRight size={13} className="text-blue-600" />
          <span>Sincronizar a Lince</span>
        </button>
      </div>
    </div>
  );
}
