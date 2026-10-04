import { createBrowserClient } from '@supabase/ssr';

if (typeof window === 'undefined' && typeof globalThis.WebSocket === 'undefined') {
  // Polyfill de seguridad para entornos Node.js / CI donde no exista WebSocket nativo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
