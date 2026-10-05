import { describe, it, expect } from 'vitest';
import { ExcelCobrosParser } from '@/features/cobros/services/excel-cobros-parser';
import { KambistaService } from '@/features/cobros/services/kambista.service';

describe('Módulo 4: Cobros (FICO-Cobros) — Cálculos, Balances y Conversión Cambiaria', () => {
  describe('ExcelCobrosParser.parseSheet — Agrupación, Estados y Balances', () => {
    it('debe calcular correctamente peso, total USD, pendiente USD y estado "FALTA" cuando ningún WR está pagado', () => {
      const mockRows = [
        ['NOMBRE', 'PESO', 'PRECIO $', 'WR', 'TRACKING', 'NOTAS'],
        ['JUAN PEREZ', '2.5', '35.00', 'WR-101', 'TRK-001', ''],
        ['JUAN PEREZ', '1.5', '20.00', 'WR-102', 'TRK-002', ''],
        ['TOTAL', '4.0', '55.00', '', '', '']
      ];

      const lotes = ExcelCobrosParser.parseSheet(mockRows as any, '2026-10-04');
      expect(lotes.length).toBe(1);

      const cliente = lotes[0];
      expect(cliente.clienteNombre).toBe('JUAN PEREZ');
      expect(cliente.itemsWR.length).toBe(2);
      expect(cliente.totalPesoKg).toBe(4);
      expect(cliente.totalPrecioUsd).toBe(55);
      expect(cliente.totalPagadoUsd).toBe(0);
      expect(cliente.totalPendienteUsd).toBe(55);
      expect(cliente.estadoGlobalPago).toBe('FALTA');
      expect(cliente.estadoGlobalEntrega).toBe('EN_ALMACEN');
    });

    it('debe determinar estado de pago "PARCIAL" cuando parte de los WRs están pagados y parte pendientes', () => {
      const mockRows = [
        ['NOMBRE', 'PESO', 'PRECIO $', 'WR', 'ESTADO', 'NOTAS'],
        ['MARIA LOPEZ', '3.0', '45.00', 'WR-201', 'PAGADO', 'Yape'],
        ['MARIA LOPEZ', '2.0', '30.00', 'WR-202', 'PENDIENTE', ''],
        ['TOTAL', '5.0', '75.00', '', '', '']
      ];

      const lotes = ExcelCobrosParser.parseSheet(mockRows as any, '2026-10-04');
      expect(lotes.length).toBe(1);

      const cliente = lotes[0];
      expect(cliente.clienteNombre).toBe('MARIA LOPEZ');
      expect(cliente.totalPrecioUsd).toBe(75);
      expect(cliente.totalPagadoUsd).toBe(45);
      expect(cliente.totalPendienteUsd).toBe(30);
      expect(cliente.estadoGlobalPago).toBe('PARCIAL');
    });

    it('debe determinar estado "PAGADO" y entrega "ENTREGADO" cuando todos los WRs están cancelados y entregados', () => {
      const mockRows = [
        ['NOMBRE', 'PESO', 'PRECIO $', 'WR', 'ESTADO', 'ENTREGA'],
        ['CARLOS RUIZ', '1.0', '15.00', 'WR-301', 'PAGADO', 'ENTREGADO'],
        ['CARLOS RUIZ', '2.0', '30.00', 'WR-302', 'CANCELADO', 'RECOGIDO'],
        ['TOTAL', '3.0', '45.00', '', '', '']
      ];

      const lotes = ExcelCobrosParser.parseSheet(mockRows as any, '2026-10-04');
      expect(lotes.length).toBe(1);

      const cliente = lotes[0];
      expect(cliente.totalPrecioUsd).toBe(45);
      expect(cliente.totalPagadoUsd).toBe(45);
      expect(cliente.totalPendienteUsd).toBe(0);
      expect(cliente.estadoGlobalPago).toBe('PAGADO');
      expect(cliente.estadoGlobalEntrega).toBe('ENTREGADO');
    });

    it('debe detectar correctamente clientes corporativos y agrupar subconsignatarios', () => {
      const mockRows = [
        ['CLIENTE: CORP. FRAGMANI PERU S.A.C.', '', '', '', '', ''],
        ['NOMBRE', 'PESO', 'PRECIO $', 'WR', 'NOTAS', ''],
        ['SUCURSAL SUR', '5.0', '70.00', 'WR-401', '', ''],
        ['SUCURSAL NORTE', '8.0', '110.00', 'WR-402', '', ''],
        ['TOTAL', '13.0', '180.00', '', '', '']
      ];

      const lotes = ExcelCobrosParser.parseSheet(mockRows as any, 'LOTE-OCT');
      expect(lotes.length).toBe(1);

      const corporativo = lotes[0];
      expect(corporativo.clienteNombre).toBe('CORP. FRAGMANI PERU S.A.C.');
      expect(corporativo.esCorporativo).toBe(true);
      expect(corporativo.itemsWR.length).toBe(2);
      expect(corporativo.totalPesoKg).toBe(13);
      expect(corporativo.totalPrecioUsd).toBe(180);
      expect(corporativo.subConsignatarios).toContain('SUCURSAL SUR');
      expect(corporativo.subConsignatarios).toContain('SUCURSAL NORTE');
    });
  });

  describe('KambistaService — Conversión de Divisas y Formateo', () => {
    it('debe convertir montos USD a PEN aplicando tipo de cambio y redondeo a 2 decimales', () => {
      const tc = 3.775;
      expect(KambistaService.convertUsdToPen(100, tc)).toBe(377.5);
      expect(KambistaService.convertUsdToPen(33.33, tc)).toBe(125.82);
      expect(KambistaService.convertUsdToPen(0, tc)).toBe(0);
    });

    it('debe convertir montos PEN a USD correctamente', () => {
      const tc = 3.80;
      expect(KambistaService.convertPenToUsd(380, tc)).toBe(100);
      expect(KambistaService.convertPenToUsd(190, tc)).toBe(50);
      expect(KambistaService.convertPenToUsd(100, 0)).toBe(0);
      expect(KambistaService.convertPenToUsd(100, -1)).toBe(0);
    });

    it('debe formatear monedas con símbolos y precisión estándar', () => {
      expect(KambistaService.formatUsd(1234.5)).toBe('$ 1,234.50');
      expect(KambistaService.formatUsd(0)).toBe('$ 0.00');
      expect(KambistaService.formatPen(2500)).toContain('S/');
      expect(KambistaService.formatPen(2500)).toContain('2,500.00');
    });

    it('debe permitir fijar una cotización manual del operador', () => {
      const tcManual = KambistaService.setCotizacionManual(3.72, 3.785);
      expect(tcManual.compra).toBe(3.72);
      expect(tcManual.venta).toBe(3.785);
      expect(tcManual.origen).toBe('MANUAL_OPERADOR');
    });
  });
});
