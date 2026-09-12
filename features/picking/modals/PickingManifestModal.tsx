'use client';

import React from 'react';
import { FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { OrdenPicking, ItemPicking } from '../types';
import { PickingService } from '../services/picking.service';

interface PickingManifestModalProps {
  order: OrdenPicking | null;
  items: ItemPicking[];
  onClose: () => void;
}

export const PickingManifestModal: React.FC<PickingManifestModalProps> = ({
  order,
  items,
  onClose
}) => {
  if (!order) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '680px', maxHeight: '94vh' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <FileText className="w-5 h-5 text-blue-600" /> Manifiesto de Despacho y Entrega a Agencia
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ border: '2px solid #0f172a', borderRadius: '10px', padding: '14px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  AMEX COURIER SAC
                </h2>
                <div style={{ fontSize: '11px', color: '#475569' }}>RUC: 20608912345 · Sede Central Lince, Lima</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>Transportista Encargado: <strong>{order.transportistaAgencia}</strong></div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace' }}>
                  {order.codigoOrden}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                  Fecha: {new Date(order.creadoEn).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', marginBottom: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
              <div>
                <span>Total Bultos:</span> <strong>{order.totalPaquetes} paquetes</strong>
              </div>
              <div>
                <span>Ruta / Destino:</span> <strong>{order.destinoCiudad}</strong>
              </div>
            </div>

            {/* Tabla de bultos */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#334155', fontWeight: 800 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Guía WR</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Destinatario</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>DNI / Tel</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Ciudad</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 800 }}>{it.codigoReciboBodega}</td>
                      <td style={{ padding: '6px 8px' }}>{it.consignatario}</td>
                      <td style={{ padding: '6px 8px', color: '#475569' }}>{it.dniConsignatario || it.telefonoConsignatario || '-'}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{it.ciudadDestino || 'Lima'}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{ color: it.estadoItem === 'RECOLECTADO' ? '#16a34a' : '#92400e', fontWeight: 800 }}>
                          {it.estadoItem === 'RECOLECTADO' ? '✓ Listo' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Firma de Recepción de la Agencia */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '28px', paddingTop: '10px' }}>
              <div style={{ borderTop: '1px dashed #64748b', textAlign: 'center', fontSize: '11px', color: '#475569' }}>
                Entregado por: Operador AMEX
              </div>
              <div style={{ borderTop: '1px dashed #64748b', textAlign: 'center', fontSize: '11px', color: '#475569' }}>
                Recibido por: Conductor {order.transportistaAgencia} (Firma y Sello)
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => PickingService.exportToExcel(order, items)}
            className="btn"
            style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px' }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Manifiesto Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
          >
            <Printer className="w-4 h-4" /> Imprimir Manifiesto
          </button>
        </div>
      </div>
    </div>
  );
};
