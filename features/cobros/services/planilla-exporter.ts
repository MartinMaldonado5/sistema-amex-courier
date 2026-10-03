import writeXlsxFile, { type SheetData, type Row } from 'write-excel-file/browser';
import type { FilaResultadoCobro } from '@/app/api/cobros/cruzar-planilla/route';

export type { FilaResultadoCobro };

function esFilaAgrupada(f: FilaResultadoCobro): boolean {
  if (f.esMultiWr) return true;
  if (Array.isArray(f.wrs) && f.wrs.length > 1) return true;
  const wrStr = String(f.wr || '').trim();
  if (wrStr.includes('-') || wrStr.includes('/') || wrStr.includes(',')) return true;
  const matches = wrStr.match(/WR\d+/gi);
  return Boolean(matches && matches.length > 1);
}

/**
 * Genera la planilla de cobros (.xlsx):
 * 1. Cada fila lleva explícitamente el nombre de a quién le pertenece ese WR en la columna NOMBRE.
 * 2. Sin filas de "TOTAL", sin subtotales y sin cálculo de total en el peso (pesos individuales correspondientes).
 * 3. Sección principal: WRs individuales estándar.
 * 4. Separación con espacios en blanco al final de la tabla.
 * 5. Sección final: Celdas con WRs agrupados (con '-' o '/').
 */
export async function exportarPlanillaCobros(
  filas: FilaResultadoCobro[],
  nombreArchivo = `PLANILLA COBROS ${new Date().toISOString().slice(0, 10)}.xlsx`
): Promise<void> {
  if (filas.length === 0) {
    throw new Error('No hay filas para exportar la planilla.');
  }

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

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const headerRow: Row = [
    { value: 'NOMBRE', fontWeight: 'bold' as const },
    { value: 'PESO', fontWeight: 'bold' as const },
    { value: 'PRECIO $', fontWeight: 'bold' as const },
    { value: 'CODIGO WAREHOUSE', fontWeight: 'bold' as const },
    { value: 'TRACKING', fontWeight: 'bold' as const },
    { value: 'TIPO DE PAQUETE', fontWeight: 'bold' as const },
    { value: 'OBSERVACIONES', fontWeight: 'bold' as const },
  ];

  const data: SheetData = [
    [
      {
        value: `COBROS REALIZADOS EL DIA ${fechaHoy} — ${filas.length} FILAS`,
        fontWeight: 'bold' as const,
        fontSize: 12,
      },
    ],
    [],
    headerRow,
  ];

  // 2. SECCIÓN 1: WRs Individuales (cada fila con su nombre y peso individual, sin totales)
  for (const it of filasSimples) {
    const nombreCliente = String(it.cliente || 'SIN NOMBRE').trim().toUpperCase();
    const pesoVal = typeof it.pesoTotal === 'number' && it.pesoTotal > 0
      ? { value: it.pesoTotal, type: Number, format: '#,##0.00' }
      : { value: it.pesoFormateado || '—', type: String };

    data.push([
      { value: nombreCliente, type: String },
      pesoVal,
      null, // PRECIO $: libre para el operador
      { value: it.wr || '', type: String },
      it.tracking ? { value: it.tracking, type: String } : null,
      it.tipo ? { value: it.tipo, type: String } : null,
      it.observaciones ? { value: it.observaciones, type: String } : null,
    ]);
  }

  // 3. SEPARACIÓN: Espacios en blanco al final antes de los WRs agrupados
  if (filasAgrupadas.length > 0) {
    data.push([]);
    data.push([]);
    data.push([]);

    // Título de la sección separada al final
    data.push([
      { value: 'WRS AGRUPADOS (PAQUETES CON GUÍAS COMBINADAS)', fontWeight: 'bold' as const, fontSize: 11 },
    ]);
    data.push(headerRow);

    // 4. SECCIÓN 2: Celdas con WRs agrupados (- o /)
    for (const it of filasAgrupadas) {
      const delimiter = it.delimiter || (it.wr.includes('/') ? ' / ' : ' - ');

      // Nombres de cada WR individual combinados con el delimitador (ej: "CLIENTE 1 - CLIENTE 2")
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

      // En celdas agrupadas: NO poner total numérico, poner los pesos individuales separados por el delimitador (ej: "3.98 - 2.22")
      const pesoFormateado = it.pesoFormateado || '—';

      data.push([
        { value: nombreCliente, type: String },
        { value: pesoFormateado, type: String }, // Pesos individuales formateados tal cual sin total sumado
        null, // PRECIO $: libre para el operador
        { value: it.wr || '', type: String }, // Celda de WRs agrupados intacta
        it.tracking ? { value: it.tracking, type: String } : null,
        it.tipo ? { value: it.tipo, type: String } : null,
        it.observaciones ? { value: it.observaciones, type: String } : null,
      ]);
    }
  }

  const nombreHoja = `COBRO ${new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }).replace('/', '.')}`;

  await writeXlsxFile(data, {
    sheet: nombreHoja.slice(0, 31),
    columns: [
      { width: 48 }, // NOMBRE (más ancho para nombres agrupados con guiones)
      { width: 26 }, // PESO
      { width: 12 }, // PRECIO $
      { width: 36 }, // CODIGO WAREHOUSE
      { width: 40 }, // TRACKING
      { width: 18 }, // TIPO DE PAQUETE
      { width: 24 }, // OBSERVACIONES
    ],
  }).toFile(nombreArchivo.toLowerCase().endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`);
}
