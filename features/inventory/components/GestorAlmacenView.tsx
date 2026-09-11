'use client';

import React from 'react';
import { Settings, Plus, Edit3, Boxes, Trash2 } from 'lucide-react';
import { Paquete, EstanteriaPosicion } from '@/types';

export interface GestorAlmacenViewProps {
  posicionesList: EstanteriaPosicion[];
  paquetes: Paquete[];
  onOpenBatchShelfModal: () => void;
  onOpenSinglePositionModal: () => void;
  onEditPosition: (pos: EstanteriaPosicion) => void;
  onFilterShelf: (shelfCode: string, floorLevel: string) => void;
  onDeletePosition: (posId: string) => void;
}

export default function GestorAlmacenView({
  posicionesList,
  paquetes,
  onOpenBatchShelfModal,
  onOpenSinglePositionModal,
  onEditPosition,
  onFilterShelf,
  onDeletePosition
}: GestorAlmacenViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Botones de Creación */}
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
            <Settings className="w-5 h-5 text-indigo-600" /> Configuración de Anaqueles, Pisos y Parámetros WMS
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Administra los anaqueles físicos, niveles de piso, límites de peso y zonas de operación en el Almacén Central Lince
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenBatchShelfModal}
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
            <Plus className="w-4 h-4" /> + Crear Anaquel en Lote
          </button>

          <button
            onClick={onOpenSinglePositionModal}
            className="btn"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: '8px'
            }}
          >
            <Plus className="w-4 h-4" /> + Posición Individual
          </button>
        </div>
      </div>

      {/* Tabla de Configuración de Posiciones */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                <th style={{ padding: '10px 14px' }}>Código Posición</th>
                <th style={{ padding: '10px 14px' }}>Anaquel</th>
                <th style={{ padding: '10px 14px' }}>Nivel / Piso</th>
                <th style={{ padding: '10px 14px' }}>Tipo de Zona</th>
                <th style={{ padding: '10px 14px' }}>Ocupación / Capacidad</th>
                <th style={{ padding: '10px 14px' }}>Límite Peso (Kg)</th>
                <th style={{ padding: '10px 14px' }}>Descripción / Ubicación</th>
                <th style={{ padding: '10px 14px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posicionesList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <Settings style={{ width: '40px', height: '40px', margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                    <div style={{ fontWeight: 800, color: '#64748b' }}>No hay posiciones de estantería configuradas</div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Haz clic en &quot;+ Crear Anaquel en Lote&quot; para comenzar.</p>
                  </td>
                </tr>
              ) : (
                posicionesList.map(pos => {
                  const countInPos = paquetes.filter(
                    p =>
                      p.posicionEstante === pos.codigoPosicion ||
                      (p.anaquel === pos.codigoEstante && p.piso === pos.nivelPiso)
                  ).length;
                  const maxCap = pos.capacidadMaxPaquetes || 40;
                  const pct = Math.min(Math.round((countInPos / maxCap) * 100), 100);

                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '13px',
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          {pos.codigoPosicion}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0f172a' }}>
                        Anaquel {pos.codigoEstante}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#334155', fontWeight: 700 }}>
                        {pos.nivelPiso}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              pos.zonaTipo === 'ALMACENAJE'
                                ? '#dbeafe'
                                : pos.zonaTipo === 'RECEPCION'
                                ? '#fef3c7'
                                : pos.zonaTipo === 'DESPACHO'
                                ? '#dcfce7'
                                : '#fee2e2',
                            color:
                              pos.zonaTipo === 'ALMACENAJE'
                                ? '#1e40af'
                                : pos.zonaTipo === 'RECEPCION'
                                ? '#92400e'
                                : pos.zonaTipo === 'DESPACHO'
                                ? '#166534'
                                : '#dc2626'
                          }}
                        >
                          {pos.zonaTipo}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '70px',
                              height: '6px',
                              background: '#e2e8f0',
                              borderRadius: '999px',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>
                            {countInPos} / {maxCap} ({pct}%)
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>
                        {pos.pesoMaxKg} Kg
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {pos.descripcion || 'Sin descripción'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            title="Editar Posición / Capacidad"
                            onClick={() => onEditPosition(pos)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Filtrar existencias en este anaquel"
                            onClick={() => onFilterShelf(pos.codigoEstante, pos.nivelPiso)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Boxes className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Eliminar Posición"
                            onClick={() => onDeletePosition(pos.id)}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              color: '#dc2626',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
