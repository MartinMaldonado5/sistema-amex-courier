'use client';

import React from 'react';

interface HeaderBarProps {
  currentUser?: { nombre: string; rol: string } | null;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout?: () => void;
}

export default function HeaderBar({
  currentUser,
  isSidebarCollapsed,
  onToggleSidebar,
  onLogout
}: HeaderBarProps) {
  return (
    <header className="sap-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
      <div className="sap-brand" style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="header-sidebar-toggle"
          onClick={onToggleSidebar}
          style={{
            background: isSidebarCollapsed ? 'rgba(255,255,255,0.08)' : 'rgba(37, 99, 235, 0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '10px',
            transition: 'all 0.15s ease'
          }}
          aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={isSidebarCollapsed ? 'Abrir menú lateral' : 'Cerrar menú lateral'}
        >
          <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-xmark'}`}></i>
        </button>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 900, fontSize: '15px', letterSpacing: '0.4px', color: '#ffffff' }}>
          SISTEMA AMEX COURIER
        </span>
      </div>

      {/* Perfil de Usuario y Sesión */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {currentUser.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex" style={{ flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                {currentUser.nombre}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#38bdf8', textTransform: 'capitalize' }}>
                {currentUser.rol}
              </span>
            </div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Cerrar sesión"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
