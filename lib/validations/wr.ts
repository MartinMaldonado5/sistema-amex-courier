/**
 * Reglas de Validación y Normalización Canónica de Guías WR
 * Sistema AMEX Courier
 *
 * REGLAS DE NEGOCIO:
 * 1. Longitud obligatoria: exactamente 11 caracteres.
 * 2. Prefijo obligatorio: debe comenzar por 'WR', 'wr' o 'Wr'.
 * 3. Seguido de 9 caracteres alfanuméricos (típicamente dígitos correlativos, ej. WR000474478).
 * 4. Normalización estándar: siempre en mayúsculas sin espacios internos.
 */

export const WR_LENGTH = 11;
export const WR_PREFIX = 'WR';
export const WR_REGEX = /^WR[A-Z0-9]{9}$/i;

/**
 * Limpia y normaliza un texto a formato WR (mayúsculas, sin espacios).
 */
export function cleanWr(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

/**
 * Valida si un valor cumple estrictamente la regla:
 * - Comienza con WR (insensible a mayúsculas)
 * - Tiene exactamente 11 caracteres
 * - Los últimos 9 son alfanuméricos
 */
export function isValidWr(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const clean = cleanWr(value);
  return clean.length === WR_LENGTH && WR_REGEX.test(clean);
}

/**
 * Retorna un mensaje explicativo si el código WR no cumple la regla de negocio,
 * o null si es válido.
 */
export function getWrValidationError(value: unknown): string | null {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return 'El código de Guía WR es obligatorio.';
  }

  const clean = cleanWr(value);

  if (!clean.startsWith(WR_PREFIX)) {
    return `El código WR debe comenzar obligatoriamente con "${WR_PREFIX}" (ej. WR000474478).`;
  }

  if (clean.length !== WR_LENGTH) {
    return `El código WR debe tener exactamente ${WR_LENGTH} caracteres (actualmente tiene ${clean.length}). Ejemplo: WR000474478.`;
  }

  if (!WR_REGEX.test(clean)) {
    return `El código WR solo puede contener letras y números después de "WR" (ej. WR000474478).`;
  }

  return null;
}

/**
 * Helper inteligente para autocompletar el prefijo WR si el usuario o pistola
 * ingresa solo los 9 dígitos numéricos (ej. '000474478' -> 'WR000474478').
 */
export function smartFormatWr(input: string): string {
  const clean = cleanWr(input);
  if (/^[A-Z0-9]{9}$/.test(clean) && !clean.startsWith(WR_PREFIX)) {
    return `WR${clean}`;
  }
  return clean;
}
