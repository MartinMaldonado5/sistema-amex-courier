'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Users,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import {
  useCobrosOperaciones,
  VoucherViewerModal,
  CobrosDailySheetView,
  CobrosExcelImporterModal,
  type CobrosTabProps,
  type CobroVoucher
} from '@/features/cobros';

export type { CobroVoucher };

export default function CobrosTab({
  paquetes = [],
  clientes = [],
  onUpdatePackage,
  onNavigateToClientes360,
  filterClienteInicial
}: CobrosTabProps) {
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Hook de Operaciones de Cobros Diarios
  const {
    lotes,
    lotesFiltrados,
    availableFechas,
    filtros,
    setFiltros,
    cotizacionKambista,
    updateCotizacionManual,
    refreshKambistaLive,
    statsActivas,
    registrarPago,
    registrarEntrega,
    toggleGlobalPagoPersona,
    toggleGlobalEntregaPersona,
    eliminarLotePersona,
    registrarNuevoCobroPersona,
    importarLotesDesdeExcel,
    getResumenCliente360,
    getTarifaCliente
  } = useCobrosOperaciones();

  // Sincronizar filtro si se navegó desde Clientes 360 con un cliente específico
  useEffect(() => {
    if (filterClienteInicial) {
      setFiltros((prev) => ({
        ...prev,
        searchQuery: filterClienteInicial
      }));
    }
  }, [filterClienteInicial, setFiltros]);

  // Lista de nombres de clientes
  const allClientNames = useMemo(() => {
    const set = new Set<string>();
    lotes.forEach((l) => {
      if (l.clienteNombre) set.add(l.clienteNombre);
    });
    clientes.forEach((c) => {
      if (c.nombre) set.add(c.nombre);
    });
    return Array.from(set);
  }, [lotes, clientes]);

  // Visor de Voucher modal
  const [viewingVoucher, setViewingVoucher] = useState<CobroVoucher | null>(null);

  const handleRegistrarPago = useCallback(
    (params: any) => {
      registrarPago(params);
    },
    [registrarPago]
  );

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%', width: '100%', margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* 1. BREADCRUMB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
        <span>Operaciones & Finanzas</span> / <span style={{ color: '#059669', fontWeight: 800 }}>4. Cobros & Vouchers Diarios</span>
      </div>

      {/* 2. PANEL CABECERA OPERATIVA CON INTERCONEXIÓN */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          width: '100%'
        }}
      >
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span style={{ display: 'inline-flex', padding: '6px', background: '#ecfdf5', borderRadius: '10px', color: '#059669', border: '1px solid #a7f3d0' }}>
                <DollarSign style={{ width: '22px', height: '22px' }} />
              </span>
              4. Cobros & Operaciones Diarias
            </h1>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0 0' }}>
              Gestión y liquidación de cobros de flete, entrega en almacén/domicilio y comprobantes bancarios
            </p>
          </div>

          {/* ACCIONES SUPERIORES / INTERCONEXIÓN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsImporterOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              className="hover:bg-slate-100"
            >
              <FileSpreadsheet style={{ width: '15px', height: '15px', color: '#059669' }} />
              Importar Excel
            </button>

            {/* BOTÓN INTERCONECTADO: DIRECTORIO CLIENTES 360 */}
            {onNavigateToClientes360 && (
              <button
                type="button"
                onClick={() => onNavigateToClientes360()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(37,99,235,0.1)'
                }}
                className="hover:opacity-95"
              >
                <Users style={{ width: '15px', height: '15px', color: '#2563eb' }} />
                <span>Directorio de Clientes</span>
                <span
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontFamily: 'monospace'
                  }}
                >
                  {allClientNames.length}
                </span>
                <ArrowRight style={{ width: '13px', height: '13px', opacity: 0.6 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. VISTA PRINCIPAL DE OPERACIONES DE COBRO */}
      <CobrosDailySheetView
        lotes={lotesFiltrados}
        availableFechas={availableFechas}
        allClientNames={allClientNames}
        clientes={clientes}
        filtros={filtros}
        setFiltros={setFiltros}
        cotizacionKambista={cotizacionKambista}
        onRefreshKambista={refreshKambistaLive}
        onUpdateCotizacionManual={updateCotizacionManual}
        statsActivas={statsActivas}
        onRegistrarPago={handleRegistrarPago}
        onRegistrarEntrega={registrarEntrega}
        onToggleGlobalPagoPersona={toggleGlobalPagoPersona}
        onToggleGlobalEntregaPersona={toggleGlobalEntregaPersona}
        onEliminarLotePersona={eliminarLotePersona}
        onGuardarNuevoCobroPersona={registrarNuevoCobroPersona}
        getResumenCliente360={getResumenCliente360}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenVoucherViewer={setViewingVoucher}
        onNavigateToClientes360={onNavigateToClientes360}
        getTarifaCliente={getTarifaCliente}
      />

      {/* MODAL GLOBAL: IMPORTADOR EXCEL */}
      <CobrosExcelImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={(nuevosLotes, modo) => {
          importarLotesDesdeExcel(nuevosLotes, modo);
        }}
      />

      {/* MODAL GLOBAL: VISOR DE VOUCHER */}
      <VoucherViewerModal
        voucher={viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        onUpdateStatus={() => {}}
      />
    </div>
  );
}
