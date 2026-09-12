'use client';

import React from 'react';
import { Barcode, Edit3, FileText, Trash2 } from 'lucide-react';
import { OrdenPicking, ItemPicking } from '../types';

interface PickingOrderCardProps {
  order: OrdenPicking;
  items: ItemPicking[];
  onOpenExecution: (order: OrdenPicking) => void;
  onOpenEdit: (order: OrdenPicking) => void;
  onOpenManifest: (order: OrdenPicking) => void;
  onDeleteOrder: (orderId: string) => void;
}

export const PickingOrderCard: React.FC<PickingOrderCardProps> = ({
  order,
  items,
  onOpenExecution,
  onOpenEdit,
  onOpenManifest,
  onDeleteOrder
}) => {
  const progressPct =
    order.totalPaquetes > 0 ? Math.round((order.recolectadosPaquetes / order.totalPaquetes) * 100) : 0;
  const isShalom = order.transportistaAgencia.toUpperCase().includes('SHALOM');
  const isOlva = order.transportistaAgencia.toUpperCase().includes('OLVA');
  const isDone = order.estado === 'COMPLETADO' || order.estado === 'DESPACHADO';

  return (
    <div
      style={{
        background: '#ffffff',
        border: isDone ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
        borderRadius: '12px',
        padding: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px'
      }}
    >
      <div>
        {/* Header de la tarjeta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                padding: '3px 8px',
                borderRadius: '6px',
                background: isShalom ? '#fee2e2' : isOlva ? '#fef3c7' : '#eff6ff',
                color: isShalom ? '#b91c1c' : isOlva ? '#92400e' : '#1e40af',
                textTransform: 'uppercase'
              }}
            >
              🚚 {order.transportistaAgencia}
            </span>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              {order.codigoOrden}
            </div>
          </div>

          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '12px',
              background: order.estado === 'DESPACHADO' ? '#dcfce7' : order.estado === 'COMPLETADO' ? '#dbeafe' : '#fef3c7',
              color: order.estado === 'DESPACHADO' ? '#166534' : order.estado === 'COMPLETADO' ? '#1e40af' : '#92400e'
            }}
          >
            {order.estado === 'DESPACHADO' ? '🟢 Despachado' : order.estado === 'COMPLETADO' ? '🔵 100% Recolectado' : '🟡 En Recolección'}
          </span>
        </div>

        <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
          📍 Destino: <strong>{order.destinoCiudad}</strong> · 👤 Operador: <strong>{order.operadorAsignado}</strong>
        </div>

        {/* Barra de progreso de recolección */}
        <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, marginBottom: '4px' }}>
            <span style={{ color: '#334155' }}>Progreso de Recolección:</span>
            <span style={{ color: progressPct === 100 ? '#16a34a' : '#2563eb' }}>
              {order.recolectadosPaquetes} / {order.totalPaquetes} ({progressPct}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '7px', background: '#cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: progressPct === 100 ? '#16a34a' : '#2563eb',
                width: `${progressPct}%`,
                transition: 'width 0.2s ease'
              }}
            />
          </div>
        </div>

        {/* Desglose de anaqueles asignados */}
        <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Array.from(new Set(items.map((it) => it.ubicacionAnaquel.split('-')[0]))).map((shelf) => (
            <span key={shelf} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              📦 {shelf}: {items.filter((it) => it.ubicacionAnaquel.startsWith(shelf)).length} bultos
            </span>
          ))}
        </div>
      </div>

      {/* Acciones de la tarjeta */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
        <button
          onClick={() => onOpenExecution(order)}
          className="btn btn-primary"
          style={{ flex: '1 1 120px', height: '38px', fontSize: '12px', fontWeight: 800, borderRadius: '8px', justifyContent: 'center', gap: '6px' }}
        >
          <Barcode className="w-4 h-4" />
          {order.estado === 'DESPACHADO' ? 'Ver Recolección' : 'Buscar / Recolectar'}
        </button>

        <button
          onClick={() => onOpenEdit(order)}
          className="btn btn-secondary"
          style={{ flex: '1 1 100px', height: '38px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', justifyContent: 'center', gap: '4px' }}
          title="Editar orden o agregar más WRs"
        >
          <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Editar WRs
        </button>

        <button
          onClick={() => onOpenManifest(order)}
          className="btn btn-secondary"
          style={{ flex: '1 1 90px', height: '38px', fontSize: '11.5px', fontWeight: 700, borderRadius: '8px', justifyContent: 'center', gap: '4px' }}
          title="Ver Manifiesto de Despacho"
        >
          <FileText className="w-3.5 h-3.5" /> Manifiesto
        </button>

        <button
          onClick={() => onDeleteOrder(order.id)}
          className="btn"
          style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Eliminar orden de picking"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
