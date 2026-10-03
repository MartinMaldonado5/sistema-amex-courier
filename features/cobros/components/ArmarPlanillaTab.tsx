'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Search,
  Layers,
  Box,
} from 'lucide-react';
import { parseInstructivo, type InstructivoParseResult } from '../services/instructivo-parser';
import { exportarPlanillaCobros, type FilaResultadoCobro } from '../services/planilla-exporter';

interface FuenteTibOpcion {
  id: string;
  nombre: string;
  enviado_key: string;
  fecha: string;
  origen: 'trabajo_inventario' | 'tib_diario';
}

type Fase = 'idle' | 'cruzando' | 'listo';
type FiltroEstado = 'todos' | 'multi' | 'sin-match';

export default function ArmarPlanillaTab() {
  const [fuentes, setFuentes] = useState<FuenteTibOpcion[]>([]);
  const [selectedEnviadoKey, setSelectedEnviadoKey] = useState<string>('');
  const [cargandoFuentes, setCargandoFuentes] = useState(true);
  const [instructivo, setInstructivo] = useState<InstructivoParseResult | null>(null);
  const [parseando, setParseando] = useState(false);
  const [fase, setFase] = useState<Fase>('idle');
  const [filas, setFilas] = useState<FilaResultadoCobro[]>([]);
  const [sinMatch, setSinMatch] = useState<string[]>([]);
  const [indiceCacheado, setIndiceCacheado] = useState<boolean | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('todos');
  const [error, setError] = useState('');

  const cargarFuentes = useCallback(async () => {
    try {
      setCargandoFuentes(true);
      const res = await fetch('/api/cobros/ultimo-enviado').then((r) => r.json());
      if (res.error) throw new Error(res.error);
      const list: FuenteTibOpcion[] = res.fuentes_disponibles || [];
      setFuentes(list);
      if (list.length > 0 && !selectedEnviadoKey) {
        setSelectedEnviadoKey(list[0].enviado_key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer las fuentes TIB disponibles.');
    } finally {
      setCargandoFuentes(false);
    }
  }, [selectedEnviadoKey]);

  useEffect(() => {
    void cargarFuentes();
  }, [cargarFuentes]);

  const procesarArchivo = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError(`"${file.name}" no es un archivo .xlsx válido.`);
      return;
    }
    try {
      setError('');
      setParseando(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseInstructivo(buffer, file.name);
      setInstructivo(parsed);
      setFase('idle');
      setFilas([]);
      setSinMatch([]);
      setIndiceCacheado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el instructivo.');
    } finally {
      setParseando(false);
    }
  };

  const cruzar = async () => {
    if (!instructivo || instructivo.filas.length === 0) {
      setError('Sube primero el instructivo de embarque.');
      return;
    }
    if (!selectedEnviadoKey) {
      setError('Selecciona una fuente ENVIADO TIB para realizar el cruce.');
      return;
    }
    try {
      setError('');
      setFase('cruzando');
      const res = await fetch('/api/cobros/cruzar-planilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filas: instructivo.filas,
          enviado_key: selectedEnviadoKey,
        }),
      }).then((r) => r.json());

      if (res.error) throw new Error(res.error);

      const ordenadas: FilaResultadoCobro[] = (res.filas || []).sort(
        (a: FilaResultadoCobro, b: FilaResultadoCobro) =>
          (a.cliente || 'ZZZ').localeCompare(b.cliente || 'ZZZ', 'es') || a.wr.localeCompare(b.wr)
      );

      setFilas(ordenadas);
      setSinMatch(res.sin_match || []);
      setIndiceCacheado(res.indice_cacheado ?? null);
      setFase('listo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cruzar el instructivo.');
      setFase('idle');
    }
  };

  const actualizarFila = (wr: string, patch: Partial<FilaResultadoCobro>) => {
    setFilas((prev) => prev.map((f) => (f.wr === wr ? { ...f, ...patch } : f)));
  };

  const descargar = async () => {
    try {
      setError('');
      setDescargando(true);
      const base = (instructivo?.fileName || 'embarque').replace(/\.xlsx$/i, '');
      await exportarPlanillaCobros(filas, `PLANILLA COBROS ${base}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la planilla Excel.');
    } finally {
      setDescargando(false);
    }
  };

  const limpiar = () => {
    setInstructivo(null);
    setFilas([]);
    setSinMatch([]);
    setIndiceCacheado(null);
    setFase('idle');
    setBusqueda('');
    setFiltro('todos');
    setError('');
  };

  const stats = useMemo(() => {
    const ok = filas.filter((f) => f.encontrado);
    const clientes = new Set(ok.map((f) => (f.cliente || 'SIN CLIENTE').toUpperCase()));
    const pesoAcumulado = ok.reduce((s, f) => s + (f.pesoTotal || 0), 0);
    const multiCount = filas.filter((f) => f.esMultiWr).length;
    const totalWrs = filas.reduce((s, f) => s + (f.totalWrsFila || 1), 0);

    return {
      totalFilas: filas.length,
      totalWrs,
      conMatch: ok.length,
      multiCount,
      clientes: clientes.size,
      peso: Math.round(pesoAcumulado * 100) / 100,
    };
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      if (filtro === 'multi' && !f.esMultiWr) return false;
      if (filtro === 'sin-match' && f.encontrado) return false;

      if (!busqueda) return true;
      const q = busqueda.toLowerCase().trim();
      return (
        f.wr.toLowerCase().includes(q) ||
        f.cliente.toLowerCase().includes(q) ||
        f.tracking.toLowerCase().includes(q) ||
        f.observaciones.toLowerCase().includes(q)
      );
    });
  }, [filas, filtro, busqueda]);

  const inputCell: React.CSSProperties = {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 8px',
    fontSize: '12.5px',
    boxSizing: 'border-box',
    background: '#ffffff',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Banner: Selector de Fuente TIB */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <FileSpreadsheet style={{ width: '22px', height: '22px', color: '#16a34a', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Motor de Procesamiento VPS Hostinger:</span>
            {cargandoFuentes ? (
              <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Conectando…</span>
            ) : fuentes.length > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                En Línea (0ms latencia)
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b91c1c',
                  background: '#fee2e2',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Desconectado
              </span>
            )}
          </div>

          {cargandoFuentes ? (
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '3px' }}>
              Consultando archivo activo en el VPS…
            </span>
          ) : fuentes.length > 0 ? (
            <div style={{ marginTop: '3px', fontSize: '12.5px', color: '#334155' }}>
              Archivo activo en disco local SSD: <strong style={{ color: '#0369a1' }}>{fuentes[0].nombre.replace(/^⚡\s*/, '')}</strong>
            </div>
          ) : (
            <span style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 600, display: 'block', marginTop: '3px' }}>
              No se pudo conectar al VPS. Verifica que el worker esté activo en el puerto 10000.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => void cargarFuentes()}
          style={{
            marginLeft: 'auto',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#334155',
          }}
        >
          <RefreshCw style={{ width: '13px', height: '13px' }} /> Actualizar Fuentes
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Paso 1: Subida de Instructivo */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <strong style={{ fontSize: '15px', color: '#0f172a' }}>1. Sube el Instructivo de Embarque (.xlsx)</strong>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Se mantendrán en la misma fila las celdas con WRs agrupados con guiones o barras (ej: <code>WR0001-WR0002</code>), cruzando automáticamente sus pesos y trackings.
          </p>
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '2px dashed #cbd5e1',
            borderRadius: '10px',
            padding: '16px',
            fontSize: '13.5px',
            cursor: 'pointer',
            background: instructivo ? '#f0fdf4' : '#f8fafc',
            borderColor: instructivo ? '#86efac' : '#cbd5e1',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload style={{ width: '20px', height: '20px', color: instructivo ? '#16a34a' : '#64748b' }} />
          <span style={{ flex: 1, color: instructivo ? '#166534' : '#475569', fontWeight: instructivo ? 700 : 500 }}>
            {parseando
              ? 'Leyendo y analizando instructivo…'
              : instructivo
              ? `${instructivo.fileName} — Listo para armar planilla`
              : 'Seleccionar archivo INSTRUCTIVO DE EMBARQUE (.xlsx)…'}
          </span>
          <input
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={(e) => void procesarArchivo(e.target.files?.[0])}
          />
        </label>

        {instructivo && (
          <div
            style={{
              display: 'flex',
              gap: '14px',
              flexWrap: 'wrap',
              fontSize: '12.5px',
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
              <CheckCircle2 style={{ width: '15px', height: '15px', color: '#16a34a' }} />
              <strong>{instructivo.totalFilas}</strong> filas detectadas
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb' }}>
              <Box style={{ width: '15px', height: '15px' }} />
              <strong>{instructivo.totalWrsIndividuales}</strong> paquetes WR totales
            </span>
            {instructivo.celdasMultiWR > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 800,
                }}
              >
                <Layers style={{ width: '14px', height: '14px' }} />
                {instructivo.celdasMultiWR} celdas agrupadas (multi-WR sin separar)
              </span>
            )}
          </div>
        )}

        {/* Paso 2: Botón de cruce */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => void cruzar()}
            disabled={!instructivo || fase === 'cruzando'}
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 900,
              cursor: !instructivo || fase === 'cruzando' ? 'not-allowed' : 'pointer',
              opacity: !instructivo || fase === 'cruzando' ? 0.6 : 1,
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {fase === 'cruzando' ? (
              <>
                <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Cruzando datos con el TIB…
              </>
            ) : (
              '2. Armar tabla y cruzar con TIB'
            )}
          </button>

          {(instructivo || filas.length > 0) && (
            <button
              type="button"
              onClick={limpiar}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#475569',
              }}
            >
              <Eraser style={{ width: '15px', height: '15px' }} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Alerta de WRs sin match */}
      {fase === 'listo' && sinMatch.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '14px 18px',
            fontSize: '13px',
            color: '#92400e',
          }}
        >
          <strong>
            <AlertTriangle style={{ width: '15px', height: '15px', display: 'inline', verticalAlign: '-2px' }} />{' '}
            {sinMatch.length} WRs no encontrados en el archivo ENVIADO
          </strong>{' '}
          (puedes completar sus datos o pesos manualmente en la tabla):
          <div
            style={{
              marginTop: '6px',
              fontFamily: 'monospace',
              fontSize: '12px',
              background: '#fef3c7',
              padding: '6px 10px',
              borderRadius: '6px',
            }}
          >
            {sinMatch.join(' · ')}
          </div>
        </div>
      )}

      {/* Paso 3: Previsualización, Filtros y Descarga */}
      {fase === 'listo' && filas.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          {/* Cabecera de estadísticas y descarga */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '14px',
            }}
          >
            <div>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                3. Planilla Armada — {stats.totalFilas} Filas ({stats.totalWrs} WRs Totales)
              </strong>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12.5px', color: '#64748b' }}>
                <span>
                  Clientes: <strong>{stats.clientes}</strong>
                </span>
                <span>·</span>
                <span>
                  Peso Total Acumulado: <strong>{stats.peso} lb</strong>
                </span>
                <span>·</span>
                <span>
                  Agrupados Multi-WR: <strong style={{ color: '#d97706' }}>{stats.multiCount}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void descargar()}
              disabled={descargando}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '11px 24px',
                fontSize: '13.5px',
                fontWeight: 900,
                cursor: descargando ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: descargando ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              {descargando ? 'Generando Excel…' : 'Descargar Planilla Excel (.xlsx)'}
            </button>
          </div>

          {/* Barra de herramientas: Búsqueda y Filtros */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <Search
                style={{
                  width: '15px',
                  height: '15px',
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                placeholder="Buscar por WR, cliente, tracking o casillero…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...inputCell, paddingLeft: '32px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(
                [
                  { key: 'todos', label: `Todos (${filas.length})` },
                  { key: 'multi', label: `Agrupados Multi-WR (${stats.multiCount})` },
                  { key: 'sin-match', label: `Sin Match (${sinMatch.length})` },
                ] as Array<{ key: FiltroEstado; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFiltro(tab.key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: filtro === tab.key ? '1px solid #059669' : '1px solid #e2e8f0',
                    background: filtro === tab.key ? '#ecfdf5' : '#ffffff',
                    color: filtro === tab.key ? '#047857' : '#64748b',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', width: '40px' }}>#</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', minWidth: '220px' }}>NOMBRE (CLIENTE)</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', minWidth: '150px' }}>PESO (lb)</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', minWidth: '220px' }}>CODIGO WAREHOUSE (WR)</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', minWidth: '220px' }}>TRACKING USA</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', width: '110px' }}>TIPO</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase', minWidth: '140px' }}>CASILLERO / OBS</th>
                </tr>
              </thead>
              <tbody>
                {filasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No hay registros que coincidan con el filtro aplicado.
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((f, idx) => (
                    <tr
                      key={f.wr}
                      style={{
                        background: f.encontrado
                          ? f.esMultiWr
                            ? '#fffbeb'
                            : idx % 2 === 0
                            ? '#ffffff'
                            : '#f8fafc'
                          : '#fef2f2',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: '#94a3b8', fontSize: '11px', textAlign: 'center' }}>
                        {idx + 1}
                      </td>

                      {/* Nombre Cliente */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={f.cliente}
                          onChange={(e) => actualizarFila(f.wr, { cliente: e.target.value.toUpperCase() })}
                          style={{
                            ...inputCell,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}
                          placeholder="Nombre del cliente…"
                        />
                      </td>

                      {/* Peso (unificado o individual) */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={f.pesoFormateado}
                          onChange={(e) => {
                            const val = e.target.value;
                            actualizarFila(f.wr, {
                              pesoFormateado: val,
                              pesoTotal: f.esMultiWr
                                ? val
                                    .split(/[\/\-,]+/)
                                    .map((p) => parseFloat(p.trim()))
                                    .filter((n) => !isNaN(n))
                                    .reduce((a, b) => a + b, 0)
                                : parseFloat(val) || null,
                            });
                          }}
                          style={{
                            ...inputCell,
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            color: '#047857',
                          }}
                        />
                      </td>

                      {/* Celda WR (Exacta del instructivo, sin desglosar) */}
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#1e293b' }}>{f.wr}</span>
                          {f.esMultiWr && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontSize: '10.5px',
                                fontWeight: 800,
                              }}
                            >
                              {f.totalWrsFila} WRs
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tracking USA */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={f.tracking}
                          onChange={(e) => actualizarFila(f.wr, { tracking: e.target.value })}
                          style={{
                            ...inputCell,
                            fontFamily: 'monospace',
                            fontSize: '11.5px',
                          }}
                          placeholder="Tracking…"
                        />
                      </td>

                      {/* Tipo de paquete */}
                      <td style={{ padding: '8px 10px', color: '#475569', fontWeight: 600, fontSize: '11.5px' }}>
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          {f.tipo || 'CAJA'}
                        </span>
                      </td>

                      {/* Casillero / Observaciones */}
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          value={f.observaciones}
                          onChange={(e) => actualizarFila(f.wr, { observaciones: e.target.value })}
                          style={{ ...inputCell, color: '#475569' }}
                          placeholder="Casillero…"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
