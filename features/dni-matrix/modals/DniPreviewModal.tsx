import React from 'react';
import { DniSlotData, DniPrintSize } from '../types';
import { DNI_SIZE_PRESETS } from '@/lib/dni-matrix/docx-exporter';

interface DniPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot: DniSlotData;
  activeSlotId: number;
  printSize: DniPrintSize;
  padNum: (num: number) => string;
}

export function DniPreviewModal({
  isOpen,
  onClose,
  activeSlot,
  activeSlotId,
  printSize,
  padNum
}: DniPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dni-modal-overlay">
      <div className="dni-modal-card dni-modal-large">
        <div className="dni-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#ffffff' }}>Vista Previa Impresión A4</h3>
            <span className="badge badge-ready">Expediente #{padNum(activeSlotId)}</span>
            <span className="badge badge-partial">
              {DNI_SIZE_PRESETS[printSize]?.widthCm} &times; {DNI_SIZE_PRESETS[printSize]?.heightCm} cm
            </span>
          </div>
          <button onClick={onClose} className="dni-modal-close-btn" title="Cerrar">
            &times;
          </button>
        </div>
        <div className="dni-modal-body" style={{ textAlign: 'center', background: '#0a0d14', padding: '24px' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#ffffff',
              color: '#000000',
              width: '320px',
              height: '452px',
              padding: printSize === 'large' ? '16px 14px' : printSize === 'xlarge' ? '14px 10px' : '24px 20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              borderRadius: '4px',
              position: 'relative'
            }}
          >
            {/* Cuadre Anverso */}
            <div
              style={{
                width: '100%',
                height: printSize === 'large' ? '165px' : printSize === 'xlarge' ? '175px' : '140px',
                border: '1.5px dashed #94a3b8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f8fafc'
              }}
            >
              {activeSlot.anverso ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeSlot.anverso}
                  alt="Anverso"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${activeSlot.anversoRotation || 0}deg)`
                  }}
                />
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Anverso ({DNI_SIZE_PRESETS[printSize]?.widthCm} &times; {DNI_SIZE_PRESETS[printSize]?.heightCm} cm)
                </span>
              )}
            </div>

            {/* Separador */}
            <div
              style={{
                margin: printSize === 'large' ? '14px 0' : printSize === 'xlarge' ? '10px 0' : '24px 0',
                borderTop: '1px dotted #cbd5e1',
                position: 'relative'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-9px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#fff',
                  padding: '0 8px',
                  fontSize: '9px',
                  color: '#94a3b8'
                }}
              >
                Separación {printSize === 'large' ? '1.2 cm' : printSize === 'xlarge' ? '0.9 cm' : '2.5 cm'}
              </span>
            </div>

            {/* Cuadre Reverso */}
            <div
              style={{
                width: '100%',
                height: printSize === 'large' ? '165px' : printSize === 'xlarge' ? '175px' : '140px',
                border: '1.5px dashed #94a3b8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                background: '#f8fafc'
              }}
            >
              {activeSlot.reverso ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeSlot.reverso}
                  alt="Reverso"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${activeSlot.reversoRotation || 0}deg)`
                  }}
                />
              ) : (
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Reverso ({DNI_SIZE_PRESETS[printSize]?.widthCm} &times; {DNI_SIZE_PRESETS[printSize]?.heightCm} cm)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="dni-modal-footer">
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            Medidas exactas para impresión física en hoja A4 (21.0 &times; 29.7 cm). Tamaño actual: {DNI_SIZE_PRESETS[printSize]?.widthCm} &times; {DNI_SIZE_PRESETS[printSize]?.heightCm} cm.
          </span>
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
