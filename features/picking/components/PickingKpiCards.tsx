'use client';

import React from 'react';
import { ClipboardList, Clock, Layers, Truck } from 'lucide-react';
import { StatusFilter } from '../types';

interface PickingKpiCardsProps {
  totalOrders: number;
  activeOrders: number;
  totalPendingPackages: number;
  completedOrders: number;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
}

export const PickingKpiCards: React.FC<PickingKpiCardsProps> = ({
  totalOrders,
  activeOrders,
  totalPendingPackages,
  completedOrders,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
      <div
        onClick={() => setStatusFilter('ALL')}
        style={{
          background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff',
          border: statusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ClipboardList className="w-4 h-4 text-blue-600" /> Órdenes Totales
        </div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e3a8a', marginTop: '4px' }}>
          {totalOrders} <span style={{ fontSize: '12px', fontWeight: 700 }}>listas</span>
        </div>
      </div>

      <div
        onClick={() => setStatusFilter('PENDING')}
        style={{
          background: statusFilter === 'PENDING' ? '#fef3c7' : '#ffffff',
          border: statusFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock className="w-4 h-4 text-amber-600" /> En Recolección (Activas)
        </div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#92400e', marginTop: '4px' }}>
          {activeOrders} <span style={{ fontSize: '12px', fontWeight: 700 }}>órdenes</span>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers className="w-4 h-4 text-red-600" /> Paquetes por Buscar
        </div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#991b1b', marginTop: '4px' }}>
          {totalPendingPackages} <span style={{ fontSize: '12px', fontWeight: 700 }}>en estantes</span>
        </div>
      </div>

      <div
        onClick={() => setStatusFilter('COMPLETED')}
        style={{
          background: statusFilter === 'COMPLETED' ? '#dcfce7' : '#ffffff',
          border: statusFilter === 'COMPLETED' ? '2px solid #16a34a' : '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 14px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Truck className="w-4 h-4 text-green-600" /> Despachadas a Agencias
        </div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#166534', marginTop: '4px' }}>
          {completedOrders} <span style={{ fontSize: '12px', fontWeight: 700 }}>completadas</span>
        </div>
      </div>
    </div>
  );
};
