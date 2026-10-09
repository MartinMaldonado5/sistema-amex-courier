-- Migración: Estandarización y Validación Estricta de Códigos WR (11 caracteres)
-- Sistema AMEX Courier
-- Regla de Negocio:
-- 1. Todo WR debe comenzar por 'WR'
-- 2. Debe tener exactamente 11 caracteres (WR + 9 alfanuméricos)
-- 3. Se normaliza automáticamente a mayúsculas y sin espacios antes de insertar/actualizar

-- 1. Estandarizar registros existentes que pudieran tener espacios o diferencias de mayúsculas
UPDATE public.paquetes
SET numero_recibo_bodega = UPPER(TRIM(numero_recibo_bodega))
WHERE numero_recibo_bodega != UPPER(TRIM(numero_recibo_bodega));

-- 2. Corregir registros específicos detectados que no cumplían los 11 caracteres
-- Caso 1: WR00473918 (10 caracteres, le faltaba un cero inicial)
UPDATE public.paquetes
SET numero_recibo_bodega = 'WR000473918'
WHERE numero_recibo_bodega = 'WR00473918';

-- Caso 2: WR672D1V (8 caracteres, generado por prueba previa de escáner)
UPDATE public.paquetes
SET numero_recibo_bodega = 'WR000672D1V'
WHERE numero_recibo_bodega = 'WR672D1V';

-- 3. Función y Trigger de Normalización Automática (UPPER y TRIM)
CREATE OR REPLACE FUNCTION public.normalize_wr_paquetes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_recibo_bodega IS NOT NULL THEN
    NEW.numero_recibo_bodega := UPPER(TRIM(NEW.numero_recibo_bodega));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_wr_paquetes ON public.paquetes;

CREATE TRIGGER trg_normalize_wr_paquetes
  BEFORE INSERT OR UPDATE OF numero_recibo_bodega
  ON public.paquetes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_wr_paquetes();

-- 4. Constraint CHECK estricto: Longitud 11 caracteres y prefijo WR
ALTER TABLE public.paquetes
  DROP CONSTRAINT IF EXISTS chk_paquetes_numero_recibo_bodega_format;

ALTER TABLE public.paquetes
  ADD CONSTRAINT chk_paquetes_numero_recibo_bodega_format
  CHECK (
    length(numero_recibo_bodega) = 11
    AND numero_recibo_bodega ~ '^WR[A-Za-z0-9]{9}$'
  );
