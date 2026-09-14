/**
 * Utilidades para extracción y formateo de códigos en Live Sheets
 */

/**
 * Extrae los últimos 6 dígitos numéricos del código Warehouse (Columna B) para la Columna C
 * Ejemplo: 'WR000460103' -> '460103', '460103' -> '460103'
 */
export function extractLast6Digits(val: string | undefined | null): string {
  if (!val) return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.length > 6 ? digitsOnly.slice(-6) : digitsOnly;
}
