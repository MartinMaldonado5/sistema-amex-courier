'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit2,
  X,
  RefreshCw,
  FileText,
  User,
  MapPin,
  Package,
  DollarSign
} from 'lucide-react';
import { BoletaShalom, ModalidadPagoShalom } from '@/types';
import { FormFields, DEFAULT_FORM } from '../types';
import { shalomService } from '../services/shalom.service';

interface ShalomEditModalProps {
  isOpen: boolean;
  boleta: BoletaShalom | null;
  onClose: () => void;
  onUpdated: (updatedBoleta: BoletaShalom) => void;
}

export const ShalomEditModal: React.FC<ShalomEditModalProps> = ({
  isOpen,
  boleta,
  onClose,
  onUpdated
}) => {
  const [editFormData, setEditFormData] = useState<FormFields>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (boleta) {
      setEditFormData({
        nro_orden: boleta.nro_orden || '',
        codigo: boleta.codigo || '',
        fecha_emision: boleta.fecha_emision,
        destinatario_nombre: boleta.destinatario_nombre,
        destinatario_dni: boleta.destinatario_dni || '',
        destinatario_telefono: boleta.destinatario_telefono || '',
        destino: boleta.destino,
        tipo_entrega: boleta.tipo_entrega || 'ENTREGAR EN AGENCIA',
        forma_pago: boleta.forma_pago || 'Pendiente de Pago',
        descripcion: boleta.descripcion || 'BULTO',
        cantidad: boleta.cantidad || 1,
        peso: boleta.peso ?? 0,
        monto_total: boleta.monto_total
      });
    }
  }, [boleta]);

  if (!isOpen || !boleta) return null;

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const updated = await shalomService.updateBoleta(boleta.id, editFormData);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar boleta');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="shalom-modal-overlay">
      <div className="shalom-modal-container" style={{ maxWidth: '680px' }}>
        <div className="shalom-modal-header">
          <h3>
            <Edit2 size={18} className="text-sky-400" />
            Editar Boleta Shalom N° {editFormData.nro_orden || editFormData.numero_guia}
          </h3>
          <button
            type="button"
            className="shalom-modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="shalom-modal-body flex flex-col gap-4">
          {/* Sección 1: Comprobante */}
          <div className="shalom-form-section">
            <div className="shalom-form-section-title">
              <FileText size={14} /> 1. Comprobante Shalom
            </div>
            <div className="shalom-form-grid-3">
              <div className="shalom-field">
                <label>NRO. ORDEN *</label>
                <input
                  type="text"
                  className="shalom-input font-mono font-bold"
                  value={editFormData.nro_orden}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      nro_orden: e.target.value.toUpperCase(),
                      numero_guia: e.target.value.toUpperCase()
                    })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>CÓDIGO RETIRO / TRACKING</label>
                <input
                  type="text"
                  className="shalom-input font-mono"
                  value={editFormData.codigo}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      codigo: e.target.value.toUpperCase(),
                      codigo_seguimiento: e.target.value.toUpperCase()
                    })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>Fecha Emisión *</label>
                <input
                  type="date"
                  className="shalom-input"
                  value={editFormData.fecha_emision}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fecha_emision: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Destinatario */}
          <div className="shalom-form-section">
            <div className="shalom-form-section-title">
              <User size={14} /> 2. Datos del Destinatario
            </div>
            <div className="shalom-field">
              <label>Nombre Destinatario *</label>
              <input
                type="text"
                className="shalom-input"
                value={editFormData.destinatario_nombre}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, destinatario_nombre: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="shalom-form-grid-2">
              <div className="shalom-field">
                <label>DNI / RUC Destinatario</label>
                <input
                  type="text"
                  className="shalom-input font-mono"
                  value={editFormData.destinatario_dni}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      destinatario_dni: e.target.value,
                      destinatario_documento: e.target.value
                    })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>Teléfono Destinatario</label>
                <input
                  type="text"
                  className="shalom-input font-mono"
                  value={editFormData.destinatario_telefono}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, destinatario_telefono: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Destino y Entrega */}
          <div className="shalom-form-section">
            <div className="shalom-form-section-title">
              <MapPin size={14} /> 3. Destino y Entrega
            </div>
            <div className="shalom-form-grid-2">
              <div className="shalom-field">
                <label>Destino (Ciudad / Agencia Shalom) *</label>
                <input
                  type="text"
                  className="shalom-input text-xs"
                  value={editFormData.destino}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, destino: e.target.value.toUpperCase() })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>Tipo Entrega</label>
                <input
                  type="text"
                  className="shalom-input"
                  value={editFormData.tipo_entrega}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      tipo_entrega: e.target.value.toUpperCase(),
                      agencia_destino: e.target.value.toUpperCase()
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Paquete y Pago */}
          <div className="shalom-form-section">
            <div className="shalom-form-section-title">
              <Package size={14} /> 4. Detalle del Envío y Pago
            </div>
            <div className="shalom-form-grid-3">
              <div className="shalom-field">
                <label>Descripción</label>
                <input
                  type="text"
                  className="shalom-input"
                  value={editFormData.descripcion}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      descripcion: e.target.value,
                      contenido_bultos: e.target.value
                    })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className="shalom-input font-mono"
                  value={editFormData.cantidad}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cantidad: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="shalom-field">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.001"
                  className="shalom-input font-mono"
                  value={editFormData.peso}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      peso: parseFloat(e.target.value) || 0,
                      peso_total: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>
            </div>

            <div className="shalom-form-grid-2">
              <div className="shalom-field">
                <label>Forma de Pago</label>
                <input
                  type="text"
                  className="shalom-input"
                  value={editFormData.forma_pago}
                  onChange={(e) => {
                    const fp = e.target.value;
                    const mod: ModalidadPagoShalom = fp.toLowerCase().includes('pagad')
                      ? 'PAGADO'
                      : fp.toLowerCase().includes('credit')
                      ? 'CREDITO'
                      : 'PAGO_DESTINO';
                    setEditFormData({ ...editFormData, forma_pago: fp, modalidad_pago: mod });
                  }}
                />
              </div>
              <div className="shalom-field">
                <label>TOTAL (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  className="shalom-input font-mono font-bold text-emerald-400"
                  value={editFormData.monto_total}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, monto_total: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="shalom-modal-footer">
          <button
            type="button"
            className="shalom-btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="shalom-btn-primary"
            onClick={handleSaveEdit}
            disabled={isSaving}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : null}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
