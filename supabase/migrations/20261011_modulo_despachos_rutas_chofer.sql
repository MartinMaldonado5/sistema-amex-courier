-- Migración: Módulo de Rutas y Despacho Móvil para Choferes (TMS Última Milla)
-- Fecha: 2026-10-04

-- 1. Tabla de Rutas de Despacho
CREATE TABLE IF NOT EXISTS public.despachos_rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ruta TEXT NOT NULL UNIQUE,
    nombre_ruta TEXT NOT NULL,
    fecha_despacho DATE NOT NULL DEFAULT CURRENT_DATE,
    chofer_nombre TEXT NOT NULL,
    chofer_telefono TEXT,
    vehiculo_placa TEXT,
    estado TEXT NOT NULL DEFAULT 'EN_RUTA' CHECK (estado IN ('BORRADOR', 'EN_RUTA', 'COMPLETADO', 'CANCELADO')),
    total_paradas INTEGER NOT NULL DEFAULT 0,
    paradas_entregadas INTEGER NOT NULL DEFAULT 0,
    notas TEXT,
    creado_por TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Paradas de la Ruta
CREATE TABLE IF NOT EXISTS public.despacho_paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES public.despachos_rutas(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL DEFAULT 1,
    destinatario TEXT NOT NULL,
    wr_bultos TEXT NOT NULL,
    direccion TEXT NOT NULL,
    distrito TEXT NOT NULL,
    telefono_raw TEXT NOT NULL,
    telefono_normalizado TEXT NOT NULL,
    monto_cobro NUMERIC(10,2) NOT NULL DEFAULT 0,
    moneda_cobro TEXT NOT NULL DEFAULT 'USD' CHECK (moneda_cobro IN ('USD', 'PEN')),
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_CAMINO', 'ENTREGADO', 'NO_ENTREGADO', 'REPROGRAMADO')),
    motivo_no_entrega TEXT,
    entregado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_despachos_rutas_fecha ON public.despachos_rutas(fecha_despacho DESC);
CREATE INDEX IF NOT EXISTS idx_despachos_rutas_estado ON public.despachos_rutas(estado);
CREATE INDEX IF NOT EXISTS idx_despacho_paradas_ruta ON public.despacho_paradas(ruta_id, orden ASC);
CREATE INDEX IF NOT EXISTS idx_despacho_paradas_estado ON public.despacho_paradas(estado);

-- 4. Función y Trigger para mantener sincronizados los conteos de la ruta
CREATE OR REPLACE FUNCTION public.actualizar_contadores_ruta()
RETURNS TRIGGER AS $$
DECLARE
    v_ruta_id UUID;
    v_total INTEGER;
    v_entregadas INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_ruta_id := OLD.ruta_id;
    ELSE
        v_ruta_id := NEW.ruta_id;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE estado = 'ENTREGADO')
    INTO v_total, v_entregadas
    FROM public.despacho_paradas
    WHERE ruta_id = v_ruta_id;

    UPDATE public.despachos_rutas
    SET total_paradas = v_total,
        paradas_entregadas = v_entregadas,
        actualizado_en = now(),
        estado = CASE
            WHEN v_total > 0 AND v_total = v_entregadas THEN 'COMPLETADO'
            ELSE estado
        END
    WHERE id = v_ruta_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_contadores_ruta ON public.despacho_paradas;
CREATE TRIGGER trg_actualizar_contadores_ruta
AFTER INSERT OR UPDATE OR DELETE ON public.despacho_paradas
FOR EACH ROW EXECUTE FUNCTION public.actualizar_contadores_ruta();

-- 5. Seguridad RLS
ALTER TABLE public.despachos_rutas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despacho_paradas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados (Operadores, Administradores)
DROP POLICY IF EXISTS "despachos_rutas_auth_all" ON public.despachos_rutas;
CREATE POLICY "despachos_rutas_auth_all"
ON public.despachos_rutas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "despacho_paradas_auth_all" ON public.despacho_paradas;
CREATE POLICY "despacho_paradas_auth_all"
ON public.despacho_paradas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para acceso anónimo mediante enlace de chofer (lectura de ruta y paradas, y actualización de estado)
DROP POLICY IF EXISTS "despachos_rutas_anon_select" ON public.despachos_rutas;
CREATE POLICY "despachos_rutas_anon_select"
ON public.despachos_rutas FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "despacho_paradas_anon_select" ON public.despacho_paradas;
CREATE POLICY "despacho_paradas_anon_select"
ON public.despacho_paradas FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "despacho_paradas_anon_update" ON public.despacho_paradas;
CREATE POLICY "despacho_paradas_anon_update"
ON public.despacho_paradas FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
