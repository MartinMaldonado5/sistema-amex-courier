'use client';

import React from 'react';
import { Boxes, Warehouse, MapPin, Truck } from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryStatsCardsProps {
  paquetes: Paquete[];
}

export default function InventoryStatsCards({ paquetes }: InventoryStatsCardsProps) {
  const totalExistencias = paquetes.length;
  const totalPesoKg = paquetes.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0);
  const totalValorUsd = paquetes.reduce((acc, p) => acc + (Number(p.valorDeclaradoUsd) || 0), 0);

  const countMiami = paquetes.filter(p => p.ubicacionActual === 'TibCourierMiami').length;
  const countTingo = paquetes.filter(
    p => p.ubicacionActual === 'TibTingoMaria' || p.ubicacionActual === 'TibCourierTingoMaria'
  ).length;
  const countLince = paquetes.filter(p => p.ubicacionActual === 'AmexLince').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
      {/* Total Existencias */}
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
            Total Existencias
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

      {/* Peso Total */}
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
            Peso Total en Custodia
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

      {/* Valor Declarado */}
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
            Valor Declarado Total
          </span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>$</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>
          ${totalValorUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
          Asegurado bajo póliza aduanera
        </div>
      </div>

      {/* Sede Central Lince */}
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
            Sede Lince (Lima)
          </span>
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e3a8a' }}>
          {countLince} <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>paquetes</span>
        </div>
        <div style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '4px', fontWeight: 600 }}>
          Almacén Central Activo
        </div>
      </div>

      {/* Miami Hub */}
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
            Hub Miami (USA)
          </span>
          <Truck className="w-5 h-5 text-amber-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {countMiami} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>paquetes</span>
        </div>
        <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 600 }}>
          Por embarcar / En tránsito
        </div>
      </div>

      {/* Tingo María */}
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
            Tingo María
          </span>
          <MapPin className="w-5 h-5 text-emerald-600" />
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          {countTingo} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>paquetes</span>
        </div>
        <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
          Almacén Selva Central
        </div>
      </div>
    </div>
  );
}
