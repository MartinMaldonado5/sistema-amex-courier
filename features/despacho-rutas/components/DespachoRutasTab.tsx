'use client';

import React, { useState } from 'react';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Share2,
  ExternalLink,
  Trash2,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  MessageCircle
} from 'lucide-react';
import { useDespachoRutas } from '../hooks/useDespachoRutas';
import RutaBuilderModal from './RutaBuilderModal';
import ChoferCardParada from './ChoferCardParada';
import { DespachoRuta } from '@/types/despacho';

function formatFechaCreacion(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isToday) {
      return `Hoy ${timeStr}`;
    }
    const dateStr = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    return `${dateStr} ${timeStr}`;
  } catch {
    return '';
  }
}

export default function DespachoRutasTab() {
  const {
    rutas,
    selectedRuta,
    isLoading,
    viewMode,
    setViewMode,
    filtroFecha,
    setFiltroFecha,
    busqueda,
    setBusqueda,
    loadRutas,
    selectRuta,
    handleCrearRuta,
    handleActualizarEstadoParada,
    handleSubirFotoParada,
    handleEliminarFotoParada,
    handleEliminarRuta
  } = useDespachoRutas();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [copiedRutaId, setCopiedRutaId] = useState<string | null>(null);
  const [filtroEstadoParada, setFiltroEstadoParada] = useState<'TODAS' | 'PENDIENTES' | 'ENTREGADAS'>('TODAS');

  // Copiar o compartir enlace al chofer
  const handleCopiarEnlaceChofer = (ruta: DespachoRuta) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/despacho-rutas?rutaId=${ruta.id}&modo=chofer`;
    navigator.clipboard.writeText(url);
    setCopiedRutaId(ruta.id);
    setTimeout(() => setCopiedRutaId(null), 2500);
  };

  // Abrir WhatsApp con el enlace de la ruta para enviárselo al chofer
  const handleEnviarRutaWhatsApp = (ruta: DespachoRuta) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/despacho-rutas?rutaId=${ruta.id}&modo=chofer`;
    const msg = `Hola ${ruta.choferNombre}, aquí tienes tu hoja de ruta del día: ${ruta.nombreRuta} con ${ruta.totalParadas} paradas. Ábrela aquí: ${url}`;
    const cleanPhone = (ruta.choferTelefono || '').replace(/\D/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Cálculos estadísticos
  const totalRutas = rutas.length;
  const totalParadasGlobal = rutas.reduce((acc, r) => acc + r.totalParadas, 0);
  const totalEntregadasGlobal = rutas.reduce((acc, r) => acc + r.paradasEntregadas, 0);
  const porcentajeGlobal =
    totalParadasGlobal > 0 ? Math.round((totalEntregadasGlobal / totalParadasGlobal) * 100) : 0;

  // Filtrado de paradas en la vista móvil del chofer
  const paradasFiltradas = selectedRuta?.paradas.filter(p => {
    if (filtroEstadoParada === 'PENDIENTES') return p.estado === 'PENDIENTE' || p.estado === 'NO_ENTREGADO';
    if (filtroEstadoParada === 'ENTREGADAS') return p.estado === 'ENTREGADO';
    return true;
  }) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. MODO CHOFER MÓVIL (Cuando hay una ruta activa seleccionada) */}
      {viewMode === 'chofer' && selectedRuta ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
          {/* Botón Volver */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setViewMode('tablero')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft className="w-4 h-4" /> Volver a todas las rutas
            </button>

            <button
              onClick={() => handleEnviarRutaWhatsApp(selectedRuta)}
              style={{
                background: '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Share2 className="w-3.5 h-3.5" /> Compartir Ruta
            </button>
          </div>

          {/* Tarjeta de Resumen de la Ruta del Chofer */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '11.5px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '4px', fontWeight: 800 }}>
                {selectedRuta.codigoRuta}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>
                📅 {selectedRuta.fechaDespacho}
              </span>
            </div>

            <h2 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 900 }}>
              {selectedRuta.nombreRuta}
            </h2>

            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '14px' }}>
              Chofer: <strong>{selectedRuta.choferNombre}</strong>
              {selectedRuta.vehiculoPlaca && ` • Vehículo: ${selectedRuta.vehiculoPlaca}`}
            </div>

            {/* Barra de Progreso */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
                <span>Progreso de Entregas</span>
                <span>
                  {selectedRuta.paradasEntregadas} de {selectedRuta.totalParadas} paradas (
                  {selectedRuta.totalParadas > 0
                    ? Math.round((selectedRuta.paradasEntregadas / selectedRuta.totalParadas) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: '#22c55e',
                    borderRadius: '999px',
                    width: `${
                      selectedRuta.totalParadas > 0
                        ? (selectedRuta.paradasEntregadas / selectedRuta.totalParadas) * 100
                        : 0
                    }%`,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Filtros rápidos de Paradas para el Chofer */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFiltroEstadoParada('TODAS')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                border: filtroEstadoParada === 'TODAS' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: filtroEstadoParada === 'TODAS' ? '#eff6ff' : '#ffffff',
                color: filtroEstadoParada === 'TODAS' ? '#1d4ed8' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Todas ({selectedRuta.paradas.length})
            </button>

            <button
              onClick={() => setFiltroEstadoParada('PENDIENTES')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                border: filtroEstadoParada === 'PENDIENTES' ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                background: filtroEstadoParada === 'PENDIENTES' ? '#fef3c7' : '#ffffff',
                color: filtroEstadoParada === 'PENDIENTES' ? '#b45309' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Pendientes ({selectedRuta.paradas.filter(p => p.estado !== 'ENTREGADO').length})
            </button>

            <button
              onClick={() => setFiltroEstadoParada('ENTREGADAS')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                border: filtroEstadoParada === 'ENTREGADAS' ? '1px solid #16a34a' : '1px solid #cbd5e1',
                background: filtroEstadoParada === 'ENTREGADAS' ? '#dcfce7' : '#ffffff',
                color: filtroEstadoParada === 'ENTREGADAS' ? '#15803d' : '#64748b',
                cursor: 'pointer'
              }}
            >
              Entregadas ({selectedRuta.paradas.filter(p => p.estado === 'ENTREGADO').length})
            </button>
          </div>

          {/* Lista de Tarjetas de Parada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paradasFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                <CheckCircle2 className="w-10 h-10 text-green-500" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontWeight: 800 }}>¡No hay paradas en este filtro!</div>
              </div>
            ) : (
              paradasFiltradas.map(parada => (
                <ChoferCardParada
                  key={parada.id}
                  parada={parada}
                  onActualizarEstado={handleActualizarEstadoParada}
                  onSubirFoto={handleSubirFotoParada}
                  onEliminarFoto={handleEliminarFotoParada}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* 2. MODO TABLERO DEL OPERADOR (Lista de todas las rutas) */
        <>
          {/* Cabecera Principal */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Truck className="w-6 h-6 text-blue-600" /> 16. Rutas & Despacho Chofer (Última Milla)
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Arma los envíos del día sin depender del inventario previo, genera la hoja móvil con WhatsApp y llamadas para el chofer
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => loadRutas(filtroFecha)}
                className="btn"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
              </button>

              <button
                onClick={() => setIsBuilderOpen(true)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                }}
              >
                <Plus className="w-4 h-4" /> Armar Nueva Ruta
              </button>
            </div>
          </div>

          {/* Tarjetas Métricas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}
          >
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Rutas Registradas</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{totalRutas}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Total Paradas / Envíos</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb' }}>{totalParadasGlobal}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Paradas Entregadas</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a' }}>{totalEntregadasGlobal}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>Cumplimiento Global</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: porcentajeGlobal === 100 ? '#16a34a' : '#d97706' }}>
                {porcentajeGlobal}%
              </div>
            </div>
          </div>

          {/* Filtros de Búsqueda */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
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
                placeholder="Buscar por Nombre de ruta, Chofer, Placa o Código..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px'
                }}
              />
              {filtroFecha && (
                <button
                  onClick={() => setFiltroFecha('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  Ver todas
                </button>
              )}
            </div>
          </div>

          {/* Cuadrícula de Rutas */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando hojas de ruta...</div>
          ) : rutas.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              <Truck className="w-12 h-12 text-blue-300" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                No hay rutas registradas
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
                Crea tu primera hoja de ruta haciendo clic en &quot;Armar Nueva Ruta&quot; o pega paradas desde Excel.
              </p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Armar Nueva Ruta
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%'
              }}
            >
              {rutas.map((ruta, idx) => {
                const isCompletada = ruta.estado === 'COMPLETADO';
                const pct = ruta.totalParadas > 0 ? Math.round((ruta.paradasEntregadas / ruta.totalParadas) * 100) : 0;
                const paradasPendientes = Math.max(0, ruta.totalParadas - ruta.paradasEntregadas);
                const fechaCreacionTexto = formatFechaCreacion(ruta.creadoEn);

                return (
                  <div
                    key={ruta.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: isCompletada ? '5px solid #16a34a' : '5px solid #2563eb',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Badge destacado para la ruta más actual / reciente */}
                    {idx === 0 && !busqueda.trim() && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-9px',
                          left: '16px',
                          background: '#2563eb',
                          color: '#ffffff',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 4px rgba(37,99,235,0.25)'
                        }}
                      >
                        Más Reciente
                      </div>
                    )}

                    {/* Columna 1: Identificador, Estado, Nombre y Fecha */}
                    <div style={{ flex: '1 1 280px', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: '#2563eb',
                            background: '#eff6ff',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            border: '1px solid #dbeafe'
                          }}
                        >
                          {ruta.codigoRuta}
                        </span>

                        <span
                          style={{
                            background: isCompletada ? '#dcfce7' : '#fef3c7',
                            color: isCompletada ? '#15803d' : '#b45309',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isCompletada ? '#16a34a' : '#f59e0b'
                            }}
                          />
                          {isCompletada ? 'Completado' : 'En Ruta'}
                        </span>

                        {fechaCreacionTexto && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title={`Fecha de registro: ${ruta.creadoEn || ''}`}
                          >
                            <Clock className="w-3 h-3 text-slate-400" /> {fechaCreacionTexto}
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          margin: '3px 0 1px 0',
                          fontSize: '16.5px',
                          fontWeight: 800,
                          color: '#0f172a',
                          textTransform: 'capitalize'
                        }}
                      >
                        {ruta.nombreRuta}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Despacho: <strong style={{ color: '#334155' }}>{ruta.fechaDespacho}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          <strong style={{ color: '#0f172a' }}>{ruta.totalParadas}</strong> paradas / envíos
                        </span>
                      </div>
                    </div>

                    {/* Columna 2: Conductor & Vehículo */}
                    <div
                      style={{
                        flex: '1 1 200px',
                        minWidth: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        padding: '0 12px',
                        borderLeft: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Chofer / Repartidor
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                        <User className="w-4 h-4 text-blue-500 shrink-0" />
                        <strong style={{ color: '#0f172a' }}>{ruta.choferNombre}</strong>
                      </div>
                      {ruta.vehiculoPlaca && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Placa: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{ruta.vehiculoPlaca}</span>
                        </div>
                      )}
                    </div>

                    {/* Columna 3: Barra de Progreso y Métricas de Entrega */}
                    <div
                      style={{
                        flex: '1 1 230px',
                        minWidth: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        padding: '0 12px',
                        borderLeft: '1px solid #f1f5f9'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#475569' }}>Entregas Realizadas</span>
                        <strong style={{ color: isCompletada ? '#16a34a' : '#2563eb', fontSize: '12.5px' }}>
                          {ruta.paradasEntregadas} / {ruta.totalParadas} ({pct}%)
                        </strong>
                      </div>

                      <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: isCompletada ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                            width: `${pct}%`,
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {paradasPendientes === 0 ? '¡Todas entregadas!' : `${paradasPendientes} pendiente${paradasPendientes > 1 ? 's' : ''}`}
                        </span>
                        {isCompletada && (
                          <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 className="w-3 h-3" /> Completada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Columna 4: Botones de Acción */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        flex: '0 0 auto'
                      }}
                    >
                      {/* Botón Primario: Abrir Vista Chofer */}
                      <button
                        onClick={() => selectRuta(ruta.id, 'chofer')}
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '9px 15px',
                          fontSize: '12.5px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
                          transition: 'all 0.15s ease'
                        }}
                        title="Abrir hoja móvil interactiva con llamadas, WhatsApp y mapas"
                      >
                        <ExternalLink className="w-4 h-4" /> Abrir Vista Chofer
                      </button>

                      {/* Botón WhatsApp */}
                      <button
                        onClick={() => handleEnviarRutaWhatsApp(ruta)}
                        style={{
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(34,197,94,0.25)'
                        }}
                        title="Enviar enlace al WhatsApp del chofer"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
                      </button>

                      {/* Botón Copiar Enlace */}
                      <button
                        onClick={() => handleCopiarEnlaceChofer(ruta)}
                        style={{
                          background: copiedRutaId === ruta.id ? '#dcfce7' : '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: copiedRutaId === ruta.id ? '#15803d' : '#334155',
                          borderRadius: '8px',
                          padding: '9px 11px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        title="Copiar enlace público de la ruta"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {copiedRutaId === ruta.id ? '¡Copiado!' : 'Enlace'}
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la ruta "${ruta.nombreRuta}" y todas sus paradas?`)) {
                            handleEliminarRuta(ruta.id);
                          }
                        }}
                        style={{
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          color: '#ef4444',
                          borderRadius: '8px',
                          padding: '9px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar ruta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Constructor de Rutas */}
      <RutaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSaveRuta={handleCrearRuta}
      />
    </div>
  );
}
