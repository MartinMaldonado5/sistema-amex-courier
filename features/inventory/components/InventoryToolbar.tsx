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
  Warehouse,
  Zap
} from 'lucide-react';
import { EstanteriaPosicion, Paquete } from '@/types';
import ExcelExportDropdown from './ExcelExportDropdown';

export interface InventoryToolbarProps {
  paquetes: Paquete[];
  filteredPaquetes: Paquete[];
  amexStatusCounts?: {
    total: number;
    recibido: number;
    en_almacen: number;
    listo_recojo: number;
    en_ruta: number;
    entregado: number;
  };
  onOpenBulkWrModal?: () => void;
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
  statusFilter?: string;
  setStatusFilter?: (s: string) => void;
  statusAmexFilter?: string;
  setStatusAmexFilter?: (s: string) => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenTransferModal: () => void;
  onOpenBatchStatusModal: () => void;
  onBatchDelete: () => void;
  onOpenNewPositionModal: () => void;
  onOpenMatrizModal: () => void;
  onOpenGestorModal: () => void;
  onOpenKardexModal: () => void;
  onOpenSyncTibModal?: () => void;
  onExportExcel: () => void;
  onRefreshData?: () => Promise<void> | void;
  onNewPackage: () => void;
}

export default function InventoryToolbar({
  paquetes,
  filteredPaquetes,
  amexStatusCounts,
  onOpenBulkWrModal,
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
  statusFilter,
  setStatusFilter,
  statusAmexFilter,
  setStatusAmexFilter,
  selectedIds,
  setSelectedIds,
  onOpenTransferModal,
  onOpenBatchStatusModal,
  onBatchDelete,
  onOpenNewPositionModal,
  onOpenMatrizModal,
  onOpenGestorModal,
  onOpenKardexModal,
  onOpenSyncTibModal,
  onExportExcel,
  onRefreshData,
  onNewPackage
}: InventoryToolbarProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    locationFilter !== 'ALL' ||
    shelfFilter !== 'ALL' ||
    floorFilter !== 'ALL' ||
    packageTypeFilter !== 'ALL' ||
    (statusAmexFilter && statusAmexFilter !== 'ALL') ||
    (statusFilter && statusFilter !== 'ALL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Breadcrumb & Header Principal */}
      <div className="sap-breadcrumb">
        <span>Operaciones y Almacenes</span> / <span>3. Inventario</span>
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
            3. Inventario
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Búsquedas en tiempo real, modificaciones de bultos, traslados entre anaqueles/pisos y control de salidas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onOpenSyncTibModal && (
            <button
              className="btn btn-primary"
              onClick={onOpenSyncTibModal}
              title="Cruzar inventario con reportes TIB del día usando el Worker Hostinger"
              style={{
                background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                border: '1px solid #1d4ed8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Zap className="w-4 h-4 text-amber-300" /> ⚡ Cruzar con TIB del Día
            </button>
          )}

          {/* Menú Desplegable de Exportación Modular a Excel */}
          <ExcelExportDropdown
            paquetes={paquetes}
            filteredPaquetes={filteredPaquetes}
            selectedIds={selectedIds}
          />

          {onOpenBulkWrModal && (
            <button
              type="button"
              className="btn"
              onClick={onOpenBulkWrModal}
              title="Pegar lista de Guías WR para cambiar de estado masivamente"
              style={{
                background: '#eff6ff',
                border: '1px solid #93c5fd',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 800
              }}
            >
              <Zap className="w-4 h-4 text-blue-600" /> ⚡ Actualizar por WRs
            </button>
          )}

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
                placeholder="Buscar por Guía WR#, Tracking USA, Consignatario o Estante..."
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

          {/* Píldoras de Segmentación Inmediata por Estado AMEX */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '2px 0'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: '4px' }}>
              Filtro Rápido AMEX:
            </span>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('ALL')}
              style={getPillStyle(statusAmexFilter === 'ALL', '#2563eb', '#eff6ff')}
            >
              🌐 Todos ({amexStatusCounts?.total ?? paquetes.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('recibido')}
              style={getPillStyle(statusAmexFilter === 'recibido', '#0369a1', '#e0f2fe')}
            >
              📥 Recibidos ({amexStatusCounts?.recibido ?? 0})
            </button>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('en_almacen')}
              style={getPillStyle(statusAmexFilter === 'en_almacen', '#3730a3', '#e0e7ff')}
            >
              📦 En Almacén ({amexStatusCounts?.en_almacen ?? 0})
            </button>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('listo_recojo')}
              style={getPillStyle(statusAmexFilter === 'listo_recojo', '#92400e', '#fef3c7')}
            >
              🏪 Listo Recojo ({amexStatusCounts?.listo_recojo ?? 0})
            </button>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('en_ruta')}
              style={getPillStyle(statusAmexFilter === 'en_ruta', '#6b21a8', '#f3e8ff')}
            >
              🚚 En Ruta ({amexStatusCounts?.en_ruta ?? 0})
            </button>

            <button
              type="button"
              onClick={() => setStatusAmexFilter && setStatusAmexFilter('entregado')}
              style={getPillStyle(statusAmexFilter === 'entregado', '#15803d', '#dcfce7')}
            >
              ✅ Entregados ({amexStatusCounts?.entregado ?? 0})
            </button>
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
                <option value="ALL">Todos los Bultos</option>
                <option value="AmexLince">Almacén Central Lince</option>
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

            {statusAmexFilter !== undefined && setStatusAmexFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, color: '#0369a1' }}>Estado AMEX:</span>
                <select
                  value={statusAmexFilter}
                  onChange={e => setStatusAmexFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #93c5fd',
                    fontSize: '12px',
                    background: '#f0f9ff',
                    fontWeight: 700,
                    color: '#0369a1'
                  }}
                >
                  <option value="ALL">Todos los Estados AMEX</option>
                  <option value="recibido">📥 Recibido</option>
                  <option value="en_almacen">📦 En Almacén</option>
                  <option value="listo_recojo">🏪 Listo Recojo</option>
                  <option value="en_ruta">🚚 En Ruta</option>
                  <option value="entregado">✅ Entregado</option>
                </select>
              </div>
            )}

            {statusFilter !== undefined && setStatusFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, color: '#475569' }}>Estado TIB:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    background: '#ffffff'
                  }}
                >
                  <option value="ALL">Todos los Estados TIB</option>
                  <option value="EnAlmacen">En Almacén</option>
                  <option value="ListoParaRecojo">Listo Recojo</option>
                  <option value="EnRutaCarroAmex">En Ruta Carro</option>
                  <option value="EnRutaMotorizado">En Ruta Moto</option>
                  <option value="EnRutaProvincia">En Ruta Provincia</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('ALL');
                  setShelfFilter('ALL');
                  setFloorFilter('ALL');
                  setPackageTypeFilter('ALL');
                  if (setStatusAmexFilter) setStatusAmexFilter('ALL');
                  if (setStatusFilter) setStatusFilter('ALL');
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

const getPillStyle = (
  isActive: boolean,
  activeColor: string,
  activeBg: string
): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '11.5px',
  fontWeight: isActive ? 800 : 600,
  background: isActive ? activeBg : '#f8fafc',
  color: isActive ? activeColor : '#64748b',
  border: isActive ? `1.5px solid ${activeColor}` : '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
});

