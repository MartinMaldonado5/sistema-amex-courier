import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DniCloudService } from '@/features/dni-matrix/services/dniCloud.service';
import { ActaCloudService } from '@/features/formato-entrega/services/actaCloud.service';
import { InvoiceCloudService } from '@/features/invoices/services/invoiceCloud.service';
import { ScannerQueueCloudService } from '@/features/scanner/services/scannerQueueCloud.service';
import { supabase } from '@/lib/supabase/client';

// Mock del cliente Supabase
vi.mock('@/lib/supabase/client', () => {
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock
    }
  };
});

describe('Cloud-First Synchronization Services (Módulos 7, 10, 11 y 6.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Módulo 7: DniCloudService (Matriz DNI Express)', () => {
    it('retorna null si no se proporciona el correo del usuario al cargar', async () => {
      const res = await DniCloudService.loadDraftFromCloud(undefined);
      expect(res).toBeNull();
    });

    it('carga correctamente el borrador de la matriz DNI desde Supabase', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          slots_data: [{ id: 1, label: 'JUAN PEREZ', dni: '12345678' }],
          settings: { printSize: 'medium', soundEnabled: true },
          total_slots: 50
        },
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle
      });

      const draft = await DniCloudService.loadDraftFromCloud('operador@amex.com');
      expect(draft).not.toBeNull();
      expect(draft?.slots.length).toBe(1);
      expect(draft?.slots[0].label).toBe('JUAN PEREZ');
      expect(draft?.totalSlots).toBe(50);
      expect(draft?.settings.printSize).toBe('medium');
    });

    it('guarda el borrador en Supabase con upsert y actualiza fecha', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert
      });

      const ok = await DniCloudService.saveDraftToCloud({
        slots: [{ id: 1, label: 'ANA LOPEZ' }],
        settings: { printSize: 'large', activeSlotId: 1 },
        totalSlots: 100,
        userEmail: 'operador@amex.com',
        userId: 'user-uuid-1'
      });

      expect(ok).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_email: 'operador@amex.com',
          total_slots: 100
        }),
        { onConflict: 'usuario_email' }
      );
    });

    it('elimina el borrador de la nube al limpiar el lote', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      const ok = await DniCloudService.clearDraftFromCloud('operador@amex.com');
      expect(ok).toBe(true);
    });
  });

  describe('2. Módulo 10: ActaCloudService (Formato de Entrega)', () => {
    it('retorna null si no hay email al cargar borrador', async () => {
      const res = await ActaCloudService.loadDraftFromCloud('');
      expect(res).toBeNull();
    });

    it('carga y deserializa el borrador de actas de entrega', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          form_data: {
            fecha: 'Oct 15, 2026',
            destinatario: 'CARLOS BUSTAMANTE',
            paquetes: ['WR001', 'WR002']
          }
        },
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle
      });

      const draft = await ActaCloudService.loadDraftFromCloud('operador@amex.com');
      expect(draft?.destinatario).toBe('CARLOS BUSTAMANTE');
      expect(draft?.paquetes).toHaveLength(2);
    });

    it('registra un acta emitida en el historial permanente de Supabase', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'acta-uuid-99' },
        error: null
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const actaId = await ActaCloudService.saveActaToCloud({
        data: {
          fecha: 'Oct 15, 2026',
          remitente: 'AMEX COURRIER',
          destinatario: 'CARLOS BUSTAMANTE',
          paquetes: ['WR001'],
          cargoTexto: 'Recibido conforme',
          recibidoPorNombre: 'CARLOS BUSTAMANTE',
          recibidoPorFecha: 'Oct 15, 2026',
          recibidoPorHora: '10:00 AM'
        },
        operadorNombre: 'Operador AMEX',
        operadorEmail: 'operador@amex.com'
      });

      expect(actaId).toBe('acta-uuid-99');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          destinatario: 'CARLOS BUSTAMANTE',
          operador_email: 'operador@amex.com'
        })
      );
    });

    it('obtiene el historial permanente de actas', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'acta-1',
            destinatario: 'ROBERTO CARLOS',
            paquetes: ['WR100'],
            fecha: 'Oct 10, 2026',
            creado_en: '2026-10-10T00:00:00Z',
            operador_nombre: 'Operador 1'
          }
        ],
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        order: mockOrder,
        limit: mockLimit
      });

      const hist = await ActaCloudService.fetchHistorialFromCloud(10);
      expect(hist.length).toBe(1);
      expect(hist[0].destinatario).toBe('ROBERTO CARLOS');
      expect(hist[0].operadorNombre).toBe('Operador 1');
    });
  });

  describe('3. Módulo 11: InvoiceCloudService (Facturas Comerciales USA)', () => {
    it('guarda el borrador de factura en la nube con upsert', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert
      });

      const ok = await InvoiceCloudService.saveDraftToCloud({
        invoiceData: {
          invoiceNumber: 'I000999999',
          billToName: 'MARIA PAREDES',
          shipToName: 'MARIA PAREDES',
          invoiceAmount: '249.99',
          companyName: 'ACCESSORIES SALES',
          companyAddress: '4771 NW 72nd Ave Miami',
          companyCityPhone: 'FL 33166',
          invoiceDate: '10/10/2026',
          paymentTerms: 'Due On Receipt',
          invoiceDueDate: '10/10/2026',
          createdBy: 'AMEX',
          items: []
        },
        userEmail: 'operador@amex.com'
      });

      expect(ok).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_email: 'operador@amex.com'
        }),
        { onConflict: 'usuario_email' }
      );
    });

    it('registra una factura en el historial con cálculo FOB y conteo de items', async () => {
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'inv-uuid-77' },
        error: null
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle
      });

      const invId = await InvoiceCloudService.saveInvoiceToCloud({
        data: {
          invoiceNumber: 'I000123456',
          billToName: 'LUIS SALAZAR',
          shipToName: 'LUIS SALAZAR',
          consigneeDni: '77889900',
          trackingUsa: 'TBA123456',
          invoiceAmount: '$150.00',
          companyName: 'ACCESSORIES SALES',
          companyAddress: 'Miami',
          companyCityPhone: 'FL',
          invoiceDate: '10/10/2026',
          paymentTerms: 'Due On Receipt',
          invoiceDueDate: '10/10/2026',
          createdBy: 'AMEX',
          items: [
            { id: '1', name: 'ZAPATOS', quantity: 1, unitPrice: '150.00', total: '150.00' }
          ]
        },
        operadorNombre: 'Operador Logístico'
      });

      expect(invId).toBe('inv-uuid-77');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_number: 'I000123456',
          total_value_fob: 150,
          items_count: 1,
          consignee_name: 'LUIS SALAZAR'
        })
      );
    });
  });

  describe('4. Módulo 6.1: ScannerQueueCloudService (Staging Queue de Escáner)', () => {
    it('carga la cola de lecturas pendientes del operador', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          queue_items: [
            { id: 'scan-1', code: 'WR0001', location: 'A-01-P1', synced: false }
          ],
          total_items: 1
        },
        error: null
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        maybeSingle: mockMaybeSingle
      });

      const queue = await ScannerQueueCloudService.loadStagingQueueFromCloud('operador@amex.com');
      expect(queue?.length).toBe(1);
      expect(queue?.[0].code).toBe('WR0001');
      expect(queue?.[0].location).toBe('A-01-P1');
    });

    it('persiste la cola en Supabase mediante upsert', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        upsert: mockUpsert
      });

      const ok = await ScannerQueueCloudService.saveStagingQueueToCloud({
        queue: [
          { id: 'scan-1', code: 'WR0001', location: 'A-01-P1', synced: false } as any,
          { id: 'scan-2', code: 'WR0002', location: 'A-01-P2', synced: false } as any
        ],
        userEmail: 'operador@amex.com'
      });

      expect(ok).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_email: 'operador@amex.com',
          total_items: 2
        }),
        { onConflict: 'usuario_email' }
      );
    });

    it('elimina la cola en la nube al limpiarla tras sincronización exitosa', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
        eq: mockEq
      });

      const ok = await ScannerQueueCloudService.clearStagingQueueFromCloud('operador@amex.com');
      expect(ok).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('usuario_email', 'operador@amex.com');
    });
  });
});
