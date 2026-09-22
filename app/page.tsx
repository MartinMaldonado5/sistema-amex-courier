'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Paquete,
  Cliente,
  TipoUbicacion,
  TipoMetodoEntrega,
  TipoEstadoEntrega,
  ScannedLog,
  OrdenEntrega,
  CobroVoucher
} from '@/types';
import { supabase } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import HeaderBar from '@/components/HeaderBar';
import Sidebar from '@/components/Sidebar';
import { NewClientFormData } from '@/components/modals/NewClientModal';
import { NewPkgFormData } from '@/components/modals/NewPackageModal';
import { tabToPath, pathToTab, migrateLegacyHash } from '@/lib/navigation/routes';
import {
  PageSkeleton,
  DashboardSkeleton,
  InventorySkeleton,
  CobrosSkeleton,
  ScannerSkeleton,
  LiveSheetsSkeleton,
  DniMatrixSkeleton,
  RotulosA4Skeleton,
  BoletasShalomSkeleton,
  FormatoEntregaSkeleton
} from '@/components/ui/Skeleton';

const DashboardTab = dynamic(() => import('@/components/tabs/DashboardTab'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const InventoryTab = dynamic(() => import('@/components/tabs/InventoryTab'), {
  ssr: false,
  loading: () => <InventorySkeleton />
});

const CobrosTab = dynamic(() => import('@/components/tabs/CobrosTab'), {
  ssr: false,
  loading: () => <CobrosSkeleton />
});

const DirectorioClientesTab = dynamic(() => import('@/components/tabs/DirectorioClientesTab'), {
  ssr: false,
  loading: () => <CobrosSkeleton />
});

const ScannerTab = dynamic(() => import('@/components/tabs/ScannerTab'), {
  ssr: false,
  loading: () => <ScannerSkeleton />
});

const LiveSheetsTab = dynamic(() => import('@/components/tabs/LiveSheetsTab'), {
  ssr: false,
  loading: () => <LiveSheetsSkeleton />
});

const DniMatrixTab = dynamic(() => import('@/components/tabs/DniMatrixTab'), {
  ssr: false,
  loading: () => <DniMatrixSkeleton />
});

const RotulosA4Tab = dynamic(() => import('@/components/tabs/RotulosA4Tab'), {
  ssr: false,
  loading: () => <RotulosA4Skeleton />
});

const BoletasShalomTab = dynamic(() => import('@/components/tabs/BoletasShalomTab'), {
  ssr: false,
  loading: () => <BoletasShalomSkeleton />
});

const FormatoEntregaTab = dynamic(() => import('@/components/tabs/FormatoEntregaTab'), {
  ssr: false,
  loading: () => <FormatoEntregaSkeleton />
});

const NewClientModal = dynamic(() => import('@/components/modals/NewClientModal'), { ssr: false });
const NewPackageModal = dynamic(() => import('@/components/modals/NewPackageModal'), { ssr: false });
const ThermalLabelModal = dynamic(() => import('@/components/modals/ThermalLabelModal'), { ssr: false });
const PdfViewerModal = dynamic(() => import('@/components/modals/PdfViewerModal'), { ssr: false });

const EMPTY_CLIENT_FORM: NewClientFormData = {
  nombre: '',
  apellido: '',
  documentoIdentidad: '',
  telefono: '',
  email: '',
  departamento: 'LIMA',
  provincia: 'LIMA',
  distrito: 'LINCE',
  direccionEntrega: ''
};

const EMPTY_PKG_FORM: NewPkgFormData = {
  codigoCasillero: 'AMEX-PER-1001',
  numeroReciboBodega: 'WR000000',
  trackingUsa: '',
  tipoEmpaque: 'CAJA',
  numeroFactura: '',
  dniConsignatario: '',
  nombreConsignatario: '',
  descripcion: '',
  pesoKg: '1.0',
  valorDeclaradoUsd: '50.0',
  ubicacionActual: 'AmexLince',
  anaquel: 'A1',
  piso: 'P1',
  posicionEstante: 'A1-P1',
  metodoEntrega: 'CarroAmexDomicilio',
  facturaPdfUrl: ''
};

const VALID_TABS = [
  'dashboard',
  'live-sheets',
  'mm-lince',
  'mm-inventory',
  'fico-cobros',
  'directorio-clientes',
  'clientes-360',
  'mobile-scanner',
  'dni-matrix',
  'rotulos-a4',
  'boletas-shalom',
  'formato-entrega'
];

export default function DashboardPage() {
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sincronizar y restaurar pestaña activa desde URL limpia (con migración retrocompatible de hash)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Si el usuario llegó con un hash legado (#...), migrarlo a URL limpia
      const legacyPath = migrateLegacyHash(window.location.hash);
      if (legacyPath) {
        window.history.replaceState(null, '', legacyPath);
      }

      // 2. Resolver la pestaña inicial a partir del pathname actual o localStorage
      const { tab: pathTab } = pathToTab(window.location.pathname);
      const savedTab = localStorage.getItem('amex_active_tab');

      let initialTab = 'dashboard';
      if (pathTab && VALID_TABS.includes(pathTab)) {
        initialTab = pathTab;
      } else if (savedTab && VALID_TABS.includes(savedTab)) {
        initialTab = savedTab;
      }

      setActiveTabState(initialTab);

      // Si la URL actual es la raíz '/' o difiere de la ruta de la pestaña activa, sincronizar URL limpia
      const targetPath = tabToPath(initialTab);
      if (window.location.pathname === '/' || window.location.pathname !== targetPath) {
        if (!window.location.pathname.startsWith('/amex-excel/d/')) {
          window.history.replaceState(null, '', targetPath);
        }
      }

      // 3. Escuchar navegación del historial (flechas Atrás / Adelante del navegador)
      const handlePopState = () => {
        const { tab: currentTab } = pathToTab(window.location.pathname);
        if (currentTab && VALID_TABS.includes(currentTab)) {
          setActiveTabState(currentTab);
          try {
            localStorage.setItem('amex_active_tab', currentTab);
          } catch {}
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch (e) {
      console.warn('Error sincronizando pestaña activa:', e);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsSidebarCollapsed(window.innerWidth <= 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    if (!VALID_TABS.includes(tab)) return;
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amex_active_tab', tab);
        const cleanPath = tabToPath(tab);
        if (window.location.pathname !== cleanPath) {
          window.history.pushState(null, '', cleanPath);
        }
      } catch (e) {
        console.warn('Error guardando pestaña activa:', e);
      }
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    }
  }, []);

  const [targetCliente360, setTargetCliente360] = useState<string | undefined>(undefined);
  const [targetClienteCobros, setTargetClienteCobros] = useState<string | undefined>(undefined);

  const handleNavigateToClientes360 = useCallback((clienteNombre?: string) => {
    setTargetCliente360(clienteNombre);
    setActiveTab('directorio-clientes');
  }, [setActiveTab]);

  const handleNavigateToCobros = useCallback((clienteNombre?: string) => {
    setTargetClienteCobros(clienteNombre);
    setActiveTab('fico-cobros');
  }, [setActiveTab]);

  const handleUpdatePackage = useCallback((updated: Paquete) => {
    setPaquetes(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  }, []);

  const handleDeletePackage = useCallback((id: string) => {
    setPaquetes(prev => prev.filter(p => p.id !== id));
  }, []);

  // Estado de usuario activo directo
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: string } | null>({
    nombre: 'Operador Logístico AMEX',
    rol: 'admin'
  });

  const handleLogout = () => {
    setCurrentUser({ nombre: 'Operador Logístico AMEX', rol: 'admin' });
  };

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [entregas, setEntregas] = useState<OrdenEntrega[]>([]);
  const [cobros, setCobros] = useState<CobroVoucher[]>([]);
  const [scannedLogs, setScannedLogs] = useState<ScannedLog[]>([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedThermalPkg, setSelectedThermalPkg] = useState<Paquete | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isNewPkgModalOpen, setIsNewPkgModalOpen] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  const [newClientForm, setNewClientForm] = useState<NewClientFormData>(EMPTY_CLIENT_FORM);
  const [newPkgForm, setNewPkgForm] = useState<NewPkgFormData>(EMPTY_PKG_FORM);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('amex_scanner_staging_queue_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setScannedLogs(parsed);
          }
        }
      } catch (err) {
        console.warn('Error loading staging queue from localStorage:', err);
      }
    }
  }, []);

  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);

  const fetchSupabaseData = useCallback(async () => {
    try {
      setIsGlobalRefreshing(true);
      const [clientesRes, paquetesRes, entregasRes, cobrosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('creado_en', { ascending: false }),
        supabase.from('paquetes').select('*').order('creado_en', { ascending: false }),
        supabase.from('entregas_ordenes').select('*').order('creado_en', { ascending: false }),
        supabase.from('cobros_vouchers').select('*').order('creado_en', { ascending: false })
      ]);

      const dbClientes = clientesRes.data || [];
      setClientes(dbClientes.map(c => ({
        id: c.id,
        codigoCasillero: c.documento_identidad || `CLI-${c.id.slice(0, 6)}`,
        nombre: c.nombre,
        apellido: c.apellido || '',
        documentoIdentidad: c.documento_identidad,
        telefono: c.telefono || '',
        email: c.email || '',
        departamento: c.departamento || 'LIMA',
        provincia: c.provincia || 'LIMA',
        distrito: c.distrito || 'LINCE',
        direccionEntrega: c.direccion_entrega || '',
        creadoEn: c.creado_en || ''
      })));

      const dbPaquetes = paquetesRes.data || [];
      setPaquetes(dbPaquetes.map(p => {
        const pos = p.posicion_estante || (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC');
        const [ana, pis] = pos.includes('-') ? pos.split('-') : [pos, 'P1'];
        return {
          id: p.id,
          codigoCasillero: p.codigo_casillero,
          numeroReciboBodega: p.numero_recibo_bodega,
          trackingUsa: p.tracking_usa,
          tipoEmpaque: p.tipo_empaque || 'CAJA',
          numeroFactura: p.numero_factura || '',
          dniConsignatario: p.dni_consignatario || '',
          nombreConsignatario: p.nombre_consignatario || '',
          descripcion: p.descripcion || '',
          pesoKg: Number(p.peso_kg || 0),
          valorDeclaradoUsd: Number(p.valor_declarado_usd || 0),
          ubicacionActual: (p.ubicacion_actual as TipoUbicacion) || 'AmexLince',
          anaquel: p.anaquel || ana,
          piso: p.piso || pis,
          posicionEstante: pos,
          metodoEntrega: (p.metodo_entrega as TipoMetodoEntrega) || 'CarroAmexDomicilio',
          estadoEntrega: (p.estado_entrega as TipoEstadoEntrega) || 'EnAlmacen',
          facturaPdfUrl: p.factura_pdf_url || '',
          creadoEn: p.creado_en || ''
        };
      }));

      if (entregasRes.data) {
        setEntregas(entregasRes.data as OrdenEntrega[]);
      }
      if (cobrosRes.data) {
        setCobros(cobrosRes.data as CobroVoucher[]);
      }
    } catch (err) {
      console.warn('Supabase initial fetch sync:', err);
    } finally {
      setIsLoadingInitialData(false);
      setTimeout(() => setIsGlobalRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseData();

    // ⚡ CANALES REALTIME WEBSOCKET (Supabase Realtime)
    const realtimeChannel = supabase
      .channel('amex-erp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paquetes' }, payload => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as Record<string, unknown>;
          const pos = (p.posicion_estante as string) || (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC');
          const [ana, pis] = pos.includes('-') ? pos.split('-') : [pos, 'P1'];
          setPaquetes(prev => {
            if (prev.some(x => x.id === p.id || x.numeroReciboBodega === p.numero_recibo_bodega)) return prev;
            return [{
              id: String(p.id),
              codigoCasillero: String(p.codigo_casillero),
              numeroReciboBodega: String(p.numero_recibo_bodega),
              trackingUsa: String(p.tracking_usa || ''),
              tipoEmpaque: String(p.tipo_empaque || 'CAJA'),
              numeroFactura: String(p.numero_factura || ''),
              dniConsignatario: String(p.dni_consignatario || ''),
              nombreConsignatario: String(p.nombre_consignatario || ''),
              descripcion: String(p.descripcion || ''),
              pesoKg: Number(p.peso_kg || 0),
              valorDeclaradoUsd: Number(p.valor_declarado_usd || 0),
              ubicacionActual: (p.ubicacion_actual as TipoUbicacion) || 'AmexLince',
              anaquel: (p.anaquel as string) || ana,
              piso: (p.piso as string) || pis,
              posicionEstante: pos,
              metodoEntrega: (p.metodo_entrega as TipoMetodoEntrega) || 'CarroAmexDomicilio',
              estadoEntrega: (p.estado_entrega as TipoEstadoEntrega) || 'EnAlmacen',
              facturaPdfUrl: String(p.factura_pdf_url || ''),
              creadoEn: String(p.creado_en || '')
            }, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as Record<string, unknown>;
          const pos = (p.posicion_estante as string) || (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC');
          const [ana, pis] = pos.includes('-') ? pos.split('-') : [pos, 'P1'];
          setPaquetes(prev => prev.map(item => item.id === p.id || item.numeroReciboBodega === p.numero_recibo_bodega ? {
            ...item,
            codigoCasillero: String(p.codigo_casillero || item.codigoCasillero),
            numeroReciboBodega: String(p.numero_recibo_bodega || item.numeroReciboBodega),
            trackingUsa: String(p.tracking_usa || item.trackingUsa),
            tipoEmpaque: String(p.tipo_empaque || item.tipoEmpaque),
            descripcion: String(p.descripcion || item.descripcion),
            pesoKg: Number(p.peso_kg !== undefined ? p.peso_kg : item.pesoKg),
            valorDeclaradoUsd: Number(p.valor_declarado_usd !== undefined ? p.valor_declarado_usd : item.valorDeclaradoUsd),
            ubicacionActual: (p.ubicacion_actual as TipoUbicacion) || item.ubicacionActual,
            anaquel: (p.anaquel as string) || ana,
            piso: (p.piso as string) || pis,
            posicionEstante: pos,
            metodoEntrega: (p.metodo_entrega as TipoMetodoEntrega) || item.metodoEntrega,
            estadoEntrega: (p.estado_entrega as TipoEstadoEntrega) || item.estadoEntrega,
            facturaPdfUrl: String(p.factura_pdf_url || item.facturaPdfUrl)
          } : item));
        } else if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old as Record<string, unknown>;
          setPaquetes(prev => prev.filter(item => item.id !== oldRecord.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
        if (payload.eventType === 'INSERT') {
          const c = payload.new as Record<string, unknown>;
          setClientes(prev => {
            if (prev.some(x => x.id === c.id)) return prev;
            return [{
              id: String(c.id),
              codigoCasillero: String(c.documento_identidad || `CLI-${String(c.id).slice(0, 6)}`),
              nombre: String(c.nombre),
              apellido: String(c.apellido || ''),
              documentoIdentidad: String(c.documento_identidad),
              telefono: String(c.telefono || ''),
              email: String(c.email || ''),
              departamento: String(c.departamento || 'LIMA'),
              provincia: String(c.provincia || 'LIMA'),
              distrito: String(c.distrito || 'LINCE'),
              direccionEntrega: String(c.direccion_entrega || ''),
              creadoEn: String(c.creado_en || '')
            }, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const c = payload.new as Record<string, unknown>;
          setClientes(prev => prev.map(item => item.id === c.id ? {
            ...item,
            nombre: String(c.nombre || item.nombre),
            apellido: String(c.apellido || item.apellido || ''),
            documentoIdentidad: String(c.documento_identidad || item.documentoIdentidad),
            telefono: String(c.telefono || item.telefono),
            email: String(c.email || item.email),
            departamento: String(c.departamento || item.departamento),
            provincia: String(c.provincia || item.provincia),
            distrito: String(c.distrito || item.distrito),
            direccionEntrega: String(c.direccion_entrega || item.direccionEntrega)
          } : item));
        } else if (payload.eventType === 'DELETE') {
          const oldRecord = payload.old as Record<string, unknown>;
          setClientes(prev => prev.filter(item => item.id !== oldRecord.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entregas_ordenes' }, async () => {
        const { data } = await supabase.from('entregas_ordenes').select('*').order('creado_en', { ascending: false });
        if (data) setEntregas(data as OrdenEntrega[]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobros_vouchers' }, async () => {
        const { data } = await supabase.from('cobros_vouchers').select('*').order('creado_en', { ascending: false });
        if (data) setCobros(data as CobroVoucher[]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);


  // 📍 Asignación de Ubicación Física a Paquete (Slotting WMS Persistente)
  const handleAssignPackageLocation = useCallback(async (code: string, location: string) => {
    const upper = code.trim().toUpperCase();
    const [ana, pis] = location.includes('-') ? location.split('-') : [location, 'P1'];

    setPaquetes(prev =>
      prev.map(p => {
        if (
          p.numeroReciboBodega.toUpperCase() === upper ||
          p.trackingUsa.toUpperCase() === upper ||
          p.codigoCasillero.toUpperCase() === upper
        ) {
          return {
            ...p,
            anaquel: ana,
            piso: pis,
            posicionEstante: location
          };
        }
        return p;
      })
    );

    try {
      await supabase
        .from('paquetes')
        .update({
          anaquel: ana,
          piso: pis,
          posicion_estante: location
        })
        .or(`numero_recibo_bodega.eq.${upper},tracking_usa.eq.${upper},codigo_casillero.eq.${upper}`);
    } catch (err) {
      console.warn('Error syncing package location to Supabase:', err);
    }
  }, []);

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Cliente = {
      id: `c-${Date.now()}`,
      codigoCasillero: newClientForm.documentoIdentidad || `CLI-${Date.now()}`,
      ...newClientForm,
      creadoEn: new Date().toISOString()
    };
    setClientes([newClient, ...clientes]);
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
    } catch (err) {
      console.error('Error insert cliente:', err);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const pos = newPkgForm.posicionEstante || `${newPkgForm.anaquel || 'A1'}-${newPkgForm.piso || 'P1'}`;
    const [ana, pis] = pos.includes('-') ? pos.split('-') : [pos, 'P1'];

    const newPkg: Paquete = {
      id: `p-${Date.now()}`,
      codigoCasillero: newPkgForm.codigoCasillero,
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
      anaquel: ana,
      piso: pis,
      posicionEstante: pos,
      metodoEntrega: newPkgForm.metodoEntrega as TipoMetodoEntrega,
      estadoEntrega: 'EnAlmacen' as TipoEstadoEntrega,
      facturaPdfUrl: newPkgForm.facturaPdfUrl,
      creadoEn: new Date().toISOString()
    };
    setPaquetes([newPkg, ...paquetes]);
    setIsNewPkgModalOpen(false);

    try {
      await supabase.from('paquetes').insert({
        codigo_casillero: newPkgForm.codigoCasillero,
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
        anaquel: ana,
        piso: pis,
        posicion_estante: pos,
        metodo_entrega: newPkgForm.metodoEntrega,
        factura_pdf_url: newPkgForm.facturaPdfUrl
      });
    } catch (err) {
      console.error('Error insert paquete:', err);
    }
  };

  const openNewClientModal = () => {
    setNewClientForm(EMPTY_CLIENT_FORM);
    setIsNewClientModalOpen(true);
  };

  const openNewPkgModal = () => {
    setNewPkgForm({
      ...EMPTY_PKG_FORM,
      numeroReciboBodega: `WR${Math.floor(100000 + Math.random() * 900000)}`
    });
    setIsNewPkgModalOpen(true);
  };

  const handleScanCode = (
    code: string,
    format: string,
    extra?: {
      mode?: string;
      location?: string;
      anaquel?: string;
      piso?: string;
      pkg?: Paquete;
      cli?: Cliente;
    }
  ) => {
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
      codigoCasillero: extra?.pkg?.codigoCasillero || extra?.cli?.codigoCasillero,
      synced: false
    };

    setScannedLogs(prev => {
      const updated = [newLog, ...prev];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('amex_scanner_staging_queue_v2', JSON.stringify(updated));
        } catch (e) {
          console.warn('localStorage save staging queue error:', e);
        }
      }
      return updated;
    });

    if (extra?.location) {
      handleAssignPackageLocation(code, extra.location);
    }
  };

  return (
    <div className="app-layout-shell">
      <HeaderBar
        currentUser={currentUser}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          isSidebarCollapsed={isSidebarCollapsed}
          onSelectTab={setActiveTab}
          onCloseSidebar={() => setIsSidebarCollapsed(true)}
        />

        <main className={`main-content tab-${activeTab} ${['dni-matrix', 'rotulos-a4', 'boletas-shalom'].includes(activeTab) ? 'dark-tab-mode' : ''} ${activeTab === 'live-sheets' ? 'live-sheets-mode' : ''} ${activeTab === 'dni-matrix' ? 'dni-matrix-mode' : ''} ${activeTab === 'rotulos-a4' ? 'rotulos-mode' : ''} ${activeTab === 'boletas-shalom' ? 'boletas-shalom-mode' : ''} ${activeTab === 'fico-cobros' ? 'cobros-mode' : ''}`}>
          {isLoadingInitialData ? (
            <PageSkeleton activeTab={activeTab} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  paquetes={paquetes}
                  clientes={clientes}
                  entregas={entregas}
                  cobros={cobros}
                  onNavigateTab={setActiveTab}
                  onNewPackage={openNewPkgModal}
                  onPrintLabel={setSelectedThermalPkg}
                  onViewPdf={setSelectedPdfUrl}
                  onRefreshData={fetchSupabaseData}
                />
              )}

              {activeTab === 'live-sheets' && (
                <LiveSheetsTab
                  paquetes={paquetes}
                  clientes={clientes}
                  onViewPdf={setSelectedPdfUrl}
                  currentUser={currentUser}
                />
              )}

              {(activeTab === 'mm-lince' || activeTab === 'mm-inventory') && (
                <InventoryTab
                  paquetes={paquetes}
                  clientes={clientes}
                  onNewPackage={openNewPkgModal}
                  onViewPdf={setSelectedPdfUrl}
                  onUpdatePackage={handleUpdatePackage}
                  onDeletePackage={handleDeletePackage}
                  onRefreshData={fetchSupabaseData}
                />
              )}

              {activeTab === 'fico-cobros' && (
                <CobrosTab
                  paquetes={paquetes}
                  clientes={clientes}
                  onUpdatePackage={handleUpdatePackage}
                  onNavigateToClientes360={handleNavigateToClientes360}
                  filterClienteInicial={targetClienteCobros}
                />
              )}

              {(activeTab === 'directorio-clientes' || activeTab === 'clientes-360') && (
                <DirectorioClientesTab
                  paquetes={paquetes}
                  clientes={clientes}
                  initialClientName={targetCliente360}
                  onNavigateToCobros={handleNavigateToCobros}
                  onOpenNewClientModal={openNewClientModal}
                />
              )}

              {activeTab === 'mobile-scanner' && (
                <ScannerTab
                  scannedLogs={scannedLogs}
                  paquetes={paquetes}
                  clientes={clientes}
                  onConfirm={handleScanCode}
                  onSlotPackage={handleAssignPackageLocation}
                  onUpdateLogs={setScannedLogs}
                  onRefreshData={fetchSupabaseData}
                />
              )}

              {activeTab === 'dni-matrix' && (
                <DniMatrixTab
                  paquetes={paquetes}
                  clientes={clientes}
                  onGlobalRefresh={fetchSupabaseData}
                  isRefreshing={isGlobalRefreshing}
                />
              )}

              {activeTab === 'rotulos-a4' && (
                <RotulosA4Tab clientes={clientes} />
              )}

              {activeTab === 'boletas-shalom' && (
                <BoletasShalomTab />
              )}

              {activeTab === 'formato-entrega' && (
                <FormatoEntregaTab
                  clientes={clientes}
                  paquetes={paquetes}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Barra de Navegación Inferior para Celulares (Mobile Bottom Navigation) */}
      <nav className="mobile-bottom-nav" aria-label="Navegación Móvil de Almacén">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-chart-pie"></i>
          <span>Panel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live-sheets')}
          className={`mobile-nav-btn ${activeTab === 'live-sheets' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-table-list"></i>
          <span>Amex Excel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mm-lince')}
          className={`mobile-nav-btn ${activeTab === 'mm-lince' || activeTab === 'mm-inventory' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>Inventario</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fico-cobros')}
          className={`mobile-nav-btn ${activeTab === 'fico-cobros' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-receipt"></i>
          <span>Cobros</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dni-matrix')}
          className={`mobile-nav-btn ${activeTab === 'dni-matrix' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-id-card"></i>
          <span>DNI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mobile-scanner')}
          className={`mobile-nav-btn ${activeTab === 'mobile-scanner' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-barcode"></i>
          <span>Escáner</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="mobile-nav-btn"
        >
          <i className="fa-solid fa-bars"></i>
          <span>Menú</span>
        </button>
      </nav>

      {/* Backdrop para cerrar el menú lateral en móviles */}
      {!isSidebarCollapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {isNewClientModalOpen && (
        <NewClientModal
          form={newClientForm}
          onChange={setNewClientForm}
          onSave={handleSaveClient}
          onClose={() => setIsNewClientModalOpen(false)}
        />
      )}

      {isNewPkgModalOpen && (
        <NewPackageModal
          form={newPkgForm}
          clientes={clientes}
          onChange={setNewPkgForm}
          onSave={handleSavePackage}
          onClose={() => setIsNewPkgModalOpen(false)}
          isWarehouseMode={activeTab === 'mm-lince' || activeTab === 'mm-inventory'}
        />
      )}

      {selectedThermalPkg && (
        <ThermalLabelModal pkg={selectedThermalPkg} onClose={() => setSelectedThermalPkg(null)} />
      )}

      {selectedPdfUrl && (
        <PdfViewerModal url={selectedPdfUrl} onClose={() => setSelectedPdfUrl(null)} />
      )}
    </div>
  );
}
