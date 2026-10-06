'use client';

import React, { useMemo } from 'react';
import {
  Boxes,
  Warehouse,
  Layers,
  CheckCircle2,
  Activity,
  Package,
  Truck,
  Inbox,
  Store,
  Eye
} from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryStatsCardsProps {
  paquetes: Paquete[];
  statusAmexFilter?: string;
  setStatusAmexFilter?: (status: string) => void;
}

export default function InventoryStatsCards({
  paquetes,
  statusAmexFilter = 'ALL',
  setStatusAmexFilter
}: InventoryStatsCardsProps) {
  // 1. Paquetes entregados (salidas definitivas del almacén)
  const paquetesEntregados = useMemo(
    () => paquetes.filter(p => p.estadoAmex === 'entregado' || p.ubicacionActual === 'Entregado'),
    [paquetes]
  );
  const totalEntregados = paquetesEntregados.length;
  const pesoEntregadoKg = useMemo(
    () => paquetesEntregados.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0),
    [paquetesEntregados]
  );

  // 2. EXISTENCIAS REALES FÍSICAS EN ALMACÉN (excluye entregados)
  const paquetesActivos = useMemo(
    () => paquetes.filter(p => p.estadoAmex !== 'entregado' && p.ubicacionActual !== 'Entregado'),
    [paquetes]
  );
  const totalExistenciasReales = paquetesActivos.length;
  const totalPesoRealKg = useMemo(
    () => paquetesActivos.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0),
    [paquetesActivos]
  );
  const pesoPromedioActivo = totalExistenciasReales > 0 ? totalPesoRealKg / totalExistenciasReales : 0;

  // 3. Slotting en estantería sobre paquetes físicamente presentes
  const paquetesEnEstante = useMemo(
    () =>
      paquetesActivos.filter(
        p =>
          p.posicionEstante &&
          !p.posicionEstante.startsWith('OFI') &&
          !p.posicionEstante.startsWith('REC') &&
          p.posicionEstante !== 'SIN_ASIGNAR'
      ).length,
    [paquetesActivos]
  );
  const paquetesSinUbicar = totalExistenciasReales - paquetesEnEstante;

  // 4. Desglose detallado por Estado AMEX en tiempo real
  const enAlmacenCount = useMemo(
    () => paquetesActivos.filter(p => p.estadoAmex === 'en_almacen').length,
    [paquetesActivos]
  );
  const recibidoCount = useMemo(
    () => paquetesActivos.filter(p => p.estadoAmex === 'recibido').length,
    [paquetesActivos]
  );
  const listoRecojoCount = useMemo(
    () => paquetesActivos.filter(p => p.estadoAmex === 'listo_recojo').length,
    [paquetesActivos]
  );
  const enRutaCount = useMemo(
    () => paquetesActivos.filter(p => p.estadoAmex === 'en_ruta').length,
    [paquetesActivos]
  );

  const totalGeneralRegistrados = paquetes.length;
  const totalPesoGeneralKg = totalPesoRealKg + pesoEntregadoKg;

  // Porcentajes para la barra de distribución
  const pctEnAlmacen = totalGeneralRegistrados > 0 ? (enAlmacenCount / totalGeneralRegistrados) * 100 : 0;
  const pctRecibido = totalGeneralRegistrados > 0 ? (recibidoCount / totalGeneralRegistrados) * 100 : 0;
  const pctListoRecojo = totalGeneralRegistrados > 0 ? (listoRecojoCount / totalGeneralRegistrados) * 100 : 0;
  const pctEnRuta = totalGeneralRegistrados > 0 ? (enRutaCount / totalGeneralRegistrados) * 100 : 0;
  const pctEntregado = totalGeneralRegistrados > 0 ? (totalEntregados / totalGeneralRegistrados) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Cuadrícula de 4 Tarjetas Superiores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {/* TARJETA 1: TOTAL EXISTENCIAS LINCE (REALES EN ALMACÉN) */}
        <div
          onClick={() => setStatusAmexFilter && setStatusAmexFilter('ACTIVAS')}
          style={{
            background: '#ffffff',
            border: statusAmexFilter === 'ACTIVAS' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: setStatusAmexFilter ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title="Haz clic para ver solo las existencias reales activas en almacén"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Total Existencias Lince
            </span>
            <Boxes className="w-5 h-5 text-blue-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {totalExistenciasReales}
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>paquetes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
              ● En Custodia Física (Lince)
            </div>
            {totalEntregados > 0 && (
              <span
                style={{
                  fontSize: '10.5px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}
              >
                Excluye {totalEntregados} entregados
              </span>
            )}
          </div>
        </div>

        {/* TARJETA 2: PESO EN CUSTODIA (LINCE) */}
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
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Peso en Custodia (Lince)
            </span>
            <Warehouse className="w-5 h-5 text-indigo-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {totalPesoRealKg.toFixed(1)}
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>kg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
              Promedio: {pesoPromedioActivo.toFixed(2)} kg / paquete
            </div>
            <span style={{ fontSize: '10.5px', color: '#6366f1', fontWeight: 700 }}>
              ● Carga física en bodega
            </span>
          </div>
        </div>

        {/* TARJETA 3: EN ANAQUELES (SLOTTING) */}
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
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              En Anaqueles (Slotting)
            </span>
            <Layers className="w-5 h-5 text-emerald-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {paquetesEnEstante}
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ubicados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ fontSize: '11px', color: paquetesSinUbicar > 0 ? '#d97706' : '#16a34a', fontWeight: 700 }}>
              {paquetesSinUbicar > 0 ? `${paquetesSinUbicar} pendientes de slotting` : '✓ 100% en anaquel asignado'}
            </div>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
              de {totalExistenciasReales} en custodia
            </span>
          </div>
        </div>

        {/* TARJETA 4: SALIDAS Y ENTREGADOS (HISTÓRICO FUERA DE BODEGA) */}
        <div
          onClick={() => setStatusAmexFilter && setStatusAmexFilter('entregado')}
          style={{
            background: statusAmexFilter === 'entregado' ? '#f0fdf4' : '#ffffff',
            border: statusAmexFilter === 'entregado' ? '2px solid #16a34a' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: setStatusAmexFilter ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title="Haz clic para ver solo los paquetes entregados"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Salidas y Entregados
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            {totalEntregados}
            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>entregados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>
              ✓ Fuera de bodega (salidas)
            </div>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
              Total hist.: {totalGeneralRegistrados}
            </span>
          </div>
        </div>
      </div>

      {/* CUADRO EN TIEMPO REAL: MONITOR DE EXISTENCIAS Y DESGLOSE OPERATIVO */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Cabecera del Cuadro */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
              Cuadro en Tiempo Real de Existencias en Almacén Lince
            </span>
            <span
              style={{
                fontSize: '11px',
                background: '#dcfce7',
                color: '#15803d',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
              Sincronizado en Vivo
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#64748b' }}>
            <span>
              <strong style={{ color: '#0f172a' }}>{totalExistenciasReales}</strong> bultos en bodega
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#16a34a' }}>{totalEntregados}</strong> entregados
            </span>
            <span>•</span>
            <span>
              <strong style={{ color: '#64748b' }}>{totalGeneralRegistrados}</strong> registros totales ({totalPesoGeneralKg.toFixed(1)} kg)
            </span>
          </div>
        </div>

        {/* Barra de Distribución Proporcional */}
        {totalGeneralRegistrados > 0 && (
          <div
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: '#f1f5f9',
              display: 'flex',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
            }}
            title={`Distribución: En Almacén ${pctEnAlmacen.toFixed(1)}% | Entregados ${pctEntregado.toFixed(1)}%`}
          >
            {pctEnAlmacen > 0 && (
              <div
                style={{
                  width: `${pctEnAlmacen}%`,
                  background: '#2563eb',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
            {pctListoRecojo > 0 && (
              <div
                style={{
                  width: `${pctListoRecojo}%`,
                  background: '#ea580c',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
            {pctEnRuta > 0 && (
              <div
                style={{
                  width: `${pctEnRuta}%`,
                  background: '#8b5cf6',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
            {pctRecibido > 0 && (
              <div
                style={{
                  width: `${pctRecibido}%`,
                  background: '#0284c7',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
            {pctEntregado > 0 && (
              <div
                style={{
                  width: `${pctEntregado}%`,
                  background: '#16a34a',
                  transition: 'width 0.3s ease'
                }}
              />
            )}
          </div>
        )}

        {/* Botones / Píldoras de Filtrado Rápido Interactivo */}
        {setStatusAmexFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginRight: '4px' }}>
              Filtro Rápido en Vivo:
            </span>

            {/* Píldora: Solo Existencias Activas (Reales en Almacén) */}
            <button
              type="button"
              onClick={() => setStatusAmexFilter('ACTIVAS')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: statusAmexFilter === 'ACTIVAS' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: statusAmexFilter === 'ACTIVAS' ? '#eff6ff' : '#f8fafc',
                color: statusAmexFilter === 'ACTIVAS' ? '#1d4ed8' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>Solo Existencias Activas</span>
              <span
                style={{
                  background: statusAmexFilter === 'ACTIVAS' ? '#2563eb' : '#e2e8f0',
                  color: statusAmexFilter === 'ACTIVAS' ? '#ffffff' : '#334155',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10.5px',
                  fontWeight: 800
                }}
              >
                {totalExistenciasReales}
              </span>
            </button>

            {/* Píldora: En Almacén */}
            <button
              type="button"
              onClick={() => setStatusAmexFilter('en_almacen')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: statusAmexFilter === 'en_almacen' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                background: statusAmexFilter === 'en_almacen' ? '#dbeafe' : '#ffffff',
                color: statusAmexFilter === 'en_almacen' ? '#1e40af' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Boxes className="w-3.5 h-3.5 text-blue-500" />
              <span>En Almacén</span>
              <span
                style={{
                  background: statusAmexFilter === 'en_almacen' ? '#3b82f6' : '#f1f5f9',
                  color: statusAmexFilter === 'en_almacen' ? '#ffffff' : '#475569',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10.5px',
                  fontWeight: 800
                }}
              >
                {enAlmacenCount}
              </span>
            </button>

            {/* Píldora: Recibidos (si hay) */}
            {recibidoCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusAmexFilter('recibido')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: statusAmexFilter === 'recibido' ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  background: statusAmexFilter === 'recibido' ? '#e0f2fe' : '#ffffff',
                  color: statusAmexFilter === 'recibido' ? '#0369a1' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Inbox className="w-3.5 h-3.5 text-sky-500" />
                <span>Recibidos</span>
                <span
                  style={{
                    background: statusAmexFilter === 'recibido' ? '#0284c7' : '#f1f5f9',
                    color: statusAmexFilter === 'recibido' ? '#ffffff' : '#475569',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10.5px',
                    fontWeight: 800
                  }}
                >
                  {recibidoCount}
                </span>
              </button>
            )}

            {/* Píldora: Listo Recojo */}
            {listoRecojoCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusAmexFilter('listo_recojo')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: statusAmexFilter === 'listo_recojo' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                  background: statusAmexFilter === 'listo_recojo' ? '#ffedd5' : '#ffffff',
                  color: statusAmexFilter === 'listo_recojo' ? '#c2410c' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Store className="w-3.5 h-3.5 text-orange-500" />
                <span>Listo Recojo</span>
                <span
                  style={{
                    background: statusAmexFilter === 'listo_recojo' ? '#ea580c' : '#f1f5f9',
                    color: statusAmexFilter === 'listo_recojo' ? '#ffffff' : '#475569',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10.5px',
                    fontWeight: 800
                  }}
                >
                  {listoRecojoCount}
                </span>
              </button>
            )}

            {/* Píldora: En Ruta */}
            {enRutaCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusAmexFilter('en_ruta')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  border: statusAmexFilter === 'en_ruta' ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
                  background: statusAmexFilter === 'en_ruta' ? '#f3e8ff' : '#ffffff',
                  color: statusAmexFilter === 'en_ruta' ? '#6d28d9' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Truck className="w-3.5 h-3.5 text-purple-500" />
                <span>En Ruta</span>
                <span
                  style={{
                    background: statusAmexFilter === 'en_ruta' ? '#8b5cf6' : '#f1f5f9',
                    color: statusAmexFilter === 'en_ruta' ? '#ffffff' : '#475569',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '10.5px',
                    fontWeight: 800
                  }}
                >
                  {enRutaCount}
                </span>
              </button>
            )}

            {/* Píldora: Entregados (Salidas) */}
            <button
              type="button"
              onClick={() => setStatusAmexFilter('entregado')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: statusAmexFilter === 'entregado' ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                background: statusAmexFilter === 'entregado' ? '#dcfce7' : '#ffffff',
                color: statusAmexFilter === 'entregado' ? '#15803d' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entregados (Salidas)</span>
              <span
                style={{
                  background: statusAmexFilter === 'entregado' ? '#16a34a' : '#f1f5f9',
                  color: statusAmexFilter === 'entregado' ? '#ffffff' : '#475569',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10.5px',
                  fontWeight: 800
                }}
              >
                {totalEntregados}
              </span>
            </button>

            {/* Píldora: Ver Todos (Historial Completo) */}
            <button
              type="button"
              onClick={() => setStatusAmexFilter('ALL')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: statusAmexFilter === 'ALL' ? '1.5px solid #64748b' : '1px solid #e2e8f0',
                background: statusAmexFilter === 'ALL' ? '#f1f5f9' : '#ffffff',
                color: statusAmexFilter === 'ALL' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver Todos</span>
              <span
                style={{
                  background: statusAmexFilter === 'ALL' ? '#64748b' : '#f1f5f9',
                  color: statusAmexFilter === 'ALL' ? '#ffffff' : '#64748b',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10.5px',
                  fontWeight: 800
                }}
              >
                {totalGeneralRegistrados}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
