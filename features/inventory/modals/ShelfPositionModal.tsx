'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { BatchShelfData, SinglePositionData } from '../types';

export interface ShelfPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPositionMode: 'batch' | 'single';
  setNewPositionMode: (mode: 'batch' | 'single') => void;
  batchShelfData: BatchShelfData;
  setBatchShelfData: React.Dispatch<React.SetStateAction<BatchShelfData>>;
  newPositionData: SinglePositionData;
  setNewPositionData: React.Dispatch<React.SetStateAction<SinglePositionData>>;
  onCreateBatchShelf: (e: React.FormEvent) => Promise<void> | void;
  onCreatePosition: (e: React.FormEvent) => Promise<void> | void;
}

export default function ShelfPositionModal({
  isOpen,
  onClose,
  newPositionMode,
  setNewPositionMode,
  batchShelfData,
  setBatchShelfData,
  newPositionData,
  setNewPositionData,
  onCreateBatchShelf,
  onCreatePosition
}: ShelfPositionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus className="w-5 h-5 text-blue-600" /> Crear & Configurar Anaquel WMS
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Selector de Modo: Lote vs Individual */}
        <div style={{ padding: '12px 20px 0 20px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setNewPositionMode('batch')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: newPositionMode === 'batch' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: newPositionMode === 'batch' ? '#eff6ff' : '#ffffff',
              color: newPositionMode === 'batch' ? '#1d4ed8' : '#64748b',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ⚡ Anaquel Completo (Lote)
          </button>

          <button
            type="button"
            onClick={() => setNewPositionMode('single')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: newPositionMode === 'single' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: newPositionMode === 'single' ? '#eff6ff' : '#ffffff',
              color: newPositionMode === 'single' ? '#1d4ed8' : '#64748b',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🛠️ Posición Individual
          </button>
        </div>

        {/* MODO 1: CREAR EN LOTE */}
        {newPositionMode === 'batch' ? (
          <form onSubmit={onCreateBatchShelf} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 20px' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#166534' }}>
              💡 <b>Creación Rápida:</b> Genera automáticamente todos los pisos (P1, P2, P3...) con sus límites de capacidad para el nuevo anaquel en un solo paso.
            </div>

            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Código de Anaquel</label>
                <input
                  type="text"
                  placeholder="Ej: A3, B1, C2"
                  value={batchShelfData.codigoEstante}
                  onChange={e => setBatchShelfData({ ...batchShelfData, codigoEstante: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ fontWeight: 800, fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Cantidad de Pisos / Niveles</label>
                <select
                  value={batchShelfData.cantidadPisos}
                  onChange={e => setBatchShelfData({ ...batchShelfData, cantidadPisos: Number(e.target.value) })}
                  className="form-control"
                  style={{ fontWeight: 700 }}
                >
                  <option value={1}>1 Nivel (Solo P1)</option>
                  <option value={2}>2 Niveles (P1, P2)</option>
                  <option value={3}>3 Niveles (P1, P2, P3)</option>
                  <option value={4}>4 Niveles (P1, P2, P3, P4)</option>
                  <option value={5}>5 Niveles (P1 a P5)</option>
                </select>
              </div>
            </div>

            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Capacidad por Piso (Bultos)</label>
                <input
                  type="number"
                  value={batchShelfData.capacidadPorPiso}
                  onChange={e => setBatchShelfData({ ...batchShelfData, capacidadPorPiso: Number(e.target.value) })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Peso Máx. por Piso (Kg)</label>
                <input
                  type="number"
                  value={batchShelfData.pesoPorPiso}
                  onChange={e => setBatchShelfData({ ...batchShelfData, pesoPorPiso: Number(e.target.value) })}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Tipo de Zona</label>
                <select
                  value={batchShelfData.zonaTipo}
                  onChange={e => setBatchShelfData({ ...batchShelfData, zonaTipo: e.target.value })}
                  className="form-control"
                >
                  <option value="ALMACENAJE">📦 Almacenaje Normal</option>
                  <option value="RECEPCION">📥 Zona de Recepción</option>
                  <option value="DESPACHO">🚚 Zona de Despacho</option>
                  <option value="DEVOLUCION">⚠️ Devoluciones / Rechazos</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Sede Almacén</label>
                <select
                  value={batchShelfData.almacenCodigo}
                  onChange={e => setBatchShelfData({ ...batchShelfData, almacenCodigo: e.target.value })}
                  className="form-control"
                >
                  <option value="LIN">Sede Central Lince (Lima)</option>
                  <option value="MIA">Miami Hub (USA)</option>
                  <option value="TGO">Tingo María</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Descripción / Referencia Física</label>
              <input
                type="text"
                placeholder="Ej: Pasillo central lado izquierdo"
                value={batchShelfData.descripcion}
                onChange={e => setBatchShelfData({ ...batchShelfData, descripcion: e.target.value })}
                className="form-control"
              />
            </div>

            {/* Vista Previa de Posiciones a Generar */}
            {batchShelfData.codigoEstante && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Vista Previa de Códigos a Generar:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {Array.from({ length: batchShelfData.cantidadPisos }).map((_, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px'
                      }}
                    >
                      📍 {batchShelfData.codigoEstante}-P{idx + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                ✓ Crear Anaquel ({batchShelfData.cantidadPisos} Pisos)
              </button>
            </div>
          </form>
        ) : (
          /* MODO 2: CREAR POSICIÓN INDIVIDUAL */
          <form onSubmit={onCreatePosition} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px' }}>
            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Almacén Sede</label>
                <select
                  value={newPositionData.almacenCodigo}
                  onChange={e => setNewPositionData({ ...newPositionData, almacenCodigo: e.target.value })}
                  className="form-control"
                >
                  <option value="LIN">Sede Central Lince</option>
                  <option value="MIA">Miami Hub (USA)</option>
                  <option value="TGO">Tingo María</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Código Anaquel</label>
                <input
                  type="text"
                  placeholder="Ej: A3, B1, S1"
                  value={newPositionData.codigoEstante}
                  onChange={e => setNewPositionData({ ...newPositionData, codigoEstante: e.target.value.toUpperCase() })}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Nivel de Piso</label>
                <select
                  value={newPositionData.nivelPiso}
                  onChange={e => setNewPositionData({ ...newPositionData, nivelPiso: e.target.value })}
                  className="form-control"
                >
                  <option value="P1">P1 (Inferior)</option>
                  <option value="P2">P2 (Medio)</option>
                  <option value="P3">P3 (Superior)</option>
                  <option value="P4">P4 (Especial)</option>
                  <option value="P5">P5 (Altillo)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Tipo de Zona</label>
                <select
                  value={newPositionData.zonaTipo}
                  onChange={e => setNewPositionData({ ...newPositionData, zonaTipo: e.target.value })}
                  className="form-control"
                >
                  <option value="ALMACENAJE">Almacenaje Normal</option>
                  <option value="RECEPCION">Zona de Recepción</option>
                  <option value="DESPACHO">Zona de Despacho</option>
                  <option value="DEVOLUCION">Devoluciones / Rechazos</option>
                </select>
              </div>
            </div>

            <div className="wms-modal-grid-2">
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Capacidad Máx. (Paquetes)</label>
                <input
                  type="number"
                  value={newPositionData.capacidadMaxPaquetes}
                  onChange={e => setNewPositionData({ ...newPositionData, capacidadMaxPaquetes: Number(e.target.value) })}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Peso Máx. (Kg)</label>
                <input
                  type="number"
                  value={newPositionData.pesoMaxKg}
                  onChange={e => setNewPositionData({ ...newPositionData, pesoMaxKg: Number(e.target.value) })}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Descripción / Ubicación Física</label>
              <input
                type="text"
                placeholder="Ej: Anaquel sector derecho pasillo 2"
                value={newPositionData.descripcion}
                onChange={e => setNewPositionData({ ...newPositionData, descripcion: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                ✓ Guardar Posición
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
