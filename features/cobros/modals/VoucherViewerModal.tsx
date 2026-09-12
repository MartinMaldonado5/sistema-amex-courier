'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  FolderDown,
  Receipt,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { getR2ViewUrl } from '@/lib/r2/client';
import { CobroVoucher } from '../types';

interface VoucherViewerModalProps {
  voucher: CobroVoucher | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: 'VALIDADO' | 'RECHAZADO') => void;
}

export const VoucherViewerModal: React.FC<VoucherViewerModalProps> = ({
  voucher,
  onClose,
  onUpdateStatus
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);

  if (!voucher) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          width: '95%',
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #334155'
        }}
      >
        <div className="modal-header" style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
          <div>
            <span className="modal-title" style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt className="w-5 h-5 text-emerald-400" />
              Voucher: {voucher.codigo_cobro} ({voucher.metodo_pago})
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Cliente: {voucher.cliente_nombre} · Monto: {voucher.moneda === 'PEN' ? 'S/' : '$'} {Number(voucher.monto).toFixed(2)}
            </span>
          </div>

          {/* CONTROLES DE ZOOM Y ROTACIÓN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              className="btn"
              onClick={() => setZoomLevel((prev) => Math.max(0.6, prev - 0.25))}
              title="Alejar"
              style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #475569', padding: '6px 8px' }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="btn"
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
              title="Acercar"
              style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #475569', padding: '6px 8px' }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="btn"
              onClick={() => setRotationAngle((prev) => (prev + 90) % 360)}
              title="Girar 90°"
              style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #475569', padding: '6px 8px' }}
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: '22px', color: '#ffffff', cursor: 'pointer', marginLeft: '6px' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="modal-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#020617',
            minHeight: '420px',
            overflow: 'hidden',
            padding: '16px'
          }}
        >
          <img
            src={getR2ViewUrl(voucher.voucher_url)}
            alt="Comprobante"
            style={{
              maxHeight: '60vh',
              maxWidth: '100%',
              objectFit: 'contain',
              transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
              transition: 'transform 0.15s ease'
            }}
          />
        </div>

        <div
          className="modal-footer"
          style={{
            background: '#0f172a',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            N° Operación: <strong style={{ color: '#ffffff' }}>{voucher.numero_operacion || 'S/N'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={`${getR2ViewUrl(voucher.voucher_url)}${getR2ViewUrl(voucher.voucher_url).includes('?') ? '&' : '?'}download=true`}
              download={`voucher_${voucher.codigo_cobro || 'pago'}.jpg`}
              style={{
                color: '#10b981',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                marginRight: '6px'
              }}
            >
              <FolderDown className="w-4 h-4" /> Descargar
            </a>

            <a
              href={getR2ViewUrl(voucher.voucher_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                marginRight: '8px'
              }}
            >
              <ExternalLink className="w-4 h-4" /> Abrir Imagen
            </a>

            {voucher.estado === 'PENDIENTE' && (
              <button
                className="btn btn-primary"
                onClick={() => onUpdateStatus(voucher.id, 'VALIDADO')}
                style={{ background: '#16a34a', fontWeight: 800 }}
              >
                ✓ Validar y Conciliar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
