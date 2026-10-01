-- ============================================================================
-- MIGRACIÓN: Índices de Alto Rendimiento para Consultas y Paginación en Servidor
-- AMEX Courier ERP
-- ============================================================================

-- 1. Índice compuesto para paginación rápida excluyendo eliminados lógicos
CREATE INDEX IF NOT EXISTS idx_paquetes_paginacion
ON public.paquetes (eliminado_en, creado_en DESC);

-- 2. Índices B-Tree para búsquedas puntuales instantáneas (Filtros en servidor)
CREATE INDEX IF NOT EXISTS idx_paquetes_busqueda_recibo
ON public.paquetes (numero_recibo_bodega)
WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_paquetes_busqueda_dni
ON public.paquetes (dni_consignatario)
WHERE eliminado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_paquetes_busqueda_tracking
ON public.paquetes (tracking_usa)
WHERE eliminado_en IS NULL;

-- 3. Índice para filtrado combinado de estados operativos de entrega
CREATE INDEX IF NOT EXISTS idx_paquetes_estado_ubicacion
ON public.paquetes (estado_entrega, ubicacion_actual)
WHERE eliminado_en IS NULL;

-- 4. Índice para cobros y vouchers
CREATE INDEX IF NOT EXISTS idx_cobros_paginacion
ON public.cobros_vouchers (eliminado_en, creado_en DESC);

COMMENT ON INDEX idx_paquetes_paginacion IS 'Acelera la paginación del inventario en servidor sin escaneo secuencial de tabla';
