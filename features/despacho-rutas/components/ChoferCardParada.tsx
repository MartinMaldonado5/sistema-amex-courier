'use client';

import React, { useState, useRef } from 'react';
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import { DespachoParada, EstadoParada } from '@/types/despacho';
import { getWhatsAppUrl, getGoogleMapsUrl, normalizePhoneNumber } from '@/lib/utils/phoneUtils';

interface ChoferCardParadaProps {
  parada: DespachoParada;
  onActualizarEstado: (paradaId: string, nuevoEstado: EstadoParada, motivo?: string) => Promise<void> | void;
  onSubirFoto?: (paradaId: string, file: File, destinatario?: string) => Promise<string>;
  onEliminarFoto?: (paradaId: string, fotoUrl: string) => Promise<void>;
}

export default function ChoferCardParada({ 
  parada, 
  onActualizarEstado,
  onSubirFoto,
  onEliminarFoto
}: ChoferCardParadaProps) {
  const [isPromptingNoEntrega, setIsPromptingNoEntrega] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFotoUrl, setDeletingFotoUrl] = useState<string | null>(null);
  const [selectedFotoModal, setSelectedFotoModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const phoneInfo = normalizePhoneNumber(parada.telefonoRaw || parada.telefonoNormalizado);
  const waUrl = getWhatsAppUrl(parada.telefonoNormalizado || parada.telefonoRaw, parada.destinatario, parada.wrBultos, parada.direccion);
  const mapsUrl = getGoogleMapsUrl(parada.direccion, parada.distrito);

  const handleMarcarEntregado = async () => {
    setIsUpdating(true);
    try {
      await onActualizarEstado(parada.id, 'ENTREGADO');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmarNoEntrega = async (motivo: string) => {
    setIsUpdating(true);
    try {
      await onActualizarEstado(parada.id, 'NO_ENTREGADO', motivo);
      setIsPromptingNoEntrega(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onSubirFoto) return;

    setIsUploading(true);
    try {
      await onSubirFoto(parada.id, file, parada.destinatario);
    } catch (err: any) {
      alert(err.message || 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleEliminar = async (fotoUrl: string) => {
    if (!onEliminarFoto) return;
    if (!confirm('¿Deseas eliminar esta foto de evidencia?')) return;
    setDeletingFotoUrl(fotoUrl);
    try {
      await onEliminarFoto(parada.id, fotoUrl);
      if (selectedFotoModal === fotoUrl) {
        setSelectedFotoModal(null);
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la foto');
    } finally {
      setDeletingFotoUrl(null);
    }
  };

  const isEntregado = parada.estado === 'ENTREGADO';
  const isNoEntregado = parada.estado === 'NO_ENTREGADO';
  const fotos = parada.fotos || [];

  return (
    <div
      style={{
        background: isEntregado ? '#f8fafc' : '#ffffff',
        border: isEntregado ? '1px solid #cbd5e1' : isNoEntregado ? '1px solid #fecaca' : '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: isEntregado ? 'none' : '0 2px 8px rgba(15,23,42,0.06)',
        opacity: isEntregado ? 0.9 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Cabecera de la Parada */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: isEntregado ? '#10b981' : '#2563eb',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            #{parada.orden}
          </span>

          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 800,
              color: isEntregado ? '#64748b' : '#0f172a',
              lineHeight: 1.2
            }}
          >
            {parada.destinatario}
          </h3>
        </div>

        {/* Estado badge */}
        <div>
          {isEntregado && (
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Entregado
            </span>
          )}

          {isNoEntregado && (
            <span
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <XCircle className="w-3.5 h-3.5" /> {parada.motivoNoEntrega || 'No Entregado'}
            </span>
          )}
        </div>
      </div>

      {/* Bultos y WRs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span
          style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            fontSize: '12px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          📦 {parada.wrBultos}
        </span>

        {parada.montoCobro > 0 && (
          <span
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              fontSize: '12px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '6px'
            }}
          >
            💵 Cobrar: {parada.monedaCobro === 'USD' ? '$' : 'S/'} {parada.montoCobro.toFixed(2)}
          </span>
        )}
      </div>

      {/* Dirección y Distrito */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: '#334155' }}>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{parada.direccion}</div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            Distrito: <span style={{ color: '#2563eb', fontWeight: 800 }}>{parada.distrito}</span>
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#f1f5f9',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
          title="Abrir en Google Maps / Waze"
        >
          <MapPin className="w-3.5 h-3.5 text-red-500" /> Maps
        </a>
      </div>

      {/* Botones de Comunicación con el Cliente (WhatsApp y Llamada) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Botón Verde de WhatsApp */}
        {waUrl ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#22c55e',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(34,197,94,0.3)',
              cursor: 'pointer'
            }}
          >
            <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
          </a>
        ) : (
          <button
            disabled
            style={{
              background: '#e2e8f0',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '10px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageCircle className="w-4 h-4" /> Sin WhatsApp
          </button>
        )}

        {/* Botón Azul de Llamada */}
        {phoneInfo.isValid ? (
          <a
            href={phoneInfo.telUri}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
              cursor: 'pointer'
            }}
          >
            <Phone className="w-4 h-4 fill-current" /> Llamar
          </a>
        ) : (
          <button
            disabled
            style={{
              background: '#e2e8f0',
              color: '#94a3b8',
              borderRadius: '10px',
              padding: '10px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Phone className="w-4 h-4" /> Sin Teléfono
          </button>
        )}
      </div>

      {/* Subsección: Número de teléfono visible */}
      {phoneInfo.isValid && (
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
          Teléfono: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{phoneInfo.display}</span>
        </div>
      )}

      {/* Sección: Fotos / Evidencias de Entrega vinculadas a la parada */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📸 Fotos / Evidencias de Entrega {fotos.length > 0 && <span style={{ background: '#e2e8f0', color: '#1e293b', padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>{fotos.length}</span>}
          </span>
          {isUploading && (
            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...
            </span>
          )}
        </div>

        {/* Inputs ocultos para Cámara y Galería */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Galería de fotos existentes */}
        {fotos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
            {fotos.map((fotoUrl, idx) => (
              <div
                key={fotoUrl + idx}
                style={{
                  position: 'relative',
                  width: '68px',
                  height: '68px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  background: '#0f172a'
                }}
              >
                <img
                  src={fotoUrl}
                  alt={`Evidencia ${idx + 1}`}
                  onClick={() => setSelectedFotoModal(fotoUrl)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  title="Tocar para ver en pantalla completa"
                />
                
                {/* Botón Eliminar sobre la imagen */}
                {onEliminarFoto && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(fotoUrl);
                    }}
                    disabled={deletingFotoUrl === fotoUrl}
                    title="Eliminar foto"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      padding: 0
                    }}
                  >
                    {deletingFotoUrl === fotoUrl ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                )}

                {/* Ícono zoom esquina inferior */}
                <div
                  onClick={() => setSelectedFotoModal(fotoUrl)}
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '4px',
                    padding: '2px',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                >
                  <Maximize2 className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botones de acción para tomar o subir foto */}
        {onSubirFoto && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              style={{
                background: '#ffffff',
                border: '1px solid #3b82f6',
                color: '#2563eb',
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.6 : 1
              }}
            >
              <Camera className="w-3.5 h-3.5" /> Tomar Foto
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.6 : 1
              }}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Galería
            </button>
          </div>
        )}
      </div>

      {/* Modal Fullscreen de Visualización de Foto */}
      {selectedFotoModal && (
        <div
          onClick={() => setSelectedFotoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              background: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header del modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#1e293b',
                color: '#f8fafc',
                borderBottom: '1px solid #334155'
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                Evidencia: <span style={{ color: '#38bdf8' }}>{parada.destinatario}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href={selectedFotoModal}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  title="Abrir imagen original"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedFotoModal(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '6px'
                  }}
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagen centrada */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                background: '#020617'
              }}
            >
              <img
                src={selectedFotoModal}
                alt={`Evidencia ${parada.destinatario}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Acciones de Entrega para el Chofer */}
      {!isEntregado && !isPromptingNoEntrega && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={handleMarcarEntregado}
            disabled={isUpdating}
            style={{
              flex: 1,
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '13.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
            }}
          >
            <CheckCircle2 className="w-4 h-4" /> Marcar Entregado
          </button>

          <button
            onClick={() => setIsPromptingNoEntrega(true)}
            disabled={isUpdating}
            style={{
              background: '#fff1f2',
              color: '#e11d48',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '12.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Registrar que no se pudo entregar"
          >
            <AlertCircle className="w-4 h-4" /> Problema
          </button>
        </div>
      )}

      {/* Prompt de No Entrega (Rápido con 1 toque) */}
      {isPromptingNoEntrega && (
        <div
          style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#9f1239' }}>
            ¿Por qué no se pudo entregar?
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {['Cliente Ausente', 'No Contesta', 'Dirección Incorrecta', 'Reprogramado'].map(motivo => (
              <button
                key={motivo}
                onClick={() => handleConfirmarNoEntrega(motivo)}
                disabled={isUpdating}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fda4af',
                  color: '#be123c',
                  borderRadius: '6px',
                  padding: '8px 6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {motivo}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPromptingNoEntrega(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '11.5px',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Si ya fue entregado o no entregado, permitir revertir si hubo error */}
      {(isEntregado || isNoEntregado) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onActualizarEstado(parada.id, 'PENDIENTE')}
            disabled={isUpdating}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Revertir a estado pendiente"
          >
            <RotateCcw className="w-3 h-3" /> Revertir estado
          </button>
        </div>
      )}
    </div>
  );
}
