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

export const MAX_SHEETS = 5;

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
  const [currentSheet, setCurrentSheet] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Estados de control de embalajes y cantidades (por defecto: 1 rótulo, 1 caja)
  const [totalRotulos, setTotalRotulos] = useState<number>(1);
  const [totalCajas, setTotalCajas] = useState<string>('1');

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

  // Cargar borrador persistido desde LocalStorage (soporta hasta MAX_SHEETS = 5 hojas)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('amex_rotulos_a4_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 5 && parsed.length % 5 === 0) {
          // Si contenía los datos de prueba anteriores con KENNETH MALDONADO, reiniciar a limpio
          if (parsed[0]?.nombre === 'KENNETH MALDONADO') {
            localStorage.removeItem('amex_rotulos_a4_slots');
            setSlots(DEFAULT_SLOTS);
            setTotalRotulos(1);
            setTotalCajas('1');
            return;
          }
          // Limitar estrictamente al máximo de MAX_SHEETS (5 hojas = 25 rótulos)
          const cappedSlots = parsed.slice(0, MAX_SHEETS * 5);
          setSlots(cappedSlots);
          if (cappedSlots[0]?.totalRotulos) setTotalRotulos(cappedSlots[0].totalRotulos);
          if (cappedSlots[0]?.totalCajas) setTotalCajas(String(cappedSlots[0].totalCajas));
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
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const totalSheets = Math.max(1, Math.ceil(slots.length / 5));
  const activeSheetNum = Math.max(1, Math.ceil(activeSlotId / 5));
  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];
  const currentSheetSlots = slots.slice((currentSheet - 1) * 5, currentSheet * 5);

  const handleTotalRotulosChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(100, newCount));
    setTotalRotulos(clamped);
    updateActiveSlot({
      totalRotulos: clamped,
      observacion: generarTextoBulto(activeSlot.id, clamped, totalCajas)
    });
  };

  const handleTotalCajasChange = (newVal: string) => {
    setTotalCajas(newVal);
    updateActiveSlot({
      totalCajas: newVal,
      observacion: generarTextoBulto(activeSlot.id, totalRotulos, newVal)
    });
  };

  const updateActiveSlot = (fields: Partial<RotuloSlotData>) => {
    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        return { ...s, ...fields };
      }
      return s;
    });
    saveSlots(updated);
  };

  // Cambiar de hoja asegurando sincronía con el slot activo
  const handleSelectSheet = (sheetNum: number) => {
    setCurrentSheet(sheetNum);
    const minSlot = (sheetNum - 1) * 5 + 1;
    const maxSlot = sheetNum * 5;
    if (activeSlotId < minSlot || activeSlotId > maxSlot) {
      setActiveSlotId(minSlot);
    }
    playSound('click');
  };

  // Agregar una nueva hoja A4 (+5 espacios) con límite estricto de MAX_SHEETS (5)
  const handleAddNewSheet = () => {
    if (totalSheets >= MAX_SHEETS) {
      playSound('error');
      showToast(`⚠️ Has alcanzado el límite máximo de ${MAX_SHEETS} hojas (25 rótulos).`);
      return;
    }
    const startId = slots.length + 1;
    const newSheetSlots: RotuloSlotData[] = Array.from({ length: 5 }, (_, idx) => {
      const id = startId + idx;
      return {
        id,
        nombre: '',
        dni: '',
        celular: '',
        agencia: activeSlot.agencia || 'SHALOM',
        agenciaOtra: activeSlot.agenciaOtra,
        destino: '',
        remitente: activeSlot.remitente || 'AMEX COURIER PERÚ',
        observacion: '',
        totalRotulos: 1,
        totalCajas: '1',
        numeroRotulo: id,
        siglas: ''
      };
    });
    const updated = [...slots, ...newSheetSlots];
    const newSheetNum = Math.ceil(updated.length / 5);
    saveSlots(updated);
    setCurrentSheet(newSheetNum);
    setActiveSlotId(startId);
    playSound('complete');
    showToast(`📄 Hoja #${newSheetNum} agregada (Espacios #${startId} al #${startId + 4}).`);
  };

  // Eliminar la hoja actual en visualización (siempre que haya más de 1 hoja)
  const handleDeleteCurrentSheet = () => {
    if (slots.length <= 5) {
      playSound('error');
      showToast('⚠️ No puedes eliminar la única hoja existente.');
      return;
    }

    const startIndex = (currentSheet - 1) * 5;
    const sheetSlotsToDelete = slots.slice(startIndex, startIndex + 5);
    const hasData = sheetSlotsToDelete.some((s) => Boolean(s.nombre?.trim() || s.destino?.trim()));
    if (hasData) {
      if (!window.confirm(`La Hoja #${currentSheet} contiene datos en sus rótulos. ¿Deseas eliminar esta hoja y sus 5 espacios?`)) {
        return;
      }
    }

    // Filtrar los 5 slots correspondientes a currentSheet
    const remainingSlots = slots.filter((_, idx) => idx < startIndex || idx >= startIndex + 5);

    // Reindexar correlativamente todos los slots para que sigan siendo 1..N
    const reindexedSlots = remainingSlots.map((s, idx) => {
      const newId = idx + 1;
      return {
        ...s,
        id: newId,
        numeroRotulo: newId,
        observacion: s.totalRotulos && s.totalCajas ? generarTextoBulto(newId, s.totalRotulos, s.totalCajas) : s.observacion
      };
    });

    const deletedSheetNum = currentSheet;
    const newTotalSheets = Math.ceil(reindexedSlots.length / 5);
    const newCurrentSheet = Math.min(currentSheet, newTotalSheets);
    const newActiveSlotId = (newCurrentSheet - 1) * 5 + 1;

    saveSlots(reindexedSlots);
    setCurrentSheet(newCurrentSheet);
    setActiveSlotId(newActiveSlotId);
    playSound('click');
    showToast(`🗑️ Hoja #${deletedSheetNum} eliminada. Visualizando Hoja #${newCurrentSheet} de ${newTotalSheets}.`);
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
    const inSheetNum = ((activeSlotId - 1) % 5) + 1;
    showToast(`Hoja ${activeSheetNum} — Espacio #${inSheetNum} limpiado.`);
  };

  // Limpiar toda la hoja actualmente visualizada
  const handleClearCurrentSheet = () => {
    const startIdx = (currentSheet - 1) * 5;
    const endIdx = currentSheet * 5;
    const updated = slots.map((s, idx) => {
      if (idx >= startIdx && idx < endIdx) {
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
    saveSlots(updated);
    playSound('click');
    showToast(`🧹 Hoja #${currentSheet} reiniciada (5 espacios limpios).`);
  };

  // Reiniciar todas las hojas (vuelve a 1 sola hoja de 5 espacios)
  const handleClearAll = () => {
    const hasAnyData = slots.some((s) => Boolean(s.nombre?.trim() || s.destino?.trim()));
    if (hasAnyData) {
      if (!window.confirm(`¿Estás seguro de reiniciar todas las ${totalSheets} hojas (${slots.length} espacios)? Se borrarán los datos.`)) {
        return;
      }
    }
    setSlots(DEFAULT_SLOTS);
    saveSlots(DEFAULT_SLOTS);
    setCurrentSheet(1);
    setActiveSlotId(1);
    setTotalRotulos(1);
    setTotalCajas('1');
    playSound('click');
    showToast('🧹 Todas las hojas reiniciadas a 1 hoja limpia (5 espacios).');
  };

  // Botón Inteligente: Copiar en el siguiente espacio libre (omite ocupados y crea hoja si es necesario)
  const handleSmartCopyToNextFreeSlot = () => {
    const sourceSlot = activeSlot;
    if (!sourceSlot.nombre?.trim() && !sourceSlot.destino?.trim()) {
      playSound('error');
      showToast('⚠️ El rótulo actual está vacío. Digita datos antes de copiar.');
      return;
    }

    const currentIndex = slots.findIndex((s) => s.id === activeSlotId);
    if (currentIndex === -1) return;

    // Buscar el primer slot vacío que esté posterior al actual
    let targetIndex = -1;
    for (let i = currentIndex + 1; i < slots.length; i++) {
      const s = slots[i];
      if (!s.nombre?.trim() && !s.destino?.trim()) {
        targetIndex = i;
        break;
      }
    }

    let workingSlots = [...slots];
    let createdNewSheet = false;

    // Si no hay espacios libres hacia adelante, agregamos una nueva hoja (+5) y copiamos en su primer espacio
    if (targetIndex === -1) {
      if (totalSheets >= MAX_SHEETS) {
        playSound('error');
        showToast(`⚠️ Límite de ${MAX_SHEETS} hojas (25 rótulos) alcanzado. No hay más espacios disponibles.`);
        return;
      }
      const startId = workingSlots.length + 1;
      const addedSlots: RotuloSlotData[] = Array.from({ length: 5 }, (_, idx) => {
        const id = startId + idx;
        return {
          id,
          nombre: '',
          dni: '',
          celular: '',
          agencia: sourceSlot.agencia || 'SHALOM',
          agenciaOtra: sourceSlot.agenciaOtra,
          destino: '',
          remitente: sourceSlot.remitente || 'AMEX COURIER PERÚ',
          observacion: '',
          totalRotulos: sourceSlot.totalRotulos || 1,
          totalCajas: sourceSlot.totalCajas || '1',
          numeroRotulo: id,
          siglas: ''
        };
      });
      targetIndex = workingSlots.length; // primer espacio de la nueva hoja
      workingSlots = [...workingSlots, ...addedSlots];
      createdNewSheet = true;
    }

    const targetSlotId = workingSlots[targetIndex].id;
    const targetSheet = Math.ceil(targetSlotId / 5);

    // Copiar datos del origen al destino
    workingSlots[targetIndex] = {
      ...workingSlots[targetIndex],
      nombre: sourceSlot.nombre,
      dni: sourceSlot.dni,
      celular: sourceSlot.celular,
      agencia: sourceSlot.agencia,
      agenciaOtra: sourceSlot.agenciaOtra,
      destino: sourceSlot.destino,
      remitente: sourceSlot.remitente,
      observacion: generarTextoBulto(targetSlotId, sourceSlot.totalRotulos || 1, sourceSlot.totalCajas || '1'),
      totalRotulos: sourceSlot.totalRotulos,
      totalCajas: sourceSlot.totalCajas,
      siglas: sourceSlot.siglas
    };

    saveSlots(workingSlots);
    setCurrentSheet(targetSheet);
    setActiveSlotId(targetSlotId);
    playSound('paste');

    const skippedCount = targetIndex - currentIndex - 1;
    const targetInSheet = ((targetSlotId - 1) % 5) + 1;
    if (createdNewSheet) {
      showToast(`⚡ ¡Hoja #${targetSheet} creada! Copiado en Hoja ${targetSheet} — Espacio #${targetInSheet}`);
    } else if (skippedCount > 0) {
      showToast(`⚡ Copiado a Hoja ${targetSheet} — Espacio #${targetInSheet} (Omitió ${skippedCount} ocupado(s))`);
    } else {
      showToast(`⚡ Copiado a Hoja ${targetSheet} — Espacio #${targetInSheet}`);
    }
  };

  // Imprimir directo con el diálogo del navegador
  const handlePrintDirect = () => {
    window.print();
  };

  // Descargar archivo PDF A4 (soporta todas las hojas generadas)
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await generateRotulosA4Pdf(slots, `Rotulos_Agencias_${slots.length}x_${totalSheets}Hojas_A4`);
      showToast(`📄 ¡PDF A4 (${totalSheets} ${totalSheets === 1 ? 'hoja' : 'hojas'}) descargado exitosamente!`);
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
      const inSheetNum = ((activeSlotId - 1) % 5) + 1;
      showToast(`🤖 ¡AMEXito rellenó Hoja ${activeSheetNum} — Espacio #${inSheetNum}!`);
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

  // Renderizador reutilizable de cada franja A4 (59.4 mm) tanto para pantalla como para impresión
  const renderStrip = (slot: RotuloSlotData, isInteractive = true) => {
    const hasData = Boolean(slot.nombre || slot.dni || slot.celular || slot.destino);
    const agencyClass = getAgencyClass(slot.agencia);
    const agencyDisplayName = slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
      ? slot.agenciaOtra
      : slot.agencia;

    const sheetNum = Math.ceil(slot.id / 5);
    const slotInSheet = ((slot.id - 1) % 5) + 1;

    return (
      <div
        key={slot.id}
        className={`rotulo-strip-preview ${isInteractive && slot.id === activeSlotId ? 'active' : ''}`}
        onClick={isInteractive ? () => {
          setActiveSlotId(slot.id);
          setCurrentSheet(sheetNum);
        } : undefined}
        title={isInteractive ? `Clic para editar Hoja ${sheetNum} — Espacio #${slotInSheet}` : undefined}
      >
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

            {/* Destinatario y Siglas / Código */}
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

            {/* DNI / RUC y Celular apilados verticalmente */}
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
            <span>[ Hoja {sheetNum} — Espacio #{slotInSheet} libre ]</span>
          </div>
        )}
      </div>
    );
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
              <div className="slot-sheet-pill">
                <i className="fa-solid fa-file-lines"></i>
                <span>Hoja {activeSheetNum} de {totalSheets}</span>
              </div>
              <div className="slot-number-pill">
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Hoja {activeSheetNum} • Espacio #{((activeSlot.id - 1) % 5) + 1}</span>
              </div>
            </div>

            <div className="slot-header-actions">
              <button
                type="button"
                className="btn-smart-copy"
                onClick={handleSmartCopyToNextFreeSlot}
                title="Copiar este rótulo en el siguiente espacio libre (omite ocupados y crea hoja si es necesario)"
              >
                <i className="fa-solid fa-bolt-lightning"></i>
                <span>Copiar en sig. libre</span>
              </button>
              <button
                type="button"
                className="btn-clear-slot-header"
                onClick={handleClearActiveSlot}
                title={`Limpiar datos de Hoja ${activeSheetNum} — Espacio #${((activeSlot.id - 1) % 5) + 1}`}
              >
                <i className="fa-solid fa-eraser"></i>
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Selector Rápido de Rótulos de la Hoja Actual */}
          <div className="slot-quick-selector">
            <span className="slot-quick-label">
              <i className="fa-solid fa-list-ol"></i>
              <span>Espacios Hoja {currentSheet}:</span>
            </span>
            <div className="slot-quick-btns-row">
              {currentSheetSlots.map((s) => {
                const isSelected = s.id === activeSlotId;
                const hasData = Boolean(s.nombre?.trim() || s.destino?.trim());
                const inSheetNum = ((s.id - 1) % 5) + 1;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`slot-quick-pill ${isSelected ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
                    onClick={() => {
                      setActiveSlotId(s.id);
                      playSound('click');
                    }}
                    title={`Hoja ${currentSheet} — Espacio #${inSheetNum} ${hasData ? `(${s.nombre || 'Con datos'})` : '(Vacío)'}`}
                  >
                    <span className="slot-quick-num">#{inSheetNum}</span>
                    <span className={`slot-status-dot ${hasData ? 'filled' : 'empty'}`}></span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARRA SUPERIOR DE 3 COLUMNAS: [AMEXito IA] | [Seleccionar Agencia] | [Acciones] */}
          <div className="rotulo-top-toolbar-3col">

            {/* 1. IZQUIERDA: Asistente Inteligente AMEXito IA */}
            <div
              className="rotulo-toolbar-col amexito"
              ref={amexitoRef}
              onPaste={(e) => {
                setIsAiCardExpanded(true);
                handlePasteCapture(e);
              }}
            >
              <button
                type="button"
                className={`btn-toolbar-col btn-amexito-col ${isAiCardExpanded ? 'open' : ''}`}
                onClick={() => {
                  setIsAiCardExpanded(!isAiCardExpanded);
                  playSound('click');
                }}
                title={isAiCardExpanded ? 'Ocultar AMEXito IA' : 'Usar AMEXito IA para autocompletar con texto o capturas'}
              >
                <div className="btn-col-content">
                  <span className="ai-robot-icon">🤖</span>
                  <span className="btn-col-title">AMEXito IA</span>
                </div>
                <div className="btn-col-right">
                  {(aiImagePreview || aiInputText) && (
                    <span className="amexito-dot-indicator" title="Con datos cargados"></span>
                  )}
                  <i className={`fa-solid ${isAiCardExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
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

            {/* 2. MEDIO: Selector de Agencia de Envío */}
            <div className="rotulo-toolbar-col agency" ref={agencyDropdownRef}>
              <button
                type="button"
                className={`btn-toolbar-col btn-agency-col ${isAgencyDropdownOpen ? 'open' : ''} ${getAgencyClass(activeSlot.agencia)}`}
                onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
                title="Haz clic para seleccionar o cambiar la agencia de envío"
              >
                <div className="btn-col-content">
                  <span className="agency-col-icon">
                    <i className={AVAILABLE_AGENCIES.find((a) => a.id === activeSlot.agencia)?.icon || 'fa-solid fa-truck-fast'}></i>
                  </span>
                  <span className="btn-col-title">
                    {activeSlot.agencia === 'OTRA' && activeSlot.agenciaOtra?.trim()
                      ? activeSlot.agenciaOtra
                      : activeSlot.agencia || 'Agencia'}
                  </span>
                </div>
                <div className="btn-col-right">
                  <i className={`fa-solid ${isAgencyDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
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
            </div>

            {/* 3. DERECHA: Botón Maestro de Acciones (Llamado solamente "Acciones") */}
            <div className="rotulo-toolbar-col actions" ref={masterActionsRef}>
              <button
                type="button"
                className={`btn-toolbar-col btn-actions-col ${isMasterActionsOpen ? 'open' : ''}`}
                onClick={() => {
                  setIsMasterActionsOpen(!isMasterActionsOpen);
                  playSound('click');
                }}
                title="Haz clic para ver opciones de impresión, PDF y limpieza"
              >
                <div className="btn-col-content">
                  <span className="actions-col-icon">
                    <i className="fa-solid fa-sliders"></i>
                  </span>
                  <span className="btn-col-title">Acciones</span>
                </div>
                <div className="btn-col-right">
                  <span className="actions-badge-pill">
                    {5 + (totalSheets < MAX_SHEETS ? 1 : 0) + (totalSheets > 1 ? 1 : 0)}
                  </span>
                  <i className={`fa-solid ${isMasterActionsOpen ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
                </div>
              </button>

              {isMasterActionsOpen && (
                <div className="master-actions-dropdown-menu">
                  <div className="master-actions-menu-header">
                    <i className="fa-solid fa-sliders"></i>
                    <span>ACCIONES RÁPIDAS</span>
                  </div>

                  <div className="master-actions-list">
                    {/* Opción 1: Imprimir A4 Directo */}
                    <button
                      type="button"
                      className="master-action-item print-item"
                      onClick={() => {
                        setIsMasterActionsOpen(false);
                        handlePrintDirect();
                      }}
                      title="Imprimir directamente a escala real (Ctrl + P)"
                    >
                      <div className="master-action-icon-box print">
                        <i className="fa-solid fa-print"></i>
                      </div>
                      <span className="master-action-name">Imprimir A4</span>
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
                      <span className="master-action-name">
                        {isExportingPdf ? 'Generando...' : 'Descargar PDF'}
                      </span>
                    </button>

                    <div className="master-actions-divider"></div>

                    {/* Opción 3: Agregar Nueva Hoja (solo si totalSheets < MAX_SHEETS) */}
                    {totalSheets < MAX_SHEETS && (
                      <button
                        type="button"
                        className="master-action-item add-sheet-item"
                        onClick={() => {
                          setIsMasterActionsOpen(false);
                          handleAddNewSheet();
                        }}
                        title="Agregar una nueva hoja A4 (+5 rótulos)"
                      >
                        <div className="master-action-icon-box add">
                          <i className="fa-solid fa-plus"></i>
                        </div>
                        <span className="master-action-name">Nueva Hoja</span>
                      </button>
                    )}

                    {/* Opción 4: Eliminar Hoja Actual */}
                    {totalSheets > 1 && (
                      <button
                        type="button"
                        className="master-action-item del-sheet-item"
                        onClick={() => {
                          setIsMasterActionsOpen(false);
                          handleDeleteCurrentSheet();
                        }}
                        title={`Eliminar la Hoja #${currentSheet} actual`}
                      >
                        <div className="master-action-icon-box delete">
                          <i className="fa-solid fa-trash-can"></i>
                        </div>
                        <span className="master-action-name">Eliminar Hoja {currentSheet}</span>
                      </button>
                    )}

                    <div className="master-actions-divider"></div>

                    {/* Opción 5: Limpiar Espacio Actual */}
                    <button
                      type="button"
                      className="master-action-item clear-slot-item"
                      onClick={() => {
                        setIsMasterActionsOpen(false);
                        handleClearActiveSlot();
                      }}
                      title={`Limpiar los datos del espacio #${activeSlot.id}`}
                    >
                      <div className="master-action-icon-box warning">
                        <i className="fa-solid fa-eraser"></i>
                      </div>
                      <span className="master-action-name">Limpiar Espacio #{activeSlot.id}</span>
                    </button>

                    {/* Opción 6: Limpiar Hoja Actual */}
                    <button
                      type="button"
                      className="master-action-item clear-sheet-item"
                      onClick={() => {
                        setIsMasterActionsOpen(false);
                        handleClearCurrentSheet();
                      }}
                      title={`Limpiar los 5 espacios de la Hoja #${currentSheet}`}
                    >
                      <div className="master-action-icon-box warning">
                        <i className="fa-solid fa-broom"></i>
                      </div>
                      <span className="master-action-name">Limpiar Hoja #{currentSheet}</span>
                    </button>

                    {/* Opción 7: Limpiar Todo */}
                    <button
                      type="button"
                      className="master-action-item clear-all-item"
                      onClick={() => {
                        setIsMasterActionsOpen(false);
                        handleClearAll();
                      }}
                      title="Reiniciar todas las hojas a 1 hoja limpia"
                    >
                      <div className="master-action-icon-box danger">
                        <i className="fa-solid fa-rotate-left"></i>
                      </div>
                      <span className="master-action-name">Reiniciar Todo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Banner si seleccionó 'OTRA' agencia personalizada */}
          {activeSlot.agencia === 'OTRA' && (
            <div className="rotulo-otra-agencia-banner">
              <label className="rotulo-label">Nombre de Agencia Personalizada:</label>
              <input
                type="text"
                className="rotulo-input"
                placeholder="Escribe el nombre de la agencia (ej: Marvisur, Cavassa, Chancas...)"
                value={activeSlot.agenciaOtra || ''}
                onChange={(e) => updateActiveSlot({ agenciaOtra: e.target.value.toUpperCase() })}
                autoFocus
              />
            </div>
          )}

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



            {/* Control Logístico de Bultos y Total de Cajas */}
            <div className="rotulo-embalaje-card">
              <div className="embalaje-card-header">
                <span className="embalaje-card-title">
                  <i className="fa-solid fa-boxes-packing"></i>
                  <span>Bultos y Total de Cajas</span>
                </span>
              </div>

              <div className="rotulo-row-3">
                <div className="rotulo-field-group">
                  <label className="rotulo-label">Cant. Rótulos:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className="rotulo-input"
                    value={totalRotulos}
                    onChange={(e) => handleTotalRotulosChange(Number(e.target.value))}
                    title="Cantidad de rótulos del pedido (para órdenes de múltiples bultos)"
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
          {/* Barra Navegadora de Hojas A4 */}
          <div className="preview-sheet-navigator">
            <div className="sheet-nav-left">
              <div className="sheet-tabs-list">
                {Array.from({ length: totalSheets }, (_, i) => {
                  const sheetNum = i + 1;
                  const sheetSlots = slots.slice(i * 5, (i + 1) * 5);
                  const filledCount = sheetSlots.filter((s) => Boolean(s.nombre?.trim() || s.destino?.trim())).length;
                  const isActive = sheetNum === currentSheet;

                  return (
                    <button
                      key={sheetNum}
                      type="button"
                      className={`sheet-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectSheet(sheetNum)}
                      title={`Ver Hoja ${sheetNum} (${filledCount}/5 con datos)`}
                    >
                      <i className="fa-regular fa-file"></i>
                      <span className="sheet-tab-name">Hoja {sheetNum}</span>
                      <span className={`sheet-tab-pill ${filledCount === 5 ? 'full' : filledCount > 0 ? 'partial' : 'empty'}`}>
                        {filledCount}/5
                      </span>
                    </button>
                  );
                })}
              </div>

              {totalSheets < MAX_SHEETS && (
                <button
                  type="button"
                  className="btn-add-sheet"
                  onClick={handleAddNewSheet}
                  title="Agregar una nueva hoja A4 (+5 rótulos)"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Nueva Hoja</span>
                </button>
              )}
            </div>

            <div className="sheet-nav-right">
              <span className="sheet-nav-total-pill">
                <i className="fa-solid fa-layer-group"></i>
                <span>{slots.length} rótulos ({totalSheets}/{MAX_SHEETS} {totalSheets === 1 ? 'hoja' : 'hojas'})</span>
              </span>
              {totalSheets > 1 && (
                <button
                  type="button"
                  className="btn-delete-current-sheet"
                  onClick={handleDeleteCurrentSheet}
                  title={`Eliminar la Hoja #${currentSheet} que estás visualizando`}
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Eliminar Hoja {currentSheet}</span>
                </button>
              )}
            </div>
          </div>

          {/* Hoja A4 en Pantalla (Muestra la hoja activa con sus 5 franjas) */}
          <div className="rotulos-a4-sheet screen-only-sheet">
            <div className="sheet-corner-tag">
              HOJA {currentSheet} DE {totalSheets}
            </div>
            {currentSheetSlots.map((slot) => renderStrip(slot, true))}
          </div>

          {/* Contenedor Oculto para Impresión (window.print()) con todas las hojas físicas */}
          <div className="print-sheets-wrapper">
            {Array.from({ length: totalSheets }, (_, sheetIdx) => {
              const pageSlots = slots.slice(sheetIdx * 5, (sheetIdx + 1) * 5);
              return (
                <div key={sheetIdx} className="rotulos-a4-sheet print-sheet-page">
                  {pageSlots.map((slot) => renderStrip(slot, false))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
