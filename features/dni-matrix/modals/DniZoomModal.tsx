import React from 'react';
import { ZoomImageState } from '../types';

interface DniZoomModalProps {
  zoomImage: ZoomImageState | null;
  onClose: () => void;
  onRotate?: (degrees: number) => void;
  onSetRotation?: (degrees: number) => void;
}

export function DniZoomModal({ zoomImage, onClose, onRotate, onSetRotation }: DniZoomModalProps) {
  if (!zoomImage) return null;

  const currentRot = zoomImage.rotation || 0;
  const displayDeg = currentRot > 180 ? currentRot - 360 : currentRot;

  return (
    <div className="dni-modal-overlay" onClick={onClose} style={{ zIndex: 1500 }}>
      <div
        className="zoom-lightbox-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '94vw',
          maxHeight: '94vh',
          width: '880px',
          background: '#07090e',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700 }}>{zoomImage.title}</h3>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: currentRot !== 0 ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: currentRot !== 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                fontWeight: 700,
                border: currentRot !== 0 ? '1px solid var(--accent-cyan)' : '1px solid transparent'
              }}
            >
              Rotación: {Math.round(displayDeg)}°
            </span>
          </div>

          {/* BARRA DE HERRAMIENTAS DE ROTACIÓN RÁPIDA EN EL ZOOM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onRotate && (
              <>
                <button
                  type="button"
                  onClick={() => onRotate(-90)}
                  className="action-btn"
                  title="Girar 90° a la izquierda"
                  style={{ width: '32px', height: '28px', fontSize: '0.9rem' }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={() => onRotate(-1)}
                  className="action-btn"
                  title="Ajuste fino -1°"
                  style={{ width: '32px', height: '28px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  −1°
                </button>
                <button
                  type="button"
                  onClick={() => onRotate(1)}
                  className="action-btn"
                  title="Ajuste fino +1°"
                  style={{ width: '32px', height: '28px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  +1°
                </button>
                <button
                  type="button"
                  onClick={() => onRotate(90)}
                  className="action-btn"
                  title="Girar 90° a la derecha"
                  style={{ width: '32px', height: '28px', fontSize: '0.9rem' }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={() => onRotate(180)}
                  className="action-btn"
                  title="Voltear 180° (de cabeza)"
                  style={{ width: 'auto', padding: '0 8px', height: '28px', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  🔄 180°
                </button>
              </>
            )}
            {onSetRotation && (
              <button
                type="button"
                onClick={() => onSetRotation(0)}
                className="action-btn"
                title="Restablecer a 0°"
                disabled={currentRot === 0}
                style={{ width: 'auto', padding: '0 8px', height: '28px', fontSize: '0.75rem', fontWeight: 600, opacity: currentRot === 0 ? 0.4 : 1 }}
              >
                0° Reset
              </button>
            )}
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
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            minHeight: '380px',
            maxHeight: '76vh',
            background: '#020408',
            borderRadius: '6px',
            position: 'relative'
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
              transition: 'transform 0.2s ease',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span>💡 Puedes rotar y nivelar la imagen con los botones superiores antes de exportar</span>
          <span>Presiona Esc o haz clic fuera para cerrar</span>
        </div>
      </div>
    </div>
  );
}
