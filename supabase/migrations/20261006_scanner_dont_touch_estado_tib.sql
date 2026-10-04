-- Migración: Asegurar que el escáner AMEX no modifique ni sobreescriba estado_tib
-- 1. Eliminar default de estado_tib para que paquetes nuevos por escáner queden NULL hasta cruce TIB
ALTER TABLE public.paquetes ALTER COLUMN estado_tib DROP DEFAULT;

-- 2. Actualizar función RPC sync_scanner_batch_v2
CREATE OR REPLACE FUNCTION public.sync_scanner_batch_v2(
  p_items JSONB,
  p_operador_nombre TEXT DEFAULT 'Operador Logístico AMEX',
  p_operador_email TEXT DEFAULT NULL,
  p_operador_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_code TEXT;
  v_format TEXT;
  v_location TEXT;
  v_anaquel TEXT;
  v_piso TEXT;
  v_workflow TEXT;
  v_consignatario TEXT;
  v_estado_amex TEXT;
  v_log_id TEXT;
  v_pkg_id UUID;
  v_pkg_wr TEXT;
  v_now TIMESTAMPTZ := now();
  v_synced_ids TEXT[] := ARRAY[]::TEXT[];
  v_updated_count INT := 0;
  v_inserted_count INT := 0;
  v_dash_pos INT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'El lote de escaneo está vacío',
      'synced_ids', ARRAY[]::TEXT[],
      'updated_count', 0,
      'inserted_count', 0
    );
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_log_id := v_item->>'id';
    v_code := UPPER(TRIM(COALESCE(v_item->>'code', '')));
    v_format := COALESCE(v_item->>'format', 'CODE_128');
    v_workflow := COALESCE(v_item->>'workflow', 'slotting');
    v_location := COALESCE(v_item->>'location', 'REC');
    v_consignatario := COALESCE(v_item->>'nombreConsignatario', '');
    v_estado_amex := COALESCE(v_item->>'estadoAmex', 'recibido');

    IF v_code = '' THEN
      CONTINUE;
    END IF;

    -- Extraer anaquel y piso si están presentes o parsear de location
    v_anaquel := v_item->>'anaquel';
    v_piso := v_item->>'piso';
    IF v_anaquel IS NULL OR v_piso IS NULL THEN
      v_dash_pos := POSITION('-' IN v_location);
      IF v_dash_pos > 0 THEN
        v_anaquel := SUBSTRING(v_location FROM 1 FOR v_dash_pos - 1);
        v_piso := SUBSTRING(v_location FROM v_dash_pos + 1);
      ELSE
        v_anaquel := v_location;
        v_piso := 'P1';
      END IF;
    END IF;

    -- 1. Buscar si el paquete ya existe (por WR o tracking)
    SELECT id, numero_recibo_bodega, nombre_consignatario
    INTO v_pkg_id, v_pkg_wr, v_consignatario
    FROM public.paquetes
    WHERE numero_recibo_bodega = v_code OR tracking_usa = v_code
    ORDER BY creado_en DESC
    LIMIT 1;

    IF v_pkg_id IS NOT NULL THEN
      -- Actualizar paquete existente: NO TOCAR estado_tib (le pertenece exclusivamente a TIB)
      UPDATE public.paquetes
      SET
        anaquel = v_anaquel,
        piso = v_piso,
        posicion_estante = v_location,
        ubicacion_actual = 'AmexLince',
        estado_amex = COALESCE(v_estado_amex, estado_amex, 'recibido'),
        usuario_email = COALESCE(p_operador_email, usuario_email),
        eliminado_en = NULL,
        motivo_eliminacion = NULL,
        eliminado_por = NULL,
        actualizado_en = v_now
      WHERE id = v_pkg_id;

      v_updated_count := v_updated_count + 1;
    ELSE
      -- Insertar nuevo paquete: estado_tib queda NULL hasta que se cruce con la planilla TIB
      v_pkg_wr := CASE WHEN v_code LIKE 'WR%' THEN v_code ELSE 'WR' || RIGHT(v_code, 6) END;
      
      INSERT INTO public.paquetes (
        numero_recibo_bodega,
        tracking_usa,
        tipo_empaque,
        dni_consignatario,
        nombre_consignatario,
        descripcion,
        peso_kg,
        valor_declarado_usd,
        ubicacion_actual,
        anaquel,
        piso,
        posicion_estante,
        estado_amex,
        usuario_email,
        creado_por,
        eliminado_en,
        creado_en
      ) VALUES (
        v_pkg_wr,
        CASE WHEN v_code LIKE 'WR%' THEN '' ELSE v_code END,
        'Paquete',
        '',
        COALESCE(v_consignatario, ''),
        'Mercadería ingresada por Escáner',
        NULL,
        50.0,
        'AmexLince',
        v_anaquel,
        v_piso,
        v_location,
        COALESCE(v_estado_amex, 'recibido'),
        p_operador_email,
        p_operador_id,
        NULL,
        v_now
      )
      RETURNING id INTO v_pkg_id;

      v_inserted_count := v_inserted_count + 1;
    END IF;

    -- 2. Historial de trazabilidad
    INSERT INTO public.historial_trazabilidad (
      paquete_id,
      ubicacion,
      descripcion_evento,
      usuario_operador,
      fecha_hora
    ) VALUES (
      v_pkg_id,
      v_location,
      'Escaneado confirmado (Estado AMEX: ' || COALESCE(v_estado_amex, 'recibido') || ') clasificado a: ' || v_location,
      p_operador_nombre,
      v_now
    );

    -- 3. Movimientos Kardex
    INSERT INTO public.movimientos_kardex (
      paquete_id,
      codigo_paquete,
      consignatario,
      origen_descripcion,
      destino_descripcion,
      tipo_movimiento,
      motivo,
      usuario_operador,
      usuario_email,
      usuario_id,
      creado_en
    ) VALUES (
      v_pkg_id,
      v_pkg_wr,
      COALESCE(v_consignatario, 'Cliente AMEX'),
      'INGRESO_ESCÁNER',
      'AmexLince (' || v_location || ')',
      'ESCANEO_SLOTTING',
      'Ingreso operativo de bulto mediante Escáner Móvil (Estado AMEX: ' || COALESCE(v_estado_amex, 'recibido') || ')',
      p_operador_nombre,
      p_operador_email,
      p_operador_id,
      v_now
    );

    -- 4. Log de auditoría de escaneo
    INSERT INTO public.escaneos_log (
      paquete_id,
      codigo_leido,
      formato,
      ubicacion_asignada,
      operador_nombre,
      operador_email,
      operador_id,
      workflow,
      sincronizado,
      creado_en
    ) VALUES (
      v_pkg_id,
      v_code,
      v_format,
      v_location,
      p_operador_nombre,
      p_operador_email,
      p_operador_id,
      v_workflow,
      true,
      v_now
    );

    IF v_log_id IS NOT NULL THEN
      v_synced_ids := array_append(v_synced_ids, v_log_id);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'synced_ids', v_synced_ids,
    'updated_count', v_updated_count,
    'inserted_count', v_inserted_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_scanner_batch_v2(JSONB, TEXT, TEXT, UUID) TO authenticated, service_role, anon;
