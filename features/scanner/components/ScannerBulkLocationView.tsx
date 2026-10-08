'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ClipboardPaste,
  Trash2,
  RefreshCw,
  Search,
  Boxes,
  MapPin,
  Layers,
  Copy,
  Check,
  Download,
  Info,
  Sparkles
} from 'lucide-react';
import { Paquete } from '@/types';
import * as XLSX from 'xlsx';

export interface ScannerBulkLocationViewProps {
  paquetes?: Paquete[];
  currentUser?: { nombre?: string; email?: string; rol?: string } | null;
  onRefreshData?: () => Promise<void> | void;
}

interface ProcessedSessionBatch {
  id: string;
  hora: string;
  totalActualizados: number;
  ubicacionDestino: string;
  estadoAmex: string;
  codigos: string[];
}

export default function ScannerBulkLocationView({
  paquetes = [],
  currentUser,
  onRefreshData
}: ScannerBulkLocationViewProps) {
  // 1. Entrada de texto
  const [rawText, setRawText] = useState('');
  const [isVerifyingDb, setIsVerifyingDb] = useState(false);
  const [extraDbFound, setExtraDbFound] = useState<Paquete[]>([]);

  // 2. Parámetros de Destino WMS
  const [targetUbicacion, setTargetUbicacion] = useState<'AmexLince' | 'Entregado'>('AmexLince');
  const [targetTipo, setTargetTipo] = useState<'ANAQUEL' | 'OFI' | 'DSP_Z1' | 'DSP_Z2' | 'TRANSITO'>('ANAQUEL');
  const [targetAnaquel, setTargetAnaquel] = useState('A1');
  const [targetPiso, setTargetPiso] = useState('P1');
  const [targetEstadoAmex, setTargetEstadoAmex] = useState<'en_almacen' | 'listo_recojo' | 'mantener'>('en_almacen');
  const [motivo, setMotivo] = useState('Ingreso Masivo WMS desde Excel');
  const [operador, setOperador] = useState(currentUser?.nombre || 'Operador AMEX');

  // 3. Estados de ejecución y retroalimentación
  const [autoCreateMissing, setAutoCreateMissing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [sessionBatches, setSessionBatches] = useState<ProcessedSessionBatch[]>([]);
  const [activeTabPreview, setActiveTabPreview] = useState<'matched' | 'missing' | 'history'>('matched');
  const [copiedMissing, setCopiedMissing] = useState(false);

  // Parseo en tiempo real de los códigos pegados
  const { rawCodes, uniqueCodes } = useMemo(() => {
    if (!rawText.trim()) {
      return { rawCodes: [], uniqueCodes: [] };
    }
    const lines = rawText
      .split(/[\n,;\t]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const clean = Array.from(new Set(lines.map((c) => c.toUpperCase())));
    return { rawCodes: lines, uniqueCodes: clean };
  }, [rawText]);

  // Cruce en memoria combinando paquetes locales y paquetes traídos de BD
  const combinedPackages = useMemo(() => {
    const map = new Map<string, Paquete>();
    paquetes.forEach((p) => {
      if (p.numeroReciboBodega) map.set(p.numeroReciboBodega.toUpperCase(), p);
      if (p.trackingUsa) map.set(p.trackingUsa.toUpperCase(), p);
    });
    extraDbFound.forEach((p) => {
      if (p.numeroReciboBodega && !map.has(p.numeroReciboBodega.toUpperCase())) {
        map.set(p.numeroReciboBodega.toUpperCase(), p);
      }
      if (p.trackingUsa && !map.has(p.trackingUsa.toUpperCase())) {
        map.set(p.trackingUsa.toUpperCase(), p);
      }
    });
    return map;
  }, [paquetes, extraDbFound]);

  // Paquetes coincidentes y códigos no encontrados
  const { matchedPackages, missingCodes } = useMemo(() => {
    const matched: Paquete[] = [];
    const missing: string[] = [];

    uniqueCodes.forEach((code) => {
      const pkg = combinedPackages.get(code);
      if (pkg) {
        if (!matched.some((m) => m.id === pkg.id)) {
          matched.push(pkg);
        }
      } else {
        missing.push(code);
      }
    });

    return { matchedPackages: matched, missingCodes: missing };
  }, [uniqueCodes, combinedPackages]);

  // Ubicación final calculada
  const targetPosicionFinal = useMemo(() => {
    if (targetTipo === 'OFI') return 'OFI';
    if (targetTipo === 'DSP_Z1') return 'DSP-Z1';
    if (targetTipo === 'DSP_Z2') return 'DSP-Z2';
    if (targetTipo === 'TRANSITO') return 'TRANSITO';
    return `${targetAnaquel}-${targetPiso}`;
  }, [targetTipo, targetAnaquel, targetPiso]);

  // Función para pegar directamente desde el portapapeles
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText((prev) => (prev ? `${prev}\n${text}` : text));
          setStatusNotification({
            type: 'success',
            msg: '¡Columna de Excel pegada exitosamente desde tu portapapeles!'
          });
        }
      }
    } catch {
      alert('Por favor usa Ctrl+V dentro del cuadro de texto para pegar tu columna de Excel.');
    }
  };

  // Buscar en BD los códigos que no estén en la memoria local
  const handleVerifyMissingInDb = async () => {
    if (missingCodes.length === 0) return;
    setIsVerifyingDb(true);
    try {
      const res = await fetch(`/api/paquetes/asignacion-masiva?codes=${encodeURIComponent(missingCodes.join(','))}`);
      const data = await res.json();
      if (res.ok && data.found && Array.isArray(data.found)) {
        setExtraDbFound((prev) => [...prev, ...data.found]);
        setStatusNotification({
          type: 'success',
          msg: `Se encontraron ${data.found.length} paquetes adicionales directamente en la Base de Datos.`
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifyingDb(false);
    }
  };

  // Ejecutar Asignación Masiva
  const handleExecuteBulkAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadCodes = autoCreateMissing
      ? uniqueCodes
      : matchedPackages.map((p) => p.numeroReciboBodega || p.trackingUsa).filter(Boolean);

    if (payloadCodes.length === 0) {
      alert('No hay paquetes válidos para asignar.');
      return;
    }

    setIsSubmitting(true);
    setStatusNotification(null);

    try {
      const res = await fetch('/api/paquetes/asignacion-masiva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codes: payloadCodes,
          autoCreateMissing,
          targetUbicacion,
          targetAnaquel:
            targetTipo === 'ANAQUEL'
              ? targetAnaquel
              : targetTipo === 'OFI'
              ? 'OFI'
              : targetTipo === 'DSP_Z1'
              ? 'DSP-Z1'
              : targetTipo === 'DSP_Z2'
              ? 'DSP-Z2'
              : 'TRANSITO',
          targetPiso: targetTipo === 'ANAQUEL' ? targetPiso : null,
          targetPosicion: targetPosicionFinal,
          targetEstadoAmex,
          motivo,
          operador
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al ejecutar asignación masiva');
      }

      // Éxito: Guardar lote en la sesión
      const totalProcesados = data.totalProcesados ?? data.totalActualizados ?? payloadCodes.length;
      const newBatch: ProcessedSessionBatch = {
        id: `batch-${Date.now()}`,
        hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        totalActualizados: totalProcesados,
        ubicacionDestino: targetPosicionFinal,
        estadoAmex: targetEstadoAmex !== 'mantener' ? targetEstadoAmex : 'en_almacen',
        codigos: payloadCodes as string[]
      };

      setSessionBatches((prev) => [newBatch, ...prev]);
      setStatusNotification({
        type: 'success',
        msg: data.mensaje || `✓ Se asignó exitosamente la ubicación ${targetPosicionFinal} a ${totalProcesados} paquetes.`
      });

      // Limpiar texto de entrada
      setRawText('');
      setExtraDbFound([]);

      // Refrescar inventario
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setStatusNotification({ type: 'error', msg: `Error: ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyMissingCodes = () => {
    if (missingCodes.length === 0) return;
    navigator.clipboard.writeText(missingCodes.join('\n'));
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  // Exportar lote procesado a Excel
  const handleExportBatchExcel = (batch: ProcessedSessionBatch) => {
    const rows = batch.codigos.map((c, i) => ({
      '#': i + 1,
      'Código WR': c,
      'Ubicación Asignada': batch.ubicacionDestino,
      'Estado AMEX': batch.estadoAmex,
      'Hora Asignación': batch.hora
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lote Asignado');
    XLSX.writeFile(wb, `Lote_Asignacion_${batch.ubicacionDestino}_${batch.hora.replace(/:/g, '-')}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Cabecera Hero del Submódulo 6.5 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
          borderRadius: '14px',
          padding: '20px 24px',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 8px 20px -4px rgba(6, 78, 59, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 900, letterSpacing: '-0.3px' }}>
              6.5 📋 Asignación Masiva de Ubicación (Copiado desde Excel)
            </h2>
            <p style={{ margin: '3px 0 0 0', color: '#a7f3d0', fontSize: '13px' }}>
              Pega directamente una columna de códigos WR desde tu hoja de cálculo para reubicar decenas o cientos de bultos a un anaquel en un solo paso.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800
            }}
          >
            Operador: {operador}
          </span>
        </div>
      </div>

      {/* Banner de Notificación */}
      {statusNotification && (
        <div
          style={{
            background: statusNotification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: statusNotification.type === 'success' ? '1px solid #6ee7b7' : '1px solid #fecaca',
            color: statusNotification.type === 'success' ? '#065f46' : '#991b1b',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {statusNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusNotification.msg}</span>
        </div>
      )}

      {/* Grid Principal: Entrada & Configuración (Izq) vs Vista Previa & Auditoría (Der) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: '16px', alignItems: 'start' }}>
        
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: ÁREA DE TEXTO Y DESTINO WMS */}
        {/* ========================================================================= */}
        <form onSubmit={handleExecuteBulkAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Card 1: Pegar columna de Excel */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardPaste className="w-4 h-4 text-emerald-600" /> 1. Pega la Columna de Códigos WR
              </label>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" /> Pegar (Ctrl+V)
                </button>

                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setExtraDbFound([]);
                      setStatusNotification(null);
                    }}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#64748b',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'Pega aquí la columna copiada de tu archivo Excel...\n\nEjemplo:\nWR000469622\nWR000465623\nWR000454540\nWR000454536'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical',
                background: '#f8fafc',
                lineHeight: '1.5',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Métricas de lectura en vivo */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Líneas: {rawCodes.length}
              </span>
              <span style={{ fontSize: '11.5px', background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Únicos: {uniqueCodes.length}
              </span>
              <span style={{ fontSize: '11.5px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                ✓ En BD: {matchedPackages.length}
              </span>
              {missingCodes.length > 0 && (
                <span style={{ fontSize: '11.5px', background: autoCreateMissing ? '#f0fdf4' : '#fff1f2', color: autoCreateMissing ? '#15803d' : '#9f1239', border: `1px solid ${autoCreateMissing ? '#86efac' : '#fecdd3'}`, padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                  {autoCreateMissing ? '✨ Nuevos a registrar' : '⚠️ No en BD'}: {missingCodes.length}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Selección de Destino WMS */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin className="w-4 h-4 text-emerald-600" /> 2. Selecciona la Ubicación de Destino
            </div>

            {/* Sede */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Sede de Almacén</label>
              <select
                value={targetUbicacion}
                onChange={(e) => setTargetUbicacion(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '3px', fontWeight: 700 }}
              >
                <option value="AmexLince">🏢 Almacén Central Lince (Lima)</option>
                <option value="Entregado">📦 Entregado a Cliente / Salida</option>
              </select>
            </div>

            {/* Tipo de Ubicación (Anaquel vs Zonas especiales) */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Tipo de Posición WMS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setTargetTipo('ANAQUEL')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: targetTipo === 'ANAQUEL' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: targetTipo === 'ANAQUEL' ? '#ecfdf5' : '#ffffff',
                    color: targetTipo === 'ANAQUEL' ? '#065f46' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Anaquel Físico
                </button>
                <button
                  type="button"
                  onClick={() => setTargetTipo('OFI')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: targetTipo === 'OFI' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                    background: targetTipo === 'OFI' ? '#e0f2fe' : '#ffffff',
                    color: targetTipo === 'OFI' ? '#0369a1' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🏢 Oficina (OFI)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetTipo('DSP_Z1')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: targetTipo === 'DSP_Z1' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                    background: targetTipo === 'DSP_Z1' ? '#f5f3ff' : '#ffffff',
                    color: targetTipo === 'DSP_Z1' ? '#6d28d9' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  📦 Despacho Z1
                </button>
                <button
                  type="button"
                  onClick={() => setTargetTipo('DSP_Z2')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: targetTipo === 'DSP_Z2' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                    background: targetTipo === 'DSP_Z2' ? '#f5f3ff' : '#ffffff',
                    color: targetTipo === 'DSP_Z2' ? '#6d28d9' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🚚 Despacho Z2
                </button>
                <button
                  type="button"
                  onClick={() => setTargetTipo('TRANSITO')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '6px',
                    border: targetTipo === 'TRANSITO' ? '2px solid #d97706' : '1px solid #cbd5e1',
                    background: targetTipo === 'TRANSITO' ? '#fef3c7' : '#ffffff',
                    color: targetTipo === 'TRANSITO' ? '#b45309' : '#475569',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  En Tránsito
                </button>
              </div>
            </div>

            {/* Anaquel y Piso (solo visible si targetTipo === 'ANAQUEL') */}
            {targetTipo === 'ANAQUEL' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569' }}>Anaquel</label>
                  <select
                    value={targetAnaquel}
                    onChange={(e) => setTargetAnaquel(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '3px', fontWeight: 700 }}
                  >
                    {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'D1', 'D2'].map((a) => (
                      <option key={a} value={a}>
                        Anaquel {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569' }}>Piso / Nivel</label>
                  <select
                    value={targetPiso}
                    onChange={(e) => setTargetPiso(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '3px', fontWeight: 700 }}
                  >
                    <option value="P1">P1 (Piso 1 · Inferior)</option>
                    <option value="P2">P2 (Piso 2 · Medio)</option>
                    <option value="P3">P3 (Piso 3 · Medio Alto)</option>
                    <option value="P4">P4 (Piso 4 · Superior)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Badge de ubicación final resultante */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 700 }}>
                Posición WMS Resultante:
              </span>
              <span
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: 900,
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}
              >
                {targetPosicionFinal}
              </span>
            </div>

            {/* Estado AMEX Opcional */}
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                Actualizar Estado AMEX
              </label>
              <select
                value={targetEstadoAmex}
                onChange={(e) => setTargetEstadoAmex(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', marginTop: '3px', fontWeight: 700 }}
              >
                <option value="en_almacen">📦 En Almacén (Recomendado para Slotting)</option>
                <option value="listo_recojo">🏪 Listo para Recojo</option>
                <option value="mantener">🔒 Mantener estado AMEX actual de cada paquete</option>
              </select>
            </div>

            {/* Auto-registro de códigos nuevos */}
            <div
              onClick={() => setAutoCreateMissing(!autoCreateMissing)}
              style={{
                background: autoCreateMissing ? '#f0fdf4' : '#f8fafc',
                border: `1.5px solid ${autoCreateMissing ? '#86efac' : '#cbd5e1'}`,
                padding: '10px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: autoCreateMissing ? '#15803d' : '#334155' }}>
                    Registrar e Ingresar automáticamente códigos nuevos
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                    Si algún código de Excel no existe aún en el inventario, se creará y asignará directamente a {targetPosicionFinal}.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoCreateMissing}
                onChange={(e) => setAutoCreateMissing(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Botón de Confirmación Principal */}
            {(() => {
              const totalToProcess = autoCreateMissing ? uniqueCodes.length : matchedPackages.length;
              const canSubmit = !isSubmitting && totalToProcess > 0;

              return (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    marginTop: '6px',
                    background: !canSubmit ? '#94a3b8' : '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '13.5px',
                    cursor: !canSubmit ? 'not-allowed' : isSubmitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: !canSubmit ? 'none' : '0 4px 10px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Guardando en Base de Datos Master...
                    </>
                  ) : (
                    <>
                      ✓ Asignar Ubicación {targetPosicionFinal} a {totalToProcess} Paquete(s)
                      {autoCreateMissing && missingCodes.length > 0 && uniqueCodes.length > 0 && (
                        <span style={{ fontSize: '11px', opacity: 0.95, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '4px' }}>
                          {matchedPackages.length > 0 ? `${matchedPackages.length} exist. + ` : ''}{missingCodes.length} nuevo(s)
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </form>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: AUDITORÍA EN TIEMPO REAL & VISTA PREVIA */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Navegación interna entre Previsualización, No Encontrados e Historial */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTabPreview('matched')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTabPreview === 'matched' ? '#0f172a' : '#f1f5f9',
                color: activeTabPreview === 'matched' ? '#ffffff' : '#475569',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Listos para Asignar ({autoCreateMissing ? uniqueCodes.length : matchedPackages.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabPreview('missing')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTabPreview === 'missing' ? (autoCreateMissing ? '#047857' : '#dc2626') : '#f1f5f9',
                color: activeTabPreview === 'missing' ? '#ffffff' : '#475569',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {autoCreateMissing ? 'Códigos Nuevos' : 'No Encontrados'} ({missingCodes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabPreview('history')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTabPreview === 'history' ? '#059669' : '#f1f5f9',
                color: activeTabPreview === 'history' ? '#ffffff' : '#475569',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              Historial Sesión ({sessionBatches.length})
            </button>
          </div>

          {/* TAB 1: PAQUETES LISTOS PARA ASIGNAR */}
          {activeTabPreview === 'matched' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155' }}>
                  Previsualización de Cambios ({autoCreateMissing ? uniqueCodes.length : matchedPackages.length} paquetes)
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Destino: <strong>{targetPosicionFinal}</strong>
                </span>
              </div>

              {(autoCreateMissing ? uniqueCodes.length : matchedPackages.length) === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                  <Boxes style={{ width: '40px', height: '40px', margin: '0 auto 10px auto', color: '#cbd5e1' }} />
                  <p style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                    Sin códigos ingresados aún
                  </p>
                  <p style={{ margin: 0, fontSize: '12.5px' }}>
                    Copia una columna de códigos WR desde Excel y pégala en el panel izquierdo.
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                        <th style={{ padding: '8px 12px', width: '40px' }}>#</th>
                        <th style={{ padding: '8px 12px' }}>Guía WR</th>
                        <th style={{ padding: '8px 12px' }}>Tipo</th>
                        <th style={{ padding: '8px 12px' }}>Consignatario</th>
                        <th style={{ padding: '8px 12px' }}>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(autoCreateMissing ? uniqueCodes : matchedPackages.map((p) => p.numeroReciboBodega || p.trackingUsa || '')).map((code, idx) => {
                        const pkg = combinedPackages.get(code);
                        const isNew = !pkg;

                        return (
                          <tr key={code || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#1e40af' }}>
                              {code}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              {isNew ? (
                                <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                  ✨ Nuevo Ingreso
                                </span>
                              ) : (
                                <span style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                  Reubicación
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#334155', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {pkg?.nombreConsignatario || (isNew ? 'Por registrar' : '—')}
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>
                                  {pkg?.posicionEstante || '—'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-emerald-500" />
                                <span style={{ fontFamily: 'monospace', color: '#047857', fontWeight: 800, background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                  {targetPosicionFinal}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CÓDIGOS NO ENCONTRADOS / NUEVOS */}
          {activeTabPreview === 'missing' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: autoCreateMissing ? '1px solid #a7f3d0' : '1px solid #fecdd3', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '10px 14px', background: autoCreateMissing ? '#f0fdf4' : '#fff1f2', borderBottom: autoCreateMissing ? '1px solid #a7f3d0' : '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: autoCreateMissing ? '#15803d' : '#9f1239', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {autoCreateMissing ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Códigos Nuevos a Registrar ({missingCodes.length})
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-600" /> Códigos No Encontrados ({missingCodes.length})
                    </>
                  )}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {missingCodes.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleVerifyMissingInDb}
                        disabled={isVerifyingDb}
                        style={{
                          background: '#ffffff',
                          border: autoCreateMissing ? '1px solid #a7f3d0' : '1px solid #fda4af',
                          color: autoCreateMissing ? '#15803d' : '#be123c',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: isVerifyingDb ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RefreshCw className={`w-3 h-3 ${isVerifyingDb ? 'animate-spin' : ''}`} />
                        Consultar en BD Master
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyMissingCodes}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copiedMissing ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedMissing ? 'Copiados' : 'Copiar'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {missingCodes.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#059669', fontSize: '13px', fontWeight: 700 }}>
                  ✓ ¡Excelente! El 100% de los códigos ingresados ya se encontraban registrados en el inventario.
                </div>
              ) : (
                <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '12px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>
                    {autoCreateMissing
                      ? `Estos ${missingCodes.length} códigos no existen previamente en la base de datos. Se registrarán e ingresarán directamente en ${targetPosicionFinal} al pulsar el botón verde:`
                      : 'Estos códigos no figuran en la base de datos de paquetes y se omitirán al asignar:'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {missingCodes.map((code, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          background: autoCreateMissing ? '#ecfdf5' : '#fee2e2',
                          color: autoCreateMissing ? '#065f46' : '#b91c1c',
                          border: autoCreateMissing ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORIAL DE LOTES DE LA SESIÓN */}
          {activeTabPreview === 'history' && (
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155' }}>
                  Lotes Procesados en esta Sesión ({sessionBatches.length})
                </span>
              </div>

              {sessionBatches.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                  Aún no se han ejecutado asignaciones masivas en esta sesión.
                </div>
              ) : (
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {sessionBatches.map((batch) => (
                    <div
                      key={batch.id}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                          Ubicación: <span style={{ color: '#047857', fontFamily: 'monospace' }}>{batch.ubicacionDestino}</span> • {batch.totalActualizados} paquetes
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Hora: {batch.hora} • Estado AMEX: {batch.estadoAmex}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportBatchExcel(batch)}
                        style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar Excel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
