'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvoiceData, InvoiceItem, INITIAL_INVOICE_DATA } from '../types';
import { generateInvoiceDocx } from '../services/invoiceDocxExporter';
import { generateInvoicePdf } from '../services/invoicePdfExporter';
import { Cliente } from '@/types';

const STORAGE_KEY_CURRENT = 'amex_invoice_current_draft';
const STORAGE_KEY_HISTORY = 'amex_invoice_history_list';

export function useInvoice() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(INITIAL_INVOICE_DATA);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [historial, setHistorial] = useState<InvoiceData[]>([]);
  const [isHistorialOpen, setIsHistorialOpen] = useState<boolean>(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [pasteRawText, setPasteRawText] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Cargar borrador y lista de historial al iniciar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY_CURRENT);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.invoiceNumber) {
          setInvoiceData(parsed);
        }
      }
      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory);
        if (Array.isArray(parsedHist)) {
          setHistorial(parsedHist);
        }
      }
    } catch (err) {
      console.warn('Error al leer localStorage de Invoices:', err);
    }
  }, []);

  // Guardar automáticamente borrador actual
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(invoiceData));
    } catch {
      // Ignorar quota exceeded
    }
  }, [invoiceData]);

  // Recalcular suma total a partir de los ítems
  const recalculateGrandTotal = (items: InvoiceItem[]): string => {
    const sum = items.reduce((acc, curr) => {
      const val = parseFloat(String(curr.total || '0').replace('$', '').trim());
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return sum.toFixed(2);
  };

  // 1. Modificar Invoice Number
  const updateInvoiceNumber = (num: string) => {
    setInvoiceData(prev => ({ ...prev, invoiceNumber: num }));
  };

  // Modificar Invoice Date y Invoice Due Date
  const updateInvoiceDate = (date: string) => {
    setInvoiceData(prev => ({ ...prev, invoiceDate: date }));
  };

  const updateInvoiceDueDate = (date: string) => {
    setInvoiceData(prev => ({ ...prev, invoiceDueDate: date }));
  };

  // Botón para colocar la fecha de hoy automáticamente
  const setTodayDates = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const todayFormatted = `${day}/${month}/${year}`;
    setInvoiceData(prev => ({
      ...prev,
      invoiceDate: todayFormatted,
      invoiceDueDate: todayFormatted
    }));
    showToast(`Fechas actualizadas a hoy: ${todayFormatted}`);
  };

  // Generar número correlativo aleatorio si se desea (ej: I000430460)
  const generateRandomInvoiceNumber = () => {
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    const newNum = `I${rand}`;
    setInvoiceData(prev => ({ ...prev, invoiceNumber: newNum }));
    showToast(`Nuevo N° de Factura: ${newNum}`);
  };

  // 2. Modificar Bill To
  const updateBillTo = (name: string) => {
    setInvoiceData(prev => ({ ...prev, billToName: name }));
  };

  // 3. Modificar Ship To
  const updateShipTo = (name: string) => {
    setInvoiceData(prev => ({ ...prev, shipToName: name }));
  };

  // Botón rápido: Copiar Bill To a Ship To
  const copyBillToToShipTo = () => {
    setInvoiceData(prev => ({ ...prev, shipToName: prev.billToName }));
    showToast('Nombre de "Bill To" copiado a "Ship To"');
  };

  // Selección rápida de cliente registrado en el sistema
  const handleSelectCliente = (cliente: Cliente, target: 'billTo' | 'shipTo' | 'both') => {
    const fullName = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim().toUpperCase();
    if (!fullName) return;

    setInvoiceData(prev => ({
      ...prev,
      billToName: target === 'shipTo' ? prev.billToName : fullName,
      shipToName: target === 'billTo' ? prev.shipToName : fullName
    }));

    showToast(`Cliente seleccionado: ${fullName}`);
  };

  // 4. Modificar Ítems
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      quantity: 1,
      unitPrice: '',
      total: ''
    };
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => {
      const nextItems = prev.items.filter(item => item.id !== id);
      const newAmount = recalculateGrandTotal(nextItems);
      return {
        ...prev,
        items: nextItems,
        invoiceAmount: newAmount
      };
    });
  };

  const updateItem = (
    id: string,
    field: 'name' | 'quantity' | 'unitPrice' | 'total',
    value: string | number
  ) => {
    setInvoiceData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Si se cambia la cantidad o el precio unitario, recalcular el total de la fila
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = parseFloat(String(field === 'quantity' ? value : item.quantity)) || 0;
          const price = parseFloat(String(field === 'unitPrice' ? value : item.unitPrice).replace('$', '')) || 0;
          if (qty > 0 && price > 0) {
            updated.total = (qty * price).toFixed(2);
          }
        }

        return updated;
      });

      // Recalcular el invoiceAmount automáticamente
      const newGrandTotal = recalculateGrandTotal(updatedItems);

      return {
        ...prev,
        items: updatedItems,
        invoiceAmount: newGrandTotal
      };
    });
  };

  // 5. Modificar Invoice Amount directamente (override manual)
  const updateInvoiceAmount = (amount: string | number) => {
    setInvoiceData(prev => ({ ...prev, invoiceAmount: amount }));
  };

  // Pegado rápido masivo desde Excel o texto copiado
  const handleProcessPasteText = (text: string) => {
    if (!text || !text.trim()) return;

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const newItems: InvoiceItem[] = [];

    lines.forEach((line, idx) => {
      // Separar por tabulaciones (Excel) o comas o múltiples espacios
      let parts = line.split('\t');
      if (parts.length === 1 && line.includes(',')) {
        parts = line.split(',');
      } else if (parts.length === 1 && line.includes(';')) {
        parts = line.split(';');
      }

      const p0 = parts[0]?.trim() || '';
      const p1 = parts[1]?.trim() || '1';
      const p2 = parts[2]?.trim() || '';
      const p3 = parts[3]?.trim() || '';

      const qty = parseFloat(p1) || 1;
      const unitPrice = parseFloat(p2.replace('$', '')) || (parts.length === 2 && !isNaN(parseFloat(p1)) ? '' : '');
      const rowTotal = p3 ? parseFloat(p3.replace('$', '')) : (unitPrice ? (qty * Number(unitPrice)).toFixed(2) : '');

      newItems.push({
        id: `paste-${Date.now()}-${idx}`,
        name: p0.toUpperCase(),
        quantity: qty,
        unitPrice: unitPrice ? Number(unitPrice).toFixed(2) : '',
        total: rowTotal ? String(rowTotal) : ''
      });
    });

    if (newItems.length > 0) {
      setInvoiceData(prev => {
        const nextItems = [...prev.items, ...newItems];
        return {
          ...prev,
          items: nextItems,
          invoiceAmount: recalculateGrandTotal(nextItems)
        };
      });
      showToast(`${newItems.length} ítems agregados con éxito.`);
      setPasteRawText('');
      setIsPasteModalOpen(false);
    }
  };

  // Limpiar todos los ítems directamente sin confirmación
  const handleClearItems = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [],
      invoiceAmount: '0.00'
    }));
    showToast('Ítems eliminados');
  };

  // Restaurar ejemplo inicial
  const handleResetToDefault = () => {
    if (confirm('¿Restaurar valores de la factura al ejemplo original del Word?')) {
      setInvoiceData({
        ...INITIAL_INVOICE_DATA,
        items: INITIAL_INVOICE_DATA.items.map(it => ({ ...it, id: `it-${Math.random()}` }))
      });
      showToast('Factura restablecida al ejemplo original');
    }
  };

  // Guardar en Historial Local
  const handleSaveToHistorial = () => {
    const record: InvoiceData = {
      ...invoiceData,
      savedAt: new Date().toLocaleString()
    };
    const nextHist = [record, ...historial.slice(0, 24)]; // Mantener últimos 25
    setHistorial(nextHist);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHist));
    } catch {}
    showToast('Factura guardada en el historial local');
  };

  // Restaurar desde Historial
  const handleRestoreFromHistorial = (item: InvoiceData) => {
    setInvoiceData({ ...item });
    setIsHistorialOpen(false);
    showToast(`Factura ${item.invoiceNumber} cargada con éxito`);
  };

  // Eliminar del Historial
  const handleDeleteHistorialItem = (index: number) => {
    const nextHist = historial.filter((_, i) => i !== index);
    setHistorial(nextHist);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHist));
    } catch {}
  };

  // Exportar a Word (.docx)
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      await generateInvoiceDocx(invoiceData);
      handleSaveToHistorial();
      showToast('¡Documento Word (.docx) generado y descargado!');
    } catch (err) {
      console.error('Error al exportar DOCX:', err);
      alert('Hubo un error al generar el archivo Word. Por favor intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await generateInvoicePdf(invoiceData);
      handleSaveToHistorial();
      showToast('¡Documento PDF generado y descargado!');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Hubo un error al generar el archivo PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  // Imprimir Hoja A4
  const handlePrint = () => {
    window.print();
  };

  return {
    invoiceData,
    toastMessage,
    isExporting,
    historial,
    isHistorialOpen,
    setIsHistorialOpen,
    isPasteModalOpen,
    setIsPasteModalOpen,
    pasteRawText,
    setPasteRawText,
    updateInvoiceNumber,
    generateRandomInvoiceNumber,
    updateInvoiceDate,
    updateInvoiceDueDate,
    setTodayDates,
    updateBillTo,
    updateShipTo,
    copyBillToToShipTo,
    handleSelectCliente,
    addItem,
    removeItem,
    updateItem,
    updateInvoiceAmount,
    handleProcessPasteText,
    handleClearItems,
    handleResetToDefault,
    handleSaveToHistorial,
    handleRestoreFromHistorial,
    handleDeleteHistorialItem,
    handleExportDocx,
    handleExportPdf,
    handlePrint
  };
}
