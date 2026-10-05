'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Clipboard, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { CrearRutaInput, CrearParadaInput } from '@/types/despacho';
import { LIMA_DISTRITOS, parseQuickPasteRows, normalizeDistrito } from '@/lib/utils/phoneUtils';

interface RutaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRuta: (ruta: CrearRutaInput, paradas: CrearParadaInput[]) => Promise<unknown>;
}

export default function RutaBuilderModal({ isOpen, onClose, onSaveRuta }: RutaBuilderModalProps) {
  // Datos de cabecera de la ruta
  const [nombreRuta, setNombreRuta] = useState('');
  const [choferNombre, setChoferNombre] = useState('');
  const [choferTelefono, setChoferTelefono] = useState('');
  const [vehiculoPlaca, setVehiculoPlaca] = useState('');
  const [fechaDespacho, setFechaDespacho] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');

  // Paradas de la ruta
  const [paradas, setParadas] = useState<CrearParadaInput[]>([
    {
      destinatario: '',
      wrBultos: '1 CJ',
      direccion: '',
      distrito: 'MIRAFLORES',
      telefono: '',
      montoCobro: 0,
      monedaCobro: 'USD'
    }
  ]);

  // Modo pegar desde Excel
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Agregar una fila vacía manual
  const handleAddFila = () => {
    setParadas(prev => [
      ...prev,
      {
        destinatario: '',
        wrBultos: '1 CJ',
        direccion: '',
        distrito: 'MIRAFLORES',
        telefono: '',
        montoCobro: 0,
        monedaCobro: 'USD'
      }
    ]);
  };

  // Modificar campo de una fila
  const handleUpdateFila = (index: number, field: keyof CrearParadaInput, value: string | number | undefined) => {
    setParadas(prev =>
      prev.map((p, idx) => (idx === index ? { ...p, [field]: value } : p))
    );
  };

  // Eliminar una fila
  const handleRemoveFila = (index: number) => {
    setParadas(prev => prev.filter((_, idx) => idx !== index));
  };

  // Procesar pegado de Excel
  const handleProcessQuickPaste = () => {
    if (!pasteText.trim()) {
      setPasteError('Pega texto de filas copiado de Excel antes de procesar.');
      return;
    }

    const parsed = parseQuickPasteRows(pasteText);
    if (parsed.length === 0) {
      setPasteError('No se reconocieron paradas válidas. Asegúrate de copiar filas con columnas de Nombre, WR/Bultos, Dirección y Celular.');
      return;
    }

    // Si la primera fila estaba vacía, reemplazarla
    setParadas(prev => {
      const cleanPrev = prev.filter(p => p.destinatario.trim() !== '');
      return [...cleanPrev, ...parsed];
    });

    setPasteText('');
    setShowPasteArea(false);
    setPasteError('');
  };

  // Guardar y publicar ruta
  const handleGuardarRuta = async () => {
    setErrorMsg('');

    if (!nombreRuta.trim()) {
      setErrorMsg('Ingresa un nombre para la ruta (ej: Ruta Sur - 05/10).');
      return;
    }

    if (!choferNombre.trim()) {
      setErrorMsg('Ingresa el nombre del chofer o motorizado responsable.');
      return;
    }

    const paradasValidas = paradas.filter(p => p.destinatario.trim() !== '');
    if (paradasValidas.length === 0) {
      setErrorMsg('Debes ingresar al menos una parada con destinatario.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveRuta(
        {
          nombreRuta: nombreRuta.trim(),
          choferNombre: choferNombre.trim(),
          choferTelefono: choferTelefono.trim(),
          vehiculoPlaca: vehiculoPlaca.trim(),
          fechaDespacho,
          notas: notas.trim()
        },
        paradasValidas.map((p, idx) => ({ ...p, orden: idx + 1 }))
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar y publicar la ruta.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCobro = paradas.reduce((acc, p) => acc + (Number(p.montoCobro) || 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              🚚 Armar Nueva Hoja de Ruta y Despacho Diario
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
              Reemplazo del Excel manual: arma las paradas, pega filas directamente y publícalo para el chofer
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo Scrollable */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </div>
          )}

          {/* Formulario de Datos de la Ruta */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Nombre de la Ruta *
              </label>
              <input
                type="text"
                placeholder="Ej: Ruta Sur (Miraflores - Surco)"
                value={nombreRuta}
                onChange={e => setNombreRuta(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Chofer / Repartidor *
              </label>
              <input
                type="text"
                placeholder="Ej: Carlos Chofer"
                value={choferNombre}
                onChange={e => setChoferNombre(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Teléfono del Chofer
              </label>
              <input
                type="text"
                placeholder="Ej: 997 123 456"
                value={choferTelefono}
                onChange={e => setChoferTelefono(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Vehículo / Placa
              </label>
              <input
                type="text"
                placeholder="Ej: Furgón AMX-912"
                value={vehiculoPlaca}
                onChange={e => setVehiculoPlaca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Fecha de Despacho
              </label>
              <input
                type="date"
                value={fechaDespacho}
                onChange={e => setFechaDespacho(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
                Observaciones / Instrucciones de Ruta
              </label>
              <input
                type="text"
                placeholder="Ej: Cobrar en efectivo al llegar, priorizar entregas de la mañana"
                value={notas}
                onChange={e => setNotas(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Barra de Herramientas de Paradas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              Paradas de Entrega ({paradas.filter(p => p.destinatario.trim()).length} clientes ingresados)
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPasteArea(!showPasteArea)}
                style={{
                  background: showPasteArea ? '#e2e8f0' : '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Clipboard className="w-3.5 h-3.5" /> Pegar Filas desde Excel
              </button>

              <button
                type="button"
                onClick={handleAddFila}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fila
              </button>
            </div>
          </div>

          {/* Área de Pegado Rápido desde Excel (Quick Paste) */}
          {showPasteArea && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px dashed #86efac',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                📋 Pegar Filas desde Excel (Copia las filas en Excel y pégalas aquí):
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#4b5563' }}>
                Detecta automáticamente: Nombre Destinatario | WRs / Bultos | Dirección | Distrito | Teléfono | Cobro
              </p>

              <textarea
                rows={4}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={'DANIEL VALDIVIA\t405148\tCALLE FRANCIA 510\tMIRAFLORES\t997 370 290\nLISS CASTILLO\t5 CJS\tAV CACERES 136\tMIRAFLORES\t969 738 878\t14.70'}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '11.5px'
                }}
              />

              {pasteError && (
                <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 600 }}>{pasteError}</div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPasteArea(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleProcessQuickPaste}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Procesar y Cargar a la Tabla
                </button>
              </div>
            </div>
          )}

          {/* Tabla Editable de Paradas */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '850px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                  <th style={{ padding: '8px 10px', width: '40px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Destinatario *</th>
                  <th style={{ padding: '8px 10px', width: '140px' }}>Bultos / WR *</th>
                  <th style={{ padding: '8px 10px' }}>Dirección Completa *</th>
                  <th style={{ padding: '8px 10px', width: '150px' }}>Distrito</th>
                  <th style={{ padding: '8px 10px', width: '130px' }}>Teléfono Celular</th>
                  <th style={{ padding: '8px 10px', width: '100px' }}>Cobrar ($)</th>
                  <th style={{ padding: '8px 10px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {paradas.map((parada, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 800, color: '#64748b', textAlign: 'center' }}>
                      {idx + 1}
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="Ej: Daniel Valdivia"
                        value={parada.destinatario}
                        onChange={e => handleUpdateFila(idx, 'destinatario', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 700
                        }}
                      />
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="Ej: 5 CJS / 405148"
                        value={parada.wrBultos}
                        onChange={e => handleUpdateFila(idx, 'wrBultos', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontFamily: 'monospace'
                        }}
                      />
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="Calle, número, dpto, ref..."
                        value={parada.direccion}
                        onChange={e => handleUpdateFila(idx, 'direccion', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        list={`distritos-list-${idx}`}
                        value={parada.distrito}
                        onChange={e => handleUpdateFila(idx, 'distrito', normalizeDistrito(e.target.value))}
                        placeholder="Distrito..."
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                      <datalist id={`distritos-list-${idx}`}>
                        {LIMA_DISTRITOS.map(d => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="text"
                        placeholder="997 370 290"
                        value={parada.telefono}
                        onChange={e => handleUpdateFila(idx, 'telefono', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontFamily: 'monospace'
                        }}
                      />
                    </td>

                    <td style={{ padding: '6px 8px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={parada.montoCobro || ''}
                        onChange={e => handleUpdateFila(idx, 'montoCobro', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          textAlign: 'right'
                        }}
                      />
                    </td>

                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {paradas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFila(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleAddFila}
            style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              color: '#2563eb',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus className="w-4 h-4" /> + Agregar otra parada
          </button>
        </div>

        {/* Pie del Modal con Resumen y Botón de Publicación */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            <span>
              Total Paradas:{' '}
              <strong style={{ color: '#0f172a' }}>
                {paradas.filter(p => p.destinatario.trim()).length}
              </strong>
            </span>
            {totalCobro > 0 && (
              <span>
                Total a Cobrar:{' '}
                <strong style={{ color: '#b45309' }}>
                  $ {totalCobro.toFixed(2)} USD
                </strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#475569',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGuardarRuta}
              disabled={isSubmitting}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '13.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : '✅ Guardar y Publicar Ruta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
