'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  User,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { CotizacionKambista } from '../types';
import { KambistaService } from '../services/kambista.service';

interface WrItemDraft {
  wr: string;
  pesoKg: string;
  precioUsd: string;
  cajaNumero?: string;
  consignatarioNombre?: string;
  notas?: string;
}

interface RegistrarCobroDiarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableFechas?: string[];
  allClientNames: string[];
  cotizacionKambista: CotizacionKambista;
  getTarifaCliente?: (clienteNombre: string) => { tarifa: number; personalizada: boolean };
  onGuardarCobro: (params: {
    fechaLote?: string;
    clienteNombre: string;
    esCorporativo?: boolean;
    observaciones?: string;
    itemsWR: Array<{
      wr: string;
      pesoKg: number;
      precioUsd: number;
      cajaNumero?: string;
      consignatarioNombre?: string;
      notas?: string;
    }>;
    estadoInicialPago?: 'PAGADO' | 'FALTA';
    estadoInicialEntrega?: 'EN_ALMACEN' | 'ENTREGADO';
  }) => void;
}

export const RegistrarCobroDiarioModal: React.FC<RegistrarCobroDiarioModalProps> = ({
  isOpen,
  onClose,
  allClientNames,
  cotizacionKambista,
  getTarifaCliente,
  onGuardarCobro
}) => {
  if (!isOpen) return null;

  // Persona / Cliente
  const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo'>('existente');
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [nuevoNombreCliente, setNuevoNombreCliente] = useState('');
  const [esCorporativo, setEsCorporativo] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  // Tarifa por kilo asignada al cliente
  const [tarifaPorKg, setTarifaPorKg] = useState<number>(7.0);

  const clienteFinal = modoCliente === 'existente' ? clienteSeleccionado : nuevoNombreCliente.trim();

  useEffect(() => {
    if (clienteFinal && getTarifaCliente) {
      const info = getTarifaCliente(clienteFinal);
      setTarifaPorKg(info.tarifa);
    }
  }, [clienteFinal, getTarifaCliente]);

  // Estado Inicial
  const [estadoInicialPago, setEstadoInicialPago] = useState<'PAGADO' | 'FALTA'>('FALTA');
  const [estadoInicialEntrega, setEstadoInicialEntrega] = useState<'EN_ALMACEN' | 'ENTREGADO'>('EN_ALMACEN');

  // Lista de WRs asignados a esta persona
  const [itemsWR, setItemsWR] = useState<WrItemDraft[]>([
    { wr: '', pesoKg: '', precioUsd: '', cajaNumero: '', consignatarioNombre: '', notas: '' }
  ]);

  // Filtrar clientes registrados
  const clientesFiltrados = useMemo(() => {
    if (!clienteSearch.trim()) return allClientNames.slice(0, 15);
    const q = clienteSearch.trim().toUpperCase();
    return allClientNames.filter((name) => name.toUpperCase().includes(q)).slice(0, 15);
  }, [allClientNames, clienteSearch]);

  const addWrRow = () => {
    setItemsWR((prev) => [
      ...prev,
      { wr: '', pesoKg: '', precioUsd: '', cajaNumero: '', consignatarioNombre: '', notas: '' }
    ]);
  };

  const removeWrRow = (index: number) => {
    if (itemsWR.length <= 1) return;
    setItemsWR((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWrField = (index: number, field: keyof WrItemDraft, value: string) => {
    setItemsWR((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      // Si cambia el peso y no hay precio, calcular automáticamente según la tarifa asignada al cliente ($/kg)
      if (field === 'pesoKg' && value) {
        const peso = parseFloat(value);
        if (!isNaN(peso) && peso > 0) {
          if (!copy[index].precioUsd) {
            const precioSugerido = Math.round(peso * tarifaPorKg * 100) / 100;
            copy[index].precioUsd = precioSugerido.toFixed(2);
          }
        }
      }

      return copy;
    });
  };

  // Cálculos de totales
  const totalPeso = useMemo(() => {
    return itemsWR.reduce((acc, item) => acc + (parseFloat(item.pesoKg) || 0), 0);
  }, [itemsWR]);

  const totalUsd = useMemo(() => {
    return itemsWR.reduce((acc, item) => acc + (parseFloat(item.precioUsd) || 0), 0);
  }, [itemsWR]);

  const totalPen = useMemo(() => {
    return Math.round(totalUsd * cotizacionKambista.venta * 100) / 100;
  }, [totalUsd, cotizacionKambista.venta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteFinal) {
      alert('Por favor selecciona un cliente registrado o escribe el nombre del nuevo cliente.');
      return;
    }

    const wrsValidos = itemsWR.filter((w) => w.wr.trim().length > 0 || parseFloat(w.pesoKg) > 0);
    if (wrsValidos.length === 0) {
      alert('Por favor ingresa al menos un número de WR o peso para este cobro.');
      return;
    }

    onGuardarCobro({
      fechaLote: new Date().toLocaleDateString('es-PE'),
      clienteNombre: clienteFinal,
      esCorporativo,
      observaciones: observaciones.trim() || undefined,
      itemsWR: wrsValidos.map((w, idx) => ({
        wr: w.wr.trim().toUpperCase() || `WR-${Date.now().toString().slice(-6)}-${idx + 1}`,
        pesoKg: parseFloat(w.pesoKg) || 0,
        precioUsd: parseFloat(w.precioUsd) || 0,
        cajaNumero: w.cajaNumero?.trim() || undefined,
        consignatarioNombre: w.consignatarioNombre?.trim() || undefined,
        notas: w.notas?.trim() || undefined
      })),
      estadoInicialPago,
      estadoInicialEntrega
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '820px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #2563eb 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)'
              }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Registrar Cobro a Cliente</h2>
              <p style={{ fontSize: '12px', color: '#d1fae5', margin: '2px 0 0 0' }}>
                Asigna paquetes de warehouse (WRs) y liquidación directamente al cliente o empresa
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* SELECCIÓN DE PERSONA / REGISTRO DE NUEVA PERSONA */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User style={{ width: '15px', height: '15px', color: '#059669' }} /> ¿A quién le pertenecen estos cobros? (Persona / Empresa)
              </label>

              <div style={{ display: 'flex', backgroundColor: '#ffffff', borderRadius: '8px', padding: '2px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModoCliente('existente')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: modoCliente === 'existente' ? '#2563eb' : 'transparent',
                    color: modoCliente === 'existente' ? '#ffffff' : '#64748b'
                  }}
                >
                  Persona Registrada
                </button>
                <button
                  type="button"
                  onClick={() => setModoCliente('nuevo')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: modoCliente === 'nuevo' ? '#2563eb' : 'transparent',
                    color: modoCliente === 'nuevo' ? '#ffffff' : '#64748b'
                  }}
                >
                  + Nueva Persona
                </button>
              </div>
            </div>

            {modoCliente === 'existente' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ width: '14px', height: '14px', position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Escribe para buscar cliente registrado (ej: FLAVIO, MARYORI, CORP...)..."
                    value={clienteSearch}
                    onChange={(e) => setClienteSearch(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '34px',
                      paddingRight: '12px',
                      paddingTop: '7px',
                      paddingBottom: '7px',
                      fontSize: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '110px',
                    overflowY: 'auto',
                    padding: '6px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  {clientesFiltrados.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setClienteSeleccionado(name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        border: clienteSeleccionado === name ? '1px solid #1d4ed8' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        backgroundColor: clienteSeleccionado === name ? '#2563eb' : '#f1f5f9',
                        color: clienteSeleccionado === name ? '#ffffff' : '#334155'
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>

                {clienteSeleccionado && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                      Cliente: <span style={{ textDecoration: 'underline' }}>{clienteSeleccionado}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Tarifa:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '12px', color: '#1d4ed8', background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #93c5fd' }}>
                        ${tarifaPorKg.toFixed(2)} USD/kg
                      </span>
                      {[6.0, 7.0, 8.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setTarifaPorKg(preset);
                            setItemsWR((prev) =>
                              prev.map((item) => {
                                const p = parseFloat(item.pesoKg);
                                if (!isNaN(p) && p > 0) {
                                  return { ...item, precioUsd: (Math.round(p * preset * 100) / 100).toFixed(2) };
                                }
                                return item;
                              })
                            );
                          }}
                          style={{
                            fontSize: '10.5px',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '5px',
                            border: tarifaPorKg === preset ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: tarifaPorKg === preset ? '#2563eb' : '#ffffff',
                            color: tarifaPorKg === preset ? '#ffffff' : '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          ${preset.toFixed(0)}/kg
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellido de la nueva persona o empresa..."
                  value={nuevoNombreCliente}
                  onChange={(e) => setNuevoNombreCliente(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a'
                  }}
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={esCorporativo}
                    onChange={(e) => setEsCorporativo(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>¿Es una cuenta corporativa / empresa con varios destinatarios? (ej: CORP. FRAGMANI)</span>
                </label>
              </div>
            )}
          </div>

          {/* ASIGNACIÓN DE WAREHOUSE RECEIPTS (WRs) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package style={{ width: '15px', height: '15px', color: '#059669' }} /> Warehouses (WRs) Asignados a {clienteFinal || 'la persona'}
              </label>
              <button
                type="button"
                onClick={addWrRow}
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#059669',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Agregar otro WR
              </button>
            </div>

            {/* TABLA DE WRs DRAFT */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                  <tr>
                    <th style={{ padding: '8px 12px' }}>CÓDIGO WR *</th>
                    <th style={{ padding: '8px 12px', width: '90px' }}>PESO (kg) *</th>
                    <th style={{ padding: '8px 12px', width: '105px' }}>PRECIO USD ($) *</th>
                    <th style={{ padding: '8px 12px', width: '95px', color: '#059669' }}>SOLES (S/)</th>
                    <th style={{ padding: '8px 12px', width: '80px' }}>CAJA</th>
                    {esCorporativo && <th style={{ padding: '8px 12px' }}>DESTINATARIO</th>}
                    <th style={{ padding: '8px 8px', width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWR.map((wrRow, idx) => {
                    const rowPrice = parseFloat(wrRow.precioUsd) || 0;
                    const rowPen = (rowPrice * cotizacionKambista.venta).toFixed(2);

                    return (
                      <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="text"
                            placeholder="Ej: WR000459529"
                            value={wrRow.wr}
                            onChange={(e) => updateWrField(idx, 'wr', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0f172a',
                              backgroundColor: '#ffffff'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 2.50"
                            value={wrRow.pesoKg}
                            onChange={(e) => updateWrField(idx, 'pesoKg', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0f172a',
                              backgroundColor: '#ffffff',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={wrRow.precioUsd}
                            onChange={(e) => updateWrField(idx, 'precioUsd', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0f172a',
                              backgroundColor: '#ffffff',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                          S/ {rowPen}
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <input
                            type="text"
                            placeholder="Caja"
                            value={wrRow.cajaNumero || ''}
                            onChange={(e) => updateWrField(idx, 'cajaNumero', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 6px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0f172a',
                              backgroundColor: '#ffffff',
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        {esCorporativo && (
                          <td style={{ padding: '6px 12px' }}>
                            <input
                              type="text"
                              placeholder="Sub-destinatario"
                              value={wrRow.consignatarioNombre || ''}
                              onChange={(e) => updateWrField(idx, 'consignatarioNombre', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                fontSize: '12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                color: '#0f172a',
                                backgroundColor: '#ffffff'
                              }}
                            />
                          </td>
                        )}
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {itemsWR.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWrRow(idx)}
                              style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BARRA DE TOTALES CALCULADOS */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#14532d' }}>
                Total Asignado a {clienteFinal || 'esta persona'}:
              </span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#4b5563' }}>
                ({itemsWR.length} WRs &bull; {totalPeso.toFixed(2)} kg)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', fontFamily: 'monospace' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                ${totalUsd.toFixed(2)} USD
              </span>
              <span style={{ color: '#94a3b8', fontWeight: 800 }}>&asymp;</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#059669' }}>
                S/ {totalPen.toFixed(2)} PEN
              </span>
            </div>
          </div>

          {/* ESTADO INICIAL Y OBSERVACIONES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                Estado Inicial de Cobro
              </label>
              <select
                value={estadoInicialPago}
                onChange={(e) => setEstadoInicialPago(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a'
                }}
              >
                <option value="FALTA">FALTA (Pendiente de Cobro)</option>
                <option value="PAGADO">PAGADO (Ya abonó)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                Estado de Entrega Física
              </label>
              <select
                value={estadoInicialEntrega}
                onChange={(e) => setEstadoInicialEntrega(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a'
                }}
              >
                <option value="EN_ALMACEN">EN ALMACÉN (Pendiente de recojo)</option>
                <option value="ENTREGADO">ENTREGADO (Ya retiró)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
              Observaciones / Notas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Pagará en efectivo cuando recoja motorizado de Didi"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a'
              }}
            />
          </div>
        </form>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#64748b',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              color: '#ffffff',
              backgroundColor: '#059669',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
            }}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px' }} />
            Guardar Cobro para {clienteFinal || 'Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};
