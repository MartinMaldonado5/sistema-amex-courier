-- Ajustes de rendimiento para RLS, claves foráneas e índices duplicados.

DROP POLICY IF EXISTS perfiles_usuarios_select_self_or_admin ON public.perfiles_usuarios;
CREATE POLICY perfiles_usuarios_select_self_or_admin
  ON public.perfiles_usuarios
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR lower(COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol'), ''))
      IN ('admin', 'administrador')
  );

DROP POLICY IF EXISTS roles_sistema_select_admin ON public.roles_sistema;
CREATE POLICY roles_sistema_select_admin
  ON public.roles_sistema
  FOR SELECT
  TO authenticated
  USING (
    lower(COALESCE(((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol'), ''))
      IN ('admin', 'administrador')
  );

CREATE INDEX IF NOT EXISTS auditoria_sistema_usuario_id_idx
  ON public.auditoria_sistema (usuario_id);

CREATE INDEX IF NOT EXISTS boletas_shalom_eliminado_por_idx
  ON public.boletas_shalom (eliminado_por);

CREATE INDEX IF NOT EXISTS cobros_vouchers_cliente_id_idx
  ON public.cobros_vouchers (cliente_id);

CREATE INDEX IF NOT EXISTS cobros_vouchers_eliminado_por_idx
  ON public.cobros_vouchers (eliminado_por);

CREATE INDEX IF NOT EXISTS entregas_ordenes_cliente_id_idx
  ON public.entregas_ordenes (cliente_id);

CREATE INDEX IF NOT EXISTS escaneos_log_paquete_id_idx
  ON public.escaneos_log (paquete_id);

CREATE INDEX IF NOT EXISTS historial_trazabilidad_paquete_id_idx
  ON public.historial_trazabilidad (paquete_id);

CREATE INDEX IF NOT EXISTS paquetes_cliente_id_idx
  ON public.paquetes (cliente_id);

CREATE INDEX IF NOT EXISTS paquetes_eliminado_por_idx
  ON public.paquetes (eliminado_por);

CREATE INDEX IF NOT EXISTS perfiles_usuarios_rol_id_idx
  ON public.perfiles_usuarios (rol_id);

DROP INDEX IF EXISTS public.idx_auditoria_fecha;
DROP INDEX IF EXISTS public.idx_auditoria_modulo;
DROP INDEX IF EXISTS public.idx_paquetes_posicion;
