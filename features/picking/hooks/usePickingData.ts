'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { matchesFuzzySearch } from '@/lib/fuzzySearch';
import { OrdenPicking, ItemPicking, StatusFilter } from '../types';
import { PickingService } from '../services/picking.service';

export function usePickingData() {
  const [ordenes, setOrdenes] = useState<OrdenPicking[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, ItemPicking[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPickingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { ordenes: ords, itemsMap: map } = await PickingService.fetchPickingData();
      setOrdenes(ords);
      setItemsMap(map);
    } catch (err) {
      console.warn('Error fetching picking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickingData();

    // Suscripción Realtime para órdenes e items
    const pickingChannel = supabase
      .channel('picking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes_picking' }, () => {
        fetchPickingData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items_picking' }, () => {
        fetchPickingData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pickingChannel);
    };
  }, [fetchPickingData]);

  // KPI Computations
  const totalOrders = ordenes.length;
  const activeOrders = ordenes.filter((o) => o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO').length;
  const completedOrders = ordenes.filter((o) => o.estado === 'COMPLETADO' || o.estado === 'DESPACHADO').length;
  const totalPendingPackages = ordenes
    .filter((o) => o.estado !== 'DESPACHADO')
    .reduce((acc, o) => acc + (o.totalPaquetes - o.recolectadosPaquetes), 0);

  // Filtrado de órdenes con Motor Fuzzy Inteligente
  const filteredOrders = useMemo(() => {
    return ordenes.filter((o) => {
      const matchesSearch = matchesFuzzySearch(searchTerm, [
        o.codigoOrden,
        o.transportistaAgencia,
        o.operadorAsignado,
        o.destinoCiudad,
        o.notas
      ]);

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'PENDING'
          ? o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO'
          : o.estado === 'COMPLETADO' || o.estado === 'DESPACHADO';

      return matchesSearch && matchesStatus;
    });
  }, [ordenes, searchTerm, statusFilter]);

  return {
    ordenes,
    setOrdenes,
    itemsMap,
    setItemsMap,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    totalOrders,
    activeOrders,
    completedOrders,
    totalPendingPackages,
    filteredOrders,
    fetchPickingData
  };
}
