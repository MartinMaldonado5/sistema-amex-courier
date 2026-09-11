'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Paquete,
  TipoUbicacion,
  TipoEstadoEntrega,
  EstanteriaPosicion,
  MovimientoKardex,
  AlmacenSede
} from '@/types';
import { supabase } from '@/lib/supabase/client';
import { matchesFuzzySearch } from '@/lib/fuzzySearch';
import { exportPaquetesToExcel, exportKardexToExcel } from '@/lib/excelExport';
import { inventoryService } from '../services/inventory.service';
import { BatchShelfData, SinglePositionData, TransferFormData } from '../types';

export interface UseInventoryDataProps {
  paquetes: Paquete[];
  onUpdatePackage?: (updated: Paquete) => void;
  onDeletePackage?: (id: string) => void;
  onRefreshData?: () => Promise<void> | void;
}

export function useInventoryData({
  paquetes,
  onUpdatePackage,
  onDeletePackage,
  onRefreshData
}: UseInventoryDataProps) {
  // Sub-pestañas: 'existencias' | 'movimientos' | 'matriz' | 'gestor'
  const [activeSubTab, setActiveSubTab] = useState<'existencias' | 'movimientos' | 'matriz' | 'gestor'>('existencias');

  // Filtros de Existencias
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('AmexLince');
  const [shelfFilter, setShelfFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Paginación reactiva
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtros de Kardex
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTypeFilter, setKardexTypeFilter] = useState<string>('ALL');

  // Selección múltiple para acciones en lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Datos de Supabase en Tiempo Real
  const [kardexList, setKardexList] = useState<MovimientoKardex[]>([]);
  const [posicionesList, setPosicionesList] = useState<EstanteriaPosicion[]>([]);
  const [sedesList, setSedesList] = useState<AlmacenSede[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);

  // Modales Pop-Up
  const [isGestorModalOpen, setIsGestorModalOpen] = useState(false);
  const [isMatrizModalOpen, setIsMatrizModalOpen] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewPositionModalOpen, setIsNewPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<EstanteriaPosicion | null>(null);
  const [isBatchStatusModalOpen, setIsBatchStatusModalOpen] = useState(false);
  const [batchTargetStatus, setBatchTargetStatus] = useState<TipoEstadoEntrega>('EnAlmacen');
  const [selectedThermalPkg, setSelectedThermalPkg] = useState<Paquete | null>(null);
  const [selectedPackageForAction, setSelectedPackageForAction] = useState<Paquete | null>(null);

  // Filtros interactivos para la vista de Anaqueles
  const [shelfSearchTerm, setShelfSearchTerm] = useState('');
  const [shelfZoneFilter, setShelfZoneFilter] = useState<string>('ALL');
  const [shelfOccupancyFilter, setShelfOccupancyFilter] = useState<string>('ALL');

  // Modo de creación de anaquel: 'batch' | 'single'
  const [newPositionMode, setNewPositionMode] = useState<'batch' | 'single'>('batch');
  const [batchShelfData, setBatchShelfData] = useState<BatchShelfData>({
    almacenCodigo: 'LIN',
    codigoEstante: '',
    cantidadPisos: 3,
    capacidadPorPiso: 40,
    pesoPorPiso: 150,
    zonaTipo: 'ALMACENAJE',
    descripcion: ''
  });

  // Formulario de Traslado / Reubicación
  const [transferData, setTransferData] = useState<TransferFormData>({
    targetUbicacion: 'AmexLince',
    targetAnaquel: 'A1',
    targetPiso: 'P1',
    motivo: 'Reubicación WMS de Almacén',
    operador: 'Operador Logístico AMEX'
  });

  // Formulario de Edición de Paquete
  const [editFormData, setEditFormData] = useState<Partial<Paquete>>({});

  // Formulario de Nueva Posición Individual
  const [newPositionData, setNewPositionData] = useState<SinglePositionData>({
    almacenCodigo: 'LIN',
    codigoEstante: 'A3',
    nivelPiso: 'P1',
    zonaTipo: 'ALMACENAJE',
    capacidadMaxPaquetes: 40,
    pesoMaxKg: 120,
    descripcion: 'Nuevo anaquel de almacenamiento'
  });

  // Carga de Kardex, Posiciones y Sedes desde Supabase
  const fetchData = useCallback(async () => {
    setIsLoadingKardex(true);
    try {
      const [sedes, posiciones, kardex] = await Promise.all([
        inventoryService.getSedes(),
        inventoryService.getPosiciones(),
        inventoryService.getKardex(200)
      ]);
      setSedesList(sedes);
      setPosicionesList(posiciones);
      setKardexList(kardex);
    } catch (err) {
      console.warn('Error fetching WMS data from Supabase:', err);
    } finally {
      setIsLoadingKardex(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Suscripción Realtime a movimientos_kardex
    const kardexChannel = supabase
      .channel('kardex_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'movimientos_kardex' },
        payload => {
          const newK = payload.new as any;
          setKardexList(prev => [
            {
              id: newK.id,
              paqueteId: newK.paquete_id,
              codigoPaquete: newK.codigo_paquete,
              consignatario: newK.consignatario || '',
              origenDescripcion: newK.origen_descripcion,
              destinoDescripcion: newK.destino_descripcion,
              tipoMovimiento: newK.tipo_movimiento,
              motivo: newK.motivo || '',
              usuarioOperador: newK.usuario_operador || 'Operador AMEX',
              creadoEn: newK.creado_en || new Date().toISOString()
            },
            ...prev
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kardexChannel);
    };
  }, [fetchData]);

  // Filtrado reactivo de paquetes con Motor Fuzzy Inteligente
  const filteredPaquetes = useMemo(() => {
    return paquetes.filter(p => {
      const pos = p.posicionEstante || (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC');

      const matchesSearch = matchesFuzzySearch(searchTerm, [
        p.numeroReciboBodega,
        p.trackingUsa,
        p.codigoCasillero,
        p.nombreConsignatario,
        p.dniConsignatario,
        p.descripcion,
        p.posicionEstante,
        p.anaquel,
        p.piso,
        pos,
        p.numeroFactura,
        p.tipoEmpaque,
        p.estadoEntrega
      ]);

      const matchesLocation = locationFilter === 'ALL' || p.ubicacionActual === locationFilter;

      const matchesShelf =
        shelfFilter === 'ALL'
          ? true
          : shelfFilter === 'REC'
          ? pos.startsWith('REC') || (!p.posicionEstante && !p.anaquel)
          : pos.startsWith(shelfFilter);

      const matchesFloor = floorFilter === 'ALL' ? true : pos.includes(floorFilter) || p.piso === floorFilter;
      const matchesType = packageTypeFilter === 'ALL' || p.tipoEmpaque === packageTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || p.estadoEntrega === statusFilter;

      return matchesSearch && matchesLocation && matchesShelf && matchesFloor && matchesType && matchesStatus;
    });
  }, [paquetes, searchTerm, locationFilter, shelfFilter, floorFilter, packageTypeFilter, statusFilter]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, shelfFilter, floorFilter, packageTypeFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredPaquetes.length / pageSize));
  const paginatedPaquetes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPaquetes.slice(start, start + pageSize);
  }, [filteredPaquetes, currentPage, pageSize]);

  // Filtrado reactivo de Kardex
  const filteredKardex = useMemo(() => {
    return kardexList.filter(k => {
      const matchesSearch = matchesFuzzySearch(kardexSearch, [
        k.codigoPaquete,
        k.consignatario,
        k.origenDescripcion,
        k.destinoDescripcion,
        k.usuarioOperador,
        k.motivo,
        k.tipoMovimiento
      ]);
      const matchesType = kardexTypeFilter === 'ALL' || k.tipoMovimiento === kardexTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [kardexList, kardexSearch, kardexTypeFilter]);

  // Agrupación dinámica de posiciones de estantería por anaquel
  const shelfGroups = useMemo(() => {
    const groups: { [key: string]: EstanteriaPosicion[] } = {};

    const effectivePosiciones =
      posicionesList.length > 0
        ? posicionesList
        : [
            { id: '1', almacenId: 'LIN', codigoEstante: 'A1', nivelPiso: 'P1', codigoPosicion: 'A1-P1', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 150 },
            { id: '2', almacenId: 'LIN', codigoEstante: 'A1', nivelPiso: 'P2', codigoPosicion: 'A1-P2', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 120 },
            { id: '3', almacenId: 'LIN', codigoEstante: 'A1', nivelPiso: 'P3', codigoPosicion: 'A1-P3', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 80 },
            { id: '4', almacenId: 'LIN', codigoEstante: 'A2', nivelPiso: 'P1', codigoPosicion: 'A2-P1', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 150 },
            { id: '5', almacenId: 'LIN', codigoEstante: 'A2', nivelPiso: 'P2', codigoPosicion: 'A2-P2', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 120 },
            { id: '6', almacenId: 'LIN', codigoEstante: 'A2', nivelPiso: 'P3', codigoPosicion: 'A2-P3', zonaTipo: 'ALMACENAJE', capacidadMaxPaquetes: 40, pesoMaxKg: 80 },
            { id: '7', almacenId: 'LIN', codigoEstante: 'REC', nivelPiso: 'P1', codigoPosicion: 'REC', zonaTipo: 'RECEPCION', capacidadMaxPaquetes: 100, pesoMaxKg: 500 },
            { id: '8', almacenId: 'LIN', codigoEstante: 'DSP', nivelPiso: 'P1', codigoPosicion: 'DSP', zonaTipo: 'DESPACHO', capacidadMaxPaquetes: 100, pesoMaxKg: 500 }
          ];

    effectivePosiciones.forEach(pos => {
      if (!groups[pos.codigoEstante]) {
        groups[pos.codigoEstante] = [];
      }
      groups[pos.codigoEstante].push(pos);
    });

    return groups;
  }, [posicionesList]);

  // Selección múltiple
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredPaquetes.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  // Abrir Modal de Traslado
  const openTransferModal = (singlePkg?: Paquete) => {
    if (singlePkg) {
      setSelectedPackageForAction(singlePkg);
      setSelectedIds([singlePkg.id]);
      setTransferData(prev => ({
        ...prev,
        targetUbicacion: singlePkg.ubicacionActual,
        targetAnaquel: singlePkg.anaquel || 'A1',
        targetPiso: singlePkg.piso || 'P1'
      }));
    } else {
      setSelectedPackageForAction(null);
    }
    setIsTransferModalOpen(true);
  };

  // Ejecutar Traslado
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const idsToMove = selectedPackageForAction ? [selectedPackageForAction.id] : selectedIds;
    if (idsToMove.length === 0) return;

    try {
      const { updatedPackages } = await inventoryService.executeTransfer(
        idsToMove,
        transferData,
        paquetes
      );
      if (onUpdatePackage) {
        updatedPackages.forEach(p => onUpdatePackage(p));
      }
    } catch (err) {
      console.warn('Error executing transfer:', err);
    }

    setIsTransferModalOpen(false);
    setSelectedIds([]);
    setSelectedPackageForAction(null);
  };

  // Abrir Modal de Edición de Paquete
  const openEditModal = (pkg: Paquete) => {
    setSelectedPackageForAction(pkg);
    setEditFormData({ ...pkg });
    setIsEditModalOpen(true);
  };

  // Guardar Edición de Paquete
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackageForAction) return;

    const pos =
      editFormData.posicionEstante || `${editFormData.anaquel || 'A1'}-${editFormData.piso || 'P1'}`;
    const [ana, pis] = pos.includes('-') ? pos.split('-') : [pos, 'P1'];

    const updated: Paquete = {
      ...selectedPackageForAction,
      ...editFormData,
      anaquel: ana,
      piso: pis,
      posicionEstante: pos,
      pesoKg: Number(editFormData.pesoKg || 0),
      valorDeclaradoUsd: Number(editFormData.valorDeclaradoUsd || 0)
    };

    if (onUpdatePackage) {
      onUpdatePackage(updated);
    }

    try {
      await inventoryService.updatePackage(updated);
    } catch (err) {
      console.warn('Error updating package in Supabase:', err);
    }

    setIsEditModalOpen(false);
    setSelectedPackageForAction(null);
  };

  // Eliminar paquete individual
  const handleDeletePackage = async (pkgId: string, wrCode: string) => {
    if (!confirm(`¿Estás seguro de eliminar el paquete ${wrCode} de la base de datos de Almacén Lince?`)) return;
    try {
      await inventoryService.deletePackage(pkgId);
      if (onDeletePackage) {
        onDeletePackage(pkgId);
      }
      setSelectedIds(prev => prev.filter(x => x !== pkgId));
    } catch (err) {
      console.error('Error eliminando paquete:', err);
      alert('Error al eliminar paquete.');
    }
  };

  // Cambio rápido de estado individual
  const handleQuickStatusChange = async (pkg: Paquete, newStatus: TipoEstadoEntrega) => {
    try {
      await inventoryService.quickStatusChange(pkg, newStatus);
      const updated: Paquete = { ...pkg, estadoEntrega: newStatus };
      if (onUpdatePackage) onUpdatePackage(updated);
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  // Cambio de estado masivo en lote
  const handleBatchStatusChange = async () => {
    if (selectedIds.length === 0) return;
    try {
      const updatedList = await inventoryService.batchStatusChange(
        selectedIds,
        batchTargetStatus,
        paquetes
      );
      if (onUpdatePackage) {
        updatedList.forEach(p => onUpdatePackage(p));
      }
      setIsBatchStatusModalOpen(false);
      setSelectedIds([]);
    } catch (err) {
      console.error('Error actualizando estado en lote:', err);
    }
  };

  // Eliminación masiva en lote
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`¿Estás seguro de eliminar los ${selectedIds.length} paquetes seleccionados de la base de datos?`)) return;
    try {
      await inventoryService.batchDelete(selectedIds);
      if (onDeletePackage) {
        selectedIds.forEach(id => onDeletePackage(id));
      }
      setSelectedIds([]);
    } catch (err) {
      console.error('Error eliminando en lote:', err);
    }
  };

  // Guardar Nueva Posición Individual
  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await inventoryService.createPosition(newPositionData, sedesList);
      if (created) {
        setPosicionesList(prev => [...prev, created]);
        setIsNewPositionModalOpen(false);
      }
    } catch (err) {
      console.warn('Error creating shelf position:', err);
    }
  };

  // Crear Anaquel Completo en Lote
  const handleCreateBatchShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoEstanteClean = batchShelfData.codigoEstante.trim().toUpperCase();
    if (!codigoEstanteClean) {
      alert('Por favor ingresa un código para el anaquel (ej: A3, B1).');
      return;
    }

    try {
      const created = await inventoryService.createBatchShelf(batchShelfData, sedesList);
      if (created.length > 0) {
        setPosicionesList(prev => [...prev, ...created]);
        setIsNewPositionModalOpen(false);
        setBatchShelfData({
          almacenCodigo: 'LIN',
          codigoEstante: '',
          cantidadPisos: 3,
          capacidadPorPiso: 40,
          pesoPorPiso: 150,
          zonaTipo: 'ALMACENAJE',
          descripcion: ''
        });
      }
    } catch (err) {
      console.error('Error creating batch shelf:', err);
    }
  };

  // Guardar Edición de Posición / Capacidad
  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;
    try {
      await inventoryService.updatePosition(editingPosition.id, {
        zonaTipo: editingPosition.zonaTipo,
        capacidadMaxPaquetes: editingPosition.capacidadMaxPaquetes,
        pesoMaxKg: editingPosition.pesoMaxKg,
        descripcion: editingPosition.descripcion || ''
      });
      setPosicionesList(prev =>
        prev.map(p => (p.id === editingPosition.id ? editingPosition : p))
      );
      setEditingPosition(null);
    } catch (err) {
      console.error('Error updating shelf position:', err);
    }
  };

  // Eliminar Posición de Estantería
  const handleDeletePosition = async (posId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta posición de estantería?')) return;
    try {
      await inventoryService.deletePosition(posId);
      setPosicionesList(prev => prev.filter(p => p.id !== posId));
    } catch (err) {
      console.warn('Error deleting shelf position:', err);
    }
  };

  // Exportar Existencias a Excel
  const handleExportExcel = () => {
    exportPaquetesToExcel(filteredPaquetes, 'Inventario_AMEX_Lince');
  };

  // Exportar Kardex a Excel
  const handleExportKardexExcel = () => {
    exportKardexToExcel(filteredKardex, 'Kardex_Movimientos_AMEX');
  };

  return {
    // Sub-pestañas
    activeSubTab,
    setActiveSubTab,

    // Filtros & Búsqueda
    searchTerm,
    setSearchTerm,
    locationFilter,
    setLocationFilter,
    shelfFilter,
    setShelfFilter,
    floorFilter,
    setFloorFilter,
    packageTypeFilter,
    setPackageTypeFilter,
    statusFilter,
    setStatusFilter,

    // Paginación
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    filteredPaquetes,
    paginatedPaquetes,

    // Kardex
    kardexList,
    filteredKardex,
    kardexSearch,
    setKardexSearch,
    kardexTypeFilter,
    setKardexTypeFilter,
    isLoadingKardex,
    fetchData,

    // Estanterías & Posiciones
    posicionesList,
    sedesList,
    shelfGroups,

    // Filtros Mapa Anaqueles
    shelfSearchTerm,
    setShelfSearchTerm,
    shelfZoneFilter,
    setShelfZoneFilter,
    shelfOccupancyFilter,
    setShelfOccupancyFilter,

    // Selección múltiple
    selectedIds,
    setSelectedIds,
    handleSelectAll,
    handleToggleSelect,

    // Modales & Formularios
    isTransferModalOpen,
    setIsTransferModalOpen,
    openTransferModal,
    transferData,
    setTransferData,
    handleExecuteTransfer,

    isEditModalOpen,
    setIsEditModalOpen,
    openEditModal,
    editFormData,
    setEditFormData,
    handleSaveEdit,

    isBatchStatusModalOpen,
    setIsBatchStatusModalOpen,
    batchTargetStatus,
    setBatchTargetStatus,
    handleBatchStatusChange,
    handleBatchDelete,

    isNewPositionModalOpen,
    setIsNewPositionModalOpen,
    newPositionMode,
    setNewPositionMode,
    batchShelfData,
    setBatchShelfData,
    newPositionData,
    setNewPositionData,
    handleCreatePosition,
    handleCreateBatchShelf,

    editingPosition,
    setEditingPosition,
    handleUpdatePosition,
    handleDeletePosition,

    isGestorModalOpen,
    setIsGestorModalOpen,
    isMatrizModalOpen,
    setIsMatrizModalOpen,
    isKardexModalOpen,
    setIsKardexModalOpen,

    selectedThermalPkg,
    setSelectedThermalPkg,
    selectedPackageForAction,

    // Acciones de paquetes
    handleDeletePackage,
    handleQuickStatusChange,
    handleExportExcel,
    handleExportKardexExcel
  };
}
