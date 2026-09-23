'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { DEFAULT_SLOTS, DEFAULT_REMITENTE, MAX_SHEETS, generarTextoBulto } from '../types';
import { RotulosService } from '../services/rotulos.service';

export function useRotulosState() {
  const [slots, setSlots] = useState<RotuloSlotData[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<number>(1);
  const [currentSheet, setCurrentSheet] = useState<number>(1);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Historial para Deshacer (Undo / Ctrl + Z)
  const [history, setHistory] = useState<RotuloSlotData[][]>([]);

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

  // Registrar estado en la pila de deshacer
  const pushHistory = useCallback((currentSlots: RotuloSlotData[]) => {
    setHistory((prev) => {
      const copy: RotuloSlotData[] = JSON.parse(JSON.stringify(currentSlots));
      const next = [...prev, copy];
      if (next.length > 25) return next.slice(next.length - 25);
      return next;
    });
  }, []);

  // Función Deshacer (Undo / Ctrl + Z)
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setSlots(previous);
    RotulosService.saveSlotsToStorage(previous);
    playSound('click');
    showToast('↩️ Acción deshecha (Ctrl + Z)');
  }, [history, playSound, showToast]);

  const canUndo = history.length > 0;

  // Atajo de teclado global para Ctrl + Z (Deshacer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        if (!isInput && history.length > 0) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, history.length]);

  // Cargar slots guardados
  useEffect(() => {
    const loaded = RotulosService.loadSlotsFromStorage();
    if (loaded) {
      setSlots(loaded);
      if (loaded[0]?.totalRotulos) setTotalRotulos(String(loaded[0].totalRotulos));
      if (loaded[0]?.totalCajas) setTotalCajas(String(loaded[0].totalCajas));
    }
  }, []);

  // Sincronizar controles numéricos SOLO cuando cambia el slot activo (elimina bucle y pisado al escribir)
  useEffect(() => {
    const current = slots.find((s) => s.id === activeSlotId);
    if (current) {
      setTotalRotulos(current.totalRotulos ? String(current.totalRotulos) : '1');
      setTotalCajas(current.totalCajas !== undefined && current.totalCajas !== null ? String(current.totalCajas) : '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlotId]);

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

  const saveSlots = (newSlots: RotuloSlotData[], recordHistory = false) => {
    if (recordHistory) {
      pushHistory(slots);
    }
    setSlots(newSlots);
    RotulosService.saveSlotsToStorage(newSlots);
  };

  const totalSheets = Math.max(1, Math.ceil(slots.length / 5));
  const activeSheetNum = Math.max(1, Math.ceil(activeSlotId / 5));
  const activeSlot = slots.find((s) => s.id === activeSlotId) || slots[0];
  const currentSheetSlots = slots.slice((currentSheet - 1) * 5, currentSheet * 5);

  const updateActiveSlot = (fields: Partial<RotuloSlotData>) => {
    // El remitente queda fijo e inmodificable como AMEX COURIER PERÚ
    const { remitente: _ignored, ...cleanFields } = fields;
    const targetSlot = slots.find((s) => s.id === activeSlotId);
    const targetGroupId = targetSlot?.groupId;

    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        const slotTotRots = cleanFields.totalRotulos !== undefined ? cleanFields.totalRotulos : (s.totalRotulos || 1);
        const slotTotCjs = cleanFields.totalCajas !== undefined ? cleanFields.totalCajas : (s.totalCajas || '1');
        const numRot = s.numeroRotulo || 1;
        const autoObs = (cleanFields.totalCajas !== undefined || cleanFields.totalRotulos !== undefined)
          ? generarTextoBulto(numRot, slotTotRots, slotTotCjs)
          : (cleanFields.observacion !== undefined ? cleanFields.observacion : s.observacion);

        return { ...s, ...cleanFields, remitente: DEFAULT_REMITENTE, observacion: autoObs };
      }
      if (targetGroupId && s.groupId === targetGroupId) {
        const syncedFields = { ...cleanFields };
        delete syncedFields.id;
        delete syncedFields.numeroRotulo;

        if (cleanFields.totalCajas !== undefined || cleanFields.totalRotulos !== undefined) {
          const slotNumRot = s.numeroRotulo || 1;
          const slotTotRots = cleanFields.totalRotulos !== undefined ? cleanFields.totalRotulos : (s.totalRotulos || 1);
          const slotTotCjs = cleanFields.totalCajas !== undefined ? cleanFields.totalCajas : (s.totalCajas || '1');
          syncedFields.observacion = generarTextoBulto(slotNumRot, slotTotRots, slotTotCjs);
        }
        return { ...s, ...syncedFields, remitente: DEFAULT_REMITENTE };
      }
      return s;
    });
    saveSlots(updated, false);
  };

  const applyTotalRotulosDuplication = (targetCount: number) => {
    pushHistory(slots);
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
              numeroRotulo: 1, // Corregido: era s.id
              siglas: '',
              groupId: undefined
            };
          }
        }
        return s;
      });

      // Poda de hojas vacías sobrantes al final
      while (workingSlots.length > 5) {
        const lastSheet = workingSlots.slice(workingSlots.length - 5);
        const isSheetEmpty = lastSheet.every(
          (s) => !s.nombre?.trim() && !s.dni?.trim() && !s.celular?.trim() && !s.destino?.trim()
        );
        if (isSheetEmpty) {
          workingSlots = workingSlots.slice(0, workingSlots.length - 5);
        } else {
          break;
        }
      }
      const maxAvailableSheet = Math.max(1, Math.ceil(workingSlots.length / 5));
      if (currentSheet > maxAvailableSheet) {
        setCurrentSheet(maxAvailableSheet);
      }
      if (activeSlotId > workingSlots.length) {
        setActiveSlotId(workingSlots.length);
      }

      saveSlots(workingSlots, false);
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
          remitente: DEFAULT_REMITENTE,
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: 1, // Corregido: era id
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
        remitente: DEFAULT_REMITENTE,
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

    saveSlots(workingSlots, false);
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

    // Se delega a updateActiveSlot para sincronizar consistentemente con el número de rótulo de cada slot del grupo
    updateActiveSlot({
      totalCajas: cleanVal
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
    pushHistory(slots);
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
        remitente: DEFAULT_REMITENTE,
        observacion: '',
        totalRotulos: 1,
        totalCajas: '1',
        numeroRotulo: 1,
        siglas: ''
      };
    });
    const updated = [...slots, ...newSheetSlots];
    const newSheetNum = Math.ceil(updated.length / 5);
    saveSlots(updated, false);
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

    pushHistory(slots);
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

    saveSlots(reindexedSlots, false);
    setCurrentSheet(newCurrentSheet);
    setActiveSlotId(newActiveSlotId);
    playSound('click');
    showToast(`🗑️ Hoja #${deletedSheetNum} eliminada. Visualizando Hoja #${newCurrentSheet} de ${newTotalSheets}.`);
  };

  const handleClearActiveSlot = () => {
    pushHistory(slots);
    const updated = slots.map((s) => {
      if (s.id === activeSlotId) {
        return {
          id: s.id,
          nombre: '',
          dni: '',
          celular: '',
          agencia: 'SHALOM' as const,
          destino: '',
          remitente: DEFAULT_REMITENTE,
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: 1, // Corregido: era s.id
          siglas: '',
          groupId: undefined
        };
      }
      return s;
    });
    setTotalRotulos('1');
    setTotalCajas('1');
    saveSlots(updated, false);
    const inSheetNum = ((activeSlotId - 1) % 5) + 1;
    showToast(`Hoja ${activeSheetNum} — Espacio #${inSheetNum} limpiado.`);
  };

  const handleClearCurrentSheet = () => {
    pushHistory(slots);
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
          remitente: DEFAULT_REMITENTE,
          observacion: '',
          totalRotulos: 1,
          totalCajas: '1',
          numeroRotulo: 1, // Corregido: era s.id
          siglas: '',
          groupId: undefined
        };
      }
      return s;
    });
    saveSlots(updated, false);
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
    pushHistory(slots);
    setSlots(DEFAULT_SLOTS);
    saveSlots(DEFAULT_SLOTS, false);
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

    pushHistory(slots);
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
          remitente: DEFAULT_REMITENTE,
          observacion: '',
          totalRotulos: sourceSlot.totalRotulos || 1,
          totalCajas: sourceSlot.totalCajas || '1',
          numeroRotulo: 1, // Corregido: era id
          siglas: ''
        };
      });
      targetIndex = workingSlots.length;
      workingSlots = [...workingSlots, ...addedSlots];
      createdNewSheet = true;
    }

    const targetSlotId = workingSlots[targetIndex].id;
    const targetSheet = Math.ceil(targetSlotId / 5);

    // Corregido: número de rótulo es 1 (o independiente), no el ID físico targetSlotId
    const safeNumRotulo = 1;
    const safeTotalRotulos = sourceSlot.totalRotulos || 1;
    const safeTotalCajas = sourceSlot.totalCajas || '1';

    workingSlots[targetIndex] = {
      ...workingSlots[targetIndex],
      nombre: sourceSlot.nombre,
      dni: sourceSlot.dni,
      celular: sourceSlot.celular,
      agencia: sourceSlot.agencia,
      agenciaOtra: sourceSlot.agenciaOtra,
      destino: sourceSlot.destino,
      remitente: DEFAULT_REMITENTE,
      observacion: generarTextoBulto(safeNumRotulo, safeTotalRotulos, safeTotalCajas),
      totalRotulos: safeTotalRotulos,
      totalCajas: safeTotalCajas,
      numeroRotulo: safeNumRotulo,
      siglas: sourceSlot.siglas
    };

    saveSlots(workingSlots, false);
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

      pushHistory(slots);
      const orders = extracted.items && extracted.items.length > 0 ? extracted.items : [extracted];

      let workingSlots = [...slots];
      let currentTargetId = activeSlotId;

      for (let oIdx = 0; oIdx < orders.length; oIdx++) {
        const order = orders[oIdx];
        const isTargetActive = oIdx === 0;

        let slotIdx = workingSlots.findIndex((s) => s.id === currentTargetId);
        if (
          slotIdx === -1 ||
          (!isTargetActive && (workingSlots[slotIdx].nombre?.trim() || workingSlots[slotIdx].destino?.trim()))
        ) {
          const nextFreeIdx = workingSlots.findIndex(
            (s, idx) => idx > slotIdx && !s.nombre?.trim() && !s.destino?.trim()
          );
          if (nextFreeIdx !== -1) {
            slotIdx = nextFreeIdx;
          } else if (workingSlots.length < MAX_SHEETS * 5) {
            const startId = workingSlots.length + 1;
            const addedSlots: RotuloSlotData[] = Array.from({ length: 5 }, (_, idx) => ({
              id: startId + idx,
              nombre: '',
              dni: '',
              celular: '',
              agencia: 'SHALOM',
              destino: '',
              remitente: DEFAULT_REMITENTE,
              observacion: '',
              totalRotulos: 1,
              totalCajas: '1',
              numeroRotulo: 1,
              siglas: ''
            }));
            slotIdx = workingSlots.length;
            workingSlots = [...workingSlots, ...addedSlots];
          }
        }

        if (slotIdx !== -1) {
          const targetSlot = workingSlots[slotIdx];
          const cjsNum = order.totalCajas ? String(order.totalCajas).replace(/[^0-9]/g, '') || '1' : '1';
          const rotCount = 1;
          const numRot = 1;

          workingSlots[slotIdx] = {
            ...targetSlot,
            nombre: order.nombre || '',
            dni: order.dni ? String(order.dni).replace(/\D/g, '').slice(0, 11) : '',
            celular: order.celular ? String(order.celular).replace(/\D/g, '').slice(0, 9) : '',
            agencia: order.agencia || 'SHALOM',
            agenciaOtra: order.agenciaOtra || '',
            destino: order.destino || '',
            remitente: DEFAULT_REMITENTE,
            siglas: order.siglas || '',
            totalCajas: cjsNum,
            totalRotulos: rotCount,
            numeroRotulo: numRot,
            observacion: generarTextoBulto(numRot, rotCount, cjsNum)
          };

          if (isTargetActive) {
            setTotalCajas(cjsNum);
            setTotalRotulos('1');
          }

          currentTargetId = targetSlot.id + 1;
        }
      }

      saveSlots(workingSlots, false);
      playSound('complete');

      if (orders.length > 1) {
        showToast(`🤖 ¡AMEXito extrajo ${orders.length} pedidos y los colocó en espacios libres!`);
      } else {
        const inSheetNum = ((activeSlotId - 1) % 5) + 1;
        showToast(`🤖 ¡AMEXito rellenó Hoja ${activeSheetNum} — Espacio #${inSheetNum}!`);
      }
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
    // Deshacer
    canUndo,
    handleUndo,
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
