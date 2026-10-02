-- Migration: 20261005_drop_dead_columns_paquetes.sql
-- Eliminación de columnas 100% nulas, obsoletas y sin uso en producción

ALTER TABLE public.paquetes 
  DROP COLUMN IF EXISTS codigo_casillero,
  DROP COLUMN IF EXISTS factura_pdf_url,
  DROP COLUMN IF EXISTS numero_factura;
