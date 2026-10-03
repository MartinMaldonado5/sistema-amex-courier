import readXlsxFile, { type SheetData } from 'read-excel-file/browser';

export interface InstructivoFila {
  filaOriginal: number;
  /** El texto exacto de la celda de WR (ej: "WR000468049-WR000467966") */
  rawWr: string;
  /** Los códigos WR individuales extraídos de la celda */
  wrs: string[];
  /** Delimitador detectado entre WRs (' - ' o ' / ') */
  delimiter: string;
  /** True si contiene 2, 3, 4 o más WRs */
  esMultiWr: boolean;
  /** Consignatario del instructivo */
  consignatario: string;
  /** Casillero / código cliente / notas de la celda OBSERVACIONES */
  observaciones: string;
  /** Descripción de la mercancía */
  descripcion: string;
  /** Valor declarado USD */
  valorDeclarado: number | null;
  /** Documento de identidad */
  dni: string;
}

export interface InstructivoParseResult {
  fileName: string;
  headerRow: number;
  totalFilas: number;
  totalWrsIndividuales: number;
  celdasMultiWR: number;
  filas: InstructivoFila[];
  /** Lista consolidada de WRs únicos para búsquedas masivas e índices */
  wrsUnicos: string[];
}

const WR_RE = /WR\d+/gi;

function aTexto(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v).trim();
  if (s.startsWith("'")) s = s.slice(1).trim();
  return s;
}

function aNumero(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function detectarDelimitador(raw: string): string {
  if (raw.includes('/')) return ' / ';
  if (raw.includes(' - ')) return ' - ';
  if (raw.includes('-')) return ' - ';
  if (raw.includes(',')) return ', ';
  return ' - ';
}

/**
 * Parsea un INSTRUCTIVO DE EMBARQUE (.xlsx).
 * - Detecta la fila cabecera buscando la columna "WR".
 * - REGLA DE ORO: Las celdas con múltiples WRs (2, 3, 4 o más) NO SE SEPARAN en filas distintas.
 *   Se mantienen en su misma celda y fila exacta, extrayendo sus códigos individuales
 *   para poder cruzar los pesos y trackings con el TIB.
 */
export async function parseInstructivo(buffer: ArrayBuffer, fileName: string): Promise<InstructivoParseResult> {
  const sheets = await readXlsxFile(buffer);
  if (sheets.length === 0) throw new Error('El archivo no contiene hojas legibles.');

  // Usar la hoja con más filas
  const sheet = sheets.reduce((a, b) => (b.data.length >= a.data.length ? b : a));
  const rows: SheetData = sheet.data;

  // 1. Buscar fila cabecera en las primeras 20 filas
  let headerRow = -1;
  let wrCol = -1;
  let consigCol = -1;
  let obsCol = -1;
  let descCol = -1;
  let valorCol = -1;
  let dniCol = -1;

  const limite = Math.min(20, rows.length);
  for (let r = 0; r < limite && headerRow === -1; r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const txt = aTexto(row[c]).toUpperCase();
      if (txt === 'WR' || txt.includes('CODIGO WAREHOUSE')) {
        headerRow = r;
        wrCol = c;
        break;
      }
    }

    if (headerRow !== -1) {
      const hrow = rows[headerRow] || [];
      for (let c = 0; c < hrow.length; c++) {
        const h = aTexto(hrow[c]).toUpperCase();
        if (h.includes('CONSIGNATARIO') || h.includes('DESTINATARIO') || h.includes('NOMBRE')) {
          if (consigCol === -1) consigCol = c;
        } else if (h.includes('OBSERVACIONES') || h.includes('CASILLERO') || h.includes('OBS')) {
          obsCol = c;
        } else if (h.includes('DESCRIPCION') || h.includes('MERCANCIA')) {
          descCol = c;
        } else if (h.includes('VALOR') || h.includes('TOTAL')) {
          valorCol = c;
        } else if (h.includes('IDENTIDAD') || h.includes('DNI') || h.includes('RUC')) {
          dniCol = c;
        }
      }
    }
  }

  if (headerRow === -1 || wrCol === -1) {
    throw new Error('No se encontró la columna "WR" en el instructivo (se buscó en las primeras 20 filas).');
  }

  // 2. Extraer filas de datos
  const filas: InstructivoFila[] = [];
  const wrsUnicosSet = new Set<string>();
  let totalWrsIndividuales = 0;
  let celdasMultiWR = 0;

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const celdaWr = aTexto(row[wrCol]);
    if (!celdaWr) continue;

    // Detectar fin de tabla por notas
    const rowText = row.map(aTexto).join(' ').toUpperCase();
    if (rowText.includes('NOTAS:') || rowText.includes('EL NUMERO DE GUIA')) {
      break;
    }

    // Extraer códigos WR válidos
    const matches = celdaWr.toUpperCase().match(WR_RE) || [];
    if (matches.length === 0) continue;

    const esMulti = matches.length > 1;
    if (esMulti) celdasMultiWR++;
    totalWrsIndividuales += matches.length;

    matches.forEach((w) => wrsUnicosSet.add(w.toUpperCase()));

    filas.push({
      filaOriginal: r + 1,
      rawWr: celdaWr,
      wrs: matches.map((m) => m.toUpperCase()),
      delimiter: detectarDelimitador(celdaWr),
      esMultiWr: esMulti,
      consignatario: consigCol >= 0 ? aTexto(row[consigCol]) : '',
      observaciones: obsCol >= 0 ? aTexto(row[obsCol]) : '',
      descripcion: descCol >= 0 ? aTexto(row[descCol]) : '',
      valorDeclarado: valorCol >= 0 ? aNumero(row[valorCol]) : null,
      dni: dniCol >= 0 ? aTexto(row[dniCol]) : '',
    });
  }

  if (filas.length === 0) {
    throw new Error('No se encontraron registros de WR en el instructivo de embarque.');
  }

  return {
    fileName,
    headerRow: headerRow + 1,
    totalFilas: filas.length,
    totalWrsIndividuales,
    celdasMultiWR,
    filas,
    wrsUnicos: Array.from(wrsUnicosSet),
  };
}
