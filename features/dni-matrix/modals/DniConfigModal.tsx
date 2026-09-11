import React from 'react';
import { SlidersHorizontal, X, Layers, AlertTriangle, Trash2 } from 'lucide-react';
import { DniPrintSize } from '@/lib/dni-matrix/docx-exporter';
import { dniDb } from '@/lib/dni-matrix/db';

interface DniConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalSlots: number;
  setTotalSlots: (val: number) => void;
  printSize: DniPrintSize;
  setPrintSize: (val: DniPrintSize) => void;
  onOpenDeleteConfirm: () => void;
  showToast: (text: string, type?: 'info' | 'success' | 'error') => void;
}

export function DniConfigModal({
  isOpen,
  onClose,
  totalSlots,
  setTotalSlots,
  printSize,
  setPrintSize,
  onOpenDeleteConfirm,
  showToast
}: DniConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dni-modal-overlay">
      <div className="dni-modal-card" style={{ maxWidth: '540px' }}>
        <div className="dni-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                Configuración de Lote y Cupos
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                Ajusta la capacidad de la matriz y el tamaño para Word/PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="dni-modal-close-btn"
            title="Cerrar ajustes"
          >
            <X size={18} />
          </button>
        </div>
        <div className="dni-modal-body">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#f8fafc', fontWeight: 600, fontSize: '0.86rem' }}>
              <Layers size={16} style={{ color: '#38bdf8' }} />
              Cantidad total de cupos en la matriz:
            </label>
            <select
              value={totalSlots}
              onChange={async (e) => {
                const count = Number(e.target.value);
                setTotalSlots(count);
                await dniDb.saveSetting('totalSlots', count);
              }}
              className="form-select"
              style={{ marginTop: '6px' }}
            >
              <option value="50">50 Cupos (#001 a #050)</option>
              <option value="100">100 Cupos (#001 a #100) — Estándar</option>
              <option value="200">200 Cupos (#001 a #200)</option>
              <option value="300">300 Cupos (#001 a #300)</option>
              <option value="500">500 Cupos (#001 a #500)</option>
              <option value="1000">1000 Cupos (#0001 a #1000)</option>
            </select>
            <small style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '5px', display: 'block' }}>
              💡 Si cambias la cantidad, los expedientes ya cargados dentro del nuevo rango se conservan.
            </small>
          </div>

          <hr className="dni-modal-divider" />

          {/* Selector de Tamaño de DNI */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700, fontSize: '0.86rem', marginBottom: '8px' }}>
              📐 Tamaño de los DNI en Hoja Word y PDF:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                className={`dni-size-card ${printSize === 'large' ? 'active' : ''}`}
                onClick={async () => {
                  setPrintSize('large');
                  await dniDb.saveSetting('dniPrintSize', 'large');
                  showToast('Tamaño Grande (16.5 × 10.4 cm) guardado', 'success');
                }}
              >
                <input
                  type="radio"
                  name="printSizeOption"
                  checked={printSize === 'large'}
                  onChange={() => {}}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                      Grande (16.5 &times; 10.4 cm)
                    </span>
                    <span className="badge badge-ready" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>Recomendado</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                    Ocupa la mayor parte de la hoja A4 sin dejar espacios vacíos exagerados. Información y sellos del DNI 100% nítidos y legibles (1 sola página exacta).
                  </div>
                </div>
              </label>

              <label
                className={`dni-size-card ${printSize === 'xlarge' ? 'active' : ''}`}
                onClick={async () => {
                  setPrintSize('xlarge');
                  await dniDb.saveSetting('dniPrintSize', 'xlarge');
                  showToast('Tamaño Extra Grande (17.5 × 11.0 cm) guardado', 'success');
                }}
              >
                <input
                  type="radio"
                  name="printSizeOption"
                  checked={printSize === 'xlarge'}
                  onChange={() => {}}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                      Extra Grande (17.5 &times; 11.0 cm)
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', fontWeight: 700 }}>
                      Máximo Detalle
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                    Ocupación máxima de margen a margen (1.5 cm) en la hoja A4 para casos donde se requiere ver cada detalle microscópico.
                  </div>
                </div>
              </label>

              <label
                className={`dni-size-card ${printSize === 'standard' ? 'active' : ''}`}
                onClick={async () => {
                  setPrintSize('standard');
                  await dniDb.saveSetting('dniPrintSize', 'standard');
                  showToast('Tamaño Estándar (12.0 × 7.5 cm) guardado', 'info');
                }}
              >
                <input
                  type="radio"
                  name="printSizeOption"
                  checked={printSize === 'standard'}
                  onChange={() => {}}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                      Estándar (12.0 &times; 7.5 cm)
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', fontWeight: 600 }}>
                      Reglamentario
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px', lineHeight: 1.4 }}>
                    Medida reglamentaria tradicional más pequeña, centrada en la hoja con amplios márgenes alrededor.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <hr className="dni-modal-divider" />

          {/* Zona de peligro */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.22)',
              borderRadius: '12px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 700, fontSize: '0.88rem' }}>
              <AlertTriangle size={16} />
              <span>Zona de Peligro</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '6px 0 12px 0', lineHeight: 1.4 }}>
              Borra todos los DNIs, números y fotos guardadas en este navegador para iniciar un nuevo lote de trabajo en blanco.
            </p>
            <button
              type="button"
              onClick={onOpenDeleteConfirm}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              }}
            >
              <Trash2 size={15} />
              Borrar Todos los Datos del Lote
            </button>
          </div>
        </div>
        <div className="dni-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ minWidth: '90px' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
