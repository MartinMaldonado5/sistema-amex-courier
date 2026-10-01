import { describe, it, expect } from 'vitest';
import {
  sanitizeFileName,
  buildEntregaPath,
  buildVoucherPath,
  buildInvoicePath,
  buildDniPath,
  buildManifiestoPath,
} from '@/lib/r2/datePartitionedUpload';

describe('R2 Date Partitioned Upload — Suite de Rutas', () => {
  it('debe sanitizar nombres de archivo eliminando caracteres especiales y normalizando a mayúsculas', () => {
    const clean = sanitizeFileName('Foto / Entrega #123 (Voucher)!');
    expect(clean).not.toContain('/');
    expect(clean).not.toContain('#');
    expect(clean).not.toContain('!');
    expect(clean).toBe('FOTO_ENTREGA_123_VOUCHER');
  });

  it('debe construir ruta de entrega con año, mes y día', () => {
    const p = buildEntregaPath('ENT-001', 'Juan Perez', 'firma.png');
    expect(p).toMatch(/^entregas\/\d{4}\/\d{2}\/\d{2}\/ENT-001_JUAN_PEREZ\/FIRMA\.png$/);
  });

  it('debe construir ruta de voucher con método de pago y fecha', () => {
    const p = buildVoucherPath('COB-10', 'Maria Gomez', 'PLIN', 'webp');
    expect(p).toMatch(/^vouchers-pagos\/\d{4}\/\d{2}\/\d{2}\/COB-10_MARIA_GOMEZ_PLIN\.webp$/);
  });

  it('debe construir ruta de factura invoice', () => {
    const p = buildInvoicePath('WR-999', 'Carlos Lopez', 'AMAZON', 'invoice.pdf');
    expect(p).toMatch(/^facturas-invoices\/\d{4}\/\d{2}\/\d{2}\/WR-999_CARLOS_LOPEZ_AMAZON\.pdf$/);
  });

  it('debe construir ruta de documento DNI particionado por año y mes', () => {
    const p = buildDniPath('CAS-400', 'Pedro Ruiz', 'ANVERSO', 'jpg');
    expect(p).toMatch(/^documentos-dni\/\d{4}\/\d{2}\/CAS-400_PEDRO_RUIZ_DNI_ANVERSO\.jpg$/);
  });

  it('debe construir ruta de manifiesto de despacho', () => {
    const p = buildManifiestoPath('CARRO_AMEX', 'RUTA-LIMA-NORTE', 'pdf');
    expect(p).toMatch(/^manifiestos-despacho\/\d{4}\/\d{2}\/\d{2}\/MANIFIESTO_CARRO_AMEX_RUTA-LIMA-NORTE\.pdf$/);
  });
});
