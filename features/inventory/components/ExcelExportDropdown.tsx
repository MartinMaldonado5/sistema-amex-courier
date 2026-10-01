'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  ChevronDown,
  Filter,
  Layers,
  Inbox,
  Package,
  Store,
  Truck,
  CheckCircle2,
  CheckSquare
} from 'lucide-react';
import { Paquete } from '@/types';
import { exportPaquetesToExcel } from '@/lib/excelExport';

export interface ExcelExportDropdownProps {
  paquetes: Paquete[];
  filteredPaquetes: Paquete[];
  selectedIds: string[];
}

export default function ExcelExportDropdown({
  paquetes,
  filteredPaquetes,
  selectedIds
}: ExcelExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Contadores dinámicos
  const totalCount = paquetes.length;
  const filteredCount = filteredPaquetes.length;
  const selectedCount = selectedIds.length;
  const recibidoCount = paquetes.filter(p => p.estadoAmex === 'recibido').length;
  const enAlmacenCount = paquetes.filter(p => p.estadoAmex === 'en_almacen').length;
  const listoRecojoCount = paquetes.filter(p => p.estadoAmex === 'listo_recojo').length;
  const enRutaCount = paquetes.filter(p => p.estadoAmex === 'en_ruta').length;
  const entregadoCount = paquetes.filter(p => p.estadoAmex === 'entregado').length;

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

  const handleExport = (type: string) => {
    setIsOpen(false);

    switch (type) {
      case 'filtered':
        exportPaquetesToExcel(filteredPaquetes, 'Inventario_Vista_Actual');
        break;
      case 'all':
        exportPaquetesToExcel(paquetes, 'Inventario_Completo_AMEX');
        break;
      case 'recibido':
        exportPaquetesToExcel(
          paquetes.filter(p => p.estadoAmex === 'recibido'),
          'Inventario_AMEX_Solo_Recibidos'
        );
        break;
      case 'en_almacen':
        exportPaquetesToExcel(
          paquetes.filter(p => p.estadoAmex === 'en_almacen'),
          'Inventario_AMEX_Solo_EnAlmacen'
        );
        break;
      case 'listo_recojo':
        exportPaquetesToExcel(
          paquetes.filter(p => p.estadoAmex === 'listo_recojo'),
          'Inventario_AMEX_Solo_ListoRecojo'
        );
        break;
      case 'en_ruta':
        exportPaquetesToExcel(
          paquetes.filter(p => p.estadoAmex === 'en_ruta'),
          'Inventario_AMEX_Solo_EnRuta'
        );
        break;
      case 'entregado':
        exportPaquetesToExcel(
          paquetes.filter(p => p.estadoAmex === 'entregado'),
          'Inventario_AMEX_Solo_Entregados'
        );
        break;
      case 'selected':
        exportPaquetesToExcel(
          paquetes.filter(p => selectedIds.includes(p.id)),
          'Inventario_AMEX_Seleccionados'
        );
        break;
      default:
        exportPaquetesToExcel(filteredPaquetes, 'Inventario_AMEX');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="btn"
        style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 800,
          boxShadow: '0 1px 3px rgba(22, 101, 52, 0.08)',
          cursor: 'pointer'
        }}
        title="Exportar inventario en formato Excel con filtros o agrupaciones"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        Exportar Excel (.xlsx)
        <ChevronDown
          className="w-3.5 h-3.5 text-emerald-700"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '280px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
            padding: '6px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            Opciones de Exportación
          </div>

          {/* 1. Vista Actual Filtrada */}
          <button
            type="button"
            onClick={() => handleExport('filtered')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter className="w-4 h-4 text-blue-600" />
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>Vista Actual (Filtros)</span>
            </div>
            <span style={badgeStyle('#eff6ff', '#1d4ed8')}>{filteredCount}</span>
          </button>

          {/* 2. Todo el Inventario */}
          <button
            type="button"
            onClick={() => handleExport('all')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers className="w-4 h-4 text-indigo-600" />
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>Todo el Inventario</span>
            </div>
            <span style={badgeStyle('#f1f5f9', '#475569')}>{totalCount}</span>
          </button>

          {/* 3. Solo Seleccionados */}
          <button
            type="button"
            onClick={() => handleExport('selected')}
            disabled={selectedCount === 0}
            style={{
              ...dropdownItemStyle,
              opacity: selectedCount === 0 ? 0.45 : 1,
              cursor: selectedCount === 0 ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={e => {
              if (selectedCount > 0) e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare className="w-4 h-4 text-purple-600" />
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>Solo Seleccionados</span>
            </div>
            <span style={badgeStyle('#f3e8ff', '#7e22ce')}>{selectedCount}</span>
          </button>

          <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

          <div
            style={{
              padding: '4px 10px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Por Estado AMEX
          </div>

          {/* 4. Recibidos */}
          <button
            type="button"
            onClick={() => handleExport('recibido')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox className="w-4 h-4 text-sky-600" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>Solo Recibidos</span>
            </div>
            <span style={badgeStyle('#e0f2fe', '#0369a1')}>{recibidoCount}</span>
          </button>

          {/* 5. En Almacén */}
          <button
            type="button"
            onClick={() => handleExport('en_almacen')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package className="w-4 h-4 text-indigo-600" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>Solo En Almacén</span>
            </div>
            <span style={badgeStyle('#e0e7ff', '#3730a3')}>{enAlmacenCount}</span>
          </button>

          {/* 6. Listos para Recojo */}
          <button
            type="button"
            onClick={() => handleExport('listo_recojo')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store className="w-4 h-4 text-amber-600" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>Solo Listo para Recojo</span>
            </div>
            <span style={badgeStyle('#fef3c7', '#92400e')}>{listoRecojoCount}</span>
          </button>

          {/* 7. En Ruta */}
          <button
            type="button"
            onClick={() => handleExport('en_ruta')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck className="w-4 h-4 text-purple-600" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>Solo En Ruta</span>
            </div>
            <span style={badgeStyle('#f3e8ff', '#6b21a8')}>{enRutaCount}</span>
          </button>

          {/* 8. Entregados */}
          <button
            type="button"
            onClick={() => handleExport('entregado')}
            style={dropdownItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>Solo Entregados</span>
            </div>
            <span style={badgeStyle('#dcfce7', '#15803d')}>{entregadoCount}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '7px 10px',
  borderRadius: '6px',
  border: 'none',
  background: 'transparent',
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background 0.1s ease'
};

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color: color,
  padding: '1px 6px',
  borderRadius: '10px',
  fontSize: '11px',
  fontWeight: 800
});
