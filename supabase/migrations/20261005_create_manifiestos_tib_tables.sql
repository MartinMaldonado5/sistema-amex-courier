-- Migración: Tablas para digitalización y auditoría de manifiestos TIB
-- Fecha: 2026-10-05

CREATE TABLE IF NOT EXISTS public.manifiestos_tib (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_vuelo text NOT NULL,
  cliente text DEFAULT 'AMEX',
  modalidad text DEFAULT 'OFICINA',
  guias_declaradas integer DEFAULT 0,
  paquetes_declarados integer DEFAULT 0,
  guias_extraidas integer DEFAULT 0,
  paquetes_extraidos integer DEFAULT 0,
  es_cuadre_perfecto boolean DEFAULT false,
  archivo_nombre text,
  creado_por text,
  creado_en timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.manifiestos_tib_detalles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifiesto_id uuid REFERENCES public.manifiestos_tib(id) ON DELETE CASCADE,
  numero_guia_amx text NOT NULL,
  numero_wr text NOT NULL,
  observacion text,
  fila_index integer DEFAULT 0,
  creado_en timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manifiestos_tib_fecha ON public.manifiestos_tib (fecha_vuelo);
CREATE INDEX IF NOT EXISTS idx_manifiestos_detalles_wr ON public.manifiestos_tib_detalles (numero_wr);
CREATE INDEX IF NOT EXISTS idx_manifiestos_detalles_guia ON public.manifiestos_tib_detalles (numero_guia_amx);
