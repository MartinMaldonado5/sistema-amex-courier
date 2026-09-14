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
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexShrink: 0
      }}
    >
      {/* Lado Izquierdo: Marca & Título Ejecutivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            flexShrink: 0
          }}
        >
          <Activity style={{ width: '22px', height: '22px' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Centro de Control & Panel Gerencial
            </h1>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 900,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                  boxShadow: '0 0 6px #10b981'
                }}
              />
              Supabase Realtime Activo
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
            Visión 360° del negocio: finanzas, tareas del día, almacenamiento WMS y logística de envíos
          </p>
        </div>
      </div>

      {/* Lado Derecho: Filtros Temporales & Acciones Rápidas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Selector de Rango de Fechas */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '10px',
            padding: '3px',
            border: '1px solid #e2e8f0'
          }}
        >
          <button
            type="button"
            onClick={() => onChangeTimeFilter('ALL')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: timeFilter === 'ALL' ? '#ffffff' : 'transparent',
              color: timeFilter === 'ALL' ? '#0f172a' : '#64748b',
              boxShadow: timeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Histórico
          </button>
          <button
            type="button"
            onClick={() => onChangeTimeFilter('TODAY')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: timeFilter === 'TODAY' ? '#ffffff' : 'transparent',
              color: timeFilter === 'TODAY' ? '#0f172a' : '#64748b',
              boxShadow: timeFilter === 'TODAY' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => onChangeTimeFilter('WEEK')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: timeFilter === 'WEEK' ? '#ffffff' : 'transparent',
              color: timeFilter === 'WEEK' ? '#0f172a' : '#64748b',
              boxShadow: timeFilter === 'WEEK' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            7 Días
          </button>
          <button
            type="button"
            onClick={() => onChangeTimeFilter('MONTH')}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              background: timeFilter === 'MONTH' ? '#ffffff' : 'transparent',
              color: timeFilter === 'MONTH' ? '#0f172a' : '#64748b',
              boxShadow: timeFilter === 'MONTH' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Este Mes
          </button>
        </div>

        {/* Acciones Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onNewPackage}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus style={{ width: '15px', height: '15px', strokeWidth: 3 }} />
            <span>Registrar WR</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('live-sheets')}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(5,150,105,0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Abrir libro de manifiestos y cotejo en vivo"
          >
            <Zap style={{ width: '15px', height: '15px', color: '#fde047', fill: 'currentColor' }} />
            <span>Amex Excel</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('fico-cobros')}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Ir a gestión de cobros y conciliación de vouchers"
          >
            <Receipt style={{ width: '15px', height: '15px', color: '#059669' }} />
            <span>Cobros</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            title="Refrescar métricas del negocio"
          >
            <RefreshCw
              className={isRefreshing ? 'animate-spin' : ''}
              style={{ width: '16px', height: '16px', color: '#2563eb' }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
