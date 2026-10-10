import { useState, useEffect } from 'react';

/**
 * Hook para aplicar debounce a valores que cambian rápidamente (ej. inputs de búsqueda).
 * Espera el delay especificado (por defecto 300ms) antes de emitir el nuevo valor.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
