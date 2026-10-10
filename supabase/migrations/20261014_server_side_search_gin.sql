-- Migración: Búsqueda Server-Side con pg_trgm e Índices GIN sobre 3 campos
-- Campos: numero_recibo_bodega, tracking, nombre_consignatario

-- 1. Habilitar extensión de trigramas si no existe
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índice GIN sobre los 3 campos exactos solicitados
CREATE INDEX IF NOT EXISTS idx_paquetes_server_search_trgm 
ON public.paquetes USING gin (
  (
    coalesce(numero_recibo_bodega, '') || ' ' ||
    coalesce(tracking, '') || ' ' ||
    coalesce(nombre_consignatario, '')
  ) gin_trgm_ops
);

-- 3. Índices de soporte para filtros de ubicación y estado
CREATE INDEX IF NOT EXISTS idx_paquetes_ubicacion_estado 
ON public.paquetes (ubicacion_actual, estado_amex) 
WHERE eliminado_en IS NULL;

-- 4. Función RPC de Búsqueda y Paginación Server-Side optimizada
CREATE OR REPLACE FUNCTION public.buscar_paquetes_servidor(
  p_search TEXT DEFAULT '',
  p_ubicacion TEXT DEFAULT 'ALL',
  p_estado_amex TEXT DEFAULT 'ALL',
  p_shelf_filter TEXT DEFAULT 'ALL',
  p_floor_filter TEXT DEFAULT 'ALL',
  p_package_type TEXT DEFAULT 'ALL',
  p_fecha_desde TIMESTAMPTZ DEFAULT NULL,
  p_fecha_hasta TIMESTAMPTZ DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT := GREATEST(0, (p_page - 1) * p_page_size);
  v_total BIGINT := 0;
  v_existencias_activas BIGINT := 0;
  v_peso_total NUMERIC := 0;
  v_data JSONB := '[]'::JSONB;
  v_search_clean TEXT := TRIM(p_search);
BEGIN
  -- 1. Métricas globales de existencias (bultos activos en almacén excluyendo entregados)
  SELECT 
    COUNT(*),
    COALESCE(SUM(COALESCE(peso_kg, 0)), 0)
  INTO 
    v_existencias_activas,
    v_peso_total
  FROM public.paquetes
  WHERE eliminado_en IS NULL
    AND estado_amex != 'entregado'
    AND ubicacion_actual != 'Entregado';

  -- 2. Conteo de registros que cumplen los filtros actuales de la búsqueda
  SELECT COUNT(*)
  INTO v_total
  FROM public.paquetes p
  WHERE p.eliminado_en IS NULL
    AND (p_ubicacion = 'ALL' OR p.ubicacion_actual = p_ubicacion)
    AND (
      p_estado_amex = 'ALL' 
      OR (p_estado_amex = 'en_almacen' AND (p.estado_amex = 'en_almacen' OR p.estado_amex = 'recibido'))
      OR p.estado_amex = p_estado_amex
    )
    AND (
      p_shelf_filter = 'ALL'
      OR (p_shelf_filter = 'OFI' AND (p.posicion_estante LIKE 'OFI%' OR p.anaquel = 'OFI'))
      OR (p_shelf_filter = 'REC' AND (p.posicion_estante LIKE 'REC%' OR (p.posicion_estante IS NULL AND p.anaquel IS NULL)))
      OR (p_shelf_filter = 'DSP' AND (p.posicion_estante LIKE 'DSP%' OR p.anaquel = 'DSP'))
      OR (p.posicion_estante LIKE p_shelf_filter || '%' OR p.anaquel = p_shelf_filter)
    )
    AND (
      p_floor_filter = 'ALL'
      OR p.posicion_estante LIKE '%' || p_floor_filter || '%'
      OR p.piso = p_floor_filter
    )
    AND (p_package_type = 'ALL' OR p.tipo_empaque = p_package_type)
    AND (p_fecha_desde IS NULL OR p.creado_en >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR p.creado_en <= p_fecha_hasta)
    AND (
      v_search_clean = ''
      OR (
        coalesce(p.numero_recibo_bodega, '') || ' ' ||
        coalesce(p.tracking, '') || ' ' ||
        coalesce(p.nombre_consignatario, '')
      ) ILIKE '%' || v_search_clean || '%'
    );

  -- 3. Obtener únicamente la página solicitada (ej: 50 filas)
  SELECT COALESCE(jsonb_agg(row_to_json(sub)), '[]'::JSONB)
  INTO v_data
  FROM (
    SELECT p.*
    FROM public.paquetes p
    WHERE p.eliminado_en IS NULL
      AND (p_ubicacion = 'ALL' OR p.ubicacion_actual = p_ubicacion)
      AND (
        p_estado_amex = 'ALL' 
        OR (p_estado_amex = 'en_almacen' AND (p.estado_amex = 'en_almacen' OR p.estado_amex = 'recibido'))
        OR p.estado_amex = p_estado_amex
      )
      AND (
        p_shelf_filter = 'ALL'
        OR (p_shelf_filter = 'OFI' AND (p.posicion_estante LIKE 'OFI%' OR p.anaquel = 'OFI'))
        OR (p_shelf_filter = 'REC' AND (p.posicion_estante LIKE 'REC%' OR (p.posicion_estante IS NULL AND p.anaquel IS NULL)))
        OR (p_shelf_filter = 'DSP' AND (p.posicion_estante LIKE 'DSP%' OR p.anaquel = 'DSP'))
        OR (p.posicion_estante LIKE p_shelf_filter || '%' OR p.anaquel = p_shelf_filter)
      )
      AND (
        p_floor_filter = 'ALL'
        OR p.posicion_estante LIKE '%' || p_floor_filter || '%'
        OR p.piso = p_floor_filter
      )
      AND (p_package_type = 'ALL' OR p.tipo_empaque = p_package_type)
      AND (p_fecha_desde IS NULL OR p.creado_en >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR p.creado_en <= p_fecha_hasta)
      AND (
        v_search_clean = ''
        OR (
          coalesce(p.numero_recibo_bodega, '') || ' ' ||
          coalesce(p.tracking, '') || ' ' ||
          coalesce(p.nombre_consignatario, '')
        ) ILIKE '%' || v_search_clean || '%'
      )
    ORDER BY p.creado_en DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'success', true,
    'total', v_total,
    'existencias_activas', v_existencias_activas,
    'peso_total_kg', v_peso_total,
    'page', p_page,
    'page_size', p_page_size,
    'data', v_data
  );
END;
$$;
