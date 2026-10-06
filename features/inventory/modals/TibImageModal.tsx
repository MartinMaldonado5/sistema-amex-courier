'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Download,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  X,
  MapPin,
  Scale,
  User,
  Box,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Paquete } from '@/types';

export interface TibImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  paquete: Paquete | null;
  onImageLoaded?: (wr: string, imageUrl: string, ticketUrl?: string) => void;
}

interface TibData {
  wr?: string;
  seqwr?: string;
  tracking?: string;
  cliente?: string;
  pesoKg?: string;
  estado?: string;
  fecha?: string;
  rack?: string;
  empaque?: string;
}

export default function TibImageModal({
  isOpen,
  onClose,
  paquete,
  onImageLoaded,
}: TibImageModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const [tibData, setTibData] = useState<TibData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen || !paquete) {
      setImageUrl(null);
      setTicketUrl(null);
      setTibData(null);
      setErrorMsg(null);
      setZoomLevel(1);
      setRotation(0);
      setIsFullscreen(false);
      return;
    }

    setZoomLevel(1);
    setRotation(0);
    setIsFullscreen(false);

    // Si el paquete ya tiene la URL cargada
    if (paquete.tibImagenUrl) {
      setImageUrl(paquete.tibImagenUrl);
      setTicketUrl(paquete.tibTicketPdfUrl || null);
    }

    // Consultar o confirmar con la API
    void fetchTibImage(paquete.numeroReciboBodega, paquete.id, false);
  }, [isOpen, paquete]);

  const fetchTibImage = async (wr: string, id?: string, forceRefresh = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/paquetes/tib-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wr, id, forceRefresh }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      if (data.found && data.tibImagenUrl) {
        setImageUrl(data.tibImagenUrl);
        setTicketUrl(data.tibTicketPdfUrl || null);
        if (data.tibData) {
          setTibData(data.tibData);
        }
        if (onImageLoaded) {
          onImageLoaded(wr, data.tibImagenUrl, data.tibTicketPdfUrl || undefined);
        }
      } else {
        setErrorMsg(data.message || `No se encontró evidencia fotográfica en TIB para la guía ${wr}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al obtener la imagen de TIB';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl || !paquete) return;
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `TIB_${paquete.numeroReciboBodega}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error al descargar:', err);
      // Fallback: abrir en nueva pestaña
      window.open(imageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen || !paquete) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="modal-dialog"
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
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
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                Foto de Recepción en Bodega TIB
              </h3>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                  {paquete.numeroReciboBodega}
                </span>
                <span>•</span>
                <span>Tracking: {paquete.trackingUsa || paquete.tracking || '—'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              title="Refrescar desde TIB"
              disabled={loading}
              onClick={() => fetchTibImage(paquete.numeroReciboBodega, paquete.id, true)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {loading && !imageUrl ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#2563eb',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>
                  Conectando con el servidor TIB...
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                  Extrayendo evidencia fotográfica para {paquete.numeroReciboBodega}
                </p>
              </div>
            </div>
          ) : imageUrl ? (
            <>
              {/* Contenedor de la Imagen (100% Sin Recorte con Aspect Ratio Natural y Controles) */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#090d16',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #cbd5e1',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: zoomLevel > 1 ? 'auto' : 'hidden',
                    maxHeight: 'min(65vh, 520px)',
                    background: '#090d16'
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`Paquete ${paquete.numeroReciboBodega}`}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'min(65vh, 520px)',
                      objectFit: 'contain',
                      display: 'block',
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: zoomLevel === 1 ? 'zoom-in' : 'zoom-out'
                    }}
                    onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.6 : 1))}
                  />
                </div>

                {/* Badge Superior Izquierdo */}
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#38bdf8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    letterSpacing: '0.5px',
                    zIndex: 2,
                    pointerEvents: 'none'
                  }}
                >
                  ✓ EVIDENCIA ORIGINAL TIB (COMPLETA)
                </span>

                {/* Barra Flotante de Herramientas de Visualización Superior Derecha */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '3px 6px',
                    borderRadius: '8px',
                    zIndex: 5
                  }}
                >
                  <button
                    type="button"
                    title="Acercar (Zoom In)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel((prev) => Math.min(prev + 0.3, 3));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Alejar (Zoom Out)"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel((prev) => Math.max(prev - 0.3, 1));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Rotar 90°"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRotation((prev) => (prev + 90) % 360);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    title="Ver en Pantalla Completa"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreen(true);
                    }}
                    style={{
                      background: 'rgba(59, 130, 246, 0.3)',
                      border: '1px solid rgba(96, 165, 250, 0.4)',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '4px'
                    }}
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Ampliar
                  </button>
                </div>

                {/* Badge Inferior con info de escala */}
                {zoomLevel > 1 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#cbd5e1',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      zIndex: 2,
                      pointerEvents: 'none'
                    }}
                  >
                    Zoom: {Math.round(zoomLevel * 100)}%
                  </span>
                )}
              </div>

              {/* Tarjetas de Datos de Bodega TIB */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Cliente / Consignatario
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      {tibData?.cliente || paquete.nombreConsignatario || '—'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Peso Registrado TIB
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      {tibData?.pesoKg ? `${tibData.pesoKg} kg` : `${paquete.pesoKg} kg`}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Rack en Bodega TIB
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      {tibData?.rack || '—'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Box className="w-4 h-4 text-purple-600" />
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Empaque & Fecha TIB
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>
                      {tibData?.empaque || paquete.tipoEmpaque || 'CAJA'} • {tibData?.fecha?.split(' ')[0] || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <div>
                <h4 style={{ margin: 0, color: '#991b1b', fontWeight: 800, fontSize: '15px' }}>
                  Sin imagen disponible
                </h4>
                <p style={{ margin: '6px 0 0 0', color: '#b91c1c', fontSize: '12.5px' }}>
                  {errorMsg || 'El servidor de TIB no devolvió ninguna fotografía para este WR.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchTibImage(paquete.numeroReciboBodega, paquete.id, true)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reintentar Búsqueda
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#2563eb',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir pestaña completa
              </a>
            )}

            {ticketUrl && (
              <a
                href={ticketUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#0891b2',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textDecoration: 'none',
                  marginLeft: '8px'
                }}
              >
                <FileText className="w-3.5 h-3.5" /> Ver Ticket PDF TIB
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: downloading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Descargando...' : 'Descargar Foto'}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Pantalla Completa Modal */}
      {isFullscreen && imageUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(5, 8, 15, 0.96)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          {/* Barra Superior Lightbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#60a5fa', fontFamily: 'monospace' }}>
                {paquete.numeroReciboBodega}
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                {paquete.trackingUsa || paquete.tracking || ''}
              </span>
              <span style={{ color: '#64748b' }}>•</span>
              <span style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                Resolución Original TIB (1280 × 720 px · Sin Recorte)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.3, 3.5))}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <ZoomIn className="w-4 h-4" /> Zoom +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.3, 1))}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <ZoomOut className="w-4 h-4" /> Zoom -
              </button>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <RotateCw className="w-4 h-4" /> Rotar
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 800
                }}
              >
                <Minimize2 className="w-4 h-4" /> Salir de Pantalla Completa
              </button>
            </div>
          </div>

          {/* Imagen Centrada en Lightbox */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'auto',
              padding: '16px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFullscreen(false);
            }}
          >
            <img
              src={imageUrl}
              alt={`Paquete ${paquete.numeroReciboBodega}`}
              style={{
                maxWidth: '94vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: zoomLevel === 1 ? 'zoom-in' : 'zoom-out'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomLevel((prev) => (prev === 1 ? 1.8 : 1));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
