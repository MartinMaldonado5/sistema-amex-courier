import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ItemCotejo, HojaCotejo, TipoEstadoItemCotejo } from '@/types';
import { Collaborator, ANIMAL_ALIASES, AVATAR_COLORS, ActiveCell } from '../types';

interface UseLiveSheetsPresenceProps {
  activeHojaId: string | null;
  currentUser?: { nombre: string; rol: string } | null;
  activeCell: ActiveCell;
  setItems: React.Dispatch<React.SetStateAction<ItemCotejo[]>>;
  setHojas: React.Dispatch<React.SetStateAction<HojaCotejo[]>>;
  setDocTitle: React.Dispatch<React.SetStateAction<string>>;
}

export function useLiveSheetsPresence({
  activeHojaId,
  currentUser,
  activeCell,
  setItems,
  setHojas,
  setDocTitle
}: UseLiveSheetsPresenceProps) {
  const operatorName = currentUser?.nombre || 'Operador Lince';

  // Identidad aleatoria/consistente del Operador para Colaboración en Vivo
  const [myIdentity] = useState<{ id: string; name: string; color: string }>(() => {
    if (typeof window === 'undefined') {
      return { id: 'usr_init', name: operatorName, color: '#1a73e8' };
    }
    try {
      const savedId = sessionStorage.getItem('amex_cotejo_uid') || `usr_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('amex_cotejo_uid', savedId);

      let savedName = sessionStorage.getItem('amex_cotejo_name');
      if (!savedName) {
        if (currentUser?.nombre && currentUser.nombre !== 'Operador Lince') {
          savedName = currentUser.nombre;
        } else {
          savedName = ANIMAL_ALIASES[Math.floor(Math.random() * ANIMAL_ALIASES.length)];
        }
        sessionStorage.setItem('amex_cotejo_name', savedName);
      }

      const savedColor =
        sessionStorage.getItem('amex_cotejo_color') ||
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      sessionStorage.setItem('amex_cotejo_color', savedColor);

      return { id: savedId, name: savedName, color: savedColor };
    } catch {
      return { id: `usr_${Date.now()}`, name: operatorName, color: '#1a73e8' };
    }
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { name: string; color: string; cell: string }>>({});
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!activeHojaId) return;

    // Conectar canal Realtime
    const channel = supabase.channel(`cotejo-hoja-${activeHojaId}`, {
      config: {
        presence: { key: myIdentity.id }
      }
    });

    realtimeChannelRef.current = channel;

    // A. Escuchar cuando un usuario pistolea o modifica una fila
    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hojas_cotejo_items',
          filter: `hoja_id=eq.${activeHojaId}`
        },
        payload => {
          const row = payload.new as any;
          if (!row || !row.id) return;

          setItems(prev =>
            prev.map(it => {
              if (it.id !== row.id) return it;
              return {
                ...it,
                codigoWr: row.codigo_wr ?? it.codigoWr,
                casillero: row.casillero ?? it.casillero,
                consignatario: row.consignatario ?? it.consignatario,
                trackingUsa: row.tracking_usa ?? it.trackingUsa,
                pesoKg: row.peso_kg !== undefined ? Number(row.peso_kg) : it.pesoKg,
                posicionEstante: row.posicion_estante ?? it.posicionEstante,
                notas: row.notas ?? it.notas,
                estado: (row.estado as TipoEstadoItemCotejo) ?? it.estado,
                escaneadoEn: row.escaneado_en ?? it.escaneadoEn,
                escaneadoPor: row.escaneado_por ?? it.escaneadoPor,
                vecesEscaneado: row.veces_escaneado ?? it.vecesEscaneado,
                orden: row.orden ?? it.orden,
                actualizadoEn: row.actualizado_en ?? it.actualizadoEn
              };
            })
          );
        }
      )
      // B. Escuchar cuando se inserta una nueva fila
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hojas_cotejo_items',
          filter: `hoja_id=eq.${activeHojaId}`
        },
        payload => {
          const row = payload.new as any;
          if (!row || !row.id) return;

          setItems(prev => {
            if (prev.some(it => it.id === row.id)) return prev;
            const mapped: ItemCotejo = {
              id: row.id,
              hojaId: row.hoja_id,
              codigoWr: row.codigo_wr || '',
              casillero: row.casillero || '',
              consignatario: row.consignatario || '',
              trackingUsa: row.tracking_usa || '',
              pesoKg: Number(row.peso_kg || 0),
              posicionEstante: row.posicion_estante || 'REC',
              notas: row.notas || '',
              estado: (row.estado as TipoEstadoItemCotejo) || 'PENDIENTE',
              escaneadoEn: row.escaneado_en,
              escaneadoPor: row.escaneado_por,
              vecesEscaneado: row.veces_escaneado || 0,
              orden: row.orden || prev.length + 1,
              creadoEn: row.creado_en,
              actualizadoEn: row.actualizado_en
            };
            return [...prev, mapped];
          });
        }
      )
      // C. Escuchar eliminación de filas
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'hojas_cotejo_items'
        },
        payload => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setItems(prev => prev.filter(it => it.id !== deletedId));
          }
        }
      )
      // D. Escuchar cambios en la cabecera de la hoja (renombrar título)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hojas_cotejo'
        },
        payload => {
          if (payload.eventType === 'UPDATE' && payload.new?.id === activeHojaId) {
            setDocTitle(payload.new.titulo || 'AMEX WR');
            setHojas(prev =>
              prev.map(h => (h.id === payload.new.id ? { ...h, titulo: payload.new.titulo } : h))
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const h = payload.new as any;
            setHojas(prev => {
              if (prev.some(sheet => sheet.id === h.id)) return prev;
              return [
                ...prev,
                {
                  id: h.id,
                  titulo: h.titulo,
                  descripcion: h.descripcion || '',
                  tipoProceso: h.tipo_proceso || 'RECEPCION_LINCE',
                  estado: h.estado || 'ACTIVA',
                  creadoPor: h.creado_por || 'AMEX',
                  creadoEn: h.creado_en,
                  actualizadoEn: h.actualizado_en
                }
              ];
            });
          }
        }
      )
      // E. Presencia en tiempo real
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeUsers: Collaborator[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const p = presences[0];
            activeUsers.push({
              id: key,
              name: p.name || 'Operador',
              color: p.color || '#1a73e8',
              isCurrent: key === myIdentity.id,
              activeCell: p.activeCell,
              lastSeen: p.onlineAt
            });
          }
        });
        setCollaborators(activeUsers);
      })
      // F. Broadcast de celda enfocada
      .on('broadcast', { event: 'cell_focus' }, ({ payload }) => {
        if (!payload || payload.userId === myIdentity.id) return;
        setRemoteCursors(prev => ({
          ...prev,
          [payload.userId]: {
            name: payload.name,
            color: payload.color,
            cell: payload.cell
          }
        }));
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('CONNECTED');
          await channel.track({
            id: myIdentity.id,
            name: myIdentity.name,
            color: myIdentity.color,
            activeCell: `${activeCell.col}${activeCell.row}`,
            onlineAt: new Date().toISOString()
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('DISCONNECTED');
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
    };
  }, [activeHojaId, myIdentity, setDocTitle, setHojas, setItems]);

  // Broadcast cell focus
  const broadcastActiveCell = useCallback(
    (col: string, row: number) => {
      if (realtimeChannelRef.current && realtimeStatus === 'CONNECTED') {
        const cellKey = `${col}${row}`;
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'cell_focus',
          payload: {
            userId: myIdentity.id,
            name: myIdentity.name,
            color: myIdentity.color,
            cell: cellKey
          }
        });
      }
    },
    [myIdentity, realtimeStatus]
  );

  // Obtener cursor remoto si hay otro usuario en esa celda
  const getRemoteUserOnCell = useCallback(
    (col: string, rowNum: number) => {
      const cellKey = `${col}${rowNum}`;
      return Object.values(remoteCursors).find(c => c.cell === cellKey);
    },
    [remoteCursors]
  );

  return {
    operatorName,
    myIdentity,
    collaborators,
    realtimeStatus,
    remoteCursors,
    broadcastActiveCell,
    getRemoteUserOnCell
  };
}
