'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { matchesFuzzySearch } from '@/lib/fuzzySearch';
import { CobroVoucher, CobrosMetrics, CobrosSubtab } from '../types';
import { CobrosService } from '../services/cobros.service';

export function useCobrosData() {
  const [subtab, setSubtab] = useState<CobrosSubtab>('todos');
  const [cobros, setCobros] = useState<CobroVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const fetchCobros = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await CobrosService.fetchCobros();
      setCobros(data);
    } catch (err) {
      console.error('Error en fetchCobros:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCobros();

    const channel = supabase
      .channel('realtime_cobros_vouchers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cobros_vouchers' },
        () => {
          fetchCobros();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCobros]);

  const handleUpdateStatus = async (id: string, newStatus: 'VALIDADO' | 'RECHAZADO') => {
    try {
      await CobrosService.updateStatus(id, newStatus);
      fetchCobros();
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert('Error: ' + err.message);
    }
  };

  // Filtrado de Cobros con Fuzzy Search
  const filteredCobros = useMemo(() => {
    return cobros.filter((c) => {
      const wrsString = Array.isArray(c.paquetes_wrs)
        ? c.paquetes_wrs.map((w) => w.numeroReciboBodega).join(' ')
        : '';

      const matchesSearch = matchesFuzzySearch(searchTerm, [
        c.codigo_cobro,
        c.cliente_nombre,
        c.cliente_casillero,
        c.cliente_telefono,
        c.numero_operacion,
        c.metodo_pago,
        c.monto,
        c.notas,
        wrsString
      ]);

      if (!matchesSearch) return false;

      if (methodFilter !== 'ALL' && c.metodo_pago !== methodFilter) {
        return false;
      }

      if (subtab === 'pendientes') {
        return c.estado === 'PENDIENTE';
      } else if (subtab === 'validados') {
        return c.estado === 'VALIDADO';
      }
      return true;
    });
  }, [cobros, searchTerm, methodFilter, subtab]);

  // Métricas Financieras
  const metrics: CobrosMetrics = useMemo(() => {
    let totalSoles = 0;
    let totalDolares = 0;
    let countYape = 0;
    let countBcp = 0;
    let countPlin = 0;
    let countPendientes = 0;
    let countValidados = 0;

    cobros.forEach((c) => {
      const amount = Number(c.monto || 0);
      if (c.moneda === 'PEN') {
        totalSoles += amount;
      } else {
        totalDolares += amount;
      }

      if (c.metodo_pago === 'YAPE') countYape++;
      if (c.metodo_pago === 'BCP') countBcp++;
      if (c.metodo_pago === 'PLIN') countPlin++;

      if (c.estado === 'PENDIENTE') countPendientes++;
      if (c.estado === 'VALIDADO') countValidados++;
    });

    return {
      totalSoles,
      totalDolares,
      countYape,
      countBcp,
      countPlin,
      countPendientes,
      countValidados,
      totalVouchers: cobros.length
    };
  }, [cobros]);

  return {
    subtab,
    setSubtab,
    cobros,
    loading,
    refreshing,
    searchTerm,
    setSearchTerm,
    methodFilter,
    setMethodFilter,
    metrics,
    filteredCobros,
    fetchCobros,
    handleUpdateStatus
  };
}
