'use client';

import React from 'react';
import {
  Boxes,
  Layers,
  Settings,
  Clock,
  Plus,
  Search,
  ArrowRightLeft,
  Truck,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Warehouse
} from 'lucide-react';
import { EstanteriaPosicion } from '@/types';

export interface InventoryToolbarProps {
  activeSubTab: 'existencias' | 'movimientos' | 'matriz' | 'gestor';
  setActiveSubTab: (tab: 'existencias' | 'movimientos' | 'matriz' | 'gestor') => void;
  filteredCount: number;
  shelfGroups: { [key: string]: EstanteriaPosicion[] };
  posicionesCount: number;
  kardexCount: number;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  locationFilter: string;
  setLocationFilter: (s: string) => void;
  shelfFilter: string;
  setShelfFilter: (s: string) => void;
  floorFilter: string;
  setFloorFilter: (s: string) => void;
  packageTypeFilter: string;
  setPackageTypeFilter: (s: string) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenTransferModal: () => void;
  onOpenBatchStatusModal: () => void;
  onBatchDelete: () => void;
  onOpenNewPositionModal: () => void;
  onOpenMatrizModal: () => void;
  onOpenGestorModal: () => void;
  onOpenKardexModal: () => void;
  onExportExcel: () => void;
  onRefreshData?: () => Promise<void> | void;
  onNewPackage: () => void;
}

export default function InventoryToolbar({
  activeSubTab,
  setActiveSubTab,
  filteredCount,
  shelfGroups,
  posicionesCount,
  kardexCount,
  searchTerm,
  setSearchTerm,
  locationFilter,
  setLocationFilter,
  shelfFilter,
  setShelfFilter,
  floorFilter,
  setFloorFilter,
  packageTypeFilter,
  setPackageTypeFilter,
  selectedIds,
  setSelectedIds,
  onOpenTransferModal,
  onOpenBatchStatusModal,
  onBatchDelete,
  onOpenNewPositionModal,
  onOpenMatrizModal,
  onOpenGestorModal,
  onOpenKardexModal,
  onExportExcel,
  onRefreshData,
  onNewPackage
}: InventoryToolbarProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    locationFilter !== 'ALL' ||
    shelfFilter !== 'ALL' ||
    floorFilter !== 'ALL' ||
    packageTypeFilter !== 'ALL';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Breadcrumb & Header Principal */}
      <div className="sap-breadcrumb">
        <span>Operaciones y Almacenes</span> / <span>Almacén Central Sede Lince (Lima)</span>
      </div>

      <div
        className="page-title-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Warehouse style={{ width: '28px', height: '28px', color: '#2563eb' }} />
            Almacén Central Sede Lince (Lima)
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Búsquedas en tiempo real, modificaciones de bultos, traslados entre anaqueles/pisos y control de salidas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn"
            onClick={onExportExcel}
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800
            }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Excel (.xlsx)
          </button>

          <button
            className="btn"
            onClick={onOpenMatrizModal}
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <Layers className="w-4 h-4 text-blue-600" /> 🗺️ Mapa 3D Slotting
          </button>

          <button
            className="btn"
            onClick={onOpenGestorModal}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <Settings className="w-4 h-4 text-slate-700" /> ⚙️ Configurar Anaqueles
          </button>

          <button
            className="btn"
            onClick={onOpenKardexModal}
            style={{
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <Clock className="w-4 h-4 text-teal-600" /> 🔄 Kardex Movimientos
          </button>

          <button
            className="btn"
            onClick={async () => {
              if (onRefreshData) await onRefreshData();
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
            title="Sincronizar inventario en vivo"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" /> Actualizar
          </button>

          <button
            className="btn btn-primary"
            onClick={onNewPackage}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Plus className="w-4 h-4" /> Ingresar Paquete
          </button>
        </div>
      </div>

      {/* Selector de Sub-Pestañas */}
      <div className="wms-subtab-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setActiveSubTab('existencias')}
          className="wms-subtab-btn"
          style={{
            background: activeSubTab === 'existencias' ? '#2563eb' : '#f8fafc',
            color: activeSubTab === 'existencias' ? '#ffffff' : '#475569',
            border: activeSubTab === 'existencias' ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Boxes className="w-4 h-4" /> 1. Existencias Lince ({filteredCount})
        </button>

        <button
          onClick={() => setActiveSubTab('matriz')}
          className="wms-subtab-btn"
          style={{
            background: activeSubTab === 'matriz' ? '#4338ca' : '#f8fafc',
            color: activeSubTab === 'matriz' ? '#ffffff' : '#475569',
            border: activeSubTab === 'matriz' ? '1px solid #3730a3' : '1px solid #e2e8f0',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Layers className="w-4 h-4" /> 2. 🗺️ Mapa Visual de Anaqueles ({Object.keys(shelfGroups).length} Estantes)
        </button>

        <button
          onClick={() => setActiveSubTab('gestor')}
          className="wms-subtab-btn"
          style={{
            background: activeSubTab === 'gestor' ? '#1e40af' : '#f8fafc',
            color: activeSubTab === 'gestor' ? '#ffffff' : '#475569',
            border: activeSubTab === 'gestor' ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Settings className="w-4 h-4" /> 3. ⚙️ Configurar Anaqueles & Capacidad ({posicionesCount})
        </button>

        <button
          onClick={() => setActiveSubTab('movimientos')}
          className="wms-subtab-btn"
          style={{
            background: activeSubTab === 'movimientos' ? '#0f766e' : '#f8fafc',
            color: activeSubTab === 'movimientos' ? '#ffffff' : '#475569',
            border: activeSubTab === 'movimientos' ? '1px solid #115e59' : '1px solid #e2e8f0',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Clock className="w-4 h-4" /> 4. 🔄 Kardex Movimientos ({kardexCount})
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenNewPositionModal}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <Plus className="w-4 h-4" /> + Crear Nuevo Anaquel
          </button>
        </div>
      </div>

      {/* Barra de Filtros de Existencias */}
      {activeSubTab === 'existencias' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '10px',
                  width: '16px',
                  height: '16px',
                  color: '#94a3b8'
                }}
              />
              <input
                type="text"
                placeholder="Buscar por Guía WR#, Tracking USA, Casillero, Consignatario o Estante..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#f8fafc'
                }}
              />
            </div>

            {/* Acciones Masivas */}
            {selectedIds.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#eff6ff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>
                  {selectedIds.length} paquete(s) seleccionados:
                </span>
                <button
                  onClick={onOpenTransferModal}
                  className="btn btn-primary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Reubicar Selección
                </button>
                <button
                  onClick={onOpenBatchStatusModal}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#ffffff'
                  }}
                >
                  <Truck className="w-3.5 h-3.5 text-amber-600" /> Cambiar Estado
                </button>
                <button
                  onClick={onBatchDelete}
                  className="btn"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Desmarcar
                </button>
              </div>
            )}
          </div>

          {/* Selectores de Filtros */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#475569' }}>Sede:</span>
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">Todas las Sedes</option>
                <option value="TibCourierMiami">Miami Hub (USA)</option>
                <option value="TibTingoMaria">Tingo María</option>
                <option value="AmexLince">Sede Central Lince</option>
                <option value="Entregado">Entregados</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#475569' }}>Anaquel:</span>
              <select
                value={shelfFilter}
                onChange={e => {
                  setShelfFilter(e.target.value);
                  setFloorFilter('ALL');
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">Todos los Anaqueles</option>
                {Object.keys(shelfGroups).map(shelfKey => (
                  <option key={shelfKey} value={shelfKey}>
                    Anaquel {shelfKey}
                  </option>
                ))}
                <option value="REC">Recepción / Sin Estante</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#475569' }}>Piso:</span>
              <select
                value={floorFilter}
                onChange={e => setFloorFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">Todos los Pisos</option>
                <option value="P1">P1 (Inferior)</option>
                <option value="P2">P2 (Medio)</option>
                <option value="P3">P3 (Superior)</option>
                <option value="P4">P4 (Especial)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#475569' }}>Empaque:</span>
              <select
                value={packageTypeFilter}
                onChange={e => setPackageTypeFilter(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff'
                }}
              >
                <option value="ALL">Todos</option>
                <option value="CAJA">CAJA</option>
                <option value="SOBRE">SOBRE</option>
                <option value="SACA">SACA</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('ALL');
                  setShelfFilter('ALL');
                  setFloorFilter('ALL');
                  setPackageTypeFilter('ALL');
                }}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕ Limpiar Filtros
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
