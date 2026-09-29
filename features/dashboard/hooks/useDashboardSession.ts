'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface DashboardUser {
  nombre: string;
  email: string;
  rol: string;
  id?: string;
}

const DEFAULT_DASHBOARD_USER: DashboardUser = {
  nombre: 'Operador Logístico AMEX',
  email: '',
  rol: 'Operador Logístico'
};

export function useDashboardSession() {
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(DEFAULT_DASHBOARD_USER);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data?.user) return;

      const metadata = data.user.user_metadata || {};
      setCurrentUser({
        nombre:
          (metadata.nombre_completo as string) ||
          (metadata.nombre as string) ||
          data.user.email?.split('@')[0] ||
          'Operador AMEX',
        email: data.user.email || '',
        rol: (data.user.app_metadata?.rol as string) || 'Operador Logístico',
        id: data.user.id
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  return { currentUser, logout };
}
