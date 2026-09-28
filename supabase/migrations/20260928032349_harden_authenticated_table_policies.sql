-- Bloquea acceso anon/public y conserva operaciones para usuarios autenticados.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'almacenes_sedes',
        'boletas_shalom',
        'clientes',
        'cobros_vouchers',
        'entregas_ordenes',
        'escaneos_log',
        'estanterias_posiciones',
        'historial_trazabilidad',
        'hojas_cotejo',
        'hojas_cotejo_items',
        'movimientos_kardex',
        'paquetes'
      )
      AND ('public' = ANY(roles) OR 'anon' = ANY(roles))
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  END LOOP;
END $$;

CREATE POLICY almacenes_sedes_authenticated_all
  ON public.almacenes_sedes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY boletas_shalom_authenticated_all
  ON public.boletas_shalom FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY clientes_authenticated_all
  ON public.clientes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY cobros_vouchers_authenticated_all
  ON public.cobros_vouchers FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY entregas_ordenes_authenticated_all
  ON public.entregas_ordenes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY escaneos_log_authenticated_all
  ON public.escaneos_log FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY estanterias_posiciones_authenticated_all
  ON public.estanterias_posiciones FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY historial_trazabilidad_authenticated_all
  ON public.historial_trazabilidad FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY hojas_cotejo_authenticated_all
  ON public.hojas_cotejo FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY hojas_cotejo_items_authenticated_all
  ON public.hojas_cotejo_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY movimientos_kardex_authenticated_all
  ON public.movimientos_kardex FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY paquetes_authenticated_all
  ON public.paquetes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
