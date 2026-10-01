import { z } from 'zod';

export const ALLOWED_STORAGE_FOLDERS = [
  'entregas',
  'expedientes',
  'facturas',
  'facturas-invoices',
  'dnis',
  'documentos-dni',
  'manifiestos',
  'manifiestos-despacho',
  'vouchers',
  'vouchers-pagos',
  'fotos',
  'documentos'
] as const;

export const StorageFolderSchema = z.enum(ALLOWED_STORAGE_FOLDERS);

export const UploadMetadataSchema = z.object({
  folder: StorageFolderSchema.default('entregas'),
  codigoEntrega: z.string().trim().optional(),
  codigoCobro: z.string().trim().optional(),
  clienteNombre: z.string().trim().optional(),
  receptorNombre: z.string().trim().optional(),
  wrNumero: z.string().trim().optional(),
  casillero: z.string().trim().optional(),
  tienda: z.string().trim().optional(),
  metodoPago: z.string().trim().default('YAPE'),
  tipoDni: z.enum(['ANVERSO', 'REVERSO', 'COMPLETO']).default('ANVERSO'),
});

export type UploadMetadataInput = z.infer<typeof UploadMetadataSchema>;
