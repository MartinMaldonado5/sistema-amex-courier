-- ============================================================================
-- MIGRACIÓN: Tabla de Auditoría de Movimientos de Ubicación y RPC Atómica
-- AMEX Courier ERP - Trazabilidad y Seguridad WMS
-- ============================================================================

-- 1. Crear tabla movimientos_ubicacion si no existe
CREATE TABLE IF NOT EXISTS public.movimientos_ubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paquete_id UUID REFERENCES public.paquetes(id) ON DELETE SET NULL,
  numero_recibo_bodega VARCHAR(60) NOT NULL,
  tracking VARCHAR(100),
  ubicacion_anterior VARCHAR(40),
  nueva_ubicacion VARCHAR(40) NOT NULL,
  anaquel VARCHAR(20),
  piso VARCHAR(20),
  usuario_id UUID,
  usuario_nombre VARCHAR(120),
  usuario_email VARCHAR(150),
  tipo_movimiento VARCHAR(40) NOT NULL DEFAULT 'REASIGNACION_WMS',
  motivo TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_mov_ubicacion_paquete_id ON public.movimientos_ubicacion(paquete_id);
CREATE INDEX IF NOT EXISTS idx_mov_ubicacion_wr ON public.movimientos_ubicacion(numero_recibo_bodega);
CREATE INDEX IF NOT EXISTS idx_mov_ubicacion_creado_en ON public.movimientos_ubicacion(creado_en DESC);

-- Habilitar RLS
ALTER TABLE public.movimientos_ubicacion ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para movimientos_ubicacion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movimientos_ubicacion' AND policyname = 'Permitir lectura de movimientos a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir lectura de movimientos a usuarios autenticados"
      ON public.movimientos_ubicacion
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'movimientos_ubicacion' AND policyname = 'Permitir inserción de movimientos a usuarios autenticados'
  ) THEN
    CREATE POLICY "Permitir inserción de movimientos a usuarios autenticados"
      ON public.movimientos_ubicacion
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 2. Función RPC para Asignación/Reubicación Atómica Individual
CREATE OR REPLACE FUNCTION public.asignar_ubicacion_paquete(
  p_codigo TEXT,
  p_nueva_ubicacion TEXT,
  p_anaquel TEXT DEFAULT NULL,
  p_piso TEXT DEFAULT NULL,
  p_operador_nombre TEXT DEFAULT 'Operador Logístico AMEX',
  p_operador_email TEXT DEFAULT NULL,
  p_operador_id UUID DEFAULT NULL,
  p_tipo_movimiento TEXT DEFAULT 'REASIGNACION_WMS'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_location TEXT;
  v_anaquel TEXT;
  v_piso TEXT;
  v_dash_pos INT;
  v_pkg_id UUID;
  v_wr TEXT;
  v_tracking TEXT;
  v_consignatario TEXT;
  v_old_loc TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_code := UPPER(TRIM(COALESCE(p_codigo, '')));
  v_location := TRIM(COALESCE(p_nueva_ubicacion, 'REC'));

  IF v_code = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código de paquete no puede estar vacío');
  END IF;

  -- Resolver anaquel y piso si no se pasaron explícitamente
  v_anaquel := p_anaquel;
  v_piso := p_piso;
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

  -- Buscar paquete existente (activo o histórico más reciente)
  SELECT id, numero_recibo_bodega, tracking, nombre_consignatario, posicion_estante
  INTO v_pkg_id, v_wr, v_tracking, v_consignatario, v_old_loc
  FROM public.paquetes
  WHERE numero_recibo_bodega = v_code OR tracking = v_code
  ORDER BY creado_en DESC
  LIMIT 1;

  IF v_pkg_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Paquete no encontrado en el sistema con el código ' || v_code
    );
  END IF;

  -- 1. Actualizar paquete
  UPDATE public.paquetes
  SET
    anaquel = v_anaquel,
    piso = v_piso,
    posicion_estante = v_location,
    ubicacion_actual = 'AmexLince',
    actualizado_en = v_now,
    eliminado_en = NULL
  WHERE id = v_pkg_id;

  -- 2. Registrar en movimientos_ubicacion
  INSERT INTO public.movimientos_ubicacion (
    paquete_id,
    numero_recibo_bodega,
    tracking,
    ubicacion_anterior,
    nueva_ubicacion,
    anaquel,
    piso,
    usuario_id,
    usuario_nombre,
    usuario_email,
    tipo_movimiento,
    creado_en
  ) VALUES (
    v_pkg_id,
    v_wr,
    v_tracking,
    COALESCE(v_old_loc, 'Sin Ubicación'),
    v_location,
    v_anaquel,
    v_piso,
    p_operador_id,
    p_operador_nombre,
    p_operador_email,
    p_tipo_movimiento,
    v_now
  );

  -- 3. Registrar en historial_trazabilidad
  INSERT INTO public.historial_trazabilidad (
    paquete_id,
    ubicacion,
    descripcion_evento,
    usuario_operador,
    fecha_hora
  ) VALUES (
    v_pkg_id,
    v_location,
    'Ubicación reasignada de ' || COALESCE(v_old_loc, 'Sin Asignar') || ' a ' || v_location || ' (' || p_tipo_movimiento || ')',
    p_operador_nombre,
    v_now
  );

  RETURN jsonb_build_object(
    'success', true,
    'paquete_id', v_pkg_id,
    'numero_recibo_bodega', v_wr,
    'ubicacion_anterior', COALESCE(v_old_loc, 'Sin Ubicación'),
    'nueva_ubicacion', v_location,
    'mensaje', 'Ubicación actualizada correctamente'
  );
END;
$$;
