'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { matchesFuzzySearch } from '@/lib/fuzzySearch';
import { Paquete, VoucherFormValues, CobrosSubtab } from '../types';
import { CobrosService } from '../services/cobros.service';

interface UseVoucherFormProps {
  paquetes: Paquete[];
  setSubtab: (subtab: CobrosSubtab) => void;
  onVoucherSaved: () => void;
}

export function useVoucherForm({
  paquetes,
  setSubtab,
  onVoucherSaved
}: UseVoucherFormProps) {
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formValues, setFormValues] = useState<VoucherFormValues>({
    clienteNombre: '',
    clienteCasillero: '',
    clienteTelefono: '',
    monto: '',
    moneda: 'PEN',
    metodoPago: 'YAPE',
    numeroOperacion: '',
    fechaOperacion: new Date().toISOString().slice(0, 10),
    wrInput: '',
    notas: ''
  });

  const [selectedWrs, setSelectedWrs] = useState<Paquete[]>([]);
  const [wrSearchQuery, setWrSearchQuery] = useState('');

  // Procesar archivo de imagen
  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('El archivo pegado o arrastrado debe ser una imagen (JPG, PNG, WEBP).');
      return;
    }
    setVoucherFile(file);
    const preview = URL.createObjectURL(file);
    setVoucherPreviewUrl(preview);
    setSubtab('nuevo');
  }, [setSubtab]);

  // Captura global de Ctrl + V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processImageFile]);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Paquetes para asociar al pago
  const paquetesDisponibles = useMemo(() => {
    return paquetes.filter((p) => {
      const matchWR = matchesFuzzySearch(wrSearchQuery, [
        p.numeroReciboBodega,
        p.codigoCasillero,
        p.nombreConsignatario,
        p.dniConsignatario,
        p.posicionEstante
      ]);
      return matchWR;
    });
  }, [paquetes, wrSearchQuery]);

  // Guardar Nuevo Voucher y Subir a Cloudflare R2
  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voucherFile && !voucherPreviewUrl) {
      alert('Debes adjuntar, pegar con Ctrl+V o arrastrar la imagen del voucher.');
      return;
    }

    if (!formValues.clienteNombre.trim()) {
      alert('Por favor ingresa el nombre del cliente o consignatario.');
      return;
    }

    const montoNum = parseFloat(formValues.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSeq = Math.floor(100 + Math.random() * 900);
      const codigoCobro = `VOU-${todayStr}-${randomSeq}`;

      let finalVoucherUrl = '';
      let finalVoucherKey = '';

      if (voucherFile) {
        const uploadResult = await CobrosService.uploadVoucherImage({
          file: voucherFile,
          codigoCobro,
          clienteNombre: formValues.clienteNombre,
          metodoPago: formValues.metodoPago
        });
        finalVoucherUrl = uploadResult.url;
        finalVoucherKey = uploadResult.key;
      }

      // Construir lista de WRs pagados
      const wrList: Array<{
        id?: string;
        numeroReciboBodega: string;
        pesoKg?: number;
        descripcion?: string;
      }> = [
        ...selectedWrs.map((p) => ({
          id: p.id,
          numeroReciboBodega: p.numeroReciboBodega,
          pesoKg: p.pesoKg,
          descripcion: p.descripcion
        }))
      ];

      if (formValues.wrInput.trim()) {
        const manualWrs = formValues.wrInput
          .split(/[\n,;]+/)
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length > 0);

        manualWrs.forEach((wr) => {
          if (!wrList.some((p) => p.numeroReciboBodega === wr)) {
            wrList.push({
              numeroReciboBodega: wr,
              pesoKg: 1,
              descripcion: 'Paquete liquidado por WhatsApp'
            });
          }
        });
      }

      const payload = {
        codigo_cobro: codigoCobro,
        cliente_nombre: formValues.clienteNombre,
        cliente_casillero: formValues.clienteCasillero,
        cliente_telefono: formValues.clienteTelefono,
        monto: montoNum,
        moneda: formValues.moneda,
        metodo_pago: formValues.metodoPago,
        numero_operacion: formValues.numeroOperacion || `OP-${Date.now().toString().slice(-6)}`,
        fecha_operacion: formValues.fechaOperacion,
        voucher_url: finalVoucherUrl,
        voucher_key: finalVoucherKey,
        paquetes_wrs: wrList,
        estado: 'VALIDADO',
        registrado_por: 'Caja / WhatsApp AMEX',
        validado_por: 'Sistema Automático',
        notas: formValues.notas,
        creado_en: new Date().toISOString(),
        validado_en: new Date().toISOString()
      };

      await CobrosService.saveVoucher(payload);

      alert(
        `✅ ¡VOUCHER GUARDADO EXITOSAMENTE!\n\nCódigo: ${codigoCobro}\nCliente: ${formValues.clienteNombre}\nMonto: ${formValues.moneda === 'PEN' ? 'S/' : '$'} ${montoNum.toFixed(2)} (${formValues.metodoPago})\nAlmacenado en Cloudflare R2.`
      );

      // Limpiar formulario
      setVoucherFile(null);
      setVoucherPreviewUrl(null);
      setSelectedWrs([]);
      setFormValues({
        clienteNombre: '',
        clienteCasillero: '',
        clienteTelefono: '',
        monto: '',
        moneda: 'PEN',
        metodoPago: 'YAPE',
        numeroOperacion: '',
        fechaOperacion: new Date().toISOString().slice(0, 10),
        wrInput: '',
        notas: ''
      });
      setSubtab('todos');
      onVoucherSaved();
    } catch (err: any) {
      console.error('Error al guardar voucher:', err);
      alert('Error al registrar el cobro: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    voucherFile,
    setVoucherFile,
    voucherPreviewUrl,
    setVoucherPreviewUrl,
    isDragging,
    isSubmitting,
    formValues,
    setFormValues,
    selectedWrs,
    setSelectedWrs,
    wrSearchQuery,
    setWrSearchQuery,
    paquetesDisponibles,
    processImageFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSaveVoucher
  };
}
