'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type FuenteKey = 'delivered' | 'sent' | 'received';

interface Job {
  id: string;
  estado: string;
  etapa: string;
  mensaje: string;
  progreso: number;
  fuentes: string[];
  resultado_key: string | null;
  csv_key: string | null;
  total_guias: number | null;
  coincidencias: number | null;
  sin_coincidencia: number | null;
  segundos: number | null;
  creado_en: string;
  terminado_en: string | null;
  sincronizar_db?: boolean;
  db_sincronizado?: boolean;
  db_actualizados?: number;
  db_sincronizado_en?: string | null;
}

const FUENTES: Array<{ key: FuenteKey; label: string; file: string }> = [
  { key: 'delivered', label: 'ENTREGADO TIB', file: 'ENTREGADO TIB.xlsx' },
  { key: 'sent', label: 'ENVIADO TIB', file: 'ENVIADO TIB.xlsx' },
  { key: 'received', label: 'RECIBIDO TIB', file: 'RECIBIDO TIB.xlsx' },
];

const MAX_BYTES = 100 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`R2 respondió ${xhr.status}.`));
    };
    xhr.onerror = () => reject(new Error('Error de red subiendo a R2.'));
    xhr.send(file);
  });
}

interface TibFileInfo {
  id?: string;
  tipo: FuenteKey;
  r2_key: string;
  nombre_archivo: string;
  peso_bytes: number;
  subido_en: string;
  subido_por_nombre: string;
}

interface TibState {
  fecha: string;
  fechaHoy: string;
  isToday: boolean;
  isComplete: boolean;
  files: Record<FuenteKey, TibFileInfo | null>;
}

export default function InventarioJobsTab() {
  const [files, setFiles] = useState<Record<string, File | null>>({
    inventory: null,
    delivered: null,
    sent: null,
    received: null,
  });
  const [fuentesActivas, setFuentesActivas] = useState<Record<FuenteKey, boolean>>({
    delivered: true,
    sent: true,
    received: true,
  });
  const [uploadPct, setUploadPct] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'queued' | 'processing' | 'done' | 'error'>('idle');
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Job[]>([]);
  const [origenInventario, setOrigenInventario] = useState<'db' | 'file'>('db');
  const [modoTib, setModoTib] = useState<'diario' | 'manual'>('diario');
  const [tibState, setTibState] = useState<TibState | null>(null);
  const [uploadingTib, setUploadingTib] = useState<Record<string, boolean>>({});
  const [tibUploadPct, setTibUploadPct] = useState<Record<string, number>>({});
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'todos'>('activos');
  const [dbStats, setDbStats] = useState<{ activos: number; todos: number }>({ activos: 0, todos: 0 });
  const [autoSyncDb, setAutoSyncDb] = useState(true);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncDbMessage, setSyncDbMessage] = useState<string | null>(null);
  const autoSyncedRef = useRef<Record<string, boolean>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadTibState = useCallback(async () => {
    try {
      const res = await fetch('/api/inventario-tib');
      const data = await res.json();
      if (data.files) setTibState(data);
    } catch {
      /* opcional */
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventario-jobs');
      const data = await res.json();
      if (data.jobs) setHistory(data.jobs);
      if (data.dbStats) setDbStats(data.dbStats);
      void loadTibState();
    } catch {
      /* historial opcional */
    }
  }, [loadTibState]);

  const handleSyncDb = useCallback(async (targetJobId?: string) => {
    const idToSync = targetJobId || job?.id;
    if (!idToSync) return;
    setIsSyncingDb(true);
    setSyncDbMessage(null);
    try {
      const res = await fetch(`/api/inventario-jobs/${idToSync}/sync-db`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al sincronizar con la base de datos.');
      }
      setSyncDbMessage(data.message || `✓ Sincronizado: ${data.updatedCount ?? 0} paquetes actualizados.`);
      const detail = await fetch(`/api/inventario-jobs/${idToSync}`).then((r) => r.json());
      if (detail.job) {
        setJob(detail.job);
      }
      void loadHistory();
    } catch (err: unknown) {
      setSyncDbMessage(`Error: ${err instanceof Error ? err.message : 'No se pudo sincronizar'}`);
    } finally {
      setIsSyncingDb(false);
    }
  }, [job?.id, loadHistory]);

  // Disparar sincronización automática a DB cuando el job concluye exitosamente
  useEffect(() => {
    if (job?.estado === 'done' && job.sincronizar_db && !job.db_sincronizado && !autoSyncedRef.current[job.id]) {
      autoSyncedRef.current[job.id] = true;
      void handleSyncDb(job.id);
    }
  }, [job?.estado, job?.sincronizar_db, job?.db_sincronizado, job?.id, handleSyncDb]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Suscripción Realtime + polling de respaldo al estado del job
  useEffect(() => {
    if (!job || job.estado === 'done' || job.estado === 'error') return;

    const channel = supabase
      .channel(`inventario-job-${job.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventario_jobs',
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          const updated = payload.new as Job;
          setJob(updated);
          if (updated.estado === 'done' || updated.estado === 'error') {
            setPhase(updated.estado);
            stopPolling();
            void loadHistory();
          } else {
            setPhase('processing');
          }
        }
      )
      .subscribe();

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/inventario-jobs/${job.id}`);
        const data = await res.json();
        if (data.job) {
          setJob(data.job);
          if (data.job.estado === 'done' || data.job.estado === 'error') {
            setPhase(data.job.estado);
            stopPolling();
            void loadHistory();
          } else {
            setPhase('processing');
          }
        }
      } catch {
        /* reintenta en el siguiente ciclo */
      }
    }, 1500);

    return () => {
      supabase.removeChannel(channel);
      stopPolling();
    };
  }, [job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickFile = (slot: string, file: File | null) => {
    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
      setError(`"${file.name}" no es .xlsx.`);
      return;
    }
    if (file && file.size > MAX_BYTES) {
      setError(`"${file.name}" supera los 100 MB.`);
      return;
    }
    setError('');
    setFiles((prev) => ({ ...prev, [slot]: file }));
  };

  const handleUploadDailyTib = async (slot: FuenteKey, file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError(`"${file.name}" debe ser formato .xlsx.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`"${file.name}" supera los 100 MB.`);
      return;
    }

    setUploadingTib((p) => ({ ...p, [slot]: true }));
    setTibUploadPct((p) => ({ ...p, [slot]: 0 }));
    setError('');

    try {
      const presign = await fetch('/api/inventario-jobs/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, filename: file.name, isDailyTib: true }),
      }).then((r) => r.json());

      if (!presign.uploadUrl) throw new Error(presign.error || `No se pudo preparar la subida para ${slot}.`);

      await uploadWithProgress(presign.uploadUrl, file, (pct) =>
        setTibUploadPct((p) => ({ ...p, [slot]: pct }))
      );

      const confirmRes = await fetch('/api/inventario-tib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: slot,
          r2_key: presign.key,
          nombre_archivo: file.name,
          peso_bytes: file.size,
        }),
      }).then((r) => r.json());

      if (!confirmRes.ok) throw new Error(confirmRes.error || 'No se pudo registrar en base de datos.');
      await loadTibState();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir reporte TIB diario.');
    } finally {
      setUploadingTib((p) => ({ ...p, [slot]: false }));
    }
  };

  const handleProcess = async () => {
    try {
      setError('');
      const activas = (Object.keys(fuentesActivas) as FuenteKey[]).filter((k) => fuentesActivas[k]);
      if (activas.length === 0) {
        setError('Activa al menos una fuente TIB (Entregado, Enviado o Recibido).');
        return;
      }
      if (origenInventario === 'file' && !files.inventory) {
        setError('Selecciona el inventario AMEX (.xlsx) para el modo manual.');
        return;
      }

      // Si usamos el modo de TIB diario guardado
      if (modoTib === 'diario') {
        for (const f of activas) {
          if (!tibState?.files[f]) {
            setError(`Falta el archivo guardado para: ${FUENTES.find((x) => x.key === f)?.label}. Puedes cargarlo arriba.`);
            return;
          }
        }

        let manualInvKey: string | undefined = undefined;
        if (origenInventario === 'file' && files.inventory) {
          setPhase('uploading');
          const presign = await fetch('/api/inventario-jobs/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot: 'inventory', filename: files.inventory.name }),
          }).then((r) => r.json());
          if (!presign.uploadUrl) throw new Error(presign.error || 'No se pudo subir inventario manual.');
          await uploadWithProgress(presign.uploadUrl, files.inventory, (pct) =>
            setUploadPct((prev) => ({ ...prev, inventory: pct }))
          );
          manualInvKey = presign.key;
        }

        setPhase('queued');
        const res = await fetch('/api/inventario-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usar_tib_diario: true,
            origen_inventario: origenInventario,
            filtro_estado: filtroEstado,
            inventario_key: manualInvKey,
            fuentes: activas,
            user_nombre: 'Operador AMEX',
            sincronizar_db: autoSyncDb,
          }),
        }).then((r) => r.json());

        if (!res.id) throw new Error(res.error || 'No se pudo encolar el trabajo.');
        const detail = await fetch(`/api/inventario-jobs/${res.id}`).then((r) => r.json());
        setJob(detail.job);
        setPhase('processing');
        return;
      }

      for (const f of activas) {
        if (!files[f]) {
          setError(`Falta adjuntar el archivo: ${FUENTES.find((x) => x.key === f)?.file}.`);
          return;
        }
      }

      setPhase('uploading');
      setUploadPct({});
      const keys: Record<string, string> = {};

      // 1. Subida directa a R2 con URL presignada en PARALELO
      const slots = origenInventario === 'file' ? ['inventory', ...activas] : [...activas];
      await Promise.all(
        slots.map(async (slot) => {
          const file = files[slot];
          if (!file) return;
          const presign = await fetch('/api/inventario-jobs/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot, filename: file.name }),
          }).then((r) => r.json());
          if (!presign.uploadUrl) throw new Error(presign.error || `No se pudo preparar la subida para ${slot}.`);
          await uploadWithProgress(presign.uploadUrl, file, (pct) =>
            setUploadPct((prev) => ({ ...prev, [slot]: pct }))
          );
          keys[slot] = presign.key;
        })
      );

      // 2. Encolar trabajo
      setPhase('queued');
      const res = await fetch('/api/inventario-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen_inventario: origenInventario,
          filtro_estado: filtroEstado,
          inventario_key: origenInventario === 'file' ? keys.inventory : undefined,
          entregado_key: keys.delivered,
          enviado_key: keys.sent,
          recibido_key: keys.received,
          fuentes: activas,
          user_nombre: 'Operador AMEX',
          sincronizar_db: autoSyncDb,
        }),
      }).then((r) => r.json());
      if (!res.id) throw new Error(res.error || 'No se pudo encolar el trabajo.');

      const detail = await fetch(`/api/inventario-jobs/${res.id}`).then((r) => r.json());
      setJob(detail.job);
      setPhase('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.');
      setPhase('error');
    }
  };

  const reset = () => {
    stopPolling();
    setJob(null);
    setPhase('idle');
    setUploadPct({});
    setError('');
    setSyncDbMessage(null);
  };

  const activeJob = job && (phase === 'processing' || phase === 'queued' || phase === 'done' || phase === 'error');
  const pct = job?.progreso ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="fa-solid fa-file-excel" style={{ fontSize: '22px', color: '#16a34a' }}></i>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
            Completar Inventario con TIB
          </h2>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
            Cruza tu inventario con los reportes TIB en la nube. Puedes seguir trabajando mientras se procesa.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600 }}>
          <i className="fa-solid fa-triangle-exclamation"></i> {error}
        </div>
      )}

      {!activeJob && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector de Modo: Base de Datos vs Archivo Manual */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '5px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setOrigenInventario('db')}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                background: origenInventario === 'db' ? '#ffffff' : 'transparent',
                color: origenInventario === 'db' ? '#0f172a' : '#64748b',
                fontWeight: origenInventario === 'db' ? 800 : 600,
                fontSize: '13px',
                boxShadow: origenInventario === 'db' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-database" style={{ color: origenInventario === 'db' ? '#16a34a' : '#94a3b8' }}></i>
              Cruzar con Base de Datos AMEX (Recomendado)
            </button>

            <button
              type="button"
              onClick={() => setOrigenInventario('file')}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: 'none',
                borderRadius: '8px',
                background: origenInventario === 'file' ? '#ffffff' : 'transparent',
                color: origenInventario === 'file' ? '#0f172a' : '#64748b',
                fontWeight: origenInventario === 'file' ? 800 : 600,
                fontSize: '13px',
                boxShadow: origenInventario === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <i className="fa-solid fa-file-excel" style={{ color: origenInventario === 'file' ? '#0284c7' : '#94a3b8' }}></i>
              Subir Archivo Excel Manual
            </button>
          </div>

          {/* Panel Informativo si el origen es la Base de Datos */}
          {origenInventario === 'db' ? (
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  <i className="fa-solid fa-boxes-stacked"></i>
                </div>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#166534', display: 'block' }}>
                    Inventario Activo Conectado ({filtroEstado === 'activos' ? dbStats.activos : dbStats.todos} paquetes listos)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#15803d' }}>
                    No necesitas subir ningún Excel de inventario. El sistema cruzará directamente los paquetes de la base de datos.
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('activos')}
                  style={{
                    background: filtroEstado === 'activos' ? '#16a34a' : '#ffffff',
                    color: filtroEstado === 'activos' ? '#ffffff' : '#166534',
                    border: `1.5px solid ${filtroEstado === 'activos' ? '#16a34a' : '#86efac'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Activos en almacén ({dbStats.activos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('todos')}
                  style={{
                    background: filtroEstado === 'todos' ? '#16a34a' : '#ffffff',
                    color: filtroEstado === 'todos' ? '#ffffff' : '#166534',
                    border: `1.5px solid ${filtroEstado === 'todos' ? '#16a34a' : '#86efac'}`,
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Todos ({dbStats.todos})
                </button>
              </div>
            </div>
          ) : (
            <FileRow
              label="1. Inventario AMEX (.xlsx) — obligatorio en modo manual"
              file={files.inventory}
              onPick={(f) => pickFile('inventory', f)}
              pct={uploadPct.inventory}
            />
          )}

          {/* Selector de Modo TIB: Guardados del Día vs Manuales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-cloud" style={{ color: '#0284c7' }}></i>
                Origen de los Reportes TIB:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModoTib('diario')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: modoTib === 'diario' ? '#2563eb' : '#ffffff',
                    color: modoTib === 'diario' ? '#ffffff' : '#64748b',
                    boxShadow: modoTib === 'diario' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: modoTib === 'diario' ? '#2563eb' : '#cbd5e1',
                  }}
                >
                  ⚡ Archivos Guardados del Día (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setModoTib('manual')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: modoTib === 'manual' ? '#2563eb' : '#ffffff',
                    color: modoTib === 'manual' ? '#ffffff' : '#64748b',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: modoTib === 'manual' ? '#2563eb' : '#cbd5e1',
                  }}
                >
                  📁 Adjuntar Manualmente
                </button>
              </div>
            </div>

            {/* MODO 1: Repositorio de Archivos TIB Activos del Día */}
            {modoTib === 'diario' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    Archivos vigentes para la fecha operativa: <strong>{tibState?.fecha || 'Hoy'}</strong>
                  </span>
                  {tibState && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: tibState.isComplete ? '#dcfce7' : '#fef3c7',
                        color: tibState.isComplete ? '#15803d' : '#b45309',
                      }}
                    >
                      {tibState.isComplete ? '✓ Reportes Completos (3/3)' : 'Carga parcial'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  {FUENTES.map((f) => {
                    const fileData = tibState?.files[f.key];
                    const isUp = uploadingTib[f.key];
                    const pct = tibUploadPct[f.key] || 0;

                    return (
                      <div
                        key={f.key}
                        style={{
                          background: '#ffffff',
                          border: fileData ? '1.5px solid #86efac' : '1.5px dashed #cbd5e1',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={fuentesActivas[f.key]}
                              onChange={() => setFuentesActivas((p) => ({ ...p, [f.key]: !p[f.key] }))}
                            />
                            {f.label}
                          </label>
                          {fileData ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="fa-solid fa-circle-check"></i> Activo
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706' }}>Pendiente</span>
                          )}
                        </div>

                        {fileData ? (
                          <div style={{ fontSize: '11.5px', color: '#334155' }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={fileData.nombre_archivo}>
                              {fileData.nombre_archivo}
                            </div>
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                              {formatBytes(fileData.peso_bytes)} • {fileData.subido_en ? new Date(fileData.subido_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Archivo esperado: <code>{f.file}</code>
                          </div>
                        )}

                        <label
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#2563eb',
                            cursor: isUp || phase === 'uploading' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <i className="fa-solid fa-upload"></i>
                          <span>{isUp ? `Subiendo ${pct}%...` : fileData ? 'Reemplazar archivo' : 'Subir archivo'}</span>
                          <input
                            type="file"
                            accept=".xlsx"
                            disabled={isUp || phase === 'uploading'}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const picked = e.target.files?.[0];
                              if (picked) void handleUploadDailyTib(f.key, picked);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* MODO 2: Subida Manual Tradicional */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FUENTES.map((f, i) => (
                  <div key={f.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0f172a', minWidth: '170px', paddingTop: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={fuentesActivas[f.key]}
                        onChange={() => setFuentesActivas((p) => ({ ...p, [f.key]: !p[f.key] }))}
                      />
                      {i + 1}. {f.label}
                    </label>
                    <div style={{ flex: 1, opacity: fuentesActivas[f.key] ? 1 : 0.4 }}>
                      <FileRow
                        label={f.file}
                        file={files[f.key]}
                        disabled={!fuentesActivas[f.key]}
                        onPick={(file) => pickFile(f.key, file)}
                        pct={uploadPct[f.key]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleProcess}
            disabled={phase === 'uploading' || phase === 'queued'}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px',
              fontSize: '14.5px',
              fontWeight: 900,
              cursor: 'pointer',
              opacity: phase === 'uploading' || phase === 'queued' ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
            }}
          >
            <i className={phase === 'uploading' ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-bolt"}></i>
            {phase === 'uploading'
              ? 'Subiendo reportes TIB a la nube…'
              : phase === 'queued'
              ? 'Encolando cruce…'
              : modoTib === 'diario' && origenInventario === 'db'
              ? `⚡ Iniciar Cruce con Worker Hostinger (${filtroEstado === 'activos' ? dbStats.activos : dbStats.todos} paquetes BD)`
              : origenInventario === 'db'
              ? `Cruzar ${filtroEstado === 'activos' ? dbStats.activos : dbStats.todos} paquetes de la BD con TIB`
              : 'Completar inventario en la nube'}
          </button>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
            Los resultados actualizarán clientes, trackings, pesos y estados directamente en el sistema. Límite 100 MB por reporte TIB.
          </p>
        </div>
      )}

      {activeJob && job && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>
              <i className="fa-solid fa-gear fa-spin" style={{ display: job.estado === 'done' || job.estado === 'error' ? 'none' : undefined }}></i>{' '}
              {job.estado === 'done' ? 'Completado' : job.estado === 'error' ? 'Falló' : 'Procesando en la nube'}
            </strong>
            <button type="button" onClick={reset} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Nuevo trabajo
            </button>
          </div>

          <div style={{ background: '#f1f5f9', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: job.estado === 'error' ? '#ef4444' : 'linear-gradient(90deg, #16a34a, #4ade80)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
            {pct}% · {job.etapa} — {job.mensaje}
          </p>

          {job.estado === 'done' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>
                {job.coincidencias ?? 0}/{job.total_guias ?? 0} guías completadas
                {job.sin_coincidencia ? ` · ${job.sin_coincidencia} sin coincidencia` : ''}
                {job.segundos ? ` · ${job.segundos}s de proceso` : ''}
              </span>

              {/* Tarjeta de Sincronización Directa a Base de Datos */}
              <div
                style={{
                  background: job.db_sincronizado ? '#ecfdf5' : '#ffffff',
                  border: `1.5px solid ${job.db_sincronizado ? '#a7f3d0' : '#bae6fd'}`,
                  borderRadius: '9px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i
                    className={job.db_sincronizado ? 'fa-solid fa-circle-check' : 'fa-solid fa-database'}
                    style={{ fontSize: '20px', color: job.db_sincronizado ? '#059669' : '#0284c7' }}
                  ></i>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      {job.db_sincronizado
                        ? `✓ Base de Datos sincronizada (${job.db_actualizados ?? 0} paquetes actualizados)`
                        : 'Cruzar directamente a la Base de Datos Master'}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {job.db_sincronizado
                        ? `Sincronizado exitosamente en ${job.db_sincronizado_en ? new Date(job.db_sincronizado_en).toLocaleTimeString() : 'la nube'}. La data ya está activa en Amex Courier.`
                        : 'Inyecta y actualiza clientes, trackings, pesos y estados en la base de datos oficial.'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSyncDb(job.id)}
                  disabled={isSyncingDb}
                  style={{
                    background: job.db_sincronizado ? '#f8fafc' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    color: job.db_sincronizado ? '#0284c7' : '#fff',
                    border: job.db_sincronizado ? '1px solid #cbd5e1' : 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: isSyncingDb ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <i className={isSyncingDb ? 'fa-solid fa-spinner fa-spin' : job.db_sincronizado ? 'fa-solid fa-arrows-rotate' : 'fa-solid fa-bolt'}></i>
                  {isSyncingDb ? 'Sincronizando…' : job.db_sincronizado ? 'Re-sincronizar BD' : 'Sincronizar a BD Ahora'}
                </button>
              </div>

              {syncDbMessage && (
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: syncDbMessage.startsWith('Error') ? '#b91c1c' : '#15803d',
                    background: syncDbMessage.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${syncDbMessage.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                  }}
                >
                  {syncDbMessage}
                </div>
              )}

              {/* Botones de Descarga */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {job.resultado_key && (
                  <a
                    href={`/api/storage/file?key=${encodeURIComponent(job.resultado_key)}`}
                    style={{ background: '#16a34a', color: '#fff', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-download"></i> Descargar Excel
                  </a>
                )}
                {job.csv_key && (
                  <a
                    href={`/api/storage/file?key=${encodeURIComponent(job.csv_key)}`}
                    style={{ background: '#fff', color: '#166534', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 800, textDecoration: 'none' }}
                  >
                    <i className="fa-solid fa-file-csv"></i> Guías sin coincidencia (CSV)
                  </a>
                )}
              </div>
            </div>
          )}

          {job.estado === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#b91c1c' }}>
              {job.mensaje}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
            <i className="fa-solid fa-clock-rotate-left"></i> Historial reciente
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map((h) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', flexWrap: 'wrap' }}>
                <EstadoBadge estado={h.estado} />
                <span style={{ color: '#475569' }}>
                  {h.coincidencias != null ? `${h.coincidencias}/${h.total_guias ?? '?'} guías` : h.mensaje}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>
                  {new Date(h.creado_en).toLocaleString()}
                </span>
                {h.db_sincronizado ? (
                  <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 800 }}>
                    <i className="fa-solid fa-circle-check"></i> BD ({h.db_actualizados ?? 0})
                  </span>
                ) : h.estado === 'done' ? (
                  <button
                    type="button"
                    onClick={() => handleSyncDb(h.id)}
                    disabled={isSyncingDb}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    <i className="fa-solid fa-bolt"></i> Sincronizar BD
                  </button>
                ) : null}
                {h.resultado_key && (
                  <a href={`/api/storage/file?key=${encodeURIComponent(h.resultado_key)}`} style={{ color: '#16a34a', fontWeight: 800 }}>
                    <i className="fa-solid fa-download"></i> Excel
                  </a>
                )}
                {h.csv_key && (
                  <a href={`/api/storage/file?key=${encodeURIComponent(h.csv_key)}`} style={{ color: '#b45309', fontWeight: 800 }}>
                    <i className="fa-solid fa-file-csv"></i> CSV
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileRow({ label, file, onPick, disabled, pct }: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
  disabled?: boolean;
  pct?: number;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1.5px dashed #cbd5e1',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: file ? '#f0fdf4' : '#f8fafc',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <i className="fa-solid fa-file-excel" style={{ color: '#16a34a' }}></i>
      <span style={{ flex: 1, color: file ? '#166534' : '#64748b', fontWeight: file ? 700 : 400 }}>
        {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : label}
      </span>
      {pct != null && pct < 100 && <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a' }}>{pct}%</span>}
      <input
        type="file"
        accept=".xlsx"
        disabled={disabled}
        style={{ display: 'none' }}
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
    </label>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    queued: { bg: '#fef9c3', fg: '#854d0e', label: 'En cola' },
    processing: { bg: '#dbeafe', fg: '#1d4ed8', label: 'Procesando' },
    done: { bg: '#dcfce7', fg: '#166534', label: 'Listo' },
    error: { bg: '#fee2e2', fg: '#b91c1c', label: 'Error' },
  };
  const s = map[estado] || map.queued;
  return (
    <span style={{ background: s.bg, color: s.fg, borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 800 }}>
      {s.label}
    </span>
  );
}
