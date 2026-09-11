'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Package,
  Search,
  UploadCloud,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Eye,
  AlertCircle,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { BoletaShalom, ModalidadPagoShalom } from '@/types';
import { getR2ViewUrl } from '@/lib/r2/client';
import { ShalomTableSkeleton } from '@/components/ui/Skeleton';
import './boletas-shalom.css';

interface StatsState {
  totalHoy: number;
  totalMes: number;
  montoTotalMes: number;
  destinosPopulares: { nombre: string; cantidad: number }[];
}

interface FormFields {
  nro_orden: string;
  codigo: string;
  fecha_emision: string;
  hora_emision: string;
  fecha_traslado: string;
  origen: string;
  destino: string;
  remitente_nombre: string;
  remitente_dni: string;
  remitente_telefono: string;
  destinatario_nombre: string;
  destinatario_dni: string;
  destinatario_telefono: string;
  tipo_entrega: string;
  forma_pago: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  peso: number;
  observaciones: string;
  monto_total: number;
  moneda: string;
  // retrocompatibilidad
  numero_guia?: string;
  codigo_seguimiento?: string;
  remitente_documento?: string;
  destinatario_documento?: string;
  agencia_destino?: string;
  modalidad_pago?: ModalidadPagoShalom;
  contenido_bultos?: string;
  peso_total?: number;
}

const DEFAULT_FORM: FormFields = {
  nro_orden: '',
  codigo: '',
  fecha_emision: new Date().toISOString().split('T')[0],
  hora_emision: '',
  fecha_traslado: new Date().toISOString().split('T')[0],
  origen: 'AV. CORONEL JOSÉ LEAL 648, URB. FUNDO LOBATÓN, LINCE - LIMA',
  destino: '',
  remitente_nombre: 'QUINTANA CORNEJO BLANCA ESTHER',
  remitente_dni: '06779177',
  remitente_telefono: '982400043',
  destinatario_nombre: '',
  destinatario_dni: '',
  destinatario_telefono: '',
  tipo_entrega: 'ENTREGAR EN AGENCIA',
  forma_pago: 'Pendiente de Pago',
  descripcion: 'BULTO',
  cantidad: 1,
  unidad_medida: 'Volumen',
  peso: 0,
  observaciones: '',
  monto_total: 0,
  moneda: 'PEN',
  numero_guia: '',
  codigo_seguimiento: '',
  agencia_destino: 'ENTREGAR EN AGENCIA',
  modalidad_pago: 'PAGO_DESTINO',
  contenido_bultos: 'BULTO',
  peso_total: 0
};

export default function BoletasShalomTab() {
  // Lista y selección
  const [boletas, setBoletas] = useState<BoletaShalom[]>([]);
  const [selectedBoleta, setSelectedBoleta] = useState<BoletaShalom | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estadísticas rápidas
  const [stats, setStats] = useState<StatsState>({
    totalHoy: 0,
    totalMes: 0,
    montoTotalMes: 0,
    destinosPopulares: []
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [destinoFilter, setDestinoFilter] = useState('');
  const [modalidadFilter, setModalidadFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modales
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStage, setUploadStage] = useState<'DROPZONE' | 'ANALYZING' | 'REVIEW'>('DROPZONE');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [filePreviewBlobUrl, setFilePreviewBlobUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormFields>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  // Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBoleta, setEditingBoleta] = useState<BoletaShalom | null>(null);
  const [editFormData, setEditFormData] = useState<FormFields>(DEFAULT_FORM);

  // Modal Eliminación personalizada (sin window.confirm nativo)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingBoleta, setDeletingBoleta] = useState<BoletaShalom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce para búsqueda por texto y destino para evitar saturación de peticiones
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedDestinoFilter, setDebouncedDestinoFilter] = useState(destinoFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDestinoFilter(destinoFilter);
    }, 280);
    return () => clearTimeout(timer);
  }, [destinoFilter]);

  // Cargar boletas desde el backend con soporte de cancelación y tolerancia a fallos
  const fetchBoletas = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchQuery.trim()) params.set('q', debouncedSearchQuery.trim());
      if (yearFilter) params.set('year', yearFilter);
      if (monthFilter) params.set('month', monthFilter);
      if (dayFilter) params.set('day', dayFilter);
      if (debouncedDestinoFilter.trim()) params.set('destino', debouncedDestinoFilter.trim());
      if (modalidadFilter) params.set('modalidad', modalidadFilter);
      params.set('page', String(page));
      params.set('limit', '50');

      // Validar estrictamente que sea una instancia de AbortSignal para evitar pasar MouseEvent de onClick
      const activeSignal = signal instanceof AbortSignal ? signal : abortControllerRef.current?.signal;

      const res = await fetch(`/api/shalom-boletas?${params.toString()}`, {
        signal: activeSignal
      });

      if (!res.ok) {
        throw new Error(`Servidor devolvió código HTTP ${res.status}`);
      }

      const json = await res.json();

      if (json.boletas) {
        setBoletas(json.boletas);
        setTotalCount(json.total || 0);
        setTotalPages(json.totalPages || 1);
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err: unknown) {
      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted')))
      ) {
        // Cancelación intencional de petición previa
        return;
      }
      console.warn('[BoletasShalomTab] Conexión temporal:', err);
      setFetchError(
        err instanceof Error && err.message.includes('Failed to fetch')
          ? 'No se pudo contactar al servidor local. Reintentando...'
          : err instanceof Error
          ? err.message
          : 'Error al consultar boletas de Shalom'
      );
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, yearFilter, monthFilter, dayFilter, debouncedDestinoFilter, modalidadFilter, page]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    fetchBoletas(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchBoletas]);

  // Copiar al portapapeles con feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Manejar selección de archivo PDF (Apertura INMEDIATA sin intermediación obligatoria de IA)
  const handleFileSelected = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Por favor selecciona un archivo en formato PDF de la boleta escaneada.');
      return;
    }

    setUploadError(null);
    setAiSuccessMsg(null);
    setIsExtractingAi(false);
    setCurrentFile(file);
    const blobUrl = URL.createObjectURL(file);
    setFilePreviewBlobUrl(blobUrl);

    // Abrir de inmediato la pantalla dividida (previsualización + formulario listo)
    setFormData({
      ...DEFAULT_FORM,
      fecha_emision: new Date().toISOString().split('T')[0]
    });
    setUploadStage('REVIEW');
  };

  // Extracción Opcional con IA a demanda del usuario mediante botón
  const handleExtractWithAi = async () => {
    if (!currentFile) return;

    setIsExtractingAi(true);
    setUploadError(null);
    setAiSuccessMsg(null);

    try {
      // Convertir archivo a Base64
      const arrayBuffer = await currentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      const res = await fetch('/api/ai/analyze-shalom-boleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo extraer la información con IA.');
      }

      const extracted = json.data;
      setFormData((prev) => ({
        ...prev,
        nro_orden: extracted.nro_orden || prev.nro_orden,
        codigo: extracted.codigo || prev.codigo,
        fecha_emision: extracted.fecha_emision || prev.fecha_emision,
        hora_emision: extracted.hora_emision || prev.hora_emision,
        fecha_traslado: extracted.fecha_traslado || prev.fecha_traslado,
        origen: extracted.origen || prev.origen,
        destino: extracted.destino || prev.destino,
        remitente_nombre: extracted.remitente_nombre || prev.remitente_nombre,
        remitente_dni: extracted.remitente_dni || prev.remitente_dni,
        remitente_telefono: extracted.remitente_telefono || prev.remitente_telefono,
        destinatario_nombre: extracted.destinatario_nombre || prev.destinatario_nombre,
        destinatario_dni: extracted.destinatario_dni || prev.destinatario_dni,
        destinatario_telefono: extracted.destinatario_telefono || prev.destinatario_telefono,
        tipo_entrega: extracted.tipo_entrega || prev.tipo_entrega,
        forma_pago: extracted.forma_pago || prev.forma_pago,
        descripcion: extracted.descripcion || prev.descripcion,
        cantidad: extracted.cantidad || prev.cantidad,
        unidad_medida: extracted.unidad_medida || prev.unidad_medida,
        peso: extracted.peso !== undefined ? extracted.peso : prev.peso,
        observaciones: extracted.observaciones || prev.observaciones,
        monto_total: Number(extracted.monto_total) || prev.monto_total,
        moneda: extracted.moneda || prev.moneda,
        numero_guia: extracted.nro_orden || extracted.codigo || prev.numero_guia,
        codigo_seguimiento: extracted.codigo || prev.codigo_seguimiento,
        agencia_destino: extracted.tipo_entrega || prev.agencia_destino,
        modalidad_pago: extracted.modalidad_pago || prev.modalidad_pago,
        contenido_bultos: extracted.descripcion || prev.contenido_bultos,
        peso_total: extracted.peso !== undefined ? extracted.peso : prev.peso_total
      }));

      setAiSuccessMsg('¡Datos extraídos con éxito por AMEXito AI!');
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.warn('Error al procesar con IA:', err);
      setUploadError(
        err instanceof Error ? err.message : 'No se pudo extraer la información con IA.'
      );
    } finally {
      setIsExtractingAi(false);
    }
  };

  // Guardar boleta
  const handleSaveBoleta = async (andLoadNext: boolean = false) => {
    const ordenOrCodigo = formData.nro_orden.trim() || formData.codigo.trim() || formData.numero_guia?.trim();
    if (!ordenOrCodigo || !formData.destinatario_nombre.trim() || !formData.destino.trim()) {
      setUploadError('Por favor completa el Nro. de Orden o Código, Destinatario y Ciudad Destino.');
      return;
    }

    if (!currentFile) {
      setUploadError('Falta el archivo PDF de la boleta.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      const formPayload = new FormData();
      formPayload.append('file', currentFile);
      formPayload.append('nro_orden', formData.nro_orden.trim().toUpperCase());
      formPayload.append('codigo', formData.codigo.trim().toUpperCase());
      formPayload.append('numero_guia', ordenOrCodigo.toUpperCase());
      formPayload.append('codigo_seguimiento', formData.codigo.trim().toUpperCase());
      formPayload.append('fecha_emision', formData.fecha_emision);
      formPayload.append('hora_emision', formData.hora_emision.trim());
      formPayload.append('fecha_traslado', formData.fecha_traslado);
      formPayload.append('remitente_nombre', formData.remitente_nombre.trim().toUpperCase());
      formPayload.append('remitente_dni', formData.remitente_dni.trim());
      formPayload.append('remitente_telefono', formData.remitente_telefono.trim());
      formPayload.append('destinatario_nombre', formData.destinatario_nombre.trim().toUpperCase());
      formPayload.append('destinatario_dni', formData.destinatario_dni.trim());
      formPayload.append('destinatario_telefono', formData.destinatario_telefono.trim());
      formPayload.append('origen', formData.origen.trim().toUpperCase());
      formPayload.append('destino', formData.destino.trim().toUpperCase());
      formPayload.append('tipo_entrega', formData.tipo_entrega.trim().toUpperCase());
      formPayload.append('agencia_destino', formData.tipo_entrega.trim().toUpperCase());
      formPayload.append('forma_pago', formData.forma_pago.trim());
      formPayload.append('modalidad_pago', formData.forma_pago.toUpperCase().includes('PENDIENTE') ? 'PAGO_DESTINO' : formData.forma_pago.toUpperCase());
      formPayload.append('descripcion', formData.descripcion.trim().toUpperCase());
      formPayload.append('cantidad', String(formData.cantidad));
      formPayload.append('unidad_medida', formData.unidad_medida.trim());
      formPayload.append('peso', String(formData.peso));
      formPayload.append('observaciones', formData.observaciones.trim());
      formPayload.append('monto_total', String(formData.monto_total));
      formPayload.append('moneda', formData.moneda);

      const res = await fetch('/api/shalom-boletas', {
        method: 'POST',
        body: formPayload
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al guardar la boleta en la base de datos.');
      }

      // Si se guardó exitosamente, refrescar lista
      fetchBoletas();

      if (andLoadNext) {
        // Limpiar para la siguiente boleta del escáner
        if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
        setCurrentFile(null);
        setFilePreviewBlobUrl(null);
        setFormData(DEFAULT_FORM);
        setUploadStage('DROPZONE');
        setUploadError(null);
        setAiSuccessMsg(null);
        setIsExtractingAi(false);
      } else {
        // Cerrar modal
        closeUploadModal();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la boleta.';
      setUploadError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const closeUploadModal = () => {
    if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
    setIsUploadModalOpen(false);
    setUploadStage('DROPZONE');
    setCurrentFile(null);
    setFilePreviewBlobUrl(null);
    setFormData(DEFAULT_FORM);
    setUploadError(null);
    setAiSuccessMsg(null);
    setIsExtractingAi(false);
  };

  // Abrir modal de edición
  const handleOpenEdit = (boleta: BoletaShalom, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoleta(boleta);
    setEditFormData({
      nro_orden: boleta.nro_orden || boleta.numero_guia || '',
      codigo: boleta.codigo || boleta.codigo_seguimiento || '',
      fecha_emision: boleta.fecha_emision,
      hora_emision: boleta.hora_emision || '',
      fecha_traslado: boleta.fecha_traslado || boleta.fecha_emision,
      remitente_nombre: boleta.remitente_nombre || 'QUINTANA CORNEJO BLANCA ESTHER',
      remitente_dni: boleta.remitente_dni || boleta.remitente_documento || '',
      remitente_telefono: boleta.remitente_telefono || '',
      destinatario_nombre: boleta.destinatario_nombre,
      destinatario_dni: boleta.destinatario_dni || boleta.destinatario_documento || '',
      destinatario_telefono: boleta.destinatario_telefono || '',
      origen: boleta.origen,
      destino: boleta.destino,
      tipo_entrega: boleta.tipo_entrega || boleta.agencia_destino || 'ENTREGAR EN AGENCIA',
      forma_pago: boleta.forma_pago || (boleta.modalidad_pago === 'PAGO_DESTINO' ? 'Pendiente de Pago' : boleta.modalidad_pago),
      descripcion: boleta.descripcion || boleta.contenido_bultos || 'BULTO',
      cantidad: boleta.cantidad || 1,
      unidad_medida: boleta.unidad_medida || 'Volumen',
      peso: boleta.peso !== undefined ? boleta.peso : (boleta.peso_total || 0),
      observaciones: boleta.observaciones || '',
      monto_total: boleta.monto_total,
      moneda: boleta.moneda || 'PEN',
      numero_guia: boleta.numero_guia,
      codigo_seguimiento: boleta.codigo_seguimiento,
      agencia_destino: boleta.agencia_destino,
      modalidad_pago: boleta.modalidad_pago,
      contenido_bultos: boleta.contenido_bultos,
      peso_total: boleta.peso_total
    });
    setIsEditModalOpen(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!editingBoleta) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/shalom-boletas/${editingBoleta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al actualizar boleta.');
      }

      setIsEditModalOpen(false);
      setEditingBoleta(null);
      fetchBoletas();
      if (selectedBoleta && selectedBoleta.id === editingBoleta.id) {
        setSelectedBoleta(json.data);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar boleta');
    } finally {
      setIsSaving(false);
    }
  };

  // Abrir modal de eliminación
  const handleOpenDelete = (boleta: BoletaShalom, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBoleta(boleta);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingBoleta) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/shalom-boletas/${deletingBoleta.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al eliminar boleta');
      }

      setIsDeleteModalOpen(false);
      setDeletingBoleta(null);
      if (selectedBoleta && selectedBoleta.id === deletingBoleta.id) {
        setSelectedBoleta(null);
      }
      fetchBoletas();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar boleta');
    } finally {
      setIsDeleting(false);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setYearFilter(String(new Date().getFullYear()));
    setMonthFilter('');
    setDayFilter('');
    setDestinoFilter('');
    setModalidadFilter('');
    setPage(1);
  };

  // Opciones de Años
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  return (
    <div className="boletas-shalom-theme">
      {/* Encabezado Principal */}
      <header className="shalom-header">
        <div className="shalom-header-left">
          <div className="shalom-title-row">
            <span className="shalom-badge">Módulo 10</span>
            <h1 className="shalom-title">
              <Package className="text-sky-400" size={24} /> Boletas de Shalom
            </h1>
          </div>
          <p className="shalom-subtitle">
            Archivo digital inteligente y buscador instantáneo de encomiendas escaneadas & AMEXito AI
          </p>
        </div>

        <div className="shalom-header-actions">
          <button
            type="button"
            className="shalom-btn-secondary"
            onClick={() => fetchBoletas()}
            title="Recargar datos"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>

          <button
            type="button"
            className="shalom-btn-primary"
            onClick={() => {
              setIsUploadModalOpen(true);
              setUploadStage('DROPZONE');
            }}
          >
            <UploadCloud size={17} />
            + Cargar Nueva Boleta
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="shalom-kpi-grid">
        <div className="shalom-kpi-card">
          <div className="shalom-kpi-icon blue">
            <Package size={22} />
          </div>
          <div className="shalom-kpi-content">
            <span className="shalom-kpi-label">Boletas Hoy</span>
            <span className="shalom-kpi-value">{stats.totalHoy}</span>
            <span className="shalom-kpi-sub">Registradas hoy</span>
          </div>
        </div>

        <div className="shalom-kpi-card">
          <div className="shalom-kpi-icon emerald">
            <Calendar size={22} />
          </div>
          <div className="shalom-kpi-content">
            <span className="shalom-kpi-label">Boletas Este Mes</span>
            <span className="shalom-kpi-value">{stats.totalMes}</span>
            <span className="shalom-kpi-sub">Total acumulado mensual</span>
          </div>
        </div>

        <div className="shalom-kpi-card">
          <div className="shalom-kpi-icon amber">
            <DollarSign size={22} />
          </div>
          <div className="shalom-kpi-content">
            <span className="shalom-kpi-label">Flete Total Mes</span>
            <span className="shalom-kpi-value">S/ {stats.montoTotalMes.toFixed(2)}</span>
            <span className="shalom-kpi-sub">Importe total en soles</span>
          </div>
        </div>

        <div className="shalom-kpi-card">
          <div className="shalom-kpi-icon purple">
            <MapPin size={22} />
          </div>
          <div className="shalom-kpi-content">
            <span className="shalom-kpi-label">Top Destino</span>
            <span className="shalom-kpi-value">
              {stats.destinosPopulares.length > 0 ? stats.destinosPopulares[0].nombre : '—'}
            </span>
            <span className="shalom-kpi-sub">
              {stats.destinosPopulares.length > 0 ? `${stats.destinosPopulares[0].cantidad} envíos` : 'Sin envíos aún'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="shalom-filter-bar">
        <div className="shalom-search-row">
          <div className="shalom-search-input-wrap">
            <Search size={17} className="shalom-search-icon" />
            <input
              type="text"
              className="shalom-search-input"
              placeholder="¿Qué buscas? N° Orden, Código, Destinatario, DNI, Teléfono, Destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="shalom-search-clear"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="shalom-filters-row">
          <div className="shalom-filter-group">
            <span className="shalom-filter-label">Año:</span>
            <select
              className="shalom-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="">Todos los años</option>
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="shalom-filter-group">
            <span className="shalom-filter-label">Mes:</span>
            <select
              className="shalom-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">Todos los meses</option>
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </div>

          <div className="shalom-filter-group">
            <span className="shalom-filter-label">Día:</span>
            <select
              className="shalom-select"
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
            >
              <option value="">Todos los días</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="shalom-filter-group">
            <span className="shalom-filter-label">Destino:</span>
            <input
              type="text"
              className="shalom-select"
              placeholder="Ej: TRUJILLO..."
              style={{ width: '130px' }}
              value={destinoFilter}
              onChange={(e) => setDestinoFilter(e.target.value.toUpperCase())}
            />
          </div>

          <div className="shalom-filter-group">
            <span className="shalom-filter-label">Modalidad:</span>
            <select
              className="shalom-select"
              value={modalidadFilter}
              onChange={(e) => setModalidadFilter(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="PAGO_DESTINO">Pago en Destino</option>
              <option value="PAGADO">Pagado (Contado)</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>

          <button
            type="button"
            className="shalom-btn-clear-filters"
            onClick={handleClearFilters}
          >
            <Filter size={13} />
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className={`shalom-main-layout ${selectedBoleta ? 'with-viewer' : ''}`}>
        {/* Tabla de Resultados */}
        <div className="shalom-table-card">
          <div className="shalom-table-header-info">
            <span className="shalom-table-count">
              Mostrando <strong>{boletas.length}</strong> de <strong>{totalCount}</strong> boletas
            </span>
            {selectedBoleta && (
              <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <Eye size={13} /> Boleta seleccionada en el visor
              </span>
            )}
          </div>

          {isLoading ? (
            <ShalomTableSkeleton rows={6} />
          ) : fetchError ? (
            <div className="shalom-empty-state">
              <div className="shalom-empty-icon" style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.12)' }}>
                <AlertCircle size={28} />
              </div>
              <h3 className="shalom-empty-title">Estado de Conexión</h3>
              <p className="shalom-empty-desc">{fetchError}</p>
              <button
                type="button"
                className="shalom-btn-primary"
                onClick={() => fetchBoletas()}
                style={{ marginTop: '8px' }}
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          ) : boletas.length === 0 ? (
            <div className="shalom-empty-state">
              <div className="shalom-empty-icon">
                <FileText size={28} />
              </div>
              <h3 className="shalom-empty-title">No se encontraron boletas</h3>
              <p className="shalom-empty-desc">
                No hay comprobantes que coincidan con los filtros aplicados. Carga los primeros escaneos con el botón superior.
              </p>
            </div>
          ) : (
            <div className="shalom-table-wrap">
              <table className="shalom-table">
                <thead>
                  <tr>
                    <th>N° Orden / Código</th>
                    <th>Destinatario</th>
                    <th>Destino / Entrega</th>
                    <th>Fechas (Emisión / Traslado)</th>
                    <th>Detalle Envío</th>
                    <th>Forma de Pago</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {boletas.map((b) => {
                    const isSelected = selectedBoleta?.id === b.id;
                    const modClass =
                      b.modalidad_pago === 'PAGADO' || (b.forma_pago && b.forma_pago.toLowerCase().includes('pagad'))
                        ? 'pagado'
                        : b.modalidad_pago === 'CREDITO' || (b.forma_pago && b.forma_pago.toLowerCase().includes('credit'))
                        ? 'credito'
                        : 'pago-destino';

                    const nroOrden = b.nro_orden || b.numero_guia || '—';
                    const codigoSeg = b.codigo || b.codigo_seguimiento || '';
                    const destDni = b.destinatario_dni || b.destinatario_documento || '';
                    const destTel = b.destinatario_telefono || '';
                    const detalleDesc = b.descripcion || b.contenido_bultos || 'BULTO';
                    const detalleCant = b.cantidad || 1;
                    const detallePeso = b.peso !== undefined && b.peso !== null ? b.peso : (b.peso_total || 0);
                    const detalleUm = b.unidad_medida || 'Volumen';
                    const entrega = b.tipo_entrega || b.agencia_destino || 'ENTREGAR EN AGENCIA';
                    const formaPagoTexto = b.forma_pago || (b.modalidad_pago === 'PAGO_DESTINO' ? 'Pendiente de Pago' : b.modalidad_pago || 'Pendiente');

                    return (
                      <tr
                        key={b.id}
                        className={`shalom-table-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedBoleta(b)}
                      >
                        <td>
                          <div className="shalom-cell-guia">
                            <span className="shalom-guia-code">
                              {nroOrden}
                              <button
                                type="button"
                                className="text-slate-500 hover:text-sky-400 p-0.5"
                                title="Copiar N° Orden"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(nroOrden, `g-${b.id}`);
                                }}
                              >
                                {copiedId === `g-${b.id}` ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </span>
                            {codigoSeg && (
                              <span className="shalom-tracking-code">
                                Cód: {codigoSeg}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="shalom-cell-cliente">
                            <span className="shalom-destinatario-name">
                              {b.destinatario_nombre}
                            </span>
                            <div className="shalom-destinatario-meta">
                              {destDni && <span>DNI: {destDni}</span>}
                              {destTel && <span>📞 {destTel}</span>}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="shalom-cell-destino">
                            <span className="shalom-destino-badge">
                              <MapPin size={13} className="text-sky-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={b.destino}>{b.destino}</span>
                            </span>
                            <span className="shalom-agencia-name text-xs text-slate-400">{entrega}</span>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col text-xs text-slate-300">
                            <span className="font-semibold">Emisión: {b.fecha_emision}</span>
                            {b.hora_emision && (
                              <span className="text-slate-500 text-[11px]">Hora: {b.hora_emision}</span>
                            )}
                            {b.fecha_traslado && (
                              <span className="text-sky-400 text-[11px] font-medium">Traslado: {b.fecha_traslado}</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-slate-200">
                              {detalleCant}x {detalleDesc}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {detallePeso} {detalleUm}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={`shalom-modalidad-badge ${modClass}`}>
                            {formaPagoTexto}
                          </span>
                        </td>

                        <td>
                          <span className="shalom-monto-text text-emerald-400 font-mono font-bold">
                            S/ {(Number(b.monto_total) || 0).toFixed(2)}
                          </span>
                        </td>

                        <td>
                          <div className="shalom-actions-cell" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="shalom-btn-icon"
                              title="Ver en Visor Integrado"
                              onClick={() => setSelectedBoleta(b)}
                            >
                              <Eye size={15} />
                            </button>

                            <button
                              type="button"
                              className="shalom-btn-icon"
                              title="Editar datos"
                              onClick={(e) => handleOpenEdit(b, e)}
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              className="shalom-btn-icon danger"
                              title="Eliminar boleta"
                              onClick={(e) => handleOpenDelete(b, e)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visor de PDF Integrado In-App */}
        {selectedBoleta && (
          <aside className="shalom-viewer-panel">
            <div className="shalom-viewer-header">
              <div className="shalom-viewer-title-group">
                <span className="shalom-viewer-title">
                  <FileText size={16} className="text-sky-400" />
                  Guía {selectedBoleta.numero_guia}
                </span>
                <span className="shalom-viewer-sub">
                  {selectedBoleta.destinatario_nombre} • {selectedBoleta.destino}
                </span>
              </div>

              <div className="shalom-viewer-tools">
                <a
                  href={getR2ViewUrl(selectedBoleta.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shalom-btn-icon"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink size={14} />
                </a>

                <button
                  type="button"
                  className="shalom-btn-icon"
                  title="Copiar enlace del PDF"
                  onClick={() => handleCopy(getR2ViewUrl(selectedBoleta.pdf_url), 'viewer-url')}
                >
                  {copiedId === 'viewer-url' ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>

                <button
                  type="button"
                  className="shalom-btn-icon"
                  title="Cerrar visor"
                  onClick={() => setSelectedBoleta(null)}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="shalom-viewer-iframe-wrap">
              <iframe
                src={getR2ViewUrl(selectedBoleta.pdf_url)}
                className="shalom-viewer-iframe"
                title={`Boleta ${selectedBoleta.numero_guia}`}
              />
            </div>

            {/* Metadatos extraídos de la Boleta / Ticket */}
            <div className="shalom-viewer-metadata">
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">N° Orden / Cód:</span>
                <span className="shalom-meta-val font-mono text-sky-400">
                  {selectedBoleta.nro_orden || selectedBoleta.numero_guia}
                  {(selectedBoleta.codigo || selectedBoleta.codigo_seguimiento) && (
                    <span className="text-slate-400 ml-1">
                      (Cód: {selectedBoleta.codigo || selectedBoleta.codigo_seguimiento})
                    </span>
                  )}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Fechas:</span>
                <span className="shalom-meta-val">
                  Emisión: {selectedBoleta.fecha_emision} {selectedBoleta.hora_emision || ''}
                  {selectedBoleta.fecha_traslado && (
                    <span className="text-sky-300 ml-1">| Traslado: {selectedBoleta.fecha_traslado}</span>
                  )}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Remitente:</span>
                <span className="shalom-meta-val">
                  {selectedBoleta.remitente_nombre || 'QUINTANA CORNEJO BLANCA ESTHER'}
                  {(selectedBoleta.remitente_dni || selectedBoleta.remitente_documento) && (
                    <span className="text-slate-400 ml-1">
                      (DNI: {selectedBoleta.remitente_dni || selectedBoleta.remitente_documento}
                      {selectedBoleta.remitente_telefono ? ` | Tel: ${selectedBoleta.remitente_telefono}` : ''})
                    </span>
                  )}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Destinatario:</span>
                <span className="shalom-meta-val">
                  {selectedBoleta.destinatario_nombre}
                  {(selectedBoleta.destinatario_dni || selectedBoleta.destinatario_documento) && (
                    <span className="text-slate-400 ml-1">
                      (DNI: {selectedBoleta.destinatario_dni || selectedBoleta.destinatario_documento}
                      {selectedBoleta.destinatario_telefono ? ` | Tel: ${selectedBoleta.destinatario_telefono}` : ''})
                    </span>
                  )}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Origen:</span>
                <span className="shalom-meta-val truncate max-w-[220px]" title={selectedBoleta.origen}>
                  {selectedBoleta.origen || 'LINCE - LIMA'}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Destino:</span>
                <span className="shalom-meta-val truncate max-w-[220px]" title={selectedBoleta.destino}>
                  {selectedBoleta.destino}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Entrega:</span>
                <span className="shalom-meta-val text-sky-400">
                  {selectedBoleta.tipo_entrega || selectedBoleta.agencia_destino || 'ENTREGAR EN AGENCIA'}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Detalle Envío:</span>
                <span className="shalom-meta-val">
                  {selectedBoleta.cantidad || 1}x {selectedBoleta.descripcion || selectedBoleta.contenido_bultos || 'BULTO'}
                  {' '}({selectedBoleta.peso !== undefined ? selectedBoleta.peso : (selectedBoleta.peso_total || 0)} {selectedBoleta.unidad_medida || 'Volumen'})
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Forma de Pago:</span>
                <span className="shalom-meta-val text-amber-400">
                  {selectedBoleta.forma_pago || (selectedBoleta.modalidad_pago === 'PAGO_DESTINO' ? 'Pendiente de Pago' : selectedBoleta.modalidad_pago || 'Pendiente')}
                </span>
              </div>
              <div className="shalom-meta-row">
                <span className="shalom-meta-key">Monto Total:</span>
                <span className="shalom-meta-val text-emerald-400 font-mono font-bold">
                  S/ {(Number(selectedBoleta.monto_total) || 0).toFixed(2)}
                </span>
              </div>
              {selectedBoleta.observaciones && (
                <div className="shalom-meta-row">
                  <span className="shalom-meta-key">Observaciones:</span>
                  <span className="shalom-meta-val text-[11px] text-slate-300 italic truncate max-w-[220px]" title={selectedBoleta.observaciones}>
                    {selectedBoleta.observaciones}
                  </span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* =====================================================================
          MODAL DE CARGA ASISTIDA DE BOLETAS CON OCR GEMINI (BOLETAS ESCANEADAS)
          ===================================================================== */}
      {isUploadModalOpen && (
        <div className="shalom-modal-overlay">
          <div className="shalom-modal-container">
            <div className="shalom-modal-header">
              <h3>
                <UploadCloud size={20} className="text-sky-400" />
                Cargar Boleta de Shalom (Boleta Escaneada & OCR)
              </h3>
              <button
                type="button"
                className="shalom-modal-close-btn"
                onClick={closeUploadModal}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="shalom-modal-body">
              {uploadError && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* ETAPA 1: Dropzone de Selección */}
              {uploadStage === 'DROPZONE' && (
                <div
                  className="shalom-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelected(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="shalom-dropzone-icon">
                    <UploadCloud size={32} />
                  </div>
                  <h4 className="shalom-dropzone-title">
                    Arrastra el archivo PDF escaneado aquí o haz clic para buscar
                  </h4>
                  <p className="shalom-dropzone-subtitle">
                    Compatible con los archivos PDF generados por cualquier escáner o impresora multifuncional. AMEXito AI leerá los datos al instante.
                  </p>
                  <span className="shalom-dropzone-tag">Solo archivos .PDF</span>
                </div>
              )}

              {/* ETAPA 2: Escaneando con IA */}
              {uploadStage === 'ANALYZING' && (
                <div className="shalom-ocr-scanning">
                  <div className="shalom-radar-spinner" />
                  <div className="flex flex-col gap-1 items-center">
                    <h4 className="shalom-ocr-scan-title flex items-center gap-2">
                      <Sparkles size={18} className="text-sky-400 animate-pulse" />
                      AMEXito AI está leyendo la boleta de Shalom...
                    </h4>
                    <p className="shalom-ocr-scan-desc">
                      Extrayendo N° de guía, destinatario, DNI, ciudad destino, importes y modalidad de pago...
                    </p>
                  </div>
                </div>
              )}

              {/* ETAPA 3: Pantalla Dividida (Split Screen: PDF a la izquierda, Formulario a la derecha) */}
              {uploadStage === 'REVIEW' && (
                <div className="shalom-split-review">
                  {/* Vista previa del PDF escaneado */}
                  <div className="shalom-split-preview">
                    <div className="shalom-split-preview-header">
                      <span>Vista Previa del Escaneo Original</span>
                      <span className="text-[11px] text-sky-400 font-semibold">{currentFile?.name}</span>
                    </div>
                    {filePreviewBlobUrl && (
                      <iframe
                        src={filePreviewBlobUrl}
                        className="shalom-split-preview-frame"
                        title="Previsualización PDF"
                      />
                    )}
                  </div>

                  {/* Formulario con campos extraídos */}
                  <div className="shalom-split-form">
                    {/* Barra de Herramientas IA Opcional (Igual que Módulos 8 y 9) */}
                    <div className="shalom-ai-toolbar">
                      <button
                        type="button"
                        className="shalom-btn-ai-extract"
                        onClick={handleExtractWithAi}
                        disabled={isExtractingAi || !currentFile}
                        title="Extraer campos automáticamente con Inteligencia Artificial"
                      >
                        {isExtractingAi ? (
                          <>
                            <RefreshCw size={15} className="animate-spin" />
                            <span>AMEXito AI extrayendo datos...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="text-amber-300" />
                            <span>🤖 Extraer datos con AMEXito AI</span>
                          </>
                        )}
                      </button>
                      <span className="shalom-ai-hint">
                        Opcional: completa a mano o pulsa el botón para auto-rellenar con IA.
                      </span>
                    </div>

                    {aiSuccessMsg && (
                      <div className="shalom-ai-success-banner">
                        <Check size={16} />
                        <span>{aiSuccessMsg}</span>
                      </div>
                    )}

                    {/* Sección 1: Datos Ticket Shalom */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <FileText size={14} /> 1. Datos Ticket Shalom
                      </div>
                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>NRO. ORDEN *</label>
                          <input
                            type="text"
                            className="shalom-input font-mono font-bold"
                            placeholder="Ej: 95294190"
                            value={formData.nro_orden}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nro_orden: e.target.value.toUpperCase(),
                                numero_guia: e.target.value.toUpperCase()
                              })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>CÓDIGO (RETIRO / TRACKING)</label>
                          <input
                            type="text"
                            className="shalom-input font-mono"
                            placeholder="Ej: 7HH7"
                            value={formData.codigo}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                codigo: e.target.value.toUpperCase(),
                                codigo_seguimiento: e.target.value.toUpperCase()
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="shalom-form-grid-3">
                        <div className="shalom-field">
                          <label>Fecha Emisión *</label>
                          <input
                            type="date"
                            className="shalom-input"
                            value={formData.fecha_emision}
                            onChange={(e) =>
                              setFormData({ ...formData, fecha_emision: e.target.value })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Hora Emisión</label>
                          <input
                            type="text"
                            className="shalom-input"
                            placeholder="17:53:14"
                            value={formData.hora_emision}
                            onChange={(e) =>
                              setFormData({ ...formData, hora_emision: e.target.value })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Fecha Traslado</label>
                          <input
                            type="date"
                            className="shalom-input"
                            value={formData.fecha_traslado}
                            onChange={(e) =>
                              setFormData({ ...formData, fecha_traslado: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Datos del Remitente */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <User size={14} /> 2. Datos del Remitente
                      </div>
                      <div className="shalom-field">
                        <label>Nombre Remitente</label>
                        <input
                          type="text"
                          className="shalom-input"
                          placeholder="QUINTANA CORNEJO BLANCA ESTHER"
                          value={formData.remitente_nombre}
                          onChange={(e) =>
                            setFormData({ ...formData, remitente_nombre: e.target.value.toUpperCase() })
                          }
                        />
                      </div>

                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>DNI Remitente</label>
                          <input
                            type="text"
                            className="shalom-input font-mono"
                            placeholder="06779177"
                            value={formData.remitente_dni}
                            onChange={(e) =>
                              setFormData({ ...formData, remitente_dni: e.target.value })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Teléfono Remitente</label>
                          <input
                            type="text"
                            className="shalom-input font-mono"
                            placeholder="982400043"
                            value={formData.remitente_telefono}
                            onChange={(e) =>
                              setFormData({ ...formData, remitente_telefono: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 3: Datos del Destinatario */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <User size={14} /> 3. Datos del Destinatario
                      </div>
                      <div className="shalom-field">
                        <label>Nombre Destinatario *</label>
                        <input
                          type="text"
                          className="shalom-input"
                          placeholder="REVILLA ANCASI MAGALY SHIRLEY"
                          value={formData.destinatario_nombre}
                          onChange={(e) =>
                            setFormData({ ...formData, destinatario_nombre: e.target.value.toUpperCase() })
                          }
                        />
                      </div>

                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>DNI Destinatario</label>
                          <input
                            type="text"
                            className="shalom-input font-mono"
                            placeholder="42830643"
                            value={formData.destinatario_dni}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                destinatario_dni: e.target.value,
                                destinatario_documento: e.target.value
                              })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Teléfono Destinatario</label>
                          <input
                            type="text"
                            className="shalom-input font-mono"
                            placeholder="986868420"
                            value={formData.destinatario_telefono}
                            onChange={(e) =>
                              setFormData({ ...formData, destinatario_telefono: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 4: Origen, Destino y Entrega */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <MapPin size={14} /> 4. Origen, Destino y Entrega
                      </div>
                      <div className="shalom-field">
                        <label>Origen (Dirección / Agencia)</label>
                        <input
                          type="text"
                          className="shalom-input text-xs"
                          placeholder="AV. CORONEL JOSÉ LEAL 648, URB. FUNDO LOBATÓN, LINCE - LIMA"
                          value={formData.origen}
                          onChange={(e) =>
                            setFormData({ ...formData, origen: e.target.value.toUpperCase() })
                          }
                        />
                      </div>

                      <div className="shalom-field">
                        <label>Destino (Dirección / Agencia Shalom) *</label>
                        <input
                          type="text"
                          className="shalom-input text-xs"
                          placeholder="CALLE YAVARÍ 507 B - ZAMACOLA - CERRO COLORADO - AREQUIPA"
                          value={formData.destino}
                          onChange={(e) =>
                            setFormData({ ...formData, destino: e.target.value.toUpperCase() })
                          }
                        />
                      </div>

                      <div className="shalom-field">
                        <label>Entrega</label>
                        <input
                          type="text"
                          className="shalom-input"
                          placeholder="ENTREGAR EN AGENCIA"
                          value={formData.tipo_entrega}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tipo_entrega: e.target.value.toUpperCase(),
                              agencia_destino: e.target.value.toUpperCase()
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Sección 5: Detalle del Envío */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <Package size={14} /> 5. Detalle del Envío
                      </div>
                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>Descripción</label>
                          <input
                            type="text"
                            className="shalom-input"
                            placeholder="BULTO"
                            value={formData.descripcion}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                descripcion: e.target.value,
                                contenido_bultos: e.target.value
                              })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            className="shalom-input font-mono"
                            value={formData.cantidad}
                            onChange={(e) =>
                              setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })
                            }
                          />
                        </div>
                      </div>

                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>Unidad de Medida</label>
                          <input
                            type="text"
                            className="shalom-input"
                            placeholder="Volumen"
                            value={formData.unidad_medida}
                            onChange={(e) =>
                              setFormData({ ...formData, unidad_medida: e.target.value })
                            }
                          />
                        </div>

                        <div className="shalom-field">
                          <label>Peso / Volumen</label>
                          <input
                            type="number"
                            step="0.001"
                            className="shalom-input font-mono"
                            placeholder="0.120"
                            value={formData.peso}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                peso: parseFloat(e.target.value) || 0,
                                peso_total: parseFloat(e.target.value) || 0
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 6: Pago, Total y Observaciones */}
                    <div className="shalom-form-section">
                      <div className="shalom-form-section-title">
                        <DollarSign size={14} /> 6. Forma de Pago, Importe y Observaciones
                      </div>
                      <div className="shalom-form-grid-2">
                        <div className="shalom-field">
                          <label>Forma de Pago</label>
                          <input
                            type="text"
                            className="shalom-input"
                            placeholder="Pendiente de Pago"
                            value={formData.forma_pago}
                            onChange={(e) => {
                              const fp = e.target.value;
                              const mod: ModalidadPagoShalom = fp.toLowerCase().includes('pagad')
                                ? 'PAGADO'
                                : fp.toLowerCase().includes('credit')
                                ? 'CREDITO'
                                : 'PAGO_DESTINO';
                              setFormData({ ...formData, forma_pago: fp, modalidad_pago: mod });
                            }}
                          />
                        </div>

                        <div className="shalom-field">
                          <label>TOTAL (S/) *</label>
                          <input
                            type="number"
                            step="0.10"
                            className="shalom-input font-mono font-bold text-emerald-400"
                            placeholder="33.00"
                            value={formData.monto_total}
                            onChange={(e) =>
                              setFormData({ ...formData, monto_total: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>

                      <div className="shalom-field">
                        <label>Observaciones</label>
                        <textarea
                          rows={2}
                          className="shalom-input text-xs"
                          placeholder="USTED NO CONTRATO EL SERVICIO DE GARANTIA..."
                          value={formData.observaciones}
                          onChange={(e) =>
                            setFormData({ ...formData, observaciones: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uploadStage === 'REVIEW' && (
              <div className="shalom-modal-footer">
                <button
                  type="button"
                  className="shalom-btn-secondary"
                  onClick={() => {
                    setUploadStage('DROPZONE');
                    if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
                    setFilePreviewBlobUrl(null);
                    setCurrentFile(null);
                  }}
                  disabled={isSaving}
                >
                  Volver a Escanear
                </button>

                <button
                  type="button"
                  className="shalom-btn-save-next"
                  onClick={() => handleSaveBoleta(true)}
                  disabled={isSaving}
                  title="Guarda esta boleta y deja listo para el siguiente PDF escaneado"
                >
                  {isSaving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  Guardar y Cargar Siguiente
                </button>

                <button
                  type="button"
                  className="shalom-btn-primary"
                  onClick={() => handleSaveBoleta(false)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                  Guardar y Finalizar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE EDICIÓN DE BOLETA
          ===================================================================== */}
      {isEditModalOpen && (
        <div className="shalom-modal-overlay">
          <div className="shalom-modal-container" style={{ maxWidth: '720px' }}>
            <div className="shalom-modal-header">
              <h3>
                <Edit2 size={18} className="text-sky-400" />
                Editar Boleta Shalom N° {editFormData.nro_orden || editFormData.numero_guia}
              </h3>
              <button
                type="button"
                className="shalom-modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="shalom-modal-body flex flex-col gap-4">
              {/* Sección 1: Ticket */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <FileText size={14} /> 1. Datos Ticket Shalom
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>NRO. ORDEN *</label>
                    <input
                      type="text"
                      className="shalom-input font-mono font-bold"
                      value={editFormData.nro_orden}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          nro_orden: e.target.value.toUpperCase(),
                          numero_guia: e.target.value.toUpperCase()
                        })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>CÓDIGO RETIRO / TRACKING</label>
                    <input
                      type="text"
                      className="shalom-input font-mono"
                      value={editFormData.codigo}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          codigo: e.target.value.toUpperCase(),
                          codigo_seguimiento: e.target.value.toUpperCase()
                        })
                      }
                    />
                  </div>
                </div>

                <div className="shalom-form-grid-3">
                  <div className="shalom-field">
                    <label>Fecha Emisión</label>
                    <input
                      type="date"
                      className="shalom-input"
                      value={editFormData.fecha_emision}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, fecha_emision: e.target.value })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Hora Emisión</label>
                    <input
                      type="text"
                      className="shalom-input"
                      value={editFormData.hora_emision}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, hora_emision: e.target.value })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Fecha Traslado</label>
                    <input
                      type="date"
                      className="shalom-input"
                      value={editFormData.fecha_traslado}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, fecha_traslado: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Remitente */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <User size={14} /> 2. Datos del Remitente
                </div>
                <div className="shalom-field">
                  <label>Nombre Remitente</label>
                  <input
                    type="text"
                    className="shalom-input"
                    value={editFormData.remitente_nombre}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, remitente_nombre: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>DNI Remitente</label>
                    <input
                      type="text"
                      className="shalom-input font-mono"
                      value={editFormData.remitente_dni}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, remitente_dni: e.target.value })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Teléfono Remitente</label>
                    <input
                      type="text"
                      className="shalom-input font-mono"
                      value={editFormData.remitente_telefono}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, remitente_telefono: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Destinatario */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <User size={14} /> 3. Datos del Destinatario
                </div>
                <div className="shalom-field">
                  <label>Nombre Destinatario *</label>
                  <input
                    type="text"
                    className="shalom-input"
                    value={editFormData.destinatario_nombre}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, destinatario_nombre: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>DNI Destinatario</label>
                    <input
                      type="text"
                      className="shalom-input font-mono"
                      value={editFormData.destinatario_dni}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          destinatario_dni: e.target.value,
                          destinatario_documento: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Teléfono Destinatario</label>
                    <input
                      type="text"
                      className="shalom-input font-mono"
                      value={editFormData.destinatario_telefono}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, destinatario_telefono: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Origen, Destino y Entrega */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <MapPin size={14} /> 4. Origen, Destino y Entrega
                </div>
                <div className="shalom-field">
                  <label>Origen</label>
                  <input
                    type="text"
                    className="shalom-input text-xs"
                    value={editFormData.origen}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, origen: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="shalom-field">
                  <label>Destino *</label>
                  <input
                    type="text"
                    className="shalom-input text-xs"
                    value={editFormData.destino}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, destino: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="shalom-field">
                  <label>Entrega</label>
                  <input
                    type="text"
                    className="shalom-input"
                    value={editFormData.tipo_entrega}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        tipo_entrega: e.target.value.toUpperCase(),
                        agencia_destino: e.target.value.toUpperCase()
                      })
                    }
                  />
                </div>
              </div>

              {/* Sección 5: Detalle del Envío */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <Package size={14} /> 5. Detalle del Envío
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>Descripción</label>
                    <input
                      type="text"
                      className="shalom-input"
                      value={editFormData.descripcion}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          descripcion: e.target.value,
                          contenido_bultos: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="shalom-input font-mono"
                      value={editFormData.cantidad}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, cantidad: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>Unidad de Medida</label>
                    <input
                      type="text"
                      className="shalom-input"
                      value={editFormData.unidad_medida}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, unidad_medida: e.target.value })
                      }
                    />
                  </div>
                  <div className="shalom-field">
                    <label>Peso / Volumen</label>
                    <input
                      type="number"
                      step="0.001"
                      className="shalom-input font-mono"
                      value={editFormData.peso}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          peso: parseFloat(e.target.value) || 0,
                          peso_total: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sección 6: Pago, Total y Observaciones */}
              <div className="shalom-form-section">
                <div className="shalom-form-section-title">
                  <DollarSign size={14} /> 6. Forma de Pago, Importe y Observaciones
                </div>
                <div className="shalom-form-grid-2">
                  <div className="shalom-field">
                    <label>Forma de Pago</label>
                    <input
                      type="text"
                      className="shalom-input"
                      value={editFormData.forma_pago}
                      onChange={(e) => {
                        const fp = e.target.value;
                        const mod: ModalidadPagoShalom = fp.toLowerCase().includes('pagad')
                          ? 'PAGADO'
                          : fp.toLowerCase().includes('credit')
                          ? 'CREDITO'
                          : 'PAGO_DESTINO';
                        setEditFormData({ ...editFormData, forma_pago: fp, modalidad_pago: mod });
                      }}
                    />
                  </div>
                  <div className="shalom-field">
                    <label>TOTAL (S/) *</label>
                    <input
                      type="number"
                      step="0.10"
                      className="shalom-input font-mono font-bold text-emerald-400"
                      value={editFormData.monto_total}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, monto_total: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="shalom-field">
                  <label>Observaciones</label>
                  <textarea
                    rows={2}
                    className="shalom-input text-xs"
                    value={editFormData.observaciones}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, observaciones: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="shalom-modal-footer">
              <button
                type="button"
                className="shalom-btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="shalom-btn-primary"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : null}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DE CONFIRMACIÓN DE ELIMINACIÓN (SIN ALERTAS NATIVAS)
          ===================================================================== */}
      {isDeleteModalOpen && deletingBoleta && (
        <div className="shalom-modal-overlay">
          <div className="shalom-confirm-modal">
            <div className="shalom-confirm-icon">
              <Trash2 size={26} />
            </div>
            <h3 className="shalom-confirm-title">¿Eliminar esta boleta?</h3>
            <p className="shalom-confirm-text">
              Estás a punto de eliminar la boleta <strong>N° {deletingBoleta.numero_guia}</strong> de{' '}
              <strong>{deletingBoleta.destinatario_nombre}</strong> con destino a <strong>{deletingBoleta.destino}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="shalom-confirm-actions">
              <button
                type="button"
                className="shalom-btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="shalom-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
