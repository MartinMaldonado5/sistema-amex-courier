'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  ArrowRightLeft,
  Edit3,
  Printer,
  FileText,
  Camera,
  Trash2
} from 'lucide-react';
import { Paquete } from '@/types';

export interface RowActionsDropdownProps {
  pkg: Paquete;
  index: number;
  totalRows: number;
  onQuickDeliver?: (pkg: Paquete) => void;
  onOpenTransferModal: (pkg: Paquete) => void;
  onOpenEditModal: (pkg: Paquete) => void;
  onSelectThermalPkg: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
  onOpenTibImage?: (pkg: Paquete) => void;
  onDeletePackage: (id: string, wrCode: string) => void;
}

export default function RowActionsDropdown({
  pkg,
  index,
  totalRows,
  onQuickDeliver,
  onOpenTransferModal,
  onOpenEditModal,
  onSelectThermalPkg,
  onViewPdf,
  onOpenTibImage,
  onDeletePackage
}: RowActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
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

  // Si las filas están al final de la página, abrir hacia arriba
  const openUpwards = index >= Math.max(totalRows - 3, 1) && totalRows > 3;

  return (
    <div className="relative inline-block" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          background: isOpen ? '#eff6ff' : '#ffffff',
          border: isOpen ? '1px solid #93c5fd' : '1px solid #cbd5e1',
          color: isOpen ? '#1d4ed8' : '#334155',
          padding: '4px 9px',
          borderRadius: '7px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}
        title="Opciones y acciones del paquete"
      >
        <span>Acciones</span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            color: isOpen ? '#1d4ed8' : '#64748b'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            ...(openUpwards
              ? { bottom: 'calc(100% + 4px)' }
              : { top: 'calc(100% + 4px)' }),
            width: '210px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '9px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
            zIndex: 60,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            textAlign: 'left'
          }}
        >
          {/* 1. Entregar */}
          {pkg.estadoAmex !== 'entregado' && onQuickDeliver && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onQuickDeliver(pkg);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#15803d',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Entregar Paquete</span>
            </button>
          )}

          {/* 2. Reubicar / Trasladar */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenTransferModal(pkg);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 9px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Reubicar / Trasladar</span>
          </button>

          {/* 3. Modificar Datos */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenEditModal(pkg);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 9px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Edit3 className="w-4 h-4 text-slate-600 flex-shrink-0" />
            <span>Modificar Datos</span>
          </button>

          {/* 4. Imprimir Rótulo Térmico */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSelectThermalPkg(pkg);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 9px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#1e293b',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Printer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Imprimir Rótulo (4x6)</span>
          </button>

          {/* 5. Ver Factura PDF */}
          {pkg.facturaPdfUrl && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onViewPdf(pkg.facturaPdfUrl!);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#1e293b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Ver Factura PDF</span>
            </button>
          )}

          {/* 6. Ver Foto TIB */}
          {onOpenTibImage && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenTibImage(pkg);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 9px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#1e293b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Camera className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>{pkg.tibImagenUrl ? 'Ver Foto TIB' : 'Consultar Foto TIB'}</span>
            </button>
          )}

          {/* Divisor */}
          <div style={{ height: '1px', background: '#f1f5f9', margin: '3px 0' }} />

          {/* 7. Eliminar */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDeletePackage(pkg.id, pkg.numeroReciboBodega);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 9px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#dc2626',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Eliminar Paquete</span>
          </button>
        </div>
      )}
    </div>
  );
}
