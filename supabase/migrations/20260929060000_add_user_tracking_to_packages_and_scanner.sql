-- Trazabilidad de usuarios: registrar quién ingresa o escanea cada paquete
-- Agrega columnas de correo y UUID de usuario en paquetes, escaneos_log y movimientos_kardex.

ALTER TABLE public.paquetes
  ADD COLUMN IF NOT EXISTS usuario_email TEXT,
  ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS paquetes_usuario_email_idx ON public.paquetes (usuario_email);

ALTER TABLE public.escaneos_log
  ADD COLUMN IF NOT EXISTS operador_email TEXT,
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id);

ALTER TABLE public.movimientos_kardex
  ADD COLUMN IF NOT EXISTS usuario_email TEXT,
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id);
