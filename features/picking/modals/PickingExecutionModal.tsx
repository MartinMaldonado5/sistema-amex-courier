'use client';

import React from 'react';
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  FileText,
  Plus,
  Save
} from 'lucide-react';
import { OrdenPicking, ItemPicking, ScanFeedbackMessage } from '../types';

interface PickingExecutionModalProps {
  order: OrdenPicking | null;
  items: ItemPicking[];
  scanFeedbackMessage: ScanFeedbackMessage | null;
  inModalScanInput: string;
  setInModalScanInput: (val: string) => void;
  onProcessBarcode: (code: string) => void;
  onToggleItemCollected: (item: ItemPicking, order: OrdenPicking) => void;
  onClose: () => void;
  onOpenManifest: (order: OrdenPicking) => void;
  onDispatchOrder: (order: OrdenPicking) => void;
}

export const PickingExecutionModal: React.FC<PickingExecutionModalProps> = ({
  order,
  items,
  scanFeedbackMessage,
  inModalScanInput,
  setInModalScanInput,
  onProcessBarcode,
  onToggleItemCollected,
  onClose,
  onOpenManifest,
  onDispatchOrder
}) => {
  if (!order) return null;

  const groupedByShelf = items.reduce((acc, item) => {
    const shelf = item.ubicacionAnaquel.split('-')[0] || 'A1';
    if (!acc[shelf]) acc[shelf] = [];
    acc[shelf].push(item);
    return acc;
  }, {} as Record<string, ItemPicking[]>);

  const progressPct = Math.round(
    (order.recolectadosPaquetes / (order.totalPaquetes || 1)) * 100
  );

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '640px', maxHeight: '94vh' }}>
        <div className="modal-header" style={{ background: '#0f172a', color: '#ffffff' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase' }}>
              Lista de Recolección en Almacén
            </span>
            <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace' }}>
              {order.codigoOrden} · 🚚 {order.transportistaAgencia}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Barra de progreso destacada */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                🎯 Progreso: {order.recolectadosPaquetes} / {order.totalPaquetes} recolectados
              </span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: order.recolectadosPaquetes === order.totalPaquetes ? '#16a34a' : '#2563eb' }}>
                {progressPct}%
              </span>
            </div>
            <div style={{ width: '100%', height: '9px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: order.recolectadosPaquetes === order.totalPaquetes ? '#16a34a' : '#2563eb',
                  width: `${(order.recolectadosPaquetes / (order.totalPaquetes || 1)) * 100}%`,
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>

          {/* Mensaje de feedback de escaneo */}
          {scanFeedbackMessage && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: scanFeedbackMessage.isError ? '#fef2f2' : '#dcfce7',
                border: scanFeedbackMessage.isError ? '1px solid #fecaca' : '1px solid #86efac',
                color: scanFeedbackMessage.isError ? '#dc2626' : '#166534'
              }}
            >
              {scanFeedbackMessage.isError ? (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              )}
              <span>{scanFeedbackMessage.text}</span>
            </div>
          )}

          {/* Entrada de escaneo rápido / pistola */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Barcode className="w-4 h-4 text-blue-600" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Pistolea o escribe código WR para marcar..."
                value={inModalScanInput}
                onChange={(e) => setInModalScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onProcessBarcode(inModalScanInput);
                    setInModalScanInput('');
                  }
                }}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '34px',
                  paddingRight: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #3b82f6',
                  fontSize: '12.5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800,
                  outline: 'none'
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onProcessBarcode(inModalScanInput);
                setInModalScanInput('');
              }}
              className="btn btn-primary"
              style={{ height: '38px', padding: '0 12px', fontSize: '12px', fontWeight: 800, borderRadius: '8px' }}
            >
              ✓ Marcar
            </button>
          </div>

          {/* LISTA ORDENADA INTELIGENTEMENTE POR ANAQUELES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(groupedByShelf).map(([shelf, shelfItems]) => (
              <div key={shelf} style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    background: shelf === 'A1' ? '#dbeafe' : shelf === 'A2' ? '#dcfce7' : '#fef3c7',
                    color: shelf === 'A1' ? '#1e40af' : shelf === 'A2' ? '#166534' : '#92400e',
                    padding: '8px 12px',
                    fontWeight: 900,
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>📦 {shelf === 'A1' ? 'Anaquel 1 (A1)' : shelf === 'A2' ? 'Anaquel 2 (A2)' : 'Mesa Recepción (REC)'}</span>
                  <span style={{ fontSize: '11px', fontWeight: 800 }}>
                    {shelfItems.filter((x) => x.estadoItem === 'RECOLECTADO').length} / {shelfItems.length} recolectados
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {shelfItems.map((item) => {
                    const isCollected = item.estadoItem === 'RECOLECTADO';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderBottom: '1px solid #f1f5f9',
                          background: isCollected ? '#f0fdf4' : '#ffffff',
                          gap: '8px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '13px',
                                fontWeight: 900,
                                color: isCollected ? '#166534' : '#0f172a',
                                textDecoration: isCollected ? 'line-through' : 'none'
                              }}
                            >
                              {item.codigoReciboBodega}
                            </span>

                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 900,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: isCollected ? '#86efac' : '#2563eb',
                                color: '#ffffff',
                                fontFamily: 'monospace'
                              }}
                            >
                              📍 {item.ubicacionAnaquel}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {item.consignatario} {item.telefonoConsignatario ? `· 📞 ${item.telefonoConsignatario}` : ''} · {item.ciudadDestino || 'Lima'}
                          </div>
                        </div>

                        <button
                          onClick={() => onToggleItemCollected(item, order)}
                          style={{
                            background: isCollected ? '#16a34a' : '#f1f5f9',
                            color: isCollected ? '#ffffff' : '#334155',
                            border: isCollected ? '1px solid #15803d' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isCollected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" /> Recolectado
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Recolectar
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              alert('✓ Avance de recolección guardado exitosamente.');
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Save className="w-4 h-4 text-blue-600" /> Guardar y Salir
          </button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onOpenManifest(order)}
              className="btn btn-secondary"
              style={{ fontSize: '12px', fontWeight: 700 }}
            >
              <FileText className="w-4 h-4" /> Ver Manifiesto
            </button>

            <button
              type="button"
              onClick={() => onDispatchOrder(order)}
              className="btn btn-primary"
              style={{
                background: order.recolectadosPaquetes === order.totalPaquetes ? '#16a34a' : '#2563eb',
                fontSize: '12.5px',
                fontWeight: 900
              }}
            >
              🚚 Despachar a {order.transportistaAgencia}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
