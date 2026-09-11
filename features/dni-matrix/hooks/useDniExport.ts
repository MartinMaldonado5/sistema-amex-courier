import { useState, useCallback, useRef, useEffect } from 'react';
import {
  exportMasterDocx,
  exportZipDocx,
  exportToDirectoryFolder,
  DniPrintSize
} from '@/lib/dni-matrix/docx-exporter';
import {
  convertDocxFolderToPdf,
  exportPdfZip,
  exportPdfToDirectoryFolder
} from '@/lib/dni-matrix/pdf-converter';
import { DniSlotData } from '@/lib/dni-matrix/db';

interface UseDniExportProps {
  slotsData: Record<number, DniSlotData>;
  printSize: DniPrintSize;
  showToast: (text: string, type?: 'info' | 'success' | 'error') => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
}

export function useDniExport({ slotsData, printSize, showToast, playSound }: UseDniExportProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [openUpwards, setOpenUpwards] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Estados de Conversor PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDirHandle, setPdfDirHandle] = useState<any>(null);
  const [pdfDestOption, setPdfDestOption] = useState<'subfolder' | 'same'>('subfolder');
  const [pdfFolderPath, setPdfFolderPath] = useState<string>('');
  const [pdfScanCount, setPdfScanCount] = useState<number | null>(null);
  const [pdfConverting, setPdfConverting] = useState<boolean>(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState<string>('');
  const [pdfProgressPercent, setPdfProgressPercent] = useState<number>(0);
  const [pdfSuccessDone, setPdfSuccessDone] = useState<boolean>(false);
  const [pdfConvertedInfo, setPdfConvertedInfo] = useState<{ total: number; dest: string } | null>(null);

  const toggleExportMenu = useCallback(() => {
    setShowExportMenu((prev) => {
      const next = !prev;
      if (next && exportMenuRef.current) {
        const rect = exportMenuRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setOpenUpwards(spaceBelow < 420 && spaceAbove > spaceBelow);
      }
      return next;
    });
  }, []);

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Exportar Word Maestro
  const handleExportMaster = async () => {
    const completed = Object.values(slotsData).filter((s) => s.anverso && s.reverso);
    if (completed.length === 0) {
      showToast('No hay expedientes completos para exportar.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      setExportStatusMessage('Preparando Word Maestro Único...');
      await exportMasterDocx(completed, (msg) => setExportStatusMessage(msg), printSize);
      showToast('¡Documento Word Maestro generado con éxito!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      setExportStatusMessage('');
    }
  };

  // Exportar ZIP
  const handleExportZip = async () => {
    const completed = Object.values(slotsData).filter((s) => s.anverso && s.reverso);
    if (completed.length === 0) {
      showToast('No hay expedientes completos para exportar.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      setExportStatusMessage('Comprimiendo archivos en ZIP...');
      await exportZipDocx(
        completed,
        (curr, tot) => {
          setExportStatusMessage(`Comprimiendo expediente ${curr} de ${tot}...`);
        },
        printSize
      );
      showToast('¡Carpeta ZIP generada con éxito!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar ZIP';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      setExportStatusMessage('');
    }
  };

  // Exportar directamente a carpeta de Windows
  const handleExportFolder = async () => {
    const completed = Object.values(slotsData).filter((s) => s.anverso && s.reverso);
    if (completed.length === 0) {
      showToast('No hay expedientes completos para exportar.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      setExportStatusMessage('Selecciona la carpeta donde guardar los archivos...');
      const res = await exportToDirectoryFolder(
        completed,
        (msg) => setExportStatusMessage(msg),
        printSize
      );
      if (res.cancelled) {
        showToast('Operación cancelada');
      } else {
        showToast(`¡${res.count} archivos Word guardados exitosamente!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar en carpeta';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      setExportStatusMessage('');
    }
  };

  // Exportar directamente a ZIP con archivos PDF A4
  const handleExportPdfZip = async () => {
    const completed = Object.values(slotsData).filter((s) => s.anverso && s.reverso);
    if (completed.length === 0) {
      showToast('No hay expedientes completos para exportar.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      setExportStatusMessage('Generando PDFs A4 milimétricos...');
      await exportPdfZip(
        completed,
        (curr, tot) => {
          setExportStatusMessage(`Generando PDF ${curr} de ${tot}...`);
        },
        printSize
      );
      showToast(`¡${completed.length} archivos PDF generados y descargados en ZIP!`, 'success');
      playSound('complete');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar PDF';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      setExportStatusMessage('');
    }
  };

  // Exportar directamente PDFs a carpeta de Windows
  const handleExportPdfFolder = async () => {
    const completed = Object.values(slotsData).filter((s) => s.anverso && s.reverso);
    if (completed.length === 0) {
      playSound('error');
      showToast('No hay expedientes completos para exportar en PDF.', 'error');
      return;
    }
    try {
      setIsExporting(true);
      setExportStatusMessage('Selecciona la carpeta donde guardar los PDFs...');
      const res = await exportPdfToDirectoryFolder(
        completed,
        (msg) => setExportStatusMessage(msg),
        printSize
      );
      if (res.cancelled) {
        showToast('Operación cancelada');
      } else {
        playSound('complete');
        showToast(`¡${res.count} archivos PDF guardados exitosamente en la carpeta!`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar PDFs en carpeta';
      playSound('error');
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
      setExportStatusMessage('');
    }
  };

  // Explorar Carpeta para Conversión a PDF
  const handlePickPdfFolder = async () => {
    const w = window as any;
    if (!w.showDirectoryPicker) {
      showToast('Tu navegador no soporta el explorador de carpetas nativo. Usa Chrome o Edge.', 'error');
      return;
    }
    try {
      const handle = await w.showDirectoryPicker({
        id: 'dni_convert_pdf_folder',
        mode: 'readwrite'
      });
      setPdfDirHandle(handle);
      setPdfFolderPath(handle.name);
      setPdfSuccessDone(false);
      setPdfConvertedInfo(null);

      let count = 0;
      for await (const entry of handle.values()) {
        if (
          entry.kind === 'file' &&
          entry.name.toLowerCase().endsWith('.docx') &&
          !entry.name.startsWith('~$')
        ) {
          count++;
        }
      }
      setPdfScanCount(count);
      if (count === 0) {
        showToast(`No se encontraron archivos .docx en la carpeta "${handle.name}"`, 'info');
      } else {
        showToast(`${count} archivos Word (.docx) detectados en "${handle.name}"`, 'success');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showToast('Error al seleccionar carpeta: ' + (err?.message || ''), 'error');
      }
    }
  };

  // Iniciar Conversión DOCX a PDF
  const handleStartPdfConversion = async () => {
    if (!pdfDirHandle) {
      showToast('Primero haz clic en "Examinar..." para seleccionar la carpeta donde están los Word', 'error');
      return;
    }
    if (pdfScanCount === 0) {
      showToast('La carpeta seleccionada no tiene archivos .docx válidos', 'error');
      return;
    }

    try {
      setPdfConverting(true);
      setPdfSuccessDone(false);
      setPdfConvertedInfo(null);
      setPdfProgressPercent(5);
      setPdfProgressMsg('Escaneando archivos Word (.docx)...');

      const result = await convertDocxFolderToPdf(
        pdfDirHandle,
        pdfDestOption === 'same',
        (curr, total, filename) => {
          const pct = Math.round((curr / total) * 100);
          setPdfProgressPercent(pct);
          setPdfProgressMsg(`Convirtiendo ${curr} de ${total}: ${filename}`);
        },
        printSize
      );

      setPdfProgressPercent(100);
      setPdfProgressMsg('¡Conversión finalizada con éxito!');
      setPdfConverting(false);
      setPdfSuccessDone(true);
      setPdfConvertedInfo({ total: result.total, dest: result.destFolder });
      playSound('complete');
      showToast(`¡${result.total} archivos PDF creados exitosamente en "${result.destFolder}"!`, 'success');
    } catch (err: any) {
      setPdfConverting(false);
      showToast(err.message || 'Error al convertir a PDF', 'error');
    }
  };

  return {
    isExporting,
    exportStatusMessage,
    showExportMenu,
    setShowExportMenu,
    openUpwards,
    exportMenuRef,
    toggleExportMenu,
    pdfDirHandle,
    pdfDestOption,
    setPdfDestOption,
    pdfFolderPath,
    pdfScanCount,
    pdfConverting,
    pdfProgressMsg,
    pdfProgressPercent,
    pdfSuccessDone,
    pdfConvertedInfo,
    handleExportMaster,
    handleExportZip,
    handleExportFolder,
    handleExportPdfZip,
    handleExportPdfFolder,
    handlePickPdfFolder,
    handleStartPdfConversion
  };
}
