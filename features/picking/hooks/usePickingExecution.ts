'use client';

import { useState } from 'react';
import { OrdenPicking, ItemPicking, ScanFeedbackMessage } from '../types';
import { PickingService } from '../services/picking.service';

interface UsePickingExecutionProps {
  itemsMap: Record<string, ItemPicking[]>;
  setItemsMap: React.Dispatch<React.SetStateAction<Record<string, ItemPicking[]>>>;
  setOrdenes: React.Dispatch<React.SetStateAction<OrdenPicking[]>>;
  activeExecutionOrder: OrdenPicking | null;
  setActiveExecutionOrder: React.Dispatch<React.SetStateAction<OrdenPicking | null>>;
}

export function usePickingExecution({
  itemsMap,
  setItemsMap,
  setOrdenes,
  activeExecutionOrder,
  setActiveExecutionOrder
}: UsePickingExecutionProps) {
  const [scanFeedbackMessage, setScanFeedbackMessage] = useState<ScanFeedbackMessage | null>(null);
  const [inModalScanInput, setInModalScanInput] = useState('');

  // Sonidos de validación y vibración
  const playSound = (success: boolean) => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(success ? 1320 : 440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // Silent
    }
  };

  const triggerHaptic = (success: boolean) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(success ? [60, 40, 60] : [150, 60, 150]);
      } catch {
        // Silent
      }
    }
  };

  // MARCAR / DESMARCAR ITEM INDIVIDUAL EN PICKING CON PERSISTENCIA EN SUPABASE
  const handleToggleItemCollected = async (item: ItemPicking, order: OrdenPicking) => {
    const nextState = item.estadoItem === 'RECOLECTADO' ? 'PENDIENTE' : 'RECOLECTADO';
    const isCollected = nextState === 'RECOLECTADO';

    playSound(isCollected);
    triggerHaptic(isCollected);

    try {
      await PickingService.toggleItemCollected(item.id, nextState);

      const currentItems = itemsMap[order.id] || [];
      const updatedItems = currentItems.map((it) =>
        it.id === item.id ? { ...it, estadoItem: nextState as 'PENDIENTE' | 'RECOLECTADO' } : it
      );
      const newCollectedCount = updatedItems.filter((it) => it.estadoItem === 'RECOLECTADO').length;

      const newOrderState = await PickingService.updateOrderProgress(
        order.id,
        newCollectedCount,
        order.totalPaquetes
      );

      // Actualizar estado local inmediato
      setItemsMap((prev) => ({
        ...prev,
        [order.id]: updatedItems
      }));

      setOrdenes((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, recolectadosPaquetes: newCollectedCount, estado: newOrderState }
            : o
        )
      );

      if (activeExecutionOrder?.id === order.id) {
        setActiveExecutionOrder((prev) =>
          prev ? { ...prev, recolectadosPaquetes: newCollectedCount, estado: newOrderState } : null
        );
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    }
  };

  // PROCESAR ESCANEO DESDE CÁMARA O ENTRADA MANUAL EN MODO PICKING
  const handleProcessBarcodeInPicking = (code: string) => {
    if (!activeExecutionOrder) return;
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    const currentItems = itemsMap[activeExecutionOrder.id] || [];

    const matchedItem = currentItems.find(
      (it) =>
        it.codigoReciboBodega.toUpperCase() === clean ||
        it.trackingUsa?.toUpperCase() === clean ||
        (clean.length >= 5 && it.codigoReciboBodega.toUpperCase().includes(clean))
    );

    if (matchedItem) {
      if (matchedItem.estadoItem === 'RECOLECTADO') {
        playSound(true);
        setScanFeedbackMessage({
          text: `ℹ️ El paquete ${matchedItem.codigoReciboBodega} ya estaba marcado como recolectado.`,
          isError: false
        });
      } else {
        handleToggleItemCollected(matchedItem, activeExecutionOrder);
        setScanFeedbackMessage({
          text: `✅ ¡Recolectado! ${matchedItem.codigoReciboBodega} (${matchedItem.ubicacionAnaquel})`,
          isError: false
        });
      }
    } else {
      playSound(false);
      triggerHaptic(false);
      setScanFeedbackMessage({
        text: `⚠️ El código "${clean}" NO PERTENECE a esta orden de ${activeExecutionOrder.transportistaAgencia}.`,
        isError: true
      });
    }

    setTimeout(() => {
      setScanFeedbackMessage(null);
    }, 3500);
  };

  return {
    scanFeedbackMessage,
    inModalScanInput,
    setInModalScanInput,
    playSound,
    triggerHaptic,
    handleToggleItemCollected,
    handleProcessBarcodeInPicking
  };
}
