import React from 'react';
import { ZoomImageState } from '../types';

interface DniZoomModalProps {
  zoomImage: ZoomImageState | null;
  onClose: () => void;
}

export function DniZoomModal({ zoomImage, onClose }: DniZoomModalProps) {
  if (!zoomImage) return null;

  return (
    <div className="dni-modal-overlay" onClick={onClose} style={{ zIndex: 1500 }}>
      <div
        className="zoom-lightbox-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          maxHeight: '92vh',
          width: '800px',
          background: '#07090e',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700 }}>{zoomImage.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dni-modal-close-btn"
            style={{
              fontSize: '1.3rem',
              padding: '4px 10px',
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: '350px',
            maxHeight: '76vh',
            background: '#020408',
            borderRadius: '6px'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImage.url}
            alt="DNI Zoom"
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              transform: `rotate(${zoomImage.rotation || 0}deg)`,
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Presiona Esc o haz clic fuera para cerrar
        </div>
      </div>
    </div>
  );
}
