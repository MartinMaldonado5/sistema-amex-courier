'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RotulosService } from '../services/rotulos.service';
import { getAgencyClass, type RotuloHistorialItem } from '../types';

interface RotulosHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadIntoEditor: (item: RotuloHistorialItem) => void;
  currentUser?: { nombre?: string; email?: string; rol?: string } | null;
}

export const RotulosHistoryModal: React.FC<RotulosHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadIntoEditor,
  currentUser
}) => {
  const [items, setItems] = useState<RotuloHistorialItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('TODAS');
  const [selectedFecha, setSelectedFecha] = useState<'hoy' | '7dias' | '30dias' | 'todos'>('hoy');
  const [onlyMyPrints, setOnlyMyPrints] = useState<boolean>(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await RotulosService.fetchPrintHistory({
        search: searchTerm,
        agencia: selectedAgency,
        fecha: selectedFecha,
        operadorEmail: onlyMyPrints ? currentUser?.email : undefined,
        limit: 150
      });
      setItems(data);
    } catch (err) {
      console.error('Error cargando historial de rótulos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedAgency, selectedFecha, onlyMyPrints, currentUser?.email]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Agrupar items por fecha legible
  const groupedItems = useMemo(() => {
    const groups: Record<string, RotuloHistorialItem[]> = {};
    for (const item of items) {
      const dateKey = new Date(item.creadoEn).toLocaleDateString('es-PE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    }
    return groups;
  }, [items]);

  if (!isOpen) return null;

  return (
    <div className="rotulo-history-modal-overlay" onClick={onClose}>
      <div
        className="rotulo-history-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotulo-history-title"
      >
        {/* Header */}
        <div className="rotulo-history-modal-header">
          <div className="rotulo-history-title-box">
            <div className="rotulo-history-icon-circle">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="rotulo-history-title" className="rotulo-history-title">
                  Historial de Rótulos Emitidos
                </h2>
                <span className="rotulo-history-count-badge">
                  {items.length} {items.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <p className="rotulo-history-subtitle">
                Auditoría en tiempo real de impresiones, descargas de PDF y recuperación inmediata al editor.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="rotulo-history-close-btn"
            onClick={onClose}
            title="Cerrar modal (Esc)"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="rotulo-history-filters-bar">
          <div className="rotulo-history-search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              className="rotulo-history-search-input"
              placeholder="Buscar por cliente, DNI, teléfono, destino, siglas o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Limpiar búsqueda"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>

          <div className="rotulo-history-filter-group">
            {/* Filtro Agencia */}
            <div className="filter-select-wrapper">
              <label className="filter-label">Agencia:</label>
              <select
                className="filter-select"
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
              >
                <option value="TODAS">Todas las agencias</option>
                <option value="SHALOM">Shalom</option>
                <option value="OLVA">Olva Courier</option>
                <option value="CRUZ DEL SUR">Cruz del Sur</option>
                <option value="MARVISUR">Marvisur</option>
                <option value="OTRA">Otras agencias</option>
              </select>
            </div>

            {/* Filtro Rango de Fecha */}
            <div className="filter-select-wrapper">
              <label className="filter-label">Período:</label>
              <select
                className="filter-select"
                value={selectedFecha}
                onChange={(e) => setSelectedFecha(e.target.value as any)}
              >
                <option value="hoy">Hoy</option>
                <option value="7dias">Últimos 7 días</option>
                <option value="30dias">Últimos 30 días</option>
                <option value="todos">Todo el historial</option>
              </select>
            </div>

            {/* Switch Mis Impresiones */}
            {currentUser?.email && (
              <label className="filter-checkbox-label" title="Filtrar solo los rótulos impresos por mi cuenta">
                <input
                  type="checkbox"
                  checked={onlyMyPrints}
                  onChange={(e) => setOnlyMyPrints(e.target.checked)}
                />
                <span>Solo mis impresiones</span>
              </label>
            )}

            {/* Botón Refrescar */}
            <button
              type="button"
              className="btn-filter-refresh"
              onClick={loadHistory}
              disabled={isLoading}
              title="Actualizar historial"
            >
              <i className={`fa-solid fa-arrows-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Contenido / Listado */}
        <div className="rotulo-history-body">
          {isLoading ? (
            <div className="rotulo-history-loading">
              <div className="history-spinner"></div>
              <p>Consultando historial corporativo en Supabase...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rotulo-history-empty">
              <div className="empty-icon-circle">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h3 className="empty-title">No se encontraron rótulos impresos</h3>
              <p className="empty-desc">
                {searchTerm || selectedAgency !== 'TODAS' || selectedFecha !== 'todos'
                  ? 'Prueba modificando los filtros de búsqueda o fecha seleccionados.'
                  : 'Cada vez que imprimas o descargues un PDF en el Módulo 8, se guardará automáticamente aquí con fecha, cliente y operador.'}
              </p>
            </div>
          ) : (
            <div className="rotulo-history-list">
              {Object.entries(groupedItems).map(([dateLabel, groupItems]) => (
                <div key={dateLabel} className="history-date-group">
                  <div className="history-date-header">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{dateLabel}</span>
                    <span className="date-group-count">({groupItems.length})</span>
                  </div>

                  <div className="history-cards-grid">
                    {groupItems.map((item) => {
                      const agencyClass = getAgencyClass(item.agencia);
                      const cleanPhone = (item.destinatarioTelefono || '').replace(/\D/g, '');
                      const timeStr = new Date(item.creadoEn).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div key={item.id} className="history-card">
                          <div className="card-top-row">
                            <span className={`history-agency-badge ${agencyClass}`}>
                              {item.agencia === 'OTRA' && item.agenciaOtra ? item.agenciaOtra : item.agencia}
                            </span>

                            <div className="card-meta-right">
                              <span className="card-action-badge" title={`Acción: ${item.tipoAccion}`}>
                                {item.tipoAccion === 'DESCARGA_PDF' ? (
                                  <>
                                    <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444' }}></i> PDF
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-print" style={{ color: '#10b981' }}></i> Impreso
                                  </>
                                )}
                              </span>
                              <span className="card-time">{timeStr}</span>
                            </div>
                          </div>

                          <div className="card-main-content">
                            <h4 className="card-destinatario-name" title={item.destinatarioNombre}>
                              {item.destinatarioNombre}
                            </h4>

                            <div className="card-sub-info">
                              {item.destinatarioDni && (
                                <span className="sub-info-pill">
                                  <i className="fa-regular fa-id-card"></i> DNI: {item.destinatarioDni}
                                </span>
                              )}
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/51${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="sub-info-pill whatsapp-link"
                                  title="Abrir WhatsApp"
                                >
                                  <i className="fa-brands fa-whatsapp"></i> {cleanPhone}
                                </a>
                              )}
                              {item.destino && (
                                <span className="sub-info-pill destino-pill">
                                  <i className="fa-solid fa-location-dot"></i> {item.destino}
                                </span>
                              )}
                            </div>

                            <div className="card-bulto-row">
                              <span className="bulto-text">
                                <i className="fa-solid fa-boxes-packing"></i>{' '}
                                {item.observacion || `Rótulo ${item.numeroRotulo}/${item.cantidadRotulos}`}
                              </span>
                              {item.siglas && (
                                <span className="siglas-badge">[{item.siglas}]</span>
                              )}
                            </div>
                          </div>

                          <div className="card-footer-row">
                            <span className="operator-signature" title={`Operador: ${item.operadorEmail || 'AMEX'}`}>
                              <i className="fa-solid fa-user-check"></i> {item.operadorNombre || 'AMEX Operador'}
                            </span>

                            <button
                              type="button"
                              className="btn-card-load-editor"
                              onClick={() => onLoadIntoEditor(item)}
                              title="Cargar estos datos en el editor de rótulos activo"
                            >
                              <i className="fa-solid fa-arrow-turn-down"></i>
                              <span>Cargar al Editor</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rotulo-history-modal-footer">
          <div className="footer-legend">
            <span>
              <i className="fa-solid fa-shield-halved" style={{ color: '#38bdf8' }}></i> Registro auditado en Supabase Cloud
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-history-close" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
