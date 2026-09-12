'use client';

import React from 'react';
import { CobrosMetrics, CobrosSubtab } from '../types';

interface CobrosKpiCardsProps {
  metrics: CobrosMetrics;
  setSubtab: (subtab: CobrosSubtab) => void;
  setMethodFilter: (filter: string) => void;
}

export const CobrosKpiCards: React.FC<CobrosKpiCardsProps> = ({
  metrics,
  setSubtab,
  setMethodFilter
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
          Total Cobrado (Soles)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#065f46', marginTop: '4px' }}>
          S/ {metrics.totalSoles.toFixed(2)}
        </div>
        <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px', fontWeight: 700 }}>
          {metrics.countYape} Yape · {metrics.countPlin} Plin · {metrics.countBcp} BCP
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 16px',
          borderLeft: '4px solid #3b82f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
          Total Cobrado (Dólares)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e40af', marginTop: '4px' }}>
          $ {metrics.totalDolares.toFixed(2)} USD
        </div>
        <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px', fontWeight: 700 }}>
          Transferencias y pagos internacionales
        </div>
      </div>

      <div
        onClick={() => {
          setSubtab('validados');
          setMethodFilter('ALL');
        }}
        style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '14px 16px',
          cursor: 'pointer',
          borderLeft: '4px solid #22c55e'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
          Vouchers Validados
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534', marginTop: '4px' }}>
          {metrics.countValidados}
        </div>
        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Conciliados con éxito</div>
      </div>

      <div
        onClick={() => {
          setSubtab('pendientes');
          setMethodFilter('ALL');
        }}
        style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderRadius: '12px',
          padding: '14px 16px',
          cursor: 'pointer',
          borderLeft: '4px solid #f59e0b'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
          Por Validar
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#92400e', marginTop: '4px' }}>
          {metrics.countPendientes}
        </div>
        <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>Pendientes de cotejo</div>
      </div>
    </div>
  );
};
