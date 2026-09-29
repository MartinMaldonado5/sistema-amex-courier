-- Permitir subida y almacenamiento de paquetes con WR repetidos / bultos múltiples
-- y asegurar índices para consultas de alto rendimiento.

ALTER TABLE public.paquetes DROP CONSTRAINT IF EXISTS paquetes_numero_recibo_bodega_key;

CREATE INDEX IF NOT EXISTS paquetes_numero_recibo_bodega_idx
  ON public.paquetes (numero_recibo_bodega);

-- Reactivar paquetes que hayan sido eliminados lógicamente
UPDATE public.paquetes 
SET eliminado_en = NULL, motivo_eliminacion = NULL, eliminado_por = NULL 
WHERE eliminado_en IS NOT NULL;
