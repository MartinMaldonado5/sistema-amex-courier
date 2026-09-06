'use client';

import React, { useState, useEffect } from 'react';
import './rotulos-a4.css';
import { RotuloSlotData, generateRotulosA4Pdf } from '@/lib/rotulos/rotulos-pdf';

const DEFAULT_SLOTS: RotuloSlotData[] = [
  {
    id: 1,
    nombre: 'KENNETH MALDONADO',
    dni: '72410845',
    celular: '982432561',
    agencia: 'SHALOM',
    destino: 'LA LIBERTAD AG_ TULUEARAS',
    remitente: 'AMEX COURIER PERÚ',
    observacion: 'BULTO 1/1'
  },
  {
    id: 2,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: ''
  },
  {
    id: 3,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'CRUZ DEL SUR',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: ''
  },
  {
    id: 4,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'OLVA',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: ''
  },
  {
    id: 5,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: ''
  }
];

export default function RotulosA4Tab() {
  const [slots, setSlots] = useState<RotuloSlotData[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Cargar borrador persistido desde LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('amex_rotulos_a4_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          setSlots(parsed);
        }
      }
    } catch {
      // Ignorar error al cargar
    }
  }, []);

  // Guardar automáticamente en LocalStorage al modificar
  const saveSlots = (newSlots: RotuloSlotData[]) => {
    setSlots(newSlots);
    try {
      localStorage.setItem('amex_rotulos_a4_slots', JSON.stringify(newSlots));
    } catch {
      // Ignorar error de guardado
    }
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];

  const updateActiveSlot = (fields: Partial<RotuloSlotData>) => {
    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        return { ...s, ...fields };
      }
      return s;
    });
    saveSlots(updated);
  };

  // Duplicar el contenido del espacio activo en los 5 espacios
  const handleDuplicateToAll = () => {
    if (!activeSlot.nombre && !activeSlot.destino) {
      showToast('⚠️ Escribe primero los datos en este espacio antes de duplicar.');
      return;
    }
    const updated = slots.map((s, idx) => ({
      ...activeSlot,
      id: s.id,
      observacion: `BULTO ${idx + 1} DE 5`
    }));
    saveSlots(updated);
    showToast('✨ Rótulo duplicado en los 5 espacios de la hoja.');
  };

  // Limpiar solo el espacio activo
  const handleClearActiveSlot = () => {
    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        return {
          id: s.id,
          nombre: '',
          dni: '',
          celular: '',
          agencia: 'SHALOM' as const,
          destino: '',
          remitente: 'AMEX COURIER PERÚ',
          observacion: ''
        };
      }
      return s;
    });
    saveSlots(updated);
    showToast(`Espacio #${activeSlotId} limpiado.`);
  };

  // Limpiar toda la hoja (los 5 espacios)
  const handleClearAll = () => {
    const emptySlots = slots.map((s) => ({
      id: s.id,
      nombre: '',
      dni: '',
      celular: '',
      agencia: 'SHALOM' as const,
      destino: '',
      remitente: 'AMEX COURIER PERÚ',
      observacion: ''
    }));
    saveSlots(emptySlots);
    showToast('Hoja A4 reiniciada (5 espacios vacíos).');
  };

  // Imprimir directo con el diálogo del navegador
  const handlePrintDirect = () => {
    window.print();
  };

  // Descargar archivo PDF A4
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await generateRotulosA4Pdf(slots, 'Rotulos_Agencias_5x_A4');
      showToast('📄 ¡PDF A4 descargado exitosamente!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar PDF';
      showToast(`❌ ${msg}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getAgencyClass = (agencia: string) => {
    switch (agencia) {
      case 'SHALOM': return 'shalom';
      case 'CRUZ DEL SUR': return 'cruz';
      case 'OLVA': return 'olva';
      default: return 'otra';
    }
  };

  return (
    <div className="rotulos-module-wrapper">
      {/* Toast flotante */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0f172a',
            border: '1.5px solid #38bdf8',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
            zIndex: 9999,
            fontWeight: 700,
            fontSize: '0.85rem'
          }}
        >
          {feedbackToast}
        </div>
      )}

      {/* Barra Superior del Módulo */}
      <div className="rotulos-top-bar">
        <div className="rotulos-header-info">
          <div className="rotulos-header-icon">
            <i className="fa-solid fa-tags"></i>
          </div>
          <div>
            <h1 className="rotulos-header-title">Rótulos de Agencias (Hoja A4)</h1>
            <p className="rotulos-header-subtitle">
              Plantilla física milimétrica: <strong>Hoja A4 (21.0 x 29.7 cm)</strong> dividida en <strong>5 espacios iguales de 5.94 cm</strong> cada uno.
            </p>
          </div>
        </div>

        <div className="rotulos-actions-bar">
          <button
            type="button"
            className="btn-rotulo btn-rotulo-print"
            onClick={handlePrintDirect}
            title="Imprimir la hoja A4 física directamente (Ctrl + P)"
          >
            <i className="fa-solid fa-print"></i>
            <span>Imprimir A4 Físico</span>
          </button>

          <button
            type="button"
            className="btn-rotulo btn-rotulo-pdf"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            title="Descargar documento PDF listo para imprimir"
          >
            {isExportingPdf ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pdf"></i>
                <span>Descargar PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-rotulo btn-rotulo-secondary"
            onClick={handleClearAll}
            title="Limpiar los 5 espacios para empezar una hoja nueva"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>Limpiar Hoja</span>
          </button>
        </div>
      </div>

      {/* Grid de Trabajo: Editor Lateral + Vista Previa A4 */}
      <div className="rotulos-workspace-grid">
        {/* PANEL LATERAL DE DIGITACIÓN MANUAL */}
        <div className="rotulos-editor-card">
          {/* Selector de Espacios 1 al 5 */}
          <div>
            <label className="rotulo-label" style={{ marginBottom: '6px', display: 'block' }}>
              Seleccionar Espacio a Digitar:
            </label>
            <div className="rotulo-slot-selector">
              {slots.map((s) => {
                const isFilled = Boolean(s.nombre || s.destino);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`slot-tab-btn ${s.id === activeSlotId ? 'active' : ''} ${isFilled ? 'filled' : ''}`}
                    onClick={() => setActiveSlotId(s.id)}
                    title={`Espacio #${s.id} (5.94 cm)`}
                  >
                    <span>Espacio #{s.id}</span>
                    <span className="slot-tab-status"></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="slot-editor-header">
            <div className="slot-badge-title">
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Editando Espacio #{activeSlot.id} de 5</span>
            </div>
            <span className="slot-dimensions-tag">21.0 cm x 5.94 cm</span>
          </div>

          {/* Formulario de Entrada 100% Manual */}
          <div className="rotulo-form">
            <div className="rotulo-field-group">
              <label className="rotulo-label">Nombre(s) y Apellidos del Destinatario:</label>
              <input
                type="text"
                className="rotulo-input"
                placeholder="Ej: Kenneth Maldonado"
                value={activeSlot.nombre}
                onChange={(e) => updateActiveSlot({ nombre: e.target.value.toUpperCase() })}
                autoFocus
              />
            </div>

            <div className="rotulo-row-2">
              <div className="rotulo-field-group">
                <label className="rotulo-label">DNI / RUC / CE:</label>
                <input
                  type="text"
                  className="rotulo-input"
                  placeholder="Ej: 72410845"
                  value={activeSlot.dni}
                  onChange={(e) => updateActiveSlot({ dni: e.target.value.trim().toUpperCase() })}
                />
              </div>
              <div className="rotulo-field-group">
                <label className="rotulo-label">Celular / Teléfono:</label>
                <input
                  type="tel"
                  className="rotulo-input"
                  placeholder="Ej: 982432561"
                  value={activeSlot.celular}
                  onChange={(e) => updateActiveSlot({ celular: e.target.value.trim() })}
                />
              </div>
            </div>

            {/* Selector de Agencia */}
            <div className="rotulo-field-group">
              <label className="rotulo-label">Agencia de Envío:</label>
              <div className="agency-pill-grid">
                <button
                  type="button"
                  className={`agency-pill-btn shalom ${activeSlot.agencia === 'SHALOM' ? 'active' : ''}`}
                  onClick={() => updateActiveSlot({ agencia: 'SHALOM' })}
                >
                  SHALOM
                </button>
                <button
                  type="button"
                  className={`agency-pill-btn cruz ${activeSlot.agencia === 'CRUZ DEL SUR' ? 'active' : ''}`}
                  onClick={() => updateActiveSlot({ agencia: 'CRUZ DEL SUR' })}
                >
                  CRUZ DEL SUR
                </button>
                <button
                  type="button"
                  className={`agency-pill-btn olva ${activeSlot.agencia === 'OLVA' ? 'active' : ''}`}
                  onClick={() => updateActiveSlot({ agencia: 'OLVA' })}
                >
                  OLVA
                </button>
                <button
                  type="button"
                  className={`agency-pill-btn otra ${activeSlot.agencia === 'OTRA' ? 'active' : ''}`}
                  onClick={() => updateActiveSlot({ agencia: 'OTRA' })}
                >
                  OTRA...
                </button>
              </div>

              {activeSlot.agencia === 'OTRA' && (
                <input
                  type="text"
                  className="rotulo-input"
                  style={{ marginTop: '6px' }}
                  placeholder="Escribe el nombre de la agencia (ej: Marvisur, Móvil Bus)"
                  value={activeSlot.agenciaOtra || ''}
                  onChange={(e) => updateActiveSlot({ agenciaOtra: e.target.value.toUpperCase() })}
                />
              )}
            </div>

            {/* Destino y Agencia de Entrega */}
            <div className="rotulo-field-group">
              <label className="rotulo-label">Destino / Agencia de Entrega:</label>
              <input
                type="text"
                className="rotulo-input"
                placeholder="Ej: LA LIBERTAD Ag_ tuluearas"
                value={activeSlot.destino}
                onChange={(e) => updateActiveSlot({ destino: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="rotulo-row-2">
              <div className="rotulo-field-group">
                <label className="rotulo-label">Remitente:</label>
                <input
                  type="text"
                  className="rotulo-input"
                  placeholder="AMEX COURIER PERÚ"
                  value={activeSlot.remitente || ''}
                  onChange={(e) => updateActiveSlot({ remitente: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="rotulo-field-group">
                <label className="rotulo-label">Observación / Bulto:</label>
                <input
                  type="text"
                  className="rotulo-input"
                  placeholder="Ej: Bulto 1/1"
                  value={activeSlot.observacion || ''}
                  onChange={(e) => updateActiveSlot({ observacion: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </div>

          {/* Acciones de Productividad */}
          <div className="rotulo-tools-box">
            <button
              type="button"
              className="btn-tool-action duplicate"
              onClick={handleDuplicateToAll}
              title="Copiar los datos de este espacio en los 5 espacios de la hoja"
            >
              <i className="fa-solid fa-clone"></i>
              <span>Duplicar este rótulo en los 5 espacios</span>
            </button>

            <button
              type="button"
              className="btn-tool-action danger"
              onClick={handleClearActiveSlot}
              title="Borrar los datos de este espacio"
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Limpiar este espacio #{activeSlot.id}</span>
            </button>
          </div>
        </div>

        {/* VISTA PREVIA DE LA HOJA FÍSICA A4 (WYSIWYG) */}
        <div className="rotulos-preview-container">
          {/* Hoja A4 con las 5 Franjas de 5.94 cm */}
          <div className="rotulos-a4-sheet">
            {slots.map((slot, index) => {
              const hasData = Boolean(slot.nombre || slot.dni || slot.celular || slot.destino);
              const agencyClass = getAgencyClass(slot.agencia);
              const agencyDisplayName = slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
                ? slot.agenciaOtra
                : slot.agencia;

              return (
                <div
                  key={slot.id}
                  className={`rotulo-strip-preview ${slot.id === activeSlotId ? 'active' : ''}`}
                  onClick={() => setActiveSlotId(slot.id)}
                  title={`Clic para editar espacio #${slot.id} (5.94 cm)`}
                >
                  {/* Espacio del rótulo con línea de corte punteada */}

                  {hasData ? (
                    <>
                      {/* Cabecera sutil */}
                      <div className="strip-header">
                        <span>{(slot.remitente || 'AMEX COURIER PERÚ').toUpperCase()}</span>
                        {slot.observacion && <span>{slot.observacion.toUpperCase()}</span>}
                      </div>

                      {/* Destinatario */}
                      <div className="strip-destinatario">
                        {slot.nombre || 'NOMBRE Y APELLIDO'}
                      </div>

                      {/* DNI / RUC y Celular apilados verticalmente (DNI abajo del nombre, CEL abajo del DNI) */}
                      <div className="strip-docs-column">
                        <div className="strip-doc-line">
                          <span className="strip-doc-label">DNI / RUC:</span>
                          <strong className="strip-doc-value">{slot.dni || '—'}</strong>
                        </div>
                        <div className="strip-doc-line">
                          <span className="strip-doc-label">CEL:</span>
                          <strong className="strip-doc-value">{slot.celular || '—'}</strong>
                        </div>
                      </div>

                      {/* Agencia y Destino */}
                      <div className="strip-agency-row">
                        <span className={`strip-agency-badge ${agencyClass}`}>
                          {agencyDisplayName}
                        </span>
                        <span className="strip-destination-text">
                          DESTINO: {slot.destino || 'DESTINO NO ESPECIFICADO'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="strip-empty-placeholder">
                      <span>[ Espacio #{slot.id} libre - 5.94 cm de altura ]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
