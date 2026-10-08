'use client';

import React, { useState } from 'react';
import { Warehouse, Plus, RefreshCw, Camera, Check, Loader2 } from 'lucide-react';
import { Paquete } from '@/types';
import ExcelExportDropdown from './ExcelExportDropdown';
import TibOperationsDropdown from './TibOperationsDropdown';
import InventoryStatsCards from './InventoryStatsCards';
import { copyPackagesTableAsImage } from '../utils/clipboardTableImage';

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
  statusAmexFilter?: string;
  setStatusAmexFilter?: (status: string) => void;
  children?: React.ReactNode;
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
  onNewPackage,
  statusAmexFilter,
  setStatusAmexFilter,
  children
}: InventoryHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const [copiedCount, setCopiedCount] = useState<number>(0);

  const handleCopyTableImage = async () => {
    if (copyStatus === 'copying') return;
    const targetPackages =
      selectedIds.length > 0
        ? paquetes.filter(p => selectedIds.includes(p.id))
        : filteredPaquetes;

    if (targetPackages.length === 0) {
      alert('No hay paquetes visibles o seleccionados para copiar.');
      return;
    }

    setCopyStatus('copying');
    try {
      const res = await copyPackagesTableAsImage(targetPackages);
      if (res.success) {
        setCopiedCount(res.count);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 3500);
      } else {
        alert(res.error || 'No se pudo copiar la imagen.');
        setCopyStatus('idle');
      }
    } catch {
      setCopyStatus('idle');
    }
  };

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
        alignItems: 'stretch',
        flexWrap: 'wrap',
        gap: '12px 20px'
      }}
    >
      {/* Columna Izquierda: Título en la parte superior y Acciones uniformes en la parte inferior */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '10px',
          flex: '1 1 auto',
          minWidth: '320px'
        }}
      >
        {/* Título y Subtítulo */}
        <div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 900,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}
          >
            <Warehouse className="w-5 h-5 text-blue-600" />
            3. Inventario
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.3 }}>
            Existencias activas, slotting WMS, custodia física y entregas
          </p>
        </div>

        {/* Fila de Herramientas y Acciones Operativas Uniformes */}
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

          {/* Botón Copiar Tabla como Imagen para WhatsApp */}
          <button
            type="button"
            onClick={handleCopyTableImage}
            disabled={copyStatus === 'copying'}
            className="btn"
            style={{
              background: copyStatus === 'copied' ? '#ecfdf5' : '#ffffff',
              border: copyStatus === 'copied' ? '1px solid #10b981' : '1px solid #cbd5e1',
              color: copyStatus === 'copied' ? '#065f46' : '#1e293b',
              height: '33px',
              padding: '0 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: copyStatus === 'copying' ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}
            title={
              selectedIds.length > 0
                ? `Copiar imagen de los ${selectedIds.length} paquetes seleccionados para WhatsApp`
                : `Copiar imagen de los ${filteredPaquetes.length} paquetes visibles para WhatsApp`
            }
          >
            {copyStatus === 'copying' ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : copyStatus === 'copied' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {copyStatus === 'copying'
                ? 'Generando...'
                : copyStatus === 'copied'
                ? `¡Copiado (${copiedCount})!`
                : selectedIds.length > 0
                ? `Copiar Imagen (${selectedIds.length})`
                : 'Copiar Imagen (WhatsApp)'}
            </span>
          </button>

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
                height: '33px',
                padding: '0 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isRefreshing ? 'wait' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
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
              height: '33px',
              padding: '0 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(37,99,235,0.25)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Paquete</span>
          </button>
        </div>

        {/* Fila de Sub-Pestañas de Navegación */}
        {children && (
          <div style={{ marginTop: '2px' }}>
            {children}
          </div>
        )}
      </div>

      {/* Columna Derecha: Tarjetas KPI de Existencias y Custodia Apiladas ocupando la altura total */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <InventoryStatsCards
          paquetes={paquetes}
          statusAmexFilter={statusAmexFilter}
          setStatusAmexFilter={setStatusAmexFilter}
        />
      </div>
    </div>
  );
}
