import { useState, useEffect, useCallback } from 'react';
import { ActaEntregaData, ActaHistorialItem, DEFAULT_ACTA_DATA } from '../types';
import { generateActaEntregaPdf } from '../services/acta-pdf.service';
import { generateActaEntregaDocx } from '../services/acta-docx.service';
import { Cliente, Paquete } from '@/types';

const STORAGE_KEY = 'amex_actas_entrega_historial';

export function getTodayFormatted(): string {
  const date = new Date();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function useFormatoEntrega(paquetesAlmacen: Paquete[] = []) {
  const [formData, setFormData] = useState<ActaEntregaData>(() => ({
    ...DEFAULT_ACTA_DATA,
    fecha: getTodayFormatted()
  }));

  const [rawPasteText, setRawPasteText] = useState('');
  const [singlePackageInput, setSinglePackageInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [historial, setHistorial] = useState<ActaHistorialItem[]>([]);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  // Mostrar mensaje toast temporal
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistorial(JSON.parse(stored));
      }
    } catch {
      // Ignorar errores de parseo
    }
  }, []);

  // Guardar en historial
  const saveActaToHistorial = useCallback((data: ActaEntregaData) => {
    if (!data.destinatario && (!data.paquetes || data.paquetes.length === 0)) return;

    const newItem: ActaHistorialItem = {
      ...data,
      id: `acta-${Date.now()}`,
      creadoEn: new Date().toISOString()
    };

    setHistorial(prev => {
      const updated = [newItem, ...prev.filter(x => x.id !== newItem.id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar límites de almacenamiento
      }
      return updated;
    });
  }, []);

  // Actualizar un campo del formulario
  const updateField = useCallback(<K extends keyof ActaEntregaData>(field: K, value: ActaEntregaData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Seleccionar un cliente existente y autocompletar destinatario
  const handleSelectCliente = useCallback((cliente: Cliente) => {
    const fullName = `${cliente.nombre} ${cliente.apellido || ''}`.trim();
    setFormData(prev => ({
      ...prev,
      destinatario: fullName,
      recibidoPorNombre: prev.recibidoPorNombre || fullName
    }));

    // Buscar si el cliente tiene paquetes en almacén
    const clientPkgs = paquetesAlmacen.filter(p => {
      const casilleroMatch = cliente.codigoCasillero && p.codigoCasillero === cliente.codigoCasillero;
      const dniMatch = cliente.documentoIdentidad && p.dniConsignatario === cliente.documentoIdentidad;
      const nameMatch = p.nombreConsignatario && p.nombreConsignatario.toLowerCase().includes(cliente.nombre.toLowerCase());
      return casilleroMatch || dniMatch || nameMatch;
    });

    if (clientPkgs.length > 0) {
      showToast(`Cliente seleccionado. ${clientPkgs.length} paquete(s) detectado(s) en inventario.`);
    } else {
      showToast(`Cliente seleccionado: ${fullName}`);
    }
  }, [paquetesAlmacen, showToast]);

  // Cargar automáticamente los paquetes del almacén asignados al cliente actual
  const handleLoadWarehousePackagesForClient = useCallback(() => {
    if (!formData.destinatario) {
      showToast('Por favor escribe o selecciona un destinatario primero.');
      return;
    }

    const term = formData.destinatario.toLowerCase().trim();
    const matches = paquetesAlmacen.filter(p => {
      const name = (p.nombreConsignatario || '').toLowerCase();
      const wr = (p.numeroReciboBodega || '').toLowerCase();
      return name.includes(term) || term.includes(name) || wr.includes(term);
    });

    if (matches.length === 0) {
      showToast(`No se encontraron paquetes en inventario para "${formData.destinatario}".`);
      return;
    }

    const codes = matches.map(m => m.numeroReciboBodega).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      paquetes: Array.from(new Set([...prev.paquetes, ...codes]))
    }));

    showToast(`Se añadieron ${codes.length} paquetes desde el inventario.`);
  }, [formData.destinatario, paquetesAlmacen, showToast]);

  // Agregar un paquete individualmente
  const handleAddSinglePackage = useCallback(() => {
    const code = singlePackageInput.trim().toUpperCase();
    if (!code) return;

    setFormData(prev => {
      if (prev.paquetes.includes(code)) {
        showToast(`El código "${code}" ya está en la lista.`);
        return prev;
      }
      return {
        ...prev,
        paquetes: [...prev.paquetes, code]
      };
    });

    setSinglePackageInput('');
  }, [singlePackageInput, showToast]);

  // Pegado masivo de códigos WR / Trackings
  const handleProcessPasteText = useCallback(() => {
    if (!rawPasteText.trim()) return;

    // Extraer códigos separados por salto de línea, coma, punto y coma o espacio
    const extracted = rawPasteText
      .split(/[\r\n,;\t]+/)
      .map(line => line.trim().toUpperCase())
      .filter(line => line.length > 0);

    if (extracted.length === 0) {
      showToast('No se detectaron códigos válidos en el texto.');
      return;
    }

    setFormData(prev => {
      // Eliminar duplicados manteniendo orden
      const combined = Array.from(new Set([...prev.paquetes, ...extracted]));
      return {
        ...prev,
        paquetes: combined
      };
    });

    setRawPasteText('');
    showToast(`Se agregaron ${extracted.length} códigos de paquetes.`);
  }, [rawPasteText, showToast]);

  // Eliminar un paquete de la lista
  const handleRemovePackage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      paquetes: prev.paquetes.filter((_, i) => i !== index)
    }));
  }, []);

  // Limpiar lista de paquetes
  const handleClearPackages = useCallback(() => {
    setFormData(prev => ({ ...prev, paquetes: [] }));
    showToast('Lista de paquetes vaciada.');
  }, [showToast]);

  // Limpiar formulario completo a valores por defecto
  const handleResetForm = useCallback(() => {
    setFormData({
      ...DEFAULT_ACTA_DATA,
      fecha: getTodayFormatted(),
      destinatario: '',
      paquetes: [],
      recibidoPorNombre: ''
    });
    setRawPasteText('');
    setSinglePackageInput('');
    showToast('Formulario restablecido.');
  }, [showToast]);

  // Cargar acta guardada desde historial
  const handleRestoreFromHistorial = useCallback((item: ActaHistorialItem) => {
    setFormData({
      fecha: item.fecha || getTodayFormatted(),
      remitente: item.remitente || 'AMEX COURRIER',
      destinatario: item.destinatario || '',
      paquetes: [...(item.paquetes || [])],
      cargoTexto: item.cargoTexto || DEFAULT_ACTA_DATA.cargoTexto,
      recibidoPorNombre: item.recibidoPorNombre || '',
      recibidoPorFecha: item.recibidoPorFecha || '',
      recibidoPorHora: item.recibidoPorHora || '',
      logoStyle: item.logoStyle || 'clean'
    });
    setIsHistorialOpen(false);
    showToast(`Acta de "${item.destinatario || 'Cliente'}" cargada.`);
  }, [showToast]);

  // Borrar elemento del historial
  const handleDeleteHistorialItem = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistorial(prev => {
      const updated = prev.filter(x => x.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar
      }
      return updated;
    });
    showToast('Acta eliminada del historial.');
  }, [showToast]);

  // Acción: Impresión directa del navegador
  const handlePrint = useCallback(() => {
    saveActaToHistorial(formData);
    window.print();
  }, [formData, saveActaToHistorial]);

  // Acción: Exportar PDF
  const handleExportPdf = useCallback(async () => {
    try {
      setIsExporting(true);
      saveActaToHistorial(formData);
      await generateActaEntregaPdf(formData);
      showToast('¡PDF del Acta de Entrega generado y descargado!');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el archivo PDF.');
    } finally {
      setIsExporting(false);
    }
  }, [formData, saveActaToHistorial, showToast]);

  // Acción: Exportar Word (.docx)
  const handleExportDocx = useCallback(async () => {
    try {
      setIsExporting(true);
      saveActaToHistorial(formData);
      await generateActaEntregaDocx(formData);
      showToast('¡Documento Word (.docx) generado y descargado!');
    } catch (err) {
      console.error(err);
      showToast('Error al exportar documento Word.');
    } finally {
      setIsExporting(false);
    }
  }, [formData, saveActaToHistorial, showToast]);

  return {
    formData,
    rawPasteText,
    setRawPasteText,
    singlePackageInput,
    setSinglePackageInput,
    toastMessage,
    isExporting,
    historial,
    isHistorialOpen,
    setIsHistorialOpen,
    updateField,
    handleSelectCliente,
    handleLoadWarehousePackagesForClient,
    handleAddSinglePackage,
    handleProcessPasteText,
    handleRemovePackage,
    handleClearPackages,
    handleResetForm,
    handleRestoreFromHistorial,
    handleDeleteHistorialItem,
    handlePrint,
    handleExportPdf,
    handleExportDocx
  };
}
