'use client';

import React from 'react';
import { Boxes, Settings, Clock, Plus } from 'lucide-react';

export interface InventorySubTabsProps {
  activeSubTab: 'existencias' | 'movimientos' | 'matriz' | 'gestor';
  setActiveSubTab: (tab: 'existencias' | 'movimientos' | 'matriz' | 'gestor') => void;
  filteredCount: number;
  posicionesCount: number;
  kardexCount: number;
  onOpenNewPositionModal: () => void;
}

export default function InventorySubTabs({
  activeSubTab,
  setActiveSubTab,
  filteredCount,
  posicionesCount,
  kardexCount,
  onOpenNewPositionModal
}: InventorySubTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '8px'
      }}
    >
      {/* Pestañas de Navegación */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('existencias')}
          style={{
            background: activeSubTab === 'existencias' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'existencias' ? '#ffffff' : '#475569',
            border: activeSubTab === 'existencias' ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Boxes className="w-4 h-4" />
          <span>1. Existencias Lince</span>
          <span
            style={{
              background: activeSubTab === 'existencias' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeSubTab === 'existencias' ? '#ffffff' : '#475569',
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '999px',
              fontWeight: 800
            }}
          >
            {filteredCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gestor')}
          style={{
            background: activeSubTab === 'gestor' ? '#1e40af' : '#f8fafc',
            color: activeSubTab === 'gestor' ? '#ffffff' : '#475569',
            border: activeSubTab === 'gestor' ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Settings className="w-4 h-4" />
          <span>2. Configurar Anaqueles & Capacidad</span>
          <span
            style={{
              background: activeSubTab === 'gestor' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeSubTab === 'gestor' ? '#ffffff' : '#475569',
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '999px',
              fontWeight: 800
            }}
          >
            {posicionesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('movimientos')}
          style={{
            background: activeSubTab === 'movimientos' ? '#0f766e' : '#f8fafc',
            color: activeSubTab === 'movimientos' ? '#ffffff' : '#475569',
            border: activeSubTab === 'movimientos' ? '1px solid #115e59' : '1px solid #e2e8f0',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Clock className="w-4 h-4" />
          <span>3. Bitácora de Movimientos y Custodia</span>
          <span
            style={{
              background: activeSubTab === 'movimientos' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: activeSubTab === 'movimientos' ? '#ffffff' : '#475569',
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '999px',
              fontWeight: 800
            }}
          >
            {kardexCount}
          </span>
        </button>
      </div>

      {/* Acción Contextual a la Derecha */}
      {activeSubTab === 'gestor' && (
        <button
          type="button"
          onClick={onOpenNewPositionModal}
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
        >
          <Plus className="w-4 h-4" />
          <span>Crear Anaquel</span>
        </button>
      )}
    </div>
  );
}
