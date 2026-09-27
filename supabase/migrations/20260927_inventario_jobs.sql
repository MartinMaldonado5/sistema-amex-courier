-- Módulo "Completar Inventario" (worker Render): cola de trabajos.
-- El worker toma filas en 'queued', las procesa y las marca 'done'/'error'.
-- Aplicar en Supabase Dashboard → SQL Editor si la vía automática falla.

CREATE TABLE IF NOT EXISTS public.inventario_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_nombre TEXT,
  estado TEXT NOT NULL DEFAULT 'queued'
    CHECK (estado IN ('queued', 'processing', 'done', 'error')),
  etapa TEXT NOT NULL DEFAULT 'queued',
  mensaje TEXT NOT NULL DEFAULT 'En cola.',
  progreso INTEGER NOT NULL DEFAULT 0
    CHECK (progreso >= 0 AND progreso <= 100),
  inventario_key TEXT,
  entregado_key TEXT,
  enviado_key TEXT,
  recibido_key TEXT,
  fuentes TEXT[] NOT NULL DEFAULT ARRAY['delivered', 'sent', 'received'],
  resultado_key TEXT,
  csv_key TEXT,
  total_guias INTEGER,
  coincidencias INTEGER,
  sin_coincidencia INTEGER,
  duplicados INTEGER,
  filas_tib BIGINT,
  segundos NUMERIC,
  error TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  iniciado_en TIMESTAMPTZ,
  terminado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS inventario_jobs_estado_idx
  ON public.inventario_jobs (estado, creado_en DESC);

ALTER TABLE public.inventario_jobs ENABLE ROW LEVEL SECURITY;

-- Lectura para el frontend (anon) — necesaria para Realtime y el historial.
DROP POLICY IF EXISTS "inventario_jobs_select" ON public.inventario_jobs;
CREATE POLICY "inventario_jobs_select" ON public.inventario_jobs
  FOR SELECT USING (true);

-- Creación vía API Route con service_role (bypass RLS); se deja INSERT
-- abierto a anon solo como respaldo del mismo modelo del resto del ERP.
DROP POLICY IF EXISTS "inventario_jobs_insert" ON public.inventario_jobs;
CREATE POLICY "inventario_jobs_insert" ON public.inventario_jobs
  FOR INSERT WITH CHECK (true);

-- Sin política UPDATE para anon: solo service_role (API + worker) actualiza.
-- Habilitar Realtime para la barra de progreso en vivo.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inventario_jobs;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END
$$;
