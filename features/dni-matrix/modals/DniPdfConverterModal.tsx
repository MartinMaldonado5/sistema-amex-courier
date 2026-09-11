import React from 'react';

interface DniPdfConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfFolderPath: string;
  onPickPdfFolder: () => void;
  pdfScanCount: number | null;
  pdfDestOption: 'subfolder' | 'same';
  setPdfDestOption: (opt: 'subfolder' | 'same') => void;
  pdfConverting: boolean;
  pdfProgressMsg: string;
  pdfProgressPercent: number;
  pdfSuccessDone: boolean;
  pdfConvertedInfo: { total: number; dest: string } | null;
  pdfDirHandle: any;
  onStartPdfConversion: () => void;
}

export function DniPdfConverterModal({
  isOpen,
  onClose,
  pdfFolderPath,
  onPickPdfFolder,
  pdfScanCount,
  pdfDestOption,
  setPdfDestOption,
  pdfConverting,
  pdfProgressMsg,
  pdfProgressPercent,
  pdfSuccessDone,
  pdfConvertedInfo,
  pdfDirHandle,
  onStartPdfConversion
}: DniPdfConverterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dni-modal-overlay">
      <div className="dni-modal-card dni-modal-large">
        <div className="dni-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#ffffff' }}>Conversor Masivo de Word (.docx) a PDF</h3>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              Motor Directo A4
            </span>
          </div>
          <button onClick={onClose} className="dni-modal-close-btn" title="Cerrar">
            &times;
          </button>
        </div>
        <div className="dni-modal-body">
          <div className="form-group">
            <label className="form-label font-bold">1. Carpeta con los archivos Word (.docx):</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <input
                type="text"
                className="metadata-input"
                style={{ flex: 1 }}
                readOnly
                placeholder="Haz clic en Examinar para seleccionar tu carpeta..."
                value={pdfFolderPath}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onPickPdfFolder}
              >
                Examinar...
              </button>
            </div>
          </div>

          {pdfScanCount !== null && (
            <div className="pdf-scan-badge" style={{ marginBottom: '14px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>
                <strong>{pdfScanCount}</strong> archivos Word (.docx) detectados en esta carpeta.
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label font-bold">2. Destino de los PDFs generados:</label>
            <div className="radio-option-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="pdf-dest"
                  checked={pdfDestOption === 'subfolder'}
                  onChange={() => setPdfDestOption('subfolder')}
                />
                <span>
                  Crear una subcarpeta <code>PDFs/</code> dentro de esa misma carpeta (Recomendado)
                </span>
              </label>
              <label className="radio-label" style={{ marginTop: '8px' }}>
                <input
                  type="radio"
                  name="pdf-dest"
                  checked={pdfDestOption === 'same'}
                  onChange={() => setPdfDestOption('same')}
                />
                <span>Guardar en la misma carpeta (junto a los archivos Word)</span>
              </label>
            </div>
          </div>

          {pdfConverting && (
            <div className="pdf-progress-card">
              <div className="pdf-progress-header">
                <span>{pdfProgressMsg}</span>
                <span className="pdf-progress-num">{pdfProgressPercent}%</span>
              </div>
              <div className="progress-bar-bg" style={{ width: '100%', marginTop: '8px' }}>
                <div className="progress-fill" style={{ width: `${pdfProgressPercent}%` }}></div>
              </div>
            </div>
          )}

          {pdfSuccessDone && (
            <div className="pdf-success-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <h4 style={{ margin: 0, color: '#34d399', fontSize: '0.9rem' }}>¡Conversión a PDF Finalizada con Éxito!</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Se han creado {pdfConvertedInfo?.total || pdfScanCount} archivos .pdf dentro de: <strong>{pdfConvertedInfo?.dest || 'la carpeta seleccionada'}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="dni-modal-footer">
          <span className="text-muted" style={{ fontSize: '0.74rem' }}>
            💡 Convierte los Word a PDF A4 con medidas exactas y guarda los archivos directamente en tu equipo.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-pdf-header"
              disabled={pdfConverting || !pdfDirHandle || pdfScanCount === 0}
              onClick={onStartPdfConversion}
            >
              {pdfConverting ? 'Convirtiendo...' : 'Iniciar Conversión a PDF'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
