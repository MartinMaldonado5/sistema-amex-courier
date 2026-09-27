'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModulo, setFilterModulo] = useState<string>('TODOS');
  const [filterAccion, setFilterAccion] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('auditoria_sistema')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(100);

      if (filterModulo !== 'TODOS') {
        query = query.eq('modulo', filterModulo);
      }
      if (filterAccion !== 'TODOS') {
        query = query.eq('accion', filterAccion);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data as AuditRecord[]) || []);
    } catch (err) {
      console.warn('Error fetching auditoria_sistema:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filterModulo, filterAccion]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

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
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;
      const currentUserName = authData?.user?.user_metadata?.nombre_completo || 'Administrador AMEX';
      const currentUserEmail = authData?.user?.email || 'admin@amexcourier.pe';

      if (log.modulo === 'INVENTARIO') {
        const { error } = await supabase
          .from('paquetes')
          .update({
            eliminado_en: null,
            eliminado_por: null,
            motivo_eliminacion: null
          })
          .eq('id', log.registro_id);

        if (error) throw error;
      } else if (log.modulo === 'COBROS') {
        const { error } = await supabase
          .from('cobros_vouchers')
          .update({
            eliminado_en: null,
            eliminado_por: null,
            motivo_eliminacion: null
          })
          .eq('id', log.registro_id);

        if (error) throw error;
      }

      // Registrar la acción de restauración en la auditoría inmutable
      await supabase.from('auditoria_sistema').insert({
        usuario_id: currentUserId,
        usuario_nombre: currentUserName,
        usuario_email: currentUserEmail,
        modulo: log.modulo,
        accion: 'RESTAURAR',
        registro_id: log.registro_id,
        detalles: `Restauración en 1-clic ejecutada con éxito para el evento de auditoría ${log.id}`,
        valores_anteriores: { audit_log_origen: log.id, accion_previa: log.accion },
        valores_nuevos: { restaurado: true, restaurado_en: new Date().toISOString() }
      });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px', color: '#d97706', display: 'flex' }}>
              <i className="fa-solid fa-shield-halved" style={{ fontSize: '20px' }}></i>
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Gobernanza de Datos & Auditoría Forense
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Registro cronológico inmutable de acciones. Protegido contra manipulación, con soporte de restauración en 1-clic.
          </p>
        </div>

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
      </div>

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
    </div>
  );
}
