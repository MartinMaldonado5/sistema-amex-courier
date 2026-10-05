'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface DashboardUser {
  id?: string;
  nombre: string;
  email: string;
  rol: string;
  rol_id?: string | null;
  permisos?: Record<string, unknown>;
  isAdmin?: boolean;
}

export function useDashboardSession() {
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        setCurrentUser(null);
        setIsLoadingSession(false);
        return;
      }

      // 1. Obtener perfil persistido y permisos vigentes desde el backend seguro
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setCurrentUser(json.user);
            setIsLoadingSession(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('No se pudo contactar /api/auth/me, usando datos de token local:', apiErr);
      }

      // 2. Fallback de contingencia con metadatos del token Auth
      const metadata = authData.user.user_metadata || {};
      const appMetadata = authData.user.app_metadata || {};
      const rol =
        (appMetadata.rol as string) ||
        (metadata.rol as string) ||
        'Operador Logístico';
      const normRole = rol.trim().toLowerCase();
      const isAdmin = normRole === 'admin' || normRole === 'administrador';

      setCurrentUser({
        id: authData.user.id,
        nombre:
          (metadata.nombre_completo as string) ||
          (metadata.nombre as string) ||
          authData.user.email?.split('@')[0] ||
          'Operador AMEX',
        email: authData.user.email || '',
        rol,
        permisos: {},
        isAdmin,
      });
    } catch (err) {
      console.error('Error cargando sesión de usuario:', err);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
        setIsLoadingSession(false);
      } else {
        fetchSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  return { currentUser, isLoadingSession, logout, refreshSession: fetchSession };
}
