'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Barcode,
  CheckCircle2,
  Copy,
  Download,
  Search,
  Layers,
  Box,
  RefreshCw,
  Trash2,
  MapPin,
  User,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Check,
  Plus,
  Edit3,
  AlertTriangle,
  UploadCloud,
  CheckSquare,
  Square,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Truck,
  Phone,
  DollarSign,
  AlertCircle,
  PackageCheck,
  ArrowUpRight
} from 'lucide-react';
import { exportScannerLogsToExcel } from '@/lib/excelExport';
import { matchesFuzzySearch } from '@/lib/fuzzySearch';
import { Paquete, Cliente, ScannedLog } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';

const MobileScannerModal = dynamic(
  () => import('@/components/scanner/MobileScannerModal'),
  { ssr: false }
);

interface ScannerTabProps {
  scannedLogs: ScannedLog[];
  paquetes?: Paquete[];
  clientes?: Cliente[];
  currentUser?: { nombre: string; email: string; rol: string; id?: string } | null;
  onConfirm: (code: string, format: string, extra?: { mode: string; location?: string; anaquel?: string; piso?: string; pkg?: Paquete; cli?: Cliente }) => void;
  onSlotPackage?: (code: string, location: string) => void;
  onUpdateLogs?: React.Dispatch<React.SetStateAction<ScannedLog[]>>;
  onRefreshData?: () => Promise<void> | void;
  activeSubmodule?: 'slotting' | 'lookup' | 'delivery' | 'relocate';
  onChangeSubmodule?: (submodule: 'slotting' | 'lookup' | 'delivery' | 'relocate') => void;
}

const formatOperatorName = (user?: { nombre?: string; email?: string } | null): string => {
  if (!user) return 'Operador Logístico AMEX';
  const rawName = user.nombre?.trim();
  if (rawName && !rawName.includes('@')) {
    return rawName;
  }
  const emailSource = (rawName && rawName.includes('@')) ? rawName : user.email;
  if (emailSource && emailSource.includes('@')) {
    const alias = emailSource.split('@')[0].replace(/[._-]/g, ' ').trim();
    if (alias) {
      return alias.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return 'Operador AMEX';
};

export default function ScannerTab({
  scannedLogs = [],
  paquetes = [],
  clientes = [],
  currentUser,
  onConfirm,
  onSlotPackage,
  onUpdateLogs,
  onRefreshData,
  activeSubmodule = 'slotting',
  onChangeSubmodule
}: ScannerTabProps) {
  // Estado local para permitir navegación interna o externa por submódulos
  const [internalSubmodule, setInternalSubmodule] = useState<'slotting' | 'lookup' | 'delivery' | 'relocate'>(activeSubmodule);

  useEffect(() => {
    if (activeSubmodule) {
      setInternalSubmodule(activeSubmodule);
    }
  }, [activeSubmodule]);

  const currentSub = activeSubmodule || internalSubmodule;

  const handleSelectSubmodule = (sub: 'slotting' | 'lookup' | 'delivery' | 'relocate') => {
    setInternalSubmodule(sub);
    if (onChangeSubmodule) {
      onChangeSubmodule(sub);
    }
  };

  // Estados comunes de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SYNCED'>('ALL');
  const [liveSearchQuery, setLiveSearchQuery] = useState('');
  const [selectedPackage360, setSelectedPackage360] = useState<Paquete | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Estados de Despacho (Submódulo 6.3)
  const [dispatchType, setDispatchType] = useState<'AMEX' | 'SHALOM' | 'OLVA' | 'TIENDA'>('AMEX');
  const [dispatchDriverNotes, setDispatchDriverNotes] = useState('');
  const [dispatchedSessionLogs, setDispatchedSessionLogs] = useState<Array<{
    id: string;
    code: string;
    consignatario: string;
    dispatchType: string;
    time: string;
    operator: string;
    pkg?: Paquete;
  }>>([]);

  // Historial de reasignaciones de la sesión (Submódulo 6.4)
  const [relocatedSessionLogs, setRelocatedSessionLogs] = useState<Array<{
    id: string;
    code: string;
    consignatario: string;
    from: string;
    to: string;
    time: string;
  }>>([]);

  // Selección múltiple para decisión de subida a Master
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modales de Confirmación y Edición
  const [isConfirmSyncModalOpen, setIsConfirmSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [editingLog, setEditingLog] = useState<ScannedLog | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const onOn = () => setIsOnline(true);
      const onOff = () => setIsOnline(false);
      window.addEventListener('online', onOn);
      window.addEventListener('offline', onOff);
      return () => {
        window.removeEventListener('online', onOn);
        window.removeEventListener('offline', onOff);
      };
    }
  }, []);

  // Métricas de Anaqueles y Pisos (4 Pisos por Anaquel)
  const a1_P1 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A1-P1' || (p.anaquel === 'A1' && p.piso === 'P1'))).length, [paquetes]);
  const a1_P2 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A1-P2' || (p.anaquel === 'A1' && p.piso === 'P2'))).length, [paquetes]);
  const a1_P3 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A1-P3' || (p.anaquel === 'A1' && p.piso === 'P3'))).length, [paquetes]);
  const a1_P4 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A1-P4' || (p.anaquel === 'A1' && p.piso === 'P4'))).length, [paquetes]);
  const totalA1 = a1_P1 + a1_P2 + a1_P3 + a1_P4;

  const a2_P1 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A2-P1' || (p.anaquel === 'A2' && p.piso === 'P1'))).length, [paquetes]);
  const a2_P2 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A2-P2' || (p.anaquel === 'A2' && p.piso === 'P2'))).length, [paquetes]);
  const a2_P3 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A2-P3' || (p.anaquel === 'A2' && p.piso === 'P3'))).length, [paquetes]);
  const a2_P4 = useMemo(() => paquetes.filter(p => (p.posicionEstante === 'A2-P4' || (p.anaquel === 'A2' && p.piso === 'P4'))).length, [paquetes]);
  const totalA2 = a2_P1 + a2_P2 + a2_P3 + a2_P4;

  const sinUbicarCount = useMemo(() => paquetes.filter(p => !p.posicionEstante || p.posicionEstante.includes('REC') || p.posicionEstante.includes('MESA')).length, [paquetes]);

  // Filtrado de lecturas
  const pendingLogs = useMemo(() => scannedLogs.filter(l => !l.synced), [scannedLogs]);
  const syncedLogs = useMemo(() => scannedLogs.filter(l => l.synced), [scannedLogs]);

  const filteredLogs = useMemo(() => {
    return scannedLogs.filter(log => {
      const matchesSearch = matchesFuzzySearch(searchTerm, [
        log.code,
        log.format,
        log.location,
        log.nombreConsignatario
      ]);

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'PENDING'
          ? !log.synced
          : log.synced;

      return matchesSearch && matchesStatus;
    });
  }, [scannedLogs, searchTerm, statusFilter]);

  // Selección individual y masiva
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.length === filteredLogs.length && filteredLogs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map(l => l.id));
    }
  };

  const handleSelectOnlyPending = () => {
    setSelectedIds(pendingLogs.map(l => l.id));
  };

  // Helper para persistir cambios en localStorage
  const saveLogsToStorage = (updated: ScannedLog[]) => {
    if (onUpdateLogs) {
      onUpdateLogs(updated);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amex_scanner_staging_queue_v2', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving to localStorage:', err);
      }
    }
  };

  // Eliminar lectura de la cola local
  const handleDeleteLog = (id: string) => {
    const updated = scannedLogs.filter(l => l.id !== id);
    saveLogsToStorage(updated);
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  // Eliminar seleccionados
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Estás seguro de descartar ${selectedIds.length} lectura(s) de la cola local?`)) {
      const updated = scannedLogs.filter(l => !selectedIds.includes(l.id));
      saveLogsToStorage(updated);
      setSelectedIds([]);
    }
  };

  // Guardar edición de una lectura local
  const handleSaveEditLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    const loc = `${editingLog.anaquel || 'A1'}-${editingLog.piso || 'P1'}`;
    const updatedLog: ScannedLog = {
      ...editingLog,
      location: loc
    };

    const updated = scannedLogs.map(l => l.id === updatedLog.id ? updatedLog : l);
    saveLogsToStorage(updated);

    if (onSlotPackage) {
      onSlotPackage(updatedLog.code, loc);
    }

    setEditingLog(null);
  };

  // Copiar y Exportar Excel
  const handleCopyAll = () => {
    if (scannedLogs.length === 0) return;
    const text = scannedLogs.map(l => `${l.code}\t${l.location || 'N/A'}\t${l.synced ? 'SINCRONIZADO' : 'PENDIENTE'}\t${l.time}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleExportExcel = () => {
    if (scannedLogs.length === 0) return;
    exportScannerLogsToExcel(scannedLogs, 'Lecturas_Escaneo_AMEX');
  };

  // Subida Confirmada a Supabase Master
  const handleExecuteMasterSync = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert('Sin conexión a Internet. Las lecturas permanecen guardadas y seguras en tu dispositivo. Vuelve a intentarlo al recuperar la señal.');
      return;
    }

    const targetLogs = selectedIds.length > 0
      ? scannedLogs.filter(l => selectedIds.includes(l.id))
      : pendingLogs;

    if (targetLogs.length === 0) {
      alert('No hay lecturas seleccionadas o pendientes para sincronizar.');
      return;
    }

    const activeUserName = formatOperatorName(currentUser);
    const activeUserEmail = currentUser?.email || '';
    const activeUserId = currentUser?.id || null;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: targetLogs.length });

    const preventClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Hay una sincronización en curso. ¿Estás seguro de salir?';
    };
    window.addEventListener('beforeunload', preventClose);

    let wakeLockSentinel: { release: () => Promise<void> } | null = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockSentinel = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen');
      } catch {
        // Ignored
      }
    }

    const CHUNK_SIZE = 30;
    let totalUpdated = 0;
    let totalInserted = 0;
    let totalSynced = 0;
    let currentLogsState = [...scannedLogs];

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || '';

      for (let i = 0; i < targetLogs.length; i += CHUNK_SIZE) {
        const chunk = targetLogs.slice(i, i + CHUNK_SIZE);

        const payload = {
          items: chunk.map(it => ({
            id: it.id,
            code: it.code,
            format: it.format || 'CODE_128',
            location: it.location || (it.anaquel && it.piso ? `${it.anaquel}-${it.piso}` : 'REC'),
            anaquel: it.anaquel,
            piso: it.piso,
            workflow: it.workflow || 'slotting',
            nombreConsignatario: it.nombreConsignatario || '',
            operadorEmail: activeUserEmail,
            operadorNombre: activeUserName,
          })),
          operadorNombre: activeUserName,
          operadorEmail: activeUserEmail,
          operadorId: activeUserId || undefined,
        };

        let chunkResponse: { success: boolean; syncedIds: string[]; updatedCount: number; insertedCount: number; message?: string } | null = null;
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch('/api/scanner/batch-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              credentials: 'include',
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const errJson = await res.json().catch(() => ({}));
              throw new Error(errJson.error || `Error HTTP ${res.status}`);
            }

            chunkResponse = await res.json();
            break;
          } catch (err) {
            lastError = err;
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, attempt * 1000));
            }
          }
        }

        if (!chunkResponse || !chunkResponse.success) {
          throw lastError || new Error('No se pudo sincronizar el bloque tras 3 reintentos.');
        }

        const syncedIdsSet = new Set(chunkResponse.syncedIds || chunk.map(c => c.id));
        currentLogsState = currentLogsState.map(l =>
          syncedIdsSet.has(l.id)
            ? { ...l, synced: true, syncedAt: new Date().toISOString() }
            : l
        );

        saveLogsToStorage(currentLogsState);

        totalSynced += syncedIdsSet.size;
        totalUpdated += chunkResponse.updatedCount || 0;
        totalInserted += chunkResponse.insertedCount || 0;

        setSyncProgress({ current: totalSynced, total: targetLogs.length });
      }

      setSelectedIds([]);
      setIsConfirmSyncModalOpen(false);

      if (onRefreshData) {
        await onRefreshData();
      }

      const summaryMsg = `✓ ¡Éxito! ${totalSynced} lectura(s) sincronizadas (${totalUpdated} actualizadas, ${totalInserted} nuevas registradas).`;
      setSyncNotification(summaryMsg);
      soundEffects.playSuccess();
      setTimeout(() => setSyncNotification(null), 5000);
    } catch (err: unknown) {
      console.error('Error sincronizando lote de escáner:', err);
      soundEffects.playNotFound();
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Ocurrió una interrupción al sincronizar: ${msg}.\n\n✓ Las lecturas procesadas hasta el momento han sido guardadas con seguridad en tu dispositivo.\nPuedes volver a pulsar "Subir a BD Master" para continuar con las pendientes.`);
    } finally {
      window.removeEventListener('beforeunload', preventClose);
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
        } catch {
          // Ignored
        }
      }
      setIsSyncing(false);
    }
  };

  const handleSyncSingleLog = async (log: ScannedLog) => {
    setSelectedIds([log.id]);
    setIsConfirmSyncModalOpen(true);
  };

  // Interceptar confirmaciones de escáner según el submódulo activo
  const handleScannerConfirm = (
    code: string,
    format: string,
    extra?: { mode: string; location?: string; anaquel?: string; piso?: string; pkg?: Paquete; cli?: Cliente }
  ) => {
    // 6.4 Reasignar: la ubicación ya se persistió vía onSlotPackage; no se encola en la cola de lecturas
    if (extra?.mode === 'relocate') {
      const foundPkg = extra.pkg || paquetes.find(p => p.numeroReciboBodega.toUpperCase() === code.toUpperCase() || p.trackingUsa.toUpperCase() === code.toUpperCase());
      setRelocatedSessionLogs(prev => [{
        id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code,
        consignatario: foundPkg?.nombreConsignatario || 'Sin registro en inventario',
        from: foundPkg?.posicionEstante || 'Sin ubicar',
        to: extra.location || 'REC-P1',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, ...prev]);
      soundEffects.playSuccess();
      return;
    }
    onConfirm(code, format, extra);

    // Si estamos en 6.2 Localizar 360, seleccionar inmediatamente la ficha del paquete
    if (currentSub === 'lookup' && extra?.pkg) {
      setSelectedPackage360(extra.pkg);
    }

    // Si estamos en 6.3 Despachar, registrar en la lista de despacho de la sesión
    if (currentSub === 'delivery') {
      const foundPkg = extra?.pkg || paquetes.find(p => p.numeroReciboBodega.toUpperCase() === code.toUpperCase() || p.trackingUsa.toUpperCase() === code.toUpperCase());
      const newDispatchItem = {
        id: `dsp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: code,
        consignatario: foundPkg?.nombreConsignatario || 'Cliente AMEX',
        dispatchType: dispatchType === 'AMEX' ? '🚐 Reparto AMEX' : dispatchType === 'SHALOM' ? '📦 Shalom Express' : dispatchType === 'OLVA' ? '🚚 Olva Courier' : '🏢 Retiro en Tienda',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        operator: formatOperatorName(currentUser),
        pkg: foundPkg
      };
      setDispatchedSessionLogs(prev => [newDispatchItem, ...prev]);

      // Alerta sonora según estado de pago del paquete
      const pkgDebt = (foundPkg as unknown as { saldoPendiente?: number })?.saldoPendiente;
      if (typeof pkgDebt === 'number' && pkgDebt > 0) {
        soundEffects.playNotFound();
      } else {
        soundEffects.playSuccess();
      }
    }
  };

  // Búsqueda 360° en vivo
  const lookupMatch = useMemo(() => {
    const q = liveSearchQuery.trim().toUpperCase();
    if (!q) return null;

    const foundPkg = paquetes.find(p =>
      p.numeroReciboBodega.toUpperCase() === q ||
      p.trackingUsa.toUpperCase() === q ||
      p.dniConsignatario?.toUpperCase() === q ||
      p.nombreConsignatario?.toUpperCase().includes(q)
    );

    const foundCli = clientes.find(c =>
      c.documentoIdentidad === q ||
      (foundPkg && c.nombre.toUpperCase() === (foundPkg.nombreConsignatario || '').toUpperCase())
    );

    return {
      pkg: foundPkg,
      cli: foundCli,
      query: liveSearchQuery
    };
  }, [liveSearchQuery, paquetes, clientes]);

  const activePackageIn360 = selectedPackage360 || lookupMatch?.pkg;

  const matchingClientFor360 = useMemo(() => {
    if (!activePackageIn360) return null;
    return clientes.find(c =>
      (activePackageIn360.dniConsignatario && c.documentoIdentidad === activePackageIn360.dniConsignatario) ||
      (activePackageIn360.nombreConsignatario && c.nombre.toUpperCase() === activePackageIn360.nombreConsignatario.toUpperCase())
    ) || lookupMatch?.cli || null;
  }, [activePackageIn360, clientes, lookupMatch]);

  const activeConsigneePhone = matchingClientFor360?.telefono || '';
  const activePkgDebt = (activePackageIn360 as unknown as { saldoPendiente?: number })?.saldoPendiente;

  // Lista de paquetes filtrados para el catálogo rápido en 6.2 Localizar 360°
  const catalog360List = useMemo(() => {
    if (!liveSearchQuery.trim()) {
      return paquetes.slice(0, 15);
    }
    return paquetes.filter(p =>
      matchesFuzzySearch(liveSearchQuery, [
        p.numeroReciboBodega,
        p.trackingUsa,
        p.nombreConsignatario,
        p.dniConsignatario,
        p.posicionEstante
      ])
    ).slice(0, 20);
  }, [paquetes, liveSearchQuery]);

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
      

      {/* NOTIFICACIÓN FLOTANTE */}
      {syncNotification && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '10px', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span>{syncNotification}</span>
        </div>
      )}

      {/* ALERTA FUERA DE LÍNEA */}
      {!isOnline && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '10px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(180,83,9,0.1)' }}>
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>📡 <strong>Modo Fuera de Línea:</strong> Sin conexión a Internet detectada. Tus lecturas se guardan localmente en tu equipo con total seguridad.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 SUBMÓDULO 6.1: ASIGNAR ANAQUEL (SLOTTING WMS) */}
      {/* ========================================================================= */}
      {currentSub === 'slotting' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px', alignItems: 'start' }}>
          
          {/* LADO IZQUIERDO: VISOR DE CÁMARA CONFIGURADO EN MODO SLOTTING */}
          <div>
            <MobileScannerModal
              isOpen={true}
              isInline={true}
              paquetes={paquetes}
              clientes={clientes}
              currentUser={currentUser}
              onClose={() => {}}
              onConfirm={handleScannerConfirm}
              onSlotPackage={onSlotPackage}
              activeWorkflowMode="slotting"
              hideWorkflowSelector={true}
            />
          </div>

          {/* LADO DERECHO: BANDEJA DE SUBIDA A MASTER & KPI */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* KPI RIBBON DE COLA LOCAL Y LECTURAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <div
                onClick={() => setStatusFilter('PENDING')}
                style={{
                  background: statusFilter === 'PENDING' ? '#fef3c7' : '#ffffff',
                  border: statusFilter === 'PENDING' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                  🟡 Cola Local (Pendientes)
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#92400e', marginTop: '2px' }}>
                  {pendingLogs.length} <span style={{ fontSize: '11px', fontWeight: 700 }}>lecturas</span>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('SYNCED')}
                style={{
                  background: statusFilter === 'SYNCED' ? '#dcfce7' : '#ffffff',
                  border: statusFilter === 'SYNCED' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>
                  🟢 Sincronizados Master
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#166534', marginTop: '2px' }}>
                  {syncedLogs.length} <span style={{ fontSize: '11px', fontWeight: 700 }}>guardados</span>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter('ALL')}
                style={{
                  background: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                  border: statusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                  📦 Total en Sesión
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e3a8a', marginTop: '2px' }}>
                  {scannedLogs.length} <span style={{ fontSize: '11px', fontWeight: 700 }}>totales</span>
                </div>
              </div>
            </div>

            {/* BANDEJA DE CONTROL & AUDITORÍA DE LECTURAS LOCALES */}
            <div className="card-panel">
              <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Barcode className="w-4 h-4 text-blue-600" /> Cola de Lecturas & Confirmación Master
                  </h3>
                  <span className="panel-count">{filteredLogs.length}</span>
                </div>

                {/* Acciones de la Bandeja */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => setIsConfirmSyncModalOpen(true)}
                    disabled={isSyncing || (selectedIds.length === 0 && pendingLogs.length === 0)}
                    className="btn btn-primary"
                    style={{
                      height: '34px',
                      padding: '0 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: (selectedIds.length > 0 || pendingLogs.length > 0) ? '#16a34a' : '#94a3b8',
                      border: 'none',
                      boxShadow: (selectedIds.length > 0 || pendingLogs.length > 0) ? '0 2px 8px rgba(22,163,74,0.35)' : 'none'
                    }}
                    title="Confirmar y subir a base de datos master"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Subir a BD Master ({selectedIds.length > 0 ? selectedIds.length : pendingLogs.length})
                  </button>

                  {selectedIds.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="btn"
                      style={{ height: '34px', padding: '0 8px', fontSize: '11.5px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700 }}
                      title="Descartar lecturas seleccionadas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={handleCopyAll}
                    className="btn btn-secondary"
                    style={{ height: '34px', padding: '0 8px', fontSize: '11.5px', borderRadius: '8px', fontWeight: 700 }}
                    title="Copiar lista de códigos"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedNotification ? '¡Copiado!' : 'Copiar'}
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="btn btn-secondary"
                    style={{ height: '34px', padding: '0 8px', fontSize: '11.5px', borderRadius: '8px', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                    title="Exportar cola de lecturas a Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx)
                  </button>

                  {onRefreshData && (
                    <button
                      onClick={onRefreshData}
                      className="btn btn-secondary"
                      style={{ height: '34px', padding: '0 8px', fontSize: '11.5px', borderRadius: '8px', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                      title="Sincronizar base de datos con lector"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Actualizar
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros rápidos y buscador */}
              <div style={{ padding: '0 16px 10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleSelectAllFiltered}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#334155'
                    }}
                  >
                    {selectedIds.length > 0 && selectedIds.length === filteredLogs.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                  </button>

                  {pendingLogs.length > 0 && (
                    <button
                      onClick={handleSelectOnlyPending}
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: '#92400e'
                      }}
                    >
                      Seleccionar Solo Pendientes ({pendingLogs.length})
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: '280px' }}>
                  <Search className="w-3.5 h-3.5 text-slate-400" style={{ position: 'absolute', left: '8px', top: '9px' }} />
                  <input
                    type="text"
                    placeholder="Buscar en lecturas..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: '30px',
                      paddingLeft: '28px',
                      paddingRight: '8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* TABLA DE LECTURAS LOCALES */}
              {filteredLogs.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                        <th style={{ width: '36px', padding: '8px 10px', textAlign: 'center' }}>✓</th>
                        <th style={{ padding: '8px 10px' }}>Código / WR</th>
                        <th style={{ padding: '8px 10px' }}>Ubicación Asignada</th>
                        <th style={{ padding: '8px 10px' }}>Operador</th>
                        <th style={{ padding: '8px 10px' }}>Estado BD</th>
                        <th style={{ padding: '8px 10px' }}>Hora</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map(log => {
                        const isSelected = selectedIds.includes(log.id);
                        const isA1 = log.location?.startsWith('A1');
                        const isA2 = log.location?.startsWith('A2');

                        return (
                          <tr
                            key={log.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(log.id)}
                              />
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#0f172a' }}>
                                {log.code}
                              </div>
                              {log.nombreConsignatario && (
                                <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                  {log.nombreConsignatario}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {log.location ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    background: isA1 ? '#dbeafe' : isA2 ? '#dcfce7' : '#fef3c7',
                                    color: isA1 ? '#1e40af' : isA2 ? '#166534' : '#92400e',
                                    border: `1px solid ${isA1 ? '#93c5fd' : isA2 ? '#86efac' : '#fde68a'}`
                                  }}
                                >
                                  <Layers className="w-3 h-3" />
                                  {log.location}
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Recepción General</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <User className="w-3 h-3 text-slate-400" />
                                {log.operadorNombre || formatOperatorName(currentUser || { email: log.operadorEmail })}
                              </div>
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {log.synced ? (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    color: '#16a34a',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: '#dcfce7',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}
                                  title={log.syncedAt ? `Confirmado en Supabase a las ${new Date(log.syncedAt).toLocaleTimeString()}` : 'Confirmado en Supabase'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Sincronizado Master
                                </span>
                              ) : isSyncing && (selectedIds.length === 0 || selectedIds.includes(log.id)) ? (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    color: '#2563eb',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: '#dbeafe',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" /> Subiendo lote...
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 800,
                                    color: '#b45309',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: '#fef3c7',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Borrador Local
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                              {log.time}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  onClick={() => setEditingLog(log)}
                                  title="Editar ubicación o código antes de sincronizar"
                                  style={{
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    color: '#334155',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {!log.synced && (
                                  <button
                                    onClick={() => handleSyncSingleLog(log)}
                                    title="Subir solo este paquete a la base de datos master"
                                    style={{
                                      background: '#f0fdf4',
                                      border: '1px solid #86efac',
                                      color: '#16a34a',
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <UploadCloud className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  title="Descartar de la cola local"
                                  style={{
                                    background: '#fef2f2',
                                    border: '1px solid #fecaca',
                                    color: '#dc2626',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  <Barcode style={{ width: '36px', height: '36px', margin: '0 auto 10px auto', color: '#cbd5e1' }} />
                  {scannedLogs.length === 0 ? (
                    <>
                      <p style={{ fontWeight: 700, color: '#475569', margin: 0 }}>Sin lecturas en cola</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Escanea o escribe guías WR con la cámara. Se guardarán en tu navegador para que las revises antes de subirlas.
                      </p>
                    </>
                  ) : (
                    <p style={{ fontWeight: 600, color: '#64748b', margin: 0 }}>
                      No se encontraron registros con los filtros seleccionados.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 SUBMÓDULO 6.2: LOCALIZAR 360° & AUDITORÍA */}
      {/* ========================================================================= */}
      {currentSub === 'lookup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* BARRA DE BÚSQUEDA HERO 360° */}
          <div style={{ background: '#ffffff', border: '1.5px solid #16a34a', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 14px rgba(22,163,74,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search className="w-5 h-5 text-green-600" /> Búsqueda 360° & Localizador en Almacén
              </span>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '999px', fontWeight: 800 }}>
                Instantáneo & Sin Modificar BD
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', width: '18px', height: '18px', color: '#15803d' }} />
              <input
                type="text"
                placeholder="Ingresa o pega Guía WR#, Tracking USA, DNI o Nombre de Consignatario..."
                value={liveSearchQuery}
                onChange={e => {
                  setLiveSearchQuery(e.target.value);
                  if (selectedPackage360) setSelectedPackage360(null);
                }}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 38px',
                  borderRadius: '10px',
                  border: '2px solid #86efac',
                  fontSize: '14px',
                  background: '#f0fdf4',
                  outline: 'none',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              />
              {liveSearchQuery && (
                <button
                  onClick={() => {
                    setLiveSearchQuery('');
                    setSelectedPackage360(null);
                  }}
                  style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* GRID PRINCIPAL: LECTOR ÓPTICO (IZQ) Y FICHA DETALLADA 360° (DER) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px', alignItems: 'start' }}>
            
            {/* LADO IZQUIERDO: VISOR DE CÁMARA EN MODO CONSULTA (LOOKUP) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MobileScannerModal
                isOpen={true}
                isInline={true}
                paquetes={paquetes}
                clientes={clientes}
                currentUser={currentUser}
                onClose={() => {}}
                onConfirm={handleScannerConfirm}
                onSlotPackage={onSlotPackage}
                activeWorkflowMode="lookup"
                hideWorkflowSelector={true}
              />

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', fontSize: '11.5px', color: '#64748b' }}>
                <span style={{ fontWeight: 800, color: '#334155' }}>💡 Tip de Operación 360°:</span> Apunta con la cámara a cualquier guía para cargar automáticamente su ficha completa con ubicación física, datos de contacto y estado de pago sin alterar el inventario.
              </div>
            </div>

            {/* LADO DERECHO: GRAN FICHA 360° DEL PAQUETE / CLIENTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activePackageIn360 ? (
                <div style={{ background: '#ffffff', border: '2px solid #86efac', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 16px rgba(22,163,74,0.1)' }}>
                  
                  {/* Encabezado con Ubicación Física Destacada */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                        Guía de Entrada AMEX
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 900, color: '#15803d' }}>
                        {activePackageIn360.numeroReciboBodega}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                        Tracking USA: <strong>{activePackageIn360.trackingUsa}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Ubicación Física en Almacén:
                      </div>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontFamily: 'JetBrains Mono, monospace',
                          background: activePackageIn360.posicionEstante?.startsWith('A1') ? '#2563eb' : activePackageIn360.posicionEstante?.startsWith('A2') ? '#16a34a' : '#d97706',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                        {activePackageIn360.posicionEstante || `${activePackageIn360.anaquel || 'A1'}-${activePackageIn360.piso || 'P1'}`}
                      </span>
                    </div>
                  </div>

                  {/* Datos del Consignatario & Contacto Rápido WhatsApp */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <User className="w-4 h-4 text-blue-600" /> Información del Consignatario
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Nombre Completo:</span>
                        <strong style={{ color: '#0f172a' }}>{activePackageIn360.nombreConsignatario || 'Sin nombre'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>DNI / Documento:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{activePackageIn360.dniConsignatario || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Teléfono:</span>
                        <strong style={{ color: '#0f172a' }}>{activeConsigneePhone || 'N/A'}</strong>
                      </div>
                    </div>

                    {/* Botón WhatsApp Directo */}
                    {activeConsigneePhone && (
                      <div style={{ marginTop: '10px' }}>
                        <a
                          href={`https://wa.me/51${activeConsigneePhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${activePackageIn360.nombreConsignatario || 'Cliente'}, le saludamos de AMEX Courier. Le informamos que su paquete con Guía ${activePackageIn360.numeroReciboBodega} ya se encuentra clasificado y disponible en nuestro almacén.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#22c55e',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            boxShadow: '0 2px 6px rgba(34,197,94,0.3)'
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Enviar Mensaje por WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Estado de Pago y Especificaciones */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#166534', display: 'block', textTransform: 'uppercase' }}>
                        Estado de Pago
                      </span>
                      <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 900, color: typeof activePkgDebt === 'number' && activePkgDebt > 0 ? '#dc2626' : '#15803d' }}>
                        {typeof activePkgDebt === 'number' && activePkgDebt > 0 ? (
                          `⚠️ Pendiente de Pago: S/ ${activePkgDebt}`
                        ) : (
                          '✓ Pagado / Sin Deuda'
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e40af', display: 'block', textTransform: 'uppercase' }}>
                        Peso & Medidas
                      </span>
                      <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 900, color: '#1e3a8a' }}>
                        {activePackageIn360.pesoKg ? `${activePackageIn360.pesoKg} kg` : '0.50 kg'}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Consulta 360° */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setSelectedPackage360(null);
                        setLiveSearchQuery('');
                      }}
                      className="btn btn-secondary"
                      style={{ height: '34px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <X className="w-4 h-4 text-slate-500" /> Limpiar y Nueva Consulta 360°
                    </button>
                  </div>
                </div>
              ) : (
                /* Catálogo interactivo de paquetes si aún no ha seleccionado ninguno */
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      📋 Catálogo de Ubicaciones en Almacén ({catalog360List.length} mostrados)
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Selecciona uno para ver su ficha 360°</span>
                  </div>

                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Guía WR#</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Consignatario</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Ubicación</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalog360List.map(pkg => (
                          <tr
                            key={pkg.id || pkg.numeroReciboBodega}
                            style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                            onClick={() => setSelectedPackage360(pkg)}
                          >
                            <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#1e40af' }}>
                              {pkg.numeroReciboBodega}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#334155' }}>
                              {pkg.nombreConsignatario || 'Cliente AMEX'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  fontFamily: 'monospace',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: pkg.posicionEstante?.startsWith('A1') ? '#dbeafe' : pkg.posicionEstante?.startsWith('A2') ? '#dcfce7' : '#fef3c7',
                                  color: pkg.posicionEstante?.startsWith('A1') ? '#1e40af' : pkg.posicionEstante?.startsWith('A2') ? '#166534' : '#92400e'
                                }}
                              >
                                {pkg.posicionEstante || 'REC'}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackage360(pkg);
                                }}
                                style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #86efac',
                                  color: '#16a34a',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                Ver 360° ➔
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔄 SUBMÓDULO 6.4: REASIGNAR UBICACIÓN (EXCLUSIVO PARA CAMBIOS DE UBICACIÓN) */}
      {/* ========================================================================= */}
      {currentSub === 'relocate' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1.5px solid #fdba74', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw className="w-4 h-4" /> Modo Reasignación de Ubicación
              </div>
              <div style={{ fontSize: '11px', color: '#9a3412', marginTop: '2px', lineHeight: 1.4 }}>
                Elige el nuevo anaquel/piso, escanea o escribe la guía WR y confirma. <strong>La ubicación se actualiza al instante</strong> en el inventario.
              </div>
            </div>
            <MobileScannerModal
              isOpen={true}
              isInline={true}
              paquetes={paquetes}
              clientes={clientes}
              currentUser={currentUser}
              onClose={() => {}}
              onConfirm={handleScannerConfirm}
              onSlotPackage={onSlotPackage}
              activeWorkflowMode="relocate"
              hideWorkflowSelector={true}
            />
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff7ed' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>Reasignaciones de esta sesión</span>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#ffedd5', color: '#9a3412', padding: '2px 10px', borderRadius: '999px' }}>
                {relocatedSessionLogs.length}
              </span>
            </div>
            {relocatedSessionLogs.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                <RefreshCw style={{ width: '32px', height: '32px', margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                Aún no has reasignado paquetes en esta sesión.
              </div>
            ) : (
              <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                {relocatedSessionLogs.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#1e40af', fontSize: '12.5px' }}>{item.code}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.consignatario}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>{item.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
                      <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace', background: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '4px' }}>{item.to}</span>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'monospace' }}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚚 SUBMÓDULO 6.3: DESPACHAR & REPARTO */}
      {/* ========================================================================= */}
      {currentSub === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* SELECTOR DE MODALIDAD DE DESPACHO */}
          <div style={{ background: '#ffffff', border: '1.5px solid #d8b4fe', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 8px rgba(147,51,234,0.06)' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#7e22ce', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Truck className="w-4 h-4 text-purple-600" /> Modalidad y Destino de Salida Activo
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <div
                onClick={() => setDispatchType('AMEX')}
                style={{
                  background: dispatchType === 'AMEX' ? '#eff6ff' : '#f8fafc',
                  border: dispatchType === 'AMEX' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🚐</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: dispatchType === 'AMEX' ? '#1e40af' : '#334155' }}>
                    Reparto AMEX
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Motorizado / Móvil Lima</div>
                </div>
              </div>

              <div
                onClick={() => setDispatchType('SHALOM')}
                style={{
                  background: dispatchType === 'SHALOM' ? '#fef2f2' : '#f8fafc',
                  border: dispatchType === 'SHALOM' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>📦</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: dispatchType === 'SHALOM' ? '#991b1b' : '#334155' }}>
                    Shalom Express
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Agencia Provincia</div>
                </div>
              </div>

              <div
                onClick={() => setDispatchType('OLVA')}
                style={{
                  background: dispatchType === 'OLVA' ? '#fffbeb' : '#f8fafc',
                  border: dispatchType === 'OLVA' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🚚</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: dispatchType === 'OLVA' ? '#92400e' : '#334155' }}>
                    Olva Courier
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Agencia / Domicilio</div>
                </div>
              </div>

              <div
                onClick={() => setDispatchType('TIENDA')}
                style={{
                  background: dispatchType === 'TIENDA' ? '#f0fdf4' : '#f8fafc',
                  border: dispatchType === 'TIENDA' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '18px' }}>🏢</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: dispatchType === 'TIENDA' ? '#166534' : '#334155' }}>
                    Entrega en Almacén
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>Retiro en Tienda / Mostrador</div>
                </div>
              </div>
            </div>
          </div>

          {/* GRID PRINCIPAL: LECTOR DE SALIDA (IZQ) Y MANIFIESTO DE DESPACHO (DER) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px', alignItems: 'start' }}>
            
            {/* LADO IZQUIERDO: VISOR DE CÁMARA CONFIGURADO EN MODO DESPACHO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <MobileScannerModal
                isOpen={true}
                isInline={true}
                paquetes={paquetes}
                clientes={clientes}
                currentUser={currentUser}
                onClose={() => {}}
                onConfirm={handleScannerConfirm}
                onSlotPackage={onSlotPackage}
                activeWorkflowMode="delivery"
                hideWorkflowSelector={true}
              />

              {/* CARD DE SEGURIDAD CONTRA ENTREGAS CON DEUDA */}
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ShieldCheck className="w-5 h-5 text-red-600 shrink-0" style={{ marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#991b1b', lineHeight: '1.4' }}>
                  <strong>Control Estricto de Deudas:</strong> Si el paquete escaneado tiene saldo pendiente en el Módulo de Cobros, el sistema emitirá una alerta sonora de bloqueo para prevenir entregas no autorizadas.
                </div>
              </div>
            </div>

            {/* LADO DERECHO: MANIFIESTO DE DESPACHO EN SESIÓN */}
            <div className="card-panel">
              <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck className="w-4 h-4 text-purple-600" /> Manifiesto de Salidas & Despachos Hoy
                  </h3>
                  <span className="panel-count">{dispatchedSessionLogs.length}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {dispatchedSessionLogs.length > 0 && (
                    <button
                      onClick={() => {
                        const exportData = dispatchedSessionLogs.map(d => ({
                          id: d.id,
                          code: d.code,
                          format: 'CODE_128',
                          time: d.time,
                          timestamp: Date.now(),
                          location: d.dispatchType,
                          workflow: 'delivery' as const,
                          nombreConsignatario: d.consignatario,
                          operadorNombre: d.operator,
                          synced: true
                        }));
                        exportScannerLogsToExcel(exportData, `Manifiesto_Despacho_${dispatchType}`);
                      }}
                      className="btn btn-secondary"
                      style={{ height: '32px', fontSize: '11.5px', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Exportar Manifiesto
                    </button>
                  )}
                </div>
              </div>

              {/* TABLA DE DESPACHOS REGISTRADOS */}
              {dispatchedSessionLogs.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Guía WR#</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Consignatario</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Destino / Courier</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hora</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Operador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchedSessionLogs.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#7e22ce' }}>
                            {item.code}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#0f172a', fontWeight: 600 }}>
                            {item.consignatario}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, background: '#faf5ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '2px 7px', borderRadius: '4px' }}>
                              {item.dispatchType}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b', fontFamily: 'monospace' }}>
                            {item.time}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#334155', fontSize: '11.5px' }}>
                            {item.operator}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  <Truck style={{ width: '36px', height: '36px', margin: '0 auto 10px auto', color: '#cbd5e1' }} />
                  <p style={{ fontWeight: 700, color: '#475569', margin: 0 }}>Sin despachos registrados en esta sesión</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Escanea los paquetes que salen a reparto o se entregan en mostrador para incluirlos en el manifiesto.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 MODAL DE CONFIRMACIÓN FINAL PARA SUBIR A SUPABASE MASTER */}
      {isConfirmSyncModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a' }}>
                <ShieldCheck className="w-5 h-5" /> Confirmación Final de Sincronización Master
              </span>
              <button
                onClick={() => !isSyncing && setIsConfirmSyncModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                  Resumen del Lote a Guardar:
                </div>
                <div style={{ fontSize: '12px', color: '#334155' }}>
                  Vas a procesar y guardar permanentemente{' '}
                  <strong>
                    {selectedIds.length > 0 ? selectedIds.length : pendingLogs.length} paquete(s)
                  </strong>{' '}
                  en la base de datos de <strong>Supabase</strong> con sus ubicaciones de estantes y registros inmutables en el <strong>Kardex de Movimientos</strong>.
                </div>
              </div>

              {/* Lista previa compacta */}
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#f8fafc' }}>
                {(selectedIds.length > 0 ? scannedLogs.filter(l => selectedIds.includes(l.id)) : pendingLogs).map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{l.code}</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>➔ {l.location || 'REC'}</span>
                  </div>
                ))}
              </div>

              {isSyncing && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#16a34a', marginBottom: '4px' }}>
                    <span>Guardando en Supabase Master...</span>
                    <span>{syncProgress.current} / {syncProgress.total}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: '#16a34a',
                        width: `${syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}%`,
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => setIsConfirmSyncModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleExecuteMasterSync}
                className="btn btn-primary"
                style={{ background: '#16a34a', borderColor: '#15803d', fontWeight: 800 }}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>✓ Confirmar y Subir a Base de Datos Master</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ MODAL DE EDICIÓN RÁPIDA DE LECTURA LOCAL */}
      {editingLog && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 className="w-4 h-4 text-blue-600" /> Modificar Lectura en Cola Local
              </span>
              <button
                onClick={() => setEditingLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLog} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Código / Guía WR</label>
                <input
                  type="text"
                  value={editingLog.code}
                  onChange={e => setEditingLog({ ...editingLog, code: e.target.value.toUpperCase() })}
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontWeight: 800 }}
                  required
                />
              </div>

              <div className="wms-modal-grid-2">
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Anaquel Físico</label>
                  <select
                    value={editingLog.anaquel || 'A1'}
                    onChange={e => setEditingLog({ ...editingLog, anaquel: e.target.value })}
                    className="form-control"
                  >
                    <option value="A1">Anaquel 1 (A1)</option>
                    <option value="A2">Anaquel 2 (A2)</option>
                    <option value="REC">Recepción (REC)</option>
                    <option value="DSP">Despacho (DSP)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Piso / Nivel</label>
                  <select
                    value={editingLog.piso || 'P1'}
                    onChange={e => setEditingLog({ ...editingLog, piso: e.target.value })}
                    className="form-control"
                  >
                    <option value="P1">P1 (Piso 1 · Inferior)</option>
                    <option value="P2">P2 (Piso 2 · Medio)</option>
                    <option value="P3">P3 (Piso 3 · Medio Alto)</option>
                    <option value="P4">P4 (Piso 4 · Superior)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '8px' }}>
                <button type="button" onClick={() => setEditingLog(null)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
                  ✓ Guardar Modificación Local
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
