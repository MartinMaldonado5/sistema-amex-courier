'use client';

import React from 'react';
import { Eye, Plus, Receipt, RefreshCw } from 'lucide-react';
import { getR2ViewUrl } from '@/lib/r2/client';
import { CobroVoucher, CobrosSubtab } from '../types';

interface CobrosListProps {
  loading: boolean;
  cobros: CobroVoucher[];
  onOpenViewer: (voucher: CobroVoucher) => void;
  onUpdateStatus: (id: string, newStatus: 'VALIDADO' | 'RECHAZADO') => void;
  setSubtab: (subtab: CobrosSubtab) => void;
}

export const CobrosList: React.FC<CobrosListProps> = ({
  loading,
  cobros,
  onOpenViewer,
  onUpdateStatus,
  setSubtab
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontWeight: 700 }}>Cargando vouchers de pago...</div>
      </div>
    );
  }

  if (cobros.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '50px 20px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}
      >
        <Receipt className="w-12 h-12 text-slate-300" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#334155' }}>
          No se encontraron comprobantes de cobro
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Pega cualquier imagen de WhatsApp con <strong>Ctrl + V</strong> para registrar el primer voucher.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => setSubtab('nuevo')}
          style={{ marginTop: '16px', background: '#16a34a' }}
        >
          <Plus className="w-4 h-4" /> Registrar Primer Voucher
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}
    >
      {cobros.map((cobro) => {
        const isVal = cobro.estado === 'VALIDADO';
        const isYape = cobro.metodo_pago === 'YAPE';
        const isPlin = cobro.metodo_pago === 'PLIN';
        const isBcp = cobro.metodo_pago === 'BCP';

        return (
          <div
            key={cobro.id}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* CABECERA DE LA TARJETA */}
            <div
              style={{
                padding: '12px 14px',
                background: isYape ? '#fdf4ff' : isPlin ? '#eff6ff' : isBcp ? '#fff7ed' : '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: isYape ? '#701a75' : isPlin ? '#1e40af' : isBcp ? '#c2410c' : '#334155',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 900
                  }}
                >
                  {cobro.metodo_pago}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>
                  {cobro.codigo_cobro}
                </span>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: isVal ? '#dcfce7' : '#fef3c7',
                  color: isVal ? '#15803d' : '#b45309'
                }}
              >
                {isVal ? '✓ VALIDADO' : '⏳ PENDIENTE'}
              </span>
            </div>

            {/* CUERPO CON MINIATURA DEL VOUCHER Y DETALLES */}
            <div style={{ padding: '14px', display: 'flex', gap: '12px', flex: '1 1 auto' }}>
              <div
                onClick={() => onOpenViewer(cobro)}
                style={{
                  width: '100px',
                  height: '120px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  border: '1px solid #cbd5e1'
                }}
              >
                <img
                  src={getR2ViewUrl(cobro.voucher_url)}
                  alt="Voucher"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    insetInline: '0',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    fontSize: '9.5px',
                    textAlign: 'center',
                    padding: '2px 0',
                    fontWeight: 700
                  }}
                >
                  🔍 Ver Voucher
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#065f46' }}>
                  {cobro.moneda === 'PEN' ? 'S/' : '$'} {Number(cobro.monto || 0).toFixed(2)}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {cobro.cliente_nombre}
                </div>

                {cobro.cliente_casillero && (
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Casillero: <strong>{cobro.cliente_casillero}</strong>
                  </div>
                )}

                {cobro.numero_operacion && (
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    Op: <code style={{ fontWeight: 800, color: '#1e3a8a' }}>{cobro.numero_operacion}</code>
                  </div>
                )}

                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: 'auto' }}>
                  {new Date(cobro.creado_en).toLocaleString('es-PE')}
                </div>
              </div>
            </div>

            {/* WRS ASOCIADOS */}
            {Array.isArray(cobro.paquetes_wrs) && cobro.paquetes_wrs.length > 0 && (
              <div
                style={{
                  padding: '8px 14px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b' }}>WRs:</span>
                {cobro.paquetes_wrs.map((w, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#1e40af'
                    }}
                  >
                    {w.numeroReciboBodega}
                  </span>
                ))}
              </div>
            )}

            {/* FOOTER CON BOTONES DE VALIDACIÓN */}
            <div
              style={{
                padding: '10px 14px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#ffffff'
              }}
            >
              <button
                className="btn"
                onClick={() => onOpenViewer(cobro)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '4px 10px'
                }}
              >
                <Eye className="w-3.5 h-3.5" /> Abrir
              </button>

              {cobro.estado === 'PENDIENTE' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn"
                    onClick={() => onUpdateStatus(cobro.id, 'RECHAZADO')}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '4px 8px'
                    }}
                  >
                    Rechazar
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={() => onUpdateStatus(cobro.id, 'VALIDADO')}
                    style={{
                      background: '#16a34a',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '4px 10px'
                    }}
                  >
                    ✓ Validar
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
