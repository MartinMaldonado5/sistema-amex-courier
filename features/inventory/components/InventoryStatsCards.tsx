'use client';

import React, { useMemo } from 'react';
import { Boxes, Scale } from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryStatsCardsProps {
  paquetes: Paquete[];
  statusAmexFilter?: string;
  setStatusAmexFilter?: (status: string) => void;
}

/**
 * Componente de Anillo Circular de Progreso SVG (Circular Progress Ring)
 */
function CircularProgressRing({
  progress, // 0.0 a 1.0
  size = 38,
  strokeWidth = 3.5,
  gradientId,
  startColor,
  endColor,
  children
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  gradientId: string;
  startColor: string;
  endColor: string;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(1, Math.max(0.04, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          display: 'block'
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        {/* Pista base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />

        {/* Anillo de Progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </svg>

      {/* Ícono centrado dentro del aro */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function InventoryStatsCards({
  paquetes
}: InventoryStatsCardsProps) {
  // 1. EXISTENCIAS REALES FÍSICAS EN ALMACÉN (excluye entregados)
  const paquetesActivos = useMemo(
    () => paquetes.filter(p => p.estadoAmex !== 'entregado' && p.ubicacionActual !== 'Entregado'),
    [paquetes]
  );
  const totalExistenciasReales = paquetesActivos.length;

  // 2. PESO EN CUSTODIA (paquetes activos)
  const totalPesoRealKg = useMemo(
    () => paquetesActivos.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0),
    [paquetesActivos]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        gap: '8px',
        alignItems: 'flex-end'
      }}
    >
      {/* 1. WIDGET CIRCULAR SUPERIOR: EXISTENCIAS EN ALMACÉN (Informativo, no accionable) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '7px 14px 7px 10px',
          borderRadius: '11px',
          minWidth: '248px',
          flex: '1 1 auto',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'default',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
        title="Existencias físicas actuales en Almacén Lince"
      >
        {/* Aro circular con ícono */}
        <CircularProgressRing
          progress={1}
          size={40}
          strokeWidth={3.5}
          gradientId="ringExistenciasGradient"
          startColor="#3b82f6"
          endColor="#1d4ed8"
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Boxes className="w-3.5 h-3.5" />
          </div>
        </CircularProgressRing>

        {/* Textos y Métrica */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Existencias
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#0f172a',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {totalExistenciasReales}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>
              bultos en almacén
            </span>
          </div>
        </div>
      </div>

      {/* 2. WIDGET CIRCULAR INFERIOR: CUSTODIA TOTAL / PESO */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '7px 14px 7px 10px',
          borderRadius: '11px',
          minWidth: '248px',
          flex: '1 1 auto',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          cursor: 'default',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
        title="Peso físico actualmente bajo custodia en Almacén Lince"
      >
        {/* Aro circular con ícono */}
        <CircularProgressRing
          progress={1}
          size={40}
          strokeWidth={3.5}
          gradientId="ringCustodiaGradient"
          startColor="#a855f7"
          endColor="#7c3aed"
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#f5f3ff',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Scale className="w-3.5 h-3.5" />
          </div>
        </CircularProgressRing>

        {/* Textos y Métrica */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Custodia Total
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#0f172a',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {totalPesoRealKg.toFixed(1)}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569' }}>
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
