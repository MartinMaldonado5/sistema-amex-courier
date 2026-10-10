'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Zap, Camera, FileText, ChevronDown } from 'lucide-react';

export interface TibOperationsDropdownProps {
  onOpenSyncTibModal?: () => void;
  onOpenBulkWrModal?: () => void;
  onOpenSyncTibImagesModal?: () => void;
  missingTibImagesCount?: number;
}

export default function TibOperationsDropdown({
  onOpenSyncTibModal,
  onOpenBulkWrModal,
  onOpenSyncTibImagesModal,
  missingTibImagesCount = 0
}: TibOperationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="btn"
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          height: '33px',
          padding: '0 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(37,99,235,0.06)'
        }}
        title="Herramientas y sincronización TIB Cargo"
      >
        <Zap className="w-4 h-4 text-blue-600" />
        <span>Herramientas TIB</span>
        {missingTibImagesCount > 0 && (
          <span
            style={{
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '999px'
            }}
          >
            {missingTibImagesCount}
          </span>
        )}
        <ChevronDown
          className="w-3.5 h-3.5 text-blue-600 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 6px)',
            width: '290px',
            maxWidth: 'calc(100vw - 32px)',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
            zIndex: 100,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}
        >
          {onOpenSyncTibModal && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSyncTibModal();
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                  Cruzar con TIB del Día
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Cruce automático de estados con Worker
                </div>
              </div>
            </button>
          )}

          {onOpenBulkWrModal && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenBulkWrModal();
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                  Actualizar por Guías WR
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Pegar lista de WRs para cambio masivo
                </div>
              </div>
            </button>
          )}

          {onOpenSyncTibImagesModal && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSyncTibImagesModal();
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                width: '100%'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div
                style={{
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Camera className="w-4 h-4 text-indigo-600" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Sincronizar Fotos TIB</span>
                  {missingTibImagesCount > 0 && (
                    <span
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '999px'
                      }}
                    >
                      {missingTibImagesCount}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Descargar fotos y tickets de bodega
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
