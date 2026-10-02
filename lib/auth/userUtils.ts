/**
 * Utilidades para extracción y formateo de datos del usuario logueado en AMEX Courier.
 */

/**
 * Extrae de forma limpia y confiable el primer nombre del usuario actual del sistema.
 * Prioriza nombre_completo de auth/perfiles, y si no está disponible, deduce desde el email.
 */
export function extractPrimerNombre(
  nombreCompleto?: string | null,
  email?: string | null
): string {
  // 1. Extraer a partir del nombre completo registrado
  if (nombreCompleto && nombreCompleto.trim()) {
    const primer = nombreCompleto.trim().split(/\s+/)[0];
    if (primer) {
      return primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase();
    }
  }

  // 2. Extraer / mapear a partir del email registrado
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();

    // Mapeo de respaldo para correos oficiales del equipo AMEX
    if (cleanEmail === 'maldonado4250@gmail.com') return 'Martin';
    if (cleanEmail === 'blanquico3@gmail.com') return 'Blanca';
    if (cleanEmail === 'ivansaravia310@gmail.com') return 'Andres';
    if (cleanEmail === 'coollife2965@gmail.com') return 'Angelo';
    if (cleanEmail === 'aylengonzaleslino1407@gmail.com') return 'Aylen';
    if (cleanEmail === 'sistemaamexcourier@gmail.com') return 'Administrador';

    // Extracción heurística estándar para cualquier otro correo
    const username = cleanEmail.split('@')[0];
    const cleanWord = username.replace(/[0-9._-]+/g, ' ').trim().split(/\s+/)[0];
    if (cleanWord && cleanWord.length > 1) {
      return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
    }
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  return 'Operador';
}
