import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RotulosService } from '@/features/rotulos/services/rotulos.service';
import { generarTextoBulto, getAgencyClass, DEFAULT_REMITENTE } from '@/features/rotulos/types';
import type { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';

describe('Módulo 8: Rótulos A4 — Utilidades y Persistencia', () => {
  describe('generarTextoBulto', () => {
    it('debe generar texto de bulto individual correctamente', () => {
      expect(generarTextoBulto(1, 1, '1')).toBe('RÓTULO 1 DE 1 • TOTAL: 1 CAJA');
    });

    it('debe usar plural cuando hay más de 1 caja', () => {
      expect(generarTextoBulto(2, 3, '5')).toBe('RÓTULO 2 DE 3 • TOTAL: 5 CAJAS');
    });

    it('debe manejar número de rótulo superior al total limitándolo con seguridad', () => {
      expect(generarTextoBulto(10, 2, '2')).toBe('RÓTULO 2 DE 2 • TOTAL: 2 CAJAS');
    });
  });

  describe('getAgencyClass', () => {
    it('debe retornar las clases oficiales según la agencia seleccionada', () => {
      expect(getAgencyClass('SHALOM')).toBe('shalom');
      expect(getAgencyClass('OLVA')).toBe('olva');
      expect(getAgencyClass('CRUZ DEL SUR')).toBe('cruz');
      expect(getAgencyClass('OTRA')).toBe('otra');
      expect(getAgencyClass('')).toBe('unselected');
      expect(getAgencyClass(undefined)).toBe('unselected');
    });
  });

  describe('RotulosService - recordPrintEvent', () => {
    it('debe ignorar slots completamente vacíos y no generar lote si no hay datos', async () => {
      const emptySlots: RotuloSlotData[] = [
        {
          id: 1,
          nombre: '',
          dni: '',
          celular: '',
          agencia: 'SHALOM',
          destino: '',
          remitente: DEFAULT_REMITENTE,
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: 1
        }
      ];

      const res = await RotulosService.recordPrintEvent({
        slots: emptySlots,
        tipoAccion: 'IMPRESION_DIRECTA',
        currentUser: { nombre: 'Kenneth', email: 'kenneth@amex.pe' }
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(0);
      expect(res.loteId).toBe('');
    });
  });
});
