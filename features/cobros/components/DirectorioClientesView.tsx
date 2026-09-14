'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  User,
  ExternalLink,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import { ResumenCliente360, CotizacionKambista } from '../types';
import { KambistaService } from '../services/kambista.service';
import { DirectorioClienteModal } from './DirectorioClienteModal';

interface DirectorioClientesViewProps {
  getResumenCliente360: (clienteNombre: string) => ResumenCliente360 | null;
  allClientNames: string[];
  cotizacionKambista: CotizacionKambista;
  onNavigateToCobros?: (clienteNombre: string) => void;
  guardarTarifaCliente?: (clienteNombre: string, tarifa: number) => void;
  initialClientName?: string;
}

export const DirectorioClientesView: React.FC<DirectorioClientesViewProps> = ({
  getResumenCliente360,
  allClientNames,
  cotizacionKambista,
  onNavigateToCobros,
  guardarTarifaCliente,
  initialClientName
}) => {
  const [searchTerm, setSearchTerm] = useState(initialClientName || '');
  const [filterDeuda, setFilterDeuda] = useState<'TODOS' | 'CON_DEUDA' | 'AL_DIA'>('TODOS');
  const [filterTipo, setFilterTipo] = useState<'TODOS' | 'CORP' | 'PARTICULAR'>('TODOS');
  const [activeModalCliente, setActiveModalCliente] = useState<ResumenCliente360 | null>(null);

  // Si cambia el cliente inicial desde navegación externa, actualizar el buscador
  React.useEffect(() => {
    if (initialClientName) {
      setSearchTerm(initialClientName);
    }
  }, [initialClientName]);

  // Generar todos los resúmenes
  const clientSummaries = useMemo(() => {
    const list: ResumenCliente360[] = [];
    allClientNames.forEach((name) => {
      const summary = getResumenCliente360(name);
      if (summary) {
        list.push(summary);
      }
    });

    // Ordenar: primero los que tienen mayor saldo pendiente
    return list.sort((a, b) => b.deudaPendienteUsd - a.deudaPendienteUsd);
  }, [allClientNames, getResumenCliente360]);

  // Filtrado
  const filteredSummaries = useMemo(() => {
    return clientSummaries.filter((c) => {
      if (filterDeuda === 'CON_DEUDA' && c.deudaPendienteUsd <= 0) return false;
      if (filterDeuda === 'AL_DIA' && c.deudaPendienteUsd > 0) return false;
      if (filterTipo === 'CORP' && !c.esCorporativo) return false;
      if (filterTipo === 'PARTICULAR' && c.esCorporativo) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toUpperCase();
        const matchName = c.clienteNombre.toUpperCase().includes(q);
        const matchSub = c.subConsignatarios?.some((s) => s.toUpperCase().includes(q));
        const matchWR = c.historialWRs.some((w) => w.wr.toUpperCase().includes(q));
        if (!matchName && !matchSub && !matchWR) return false;
      }

      return true;
    });
  }, [clientSummaries, filterDeuda, filterTipo, searchTerm]);

  // Estadísticas globales de cartera
  const statsCartera = useMemo(() => {
    let facturadoTotal = 0;
    let cobradoTotal = 0;
    let deudaTotal = 0;
    let totalClientesConDeuda = 0;

    clientSummaries.forEach((c) => {
      facturadoTotal += c.totalFacturadoUsd;
      cobradoTotal += c.totalPagadoUsd;
      deudaTotal += c.deudaPendienteUsd;
      if (c.deudaPendienteUsd > 0) totalClientesConDeuda++;
    });

    return {
      facturadoTotal: Math.round(facturadoTotal * 100) / 100,
      cobradoTotal: Math.round(cobradoTotal * 100) / 100,
      deudaTotal: Math.round(deudaTotal * 100) / 100,
      totalClientesConDeuda
    };
  }, [clientSummaries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. TARJETAS RESUMEN DE CARTERA GLOBAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        <div
          style={{
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block' }}>
            Facturación Total Histórica
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', marginTop: '4px' }}>
            ${statsCartera.facturadoTotal.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>USD</span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
            &asymp; S/ {KambistaService.convertUsdToPen(statsCartera.facturadoTotal, cotizacionKambista.venta).toFixed(2)} PEN
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #bbf7d0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#16a34a', display: 'block' }}>
            Total Cobrado / Pagado
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#16a34a', marginTop: '4px' }}>
            ${statsCartera.cobradoTotal.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500 }}>USD</span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#15803d', marginTop: '2px' }}>
            &asymp; S/ {KambistaService.convertUsdToPen(statsCartera.cobradoTotal, cotizacionKambista.venta).toFixed(2)} PEN
          </div>
        </div>

        <div
          style={{
            background: '#fff1f2',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #fecdd3',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', display: 'block' }}>
            Saldo Pendiente por Cobrar ({statsCartera.totalClientesConDeuda} clientes)
          </span>
          <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', color: '#dc2626', marginTop: '4px' }}>
            ${statsCartera.deudaTotal.toFixed(2)} <span style={{ fontSize: '12px', fontWeight: 500 }}>USD</span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#b91c1c', marginTop: '2px' }}>
            &asymp; S/ {KambistaService.convertUsdToPen(statsCartera.deudaTotal, cotizacionKambista.venta).toFixed(2)} PEN
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
      <div
        style={{
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa corporativa (ej: CORP. FRAGMANI), sub-destinatario o WR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '12px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#0f172a',
              outline: 'none',
              fontWeight: 500
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button
              onClick={() => setFilterDeuda('TODOS')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterDeuda === 'TODOS' ? '#ffffff' : 'transparent',
                color: filterDeuda === 'TODOS' ? '#0f172a' : '#64748b',
                boxShadow: filterDeuda === 'TODOS' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              Todos ({clientSummaries.length})
            </button>
            <button
              onClick={() => setFilterDeuda('CON_DEUDA')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterDeuda === 'CON_DEUDA' ? '#ef4444' : 'transparent',
                color: filterDeuda === 'CON_DEUDA' ? '#ffffff' : '#b91c1c',
                cursor: 'pointer'
              }}
            >
              Con Saldo ({statsCartera.totalClientesConDeuda})
            </button>
            <button
              onClick={() => setFilterDeuda('AL_DIA')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterDeuda === 'AL_DIA' ? '#10b981' : 'transparent',
                color: filterDeuda === 'AL_DIA' ? '#ffffff' : '#047857',
                cursor: 'pointer'
              }}
            >
              Al Día
            </button>
          </div>

          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button
              onClick={() => setFilterTipo('TODOS')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterTipo === 'TODOS' ? '#ffffff' : 'transparent',
                color: filterTipo === 'TODOS' ? '#0f172a' : '#64748b',
                boxShadow: filterTipo === 'TODOS' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer'
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTipo('CORP')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterTipo === 'CORP' ? '#f59e0b' : 'transparent',
                color: filterTipo === 'CORP' ? '#ffffff' : '#b45309',
                cursor: 'pointer'
              }}
            >
              Corporativos
            </button>
            <button
              onClick={() => setFilterTipo('PARTICULAR')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filterTipo === 'PARTICULAR' ? '#3b82f6' : 'transparent',
                color: filterTipo === 'PARTICULAR' ? '#ffffff' : '#1d4ed8',
                cursor: 'pointer'
              }}
            >
              Particulares
            </button>
          </div>
        </div>
      </div>

      {/* 3. TABLA DE CARTERA CON EXPEDIENTE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px' }}>#</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px' }}>CLIENTE / EMPRESA</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'center' }}>TIPO CUENTA</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'center' }}>TARIFA / KG ($)</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'center' }}>PAQUETES</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'right' }}>TOTAL FACTURADO</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'right' }}>TOTAL COBRADO</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'right' }}>SALDO PENDIENTE</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'center' }}>ESTADO</th>
                <th style={{ padding: '12px 14px', fontWeight: 800, fontSize: '11px', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <Users style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron clientes que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((c, index) => {
                  const hasDebt = c.deudaPendienteUsd > 0;
                  const deudaPen = KambistaService.convertUsdToPen(c.deudaPendienteUsd, cotizacionKambista.venta);

                  return (
                    <tr
                      key={c.clienteNombre}
                      onClick={() => setActiveModalCliente(c)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                        background: hasDebt ? '#ffffff' : '#fcfdfd'
                      }}
                      className="hover:bg-blue-50/40"
                    >
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                        {index + 1}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                            {c.clienteNombre}
                          </span>
                          {c.esCorporativo && (
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              ({c.subConsignatarios?.length || 0} destinatarios)
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {c.esCorporativo ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a'
                            }}
                          >
                            CORPORATIVO
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: '#f1f5f9',
                              color: '#475569'
                            }}
                          >
                            Particular
                          </span>
                        )}
                      </td>

                      {/* TARIFA POR KG CON SELECTOR INLINE */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              background: c.tarifaPersonalizada ? '#eff6ff' : '#f8fafc',
                              color: c.tarifaPersonalizada ? '#1d4ed8' : '#475569',
                              border: c.tarifaPersonalizada ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                            }}
                            title={c.tarifaPersonalizada ? 'Tarifa configurada manualmente' : 'Tarifa calculada / base'}
                          >
                            ${(c.tarifaPorKgUsd || 7).toFixed(2)}/kg
                          </span>
                          {guardarTarifaCliente && (
                            <select
                              value={(c.tarifaPorKgUsd || 7).toFixed(2)}
                              onChange={(e) => {
                                const nuevaTarifa = parseFloat(e.target.value);
                                if (nuevaTarifa > 0) {
                                  guardarTarifaCliente(c.clienteNombre, nuevaTarifa);
                                }
                              }}
                              style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                fontWeight: 700,
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="6.00">$6.00</option>
                              <option value="6.50">$6.50</option>
                              <option value="7.00">$7.00</option>
                              <option value="7.50">$7.50</option>
                              <option value="8.00">$8.00</option>
                              <option value="8.50">$8.50</option>
                              <option value="9.00">$9.00</option>
                              <option value="10.00">$10.00</option>
                            </select>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                        {c.totalWrsHistoricos} <span style={{ fontSize: '10px', color: '#94a3b8' }}>WRs</span>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        ${c.totalFacturadoUsd.toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#16a34a' }}>
                        ${c.totalPagadoUsd.toFixed(2)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900 }}>
                        {hasDebt ? (
                          <div>
                            <span style={{ color: '#dc2626', fontSize: '14px' }}>
                              ${c.deudaPendienteUsd.toFixed(2)}
                            </span>
                            <span style={{ display: 'block', fontSize: '10.5px', color: '#ef4444', fontWeight: 500 }}>
                              &asymp; S/ {deudaPen.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '13px' }}>$0.00</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {hasDebt ? (
                          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: '#fee2e2', color: '#991b1b' }}>
                            DEUDA PENDIENTE
                          </span>
                        ) : (
                          <span style={{ padding: '3px 9px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                            AL DÍA
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveModalCliente(c);
                            }}
                            style={{
                              padding: '4px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Ver Ficha
                          </button>
                          {onNavigateToCobros && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToCobros(c.clienteNombre);
                              }}
                              title={hasDebt ? 'Ir a cobrar paquetes pendientes en Cobros' : 'Ver registro en módulo de Cobros'}
                              style={{
                                padding: '4px 9px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: hasDebt ? '#ecfdf5' : '#f8fafc',
                                color: hasDebt ? '#059669' : '#64748b',
                                border: hasDebt ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              {hasDebt ? 'Cobrar' : 'Cobros'}
                            </button>
                          )}
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

      {/* 4. MODAL DETALLE / EXPEDIENTE DEL CLIENTE */}
      <DirectorioClienteModal
        isOpen={Boolean(activeModalCliente)}
        onClose={() => setActiveModalCliente(null)}
        clienteResumen={activeModalCliente}
        tcVenta={cotizacionKambista.venta}
        onNavigateToCobros={onNavigateToCobros}
        guardarTarifaCliente={guardarTarifaCliente}
      />
    </div>
  );
};

// Retrocompatibilidad
export const Clientes360View = DirectorioClientesView;
