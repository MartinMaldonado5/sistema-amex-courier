import * as XLSX from 'xlsx';
import {
  ClienteCobroLote,
  ItemCobroWR,
  EstadoPagoWR,
  EstadoEntregaWR,
  RegistroEntrega
} from '../types';

export interface SheetParseResult {
  sheetName: string;
  totalClientes: number;
  totalWRs: number;
  totalUsd: number;
  clientes: ClienteCobroLote[];
}

export interface WorkbookParseResult {
  fileName: string;
  sheetNames: string[];
  sheets: Record<string, SheetParseResult>;
  todosLosLotes: ClienteCobroLote[];
}

export const ExcelCobrosParser = {
  /**
   * Lee un archivo ArrayBuffer de Excel y lo transforma en modelos ClienteCobroLote
   */
  parseWorkbook(buffer: ArrayBuffer, fileName: string = 'Cobros.xlsx'): WorkbookParseResult {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetNames = wb.SheetNames;
    const sheetsMap: Record<string, SheetParseResult> = {};
    const todosLosLotes: ClienteCobroLote[] = [];

    for (const sname of sheetNames) {
      const ws = wb.Sheets[sname];
      if (!ws) continue;

      const clientes = this.parseSheet(ws, sname);
      if (clientes.length > 0) {
        let sheetWRs = 0;
        let sheetUsd = 0;
        clientes.forEach((c) => {
          sheetWRs += c.itemsWR.length;
          sheetUsd += c.totalPrecioUsd;
          todosLosLotes.push(c);
        });

        sheetsMap[sname] = {
          sheetName: sname,
          totalClientes: clientes.length,
          totalWRs: sheetWRs,
          totalUsd: Math.round(sheetUsd * 100) / 100,
          clientes
        };
      }
    }

    return {
      fileName,
      sheetNames,
      sheets: sheetsMap,
      todosLosLotes
    };
  },

  /**
   * Parsea una hoja individual de Excel
   */
  parseSheet(ws: XLSX.WorkSheet, sheetName: string): ClienteCobroLote[] {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:H1');
    const clientes: ClienteCobroLote[] = [];

    let currentClienteName = '';
    let isCorporate = false;
    let currentSubConsignee = '';
    let currentWRs: ItemCobroWR[] = [];
    let currentObservations = '';

    const finalizeCurrentClient = () => {
      if (!currentClienteName || currentWRs.length === 0) {
        currentClienteName = '';
        currentWRs = [];
        isCorporate = false;
        currentObservations = '';
        return;
      }

      let totalPeso = 0;
      let totalUsd = 0;
      let pagadoUsd = 0;
      let pendienteUsd = 0;
      let countPagados = 0;
      let countEntregados = 0;
      const subConsigneesSet = new Set<string>();

      currentWRs.forEach((w) => {
        totalPeso += w.pesoKg;
        totalUsd += w.precioUsd;
        if (w.estadoPago === 'PAGADO') {
          pagadoUsd += w.precioUsd;
          countPagados++;
        } else {
          pendienteUsd += w.precioUsd;
        }
        if (w.estadoEntrega === 'ENTREGADO' || w.estadoEntrega === 'RECOGIDO') {
          countEntregados++;
        }
        if (w.consignatarioNombre) {
          subConsigneesSet.add(w.consignatarioNombre);
        }
      });

      const estadoGlobalPago: 'PAGADO' | 'FALTA' | 'PARCIAL' =
        countPagados === currentWRs.length
          ? 'PAGADO'
          : countPagados === 0
          ? 'FALTA'
          : 'PARCIAL';

      const estadoGlobalEntrega: 'EN_ALMACEN' | 'ENTREGADO' | 'PARCIAL' =
        countEntregados === currentWRs.length
          ? 'ENTREGADO'
          : countEntregados === 0
          ? 'EN_ALMACEN'
          : 'PARCIAL';

      clientes.push({
        id: `lote_${sheetName}_${currentClienteName.replace(/\s+/g, '_')}_${clientes.length + 1}`,
        clienteNombre: currentClienteName,
        esCorporativo: isCorporate,
        subConsignatarios: Array.from(subConsigneesSet),
        fechaLote: sheetName.trim(),
        hojaExcelOrigen: sheetName.trim(),
        itemsWR: [...currentWRs],
        totalPesoKg: Math.round(totalPeso * 100) / 100,
        totalPrecioUsd: Math.round(totalUsd * 100) / 100,
        totalPagadoUsd: Math.round(pagadoUsd * 100) / 100,
        totalPendienteUsd: Math.round(pendienteUsd * 100) / 100,
        estadoGlobalPago,
        estadoGlobalEntrega,
        observacionesLote: currentObservations || undefined,
        actualizadoEn: new Date().toISOString()
      });

      currentClienteName = '';
      currentWRs = [];
      isCorporate = false;
      currentObservations = '';
      currentSubConsignee = '';
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const getVal = (colIdx: number): string => {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: colIdx })];
        return cell && cell.v !== undefined ? String(cell.v).trim() : '';
      };

      const c1 = getVal(0); // Col A (Nombre)
      const c2 = getVal(1); // Col B (Peso)
      const c3 = getVal(2); // Col C (Precio $)
      const c4 = getVal(3); // Col D (WR)
      const c5 = getVal(4); // Col E (Tracking / Estado / Nota)
      const c6 = getVal(5); // Col F (Notas extendidas / Fecha entrega)

      // 1. Detección de fila de cabecera de cliente corporativo (ej: "CLIENTE: CORP. FRAGMANI")
      if (c1.toUpperCase().startsWith('CLIENTE:') || c1.toUpperCase().includes('CORP.') || c1.toUpperCase().includes('EMPRESA:')) {
        finalizeCurrentClient();
        currentClienteName = c1.replace(/^CLIENTE:\s*/i, '').trim().toUpperCase();
        isCorporate = true;
        continue;
      }

      // 2. Detección de fila de cabecera estándar de tabla ('NOMBRE' | 'PESO' | 'PRECIO $' | 'WR')
      if (c1.toUpperCase() === 'NOMBRE' || c2.toUpperCase().includes('PESO') || c3.toUpperCase().includes('PRECIO')) {
        if (!isCorporate) {
          finalizeCurrentClient();
        }
        if (c5) {
          currentObservations = c5;
        }
        continue;
      }

      // 3. Detección de fila de TOTAL
      if (c1.toUpperCase().startsWith('TOTAL') || c2.toUpperCase().startsWith('TOTAL')) {
        finalizeCurrentClient();
        continue;
      }

      // 4. Si la fila tiene WR o Precio/Peso
      const hasWR = c4.toUpperCase().includes('WR') || c4.trim().length > 3;
      const hasWeightOrPrice = Boolean(c2 || c3);

      if (hasWR || hasWeightOrPrice) {
        // Si hay nombre en Columna A
        if (c1 && !c1.toUpperCase().startsWith('TOTAL')) {
          if (isCorporate) {
            currentSubConsignee = c1.toUpperCase();
          } else {
            if (currentClienteName && currentClienteName !== c1.toUpperCase()) {
              finalizeCurrentClient();
            }
            currentClienteName = c1.toUpperCase();
          }
        }

        // Si aún no tenemos nombre de cliente y la fila tiene datos, usar el sub-consignatario o genérico
        if (!currentClienteName && c1) {
          currentClienteName = c1.toUpperCase();
        }

        const pesoNum = parseFloat(c2.replace(',', '.')) || 0;
        const precioNum = parseFloat(c3.replace(',', '.')) || 0;
        const wrText = c4 || 'WR-PENDIENTE';

        // Evaluar notas y estados
        const combinedNotes = `${c5} ${c6}`.trim();
        const upperNotes = combinedNotes.toUpperCase();

        let estadoPago: EstadoPagoWR = 'FALTA';
        if (upperNotes.includes('PAGO') || currentObservations.toUpperCase().includes('PAGO')) {
          estadoPago = 'PAGADO';
        }
        if (upperNotes.includes('FALTA') || currentObservations.toUpperCase().includes('FALTA')) {
          estadoPago = 'FALTA';
        }

        let estadoEntrega: EstadoEntregaWR = 'EN_ALMACEN';
        if (upperNotes.includes('RECOJO') || upperNotes.includes('ENTREG') || currentObservations.toUpperCase().includes('RECOJO')) {
          estadoEntrega = 'RECOGIDO';
        }

        // Detección de entrega física / motorizado si está documentada
        let entregaInfo: RegistroEntrega | undefined = undefined;
        if (upperNotes.includes('ENTREGADO') || upperNotes.includes('RECOJO')) {
          let tipoRetirante: 'TITULAR' | 'FAMILIAR' | 'MOTORIZADO' | 'OTRO' = 'TITULAR';
          let nombreRetirante = currentClienteName;

          if (upperNotes.includes('MOTORIZADO') || upperNotes.includes('DIDI') || upperNotes.includes('UBER')) {
            tipoRetirante = 'MOTORIZADO';
            nombreRetirante = combinedNotes;
          } else if (upperNotes.includes('REINA SOFIA') || upperNotes.includes('MICHA') || upperNotes.includes('ERICK ALEXIS')) {
            tipoRetirante = 'FAMILIAR';
            nombreRetirante = combinedNotes;
          }

          entregaInfo = {
            tipoRetirante,
            nombreRetirante,
            fechaHoraEntrega: combinedNotes.includes('11/09/2026') ? combinedNotes : new Date().toLocaleDateString(),
            observaciones: combinedNotes
          };
        }

        // Detección de Tracking USA o número de caja
        let trackingUsa: string | undefined = undefined;
        let cajaNumero: string | undefined = undefined;

        if (c5 && !c5.toUpperCase().includes('PAGO') && !c5.toUpperCase().includes('RECOJO') && !c5.toUpperCase().includes('FALTA')) {
          if (c5.startsWith('1Z') || c5.startsWith('TBA') || c5.length > 10) {
            trackingUsa = c5;
          } else {
            cajaNumero = c5;
          }
        }

        const item: ItemCobroWR = {
          id: `wr_${sheetName}_${R}_${Math.random().toString(36).substring(2, 7)}`,
          wr: wrText,
          trackingUsa,
          cajaNumero,
          pesoKg: pesoNum,
          precioUsd: precioNum,
          estadoPago,
          estadoEntrega,
          entregaInfo,
          consignatarioNombre: isCorporate ? currentSubConsignee : undefined,
          notas: combinedNotes || undefined
        };

        currentWRs.push(item);
      }
    }

    // Finalizar último cliente
    finalizeCurrentClient();

    return clientes;
  }
};
