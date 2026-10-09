'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Square,
  Layers,
  Database,
  ArrowRight,
  X,
  FileText,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Paquete } from '@/types';

export interface SyncTibImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paquetesActuales: Paquete[];
  onRefreshData?: () => Promise<void> | void;
  onPackageUpdated?: (wr: string, imageUrl: string, ticketUrl?: string) => void;
}

interface ItemToProcess {
  id: string;
  numeroReciboBodega: string;
  tracking?: string;
  nombreConsignatario?: string;
  pesoKg?: number;
}

interface LogEntry {
  id: string;
  wr: string;
  status: 'ok' | 'not_found' | 'error' | 'cancelled';
  message: string;
  time: string;
}

export default function SyncTibImagesModal({
  isOpen,
  onClose,
  paquetesActuales,
  onRefreshData,
  onPackageUpdated,
}: SyncTibImagesModalProps) {
  // Pasos: 'audit' (revisión y confirmación), 'running' (en ejecución), 'done' (resumen)
  const [step, setStep] = useState<'audit' | 'running' | 'done'>('audit');

  // Alcance seleccionado
  const [scope, setScope] = useState<'current' | 'database'>('current');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [limitSelection, setLimitSelection] = useState<number | 'all'>('all');

  // Estadísticas globales de BD
  const [dbStats, setDbStats] = useState<{
    totalPackages: number;
    withImage: number;
    totalMissing: number;
    missingList: ItemToProcess[];
  } | null>(null);
  const [loadingDbStats, setLoadingDbStats] = useState(false);

  // Estadísticas del inventario cargado en memoria
  const currentMissingList = useMemo<ItemToProcess[]>(() => {
    return paquetesActuales
      .filter((p) => Boolean(p.numeroReciboBodega && p.numeroReciboBodega.trim() !== '' && !p.tibImagenUrl))
      .map((p) => ({
        id: p.id,
        numeroReciboBodega: p.numeroReciboBodega,
        tracking: p.trackingUsa || p.tracking || '',
        nombreConsignatario: p.nombreConsignatario || '',
        pesoKg: p.pesoKg || 0,
      }));
  }, [paquetesActuales]);

  // Ejecución y progreso
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [notFoundCount, setNotFoundCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [currentWr, setCurrentWr] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const cancelRef = useRef(false);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Cargar estadísticas de la base de datos completa al abrir el modal
  useEffect(() => {
    if (!isOpen) {
      setStep('audit');
      setProcessedCount(0);
      setSuccessCount(0);
      setNotFoundCount(0);
      setErrorCount(0);
      setCurrentWr(null);
      setLogs([]);
      cancelRef.current = false;
      return;
    }

    void fetchDbStats();
  }, [isOpen]);

  // Autoscroll del log
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchDbStats = async () => {
    setLoadingDbStats(true);
    try {
      const res = await fetch('/api/paquetes/tib-image?limit=500');
      const data = await res.json();
      if (res.ok && data.ok) {
        setDbStats({
          totalPackages: data.totalPackages,
          withImage: data.withImage,
          totalMissing: data.totalMissing,
          missingList: (data.missing || []).map((m: any) => ({
            id: m.id,
            numeroReciboBodega: m.numeroReciboBodega,
            tracking: m.tracking,
            nombreConsignatario: m.nombreConsignatario,
            pesoKg: m.pesoKg,
          })),
        });
      }
    } catch (err) {
      console.error('Error al consultar estadísticas globales de BD:', err);
    } finally {
      setLoadingDbStats(false);
    }
  };

  // Calcular la lista final que se va a procesar
  const itemsToProcess = useMemo<ItemToProcess[]>(() => {
    let source: ItemToProcess[] = [];
    if (scope === 'current') {
      source = currentMissingList;
    } else {
      source = dbStats?.missingList || [];
    }

    if (limitSelection !== 'all') {
      return source.slice(0, Number(limitSelection));
    }
    return source;
  }, [scope, currentMissingList, dbStats, limitSelection]);

  // Iniciar la sincronización masiva
  const handleStartSync = async () => {
    if (itemsToProcess.length === 0) return;

    cancelRef.current = false;
    setStep('running');
    setTotalToProcess(itemsToProcess.length);
    setProcessedCount(0);
    setSuccessCount(0);
    setNotFoundCount(0);
    setErrorCount(0);
    setLogs([]);

    const CHUNK_SIZE = 3; // Lotes de 3 peticiones concurrentes para proteger la API de TIB
    let currentProcessed = 0;
    let currentSuccess = 0;
    let currentNotFound = 0;
    let currentErrors = 0;

    for (let i = 0; i < itemsToProcess.length; i += CHUNK_SIZE) {
      if (cancelRef.current) {
        addLog('CANCEL', 'cancelled', 'Proceso detenido por el operador.');
        break;
      }

      const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE);
      setCurrentWr(chunk.map((item) => item.numeroReciboBodega).join(', '));

      await Promise.all(
        chunk.map(async (item) => {
          if (cancelRef.current) return;
          try {
            const res = await fetch('/api/paquetes/tib-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                wr: item.numeroReciboBodega,
                id: item.id,
                forceRefresh,
              }),
            });

            const data = await res.json();
            if (res.ok && data.found && data.tibImagenUrl) {
              currentSuccess++;
              addLog(item.numeroReciboBodega, 'ok', 'Foto y ticket asignados correctamente.');
              if (onPackageUpdated) {
                onPackageUpdated(item.numeroReciboBodega, data.tibImagenUrl, data.tibTicketPdfUrl);
              }
            } else if (res.ok && !data.found) {
              currentNotFound++;
              addLog(
                item.numeroReciboBodega,
                'not_found',
                data.message || 'Sin evidencia fotográfica en servidor TIB.'
              );
            } else {
              currentErrors++;
              addLog(
                item.numeroReciboBodega,
                'error',
                data.error || 'Respuesta inválida de TIB.'
              );
            }
          } catch (err: any) {
            currentErrors++;
            addLog(
              item.numeroReciboBodega,
              'error',
              err?.message || 'Error de conexión con el servidor.'
            );
          } finally {
            currentProcessed++;
            setProcessedCount(currentProcessed);
            setSuccessCount(currentSuccess);
            setNotFoundCount(currentNotFound);
            setErrorCount(currentErrors);
          }
        })
      );

      // Pausa de 150ms entre lotes para no sobrecargar el servidor de TIB
      await new Promise((r) => setTimeout(r, 150));
    }

    setStep('done');
    setCurrentWr(null);
  };

  const addLog = (wr: string, status: 'ok' | 'not_found' | 'error' | 'cancelled', message: string) => {
    const time = new Date().toLocaleTimeString('es-PE', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: `${wr}-${Date.now()}-${Math.random()}`,
        wr,
        status,
        message,
        time,
      },
    ]);
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const handleFinishAndRefresh = async () => {
    if (onRefreshData) {
      await onRefreshData();
    }
    onClose();
  };

  if (!isOpen) return null;

  const progressPercent = totalToProcess > 0 ? Math.round((processedCount / totalToProcess) * 100) : 0;

  return (
    <div
      className="modal-backdrop"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '16px'
      }}
    >
      <div
        className="modal-dialog"
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
                  Sincronización Masiva de Fotos TIB
                </h3>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  AMEX Bodega Hub
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Detecta y asigna automáticamente imágenes y tickets PDF desde el servidor oficial de TIBCARGO.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={step === 'running'}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: step === 'running' ? 'not-allowed' : 'pointer',
              color: '#94a3b8',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              opacity: step === 'running' ? 0.4 : 1
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '22px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            background: '#f8fafc'
          }}
        >
          {/* PASO 1: AUDITORÍA Y CONFIRMACIÓN */}
          {step === 'audit' && (
            <>
              {/* Tarjetas de Diagnóstico */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px'
                }}
              >
                {/* Opción 1: Vista actual */}
                <div
                  onClick={() => setScope('current')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: scope === 'current' ? '#ffffff' : '#f1f5f9',
                    border: scope === 'current' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    boxShadow: scope === 'current' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13px', color: '#1e293b' }}>
                      <Layers className="w-4 h-4 text-blue-600" /> Vista Actual
                    </div>
                    <span
                      style={{
                        background: currentMissingList.length > 0 ? '#fef3c7' : '#dcfce7',
                        color: currentMissingList.length > 0 ? '#b45309' : '#16a34a',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px'
                      }}
                    >
                      {currentMissingList.length} pendientes
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Total analizados en tabla: <strong>{paquetesActuales.length}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#0f766e', marginTop: '4px', fontWeight: 700 }}>
                    ✓ {paquetesActuales.length - currentMissingList.length} ya cuentan con foto
                  </div>
                </div>

                {/* Opción 2: Base de Datos Global */}
                <div
                  onClick={() => setScope('database')}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: scope === 'database' ? '#ffffff' : '#f1f5f9',
                    border: scope === 'database' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    boxShadow: scope === 'database' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13px', color: '#1e293b' }}>
                      <Database className="w-4 h-4 text-purple-600" /> Toda la Base de Datos
                    </div>
                    {loadingDbStats ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    ) : (
                      <span
                        style={{
                          background: (dbStats?.totalMissing || 0) > 0 ? '#fee2e2' : '#dcfce7',
                          color: (dbStats?.totalMissing || 0) > 0 ? '#b91c1c' : '#16a34a',
                          fontWeight: 800,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '999px'
                        }}
                      >
                        {dbStats?.totalMissing ?? '...'} pendientes
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Total en BD: <strong>{dbStats?.totalPackages ?? '...'}</strong> paquetes
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#0f766e', marginTop: '4px', fontWeight: 700 }}>
                    ✓ {dbStats?.withImage ?? '...'} ya cuentan con foto
                  </div>
                </div>
              </div>

              {/* Parámetros de Ejecución */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles className="w-4 h-4 text-amber-500" /> Configuración del Lote
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      Cantidad a procesar:
                    </label>
                    <select
                      value={String(limitSelection)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLimitSelection(val === 'all' ? 'all' : Number(val));
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        background: '#f8fafc',
                        color: '#0f172a'
                      }}
                    >
                      <option value="all">Todos los pendientes ({itemsToProcess.length})</option>
                      <option value="25">Primeros 25</option>
                      <option value="50">Primeros 50</option>
                      <option value="100">Primeros 100</option>
                    </select>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      color: '#475569',
                      fontWeight: 600
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={forceRefresh}
                      onChange={(e) => setForceRefresh(e.target.checked)}
                      style={{ width: '15px', height: '15px' }}
                    />
                    <span>Forzar re-consulta a TIB si ya existía URL previa</span>
                  </label>
                </div>
              </div>

              {/* Previsualización de Guías a Procesar */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    Lista de guías pendientes a sincronizar ({itemsToProcess.length})
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Alcance: {scope === 'current' ? 'Vista actual' : 'Base de datos'}
                  </span>
                </div>

                {itemsToProcess.length === 0 ? (
                  <div
                    style={{
                      padding: '30px',
                      textAlign: 'center',
                      color: '#16a34a',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ¡Excelente! Todos los paquetes de este alcance ya cuentan con su fotografía asignada.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      background: '#f8fafc'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', fontWeight: 700 }}>WR</th>
                          <th style={{ padding: '6px 10px', fontWeight: 700 }}>Tracking</th>
                          <th style={{ padding: '6px 10px', fontWeight: 700 }}>Consignatario</th>
                          <th style={{ padding: '6px 10px', fontWeight: 700, textAlign: 'right' }}>Peso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsToProcess.map((item, idx) => (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            <td style={{ padding: '6px 10px', fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>
                              {item.numeroReciboBodega}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#475569' }}>
                              {item.tracking || '—'}
                            </td>
                            <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1e293b' }}>
                              {item.nombreConsignatario || '—'}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              {item.pesoKg ? `${item.pesoKg} kg` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PASO 2: EN EJECUCIÓN (PROGRESO EN VIVO) */}
          {step === 'running' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Barra de progreso */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      Sincronizando {processedCount} de {totalToProcess} guías...
                    </span>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#2563eb' }}>
                    {progressPercent}%
                  </span>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '999px',
                    background: '#e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
                      borderRadius: '999px',
                      transition: 'width 0.2s ease'
                    }}
                  />
                </div>

                {currentWr && (
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Procesando lote:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#1e293b' }}>{currentWr}</strong>
                  </div>
                )}
              </div>

              {/* Contadores en Vivo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                    ✓ Asignadas con Éxito
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                    {successCount}
                  </div>
                </div>

                <div
                  style={{
                    background: '#fefce8',
                    border: '1px solid #fef08a',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase' }}>
                    ⚠ Sin Foto en TIB
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#a16207', marginTop: '4px' }}>
                    {notFoundCount}
                  </div>
                </div>

                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
                    ✕ Errores de Red
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#b91c1c', marginTop: '4px' }}>
                    {errorCount}
                  </div>
                </div>
              </div>

              {/* Consola de Logs */}
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#f8fafc',
                  fontFamily: 'monospace',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '11px', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '4px' }}>
                  REGISTRO DE COMUNICACIÓN EN TIEMPO REAL:
                </div>
                <div
                  ref={logsContainerRef}
                  data-lenis-prevent=""
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {logs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ color: '#64748b' }}>[{log.time}]</span>
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{log.wr}:</span>
                      <span
                        style={{
                          color:
                            log.status === 'ok'
                              ? '#4ade80'
                              : log.status === 'not_found'
                              ? '#facc15'
                              : '#f87171',
                        }}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: RESUMEN FINAL */}
          {step === 'done' && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '28px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  border: '2px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16a34a'
                }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Sincronización Masiva Finalizada
                </h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Se completó la verificación con el servidor de TIBCARGO y se guardaron las evidencias en la base de datos.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '520px'
                }}
              >
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TOTAL PROCESADAS</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                    {processedCount}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>FOTOS GUARDADAS</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
                    {successCount}
                  </div>
                </div>

                <div style={{ background: '#fefce8', padding: '12px', borderRadius: '10px', border: '1px solid #fef08a' }}>
                  <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 700 }}>SIN FOTO EN TIB</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#a16207', marginTop: '2px' }}>
                    {notFoundCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          {step === 'audit' && (
            <>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info className="w-4 h-4 text-slate-400" />
                <span>
                  Se enviarán peticiones concurrentes a la API oficial de TIB y se actualizará Supabase.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={itemsToProcess.length === 0}
                  onClick={handleStartSync}
                  style={{
                    background: itemsToProcess.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: itemsToProcess.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: itemsToProcess.length === 0 ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Sincronización ({itemsToProcess.length})</span>
                </button>
              </div>
            </>
          )}

          {step === 'running' && (
            <>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Por favor mantén esta ventana abierta mientras se completan las consultas.
              </div>

              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Square className="w-3.5 h-3.5 fill-red-600" /> Detener Sincronización
              </button>
            </>
          )}

          {step === 'done' && (
            <>
              <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                ✓ Los cambios ya fueron guardados permanentemente en la base de datos.
              </div>

              <button
                type="button"
                onClick={handleFinishAndRefresh}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 22px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar y Actualizar Inventario</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
