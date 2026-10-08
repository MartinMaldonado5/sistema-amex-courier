'use client';

import React, { useMemo } from 'react';
import { Boxes, Warehouse } from 'lucide-react';
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
  // EXISTENCIAS REALES FÍSICAS EN ALMACÉN (excluye entregados)
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        justifyContent: 'center'
      }}
    >
      {/* 1. Existencias Lince (arriba) */}
      <div
        onClick={() => setStatusAmexFilter && setStatusAmexFilter(statusAmexFilter === 'ACTIVAS' ? 'ALL' : 'ACTIVAS')}
        style={{
          background: statusAmexFilter === 'ACTIVAS' ? '#eff6ff' : '#ffffff',
          border: statusAmexFilter === 'ACTIVAS' ? '1px solid #2563eb' : '1px solid #cbd5e1',
          borderRadius: '7px',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          cursor: setStatusAmexFilter ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          whiteSpace: 'nowrap'
        }}
        title="Clic para filtrar existencias activas en almacén Lince"
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Boxes className="w-3 h-3" />
        </div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
          Existencias:
        </span>
        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
          {totalExistenciasReales}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#16a34a' }}>
          ● Activas
        </span>
      </div>

      {/* 2. Peso en Custodia (abajo) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '7px',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          whiteSpace: 'nowrap'
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            background: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Warehouse className="w-3 h-3" />
        </div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
          Custodia:
        </span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
          {totalPesoRealKg.toFixed(1)} <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>kg</span>
        </span>
        <span style={{ fontSize: '9.5px', color: '#64748b' }}>
          ({pesoPromedioActivo.toFixed(2)} kg/prom)
        </span>
      </div>
    </div>
  );
}
