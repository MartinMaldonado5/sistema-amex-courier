import { useState, useEffect, useMemo, useCallback } from 'react';
import { HojaCotejo, ItemCotejo, Paquete, TipoProcesoCotejo } from '@/types';
import { soundEffects } from '@/lib/audio/soundEffects';
import * as XLSX from 'xlsx';
import { sheetsService } from '../services/sheets.service';
import { SheetRow, SheetStats } from '../types';
import { getSheetLongCode } from '@/components/tabs/SheetsHub';

interface UseLiveSheetsDataProps {
  paquetes: Paquete[];
  operatorName: string;
}

export function useLiveSheetsData({ paquetes, operatorName }: UseLiveSheetsDataProps) {
  // State: Hojas & Items
  const [hojas, setHojas] = useState<HojaCotejo[]>([]);
  const [activeHojaId, setActiveHojaId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemCotejo[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Document Title & Starred
  const [docTitle, setDocTitle] = useState('AMEX WR');
  const [isStarred, setIsStarred] = useState(true);

  // Search filter
  const [searchInSheet, setSearchInSheet] = useState('');

  // 1. Fetch Hojas
  const fetchHojas = useCallback(async () => {
    try {
      setIsLoadingSheets(true);
      const mapped = await sheetsService.fetchHojas();
      setHojas(mapped);
      if (activeHojaId) {
        const found = mapped.find(h => h.id === activeHojaId);
        if (found) setDocTitle(found.titulo || 'AMEX WR');
      }
    } catch (err) {
      console.error('Error in fetchHojas:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  }, [activeHojaId]);

  // 2. Fetch Items
  const fetchItems = useCallback(async (hojaId: string) => {
    if (!hojaId) return;
    try {
      setIsLoadingItems(true);
      const mappedItems = await sheetsService.fetchItems(hojaId);
      setItems(mappedItems);
    } catch (err) {
      console.error('Error in fetchItems:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHojas();
  }, [fetchHojas]);

  // Sync active sheet items and title
  useEffect(() => {
    if (activeHojaId) {
      fetchItems(activeHojaId);
      const activeSheet = hojas.find(h => h.id === activeHojaId);
      if (activeSheet) {
        setDocTitle(activeSheet.titulo || 'AMEX WR');
      }
    }
  }, [activeHojaId, fetchItems, hojas]);

  // Sincronización con Hash de URL (#d/...)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.startsWith('#d/')) {
        const code = hash.replace('#d/', '').trim();
        const found = hojas.find(h => getSheetLongCode(h.id) === code || h.id === code);
        if (found) {
          setActiveHojaId(found.id);
          setDocTitle(found.titulo || 'AMEX WR');
        }
      }
    }
  }, [hojas]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeHojaId) {
        const code = getSheetLongCode(activeHojaId);
        window.history.replaceState(null, '', `#d/${code}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [activeHojaId]);

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
    let prevConsignee = '';

    items.forEach((it, idx) => {
      const consignee = (it.consignatario || '').trim();

      if (prevConsignee && consignee && consignee !== prevConsignee) {
        rows.push({
          id: `sep-${it.id}`,
          nombre: '',
          codigoWarehouse: '',
          codigoTib: '',
          codigoEscaneado: '',
          estado: 'PENDIENTE',
          nombreEscaneado: '',
          isSeparator: true
        });
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
        if (it.estado === 'ESCANEADO') {
          displayEstado = 'ENCONTRADO';
        } else if (it.estado === 'NO_LISTADO') {
          displayEstado = 'NO ENCONTRADO';
          if (!scannedName) scannedName = 'NO ASIGNADO';
        } else {
          const match = checkCodeInManifest(scannedCode);
          if (match) {
            displayEstado = 'ENCONTRADO';
            scannedName = match.consignatario || 'CLIENTE AMEX';
          } else {
            displayEstado = 'NO ENCONTRADO';
            scannedName = 'NO ASIGNADO';
          }
        }
      }

      const tib = it.casillero || (it.codigoWr ? it.codigoWr.replace(/^[A-Za-z]+0*/, '') : '');
      const isGroupStart = (idx === 0 || (items[idx - 1]?.consignatario || '').trim() !== consignee) && !!consignee;
      const isGroupEnd = (idx === items.length - 1 || (items[idx + 1]?.consignatario || '').trim() !== consignee) && !!consignee;

      rows.push({
        id: it.id,
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
  }, [allScannedCodes, checkCodeInManifest, items]);

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
    if (!activeHojaId || !docTitle.trim()) return;
    try {
      await sheetsService.updateSheetTitle(activeHojaId, docTitle);
    } catch (err) {
      console.error('Error updating title:', err);
    }
  };

  // Hub callbacks
  const handleCreateSheetFromHub = async (title: string, tipoProceso?: TipoProcesoCotejo) => {
    try {
      const newSheet = await sheetsService.createSheet(title, undefined, tipoProceso, operatorName);
      if (newSheet) {
        await fetchHojas();
        setActiveHojaId(newSheet.id);
        setDocTitle(newSheet.titulo);
      }
    } catch (err) {
      console.error('Error creating sheet from hub:', err);
    }
  };

  const handleRenameSheetFromHub = async (sheetId: string, newTitle: string) => {
    try {
      await sheetsService.updateSheetTitle(sheetId, newTitle);
      setHojas(prev => prev.map(h => (h.id === sheetId ? { ...h, titulo: newTitle } : h)));
      if (activeHojaId === sheetId) setDocTitle(newTitle);
    } catch (err) {
      console.error('Error renaming sheet:', err);
    }
  };

  const handleDeleteSheetFromHub = async (sheetId: string) => {
    try {
      await sheetsService.deleteSheet(sheetId);
      setHojas(prev => prev.filter(h => h.id !== sheetId));
      if (activeHojaId === sheetId) {
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
      const newSheet = await sheetsService.duplicateSheet(sheetId, operatorName, original);
      if (newSheet) {
        await fetchHojas();
        setActiveHojaId(newSheet.id);
      }
    } catch (err) {
      console.error('Error duplicating sheet:', err);
    }
  };

  return {
    hojas,
    setHojas,
    activeHojaId,
    setActiveHojaId,
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
