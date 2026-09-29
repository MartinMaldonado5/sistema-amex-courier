'use client';

import { useCallback, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { Cliente, Paquete, ScannedLog, TipoEstadoEntrega, TipoMetodoEntrega, TipoUbicacion } from '@/types';
import type { NewClientFormData } from '@/components/modals/NewClientModal';
import type { NewPkgFormData } from '@/components/modals/NewPackageModal';
import { supabase } from '@/lib/supabase/client';

import { DashboardUser } from './useDashboardSession';

export interface DashboardScanExtra {
  mode?: string;
  location?: string;
  anaquel?: string;
  piso?: string;
  pkg?: Paquete;
  cli?: Cliente;
}

interface UseDashboardActionsOptions {
  newClientForm: NewClientFormData;
  newPkgForm: NewPkgFormData;
  currentUser?: DashboardUser | null;
  setClientes: Dispatch<SetStateAction<Cliente[]>>;
  setPaquetes: Dispatch<SetStateAction<Paquete[]>>;
  setScannedLogs: Dispatch<SetStateAction<ScannedLog[]>>;
  setNewClientForm: Dispatch<SetStateAction<NewClientFormData>>;
  setNewPkgForm: Dispatch<SetStateAction<NewPkgFormData>>;
  setIsNewClientModalOpen: Dispatch<SetStateAction<boolean>>;
  setIsNewPkgModalOpen: Dispatch<SetStateAction<boolean>>;
  emptyClientForm: NewClientFormData;
  emptyPkgForm: NewPkgFormData;
}

export function useDashboardActions({
  newClientForm,
  newPkgForm,
  currentUser,
  setClientes,
  setPaquetes,
  setScannedLogs,
  setNewClientForm,
  setNewPkgForm,
  setIsNewClientModalOpen,
  setIsNewPkgModalOpen,
  emptyClientForm,
  emptyPkgForm
}: UseDashboardActionsOptions) {
  const handleUpdatePackage = useCallback((updated: Paquete) => {
    setPaquetes((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
  }, [setPaquetes]);

  const handleDeletePackage = useCallback((id: string) => {
    setPaquetes((previous) => previous.filter((item) => item.id !== id));
  }, [setPaquetes]);

  const handleAssignPackageLocation = useCallback(async (code: string, location: string) => {
    const upper = code.trim().toUpperCase();
    const [anaquel, piso] = location.includes('-') ? location.split('-') : [location, 'P1'];

    setPaquetes((previous) =>
      previous.map((item) =>
        item.numeroReciboBodega.toUpperCase() === upper || item.trackingUsa.toUpperCase() === upper
          ? { ...item, anaquel, piso, posicionEstante: location }
          : item
      )
    );

    try {
      await supabase
        .from('paquetes')
        .update({
          anaquel,
          piso,
          posicion_estante: location,
          eliminado_en: null,
          motivo_eliminacion: null,
          eliminado_por: null,
          actualizado_en: new Date().toISOString()
        })
        .or(`numero_recibo_bodega.eq.${upper},tracking_usa.eq.${upper}`);
    } catch (error) {
      console.warn('Error syncing package location to Supabase:', error);
    }
  }, [setPaquetes]);

  const handleSaveClient = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const newClient: Cliente = {
      id: `c-${Date.now()}`,
      ...newClientForm,
      creadoEn: new Date().toISOString()
    };

    setClientes((previous) => [newClient, ...previous]);
    setIsNewClientModalOpen(false);

    try {
      await supabase.from('clientes').insert({
        nombre: newClientForm.nombre,
        apellido: newClientForm.apellido || null,
        documento_identidad: newClientForm.documentoIdentidad,
        telefono: newClientForm.telefono,
        email: newClientForm.email,
        departamento: newClientForm.departamento,
        provincia: newClientForm.provincia,
        distrito: newClientForm.distrito,
        direccion_entrega: newClientForm.direccionEntrega
      });
    } catch (error) {
      console.error('Error insert cliente:', error);
    }
  }, [newClientForm, setClientes, setIsNewClientModalOpen]);

  const handleSavePackage = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    const posicion = newPkgForm.posicionEstante || `${newPkgForm.anaquel || 'A1'}-${newPkgForm.piso || 'P1'}`;
    const [anaquel, piso] = posicion.includes('-') ? posicion.split('-') : [posicion, 'P1'];

    const newPackage: Paquete = {
      id: `p-${Date.now()}`,
      numeroReciboBodega: newPkgForm.numeroReciboBodega,
      trackingUsa: newPkgForm.trackingUsa || '940010000000000000',
      tipoEmpaque: newPkgForm.tipoEmpaque,
      numeroFactura: newPkgForm.numeroFactura,
      dniConsignatario: newPkgForm.dniConsignatario,
      nombreConsignatario: newPkgForm.nombreConsignatario,
      descripcion: newPkgForm.descripcion,
      pesoKg: Number(newPkgForm.pesoKg),
      valorDeclaradoUsd: Number(newPkgForm.valorDeclaradoUsd),
      ubicacionActual: newPkgForm.ubicacionActual as TipoUbicacion,
      anaquel,
      piso,
      posicionEstante: posicion,
      metodoEntrega: newPkgForm.metodoEntrega as TipoMetodoEntrega,
      estadoEntrega: 'EnAlmacen' as TipoEstadoEntrega,
      facturaPdfUrl: newPkgForm.facturaPdfUrl,
      usuarioEmail: currentUser?.email || '',
      creadoPor: currentUser?.id || undefined,
      creadoEn: new Date().toISOString()
    };

    setPaquetes((previous) => [newPackage, ...previous]);
    setIsNewPkgModalOpen(false);

    try {
      await supabase.from('paquetes').insert({
        numero_recibo_bodega: newPkgForm.numeroReciboBodega,
        tracking_usa: newPkgForm.trackingUsa,
        tipo_empaque: newPkgForm.tipoEmpaque,
        numero_factura: newPkgForm.numeroFactura,
        dni_consignatario: newPkgForm.dniConsignatario,
        nombre_consignatario: newPkgForm.nombreConsignatario,
        descripcion: newPkgForm.descripcion,
        peso_kg: newPkgForm.pesoKg,
        valor_declarado_usd: newPkgForm.valorDeclaradoUsd,
        ubicacion_actual: newPkgForm.ubicacionActual,
        anaquel,
        piso,
        posicion_estante: posicion,
        metodo_entrega: newPkgForm.metodoEntrega,
        factura_pdf_url: newPkgForm.facturaPdfUrl,
        usuario_email: currentUser?.email || '',
        creado_por: currentUser?.id || null
      });
    } catch (error) {
      console.error('Error insert paquete:', error);
    }
  }, [newPkgForm, currentUser, setIsNewPkgModalOpen, setPaquetes]);

  const openNewClientModal = useCallback(() => {
    setNewClientForm(emptyClientForm);
    setIsNewClientModalOpen(true);
  }, [emptyClientForm, setIsNewClientModalOpen, setNewClientForm]);

  const openNewPkgModal = useCallback(() => {
    setNewPkgForm({
      ...emptyPkgForm,
      numeroReciboBodega: `WR${Math.floor(100000 + Math.random() * 900000)}`
    });
    setIsNewPkgModalOpen(true);
  }, [emptyPkgForm, setIsNewPkgModalOpen, setNewPkgForm]);

  const handleScanCode = useCallback((code: string, format: string, extra?: DashboardScanExtra) => {
    const newLog: ScannedLog = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      code: code.trim().toUpperCase(),
      format,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      location: extra?.location,
      anaquel: extra?.anaquel,
      piso: extra?.piso,
      workflow: (extra?.mode as 'slotting' | 'lookup' | 'delivery' | 'general') || 'slotting',
      nombreConsignatario: extra?.pkg?.nombreConsignatario || extra?.cli?.nombre,
      operadorEmail: currentUser?.email || '',
      operadorNombre: currentUser?.nombre || 'Operador Logístico AMEX',
      synced: false
    };

    setScannedLogs((previous) => {
      const updated = [newLog, ...previous];
      try {
        localStorage.setItem('amex_scanner_staging_queue_v2', JSON.stringify(updated));
      } catch (error) {
        console.warn('Error guardando la cola local del escáner:', error);
      }
      return updated;
    });

    if (extra?.location) {
      void handleAssignPackageLocation(code, extra.location);
    }
  }, [currentUser, handleAssignPackageLocation, setScannedLogs]);

  return {
    handleUpdatePackage,
    handleDeletePackage,
    handleAssignPackageLocation,
    handleSaveClient,
    handleSavePackage,
    openNewClientModal,
    openNewPkgModal,
    handleScanCode
  };
}
