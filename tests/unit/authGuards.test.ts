import { describe, it, expect } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { hasAdminRole, getUserDisplayName } from '@/lib/auth/guards';

describe('Seguridad y Control de Acceso — Guards de Autenticación y Autorización', () => {
  describe('hasAdminRole — Verificación de Privilegios y Prevención de Escalada', () => {
    it('debe otorgar rol de administrador cuando app_metadata contiene "admin" o "administrador"', async () => {
      const adminUser = {
        id: 'u-admin-1',
        app_metadata: { rol: 'admin' },
        user_metadata: {}
      } as unknown as User;

      const administradorUser = {
        id: 'u-admin-2',
        app_metadata: { rol: 'administrador' },
        user_metadata: {}
      } as unknown as User;

      expect(await hasAdminRole(adminUser)).toBe(true);
      expect(await hasAdminRole(administradorUser)).toBe(true);
    });

    it('debe tolerar espacios y mayúsculas en el rol administrativo de app_metadata', async () => {
      const userWithSpaces = {
        id: 'u-admin-3',
        app_metadata: { rol: '  ADMIN  ' },
        user_metadata: {}
      } as unknown as User;

      expect(await hasAdminRole(userWithSpaces)).toBe(true);
    });

    it('debe rechazar roles no administrativos (operador, cliente, viewer)', async () => {
      const operadorUser = {
        id: 'u-op-1',
        app_metadata: { rol: 'operador' },
        user_metadata: {}
      } as unknown as User;

      const clienteUser = {
        id: 'u-cli-1',
        app_metadata: { rol: 'cliente' },
        user_metadata: {}
      } as unknown as User;

      expect(await hasAdminRole(operadorUser)).toBe(false);
      expect(await hasAdminRole(clienteUser)).toBe(false);
    });

    it('REGLA DE SEGURIDAD CRÍTICA: NO debe confiar en user_metadata para decisiones de autorización (previene escalada)', async () => {
      // Un atacante puede editar sus propios user_metadata desde el cliente Supabase
      const maliciousUser = {
        id: 'u-attacker',
        app_metadata: { rol: 'operador' }, // rol real del sistema
        user_metadata: { rol: 'admin', role: 'admin' } // inyectado por el usuario
      } as unknown as User;

      expect(await hasAdminRole(maliciousUser)).toBe(false);
    });
  });

  describe('getUserDisplayName — Identidad de Operadores y Usuarios', () => {
    it('debe priorizar nombre_completo de user_metadata', () => {
      const user = {
        email: 'juan@amex.pe',
        user_metadata: { nombre_completo: 'Juan Carlos Perez' }
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('Juan Carlos Perez');
    });

    it('debe hacer fallback al campo usuario si nombre_completo no existe', () => {
      const user = {
        email: 'maria@amex.pe',
        user_metadata: { usuario: 'mariap' }
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('mariap');
    });

    it('debe hacer fallback al correo electrónico si no hay metadatos de nombre', () => {
      const user = {
        email: 'operador1@amex.pe',
        user_metadata: {}
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('operador1@amex.pe');
    });

    it('debe retornar "Usuario AMEX" si no hay ninguna información disponible', () => {
      const user = {
        user_metadata: {}
      } as unknown as User;

      expect(getUserDisplayName(user)).toBe('Usuario AMEX');
    });
  });
});
