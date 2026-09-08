'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './rotulos-a4.css';
import { RotuloSlotData, generateRotulosA4Pdf } from '@/lib/rotulos/rotulos-pdf';

export function generarTextoBulto(
  numeroRotulo: number,
  totalRots: number,
  totalCjs: string | number
): string {
  const rotText = `RÓTULO ${numeroRotulo} DE ${totalRots}`;
  if (!totalCjs || String(totalCjs).trim() === '') {
    return rotText;
  }
  const cjsNum = String(totalCjs).trim();
  const cjasWord = Number(cjsNum) === 1 ? 'CAJA' : 'CAJAS';
  return `${rotText} • TOTAL: ${cjsNum} ${cjasWord}`;
}

const DEFAULT_SLOTS: RotuloSlotData[] = [
  {
    id: 1,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 1,
    siglas: ''
  },
  {
    id: 2,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 2,
    siglas: ''
  },
  {
    id: 3,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 3,
    siglas: ''
  },
  {
    id: 4,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 4,
    siglas: ''
  },
  {
    id: 5,
    nombre: '',
    dni: '',
    celular: '',
    agencia: 'SHALOM',
    destino: '',
    remitente: 'AMEX COURIER PERÚ',
    observacion: '',
    totalRotulos: 1,
    totalCajas: '1',
    numeroRotulo: 5,
    siglas: ''
  }
];

export interface AgencyOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  badgeClass: string;
  color: string;
}

export const AVAILABLE_AGENCIES: AgencyOption[] = [
  {
    id: 'SHALOM',
    name: 'SHALOM',
    subtitle: 'Envíos y encomiendas a nivel nacional',
    icon: 'fa-solid fa-truck-fast',
    badgeClass: 'shalom',
    color: '#dc2626'
  },
  {
    id: 'OLVA',
    name: 'OLVA COURIER',
    subtitle: 'Entregas a agencias y domicilio',
    icon: 'fa-solid fa-box',
    badgeClass: 'olva',
    color: '#eab308'
  },
  {
    id: 'CRUZ DEL SUR',
    name: 'CRUZ DEL SUR',
    subtitle: 'Cruz del Sur Cargo y encomiendas',
    icon: 'fa-solid fa-bus',
    badgeClass: 'cruz',
    color: '#1e40af'
  },
  {
    id: 'OTRA',
    name: 'OTRA AGENCIA...',
    subtitle: 'Escribir nombre personalizado',
    icon: 'fa-solid fa-pen-to-square',
    badgeClass: 'otra',
    color: '#6366f1'
  }
];

export default function RotulosA4Tab() {
  const [slots, setSlots] = useState<RotuloSlotData[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Estados de control de embalajes y cantidades (por defecto: 1 rótulo, 1 caja)
  const [totalRotulos, setTotalRotulos] = useState<number>(1);
  const [totalCajas, setTotalCajas] = useState<string>('1');
  const [autoDuplicar, setAutoDuplicar] = useState<boolean>(false);

  // Estados para AMEXito IA (Lectura inteligente de WhatsApp/Capturas - oculto por defecto)
  const [aiInputText, setAiInputText] = useState<string>('');
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isAiCardExpanded, setIsAiCardExpanded] = useState<boolean>(false);

  // Estado y ref para menú desplegable de Agencias
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState<boolean>(false);
  const agencyDropdownRef = React.useRef<HTMLDivElement>(null);

  // Estado y ref para menú desplegable de Acciones Maestras (Imprimir, PDF, Limpieza)
  const [isMasterActionsOpen, setIsMasterActionsOpen] = useState<boolean>(false);
  const masterActionsRef = React.useRef<HTMLDivElement>(null);

  // Ref para contenedor flotante de AMEXito IA (Superpuesto)
  const amexitoRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agencyDropdownRef.current && !agencyDropdownRef.current.contains(event.target as Node)) {
        setIsAgencyDropdownOpen(false);
      }
      if (masterActionsRef.current && !masterActionsRef.current.contains(event.target as Node)) {
        setIsMasterActionsOpen(false);
      }
      if (amexitoRef.current && !amexitoRef.current.contains(event.target as Node)) {
        if (!isAiProcessing) {
          setIsAiCardExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAiProcessing]);

  // Sintetizador de efectos de sonido Web Audio
  const playSound = useCallback((type: 'complete' | 'paste' | 'click' | 'error') => {
    if (typeof window === 'undefined') return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'paste') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Ignorar si audio está bloqueado
    }
  }, []);

  // Cargar borrador persistido desde LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('amex_rotulos_a4_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) {
          // Si contenía los datos de prueba anteriores con KENNETH MALDONADO, reiniciar a limpio
          if (parsed[0]?.nombre === 'KENNETH MALDONADO') {
            localStorage.removeItem('amex_rotulos_a4_slots');
            setSlots(DEFAULT_SLOTS);
            setTotalRotulos(1);
            setTotalCajas('1');
            return;
          }
          setSlots(parsed);
          if (parsed[0]?.totalRotulos) setTotalRotulos(parsed[0].totalRotulos);
          if (parsed[0]?.totalCajas) setTotalCajas(String(parsed[0].totalCajas));
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

  // Aplicar duplicación en los N rótulos configurados
  const aplicarDuplicacion = (
    baseSlot: RotuloSlotData,
    rotsCount: number,
    totCajas: string
  ) => {
    const updated = slots.map((s, idx) => {
      const slotNum = idx + 1;
      if (slotNum <= rotsCount) {
        return {
          ...baseSlot,
          id: s.id,
          observacion: generarTextoBulto(slotNum, rotsCount, totCajas),
          totalRotulos: rotsCount,
          totalCajas: totCajas,
          numeroRotulo: slotNum,
          siglas: baseSlot.siglas
        };
      } else {
        return {
          id: s.id,
          nombre: '',
          dni: '',
          celular: '',
          agencia: 'SHALOM' as const,
          destino: '',
          remitente: 'AMEX COURIER PERÚ',
          observacion: '',
          siglas: ''
        };
      }
    });
    saveSlots(updated);
  };

  const handleTotalRotulosChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(5, newCount));
    setTotalRotulos(clamped);
    if (autoDuplicar) {
      aplicarDuplicacion(activeSlot, clamped, totalCajas);
    } else {
      updateActiveSlot({
        totalRotulos: clamped,
        observacion: generarTextoBulto(activeSlot.id, clamped, totalCajas)
      });
    }
  };

  const handleTotalCajasChange = (newVal: string) => {
    setTotalCajas(newVal);
    if (autoDuplicar) {
      aplicarDuplicacion(activeSlot, totalRotulos, newVal);
    } else {
      updateActiveSlot({
        totalCajas: newVal,
        observacion: generarTextoBulto(activeSlot.id, totalRotulos, newVal)
      });
    }
  };

  const updateActiveSlot = (fields: Partial<RotuloSlotData>) => {
    if (autoDuplicar) {
      const updated = slots.map((s, idx) => {
        const slotNum = idx + 1;
        if (s.id === activeSlotId) {
          return {
            ...s,
            ...fields,
            observacion: fields.observacion !== undefined
              ? fields.observacion
              : generarTextoBulto(slotNum, totalRotulos, totalCajas)
          };
        } else if (
          slotNum <= totalRotulos &&
          (fields.nombre !== undefined ||
            fields.dni !== undefined ||
            fields.celular !== undefined ||
            fields.agencia !== undefined ||
            fields.agenciaOtra !== undefined ||
            fields.destino !== undefined ||
            fields.remitente !== undefined ||
            fields.siglas !== undefined)
        ) {
          return {
            ...s,
            nombre: fields.nombre !== undefined ? fields.nombre : s.nombre,
            dni: fields.dni !== undefined ? fields.dni : s.dni,
            celular: fields.celular !== undefined ? fields.celular : s.celular,
            agencia: fields.agencia !== undefined ? fields.agencia : s.agencia,
            agenciaOtra: fields.agenciaOtra !== undefined ? fields.agenciaOtra : s.agenciaOtra,
            destino: fields.destino !== undefined ? fields.destino : s.destino,
            remitente: fields.remitente !== undefined ? fields.remitente : s.remitente,
            siglas: fields.siglas !== undefined ? fields.siglas : s.siglas,
            observacion: generarTextoBulto(slotNum, totalRotulos, totalCajas)
          };
        }
        return s;
      });
      saveSlots(updated);
    } else {
      const updated = slots.map((s) => {
        if (s.id === activeSlotId) {
          return { ...s, ...fields };
        }
        return s;
      });
      saveSlots(updated);
    }
  };

  // Duplicar el contenido del espacio activo en los N espacios configurados
  const handleDuplicateToAll = () => {
    if (!activeSlot.nombre && !activeSlot.destino) {
      showToast('⚠️ Escribe primero los datos en este espacio antes de duplicar.');
      return;
    }
    aplicarDuplicacion(activeSlot, totalRotulos, totalCajas);
    showToast(`✨ Duplicado en los ${totalRotulos} rótulos (${totalCajas || 0} cajas en total).`);
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
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: s.id,
          siglas: ''
        };
      }
      return s;
    });
    setTotalRotulos(1);
    setTotalCajas('1');
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
      observacion: '',
      totalRotulos: 1,
      totalCajas: '1',
      numeroRotulo: s.id,
      siglas: ''
    }));
    setTotalRotulos(1);
    setTotalCajas('1');
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

  // Capturar imagen pegada con Ctrl + V
  const handlePasteCapture = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    setIsAiCardExpanded(true);
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setAiImagePreview(base64);
            playSound('paste');
            showToast('📸 ¡Captura pegada! Haz clic en "Rellenar con AMEXito IA".');
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  // Subir captura desde archivo
  const handleAiImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAiImagePreview(base64);
      playSound('paste');
      showToast('📸 ¡Captura cargada con éxito!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Procesar texto o captura con AMEXito IA
  const handleProcessWithAmexito = async () => {
    if (!aiInputText.trim() && !aiImagePreview) {
      playSound('error');
      showToast('⚠️ Pega primero el texto o captura del pedido de WhatsApp.');
      return;
    }

    try {
      setIsAiProcessing(true);
      playSound('click');
      showToast('🤖 AMEXito está leyendo y organizando los datos del pedido...');

      const res = await fetch('/api/ai/parse-rotulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiInputText.trim() || undefined,
          imageBase64: aiImagePreview || undefined
        })
      });

      const resData = await res.json();

      if (!res.ok || !resData.success || !resData.data) {
        throw new Error(resData.error || 'AMEXito no pudo interpretar los datos del pedido.');
      }

      const extracted = resData.data;
      const updates: Partial<RotuloSlotData> = {};

      if (extracted.nombre) updates.nombre = extracted.nombre;
      if (extracted.dni) updates.dni = extracted.dni;
      if (extracted.celular) updates.celular = extracted.celular;
      // IMPORTANTE: AMEXito NO toca la agencia de envío; el operador la selecciona manualmente
      if (extracted.destino) updates.destino = extracted.destino;
      if (extracted.remitente) updates.remitente = extracted.remitente;
      if (extracted.siglas) updates.siglas = extracted.siglas;

      let cjsNum = totalCajas;
      if (extracted.totalCajas) {
        cjsNum = String(extracted.totalCajas).replace(/[^0-9]/g, '');
        if (cjsNum) {
          setTotalCajas(cjsNum);
          updates.totalCajas = cjsNum;
        }
      }

      // AMEXito solo debe rellenar ÚNICAMENTE el espacio activo seleccionado (solo 1 de los 5)
      // Los demás espacios quedan intactos; el operador decide si duplicar con el botón
      const updated = slots.map((s) => {
        if (s.id === activeSlotId) {
          const slotTotalCajas = updates.totalCajas || s.totalCajas || cjsNum;
          return {
            ...s,
            ...updates,
            observacion: generarTextoBulto(s.id, totalRotulos, slotTotalCajas)
          };
        }
        return s;
      });
      saveSlots(updated);

      playSound('complete');
      showToast(`🤖 ¡AMEXito rellenó el espacio #${activeSlotId}!`);
      setIsAiCardExpanded(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con AMEXito IA.';
      playSound('error');
      showToast(`❌ ${msg}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const getAgencyClass = (agencia: string) => {
    switch (agencia) {
      case 'SHALOM': return 'shalom';
      case 'CRUZ DEL SUR': return 'cruz';
      case 'OLVA': return 'olva';
      case 'MARVISUR': return 'marvisur';
      case 'MÓVIL BUS': return 'movil';
      case 'FLORES': return 'flores';
      case 'CIVA': return 'civa';
      case 'ANTEZANA': return 'antezana';
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


      {/* Grid de Trabajo: Editor Lateral + Vista Previa A4 */}
      <div className="rotulos-workspace-grid">
        {/* PANEL LATERAL DE DIGITACIÓN MANUAL */}
        <div className="rotulos-editor-card">

          <div className="slot-editor-header">
            <div className="slot-badge-title">
              <i className="fa-solid fa-pen-to-square"></i>
              <span>Editando Espacio #{activeSlot.id} de 5</span>
            </div>
          </div>

          {/* Botón Maestro Desplegable de Acciones (Por encima de AMEXito IA) */}
          <div className="rotulo-master-actions-wrapper" ref={masterActionsRef}>
            <button
              type="button"
              className={`btn-master-actions ${isMasterActionsOpen ? 'open' : ''}`}
              onClick={() => {
                setIsMasterActionsOpen(!isMasterActionsOpen);
                playSound('click');
              }}
              title="Haz clic para ver opciones de impresión, PDF y limpieza"
            >
              <div className="btn-master-left">
                <div className="btn-master-icon">
                  <i className="fa-solid fa-sliders"></i>
                </div>
                <div className="btn-master-texts">
                  <span className="btn-master-title">Acciones de Hoja A4</span>
                  <span className="btn-master-sub">Imprimir A4 • Descargar PDF • Limpiar</span>
                </div>
              </div>

              <div className="btn-master-right">
                <span className="btn-master-badge">4 Opciones</span>
                <i className={`fa-solid ${isMasterActionsOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-master-arrow`}></i>
              </div>
            </button>

            {isMasterActionsOpen && (
              <div className="master-actions-dropdown-menu">
                <div className="master-actions-menu-header">
                  <i className="fa-solid fa-layer-group"></i>
                  <span>OPCIONES DE IMPRESIÓN Y HOJA</span>
                </div>

                <div className="master-actions-list">
                  {/* Opción 1: Imprimir A4 */}
                  <button
                    type="button"
                    className="master-action-item print-item"
                    onClick={() => {
                      setIsMasterActionsOpen(false);
                      handlePrintDirect();
                    }}
                    title="Imprimir la hoja A4 física directamente (Ctrl + P)"
                  >
                    <div className="master-action-icon-box print">
                      <i className="fa-solid fa-print"></i>
                    </div>
                    <div className="master-action-info">
                      <div className="master-action-name-row">
                        <span className="master-action-name">Imprimir A4 Directo</span>
                        <span className="master-action-tag print">A4 Físico</span>
                      </div>
                      <span className="master-action-desc">Impresión física directa a escala real (Ctrl + P)</span>
                    </div>
                  </button>

                  {/* Opción 2: Descargar PDF */}
                  <button
                    type="button"
                    className="master-action-item pdf-item"
                    onClick={() => {
                      setIsMasterActionsOpen(false);
                      handleDownloadPdf();
                    }}
                    disabled={isExportingPdf}
                    title="Descargar documento PDF listo para imprimir"
                  >
                    <div className="master-action-icon-box pdf">
                      {isExportingPdf ? (
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-file-pdf"></i>
                      )}
                    </div>
                    <div className="master-action-info">
                      <div className="master-action-name-row">
                        <span className="master-action-name">
                          {isExportingPdf ? 'Generando Documento...' : 'Descargar PDF A4'}
                        </span>
                        <span className="master-action-tag pdf">PDF</span>
                      </div>
                      <span className="master-action-desc">Documento PDF vectorial de 5 franjas listo</span>
                    </div>
                  </button>

                  <div className="master-actions-divider"></div>

                  {/* Opción 3: Limpiar Espacio Actual */}
                  <button
                    type="button"
                    className="master-action-item clear-slot-item"
                    onClick={() => {
                      setIsMasterActionsOpen(false);
                      handleClearActiveSlot();
                    }}
                    title={`Borrar los datos del espacio #${activeSlot.id}`}
                  >
                    <div className="master-action-icon-box warning">
                      <i className="fa-solid fa-eraser"></i>
                    </div>
                    <div className="master-action-info">
                      <div className="master-action-name-row">
                        <span className="master-action-name">Limpiar Espacio #{activeSlot.id}</span>
                        <span className="master-action-tag warning">Solo este</span>
                      </div>
                      <span className="master-action-desc">Borrar datos únicamente de este rótulo</span>
                    </div>
                  </button>

                  {/* Opción 4: Limpiar Hoja Completa */}
                  <button
                    type="button"
                    className="master-action-item clear-all-item"
                    onClick={() => {
                      setIsMasterActionsOpen(false);
                      handleClearAll();
                    }}
                    title="Reiniciar todos los 5 espacios de la hoja A4"
                  >
                    <div className="master-action-icon-box danger">
                      <i className="fa-solid fa-rotate-left"></i>
                    </div>
                    <div className="master-action-info">
                      <div className="master-action-name-row">
                        <span className="master-action-name">Limpiar Hoja Completa</span>
                        <span className="master-action-tag danger">5 Espacios</span>
                      </div>
                      <span className="master-action-desc">Reiniciar todos los 5 rótulos a blanco</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Asistente Inteligente AMEXito IA (Superpuesto - Sin empujar los labels) */}
          <div
            className="rotulo-amexito-wrapper"
            ref={amexitoRef}
            onPaste={(e) => {
              setIsAiCardExpanded(true);
              handlePasteCapture(e);
            }}
          >
            <button
              type="button"
              className={`btn-trigger-amexito ${isAiCardExpanded ? 'open' : ''}`}
              onClick={() => {
                setIsAiCardExpanded(!isAiCardExpanded);
                playSound('click');
              }}
              title={isAiCardExpanded ? 'Haz clic para ocultar AMEXito IA' : 'Haz clic para desplegar AMEXito IA'}
            >
              <div className="trigger-amexito-content">
                <span className="ai-robot-icon">🤖</span>
                <span className="trigger-amexito-name">Usar AMEXito IA</span>
                {(aiImagePreview || aiInputText) && (
                  <span className="trigger-amexito-pending">
                    <i className="fa-solid fa-circle-check"></i> Con datos
                  </span>
                )}
              </div>

              <div className="trigger-amexito-cta">
                <span className="trigger-cta-text">{isAiCardExpanded ? 'Ocultar' : 'Desplegar'}</span>
                <i className={`fa-solid ${isAiCardExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} trigger-cta-arrow`}></i>
              </div>
            </button>

            {isAiCardExpanded && (
              <div className="rotulo-ai-card expanded">
                <div className="ai-card-header">
                  <div className="ai-card-identity">
                    <div className="ai-avatar-icon">
                      <span className="ai-robot-icon" style={{ fontSize: '1.2rem' }}>🤖</span>
                    </div>
                    <div className="ai-card-titles">
                      <div className="ai-card-name-row">
                        <span className="ai-card-name">AMEXito IA</span>
                        {(aiImagePreview || aiInputText) && (
                          <span className="ai-card-badge-pending">
                            <i className="fa-solid fa-circle-check"></i> Con datos listos
                          </span>
                        )}
                      </div>
                      <span className="ai-card-sub">
                        Pega texto o presiona Ctrl + V con una captura para autocompletar automáticamente
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ai-collapse-btn"
                    onClick={() => {
                      setIsAiCardExpanded(false);
                      playSound('click');
                    }}
                    title="Ocultar AMEXito IA"
                  >
                    <i className="fa-solid fa-chevron-up"></i>
                    <span>Ocultar</span>
                  </button>
                </div>

                <div className="ai-input-area">
                  <div className="ai-textarea-wrapper">
                    <textarea
                      className="ai-textarea"
                      placeholder="Pega aquí el texto del pedido o presiona Ctrl + V con una captura de WhatsApp (ej: CE79, 2 cajas, Shalom, Nombre, DNI, Teléfono...)"
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      onPaste={handlePasteCapture}
                      rows={2}
                      autoFocus
                    />
                    {aiInputText && (
                      <button
                        type="button"
                        className="ai-textarea-quick-clear"
                        onClick={() => setAiInputText('')}
                        title="Borrar texto"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {aiImagePreview && (
                    <div className="ai-image-preview-chip">
                      <div className="ai-image-thumb-wrapper">
                        <img src={aiImagePreview} alt="Captura cargada" className="ai-image-thumb" />
                      </div>
                      <div className="ai-image-info">
                        <div className="ai-image-header-line">
                          <strong>Captura de WhatsApp cargada</strong>
                          <span className="ai-image-ready-tag">Lista para extraer</span>
                        </div>
                        <span>AMEXito extraerá automáticamente los datos del envío</span>
                      </div>
                      <button
                        type="button"
                        className="ai-remove-img-btn"
                        onClick={() => setAiImagePreview(null)}
                        title="Quitar captura"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                        <span>Quitar</span>
                      </button>
                    </div>
                  )}

                  <div className="ai-controls-row">
                    <div className="ai-controls-left">
                      <label className="ai-upload-label" title="Cargar captura desde archivo">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAiImageUpload}
                          style={{ display: 'none' }}
                        />
                        <i className="fa-solid fa-arrow-up-from-bracket"></i>
                        <span>Subir captura</span>
                      </label>

                      {(aiInputText || aiImagePreview) && (
                        <button
                          type="button"
                          className="ai-clear-btn"
                          onClick={() => {
                            setAiInputText('');
                            setAiImagePreview(null);
                          }}
                          title="Limpiar entrada de IA"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="ai-submit-btn"
                      onClick={handleProcessWithAmexito}
                      disabled={isAiProcessing || (!aiInputText.trim() && !aiImagePreview)}
                      title="Interpretar con AMEXito IA y rellenar automáticamente los campos"
                    >
                      {isAiProcessing ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                          <span>AMEXito analizando...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          <span>Rellenar con AMEXito IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
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

            <div className="rotulo-field-group">
              <label className="rotulo-label">DNI / RUC / CE:</label>
              <input
                type="text"
                className="rotulo-input rotulo-input-dni"
                placeholder="Ej: 72410845"
                value={activeSlot.dni}
                onChange={(e) => updateActiveSlot({ dni: e.target.value.trim().toUpperCase() })}
              />
            </div>

            <div className="rotulo-field-group">
              <label className="rotulo-label">Celular / Teléfono:</label>
              <input
                type="tel"
                className="rotulo-input rotulo-input-cel"
                placeholder="Ej: 982432561"
                value={activeSlot.celular}
                onChange={(e) => updateActiveSlot({ celular: e.target.value.trim() })}
              />
            </div>

            {/* Destino y Agencia de Entrega (Hasta 110 caracteres) - encima de Agencia de Envío */}
            <div className="rotulo-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="rotulo-label">Destino / Agencia de Entrega:</label>
                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: (activeSlot.destino?.length || 0) >= 105 ? '#f87171' : '#94a3b8'
                  }}
                >
                  {activeSlot.destino?.length || 0} / 110 car.
                </span>
              </div>
              <input
                type="text"
                className="rotulo-input"
                maxLength={110}
                placeholder="Ej: LA LIBERTAD - TRUJILLO - AGENCIA TULUEARAS (Hasta 110 caracteres)"
                value={activeSlot.destino}
                onChange={(e) => updateActiveSlot({ destino: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Selector de Agencia (Botón Único con Menú Desplegable) */}
            <div className="rotulo-field-group">
              <label className="rotulo-label">Agencia de Envío:</label>
              <div className="agency-dropdown-wrapper" ref={agencyDropdownRef}>
                <button
                  type="button"
                  className={`btn-select-agency ${isAgencyDropdownOpen ? 'open' : ''} ${getAgencyClass(activeSlot.agencia)}`}
                  onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
                  title="Haz clic para seleccionar o cambiar de agencia"
                >
                  <div className="btn-agency-left">
                    <div className="btn-agency-icon">
                      <i className={AVAILABLE_AGENCIES.find((a) => a.id === activeSlot.agencia)?.icon || 'fa-solid fa-truck-fast'}></i>
                    </div>
                    <div className="btn-agency-texts">
                      <span className="btn-agency-title">
                        {activeSlot.agencia === 'OTRA' && activeSlot.agenciaOtra?.trim()
                          ? activeSlot.agenciaOtra
                          : activeSlot.agencia || 'Seleccionar Agencia'}
                      </span>
                    </div>
                  </div>

                  <div className="btn-agency-right">
                    <span className="btn-agency-badge">
                      {activeSlot.agencia === 'OTRA' ? 'OTRA' : activeSlot.agencia}
                    </span>
                    <i className={`fa-solid ${isAgencyDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-agency-arrow`}></i>
                  </div>
                </button>

                {isAgencyDropdownOpen && (
                  <div className="agency-dropdown-menu">
                    <div className="agency-dropdown-header">
                      <i className="fa-solid fa-truck-ramp-box"></i>
                      <span>SELECCIONAR AGENCIA ({AVAILABLE_AGENCIES.length})</span>
                    </div>

                    <div className="agency-dropdown-list">
                      {AVAILABLE_AGENCIES.map((agency) => {
                        const isSelected = activeSlot.agencia === agency.id;
                        return (
                          <button
                            key={agency.id}
                            type="button"
                            className={`agency-dropdown-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              updateActiveSlot({
                                agencia: agency.id,
                                agenciaOtra: agency.id === 'OTRA' ? (activeSlot.agenciaOtra || '') : undefined
                              });
                              setIsAgencyDropdownOpen(false);
                              playSound('click');
                            }}
                          >
                            <div
                              className="agency-item-icon-box"
                              style={{
                                background: `${agency.color}20`,
                                color: agency.color,
                                borderColor: `${agency.color}50`
                              }}
                            >
                              <i className={agency.icon}></i>
                            </div>

                            <div className="agency-item-info">
                              <span className="agency-item-name">{agency.name}</span>
                            </div>

                            {isSelected && (
                              <div className="agency-item-check">
                                <i className="fa-solid fa-check"></i>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeSlot.agencia === 'OTRA' && (
                  <input
                    type="text"
                    className="rotulo-input"
                    style={{ marginTop: '8px' }}
                    placeholder="Escribe el nombre de la agencia (ej: Marvisur, Cavassa, Chancas...)"
                    value={activeSlot.agenciaOtra || ''}
                    onChange={(e) => updateActiveSlot({ agenciaOtra: e.target.value.toUpperCase() })}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Control Logístico de Bultos y Total de Cajas */}
            <div className="rotulo-embalaje-card">
              <div className="embalaje-card-header">
                <span className="embalaje-card-title">
                  <i className="fa-solid fa-boxes-packing"></i>
                  <span>Bultos y Total de Cajas</span>
                </span>
                <label className="embalaje-auto-toggle">
                  <input
                    type="checkbox"
                    checked={autoDuplicar}
                    onChange={(e) => setAutoDuplicar(e.target.checked)}
                  />
                  <span>Auto-duplicar</span>
                </label>
              </div>

              <div className="rotulo-row-3">
                <div className="rotulo-field-group">
                  <label className="rotulo-label">Cant. Rótulos:</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    className="rotulo-input"
                    value={totalRotulos}
                    onChange={(e) => handleTotalRotulosChange(Number(e.target.value))}
                    title="Cantidad de rótulos a imprimir (1 a 5 por hoja A4)"
                  />
                </div>

                <div className="rotulo-field-group">
                  <label className="rotulo-label">Total Cajas:</label>
                  <input
                    type="number"
                    min={1}
                    className="rotulo-input"
                    placeholder="Ej: 30"
                    value={totalCajas}
                    onChange={(e) => handleTotalCajasChange(e.target.value)}
                    title="Cantidad total de cajas enviadas por el cliente"
                  />
                </div>

                <div className="rotulo-field-group">
                  <label className="rotulo-label">Siglas / Código:</label>
                  <input
                    type="text"
                    className="rotulo-input rotulo-input-siglas"
                    placeholder="Ej: CE150 ó CP 68"
                    value={activeSlot.siglas || ''}
                    onChange={(e) => updateActiveSlot({ siglas: e.target.value.toUpperCase() })}
                    title="Siglas identificadoras o clave del envío (ej: CE150, CP 68)"
                  />
                </div>
              </div>

              <div className="embalaje-preview-bar">
                <span className="embalaje-preview-label">Formato rótulo #{activeSlot.id}:</span>
                <strong className="embalaje-preview-value">
                  {generarTextoBulto(activeSlot.id, totalRotulos, totalCajas)}
                  {activeSlot.siglas?.trim() ? ` • [${activeSlot.siglas.trim().toUpperCase()}]` : ''}
                </strong>
              </div>
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
                  title={`Clic para editar espacio #${slot.id}`}
                >
                  {/* Espacio del rótulo con línea de corte punteada */}

                  {hasData ? (
                    <>
                      {/* Cabecera sutil */}
                      <div className="strip-header">
                        <span className="strip-remitente">{(slot.remitente || 'AMEX COURIER PERÚ').toUpperCase()}</span>
                        {slot.observacion && (
                          <span className="strip-bulto-badge">
                            <i className="fa-solid fa-box-archive" style={{ marginRight: '5px' }}></i>
                            {slot.observacion.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Destinatario y Siglas / Código (debajo del Total de Cajas) */}
                      <div className="strip-destinatario-row">
                        <div className="strip-destinatario">
                          {slot.nombre || 'NOMBRE Y APELLIDO'}
                        </div>
                        {slot.siglas?.trim() && (
                          <div className="strip-siglas-badge" title="Siglas / Código de envío">
                            {slot.siglas.trim().toUpperCase()}
                          </div>
                        )}
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
                      <span>[ Espacio #{slot.id} libre ]</span>
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
