'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  DespachoRuta,
  DespachoRutaConParadas,
  CrearRutaInput,
  CrearParadaInput,
  EstadoParada
} from '@/types/despacho';
import { despachoService } from '../services/despacho.service';

export type ViewModeDespacho = 'tablero' | 'constructor' | 'chofer';

export function useDespachoRutas() {
  const [rutas, setRutas] = useState<DespachoRuta[]>([]);
  const [selectedRuta, setSelectedRuta] = useState<DespachoRutaConParadas | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewModeDespacho>('tablero');
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  // 1. Cargar lista de rutas
  const loadRutas = useCallback(async (fecha?: string) => {
    setIsLoading(true);
    try {
      const data = await despachoService.getRutas(fecha || undefined);
      setRutas(data);
    } catch (err) {
      console.error('Error cargando rutas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Seleccionar y cargar ruta activa con paradas
  const selectRuta = useCallback(async (rutaId: string, targetMode: ViewModeDespacho = 'chofer') => {
    setIsLoading(true);
    try {
      const fullRuta = await despachoService.getRutaById(rutaId);
      setSelectedRuta(fullRuta);
      setViewMode(targetMode);
    } catch (err) {
      console.error('Error seleccionando ruta:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Crear y publicar nueva ruta
  const handleCrearRuta = useCallback(
    async (rutaInput: CrearRutaInput, paradasInput: CrearParadaInput[]) => {
      if (paradasInput.length === 0) {
        throw new Error('Debes agregar al menos una parada a la ruta.');
      }
      setIsSubmitting(true);
      try {
        const nuevaRuta = await despachoService.crearRutaConParadas(rutaInput, paradasInput);
        setRutas(prev => [nuevaRuta, ...prev]);
        setSelectedRuta(nuevaRuta);
        setViewMode('tablero');
        return nuevaRuta;
      } catch (err) {
        console.error('Error creando ruta:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  // 4. Cambiar estado de una parada (Chofer o Operador)
  const handleActualizarEstadoParada = useCallback(
    async (paradaId: string, nuevoEstado: EstadoParada, motivo?: string) => {
      // Optimistic update
      setSelectedRuta(prev => {
        if (!prev) return prev;
        const updatedParadas = prev.paradas.map(p =>
          p.id === paradaId
            ? {
                ...p,
                estado: nuevoEstado,
                motivoNoEntrega: motivo || null,
                entregadoEn: nuevoEstado === 'ENTREGADO' ? new Date().toISOString() : null
              }
            : p
        );
        const entregadas = updatedParadas.filter(p => p.estado === 'ENTREGADO').length;
        return {
          ...prev,
          paradas: updatedParadas,
          paradasEntregadas: entregadas,
          estado: entregadas === prev.totalParadas && prev.totalParadas > 0 ? 'COMPLETADO' : prev.estado
        };
      });

      try {
        await despachoService.actualizarEstadoParada(paradaId, nuevoEstado, motivo);
        // Refrescar conteos en la lista general
        setRutas(prev =>
          prev.map(r => {
            if (selectedRuta && r.id === selectedRuta.id) {
              const currentEntregadas = selectedRuta.paradas.filter(p =>
                p.id === paradaId ? nuevoEstado === 'ENTREGADO' : p.estado === 'ENTREGADO'
              ).length;
              return {
                ...r,
                paradasEntregadas: currentEntregadas,
                estado: currentEntregadas === r.totalParadas && r.totalParadas > 0 ? 'COMPLETADO' : r.estado
              };
            }
            return r;
          })
        );
      } catch (err) {
        console.error('Error actualizando parada:', err);
        // Si falla, recargar datos originales
        if (selectedRuta) {
          const fresh = await despachoService.getRutaById(selectedRuta.id);
          setSelectedRuta(fresh);
        }
      }
    },
    [selectedRuta]
  );

  // 5. Eliminar ruta
  const handleEliminarRuta = useCallback(
    async (rutaId: string) => {
      try {
        await despachoService.eliminarRuta(rutaId);
        setRutas(prev => prev.filter(r => r.id !== rutaId));
        if (selectedRuta?.id === rutaId) {
          setSelectedRuta(null);
          setViewMode('tablero');
        }
      } catch (err) {
        console.error('Error al eliminar ruta:', err);
        throw err;
      }
    },
    [selectedRuta]
  );

  // 6. Efecto inicial y suscripción Realtime
  useEffect(() => {
    loadRutas(filtroFecha);

    const channel = supabase
      .channel('despachos_rutas_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'despachos_rutas' },
        () => {
          loadRutas(filtroFecha);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'despacho_paradas' },
        payload => {
          if (selectedRuta && (payload.new as any)?.ruta_id === selectedRuta.id) {
            despachoService.getRutaById(selectedRuta.id).then(fresh => {
              if (fresh) setSelectedRuta(fresh);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRutas, filtroFecha, selectedRuta]);

  // 7. Filtro de búsqueda
  const rutasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return rutas;
    const q = busqueda.toLowerCase().trim();
    return rutas.filter(
      r =>
        r.nombreRuta.toLowerCase().includes(q) ||
        r.codigoRuta.toLowerCase().includes(q) ||
        r.choferNombre.toLowerCase().includes(q) ||
        (r.vehiculoPlaca && r.vehiculoPlaca.toLowerCase().includes(q))
    );
  }, [rutas, busqueda]);

  return {
    rutas: rutasFiltradas,
    selectedRuta,
    setSelectedRuta,
    isLoading,
    isSubmitting,
    viewMode,
    setViewMode,
    filtroFecha,
    setFiltroFecha,
    busqueda,
    setBusqueda,
    loadRutas,
    selectRuta,
    handleCrearRuta,
    handleActualizarEstadoParada,
    handleEliminarRuta
  };
}
