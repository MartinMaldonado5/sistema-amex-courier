'use client';

import { useCallback, type Dispatch, type FormEvent, type SetStateAction } from 'react';
import type { Cliente, Paquete, ScannedLog, ScanConfirmExtra, TipoEstadoEntrega, TipoMetodoEntrega, TipoUbicacion } from '@/types';
import type { NewClientFormData } from '@/components/modals/NewClientModal';
import type { NewPkgFormData } from '@/components/modals/NewPackageModal';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';
import { isValidWr, cleanWr } from '@/lib/validations/wr';

import { DashboardUser } from './useDashboardSession';
import { ScannerQueueCloudService } from '@/features/scanner/services/scannerQueueCloud.service';

const WMS_CODE_REGEX = /^[A-Za-z0-9\-_]{3,60}$/;

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

  const handleAssignPackageLocation = useCallback(async (code: string, location: string): Promise<boolean> => {
    const upper = code.trim().toUpperCase();

    if (!WMS_CODE_REGEX.test(upper)) {
      console.warn(`[WMS] Código inválido rechazado por seguridad: "${code}"`);
      soundEffects.playNotFound();
      return false;
    }

    const [anaquel, piso] = location.includes('-') ? location.split('-') : [location, 'P1'];

    let snapshot: Paquete[] = [];
    setPaquetes((previous) => {
      snapshot = previous;
      return previous.map((item) =>
        item.numeroReciboBodega.toUpperCase() === upper || item.trackingUsa.toUpperCase() === upper
          ? { ...item, anaquel, piso, posicionEstante: location, estadoAmex: 'en_almacen', actualizadoEn: new Date().toISOString() }
          : item
      );
    });

    try {
      const { data, error } = await supabase.rpc('asignar_ubicacion_paquete', {
        p_codigo: upper,
        p_nueva_ubicacion: location,
        p_anaquel: anaquel,
        p_piso: piso,
        p_operador_nombre: currentUser?.nombre || 'Operador Logístico AMEX',
        p_operador_email: currentUser?.email || null,
        p_operador_id: currentUser?.id || null,
        p_tipo_movimiento: 'Asignación / reubicación WMS'
      });

      const rpcResult = data as { success?: boolean; error?: string } | null;

      if (error || !rpcResult?.success) {
        console.error('[WMS] Error al persistir ubicación en Supabase:', error || rpcResult?.error);
        if (snapshot.length > 0) {
          setPaquetes(snapshot);
        }
        soundEffects.playNotFound();
        return false;
      }

      soundEffects.playSuccess();
      return true;
    } catch (err) {
      console.error('[WMS] Excepción al invocar RPC asignar_ubicacion_paquete:', err);
      if (snapshot.length > 0) {
        setPaquetes(snapshot);
      }
      soundEffects.playNotFound();
      return false;
    }
  }, [currentUser, setPaquetes]);

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

    const numPeso = parseFloat(newPkgForm.pesoKg) || 0;
    const wr = cleanWr(newPkgForm.numeroReciboBodega);
    if (!isValidWr(wr)) {
      console.error('El código WR debe comenzar con WR y tener exactamente 11 caracteres:', wr);
      return;
    }
    const tracking = newPkgForm.trackingUsa?.trim() || '';
    const nombre = newPkgForm.nombreConsignatario?.trim() || 'PENDIENTE ASIGNACIÓN TIB';

    const newPackage: Paquete = {
      id: `p-${Date.now()}`,
      numeroReciboBodega: wr,
      tracking: tracking,
      trackingUsa: tracking,
      tipoEmpaque: newPkgForm.tipoEmpaque || 'CAJA',
      numeroFactura: newPkgForm.numeroFactura?.trim() || '',
      dniConsignatario: newPkgForm.dniConsignatario?.trim() || '',
      nombreConsignatario: nombre,
      descripcion: newPkgForm.descripcion?.trim() || 'MERCANCÍA GENERAL',
      pesoKg: numPeso,
      ubicacionActual: (newPkgForm.ubicacionActual || 'AmexLince') as TipoUbicacion,
      anaquel,
      piso,
      posicionEstante: posicion,
      metodoEntrega: (newPkgForm.metodoEntrega || 'CarroAmexDomicilio') as TipoMetodoEntrega,
      estadoTib: 'EnAlmacen',
      estadoEntrega: 'EnAlmacen' as TipoEstadoEntrega,
      estadoAmex: 'en_almacen',
      facturaPdfUrl: newPkgForm.facturaPdfUrl || '',
      usuarioEmail: currentUser?.email || '',
      creadoPor: currentUser?.id || undefined,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    };

    setPaquetes((previous) => [newPackage, ...previous]);
    setIsNewPkgModalOpen(false);

    try {
      const { data: insertedPkg, error: insertError } = await supabase.from('paquetes').insert({
        numero_recibo_bodega: wr,
        tracking: tracking || null,
        tipo_empaque: newPkgForm.tipoEmpaque || 'CAJA',
        dni_consignatario: newPkgForm.dniConsignatario?.trim() || null,
        nombre_consignatario: nombre,
        descripcion: newPkgForm.descripcion?.trim() || 'MERCANCÍA GENERAL',
        peso_kg: numPeso,
        ubicacion_actual: newPkgForm.ubicacionActual || 'AmexLince',
        anaquel,
        piso,
        posicion_estante: posicion,
        estado_amex: 'en_almacen',
        usuario_email: currentUser?.email || '',
        creado_por: currentUser?.id || null
      }).select('id').maybeSingle();

      if (insertError) {
        console.error('Error insert paquete:', insertError);
      } else {
        // Kardex audit movement
        await supabase.from('movimientos_kardex').insert({
          paquete_id: insertedPkg?.id || null,
          codigo_paquete: wr,
          consignatario: nombre,
          origen_descripcion: 'INGRESO BODEGA / MIAMI',
          destino_descripcion: `${newPkgForm.ubicacionActual || 'AmexLince'} (${posicion})`,
          tipo_movimiento: 'INGRESO_ALMACEN',
          motivo: 'Registro manual de paquete en almacén',
          usuario_operador: currentUser?.nombre || currentUser?.email || 'Operador AMEX'
        });
      }
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
      numeroReciboBodega: '',
      posicionEstante: 'OFI-P1'
    });
    setIsNewPkgModalOpen(true);
  }, [emptyPkgForm, setIsNewPkgModalOpen, setNewPkgForm]);

  const handleScanCode = useCallback((code: string, format: string, extra?: DashboardScanExtra | ScanConfirmExtra) => {
    const newLog: ScannedLog = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      code: code.trim().toUpperCase(),
      format,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      location: extra?.location,
      anaquel: extra?.anaquel,
      piso: extra?.piso,
      workflow: (extra?.mode as 'slotting' | 'lookup' | 'delivery' | 'relocate' | 'general') || 'slotting',
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
      if (currentUser?.email) {
        ScannerQueueCloudService.saveStagingQueueToCloud({
          queue: updated,
          userEmail: currentUser.email,
          userId: currentUser?.id
        }).catch(() => {});
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
