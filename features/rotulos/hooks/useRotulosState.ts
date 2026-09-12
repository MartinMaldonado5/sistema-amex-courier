'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { DEFAULT_SLOTS, MAX_SHEETS, generarTextoBulto } from '../types';
import { RotulosService } from '../services/rotulos.service';

export function useRotulosState() {
  const [slots, setSlots] = useState<RotuloSlotData[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<number>(1);
  const [currentSheet, setCurrentSheet] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Controles de embalajes y cantidades (por defecto: 1 rótulo, 1 caja)
  const [totalRotulos, setTotalRotulos] = useState<string>('1');
  const [totalCajas, setTotalCajas] = useState<string>('1');

  // AMEXito IA
  const [aiInputText, setAiInputText] = useState<string>('');
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isAiCardExpanded, setIsAiCardExpanded] = useState<boolean>(false);

  // Dropdowns
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState<boolean>(false);
  const agencyDropdownRef = useRef<HTMLDivElement>(null);

  const [isMasterActionsOpen, setIsMasterActionsOpen] = useState<boolean>(false);
  const masterActionsRef = useRef<HTMLDivElement>(null);

  const amexitoRef = useRef<HTMLDivElement>(null);

  // Web Audio Synth
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
      // Ignorar
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  }, []);

  // Cargar slots guardados
  useEffect(() => {
    const loaded = RotulosService.loadSlotsFromStorage();
    if (loaded) {
      setSlots(loaded);
      if (loaded[0]?.totalRotulos) setTotalRotulos(String(loaded[0].totalRotulos));
      if (loaded[0]?.totalCajas) setTotalCajas(String(loaded[0].totalCajas));
    }
  }, []);

  // Sincronizar controles numéricos con slot activo
  useEffect(() => {
    const current = slots.find((s) => s.id === activeSlotId);
    if (current) {
      setTotalRotulos(current.totalRotulos ? String(current.totalRotulos) : '1');
      setTotalCajas(current.totalCajas !== undefined && current.totalCajas !== null ? String(current.totalCajas) : '1');
    }
  }, [activeSlotId, slots]);

  // Click outside listener
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

  const saveSlots = (newSlots: RotuloSlotData[]) => {
    setSlots(newSlots);
    RotulosService.saveSlotsToStorage(newSlots);
  };

  const totalSheets = Math.max(1, Math.ceil(slots.length / 5));
  const activeSheetNum = Math.max(1, Math.ceil(activeSlotId / 5));
  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];
  const currentSheetSlots = slots.slice((currentSheet - 1) * 5, currentSheet * 5);

  const updateActiveSlot = (fields: Partial<RotuloSlotData>) => {
    const targetSlot = slots.find((s) => s.id === activeSlotId);
    const targetGroupId = targetSlot?.groupId;

    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        return { ...s, ...fields };
      }
      if (targetGroupId && s.groupId === targetGroupId) {
        const syncedFields = { ...fields };
        delete syncedFields.id;
        delete syncedFields.numeroRotulo;

        if (fields.totalCajas !== undefined || fields.totalRotulos !== undefined) {
          const slotNumRot = s.numeroRotulo || 1;
          const slotTotRots = fields.totalRotulos !== undefined ? fields.totalRotulos : (s.totalRotulos || 1);
          const slotTotCjs = fields.totalCajas !== undefined ? fields.totalCajas : (s.totalCajas || '1');
          syncedFields.observacion = generarTextoBulto(slotNumRot, slotTotRots, slotTotCjs);
        }
        return { ...s, ...syncedFields };
      }
      return s;
    });
    saveSlots(updated);
  };

  const applyTotalRotulosDuplication = (targetCount: number) => {
    let workingSlots = [...slots];
    const currentSlot = workingSlots.find((s) => s.id === activeSlotId) || workingSlots[0];
    const groupId = currentSlot.groupId || `grp_${currentSlot.id}_${Date.now()}`;

    let groupSlots = workingSlots.filter((s) => s.groupId === groupId);
    if (groupSlots.length === 0) {
      groupSlots = [currentSlot];
    }

    const currentGroupCount = groupSlots.length;
    const effectiveTotalCajas = currentSlot.totalCajas || totalCajas || '1';

    // CASO 1: Reducir cantidad (o volver a 1)
    if (targetCount <= currentGroupCount) {
      groupSlots.sort((a, b) => (a.numeroRotulo || 1) - (b.numeroRotulo || 1));

      workingSlots = workingSlots.map((s) => {
        if (s.groupId === groupId) {
          const rotIdx = s.numeroRotulo || 1;
          if (rotIdx <= targetCount) {
            return {
              ...s,
              groupId: targetCount === 1 ? undefined : groupId,
              totalRotulos: targetCount,
              numeroRotulo: rotIdx,
              observacion: generarTextoBulto(rotIdx, targetCount, effectiveTotalCajas)
            };
          } else {
            return {
              id: s.id,
              nombre: '',
              dni: '',
              celular: '',
              agencia: 'SHALOM',
              destino: '',
              remitente: 'AMEX COURIER PERÚ',
              observacion: '',
              totalRotulos: 1,
              totalCajas: '1',
              numeroRotulo: s.id,
              siglas: '',
              groupId: undefined
            };
          }
        }
        return s;
      });

      saveSlots(workingSlots);
      if (targetCount > 1) {
        playSound('click');
        showToast(`🔢 Cantidad ajustada a ${targetCount} rótulos.`);
      }
      return;
    }

    // CASO 2: Aumentar cantidad (duplicar en espacios libres)
    const neededCopies = targetCount - currentGroupCount;
    const isFree = (s: RotuloSlotData) =>
      !s.nombre?.trim() && !s.destino?.trim() && s.groupId !== groupId && s.id !== activeSlotId;

    let freeSlotIndices: number[] = [];
    for (let i = 0; i < workingSlots.length; i++) {
      if (isFree(workingSlots[i])) {
        freeSlotIndices.push(i);
      }
    }

    const activeIdx = workingSlots.findIndex((s) => s.id === activeSlotId);
    const afterActive = freeSlotIndices.filter((idx) => idx > activeIdx);
    const beforeActive = freeSlotIndices.filter((idx) => idx < activeIdx);
    freeSlotIndices = [...afterActive, ...beforeActive];

    while (freeSlotIndices.length < neededCopies && workingSlots.length < MAX_SHEETS * 5) {
      const startId = workingSlots.length + 1;
      const addedSlots: RotuloSlotData[] = Array.from({ length: 5 }, (_, idx) => {
        const id = startId + idx;
        return {
          id,
          nombre: '',
          dni: '',
          celular: '',
          agencia: currentSlot.agencia || '',
          agenciaOtra: currentSlot.agenciaOtra,
          destino: '',
          remitente: currentSlot.remitente || 'AMEX COURIER PERÚ',
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: id,
          siglas: ''
        };
      });
      const newStartIdx = workingSlots.length;
      workingSlots = [...workingSlots, ...addedSlots];
      for (let k = 0; k < 5; k++) {
        freeSlotIndices.push(newStartIdx + k);
      }
    }

    const actualCopiesPossible = Math.min(neededCopies, freeSlotIndices.length);
    if (actualCopiesPossible < neededCopies) {
      showToast(`⚠️ Solo hay ${actualCopiesPossible} espacio(s) libre(s) disponible(s).`);
    }

    const finalTotal = currentGroupCount + actualCopiesPossible;
    const assignedIndices = new Set<number>();
    for (let c = 0; c < actualCopiesPossible; c++) {
      const targetSlotIdx = freeSlotIndices[c];
      assignedIndices.add(targetSlotIdx);
      const newRotuloNum = currentGroupCount + c + 1;

      workingSlots[targetSlotIdx] = {
        ...workingSlots[targetSlotIdx],
        nombre: currentSlot.nombre,
        dni: currentSlot.dni,
        celular: currentSlot.celular,
        agencia: currentSlot.agencia,
        agenciaOtra: currentSlot.agenciaOtra,
        destino: currentSlot.destino,
        remitente: currentSlot.remitente,
        totalCajas: effectiveTotalCajas,
        siglas: currentSlot.siglas,
        groupId: groupId,
        totalRotulos: finalTotal,
        numeroRotulo: newRotuloNum,
        observacion: generarTextoBulto(newRotuloNum, finalTotal, effectiveTotalCajas)
      };
    }

    workingSlots = workingSlots.map((s, idx) => {
      if (assignedIndices.has(idx)) return s;
      if (s.id === activeSlotId || s.groupId === groupId) {
        const rotIdx = s.numeroRotulo || 1;
        return {
          ...s,
          groupId: groupId,
          totalRotulos: finalTotal,
          numeroRotulo: rotIdx,
          observacion: generarTextoBulto(rotIdx, finalTotal, s.totalCajas || effectiveTotalCajas)
        };
      }
      return s;
    });

    saveSlots(workingSlots);
    playSound('paste');
    showToast(`⚡ ¡Duplicado automáticamente en ${actualCopiesPossible} espacio(s) libre(s)! (Total: ${finalTotal} rótulos)`);
  };

  const handleTotalRotulosChange = (rawVal: string) => {
    const cleanVal = rawVal.replace(/\D/g, '');
    setTotalRotulos(cleanVal);
    if (!cleanVal) return;

    const targetCount = parseInt(cleanVal, 10);
    if (targetCount < 1) return;
    if (targetCount > 25) {
      showToast('⚠️ El sistema soporta un máximo de 25 rótulos (5 hojas A4).');
    }
    applyTotalRotulosDuplication(Math.min(25, targetCount));
  };

  const handleTotalRotulosBlur = () => {
    if (!totalRotulos || totalRotulos.trim() === '' || totalRotulos === '0') {
      setTotalRotulos('1');
      applyTotalRotulosDuplication(1);
    }
  };

  const handleTotalCajasChange = (rawVal: string) => {
    const cleanVal = rawVal.replace(/\D/g, '');
    setTotalCajas(cleanVal);

    const currentSlot = slots.find((s) => s.id === activeSlotId) || slots[0];
    const numRotulo = currentSlot.numeroRotulo || 1;
    const rotCount = currentSlot.totalRotulos || (Number(totalRotulos) || 1);

    updateActiveSlot({
      totalCajas: cleanVal,
      observacion: generarTextoBulto(numRotulo, rotCount, cleanVal)
    });
  };

  const handleTotalCajasBlur = () => {
    if (!totalCajas || totalCajas.trim() === '' || totalCajas === '0') {
      handleTotalCajasChange('1');
    }
  };

  const handleSelectSheet = (sheetNum: number) => {
    setCurrentSheet(sheetNum);
    const minSlot = (sheetNum - 1) * 5 + 1;
    const maxSlot = sheetNum * 5;
    if (activeSlotId < minSlot || activeSlotId > maxSlot) {
      setActiveSlotId(minSlot);
    }
    playSound('click');
  };

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
        agencia: activeSlot.agencia || '',
        agenciaOtra: activeSlot.agenciaOtra,
        destino: '',
        remitente: activeSlot.remitente || 'AMEX COURIER PERÚ',
        observacion: '',
        totalRotulos: 1,
        totalCajas: '1',
        numeroRotulo: 1,
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

    const remainingSlots = slots.filter((_, idx) => idx < startIndex || idx >= startIndex + 5);
    const reindexedSlots = remainingSlots.map((s, idx) => {
      const newId = idx + 1;
      const rotIdx = s.numeroRotulo || 1;
      return {
        ...s,
        id: newId,
        numeroRotulo: rotIdx,
        observacion: s.totalRotulos && s.totalCajas ? generarTextoBulto(rotIdx, s.totalRotulos, s.totalCajas) : s.observacion
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
          siglas: '',
          groupId: undefined
        };
      }
      return s;
    });
    setTotalRotulos('1');
    setTotalCajas('1');
    saveSlots(updated);
    const inSheetNum = ((activeSlotId - 1) % 5) + 1;
    showToast(`Hoja ${activeSheetNum} — Espacio #${inSheetNum} limpiado.`);
  };

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
          siglas: '',
          groupId: undefined
        };
      }
      return s;
    });
    saveSlots(updated);
    playSound('click');
    showToast(`🧹 Hoja #${currentSheet} reiniciada (5 espacios limpios).`);
  };

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
    setTotalRotulos('1');
    setTotalCajas('1');
    playSound('click');
    showToast('🧹 Todas las hojas reiniciadas a 1 hoja limpia (5 espacios).');
  };

  const handleSmartCopyToNextFreeSlot = () => {
    const sourceSlot = activeSlot;
    if (!sourceSlot.nombre?.trim() && !sourceSlot.destino?.trim()) {
      playSound('error');
      showToast('⚠️ El rótulo actual está vacío. Digita datos antes de copiar.');
      return;
    }

    const currentIndex = slots.findIndex((s) => s.id === activeSlotId);
    if (currentIndex === -1) return;

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
          agencia: sourceSlot.agencia || '',
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
      targetIndex = workingSlots.length;
      workingSlots = [...workingSlots, ...addedSlots];
      createdNewSheet = true;
    }

    const targetSlotId = workingSlots[targetIndex].id;
    const targetSheet = Math.ceil(targetSlotId / 5);

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

  const handlePrintDirect = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await RotulosService.generatePdf(slots, totalSheets);
      showToast(`📄 ¡PDF A4 (${totalSheets} ${totalSheets === 1 ? 'hoja' : 'hojas'}) descargado exitosamente!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar PDF';
      showToast(`❌ ${msg}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

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

      const extracted = await RotulosService.parseWithAi({
        text: aiInputText,
        imageBase64: aiImagePreview || undefined
      });

      const updates: Partial<RotuloSlotData> = {};
      if (extracted.nombre) updates.nombre = extracted.nombre;
      if (extracted.dni) updates.dni = extracted.dni;
      if (extracted.celular) updates.celular = extracted.celular;
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

      const targetSlot = slots.find((st) => st.id === activeSlotId);
      const targetGroupId = targetSlot?.groupId;

      const updated = slots.map((s) => {
        if (s.id === activeSlotId) {
          const slotTotalCajas = updates.totalCajas || s.totalCajas || cjsNum;
          return {
            ...s,
            ...updates,
            observacion: generarTextoBulto(s.numeroRotulo || 1, Number(totalRotulos) || 1, slotTotalCajas)
          };
        }
        if (targetGroupId && s.groupId === targetGroupId) {
          const slotTotalCajas = updates.totalCajas || s.totalCajas || cjsNum;
          return {
            ...s,
            ...updates,
            observacion: generarTextoBulto(s.numeroRotulo || 1, s.totalRotulos || (Number(totalRotulos) || 1), slotTotalCajas)
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

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text');
    if (!/^\d+$/.test(pasteData)) {
      e.preventDefault();
      const cleanDigits = pasteData.replace(/\D/g, '');
      if (cleanDigits) {
        document.execCommand('insertText', false, cleanDigits);
      }
    }
  };

  return {
    slots,
    activeSlotId,
    setActiveSlotId,
    currentSheet,
    setCurrentSheet,
    totalSheets,
    activeSheetNum,
    activeSlot,
    currentSheetSlots,
    totalRotulos,
    totalCajas,
    isExportingPdf,
    feedbackToast,
    // AI
    aiInputText,
    setAiInputText,
    aiImagePreview,
    setAiImagePreview,
    isAiProcessing,
    isAiCardExpanded,
    setIsAiCardExpanded,
    amexitoRef,
    // Dropdowns
    isAgencyDropdownOpen,
    setIsAgencyDropdownOpen,
    agencyDropdownRef,
    isMasterActionsOpen,
    setIsMasterActionsOpen,
    masterActionsRef,
    // Handlers
    playSound,
    showToast,
    updateActiveSlot,
    handleTotalRotulosChange,
    handleTotalRotulosBlur,
    handleTotalCajasChange,
    handleTotalCajasBlur,
    handleSelectSheet,
    handleAddNewSheet,
    handleDeleteCurrentSheet,
    handleClearActiveSlot,
    handleClearCurrentSheet,
    handleClearAll,
    handleSmartCopyToNextFreeSlot,
    handlePrintDirect,
    handleDownloadPdf,
    handlePasteCapture,
    handleProcessWithAmexito,
    handleNumericKeyDown,
    handleNumericPaste
  };
}
