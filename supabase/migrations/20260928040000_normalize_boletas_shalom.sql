-- Migración: 20260928040000_normalize_boletas_shalom.sql
-- Propósito: Normalizar la tabla public.boletas_shalom eliminando columnas redundantes
-- e indexando los campos críticos para búsqueda instantánea.

-- 1. Eliminar columnas redundantes, texto legal y datos corporativos fijos
ALTER TABLE public.boletas_shalom
  DROP COLUMN IF EXISTS remitente_nombre,
  DROP COLUMN IF EXISTS remitente_dni,
  DROP COLUMN IF EXISTS remitente_telefono,
  DROP COLUMN IF EXISTS origen,
  DROP COLUMN IF EXISTS hora_emision,
  DROP COLUMN IF EXISTS fecha_traslado,
  DROP COLUMN IF EXISTS moneda,
  DROP COLUMN IF EXISTS unidad_medida,
  DROP COLUMN IF EXISTS observaciones,
  DROP COLUMN IF EXISTS archivo_nombre_original,
  DROP COLUMN IF EXISTS metadatos_ocr;

-- 2. Asegurar valores por defecto y consistencia
ALTER TABLE public.boletas_shalom
  ALTER COLUMN cantidad SET DEFAULT 1,
  ALTER COLUMN peso SET DEFAULT 0.000,
  ALTER COLUMN monto_total SET DEFAULT 0.00,
  ALTER COLUMN forma_pago SET DEFAULT 'PAGO_DESTINO',
  ALTER COLUMN tipo_entrega SET DEFAULT 'AGENCIA';

-- 3. Crear índices estratégicos de búsqueda de alta velocidad
CREATE INDEX IF NOT EXISTS idx_shalom_nro_orden_codigo
  ON public.boletas_shalom (nro_orden, codigo);

CREATE INDEX IF NOT EXISTS idx_shalom_destinatario_dni
  ON public.boletas_shalom (destinatario_nombre, destinatario_dni);

CREATE INDEX IF NOT EXISTS idx_shalom_fecha_emision
  ON public.boletas_shalom (fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_shalom_destino
  ON public.boletas_shalom (destino);
