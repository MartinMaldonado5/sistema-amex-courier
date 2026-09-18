'use client';

import React from 'react';
import { Boxes, Warehouse, MapPin, Layers } from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryStatsCardsProps {
  paquetes: Paquete[];
}

export default function InventoryStatsCards({ paquetes }: InventoryStatsCardsProps) {
  const totalExistencias = paquetes.length;
  const totalPesoKg = paquetes.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0);

  // Métricas logísticas y de estantería para el personal de Almacén Lince
  const paquetesEnEstante = paquetes.filter(
    p => p.posicionEstante && !p.posicionEstante.startsWith('REC') && p.posicionEstante !== 'SIN_ASIGNAR'
  ).length;
  const paquetesSinUbicar = totalExistencias - paquetesEnEstante;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      {/* Total Existencias Lince */}
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
            Total Existencias Lince
          </span>
          <Boxes className="w-5 h-5 text-blue-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {totalExistencias} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>paquetes</span>
        </div>
        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: 700 }}>
          ● Sincronizado en Vivo (Supabase)
        </div>
      </div>

      {/* Peso Total en Custodia */}
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
          {totalPesoKg.toFixed(1)} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>kg</span>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          Promedio: {(totalExistencias > 0 ? totalPesoKg / totalExistencias : 0).toFixed(2)} kg / paquete
        </div>
      </div>

      {/* En Anaqueles (Slotting WMS) */}
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
          {paquetesSinUbicar > 0 ? `${paquetesSinUbicar} pendientes de slotting` : '✓ 100% en anaquel asignado'}
        </div>
      </div>

      {/* Almacén Central Lince */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
            Sede Central Lince
          </span>
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a' }}>
          {totalExistencias} <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>bultos en sede</span>
        </div>
        <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '4px', fontWeight: 600 }}>
          Almacén Central Único y Activo
        </div>
      </div>
    </div>
  );
}
