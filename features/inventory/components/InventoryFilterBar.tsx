'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { EstanteriaPosicion } from '@/types';

export interface InventoryFilterBarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  shelfFilter: string;
  setShelfFilter: (s: string) => void;
  shelfGroups: { [key: string]: EstanteriaPosicion[] };
  floorFilter: string;
  setFloorFilter: (s: string) => void;
  statusAmexFilter?: string;
  setStatusAmexFilter?: (s: string) => void;
  amexStatusCounts?: {
    total: number;
    activas?: number;
    recibido: number;
    en_almacen: number;
    listo_recojo: number;
    en_ruta: number;
    entregado: number;
  };
  locationFilter: string;
  setLocationFilter: (s: string) => void;
  packageTypeFilter: string;
  setPackageTypeFilter: (s: string) => void;
  statusFilter?: string;
  setStatusFilter?: (s: string) => void;
  totalPaquetesCount: number;
}

export default function InventoryFilterBar({
  searchTerm,
  setSearchTerm,
  shelfFilter,
  setShelfFilter,
  shelfGroups,
  floorFilter,
  setFloorFilter,
  statusAmexFilter = 'ALL',
  setStatusAmexFilter,
  amexStatusCounts,
  locationFilter,
  setLocationFilter,
  packageTypeFilter,
  setPackageTypeFilter,
  statusFilter = 'ALL',
  setStatusFilter,
  totalPaquetesCount
}: InventoryFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Conteo de filtros secundarios activos
  const activeSecondaryCount = [
    locationFilter !== 'ALL',
    floorFilter !== 'ALL',
    packageTypeFilter !== 'ALL',
    statusFilter !== 'ALL'
  ].filter(Boolean).length;

  const hasAnyFilterActive =
    Boolean(searchTerm) ||
    shelfFilter !== 'ALL' ||
    (statusAmexFilter && statusAmexFilter !== 'ALL') ||
    activeSecondaryCount > 0;

  const handleResetFilters = () => {
    setSearchTerm('');
    setShelfFilter('ALL');
    setFloorFilter('ALL');
    setLocationFilter('ALL');
    setPackageTypeFilter('ALL');
    if (setStatusAmexFilter) setStatusAmexFilter('ALL');
    if (setStatusFilter) setStatusFilter('ALL');
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      {/* Fila Principal de Búsqueda y Filtros Rápidos */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Input de Búsqueda */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '11px',
              top: '9px',
              width: '15px',
              height: '15px',
              color: '#94a3b8'
            }}
          />
          <input
            type="text"
            placeholder="Buscar por Guía WR#, Tracking, Consignatario o Posición..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 32px 7px 34px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              background: '#f8fafc',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '7px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px'
              }}
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtro Rápido: Anaquel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>Anaquel:</span>
          <select
            value={shelfFilter}
            onChange={e => {
              setShelfFilter(e.target.value);
              setFloorFilter('ALL');
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600,
              color: '#1e293b'
            }}
          >
            <option value="ALL">Todos los Anaqueles</option>
            {Object.keys(shelfGroups).map(shelfKey => (
              <option key={shelfKey} value={shelfKey}>
                Anaquel {shelfKey}
              </option>
            ))}
            <option value="REC">Recepción / Sin Estante</option>
          </select>
        </div>

        {/* Filtro Rápido: Estado AMEX */}
        {setStatusAmexFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1' }}>Estado AMEX:</span>
            <select
              value={statusAmexFilter}
              onChange={e => setStatusAmexFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: '1px solid #93c5fd',
                fontSize: '12px',
                background: '#f0f9ff',
                fontWeight: 700,
                color: '#0369a1'
              }}
            >
              <option value="ALL">Todos los Estados ({amexStatusCounts?.total ?? totalPaquetesCount})</option>
              <option value="ACTIVAS">📦 Solo Existencias Activas ({amexStatusCounts?.activas ?? 0})</option>
              <option value="en_almacen">📦 En Almacén ({amexStatusCounts?.en_almacen ?? 0})</option>
              <option value="recibido">📥 Recibido ({amexStatusCounts?.recibido ?? 0})</option>
              <option value="listo_recojo">🏪 Listo Recojo ({amexStatusCounts?.listo_recojo ?? 0})</option>
              <option value="en_ruta">🚚 En Ruta ({amexStatusCounts?.en_ruta ?? 0})</option>
              <option value="entregado">✅ Entregado ({amexStatusCounts?.entregado ?? 0})</option>
            </select>
          </div>
        )}

        {/* Botón Filtros Avanzados */}
        <button
          type="button"
          onClick={() => setShowAdvanced(prev => !prev)}
          className="btn"
          style={{
            background: showAdvanced || activeSecondaryCount > 0 ? '#eff6ff' : '#ffffff',
            border: showAdvanced || activeSecondaryCount > 0 ? '1px solid #93c5fd' : '1px solid #cbd5e1',
            color: showAdvanced || activeSecondaryCount > 0 ? '#1d4ed8' : '#475569',
            fontSize: '11.5px',
            fontWeight: 700,
            padding: '6px 10px',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtros</span>
          {activeSecondaryCount > 0 && (
            <span
              style={{
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '0 5px',
                borderRadius: '999px'
              }}
            >
              {activeSecondaryCount}
            </span>
          )}
        </button>

        {/* Botón Limpiar Filtros */}
        {hasAnyFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
            title="Restablecer todos los filtros y búsqueda"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Drawer Colapsable de Filtros Secundarios */}
      {showAdvanced && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '11.5px'
          }}
        >
          {/* Sede */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Sede:</span>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                background: '#ffffff'
              }}
            >
              <option value="ALL">Todas las Sedes</option>
              <option value="AmexLince">Almacén Central Lince</option>
              <option value="Entregado">Entregados / Salidas</option>
            </select>
          </div>

          {/* Piso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Piso:</span>
            <select
              value={floorFilter}
              onChange={e => setFloorFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                background: '#ffffff'
              }}
            >
              <option value="ALL">Todos los Pisos</option>
              <option value="P1">P1 (Piso 1 · Inferior)</option>
              <option value="P2">P2 (Piso 2 · Medio)</option>
              <option value="P3">P3 (Piso 3 · Medio Alto)</option>
              <option value="P4">P4 (Piso 4 · Superior)</option>
            </select>
          </div>

          {/* Empaque */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Empaque:</span>
            <select
              value={packageTypeFilter}
              onChange={e => setPackageTypeFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '11.5px',
                background: '#ffffff'
              }}
            >
              <option value="ALL">Todos los Empaques</option>
              <option value="CAJA">CAJA</option>
              <option value="SOBRE">SOBRE</option>
              <option value="SACA">SACA</option>
            </select>
          </div>

          {/* Estado TIB */}
          {setStatusFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontWeight: 700, color: '#64748b' }}>Estado TIB:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11.5px',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">Todos los Estados TIB</option>
                <option value="Enviado">Enviado</option>
                <option value="Recibido">Recibido</option>
                <option value="EnAlmacen">En Almacén</option>
                <option value="ListoParaRecojo">Listo Recojo</option>
                <option value="EnRutaCarroAmex">En Ruta Carro</option>
                <option value="EnRutaMotorizado">En Ruta Moto</option>
                <option value="EnRutaProvincia">En Ruta Provincia</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
