'use client';

import React from 'react';
import {
  Activity,
  Plus,
  Zap,
  Receipt,
  Car,
  RefreshCw,
  Clock,
  Calendar
} from 'lucide-react';
import { TimeFilter } from '../types';

interface DashboardHeaderProps {
  timeFilter: TimeFilter;
  onChangeTimeFilter: (filter: TimeFilter) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewPackage: () => void;
  onNavigateTab: (tabId: string) => void;
}

export function DashboardHeader({
  timeFilter,
  onChangeTimeFilter,
  isRefreshing,
  onRefresh,
  onNewPackage,
  onNavigateTab
}: DashboardHeaderProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        flexShrink: 0
      }}
    >
      {/* Lado Izquierdo: Identidad Operativa & Estado del Turno */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}
        >
          <Activity style={{ width: '20px', height: '20px' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
              Panel de Control Operativo
            </h1>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block'
                }}
              />
              Tiempo Real · Almacén Lince
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            Monitoreo centralizado de carga activa, almacenamiento WMS y flujos de liquidación
          </p>
        </div>
      </div>

      {/* Lado Derecho: Filtros Temporales & Acciones Rápidas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Selector de Rango de Fechas (Segmented Control) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid #e2e8f0',
            gap: '2px'
          }}
        >
          {(
            [
              { key: 'ALL', label: 'Histórico' },
              { key: 'TODAY', label: 'Hoy' },
              { key: 'WEEK', label: '7 Días' },
              { key: 'MONTH', label: 'Este Mes' }
            ] as const
          ).map(tab => {
            const isActive = timeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeTimeFilter(tab.key)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                  cursor: 'pointer',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.12s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Acciones Rápidas con 1 Color de Acento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Botón Primario: ÚNICO poseedor del Acento (#2563eb) */}
          <button
            type="button"
            onClick={onNewPackage}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
              transition: 'background 0.12s ease'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Registrar WR</span>
          </button>

          {/* Botones Secundarios: Grises Neutros */}
          <button
            type="button"
            onClick={() => onNavigateTab('live-sheets')}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.12s ease'
            }}
            title="Abrir libro de manifiestos y cotejo en vivo"
          >
            <Zap style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <span>Amex Excel</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('fico-cobros')}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.12s ease'
            }}
            title="Ir a gestión de cobros y conciliación de vouchers"
          >
            <Receipt style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <span>Cobros</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s ease'
            }}
            title="Refrescar métricas de operación"
          >
            <RefreshCw
              className={isRefreshing ? 'animate-spin' : ''}
              style={{ width: '16px', height: '16px' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
