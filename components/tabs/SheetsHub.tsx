'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HojaCotejo, TipoProcesoCotejo } from '@/types';
import {
  Search,
  Plus,
  MoreVertical,
  FileSpreadsheet,
  Users,
  Copy,
  Check,
  FolderOpen,
  ArrowUpDown,
  LayoutGrid,
  List,
  Trash2,
  Edit2,
  ExternalLink,
  Sparkles,
  ChevronDown,
  X,
  Menu
} from 'lucide-react';
import './sheets-hub.css';

interface SheetsHubProps {
  hojas: HojaCotejo[];
  isLoading: boolean;
  currentUser?: { nombre: string; rol: string } | null;
  onOpenSheet: (sheetId: string) => void;
  onCreateSheet: (title: string, tipoProceso?: TipoProcesoCotejo) => Promise<void>;
  onRenameSheet: (sheetId: string, newTitle: string) => Promise<void>;
  onDeleteSheet: (sheetId: string) => Promise<void>;
  onDuplicateSheet: (sheetId: string) => Promise<void>;
}

// Generador de código largo único determinista de 44 caracteres estilo Google Sheets
export function getSheetLongCode(uuid: string): string {
  if (!uuid) return '1OorcHFtZDOQFkIo8vegZlCDs-EBgCeBb_JEu-R_Fjdo';
  try {
    const clean = uuid.replace(/-/g, '');
    let binary = '';
    for (let i = 0; i < clean.length; i += 2) {
      binary += String.fromCharCode(parseInt(clean.substr(i, 2), 16) || 0);
    }
    const b64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const salt = 'ZDOQFkIo8vegZlCDs-EBgCeBb_JEu-R_Fjdo';
    return `1${b64}${salt}`.slice(0, 44);
  } catch {
    return `1${uuid.replace(/-/g, '')}ZDOQFkIo8veg`.slice(0, 44);
  }
}

export default function SheetsHub({
  hojas = [],
  isLoading = false,
  currentUser,
  onOpenSheet,
  onCreateSheet,
  onRenameSheet,
  onDeleteSheet,
  onDuplicateSheet
}: SheetsHubProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'me'>('all');
  const [sortOrder, setSortOrder] = useState<'date' | 'title'>('date');

  // Menú contextual de opciones para un libro específico
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Estado de copiado
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const handleCopyLongCode = (e: React.MouseEvent, sheet: HojaCotejo) => {
    e.stopPropagation();
    const code = getSheetLongCode(sheet.id);
    navigator.clipboard.writeText(code);
    setCopiedCodeId(sheet.id);
    showToast(`Código largo copiado: ${code}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyLink = (e: React.MouseEvent, sheet: HojaCotejo) => {
    e.stopPropagation();
    const code = getSheetLongCode(sheet.id);
    const fullUrl = `${window.location.origin}${window.location.pathname}#d/${code}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Enlace directo copiado al portapapeles');
    setMenuOpenId(null);
  };

  const handleOpenContextMenu = (e: React.MouseEvent, sheetId: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: Math.max(10, rect.right - 220)
    });
    setMenuOpenId(menuOpenId === sheetId ? null : sheetId);
  };

  const handleRename = async (sheet: HojaCotejo) => {
    setMenuOpenId(null);
    const newTitle = prompt('Ingresa el nuevo título del libro:', sheet.titulo);
    if (newTitle && newTitle.trim() && newTitle.trim() !== sheet.titulo) {
      await onRenameSheet(sheet.id, newTitle.trim());
      showToast('Libro renombrado con éxito');
    }
  };

  const handleDelete = async (sheet: HojaCotejo) => {
    setMenuOpenId(null);
    if (confirm(`¿Estás seguro de eliminar el libro "${sheet.titulo}" y todos sus paquetes cotejados?`)) {
      await onDeleteSheet(sheet.id);
      showToast('Libro eliminado');
    }
  };

  const handleDuplicate = async (sheet: HojaCotejo) => {
    setMenuOpenId(null);
    await onDuplicateSheet(sheet.id);
    showToast(`Copia creada de "${sheet.titulo}"`);
  };

  // Filtrado y clasificación de hojas
  const filteredHojas = useMemo(() => {
    let result = [...hojas];

    // Búsqueda por término (título o código largo)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(h => {
        const longCode = getSheetLongCode(h.id).toLowerCase();
        return (
          h.titulo.toLowerCase().includes(q) ||
          (h.descripcion && h.descripcion.toLowerCase().includes(q)) ||
          (h.creadoPor && h.creadoPor.toLowerCase().includes(q)) ||
          longCode.includes(q)
        );
      });
    }

    // Filtro por propietario
    if (ownerFilter === 'me' && currentUser?.nombre) {
      result = result.filter(
        h => h.creadoPor.toLowerCase() === currentUser.nombre.toLowerCase() || h.creadoPor.toLowerCase() === 'yo'
      );
    }

    // Orden
    if (sortOrder === 'title') {
      result.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else {
      result.sort((a, b) => new Date(b.actualizadoEn || b.creadoEn).getTime() - new Date(a.actualizadoEn || a.creadoEn).getTime());
    }

    return result;
  }, [hojas, searchTerm, ownerFilter, sortOrder, currentUser]);

  // Agrupación por fechas (Hoy, Últimos 7 días, Últimos 30 días, Anteriores)
  const groupedHojas = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: HojaCotejo[] } = {
      Hoy: [],
      'Últimos 7 días': [],
      'Últimos 30 días': [],
      Anteriores: []
    };

    filteredHojas.forEach(h => {
      const t = new Date(h.actualizadoEn || h.creadoEn).getTime();
      if (t >= todayStart) {
        groups.Hoy.push(h);
      } else if (t >= sevenDaysAgo) {
        groups['Últimos 7 días'].push(h);
      } else if (t >= thirtyDaysAgo) {
        groups['Últimos 30 días'].push(h);
      } else {
        groups.Anteriores.push(h);
      }
    });

    return groups;
  }, [filteredHojas]);

  // Formateador de fechas estilo Google Sheets
  const formatGoogleDate = (dateStr: string) => {
    if (!dateStr) return 'Reciente';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const activeMenuSheet = hojas.find(h => h.id === menuOpenId);

  return (
    <div className="gsheet-hub-container">
      {/* 1. Header Superior de Google Sheets Hub */}
      <header className="gsheet-hub-header">
        <div className="gsheet-hub-header-left">
          <button type="button" className="gsheet-hub-menu-btn" title="Menú principal">
            <Menu size={20} />
          </button>
          <div className="gsheet-hub-logo-brand" onClick={() => setSearchTerm('')}>
            <div className="gsheet-hub-logo-icon">
              <FileSpreadsheet size={22} />
            </div>
            <span className="gsheet-hub-brand-name">
              <strong>AMEX</strong> Excel
            </span>
          </div>
        </div>

        {/* Barra de Búsqueda Estilo Google */}
        <div className="gsheet-hub-search-bar">
          <div className="gsheet-hub-search-box">
            <Search size={18} className="gsheet-hub-search-icon" />
            <input
              type="text"
              className="gsheet-hub-search-input"
              placeholder="Buscar por título o código largo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="gsheet-hub-search-clear"
                onClick={() => setSearchTerm('')}
                title="Borrar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="gsheet-hub-header-right">
          <button
            type="button"
            className="gsheet-hub-icon-btn"
            onClick={() => onCreateSheet('AMEX WR')}
            title="Crear nueva hoja en blanco"
          >
            <Plus size={20} />
          </button>
          <div
            className="gsheet-hub-avatar"
            title={`Usuario actual: ${currentUser?.nombre || 'Operador Logístico'}`}
          >
            {(currentUser?.nombre || 'AMEX').charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* 2. Sección: Iniciar una nueva hoja de cálculo (Plantillas) */}
      <section className="gsheet-hub-templates-section">
        <div className="gsheet-hub-section-inner">
          <div className="gsheet-hub-templates-header">
            <span className="gsheet-hub-templates-title">Crear una nueva hoja de cálculo</span>
            <button
              type="button"
              className="gsheet-hub-template-gallery-btn"
              onClick={() => onCreateSheet('AMEX WR')}
            >
              <span>Galería de plantillas</span>
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="gsheet-hub-templates-cards">
            {/* Tarjeta 1: En Blanco con el Plus multicolor de Google */}
            <div
              className="gsheet-hub-card-item"
              onClick={() => onCreateSheet('AMEX WR', 'RECEPCION_LINCE')}
            >
              <div className="gsheet-hub-card-preview blank">
                <svg className="google-plus-icon" viewBox="0 0 36 36">
                  <path fill="#4285F4" d="M16 16v14h4V16h14v-4H20V0h-4v12H2v4h14z" />
                  <path fill="#34A853" d="M16 16H2v4h14v14h4V20h14v-4H20V0h-4v16z" opacity="0.85" />
                  <path fill="#FBBC05" d="M16 16v14h4V16h14v-4H20V0h-4v12H2v4h14z" opacity="0.7" />
                  <path fill="#EA4335" d="M16 16V0h4v16h14v4H20v14h-4V20H2v-4h14z" opacity="0.6" />
                </svg>
              </div>
              <span className="gsheet-hub-card-label">En blanco</span>
            </div>

            {/* Tarjeta 2: Manifiesto Desconsolidación */}
            <div
              className="gsheet-hub-card-item"
              onClick={() => onCreateSheet('Manifiesto Desconsolidación', 'RECEPCION_LINCE')}
            >
              <div className="gsheet-hub-card-preview">
                <div className="template-mock-grid">
                  <div className="template-mock-header" />
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '40%' }} />
                    <div className="template-mock-cell" style={{ width: '30%', background: '#c6f6d5' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '40%' }} />
                    <div className="template-mock-cell" style={{ width: '30%', background: '#c6f6d5' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '40%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
              <span className="gsheet-hub-card-label">Manifiesto Desconsolidación</span>
            </div>

            {/* Tarjeta 3: Cotejo Lince Express */}
            <div
              className="gsheet-hub-card-item"
              onClick={() => onCreateSheet('Cotejo Lince Express', 'RECEPCION_LINCE')}
            >
              <div className="gsheet-hub-card-preview">
                <div className="template-mock-grid">
                  <div className="template-mock-header" style={{ background: '#1a73e8' }} />
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '20%' }} />
                    <div className="template-mock-cell" style={{ width: '50%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '20%' }} />
                    <div className="template-mock-cell" style={{ width: '50%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
              <span className="gsheet-hub-card-label">Cotejo Lince Express</span>
            </div>

            {/* Tarjeta 4: Recepción Miami WMS */}
            <div
              className="gsheet-hub-card-item"
              onClick={() => onCreateSheet('Recepción Miami WMS', 'RECEPCION_MIAMI')}
            >
              <div className="gsheet-hub-card-preview">
                <div className="template-mock-grid">
                  <div className="template-mock-header" style={{ background: '#ea4335' }} />
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '35%' }} />
                    <div className="template-mock-cell" style={{ width: '35%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '35%' }} />
                    <div className="template-mock-cell" style={{ width: '35%' }} />
                    <div className="template-mock-cell" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
              <span className="gsheet-hub-card-label">Recepción Miami WMS</span>
            </div>

            {/* Tarjeta 5: Inventario Central */}
            <div
              className="gsheet-hub-card-item"
              onClick={() => onCreateSheet('Inventario Bultos Central', 'INVENTARIO_ANAQUEL')}
            >
              <div className="gsheet-hub-card-preview">
                <div className="template-mock-grid">
                  <div className="template-mock-header" style={{ background: '#fbbc05' }} />
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '45%' }} />
                    <div className="template-mock-cell" style={{ width: '55%' }} />
                  </div>
                  <div className="template-mock-row">
                    <div className="template-mock-cell" style={{ width: '45%' }} />
                    <div className="template-mock-cell" style={{ width: '55%' }} />
                  </div>
                </div>
              </div>
              <span className="gsheet-hub-card-label">Inventario Central</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección: Hojas de cálculo recientes */}
      <section className="gsheet-hub-recents-section">
        <div className="gsheet-hub-section-inner">
          <div className="gsheet-hub-recents-bar">
            <span className="gsheet-hub-group-heading">
              {searchTerm ? `Resultados para "${searchTerm}" (${filteredHojas.length})` : 'Hojas de cálculo recientes'}
            </span>

            <div className="gsheet-hub-filters">
              {/* Filtro Propietario */}
              <button
                type="button"
                className="gsheet-hub-dropdown-btn"
                onClick={() => setOwnerFilter(ownerFilter === 'all' ? 'me' : 'all')}
                title="Filtrar por propietario"
              >
                <span>{ownerFilter === 'all' ? 'De cualquier propietario' : 'De mi propiedad'}</span>
                <ChevronDown size={14} />
              </button>

              {/* Orden */}
              <button
                type="button"
                className="gsheet-hub-dropdown-btn"
                onClick={() => setSortOrder(sortOrder === 'date' ? 'title' : 'date')}
                title="Ordenar libros"
              >
                <ArrowUpDown size={14} />
                <span>{sortOrder === 'date' ? 'Última modificación' : 'Título (A-Z)'}</span>
              </button>

              {/* Toggle de Vista: Lista / Cuadrícula */}
              <button
                type="button"
                className={`gsheet-hub-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista de lista"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                className={`gsheet-hub-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista de cuadrícula"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#5f6368' }}>
              <FileSpreadsheet size={36} className="text-slate-300 mx-auto animate-pulse mb-2" />
              <p style={{ fontSize: '14px' }}>Cargando libros de cálculo...</p>
            </div>
          ) : filteredHojas.length === 0 ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px dashed #dadce0',
                margin: '20px 0'
              }}
            >
              <FileSpreadsheet size={42} className="text-slate-300 mx-auto mb-2" />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#202124', margin: '0 0 6px 0' }}>
                No se encontraron libros de cálculo
              </p>
              <p style={{ fontSize: '13px', color: '#5f6368', margin: '0 0 16px 0' }}>
                {searchTerm
                  ? 'Intenta con otro término o borra la búsqueda.'
                  : 'Crea tu primera hoja de cálculo en blanco o con una plantilla.'}
              </p>
              <button
                type="button"
                onClick={() => onCreateSheet('AMEX WR')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0f9d58',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Crear libro AMEX WR</span>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Vista en Lista (Exacta a la Imagen 1) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(groupedHojas).map(([groupName, itemsInGroup]) => {
                if (itemsInGroup.length === 0) return null;

                return (
                  <div key={groupName}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#5f6368',
                        padding: '6px 0',
                        marginBottom: '4px'
                      }}
                    >
                      {groupName}
                    </div>

                    <table className="gsheet-hub-table">
                      <thead className="gsheet-hub-table-head">
                        <tr>
                          <th style={{ width: '55%' }}>Título</th>
                          <th style={{ width: '20%' }}>Propietario</th>
                          <th style={{ width: '20%' }}>Última apertura</th>
                          <th style={{ width: '5%', textAlign: 'right' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsInGroup.map(sheet => {
                          const longCode = getSheetLongCode(sheet.id);

                          return (
                            <tr
                              key={sheet.id}
                              className="gsheet-hub-row"
                              onClick={() => onOpenSheet(sheet.id)}
                            >
                              <td className="gsheet-hub-title-cell">
                                <FileSpreadsheet className="gsheet-hub-doc-icon" />
                                <div className="gsheet-hub-doc-meta">
                                  <div className="gsheet-hub-doc-title-line">
                                    <span className="gsheet-hub-doc-name">{sheet.titulo}</span>
                                    <span title="Libro colaborativo" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      <Users size={14} className="gsheet-hub-shared-icon" />
                                    </span>
                                  </div>

                                  {/* Badge del Código Largo de Google Sheets con botón copiar */}
                                  <div
                                    className="gsheet-hub-long-code-badge"
                                    onClick={e => handleCopyLongCode(e, sheet)}
                                    title="Código largo único del libro (clic para copiar)"
                                  >
                                    <span className="code-text">{longCode}</span>
                                    <button type="button" className="gsheet-hub-copy-code-btn">
                                      {copiedCodeId === sheet.id ? <Check size={11} /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="gsheet-hub-owner-cell">
                                {sheet.creadoPor === currentUser?.nombre ? 'yo' : sheet.creadoPor || 'me'}
                              </td>

                              <td className="gsheet-hub-time-cell">
                                {formatGoogleDate(sheet.actualizadoEn || sheet.creadoEn)}
                              </td>

                              <td className="gsheet-hub-actions-cell">
                                <button
                                  type="button"
                                  className="gsheet-hub-more-btn"
                                  onClick={e => handleOpenContextMenu(e, sheet.id)}
                                  title="Más opciones del libro"
                                >
                                  <MoreVertical size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vista en Cuadrícula (Cards) */
            <div className="gsheet-hub-grid">
              {filteredHojas.map(sheet => {
                const longCode = getSheetLongCode(sheet.id);

                return (
                  <div
                    key={sheet.id}
                    className="gsheet-hub-grid-card"
                    onClick={() => onOpenSheet(sheet.id)}
                  >
                    <div className="gsheet-hub-grid-thumbnail">
                      <div className="template-mock-grid">
                        <div className="template-mock-header" />
                        <div className="template-mock-row">
                          <div className="template-mock-cell" style={{ width: '40%' }} />
                          <div className="template-mock-cell" style={{ width: '60%' }} />
                        </div>
                        <div className="template-mock-row">
                          <div className="template-mock-cell" style={{ width: '40%' }} />
                          <div className="template-mock-cell" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="gsheet-hub-grid-details">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <FileSpreadsheet size={16} className="text-emerald-600 flex-shrink-0" />
                          <span className="gsheet-hub-grid-title">{sheet.titulo}</span>
                        </div>
                        <button
                          type="button"
                          className="gsheet-hub-more-btn"
                          onClick={e => handleOpenContextMenu(e, sheet.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>

                      <div
                        className="gsheet-hub-long-code-badge"
                        style={{ marginTop: '4px' }}
                        onClick={e => handleCopyLongCode(e, sheet)}
                      >
                        <span className="code-text" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {longCode}
                        </span>
                        {copiedCodeId === sheet.id ? <Check size={11} /> : <Copy size={11} />}
                      </div>

                      <span className="gsheet-hub-grid-time">
                        {formatGoogleDate(sheet.actualizadoEn || sheet.creadoEn)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Menú Contextual Flotante de Acciones */}
      {menuOpenId && activeMenuSheet && (
        <div
          ref={menuRef}
          className="gsheet-hub-context-menu"
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <button
            type="button"
            className="gsheet-hub-menu-option"
            onClick={() => {
              setMenuOpenId(null);
              onOpenSheet(activeMenuSheet.id);
            }}
          >
            <ExternalLink size={15} />
            <span>Abrir hoja de cálculo</span>
          </button>

          <button
            type="button"
            className="gsheet-hub-menu-option"
            onClick={e => handleCopyLongCode(e, activeMenuSheet)}
          >
            <Copy size={15} />
            <span>Copiar código largo</span>
          </button>

          <button
            type="button"
            className="gsheet-hub-menu-option"
            onClick={e => handleCopyLink(e, activeMenuSheet)}
          >
            <ExternalLink size={15} />
            <span>Copiar enlace para compartir</span>
          </button>

          <div className="gsheet-hub-menu-divider" />

          <button
            type="button"
            className="gsheet-hub-menu-option"
            onClick={() => handleRename(activeMenuSheet)}
          >
            <Edit2 size={15} />
            <span>Cambiar nombre</span>
          </button>

          <button
            type="button"
            className="gsheet-hub-menu-option"
            onClick={() => handleDuplicate(activeMenuSheet)}
          >
            <Copy size={15} />
            <span>Crear una copia</span>
          </button>

          <div className="gsheet-hub-menu-divider" />

          <button
            type="button"
            className="gsheet-hub-menu-option danger"
            onClick={() => handleDelete(activeMenuSheet)}
          >
            <Trash2 size={15} />
            <span>Eliminar</span>
          </button>
        </div>
      )}

      {/* Toast Flotante de Notificaciones */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#323232',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '4px',
            fontSize: '13.5px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
