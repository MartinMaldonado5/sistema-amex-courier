import { describe, it, expect } from 'vitest';
import { LoginSchema } from '@/lib/validations/auth.schema';
import { CreatePaqueteSchema, QueryPaquetesSchema } from '@/lib/validations/paquetes.schema';
import { CreateInventarioJobSchema } from '@/lib/validations/inventario-jobs.schema';
import { UploadMetadataSchema } from '@/lib/validations/storage.schema';

describe('Validaciones Zod — Suite de Pruebas', () => {
  describe('LoginSchema', () => {
    it('debe aceptar credenciales válidas y normalizar correo a minúsculas', () => {
      const res = LoginSchema.safeParse({ email: ' ADMIN@AMEXCOURIER.PE ', password: 'secretpassword' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('admin@amexcourier.pe');
      }
    });

    it('debe rechazar correo o contraseña vacíos', () => {
      expect(LoginSchema.safeParse({ email: '', password: '123' }).success).toBe(false);
      expect(LoginSchema.safeParse({ email: 'admin@amex.pe', password: '' }).success).toBe(false);
    });
  });

  describe('CreatePaqueteSchema', () => {
    it('debe validar y rellenar valores por defecto para un paquete nuevo', () => {
      const res = CreatePaqueteSchema.safeParse({
        numeroReciboBodega: 'WR-00124',
        pesoKg: '2.5',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.numeroReciboBodega).toBe('WR-00124');
        expect(res.data.pesoKg).toBe(2.5);
        expect(res.data.ubicacionActual).toBe('AmexLince');
        expect(res.data.estadoTib).toBe('EnAlmacen');
        expect(res.data.estadoEntrega).toBe('EnAlmacen');
      }
    });

    it('debe rechazar un paquete sin número de recibo de bodega', () => {
      const res = CreatePaqueteSchema.safeParse({ pesoKg: 10 });
      expect(res.success).toBe(false);
    });

    it('debe rechazar peso negativo', () => {
      const res = CreatePaqueteSchema.safeParse({
        numeroReciboBodega: 'WR-123',
        pesoKg: -5,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('QueryPaquetesSchema', () => {
    it('debe asignar valores por defecto de paginación', () => {
      const res = QueryPaquetesSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(1);
        expect(res.data.pageSize).toBe(50);
        expect(res.data.sortBy).toBe('creado_en');
      }
    });
  });

  describe('CreateInventarioJobSchema', () => {
    it('debe validar job de inventario por base de datos correctamente', () => {
      const res = CreateInventarioJobSchema.safeParse({
        origen_inventario: 'db',
        usar_tib_diario: true,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.sincronizar_db).toBe(true);
      }
    });
  });

  describe('UploadMetadataSchema', () => {
    it('debe validar carpetas de almacenamiento permitidas', () => {
      expect(UploadMetadataSchema.safeParse({ folder: 'entregas' }).success).toBe(true);
      expect(UploadMetadataSchema.safeParse({ folder: 'vouchers' }).success).toBe(true);
      expect(UploadMetadataSchema.safeParse({ folder: 'root-malicioso' }).success).toBe(false);
    });
  });

  describe('BatchSyncScannerSchema', () => {
    it('debe aceptar lotes válidos de escaneo y asignar defaults', async () => {
      const { BatchSyncScannerSchema } = await import('@/lib/validations/scanner.schema');
      const res = BatchSyncScannerSchema.safeParse({
        items: [
          { id: '1', code: 'WR123456', location: 'A1-P1' },
          { id: '2', code: 'WR789012', location: 'A2-P2' }
        ],
        operadorNombre: 'Operador Test'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.items).toHaveLength(2);
        expect(res.data.items[0].format).toBe('CODE_128');
        expect(res.data.items[0].workflow).toBe('slotting');
      }
    });

    it('debe rechazar lotes vacíos', async () => {
      const { BatchSyncScannerSchema } = await import('@/lib/validations/scanner.schema');
      const res = BatchSyncScannerSchema.safeParse({ items: [] });
      expect(res.success).toBe(false);
    });
  });
});

