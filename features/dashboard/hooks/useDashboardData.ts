'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Cliente,
  CobroVoucher,
  OrdenEntrega,
  Paquete,
  ScannedLog,
  TipoEstadoTib,
  TipoEstadoEntrega,
  TipoEstadoAmex,
  TipoMetodoEntrega,
  TipoUbicacion
} from '@/types';
import { supabase } from '@/lib/supabase/client';

function mapCliente(row: Record<string, unknown>): Cliente {
  return {
    id: String(row.id),
    nombre: String(row.nombre || ''),
    apellido: String(row.apellido || ''),
    documentoIdentidad: String(row.documento_identidad || ''),
    telefono: String(row.telefono || ''),
    email: String(row.email || ''),
    departamento: String(row.departamento || 'LIMA'),
    provincia: String(row.provincia || 'LIMA'),
    distrito: String(row.distrito || 'LINCE'),
    direccionEntrega: String(row.direccion_entrega || ''),
    creadoEn: String(row.creado_en || '')
  };
}

function mapPaquete(row: Record<string, unknown>): Paquete {
  const posicion = String(
    row.posicion_estante ||
      (row.anaquel && row.piso ? `${row.anaquel}-${row.piso}` : 'REC')
  );
  const [anaquel, piso] = posicion.includes('-') ? posicion.split('-') : [posicion, 'P1'];

  return {
    id: String(row.id),
    numeroReciboBodega: String(row.numero_recibo_bodega || ''),
    tracking: String(row.tracking || row.tracking_usa || ''),
    trackingUsa: String(row.tracking || row.tracking_usa || ''),
    tipoEmpaque: String(row.tipo_empaque || ''),
    numeroFactura: '',
    dniConsignatario: String(row.dni_consignatario || ''),
    nombreConsignatario: String(row.nombre_consignatario || ''),
    descripcion: String(row.descripcion || ''),
    pesoKg: row.peso_kg !== null && row.peso_kg !== undefined ? Number(row.peso_kg) : 0,
    ubicacionActual: (row.ubicacion_actual as TipoUbicacion) || 'AmexLince',
    anaquel: String(row.anaquel || anaquel),
    piso: String(row.piso || piso),
    posicionEstante: posicion,
    metodoEntrega: 'CarroAmexDomicilio',
    estadoTib: ((row.estado_tib || row.estado_entrega) as TipoEstadoTib) || 'EnAlmacen',
    estadoEntrega: ((row.estado_tib || row.estado_entrega) as TipoEstadoEntrega) || 'EnAlmacen',
    estadoAmex: (row.estado_amex === 'recibido' ? 'en_almacen' : ((row.estado_amex as TipoEstadoAmex) || 'en_almacen')),
    facturaPdfUrl: '',
    tibImagenUrl: row.tib_imagen_url ? String(row.tib_imagen_url) : undefined,
    tibTicketPdfUrl: row.tib_ticket_pdf_url ? String(row.tib_ticket_pdf_url) : undefined,
    usuarioEmail: String(row.usuario_email || ''),
    creadoPor: row.creado_por ? String(row.creado_por) : undefined,
    creadoEn: String(row.creado_en || '')
  };
}

function mapRealtimeCliente(row: Record<string, unknown>): Cliente {
  return mapCliente(row);
}

function mapRealtimePaquete(row: Record<string, unknown>): Paquete {
  return mapPaquete(row);
}

export function useDashboardData() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [entregas, setEntregas] = useState<OrdenEntrega[]>([]);
  const [cobros, setCobros] = useState<CobroVoucher[]>([]);
  const [scannedLogs, setScannedLogs] = useState<ScannedLog[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('amex_scanner_staging_queue_v2');
      if (!stored) return;

      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) setScannedLogs(parsed as ScannedLog[]);
    } catch (error) {
      console.warn('Error loading staging queue from localStorage:', error);
    }
  }, []);

  const fetchSupabaseData = useCallback(async () => {
    try {
      setIsGlobalRefreshing(true);
      const [clientesRes, paquetesRes, entregasRes, cobrosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('creado_en', { ascending: false }),
        supabase
          .from('paquetes')
          .select('*')
          .is('eliminado_en', null)
          .order('creado_en', { ascending: false }),
        supabase.from('entregas_ordenes').select('*').order('creado_en', { ascending: false }),
        supabase
          .from('cobros_vouchers')
          .select('*')
          .is('eliminado_en', null)
          .order('creado_en', { ascending: false })
      ]);

      setClientes((clientesRes.data || []).map((row) => mapCliente(row as Record<string, unknown>)));
      setPaquetes((paquetesRes.data || []).map((row) => mapPaquete(row as Record<string, unknown>)));
      if (entregasRes.data) setEntregas(entregasRes.data as OrdenEntrega[]);
      if (cobrosRes.data) setCobros(cobrosRes.data as CobroVoucher[]);
    } catch (error) {
      console.warn('Supabase initial fetch sync:', error);
    } finally {
      setIsLoadingInitialData(false);
      window.setTimeout(() => setIsGlobalRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    void fetchSupabaseData();

    const realtimeChannel = supabase
      .channel('amex-erp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paquetes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const raw = payload.new as Record<string, unknown>;
          if (raw.eliminado_en) return; // Si nace ya eliminado, ignorar
          const paquete = mapRealtimePaquete(raw);
          setPaquetes((previous) => {
            if (previous.some((item) => item.id === paquete.id)) {
              return previous;
            }
            return [paquete, ...previous];
          });
        } else if (payload.eventType === 'UPDATE') {
          const raw = payload.new as Record<string, unknown>;
          if (raw.eliminado_en) {
            // Si fue eliminado lógicamente, retirarlo del estado activo
            setPaquetes((previous) => previous.filter((item) => item.id !== raw.id));
            return;
          }
          const paquete = mapRealtimePaquete(raw);
          setPaquetes((previous) => {
            const exists = previous.some((item) => item.id === paquete.id);
            if (exists) {
              return previous.map((item) => (item.id === paquete.id ? { ...item, ...paquete } : item));
            }
            // Si fue reactivado o no estaba en memoria, agregarlo
            return [paquete, ...previous];
          });
        } else if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old as Record<string, unknown>;
          setPaquetes((previous) => previous.filter((item) => item.id !== oldRecord.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const cliente = mapRealtimeCliente(payload.new as Record<string, unknown>);
          setClientes((previous) =>
            previous.some((item) => item.id === cliente.id)
              ? previous
              : [cliente, ...previous]
          );
        } else if (payload.eventType === 'UPDATE') {
          const cliente = mapRealtimeCliente(payload.new as Record<string, unknown>);
          setClientes((previous) =>
            previous.map((item) => (item.id === cliente.id ? { ...item, ...cliente } : item))
          );
        } else if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old as Record<string, unknown>;
          setClientes((previous) => previous.filter((item) => item.id !== oldRecord.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas_ordenes' }, async () => {
        const { data } = await supabase
          .from('entregas_ordenes')
          .select('*')
          .order('creado_en', { ascending: false });
        if (data) setEntregas(data as OrdenEntrega[]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobros_vouchers' }, async () => {
        const { data } = await supabase
          .from('cobros_vouchers')
          .select('*')
          .order('creado_en', { ascending: false });
        if (data) setCobros(data as CobroVoucher[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [fetchSupabaseData]);

  return {
    clientes,
    paquetes,
    entregas,
    cobros,
    scannedLogs,
    setClientes,
    setPaquetes,
    setScannedLogs,
    fetchSupabaseData,
    isLoadingInitialData,
    isGlobalRefreshing
  };
}
