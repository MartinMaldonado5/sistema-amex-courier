'use client';

import React from 'react';
import { Clock, RefreshCw, Plus, Search, ChevronRight } from 'lucide-react';
import { MovimientoKardex } from '@/types';
import { TableSkeleton } from '@/components/ui/Skeleton';

export interface KardexViewProps {
  kardexList: MovimientoKardex[];
  filteredKardex: MovimientoKardex[];
  kardexSearch: string;
  setKardexSearch: (s: string) => void;
  kardexTypeFilter: string;
  setKardexTypeFilter: (s: string) => void;
  isLoadingKardex: boolean;
  onRefreshKardex: () => Promise<void> | void;
  onOpenTransferModal: () => void;
}

export default function KardexView({
  kardexList,
  filteredKardex,
  kardexSearch,
  setKardexSearch,
  kardexTypeFilter,
  setKardexTypeFilter,
  isLoadingKardex,
  onRefreshKardex,
  onOpenTransferModal
}: KardexViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock className="w-5 h-5 text-blue-600" /> Bitácora Kardex de Movimientos y Auditoría en Tiempo Real
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Registro cronológico inmutable de entradas, salidas, reubicaciones y cambios de estado
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onRefreshKardex}
            className="btn"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: 700
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKardex ? 'animate-spin' : ''}`} /> Refrescar
          </button>

          <button
            onClick={onOpenTransferModal}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700 }}
          >
            <Plus className="w-4 h-4" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Filtros de Kardex */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
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
            placeholder="Buscar por Guía, Consignatario, Origen, Destino u Operador..."
            value={kardexSearch}
            onChange={e => setKardexSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>Tipo:</span>
          <select
            value={kardexTypeFilter}
            onChange={e => setKardexTypeFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px'
            }}
          >
            <option value="ALL">Todos los Movimientos</option>
            <option value="RECEPCION">Recepción</option>
            <option value="SLOTTING">Slotting / Clasificación</option>
            <option value="REUBICACION">Reubicación</option>
            <option value="DESPACHO">Despacho</option>
            <option value="ENTREGA">Entrega</option>
          </select>
        </div>
      </div>

      {isLoadingKardex ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                <th style={{ padding: '10px 14px' }}>Fecha & Hora</th>
                <th style={{ padding: '10px 14px' }}>Paquete / Guía</th>
                <th style={{ padding: '10px 14px' }}>Consignatario</th>
                <th style={{ padding: '10px 14px' }}>Origen ➔ Destino</th>
                <th style={{ padding: '10px 14px' }}>Tipo & Motivo</th>
                <th style={{ padding: '10px 14px' }}>Operador Responsable</th>
              </tr>
            </thead>
            <tbody>
              {filteredKardex.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    <Clock style={{ width: '36px', height: '36px', margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                    <div style={{ fontWeight: 800, color: '#64748b' }}>No hay registros de Kardex coincidentes</div>
                  </td>
                </tr>
              ) : (
                filteredKardex.map(mov => (
                  <tr key={mov.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(mov.creadoEn).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
                      {mov.codigoPaquete}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600 }}>
                      {mov.consignatario || '-'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>{mov.origenDescripcion}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{mov.destinoDescripcion}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#eff6ff',
                          color: '#1e40af',
                          marginRight: '6px'
                        }}
                      >
                        {mov.tipoMovimiento}
                      </span>
                      {mov.motivo}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11.5px', fontWeight: 700 }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                        {mov.usuarioOperador}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
