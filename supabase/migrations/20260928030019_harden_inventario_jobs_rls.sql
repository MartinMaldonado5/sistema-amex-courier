-- Propietario real del job. La API usa service_role para escribir, pero conserva
-- el usuario autenticado para que Realtime y RLS puedan filtrar por propietario.
ALTER TABLE public.inventario_jobs
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inventario_jobs_usuario_id_idx
  ON public.inventario_jobs (usuario_id, creado_en DESC);

DROP POLICY IF EXISTS "inventario_jobs_select" ON public.inventario_jobs;
DROP POLICY IF EXISTS "inventario_jobs_insert" ON public.inventario_jobs;
DROP POLICY IF EXISTS "inventario_jobs_select_authenticated" ON public.inventario_jobs;
DROP POLICY IF EXISTS "inventario_jobs_insert_authenticated" ON public.inventario_jobs;

CREATE POLICY "inventario_jobs_select_authenticated" ON public.inventario_jobs
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = usuario_id);

CREATE POLICY "inventario_jobs_insert_authenticated" ON public.inventario_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = usuario_id);
