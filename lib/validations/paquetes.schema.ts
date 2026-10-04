import { z } from 'zod';

export const UbicacionSchema = z.enum(['AmexLince', 'Entregado']).catch('AmexLince');
export const MetodoEntregaSchema = z.enum(['RecojoLince', 'CarroAmexDomicilio', 'AgenciaProvincia']).catch('CarroAmexDomicilio');
export const EstadoEntregaSchema = z.enum([
  'EnAlmacen',
  'Enviado',
  'Recibido',
  'EnRutaCarroAmex',
  'EntregadoDomicilio',
  'RecogidoAlmacen',
  'ListoParaRecojo',
  'Entregado',
]).catch('EnAlmacen');

export const CreatePaqueteSchema = z.object({
  numeroReciboBodega: z.string().trim().min(1, 'El recibo de bodega (WR) es requerido.'),
  trackingUsa: z.string().trim().default(''),
  tipoEmpaque: z.string().trim().default('CAJA'),
  numeroFactura: z.string().trim().optional(),
  dniConsignatario: z.string().trim().optional(),
  nombreConsignatario: z.string().trim().optional(),
  descripcion: z.string().trim().default('MERCADERIA GENERAL'),
  pesoKg: z.coerce.number().min(0, 'El peso no puede ser negativo.').default(0),
  valorDeclaradoUsd: z.coerce.number().min(0, 'El valor declarado no puede ser negativo.').default(0),
  ubicacionActual: UbicacionSchema.default('AmexLince'),
  anaquel: z.string().trim().optional(),
  piso: z.string().trim().optional(),
  posicionEstante: z.string().trim().optional(),
  metodoEntrega: MetodoEntregaSchema.default('CarroAmexDomicilio'),
  estadoEntrega: EstadoEntregaSchema.default('EnAlmacen'),
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
  estadoEntrega: z.string().trim().optional(),
  ubicacionActual: z.string().trim().optional(),
  sortBy: z.enum(['creado_en', 'numero_recibo_bodega', 'peso_kg', 'nombre_consignatario']).default('creado_en'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePaqueteInput = z.infer<typeof CreatePaqueteSchema>;
export type UpdatePaqueteInput = z.infer<typeof UpdatePaqueteSchema>;
export type QueryPaquetesInput = z.infer<typeof QueryPaquetesSchema>;
