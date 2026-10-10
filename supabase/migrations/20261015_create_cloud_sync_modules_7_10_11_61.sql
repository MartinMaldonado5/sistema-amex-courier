-- Migración: Tablas para sincronización en la nube multi-dispositivo (Módulos 7, 10, 11 y 6.1)

-- 1. MÓDULO 7: MATRIZ DNI (Borrador activo multi-dispositivo)
CREATE TABLE IF NOT EXISTS public.dni_matrix_borradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_email TEXT NOT NULL UNIQUE,
    slots_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_slots INT NOT NULL DEFAULT 100,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MÓDULO 10: FORMATO DE ENTREGA (Borrador en curso e Historial permanente)
CREATE TABLE IF NOT EXISTS public.actas_entrega_borradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_email TEXT NOT NULL UNIQUE,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.actas_entrega_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_acta TEXT NOT NULL,
    destinatario TEXT NOT NULL,
    destinatario_dni TEXT,
    destinatario_direccion TEXT,
    paquetes JSONB NOT NULL DEFAULT '[]'::jsonb,
    fecha TEXT NOT NULL,
    observaciones TEXT,
    operador_nombre TEXT,
    operador_email TEXT,
    operador_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_actas_entrega_historial_creado_en ON public.actas_entrega_historial (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_actas_entrega_historial_dest ON public.actas_entrega_historial (destinatario);

-- 3. MÓDULO 11: INVOICES USA (Borrador en curso e Historial permanente)
CREATE TABLE IF NOT EXISTS public.invoices_borradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_email TEXT NOT NULL UNIQUE,
    invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    consignee_name TEXT NOT NULL,
    consignee_dni TEXT,
    tracking TEXT,
    total_value_fob NUMERIC DEFAULT 0,
    items_count INT DEFAULT 0,
    invoice_data JSONB NOT NULL,
    operador_nombre TEXT,
    operador_email TEXT,
    operador_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_historial_creado_en ON public.invoices_historial (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_historial_num ON public.invoices_historial (invoice_number);

-- 4. MÓDULO 6.1: COLA STAGING DE ESCÁNER (Escaneos en preparación)
CREATE TABLE IF NOT EXISTS public.scanner_staging_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    usuario_email TEXT NOT NULL UNIQUE,
    queue_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_items INT NOT NULL DEFAULT 0,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.dni_matrix_borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actas_entrega_borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actas_entrega_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_borradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_staging_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dni_matrix_borradores' AND policyname = 'Permitir todo a usuarios para dni_matrix_borradores') THEN
        CREATE POLICY "Permitir todo a usuarios para dni_matrix_borradores" ON public.dni_matrix_borradores FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actas_entrega_borradores' AND policyname = 'Permitir todo a usuarios para actas_entrega_borradores') THEN
        CREATE POLICY "Permitir todo a usuarios para actas_entrega_borradores" ON public.actas_entrega_borradores FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'actas_entrega_historial' AND policyname = 'Permitir todo a usuarios para actas_entrega_historial') THEN
        CREATE POLICY "Permitir todo a usuarios para actas_entrega_historial" ON public.actas_entrega_historial FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices_borradores' AND policyname = 'Permitir todo a usuarios para invoices_borradores') THEN
        CREATE POLICY "Permitir todo a usuarios para invoices_borradores" ON public.invoices_borradores FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices_historial' AND policyname = 'Permitir todo a usuarios para invoices_historial') THEN
        CREATE POLICY "Permitir todo a usuarios para invoices_historial" ON public.invoices_historial FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scanner_staging_queue' AND policyname = 'Permitir todo a usuarios para scanner_staging_queue') THEN
        CREATE POLICY "Permitir todo a usuarios para scanner_staging_queue" ON public.scanner_staging_queue FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;
END $$;
