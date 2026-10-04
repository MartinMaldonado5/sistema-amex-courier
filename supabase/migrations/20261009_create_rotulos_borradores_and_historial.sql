-- Migración: Crear tablas para sincronización en la nube de borradores y auditoría histórica de rótulos impresos
CREATE TABLE IF NOT EXISTS public.rotulos_borradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_email TEXT NOT NULL UNIQUE,
    slots_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_hojas INT NOT NULL DEFAULT 1,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rotulos_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_impresion_id TEXT NOT NULL,
    tipo_accion TEXT NOT NULL DEFAULT 'IMPRESION_DIRECTA',
    operador_nombre TEXT,
    operador_email TEXT,
    operador_id UUID,
    agencia TEXT NOT NULL DEFAULT 'OTRA',
    agencia_otra TEXT,
    destinatario_nombre TEXT NOT NULL,
    destinatario_dni TEXT,
    destinatario_telefono TEXT,
    destino TEXT,
    remitente TEXT DEFAULT 'AMEX COURIER PERÚ',
    cantidad_rotulos INT DEFAULT 1,
    total_cajas TEXT DEFAULT '1',
    numero_rotulo INT DEFAULT 1,
    siglas TEXT,
    observacion TEXT,
    hoja_numero INT DEFAULT 1,
    slot_posicion INT DEFAULT 1,
    slot_snapshot JSONB,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rotulos_historial_creado_en ON public.rotulos_historial (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_rotulos_historial_dest_nombre ON public.rotulos_historial (destinatario_nombre);
CREATE INDEX IF NOT EXISTS idx_rotulos_historial_dest_dni ON public.rotulos_historial (destinatario_dni);
CREATE INDEX IF NOT EXISTS idx_rotulos_historial_agencia ON public.rotulos_historial (agencia);
CREATE INDEX IF NOT EXISTS idx_rotulos_historial_operador ON public.rotulos_historial (operador_email);
CREATE INDEX IF NOT EXISTS idx_rotulos_historial_lote ON public.rotulos_historial (lote_impresion_id);

ALTER TABLE public.rotulos_borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotulos_historial ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rotulos_borradores' AND policyname = 'Permitir todo a usuarios autenticados y anon para borradores'
    ) THEN
        CREATE POLICY "Permitir todo a usuarios autenticados y anon para borradores"
        ON public.rotulos_borradores FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rotulos_historial' AND policyname = 'Permitir todo a usuarios autenticados y anon para historial'
    ) THEN
        CREATE POLICY "Permitir todo a usuarios autenticados y anon para historial"
        ON public.rotulos_historial FOR ALL
        TO anon, authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;
