'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { TipoEstadoEntrega } from '@/types';

export interface BatchStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  batchTargetStatus: TipoEstadoEntrega;
  setBatchTargetStatus: React.Dispatch<React.SetStateAction<TipoEstadoEntrega>>;
  onConfirm: () => Promise<void> | void;
}

export default function BatchStatusModal({
  isOpen,
  onClose,
  selectedCount,
  batchTargetStatus,
  setBatchTargetStatus,
  onConfirm
}: BatchStatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '440px' }}>
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
            Selecciona el nuevo estado para los <strong>{selectedCount}</strong> paquetes seleccionados:
          </p>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Nuevo Estado</label>
            <select
              value={batchTargetStatus}
              onChange={e => setBatchTargetStatus(e.target.value as TipoEstadoEntrega)}
              className="form-control"
              style={{ fontWeight: 700 }}
            >
              <option value="EnAlmacen">📦 En Almacén (Custodia Lince)</option>
              <option value="EnRutaCarroAmex">🚚 En Ruta Carro Amex (Despacho Domicilio)</option>
              <option value="ListoParaRecojo">🏪 Listo para Recojo en Tienda Lince</option>
              <option value="Entregado">✅ Entregado / Despachado</option>
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
