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

  // 3. Slotting en estantería o zona de almacén sobre paquetes físicamente presentes
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      {/* Total Existencias Lince (Solo los que NO están entregados) */}
      <div
        onClick={() => setStatusAmexFilter && setStatusAmexFilter('ACTIVAS')}
        style={{
          background: '#ffffff',
          border: statusAmexFilter === 'ACTIVAS' ? '2px solid #2563eb' : '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: setStatusAmexFilter ? 'pointer' : 'default',
          transition: 'all 0.15s ease'
        }}
        title="Existencias físicas reales en almacén (excluye entregados)"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Total Existencias Lince
          </span>
          <Boxes className="w-5 h-5 text-blue-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {totalExistenciasReales} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>paquetes</span>
        </div>
        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: 700 }}>
          ● Sincronizado en Vivo (Supabase)
        </div>
      </div>

      {/* Peso Total en Custodia (Solo bultos reales en bodega) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            Peso en Custodia (Lince)
          </span>
          <Warehouse className="w-5 h-5 text-indigo-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {totalPesoRealKg.toFixed(1)} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>kg</span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          Promedio: {pesoPromedioActivo.toFixed(2)} kg / paquete
        </div>
      </div>

      {/* En Anaqueles (Slotting WMS sobre existencias reales) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
            En Anaqueles (Slotting)
          </span>
          <Layers className="w-5 h-5 text-emerald-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {paquetesEnEstante} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ubicados</span>
        </div>
        <div style={{ fontSize: '11px', color: paquetesSinUbicar > 0 ? '#d97706' : '#22c55e', marginTop: '4px', fontWeight: 700 }}>
          {paquetesSinUbicar > 0 ? `${paquetesSinUbicar} pendientes de slotting` : '✓ 100% en ubicación asignada'}
        </div>
      </div>

      {/* Salidas y Entregados (Historial fuera de almacén) */}
      <div
        onClick={() => setStatusAmexFilter && setStatusAmexFilter('entregado')}
        style={{
          background: statusAmexFilter === 'entregado' ? '#f0fdf4' : '#eff6ff',
          border: statusAmexFilter === 'entregado' ? '2px solid #16a34a' : '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          cursor: setStatusAmexFilter ? 'pointer' : 'default',
          transition: 'all 0.15s ease'
        }}
        title="Paquetes entregados fuera de almacén"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
            Salidas y Entregados
          </span>
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a' }}>
          {totalEntregados} <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>entregados</span>
        </div>
        <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '4px', fontWeight: 600 }}>
          Fuera de Almacén ({paquetes.length} registros totales)
        </div>
      </div>
    </div>
  );
}
