import { useState, useEffect, useCallback, useRef } from 'react';
import { dniDb, DniSlotData } from '@/lib/dni-matrix/db';
import { DniPrintSize } from '@/lib/dni-matrix/docx-exporter';
import { ToastMessage, DniFilterType, ZoomImageState, DniStats } from '../types';

export function useDniMatrixState() {
  const [totalSlots, setTotalSlots] = useState<number>(100);
  const [printSize, setPrintSize] = useState<DniPrintSize>('large');
  const [activeSlotId, setActiveSlotIdState] = useState<number>(1);
  const [focusedSide, setFocusedSide] = useState<'anverso' | 'reverso' | null>(null);

  const setActiveSlotId = useCallback((idOrFn: number | ((prev: number) => number)) => {
    setActiveSlotIdState((prev) => {
      const nextId = typeof idOrFn === 'function' ? idOrFn(prev) : idOrFn;
      dniDb.saveSetting('activeSlotId', nextId).catch(() => {});
      return nextId;
    });
  }, []);

  const [slotsData, setSlotsData] = useState<Record<number, DniSlotData>>({});
  const [currentFilter, setCurrentFilter] = useState<DniFilterType>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [quickJumpVal, setQuickJumpVal] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExtractingName, setIsExtractingName] = useState<boolean>(false);

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [showAmexLinkModal, setShowAmexLinkModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);

  const [zoomImage, setZoomImage] = useState<ZoomImageState | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1.78);
  const [dragHoverSide, setDragHoverSide] = useState<'anverso' | 'reverso' | 'surface' | null>(null);

  const activeSlotRef = useRef<number>(activeSlotId);
  activeSlotRef.current = activeSlotId;

  // Toast helper
  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Web Audio API feedback
  const playSound = useCallback(
    (type: 'complete' | 'paste' | 'click' | 'error') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
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
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'paste') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.16);
        } else if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.08);
        }
      } catch {
        // Silencioso
      }
    },
    [soundEnabled]
  );

  // Carga inicial
  useEffect(() => {
    async function initData() {
      const savedSlots = await dniDb.loadAllSlots();
      const map: Record<number, DniSlotData> = {};
      savedSlots.forEach((s) => {
        map[s.id] = s;
      });
      setSlotsData(map);

      const savedTotal = await dniDb.getSetting<number>('totalSlots', 100);
      setTotalSlots(savedTotal);

      const savedSound = await dniDb.getSetting<boolean>('soundEnabled', true);
      setSoundEnabled(savedSound);

      const savedPrintSize = await dniDb.getSetting<DniPrintSize>('dniPrintSize', 'large');
      setPrintSize(savedPrintSize);

      const savedActiveSlot = await dniDb.getSetting<number>('activeSlotId', 1);
      if (savedActiveSlot && savedActiveSlot >= 1 && savedActiveSlot <= (savedTotal || 100)) {
        setActiveSlotIdState(savedActiveSlot);
      }
    }
    initData();
  }, []);

  const padNum = (num: number): string => String(num).padStart(3, '0');

  const getSlot = useCallback(
    (id: number): DniSlotData => {
      return slotsData[id] || { id };
    },
    [slotsData]
  );

  const updateSlot = useCallback(async (slot: DniSlotData) => {
    setSlotsData((prev) => ({ ...prev, [slot.id]: slot }));
    await dniDb.saveSlot(slot);
  }, []);

  const getSlotStatus = (slot?: DniSlotData): 'ready' | 'partial' | 'empty' => {
    if (!slot) return 'empty';
    if (slot.anverso && slot.reverso) return 'ready';
    if (slot.anverso || slot.reverso) return 'partial';
    return 'empty';
  };

  const jumpToNextIncompleteSlot = useCallback(() => {
    let nextId: number | null = null;
    for (let id = activeSlotRef.current + 1; id <= totalSlots; id++) {
      if (getSlotStatus(slotsData[id]) !== 'ready') {
        nextId = id;
        break;
      }
    }
    if (!nextId) {
      for (let id = 1; id < activeSlotRef.current; id++) {
        if (getSlotStatus(slotsData[id]) !== 'ready') {
          nextId = id;
          break;
        }
      }
    }

    if (nextId) {
      playSound('click');
      setActiveSlotId(nextId);
      setFocusedSide(null);
      showToast(`Avanzando a cupo pendiente #${padNum(nextId)}`, 'info');
    } else {
      if (activeSlotRef.current < totalSlots) {
        playSound('click');
        setActiveSlotId(activeSlotRef.current + 1);
        setFocusedSide(null);
        showToast(`Avanzando a cupo #${padNum(activeSlotRef.current + 1)}`, 'info');
      } else {
        showToast('¡Felicidades! Todos los cupos están 100% completos.', 'success');
        playSound('complete');
      }
    }
  }, [slotsData, totalSlots, playSound, showToast, setActiveSlotId]);

  const handleExtractNameWithAi = async () => {
    const slot = getSlot(activeSlotId);
    if (!slot.anverso) {
      playSound('error');
      showToast('⚠️ Primero pega o carga la imagen del ANVERSO (frente) para que AMEXito lea el nombre.', 'error');
      return;
    }

    try {
      setIsExtractingName(true);
      playSound('click');
      showToast('🤖 AMEXito está leyendo el DNI...', 'info');

      const res = await fetch('/api/ai/extract-dni-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: slot.anverso })
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.nombre_completo) {
        throw new Error(data.error || 'AMEXito no detectó nombres legibles en la imagen.');
      }

      const extractedName = data.nombre_completo.toUpperCase();
      await updateSlot({ ...slot, label: extractedName });
      playSound('complete');
      showToast(`🤖 AMEXito extrajo: ${extractedName}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con AMEXito IA.';
      playSound('error');
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setIsExtractingName(false);
    }
  };

  const rotateSide = async (side: 'anverso' | 'reverso', degrees: number) => {
    const slot = getSlot(activeSlotId);
    if (!slot[side]) return;
    playSound('click');
    showToast(`Rotando ${side}...`);

    const rotKey = side === 'anverso' ? 'anversoRotation' : 'reversoRotation';
    const currentRot = slot[rotKey] || 0;
    const newRot = (currentRot + degrees + 360) % 360;

    await updateSlot({ ...slot, [rotKey]: newRot });
  };

  const clearSide = async (side: 'anverso' | 'reverso') => {
    const slot = getSlot(activeSlotId);
    if (!slot[side]) return;
    playSound('click');
    const rotKey = side === 'anverso' ? 'anversoRotation' : 'reversoRotation';
    await updateSlot({ ...slot, [side]: null, [rotKey]: 0 });
    showToast(`${side === 'anverso' ? 'Anverso' : 'Reverso'} eliminado`);
  };

  const swapSides = async () => {
    const slot = getSlot(activeSlotId);
    if (!slot.anverso && !slot.reverso) return;
    playSound('click');
    await updateSlot({
      ...slot,
      anverso: slot.reverso,
      reverso: slot.anverso,
      anversoRotation: slot.reversoRotation || 0,
      reversoRotation: slot.anversoRotation || 0
    });
    showToast('Caras intercambiadas exitosamente', 'success');
  };

  const processImagePayload = useCallback(
    async (base64Data: string, explicitSide?: 'anverso' | 'reverso' | null) => {
      const currentId = activeSlotRef.current;
      const currentSlot = getSlot(currentId);

      let sideToAssign = explicitSide || focusedSide;
      if (!sideToAssign) {
        if (!currentSlot.anverso) {
          sideToAssign = 'anverso';
        } else if (!currentSlot.reverso) {
          sideToAssign = 'reverso';
        } else {
          sideToAssign = 'anverso';
        }
      }

      const rotKey = sideToAssign === 'anverso' ? 'anversoRotation' : 'reversoRotation';
      const updatedSlot: DniSlotData = {
        ...currentSlot,
        [sideToAssign]: base64Data,
        [rotKey]: 0
      };

      await updateSlot(updatedSlot);
      const sideName = sideToAssign === 'anverso' ? 'Anverso' : 'Reverso';
      showToast(`${sideName} cargado en Expediente #${padNum(currentId)}`, 'success');

      const isNowComplete = Boolean(updatedSlot.anverso && updatedSlot.reverso);
      if (isNowComplete) {
        playSound('complete');
        setFocusedSide(null);
        showToast(
          `¡Expediente #${padNum(currentId)} completado (2 caras)! Presiona ENTER ⏎ para pasar al siguiente cupo`,
          'success'
        );
      } else {
        playSound('paste');
        setFocusedSide('reverso');
      }
    },
    [focusedSide, getSlot, updateSlot, showToast, playSound]
  );

  const convertUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('No canvas context');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch {
          fetchBlobUrl(url).then(resolve).catch(reject);
        }
      };
      img.onerror = () => {
        fetchBlobUrl(url).then(resolve).catch(reject);
      };
      img.src = url;
    });
  };

  const fetchBlobUrl = (url: string): Promise<string> => {
    return fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  };

  const extractBase64FromDataTransfer = async (dt: DataTransfer): Promise<string | null> => {
    if (dt.files && dt.files.length > 0) {
      for (let i = 0; i < dt.files.length; i++) {
        const f = dt.files[i];
        if (f.type.startsWith('image/')) {
          return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => resolve(null);
            r.readAsDataURL(f);
          });
        }
      }
    }

    if (dt.items && dt.items.length > 0) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            return new Promise((resolve) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result as string);
              r.onerror = () => resolve(null);
              r.readAsDataURL(file);
            });
          }
        }
      }
    }

    const html = dt.getData('text/html');
    if (html) {
      const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        const src = match[1];
        if (src.startsWith('data:image')) return src;
        try {
          return await convertUrlToBase64(src);
        } catch {
          // Fallback
        }
      }
    }

    const uri = dt.getData('text/uri-list') || dt.getData('text/plain');
    if (uri && (uri.startsWith('blob:') || uri.startsWith('http') || uri.startsWith('data:image'))) {
      if (uri.startsWith('data:image')) return uri;
      try {
        return await convertUrlToBase64(uri);
      } catch {
        // Fallback
      }
    }

    return null;
  };

  // Window drag/drop prevention
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragHoverSide(null);

      const dt = e.dataTransfer;
      if (!dt) return;

      const base64 = await extractBase64FromDataTransfer(dt);
      if (base64) {
        await processImagePayload(base64, focusedSide);
      }
    };

    window.addEventListener('dragenter', handleWindowDragOver, false);
    window.addEventListener('dragover', handleWindowDragOver, false);
    window.addEventListener('drop', handleWindowDrop, false);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragOver);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [focusedSide, processImagePayload]);

  // Pegado global (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      let imageItem: DataTransferItem | null = null;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageItem = items[i];
          break;
        }
      }

      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        if (base64Data) {
          await processImagePayload(base64Data, focusedSide);
        }
      };

      reader.readAsDataURL(file);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [focusedSide, processImagePayload]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT');

      if (e.key === 'Enter' && !isTyping) {
        e.preventDefault();
        jumpToNextIncompleteSlot();
      } else if (e.key === 'ArrowLeft' && !isTyping) {
        e.preventDefault();
        if (activeSlotRef.current > 1) {
          playSound('click');
          setActiveSlotId((prev) => prev - 1);
        }
      } else if (e.key === 'ArrowRight' && !isTyping) {
        e.preventDefault();
        if (activeSlotRef.current < totalSlots) {
          playSound('click');
          setActiveSlotId((prev) => prev + 1);
        }
      } else if ((e.key === 'r' || e.key === 'R') && !isTyping && !e.ctrlKey) {
        e.preventDefault();
        const targetSide = focusedSide || 'anverso';
        rotateSide(targetSide, 90);
      } else if (e.key === 'Escape') {
        setShowDeleteConfirmModal(false);
        setShowConfigModal(false);
        setShowPreviewModal(false);
        setShowPdfModal(false);
        setShowAmexLinkModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlots, focusedSide, jumpToNextIncompleteSlot, playSound, setActiveSlotId]);

  // Estadísticas globales
  const allSlotsArray = Array.from({ length: totalSlots }, (_, i) => i + 1);
  const stats: DniStats = allSlotsArray.reduce(
    (acc, id) => {
      const st = getSlotStatus(slotsData[id]);
      if (st === 'ready') acc.ready++;
      else if (st === 'partial') acc.partial++;
      else acc.empty++;
      return acc;
    },
    { ready: 0, partial: 0, empty: 0 }
  );

  const progressPercent = totalSlots > 0 ? Math.round((stats.ready / totalSlots) * 100) : 0;

  const filteredSlotIds = allSlotsArray.filter((id) => {
    const st = getSlotStatus(slotsData[id]);
    if (currentFilter === 'ready') return st === 'ready';
    if (currentFilter === 'partial') return st === 'partial';
    if (currentFilter === 'empty') return st === 'empty';
    return true;
  });

  const activeSlot = getSlot(activeSlotId);
  const activeStatus = getSlotStatus(activeSlot);

  return {
    totalSlots,
    setTotalSlots,
    printSize,
    setPrintSize,
    activeSlotId,
    setActiveSlotId,
    activeSlot,
    activeStatus,
    focusedSide,
    setFocusedSide,
    slotsData,
    setSlotsData,
    currentFilter,
    setCurrentFilter,
    soundEnabled,
    setSoundEnabled,
    quickJumpVal,
    setQuickJumpVal,
    toasts,
    isExtractingName,
    previewZoom,
    setPreviewZoom,
    dragHoverSide,
    setDragHoverSide,
    zoomImage,
    setZoomImage,
    stats,
    progressPercent,
    filteredSlotIds,
    showConfigModal,
    setShowConfigModal,
    showPreviewModal,
    setShowPreviewModal,
    showPdfModal,
    setShowPdfModal,
    showAmexLinkModal,
    setShowAmexLinkModal,
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    padNum,
    getSlot,
    updateSlot,
    getSlotStatus,
    jumpToNextIncompleteSlot,
    handleExtractNameWithAi,
    rotateSide,
    clearSide,
    swapSides,
    processImagePayload,
    extractBase64FromDataTransfer,
    playSound,
    showToast
  };
}
