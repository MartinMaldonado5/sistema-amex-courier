'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BoletaShalom } from '@/types';
import { StatsState } from '../types';
import { shalomService } from '../services/shalom.service';

export function useBoletasShalomData() {
  // Lista y selección
  const [boletas, setBoletas] = useState<BoletaShalom[]>([]);
  const [selectedBoleta, setSelectedBoleta] = useState<BoletaShalom | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estadísticas rápidas
  const [stats, setStats] = useState<StatsState>({
    totalHoy: 0,
    totalMes: 0,
    montoTotalMes: 0,
    destinosPopulares: []
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [destinoFilter, setDestinoFilter] = useState('');
  const [modalidadFilter, setModalidadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce para búsqueda por texto y destino
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedDestinoFilter, setDebouncedDestinoFilter] = useState(destinoFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDestinoFilter(destinoFilter);
    }, 280);
    return () => clearTimeout(timer);
  }, [destinoFilter]);

  // Cargar boletas con soporte de cancelación
  const fetchBoletas = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
      if (yearFilter) params.set('year', yearFilter);
      if (monthFilter) params.set('month', monthFilter);
      if (dayFilter) params.set('day', dayFilter);
      if (debouncedDestinoFilter.trim()) params.set('destino', debouncedDestinoFilter.trim());
      if (modalidadFilter) params.set('modalidad', modalidadFilter);
      params.set('page', String(page));
      params.set('limit', '50');

      const activeSignal = signal instanceof AbortSignal ? signal : abortControllerRef.current?.signal;

      const data = await shalomService.fetchBoletas(params, activeSignal);

      setBoletas(data.boletas);
      setTotalCount(data.total);
      setTotalPages(data.totalPages);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: unknown) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted')))
      ) {
        return;
      }
      console.warn('[BoletasShalomTab] Conexión temporal:', err);
      setFetchError(
        err instanceof Error && err.message.includes('Failed to fetch')
          ? 'No se pudo contactar al servidor local. Reintentando...'
          : err instanceof Error
          ? err.message
          : 'Error al consultar boletas de Shalom'
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, yearFilter, monthFilter, dayFilter, debouncedDestinoFilter, modalidadFilter, page]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchBoletas(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchBoletas]);

  // Copiar al portapapeles con feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setYearFilter(String(new Date().getFullYear()));
    setMonthFilter('');
    setDayFilter('');
    setDestinoFilter('');
    setModalidadFilter('');
    setPage(1);
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  return {
    boletas,
    setBoletas,
    selectedBoleta,
    setSelectedBoleta,
    isLoading,
    copiedId,
    fetchError,
    stats,
    searchQuery,
    setSearchQuery,
    yearFilter,
    setYearFilter,
    monthFilter,
    setMonthFilter,
    dayFilter,
    setDayFilter,
    destinoFilter,
    setDestinoFilter,
    modalidadFilter,
    setModalidadFilter,
    page,
    setPage,
    totalPages,
    totalCount,
    yearOptions,
    fetchBoletas,
    handleCopy,
    handleClearFilters
  };
}
