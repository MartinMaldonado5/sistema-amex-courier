/**
 * Utilidades de Normalización Telefónica, Enlaces de Contacto y Pegado Rápido de Rutas
 */

import { CrearParadaInput } from '@/types/despacho';

export interface PhoneNormalizationResult {
  raw: string;
  normalized: string; // Formato E.164 sin signo más (ej: 51997370290 para wa.me)
  telUri: string;     // Formato tel:+51997370290 para llamadas nativas
  display: string;    // Formato amigable para el chofer
  isValid: boolean;
  isInternational: boolean;
}

/**
 * Normaliza cualquier formato de número telefónico (Perú o internacional)
 */
export function normalizePhoneNumber(rawInput: string | null | undefined): PhoneNormalizationResult {
  const raw = String(rawInput || '').trim();
  if (!raw) {
    return {
      raw: '',
      normalized: '',
      telUri: '',
      display: 'Sin teléfono',
      isValid: false,
      isInternational: false
    };
  }

  // Detectar si tiene signo más internacional
  const hasPlus = raw.startsWith('+');
  
  // Extraer solo dígitos
  const digits = raw.replace(/\D/g, '');

  if (!digits || digits.length < 7) {
    return {
      raw,
      normalized: '',
      telUri: '',
      display: raw,
      isValid: false,
      isInternational: false
    };
  }

  // Caso 1: Celular estándar de Perú (9 dígitos empezando con 9)
  if (digits.length === 9 && digits.startsWith('9')) {
    const normalized = `51${digits}`;
    return {
      raw,
      normalized,
      telUri: `tel:+${normalized}`,
      display: `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
      isValid: true,
      isInternational: false
    };
  }

  // Caso 2: Celular Perú ya con código 51 (11 dígitos empezando con 519)
  if (digits.length === 11 && digits.startsWith('519')) {
    const celPart = digits.slice(2);
    return {
      raw,
      normalized: digits,
      telUri: `tel:+${digits}`,
      display: `+51 ${celPart.slice(0, 3)} ${celPart.slice(3, 6)} ${celPart.slice(6)}`,
      isValid: true,
      isInternational: false
    };
  }

  // Caso 3: Número internacional (ej: Ecuador 593...)
  if (hasPlus || digits.length > 9) {
    return {
      raw,
      normalized: digits,
      telUri: `tel:+${digits}`,
      display: `+${digits}`,
      isValid: true,
      isInternational: true
    };
  }

  // Fallback con los dígitos que tenga
  return {
    raw,
    normalized: digits,
    telUri: `tel:${digits}`,
    display: raw,
    isValid: digits.length >= 7,
    isInternational: false
  };
}

/**
 * Genera el enlace directo a WhatsApp sin guardar el contacto
 */
export function getWhatsAppUrl(
  phone: string | null | undefined,
  destinatario: string,
  wrBultos?: string,
  direccion?: string
): string {
  const { normalized, isValid } = normalizePhoneNumber(phone);
  if (!isValid || !normalized) return '';

  const nombreLimpio = (destinatario || 'Cliente').trim();
  const bultosTexto = wrBultos && wrBultos.trim() ? ` (${wrBultos.trim()})` : '';
  const dirTexto = direccion && direccion.trim() ? ` en ${direccion.trim()}` : '';

  const message = `Hola ${nombreLimpio}, te saluda el repartidor de AMEX Courier. Tengo un envío${bultosTexto} a tu nombre para entregar${dirTexto}. ¿Te encuentras disponible para recibirlo?`;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera el enlace de navegación para Google Maps o Waze
 */
export function getGoogleMapsUrl(direccion: string, distrito?: string): string {
  const dir = String(direccion || '').trim();
  const dist = String(distrito || '').trim();
  const query = [dir, dist, 'Lima', 'Perú'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Lista curada y normalizada de distritos de Lima y Callao
 */
export const LIMA_DISTRITOS = [
  'ATE',
  'BARRANCO',
  'BREÑA',
  'CALLAO',
  'CARABAYLLO',
  'CHORRILLOS',
  'CHOSICA',
  'COMAS',
  'EL AGUSTINO',
  'INDEPENDENCIA',
  'JESUS MARIA',
  'LA MOLINA',
  'LA VICTORIA',
  'LIMA CERCADO',
  'LINCE',
  'LOS OLIVOS',
  'LURIN',
  'MAGDALENA DEL MAR',
  'MIRAFLORES',
  'PUEBLO LIBRE',
  'PUENTE PIEDRA',
  'RIMAC',
  'SAN BORJA',
  'SAN ISIDRO',
  'SAN JUAN DE LURIGANCHO',
  'SAN JUAN DE MIRAFLORES',
  'SAN LUIS',
  'SAN MARTIN DE PORRES',
  'SAN MIGUEL',
  'SANTA ANITA',
  'SANTIAGO DE SURCO',
  'SURCO',
  'SURQUILLO',
  'VENTANILLA',
  'VILLA EL SALVADOR',
  'VILLA MARIA DEL TRIUNFO'
];

/**
 * Normaliza nombres de distritos comunes del Excel
 */
export function normalizeDistrito(input: string): string {
  const clean = String(input || '').trim().toUpperCase();
  if (!clean) return 'LIMA';
  if (clean === 'SURCO') return 'SANTIAGO DE SURCO';
  if (clean === 'MOLINA') return 'LA MOLINA';
  if (clean === 'SJL') return 'SAN JUAN DE LURIGANCHO';
  if (clean === 'SMP') return 'SAN MARTIN DE PORRES';
  if (clean === 'MAGDALENA') return 'MAGDALENA DEL MAR';
  return clean;
}

/**
 * Parser de filas pegadas desde Excel (Quick Paste)
 * Convierte texto tabulado (\t) copiado del portapapeles a paradas estructuradas
 */
export function parseQuickPasteRows(clipboardText: string): CrearParadaInput[] {
  if (!clipboardText || !clipboardText.trim()) return [];

  const lines = clipboardText.split(/\r?\n/);
  const paradas: CrearParadaInput[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detectar separador (tabulación de Excel o punto y coma)
    const cols = trimmed.includes('\t') ? trimmed.split('\t') : trimmed.split(';');
    const col0 = String(cols[0] || '').trim();

    // Ignorar cabeceras repetidas del Excel de entregas
    if (!col0 || col0.toUpperCase() === 'NOMBRE' || col0.toUpperCase().startsWith('CLIENTE:')) {
      continue;
    }

    const destinatario = col0;
    const wrBultos = String(cols[1] || '1 CJ').trim() || '1 CJ';
    const direccion = String(cols[2] || '').trim() || 'Dirección pendiente';
    const distrito = normalizeDistrito(String(cols[3] || 'LIMA').trim());
    const telefono = String(cols[4] || '').trim();

    // Opcional: Monto de cobro si viene en col 5 o col 6
    let montoCobro = 0;
    if (cols[5]) {
      const rawNum = String(cols[5]).replace(/[^0-9.]/g, '');
      const num = parseFloat(rawNum);
      if (!isNaN(num) && num > 0) montoCobro = num;
    }

    paradas.push({
      destinatario,
      wrBultos,
      direccion,
      distrito,
      telefono,
      montoCobro,
      monedaCobro: 'USD'
    });
  }

  return paradas;
}
