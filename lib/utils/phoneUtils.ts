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
export interface DistritoOption {
  value: string;
  label: string;
}

export interface ZonaDistritos {
  zona: string;
  distritos: DistritoOption[];
}

/**
 * Lista completa de los 43 distritos de Lima Metropolitana organizados por zonas tradicionales + Callao
 */
export const ZONAS_LIMA_DISTRITOS: ZonaDistritos[] = [
  {
    zona: '1. Lima Norte (8 distritos)',
    distritos: [
      { value: 'ANCON', label: 'Ancón' },
      { value: 'CARABAYLLO', label: 'Carabayllo' },
      { value: 'COMAS', label: 'Comas' },
      { value: 'INDEPENDENCIA', label: 'Independencia' },
      { value: 'LOS OLIVOS', label: 'Los Olivos' },
      { value: 'PUENTE PIEDRA', label: 'Puente Piedra' },
      { value: 'SAN MARTIN DE PORRES', label: 'San Martín de Porres' },
      { value: 'SANTA ROSA', label: 'Santa Rosa' }
    ]
  },
  {
    zona: '2. Lima Centro (16 distritos)',
    distritos: [
      { value: 'BARRANCO', label: 'Barranco' },
      { value: 'BREÑA', label: 'Breña' },
      { value: 'CERCADO DE LIMA', label: 'Cercado de Lima (Lima)' },
      { value: 'JESUS MARIA', label: 'Jesús María' },
      { value: 'LA VICTORIA', label: 'La Victoria' },
      { value: 'LINCE', label: 'Lince' },
      { value: 'MAGDALENA DEL MAR', label: 'Magdalena del Mar' },
      { value: 'MIRAFLORES', label: 'Miraflores' },
      { value: 'PUEBLO LIBRE', label: 'Pueblo Libre' },
      { value: 'RIMAC', label: 'Rímac' },
      { value: 'SAN BORJA', label: 'San Borja' },
      { value: 'SAN ISIDRO', label: 'San Isidro' },
      { value: 'SAN LUIS', label: 'San Luis' },
      { value: 'SAN MIGUEL', label: 'San Miguel' },
      { value: 'SANTIAGO DE SURCO', label: 'Santiago de Surco' },
      { value: 'SURQUILLO', label: 'Surquillo' }
    ]
  },
  {
    zona: '3. Lima Este (8 distritos)',
    distritos: [
      { value: 'ATE', label: 'Ate' },
      { value: 'CHACLACAYO', label: 'Chaclacayo' },
      { value: 'CIENEGUILLA', label: 'Cieneguilla' },
      { value: 'EL AGUSTINO', label: 'El Agustino' },
      { value: 'LA MOLINA', label: 'La Molina' },
      { value: 'LURIGANCHO-CHOSICA', label: 'Lurigancho-Chosica' },
      { value: 'SAN JUAN DE LURIGANCHO', label: 'San Juan de Lurigancho' },
      { value: 'SANTA ANITA', label: 'Santa Anita' }
    ]
  },
  {
    zona: '4. Lima Sur (11 distritos)',
    distritos: [
      { value: 'CHORRILLOS', label: 'Chorrillos' },
      { value: 'LURIN', label: 'Lurín' },
      { value: 'PACHACAMAC', label: 'Pachacámac' },
      { value: 'PUCUSANA', label: 'Pucusana' },
      { value: 'PUNTA HERMOSA', label: 'Punta Hermosa' },
      { value: 'PUNTA NEGRA', label: 'Punta Negra' },
      { value: 'SAN BARTOLO', label: 'San Bartolo' },
      { value: 'SAN JUAN DE MIRAFLORES', label: 'San Juan de Miraflores' },
      { value: 'SANTA MARIA DEL MAR', label: 'Santa María del Mar' },
      { value: 'VILLA EL SALVADOR', label: 'Villa El Salvador' },
      { value: 'VILLA MARIA DEL TRIUNFO', label: 'Villa María del Triunfo' }
    ]
  },
  {
    zona: '5. Callao (Prov. Constitucional)',
    distritos: [
      { value: 'CALLAO', label: 'Callao' },
      { value: 'BELLAVISTA', label: 'Bellavista' },
      { value: 'CARMEN DE LA LEGUA', label: 'Carmen de la Legua' },
      { value: 'LA PERLA', label: 'La Perla' },
      { value: 'LA PUNTA', label: 'La Punta' },
      { value: 'MI PERU', label: 'Mi Perú' },
      { value: 'VENTANILLA', label: 'Ventanilla' }
    ]
  }
];

export const LIMA_DISTRITOS: string[] = ZONAS_LIMA_DISTRITOS.flatMap(z => z.distritos.map(d => d.value));

/**
 * Normaliza nombres de distritos comunes del Excel o entradas de usuario
 */
export function normalizeDistrito(input: string): string {
  if (!input) return 'MIRAFLORES';
  const raw = String(input).trim().toUpperCase();
  const unaccented = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (unaccented === 'SURCO' || unaccented === 'SANTIAGO DE SURCO') return 'SANTIAGO DE SURCO';
  if (unaccented === 'MOLINA' || unaccented === 'LA MOLINA') return 'LA MOLINA';
  if (unaccented === 'SJL' || unaccented === 'SAN JUAN DE LURIGANCHO') return 'SAN JUAN DE LURIGANCHO';
  if (unaccented === 'SJM' || unaccented === 'SAN JUAN DE MIRAFLORES') return 'SAN JUAN DE MIRAFLORES';
  if (unaccented === 'SMP' || unaccented === 'SAN MARTIN' || unaccented === 'SAN MARTIN DE PORRES') return 'SAN MARTIN DE PORRES';
  if (unaccented === 'VMT' || unaccented === 'VILLA MARIA' || unaccented === 'VILLA MARIA DEL TRIUNFO') return 'VILLA MARIA DEL TRIUNFO';
  if (unaccented === 'VES' || unaccented === 'VILLA EL SALVADOR') return 'VILLA EL SALVADOR';
  if (unaccented === 'CHOSICA' || unaccented === 'LURIGANCHO' || unaccented === 'LURIGANCHO-CHOSICA') return 'LURIGANCHO-CHOSICA';
  if (unaccented === 'LIMA' || unaccented === 'CERCADO' || unaccented === 'LIMA CERCADO' || unaccented.includes('CERCADO DE LIMA')) return 'CERCADO DE LIMA';
  if (unaccented === 'MAGDALENA' || unaccented === 'MAGDALENA DEL MAR') return 'MAGDALENA DEL MAR';
  if (unaccented === 'JESUS MARIA') return 'JESUS MARIA';
  if (unaccented === 'RIMAC') return 'RIMAC';
  if (unaccented === 'ANCON') return 'ANCON';
  if (unaccented === 'LURIN') return 'LURIN';
  if (unaccented === 'PACHACAMAC') return 'PACHACAMAC';
  if (unaccented === 'BRENA') return 'BREÑA';

  // Buscar coincidencia directa en los valores o etiquetas
  for (const zona of ZONAS_LIMA_DISTRITOS) {
    for (const d of zona.distritos) {
      const dUnacc = d.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const labelUnacc = d.label.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (dUnacc === unaccented || labelUnacc === unaccented) {
        return d.value;
      }
    }
  }

  return unaccented;
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
