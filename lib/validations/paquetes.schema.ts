import { z } from 'zod';
import { isValidWr } from './wr';

export const UbicacionSchema = z.enum(['AmexLince', 'Entregado']).catch('AmexLince');
export const EstadoTibSchema = z.enum([
  'EnAlmacen',
  'Enviado',
  'Recibido',
  'Entregado',
]).catch('EnAlmacen');
export const EstadoEntregaSchema = EstadoTibSchema; // Compatibilidad

export const CreatePaqueteSchema = z.object({
  numeroReciboBodega: z.string().trim().transform(v => v.toUpperCase()).refine(v => isValidWr(v), {
    message: 'El código WR debe comenzar con WR y tener exactamente 11 caracteres (ej. WR000474478).'
  }),
  tracking: z.string().trim().default(''),
  trackingUsa: z.string().trim().optional(),
  tipoEmpaque: z.string().trim().default('CAJA'),
  numeroFactura: z.string().trim().optional(),
  dniConsignatario: z.string().trim().optional(),
  nombreConsignatario: z.string().trim().optional(),
  descripcion: z.string().trim().default('MERCADERIA GENERAL'),
  pesoKg: z.coerce.number().min(0, 'El peso no puede ser negativo.').default(0),
  valorDeclaradoUsd: z.coerce.number().optional(),
  ubicacionActual: UbicacionSchema.default('AmexLince'),
  anaquel: z.string().trim().optional(),
  piso: z.string().trim().optional(),
  posicionEstante: z.string().trim().optional(),
  estadoTib: EstadoTibSchema.default('EnAlmacen'),
  estadoEntrega: EstadoTibSchema.default('EnAlmacen'),
  facturaPdfUrl: z.string().trim().optional(),
});

export const UpdatePaqueteSchema = CreatePaqueteSchema.partial();

export const AssignShelfSchema = z.object({
  id: z.string().uuid('ID de paquete inválido.'),
  posicionEstante: z.string().trim().min(1, 'La posición de estantería es requerida.'),
  anaquel: z.string().trim().optional(),
  piso: z.string().trim().optional(),
});

export const QueryPaquetesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
  search: z.string().trim().optional(),
  estadoTib: z.string().trim().optional(),
  estadoEntrega: z.string().trim().optional(),
  ubicacionActual: z.string().trim().optional(),
  sortBy: z.enum(['creado_en', 'numero_recibo_bodega', 'peso_kg', 'nombre_consignatario']).default('creado_en'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePaqueteInput = z.infer<typeof CreatePaqueteSchema>;
export type UpdatePaqueteInput = z.infer<typeof UpdatePaqueteSchema>;
export type QueryPaquetesInput = z.infer<typeof QueryPaquetesSchema>;
