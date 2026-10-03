'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Cliente } from '@/types';
import {
  Package,
  X,
  Barcode,
  User,
  Scale,
  DollarSign,
  MapPin,
  Truck,
  Sparkles,
  Check,
  Boxes,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export interface NewPkgFormData {
  numeroReciboBodega: string;
  trackingUsa: string;
  tipoEmpaque: string;
  numeroFactura: string;
  dniConsignatario: string;
  nombreConsignatario: string;
  descripcion: string;
  pesoKg: string;
  valorDeclaradoUsd: string;
  ubicacionActual: string;
  anaquel?: string;
  piso?: string;
  posicionEstante?: string;
  metodoEntrega: string;
  facturaPdfUrl: string;
}

interface NewPackageModalProps {
  form: NewPkgFormData;
  clientes: Cliente[];
  onChange: (form: NewPkgFormData) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  isWarehouseMode?: boolean;
}

export default function NewPackageModal({
  form,
  clientes,
  onChange,
  onSave,
  onClose,
  isWarehouseMode = false
}: NewPackageModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'carga'>('general');
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = (key: keyof NewPkgFormData, value: string) => {
    if (validationError) setValidationError(null);
    onChange({ ...form, [key]: value });
  };

  // Pre-sets de peso rápido
  const WEIGHT_PRESETS = ['0.5', '1.0', '2.5', '5.0', '10.0'];

  // Tipos de empaque con iconos
  const EMPAQUE_OPTIONS = [
    { id: 'CAJA', label: 'Caja', icon: '📦' },
    { id: 'SOBRE', label: 'Sobre', icon: '✉️' },
    { id: 'SACA', label: 'Saca', icon: '🛍️' },
    { id: 'PAQUETE', label: 'Bulto', icon: '🏷️' }
  ];

  // Presets de descripción
  const DESC_PRESETS = [
    'Ropa y Textiles',
    'Calzado Deportivo',
    'Electrónicos / Gadgets',
    'Suplementos / Vitaminas',
    'Repuestos / Accesorios'
  ];

  // Métodos de entrega
  const METODOS_ENTREGA = [
    { id: 'CarroAmexDomicilio', label: 'Reparto Domicilio', icon: '🚚' },
    { id: 'RecojoLince', label: 'Recojo Lince', icon: '🏢' },
    { id: 'AgenciaProvincia', label: 'Provincia', icon: '📦' }
  ];

  // Estantes preconfigurados
  const ESTANTES = [
    { code: 'A1-P1', label: 'Anaquel 1 · Piso 1 (Pesado)', ana: 'A1', pis: 'P1' },
    { code: 'A1-P2', label: 'Anaquel 1 · Piso 2 (Medio)', ana: 'A1', pis: 'P2' },
    { code: 'A1-P3', label: 'Anaquel 1 · Piso 3 (Ligero)', ana: 'A1', pis: 'P3' },
    { code: 'A1-P4', label: 'Anaquel 1 · Piso 4 (Superior)', ana: 'A1', pis: 'P4' },
    { code: 'A2-P1', label: 'Anaquel 2 · Piso 1 (Pesado)', ana: 'A2', pis: 'P1' },
    { code: 'A2-P2', label: 'Anaquel 2 · Piso 2 (Medio)', ana: 'A2', pis: 'P2' },
    { code: 'A2-P3', label: 'Anaquel 2 · Piso 3 (Ligero)', ana: 'A2', pis: 'P3' },
    { code: 'A2-P4', label: 'Anaquel 2 · Piso 4 (Superior)', ana: 'A2', pis: 'P4' },
    { code: 'REC', label: 'Mesa de Recepción Rápida', ana: 'REC', pis: 'P1' },
    { code: 'DSP', label: 'Zona Despacho Inmediato', ana: 'DSP', pis: 'P1' }
  ];

  const currentEstante = form.posicionEstante || (form.anaquel && form.piso ? `${form.anaquel}-${form.piso}` : 'A1-P1');

  // Cálculos en tiempo real
  const previewPeso = parseFloat(form.pesoKg) || 0;
  const previewFlete = previewPeso * 12; // $12 / kg estándar
  const previewAdmin = previewPeso > 0 ? 5 : 0;
  const previewTotalUsd = previewFlete + previewAdmin;
  const previewTotalPen = previewTotalUsd * 3.78; // Tasa de cambio estimada

  // Auto-generador de código WR correlativo
  const handleGenerateNextWr = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    set('numeroReciboBodega', `WR${randomNum}`);
  };

  // Clientes sugeridos por coincidencia de nombre
  const matchingClientes = useMemo(() => {
    const query = form.nombreConsignatario?.trim().toLowerCase() || '';
    if (!query) {
      return clientes.slice(0, 5);
    }
    return clientes
      .filter(c =>
        c.nombre.toLowerCase().includes(query) ||
        (c.apellido && c.apellido.toLowerCase().includes(query)) ||
        (c.documentoIdentidad && c.documentoIdentidad.includes(query))
      )
      .slice(0, 5);
  }, [clientes, form.nombreConsignatario]);

  const handleSelectClient = (c: Cliente) => {
    const fullName = c.nombre + (c.apellido ? ` ${c.apellido}` : '');
    onChange({
      ...form,
      nombreConsignatario: fullName.trim().toUpperCase(),
      dniConsignatario: c.documentoIdentidad || ''
    });
    setValidationError(null);
  };

  // Validación personalizada robusta (sin bloqueos silenciosos entre pestañas)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.numeroReciboBodega?.trim()) {
      setValidationError('Por favor ingrese o auto-genere el número de Guía WR.');
      setActiveTab('general');
      return;
    }

    if (!form.nombreConsignatario?.trim()) {
      setValidationError('Por favor ingrese el nombre del cliente o destinatario.');
      setActiveTab('general');
      return;
    }

    const pesoNum = parseFloat(form.pesoKg);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setValidationError('Por favor ingrese un peso físico válido en kg (mayor a 0).');
      setActiveTab('carga');
      return;
    }

    setValidationError(null);
    onSave(e);
  };

  // Atajos de teclado: Ctrl + Enter para guardar, Esc para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, form]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', width: '100%', maxWidth: '820px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Bar */}
        <div style={{ padding: '14px 20px', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(96,165,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd' }}>
              <Package style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 900, margin: 0 }}>Registrar Paquete WR</h2>
                <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 900, background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }}>
                  Almacén Central Lince · Ingreso
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '2px 0 0 0' }}>Asigna código WR, cliente, peso y ubicación en almacén</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              [Ctrl + Enter para guardar]
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              aria-label="Cerrar modal"
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Interactive Navigation Tabs */}
        <div style={{ padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'general' ? '#2563eb' : '#ffffff',
                color: activeTab === 'general' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'general' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                borderWidth: '1px',
                borderColor: activeTab === 'general' ? '#2563eb' : '#cbd5e1'
              }}
            >
              <Barcode style={{ width: '14px', height: '14px' }} />
              <span>1. Datos del Paquete</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('carga')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'carga' ? '#2563eb' : '#ffffff',
                color: activeTab === 'carga' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'carga' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                borderWidth: '1px',
                borderColor: activeTab === 'carga' ? '#2563eb' : '#cbd5e1'
              }}
            >
              <Scale style={{ width: '14px', height: '14px' }} />
              <span>2. Peso, Valor & Estante</span>
            </button>
          </div>

          {/* Live mini estimate pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, background: '#ffffff', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #cbd5e1' }}>
            <span style={{ color: '#64748b' }}>Flete:</span>
            <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>${previewTotalUsd.toFixed(2)} USD</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#059669', fontFamily: 'monospace' }}>S/ {previewTotalPen.toFixed(2)}</span>
          </div>
        </div>

        {/* Validation error notice */}
        {validationError && (
          <div style={{ margin: '12px 20px 0 20px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ---------------- TAB 1: IDENTIFICACIÓN & CLIENTE ---------------- */}
            <div style={{ display: activeTab === 'general' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Columna Izquierda: Identificación del Paquete */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Barcode style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                      Guía WR # (Recibo de Bodega) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNextWr}
                      style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles style={{ width: '12px', height: '12px', color: '#d97706' }} />
                      Auto-Generar WR
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.numeroReciboBodega}
                    onChange={e => set('numeroReciboBodega', e.target.value.toUpperCase())}
                    placeholder="WR000451"
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', outline: 'none', textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Tracking Carrier USA (FedEx, UPS, USPS, Amazon)
                  </label>
                  <input
                    type="text"
                    value={form.trackingUsa}
                    onChange={e => set('trackingUsa', e.target.value.toUpperCase())}
                    placeholder="Ej: 1Z999AA10123456784 o TBA..."
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Tipo de Empaque
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {EMPAQUE_OPTIONS.map(opt => {
                      const isSelected = form.tipoEmpaque === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => set('tipoEmpaque', opt.id)}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1e40af' : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}
                        >
                          <span style={{ fontSize: '15px' }}>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    N° Factura Proveedor / Invoice ID (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.numeroFactura}
                    onChange={e => set('numeroFactura', e.target.value)}
                    placeholder="Ej: INV-2026-9901"
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Columna Derecha: Cliente & Mercancía (Sin DNI innecesario) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                      Cliente / Destinatario *
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b' }}>Escribe o selecciona</span>
                  </label>

                  <input
                    type="text"
                    value={form.nombreConsignatario}
                    onChange={e => set('nombreConsignatario', e.target.value.toUpperCase())}
                    placeholder="Ej: AMEX JUAN PEREZ o MARIA GARCIA"
                    style={{ width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 800, color: '#0f172a', outline: 'none', textTransform: 'uppercase' }}
                  />

                  {/* Sugerencias rápidas de clientes existentes */}
                  {matchingClientes.length > 0 && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                        Clientes sugeridos:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {matchingClientes.map(c => {
                          const fullName = c.nombre + (c.apellido ? ` ${c.apellido}` : '');
                          const isMatch = form.nombreConsignatario?.toUpperCase() === fullName.toUpperCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectClient(c)}
                              style={{
                                padding: '3px 8px',
                                background: isMatch ? '#eff6ff' : '#f1f5f9',
                                border: isMatch ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: isMatch ? '#1d4ed8' : '#334155',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <User style={{ width: '10px', height: '10px', color: '#3b82f6' }} />
                              <span>{fullName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Descripción del Contenido / Mercancía
                  </label>
                  <input
                    type="text"
                    value={form.descripcion}
                    onChange={e => set('descripcion', e.target.value)}
                    placeholder="Ej: Calzado deportivo, ropa, accesorios..."
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
                  />
                  {/* Botones rápidos de categorías */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {DESC_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => set('descripcion', preset)}
                        style={{
                          padding: '2px 6px',
                          background: form.descripcion === preset ? '#eff6ff' : '#f8fafc',
                          border: form.descripcion === preset ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: form.descripcion === preset ? '#1d4ed8' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Método de Entrega Previsto
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {METODOS_ENTREGA.map(m => {
                      const isSelected = (form.metodoEntrega || 'CarroAmexDomicilio') === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => set('metodoEntrega', m.id)}
                          style={{
                            padding: '6px 4px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            color: isSelected ? '#1e40af' : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10.5px',
                            fontWeight: 800
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- TAB 2: PESO, VALORACIÓN & ESTANTE ---------------- */}
            <div style={{ display: activeTab === 'carga' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Columna Izquierda: Carga y Valor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Scale style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                      Peso Real (Kilogramos) *
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#64748b' }}>$12 USD / kg</span>
                  </div>

                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.pesoKg}
                    onChange={e => set('pesoKg', e.target.value)}
                    placeholder="1.0"
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', outline: 'none' }}
                  />

                  {/* Weight Preset Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Preajustes:</span>
                    {WEIGHT_PRESETS.map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => set('pesoKg', w)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          background: form.pesoKg === w ? '#2563eb' : '#f1f5f9',
                          color: form.pesoKg === w ? '#ffffff' : '#334155'
                        }}
                      >
                        {w} kg
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Valor Declarado / Invoice (USD) (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valorDeclaradoUsd}
                    onChange={e => set('valorDeclaradoUsd', e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Sede / Almacén de Custodia
                  </label>
                  <select
                    value={form.ubicacionActual}
                    onChange={e => set('ubicacionActual', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 700, outline: 'none' }}
                  >
                    <option value="AmexLince">🏢 Almacén Central Lince (Lima)</option>
                  </select>
                </div>
              </div>

              {/* Columna Derecha: Selector de Anaqueles y Ticket de Cotización */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '4px' }}>
                    Posición de Estantería (Lince)
                  </label>

                  {/* Interactive Shelf Matrix Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {ESTANTES.map(est => {
                      const isSelected = currentEstante === est.code;
                      return (
                        <button
                          key={est.code}
                          type="button"
                          onClick={() => {
                            onChange({
                              ...form,
                              anaquel: est.ana,
                              piso: est.pis,
                              posicionEstante: est.code
                            });
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #9333ea' : '1px solid #cbd5e1',
                            background: isSelected ? '#faf5ff' : '#ffffff',
                            color: isSelected ? '#581c87' : '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11.5px',
                            fontWeight: 800
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>{est.code}</span>
                          <span style={{ fontSize: '10.5px', fontWeight: 500, color: '#64748b' }}>{est.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time Rate Ticket Card vs Ficha de Custodia WMS */}
                <div style={{ padding: '14px', background: '#0f172a', color: '#ffffff', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, borderBottom: '1px solid #334155', paddingBottom: '6px', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Boxes style={{ width: '14px', height: '14px', color: '#38bdf8' }} />
                      Ficha de Custodia Almacén
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 900 }}>WMS LINCE</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Peso Físico:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ffffff' }}>{previewPeso.toFixed(2)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Tipo Empaque:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ffffff' }}>{form.tipoEmpaque || 'CAJA'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                      <span>Ubicación Estantería:</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#c084fc' }}>{currentEstante || 'REC (Recepción)'}</span>
                    </div>
                  </div>

                  <div style={{ paddingTop: '6px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '11.5px', color: '#94a3b8' }}>Flete Estimado:</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: '#34d399' }}>
                        ${previewTotalUsd.toFixed(2)} USD
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#94a3b8', marginLeft: '6px' }}>
                        (S/ {previewTotalPen.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer Actions */}
          <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeTab === 'general' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('carga')}
                  style={{ padding: '9px 16px', fontSize: '12px', fontWeight: 800, color: '#ffffff', background: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}
                >
                  <span>Siguiente: Peso & Estante</span>
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 800, color: '#334155', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Volver a Datos
                </button>
              )}

              <button
                type="submit"
                style={{ padding: '9px 18px', fontSize: '12px', fontWeight: 900, color: '#ffffff', background: '#059669', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(5,150,105,0.25)' }}
              >
                <Check style={{ width: '15px', height: '15px', strokeWidth: 3 }} />
                <span>Registrar Paquete WR</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
