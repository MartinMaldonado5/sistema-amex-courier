-- Seguridad de perfiles y roles: acceso directo mínimo.
ALTER TABLE public.perfiles_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_sistema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfiles_usuarios_select_self_or_admin ON public.perfiles_usuarios;
CREATE POLICY perfiles_usuarios_select_self_or_admin
  ON public.perfiles_usuarios
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR lower(COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'rol'), ''))
      IN ('admin', 'administrador')
  );

DROP POLICY IF EXISTS roles_sistema_select_admin ON public.roles_sistema;
CREATE POLICY roles_sistema_select_admin
  ON public.roles_sistema
  FOR SELECT
  TO authenticated
  USING (
    lower(COALESCE((SELECT auth.jwt() -> 'app_metadata' ->> 'rol'), ''))
      IN ('admin', 'administrador')
  );
