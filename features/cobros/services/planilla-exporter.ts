import writeXlsxFile, { type SheetData, type Row } from 'write-excel-file/browser';
import type { FilaResultadoCobro } from '@/app/api/cobros/cruzar-planilla/route';

export type { FilaResultadoCobro };

export interface OpcionesExportarPlanilla {
  getTarifaCliente?: (clienteNombre: string) => { tarifa: number; personalizada: boolean };
  fechaReferencia?: string;
}

function esFilaAgrupada(f: FilaResultadoCobro): boolean {
  if (f.esMultiWr) return true;
  if (Array.isArray(f.wrs) && f.wrs.length > 1) return true;
  const wrStr = String(f.wr || '').trim();
  if (wrStr.includes('-') || wrStr.includes('/') || wrStr.includes(',')) return true;
  const matches = wrStr.match(/WR\d+/gi);
  return Boolean(matches && matches.length > 1);
}

/**
 * Extrae la fecha del nombre del archivo instructivo o toma la fecha actual
 */
export function obtenerInfoFecha(fechaRef?: string) {
  const mesesAbrev: Record<string, number> = {
    ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
    JUL: 6, AGO: 7, SET: 8, SEP: 8, OCT: 9, NOV: 10, DIC: 11
  };
  const diasSemana = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

  let fecha = new Date();
  if (fechaRef) {
    const m1 = fechaRef.match(/(\d{1,2})\s*(SET|SEP|OCT|NOV|DIC|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO)/i);
    if (m1) {
      const d = parseInt(m1[1], 10);
      const m = mesesAbrev[m1[2].toUpperCase().slice(0, 3)];
      const y = fecha.getFullYear();
      fecha = new Date(y, m, d);
    } else {
      const m2 = fechaRef.match(/(\d{1,2})[-.](\d{1,2})/);
      if (m2) {
        const d = parseInt(m2[1], 10);
        const m = parseInt(m2[2], 10) - 1;
        const y = fecha.getFullYear();
        fecha = new Date(y, m, d);
      }
    }
  }

  const diaNombre = diasSemana[fecha.getDay()] || 'HOY';
  const diaStr = String(fecha.getDate()).padStart(2, '0');
  const mesStr = String(fecha.getMonth() + 1).padStart(2, '0');
  const anioStr = String(fecha.getFullYear());

  const tituloCobros = `COBROS REALIZADOS DEL DIA ${diaNombre} ${diaStr}-${mesStr}-${anioStr} KMMQ`;
  const nombreHojaCobro = `COBRO ${diaStr}.${mesStr}`;

  return { fecha, diaNombre, diaStr, mesStr, anioStr, tituloCobros, nombreHojaCobro };
}

/**
 * Genera la planilla de cobros (.xlsx) con 2 hojas:
 *
 * 1. Hoja "Cruce Planilla":
 *    - Cada fila individual lleva explícitamente el nombre de a quién le pertenece ese WR.
 *    - Pesos individuales correspondientes, sin subtotales de clientes.
 *    - Separación con 3 espacios en blanco al final.
 *    - Sección final: Celdas con WRs agrupados (con '-' o '/'), nombres concatenados y pesos delimitados.
 *
 * 2. Hoja "Plantilla Cobros" (ej. "COBRO 22.09" o "COBRO 24.09"):
 *    - Formato TAL CUAL como el archivo oficial de Cobros 22 Septiembre.
 *    - SOLO incluye los WRs que están solos y NO están agrupados varios en una celda (los agrupados los gestiona manualmente el operador).
 *    - Agrupado por cliente con encabezados azul amex (#4472C4) y texto blanco.
 *    - Columna ENVIADO combinada verticalmente por cada bloque de cliente.
 *    - Nombre del cliente combinado verticalmente por los paquetes que le pertenecen.
 *    - Fórmulas de cálculo de precio dinámico (+C{fila}*tarifa) y formato de moneda ($#,##0.00).
 *    - Fila TOTAL por cliente con fórmula =SUM(...) y separación limpia.
 *    - Fila TOTAL GENERAL al final de la planilla sumando los totales de cada cliente.
 */
export async function exportarPlanillaCobros(
  filas: FilaResultadoCobro[],
  nombreArchivo = `PLANILLA COBROS ${new Date().toISOString().slice(0, 10)}.xlsx`,
  opciones?: OpcionesExportarPlanilla
): Promise<void> {
  if (filas.length === 0) {
    throw new Error('No hay filas para exportar la planilla.');
  }

  const { tituloCobros, nombreHojaCobro, diaStr, mesStr, anioStr } = obtenerInfoFecha(
    opciones?.fechaReferencia || nombreArchivo
  );

  // 1. Separar filas individuales de filas con WRs agrupados (- o /)
  const filasSimples: FilaResultadoCobro[] = [];
  const filasAgrupadas: FilaResultadoCobro[] = [];

  for (const f of filas) {
    if (esFilaAgrupada(f)) {
      filasAgrupadas.push(f);
    } else {
      filasSimples.push(f);
    }
  }

  // Ordenar alfabéticamente por cliente dentro de cada sección
  filasSimples.sort((a, b) =>
    (a.cliente || '').localeCompare(b.cliente || '', 'es') || (a.wr || '').localeCompare(b.wr || '')
  );
  filasAgrupadas.sort((a, b) =>
    (a.cliente || '').localeCompare(b.cliente || '', 'es') || (a.wr || '').localeCompare(b.wr || '')
  );

  // =========================================================================
  // HOJA 1: "Cruce Planilla" (Referencia completa con agrupados al final)
  // =========================================================================
  const headerRowCruce: Row = [
    { value: 'NOMBRE', fontWeight: 'bold' as const },
    { value: 'PESO', fontWeight: 'bold' as const },
    { value: 'PRECIO $', fontWeight: 'bold' as const },
    { value: 'CODIGO WAREHOUSE', fontWeight: 'bold' as const },
    { value: 'TRACKING', fontWeight: 'bold' as const },
    { value: 'TIPO DE PAQUETE', fontWeight: 'bold' as const },
    { value: 'OBSERVACIONES', fontWeight: 'bold' as const },
  ];

  const dataCruce: SheetData = [
    [
      {
        value: `CRUCE PLANILLA DE INSTRUCTIVO DE EMBARQUE — ${diaStr}/${mesStr}/${anioStr} (${filas.length} FILAS TOTALES)`,
        fontWeight: 'bold' as const,
        fontSize: 12,
      },
    ],
    [],
    headerRowCruce,
  ];

  // Sección 1: WRs individuales
  for (const it of filasSimples) {
    const nombreCliente = String(it.cliente || 'SIN NOMBRE').trim().toUpperCase();
    const pesoVal = typeof it.pesoTotal === 'number' && it.pesoTotal > 0
      ? { value: it.pesoTotal, type: Number, format: '#,##0.00' }
      : { value: it.pesoFormateado || '—', type: String };

    dataCruce.push([
      { value: nombreCliente, type: String },
      pesoVal,
      null, // PRECIO $: libre para el operador
      { value: it.wr || '', type: String },
      it.tracking ? { value: it.tracking, type: String } : null,
      it.tipo ? { value: it.tipo, type: String } : null,
      it.observaciones ? { value: it.observaciones, type: String } : null,
    ]);
  }

  // Separación: 3 espacios en blanco antes de los WRs agrupados
  if (filasAgrupadas.length > 0) {
    dataCruce.push([]);
    dataCruce.push([]);
    dataCruce.push([]);

    dataCruce.push([
      { value: 'WRS AGRUPADOS (PAQUETES CON GUÍAS COMBINADAS)', fontWeight: 'bold' as const, fontSize: 11 },
    ]);
    dataCruce.push(headerRowCruce);

    for (const it of filasAgrupadas) {
      const delimiter = it.delimiter || (it.wr.includes('/') ? ' / ' : ' - ');

      let nombreCliente = '';
      if (Array.isArray(it.detalles) && it.detalles.length > 0) {
        nombreCliente = it.detalles
          .map((d) => String(d.cliente || it.cliente || 'SIN NOMBRE').trim().toUpperCase())
          .join(delimiter);
      } else if (it.cliente && it.cliente.includes(delimiter.trim())) {
        nombreCliente = it.cliente.toUpperCase();
      } else {
        const cant = it.wrs && it.wrs.length > 0 ? it.wrs.length : 1;
        nombreCliente = Array(cant)
          .fill(String(it.cliente || 'SIN NOMBRE').trim().toUpperCase())
          .join(delimiter);
      }

      const pesoFormateado = it.pesoFormateado || '—';

      dataCruce.push([
        { value: nombreCliente, type: String },
        { value: pesoFormateado, type: String },
        null,
        { value: it.wr || '', type: String },
        it.tracking ? { value: it.tracking, type: String } : null,
        it.tipo ? { value: it.tipo, type: String } : null,
        it.observaciones ? { value: it.observaciones, type: String } : null,
      ]);
    }
  }

  // =========================================================================
  // HOJA 2: "Plantilla Cobros" (TAL CUAL como archivo COBRO 22.09)
  // SOLO incluye los WRs que están solos (filasSimples) agrupados por cliente.
  // =========================================================================
  const gruposPorCliente = new Map<string, FilaResultadoCobro[]>();
  for (const it of filasSimples) {
    const key = String(it.cliente || 'SIN NOMBRE').trim().toUpperCase();
    if (!gruposPorCliente.has(key)) {
      gruposPorCliente.set(key, []);
    }
    gruposPorCliente.get(key)!.push(it);
  }

  const clientesOrdenados = Array.from(gruposPorCliente.keys()).sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const dataCobros: SheetData = [
    // Fila 1: Título general centrado con 5 columnas combinadas
    [
      {
        value: tituloCobros,
        columnSpan: 5,
        fontWeight: 'bold' as const,
        fontSize: 13,
        align: 'center' as const,
        alignVertical: 'center' as const,
        height: 26,
      },
      null,
      null,
      null,
      null,
    ],
  ];

  const filasTotalesClientes: number[] = [];

  for (const clienteNombre of clientesOrdenados) {
    const items = gruposPorCliente.get(clienteNombre) || [];
    const n = items.length;
    if (n === 0) continue;

    // Fila header (1) + n items + Fila TOTAL (1) = n + 2 filas
    const rowSpanColA = n + 2;

    // Determinar tarifa asignada al cliente o usar la estándar de mercado ($7.50 / kg)
    const tarifaInfo = opciones?.getTarifaCliente
      ? opciones.getTarifaCliente(clienteNombre)
      : { tarifa: 7.5, personalizada: false };
    const tarifa = tarifaInfo.tarifa > 0 ? tarifaInfo.tarifa : 7.5;

    // Fila cabecera del cliente
    dataCobros.push([
      {
        value: 'ENVIADO',
        rowSpan: rowSpanColA,
        align: 'center' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        value: 'NOMBRE',
        fontWeight: 'bold' as const,
        backgroundColor: '#4472C4',
        textColor: '#ffffff',
        align: 'center' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
        height: 20,
      },
      {
        value: 'PESO ',
        fontWeight: 'bold' as const,
        backgroundColor: '#4472C4',
        textColor: '#ffffff',
        align: 'center' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        value: 'PRECIO $',
        fontWeight: 'bold' as const,
        backgroundColor: '#4472C4',
        textColor: '#ffffff',
        align: 'center' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        value: 'wr',
        fontWeight: 'bold' as const,
        backgroundColor: '#4472C4',
        textColor: '#ffffff',
        align: 'center' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
    ]);

    const startItemRow = dataCobros.length + 1; // 1-indexed Excel row

    // Filas de datos para cada WR individual
    for (let i = 0; i < n; i++) {
      const it = items[i];
      const currentRow = dataCobros.length + 1;
      const formulaPrecio = `+C${currentRow}*${tarifa}`;
      const pesoNum = typeof it.pesoTotal === 'number' && it.pesoTotal > 0
        ? it.pesoTotal
        : (parseFloat(it.pesoFormateado || '0') || 0);

      dataCobros.push([
        null, // Col A cubierto por rowSpan ENVIADO
        i === 0
          ? {
              value: clienteNombre,
              rowSpan: n > 1 ? n : undefined,
              align: 'center' as const,
              alignVertical: 'center' as const,
              borderColor: '#000000',
              borderStyle: 'thin' as const,
            }
          : null, // Col B cubierto por rowSpan NOMBRE
        {
          value: pesoNum,
          type: Number,
          format: '#,##0.00',
          align: 'center' as const,
          alignVertical: 'center' as const,
          borderColor: '#000000',
          borderStyle: 'thin' as const,
        },
        {
          value: formulaPrecio,
          type: 'Formula',
          format: '$#,##0.00',
          align: 'right' as const,
          alignVertical: 'center' as const,
          borderColor: '#000000',
          borderStyle: 'thin' as const,
        },
        {
          value: it.wr || '',
          type: String,
          align: 'center' as const,
          alignVertical: 'center' as const,
          borderColor: '#000000',
          borderStyle: 'thin' as const,
        },
      ]);
    }

    const endItemRow = dataCobros.length;

    // Fila TOTAL del cliente
    const totalRowIndex = dataCobros.length + 1;
    filasTotalesClientes.push(totalRowIndex);

    const formulaTotal = `SUM(D${startItemRow}:D${endItemRow})`;
    dataCobros.push([
      null, // Col A cubierto por rowSpan ENVIADO
      {
        value: 'TOTAL',
        fontWeight: 'bold' as const,
        align: 'right' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        value: formulaTotal,
        type: 'Formula',
        format: '$#,##0.00',
        fontWeight: 'bold' as const,
        align: 'right' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
    ]);

    // Fila en blanco de separación entre clientes
    dataCobros.push([]);
  }

  // Fila TOTAL GENERAL al final de la planilla
  if (filasTotalesClientes.length > 0) {
    dataCobros.push([]);
    const formulaGeneral = filasTotalesClientes.map((r) => `D${r}`).join('+');
    dataCobros.push([
      null,
      {
        value: 'TOTAL GENERAL',
        fontWeight: 'bold' as const,
        align: 'right' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        value: formulaGeneral,
        type: 'Formula',
        format: '$#,##0.00',
        fontWeight: 'bold' as const,
        align: 'right' as const,
        alignVertical: 'center' as const,
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
      {
        borderColor: '#000000',
        borderStyle: 'thin' as const,
      },
    ]);
  }

  // =========================================================================
  // EXPORTAR LIBRO CON AMBAS HOJAS
  // =========================================================================
  const sheets = [
    {
      sheet: 'Cruce Planilla',
      data: dataCruce,
      columns: [
        { width: 44 }, // NOMBRE
        { width: 22 }, // PESO
        { width: 14 }, // PRECIO $
        { width: 32 }, // CODIGO WAREHOUSE
        { width: 36 }, // TRACKING
        { width: 18 }, // TIPO DE PAQUETE
        { width: 24 }, // OBSERVACIONES
      ],
    },
    {
      sheet: nombreHojaCobro.slice(0, 31),
      data: dataCobros,
      columns: [
        { width: 14 }, // ENVIADO
        { width: 44 }, // NOMBRE
        { width: 14 }, // PESO
        { width: 16 }, // PRECIO $
        { width: 26 }, // wr
      ],
    },
  ];

  const nombreFinal = nombreArchivo.toLowerCase().endsWith('.xlsx')
    ? nombreArchivo
    : `${nombreArchivo}.xlsx`;

  await writeXlsxFile(sheets).toFile(nombreFinal);
}
