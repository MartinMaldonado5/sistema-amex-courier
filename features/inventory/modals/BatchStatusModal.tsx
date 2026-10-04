'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { TipoEstadoEntrega, TipoEstadoAmex } from '@/types';

export interface BatchStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  batchTargetStatus: TipoEstadoEntrega;
  setBatchTargetStatus: React.Dispatch<React.SetStateAction<TipoEstadoEntrega>>;
  batchTargetStatusAmex?: TipoEstadoAmex;
  setBatchTargetStatusAmex?: React.Dispatch<React.SetStateAction<TipoEstadoAmex>>;
  onConfirm: () => Promise<void> | void;
}

export default function BatchStatusModal({
  isOpen,
  onClose,
  selectedCount,
  batchTargetStatus,
  setBatchTargetStatus,
  batchTargetStatusAmex = 'recibido',
  setBatchTargetStatusAmex,
  onConfirm
}: BatchStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
            <Truck className="w-5 h-5" /> Cambiar Estado Masivo ({selectedCount} paquetes)
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '12.5px', color: '#475569', margin: 0 }}>
            Configura el nuevo estado para los <strong>{selectedCount}</strong> paquetes seleccionados:
          </p>

          {setBatchTargetStatusAmex && (
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1' }}>
                ⭐ Nuevo Estado Operativo AMEX
              </label>
              <select
                value={batchTargetStatusAmex}
                onChange={e => setBatchTargetStatusAmex(e.target.value as TipoEstadoAmex)}
                className="form-control"
                style={{
                  fontWeight: 700,
                  borderColor: '#93c5fd',
                  background: '#f0f9ff',
                  color: '#0369a1'
                }}
              >
                <option value="recibido">📥 Recibido (Ingreso en Recepción)</option>
                <option value="en_almacen">📦 En Almacén (Ubicado en Estante)</option>
                <option value="listo_recojo">🏪 Listo para Recojo en Tienda Lince</option>
                <option value="en_ruta">🚚 En Ruta (Reparto / Envío a Provincia)</option>
                <option value="entregado">✅ Entregado al Cliente Final</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
              Estado Logístico TIB
            </label>
            <select
              value={batchTargetStatus}
              onChange={e => setBatchTargetStatus(e.target.value as any)}
              className="form-control"
              style={{ fontWeight: 600 }}
            >
              <option value="EnAlmacen">📦 EnAlmacen (Almacén Miami/Lima)</option>
              <option value="Enviado">✈️ Enviado (En Tránsito TIB)</option>
              <option value="Recibido">📥 Recibido (En Bodega TIB)</option>
              <option value="Entregado">✅ Entregado (Completado TIB)</option>
            </select>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={onConfirm} className="btn btn-primary" style={{ fontWeight: 800 }}>
              ✓ Aplicar a {selectedCount} paquetes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
