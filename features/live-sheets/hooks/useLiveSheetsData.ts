import { useState, useEffect, useMemo, useCallback } from 'react';
import { HojaCotejo, ItemCotejo, Paquete, TipoProcesoCotejo } from '@/types';
import { soundEffects } from '@/lib/audio/soundEffects';
import * as XLSX from 'xlsx';
import { sheetsService } from '../services/sheets.service';
import { SheetRow, SheetStats } from '../types';
import { getSheetLongCode } from '@/components/tabs/SheetsHub';
import { extractLast6Digits } from '../utils/codeFormatters';

interface UseLiveSheetsDataProps {
  paquetes: Paquete[];
  operatorName: string;
}

export function useLiveSheetsData({ paquetes, operatorName }: UseLiveSheetsDataProps) {
  // State: Hojas & Items
  const [hojas, setHojas] = useState<HojaCotejo[]>([]);
  const [activeLibroId, setActiveLibroId] = useState<string | null>(null);
  const [activeHojaId, setActiveHojaId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemCotejo[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Document Title & Starred
  const [docTitle, setDocTitle] = useState('AMEX WR');
  const [isStarred, setIsStarred] = useState(true);

  // Search filter
  const [searchInSheet, setSearchInSheet] = useState('');

  // Libros principales (Workbooks independientes para la galería / SheetsHub)
  const libros = useMemo(() => {
    return hojas.filter(h => !h.libroId);
  }, [hojas]);

  // Hojas pertenecientes ÚNICAMENTE al libro activo actual
  const activeBookSheets = useMemo(() => {
    if (!activeLibroId) return [];
    return hojas
      .filter(h => h.id === activeLibroId || h.libroId === activeLibroId)
      .sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());
  }, [hojas, activeLibroId]);

  // 1. Fetch Hojas
  const fetchHojas = useCallback(async () => {
    try {
      setIsLoadingSheets(true);
      const mapped = await sheetsService.fetchHojas();
      setHojas(mapped);
      if (activeLibroId) {
        const found = mapped.find(h => h.id === activeLibroId);
        if (found) setDocTitle(found.titulo || 'AMEX WR');
      }
    } catch (err) {
      console.error('Error in fetchHojas:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  }, [activeLibroId]);

  // 2. Fetch Items
  const fetchItems = useCallback(async (hojaId: string) => {
    if (!hojaId) return;
    try {
      setIsLoadingItems(true);
      const mappedItems = await sheetsService.fetchItems(hojaId);
      // Deduplicar items por id para evitar colisiones
      const seen = new Set<string>();
      const deduped: ItemCotejo[] = [];
      for (const item of mappedItems) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        }
      }
      setItems(deduped);
    } catch (err: any) {
      console.error('Error in fetchItems:', err?.message || err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHojas();
  }, [fetchHojas]);

  // Sync active sheet items
  useEffect(() => {
    if (activeHojaId) {
      fetchItems(activeHojaId);
    }
  }, [activeHojaId, fetchItems]);

  // Sync active workbook title
  useEffect(() => {
    if (activeLibroId) {
      const activeBook = hojas.find(h => h.id === activeLibroId);
      if (activeBook) {
        setDocTitle(activeBook.titulo || 'AMEX WR');
      }
    }
  }, [activeLibroId, hojas]);

  // Sincronización con URL limpia (/amex-excel/d/...) o Hash legado (#d/...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let targetCode: string | null = null;

    if (window.location.pathname.startsWith('/amex-excel/d/')) {
      targetCode = window.location.pathname.replace('/amex-excel/d/', '').trim();
    } else if (window.location.hash && window.location.hash.startsWith('#d/')) {
      targetCode = window.location.hash.replace('#d/', '').trim();
    }

    if (targetCode) {
      targetCode = targetCode.split('/')[0].split('?')[0].split('#')[0].trim();
    }

    if (targetCode && hojas.length > 0) {
      const found = hojas.find(h => getSheetLongCode(h.id) === targetCode || h.id === targetCode);
      if (found) {
        const rootId = found.libroId || found.id;
        setActiveLibroId(rootId);
        setActiveHojaId(found.id);
        const rootBook = hojas.find(h => h.id === rootId);
        if (rootBook) setDocTitle(rootBook.titulo || 'AMEX WR');
      }
    }
  }, [hojas]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeLibroId) {
        const code = getSheetLongCode(activeLibroId);
        window.history.replaceState(null, '', `/amex-excel/d/${code}`);
      } else {
        if (window.location.pathname.startsWith('/amex-excel/d/')) {
          window.history.replaceState(null, '', '/amex-excel');
        }
      }
    }
  }, [activeLibroId]);

  // Códigos escaneados en columna D
  const allScannedCodes = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.trackingUsa) {
        const clean = it.trackingUsa.toUpperCase().replace(/\s+/g, '');
        if (clean) {
          set.add(clean);
          const digits = clean.replace(/^[A-Za-z]+0*/, '');
          if (digits) {
            set.add(digits);
            set.add(`WR${digits}`);
          }
        }
      }
    });
    return set;
  }, [items]);

  // Comprobar coincidencia con manifiesto
  const checkCodeInManifest = useCallback(
    (scannedText: string) => {
      const cleanCode = scannedText.trim().toUpperCase().replace(/\s+/g, '');
      const cleanDigits = cleanCode.replace(/^[A-Za-z]+0*/, '');

      return items.find(m => {
        const mWr = (m.codigoWr || '').toUpperCase().replace(/\s+/g, '');
        const mTib = (m.casillero || '').toUpperCase().replace(/\s+/g, '');
        const mDigits = mWr.replace(/^[A-Za-z]+0*/, '');

        return (
          (mWr && mWr === cleanCode) ||
          (mWr && `WR${mWr}` === cleanCode) ||
          (mDigits && cleanDigits && mDigits === cleanDigits) ||
          (mTib && mTib === cleanCode) ||
          (mTib && cleanDigits && mTib === cleanDigits)
        );
      });
    },
    [items]
  );

  // Transformar ítems en filas de hoja de cálculo
  const sheetRows = useMemo(() => {
    const rows: SheetRow[] = [];
    const seenRowIds = new Set<string>();
    let prevConsignee = '';

    items.forEach((it, idx) => {
      const consignee = (it.consignatario || '').trim();

      if (prevConsignee && consignee && consignee !== prevConsignee) {
        const sepId = `sep-${it.id || idx}-${idx}`;
        if (!seenRowIds.has(sepId)) {
          seenRowIds.add(sepId);
          rows.push({
            id: sepId,
            nombre: '',
            codigoWarehouse: '',
            codigoTib: '',
            codigoEscaneado: '',
            estado: 'PENDIENTE',
            nombreEscaneado: '',
            isSeparator: true
          });
        }
      }

      prevConsignee = consignee;

      const wrUpper = (it.codigoWr || '').toUpperCase().replace(/\s+/g, '');
      const tibUpper = (it.casillero || '').toUpperCase().replace(/\s+/g, '');
      const wrDigits = wrUpper.replace(/^[A-Za-z]+0*/, '');

      const isManifestFound =
        (wrUpper && allScannedCodes.has(wrUpper)) ||
        (wrUpper && allScannedCodes.has(`WR${wrUpper}`)) ||
        (tibUpper && allScannedCodes.has(tibUpper)) ||
        (wrDigits && allScannedCodes.has(wrDigits));

      let displayEstado: 'ENCONTRADO' | 'NO ENCONTRADO' | 'PENDIENTE' | '' = '';
      const scannedCode = (it.trackingUsa || '').trim();
      let scannedName = (it.notas || '').trim();

      if (scannedCode) {
        const cleanScanned = scannedCode.toUpperCase().replace(/\s+/g, '');
        const cleanDigits = cleanScanned.replace(/^[A-Za-z]+0*/, '');

        // 1. Buscar coincidencia en el manifiesto de la hoja (relacionado con columna B y columna A)
        const manifestMatch = checkCodeInManifest(scannedCode);

        // 2. Buscar coincidencia en la base de datos de paquetes
        const dbPackage = paquetes.find(
          p =>
            (p.numeroReciboBodega && p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '') === cleanScanned) ||
            (p.numeroReciboBodega && `WR${p.numeroReciboBodega.toUpperCase().replace(/\s+/g, '')}` === cleanScanned) ||
            (p.numeroReciboBodega && p.numeroReciboBodega.replace(/^[A-Za-z]+0*/, '') === cleanDigits)
        );

        // 3. Resolver el nombre correspondiente a la columna A y B
        const relatedName =
          manifestMatch && manifestMatch.consignatario && manifestMatch.consignatario !== '[NOMBRE]'
            ? manifestMatch.consignatario
            : dbPackage?.nombreConsignatario
            ? dbPackage.nombreConsignatario
            : manifestMatch?.consignatario && manifestMatch.consignatario !== '[NOMBRE]'
            ? manifestMatch.consignatario
            : (it.consignatario && it.consignatario !== '[NOMBRE]' ? it.consignatario : '');

        if (manifestMatch || dbPackage) {
          displayEstado = 'ENCONTRADO';
          scannedName = relatedName || scannedName || 'CLIENTE AMEX';
        } else if (it.estado === 'ESCANEADO') {
          displayEstado = 'ENCONTRADO';
          scannedName = relatedName || scannedName || it.consignatario || 'CLIENTE AMEX';
        } else if (it.estado === 'NO_LISTADO') {
          displayEstado = 'NO ENCONTRADO';
          scannedName = scannedName || 'NO ASIGNADO';
        } else {
          displayEstado = 'NO ENCONTRADO';
          scannedName = 'NO ASIGNADO';
        }
      }

      const tib = extractLast6Digits(it.codigoWr) || it.casillero || '';
      const isGroupStart = (idx === 0 || (items[idx - 1]?.consignatario || '').trim() !== consignee) && !!consignee;
      const isGroupEnd = (idx === items.length - 1 || (items[idx + 1]?.consignatario || '').trim() !== consignee) && !!consignee;

      // Asegurar id 100% único
      const baseId = it.id || `item-${idx}`;
      const uniqueRowId = seenRowIds.has(baseId) ? `${baseId}-${idx}` : baseId;
      seenRowIds.add(uniqueRowId);

      rows.push({
        id: uniqueRowId,
        nombre: consignee,
        codigoWarehouse: it.codigoWr || '',
        codigoTib: tib,
        codigoEscaneado: scannedCode,
        estado: displayEstado,
        nombreEscaneado: scannedName,
        isGroupStart,
        isGroupEnd,
        isManifestFound: !!isManifestFound,
        itemRef: it,
        rawIndex: idx
      });
    });

    return rows;
  }, [allScannedCodes, checkCodeInManifest, items, paquetes]);

  // Filtrado de filas
  const visibleRows = useMemo(() => {
    if (!searchInSheet.trim()) return sheetRows;
    const q = searchInSheet.toLowerCase().trim();
    return sheetRows.filter(
      r =>
        r.nombre.toLowerCase().includes(q) ||
        r.codigoWarehouse.toLowerCase().includes(q) ||
        r.codigoTib.toLowerCase().includes(q) ||
        r.codigoEscaneado.toLowerCase().includes(q) ||
        r.estado.toLowerCase().includes(q) ||
        r.nombreEscaneado.toLowerCase().includes(q)
    );
  }, [sheetRows, searchInSheet]);

  // Estadísticas
  const stats: SheetStats = useMemo(() => {
    const total = items.filter(i => !!i.codigoWr).length;
    const manifestEncontrados = items.filter(i => {
      if (!i.codigoWr) return false;
      const wr = i.codigoWr.toUpperCase().replace(/\s+/g, '');
      const digits = wr.replace(/^[A-Za-z]+0*/, '');
      const tib = (i.casillero || '').toUpperCase().replace(/\s+/g, '');
      return (
        allScannedCodes.has(wr) ||
        allScannedCodes.has(`WR${wr}`) ||
        allScannedCodes.has(tib) ||
        (digits && allScannedCodes.has(digits))
      );
    }).length;

    const noEncontrados = items.filter(i => i.trackingUsa && i.estado === 'NO_LISTADO').length;
    const pendientes = Math.max(0, total - manifestEncontrados);
    const progreso = total > 0 ? Math.round((manifestEncontrados / total) * 100) : 0;
    return { total, encontrados: manifestEncontrados, noEncontrados, pendientes, progreso };
  }, [allScannedCodes, items]);

  // Operaciones de negocio
  const handleLoadFromDatabase = async () => {
    if (!activeHojaId || paquetes.length === 0) return;

    const existingCodes = new Set(items.map(i => i.codigoWr.toUpperCase()));
    const unaddedPackages = paquetes.filter(p => !existingCodes.has(p.numeroReciboBodega.toUpperCase()));

    if (unaddedPackages.length === 0) {
      alert('Todos los paquetes existentes ya se encuentran en la hoja');
      return;
    }

    const rowsToInsert = unaddedPackages.map((p, idx) => ({
      hoja_id: activeHojaId,
      codigo_wr: p.numeroReciboBodega.toUpperCase(),
      casillero: p.numeroReciboBodega.replace(/^[A-Za-z]+0*/, ''),
      consignatario: p.nombreConsignatario || '',
      peso_kg: p.pesoKg || 0,
      posicion_estante: p.posicionEstante || 'REC',
      notas: '',
      estado: 'PENDIENTE',
      veces_escaneado: 0,
      orden: items.length + idx + 1
    }));

    try {
      const data = await sheetsService.insertItems(rowsToInsert);
      if (data && data.length > 0) {
        soundEffects.playBulkLoaded();
        fetchItems(activeHojaId);
      }
    } catch (err) {
      console.error('Error loading packages into sheet:', err);
    }
  };

  const handleExportExcel = () => {
    if (sheetRows.length === 0) return;

    const fileName = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const exportData = sheetRows
      .filter(r => !r.isSeparator)
      .map((r, idx) => ({
        '#': idx + 1,
        'NOMBRE': r.nombre,
        'CODIGO WAREHOUSE': r.codigoWarehouse,
        'CODIGO TIB': r.codigoTib,
        'CODIGO ESCANEADO': r.codigoEscaneado,
        'ESTADO': r.estado,
        'NOMBRE ESCANEADO': r.nombreEscaneado
      }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, docTitle || 'AMEX WR');
    XLSX.writeFile(workbook, fileName);
  };

  const handleResetScans = async () => {
    if (!activeHojaId) return;
    if (!confirm('¿Seguro que deseas reiniciar el cotejo? Los códigos escaneados se borrarán y volverán a PENDIENTE.')) {
      return;
    }

    setItems(prev =>
      prev.map(i => ({
        ...i,
        estado: 'PENDIENTE',
        trackingUsa: '',
        notas: '',
        escaneadoEn: undefined,
        escaneadoPor: undefined,
        vecesEscaneado: 0
      }))
    );

    try {
      await sheetsService.resetScans(activeHojaId);
    } catch (err) {
      console.error('Error resetting scans:', err);
    }
  };

  const handleSyncToMainPackages = async () => {
    const scannedItems = items.filter(i => i.estado === 'ESCANEADO');
    if (scannedItems.length === 0) {
      alert('No hay paquetes marcados como ENCONTRADO para sincronizar.');
      return;
    }

    if (
      !confirm(
        `¿Deseas actualizar el estado de los ${scannedItems.length} paquetes cotejados en el inventario principal a 'En Almacén Central Lince'?`
      )
    ) {
      return;
    }

    try {
      const updatedCount = await sheetsService.syncScannedToMainPackages(scannedItems);
      alert(`✅ Sincronización exitosa: Se actualizaron ${updatedCount} paquetes en la base de datos central.`);
    } catch (err) {
      console.error('Error syncing to main packages:', err);
      alert('Error al sincronizar con el inventario principal.');
    }
  };

  const handleClearScanAtRow = useCallback(async (itemId: string) => {
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? {
              ...i,
              trackingUsa: '',
              notas: '',
              estado: 'PENDIENTE',
              escaneadoEn: undefined,
              escaneadoPor: undefined,
              vecesEscaneado: 0
            }
          : i
      )
    );

    try {
      await sheetsService.clearScanAtRow(itemId);
    } catch (err) {
      console.error('Error clearing scan at row:', err);
    }
  }, []);

  const handleTitleBlur = async () => {
    if (!activeLibroId || !docTitle.trim()) return;
    try {
      await sheetsService.updateSheetTitle(activeLibroId, docTitle.trim());
      setHojas(prev => prev.map(h => (h.id === activeLibroId ? { ...h, titulo: docTitle.trim() } : h)));
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  // Abrir y cerrar libros
  const openWorkbook = useCallback((libroId: string) => {
    setActiveLibroId(libroId);
    const root = hojas.find(h => h.id === libroId);
    if (root) setDocTitle(root.titulo || 'AMEX WR');

    const subSheets = hojas
      .filter(h => h.id === libroId || h.libroId === libroId)
      .sort((a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime());

    if (subSheets.length > 0) {
      setActiveHojaId(subSheets[0].id);
    } else {
      setActiveHojaId(libroId);
    }
  }, [hojas]);

  const closeWorkbook = useCallback(() => {
    setActiveLibroId(null);
    setActiveHojaId(null);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/amex-excel/d/')) {
      window.history.replaceState(null, '', '/amex-excel');
    }
  }, []);

  // Gestión de pestañas (hojas) dentro del libro activo
  const handleAddSubSheet = useCallback(async (customName?: string) => {
    if (!activeLibroId) return;
    const activeLibro = hojas.find(h => h.id === activeLibroId);
    const currentCount = activeBookSheets.length;
    const tabName = customName?.trim() || `Hoja ${currentCount + 1}`;

    try {
      const newSubSheet = await sheetsService.createSubSheet(
        activeLibroId,
        tabName,
        operatorName,
        activeLibro?.tipoProceso || 'RECEPCION_LINCE'
      );
      if (newSubSheet) {
        setHojas(prev => [...prev, newSubSheet]);
        setActiveHojaId(newSubSheet.id);
        soundEffects.playBulkLoaded();
      }
    } catch (err) {
      console.error('Error creating sub-sheet:', err);
    }
  }, [activeLibroId, activeBookSheets.length, hojas, operatorName]);

  const handleRenameTab = useCallback(async (sheetId: string, newTabName: string) => {
    if (!newTabName.trim()) return;
    try {
      await sheetsService.updateSheetTabName(sheetId, newTabName.trim());
      setHojas(prev =>
        prev.map(h =>
          h.id === sheetId
            ? { ...h, nombreHoja: newTabName.trim(), ...(h.libroId ? { titulo: newTabName.trim() } : {}) }
            : h
        )
      );
    } catch (err) {
      console.error('Error renaming tab:', err);
    }
  }, []);

  const handleDeleteTab = useCallback(async (sheetId: string) => {
    if (activeBookSheets.length <= 1) {
      alert('Un libro de cálculo debe tener al menos una hoja.');
      return;
    }

    const sheetToDelete = hojas.find(h => h.id === sheetId);
    const sheetName = sheetToDelete?.nombreHoja || sheetToDelete?.titulo || 'esta hoja';
    if (!confirm(`¿Eliminar definitivamente la pestaña "${sheetName}" y todos sus datos cotejados?`)) {
      return;
    }

    try {
      await sheetsService.deleteSheet(sheetId);
      const remaining = activeBookSheets.filter(h => h.id !== sheetId);
      setHojas(prev => prev.filter(h => h.id !== sheetId));
      if (activeHojaId === sheetId && remaining.length > 0) {
        setActiveHojaId(remaining[0].id);
      }
    } catch (err) {
      console.error('Error deleting tab:', err);
    }
  }, [activeBookSheets, activeHojaId, hojas]);

  const handleDuplicateTab = useCallback(async (sheetId: string) => {
    const target = hojas.find(h => h.id === sheetId);
    if (!target) return;
    try {
      const dup = await sheetsService.duplicateSheet(sheetId, operatorName, target);
      if (dup) {
        setHojas(prev => [...prev, dup]);
        setActiveHojaId(dup.id);
        soundEffects.playBulkLoaded();
      }
    } catch (err) {
      console.error('Error duplicating tab:', err);
    }
  }, [hojas, operatorName]);

  // Hub callbacks (para libros completos)
  const handleCreateSheetFromHub = async (title: string, tipoProceso?: TipoProcesoCotejo) => {
    try {
      const newBook = await sheetsService.createSheet(title, undefined, tipoProceso, operatorName);
      if (newBook) {
        setHojas(prev => [newBook, ...prev]);
        setActiveLibroId(newBook.id);
        setActiveHojaId(newBook.id);
        setDocTitle(newBook.titulo);
      }
    } catch (err) {
      console.error('Error creating sheet from hub:', err);
    }
  };

  const handleRenameSheetFromHub = async (sheetId: string, newTitle: string) => {
    try {
      await sheetsService.updateSheetTitle(sheetId, newTitle);
      setHojas(prev => prev.map(h => (h.id === sheetId ? { ...h, titulo: newTitle } : h)));
      if (activeLibroId === sheetId) setDocTitle(newTitle);
    } catch (err) {
      console.error('Error renaming sheet:', err);
    }
  };

  const handleDeleteSheetFromHub = async (sheetId: string) => {
    try {
      await sheetsService.deleteSheet(sheetId);
      setHojas(prev => prev.filter(h => h.id !== sheetId && h.libroId !== sheetId));
      if (activeLibroId === sheetId) {
        setActiveLibroId(null);
        setActiveHojaId(null);
      }
    } catch (err) {
      console.error('Error deleting sheet:', err);
    }
  };

  const handleDuplicateSheetFromHub = async (sheetId: string) => {
    const original = hojas.find(h => h.id === sheetId);
    if (!original) return;

    try {
      const newBook = await sheetsService.duplicateSheet(sheetId, operatorName, original);
      if (newBook) {
        setHojas(prev => [newBook, ...prev]);
        setActiveLibroId(newBook.id);
        setActiveHojaId(newBook.id);
        setDocTitle(newBook.titulo);
      }
    } catch (err) {
      console.error('Error duplicating sheet:', err);
    }
  };

  return {
    hojas,
    setHojas,
    libros,
    activeBookSheets,
    activeLibroId,
    setActiveLibroId,
    activeHojaId,
    setActiveHojaId,
    openWorkbook,
    closeWorkbook,
    handleAddSubSheet,
    handleRenameTab,
    handleDeleteTab,
    handleDuplicateTab,
    items,
    setItems,
    isLoadingSheets,
    isLoadingItems,
    docTitle,
    setDocTitle,
    isStarred,
    setIsStarred,
    searchInSheet,
    setSearchInSheet,
    allScannedCodes,
    checkCodeInManifest,
    sheetRows,
    visibleRows,
    stats,
    fetchHojas,
    fetchItems,
    handleLoadFromDatabase,
    handleExportExcel,
    handleResetScans,
    handleSyncToMainPackages,
    handleClearScanAtRow,
    handleTitleBlur,
    handleCreateSheetFromHub,
    handleRenameSheetFromHub,
    handleDeleteSheetFromHub,
    handleDuplicateSheetFromHub
  };
}
