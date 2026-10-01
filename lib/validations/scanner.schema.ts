import { z } from 'zod';

export const ScannedLogItemSchema = z.object({
  id: z.string().trim().min(1, 'El ID de escaneo es requerido.'),
  code: z.string().trim().min(1, 'El código es requerido.'),
  format: z.string().trim().default('CODE_128'),
  time: z.string().trim().optional(),
  timestamp: z.coerce.number().optional(),
  location: z.string().trim().optional(),
  anaquel: z.string().trim().optional(),
  piso: z.string().trim().optional(),
  workflow: z.enum(['slotting', 'lookup', 'delivery', 'general']).default('slotting'),
  nombreConsignatario: z.string().trim().optional(),
  operadorEmail: z.string().trim().optional(),
  operadorNombre: z.string().trim().optional(),
});

export const BatchSyncScannerSchema = z.object({
  items: z.array(ScannedLogItemSchema).min(1, 'El lote debe contener al menos un elemento para sincronizar.'),
  operadorNombre: z.string().trim().optional(),
  operadorEmail: z.string().trim().optional(),
  operadorId: z.string().trim().optional(),
});

export type ScannedLogItemInput = z.infer<typeof ScannedLogItemSchema>;
export type BatchSyncScannerInput = z.infer<typeof BatchSyncScannerSchema>;
