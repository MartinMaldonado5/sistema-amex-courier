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
  const handleLogoutClick = () => {
    if (typeof window !== 'undefined' && window.confirm('¿Estás seguro de que deseas cerrar tu sesión en el sistema?')) {
      onLogout?.();
    }
  };

  return (
    <header
      className="sap-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        overflow: 'hidden'
      }}
    >
      <div className="sap-brand" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
        <button
          className="header-sidebar-toggle"
          onClick={onToggleSidebar}
          style={{
            background: isSidebarCollapsed ? 'rgba(255,255,255,0.08)' : 'rgba(37, 99, 235, 0.4)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '15px',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <i className={`fa-solid ${isSidebarCollapsed ? 'fa-bars' : 'fa-xmark'}`}></i>
        </button>
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '0.4px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-boxes-stacked" style={{ color: '#38bdf8' }}></i>
          AMEX COURIER
        </span>
        {onLogout && (
          <button
            onClick={handleLogoutClick}
            className="header-logout-btn"
            style={{
              marginLeft: 'auto',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              e.currentTarget.style.color = '#fca5a5';
            }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ color: '#ef4444' }}></i>
            <span className="header-logout-text">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
}
