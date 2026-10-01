-- Migración: Tabla para almacenar archivos TIB activos del día
CREATE TABLE IF NOT EXISTS public.inventario_tib_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('delivered', 'sent', 'received')),
  r2_key TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  peso_bytes BIGINT NOT NULL DEFAULT 0,
  subido_por_nombre TEXT,
  subido_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  es_activo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(fecha, tipo)
);

CREATE INDEX IF NOT EXISTS idx_inventario_tib_diario_fecha_activo 
  ON public.inventario_tib_diario (fecha DESC, es_activo);

ALTER TABLE public.inventario_tib_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventario_tib_diario_select" ON public.inventario_tib_diario;
CREATE POLICY "inventario_tib_diario_select" ON public.inventario_tib_diario
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inventario_tib_diario_insert_update" ON public.inventario_tib_diario;
CREATE POLICY "inventario_tib_diario_insert_update" ON public.inventario_tib_diario
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
