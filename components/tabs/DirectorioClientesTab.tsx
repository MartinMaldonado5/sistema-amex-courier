'use client';

import React, { useMemo } from 'react';
import {
  Users,
  Wallet,
  ArrowRight
} from 'lucide-react';
import {
  useCobrosOperaciones,
  DirectorioClientesView
} from '@/features/cobros';
import { Paquete, Cliente } from '@/types';

interface DirectorioClientesTabProps {
  paquetes?: Paquete[];
  clientes?: Cliente[];
  initialClientName?: string;
  onNavigateToCobros?: (clienteNombre?: string) => void;
}

export default function DirectorioClientesTab({
  paquetes = [],
  clientes = [],
  initialClientName,
  onNavigateToCobros
}: DirectorioClientesTabProps) {
  const {
    lotes,
    cotizacionKambista,
    getResumenCliente360,
    guardarTarifaCliente,
    statsActivas
  } = useCobrosOperaciones();

  // Nombres únicos de clientes
  const allClientNames = useMemo(() => {
    const set = new Set<string>();
    lotes.forEach((l) => {
      if (l.clienteNombre) set.add(l.clienteNombre);
    });
    // Añadir también de la base de clientes de Supabase si existen
    clientes.forEach((c) => {
      if (c.nombre) set.add(c.nombre);
    });
    return Array.from(set);
  }, [lotes, clientes]);

  return (
    <div
      style={{
        padding: '16px 20px',
        maxWidth: '100%',
        width: '100%',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. BREADCRUMB */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11.5px',
          color: '#64748b',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        <span>Módulos del Sistema</span> / <span style={{ color: '#2563eb', fontWeight: 800 }}>5. Directorio de Clientes</span>
      </div>

      {/* 2. HEADER MODERNO CON INTERCONEXIÓN DIRECTA A COBROS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '21px',
                fontWeight: 900,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: 0
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  padding: '7px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderRadius: '12px',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe'
                }}
              >
                <Users style={{ width: '22px', height: '22px' }} />
              </span>
              Directorio de Clientes
            </h1>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
              Expedientes consolidados, cuentas corporativas y particulares con historial completo de paquetes WR y deudas
            </p>
          </div>

          {/* BOTÓN DE INTERCONEXIÓN RÁPIDA CON MÓDULO DE COBROS */}
          {onNavigateToCobros && (
            <button
              type="button"
              onClick={() => onNavigateToCobros()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                transition: 'all 0.15s ease'
              }}
              className="hover:opacity-90"
            >
              <Wallet style={{ width: '16px', height: '16px' }} />
              <span>Ir a Módulo de Cobros</span>
              {statsActivas.pendienteUsd > 0 && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                >
                  Falta: ${statsActivas.pendienteUsd.toFixed(2)}
                </span>
              )}
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      {/* 3. VISTA COMPLETA DEL DIRECTORIO */}
      <DirectorioClientesView
        getResumenCliente360={getResumenCliente360}
        allClientNames={allClientNames}
        cotizacionKambista={cotizacionKambista}
        onNavigateToCobros={onNavigateToCobros}
        guardarTarifaCliente={guardarTarifaCliente}
        initialClientName={initialClientName}
      />
    </div>
  );
}
