'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  HojaCotejo,
  ItemCotejo,
  Paquete,
  Cliente,
  TipoProcesoCotejo,
  TipoEstadoItemCotejo
} from '@/types';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Plus,
  ClipboardPaste,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Search,
  Zap,
  Sparkles,
  Camera,
  Star,
  CloudCheck,
  Undo2,
  Redo2,
  Printer,
  X,
  Trash2,
  Filter,
  ArrowRight
} from 'lucide-react';
import PasteWrListModal from '@/components/modals/PasteWrListModal';
import NewSheetModal from '@/components/modals/NewSheetModal';
import MobileScannerModal from '@/components/scanner/MobileScannerModal';
import './live-sheets.css';

interface LiveSheetsTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  onViewPdf?: (url: string) => void;
  currentUser?: { nombre: string; rol: string } | null;
}

export interface SheetRow {
  id: string;
  nombre: string;
  codigoWarehouse: string;
  codigoTib: string;
  codigoEscaneado: string;
  estado: 'ENCONTRADO' | 'NO ENCONTRADO' | 'PENDIENTE' | '';
  nombreEscaneado: string;
  isSeparator?: boolean;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  isManifestFound?: boolean;
  itemRef?: ItemCotejo;
  rawIndex?: number;
}

export default function LiveSheetsTab({
  paquetes = [],
  clientes = [],
  onViewPdf,
  currentUser
}: LiveSheetsTabProps) {
  const operatorName = currentUser?.nombre || 'Operador Lince';

  // State: Hojas & Items
  const [hojas, setHojas] = useState<HojaCotejo[]>([]);
  const [activeHojaId, setActiveHojaId] = useState<string | null>(null);
  const [items, setItems] = useState<ItemCotejo[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Document Title (like "AMEX WR" in Google Sheets)
  const [docTitle, setDocTitle] = useState('AMEX WR');
  const [isStarred, setIsStarred] = useState(true);

  // Barcode Gun Scanning Input State
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Active Cell Selection (Google Sheets Address box, e.g. "E10")
  const [activeCell, setActiveCell] = useState<{ col: string; row: number; val: string }>({
    col: 'D',
    row: 2,
    val: ''
  });
  const [isEditingCell, setIsEditingCell] = useState(false);
  const [cellEditInput, setCellEditInput] = useState('');

  // Modals
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Audio settings
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Search in sheet
  const [searchInSheet, setSearchInSheet] = useState('');

  const rowDomRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const focusBarcodeInput = () => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  // 1. Fetch Hojas de Cotejo
  const fetchHojas = useCallback(async () => {
    try {
      setIsLoadingSheets(true);
      const { data, error } = await supabase
        .from('hojas_cotejo')
        .select('*')
        .order('actualizado_en', { ascending: false });

      if (error) {
        console.error('Error fetching hojas_cotejo:', error);
      } else if (data && data.length > 0) {
        const mapped: HojaCotejo[] = data.map(h => ({
          id: h.id,
          titulo: h.titulo,
          descripcion: h.descripcion || '',
          tipoProceso: (h.tipo_proceso as TipoProcesoCotejo) || 'RECEPCION_LINCE',
          estado: h.estado || 'ACTIVA',
          sedeId: h.sede_id,
          creadoPor: h.creado_por || 'AMEX',
          creadoEn: h.creado_en,
          actualizadoEn: h.actualizado_en
        }));
        setHojas(mapped);
        if (!activeHojaId || !mapped.some(h => h.id === activeHojaId)) {
          setActiveHojaId(mapped[0].id);
          setDocTitle(mapped[0].titulo || 'AMEX WR');
        }
      } else {
        // Create initial default sheet if empty
        const todayStr = new Date().toLocaleDateString('es-PE');
        const { data: newSheet } = await supabase
          .from('hojas_cotejo')
          .insert({
            titulo: 'AMEX WR',
            descripcion: 'Cotejo y pistoleo en tiempo real de bultos recibidos',
            tipo_proceso: 'RECEPCION_LINCE',
            creado_por: operatorName
          })
          .select()
          .single();

        if (newSheet) {
          const initSheet: HojaCotejo = {
            id: newSheet.id,
            titulo: newSheet.titulo,
            descripcion: newSheet.descripcion || '',
            tipoProceso: 'RECEPCION_LINCE',
            estado: 'ACTIVA',
            creadoPor: newSheet.creado_por || 'AMEX',
            creadoEn: newSheet.creado_en,
            actualizadoEn: newSheet.actualizado_en
          };
          setHojas([initSheet]);
          setActiveHojaId(initSheet.id);
          setDocTitle('AMEX WR');
        }
      }
    } catch (err) {
      console.error('Error in fetchHojas:', err);
    } finally {
      setIsLoadingSheets(false);
    }
  }, [activeHojaId, operatorName]);

  // 2. Fetch Items of active Hoja
  const fetchItems = useCallback(async (hojaId: string) => {
    if (!hojaId) return;
    try {
      setIsLoadingItems(true);
      const { data, error } = await supabase
        .from('hojas_cotejo_items')
        .select('*')
        .eq('hoja_id', hojaId)
        .order('orden', { ascending: true });

      if (error) {
        console.error('Error fetching items:', error);
      } else if (data) {
        const mappedItems: ItemCotejo[] = data.map(i => ({
          id: i.id,
          hojaId: i.hoja_id,
          codigoWr: i.codigo_wr,
          trackingUsa: i.tracking_usa,
          casillero: i.casillero,
          consignatario: i.consignatario,
          pesoKg: Number(i.peso_kg || 0),
          posicionEstante: i.posicion_estante,
          notas: i.notas,
          estado: (i.estado as TipoEstadoItemCotejo) || 'PENDIENTE',
          escaneadoEn: i.escaneado_en,
          escaneadoPor: i.escaneado_por,
          vecesEscaneado: i.veces_escaneado || 0,
          orden: i.orden,
          creadoEn: i.creado_en,
          actualizadoEn: i.actualizado_en
        }));
        setItems(mappedItems);
      }
    } catch (err) {
      console.error('Error in fetchItems:', err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchHojas();
  }, [fetchHojas]);

  useEffect(() => {
    if (activeHojaId) {
      fetchItems(activeHojaId);
      const activeSheet = hojas.find(h => h.id === activeHojaId);
      if (activeSheet) {
        setDocTitle(activeSheet.titulo || 'AMEX WR');
      }
    }
  }, [activeHojaId, fetchItems, hojas]);

  // Set de todos los códigos escaneados en Columna D para verificación instantánea
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

  // Función para comprobar si un código coincide con el manifiesto
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

  // 3. Process Barcode Gun Scan (Exact Google Sheets logic: secuencia hacia abajo en Col D)
  const processBarcodeScan = useCallback(
    async (scannedText: string, specificItemIndex?: number) => {
      if (!activeHojaId || !scannedText.trim()) return;

      const cleanCode = scannedText.trim().toUpperCase().replace(/\s+/g, '');
      const cleanDigits = cleanCode.replace(/^[A-Za-z]+0*/, '');
      setBarcodeInput('');

      // Comprobar si coincide con algún paquete del manifiesto
      const matchedManifest = checkCodeInManifest(cleanCode);
      const nowIso = new Date().toISOString();

      let targetItemIndex = -1;

      // Si el operador tenía una celda seleccionada en la columna D
      if (typeof specificItemIndex === 'number' && specificItemIndex >= 0 && specificItemIndex < items.length) {
        targetItemIndex = specificItemIndex;
      } else if (activeCell.col === 'D' && activeCell.row >= 2 && activeCell.row - 2 < items.length) {
        targetItemIndex = activeCell.row - 2;
      } else {
        // Encontrar la primera fila donde Columna D (trackingUsa) aún esté vacía
        targetItemIndex = items.findIndex(it => !it.trackingUsa || !it.trackingUsa.trim());
      }

      if (matchedManifest) {
        const clientName = matchedManifest.consignatario || 'CLIENTE AMEX';

        // Feedback sonoro y por voz
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
            row: targetItemIndex + 3, // Avanza al siguiente renglón estilo Google Sheets
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
          // Si todas las filas ya estaban llenas, agregar una nueva fila al final
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
        // NO ENCONTRADO: Bulto desconocido / no listado
        if (!isMuted) {
          soundEffects.playNotFound();
          if (isVoiceEnabled) {
            soundEffects.speak('No encontrado');
          }
        }

        // Buscar si existe en inventario general de paquetes para autocompletar
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
          // Agregar nueva fila al final
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
    [activeCell, activeHojaId, checkCodeInManifest, isMuted, isVoiceEnabled, items, operatorName, paquetes]
  );

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeScan(barcodeInput.trim());
    }
  };

  // 4. Transformar Items en Estructura de Hoja de Google Sheets con grupos exactos
  const sheetRows = useMemo(() => {
    const rows: SheetRow[] = [];
    let prevConsignee = '';

    items.forEach((it, idx) => {
      const consignee = (it.consignatario || '').trim();

      // Si cambia de cliente y no es el primer registro, añadir separador estético
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

      // Determinar si este ítem del manifiesto fue encontrado (en Cols B y C)
      const wrUpper = (it.codigoWr || '').toUpperCase().replace(/\s+/g, '');
      const tibUpper = (it.casillero || '').toUpperCase().replace(/\s+/g, '');
      const wrDigits = wrUpper.replace(/^[A-Za-z]+0*/, '');

      const isManifestFound =
        (wrUpper && allScannedCodes.has(wrUpper)) ||
        (wrUpper && allScannedCodes.has(`WR${wrUpper}`)) ||
        (tibUpper && allScannedCodes.has(tibUpper)) ||
        (wrDigits && allScannedCodes.has(wrDigits));

      // Determinar estado de la celda en Columna D
      let displayEstado: 'ENCONTRADO' | 'NO ENCONTRADO' | 'PENDIENTE' | '' = '';
      let scannedCode = (it.trackingUsa || '').trim();
      let scannedName = (it.notas || '').trim();

      if (scannedCode) {
        if (it.estado === 'ESCANEADO') {
          displayEstado = 'ENCONTRADO';
        } else if (it.estado === 'NO_LISTADO') {
          displayEstado = 'NO ENCONTRADO';
          if (!scannedName) scannedName = 'NO ASIGNADO';
        } else {
          // Evaluar al vuelo
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

      // Obtener código TIB (o extraer dígitos numéricos)
      const tib = it.casillero || (it.codigoWr ? it.codigoWr.replace(/^[A-Za-z]+0*/, '') : '');

      // Determinar inicio y fin del grupo de clientes para el borde negro
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

  // Filtrado de filas si hay búsqueda activa
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

  // Estadísticas del Cotejo
  const stats = useMemo(() => {
    const total = items.filter(i => !!i.codigoWr).length;
    // Cuántos paquetes del manifiesto fueron encontrados
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

  // 5. Cargar datos desde Supabase Central
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

    const { data, error } = await supabase.from('hojas_cotejo_items').insert(rowsToInsert).select();
    if (!error && data) {
      soundEffects.playBulkLoaded();
      fetchItems(activeHojaId);
    }
  };

  // 6. Exportar exactamente a Excel con las 6 columnas de Google Sheets
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

  // 7. Reiniciar Cotejo
  const handleResetScans = async () => {
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

    await supabase
      .from('hojas_cotejo_items')
      .update({
        estado: 'PENDIENTE',
        tracking_usa: null,
        notas: null,
        escaneado_en: null,
        escaneado_por: null,
        veces_escaneado: 0,
        actualizado_en: new Date().toISOString()
      })
      .eq('hoja_id', activeHojaId);
  };

  // 8. Sincronizar a Inventario Central
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
      let updatedCount = 0;
      for (const item of scannedItems) {
        const { error } = await supabase
          .from('paquetes')
          .update({
            ubicacion_actual: 'AmexLince',
            estado_entrega: 'EnAlmacen',
            posicion_estante: item.posicionEstante || 'REC'
          })
          .eq('numero_recibo_bodega', item.codigoWr);

        if (!error) updatedCount++;
      }

      alert(`✅ Sincronización exitosa: Se actualizaron ${updatedCount} paquetes en la base de datos central.`);
    } catch (err) {
      console.error('Error syncing to main packages:', err);
      alert('Error al sincronizar con el inventario principal.');
    }
  };

  // 9. Guardar título de la hoja
  const handleTitleBlur = async () => {
    if (!activeHojaId || !docTitle.trim()) return;
    await supabase.from('hojas_cotejo').update({ titulo: docTitle.trim() }).eq('id', activeHojaId);
  };

  // 10. Click en celda
  const handleCellClick = (col: string, row: number, val: string) => {
    setActiveCell({ col, row, val });
    setCellEditInput(val);
    setIsEditingCell(false);
  };

  // 11. Limpiar escaneo de una fila específica
  const handleClearScanAtRow = async (itemId: string) => {
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

    await supabase
      .from('hojas_cotejo_items')
      .update({
        tracking_usa: null,
        notas: null,
        estado: 'PENDIENTE',
        escaneado_en: null,
        escaneado_por: null,
        veces_escaneado: 0,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', itemId);
  };

  // 12. Enviar cambio desde la barra de fórmulas
  const handleFormulaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCell.col || !activeCell.row) return;
    const rowIndex = activeCell.row - 2;
    if (rowIndex >= 0 && rowIndex < items.length) {
      const item = items[rowIndex];
      const val = activeCell.val.trim();
      if (activeCell.col === 'D') {
        if (val) {
          processBarcodeScan(val, rowIndex);
        } else {
          handleClearScanAtRow(item.id);
        }
      }
    }
  };

  return (
    <div className="gsheet-container">
      {/* 1. Header Superior de Google Sheets */}
      <header className="gsheet-header-top">
        <div className="gsheet-header-left">
          <div className="gsheet-logo-icon" title="Google Sheets - AMEX ERP">
            <FileSpreadsheet size={20} />
          </div>

          <div className="gsheet-title-meta">
            <div className="gsheet-title-row">
              <input
                type="text"
                className="gsheet-doc-title"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                onBlur={handleTitleBlur}
                title="Renombrar documento"
              />
              <button
                type="button"
                className="gsheet-star-btn"
                onClick={() => setIsStarred(!isStarred)}
                title={isStarred ? 'Destacado' : 'No destacado'}
              >
                <Star size={15} fill={isStarred ? '#fbbc04' : 'none'} color={isStarred ? '#fbbc04' : '#5f6368'} />
              </button>
              <span className="gsheet-sync-badge" title="Todos los cambios se guardan automáticamente en Supabase">
                <CloudCheck size={14} className="text-emerald-600" />
                <span>Guardado en Supabase</span>
              </span>
            </div>

            <div className="gsheet-menu-bar">
              <button type="button" className="gsheet-menu-item" onClick={handleExportExcel}>
                Archivo
              </button>
              <button type="button" className="gsheet-menu-item" onClick={() => setIsPasteModalOpen(true)}>
                Editar
              </button>
              <button type="button" className="gsheet-menu-item" onClick={focusBarcodeInput}>
                Ver
              </button>
              <button type="button" className="gsheet-menu-item" onClick={handleLoadFromDatabase}>
                Insertar
              </button>
              <button type="button" className="gsheet-menu-item" onClick={handleResetScans}>
                Herramientas
              </button>
              <button
                type="button"
                className="gsheet-menu-item"
                onClick={() => alert('Sistema AMEX WR: Dispara la pistola de códigos directamente sobre la hoja.')}
              >
                Ayuda
              </button>
            </div>
          </div>
        </div>

        <div className="gsheet-header-right">
          {/* Métricas rápidas estilo Sheets */}
          <div className="gsheet-stats-pill">
            <span>Total: <strong>{stats.total}</strong></span>
            <span className="text-slate-300">|</span>
            <span className="gsheet-stat-tag found">
              <CheckCircle2 size={13} /> Encontrados: <strong>{stats.encontrados}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="gsheet-stat-tag not-found">
              <AlertTriangle size={13} /> Faltantes: <strong>{stats.noEncontrados + stats.pendientes}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sky-700 font-mono">
              <strong>{stats.progreso}%</strong>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Barra de Herramientas de Google Sheets + Pistola Láser */}
      <div className="gsheet-toolbar">
        <div className="gsheet-tool-group">
          <button type="button" className="gsheet-btn-tool" onClick={handleResetScans} title="Deshacer / Reiniciar">
            <Undo2 size={14} />
          </button>
          <button type="button" className="gsheet-btn-tool" onClick={() => fetchItems(activeHojaId || '')} title="Rehacer / Refrescar">
            <Redo2 size={14} />
          </button>
          <button type="button" className="gsheet-btn-tool" onClick={handleExportExcel} title="Exportar a Excel">
            <Printer size={14} />
          </button>

          <div className="gsheet-divider" />

          {/* Buscador de celdas en la hoja */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #dadce0', borderRadius: '14px', padding: '1px 8px', gap: '4px' }}>
            <Search size={13} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en hoja..."
              value={searchInSheet}
              onChange={e => setSearchInSheet(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11.5px', width: '120px', color: '#202124' }}
            />
            {searchInSheet && (
              <button type="button" onClick={() => setSearchInSheet('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <X size={12} className="text-slate-400" />
              </button>
            )}
          </div>

          <div className="gsheet-divider" />

          {/* Botón Pegar de Google Sheets */}
          <button
            type="button"
            className="gsheet-btn-action paste"
            onClick={() => setIsPasteModalOpen(true)}
            title="Pegar las 3 columnas de Google Sheets (NOMBRE, CODIGO WAREHOUSE, CODIGO TIB)"
          >
            <ClipboardPaste size={14} />
            <span>Pegar de Excel / Sheets</span>
          </button>

          {/* Botón Cargar de BD */}
          <button
            type="button"
            className="gsheet-btn-action secondary"
            onClick={handleLoadFromDatabase}
            title="Cargar paquetes de Supabase"
          >
            <Sparkles size={14} className="text-sky-600" />
            <span>Cargar BD</span>
          </button>

          {/* Botón Exportar */}
          <button
            type="button"
            className="gsheet-btn-action export"
            onClick={handleExportExcel}
            title="Descargar archivo .XLSX"
          >
            <Download size={14} />
            <span>Exportar XLSX</span>
          </button>
        </div>

        {/* Hero Scanner Gun Input (Centro / Derecha) */}
        <form onSubmit={handleManualScanSubmit} className="gsheet-gun-input-wrap">
          <Zap size={16} className="gsheet-gun-icon" />
          <input
            ref={barcodeInputRef}
            type="text"
            className="gsheet-gun-input"
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            placeholder="Apunta y dispara la pistola de código de barras aquí..."
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="gsheet-btn-tool"
            title="Escanear con Cámara en Celular/Tablet"
          >
            <Camera size={15} />
          </button>
        </form>

        {/* Audio y Sync Tools */}
        <div className="gsheet-tool-group">
          <button
            type="button"
            className={`gsheet-btn-tool ${!isMuted ? 'active' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Activar Bip de Pistola' : 'Silenciar Bip'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            type="button"
            className="gsheet-btn-action secondary"
            onClick={handleSyncToMainPackages}
            title="Actualizar estado en inventario principal de Lince"
          >
            <ArrowRight size={13} className="text-blue-600" />
            <span>Sincronizar a Lince</span>
          </button>
        </div>
      </div>

      {/* 3. Barra de Fórmulas (Formula Bar) */}
      <form onSubmit={handleFormulaSubmit} className="gsheet-formula-bar">
        <div className="gsheet-name-box">
          {activeCell.col}{activeCell.row}
        </div>
        <div className="gsheet-fx-symbol">
          fx
        </div>
        <input
          type="text"
          className="gsheet-formula-input"
          value={activeCell.val}
          onChange={e => setActiveCell(prev => ({ ...prev, val: e.target.value }))}
          placeholder="Selecciona una celda o dispara la pistola..."
        />
      </form>

      {/* 4. Canvas / Cuadrícula de Hoja de Cálculo (Google Sheets Viewport) */}
      <div className="gsheet-viewport">
        <table className="gsheet-table">
          <thead>
            {/* Fila 0: Letras de Columnas (A, B, C, D, E, F...) */}
            <tr>
              <th className="gsheet-corner-header">◰</th>
              <th className="gsheet-col-letter" style={{ width: '180px' }}>A</th>
              <th className="gsheet-col-letter" style={{ width: '150px' }}>B</th>
              <th className="gsheet-col-letter" style={{ width: '110px' }}>C</th>
              <th className="gsheet-col-letter" style={{ width: '160px' }}>D</th>
              <th className="gsheet-col-letter" style={{ width: '140px' }}>E</th>
              <th className="gsheet-col-letter" style={{ width: '180px' }}>F</th>
              {/* Columnas vacías estilo Google Sheets */}
              <th className="gsheet-col-letter" style={{ width: '90px' }}>G</th>
              <th className="gsheet-col-letter" style={{ width: '90px' }}>H</th>
              <th className="gsheet-col-letter" style={{ width: '90px' }}>I</th>
              <th className="gsheet-col-letter" style={{ width: '90px' }}>J</th>
            </tr>

            {/* Fila 1: Encabezados Reales de AMEX WR */}
            <tr>
              <th className="gsheet-row-num">1</th>
              <th className="gsheet-header-cell">NOMBRE</th>
              <th className="gsheet-header-cell">CODIGO WAREHOUSE</th>
              <th className="gsheet-header-cell">CODIGO TIB</th>
              <th className="gsheet-header-cell">CODIGO ESCANEADO</th>
              <th className="gsheet-header-cell">ESTADO</th>
              <th className="gsheet-header-cell">NOMBRE ESCANEADO</th>
              <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
              <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
              <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
              <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
            </tr>
          </thead>

          <tbody>
            {isLoadingItems || isLoadingSheets ? (
              Array.from({ length: 12 }).map((_, i) => (
                <tr key={`load-skel-${i}`}>
                  <td className="gsheet-row-num">{i + 2}</td>
                  <td className="gsheet-cell"><div className="skeleton-shimmer" style={{ height: '14px', width: '80%' }} /></td>
                  <td className="gsheet-cell gsheet-cell-mint"><div className="skeleton-shimmer" style={{ height: '14px', width: '90%' }} /></td>
                  <td className="gsheet-cell gsheet-cell-mint"><div className="skeleton-shimmer" style={{ height: '14px', width: '70%' }} /></td>
                  <td className="gsheet-cell"><div className="skeleton-shimmer" style={{ height: '14px', width: '85%' }} /></td>
                  <td className="gsheet-cell"><div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} /></td>
                  <td className="gsheet-cell"><div className="skeleton-shimmer" style={{ height: '14px', width: '75%' }} /></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                </tr>
              ))
            ) : visibleRows.length === 0 ? (
              <tr>
                <td className="gsheet-row-num">2</td>
                <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center', color: '#5f6368', background: '#ffffff' }}>
                  <FileSpreadsheet size={42} className="text-slate-300 mx-auto mb-3" />
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#202124', margin: '0 0 6px 0' }}>
                    La hoja de cotejo está vacía
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#5f6368', margin: '0 0 14px 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Pega tu lista de Google Sheets con las columnas <b>NOMBRE</b>, <b>CODIGO WAREHOUSE</b> y <b>CODIGO TIB</b>, o dispara la pistola inalámbrica.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="gsheet-btn-action paste"
                      onClick={() => setIsPasteModalOpen(true)}
                    >
                      <ClipboardPaste size={14} />
                      Pegar de Excel / Sheets
                    </button>
                    <button
                      type="button"
                      className="gsheet-btn-action secondary"
                      onClick={handleLoadFromDatabase}
                    >
                      <Sparkles size={14} className="text-sky-600" />
                      Cargar de Supabase
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((r, rIdx) => {
                const rowNum = rIdx + 2;

                // Fila de separación vacía entre grupos
                if (r.isSeparator) {
                  return (
                    <tr key={r.id} className="gsheet-separator-row">
                      <td className="gsheet-row-num">{rowNum}</td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                      <td className="gsheet-cell"></td>
                    </tr>
                  );
                }

                // Determinar si la celda es la actualmente activa
                const isCellActive = (col: string) => activeCell.col === col && activeCell.row === rowNum;

                // Clases de estilo para Col D y Col E
                const isNotFound = r.estado === 'NO ENCONTRADO';
                const isFound = r.estado === 'ENCONTRADO';

                const colDClass = isNotFound
                  ? 'gsheet-cell-red-alert'
                  : isFound
                  ? 'gsheet-cell-found-match'
                  : '';

                const colEClass = isNotFound
                  ? 'gsheet-cell-status-not-found'
                  : isFound
                  ? 'gsheet-cell-status-found'
                  : '';

                return (
                  <tr
                    key={r.id}
                    ref={el => {
                      rowDomRefs.current[r.id] = el;
                    }}
                  >
                    {/* Número de Fila */}
                    <td className="gsheet-row-num">{rowNum}</td>

                    {/* Columna A: NOMBRE (Grupo izquierdo y contorno negro de cliente) */}
                    <td
                      className={`gsheet-cell ${r.nombre ? 'gsheet-group-left' : ''} ${r.isGroupStart ? 'gsheet-group-top' : ''} ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${isCellActive('A') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('A', rowNum, r.nombre)}
                      style={{ fontWeight: 600 }}
                    >
                      {r.nombre}
                    </td>

                    {/* Columna B: CODIGO WAREHOUSE (Verde menta suave si fue encontrado) */}
                    <td
                      className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${r.isGroupStart ? 'gsheet-group-top' : ''} ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${isCellActive('B') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('B', rowNum, r.codigoWarehouse)}
                    >
                      {r.codigoWarehouse}
                    </td>

                    {/* Columna C: CODIGO TIB (Verde menta suave si fue encontrado, Grupo derecho de cliente) */}
                    <td
                      className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${r.nombre ? 'gsheet-group-right' : ''} ${r.isGroupStart ? 'gsheet-group-top' : ''} ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${isCellActive('C') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('C', rowNum, r.codigoTib)}
                    >
                      {r.codigoTib}
                    </td>

                    {/* Columna D: CODIGO ESCANEADO (Rojo vivo si NO ENCONTRADO, Verde suave si ENCONTRADO) */}
                    <td
                      className={`gsheet-cell ${colDClass} ${isCellActive('D') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('D', rowNum, r.codigoEscaneado)}
                      title={r.codigoEscaneado ? `Escaneado: ${r.codigoEscaneado}` : 'Clic para seleccionar celda'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{r.codigoEscaneado}</span>
                        {r.codigoEscaneado && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearScanAtRow(r.id);
                            }}
                            title="Borrar este escaneo"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isNotFound ? '#ffffff' : '#5f6368',
                              cursor: 'pointer',
                              padding: '0 2px',
                              opacity: 0.7,
                              fontSize: '11px',
                              lineHeight: 1
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Columna E: ESTADO */}
                    <td
                      className={`gsheet-cell ${colEClass} ${isCellActive('E') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('E', rowNum, r.estado)}
                    >
                      {r.estado}
                    </td>

                    {/* Columna F: NOMBRE ESCANEADO */}
                    <td
                      className={`gsheet-cell ${isCellActive('F') ? 'active-cell' : ''}`}
                      onClick={() => handleCellClick('F', rowNum, r.nombreEscaneado)}
                      style={{ color: isNotFound ? '#70757a' : '#202124', fontWeight: isFound ? 700 : 400 }}
                    >
                      {r.nombreEscaneado}
                    </td>

                    {/* Columnas vacías del lienzo de Google Sheets */}
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                  </tr>
                );
              })
            )}

            {/* Filas vacías adicionales al final para mantener el canvas de Google Sheets */}
            {Array.from({ length: Math.max(10, 30 - visibleRows.length) }).map((_, i) => {
              const extraRowNum = visibleRows.length + i + 2;
              return (
                <tr key={`empty-tail-${i}`}>
                  <td className="gsheet-row-num">{extraRowNum}</td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                  <td className="gsheet-cell"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Barra Inferior de Hojas (Bottom Tabs estilo Google Sheets) */}
      <footer className="gsheet-bottom-bar">
        <div className="gsheet-bottom-left">
          <button
            type="button"
            className="gsheet-add-tab-btn"
            onClick={() => setIsNewSheetModalOpen(true)}
            title="Añadir hoja"
          >
            <Plus size={16} />
          </button>

          {hojas.map((h, idx) => (
            <div
              key={h.id}
              className={`gsheet-tab-item ${h.id === activeHojaId ? 'active' : ''}`}
              onClick={() => setActiveHojaId(h.id)}
            >
              <span>{h.titulo || `Sheet${idx + 1}`}</span>
            </div>
          ))}
        </div>

        <div className="gsheet-bottom-right">
          <span>{items.length} filas</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">{stats.encontrados} encontrados</span>
          <span>•</span>
          <span className="text-red-700 font-semibold">{stats.noEncontrados} no encontrados</span>
        </div>
      </footer>

      {/* Modal: Pegar de Excel / Google Sheets */}
      <PasteWrListModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        paquetes={paquetes}
        onImport={async importedItems => {
          if (!activeHojaId || importedItems.length === 0) return;

          const rowsToInsert = importedItems.map((it, idx) => ({
            hoja_id: activeHojaId,
            codigo_wr: it.codigoWr,
            casillero: it.casillero || it.codigoWr.replace(/^[A-Za-z]+0*/, ''),
            tracking_usa: '',
            consignatario: it.consignatario || '',
            peso_kg: it.pesoKg || 0,
            posicion_estante: it.posicionEstante || 'REC',
            notas: '',
            estado: 'PENDIENTE',
            veces_escaneado: 0,
            orden: items.length + idx + 1
          }));

          const { data, error } = await supabase.from('hojas_cotejo_items').insert(rowsToInsert).select();
          if (!error && data) {
            soundEffects.playBulkLoaded();
            fetchItems(activeHojaId);
            setIsPasteModalOpen(false);
          }
        }}
      />

      {/* Modal: Nueva Hoja */}
      <NewSheetModal
        isOpen={isNewSheetModalOpen}
        onClose={() => setIsNewSheetModalOpen(false)}
        operatorName={operatorName}
        onCreated={(newSheet) => {
          fetchHojas();
          setActiveHojaId(newSheet.id);
          setDocTitle(newSheet.titulo || 'AMEX WR');
          setIsNewSheetModalOpen(false);
        }}
      />

      {/* Modal: Escáner de Cámara para Móvil */}
      <MobileScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onConfirm={code => {
          processBarcodeScan(code);
        }}
        paquetes={paquetes}
        clientes={clientes}
      />
    </div>
  );
}
