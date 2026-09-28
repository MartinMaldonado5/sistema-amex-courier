import { createClient } from '@/lib/supabase/client';

export interface AuditLogEntry {
  modulo: string;
  accion: 'CREAR' | 'EDITAR' | 'ELIMINAR_SOFT' | 'RESTAURAR' | 'TRANSFERENCIA' | 'ESTADO_CAMBIO';
  registroId?: string;
  detalles?: string;
  valoresAnteriores?: Record<string, unknown> | null;
  valoresNuevos?: Record<string, unknown> | null;
}

export async function registrarAuditoria(entry: AuditLogEntry) {
  try {
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    const payload = {
      usuario_id: user?.id || null,
      usuario_nombre:
        (user?.user_metadata?.nombre_completo as string) ||
        (user?.user_metadata?.nombre as string) ||
        'Operador Logístico AMEX',
      usuario_email: user?.email || 'sistemaamexcourier@gmail.com',
      modulo: entry.modulo,
      accion: entry.accion,
      registro_id: entry.registroId || null,
      detalles: entry.detalles || null,
      valores_anteriores: entry.valoresAnteriores || null,
      valores_nuevos: entry.valoresNuevos || null,
    };

    await supabase.from('auditoria_sistema').insert(payload);
  } catch (err) {
    console.warn('Error registrando auditoría en Supabase:', err);
  }
}
