import { z } from 'zod';

export const TibFuenteSchema = z.enum(['delivered', 'sent', 'received']);

export const CreateInventarioJobSchema = z.object({
  origen_inventario: z.enum(['db', 'file']).default('db'),
  filtro_estado: z.string().trim().optional(),
  usar_tib_diario: z.boolean().default(false),
  inventario_key: z.string().trim().optional(),
  entregado_key: z.string().trim().optional(),
  enviado_key: z.string().trim().optional(),
  recibido_key: z.string().trim().optional(),
  fuentes: z.array(TibFuenteSchema).optional(),
  sincronizar_db: z.boolean().default(true),
  user_nombre: z.string().trim().optional(),
});

export const PresignUploadSchema = z.object({
  tipo: z.enum(['inventario', 'delivered', 'sent', 'received']),
  filename: z.string().trim().min(1, 'El nombre de archivo es requerido.'),
  size: z.coerce.number().positive('El tamaño debe ser positivo.').max(150 * 1024 * 1024, 'El archivo supera el límite de 150MB.'),
});

export type CreateInventarioJobInput = z.infer<typeof CreateInventarioJobSchema>;
export type PresignUploadInput = z.infer<typeof PresignUploadSchema>;
