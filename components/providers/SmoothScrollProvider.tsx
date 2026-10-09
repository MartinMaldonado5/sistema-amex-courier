'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { smoothScrollManager } from '@/lib/smooth-scroll/manager';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

const SmoothScrollContext = createContext(smoothScrollManager);

/**
 * Hook para interactuar con el gestor de scroll suave
 */
export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/**
 * Proveedor global de Smooth Scroll Lenis
 * Maneja el ciclo de vida del gestor centralizado a 60/120Hz
 */
export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    // Inicializar el gestor de scroll suave y el observador de mutaciones del DOM
    const cleanup = smoothScrollManager.init(document.body);

    return () => {
      cleanup();
    };
  }, []);

  return (
    <SmoothScrollContext.Provider value={smoothScrollManager}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
