import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service_role — SOLO uso en servidor (API Routes).
 * Bypass RLS: lo usan la cola de inventario-jobs y el historial.
 * NUNCA exponer la key al cliente.
 */
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url) throw new Error('Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL.');
  if (!serviceKey) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Agrégala a .env.local y a Vercel.'
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}
