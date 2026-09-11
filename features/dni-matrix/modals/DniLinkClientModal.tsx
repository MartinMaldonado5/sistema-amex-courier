import React from 'react';
import { Cliente, Paquete } from '@/types';
import { DniSlotData } from '../types';

interface DniLinkClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlotId: number;
  activeSlot: DniSlotData;
  clientes: Cliente[];
  paquetes: Paquete[];
  updateSlot: (slot: DniSlotData) => Promise<void>;
  showToast: (text: string, type?: 'info' | 'success' | 'error') => void;
  padNum: (num: number) => string;
}

export function DniLinkClientModal({
  isOpen,
  onClose,
  activeSlotId,
  activeSlot,
  clientes,
  paquetes,
  updateSlot,
  showToast,
  padNum
}: DniLinkClientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dni-modal-overlay">
      <div className="dni-modal-card">
        <div className="dni-modal-header">
          <h3 style={{ margin: 0, color: '#ffffff' }}>Vincular Cupo #{padNum(activeSlotId)} con AMEX</h3>
          <button onClick={onClose} className="dni-modal-close-btn" title="Cerrar">
            &times;
          </button>
        </div>
        <div className="dni-modal-body">
          <div className="form-group">
            <label>Seleccionar Cliente Registrado:</label>
            <select
              className="form-select"
              defaultValue=""
              onChange={(e) => {
                const cl = clientes.find((c) => c.id === e.target.value);
                if (cl) {
                  updateSlot({
                    ...activeSlot,
                    clienteId: cl.id,
                    label: `${cl.documentoIdentidad || ''} - ${cl.nombre}`
                  });
                  onClose();
                  showToast(`Vinculado con ${cl.nombre}`, 'success');
                }
              }}
            >
              <option value="" disabled>
                Selecciona un cliente de la base de datos...
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.documentoIdentidad ? `[DNI ${c.documentoIdentidad}] ` : ''}
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>O Seleccionar por Guía WR:</label>
            <select
              className="form-select"
              defaultValue=""
              onChange={(e) => {
                const p = paquetes.find((pkg) => pkg.id === e.target.value);
                if (p) {
                  updateSlot({
                    ...activeSlot,
                    paqueteId: p.id,
                    label: `${p.numeroReciboBodega} - ${p.nombreConsignatario || p.dniConsignatario || ''}`
                  });
                  onClose();
                  showToast(`Vinculado con WR ${p.numeroReciboBodega}`, 'success');
                }
              }}
            >
              <option value="" disabled>
                Selecciona un paquete en bodega...
              </option>
              {paquetes.slice(0, 100).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroReciboBodega} - {p.nombreConsignatario || p.dniConsignatario || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="dni-modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
