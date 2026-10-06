'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Search,
  Filter,
  Check,
  Download,
  Database,
  ArrowRight,
  History,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ManifiestosTibHistorial from './ManifiestosTibHistorial';

interface HeaderData {
  fecha_vuelo: string;
  cliente: string;
  modalidad: string;
  guias_declaradas: number;
  paquetes_declarados: number;
}

interface ReconciliationData {
  cuadre_perfecto: boolean;
  status_code: string;
  mensaje: string;
  totales: {
    guias_declaradas: number;
    guias_extraidas: number;
    diferencia_guias: number;
    paquetes_declarados: number;
    paquetes_extraidos: number;
    diferencia_paquetes: number;
  };
  auditoria?: {
    total_guias_con_multiples_paquetes: number;
    guias_multi_paquete: any[];
    total_guias_sin_paquete: number;
    guias_sin_paquete: any[];
  };
}

interface ManifestRow {
  guia: string;
  wrs: string[];
  observacion: string;
  total_paquetes?: number;
  pagina?: number;
}

export default function ManifiestosTibTab({ onRefreshData }: { onRefreshData?: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<'extractor' | 'historial'>('extractor');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [encabezado, setEncabezado] = useState<HeaderData | null>(null);
  const [cuadre, setCuadre] = useState<ReconciliationData | null>(null);
  const [filas, setFilas] = useState<ManifestRow[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'MULTI' | 'EMPTY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [syncWithInventory, setSyncWithInventory] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setEncabezado(null);
      setCuadre(null);
      setFilas([]);
      setSaveSuccessMsg(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep('Iniciando extracción con motor OpenCV & PyMuPDF...');
    setSaveSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProcessingStep('Rasterizando páginas y detectando cuadrículas OMR...');

      const res = await fetch('/api/manifiestos-tib/procesar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el archivo');
      }

      setEncabezado(data.encabezado);
      setCuadre(data.cuadre);
      setFilas(data.filas || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      alert(`Error al procesar manifiesto: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSaveToDatabase = async () => {
    if (!encabezado || filas.length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/manifiestos-tib/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encabezado,
          cuadre,
          filas,
          archivoNombre: file?.name || 'manifiesto.pdf',
          sincronizarInventario: syncWithInventory,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setSaveSuccessMsg(data.mensaje || '¡Manifiesto guardado correctamente!');
      if (onRefreshData && syncWithInventory) {
        await onRefreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      alert(`Error al guardar en base de datos: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (filas.length === 0) return;

    const dataToExport: any[] = [];
    filas.forEach((f, idx) => {
      const wrsString = (f.wrs || []).join(' / ');
      dataToExport.push({
        '# Item': idx + 1,
        'Guía AMX': f.guia,
        'Cantidad Paquetes': (f.wrs || []).length,
        'Códigos WR': wrsString,
        'Observación': f.observacion || '',
        'Página': f.pagina || 1,
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Manifiesto TIB');

    const fileName = `Manifiesto_TIB_${encabezado?.fecha_vuelo || 'Extraido'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Filtrado de filas
  const filteredRows = filas.filter((f) => {
    const wrs = f.wrs || [];
    if (filterType === 'MULTI' && wrs.length <= 1) return false;
    if (filterType === 'EMPTY' && wrs.length > 0) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchGuia = f.guia.toLowerCase().includes(term);
      const matchWr = wrs.some((w) => w.toLowerCase().includes(term));
      const matchObs = (f.observacion || '').toLowerCase().includes(term);
      return matchGuia || matchWr || matchObs;
    }

    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Cabecera del Módulo */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Digitalizador & Cuadrador de Manifiestos TIB
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Extracción automatizada de guías AMX y paquetes WR con motor OpenCV + OMR y verificación matemática 100% libre de errores.
            </p>
          </div>
        </div>

        {activeTab === 'extractor' && cuadre && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                background: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(21, 128, 61, 0.3)'
              }}
            >
              <Download className="w-4 h-4" /> Exportar a Excel
            </button>
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Database className="w-4 h-4" /> {isSaving ? 'Guardando...' : 'Guardar Manifiesto'}
            </button>
          </div>
        )}
      </div>

      {/* Selector de Submódulos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '12px',
          width: 'fit-content',
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('extractor')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'extractor' ? '#ffffff' : 'transparent',
            color: activeTab === 'extractor' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'extractor' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          Digitalizar Manifiesto
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: activeTab === 'historial' ? '#ffffff' : 'transparent',
            color: activeTab === 'historial' ? '#0f172a' : '#64748b',
            boxShadow: activeTab === 'historial' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <History className="w-4 h-4 text-violet-600" />
          Historial & Auditoría
        </button>
      </div>

      {saveSuccessMsg && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #6ee7b7',
            padding: '14px 20px',
            borderRadius: '12px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.25)',
            }}
          >
            Ver en Historial <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'historial' ? (
        <ManifiestosTibHistorial onRefreshParent={onRefreshData} />
      ) : (
        <>
          {/* Zona de Carga de Documento */}
          {!cuadre && (
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            transition: 'border 0.2s ease'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Arrastra o selecciona el PDF o fotos del Manifiesto TIB
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px', maxWidth: '520px' }}>
              Admite PDFs escaneados de 4 a 6 páginas, o fotografías de las hojas. El motor enderezará automáticamente la orientación y segmentará las columnas.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,image/png,image/jpeg,image/jpg"
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Seleccionar Archivo...
            </button>

            {file && (
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing}
                style={{
                  background: '#2563eb',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  color: '#ffffff',
                  cursor: isProcessing ? 'wait' : 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Procesando con OpenCV...
                  </>
                ) : (
                  <>
                    Digitalizar & Extraer <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {file && (
            <div style={{ fontSize: '13px', color: '#0284c7', fontWeight: 700 }}>
              📄 Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          {isProcessing && (
            <div style={{ marginTop: '12px', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
              ⏳ {processingStep}
            </div>
          )}
        </div>
      )}

      {/* Resultados de Extracción & Cuadre Matemático */}
      {cuadre && encabezado && (
        <>
          {/* Tarjetas de Métricas y Diagnóstico de Cuadre */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Tarjeta 1: Fecha & Modalidad */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                Vuelo & Modalidad
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '6px 0 4px 0' }}>
                {encabezado.fecha_vuelo || '04-10'}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                MODALIDAD: {encabezado.modalidad || 'OFICINA'}
              </span>
            </div>

            {/* Tarjeta 2: Guías Totales */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                Guías AMX
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb' }}>
                  {cuadre.totales.guias_extraidas}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  de {cuadre.totales.guias_declaradas || cuadre.totales.guias_extraidas} declaradas
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cuadre.totales.diferencia_guias === 0 ? '#15803d' : '#dc2626' }}>
                {cuadre.totales.diferencia_guias === 0 ? '✓ 100% Guías cuadradas' : `Diferencia: ${cuadre.totales.diferencia_guias}`}
              </div>
            </div>

            {/* Tarjeta 3: Paquetes WR Totales */}
            <div style={{ background: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                Paquetes WR Embarcados
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '6px 0 4px 0' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#7c3aed' }}>
                  {cuadre.totales.paquetes_extraidos}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  de {cuadre.totales.paquetes_declarados || cuadre.totales.paquetes_extraidos} declarados
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cuadre.totales.diferencia_paquetes === 0 ? '#15803d' : '#dc2626' }}>
                {cuadre.totales.diferencia_paquetes === 0 ? '✓ 100% Paquetes cuadrados' : `Diferencia: ${cuadre.totales.diferencia_paquetes}`}
              </div>
            </div>

            {/* Tarjeta 4: Estado de Cuadre */}
            <div
              style={{
                background: cuadre.cuadre_perfecto ? '#ecfdf5' : '#fffbeb',
                padding: '18px',
                borderRadius: '12px',
                border: cuadre.cuadre_perfecto ? '1px solid #6ee7b7' : '1px solid #fde68a'
              }}
            >
              <div style={{ fontSize: '11px', color: cuadre.cuadre_perfecto ? '#047857' : '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>
                Auditoría Matemática
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: cuadre.cuadre_perfecto ? '#065f46' : '#92400e',
                  margin: '6px 0 4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {cuadre.cuadre_perfecto ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Cuadre Perfecto
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" /> Descuadre Detectado
                  </>
                )}
              </div>
              <div style={{ fontSize: '12px', color: cuadre.cuadre_perfecto ? '#047857' : '#b45309' }}>
                {cuadre.mensaje}
              </div>
            </div>
          </div>

          {/* Opciones y Barra de Filtros */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Buscar por Guía AMX o WR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: filterType === 'ALL' ? '#0f172a' : '#f8fafc',
                    color: filterType === 'ALL' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Todas ({filas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('MULTI')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: filterType === 'MULTI' ? '#7c3aed' : '#f8fafc',
                    color: filterType === 'MULTI' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Múltiples WRs ({filas.filter((f) => (f.wrs || []).length > 1).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('EMPTY')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: filterType === 'EMPTY' ? '#dc2626' : '#f8fafc',
                    color: filterType === 'EMPTY' ? '#ffffff' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sin WR ({filas.filter((f) => (f.wrs || []).length === 0).length})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={syncWithInventory}
                  onChange={(e) => setSyncWithInventory(e.target.checked)}
                />
                Ingresar paquetes a Inventario Lince automáticamente
              </label>

              <button
                type="button"
                onClick={() => {
                  setCuadre(null);
                  setEncabezado(null);
                  setFilas([]);
                  setFile(null);
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cargar Otro Manifiesto
              </button>
            </div>
          </div>

          {/* Tabla de Resultados Extraídos */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
                    <th style={{ padding: '12px 16px', width: '60px' }}>#</th>
                    <th style={{ padding: '12px 16px' }}>Guía AMX</th>
                    <th style={{ padding: '12px 16px', width: '90px' }}>Bultos</th>
                    <th style={{ padding: '12px 16px' }}>Paquetes WR Asociados</th>
                    <th style={{ padding: '12px 16px' }}>Observación</th>
                    <th style={{ padding: '12px 16px', width: '120px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => {
                    const wrCount = (row.wrs || []).length;
                    return (
                      <tr
                        key={`${row.guia}-${idx}`}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: wrCount > 1 ? '#faf5ff' : wrCount === 0 ? '#fff1f2' : '#ffffff'
                        }}
                      >
                        <td style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                          {row.guia}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              background: wrCount > 1 ? '#f3e8ff' : wrCount === 0 ? '#fee2e2' : '#f1f5f9',
                              color: wrCount > 1 ? '#7e22ce' : wrCount === 0 ? '#b91c1c' : '#475569',
                              fontWeight: 900,
                              fontSize: '12px'
                            }}
                          >
                            {wrCount}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {wrCount > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {row.wrs.map((wr, wIdx) => (
                                <span
                                  key={wIdx}
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe'
                                  }}
                                >
                                  {wr}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 700, fontStyle: 'italic' }}>
                              Sin código WR registrado
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#64748b' }}>
                          {row.observacion || '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {wrCount > 1 ? (
                            <span style={{ color: '#7e22ce', background: '#f3e8ff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              📦 {wrCount} Bultos
                            </span>
                          ) : wrCount === 1 ? (
                            <span style={{ color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              ✓ 1 Bulto
                            </span>
                          ) : (
                            <span style={{ color: '#b91c1c', background: '#fee2e2', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
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
          </div>
        </>
      )}
    </>
  )}
</div>
  );
}
