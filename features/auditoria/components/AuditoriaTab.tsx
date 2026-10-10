'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryService } from '@/features/inventory/services/inventory.service';
import KardexView from '@/features/inventory/components/KardexView';
import { MovimientoKardex } from '@/types';
import { exportKardexToExcel } from '@/lib/excelExport';
import { supabase } from '@/lib/supabase/client';

interface AuditRecord {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string;
  usuario_email: string;
  modulo: string;
  accion: string;
  registro_id: string | null;
  detalles: string | null;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  ip_origen: string | null;
  creado_en: string;
}

export default function AuditoriaTab() {
  const [activeSubTab, setActiveSubTab] = useState<'forense' | 'kardex'>('forense');

  // Logs Forenses de Sistema
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModulo, setFilterModulo] = useState<string>('TODOS');
  const [filterAccion, setFilterAccion] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Bitácora de Movimientos y Custodia WMS (Kardex)
  const [kardexList, setKardexList] = useState<MovimientoKardex[]>([]);
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTypeFilter, setKardexTypeFilter] = useState('ALL');
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterModulo !== 'TODOS') params.set('modulo', filterModulo);
      if (filterAccion !== 'TODOS') params.set('accion', filterAccion);

      const response = await fetch(`/api/auditoria?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo consultar la auditoría.');
      setLogs((payload.logs as AuditRecord[]) || []);
    } catch (err) {
      console.warn('Error fetching auditoria_sistema:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterModulo, filterAccion]);

  const fetchKardexLogs = useCallback(async () => {
    setIsLoadingKardex(true);
    try {
      const data = await inventoryService.getKardex(200);
      setKardexList(data);
    } catch (err) {
      console.error('Error fetching kardex in auditoria:', err);
    } finally {
      setIsLoadingKardex(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchKardexLogs();

    const kardexChannel = supabase
      .channel('auditoria_kardex_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movimientos_kardex' },
        payload => {
          const row = payload.new as any;
          if (!row) return;
          setKardexList(prev => [
            {
              id: row.id,
              paqueteId: row.paquete_id,
              codigoPaquete: row.codigo_paquete,
              consignatario: row.consignatario || '',
              origenDescripcion: row.origen_descripcion,
              destinoDescripcion: row.destino_descripcion,
              tipoMovimiento: row.tipo_movimiento,
              motivo: row.motivo || '',
              usuarioOperador: row.usuario_operador || 'Operador AMEX',
              creadoEn: row.creado_en || new Date().toISOString()
            },
            ...prev
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kardexChannel);
    };
  }, [fetchKardexLogs]);

  const filteredKardex = useMemo(() => {
    return kardexList.filter(k => {
      const q = kardexSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (k.codigoPaquete || '').toLowerCase().includes(q) ||
        (k.consignatario || '').toLowerCase().includes(q) ||
        (k.origenDescripcion || '').toLowerCase().includes(q) ||
        (k.destinoDescripcion || '').toLowerCase().includes(q) ||
        (k.usuarioOperador || '').toLowerCase().includes(q);
      const matchesType = kardexTypeFilter === 'ALL' || k.tipoMovimiento === kardexTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [kardexList, kardexSearch, kardexTypeFilter]);

  const handleExportKardexExcel = () => {
    exportKardexToExcel(filteredKardex, 'Bitacora_Movimientos_Custodia_AMEX');
  };

  // Restaurar registro en 1-clic (Gobernanza de Datos)
  const handleRestaurar = async (log: AuditRecord) => {
    if (!log.registro_id) {
      alert('Este registro no posee un identificador de destino para restaurar.');
      return;
    }

    if (!confirm(`¿Deseas restaurar este registro (${log.registro_id}) al sistema activo?`)) {
      return;
    }

    setRestoringId(log.id);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: log.modulo,
          registro_id: log.registro_id,
          audit_log_id: log.id
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'No se pudo restaurar el registro.');

      setStatusMessage({
        text: `Registro ${log.registro_id} restaurado correctamente. Ya está visible de nuevo en ${log.modulo.toLowerCase()}.`,
        type: 'success'
      });

      await fetchAuditLogs();
    } catch (err) {
      console.error('Error restaurando registro:', err);
      setStatusMessage({
        text: 'Ocurrió un error al restaurar el registro. Consulta la consola.',
        type: 'error'
      });
    } finally {
      setRestoringId(null);
    }
  };

  const filteredLogs = logs.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.usuario_nombre.toLowerCase().includes(term) ||
      item.usuario_email.toLowerCase().includes(term) ||
      (item.registro_id && item.registro_id.toLowerCase().includes(term)) ||
      (item.detalles && item.detalles.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header del Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px', color: '#d97706', display: 'flex' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '20px' }}></i>
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              14. Auditoría, Gobernanza & Custodia
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Registro cronológico inmutable de cambios de sistema, restauración de datos y cadena de custodia física WMS.
          </p>
        </div>

        {activeSubTab === 'forense' && (
          <button
            onClick={fetchAuditLogs}
            disabled={isLoading}
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
            Refrescar Timeline
          </button>
        )}
      </div>

      {/* Subpestañas de Auditoría */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('forense')}
          style={{
            background: activeSubTab === 'forense' ? '#2563eb' : '#ffffff',
            color: activeSubTab === 'forense' ? '#ffffff' : '#475569',
            border: activeSubTab === 'forense' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'forense' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
          }}
        >
          <i className="fa-solid fa-shield-halved" />
          <span>1. Gobernanza & Cambios de Sistema</span>
          <span style={{
            background: activeSubTab === 'forense' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
            color: activeSubTab === 'forense' ? '#ffffff' : '#475569',
            fontSize: '11px',
            padding: '1px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}>
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kardex')}
          style={{
            background: activeSubTab === 'kardex' ? '#0f766e' : '#ffffff',
            color: activeSubTab === 'kardex' ? '#ffffff' : '#475569',
            border: activeSubTab === 'kardex' ? '1px solid #115e59' : '1px solid #cbd5e1',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'kardex' ? '0 2px 6px rgba(15,118,110,0.25)' : 'none'
          }}
        >
          <i className="fa-solid fa-clock-rotate-left" />
          <span>2. Bitácora de Movimientos y Custodia (Kardex)</span>
          <span style={{
            background: activeSubTab === 'kardex' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
            color: activeSubTab === 'kardex' ? '#ffffff' : '#475569',
            fontSize: '11px',
            padding: '1px 7px',
            borderRadius: '999px',
            fontWeight: 800
          }}>
            {kardexList.length}
          </span>
        </button>
      </div>

      {/* VISTA 1: Gobernanza & Cambios de Sistema Forense */}
      {activeSubTab === 'forense' && (
        <>
          {statusMessage && (
            <div
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13.5px',
                fontWeight: 600,
                background: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${statusMessage.type === 'success' ? '#86efac' : '#fca5a5'}`,
                color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <i className={`fa-solid ${statusMessage.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              {statusMessage.text}
            </div>
          )}

          {/* Barra de Filtros */}
          <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ flex: '1', minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
            Buscar por usuario, ID o detalle
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por texto..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
            Módulo
          </label>
          <select
            value={filterModulo}
            onChange={e => setFilterModulo(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
              fontWeight: 600
            }}
          >
            <option value="TODOS">Todos los módulos</option>
            <option value="INVENTARIO">Inventario</option>
            <option value="COBROS">Cobros</option>
            <option value="SHALOM">Boletas Shalom</option>
            <option value="ESCANER">Escáner</option>
            <option value="CLIENTES">Clientes</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
            Acción
          </label>
          <select
            value={filterAccion}
            onChange={e => setFilterAccion(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
              fontWeight: 600
            }}
          >
            <option value="TODOS">Todas las acciones</option>
            <option value="CREAR">CREAR</option>
            <option value="EDITAR">EDITAR</option>
            <option value="ELIMINAR_SOFT">ELIMINAR (Soft Delete)</option>
            <option value="RESTAURAR">RESTAURAR</option>
          </select>
        </div>
      </div>

      {/* Tabla de Eventos */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
              <th style={{ padding: '14px 18px' }}>Fecha & Hora</th>
              <th style={{ padding: '14px 18px' }}>Usuario</th>
              <th style={{ padding: '14px 18px' }}>Módulo</th>
              <th style={{ padding: '14px 18px' }}>Acción</th>
              <th style={{ padding: '14px 18px' }}>Registro Afectado</th>
              <th style={{ padding: '14px 18px' }}>Detalles / Motivo</th>
              <th style={{ padding: '14px 18px', textAlign: 'center' }}>Gobernanza</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Cargando eventos de auditoría...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron eventos registrados para este filtro.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const isSoftDeleted = log.accion === 'ELIMINAR_SOFT';
                const isRestoringThis = restoringId === log.id;

                let badgeColor = '#e2e8f0';
                let badgeTextColor = '#334155';
                if (log.accion === 'CREAR') {
                  badgeColor = '#dcfce7';
                  badgeTextColor = '#15803d';
                } else if (log.accion === 'EDITAR') {
                  badgeColor = '#dbeafe';
                  badgeTextColor = '#1d4ed8';
                } else if (log.accion === 'ELIMINAR_SOFT') {
                  badgeColor = '#fee2e2';
                  badgeTextColor = '#b91c1c';
                } else if (log.accion === 'RESTAURAR') {
                  badgeColor = '#fef3c7';
                  badgeTextColor = '#b45309';
                }

                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s ease' }}>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '12px' }}>
                      {new Date(log.creado_en).toLocaleString('es-PE')}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.usuario_nombre}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.usuario_email}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                        {log.modulo}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: badgeColor,
                          color: badgeTextColor
                        }}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: '12px', color: '#334155' }}>
                      {log.registro_id || '—'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569', maxWidth: '320px', wordBreak: 'break-word' }}>
                      {log.detalles || 'Sin observaciones'}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      {isSoftDeleted ? (
                        <button
                          onClick={() => handleRestaurar(log)}
                          disabled={isRestoringThis}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <i className={`fa-solid fa-rotate-left ${isRestoringThis ? 'fa-spin' : ''}`}></i>
                          Restaurar
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )}

  {/* VISTA 2: Bitácora de Movimientos y Custodia WMS (Kardex) */}
  {activeSubTab === 'kardex' && (
    <KardexView
      kardexList={kardexList}
      filteredKardex={filteredKardex}
      kardexSearch={kardexSearch}
      setKardexSearch={setKardexSearch}
      kardexTypeFilter={kardexTypeFilter}
      setKardexTypeFilter={setKardexTypeFilter}
      isLoadingKardex={isLoadingKardex}
      onRefreshKardex={fetchKardexLogs}
      onExportExcel={handleExportKardexExcel}
    />
  )}
</div>
  );
}
