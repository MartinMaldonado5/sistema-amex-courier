'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PackageCheck,
  User,
  Users,
  Bike,
  Clock,
  Car,
  FileBadge,
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { ClienteCobroLote, TipoRetirante } from '../types';

interface CobroDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lote: ClienteCobroLote | null;
  onConfirmEntrega: (params: {
    loteId: string;
    wrIdsSeleccionados: string[];
    tipoRetirante: TipoRetirante;
    nombreRetirante: string;
    dniRetirante?: string;
    tipoMotorizado?: 'DIDI' | 'UBER' | 'PEDIDOSYA' | 'PROPIO' | 'OTRO';
    placaVehiculo?: string;
    observaciones?: string;
    registradoPor?: string;
  }) => void;
}

export const CobroDeliveryModal: React.FC<CobroDeliveryModalProps> = ({
  isOpen,
  onClose,
  lote,
  onConfirmEntrega
}) => {
  if (!isOpen || !lote) return null;

  // WRs aún pendientes de entrega en almacén
  const wrsEnAlmacen = useMemo(() => {
    return lote.itemsWR.filter((w) => w.estadoEntrega !== 'ENTREGADO');
  }, [lote]);

  const [selectedWrIds, setSelectedWrIds] = useState<string[]>([]);
  const [tipoRetirante, setTipoRetirante] = useState<TipoRetirante>('TITULAR');
  const [nombreRetirante, setNombreRetirante] = useState('');
  const [dniRetirante, setDniRetirante] = useState('');
  const [tipoMotorizado, setTipoMotorizado] = useState<'DIDI' | 'UBER' | 'PEDIDOSYA' | 'PROPIO' | 'OTRO'>('DIDI');
  const [placaVehiculo, setPlacaVehiculo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Reset al abrir
  useEffect(() => {
    if (wrsEnAlmacen.length > 0) {
      setSelectedWrIds(wrsEnAlmacen.map((w) => w.id));
    } else {
      setSelectedWrIds([]);
    }
    setTipoRetirante('TITULAR');
    setNombreRetirante(lote.clienteNombre);
    setDniRetirante('');
    setPlacaVehiculo('');
    setObservaciones('');
  }, [lote, wrsEnAlmacen]);

  // Si cambia a titular, resetear nombre a titular
  const handleTipoChange = (tipo: TipoRetirante) => {
    setTipoRetirante(tipo);
    if (tipo === 'TITULAR') {
      setNombreRetirante(lote.clienteNombre);
      setDniRetirante('');
    } else if (tipo === 'FAMILIAR') {
      setNombreRetirante('');
      setDniRetirante('');
    } else if (tipo === 'MOTORIZADO') {
      setNombreRetirante('');
      setDniRetirante('');
    }
  };

  const toggleSelectWr = (id: string) => {
    setSelectedWrIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWrIds.length === wrsEnAlmacen.length) {
      setSelectedWrIds([]);
    } else {
      setSelectedWrIds(wrsEnAlmacen.map((w) => w.id));
    }
  };

  // Verificar si hay WRs impagos entre los seleccionados para alertar
  const hasUnpaidSelected = useMemo(() => {
    return lote.itemsWR.some(
      (w) => selectedWrIds.includes(w.id) && w.estadoPago !== 'PAGADO'
    );
  }, [lote.itemsWR, selectedWrIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWrIds.length === 0) {
      alert('Por favor selecciona al menos un paquete para marcar entrega.');
      return;
    }

    if (!nombreRetirante.trim()) {
      alert('Por favor especifica el nombre de quien retira el paquete.');
      return;
    }

    if (hasUnpaidSelected) {
      const confirmUnpaid = window.confirm(
        '¡ATENCIÓN! Algunos paquetes seleccionados aún figuran como PENDIENTES DE PAGO (FALTA). ¿Confirmas que fueron entregados de todas formas?'
      );
      if (!confirmUnpaid) return;
    }

    onConfirmEntrega({
      loteId: lote.id,
      wrIdsSeleccionados: selectedWrIds,
      tipoRetirante,
      nombreRetirante: nombreRetirante.trim(),
      dniRetirante: dniRetirante.trim() || undefined,
      tipoMotorizado: tipoRetirante === 'MOTORIZADO' ? tipoMotorizado : undefined,
      placaVehiculo: placaVehiculo.trim() || undefined,
      observaciones: observaciones.trim() || undefined
    });

    onClose();
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
          maxWidth: '640px',
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
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
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
              <PackageCheck style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                Registrar Entrega Física / Despacho
              </h2>
              <p style={{ fontSize: '12px', color: '#e0e7ff', margin: '2px 0 0 0' }}>
                Cliente: <strong style={{ color: '#ffffff' }}>{lote.clienteNombre}</strong> &bull; Hoja: {lote.fechaLote}
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
          {/* ALERTA SI HAY PAQUETES SIN PAGAR */}
          {hasUnpaidSelected && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#92400e',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <AlertTriangle style={{ width: '18px', height: '18px', color: '#d97706', flexShrink: 0 }} />
              <span>
                <strong>Aviso de Cobranza:</strong> Hay paquetes seleccionados con pago pendiente. Asegúrate de cobrar antes o al momento de entregar.
              </span>
            </div>
          )}

          {/* SELECTOR DE TIPO DE RETIRANTE */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              ¿Quién retira físicamente en almacén?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleTipoChange('TITULAR')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: tipoRetirante === 'TITULAR' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  background: tipoRetirante === 'TITULAR' ? '#eff6ff' : '#f8fafc',
                  color: tipoRetirante === 'TITULAR' ? '#1e40af' : '#475569',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <User style={{ width: '18px', height: '18px' }} />
                <span>Titular en Persona</span>
              </button>

              <button
                type="button"
                onClick={() => handleTipoChange('FAMILIAR')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: tipoRetirante === 'FAMILIAR' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                  background: tipoRetirante === 'FAMILIAR' ? '#f5f3ff' : '#f8fafc',
                  color: tipoRetirante === 'FAMILIAR' ? '#5b21b6' : '#475569',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users style={{ width: '18px', height: '18px' }} />
                <span>Familiar / Tercero</span>
              </button>

              <button
                type="button"
                onClick={() => handleTipoChange('MOTORIZADO')}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: tipoRetirante === 'MOTORIZADO' ? '2px solid #059669' : '1px solid #e2e8f0',
                  background: tipoRetirante === 'MOTORIZADO' ? '#ecfdf5' : '#f8fafc',
                  color: tipoRetirante === 'MOTORIZADO' ? '#065f46' : '#475569',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Bike style={{ width: '18px', height: '18px' }} />
                <span>Motorizado / App</span>
              </button>
            </div>
          </div>

          {/* CAMPOS DEPENDIENTES */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {tipoRetirante === 'MOTORIZADO' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Aplicativo / Servicio
                  </label>
                  <select
                    value={tipoMotorizado}
                    onChange={(e) => setTipoMotorizado(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}
                  >
                    <option value="DIDI">Didi Entrega</option>
                    <option value="UBER">Uber Flash</option>
                    <option value="PEDIDOSYA">PedidosYa Envíos</option>
                    <option value="PROPIO">Motorizado Particular / Propio</option>
                    <option value="OTRO">Otro Servicio</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Placa / Vehículo (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 5821-4B / Moto Honda"
                    value={placaVehiculo}
                    onChange={(e) => setPlacaVehiculo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '12.5px',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  Nombre de quien retira *
                </label>
                <input
                  type="text"
                  required
                  placeholder={tipoRetirante === 'MOTORIZADO' ? 'Ej: Jean Carlos (Conductor Didi)' : 'Nombre y apellido'}
                  value={nombreRetirante}
                  onChange={(e) => setNombreRetirante(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  DNI / Carnet (opcional)
                </label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="Ej: 72918291"
                  value={dniRetirante}
                  onChange={(e) => setDniRetirante(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                    color: '#0f172a'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                Observaciones / Detalle adicional
              </label>
              <input
                type="text"
                placeholder="Ej: Presentó autorización por WhatsApp / Se le entregaron 2 cajas"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12.5px',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* LISTA DE WRs A ENTREGAR */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Paquetes WRs a Despachar ({selectedWrIds.length} seleccionados)
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#4f46e5',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
                className="hover:underline"
              >
                {selectedWrIds.length === wrsEnAlmacen.length ? 'Deseleccionar todos' : 'Seleccionar todos en almacén'}
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
                const isAlreadyDelivered = wrItem.estadoEntrega === 'ENTREGADO';

                return (
                  <div
                    key={wrItem.id}
                    onClick={() => !isAlreadyDelivered && toggleSelectWr(wrItem.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderBottom: '1px solid #f1f5f9',
                      background: isAlreadyDelivered ? '#f8fafc' : isSelected ? '#f5f3ff' : '#ffffff',
                      cursor: isAlreadyDelivered ? 'not-allowed' : 'pointer',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected || isAlreadyDelivered}
                        disabled={isAlreadyDelivered}
                        onChange={() => {}}
                        style={{ width: '15px', height: '15px', accentColor: '#4f46e5', cursor: isAlreadyDelivered ? 'not-allowed' : 'pointer' }}
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
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {wrItem.pesoKg.toFixed(2)} kg &bull; ${wrItem.precioUsd.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <div>
                      {isAlreadyDelivered ? (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: '#64748b' }}>
                          YA ENTREGADO
                        </span>
                      ) : wrItem.estadoPago === 'PAGADO' ? (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#dcfce7', color: '#166534' }}>
                          PAGADO
                        </span>
                      ) : (
                        <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e' }}>
                          FALTA PAGAR
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* FOOTER */}
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
            disabled={selectedWrIds.length === 0}
            style={{
              padding: '9px 20px',
              borderRadius: '10px',
              border: 'none',
              background: selectedWrIds.length === 0 ? '#94a3b8' : '#4f46e5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: selectedWrIds.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedWrIds.length === 0 ? 'none' : '0 2px 6px rgba(79, 70, 229, 0.3)',
              transition: 'background 0.15s ease'
            }}
            className={selectedWrIds.length > 0 ? 'hover:bg-indigo-700' : ''}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            Confirmar Despacho ({selectedWrIds.length} paquetes)
          </button>
        </div>
      </div>
    </div>
  );
};
