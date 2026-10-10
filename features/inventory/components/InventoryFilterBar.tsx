'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw, Calendar } from 'lucide-react';
import { EstanteriaPosicion } from '@/types';
import { DateFilterState } from '../types';
import { MONTH_NAMES, getDateFilterSummary, toLocalDateString } from '../utils/dateFilter';

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
    recibido?: number;
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
  dateFilter?: DateFilterState;
  setDateFilter?: React.Dispatch<React.SetStateAction<DateFilterState>>;
  resetDateFilter?: () => void;
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
  dateFilter,
  setDateFilter,
  resetDateFilter,
  totalPaquetesCount
}: InventoryFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isDateFilterActive = Boolean(dateFilter && dateFilter.type !== 'ALL');
  const currentYear = new Date().getFullYear();
  const yearsList = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  // Conteo de filtros secundarios activos
  const activeSecondaryCount = [
    locationFilter !== 'ALL',
    floorFilter !== 'ALL',
    packageTypeFilter !== 'ALL',
    statusFilter !== 'ALL',
    isDateFilterActive
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
    if (resetDateFilter) resetDateFilter();
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
            placeholder="Buscar por Guía WR#, Tracking o Consignatario..."
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

        {/* Filtro Rápido: Ubicación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>Ubicación:</span>
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
            <option value="ALL">Todas las Ubicaciones</option>
            {Object.keys(shelfGroups).map(shelfKey => {
              const label =
                shelfKey === 'OFI'
                  ? 'Oficina (OFI)'
                  : shelfKey === 'DSP-Z1'
                  ? 'Despacho Zona 1 (DSP-Z1)'
                  : shelfKey === 'DSP-Z2'
                  ? 'Despacho Zona 2 (DSP-Z2)'
                  : shelfKey.startsWith('DSP')
                  ? `Despacho (${shelfKey})`
                  : shelfKey.startsWith('A') || shelfKey.startsWith('E')
                  ? `Anaquel ${shelfKey}`
                  : `Ubicación ${shelfKey}`;

              return (
                <option key={shelfKey} value={shelfKey}>
                  {label}
                </option>
              );
            })}
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
              <option value="en_almacen">📦 En Almacén ({amexStatusCounts?.en_almacen ?? 0})</option>
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

        {/* Badge visible cuando el drawer está colapsado pero hay filtro de fecha activo */}
        {!showAdvanced && isDateFilterActive && dateFilter && (
          <span
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              padding: '5px 9px',
              borderRadius: '7px',
              fontWeight: 700,
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{getDateFilterSummary(dateFilter)}</span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                resetDateFilter?.();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                padding: '0 2px',
                fontSize: '12px',
                fontWeight: 800,
                lineHeight: 1
              }}
              title="Quitar filtro de fecha"
            >
              ✕
            </button>
          </span>
        )}

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
            flexDirection: 'column',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed #e2e8f0',
            fontSize: '11.5px'
          }}
        >
          {/* FILA 1: FILTRO PROFESIONAL DE FECHAS (Día, Mes, Año, Rango) */}
          {dateFilter && setDateFilter && (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: isDateFilterActive ? '#f0f7ff' : '#f8fafc',
                padding: '7px 11px',
                borderRadius: '8px',
                border: isDateFilterActive ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Etiqueta e Icono */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span style={{ fontWeight: 800, color: '#1e293b' }}>Fecha de Ingreso:</span>
              </div>

              {/* Selector de Modo / Preset */}
              <select
                value={dateFilter.type}
                onChange={e => {
                  const newType = e.target.value as any;
                  setDateFilter(prev => ({
                    ...prev,
                    type: newType,
                    exactDate:
                      newType === 'EXACT_DAY' && !prev.exactDate
                        ? toLocalDateString(new Date())
                        : prev.exactDate,
                    startDate:
                      newType === 'CUSTOM_RANGE' && !prev.startDate
                        ? toLocalDateString(new Date(Date.now() - 7 * 86400000))
                        : prev.startDate,
                    endDate:
                      newType === 'CUSTOM_RANGE' && !prev.endDate
                        ? toLocalDateString(new Date())
                        : prev.endDate
                  }));
                }}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  border: isDateFilterActive ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: isDateFilterActive ? '#1d4ed8' : '#1e293b',
                  fontWeight: isDateFilterActive ? 700 : 600,
                  fontSize: '11.5px',
                  outline: 'none'
                }}
              >
                <option value="ALL">Todas las fechas (Sin filtro)</option>
                <optgroup label="Atajos Rápidos">
                  <option value="TODAY">📅 Hoy</option>
                  <option value="YESTERDAY">📅 Ayer</option>
                  <option value="LAST_7_DAYS">📅 Últimos 7 días</option>
                  <option value="THIS_MONTH">📅 Este Mes</option>
                  <option value="LAST_MONTH">📅 Mes Pasado</option>
                  <option value="THIS_YEAR">📅 Este Año</option>
                </optgroup>
                <optgroup label="Filtrar por Período Exacto">
                  <option value="EXACT_DAY">🎯 Por Día Específico</option>
                  <option value="MONTH_YEAR">🗓️ Por Mes y Año</option>
                  <option value="YEAR">📆 Por Año Específico</option>
                  <option value="CUSTOM_RANGE">⏱️ Rango de Fechas (Desde - Hasta)</option>
                </optgroup>
              </select>

              {/* Controles Dinámicos según Modo */}
              {dateFilter.type === 'EXACT_DAY' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Día:</span>
                  <input
                    type="date"
                    value={dateFilter.exactDate || ''}
                    onChange={e => setDateFilter(prev => ({ ...prev, exactDate: e.target.value }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  />
                </div>
              )}

              {dateFilter.type === 'MONTH_YEAR' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Mes:</span>
                  <select
                    value={dateFilter.month || new Date().getMonth() + 1}
                    onChange={e => setDateFilter(prev => ({ ...prev, month: Number(e.target.value) }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <span style={{ fontWeight: 600, color: '#64748b' }}>Año:</span>
                  <select
                    value={dateFilter.year || new Date().getFullYear()}
                    onChange={e => setDateFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilter.type === 'YEAR' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Año:</span>
                  <select
                    value={dateFilter.year || new Date().getFullYear()}
                    onChange={e => setDateFilter(prev => ({ ...prev, year: Number(e.target.value) }))}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {dateFilter.type === 'CUSTOM_RANGE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Desde:</span>
                    <input
                      type="date"
                      value={dateFilter.startDate || ''}
                      onChange={e => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Hasta:</span>
                    <input
                      type="date"
                      value={dateFilter.endDate || ''}
                      onChange={e => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '11.5px',
                        background: '#ffffff',
                        color: '#0f172a',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Badge descriptivo y botón de borrado rápido si hay filtro de fecha activo */}
              {isDateFilterActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  <span
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Calendar className="w-3 h-3 text-blue-600" />
                    {getDateFilterSummary(dateFilter)}
                  </span>
                  <button
                    type="button"
                    onClick={() => resetDateFilter?.()}
                    title="Quitar filtro de fecha"
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      color: '#b91c1c',
                      borderRadius: '5px',
                      padding: '2px 6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FILA 2: FILTROS DE UBICACIÓN, PISO, EMPAQUE Y ESTADO TIB */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
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
        </div>
      )}
    </div>
  );
}

