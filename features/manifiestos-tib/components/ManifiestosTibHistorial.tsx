'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Layers,
  UserCheck,
  FileText,
  Boxes,
  Copy,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface SavedManifest {
  id: string;
  fecha_vuelo: string;
  cliente: string;
  modalidad: string;
  guias_declaradas: number;
  paquetes_declarados: number;
  guias_extraidas: number;
  paquetes_extraidos: number;
  es_cuadre_perfecto: boolean;
  archivo_nombre: string;
  creado_por: string;
  creado_en: string;
}

export interface ManifestDetailRow {
  guia: string;
  wrs: string[];
  observacion: string;
  fila_index: number;
}

export default function ManifiestosTibHistorial({
  onRefreshParent,
}: {
  onRefreshParent?: () => Promise<void> | void;
}) {
  const [manifiestos, setManifiestos] = useState<SavedManifest[]>([]);
  const [stats, setStats] = useState({
    totalManifiestos: 0,
    totalGuias: 0,
    totalPaquetes: 0,
    totalCuadrePerfecto: 0,
    tasaCuadre: 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModalidad, setFilterModalidad] = useState('TODAS');
  const [filterCuadre, setFilterCuadre] = useState('TODOS');

  // Detalle / Modal
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(null);
  const [manifestDetail, setManifestDetail] = useState<{
    manifiesto: SavedManifest;
    filas: ManifestDetailRow[];
    totalDetalles: number;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailFilterType, setDetailFilterType] = useState<'ALL' | 'MULTI' | 'EMPTY'>('ALL');

  // Estados de retroalimentación
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchHistorial = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (filterModalidad !== 'TODAS') params.set('modalidad', filterModalidad);
      if (filterCuadre !== 'TODOS') params.set('cuadre', filterCuadre);

      const res = await fetch(`/api/manifiestos-tib/historial?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setManifiestos(data.manifiestos || []);
        if (data.stats) setStats(data.stats);
      } else {
        console.warn('Error obteniendo historial:', data.error);
      }
    } catch (err) {
      console.error('Error de red al cargar historial:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterModalidad, filterCuadre]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // Cargar detalle de un manifiesto al abrir el modal
  const handleOpenDetail = async (id: string) => {
    setSelectedManifestId(id);
    setIsLoadingDetail(true);
    setDetailSearchTerm('');
    setDetailFilterType('ALL');

    try {
      const res = await fetch(`/api/manifiestos-tib/detalle?id=${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setManifestDetail({
          manifiesto: data.manifiesto,
          filas: data.filas || [],
          totalDetalles: data.totalDetalles || 0,
        });
      } else {
        alert(data.error || 'No se pudo cargar el detalle del manifiesto');
        setSelectedManifestId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al cargar detalle.');
      setSelectedManifestId(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedManifestId(null);
    setManifestDetail(null);
  };

  // Exportar manifiesto a Excel
  const handleExportSingleExcel = async (manifest: SavedManifest) => {
    try {
      const res = await fetch(`/api/manifiestos-tib/detalle?id=${manifest.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron descargar los datos para Excel');
      }

      const filas: ManifestDetailRow[] = data.filas || [];
      const exportRows: any[] = [];

      filas.forEach((f, idx) => {
        exportRows.push({
          '# Fila': idx + 1,
          'Guía AMX': f.guia,
          'Cantidad Bultos': (f.wrs || []).length,
          'Códigos WR': (f.wrs || []).join(' / '),
          'Observación': f.observacion || '',
          'Vuelo': manifest.fecha_vuelo,
          'Modalidad': manifest.modalidad,
          'Fecha Guardado': new Date(manifest.creado_en).toLocaleString('es-PE'),
        });
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Manifiesto');
      const filename = `Manifiesto_TIB_${manifest.fecha_vuelo}_${manifest.modalidad}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al exportar';
      alert(msg);
    }
  };

  // Eliminar manifiesto
  const handleDeleteManifest = async (id: string, vuelo: string) => {
    const confirm = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el manifiesto del Vuelo ${vuelo}? Esta acción eliminará también sus filas de detalle.`
    );
    if (!confirm) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/manifiestos-tib/eliminar?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar');
      }

      // Actualizar lista local
      setManifiestos((prev) => prev.filter((m) => m.id !== id));
      if (selectedManifestId === id) {
        handleCloseDetail();
      }
      if (onRefreshParent) {
        await onRefreshParent();
      }
      await fetchHistorial();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      alert(`No se pudo eliminar: ${msg}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Filas filtradas dentro del modal
  const modalFilteredRows = useMemo(() => {
    if (!manifestDetail) return [];
    return manifestDetail.filas.filter((f) => {
      const wrs = f.wrs || [];
      if (detailFilterType === 'MULTI' && wrs.length <= 1) return false;
      if (detailFilterType === 'EMPTY' && wrs.length > 0) return false;

      if (detailSearchTerm.trim()) {
        const term = detailSearchTerm.toLowerCase().trim();
        const matchGuia = f.guia.toLowerCase().includes(term);
        const matchWr = wrs.some((w) => w.toLowerCase().includes(term));
        const matchObs = (f.observacion || '').toLowerCase().includes(term);
        return matchGuia || matchWr || matchObs;
      }
      return true;
    });
  }, [manifestDetail, detailFilterType, detailSearchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. KPIs Globales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Manifiestos Guardados</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '8px 0 2px 0' }}>
            {stats.totalManifiestos}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Documentos registrados en base de datos</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Guías AMX</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7' }}>
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7', margin: '8px 0 2px 0' }}>
            {stats.totalGuias}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Guías auditadas acumuladas</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Paquetes WR</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#7c3aed', margin: '8px 0 2px 0' }}>
            {stats.totalPaquetes}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Bultos y paquetes embarcados</div>
        </div>

        <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Tasa Cuadre Perfecto</span>
            <div style={{ padding: '6px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669', margin: '8px 0 2px 0' }}>
            {stats.tasaCuadre}%
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {stats.totalCuadrePerfecto} de {stats.totalManifiestos} sin discrepancias
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div
        style={{
          background: '#ffffff',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              className="w-4 h-4 text-slate-400"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="text"
              placeholder="Buscar por Vuelo, Guía AMX, Código WR, Archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={fetchHistorial}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Filtros Modalidad y Cuadre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Modalidad:</span>
            <select
              value={filterModalidad}
              onChange={(e) => setFilterModalidad(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="TODAS">Todas</option>
              <option value="OFICINA">OFICINA</option>
              <option value="DOMICILIO">DOMICILIO</option>
              <option value="PROVINCIA">PROVINCIA</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Cuadre:</span>
            <select
              value={filterCuadre}
              onChange={(e) => setFilterCuadre(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1e293b',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="PERFECTO">Cuadre Perfecto</option>
              <option value="DESCUADRE">Con Descuadre</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tabla Principal de Manifiestos */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  color: '#475569',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}
              >
                <th style={{ padding: '14px 16px' }}>Vuelo / Fecha</th>
                <th style={{ padding: '14px 16px' }}>Modalidad</th>
                <th style={{ padding: '14px 16px' }}>Archivo Original</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Guías AMX</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Paquetes WR</th>
                <th style={{ padding: '14px 16px' }}>Auditoría Matemática</th>
                <th style={{ padding: '14px 16px' }}>Registrado Por</th>
                <th style={{ padding: '14px 16px' }}>Fecha Registro</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && manifiestos.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ margin: '0 auto 8px auto', color: '#2563eb' }} />
                    Cargando historial de manifiestos...
                  </td>
                </tr>
              ) : manifiestos.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                    <FileSpreadsheet className="w-10 h-10" style={{ margin: '0 auto 10px auto', color: '#cbd5e1' }} />
                    <p style={{ margin: '0 0 4px 0', fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                      No se encontraron manifiestos guardados
                    </p>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                      {searchTerm
                        ? 'No hay registros que coincidan con los filtros aplicados.'
                        : 'Aún no has guardado ningún manifiesto. Digitaliza uno desde la pestaña Extractor.'}
                    </p>
                  </td>
                </tr>
              ) : (
                manifiestos.map((m) => {
                  const fechaObj = new Date(m.creado_en);
                  const fechaFormateada = fechaObj.toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const horaFormateada = fechaObj.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      className="hover:bg-slate-50/80"
                    >
                      {/* Vuelo */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontWeight: 900,
                              fontSize: '13.5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #dbeafe',
                              fontFamily: 'monospace',
                            }}
                          >
                            {m.fecha_vuelo}
                          </span>
                        </div>
                      </td>

                      {/* Modalidad */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background:
                              m.modalidad === 'OFICINA'
                                ? '#ecfdf5'
                                : m.modalidad === 'DOMICILIO'
                                ? '#eff6ff'
                                : '#fef3c7',
                            color:
                              m.modalidad === 'OFICINA'
                                ? '#059669'
                                : m.modalidad === 'DOMICILIO'
                                ? '#2563eb'
                                : '#b45309',
                            border:
                              m.modalidad === 'OFICINA'
                                ? '1px solid #a7f3d0'
                                : m.modalidad === 'DOMICILIO'
                                ? '1px solid #bfdbfe'
                                : '1px solid #fde68a',
                          }}
                        >
                          {m.modalidad}
                        </span>
                      </td>

                      {/* Archivo */}
                      <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#334155',
                            fontWeight: 600,
                            fontSize: '12.5px',
                          }}
                          title={m.archivo_nombre}
                        >
                          {m.archivo_nombre || 'manifiesto.pdf'}
                        </div>
                      </td>

                      {/* Guías AMX */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#0284c7' }}>
                          <span>{m.guias_extraidas}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                            /{m.guias_declaradas}
                          </span>
                        </div>
                      </td>

                      {/* Paquetes WR */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: '#7c3aed' }}>
                          <span>{m.paquetes_extraidos}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                            /{m.paquetes_declarados}
                          </span>
                        </div>
                      </td>

                      {/* Auditoría / Cuadre */}
                      <td style={{ padding: '12px 16px' }}>
                        {m.es_cuadre_perfecto ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#ecfdf5',
                              color: '#065f46',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              border: '1px solid #a7f3d0',
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Cuadre Perfecto
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#fff1f2',
                              color: '#9f1239',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 800,
                              border: '1px solid #fecdd3',
                            }}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Descuadre
                          </span>
                        )}
                      </td>

                      {/* Operador */}
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.creado_por || 'Sistema'}</span>
                        </div>
                      </td>

                      {/* Fecha de Registro */}
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        <div>{fechaFormateada}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{horaFormateada}</div>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(m.id)}
                            title="Ver Detalle y Auditoría"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Detalle
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportSingleExcel(m)}
                            title="Descargar Excel"
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              color: '#15803d',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteManifest(m.id, m.fecha_vuelo)}
                            disabled={isDeletingId === m.id}
                            title="Eliminar Manifiesto"
                            style={{
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: isDeletingId === m.id ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL PROFESIONAL DE DETALLE & AUDITORÍA */}
      {selectedManifestId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '1100px',
              maxHeight: '92vh',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '20px 24px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                      Auditoría Manifiesto TIB — Vuelo {manifestDetail?.manifiesto.fecha_vuelo || '...'}
                    </h2>
                    {manifestDetail?.manifiesto.es_cuadre_perfecto ? (
                      <span
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        ✓ Cuadre Perfecto
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                        }}
                      >
                        Descuadre
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '12.5px' }}>
                    Modalidad: <strong>{manifestDetail?.manifiesto.modalidad}</strong> • Registrado por:{' '}
                    <strong>{manifestDetail?.manifiesto.creado_por}</strong> • Archivo:{' '}
                    <strong>{manifestDetail?.manifiesto.archivo_nombre}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {manifestDetail && (
                  <button
                    type="button"
                    onClick={() => handleExportSingleExcel(manifestDetail.manifiesto)}
                    style={{
                      background: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Download className="w-4 h-4" /> Exportar Excel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#94a3b8',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="hover:text-white hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
              {isLoadingDetail ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ margin: '0 auto 12px auto', color: '#2563eb' }} />
                  Cargando desglose completo de filas y paquetes WR...
                </div>
              ) : manifestDetail ? (
                <>
                  {/* Tarjetas resumen del manifiesto */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Guías AMX</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0284c7', margin: '4px 0' }}>
                        {manifestDetail.filas.length}{' '}
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          / {manifestDetail.manifiesto.guias_declaradas}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Paquetes WR Total</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#7c3aed', margin: '4px 0' }}>
                        {manifestDetail.totalDetalles}{' '}
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                          / {manifestDetail.manifiesto.paquetes_declarados}
                        </span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Guías Multi-Bulto</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#9333ea', margin: '4px 0' }}>
                        {manifestDetail.filas.filter((f) => (f.wrs || []).length > 1).length}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Guías Sin WR</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#dc2626', margin: '4px 0' }}>
                        {manifestDetail.filas.filter((f) => (f.wrs || []).length === 0).length}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Filtros Internos del Detalle */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                      <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                      <input
                        type="text"
                        placeholder="Buscar por Guía AMX o WR..."
                        value={detailSearchTerm}
                        onChange={(e) => setDetailSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px 7px 32px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailFilterType('ALL')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: detailFilterType === 'ALL' ? '#0f172a' : '#ffffff',
                          color: detailFilterType === 'ALL' ? '#ffffff' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Todas ({manifestDetail.filas.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailFilterType('MULTI')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: detailFilterType === 'MULTI' ? '#7c3aed' : '#ffffff',
                          color: detailFilterType === 'MULTI' ? '#ffffff' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Múltiples WRs ({manifestDetail.filas.filter((f) => (f.wrs || []).length > 1).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailFilterType('EMPTY')}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: detailFilterType === 'EMPTY' ? '#dc2626' : '#ffffff',
                          color: detailFilterType === 'EMPTY' ? '#ffffff' : '#475569',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Sin WR ({manifestDetail.filas.filter((f) => (f.wrs || []).length === 0).length})
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Filas Guardadas */}
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      overflowY: 'auto',
                      overflowX: 'auto',
                      flex: 1,
                      minHeight: '260px',
                      maxHeight: '480px',
                      background: '#ffffff',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: 800 }}>
                          <th style={{ padding: '10px 14px', width: '50px', background: '#f8fafc' }}>#</th>
                          <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Guía AMX</th>
                          <th style={{ padding: '10px 14px', width: '80px', textAlign: 'center', background: '#f8fafc' }}>Bultos</th>
                          <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Paquetes WR Asociados</th>
                          <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Observación</th>
                          <th style={{ padding: '10px 14px', width: '100px', background: '#f8fafc' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalFilteredRows.map((row, idx) => {
                          const wrCount = (row.wrs || []).length;
                          return (
                            <tr
                              key={`${row.guia}-${idx}`}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: wrCount > 1 ? '#faf5ff' : wrCount === 0 ? '#fff1f2' : '#ffffff',
                              }}
                            >
                              <td style={{ padding: '8px 14px', color: '#94a3b8', fontWeight: 700 }}>
                                {row.fila_index || idx + 1}
                              </td>

                              <td style={{ padding: '8px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                                    {row.guia}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(row.guia)}
                                    title="Copiar guía"
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      color: '#94a3b8',
                                      padding: '2px',
                                    }}
                                  >
                                    {copiedCode === row.guia ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3 hover:text-slate-600" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '5px',
                                    background: wrCount > 1 ? '#f3e8ff' : wrCount === 0 ? '#fee2e2' : '#f1f5f9',
                                    color: wrCount > 1 ? '#7e22ce' : wrCount === 0 ? '#b91c1c' : '#475569',
                                    fontWeight: 900,
                                    fontSize: '11px',
                                  }}
                                >
                                  {wrCount}
                                </span>
                              </td>

                              <td style={{ padding: '8px 14px' }}>
                                {wrCount > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                    {row.wrs.map((wr, wIdx) => (
                                      <div
                                        key={wIdx}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          background: '#eff6ff',
                                          color: '#1d4ed8',
                                          border: '1px solid #bfdbfe',
                                          padding: '2px 6px',
                                          borderRadius: '5px',
                                          fontFamily: 'monospace',
                                          fontSize: '11.5px',
                                          fontWeight: 700,
                                        }}
                                      >
                                        <span>{wr}</span>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(wr)}
                                          title="Copiar WR"
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: '#60a5fa',
                                            padding: 0,
                                            display: 'flex',
                                          }}
                                        >
                                          {copiedCode === wr ? (
                                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-2.5 h-2.5 hover:text-blue-800" />
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ color: '#dc2626', fontWeight: 700, fontStyle: 'italic', fontSize: '11px' }}>
                                    Sin código WR
                                  </span>
                                )}
                              </td>

                              <td style={{ padding: '8px 14px', color: '#64748b' }}>
                                {row.observacion || '—'}
                              </td>

                              <td style={{ padding: '8px 14px' }}>
                                {wrCount > 1 ? (
                                  <span style={{ color: '#7e22ce', background: '#f3e8ff', padding: '2px 6px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 800 }}>
                                    📦 {wrCount} Bultos
                                  </span>
                                ) : wrCount === 1 ? (
                                  <span style={{ color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 800 }}>
                                    ✓ 1 Bulto
                                  </span>
                                ) : (
                                  <span style={{ color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '5px', fontSize: '10.5px', fontWeight: 800 }}>
                                    Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Barra de conteo de filas y desplazamiento */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#64748b',
                      padding: '2px 4px',
                    }}
                  >
                    <span>
                      Mostrando <strong>{modalFilteredRows.length}</strong> de <strong>{manifestDetail.filas.length}</strong> guías (<strong>{modalFilteredRows.reduce((acc, r) => acc + (r.wrs || []).length, 0)}</strong> paquetes WR)
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      ↕ Desplaza hacia abajo con el ratón para revisar todas las filas
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                background: '#f8fafc',
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                Total auditado en BD: <strong>{manifestDetail?.filas.length}</strong> guías / <strong>{manifestDetail?.totalDetalles}</strong> paquetes WR
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
