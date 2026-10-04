'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Server,
  Database,
  ArrowRight,
  Download,
  Clock,
  Layers
} from 'lucide-react';

interface TibFileInfo {
  id?: string;
  tipo: 'delivered' | 'sent' | 'received';
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
  files: {
    delivered: TibFileInfo | null;
    sent: TibFileInfo | null;
    received: TibFileInfo | null;
  };
}

interface JobProgress {
  id: string;
  estado: string;
  etapa: string;
  mensaje: string;
  progreso: number;
  total_guias: number | null;
  coincidencias: number | null;
  sin_coincidencia: number | null;
  segundos: number | null;
  db_actualizados?: number;
  resultado_key?: string | null;
}

export interface SyncTibModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => Promise<void> | void;
}

const TIB_CONFIG: Array<{
  tipo: 'delivered' | 'sent' | 'received';
  label: string;
  fileHint: string;
  color: string;
  iconBg: string;
}> = [
  { tipo: 'delivered', label: 'ENTREGADO TIB', fileHint: 'ENTREGADO TIB.xlsx', color: '#16a34a', iconBg: '#dcfce7' },
  { tipo: 'sent', label: 'ENVIADO TIB', fileHint: 'ENVIADO TIB.xlsx', color: '#2563eb', iconBg: '#dbeafe' },
  { tipo: 'received', label: 'RECIBIDO TIB', fileHint: 'RECIBIDO TIB.xlsx', color: '#d97706', iconBg: '#fef3c7' },
];

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function SyncTibModal({ isOpen, onClose, onRefreshData }: SyncTibModalProps) {
  const [tibState, setTibState] = useState<TibState | null>(null);
  const [isLoadingTib, setIsLoadingTib] = useState(false);
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dbCount, setDbCount] = useState<number>(0);
  const [filtroEstado, setFiltroEstado] = useState<'activos' | 'todos'>('activos');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeJob, setActiveJob] = useState<JobProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    coincidencias: number;
    dbActualizados: number;
    sinCoincidencia: number;
    resultadoKey?: string | null;
  } | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar estado de archivos TIB del día y conteo en BD
  const loadTibState = useCallback(async () => {
    setIsLoadingTib(true);
    setErrorMessage(null);
    try {
      const [tibRes, statsRes] = await Promise.all([
        fetch('/api/inventario-tib').then((r) => r.json()),
        fetch('/api/inventario-jobs').then((r) => r.json()),
      ]);

      if (tibRes.files) {
        setTibState(tibRes);
      }
      if (statsRes.dbStats) {
        setDbCount(filtroEstado === 'todos' ? statsRes.dbStats.todos : statsRes.dbStats.activos);
      }
    } catch (err: unknown) {
      console.error('Error cargando estado TIB:', err);
    } finally {
      setIsLoadingTib(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    if (isOpen) {
      void loadTibState();
      setActiveJob(null);
      setSuccessResult(null);
      setErrorMessage(null);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isOpen, loadTibState]);

  // Subida de un archivo individual a R2 y registro en inventario_tib_diario
  const handleUploadSingleTib = async (tipo: 'delivered' | 'sent' | 'received', file: File) => {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMessage(`El archivo "${file.name}" debe ser formato .xlsx.`);
      return;
    }

    setIsUploading((prev) => ({ ...prev, [tipo]: true }));
    setUploadProgress((prev) => ({ ...prev, [tipo]: 0 }));
    setErrorMessage(null);

    try {
      // 1. Obtener URL presignada para TIB diario
      const presign = await fetch('/api/inventario-jobs/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: tipo, filename: file.name, isDailyTib: true }),
      }).then((r) => r.json());

      if (!presign.uploadUrl) throw new Error(presign.error || 'No se pudo generar URL de subida a R2.');

      // 2. Subida directa con XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presign.uploadUrl);
        xhr.setRequestHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress((prev) => ({ ...prev, [tipo]: Math.round((e.loaded / e.total) * 100) }));
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 status ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Error de conexión con R2'));
        xhr.send(file);
      });

      // 3. Confirmar registro en Supabase
      const confirmRes = await fetch('/api/inventario-tib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          r2_key: presign.key,
          nombre_archivo: file.name,
          peso_bytes: file.size,
        }),
      }).then((r) => r.json());

      if (!confirmRes.ok) throw new Error(confirmRes.error || 'No se pudo registrar archivo TIB en la base de datos.');

      // Refrescar estado
      await loadTibState();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al subir archivo TIB.');
    } finally {
      setIsUploading((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  // Disparar cruce automático usando TIB del día
  const handleStartSync = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const res = await fetch('/api/inventario-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usar_tib_diario: true,
          origen_inventario: 'db',
          filtro_estado: filtroEstado,
          sincronizar_db: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.id) {
        throw new Error(data.error || 'No se pudo encolar el trabajo de cruce.');
      }

      const jobId = data.id;
      setActiveJob({
        id: jobId,
        estado: 'queued',
        etapa: 'queued',
        mensaje: 'En cola, esperando procesamiento por Worker Hostinger...',
        progreso: 5,
        total_guias: null,
        coincidencias: null,
        sin_coincidencia: null,
        segundos: null,
      });

      // Suscripción Realtime para barra de progreso en vivo
      const channel = supabase
        .channel(`sync-tib-job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'inventario_jobs',
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            const updated = payload.new as JobProgress;
            setActiveJob(updated);
            if (updated.estado === 'done') {
              handleJobFinished(jobId, updated);
            } else if (updated.estado === 'error') {
              setIsProcessing(false);
              setErrorMessage(updated.mensaje || 'Ocurrió un error en el procesador.');
            }
          }
        )
        .subscribe();

      // Polling de respaldo cada 1.5s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const detailRes = await fetch(`/api/inventario-jobs/${jobId}`);
          const detailData = await detailRes.json();
          if (detailData.job) {
            setActiveJob(detailData.job);
            if (detailData.job.estado === 'done') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              supabase.removeChannel(channel);
              handleJobFinished(jobId, detailData.job);
            } else if (detailData.job.estado === 'error') {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              supabase.removeChannel(channel);
              setIsProcessing(false);
              setErrorMessage(detailData.job.mensaje || 'Error en worker.');
            }
          }
        } catch {
          /* reintenta */
        }
      }, 1500);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Error al iniciar cruce.');
    }
  };

  const handleJobFinished = async (jobId: string, jobData: JobProgress) => {
    setIsProcessing(false);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    // Asegurar sincronización en BD si no fue automática
    let finalActualizados = jobData.db_actualizados || 0;
    try {
      const syncRes = await fetch(`/api/inventario-jobs/${jobId}/sync-db`, { method: 'POST' });
      const syncData = await syncRes.json();
      if (syncData.updatedCount !== undefined) {
        finalActualizados = syncData.updatedCount;
      }
    } catch (e) {
      console.warn('Sync post-verificación:', e);
    }

    setSuccessResult({
      coincidencias: jobData.coincidencias ?? 0,
      dbActualizados: finalActualizados,
      sinCoincidencia: jobData.sin_coincidencia ?? 0,
      resultadoKey: jobData.resultado_key,
    });

    // Refrescar tabla en Módulo 3
    if (onRefreshData) {
      try {
        await onRefreshData();
      } catch (e) {
        console.error('Error refrescando tabla en Módulo 3:', e);
      }
    }
  };

  const hasAnyTib = Boolean(
    tibState?.files.delivered || tibState?.files.sent || tibState?.files.received
  );

  return (
    <Modal isOpen={isOpen} onClose={isProcessing ? () => {} : onClose} maxWidth="3xl">
      <div style={{ padding: '4px' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                Sincronización Rápida con TIB del Día
              </h2>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Cruce automático del inventario de paquetes con reportes TIB mediante el Worker Hostinger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              color: '#94a3b8',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Éxito / Resultado final */}
        {successResult && (
          <div
            style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>¡Cruce completado y base de datos actualizada con éxito!</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>{successResult.coincidencias}</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase' }}>Coincidencias TIB</div>
              </div>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>{successResult.dbActualizados}</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase' }}>Paquetes Actualizados</div>
              </div>
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{successResult.sinCoincidencia}</div>
                <div style={{ fontSize: '11px', color: '#4b5563', textTransform: 'uppercase' }}>Sin Coincidencia</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              {successResult.resultadoKey && (
                <a
                  href={`/api/storage/file?key=${encodeURIComponent(successResult.resultadoKey)}&download=true`}
                  className="btn"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Excel Cruzado
                </a>
              )}
              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ fontSize: '12.5px', fontWeight: 700 }}
              >
                Cerrar y Ver Inventario
              </button>
            </div>
          </div>
        )}

        {/* Estado en progreso del Worker */}
        {isProcessing && activeJob && (
          <div
            style={{
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server className="w-4 h-4 text-blue-600 animate-pulse" />
                Worker Hostinger (AMD EPYC): {activeJob.etapa}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>{activeJob.progreso}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${activeJob.progreso}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>{activeJob.mensaje}</div>
          </div>
        )}

        {/* Tarjetas de Archivos TIB del Día */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Archivos TIB Activos del Día
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
                {tibState.isComplete ? '✓ Todos listos (3/3)' : 'Archivos parciales'}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {TIB_CONFIG.map(({ tipo, label, fileHint, color, iconBg }) => {
              const fileData = tibState?.files[tipo];
              const uploading = isUploading[tipo];
              const pct = uploadProgress[tipo] || 0;

              return (
                <div
                  key={tipo}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: fileData ? '1px solid #bbf7d0' : '1px dashed #cbd5e1',
                    background: fileData ? '#f8fafc' : '#ffffff',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color }}>{label}</span>
                    {fileData ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Pendiente</span>
                    )}
                  </div>

                  {fileData ? (
                    <div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={fileData.nombre_archivo}
                      >
                        {fileData.nombre_archivo}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '6px' }}>
                        <span>{formatBytes(fileData.peso_bytes)}</span>
                        <span>•</span>
                        <span>{fileData.subido_en ? new Date(fileData.subido_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0' }}>
                      Requerido: <code>{fileHint}</code>
                    </div>
                  )}

                  {/* Botón de subida rápida / reemplazo */}
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#2563eb',
                      cursor: uploading || isProcessing ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    <Upload className="w-3 h-3" />
                    <span>{uploading ? `Subiendo ${pct}%` : fileData ? 'Reemplazar' : 'Subir'}</span>
                    <input
                      type="file"
                      accept=".xlsx"
                      disabled={uploading || isProcessing}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleUploadSingleTib(tipo, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Configuración de Cruce */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database className="w-4 h-4 text-emerald-600" />
            <span style={{ fontSize: '12.5px', color: '#334155' }}>
              Inventario en base de datos: <strong>{dbCount.toLocaleString()} paquetes</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Filtro:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'activos' | 'todos')}
              disabled={isProcessing}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
              }}
            >
              <option value="activos">Solo paquetes activos en almacén (Recomendado)</option>
              <option value="todos">Todos los paquetes registrados</option>
            </select>
          </div>
        </div>

        {/* Acciones principales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isProcessing}
            style={{ fontSize: '13px', color: '#64748b' }}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartSync}
            disabled={isProcessing || !hasAnyTib}
            style={{
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: hasAnyTib ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#94a3b8',
              boxShadow: hasAnyTib ? '0 2px 10px rgba(37, 99, 235, 0.3)' : 'none',
              cursor: isProcessing || !hasAnyTib ? 'not-allowed' : 'pointer',
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Procesando en Hostinger...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Iniciar Cruce con Worker Hostinger</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
