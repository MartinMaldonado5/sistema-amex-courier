'use client';

import React from 'react';

interface SidebarProps {
  activeTab: string;
  isSidebarCollapsed: boolean;
  onSelectTab: (tab: string) => void;
  onCloseSidebar?: () => void;
  currentUser?: { nombre: string; rol: string; email?: string } | null;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  isSidebarCollapsed,
  onSelectTab,
  onCloseSidebar,
  currentUser,
  onLogout
}: SidebarProps) {
  const isScannerActive = activeTab === 'mobile-scanner' || activeTab.startsWith('scanner-');
  const [isScannerOpen, setIsScannerOpen] = React.useState(isScannerActive);

  React.useEffect(() => {
    if (isScannerActive) {
      setIsScannerOpen(true);
    }
  }, [isScannerActive]);

  const handleLogoutClick = () => {
    if (typeof window !== 'undefined' && window.confirm('¿Estás seguro de que deseas cerrar tu sesión en el sistema?')) {
      onLogout?.();
    }
  };

  const navItem = (tab: string, icon: string, label: string) => {
    const isActive = activeTab === tab || (tab === 'directorio-clientes' && activeTab === 'clientes-360');
    return (
      <div
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => onSelectTab(tab)}
        role="button"
        tabIndex={0}
        style={{
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '13px',
          fontWeight: isActive ? 800 : 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: isActive ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
          borderLeft: isActive ? '3.5px solid #38bdf8' : '3.5px solid transparent',
          color: isActive ? '#ffffff' : '#cbd5e1'
        }}
      >
        <i className={icon} style={{ width: '18px', textAlign: 'center', color: isActive ? '#38bdf8' : '#94a3b8' }}></i>
        <span>{label}</span>
      </div>
    );
  };

  const navSubItem = (tab: string, icon: string, label: string, accentColor: string) => {
    const isSubActive = activeTab === tab || (tab === 'scanner-slotting' && activeTab === 'mobile-scanner');
    return (
      <div
        key={tab}
        className={`nav-sub-item ${isSubActive ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTab(tab);
        }}
        role="button"
        tabIndex={0}
        style={{
          borderRadius: '6px',
          padding: '7px 10px',
          fontSize: '12px',
          fontWeight: isSubActive ? 800 : 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: isSubActive ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
          borderLeft: isSubActive ? `3px solid ${accentColor}` : '3px solid transparent',
          color: isSubActive ? '#ffffff' : '#94a3b8'
        }}
        onMouseEnter={(e) => {
          if (!isSubActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
        }}
        onMouseLeave={(e) => {
          if (!isSubActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <i className={icon} style={{ width: '15px', textAlign: 'center', color: isSubActive ? accentColor : '#64748b', fontSize: '11px' }}></i>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
    );
  };

  return (
    <nav className={`sap-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} aria-label="Menú principal de Operaciones y Almacenes" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Encabezado Móvil con Botón Cerrar (Oculto en PC vía CSS) */}
      <div className="sidebar-mobile-header">
        <span style={{ fontSize: '13px', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-boxes-stacked" style={{ color: '#38bdf8' }}></i> SISTEMA AMEX COURIER
        </span>
        <button
          onClick={onCloseSidebar}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: '#f8fafc',
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Cerrar panel de módulos"
        >
          ✕
        </button>
      </div>

      {/* ÁREA SCROLLABLE: TÍTULO Y MÓDULOS DEL SISTEMA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.28) 0%, rgba(30, 64, 175, 0.28) 100%)',
            border: '1.5px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '11.5px',
            letterSpacing: '0.5px',
            marginBottom: '8px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: '#38bdf8' }}></i> Módulos del Sistema
          </span>
        </div>

        {/* SUBMÓDULOS EN ORDEN OPERATIVO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItem('dashboard', 'fa-solid fa-chart-pie', '1. Panel Operativo')}
          {navItem('live-sheets', 'fa-solid fa-table-list', '2. Amex Excel')}
          {navItem('mm-lince', 'fa-solid fa-boxes-stacked', '3. Inventario')}
          {navItem('fico-cobros', 'fa-solid fa-receipt', '4. Cobros')}
          {navItem('directorio-clientes', 'fa-solid fa-users', '5. Directorio de Clientes')}
          {/* MÓDULO 6: ESCÁNER DE CÓDIGOS CON SUBMÓDULOS DESPLEGABLES */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              className={`nav-item ${isScannerActive ? 'active' : ''}`}
              onClick={() => {
                if (!isScannerActive) {
                  onSelectTab('scanner-slotting');
                  setIsScannerOpen(true);
                } else {
                  setIsScannerOpen(prev => !prev);
                }
              }}
              role="button"
              tabIndex={0}
              style={{
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: isScannerActive ? 800 : 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isScannerActive ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'transparent',
                borderLeft: isScannerActive ? '3.5px solid #38bdf8' : '3.5px solid transparent',
                color: isScannerActive ? '#ffffff' : '#cbd5e1'
              }}
            >
              <i className="fa-solid fa-barcode" style={{ width: '18px', textAlign: 'center', color: isScannerActive ? '#38bdf8' : '#94a3b8' }}></i>
              <span style={{ flex: 1 }}>6. Escáner de Códigos</span>
              <i
                className="fa-solid fa-chevron-down"
                style={{
                  fontSize: '10.5px',
                  color: isScannerActive ? '#38bdf8' : '#64748b',
                  transition: 'transform 0.2s ease',
                  transform: isScannerOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {/* Submódulos Desplegables Verticales */}
            {isScannerOpen && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  paddingLeft: '12px',
                  marginTop: '3px',
                  marginBottom: '4px',
                  borderLeft: '2px solid rgba(56, 189, 248, 0.3)',
                  marginLeft: '20px'
                }}
              >
                {navSubItem('scanner-slotting', 'fa-solid fa-layer-group', '6.1 📦 Asignar Anaquel', '#38bdf8')}
                {navSubItem('scanner-lookup', 'fa-solid fa-magnifying-glass-location', '6.2 🔍 Localizar 360°', '#4ade80')}
                {navSubItem('scanner-delivery', 'fa-solid fa-truck-fast', '6.3 🚚 Despachar', '#c084fc')}
                {navSubItem('scanner-relocate', 'fa-solid fa-right-left', '6.4 🔄 Reasignar Ubicación', '#fb923c')}
              </div>
            )}
          </div>
          {navItem('dni-matrix', 'fa-solid fa-id-card', '7. Procesador de DNI')}
          {navItem('rotulos-a4', 'fa-solid fa-tags', '8. Rótulos Agencias')}
          {navItem('boletas-shalom', 'fa-solid fa-receipt', '9. Boletas Shalom')}
          {navItem('formato-entrega', 'fa-solid fa-file-signature', '10. Formato de Entrega')}
          {navItem('invoices-usa', 'fa-solid fa-file-invoice-dollar', '11. Facturas / Invoices USA')}
          {navItem('info-amex', 'fa-solid fa-photo-film', '12. Info Imágenes AMEX')}
          {navItem('completar-inventario', 'fa-solid fa-cloud-arrow-up', '13. Completar Inventario')}
          {navItem('auditoria', 'fa-solid fa-shield-halved', '14. Auditoría & Gobernanza')}
          {navItem('admin-usuarios', 'fa-solid fa-user-gear', '15. Gestión de Usuarios')}
        </div>
      </div>

      {/* PIE FIJO DEL SIDEBAR: USUARIO ACTIVO Y ÚNICO BOTÓN DE CIERRE DE SESIÓN */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%)',
          padding: '12px 12px 24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
          boxShadow: '0 -4px 14px rgba(0, 0, 0, 0.35)',
          zIndex: 10
        }}
      >
        {/* Identidad del Operador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 4px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: '1.5px solid #38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 900,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)'
            }}
          >
            {(currentUser?.nombre || 'AMEX')[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={currentUser?.nombre || 'Administrador AMEX'}
            >
              {currentUser?.nombre || 'Administrador AMEX'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              {currentUser?.rol || 'Operador Logístico'}
            </div>
          </div>
        </div>

        {/* Único Botón de Cerrar Sesión */}
        <button
          onClick={handleLogoutClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            transition: 'all 0.18s ease',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.12)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#b91c1c';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.color = '#fca5a5';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(239, 68, 68, 0.12)';
          }}
          aria-label="Cerrar sesión del sistema"
          title="Cerrar sesión y volver a la pantalla de login"
        >
          <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '13px' }}></i>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
