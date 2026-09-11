'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';
import { EstanteriaPosicion } from '@/types';

export interface EditPositionModalProps {
  editingPosition: EstanteriaPosicion | null;
  setEditingPosition: React.Dispatch<React.SetStateAction<EstanteriaPosicion | null>>;
  onSave: (e: React.FormEvent) => Promise<void> | void;
}

export default function EditPositionModal({
  editingPosition,
  setEditingPosition,
  onSave
}: EditPositionModalProps) {
  if (!editingPosition) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
            <Edit3 className="w-5 h-5" /> Configurar Posición: {editingPosition.codigoPosicion}
          </span>
          <button
            type="button"
            onClick={() => setEditingPosition(null)}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Anaquel</label>
              <input
                type="text"
                value={editingPosition.codigoEstante}
                disabled
                className="form-control"
                style={{ background: '#f1f5f9', fontWeight: 800 }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Nivel / Piso</label>
              <input
                type="text"
                value={editingPosition.nivelPiso}
                disabled
                className="form-control"
                style={{ background: '#f1f5f9', fontWeight: 800 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Tipo de Zona</label>
            <select
              value={editingPosition.zonaTipo}
              onChange={e => setEditingPosition({ ...editingPosition, zonaTipo: e.target.value })}
              className="form-control"
            >
              <option value="ALMACENAJE">📦 Almacenaje</option>
              <option value="RECEPCION">📥 Recepción (REC)</option>
              <option value="DESPACHO">🚚 Despacho (DSP)</option>
              <option value="DEVOLUCION">⚠️ Devoluciones</option>
            </select>
          </div>

          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Capacidad Máx. (Paquetes)</label>
              <input
                type="number"
                value={editingPosition.capacidadMaxPaquetes}
                onChange={e =>
                  setEditingPosition({ ...editingPosition, capacidadMaxPaquetes: Number(e.target.value) })
                }
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Peso Máx. (Kg)</label>
              <input
                type="number"
                value={editingPosition.pesoMaxKg}
                onChange={e =>
                  setEditingPosition({ ...editingPosition, pesoMaxKg: Number(e.target.value) })
                }
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Descripción / Referencia</label>
            <input
              type="text"
              value={editingPosition.descripcion || ''}
              onChange={e => setEditingPosition({ ...editingPosition, descripcion: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setEditingPosition(null)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
              ✓ Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
