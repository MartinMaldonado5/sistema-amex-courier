'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';
import { Paquete, TipoUbicacion } from '@/types';

export interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: Paquete | null;
  editFormData: Partial<Paquete>;
  setEditFormData: React.Dispatch<React.SetStateAction<Partial<Paquete>>>;
  onSave: (e: React.FormEvent) => Promise<void> | void;
}

export default function EditPackageModal({
  isOpen,
  onClose,
  selectedPackage,
  editFormData,
  setEditFormData,
  onSave
}: EditPackageModalProps) {
  if (!isOpen || !selectedPackage) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 className="w-5 h-5 text-blue-600" /> Editar Paquete / Ajustar Existencia
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Guía WR (No editable)</label>
              <input
                type="text"
                value={editFormData.numeroReciboBodega || ''}
                disabled
                className="form-control"
                style={{ background: '#f1f5f9', fontWeight: 800, fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Código Casillero</label>
              <input
                type="text"
                value={editFormData.codigoCasillero || ''}
                onChange={e => setEditFormData({ ...editFormData, codigoCasillero: e.target.value })}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Nombre Consignatario</label>
            <input
              type="text"
              value={editFormData.nombreConsignatario || ''}
              onChange={e => setEditFormData({ ...editFormData, nombreConsignatario: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Descripción del Contenido</label>
            <input
              type="text"
              value={editFormData.descripcion || ''}
              onChange={e => setEditFormData({ ...editFormData, descripcion: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="wms-modal-grid-3">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Peso (Kg)</label>
              <input
                type="number"
                step="0.01"
                value={editFormData.pesoKg || 0}
                onChange={e => setEditFormData({ ...editFormData, pesoKg: Number(e.target.value) })}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Valor Decl. ($)</label>
              <input
                type="number"
                step="0.01"
                value={editFormData.valorDeclaradoUsd || 0}
                onChange={e => setEditFormData({ ...editFormData, valorDeclaradoUsd: Number(e.target.value) })}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Tipo Empaque</label>
              <select
                value={editFormData.tipoEmpaque || 'CAJA'}
                onChange={e => setEditFormData({ ...editFormData, tipoEmpaque: e.target.value })}
                className="form-control"
              >
                <option value="CAJA">CAJA</option>
                <option value="SOBRE">SOBRE</option>
                <option value="SACA">SACA</option>
              </select>
            </div>
          </div>

          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Almacén Sede</label>
              <select
                value={editFormData.ubicacionActual || 'AmexLince'}
                onChange={e => setEditFormData({ ...editFormData, ubicacionActual: e.target.value as TipoUbicacion })}
                className="form-control"
              >
                <option value="AmexLince">Sede Central Lince</option>
                <option value="TibCourierMiami">Miami Hub (USA)</option>
                <option value="TibTingoMaria">Tingo María</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Posición Estante WMS</label>
              <input
                type="text"
                value={editFormData.posicionEstante || 'A1-P1'}
                onChange={e => setEditFormData({ ...editFormData, posicionEstante: e.target.value })}
                placeholder="Ej: A1-P1, A2-P3, REC"
                className="form-control"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}
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
