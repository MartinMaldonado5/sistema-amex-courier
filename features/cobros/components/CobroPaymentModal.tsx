'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  Hash,
  FileText,
  AlertCircle,
  Sparkles,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Trash2,
  Receipt,
  Check
} from 'lucide-react';
import { ClienteCobroLote, ItemCobroWR, CotizacionKambista, MetodoPagoCobro, VoucherCobroItem } from '../types';
import { KambistaService } from '../services/kambista.service';
import { CobrosService } from '../services/cobros.service';

interface CobroPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: ClienteCobroLote | null;
  cotizacionKambista: CotizacionKambista;
  onConfirmPago: (params: {
    loteId: string;
    wrIdsSeleccionados: string[];
    moneda: 'USD' | 'PEN';
    montoTotalPagado: number;
    metodoPago: MetodoPagoCobro;
    numeroOperacion?: string;
    comprobanteUrl?: string;
    voucherKey?: string;
    tipoCambioUsado?: number;
    notas?: string;
    voucherItem?: VoucherCobroItem;
  }) => void;
}

export const CobroPaymentModal: React.FC<CobroPaymentModalProps> = ({
  isOpen,
  onClose,
  lote,
  cotizacionKambista,
  onConfirmPago
}) => {
  if (!isOpen || !lote) return null;

  // Lista de WRs pendientes de pago en este lote
  const wrsPendientes = useMemo(() => {
    return lote.itemsWR.filter((w) => w.estadoPago !== 'PAGADO');
  }, [lote]);

  // Selección de WRs por ID (por defecto se seleccionan todos los pendientes)
  const [selectedWrIds, setSelectedWrIds] = useState<string[]>([]);
  const [moneda, setMoneda] = useState<'USD' | 'PEN'>('USD');
  const [tipoCambio, setTipoCambio] = useState<number>(cotizacionKambista.venta || 3.775);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoCobro>('BCP');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [notas, setNotas] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');

  // Estados para subida de Voucher de Pago (WhatsApp / Arrastrar / Pegar)
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar selección inicial
  useEffect(() => {
    if (wrsPendientes.length > 0) {
      setSelectedWrIds(wrsPendientes.map((w) => w.id));
    } else {
      setSelectedWrIds(lote.itemsWR.map((w) => w.id));
    }
    setTipoCambio(cotizacionKambista.venta || 3.775);
    setMoneda('USD');
    setNumeroOperacion('');
    setNotas('');
    setComprobanteUrl(lote.comprobanteUrl || '');
    setVoucherFile(null);
    setVoucherPreviewUrl(lote.comprobanteUrl || null);
    setIsSubmitting(false);
  }, [lote, wrsPendientes, cotizacionKambista.venta]);

  // Procesar archivo de imagen
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('El archivo pegado o arrastrado debe ser una imagen (JPG, PNG, WEBP).');
      return;
    }
    setVoucherFile(file);
    const preview = URL.createObjectURL(file);
    setVoucherPreviewUrl(preview);
  }, []);

  // Captura global de Ctrl + V mientras el modal está abierto
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processImageFile]);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedWrIds.length === wrsPendientes.length) {
      setSelectedWrIds([]);
    } else {
      setSelectedWrIds(wrsPendientes.map((w) => w.id));
    }
  };

  const toggleSelectWr = (id: string) => {
    setSelectedWrIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Cálculo de totales según WRs seleccionados
  const totalSeleccionadoUsd = useMemo(() => {
    let total = 0;
    lote.itemsWR.forEach((w) => {
      if (selectedWrIds.includes(w.id)) {
        total += w.precioUsd;
      }
    });
    return Math.round(total * 100) / 100;
  }, [lote.itemsWR, selectedWrIds]);

  const totalSeleccionadoPen = useMemo(() => {
    return Math.round(totalSeleccionadoUsd * tipoCambio * 100) / 100;
  }, [totalSeleccionadoUsd, tipoCambio]);

  const totalPesoSeleccionado = useMemo(() => {
    let peso = 0;
    lote.itemsWR.forEach((w) => {
      if (selectedWrIds.includes(w.id)) {
        peso += w.pesoKg;
      }
    });
    return Math.round(peso * 100) / 100;
  }, [lote.itemsWR, selectedWrIds]);

  // Convertir archivo a Data URL como respaldo offline
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWrIds.length === 0) {
      alert('Por favor selecciona al menos un WR para liquidar el pago.');
      return;
    }

    setIsSubmitting(true);

    try {
      const montoFinal = moneda === 'USD' ? totalSeleccionadoUsd : totalSeleccionadoPen;
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const codigoCobro = `VOU-${todayStr}-${randomSeq}`;

      let finalVoucherUrl = comprobanteUrl || '';
      let finalVoucherKey = '';

      // Si hay archivo de voucher nuevo, subir a Cloudflare R2 con fallback
      if (voucherFile) {
        try {
          const uploadRes = await CobrosService.uploadVoucherImage({
            file: voucherFile,
            codigoCobro,
            clienteNombre: lote.clienteNombre,
            metodoPago
          });
          finalVoucherUrl = uploadRes.url;
          finalVoucherKey = uploadRes.key;
        } catch (uploadErr) {
          console.warn('R2 upload failed, using Data URL fallback:', uploadErr);
          finalVoucherUrl = await fileToDataUrl(voucherFile);
        }
      }

      // WRs seleccionados para el comprobante
      const selectedWrsObjects = lote.itemsWR.filter((w) => selectedWrIds.includes(w.id));
      const selectedWrsCodes = selectedWrsObjects.map((w) => w.wr);

      // Crear objeto VoucherCobroItem
      const voucherItem: VoucherCobroItem | undefined = finalVoucherUrl
        ? {
            id: `vouc_${Date.now()}`,
            codigoCobro,
            voucherUrl: finalVoucherUrl,
            voucherKey: finalVoucherKey || undefined,
            metodoPago,
            moneda,
            monto: montoFinal,
            numeroOperacion: numeroOperacion.trim() || undefined,
            fecha: new Date().toLocaleDateString('es-PE'),
            wrsLiquidados: selectedWrsCodes,
            registradoPor: 'Caja AMEX Diaria',
            notas: notas.trim() || undefined
          }
        : undefined;

      // Sincronizar comprobante con Supabase si existe URL
      if (finalVoucherUrl) {
        CobrosService.saveVoucher({
          codigo_cobro: codigoCobro,
          cliente_nombre: lote.clienteNombre,
          monto: montoFinal,
          moneda,
          metodo_pago: metodoPago,
          numero_operacion: numeroOperacion.trim() || `OP-${Date.now().toString().slice(-6)}`,
          fecha_operacion: new Date().toISOString().slice(0, 10),
          voucher_url: finalVoucherUrl,
          voucher_key: finalVoucherKey,
          paquetes_wrs: selectedWrsCodes.map((wrCode) => ({ numeroReciboBodega: wrCode })),
          estado: 'VALIDADO',
          registrado_por: 'Caja AMEX Diaria',
          notas: notas.trim() || undefined,
          creado_en: new Date().toISOString()
        }).catch((err) => {
          console.warn('Sync to Supabase cobros_vouchers failed (running in offline mode):', err);
        });
      }

      onConfirmPago({
        loteId: lote.id,
        wrIdsSeleccionados: selectedWrIds,
        moneda,
        montoTotalPagado: montoFinal,
        metodoPago,
        numeroOperacion: numeroOperacion.trim() || undefined,
        comprobanteUrl: finalVoucherUrl || undefined,
        voucherKey: finalVoucherKey || undefined,
        tipoCambioUsado: tipoCambio,
        notas: notas.trim() || undefined,
        voucherItem
      });

      onClose();
    } catch (err: any) {
      console.error('Error al registrar cobro y voucher:', err);
      alert('Error al registrar el pago: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Receipt style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                  Cobro & Comprobante de Pago
                </h2>
                {lote.esCorporativo ? (
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '12px', background: '#fef3c7', color: '#92400e' }}>
                    🏢 CORPORATIVO
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' }}>
                    👤 PARTICULAR
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#d1fae5', margin: '2px 0 0 0' }}>
                Cliente: <strong style={{ color: '#ffffff' }}>{lote.clienteNombre}</strong> &bull; {lote.itemsWR.length} {lote.itemsWR.length === 1 ? 'Paquete WR' : 'Paquetes WR'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            className="hover:bg-white/30"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* BANNER CONVERSIÓN & TIPO DE CAMBIO */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Moneda de Pago:
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#4b5563', margin: '2px 0 0 0' }}>
                Tarifa base en <strong>USD ($)</strong> convertida automáticamente a soles.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Segmented Switch USD / PEN */}
              <div style={{ display: 'flex', background: '#ffffff', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => setMoneda('USD')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    background: moneda === 'USD' ? '#2563eb' : 'transparent',
                    color: moneda === 'USD' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda('PEN')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    background: moneda === 'PEN' ? '#059669' : 'transparent',
                    color: moneda === 'PEN' ? '#ffffff' : '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                >
                  S/ Soles
                </button>
              </div>

              {/* TC Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', padding: '3px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b' }}>TC:</span>
                <input
                  type="number"
                  step="0.001"
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '60px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#0f172a',
                    background: 'transparent'
                  }}
                  title="Tipo de cambio referencial"
                />
              </div>
            </div>
          </div>

          {/* LISTA DE WRs SELECCIONABLES */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText style={{ width: '14px', height: '14px', color: '#059669' }} />
                WRs que cubre este cobro ({selectedWrIds.length} de {lote.itemsWR.length})
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:underline"
              >
                {selectedWrIds.length === wrsPendientes.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                maxHeight: '160px',
                overflowY: 'auto',
                background: '#ffffff'
              }}
            >
              {lote.itemsWR.map((wrItem) => {
                const isSelected = selectedWrIds.includes(wrItem.id);
                const isAlreadyPaid = wrItem.estadoPago === 'PAGADO';
                const itemPen = Math.round(wrItem.precioUsd * tipoCambio * 100) / 100;

                return (
                  <div
                    key={wrItem.id}
                    onClick={() => !isAlreadyPaid && toggleSelectWr(wrItem.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      background: isAlreadyPaid ? '#f8fafc' : isSelected ? '#f0fdf4' : '#ffffff',
                      cursor: isAlreadyPaid ? 'not-allowed' : 'pointer',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected || isAlreadyPaid}
                        disabled={isAlreadyPaid}
                        onChange={() => {}}
                        style={{ width: '15px', height: '15px', accentColor: '#059669', cursor: isAlreadyPaid ? 'not-allowed' : 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', color: '#0f172a' }}>
                            {wrItem.wr}
                          </span>
                          {wrItem.cajaNumero && (
                            <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                              Caja {wrItem.cajaNumero}
                            </span>
                          )}
                          {wrItem.consignatarioNombre && lote.esCorporativo && (
                            <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
                              {wrItem.consignatarioNombre}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {wrItem.pesoKg.toFixed(2)} kg {wrItem.notas ? `· ${wrItem.notas}` : ''}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12.5px', color: '#0f172a', display: 'block' }}>
                          ${wrItem.precioUsd.toFixed(2)}
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '10.5px', color: '#059669', display: 'block' }}>
                          S/ {itemPen.toFixed(2)}
                        </span>
                      </div>
                      {isAlreadyPaid ? (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>
                          PAGADO
                        </span>
                      ) : isSelected ? (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                      ) : (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CAJA RESUMEN TOTAL */}
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                Total a Cobrar ({selectedWrIds.length} paquetes &bull; {totalPesoSeleccionado} kg)
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', color: moneda === 'USD' ? '#2563eb' : '#0f172a' }}>
                  ${totalSeleccionadoUsd.toFixed(2)} USD
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>&asymp;</span>
                <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', color: moneda === 'PEN' ? '#059669' : '#475569' }}>
                  S/ {totalSeleccionadoPen.toFixed(2)} PEN
                </span>
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: moneda === 'USD' ? '#dbeafe' : '#dcfce7',
                  color: moneda === 'USD' ? '#1e40af' : '#166534'
                }}
              >
                Liquidando en: {moneda}
              </span>
            </div>
          </div>

          {/* COMPROBANTE BANCARIO / VOUCHER (DRAG & DROP / CTRL + V) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt style={{ width: '14px', height: '14px', color: '#059669' }} />
                Voucher o Comprobante de Pago
              </label>
              <span style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, color: '#334155' }}>
                  Ctrl + V
                </span>
                pega directo de WhatsApp Web
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #059669' : voucherPreviewUrl ? '1px solid #86efac' : '2px dashed #cbd5e1',
                background: isDragging ? '#f0fdf4' : voucherPreviewUrl ? '#f0fdf4' : '#fafafa',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              {voucherPreviewUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={voucherPreviewUrl}
                      alt="Voucher adjunto"
                      style={{
                        maxHeight: '120px',
                        maxWidth: '220px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        objectFit: 'contain',
                        background: '#ffffff'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherFile(null);
                        setVoucherPreviewUrl(null);
                        setComprobanteUrl('');
                      }}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Quitar voucher"
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                    </button>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#166534', fontWeight: 800, fontSize: '12px' }}>
                      <Check style={{ width: '14px', height: '14px' }} /> Comprobante Listo
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                      {voucherFile?.name || 'Comprobante asociado a este cobro'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }} className="hover:underline">
                        Cambiar imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              processImageFile(e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setVoucherFile(null);
                          setVoucherPreviewUrl(null);
                          setComprobanteUrl('');
                        }}
                        style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                        className="hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <UploadCloud style={{ width: '32px', height: '32px', color: '#94a3b8', margin: '0 auto 6px auto' }} />
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    Arrastra aquí el comprobante o presiona <span style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl + V</span>
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 10px 0' }}>
                    Capturas de pantalla de Yape, Plin, BCP o fotos directas
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        background: '#059669',
                        color: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      className="hover:bg-emerald-700"
                    >
                      <Camera style={{ width: '13px', height: '13px' }} />
                      Tomar Foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            processImageFile(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        background: '#ffffff',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      className="hover:bg-slate-50"
                    >
                      <ImageIcon style={{ width: '13px', height: '13px', color: '#2563eb' }} />
                      Elegir Archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            processImageFile(e.target.files[0]);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DATOS DE PAGO: MÉTODO Y N° OPERACIÓN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                Método de Pago *
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPagoCobro)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none'
                }}
              >
                <option value="YAPE">💜 Yape (BCP)</option>
                <option value="PLIN">💙 Plin (Interbank / BBVA / Scotiabank)</option>
                <option value="BCP">🏦 BCP Transferencia / Depósito</option>
                <option value="INTERBANK">💚 Interbank</option>
                <option value="BBVA">💙 BBVA Continental</option>
                <option value="EFECTIVO">💵 Efectivo en Almacén Lince</option>
                <option value="OTRO">🌐 Otro Medio</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                N° Operación / Referencia (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 04829148 / Ref. Yape"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
              Observaciones / Notas de Pago
            </label>
            <input
              type="text"
              placeholder="Ej: Pago adelantado para recojo en tienda hoy"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '12.5px',
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>
        </form>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer'
            }}
            className="hover:bg-slate-100 hover:text-slate-900"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedWrIds.length === 0 || isSubmitting}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: selectedWrIds.length === 0 || isSubmitting ? '#94a3b8' : '#059669',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: selectedWrIds.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedWrIds.length === 0 || isSubmitting ? 'none' : '0 2px 6px rgba(5, 150, 105, 0.3)',
              transition: 'background 0.15s ease'
            }}
            className={selectedWrIds.length > 0 && !isSubmitting ? 'hover:bg-emerald-700' : ''}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            {isSubmitting
              ? 'Procesando Pago...'
              : `Confirmar Cobro (${moneda === 'USD' ? `$${totalSeleccionadoUsd.toFixed(2)} USD` : `S/ ${totalSeleccionadoPen.toFixed(2)} PEN`})`}
          </button>
        </div>
      </div>
    </div>
  );
};
