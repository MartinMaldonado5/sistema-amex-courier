'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Paquete, TipoEstadoAmex, TipoEstadoEntrega } from '@/types';

export interface BulkStatusByWrModalProps {
  isOpen: boolean;
  onClose: () => void;
  paquetes: Paquete[];
  onApply: (
    matchedIds: string[],
    targetStatusAmex: TipoEstadoAmex,
    targetStatusTib?: TipoEstadoEntrega
  ) => Promise<void> | void;
}

export default function BulkStatusByWrModal({
  isOpen,
  onClose,
  paquetes,
  onApply
}: BulkStatusByWrModalProps) {
  const [rawText, setRawText] = useState('');
  const [targetStatusAmex, setTargetStatusAmex] = useState<TipoEstadoAmex>('entregado');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMissingDetails, setShowMissingDetails] = useState(false);

  // Parsing y cruce en tiempo real con el inventario
  const { parsedCodes, matchedPackages, missingCodes } = useMemo(() => {
    if (!rawText.trim()) {
      return { parsedCodes: [], matchedPackages: [], missingCodes: [] };
    }

    // Separar por saltos de línea, comas, puntos y comas o tabuladores
    const rawItems = rawText
      .split(/[\n,;\t]+/)
      .map(item => item.trim())
      .filter(Boolean);

    // Normalizar códigos únicos
    const uniqueCodes = Array.from(new Set(rawItems.map(c => c.toUpperCase())));

    const matched: Paquete[] = [];
    const missing: string[] = [];

    // Mapas para búsqueda O(1)
    const wrMap = new Map<string, Paquete>();
    const trackingMap = new Map<string, Paquete>();

    paquetes.forEach(p => {
      if (p.numeroReciboBodega) {
        wrMap.set(p.numeroReciboBodega.trim().toUpperCase(), p);
      }
      if (p.trackingUsa) {
        trackingMap.set(p.trackingUsa.trim().toUpperCase(), p);
      }
    });

    uniqueCodes.forEach(code => {
      // Buscar coincidencia exacta por WR o por Tracking USA
      let match = wrMap.get(code) || trackingMap.get(code);

      // Si no encuentra coincidencia directa y el usuario ingresó solo dígitos, buscar sufijo de WR
      if (!match) {
        const matchingPkg = paquetes.find(
          p =>
            p.numeroReciboBodega?.toUpperCase().includes(code) ||
            p.trackingUsa?.toUpperCase().includes(code)
        );
        if (matchingPkg) {
          match = matchingPkg;
        }
      }

      if (match) {
        // Evitar duplicar el paquete en matched si múltiples códigos apuntan al mismo
        if (!matched.some(m => m.id === match!.id)) {
          matched.push(match);
        }
      } else {
        missing.push(code);
      }
    });

    return {
      parsedCodes: uniqueCodes,
      matchedPackages: matched,
      missingCodes: missing
    };
  }, [rawText, paquetes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedPackages.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const matchedIds = matchedPackages.map(p => p.id);
      await onApply(matchedIds, targetStatusAmex);
      setRawText('');
      onClose();
    } catch (err) {
      console.error('Error aplicando cambio de estado por lista de WRs:', err);
      alert('Ocurrió un error al actualizar los paquetes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '640px', width: '95%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="modal-title" style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                Actualizar Estados por Lista de WRs
              </span>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                Pega múltiples Guías WR o Trackings para marcar entregas o cambiar estados en lote
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Textarea de Entrada */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
              <span>Pegar lista de Guías WR (una por línea, comas o espacios):</span>
              {parsedCodes.length > 0 && (
                <span style={{ color: '#2563eb', fontWeight: 700 }}>
                  {parsedCodes.length} código(s) detectado(s)
                </span>
              )}
            </label>
            <textarea
              rows={5}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Ejemplo:&#10;WR-100345&#10;WR-100346&#10;WR-100347&#10;o pega desde un Excel o mensaje de WhatsApp..."
              className="form-control"
              style={{
                fontFamily: 'monospace',
                fontSize: '12.5px',
                lineHeight: '1.4',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}
              required
            />
          </div>

          {/* Resumen de Detección en Tiempo Real */}
          {rawText.trim() && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#166534', fontWeight: 800 }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {matchedPackages.length} Encontrados en Inventario
                  </span>

                  {missingCodes.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#b91c1c', fontWeight: 800 }}>
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {missingCodes.length} No Encontrados
                    </span>
                  )}
                </div>

                {missingCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMissingDetails(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {showMissingDetails ? 'Ocultar no encontrados' : 'Ver no encontrados'}
                    {showMissingDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Detalle de Códigos No Encontrados */}
              {showMissingDetails && missingCodes.length > 0 && (
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: '#9f1239'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontWeight: 800 }}>
                    Los siguientes códigos no existen en la base de datos de Almacén Lince:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {missingCodes.map(code => (
                      <span
                        key={code}
                        style={{
                          background: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #fca5a5',
                          fontFamily: 'monospace',
                          fontSize: '10.5px'
                        }}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vista Previa de Bultos Encontrados */}
              {matchedPackages.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Bultos que se actualizarán ({matchedPackages.length}):
                  </div>
                  <div
                    style={{
                      maxHeight: '120px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '6px'
                    }}
                  >
                    {matchedPackages.map(pkg => (
                      <div
                        key={pkg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                            {pkg.numeroReciboBodega}
                          </span>
                          <span style={{ color: '#475569' }}>
                            {pkg.nombreConsignatario || 'Sin nombre'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: '#e0f2fe',
                            color: '#0369a1'
                          }}
                        >
                          Actual: {(pkg.estadoAmex || 'recibido').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selector de Nuevo Estado AMEX */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ⭐ Nuevo Estado Operativo AMEX
            </label>
            <select
              value={targetStatusAmex}
              onChange={e => setTargetStatusAmex(e.target.value as TipoEstadoAmex)}
              className="form-control"
              style={{
                fontWeight: 800,
                borderColor: '#93c5fd',
                background: '#f0f9ff',
                color: '#0369a1',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              <option value="entregado">✅ Entregado al Cliente Final</option>
              <option value="listo_recojo">🏪 Listo para Recojo en Tienda Lince</option>
              <option value="en_ruta">🚚 En Ruta (Reparto / Envío a Provincia)</option>
              <option value="en_almacen">📦 En Almacén (Ubicado en Estante)</option>
              <option value="recibido">📥 Recibido (Ingreso en Recepción)</option>
            </select>
          </div>

          {/* Footer de Acciones */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={matchedPackages.length === 0 || isSubmitting}
              className="btn btn-primary"
              style={{
                fontWeight: 800,
                opacity: matchedPackages.length === 0 || isSubmitting ? 0.6 : 1,
                cursor: matchedPackages.length === 0 || isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>⏳ Actualizando...</>
              ) : (
                <>✓ Aplicar cambio a {matchedPackages.length} paquete(s)</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
