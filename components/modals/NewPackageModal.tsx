'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cliente } from '@/types';
import {
  PackagePlus,
  X,
  Barcode,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  isValidWr,
  getWrValidationError,
  smartFormatWr,
  cleanWr,
  WR_LENGTH
} from '@/lib/validations/wr';

export interface NewPkgFormData {
  numeroReciboBodega: string;
  trackingUsa: string;
  tipoEmpaque: string;
  numeroFactura: string;
  dniConsignatario: string;
  nombreConsignatario: string;
  descripcion: string;
  pesoKg: string;
  valorDeclaradoUsd?: string;
  ubicacionActual: string;
  anaquel?: string;
  piso?: string;
  posicionEstante?: string;
  metodoEntrega: string;
  facturaPdfUrl: string;
}

interface NewPackageModalProps {
  form: NewPkgFormData;
  clientes?: Cliente[];
  onChange: (form: NewPkgFormData) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  isWarehouseMode?: boolean;
}

// Ubicaciones más frecuentes en Almacén Lince para selección en 1 clic
const UBICACIONES_RAPIDAS = [
  { code: 'OFI-P1', label: 'Oficina P1', group: 'Especial' },
  { code: 'DSP-Z1', label: 'Despacho Z1', group: 'Despacho' },
  { code: 'DSP-Z2', label: 'Despacho Z2', group: 'Despacho' },
  { code: 'A1-P1', label: 'Anaquel 1 · Piso 1', group: 'A1' },
  { code: 'A1-P2', label: 'Anaquel 1 · Piso 2', group: 'A1' },
  { code: 'A1-P3', label: 'Anaquel 1 · Piso 3', group: 'A1' },
  { code: 'A1-P4', label: 'Anaquel 1 · Piso 4', group: 'A1' },
  { code: 'A2-P1', label: 'Anaquel 2 · Piso 1', group: 'A2' },
  { code: 'A2-P2', label: 'Anaquel 2 · Piso 2', group: 'A2' },
  { code: 'A2-P3', label: 'Anaquel 2 · Piso 3', group: 'A2' },
  { code: 'A2-P4', label: 'Anaquel 2 · Piso 4', group: 'A2' }
];

export default function NewPackageModal({
  form,
  onChange,
  onSave,
  onClose
}: NewPackageModalProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const wrInputRef = useRef<HTMLInputElement>(null);

  const currentWrClean = cleanWr(form.numeroReciboBodega);
  const isWrValid = isValidWr(currentWrClean);
  const wrLength = currentWrClean.length;

  // Ubicación actual seleccionada
  const currentUbicacion = form.posicionEstante || (form.anaquel && form.piso ? `${form.anaquel}-${form.piso}` : 'OFI-P1');

  // Autofoco inmediato en el campo WR al abrir
  useEffect(() => {
    const timer = setTimeout(() => {
      wrInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const setField = (key: keyof NewPkgFormData, value: string) => {
    if (validationError) setValidationError(null);
    onChange({ ...form, [key]: value });
  };

  const handleSelectUbicacion = (code: string) => {
    const [ana, pis] = code.includes('-') ? code.split('-') : [code, 'P1'];
    onChange({
      ...form,
      posicionEstante: code,
      anaquel: ana,
      piso: pis,
      ubicacionActual: 'AmexLince'
    });
    if (validationError) setValidationError(null);
  };

  // Validación estricta: WR debe tener 11 caracteres y comenzar por WR
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const wrError = getWrValidationError(form.numeroReciboBodega);
    if (wrError) {
      setValidationError(wrError);
      wrInputRef.current?.focus();
      return;
    }

    const clean = cleanWr(form.numeroReciboBodega);

    // Asegurar valores por defecto para el flujo TIB posterior
    const [ana, pis] = currentUbicacion.includes('-') ? currentUbicacion.split('-') : [currentUbicacion, 'P1'];
    onChange({
      ...form,
      numeroReciboBodega: clean,
      posicionEstante: currentUbicacion,
      anaquel: ana,
      piso: pis,
      ubicacionActual: form.ubicacionActual || 'AmexLince',
      nombreConsignatario: form.nombreConsignatario || 'PENDIENTE ASIGNACIÓN TIB',
      tipoEmpaque: form.tipoEmpaque || 'CAJA',
      pesoKg: form.pesoKg || '0'
    });

    setValidationError(null);
    onSave(e);
  };

  // Atajos de teclado: Enter para registrar, Esc para cancelar
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
  }, [onClose, form, currentUbicacion]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Elegante y Profesional */}
        <div
          style={{
            padding: '16px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dbeafe',
                flexShrink: 0
              }}
            >
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.2
                }}
              >
                Ingreso de Paquete WR
              </h2>
              <p
                style={{
                  fontSize: '11.5px',
                  color: '#64748b',
                  margin: '3px 0 0 0',
                  fontWeight: 500
                }}
              >
                Almacén Central Lince · Slotting WMS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: 'none',
              background: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensaje de Error de Validación */}
        {validationError && (
          <div
            style={{
              margin: '14px 20px 0 20px',
              padding: '9px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Formulario Simplificado */}
        <form onSubmit={handleSubmit} style={{ padding: '18px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Campo 1: Guía WR # */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Barcode className="w-4 h-4 text-blue-600" />
                Guía WR # (Recibo de Bodega)
              </label>

              {/* Indicador de 11 caracteres en vivo */}
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  background: isWrValid
                    ? '#dcfce7'
                    : wrLength > 0
                    ? '#fee2e2'
                    : '#f1f5f9',
                  color: isWrValid
                    ? '#15803d'
                    : wrLength > 0
                    ? '#b91c1c'
                    : '#64748b',
                  border: isWrValid
                    ? '1px solid #bbf7d0'
                    : wrLength > 0
                    ? '1px solid #fecaca'
                    : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                {isWrValid ? '✓ 11 caracteres (Válido)' : `${wrLength}/11 caracteres`}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                ref={wrInputRef}
                type="text"
                maxLength={WR_LENGTH}
                value={form.numeroReciboBodega}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setField('numeroReciboBodega', val);
                }}
                onBlur={() => {
                  if (form.numeroReciboBodega) {
                    const formatted = smartFormatWr(form.numeroReciboBodega);
                    if (formatted !== form.numeroReciboBodega) {
                      setField('numeroReciboBodega', formatted);
                    }
                  }
                }}
                placeholder="Ej: WR000474478"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  color: '#0f172a',
                  background: '#f8fafc',
                  border: validationError
                    ? '1.5px solid #ef4444'
                    : isWrValid
                    ? '1.5px solid #22c55e'
                    : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  textTransform: 'uppercase'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isWrValid ? '#22c55e' : '#2563eb';
                  e.currentTarget.style.background = '#ffffff';
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = validationError
                    ? '#ef4444'
                    : isWrValid
                    ? '#22c55e'
                    : '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              />
            </div>
            <p style={{ fontSize: '11px', color: isWrValid ? '#16a34a' : '#64748b', margin: '5px 0 0 2px' }}>
              {isWrValid
                ? 'Código WR verificado con formato reglamentario de 11 caracteres.'
                : 'Debe iniciar con WR y tener exactamente 11 caracteres (ej. WR000474478).'}
            </p>
          </div>

          {/* Campo 2: Ubicación / Posición en Almacén */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MapPin className="w-4 h-4 text-indigo-600" />
                Ubicación / Posición en Almacén
              </label>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#4338ca',
                  background: '#e0e7ff',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {currentUbicacion || 'OFI-P1'}
              </span>
            </div>

            {/* Input para escribir cualquier ubicación libre */}
            <input
              type="text"
              value={form.posicionEstante || currentUbicacion}
              onChange={(e) => handleSelectUbicacion(e.target.value.toUpperCase())}
              placeholder="Ej: OFI-P1, DSP-Z2, A1-P1..."
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: 'monospace',
                color: '#1e293b',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                outline: 'none',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }}
            />

            {/* Chips de selección rápida en 1 clic */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {UBICACIONES_RAPIDAS.map((ubi) => {
                const isSelected = currentUbicacion === ubi.code;
                return (
                  <button
                    key={ubi.code}
                    type="button"
                    onClick={() => handleSelectUbicacion(ubi.code)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                      background: isSelected ? '#eef2ff' : '#ffffff',
                      color: isSelected ? '#3730a3' : '#475569',
                      transition: 'all 0.12s ease'
                    }}
                    title={ubi.label}
                  >
                    {ubi.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              paddingTop: '6px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isWrValid}
              style={{
                padding: '10px 20px',
                fontSize: '12.5px',
                fontWeight: 800,
                color: '#ffffff',
                background: isWrValid
                  ? 'linear-gradient(135deg, #1d4ed8, #2563eb)'
                  : '#94a3b8',
                border: 'none',
                borderRadius: '9px',
                cursor: isWrValid ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: isWrValid ? '0 2px 6px rgba(37,99,235,0.28)' : 'none',
                opacity: isWrValid ? 1 : 0.7,
                transition: 'all 0.15s ease'
              }}
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
