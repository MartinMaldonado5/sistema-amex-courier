'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Plus,
  Receipt,
  RefreshCw,
  Search
} from 'lucide-react';
import { CobrosMetrics, CobrosSubtab, CobroVoucher } from '../types';
import { CobrosService } from '../services/cobros.service';

interface CobrosToolbarProps {
  metrics: CobrosMetrics;
  subtab: CobrosSubtab;
  setSubtab: (subtab: CobrosSubtab) => void;
  refreshing: boolean;
  onRefresh: () => void;
  allCobros: CobroVoucher[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  methodFilter: string;
  setMethodFilter: (method: string) => void;
}

export const CobrosToolbar: React.FC<CobrosToolbarProps> = ({
  metrics,
  subtab,
  setSubtab,
  refreshing,
  onRefresh,
  allCobros,
  searchTerm,
  setSearchTerm,
  methodFilter,
  setMethodFilter
}) => {
  return (
    <>
      {/* CABECERA PRINCIPAL */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Receipt className="w-7 h-7 text-emerald-600" /> Cobros & Vouchers de WhatsApp
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Pega con <strong style={{ color: '#0f172a' }}>Ctrl + V</strong> o arrastra comprobantes de Yape, Plin y BCP desde WhatsApp Web directamente a Cloudflare R2
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn"
            onClick={onRefresh}
            disabled={refreshing}
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
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Actualizar
          </button>

          <button
            className="btn"
            onClick={() => CobrosService.exportToExcel(allCobros)}
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Excel (.xlsx)
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setSubtab('nuevo')}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800
            }}
          >
            <Plus className="w-4 h-4" /> Registrar Voucher (Ctrl+V)
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '2px'
        }}
      >
        <button
          onClick={() => setSubtab('todos')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 800,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: subtab === 'todos' ? '#059669' : '#64748b',
            borderBottom: subtab === 'todos' ? '3px solid #059669' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Receipt className="w-4 h-4" /> Todos los Vouchers ({metrics.totalVouchers})
        </button>

        <button
          onClick={() => setSubtab('nuevo')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 800,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: subtab === 'nuevo' ? '#059669' : '#64748b',
            borderBottom: subtab === 'nuevo' ? '3px solid #059669' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus className="w-4 h-4" /> 📋 Pegar Voucher WhatsApp (Ctrl + V)
        </button>

        <button
          onClick={() => setSubtab('pendientes')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 800,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: subtab === 'pendientes' ? '#059669' : '#64748b',
            borderBottom: subtab === 'pendientes' ? '3px solid #059669' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Clock className="w-4 h-4" /> Pendientes ({metrics.countPendientes})
        </button>

        <button
          onClick={() => setSubtab('validados')}
          style={{
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 800,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: subtab === 'validados' ? '#059669' : '#64748b',
            borderBottom: subtab === 'validados' ? '3px solid #059669' : '3px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Validados ({metrics.countValidados})
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRO CUANDO NO ESTÁ EN NUEVO */}
      {subtab !== 'nuevo' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              className="w-4 h-4 text-slate-400"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Buscar por Código VOU-, Cliente, N° Operación, WR o Teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Método:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="form-control"
              style={{ height: '40px', fontSize: '13px', width: 'auto' }}
            >
              <option value="ALL">Todos los Métodos</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
              <option value="BCP">BCP</option>
              <option value="INTERBANK">Interbank</option>
              <option value="BBVA">BBVA</option>
              <option value="EFECTIVO">Efectivo</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};
