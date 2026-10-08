'use client';

import React from 'react';
import { ArrowRightLeft, Truck, Trash2, X, CheckSquare, Camera, Check, Loader2 } from 'lucide-react';

export interface InventorySelectionBarProps {
  selectedCount: number;
  onOpenTransferModal: () => void;
  onOpenBatchStatusModal: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  onCopyImage?: () => void;
  copyStatus?: 'idle' | 'copying' | 'copied';
}

export default function InventorySelectionBar({
  selectedCount,
  onOpenTransferModal,
  onOpenBatchStatusModal,
  onBatchDelete,
  onClearSelection,
  onCopyImage,
  copyStatus = 'idle'
}: InventorySelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="inv-floating-bar"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        background: '#0f172a',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '10px 18px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideUp 0.2s ease-out',
        border: '1px solid #334155'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px', borderRight: '1px solid #334155' }}>
        <CheckSquare className="w-4 h-4 text-blue-400" />
        <span style={{ fontSize: '13px', fontWeight: 800 }}>
          {selectedCount} <span style={{ fontWeight: 500, color: '#94a3b8' }}>seleccionados</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onCopyImage && (
          <button
            type="button"
            onClick={onCopyImage}
            disabled={copyStatus === 'copying'}
            style={{
              background: copyStatus === 'copied' ? '#059669' : '#10b981',
              border: 'none',
              color: '#ffffff',
              borderRadius: '7px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: copyStatus === 'copying' ? 'wait' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (copyStatus !== 'copied') e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={e => {
              if (copyStatus !== 'copied') e.currentTarget.style.background = '#10b981';
            }}
            title="Copiar tabla de paquetes seleccionados como imagen para WhatsApp"
          >
            {copyStatus === 'copying' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : copyStatus === 'copied' ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-white" />
            )}
            <span>
              {copyStatus === 'copying'
                ? 'Generando...'
                : copyStatus === 'copied'
                ? '¡Copiado!'
                : 'Copiar Imagen (WhatsApp)'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenBatchStatusModal}
          style={{
            background: '#2563eb',
            border: 'none',
            color: '#ffffff',
            borderRadius: '7px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
        >
          <Truck className="w-3.5 h-3.5 text-amber-300" />
          <span>Cambiar Estado AMEX</span>
        </button>

        <button
          type="button"
          onClick={onOpenTransferModal}
          style={{
            background: '#334155',
            border: 'none',
            color: '#ffffff',
            borderRadius: '7px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#475569')}
          onMouseLeave={e => (e.currentTarget.style.background = '#334155')}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
          <span>Reubicar</span>
        </button>

        <button
          type="button"
          onClick={onBatchDelete}
          style={{
            background: '#dc2626',
            border: 'none',
            color: '#ffffff',
            borderRadius: '7px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
          onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          borderRadius: '6px',
          padding: '4px 6px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '4px'
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        title="Desmarcar todos"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
