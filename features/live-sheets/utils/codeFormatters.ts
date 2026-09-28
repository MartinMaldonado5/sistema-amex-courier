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

/**
 * Genera un código largo determinista de 44 caracteres para compartir una hoja.
 */
export function getSheetLongCode(uuid: string): string {
  if (!uuid) return '1OorcHFtZDOQFkIo8vegZlCDs-EBgCeBb_JEu-R_Fjdo';
  try {
    const clean = uuid.replace(/-/g, '');
    let binary = '';
    for (let i = 0; i < clean.length; i += 2) {
      binary += String.fromCharCode(parseInt(clean.substr(i, 2), 16) || 0);
    }
    const b64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const salt = 'ZDOQFkIo8vegZlCDs-EBgCeBb_JEu-R_Fjdo';
    return `1${b64}${salt}`.slice(0, 44);
  } catch {
    return `1${uuid.replace(/-/g, '')}ZDOQFkIo8veg`.slice(0, 44);
  }
}
