-- Migración: Añadir columnas para almacenar imagen y ticket PDF de TIBCARGO
-- Fecha: 2026-10-05

ALTER TABLE public.paquetes
  ADD COLUMN IF NOT EXISTS tib_imagen_url text,
  ADD COLUMN IF NOT EXISTS tib_ticket_pdf_url text;

CREATE INDEX IF NOT EXISTS idx_paquetes_tib_imagen 
  ON public.paquetes (numero_recibo_bodega) 
  WHERE tib_imagen_url IS NOT NULL;

COMMENT ON COLUMN public.paquetes.tib_imagen_url IS 'URL absoluta de la foto del paquete tomada en bodega TIB';
COMMENT ON COLUMN public.paquetes.tib_ticket_pdf_url IS 'URL absoluta del ticket PDF de recepción en bodega TIB';
