-- Permite que los usuarios autenticados consulten las definiciones de roles y permisos
-- para saber qué módulos tienen autorizados en la interfaz.

DROP POLICY IF EXISTS roles_sistema_select_admin ON public.roles_sistema;
DROP POLICY IF EXISTS roles_sistema_select_authenticated ON public.roles_sistema;

CREATE POLICY roles_sistema_select_authenticated
  ON public.roles_sistema
  FOR SELECT
  TO authenticated
  USING (true);
