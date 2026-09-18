'use client';

import React from 'react';
import {
  DollarSign,
  Package,
  Boxes,
  Users,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ExecutiveKpis } from '../types';

interface ExecutiveKpiGridProps {
  kpis: ExecutiveKpis;
  onNavigateTab: (tabId: string) => void;
}

export function ExecutiveKpiGrid({ kpis, onNavigateTab }: ExecutiveKpiGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        flexShrink: 0
      }}
    >
      {/* KPI REINA (RATIO 2.5x): VOLUMEN OPERATIVO TOTAL DE WRs */}
      <div
        onClick={() => onNavigateTab('mm-lince')}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'all 0.15s ease'
        }}
        className="hover:border-slate-400 hover:shadow-sm"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
            Volumen Activo de Operación
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Package style={{ width: '16px', height: '16px' }} />
          </div>
        </div>

        <div>
          {/* Métrica Reina: 36px, 700 bold, contraste 2.5x con respecto al texto base de 14px */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {kpis.totalPaquetes}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
              paquetes en sistema
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              fontSize: '12px',
              color: '#64748b',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>{kpis.paquetesEnLince}</strong> en Almacén Lince
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>{kpis.paquetesEnRuta}</strong> en Reparto Ruta
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2: FINANZAS & RECAUDACIÓN */}
      <div
        onClick={() => onNavigateTab('fico-cobros')}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'all 0.15s ease'
        }}
        className="hover:border-slate-400 hover:shadow-sm"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
            Recaudación & Liquidación
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DollarSign style={{ width: '16px', height: '16px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em'
              }}
            >
              S/ {kpis.totalCobradoSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {kpis.totalCobradoDolares > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                + ${kpis.totalCobradoDolares.toFixed(2)}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '12px'
            }}
          >
            <span style={{ color: '#64748b' }}>
              Pendiente: <strong style={{ color: '#0f172a', fontWeight: 600 }}>S/ {kpis.totalPendienteSoles.toFixed(2)}</strong>
            </span>
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
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {kpis.tasaCobranzaPorcentaje}% Cobrado
            </span>
          </div>
        </div>
      </div>

      {/* KPI 3: ALMACÉN CENTRAL LINCE (WMS) */}
      <div
        onClick={() => onNavigateTab('mm-lince')}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'all 0.15s ease'
        }}
        className="hover:border-slate-400 hover:shadow-sm"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
            Almacén Lince (WMS)
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Boxes style={{ width: '16px', height: '16px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em'
              }}
            >
              {kpis.totalPesoKgLince.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>kg</span>
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
              en custodia
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '12px'
            }}
          >
            <span style={{ color: '#64748b' }}>
              Promedio: <strong style={{ color: '#0f172a', fontWeight: 600 }}>{kpis.pesoPromedioKg} kg/bulto</strong>
            </span>
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
                  background: kpis.paquetesSinUbicar > 0 ? '#f59e0b' : '#10b981'
                }}
              />
              {kpis.paquetesSinUbicar} sin anaquel
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4: CLIENTES & EFICIENCIA */}
      <div
        onClick={() => onNavigateTab('directorio-clientes')}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px',
          transition: 'all 0.15s ease'
        }}
        className="hover:border-slate-400 hover:shadow-sm"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
            Cartera de Clientes
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#f1f5f9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users style={{ width: '16px', height: '16px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.01em'
              }}
            >
              {kpis.totalClientes}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
              registrados
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '12px'
            }}
          >
            <span style={{ color: '#64748b' }}>
              <strong style={{ color: '#0f172a', fontWeight: 600 }}>{kpis.clientesConPaquetesActivos}</strong> casilleros activos
            </span>
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
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              {kpis.tasaEntregaPorcentaje}% Despachado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
