import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';
import { ItemCotejo, Paquete, TipoEstadoItemCotejo } from '@/types';
import { ActiveCell, EditingCell, SheetRow } from '../types';

interface UseLiveSheetsKeyboardProps {
  activeHojaId: string | null;
  items: ItemCotejo[];
  setItems: React.Dispatch<React.SetStateAction<ItemCotejo[]>>;
  visibleRows: SheetRow[];
  paquetes: Paquete[];
  operatorName: string;
  checkCodeInManifest: (code: string) => ItemCotejo | undefined;
  handleClearScanAtRow: (itemId: string) => Promise<void>;
  broadcastActiveCell: (col: string, row: number) => void;
}

export function useLiveSheetsKeyboard({
  activeHojaId,
  items,
  setItems,
  visibleRows,
  paquetes,
  operatorName,
  checkCodeInManifest,
  handleClearScanAtRow,
  broadcastActiveCell
}: UseLiveSheetsKeyboardProps) {
  // Barcode Gun Scanning Input State
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Active Cell Selection
  const [activeCell, setActiveCell] = useState<ActiveCell>({
    col: 'D',
    row: 2,
    val: '',
    itemId: undefined
  });

  // Inline direct cell editing
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Audio settings
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const focusBarcodeInput = useCallback(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Obtener valor de celda por col y row
  const getCellValue = useCallback(
    (col: string, rowNum: number): string => {
      const itemIndex = rowNum - 2;
      if (itemIndex < 0 || itemIndex >= visibleRows.length) return '';
      const r = visibleRows[itemIndex];
      if (!r) return '';
      if (col === 'A') return r.nombre || '';
      if (col === 'B') return r.codigoWarehouse || '';
      if (col === 'C') return r.codigoTib || '';
      if (col === 'D') return r.codigoEscaneado || '';
      if (col === 'E') return r.estado || '';
      if (col === 'F') return r.nombreEscaneado || '';
      return '';
    },
    [visibleRows]
  );

  // Obtener el ID del item de una fila
  const getItemIdForRow = useCallback(
    (rowNum: number): string | undefined => {
      const itemIndex = rowNum - 2;
      if (itemIndex >= 0 && itemIndex < visibleRows.length) {
        return visibleRows[itemIndex].id;
      }
      return undefined;
    },
    [visibleRows]
  );

  // Process Barcode Gun Scan
  const processBarcodeScan = useCallback(
    async (scannedText: string, specificItemIndex?: number) => {
      if (!activeHojaId || !scannedText.trim()) return;

      const cleanCode = scannedText.trim().toUpperCase().replace(/\s+/g, '');
      const cleanDigits = cleanCode.replace(/^[A-Za-z]+0*/, '');
      setBarcodeInput('');

      const matchedManifest = checkCodeInManifest(cleanCode);
      const nowIso = new Date().toISOString();

      let targetItemIndex = -1;

      if (typeof specificItemIndex === 'number' && specificItemIndex >= 0 && specificItemIndex < items.length) {
        targetItemIndex = specificItemIndex;
      } else if (activeCell.col === 'D' && activeCell.row >= 2 && activeCell.row - 2 < items.length) {
        targetItemIndex = activeCell.row - 2;
      } else {
        targetItemIndex = items.findIndex(it => !it.trackingUsa || !it.trackingUsa.trim());
      }

      if (matchedManifest) {
        const clientName = matchedManifest.consignatario || 'CLIENTE AMEX';

        if (!isMuted) {
          soundEffects.playSuccess();
          if (isVoiceEnabled) {
            soundEffects.speak(`Encontrado: ${clientName}`);
          }
        }

        if (targetItemIndex !== -1) {
          const targetItem = items[targetItemIndex];
          setItems(prev =>
            prev.map((it, idx) =>
              idx === targetItemIndex
                ? {
                    ...it,
                    trackingUsa: cleanCode,
                    notas: clientName,
                    estado: 'ESCANEADO',
                    escaneadoEn: nowIso,
                    escaneadoPor: operatorName,
                    vecesEscaneado: (it.vecesEscaneado || 0) + 1
                  }
                : it
            )
          );

          setActiveCell({
            col: 'D',
            row: targetItemIndex + 3,
            val: ''
          });

          await supabase
            .from('hojas_cotejo_items')
            .update({
              tracking_usa: cleanCode,
              notas: clientName,
              estado: 'ESCANEADO',
              escaneado_en: nowIso,
              escaneado_por: operatorName,
              veces_escaneado: (targetItem.vecesEscaneado || 0) + 1,
              actualizado_en: nowIso
            })
            .eq('id', targetItem.id);
        } else {
          const { data: newRow } = await supabase
            .from('hojas_cotejo_items')
            .insert({
              hoja_id: activeHojaId,
              codigo_wr: '',
              casillero: '',
              consignatario: '',
              tracking_usa: cleanCode,
              notas: clientName,
              estado: 'ESCANEADO',
              escaneado_en: nowIso,
              escaneado_por: operatorName,
              veces_escaneado: 1,
              orden: items.length + 1
            })
            .select()
            .single();

          if (newRow) {
            setItems(prev => [
              ...prev,
              {
                id: newRow.id,
                hojaId: newRow.hoja_id,
                codigoWr: '',
                casillero: '',
                consignatario: '',
                trackingUsa: cleanCode,
                notas: clientName,
                estado: 'ESCANEADO',
                escaneadoEn: nowIso,
                escaneadoPor: operatorName,
                vecesEscaneado: 1,
                orden: newRow.orden || items.length + 1,
                creadoEn: newRow.creado_en,
                actualizadoEn: newRow.actualizado_en
              }
            ]);

            setActiveCell({
              col: 'D',
              row: items.length + 3,
              val: ''
            });
          }
        }
      } else {
        if (!isMuted) {
          soundEffects.playNotFound();
          if (isVoiceEnabled) {
            soundEffects.speak('No encontrado');
          }
        }

        const dbPackage = paquetes.find(
          p =>
            p.numeroReciboBodega.toUpperCase() === cleanCode ||
            `WR${p.numeroReciboBodega}`.toUpperCase() === cleanCode ||
            p.numeroReciboBodega.replace(/^[A-Za-z]+0*/, '') === cleanDigits
        );

        const notFoundName = dbPackage ? dbPackage.nombreConsignatario : 'NO ASIGNADO';

        if (targetItemIndex !== -1) {
          const targetItem = items[targetItemIndex];
          setItems(prev =>
            prev.map((it, idx) =>
              idx === targetItemIndex
                ? {
                    ...it,
                    trackingUsa: cleanCode,
                    notas: notFoundName,
                    estado: 'NO_LISTADO',
                    escaneadoEn: nowIso,
                    escaneadoPor: operatorName,
                    vecesEscaneado: (it.vecesEscaneado || 0) + 1
                  }
                : it
            )
          );

          setActiveCell({
            col: 'D',
            row: targetItemIndex + 3,
            val: ''
          });

          await supabase
            .from('hojas_cotejo_items')
            .update({
              tracking_usa: cleanCode,
              notas: notFoundName,
              estado: 'NO_LISTADO',
              escaneado_en: nowIso,
              escaneado_por: operatorName,
              veces_escaneado: (targetItem.vecesEscaneado || 0) + 1,
              actualizado_en: nowIso
            })
            .eq('id', targetItem.id);
        } else {
          const { data: newRow } = await supabase
            .from('hojas_cotejo_items')
            .insert({
              hoja_id: activeHojaId,
              codigo_wr: '',
              casillero: cleanDigits,
              consignatario: '',
              tracking_usa: cleanCode,
              notas: notFoundName,
              estado: 'NO_LISTADO',
              escaneado_en: nowIso,
              escaneado_por: operatorName,
              veces_escaneado: 1,
              orden: items.length + 1
            })
            .select()
            .single();

          if (newRow) {
            setItems(prev => [
              ...prev,
              {
                id: newRow.id,
                hojaId: newRow.hoja_id,
                codigoWr: '',
                casillero: cleanDigits,
                consignatario: '',
                trackingUsa: cleanCode,
                notas: notFoundName,
                estado: 'NO_LISTADO',
                escaneadoEn: nowIso,
                escaneadoPor: operatorName,
                vecesEscaneado: 1,
                orden: newRow.orden || items.length + 1,
                creadoEn: newRow.creado_en,
                actualizadoEn: newRow.actualizado_en
              }
            ]);

            setActiveCell({
              col: 'D',
              row: items.length + 3,
              val: ''
            });
          }
        }
      }

      focusBarcodeInput();
    },
    [activeCell, activeHojaId, checkCodeInManifest, focusBarcodeInput, isMuted, isVoiceEnabled, items, operatorName, paquetes, setItems]
  );

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeScan(barcodeInput.trim());
    }
  };

  // Guardar un valor directamente en una celda
  const commitDirectValue = useCallback(
    async (col: string, rowNum: number, itemId: string | undefined, newVal: string) => {
      const trimmed = newVal.trim();

      if (!itemId) {
        if (!activeHojaId || !trimmed) return;
        try {
          const newItemPayload = {
            hoja_id: activeHojaId,
            codigo_wr: col === 'B' ? trimmed : '',
            tracking_usa: col === 'D' ? trimmed : '',
            casillero: col === 'C' ? trimmed : '',
            consignatario: col === 'A' ? trimmed : '',
            peso_kg: 0,
            posicion_estante: 'REC',
            notas: col === 'F' ? trimmed : '',
            estado:
              col === 'E' && (trimmed.toUpperCase() === 'ENCONTRADO' || trimmed.toUpperCase() === 'ESCANEADO')
                ? 'ESCANEADO'
                : 'PENDIENTE',
            veces_escaneado: col === 'D' && trimmed ? 1 : 0,
            escaneado_en: col === 'D' && trimmed ? new Date().toISOString() : null,
            escaneado_por: col === 'D' && trimmed ? operatorName : null,
            orden: items.length + 1
          };

          const { data, error } = await supabase
            .from('hojas_cotejo_items')
            .insert([newItemPayload])
            .select()
            .single();

          if (!error && data) {
            const created: ItemCotejo = {
              id: data.id,
              hojaId: data.hoja_id,
              codigoWr: data.codigo_wr || '',
              trackingUsa: data.tracking_usa,
              casillero: data.casillero,
              consignatario: data.consignatario,
              pesoKg: Number(data.peso_kg || 0),
              posicionEstante: data.posicion_estante,
              notas: data.notas,
              estado: (data.estado as TipoEstadoItemCotejo) || 'PENDIENTE',
              escaneadoEn: data.escaneado_en,
              escaneadoPor: data.escaneado_por,
              vecesEscaneado: data.veces_escaneado || 0,
              orden: data.orden,
              creadoEn: data.creado_en,
              actualizadoEn: data.actualizado_en
            };
            setItems(prev => [...prev, created]);
            setActiveCell(prev => ({ ...prev, itemId: data.id, val: trimmed }));
          }
        } catch (err) {
          console.error('Error creating new row item:', err);
        }
        return;
      }

      const targetItem = items.find(it => it.id === itemId);
      if (!targetItem) return;

      if (col === 'A') {
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, consignatario: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ consignatario: trimmed }).eq('id', itemId);
      } else if (col === 'B') {
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, codigoWr: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ codigo_wr: trimmed }).eq('id', itemId);
      } else if (col === 'C') {
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, casillero: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ casillero: trimmed }).eq('id', itemId);
      } else if (col === 'D') {
        if (trimmed) {
          processBarcodeScan(trimmed, items.findIndex(it => it.id === itemId));
        } else {
          handleClearScanAtRow(itemId);
        }
      } else if (col === 'E') {
        const upper = trimmed.toUpperCase();
        const isEncontrado = upper === 'ENCONTRADO' || upper === 'ESCANEADO';
        const isNoEncontrado = upper === 'NO ENCONTRADO' || upper === 'NO_LISTADO';
        const newEstado: TipoEstadoItemCotejo = isEncontrado ? 'ESCANEADO' : isNoEncontrado ? 'NO_LISTADO' : 'PENDIENTE';
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, estado: newEstado } : it)));
        await supabase.from('hojas_cotejo_items').update({ estado: newEstado }).eq('id', itemId);
      } else if (col === 'F') {
        setItems(prev => prev.map(it => (it.id === itemId ? { ...it, notas: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ notas: trimmed }).eq('id', itemId);
      }
    },
    [activeHojaId, handleClearScanAtRow, items, operatorName, processBarcodeScan, setItems]
  );

  // Guardar edición inline
  const commitInlineCellEdit = useCallback(async () => {
    if (!editingCell) return;
    const { col, row, itemId } = editingCell;
    const val = editingValue;
    setEditingCell(null);
    await commitDirectValue(col, row, itemId, val);
    setActiveCell(prev => ({ ...prev, val: val.trim() }));
  }, [editingCell, editingValue, commitDirectValue]);

  // Click en celda
  const handleCellClick = useCallback(
    (col: string, row: number, val: string, itemId?: string) => {
      if (editingCell && (editingCell.col !== col || editingCell.row !== row)) {
        commitInlineCellEdit();
      }

      if (activeCell.col === col && activeCell.row === row && !editingCell) {
        setEditingCell({ col, row, itemId });
        setEditingValue(val || '');
        return;
      }

      setActiveCell({ col, row, val: val || '', itemId });
      broadcastActiveCell(col, row);
    },
    [activeCell, broadcastActiveCell, commitInlineCellEdit, editingCell]
  );

  // Doble click para edición
  const handleCellDoubleClick = useCallback((col: string, rowNum: number, currentVal: string, itemId?: string) => {
    if (rowNum < 2) return;
    setEditingCell({ col, row: rowNum, itemId });
    setEditingValue(currentVal || '');
  }, []);

  // Submit barra de fórmulas
  const handleFormulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCell.col || !activeCell.row) return;
    await commitDirectValue(activeCell.col, activeCell.row, activeCell.itemId, activeCell.val);
  };

  // Listener Global de Teclado Google Sheets
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        !activeEl.classList.contains('gsheet-cell-inline-input')
      ) {
        return;
      }

      if (isPasteModalOpen || isNewSheetModalOpen || isCameraScannerOpen) {
        return;
      }

      if (editingCell) {
        return;
      }

      if (!activeCell.col || !activeCell.row || activeCell.row < 2) {
        return;
      }

      const { col, row, itemId, val } = activeCell;
      const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const colIdx = COLS.indexOf(col);

      // Flecha Abajo
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = row + 1;
        const nextVal = getCellValue(col, nextRow);
        const nextId = getItemIdForRow(nextRow);
        setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
        broadcastActiveCell(col, nextRow);
        return;
      }

      // Flecha Arriba
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextRow = Math.max(2, row - 1);
        const nextVal = getCellValue(col, nextRow);
        const nextId = getItemIdForRow(nextRow);
        setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
        broadcastActiveCell(col, nextRow);
        return;
      }

      // Flecha Derecha o Tab
      if (e.key === 'ArrowRight' || e.key === 'Tab') {
        e.preventDefault();
        if (colIdx < COLS.length - 1) {
          const nextCol = COLS[colIdx + 1];
          const nextVal = getCellValue(nextCol, row);
          setActiveCell({ col: nextCol, row, val: nextVal, itemId });
          broadcastActiveCell(nextCol, row);
        } else {
          const nextRow = row + 1;
          const nextCol = 'A';
          const nextVal = getCellValue(nextCol, nextRow);
          const nextId = getItemIdForRow(nextRow);
          setActiveCell({ col: nextCol, row: nextRow, val: nextVal, itemId: nextId });
          broadcastActiveCell(nextCol, nextRow);
        }
        return;
      }

      // Flecha Izquierda
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (colIdx > 0) {
          const prevCol = COLS[colIdx - 1];
          const prevVal = getCellValue(prevCol, row);
          setActiveCell({ col: prevCol, row, val: prevVal, itemId });
          broadcastActiveCell(prevCol, row);
        }
        return;
      }

      // Enter o F2: Entrar en modo edición preservando el valor actual
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        setEditingCell({ col, row, itemId });
        setEditingValue(val || '');
        return;
      }

      // Delete o Backspace: Borrar de inmediato
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        commitDirectValue(col, row, itemId, '');
        setActiveCell(prev => ({ ...prev, val: '' }));
        return;
      }

      // Tecla carácter simple: Iniciar edición instantánea directa
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEditingCell({ col, row, itemId });
        setEditingValue(e.key);
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [
    activeCell,
    editingCell,
    isPasteModalOpen,
    isNewSheetModalOpen,
    isCameraScannerOpen,
    getCellValue,
    getItemIdForRow,
    commitDirectValue,
    broadcastActiveCell
  ]);

  return {
    barcodeInput,
    setBarcodeInput,
    barcodeInputRef,
    focusBarcodeInput,
    activeCell,
    setActiveCell,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    isPasteModalOpen,
    setIsPasteModalOpen,
    isNewSheetModalOpen,
    setIsNewSheetModalOpen,
    isCameraScannerOpen,
    setIsCameraScannerOpen,
    isMuted,
    setIsMuted,
    isVoiceEnabled,
    setIsVoiceEnabled,
    getCellValue,
    getItemIdForRow,
    processBarcodeScan,
    handleManualScanSubmit,
    commitDirectValue,
    commitInlineCellEdit,
    handleCellClick,
    handleCellDoubleClick,
    handleFormulaSubmit
  };
}
