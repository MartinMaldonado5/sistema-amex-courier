'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Paquete } from '@/types';

export interface UseInventoryQueryOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
  initialEstado?: string;
  initialUbicacion?: string;
  debounceMs?: number;
}

export interface InventoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useInventoryQuery(options: UseInventoryQueryOptions = {}) {
  const {
    initialPage = 1,
    initialPageSize = 50,
    initialSearch = '',
    initialEstado = '',
    initialUbicacion = '',
    debounceMs = 300,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [estadoEntrega, setEstadoEntrega] = useState(initialEstado);
  const [ubicacionActual, setUbicacionActual] = useState(initialUbicacion);

  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [pagination, setPagination] = useState<InventoryPagination>({
    page: initialPage,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Volver a la primera página al buscar
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [search, debounceMs]);

  const fetchPackages = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (estadoEntrega) params.set('estadoEntrega', estadoEntrega);
      if (ubicacionActual) params.set('ubicacionActual', ubicacionActual);

      const res = await fetch(`/api/paquetes?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al cargar paquetes.');
      }

      const json = await res.json();
      setPaquetes(json.data || []);
      setPagination(
        json.pagination || {
          page,
          pageSize,
          total: json.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setError((err as Error)?.message || 'Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, estadoEntrega, ubicacionActual]);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  return {
    paquetes,
    pagination,
    isLoading,
    error,
    page,
    pageSize,
    search,
    estadoEntrega,
    ubicacionActual,
    setPage,
    setPageSize,
    setSearch,
    setEstadoEntrega,
    setUbicacionActual,
    refetch: fetchPackages,
  };
}
