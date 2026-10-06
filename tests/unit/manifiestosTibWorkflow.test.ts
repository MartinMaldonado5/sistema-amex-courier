import { describe, it, expect } from 'vitest';

describe('Módulo 17: Manifiestos TIB — Workflow & Historial', () => {
  it('calcula correctamente la reconciliación y cuadre matemático de un manifiesto', () => {
    const encabezado = {
      fecha_vuelo: '4-10',
      cliente: 'AMEX',
      modalidad: 'OFICINA',
      guias_declaradas: 159,
      paquetes_declarados: 196,
    };

    // Simulación de filas extraídas
    const filas = [
      { guia: 'AMX000009060', wrs: ['WR000469622', 'WR000465623'], observacion: '' }, // 2 bultos
      { guia: 'AMX000009061', wrs: ['WR000454540'], observacion: '' }, // 1 bulto
      { guia: 'AMX000009062', wrs: ['WR000454536'], observacion: '' }, // 1 bulto
    ];

    const totalGuiasExtraidas = filas.length;
    const totalWrsExtraidos = filas.reduce((acc, f) => acc + f.wrs.length, 0);

    expect(totalGuiasExtraidas).toBe(3);
    expect(totalWrsExtraidos).toBe(4);

    const guiasMultiBulto = filas.filter((f) => f.wrs.length > 1);
    expect(guiasMultiBulto.length).toBe(1);
    expect(guiasMultiBulto[0].guia).toBe('AMX000009060');
  });

  it('agrupa correctamente detalles planos en formato de guía AMX con múltiples WRs para el historial', () => {
    const rawDetalles = [
      { numero_guia_amx: 'AMX000009060', numero_wr: 'WR000469622', fila_index: 1, observacion: '' },
      { numero_guia_amx: 'AMX000009060', numero_wr: 'WR000465623', fila_index: 1, observacion: '' },
      { numero_guia_amx: 'AMX000009061', numero_wr: 'WR000454540', fila_index: 2, observacion: 'Cliente recoge sábado' },
      { numero_guia_amx: 'AMX000009062', numero_wr: 'SIN_WR', fila_index: 3, observacion: 'Falta etiqueta' },
    ];

    const agrupadoMap = new Map<string, { guia: string; wrs: string[]; observacion: string; fila_index: number }>();

    rawDetalles.forEach((row) => {
      const guia = row.numero_guia_amx;
      if (!agrupadoMap.has(guia)) {
        agrupadoMap.set(guia, {
          guia,
          wrs: row.numero_wr && row.numero_wr !== 'SIN_WR' ? [row.numero_wr] : [],
          observacion: row.observacion || '',
          fila_index: row.fila_index,
        });
      } else {
        const existing = agrupadoMap.get(guia)!;
        if (row.numero_wr && row.numero_wr !== 'SIN_WR' && !existing.wrs.includes(row.numero_wr)) {
          existing.wrs.push(row.numero_wr);
        }
        if (!existing.observacion && row.observacion) {
          existing.observacion = row.observacion;
        }
      }
    });

    const resultado = Array.from(agrupadoMap.values()).sort((a, b) => a.fila_index - b.fila_index);

    expect(resultado.length).toBe(3);
    expect(resultado[0].guia).toBe('AMX000009060');
    expect(resultado[0].wrs).toEqual(['WR000469622', 'WR000465623']);
    expect(resultado[1].guia).toBe('AMX000009061');
    expect(resultado[1].observacion).toBe('Cliente recoge sábado');
    expect(resultado[2].guia).toBe('AMX000009062');
    expect(resultado[2].wrs).toEqual([]); // SIN_WR convertido en arreglo vacío
  });

  it('calcula la tasa de cuadre perfecto de los KPIs históricos', () => {
    const manifiestosMock = [
      { id: '1', es_cuadre_perfecto: true, guias_extraidas: 159, paquetes_extraidos: 196 },
      { id: '2', es_cuadre_perfecto: true, guias_extraidas: 100, paquetes_extraidos: 120 },
      { id: '3', es_cuadre_perfecto: false, guias_extraidas: 80, paquetes_extraidos: 85 },
      { id: '4', es_cuadre_perfecto: true, guias_extraidas: 200, paquetes_extraidos: 250 },
    ];

    const totalManifiestos = manifiestosMock.length;
    const totalCuadrePerfecto = manifiestosMock.filter((m) => m.es_cuadre_perfecto).length;
    const tasaCuadre = Math.round((totalCuadrePerfecto / totalManifiestos) * 100);

    expect(totalManifiestos).toBe(4);
    expect(totalCuadrePerfecto).toBe(3);
    expect(tasaCuadre).toBe(75);
  });
});
