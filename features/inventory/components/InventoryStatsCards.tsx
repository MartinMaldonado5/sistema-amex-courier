'use client';

import React, { useMemo } from 'react';
import { Boxes, Warehouse, Layers, CheckCircle2 } from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryStatsCardsProps {
  paquetes: Paquete[];
  statusAmexFilter?: string;
  setStatusAmexFilter?: (status: string) => void;
}

export default function InventoryStatsCards({
  paquetes,
  statusAmexFilter,
  setStatusAmexFilter
}: InventoryStatsCardsProps) {
  // 1. Paquetes entregados (salidas definitivas del almacén)
  const paquetesEntregados = useMemo(
    () => paquetes.filter(p => p.estadoAmex === 'entregado' || p.ubicacionActual === 'Entregado'),
    [paquetes]
  );
  const totalEntregados = paquetesEntregados.length;

  // 2. EXISTENCIAS REALES FÍSICAS EN ALMACÉN (excluye entregados)
  const paquetesActivos = useMemo(
    () => paquetes.filter(p => p.estadoAmex !== 'entregado' && p.ubicacionActual !== 'Entregado'),
    [paquetes]
  );
  const totalExistenciasReales = paquetesActivos.length;
  const totalPesoRealKg = useMemo(
    () => paquetesActivos.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0),
    [paquetesActivos]
  );
  const pesoPromedioActivo = totalExistenciasReales > 0 ? totalPesoRealKg / totalExistenciasReales : 0;

  // 3. Slotting en estantería o zona de almacén sobre existencias activas
  const paquetesEnEstante = useMemo(
    () =>
      paquetesActivos.filter(
        p =>
          p.posicionEstante &&
          p.posicionEstante.trim() !== '' &&
          !p.posicionEstante.startsWith('REC') &&
          p.posicionEstante !== 'SIN_ASIGNAR'
      ).length,
    [paquetesActivos]
  );
  const paquetesSinUbicar = totalExistenciasReales - paquetesEnEstante;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '10px'
      }}
    >
      {/* 1. Existencias Reales Lince */}
      <div
        onClick={() => setStatusAmexFilter && setStatusAmexFilter(statusAmexFilter === 'ACTIVAS' ? 'ALL' : 'ACTIVAS')}
        style={{
          background: statusAmexFilter === 'ACTIVAS' ? '#eff6ff' : '#ffffff',
          border: statusAmexFilter === 'ACTIVAS' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: statusAmexFilter === 'ACTIVAS' ? '0 2px 6px rgba(37,99,235,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
          cursor: setStatusAmexFilter ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.15s ease'
        }}
        title="Clic para filtrar existencias activas en almacén Lince"
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Boxes className="w-5 h-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Existencias Lince
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {totalExistenciasReales}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
              ● Activas
            </span>
          </div>
        </div>
      </div>

      {/* 2. Peso Total en Custodia */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Warehouse className="w-5 h-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Peso en Custodia
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {totalPesoRealKg.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>kg</span>
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
              ({pesoPromedioActivo.toFixed(2)} kg/prom)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Slotting en Estanterías */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#f0fdf4',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Layers className="w-5 h-5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Ubicados (Slotting)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {paquetesEnEstante}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: paquetesSinUbicar > 0 ? '#d97706' : '#16a34a'
              }}
            >
              {paquetesSinUbicar > 0 ? `(${paquetesSinUbicar} pendientes)` : '✓ 100% ubicados'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Salidas y Entregados */}
      <div
        onClick={() => setStatusAmexFilter && setStatusAmexFilter(statusAmexFilter === 'entregado' ? 'ALL' : 'entregado')}
        style={{
          background: statusAmexFilter === 'entregado' ? '#f0fdf4' : '#ffffff',
          border: statusAmexFilter === 'entregado' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: statusAmexFilter === 'entregado' ? '0 2px 6px rgba(22,163,74,0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
          cursor: setStatusAmexFilter ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.15s ease'
        }}
        title="Clic para ver historial de paquetes entregados"
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Salidas / Entregados
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {totalEntregados}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
              Completados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
