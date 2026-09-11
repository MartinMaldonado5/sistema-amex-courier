'use client';

import React from 'react';
import { Layers, Plus, Search, Edit3 } from 'lucide-react';
import { Paquete, EstanteriaPosicion } from '@/types';

export interface ShelfMatrixGridProps {
  shelfGroups: { [key: string]: EstanteriaPosicion[] };
  paquetes: Paquete[];
  shelfSearchTerm: string;
  setShelfSearchTerm: (s: string) => void;
  shelfZoneFilter: string;
  setShelfZoneFilter: (s: string) => void;
  shelfOccupancyFilter: string;
  setShelfOccupancyFilter: (s: string) => void;
  onOpenNewPositionModal: () => void;
  onOpenTransferModal: (pkg: Paquete) => void;
  onFilterShelf: (shelfCode: string, floorLevel?: string) => void;
  onEditPosition: (pos: EstanteriaPosicion) => void;
}

export default function ShelfMatrixGrid({
  shelfGroups,
  paquetes,
  shelfSearchTerm,
  setShelfSearchTerm,
  shelfZoneFilter,
  setShelfZoneFilter,
  shelfOccupancyFilter,
  setShelfOccupancyFilter,
  onOpenNewPositionModal,
  onOpenTransferModal,
  onFilterShelf,
  onEditPosition
}: ShelfMatrixGridProps) {
  const hasActiveFilters = Boolean(shelfSearchTerm) || shelfZoneFilter !== 'ALL' || shelfOccupancyFilter !== 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Botón Crear */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers className="w-5 h-5 text-indigo-600" /> Mapa Visual de Anaqueles & Slotting (Almacén Lince)
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Vista gráfica interactiva de estantes físicos, niveles de piso, capacidad en tiempo real y paquetes almacenados
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={onOpenNewPositionModal}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 800,
              padding: '8px 14px',
              borderRadius: '8px'
            }}
          >
            <Plus className="w-4 h-4" /> + Crear Nuevo Anaquel (Lote)
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda en el Mapa */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '9px',
              width: '15px',
              height: '15px',
              color: '#94a3b8'
            }}
          />
          <input
            type="text"
            placeholder="Buscar por Anaquel (A1, A2...), Piso (P1, P2) o Guía WR..."
            value={shelfSearchTerm}
            onChange={e => setShelfSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Zona:</span>
          <select
            value={shelfZoneFilter}
            onChange={e => setShelfZoneFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600
            }}
          >
            <option value="ALL">Todas las Zonas</option>
            <option value="ALMACENAJE">📦 Almacenaje</option>
            <option value="RECEPCION">📥 Recepción (REC)</option>
            <option value="DESPACHO">🚚 Despacho (DSP)</option>
            <option value="DEVOLUCION">⚠️ Devoluciones</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Ocupación:</span>
          <select
            value={shelfOccupancyFilter}
            onChange={e => setShelfOccupancyFilter(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              fontWeight: 600
            }}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="DISPONIBLE">🟢 Disponible (&lt; 70%)</option>
            <option value="CASI_LLENO">🟡 Casi Lleno (70% - 90%)</option>
            <option value="LLENO">🔴 Lleno (&gt; 90%)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setShelfSearchTerm('');
              setShelfZoneFilter('ALL');
              setShelfOccupancyFilter('ALL');
            }}
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ✕ Limpiar Filtros
          </button>
        )}
      </div>

      {/* Grilla Visual de Estanterías Físicas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {Object.entries(shelfGroups)
          .filter(([shelfCode, positions]) => {
            if (shelfSearchTerm) {
              const term = shelfSearchTerm.toLowerCase();
              const matchesCode = shelfCode.toLowerCase().includes(term);
              const matchesPos = positions.some(p => p.codigoPosicion.toLowerCase().includes(term));
              const matchesPkg = paquetes.some(
                p =>
                  p.posicionEstante &&
                  p.posicionEstante.startsWith(shelfCode) &&
                  p.numeroReciboBodega.toLowerCase().includes(term)
              );
              if (!matchesCode && !matchesPos && !matchesPkg) return false;
            }
            if (shelfZoneFilter !== 'ALL') {
              const hasZone = positions.some(p => p.zonaTipo === shelfZoneFilter);
              if (!hasZone) return false;
            }
            return true;
          })
          .map(([shelfCode, positions]) => {
            const totalInShelf = paquetes.filter(
              p =>
                p.anaquel === shelfCode ||
                (p.posicionEstante && p.posicionEstante.startsWith(shelfCode))
            ).length;

            const totalWeightInShelf = paquetes
              .filter(
                p =>
                  p.anaquel === shelfCode ||
                  (p.posicionEstante && p.posicionEstante.startsWith(shelfCode))
              )
              .reduce((sum, p) => sum + (Number(p.pesoKg) || 0), 0);

            const isSpecialZone = shelfCode === 'REC' || shelfCode === 'DSP';
            const borderColor =
              shelfCode === 'A1'
                ? '#3b82f6'
                : shelfCode === 'A2'
                ? '#10b981'
                : shelfCode === 'A3'
                ? '#8b5cf6'
                : isSpecialZone
                ? '#f59e0b'
                : '#0284c7';

            return (
              <div
                key={shelfCode}
                style={{
                  background: '#ffffff',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Cabecera del Anaquel */}
                <div
                  style={{
                    background: isSpecialZone ? '#fffbeb' : '#f8fafc',
                    padding: '12px 16px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: borderColor,
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '13px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {shelfCode}
                    </span>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                        {isSpecialZone
                          ? shelfCode === 'REC'
                            ? 'Mesa de Recepción & Ingreso'
                            : 'Zona de Despacho & Salida'
                          : `Anaquel ${shelfCode}`}
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {positions.length} niveles configurados • {totalWeightInShelf.toFixed(1)} kg totales
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {totalInShelf} bultos
                    </span>

                    <button
                      title={`Filtrar existencias del Anaquel ${shelfCode}`}
                      onClick={() => onFilterShelf(shelfCode)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#334155'
                      }}
                    >
                      🔍 Filtrar
                    </button>
                  </div>
                </div>

                {/* Niveles / Pisos del Anaquel */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {positions.map(posItem => {
                    const posCode = posItem.codigoPosicion;
                    const pkgsInFloor = paquetes.filter(
                      p =>
                        p.posicionEstante === posCode ||
                        (p.anaquel === shelfCode && p.piso === posItem.nivelPiso)
                    );
                    const maxCap = posItem.capacidadMaxPaquetes || 40;
                    const percent = Math.min(Math.round((pkgsInFloor.length / maxCap) * 100), 100);

                    const floorLabel =
                      posItem.nivelPiso === 'P3'
                        ? 'Piso 3 (Superior)'
                        : posItem.nivelPiso === 'P2'
                        ? 'Piso 2 (Medio)'
                        : posItem.nivelPiso === 'P1'
                        ? 'Piso 1 (Inferior)'
                        : `Nivel ${posItem.nivelPiso}`;

                    const barColor =
                      percent > 85 ? '#ef4444' : percent > 60 ? '#f59e0b' : '#10b981';

                    return (
                      <div
                        key={posItem.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        {/* Cabecera del Piso */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 900,
                                fontSize: '11.5px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe'
                              }}
                            >
                              {posCode}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                              {isSpecialZone ? posItem.descripcion || posCode : floorLabel}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              title="Editar capacidad / peso de este piso"
                              onClick={() => onEditPosition(posItem)}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#475569'
                              }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>

                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: barColor
                              }}
                            >
                              {pkgsInFloor.length} / {maxCap} ({percent}%)
                            </span>
                          </div>
                        </div>

                        {/* Barra de Ocupación Visual */}
                        <div
                          style={{
                            height: '7px',
                            background: '#e2e8f0',
                            borderRadius: '999px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              background: barColor,
                              borderRadius: '999px',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>

                        {/* Chips de Paquetes en el Piso */}
                        {pkgsInFloor.length > 0 ? (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                            {pkgsInFloor.slice(0, 5).map(p => (
                              <span
                                key={p.id}
                                onClick={() => onOpenTransferModal(p)}
                                title={`Clic para reubicar: ${p.numeroReciboBodega} (${p.nombreConsignatario || p.codigoCasillero})`}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  background: '#ffffff',
                                  border: '1px solid #cbd5e1',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  color: '#1e293b',
                                  cursor: 'pointer'
                                }}
                              >
                                📦 {p.numeroReciboBodega}
                              </span>
                            ))}
                            {pkgsInFloor.length > 5 && (
                              <span
                                onClick={() => onFilterShelf(shelfCode, posItem.nivelPiso)}
                                style={{
                                  fontSize: '10px',
                                  color: '#2563eb',
                                  fontWeight: 800,
                                  alignSelf: 'center',
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                +{pkgsInFloor.length - 5} más (Ver todos)
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Piso vacío • Listo para almacenar carga
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
