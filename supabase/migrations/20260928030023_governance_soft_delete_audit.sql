-- Gobernanza de datos: eliminación lógica y auditoría inmutable.

ALTER TABLE public.paquetes
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT;

ALTER TABLE public.cobros_vouchers
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT;

ALTER TABLE public.boletas_shalom
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT;

CREATE INDEX IF NOT EXISTS paquetes_eliminado_en_idx
  ON public.paquetes (eliminado_en);

CREATE INDEX IF NOT EXISTS cobros_vouchers_eliminado_en_idx
  ON public.cobros_vouchers (eliminado_en);

CREATE INDEX IF NOT EXISTS boletas_shalom_eliminado_en_idx
  ON public.boletas_shalom (eliminado_en);

CREATE TABLE IF NOT EXISTS public.auditoria_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT NOT NULL,
  usuario_email TEXT NOT NULL,
  modulo TEXT NOT NULL,
  accion TEXT NOT NULL,
  registro_id TEXT,
  detalles TEXT,
  valores_anteriores JSONB,
  valores_nuevos JSONB,
  ip_origen INET,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auditoria_sistema_fecha_idx
  ON public.auditoria_sistema (creado_en DESC);

CREATE INDEX IF NOT EXISTS auditoria_sistema_modulo_accion_idx
  ON public.auditoria_sistema (modulo, accion);

ALTER TABLE public.auditoria_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_sistema_select_admin" ON public.auditoria_sistema;
CREATE POLICY "auditoria_sistema_select_admin" ON public.auditoria_sistema
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles_usuarios perfil
      JOIN public.roles_sistema rol ON rol.id = perfil.rol_id
      WHERE perfil.id = (SELECT auth.uid())
        AND lower(rol.nombre) IN ('admin', 'administrador')
    )
  );

DROP POLICY IF EXISTS "auditoria_sistema_insert_authenticated" ON public.auditoria_sistema;
CREATE POLICY "auditoria_sistema_insert_authenticated" ON public.auditoria_sistema
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = usuario_id);
