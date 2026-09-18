'use client';

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  PackageCheck,
  Building2,
  User,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  DollarSign,
  Trash2,
  Sparkles,
  Bike,
  Receipt,
  Eye,
  Calendar,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  X,
  Users,
  Wallet
} from 'lucide-react';
import {
  ClienteCobroLote,
  ItemCobroWR,
  CotizacionKambista,
  FiltrosCobrosLote,
  ResumenCliente360,
  CobroVoucher,
  Cliente
} from '../types';
import { KambistaService } from '../services/kambista.service';
import { CobroPaymentModal } from './CobroPaymentModal';
import { CobroDeliveryModal } from './CobroDeliveryModal';
import { DirectorioClienteModal } from './DirectorioClienteModal';
import { RegistrarCobroDiarioModal } from './RegistrarCobroDiarioModal';
import { VoucherViewerModal } from '../modals/VoucherViewerModal';

interface CobrosDailySheetViewProps {
  lotes: ClienteCobroLote[];
  availableFechas: string[];
  allClientNames: string[];
  clientes?: Cliente[];
  filtros: FiltrosCobrosLote;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosCobrosLote>>;
  cotizacionKambista: CotizacionKambista;
  onRefreshKambista: () => Promise<CotizacionKambista>;
  onUpdateCotizacionManual: (compra: number, venta: number) => void;
  statsActivas: {
    totalClientes: number;
    totalCorporativos: number;
    totalWrs: number;
    wrsEntregados: number;
    wrsEnAlmacen: number;
    totalUsd: number;
    pagadoUsd: number;
    pendienteUsd: number;
    totalPen: number;
    pagadoPen: number;
    pendientePen: number;
    porcentajeCobrado: number;
  };
  onRegistrarPago: (params: any) => void;
  onRegistrarEntrega: (params: any) => void;
  onToggleGlobalPagoPersona: (loteId: string) => void;
  onToggleGlobalEntregaPersona: (loteId: string) => void;
  onEliminarLotePersona: (loteId: string) => void;
  onGuardarNuevoCobroPersona: (params: any) => void;
  getResumenCliente360: (clienteNombre: string) => ResumenCliente360 | null;
  onOpenImporter?: () => void;
  onOpenVoucherViewer?: (voucher: CobroVoucher) => void;
  onNavigateToClientes360?: (clienteNombre?: string) => void;
  getTarifaCliente?: (clienteNombre: string) => { tarifa: number; personalizada: boolean };
}

export const CobrosDailySheetView: React.FC<CobrosDailySheetViewProps> = ({
  lotes,
  availableFechas,
  allClientNames,
  clientes = [],
  filtros,
  setFiltros,
  cotizacionKambista,
  onRefreshKambista,
  onUpdateCotizacionManual,
  statsActivas,
  onRegistrarPago,
  onRegistrarEntrega,
  onToggleGlobalPagoPersona,
  onToggleGlobalEntregaPersona,
  onEliminarLotePersona,
  onGuardarNuevoCobroPersona,
  getResumenCliente360,
  onOpenImporter,
  onOpenVoucherViewer,
  onNavigateToClientes360,
  getTarifaCliente
}) => {
  const [refreshingTc, setRefreshingTc] = useState(false);
  const [isEditingTc, setIsEditingTc] = useState(false);
  const [manualTcVenta, setManualTcVenta] = useState(cotizacionKambista.venta.toString());

  // Modales activos
  const [isNuevoCobroOpen, setIsNuevoCobroOpen] = useState(false);
  const [selectedLoteForPago, setSelectedLoteForPago] = useState<ClienteCobroLote | null>(null);
  const [selectedLoteForEntrega, setSelectedLoteForEntrega] = useState<ClienteCobroLote | null>(null);
  const [selectedCliente360, setSelectedCliente360] = useState<ResumenCliente360 | null>(null);
  const [internalViewingVoucher, setInternalViewingVoucher] = useState<CobroVoucher | null>(null);

  // Control de expansión/colapso de WRs por fila (por defecto ocultos/colapsados)
  const [expandedWrs, setExpandedWrs] = useState<Record<string, boolean>>({});

  const toggleExpandWr = (loteId: string) => {
    setExpandedWrs((prev) => ({
      ...prev,
      [loteId]: !prev[loteId]
    }));
  };

  const isAllWrsExpanded = useMemo(() => {
    return lotes.length > 0 && lotes.every((l) => Boolean(expandedWrs[l.id]));
  }, [lotes, expandedWrs]);

  const toggleAllWrs = () => {
    if (isAllWrsExpanded) {
      setExpandedWrs({});
    } else {
      const next: Record<string, boolean> = {};
      lotes.forEach((l) => {
        next[l.id] = true;
      });
      setExpandedWrs(next);
    }
  };

  const handleOpenVoucherModal = (voucher: CobroVoucher) => {
    if (onOpenVoucherViewer) {
      onOpenVoucherViewer(voucher);
    } else {
      setInternalViewingVoucher(voucher);
    }
  };

  // Calculadora rápida
  const [calcUsd, setCalcUsd] = useState<string>('20');
  const calcPen = useMemo(() => {
    const num = parseFloat(calcUsd) || 0;
    return (num * cotizacionKambista.venta).toFixed(2);
  }, [calcUsd, cotizacionKambista.venta]);

  const handleRefreshTc = async () => {
    setRefreshingTc(true);
    try {
      await onRefreshKambista();
    } finally {
      setRefreshingTc(false);
    }
  };

  const handleSaveManualTc = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(manualTcVenta);
    if (val && val > 0) {
      onUpdateCotizacionManual(cotizacionKambista.compra, val);
      setIsEditingTc(false);
    }
  };

  // Conversión bidireccional a formato ISO (YYYY-MM-DD) para el selector tipo calendario
  const convertToIso = (f: string) => {
    if (!f || f === 'TODOS') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
    const m = f.match(/(\d{1,2})[.\/-](\d{1,2})/);
    if (m) {
      const dia = m[1].padStart(2, '0');
      const mes = m[2].padStart(2, '0');
      return `2026-${mes}-${dia}`;
    }
    const mSingle = f.match(/(\d{1,2})/);
    if (mSingle) {
      const dia = mSingle[1].padStart(2, '0');
      return `2026-09-${dia}`;
    }
    return '';
  };

  const fechaInputValue = useMemo(() => {
    return convertToIso(filtros.fechaLote);
  }, [filtros.fechaLote]);

  // Indicador si hay algún filtro no predeterminado activo
  const hasActiveFilters = useMemo(() => {
    return (
      filtros.fechaLote !== 'TODOS' ||
      (filtros.mes && filtros.mes !== 'TODOS') ||
      (filtros.tipoPersona && filtros.tipoPersona !== 'TODOS') ||
      (filtros.filtroVoucher && filtros.filtroVoucher !== 'TODOS') ||
      Boolean(filtros.busqueda && filtros.busqueda.trim() !== '') ||
      filtros.estadoPago !== 'TODOS' ||
      filtros.estadoEntrega !== 'TODOS' ||
      filtros.soloCorporativos
    );
  }, [filtros]);

  const handleResetFilters = () => {
    setFiltros({
      fechaLote: 'TODOS',
      mes: 'TODOS',
      tipoPersona: 'TODOS',
      rangoMonto: 'TODOS',
      filtroVoucher: 'TODOS',
      busqueda: '',
      estadoPago: 'TODOS',
      estadoEntrega: 'TODOS',
      soloCorporativos: false
    });
  };

  const handleSelectFecha = (fechaVal: string) => {
    setFiltros((prev) => ({
      ...prev,
      fechaLote: fechaVal,
      mes: 'TODOS'
    }));
  };

  const handleSelectTipoPersona = (val: 'TODOS' | 'PARTICULAR' | 'CORPORATIVO') => {
    setFiltros((prev) => ({
      ...prev,
      tipoPersona: val,
      soloCorporativos: val === 'CORPORATIVO'
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0, maxWidth: '100%' }}>
      {/* 1. BARRA SUPERIOR: ENCABEZADO DE CONTROL + ACCIÓN PRINCIPAL */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          width: '100%',
          minWidth: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#1e293b'
            }}
          >
            <SlidersHorizontal style={{ width: '15px', height: '15px', color: '#2563eb' }} />
            <span>Módulos de Filtros & Control Operativo</span>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#64748b',
              background: '#ffffff',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            Mostrando <strong style={{ color: '#0f172a' }}>{lotes.length}</strong> personas
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#ef4444',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Restablecer todos los filtros"
            >
              <RotateCcw style={{ width: '13px', height: '13px' }} />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        {/* BOTÓN PRINCIPAL + REGISTRAR COBRO A PERSONA */}
        <button
          type="button"
          onClick={() => setIsNuevoCobroOpen(true)}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 800,
            borderRadius: '10px',
            border: 'none',
            boxShadow: '0 2px 5px rgba(37,99,235,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>+ Registrar Cobro a Persona</span>
        </button>
      </div>

      {/* 2. PANEL MODULAR DE FILTROS INTELIGENTES */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
          minWidth: 0
        }}
      >
        {/* FILA A: BUSCADOR UNIVERSAL + SELECTOR DESPLEGABLE DE FECHA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', width: '100%', minWidth: 0 }}>
          {/* BUSCADOR */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search style={{ width: '16px', height: '16px', position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Buscar por persona, empresa, WR (ej: WR000452...), tracking o nota..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: filtros.busqueda ? '32px' : '14px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '12.5px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '9px',
                outline: 'none',
                fontWeight: 500,
                color: '#0f172a',
                transition: 'border-color 0.15s ease'
              }}
            />
            {filtros.busqueda && (
              <button
                type="button"
                onClick={() => setFiltros((prev) => ({ ...prev, busqueda: '' }))}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>

          {/* SELECTOR DESPLEGABLE DE TIPO DE PERSONA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: filtros.tipoPersona && filtros.tipoPersona !== 'TODOS' ? '1px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '4px 10px',
              flexShrink: 0
            }}
          >
            <Users style={{ width: '15px', height: '15px', color: '#2563eb', flexShrink: 0 }} />
            <label htmlFor="tipoPersonaSelect" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Persona:
            </label>
            <select
              id="tipoPersonaSelect"
              value={filtros.tipoPersona || 'TODOS'}
              onChange={(e) => handleSelectTipoPersona(e.target.value as 'TODOS' | 'PARTICULAR' | 'CORPORATIVO')}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: filtros.tipoPersona && filtros.tipoPersona !== 'TODOS' ? '#2563eb' : '#0f172a',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <option value="TODOS">Todas las Personas</option>
              <option value="PARTICULAR">👤 Solo Particulares</option>
              <option value="CORPORATIVO">🏢 Solo Corporativos</option>
            </select>
          </div>

          {/* SELECTOR DESPLEGABLE DE ESTADO DE VOUCHER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: filtros.filtroVoucher && filtros.filtroVoucher !== 'TODOS' ? '1px solid #7c3aed' : '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '4px 10px',
              flexShrink: 0
            }}
          >
            <Receipt style={{ width: '15px', height: '15px', color: '#7c3aed', flexShrink: 0 }} />
            <label htmlFor="voucherSelect" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Voucher:
            </label>
            <select
              id="voucherSelect"
              value={filtros.filtroVoucher || 'TODOS'}
              onChange={(e) => setFiltros((prev) => ({ ...prev, filtroVoucher: e.target.value as any }))}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: filtros.filtroVoucher && filtros.filtroVoucher !== 'TODOS' ? '#7c3aed' : '#0f172a',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <option value="TODOS">Todos los Vouchers</option>
              <option value="CON_VOUCHER">🧾 Con Voucher Adjunto</option>
              <option value="SIN_VOUCHER">🚫 Sin Voucher (Pendientes)</option>
            </select>
          </div>

          {/* SELECTOR DESPLEGABLE DE ESTADO DE PAGO */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: filtros.estadoPago && filtros.estadoPago !== 'TODOS' ? '1px solid #059669' : '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '4px 10px',
              flexShrink: 0
            }}
          >
            <DollarSign style={{ width: '15px', height: '15px', color: '#059669', flexShrink: 0 }} />
            <label htmlFor="pagoSelect" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Pago:
            </label>
            <select
              id="pagoSelect"
              value={filtros.estadoPago || 'TODOS'}
              onChange={(e) => setFiltros((prev) => ({ ...prev, estadoPago: e.target.value as any }))}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: filtros.estadoPago && filtros.estadoPago !== 'TODOS' ? '#059669' : '#0f172a',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <option value="TODOS">Todos los Pagos</option>
              <option value="FALTA">⏳ Falta Pago</option>
              <option value="PAGADO">✓ Pagados</option>
              <option value="PARCIAL">Parciales</option>
            </select>
          </div>

          {/* SELECTOR DESPLEGABLE DE ESTADO DE ENTREGA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: filtros.estadoEntrega && filtros.estadoEntrega !== 'TODOS' ? '1px solid #6366f1' : '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '4px 10px',
              flexShrink: 0
            }}
          >
            <Package style={{ width: '15px', height: '15px', color: '#6366f1', flexShrink: 0 }} />
            <label htmlFor="entregaSelect" style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
              Entrega:
            </label>
            <select
              id="entregaSelect"
              value={filtros.estadoEntrega || 'TODOS'}
              onChange={(e) => setFiltros((prev) => ({ ...prev, estadoEntrega: e.target.value as any }))}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: filtros.estadoEntrega && filtros.estadoEntrega !== 'TODOS' ? '#6366f1' : '#0f172a',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <option value="TODOS">Todas las Entregas</option>
              <option value="EN_ALMACEN">📦 En Almacén</option>
              <option value="ENTREGADO">✓ Entregados</option>
              <option value="PARCIAL">Parciales</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. TARJETAS KPI DE LA SELECCIÓN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', width: '100%', minWidth: 0 }}>
        <div
          style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block' }}>
              Total Facturado
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', display: 'block', marginTop: '2px' }}>
              ${statsActivas.totalUsd.toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', display: 'block' }}>
              &asymp; S/ {statsActivas.totalPen.toFixed(2)}
            </span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#475569' }}>
            {statsActivas.totalClientes} personas
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', display: 'block' }}>
              Total Cobrado ({statsActivas.porcentajeCobrado}%)
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#059669', display: 'block', marginTop: '2px' }}>
              ${statsActivas.pagadoUsd.toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#047857', opacity: 0.8, display: 'block' }}>
              &asymp; S/ {statsActivas.pagadoPen.toFixed(2)}
            </span>
          </div>
          <CheckCircle2 style={{ width: '20px', height: '20px', color: '#059669', opacity: 0.7 }} />
        </div>

        <div
          style={{
            background: statsActivas.pendienteUsd > 0 ? '#fffbeb' : '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            border: statsActivas.pendienteUsd > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', display: 'block' }}>
              Pendiente de Cobro (Falta)
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#b45309', display: 'block', marginTop: '2px' }}>
              ${statsActivas.pendienteUsd.toFixed(2)}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#92400e', opacity: 0.8, display: 'block' }}>
              &asymp; S/ {statsActivas.pendientePen.toFixed(2)}
            </span>
          </div>
          <AlertCircle style={{ width: '20px', height: '20px', color: '#b45309', opacity: 0.7 }} />
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', display: 'block' }}>
              Warehouses Asignados
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace', color: '#0f172a', display: 'block', marginTop: '2px' }}>
              {statsActivas.totalWrs} WRs
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 700, marginTop: '2px' }}>
              <span style={{ color: '#7c3aed' }}>{statsActivas.wrsEntregados} entregados</span>
              <span style={{ color: '#94a3b8' }}>&bull;</span>
              <span style={{ color: '#475569' }}>{statsActivas.wrsEnAlmacen} en almacén</span>
            </div>
          </div>
          <Package style={{ width: '20px', height: '20px', color: '#7c3aed', opacity: 0.7 }} />
        </div>
      </div>

      {/* 4. TABLA PRINCIPAL: 1 FILA POR PERSONA / CLIENTE CON SUS WRS AGRUPADOS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%'
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em', userSelect: 'none' }}>
                <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 12px', minWidth: '180px' }}>PERSONA / CLIENTE TITULAR</th>
                <th style={{ padding: '10px 12px', minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>COBROS DE WAREHOUSE (WRs ASIGNADOS)</span>
                    {lotes.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleAllWrs}
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          border: '1px solid #cbd5e1',
                          background: isAllWrsExpanded ? '#f1f5f9' : '#ffffff',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          textTransform: 'none',
                          letterSpacing: 'normal'
                        }}
                        className="hover:bg-slate-100 hover:text-slate-900"
                        title={isAllWrsExpanded ? 'Ocultar WRs de todas las filas' : 'Desplegar todos los WRs'}
                      >
                        {isAllWrsExpanded ? (
                          <>
                            <ChevronUp style={{ width: '11px', height: '11px' }} />
                            <span>Colapsar todo</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown style={{ width: '11px', height: '11px' }} />
                            <span>Desplegar todo</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </th>
                <th style={{ padding: '10px 8px', width: '60px', textAlign: 'center' }}>CANT.</th>
                <th style={{ padding: '10px 12px', width: '80px', textAlign: 'right' }}>PESO</th>
                <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>TOTAL USD ($)</th>
                <th style={{ padding: '10px 12px', width: '110px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                  TOTAL S/ (PEN)
                </th>
                <th style={{ padding: '10px 12px', width: '160px', textAlign: 'center', color: '#7c3aed' }}>
                  VOUCHER / COMPROBANTE
                </th>
                <th style={{ padding: '10px 12px', width: '130px', textAlign: 'center' }}>ESTADO COBRO</th>
                <th style={{ padding: '10px 12px', width: '140px', textAlign: 'center' }}>ENTREGA / RECOJO</th>
                <th style={{ padding: '10px 12px', minWidth: '130px' }}>OBSERVACIONES</th>
                <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {lotes.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
                    <User style={{ width: '32px', height: '32px', color: '#94a3b8', margin: '0 auto 8px auto', opacity: 0.6 }} />
                    <p style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', margin: 0 }}>No hay cobros registrados.</p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Haz clic en el botón azul "+ Registrar Cobro a Persona" superior para agregar uno nuevo.
                    </p>
                  </td>
                </tr>
              ) : (
                lotes.map((lote, loteIdx) => {
                  const totalPen = KambistaService.convertUsdToPen(lote.totalPrecioUsd, cotizacionKambista.venta);
                  const isPaid = lote.estadoGlobalPago === 'PAGADO';
                  const isDelivered = lote.estadoGlobalEntrega === 'ENTREGADO';
                  const isWrExpanded = Boolean(expandedWrs[lote.id]);

                  return (
                    <tr
                      key={lote.id}
                      style={{
                        background: isPaid ? '#ffffff' : '#fffbeb',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* 1. NÚMERO */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '11px' }}>
                        {loteIdx + 1}
                      </td>

                      {/* 2. PERSONA / CLIENTE TITULAR */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            onClick={() => {
                              if (onNavigateToClientes360) {
                                onNavigateToClientes360(lote.clienteNombre);
                              } else {
                                const res = getResumenCliente360(lote.clienteNombre);
                                if (res) setSelectedCliente360(res);
                              }
                            }}
                            style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            className="hover:text-blue-600"
                            title="Abrir expediente en Directorio de Clientes"
                          >
                            {lote.clienteNombre}
                            <ExternalLink style={{ width: '12px', height: '12px', opacity: 0.5, color: '#2563eb' }} />
                          </span>

                          {onNavigateToClientes360 && (
                            <button
                              type="button"
                              onClick={() => onNavigateToClientes360(lote.clienteNombre)}
                              title="Abrir en Directorio de Clientes"
                              style={{
                                padding: '1px 6px',
                                fontSize: '9.5px',
                                fontWeight: 800,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Users style={{ width: '10px', height: '10px' }} />
                              Directorio
                            </button>
                          )}

                          {lote.esCorporativo && (
                            <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                              CORPORATIVO
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. COBROS DE WAREHOUSE (WRs ASIGNADOS A ESTA PERSONA) */}
                      <td style={{ padding: '10px 12px' }}>
                        {!isWrExpanded ? (
                          /* ESTADO COLAPSADO (POR DEFECTO): Solo muestra la cantidad y botón para desplegar */
                          <button
                            type="button"
                            onClick={() => toggleExpandWr(lote.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            className="hover:bg-slate-100 hover:border-slate-400"
                            title="Hacer clic para ver todos los WRs relacionados a este cobro"
                          >
                            <Package style={{ width: '13px', height: '13px', color: '#6366f1', flexShrink: 0 }} />
                            <span>
                              {lote.itemsWR.length} {lote.itemsWR.length === 1 ? 'WR' : 'WRs'}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#4338ca',
                                background: '#e0e7ff',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              Ver WRs <ChevronDown style={{ width: '11px', height: '11px' }} />
                            </span>
                          </button>
                        ) : (
                          /* ESTADO DESPLEGADO: Muestra botón de ocultar y el detalle de todos los WRs */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <button
                                type="button"
                                onClick={() => toggleExpandWr(lote.id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #bfdbfe',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                className="hover:bg-blue-100"
                                title="Ocultar detalle de WRs"
                              >
                                <Package style={{ width: '12px', height: '12px', color: '#2563eb' }} />
                                <span>
                                  {lote.itemsWR.length} {lote.itemsWR.length === 1 ? 'WR' : 'WRs'}
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    color: '#2563eb',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}
                                >
                                  Ocultar <ChevronUp style={{ width: '11px', height: '11px' }} />
                                </span>
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                              {lote.itemsWR.map((wr) => {
                                const wrPen = (wr.precioUsd * cotizacionKambista.venta).toFixed(2);
                                return (
                                  <div
                                    key={wr.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '11px',
                                      fontFamily: 'monospace',
                                      border: wr.estadoPago === 'PAGADO' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                                      background: wr.estadoPago === 'PAGADO' ? '#ecfdf5' : '#fffbeb',
                                      color: wr.estadoPago === 'PAGADO' ? '#065f46' : '#92400e'
                                    }}
                                    title={`WR: ${wr.wr} | Peso: ${wr.pesoKg} kg | Tarifa: $${wr.precioUsd} (S/ ${wrPen}) ${
                                      wr.consignatarioNombre ? `| Para: ${wr.consignatarioNombre}` : ''
                                    }`}
                                  >
                                    <span style={{ fontWeight: 800 }}>{wr.wr}</span>
                                    <span style={{ color: '#94a3b8' }}>·</span>
                                    <span>{wr.pesoKg.toFixed(2)}kg</span>
                                    <span style={{ color: '#94a3b8' }}>·</span>
                                    <span style={{ fontWeight: 800 }}>${wr.precioUsd.toFixed(2)}</span>

                                    {wr.consignatarioNombre && lote.esCorporativo && (
                                      <span style={{ fontSize: '9.5px', padding: '1px 5px', background: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontFamily: 'sans-serif', fontWeight: 700 }}>
                                        {wr.consignatarioNombre}
                                      </span>
                                    )}

                                    {wr.cajaNumero && (
                                      <span style={{ fontSize: '9.5px', padding: '1px 5px', background: '#f1f5f9', color: '#475569', borderRadius: '4px' }}>
                                        Caja {wr.cajaNumero}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. CANTIDAD DE WRS */}
                      <td
                        style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleExpandWr(lote.id)}
                        title="Clic para desplegar / ocultar WRs"
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: isWrExpanded ? '#eff6ff' : '#f1f5f9',
                            color: isWrExpanded ? '#1d4ed8' : '#475569',
                            border: isWrExpanded ? '1px solid #bfdbfe' : '1px solid #e2e8f0'
                          }}
                        >
                          {lote.itemsWR.length}
                        </span>
                      </td>

                      {/* 5. PESO TOTAL */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#334155' }}>
                        {lote.totalPesoKg.toFixed(2)} kg
                      </td>

                      {/* 6. TOTAL USD ($) */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 900, color: '#0f172a', fontSize: '13px' }}>
                        ${lote.totalPrecioUsd.toFixed(2)}
                      </td>

                      {/* 7. TOTAL SOLES (S/) CON KAMBISTA */}
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#059669', fontSize: '13px' }}>
                        S/ {totalPen.toFixed(2)}
                      </td>

                      {/* 8. VOUCHER / COMPROBANTE DE PAGO BANCARIO */}
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {(() => {
                          const hasVouchers = Boolean(
                            (lote.vouchersList && lote.vouchersList.length > 0) || lote.comprobanteUrl
                          );

                          const vouchersToShow =
                            lote.vouchersList && lote.vouchersList.length > 0
                              ? lote.vouchersList
                              : lote.comprobanteUrl
                              ? [
                                  {
                                    id: `vouc_${lote.id}`,
                                    codigoCobro: 'VOU-' + lote.id.slice(-5),
                                    metodoPago: lote.metodoPago || 'BCP',
                                    moneda: 'USD' as const,
                                    monto: lote.totalPagadoUsd || lote.totalPrecioUsd,
                                    numeroOperacion: lote.numeroOperacion,
                                    voucherUrl: lote.comprobanteUrl,
                                    wrsLiquidados: lote.itemsWR.map((w) => w.wr),
                                    fecha: lote.actualizadoEn,
                                    registradoPor: 'Caja AMEX'
                                  }
                                ]
                              : [];

                          if (hasVouchers && vouchersToShow.length > 0) {
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                {vouchersToShow.map((vouch, vIdx) => {
                                  const isYape = vouch.metodoPago === 'YAPE';
                                  const isBcp = vouch.metodoPago === 'BCP';
                                  const isPlin = vouch.metodoPago === 'PLIN';

                                  return (
                                    <button
                                      key={vIdx}
                                      type="button"
                                      onClick={() =>
                                        handleOpenVoucherModal({
                                          id: vouch.id,
                                          codigo_cobro: vouch.codigoCobro,
                                          cliente_nombre: lote.clienteNombre,
                                          monto: vouch.monto,
                                          moneda: vouch.moneda,
                                          metodo_pago: vouch.metodoPago,
                                          numero_operacion: vouch.numeroOperacion,
                                          voucher_url: vouch.voucherUrl,
                                          voucher_key: vouch.voucherKey,
                                          paquetes_wrs: vouch.wrsLiquidados.map((w) => ({
                                            numeroReciboBodega: w
                                          })),
                                          estado: 'VALIDADO',
                                          registrado_por: vouch.registradoPor || 'Caja AMEX',
                                          creado_en: vouch.fecha || new Date().toISOString()
                                        })
                                      }
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        border: isYape
                                          ? '1px solid #d8b4fe'
                                          : isBcp
                                          ? '1px solid #fed7aa'
                                          : isPlin
                                          ? '1px solid #bfdbfe'
                                          : '1px solid #bbf7d0',
                                        background: isYape
                                          ? '#faf5ff'
                                          : isBcp
                                          ? '#fff7ed'
                                          : isPlin
                                          ? '#eff6ff'
                                          : '#f0fdf4',
                                        color: isYape
                                          ? '#7e22ce'
                                          : isBcp
                                          ? '#c2410c'
                                          : isPlin
                                          ? '#1d4ed8'
                                          : '#15803d',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                        whiteSpace: 'nowrap'
                                      }}
                                      title={`Ver comprobante ${vouch.codigoCobro} (${vouch.metodoPago}): ${vouch.wrsLiquidados.join(', ')}`}
                                    >
                                      <Receipt style={{ width: '13px', height: '13px' }} />
                                      <span>{vouch.metodoPago}</span>
                                      <span>·</span>
                                      <span>{vouch.moneda === 'PEN' ? 'S/' : '$'} {Number(vouch.monto).toFixed(2)}</span>
                                      <span style={{ fontSize: '10px', textDecoration: 'underline', marginLeft: '2px' }}>Ver 🔍</span>
                                    </button>
                                  );
                                })}

                                {!isPaid && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLoteForPago(lote)}
                                    style={{
                                      fontSize: '10px',
                                      color: '#059669',
                                      fontWeight: 700,
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textDecoration: 'underline',
                                      padding: '2px'
                                    }}
                                    title="Subir comprobante adicional para los WRs restantes"
                                  >
                                    + Otro voucher
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => setSelectedLoteForPago(lote)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: '1px dashed #cbd5e1',
                                background: '#f8fafc',
                                color: '#475569',
                                transition: 'all 0.15s ease'
                              }}
                              className="hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                              title="Subir o pegar comprobante de pago bancario con los WRs de este cliente"
                            >
                              <Plus style={{ width: '12px', height: '12px', color: '#059669' }} />
                              <span>+ Subir Voucher</span>
                            </button>
                          );
                        })()}
                      </td>

                      {/* 9. ESTADO COBRO (1 CLIC PARA ALTERNAR) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleGlobalPagoPersona(lote.id)}
                          title="Clic para cambiar estado de cobro completo de esta persona"
                          className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300'
                              : lote.estadoGlobalPago === 'PARCIAL'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>✓ PAGADO</span>
                            </>
                          ) : lote.estadoGlobalPago === 'PARCIAL' ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>PARCIAL (${lote.totalPagadoUsd})</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span>✗ FALTA (${lote.totalPendienteUsd})</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 9. ESTADO ENTREGA (1 CLIC PARA ALTERNAR) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleGlobalEntregaPersona(lote.id)}
                          title="Clic para alternar estado de entrega de esta persona"
                          className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 ${
                            isDelivered
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200 border border-purple-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 border border-gray-300'
                          }`}
                        >
                          {isDelivered ? (
                            <>
                              <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>✓ ENTREGADO</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-3.5 h-3.5 text-gray-500" />
                              <span>📦 EN ALMACÉN</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 10. OBSERVACIONES / DETALLES */}
                      <td className="py-3 px-3 text-[11px] text-gray-500 truncate max-w-xs">
                        {lote.observacionesLote || '-'}
                      </td>

                      {/* 11. ACCIONES */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedLoteForPago(lote)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs active:scale-95"
                            title="Cobro detallado (bancos, vouchers, selección de WRs)"
                          >
                            Cobrar
                          </button>
                          <button
                            onClick={() => setSelectedLoteForEntrega(lote)}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold shadow-xs active:scale-95"
                            title="Registrar retiro con motorizado / familiar"
                          >
                            Entrega
                          </button>
                          <button
                            onClick={() => onEliminarLotePersona(lote.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Eliminar este cobro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* PIE DE TOTALES GLOBALES (COMO =SUM() EN EXCEL) */}
            {lotes.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 900, color: '#0f172a', borderTop: '2px solid #cbd5e1', fontSize: '12px' }}>
                  <td colSpan={3} style={{ padding: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', fontWeight: 900 }}>
                    TOTAL GENERAL ({filtros.fechaLote}):
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 800 }}>{statsActivas.totalWrs} WRs</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {lotes.reduce((acc, l) => acc + l.totalPesoKg, 0).toFixed(2)} kg
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', color: '#1d4ed8', fontSize: '13.5px', fontWeight: 900 }}>
                    ${statsActivas.totalUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', color: '#059669', fontSize: '13.5px', fontWeight: 900 }}>
                    S/ {statsActivas.totalPen.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', color: '#7c3aed', fontWeight: 800 }}>
                    {lotes.filter((l) => Boolean(l.comprobanteUrl || (l.vouchersList && l.vouchersList.length > 0))).length} Vouchers
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800 }}>
                    <span style={{ color: '#059669', fontFamily: 'monospace' }}>${statsActivas.pagadoUsd.toFixed(2)}</span>
                    <span style={{ color: '#94a3b8' }}> / </span>
                    <span style={{ color: '#b45309', fontFamily: 'monospace' }}>${statsActivas.pendienteUsd.toFixed(2)}</span>
                  </td>
                  <td colSpan={3} style={{ padding: '12px', textAlign: 'left', fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                    {statsActivas.wrsEntregados} entregados &bull; {statsActivas.wrsEnAlmacen} en almacén
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL REGISTRAR NUEVO COBRO A PERSONA */}
      <RegistrarCobroDiarioModal
        isOpen={isNuevoCobroOpen}
        onClose={() => setIsNuevoCobroOpen(false)}
        availableFechas={availableFechas}
        allClientNames={allClientNames}
        clientes={clientes}
        cotizacionKambista={cotizacionKambista}
        getTarifaCliente={getTarifaCliente}
        onNavigateToClientes={() => {
          setIsNuevoCobroOpen(false);
          if (onNavigateToClientes360) {
            onNavigateToClientes360();
          }
        }}
        onGuardarCobro={onGuardarNuevoCobroPersona}
      />

      {/* MODAL COBRO / LIQUIDACIÓN COMPLETO */}
      <CobroPaymentModal
        isOpen={Boolean(selectedLoteForPago)}
        onClose={() => setSelectedLoteForPago(null)}
        lote={selectedLoteForPago}
        cotizacionKambista={cotizacionKambista}
        onConfirmPago={onRegistrarPago}
      />

      {/* MODAL ENTREGA / DESPACHO (TITULAR / FAMILIAR / MOTORIZADO) */}
      <CobroDeliveryModal
        isOpen={Boolean(selectedLoteForEntrega)}
        onClose={() => setSelectedLoteForEntrega(null)}
        lote={selectedLoteForEntrega}
        onConfirmEntrega={onRegistrarEntrega}
      />

      {/* MODAL EXPEDIENTE CLIENTE */}
      <DirectorioClienteModal
        isOpen={Boolean(selectedCliente360)}
        onClose={() => setSelectedCliente360(null)}
        clienteResumen={selectedCliente360}
        tcVenta={cotizacionKambista.venta}
      />

      {/* MODAL INTERNO VISOR DE VOUCHER (SI NO SE PASA ONOPEN DESDE PARENT) */}
      <VoucherViewerModal
        voucher={internalViewingVoucher}
        onClose={() => setInternalViewingVoucher(null)}
        onUpdateStatus={() => {}}
      />
    </div>
  );
};
