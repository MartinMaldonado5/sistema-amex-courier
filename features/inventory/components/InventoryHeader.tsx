'use client';

import React, { useState } from 'react';
import { Warehouse, Plus, RefreshCw } from 'lucide-react';
import { Paquete } from '@/types';
import ExcelExportDropdown from './ExcelExportDropdown';
import TibOperationsDropdown from './TibOperationsDropdown';

export interface InventoryHeaderProps {
  paquetes: Paquete[];
  filteredPaquetes: Paquete[];
  selectedIds: string[];
  missingTibImagesCount?: number;
  onOpenSyncTibModal?: () => void;
  onOpenBulkWrModal?: () => void;
  onOpenSyncTibImagesModal?: () => void;
  onExportExcel: () => void;
  onRefreshData?: () => Promise<void> | void;
  onNewPackage: () => void;
}

export default function InventoryHeader({
  paquetes,
  filteredPaquetes,
  selectedIds,
  missingTibImagesCount = 0,
  onOpenSyncTibModal,
  onOpenBulkWrModal,
  onOpenSyncTibImagesModal,
  onRefreshData,
  onNewPackage
}: InventoryHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Lado Izquierdo: Título y Subtítulo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}
          >
            <Warehouse className="w-6 h-6 text-blue-600" />
            3. Inventario
          </h1>
          <span
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#16a34a' }} />
            En Vivo
          </span>
        </div>
        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
          Existencias activas, slotting WMS, custodia física y entregas
        </p>
      </div>

      {/* Lado Derecho: Acciones y Herramientas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Dropdown de Operaciones TIB */}
        <TibOperationsDropdown
          onOpenSyncTibModal={onOpenSyncTibModal}
          onOpenBulkWrModal={onOpenBulkWrModal}
          onOpenSyncTibImagesModal={onOpenSyncTibImagesModal}
          missingTibImagesCount={missingTibImagesCount}
        />

        {/* Dropdown de Exportación Excel */}
        <ExcelExportDropdown
          paquetes={paquetes}
          filteredPaquetes={filteredPaquetes}
          selectedIds={selectedIds}
        />

        {/* Botón Actualizar */}
        {onRefreshData && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isRefreshing ? 'wait' : 'pointer'
            }}
            title="Sincronizar inventario en tiempo real"
          >
            <RefreshCw
              className="w-3.5 h-3.5 text-blue-600"
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        )}

        {/* Botón Principal: Ingresar Paquete */}
        <button
          type="button"
          onClick={onNewPackage}
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            border: 'none',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12.5px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
            cursor: 'pointer'
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Ingresar Paquete</span>
        </button>
      </div>
    </div>
  );
}
