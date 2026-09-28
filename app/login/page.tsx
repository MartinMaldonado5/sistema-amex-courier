'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        throw error;
      }

      const nextPath = new URLSearchParams(window.location.search).get('next');
      window.location.href = nextPath?.startsWith('/') ? nextPath : '/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErrorMessage(msg === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!email.trim()) {
      setErrorMessage('Ingresa tu correo electrónico para enviarte el enlace de recuperación.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?recovered=true`
      });
      if (error) throw error;
      setRecoverySent(true);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar recuperación';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#f8fafc'
        }}
      >
        {/* Brand / Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.35)',
              marginBottom: '12px'
            }}
          >
            <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '24px', color: '#ffffff' }}></i>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '0.5px' }}>
            SISTEMA AMEX COURIER
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            Acceso seguro a operaciones y almacén
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            {errorMessage}
          </div>
        )}

        {recoverySent && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#86efac',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-circle-check"></i>
            Enlace de recuperación enviado. Revisa tu bandeja de entrada.
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Correo Corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-envelope"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '14px'
                }}
              ></i>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sistemaamexcourier@gmail.com"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 36px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                Contraseña
              </label>
              <button
                type="button"
                onClick={handlePasswordRecovery}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-lock"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '14px'
                }}
              ></i>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 36px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                Validando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            AMEX Courier SAC • Almacén Central Lince • Seguridad RLS Activa
          </p>
        </div>
      </div>
    </div>
  );
}
