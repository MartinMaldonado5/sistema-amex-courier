'use client';

import React from 'react';
import { getR2ViewUrl } from '@/lib/r2/client';
import { ExternalLink, Download, FileText, X } from 'lucide-react';

interface PdfViewerModalProps {
  url: string;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  fileName?: string;
}

export default function PdfViewerModal({
  url,
  onClose,
  title = 'Visor de Documento PDF',
  subtitle = 'Acceso seguro al documento',
  fileName = 'documento.pdf',
}: PdfViewerModalProps) {
  const resolvedUrl = getR2ViewUrl(url);
  const downloadUrl = resolvedUrl
    ? `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}download=true`
    : '';

  // Cerrar con Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOpenNewWindow = () => {
    if (!resolvedUrl) return;
    const width = 1000;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      resolvedUrl,
      '_blank',
      `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    );
  };

  return (
    <div
      className="modal-overlay active"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '1050px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '520px',
                }}
                title={title}
              >
                {title}
              </h3>
              <span
                style={{
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={fileName}
                className="btn"
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
                title="Descargar archivo PDF"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleOpenNewWindow}
              className="btn"
              style={{
                background: '#4338ca',
                color: '#ffffff',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Abrir en ventana emergente (Popup)"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ventana Popup</span>
            </button>

            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
              title="Abrir en nueva pestaña completa del navegador"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Nueva Pestaña</span>
            </a>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                marginLeft: '4px',
              }}
              title="Cerrar visor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Viewer */}
        <div
          className="modal-body"
          style={{
            padding: 0,
            flex: 1,
            position: 'relative',
            background: '#1e293b',
            display: 'flex',
          }}
        >
          {resolvedUrl ? (
            <iframe
              src={resolvedUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={title}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                color: '#94a3b8',
                gap: '8px',
              }}
            >
              <FileText className="w-12 h-12 text-slate-500" />
              <p>No se pudo generar la URL del archivo PDF.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
