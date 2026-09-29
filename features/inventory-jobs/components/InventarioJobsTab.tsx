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
  const [autoSyncDb, setAutoSyncDb] = useState(true);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncDbMessage, setSyncDbMessage] = useState<string | null>(null);
  const autoSyncedRef = useRef<Record<string, boolean>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventario-jobs');
      const data = await res.json();
      if (data.jobs) setHistory(data.jobs);
    } catch {
      /* historial opcional */
    }
  }, []);

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
    }, 5000);

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

  const handleProcess = async () => {
    try {
      setError('');
      const activas = (Object.keys(fuentesActivas) as FuenteKey[]).filter((k) => fuentesActivas[k]);
      if (!files.inventory) {
        setError('Selecciona el inventario AMEX (.xlsx).');
        return;
      }
      if (activas.length === 0) {
        setError('Activa al menos una fuente TIB.');
        return;
      }
      for (const f of activas) {
        if (!files[f]) {
          setError(`Falta adjuntar: ${FUENTES.find((x) => x.key === f)?.file}.`);
          return;
        }
      }

      setPhase('uploading');
      setUploadPct({});
      const keys: Record<string, string> = {};

      // 1. Subida directa a R2 con URL presignada (slot por slot)
      const slots = ['inventory', ...activas];
      for (const slot of slots) {
        const file = files[slot];
        if (!file) continue;
        const presign = await fetch('/api/inventario-jobs/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot, filename: file.name }),
        }).then((r) => r.json());
        if (!presign.uploadUrl) throw new Error(presign.error || 'No se pudo preparar la subida.');
        await uploadWithProgress(presign.uploadUrl, file, (pct) =>
          setUploadPct((prev) => ({ ...prev, [slot]: pct }))
        );
        keys[slot] = presign.key;
      }

      // 2. Encolar trabajo
      setPhase('queued');
      const res = await fetch('/api/inventario-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventario_key: keys.inventory,
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
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FileRow
            label="1. Inventario AMEX (.xlsx) — obligatorio"
            file={files.inventory}
            onPick={(f) => pickFile('inventory', f)}
            pct={uploadPct.inventory}
          />
          {FUENTES.map((f, i) => (
            <div key={f.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0f172a', minWidth: '170px', paddingTop: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fuentesActivas[f.key]}
                  onChange={() => setFuentesActivas((p) => ({ ...p, [f.key]: !p[f.key] }))}
                />
                {i + 2}. {f.label}
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

          <div
            style={{
              background: '#f8fafc',
              border: `1.5px solid ${autoSyncDb ? '#86efac' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onClick={() => setAutoSyncDb(!autoSyncDb)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: autoSyncDb ? '#dcfce7' : '#f1f5f9',
                  color: autoSyncDb ? '#16a34a' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                }}
              >
                <i className="fa-solid fa-database"></i>
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                  Sincronizar directamente a la Base de Datos (Recomendado)
                </strong>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Aplica clientes, trackings, pesos y estados directamente en el sistema al terminar el cruce.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoSyncDb}
              onChange={(e) => setAutoSyncDb(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
            />
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
              padding: '13px',
              fontSize: '14px',
              fontWeight: 900,
              cursor: 'pointer',
              opacity: phase === 'uploading' || phase === 'queued' ? 0.6 : 1,
            }}
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>{' '}
            {phase === 'uploading' ? 'Subiendo a la nube…' : phase === 'queued' ? 'Encolando…' : 'Completar inventario en la nube'}
          </button>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>
            Límite 100 MB por archivo. El Tracking se guarda como texto para conservar ceros iniciales.
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
