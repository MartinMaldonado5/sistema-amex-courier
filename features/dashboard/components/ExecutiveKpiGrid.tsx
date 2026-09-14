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
        padding: '14px 18px 6px 18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px',
        flexShrink: 0
      }}
    >
      {/* KPI 1: FINANZAS & RECAUDACIÓN */}
      <div
        onClick={() => onNavigateTab('fico-cobros')}
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="hover:border-emerald-400 hover:shadow-md"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #059669 0%, #10b981 100%)'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#047857' }}>
            Recaudación & Cobros
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DollarSign style={{ width: '18px', height: '18px', strokeWidth: 2.5 }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#064e3b', fontFamily: 'monospace' }}>
              S/ {kpis.totalCobradoSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {kpis.totalCobradoDolares > 0 && (
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                + ${kpis.totalCobradoDolares.toFixed(2)}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 700
            }}
          >
            <span style={{ color: '#64748b' }}>
              Pendiente: <strong style={{ color: kpis.totalPendienteSoles > 0 ? '#b45309' : '#059669' }}>S/ {kpis.totalPendienteSoles.toFixed(2)}</strong>
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 900,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0'
              }}
            >
              {kpis.tasaCobranzaPorcentaje}% Cobrado
            </span>
          </div>
        </div>
      </div>

      {/* KPI 2: VOLUMEN DE CARGA & WRs */}
      <div
        onClick={() => onNavigateTab('shp-entregas')}
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="hover:border-blue-400 hover:shadow-md"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#1e40af' }}>
            Volumen Total de WRs
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Package style={{ width: '18px', height: '18px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
              {kpis.totalPaquetes}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              paquetes en sistema
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#64748b',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ color: '#2563eb' }}>{kpis.paquetesEnLince} en Lince</span>
            <span>•</span>
            <span style={{ color: '#7c3aed' }}>{kpis.paquetesEnRuta} en Ruta</span>
            <span>•</span>
            <span style={{ color: '#0284c7' }}>{kpis.paquetesEnMiami} en Miami</span>
          </div>
        </div>
      </div>

      {/* KPI 3: ALMACÉN CENTRAL LINCE */}
      <div
        onClick={() => onNavigateTab('mm-lince')}
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="hover:border-purple-400 hover:shadow-md"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #7c3aed 0%, #9333ea 100%)'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6b21a8' }}>
            Almacén Lince (WMS)
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#faf5ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Boxes style={{ width: '18px', height: '18px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#581c87', fontFamily: 'monospace' }}>
              {kpis.totalPesoKgLince.toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 800 }}>kg</span>
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              en custodia
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 700
            }}
          >
            <span style={{ color: '#64748b' }}>
              Promedio: {kpis.pesoPromedioKg} kg/bulto
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 900,
                background: kpis.paquetesSinUbicar > 0 ? '#fef3c7' : '#f1f5f9',
                color: kpis.paquetesSinUbicar > 0 ? '#b45309' : '#475569',
                border: kpis.paquetesSinUbicar > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0'
              }}
            >
              {kpis.paquetesSinUbicar} sin anaquel
            </span>
          </div>
        </div>
      </div>

      {/* KPI 4: EFICIENCIA & CLIENTES */}
      <div
        onClick={() => onNavigateTab('directorio-clientes')}
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="hover:border-amber-400 hover:shadow-md"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: 'linear-gradient(180deg, #d97706 0%, #f59e0b 100%)'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#b45309' }}>
            Cartera de Clientes
          </span>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users style={{ width: '18px', height: '18px' }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#78350f', fontFamily: 'monospace' }}>
              {kpis.totalClientes}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              clientes registrados
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '11.5px',
              fontWeight: 700
            }}
          >
            <span style={{ color: '#b45309' }}>
              {kpis.clientesConPaquetesActivos} casilleros activos
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 900,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <CheckCircle2 style={{ width: '12px', height: '12px' }} />
              {kpis.tasaEntregaPorcentaje}% Despachado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
