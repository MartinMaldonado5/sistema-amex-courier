import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';
import { ItemCotejo, Paquete, TipoEstadoItemCotejo } from '@/types';
import {
  ActiveCell,
  EditingCell,
  SheetRow,
  CellSelectionRange,
  SelectionStats,
  SPREADSHEET_COLUMNS,
  MAX_SPREADSHEET_ROWS
} from '../types';
import { parseClipboardSpreadsheet } from '../utils/clipboardParser';
import { extractLast6Digits } from '../utils/codeFormatters';

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
  fetchItems?: (hojaId: string) => Promise<void>;
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
  broadcastActiveCell,
  fetchItems
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

  // Range Selection (Excel / Google Sheets multi-cell drag)
  const [selectionRange, setSelectionRange] = useState<CellSelectionRange | null>({
    startCol: 'D',
    startRow: 2,
    endCol: 'D',
    endRow: 2
  });
  const [isSelecting, setIsSelecting] = useState(false);

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

  // Sincronizar configuraciones de audio y voz con el sintetizador
  useEffect(() => {
    soundEffects.setVoiceEnabled(isVoiceEnabled);
    soundEffects.setMuted(isMuted);
  }, [isVoiceEnabled, isMuted]);

  const focusBarcodeInput = useCallback(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // Celdas libres adicionales para columnas G..Z o filas libres hasta 1000
  const [extraCells, setExtraCells] = useState<Record<string, string>>({});

  // Obtener valor de celda por col y row
  const getCellValue = useCallback(
    (col: string, rowNum: number): string => {
      const itemIndex = rowNum - 2;
      if (itemIndex >= 0 && itemIndex < visibleRows.length) {
        const r = visibleRows[itemIndex];
        if (r) {
          if (col === 'A') return r.nombre || '';
          if (col === 'B') return r.codigoWarehouse || '';
          if (col === 'C') return r.codigoTib || '';
          if (col === 'D') return r.codigoEscaneado || '';
          if (col === 'E') return r.estado || '';
          if (col === 'F') return r.nombreEscaneado || '';
        }
      }
      return extraCells[`${col}-${rowNum}`] || '';
    },
    [visibleRows, extraCells]
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

  // Resolver coincidencia de código con columnas B, A y base de datos de paquetes
  const resolveScannedCodeMatch = useCallback(
    (scannedText: string, targetItemIndex?: number) => {
      const cleanCode = scannedText.trim().toUpperCase().replace(/\s+/g, '');
      const cleanDigits = cleanCode.replace(/^[A-Za-z]+0*/, '');

      // 1. Manifiesto de la hoja actual
      const matchedManifest = checkCodeInManifest(cleanCode);

      // 2. Base de datos global de paquetes
      const dbPackage = paquetes.find(
        p =>
          (p.numeroReciboBodega && p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '') === cleanCode) ||
          (p.numeroReciboBodega && `WR${p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '')}` === cleanCode) ||
          (p.numeroReciboBodega && p.numeroReciboBodega.replace(/^[A-Za-z]+0*/, '') === cleanDigits)
      );

      // 3. Fila actual objetivo si coincide con su propio WR o TIB
      let rowItemMatch = false;
      let rowItemConsignee = '';
      if (typeof targetItemIndex === 'number' && targetItemIndex >= 0 && targetItemIndex < items.length) {
        const it = items[targetItemIndex];
        const itWr = (it.codigoWr || '').toUpperCase().replace(/\s+/g, '');
        const itTib = (it.casillero || '').toUpperCase().replace(/\s+/g, '');
        const itDigits = itWr.replace(/^[A-Za-z]+0*/, '');
        if (
          (itWr && (itWr === cleanCode || `WR${itWr}` === cleanCode)) ||
          (itTib && (itTib === cleanCode || cleanDigits === itTib)) ||
          (itDigits && cleanDigits && itDigits === cleanDigits)
        ) {
          rowItemMatch = true;
          if (it.consignatario && it.consignatario.trim() && it.consignatario.trim() !== '[NOMBRE]') {
            rowItemConsignee = it.consignatario.trim();
          }
        }
      }

      const isMatch = !!(matchedManifest || dbPackage || rowItemMatch);

      let clientName = '';
      if (
        matchedManifest &&
        matchedManifest.consignatario &&
        matchedManifest.consignatario.trim() &&
        matchedManifest.consignatario.trim() !== '[NOMBRE]'
      ) {
        clientName = matchedManifest.consignatario.trim();
      } else if (
        dbPackage?.nombreConsignatario &&
        dbPackage.nombreConsignatario.trim() &&
        dbPackage.nombreConsignatario.trim() !== '[NOMBRE]'
      ) {
        clientName = dbPackage.nombreConsignatario.trim();
      } else if (rowItemConsignee) {
        clientName = rowItemConsignee;
      } else if (
        typeof targetItemIndex === 'number' &&
        targetItemIndex >= 0 &&
        items[targetItemIndex]?.consignatario &&
        items[targetItemIndex]?.consignatario?.trim() &&
        items[targetItemIndex]?.consignatario?.trim() !== '[NOMBRE]'
      ) {
        clientName = items[targetItemIndex]?.consignatario?.trim() || '';
      }

      // Si el nombre aún no se resolvió o era '[NOMBRE]', buscar en paquetes usando el WR de la fila/manifiesto
      if (!clientName || clientName === '[NOMBRE]') {
        const refWr = (matchedManifest?.codigoWr || (typeof targetItemIndex === 'number' && targetItemIndex >= 0 ? items[targetItemIndex]?.codigoWr : ''))
          ?.toUpperCase()
          .replace(/\s+/g, '');
        if (refWr) {
          const refDigits = refWr.replace(/^[A-Za-z]+0*/, '');
          const pkgForRef = paquetes.find(
            p =>
              (p.numeroReciboBodega && p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '') === refWr) ||
              (p.numeroReciboBodega && `WR${p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '')}` === refWr) ||
              (p.numeroReciboBodega && p.numeroReciboBodega.replace(/^[A-Za-z]+0*/, '') === refDigits)
          );
          if (pkgForRef?.nombreConsignatario && pkgForRef.nombreConsignatario.trim() && pkgForRef.nombreConsignatario.trim() !== '[NOMBRE]') {
            clientName = pkgForRef.nombreConsignatario.trim();
          }
        }
      }

      // Si aún no se resolvió o es genérico, revisar si la fila objetivo tiene nombre en 'notas'
      if (!clientName || clientName === '[NOMBRE]' || clientName === 'CLIENTE AMEX') {
        const targetRow = typeof targetItemIndex === 'number' && targetItemIndex >= 0 ? items[targetItemIndex] : undefined;
        if (
          targetRow?.notas &&
          targetRow.notas.trim() &&
          targetRow.notas.trim() !== 'CLIENTE AMEX' &&
          targetRow.notas.trim() !== 'NO ASIGNADO' &&
          targetRow.notas.trim() !== '[NOMBRE]'
        ) {
          clientName = targetRow.notas.trim();
        }
      }

      const hasValidName = !!clientName && clientName !== 'CLIENTE AMEX' && clientName !== 'NO ASIGNADO' && clientName !== '[NOMBRE]';

      return {
        cleanCode,
        cleanDigits,
        isMatch,
        clientName,
        hasValidName,
        resolvedName: hasValidName ? clientName : isMatch ? 'CLIENTE AMEX' : 'NO ASIGNADO'
      };
    },
    [checkCodeInManifest, items, paquetes]
  );

  // Reproducir sonido/voz exclusivamente para la columna D (nombre del cliente o 'No encontrado')
  const playScanFeedback = useCallback(
    (isMatch: boolean, hasValidName: boolean, clientName: string) => {
      if (isMuted) return;
      if (isVoiceEnabled) {
        if (isMatch && hasValidName) {
          soundEffects.speak(clientName);
        } else {
          soundEffects.speak('No encontrado');
        }
      } else {
        if (isMatch && hasValidName) {
          soundEffects.playSuccess();
        } else {
          soundEffects.playNotFound();
        }
      }
    },
    [isMuted, isVoiceEnabled]
  );

  // Process Barcode Gun Scan (Columna D)
  const processBarcodeScan = useCallback(
    async (scannedText: string, specificItemIndex?: number) => {
      if (!activeHojaId || !scannedText.trim()) return;
      setBarcodeInput('');

      let targetItemIndex = -1;
      if (typeof specificItemIndex === 'number' && specificItemIndex >= 0 && specificItemIndex < items.length) {
        targetItemIndex = specificItemIndex;
      } else if (activeCell.itemId) {
        targetItemIndex = items.findIndex(it => it.id === activeCell.itemId);
      } else if (activeCell.row >= 2) {
        const visibleIdx = activeCell.row - 2;
        if (visibleIdx >= 0 && visibleIdx < visibleRows.length && visibleRows[visibleIdx]?.id) {
          targetItemIndex = items.findIndex(it => it.id === visibleRows[visibleIdx].id);
        }
        if (targetItemIndex === -1 && visibleIdx < items.length) {
          targetItemIndex = visibleIdx;
        }
      } else {
        targetItemIndex = items.findIndex(it => !it.trackingUsa || !it.trackingUsa.trim());
      }

      const match = resolveScannedCodeMatch(scannedText, targetItemIndex);
      const { cleanCode, cleanDigits, isMatch, clientName, hasValidName, resolvedName } = match;
      const nowIso = new Date().toISOString();

      // Feedback de audio: SOLO se activa para la columna D (dice el nombre o 'No encontrado')
      playScanFeedback(isMatch, hasValidName, clientName);

      if (isMatch) {
        const resolvedName = clientName || 'CLIENTE AMEX';

        if (targetItemIndex !== -1) {
          const targetItem = items[targetItemIndex];
          setItems(prev =>
            prev.map((it, idx) =>
              idx === targetItemIndex
                ? {
                    ...it,
                    trackingUsa: cleanCode,
                    notas: resolvedName,
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
            row: activeCell.row + 1,
            val: '',
            itemId: getItemIdForRow(activeCell.row + 1)
          });

          await supabase
            .from('hojas_cotejo_items')
            .update({
              tracking_usa: cleanCode,
              notas: resolvedName,
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
              casillero: cleanDigits,
              consignatario: '',
              tracking_usa: cleanCode,
              notas: resolvedName,
              estado: 'ESCANEADO',
              escaneado_en: nowIso,
              escaneado_por: operatorName,
              veces_escaneado: 1,
              orden: items.length + 1
            })
            .select()
            .single();

          if (newRow) {
            setItems(prev => {
              if (prev.some(it => it.id === newRow.id)) return prev;
              return [
                ...prev,
                {
                  id: newRow.id,
                  hojaId: newRow.hoja_id,
                  codigoWr: '',
                  casillero: cleanDigits,
                  consignatario: '',
                  trackingUsa: cleanCode,
                  notas: resolvedName,
                  estado: 'ESCANEADO',
                  escaneadoEn: nowIso,
                  escaneadoPor: operatorName,
                  vecesEscaneado: 1,
                  orden: newRow.orden || items.length + 1,
                  creadoEn: newRow.creado_en,
                  actualizadoEn: newRow.actualizado_en
                }
              ];
            });

            setActiveCell({
              col: 'D',
              row: items.length + 3,
              val: '',
              itemId: newRow.id
            });
          }
        }
      } else {
        const notFoundName = 'NO ASIGNADO';

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
            row: activeCell.row + 1,
            val: '',
            itemId: getItemIdForRow(activeCell.row + 1)
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
            setItems(prev => {
              if (prev.some(it => it.id === newRow.id)) return prev;
              return [
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
              ];
            });

            setActiveCell({
              col: 'D',
              row: items.length + 3,
              val: ''
            });
          }
        }
      }

      // No forzar foco al input de la barra para no secuestrar la cuadrícula
    },
    [activeCell, activeHojaId, checkCodeInManifest, isMuted, isVoiceEnabled, items, operatorName, paquetes, setItems]
  );

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeScan(barcodeInput.trim());
      focusBarcodeInput();
    }
  };

  // Guardar un valor directamente en una celda
  const commitDirectValue = useCallback(
    async (col: string, rowNum: number, itemId: string | undefined, newVal: string) => {
      const trimmed = newVal.trim();

      // Columna C (CÓDIGO TIB) es intocable: solo lectura automática derivada de los últimos 6 dígitos de Columna B
      if (col === 'C') return;

      // Buscar el item objetivo: por ID directo, por prefijo de ID, o por índice según rowNum
      const rowIndex = rowNum >= 2 ? rowNum - 2 : -1;
      const targetItem =
        (itemId ? items.find(it => it.id === itemId || (it.id && itemId.startsWith(it.id))) : undefined) ||
        (rowIndex >= 0 && rowIndex < items.length ? items[rowIndex] : undefined) ||
        (rowIndex >= 0 && rowIndex < visibleRows.length ? visibleRows[rowIndex]?.itemRef : undefined);

      if (!targetItem) {
        if (!trimmed) {
          setExtraCells(prev => {
            const next = { ...prev };
            delete next[`${col}-${rowNum}`];
            return next;
          });
          return;
        }
        if (!['A', 'B', 'D', 'E', 'F'].includes(col)) {
          setExtraCells(prev => ({ ...prev, [`${col}-${rowNum}`]: trimmed }));
          return;
        }
        if (!activeHojaId) return;
        if (col === 'D') {
          processBarcodeScan(trimmed);
          return;
        }
        try {
          const newItemPayload = {
            hoja_id: activeHojaId,
            codigo_wr: col === 'B' ? trimmed : '',
            tracking_usa: col === 'D' ? trimmed : '',
            casillero: col === 'B' ? extractLast6Digits(trimmed) : '',
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
            setItems(prev => (prev.some(it => it.id === created.id) ? prev : [...prev, created]));
          }
        } catch (err) {
          console.error('Error creating new row item:', err);
        }
        return;
      }

      const targetId = targetItem.id;

      if (col === 'A') {
        setItems(prev => prev.map(it => (it.id === targetId ? { ...it, consignatario: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ consignatario: trimmed }).eq('id', targetId);
      } else if (col === 'B') {
        const computedTib = extractLast6Digits(trimmed);
        setItems(prev =>
          prev.map(it => (it.id === targetId ? { ...it, codigoWr: trimmed, casillero: computedTib } : it))
        );
        await supabase
          .from('hojas_cotejo_items')
          .update({ codigo_wr: trimmed, casillero: computedTib })
          .eq('id', targetId);
      } else if (col === 'D') {
        if (trimmed) {
          processBarcodeScan(trimmed, items.findIndex(it => it.id === targetId));
        } else {
          handleClearScanAtRow(targetId);
        }
      } else if (col === 'E') {
        const upper = trimmed.toUpperCase();
        const isEncontrado = upper === 'ENCONTRADO' || upper === 'ESCANEADO';
        const isNoEncontrado = upper === 'NO ENCONTRADO' || upper === 'NO_LISTADO';
        const newEstado: TipoEstadoItemCotejo = isEncontrado ? 'ESCANEADO' : isNoEncontrado ? 'NO_LISTADO' : 'PENDIENTE';
        setItems(prev => prev.map(it => (it.id === targetId ? { ...it, estado: newEstado } : it)));
        await supabase.from('hojas_cotejo_items').update({ estado: newEstado }).eq('id', targetId);
      } else if (col === 'F') {
        setItems(prev => prev.map(it => (it.id === targetId ? { ...it, notas: trimmed } : it)));
        await supabase.from('hojas_cotejo_items').update({ notas: trimmed }).eq('id', targetId);
      } else {
        // Columnas G..Z en filas de datos
        setExtraCells(prev => ({ ...prev, [`${col}-${rowNum}`]: trimmed }));
      }
    },
    [activeHojaId, handleClearScanAtRow, items, operatorName, processBarcodeScan, setItems, visibleRows]
  );

  // Guardar edición inline
  const commitInlineCellEdit = useCallback(
    async (valueOverride?: string) => {
      if (!editingCell) return;
      const { col, row, itemId } = editingCell;
      const val = valueOverride !== undefined ? valueOverride : editingValue;
      setEditingCell(null);
      await commitDirectValue(col, row, itemId, val);
      setActiveCell(prev => (prev.col === col && prev.row === row ? { ...prev, val: val.trim() } : prev));
    },
    [editingCell, editingValue, commitDirectValue]
  );

  // Iniciar selección con cursor o extender con Shift
  const handleCellMouseDown = useCallback(
    (col: string, rowNum: number, currentVal: string, itemId?: string, isShift?: boolean) => {
      if (rowNum < 2) return;

      // Desenfocar cualquier input externo para que los atajos Ctrl+C y Ctrl+V pertenezcan a la cuadrícula
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        !activeEl.classList.contains('gsheet-cell-inline-input')
      ) {
        (activeEl as HTMLElement).blur();
      }

      if (editingCell && (editingCell.col !== col || editingCell.row !== rowNum)) {
        commitInlineCellEdit();
      }

      if (isShift && selectionRange) {
        setSelectionRange(prev =>
          prev
            ? { ...prev, endCol: col, endRow: rowNum }
            : { startCol: col, startRow: rowNum, endCol: col, endRow: rowNum }
        );
        return;
      }

      setIsSelecting(true);
      setActiveCell({ col, row: rowNum, val: currentVal || '', itemId });
      setSelectionRange({ startCol: col, startRow: rowNum, endCol: col, endRow: rowNum });
      broadcastActiveCell(col, rowNum);
    },
    [broadcastActiveCell, commitInlineCellEdit, editingCell, selectionRange]
  );

  // Arrastrar selección con cursor
  const handleCellMouseEnter = useCallback(
    (col: string, rowNum: number) => {
      if (!isSelecting || rowNum < 2) return;
      setSelectionRange(prev => {
        if (!prev) return { startCol: col, startRow: rowNum, endCol: col, endRow: rowNum };
        if (prev.endCol === col && prev.endRow === rowNum) return prev;
        return { ...prev, endCol: col, endRow: rowNum };
      });
    },
    [isSelecting]
  );

  // Click en celda: Seleccionar celda como en Excel (sin activar modo edición inline)
  const handleCellClick = useCallback(
    (col: string, row: number, val: string, itemId?: string) => {
      // Desenfocar cualquier input externo para que los atajos pertenezcan a la cuadrícula
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        !activeEl.classList.contains('gsheet-cell-inline-input')
      ) {
        (activeEl as HTMLElement).blur();
      }

      if (editingCell && (editingCell.col !== col || editingCell.row !== row)) {
        commitInlineCellEdit();
      }

      setActiveCell({ col, row, val: val || '', itemId });
      setSelectionRange({ startCol: col, startRow: row, endCol: col, endRow: row });
      broadcastActiveCell(col, row);
    },
    [broadcastActiveCell, commitInlineCellEdit, editingCell]
  );

  // Estadísticas dinámicas de la selección estilo Microsoft Excel (Average, Count, Sum)
  const selectionStats = useMemo<SelectionStats>(() => {
    if (!selectionRange) {
      return { count: 0, numericCount: 0, sum: 0, average: 0, hasNumbers: false };
    }

    const COLS = SPREADSHEET_COLUMNS;
    const startIdx = COLS.indexOf(selectionRange.startCol as any);
    const endIdx = COLS.indexOf(selectionRange.endCol as any);
    if (startIdx === -1 || endIdx === -1) {
      return { count: 0, numericCount: 0, sum: 0, average: 0, hasNumbers: false };
    }

    const minCol = Math.min(startIdx, endIdx);
    const maxCol = Math.max(startIdx, endIdx);
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);

    let count = 0;
    let numericCount = 0;
    let sum = 0;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const val = getCellValue(COLS[c], r)?.trim();
        if (val && val !== '') {
          count++;
          // Detectar valores numéricos puros o decimales, descartando códigos con letras (ej: WR00045)
          const clean = val.replace(/,/g, '');
          const parsed = Number(clean);
          if (!isNaN(parsed) && clean !== '' && !/^[a-zA-Z]/i.test(clean)) {
            numericCount++;
            sum += parsed;
          }
        }
      }
    }

    const average = numericCount > 0 ? sum / numericCount : 0;
    return {
      count,
      numericCount,
      sum,
      average,
      hasNumbers: numericCount > 0
    };
  }, [selectionRange, getCellValue, visibleRows]);

  // Doble click para edición (Columna C no editable)
  const handleCellDoubleClick = useCallback((col: string, rowNum: number, currentVal: string, itemId?: string) => {
    if (rowNum < 2 || col === 'C') return;
    setEditingCell({ col, row: rowNum, itemId });
    setEditingValue(currentVal || '');
  }, []);

  // Submit barra de fórmulas
  const handleFormulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCell.col || !activeCell.row || activeCell.col === 'C') return;
    await commitDirectValue(activeCell.col, activeCell.row, activeCell.itemId, activeCell.val);
  };

  // Pegado Inteligente Tipo Excel / Google Sheets (Ctrl+V)
  const handlePasteSpreadsheet = useCallback(
    async (pastedText: string, targetColOverride?: string, targetRowOverride?: number) => {
      if (!activeHojaId || !pastedText) return;

      const matrix = parseClipboardSpreadsheet(pastedText);
      if (matrix.length === 0) return;

      const COLS = SPREADSHEET_COLUMNS;
      const startCol = targetColOverride || activeCell.col || 'A';
      const startRow = Math.min(MAX_SPREADSHEET_ROWS, Math.max(2, targetRowOverride || activeCell.row || 2));
      const colStartIdx = Math.max(0, COLS.indexOf(startCol as any));

      // Si el usuario intenta pegar directamente en la Columna C como columna única, bloquearlo (Columna C es intocable)
      if (startCol === 'C' && matrix.every(row => row.length === 1)) {
        return;
      }

      const numRows = matrix.length;
      const nowIso = new Date().toISOString();

      const existingUpdates: { id: string; fields: Record<string, any> }[] = [];
      const updatedItemsMap = new Map<string, ItemCotejo>();
      const newItemsPayloads: any[] = [];

      const currentItemsCount = items.length;
      const targetStartIndex = startRow - 2;
      let nextOrden = items.length + 1;

      // Si el usuario pegó más abajo del final de filas existentes, rellenar el hueco
      if (targetStartIndex > currentItemsCount) {
        const gap = targetStartIndex - currentItemsCount;
        for (let g = 0; g < gap; g++) {
          newItemsPayloads.push({
            hoja_id: activeHojaId,
            codigo_wr: '',
            casillero: '',
            consignatario: '',
            tracking_usa: '',
            peso_kg: 0,
            posicion_estante: 'REC',
            notas: '',
            estado: 'PENDIENTE',
            veces_escaneado: 0,
            orden: nextOrden++
          });
        }
      }

      for (let r = 0; r < numRows; r++) {
        const rowVals = matrix[r];
        const targetRowNum = startRow + r;
        if (targetRowNum > MAX_SPREADSHEET_ROWS) break;
        const visibleIdx = targetRowNum - 2;
        const visibleRow = visibleIdx >= 0 && visibleIdx < visibleRows.length ? visibleRows[visibleIdx] : undefined;

        if (visibleRow?.isSeparator) {
          continue;
        }

        const colValues: Record<string, string> = {};
        for (let c = 0; c < rowVals.length; c++) {
          const colLetter = COLS[colStartIdx + c];
          if (!colLetter) break;
          colValues[colLetter] = rowVals[c] ?? '';
        }

        // Si se pegaron valores en columnas G..Z, guardarlos en extraCells
        const extraUpdates: Record<string, string> = {};
        for (const [k, v] of Object.entries(colValues)) {
          if (!['A', 'B', 'C', 'D', 'E', 'F'].includes(k)) {
            extraUpdates[`${k}-${targetRowNum}`] = v;
          }
        }
        if (Object.keys(extraUpdates).length > 0) {
          setExtraCells(prev => ({ ...prev, ...extraUpdates }));
        }

        const targetId = visibleRow?.id;
        const existing = (targetId ? items.find(it => it.id === targetId || (it.id && targetId.startsWith(it.id))) : undefined) ||
          visibleRow?.itemRef ||
          (visibleIdx >= 0 && visibleIdx < items.length ? items[visibleIdx] : undefined);

        const itemIdx = existing ? items.findIndex(it => it.id === existing.id) : -1;

        if (existing && itemIdx !== -1) {

          const valA = colValues['A'];
          const valB = colValues['B'];
          const valC = colValues['C'];
          const valD = colValues['D'];
          const valE = colValues['E'];
          const valF = colValues['F'];

          const fieldsToUpdate: Record<string, any> = { actualizado_en: nowIso };

          const cleanWr = valB !== undefined ? valB.toUpperCase().replace(/\s+/g, '') : undefined;
          const dbMatch = cleanWr
            ? paquetes.find(p => p.numeroReciboBodega && p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '') === cleanWr)
            : undefined;

          let newConsignatario = existing.consignatario;
          if (valA !== undefined) {
            newConsignatario = valA === '[NOMBRE]' && dbMatch?.nombreConsignatario ? dbMatch.nombreConsignatario : valA;
            fieldsToUpdate.consignatario = newConsignatario;
          } else if (dbMatch && (!existing.consignatario || existing.consignatario === '[NOMBRE]')) {
            newConsignatario = dbMatch.nombreConsignatario;
            fieldsToUpdate.consignatario = newConsignatario;
          }

          let newCodigoWr = existing.codigoWr;
          if (valB !== undefined) {
            newCodigoWr = valB;
            fieldsToUpdate.codigo_wr = valB;
          }

          let newCasillero = existing.casillero;
          // Columna C (CÓDIGO TIB) es intocable: siempre se deriva de los últimos 6 dígitos de la columna B
          if (valB !== undefined) {
            newCasillero = extractLast6Digits(valB);
            fieldsToUpdate.casillero = newCasillero;
          }

          let newTrackingUsa = existing.trackingUsa;
          let newEstado = existing.estado;
          let newNotas = existing.notas;

          if (valD !== undefined) {
            const cleanD = valD.trim();
            if (cleanD) {
              const matchD = resolveScannedCodeMatch(cleanD, itemIdx);
              newTrackingUsa = matchD.cleanCode;
              fieldsToUpdate.tracking_usa = matchD.cleanCode;
              fieldsToUpdate.veces_escaneado = 1;
              fieldsToUpdate.escaneado_en = nowIso;
              fieldsToUpdate.escaneado_por = operatorName;

              newEstado = matchD.isMatch ? 'ESCANEADO' : 'NO_LISTADO';
              fieldsToUpdate.estado = newEstado;

              if (valF === undefined) {
                newNotas = matchD.resolvedName;
                fieldsToUpdate.notas = newNotas;
              }
            } else {
              newTrackingUsa = '';
              fieldsToUpdate.tracking_usa = '';
              fieldsToUpdate.veces_escaneado = 0;
              fieldsToUpdate.escaneado_en = null;
              fieldsToUpdate.escaneado_por = null;
              newEstado = 'PENDIENTE';
              fieldsToUpdate.estado = 'PENDIENTE';
              if (valF === undefined) {
                newNotas = '';
                fieldsToUpdate.notas = '';
              }
            }
          }

          if (valE !== undefined) {
            const upper = valE.toUpperCase();
            newEstado =
              upper === 'ENCONTRADO' || upper === 'ESCANEADO'
                ? 'ESCANEADO'
                : upper === 'NO ENCONTRADO' || upper === 'NO_LISTADO'
                ? 'NO_LISTADO'
                : 'PENDIENTE';
            fieldsToUpdate.estado = newEstado;
          }

          if (valF !== undefined) {
            newNotas = valF;
            fieldsToUpdate.notas = valF;
          }

          existingUpdates.push({ id: existing.id, fields: fieldsToUpdate });
          updatedItemsMap.set(existing.id, {
            ...existing,
            consignatario: newConsignatario,
            codigoWr: newCodigoWr,
            casillero: newCasillero,
            trackingUsa: newTrackingUsa,
            estado: newEstado,
            notas: newNotas,
            actualizadoEn: nowIso
          });
        } else {
          // Nueva fila a insertar
          const valA = colValues['A'] || '';
          const valB = colValues['B'] || '';
          // Columna C es intocable: extrae automáticamente los últimos 6 dígitos de la columna B
          const valC = extractLast6Digits(valB) || '';
          const valD = colValues['D'] || '';
          const valE = colValues['E'] || '';
          const valF = colValues['F'] || '';

          const cleanWr = valB.toUpperCase().replace(/\s+/g, '');
          const dbMatch = cleanWr
            ? paquetes.find(p => p.numeroReciboBodega && p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '') === cleanWr)
            : undefined;

          const finalConsignatario = valA && valA !== '[NOMBRE]' ? valA : dbMatch?.nombreConsignatario || valA || '';
          const finalCasillero = valC || dbMatch?.codigoCasillero || '';
          const matchResultD = valD.trim() ? resolveScannedCodeMatch(valD.trim()) : null;
          const upperE = valE.toUpperCase();
          const finalEstado: TipoEstadoItemCotejo =
            upperE === 'ENCONTRADO' || upperE === 'ESCANEADO'
              ? 'ESCANEADO'
              : upperE === 'NO ENCONTRADO' || upperE === 'NO_LISTADO'
              ? 'NO_LISTADO'
              : matchResultD
              ? (matchResultD.isMatch ? 'ESCANEADO' : 'NO_LISTADO')
              : 'PENDIENTE';

          const finalNotas = valF || matchResultD?.resolvedName || dbMatch?.descripcion || '';

          newItemsPayloads.push({
            hoja_id: activeHojaId,
            consignatario: finalConsignatario,
            codigo_wr: valB,
            casillero: finalCasillero,
            tracking_usa: matchResultD?.cleanCode || valD,
            peso_kg: dbMatch?.pesoKg || 0,
            posicion_estante: dbMatch?.posicionEstante || 'REC',
            notas: finalNotas,
            estado: finalEstado,
            veces_escaneado: valD ? 1 : 0,
            escaneado_en: valD ? nowIso : null,
            escaneado_por: valD ? operatorName : null,
            orden: nextOrden++
          });
        }
      }

      // Actualización optimista del estado local
      if (existingUpdates.length > 0) {
        setItems(prev => prev.map(it => updatedItemsMap.get(it.id) || it));
      }

      try {
        if (newItemsPayloads.length > 0) {
          const { data: insertedRows } = await supabase
            .from('hojas_cotejo_items')
            .insert(newItemsPayloads)
            .select();

          if (insertedRows && insertedRows.length > 0) {
            const mappedNew: ItemCotejo[] = insertedRows.map(r => ({
              id: r.id,
              hojaId: r.hoja_id,
              codigoWr: r.codigo_wr || '',
              trackingUsa: r.tracking_usa,
              casillero: r.casillero,
              consignatario: r.consignatario,
              pesoKg: Number(r.peso_kg || 0),
              posicionEstante: r.posicion_estante,
              notas: r.notas,
              estado: (r.estado as TipoEstadoItemCotejo) || 'PENDIENTE',
              escaneadoEn: r.escaneado_en,
              escaneadoPor: r.escaneado_por,
              vecesEscaneado: r.veces_escaneado || 0,
              orden: r.orden,
              creadoEn: r.creado_en,
              actualizadoEn: r.actualizado_en
            }));

            setItems(prev => {
              const prevIds = new Set(prev.map(p => p.id));
              const fresh = mappedNew.filter(m => !prevIds.has(m.id));
              return [...prev, ...fresh];
            });
          }
        }

        if (existingUpdates.length > 0) {
          await Promise.all(
            existingUpdates.map(u =>
              supabase
                .from('hojas_cotejo_items')
                .update(u.fields)
                .eq('id', u.id)
            )
          );
        }

        // Sonido y voz: SOLO se activa en la columna D al pegar un código (dice el nombre o 'No encontrado')
        if (startCol === 'D') {
          const firstValD = matrix[0] ? matrix[0][0]?.trim() : '';
          if (firstValD) {
            const firstVisIdx = startRow - 2;
            const firstVisRow = firstVisIdx >= 0 && firstVisIdx < visibleRows.length ? visibleRows[firstVisIdx] : undefined;
            const firstExisting = (firstVisRow?.id ? items.find(it => it.id === firstVisRow.id || (it.id && firstVisRow.id.startsWith(it.id))) : undefined) ||
              firstVisRow?.itemRef ||
              (firstVisIdx >= 0 && firstVisIdx < items.length ? items[firstVisIdx] : undefined);
            const firstItemIdx = firstExisting ? items.findIndex(it => it.id === firstExisting.id) : firstVisIdx;
            const firstMatch = resolveScannedCodeMatch(firstValD, firstItemIdx);
            playScanFeedback(firstMatch.isMatch, firstMatch.hasValidName, firstMatch.clientName);
          }
        }

        // Mover celda activa al final del rango pegado y seleccionar el bloque pegado
        const nextActiveRow = Math.min(MAX_SPREADSHEET_ROWS, startRow + numRows);
        setActiveCell({
          col: startCol,
          row: nextActiveRow,
          val: getCellValue(startCol, nextActiveRow)
        });
        broadcastActiveCell(startCol, nextActiveRow);

        setSelectionRange({
          startCol,
          startRow,
          endCol: COLS[Math.min(COLS.length - 1, colStartIdx + (matrix[0]?.length || 1) - 1)],
          endRow: Math.min(MAX_SPREADSHEET_ROWS, startRow + numRows - 1)
        });
      } catch (err) {
        console.error('Error pasting spreadsheet rows:', err);
      }
    },
    [
      activeHojaId,
      activeCell,
      items,
      visibleRows,
      paquetes,
      operatorName,
      playScanFeedback,
      resolveScannedCodeMatch,
      setItems,
      setActiveCell,
      broadcastActiveCell,
      getCellValue
    ]
  );

  // Listener Global de Teclado y Portapapeles (Copiar y Pegar como Excel/Sheets)
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
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
      const COLS = SPREADSHEET_COLUMNS;
      const colIdx = COLS.indexOf(col as any);

      // Copiar con Ctrl+C o Cmd+C (soporta rango múltiple o celda única)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (
          selectionRange &&
          (selectionRange.startCol !== selectionRange.endCol || selectionRange.startRow !== selectionRange.endRow)
        ) {
          const minCol = Math.min(COLS.indexOf(selectionRange.startCol as any), COLS.indexOf(selectionRange.endCol as any));
          const maxCol = Math.max(COLS.indexOf(selectionRange.startCol as any), COLS.indexOf(selectionRange.endCol as any));
          const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
          const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);

          const lines: string[] = [];
          for (let r = minRow; r <= maxRow; r++) {
            const rowVals: string[] = [];
            for (let c = minCol; c <= maxCol; c++) {
              rowVals.push(getCellValue(COLS[c], r) || '');
            }
            lines.push(rowVals.join('\t'));
          }
          navigator.clipboard.writeText(lines.join('\r\n'));
          return;
        }

        const cellVal = getCellValue(col, row);
        if (cellVal) {
          navigator.clipboard.writeText(cellVal);
        }
        return;
      }

      // Flecha Abajo
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectionRange(prev => {
            const base = prev || { startCol: col, startRow: row, endCol: col, endRow: row };
            return { ...base, endRow: Math.min(MAX_SPREADSHEET_ROWS, base.endRow + 1) };
          });
          return;
        }
        if (row >= MAX_SPREADSHEET_ROWS) return;
        const nextRow = Math.min(MAX_SPREADSHEET_ROWS, row + 1);
        const nextVal = getCellValue(col, nextRow);
        const nextId = getItemIdForRow(nextRow);
        setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
        setSelectionRange({ startCol: col, startRow: nextRow, endCol: col, endRow: nextRow });
        broadcastActiveCell(col, nextRow);
        return;
      }

      // Flecha Arriba
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.shiftKey) {
          setSelectionRange(prev => {
            const base = prev || { startCol: col, startRow: row, endCol: col, endRow: row };
            return { ...base, endRow: Math.max(2, base.endRow - 1) };
          });
          return;
        }
        const nextRow = Math.max(2, row - 1);
        const nextVal = getCellValue(col, nextRow);
        const nextId = getItemIdForRow(nextRow);
        setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
        setSelectionRange({ startCol: col, startRow: nextRow, endCol: col, endRow: nextRow });
        broadcastActiveCell(col, nextRow);
        return;
      }

      // Flecha Derecha o Tab
      if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        if (e.shiftKey && e.key === 'ArrowRight') {
          setSelectionRange(prev => {
            const base = prev || { startCol: col, startRow: row, endCol: col, endRow: row };
            const curIdx = COLS.indexOf(base.endCol as any);
            if (curIdx < COLS.length - 1) {
              return { ...base, endCol: COLS[curIdx + 1] };
            }
            return base;
          });
          return;
        }
        if (colIdx < COLS.length - 1) {
          const nextCol = COLS[colIdx + 1];
          const nextVal = getCellValue(nextCol, row);
          setActiveCell({ col: nextCol, row, val: nextVal, itemId });
          setSelectionRange({ startCol: nextCol, startRow: row, endCol: nextCol, endRow: row });
          broadcastActiveCell(nextCol, row);
        } else {
          if (row < MAX_SPREADSHEET_ROWS) {
            const nextRow = row + 1;
            const nextCol = 'A';
            const nextVal = getCellValue(nextCol, nextRow);
            const nextId = getItemIdForRow(nextRow);
            setActiveCell({ col: nextCol, row: nextRow, val: nextVal, itemId: nextId });
            setSelectionRange({ startCol: nextCol, startRow: nextRow, endCol: nextCol, endRow: nextRow });
            broadcastActiveCell(nextCol, nextRow);
          }
        }
        return;
      }

      // Flecha Izquierda
      if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        if (e.shiftKey && e.key === 'ArrowLeft') {
          setSelectionRange(prev => {
            const base = prev || { startCol: col, startRow: row, endCol: col, endRow: row };
            const curIdx = COLS.indexOf(base.endCol as any);
            if (curIdx > 0) {
              return { ...base, endCol: COLS[curIdx - 1] };
            }
            return base;
          });
          return;
        }
        if (colIdx > 0) {
          const prevCol = COLS[colIdx - 1];
          const prevVal = getCellValue(prevCol, row);
          setActiveCell({ col: prevCol, row, val: prevVal, itemId });
          setSelectionRange({ startCol: prevCol, startRow: row, endCol: prevCol, endRow: row });
          broadcastActiveCell(prevCol, row);
        }
        return;
      }

      // F2: Entrar en modo edición preservando el valor actual (estilo Excel)
      if (e.key === 'F2') {
        e.preventDefault();
        if (col === 'C') return; // Columna C es intocable
        setEditingCell({ col, row, itemId });
        setEditingValue(val || '');
        return;
      }

      // Enter: Avanzar a la siguiente fila hacia abajo (estilo Excel)
      if (e.key === 'Enter') {
        e.preventDefault();
        const nextRow = e.shiftKey ? Math.max(2, row - 1) : Math.min(MAX_SPREADSHEET_ROWS, row + 1);
        const nextVal = getCellValue(col, nextRow);
        const nextId = getItemIdForRow(nextRow);
        setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
        setSelectionRange({ startCol: col, startRow: nextRow, endCol: col, endRow: nextRow });
        broadcastActiveCell(col, nextRow);
        return;
      }

      // Delete o Backspace: Borrar de inmediato
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // Columna C es intocable: no se puede borrar ni vaciar
        if (col === 'C') return;
        commitDirectValue(col, row, itemId, '');
        setActiveCell(prev => ({ ...prev, val: '' }));
        return;
      }

      // Tecla carácter simple: Iniciar edición instantánea directa sobreescribiendo el valor (estilo Excel)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        // Columna C es intocable: no se puede editar escribiendo
        if (col === 'C') return;
        setEditingCell({ col, row, itemId });
        setEditingValue(e.key);
      }
    };

    const handleWindowPaste = (e: ClipboardEvent) => {
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

      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;

      // Si está editando en inline-input y es una palabra única sin saltos ni columnas especiales, dejar pegar normal
      const isSimpleSingleWord =
        !text.includes('\n') &&
        !text.includes('\r') &&
        !text.includes('\t') &&
        !/^\s*\[[^\]]+\]\s+/.test(text) &&
        !/\s{2,}/.test(text) &&
        !/\bWR\d+/i.test(text);

      if (activeEl?.classList.contains('gsheet-cell-inline-input') && isSimpleSingleWord) {
        return;
      }

      // Interceptar pegado tabular / plain text para distribuirlo en filas y columnas
      e.preventDefault();

      const targetCol = editingCell ? editingCell.col : activeCell.col || 'A';
      const targetRow = editingCell ? editingCell.row : activeCell.row || 2;

      if (editingCell) {
        setEditingCell(null);
      }

      handlePasteSpreadsheet(text, targetCol, targetRow);
    };

    const handleWindowMouseUp = () => {
      setIsSelecting(false);
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    window.addEventListener('paste', handleWindowPaste);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown);
      window.removeEventListener('paste', handleWindowPaste);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [
    activeCell,
    selectionRange,
    editingCell,
    isPasteModalOpen,
    isNewSheetModalOpen,
    isCameraScannerOpen,
    getCellValue,
    getItemIdForRow,
    commitDirectValue,
    broadcastActiveCell,
    handlePasteSpreadsheet
  ]);

  return {
    barcodeInput,
    setBarcodeInput,
    barcodeInputRef,
    focusBarcodeInput,
    activeCell,
    setActiveCell,
    selectionRange,
    setSelectionRange,
    isSelecting,
    selectionStats,
    handleCellMouseDown,
    handleCellMouseEnter,
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
    handleFormulaSubmit,
    handlePasteSpreadsheet,
    extraCells,
    setExtraCells
  };
}
