'use client';

import React, { useState, useMemo } from 'react';
import { ActaEntregaData, ActaHistorialItem, LogoStyle } from '../types';
import { Cliente, Paquete } from '@/types';

interface ActaControlPanelProps {
  formData: ActaEntregaData;
  clientes: Cliente[];
  rawPasteText: string;
  singlePackageInput: string;
  isExporting: boolean;
  historial: ActaHistorialItem[];
  isHistorialOpen: boolean;
  onSetRawPasteText: (val: string) => void;
  onSetSinglePackageInput: (val: string) => void;
  onUpdateField: <K extends keyof ActaEntregaData>(field: K, val: ActaEntregaData[K]) => void;
  onSelectCliente: (cliente: Cliente) => void;
  onLoadWarehousePackages: () => void;
  onAddSinglePackage: () => void;
  onProcessPasteText: () => void;
  onRemovePackage: (index: number) => void;
  onClearPackages: () => void;
  onResetForm: () => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onOpenHistorial: (open: boolean) => void;
  onRestoreHistorial: (item: ActaHistorialItem) => void;
  onDeleteHistorialItem: (id: string, e: React.MouseEvent) => void;
}

export default function ActaControlPanel({
  formData,
  clientes,
  rawPasteText,
  singlePackageInput,
  isExporting,
  historial,
  isHistorialOpen,
  onSetRawPasteText,
  onSetSinglePackageInput,
  onUpdateField,
  onSelectCliente,
  onLoadWarehousePackages,
  onAddSinglePackage,
  onProcessPasteText,
  onRemovePackage,
  onClearPackages,
  onResetForm,
  onPrint,
  onExportPdf,
  onExportDocx,
  onOpenHistorial,
  onRestoreHistorial,
  onDeleteHistorialItem
}: ActaControlPanelProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Filtrado de clientes para autocompletar
  const filteredClientes = useMemo(() => {
    if (!clientSearch.trim()) return [];
    const q = clientSearch.toLowerCase();
    return clientes.filter(c => {
      const full = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
      const dni = (c.documentoIdentidad || '').toLowerCase();
      const casillero = (c.codigoCasillero || '').toLowerCase();
      return full.includes(q) || dni.includes(q) || casillero.includes(q);
    }).slice(0, 8);
  }, [clientes, clientSearch]);

  const validPkgsCount = (formData.paquetes || []).length;

  return (
    <div className="acta-control-panel">
      {/* Barra de Acciones Principales */}
      <div className="acta-panel-header">
        <div>
          <h2 className="acta-panel-title">
            <i className="fa-solid fa-file-signature text-sky-400"></i> Formato de Entrega
          </h2>
          <p className="acta-panel-subtitle">Genera e imprime el acta de recepción oficial con logo AMEX</p>
        </div>

        <div className="acta-panel-actions">
          <button
            type="button"
            className="acta-btn-action is-print"
            onClick={onPrint}
            title="Imprimir documento directamente en A4"
          >
            <i className="fa-solid fa-print"></i> Imprimir A4
          </button>

          <button
            type="button"
            className="acta-btn-action is-pdf"
            onClick={onExportPdf}
            disabled={isExporting}
            title="Descargar archivo PDF vectorial"
          >
            <i className="fa-solid fa-file-pdf"></i> PDF
          </button>

          <button
            type="button"
            className="acta-btn-action is-docx"
            onClick={onExportDocx}
            disabled={isExporting}
            title="Descargar en formato Word (.docx) editable"
          >
            <i className="fa-solid fa-file-word"></i> Word (.docx)
          </button>

          <button
            type="button"
            className="acta-btn-action is-history"
            onClick={() => onOpenHistorial(true)}
            title="Ver actas generadas recientemente"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            {historial.length > 0 && <span className="acta-badge-counter">{historial.length}</span>}
          </button>

          <button
            type="button"
            className="acta-btn-action is-secondary"
            onClick={onResetForm}
            title="Limpiar formulario"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      <div className="acta-panel-body">
        {/* BLOQUE 1: DATOS DEL ENCABEZADO */}
        <div className="acta-card-section">
          <h3 className="acta-card-title">
            <i className="fa-solid fa-heading"></i> 1. Datos Principales
          </h3>

          <div className="acta-form-grid">
            <div className="acta-field-group">
              <label className="acta-label">Fecha del Documento</label>
              <input
                type="text"
                className="acta-input"
                value={formData.fecha}
                onChange={e => onUpdateField('fecha', e.target.value)}
                placeholder="Ej. Sep 16, 2026"
              />
            </div>

            <div className="acta-field-group">
              <label className="acta-label">Remitente</label>
              <input
                type="text"
                className="acta-input"
                value={formData.remitente}
                onChange={e => onUpdateField('remitente', e.target.value)}
                placeholder="AMEX COURRIER"
              />
            </div>
          </div>

          {/* Destinatario con Autocompletado */}
          <div className="acta-field-group mt-3" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="acta-label">Destinatario (Cliente)</label>
              <button
                type="button"
                className="acta-link-btn"
                onClick={onLoadWarehousePackages}
                title="Carga los códigos WR que este cliente tiene actualmente en almacén"
              >
                <i className="fa-solid fa-boxes-packing"></i> Cargar paquetes del almacén
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="acta-input font-bold"
                value={formData.destinatario}
                onChange={e => {
                  onUpdateField('destinatario', e.target.value);
                  setClientSearch(e.target.value);
                  setShowClientSuggestions(true);
                }}
                onFocus={() => setShowClientSuggestions(true)}
                placeholder="Escribe el nombre del cliente o busca..."
              />

              {formData.destinatario && (
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                  onClick={() => onUpdateField('destinatario', '')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sugerencias de clientes desplegables */}
            {showClientSuggestions && filteredClientes.length > 0 && (
              <div className="acta-autocomplete-menu">
                <div className="acta-autocomplete-header">
                  <span>Clientes coincidentes ({filteredClientes.length})</span>
                  <button type="button" onClick={() => setShowClientSuggestions(false)}>✕</button>
                </div>
                {filteredClientes.map(c => (
                  <div
                    key={c.id}
                    className="acta-autocomplete-item"
                    onClick={() => {
                      onSelectCliente(c);
                      setShowClientSuggestions(false);
                    }}
                  >
                    <div className="font-bold text-white">
                      {c.nombre} {c.apellido || ''}
                    </div>
                    <div className="text-xs text-slate-400">
                      DNI: {c.documentoIdentidad || 'S/D'} • Casillero: {c.codigoCasillero || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE 2: PAQUETES (CÓDIGOS DE RECIBO WR) */}
        <div className="acta-card-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 className="acta-card-title" style={{ margin: 0 }}>
              <i className="fa-solid fa-boxes-stacked"></i> 2. Códigos de Paquetes
            </h3>
            <span className="acta-counter-pill">
              {validPkgsCount} {validPkgsCount === 1 ? 'paquete' : 'paquetes'}
            </span>
          </div>

          {/* Pegado Masivo Rápido */}
          <div className="acta-field-group">
            <label className="acta-label">
              Pegado rápido multilínea (Códigos WR o Trackings)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea
                className="acta-textarea"
                rows={2}
                value={rawPasteText}
                onChange={e => onSetRawPasteText(e.target.value)}
                placeholder="Pega aquí múltiples códigos WR (separados por renglones)..."
              />
              <button
                type="button"
                className="acta-btn-secondary"
                onClick={onProcessPasteText}
                style={{ height: '58px', minWidth: '95px' }}
                disabled={!rawPasteText.trim()}
              >
                <i className="fa-solid fa-paste"></i> Agregar
              </button>
            </div>
          </div>

          {/* Ingreso individual */}
          <div className="acta-field-group mt-3">
            <label className="acta-label">O ingresa un código manualmente:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="acta-input uppercase"
                value={singlePackageInput}
                onChange={e => onSetSinglePackageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddSinglePackage();
                  }
                }}
                placeholder="Ej. WR000459980"
              />
              <button
                type="button"
                className="acta-btn-secondary"
                onClick={onAddSinglePackage}
                disabled={!singlePackageInput.trim()}
              >
                <i className="fa-solid fa-plus"></i> Añadir
              </button>
            </div>
          </div>

          {/* Lista de Códigos agregados con chips */}
          <div className="acta-chips-container mt-3">
            {formData.paquetes.map((code, idx) => (
              <span key={`${code}-${idx}`} className="acta-pkg-chip">
                <code>{code}</code>
                <button
                  type="button"
                  className="acta-chip-del"
                  onClick={() => onRemovePackage(idx)}
                  title="Eliminar este paquete"
                >
                  ✕
                </button>
              </span>
            ))}

            {formData.paquetes.length > 0 && (
              <button
                type="button"
                className="acta-btn-clear-chips"
                onClick={onClearPackages}
                title="Limpiar todos los paquetes"
              >
                Vaciar lista
              </button>
            )}
          </div>
        </div>

        {/* BLOQUE 3: DATOS DE RECEPCIÓN (OPCIONALES) */}
        <div className="acta-card-section">
          <h3 className="acta-card-title">
            <i className="fa-solid fa-signature"></i> 3. Datos de Recepción (Llenado en pantalla o dejar en blanco para mano)
          </h3>

          <div className="acta-form-grid">
            <div className="acta-field-group">
              <label className="acta-label">Nombre de quien recibe</label>
              <input
                type="text"
                className="acta-input"
                value={formData.recibidoPorNombre}
                onChange={e => onUpdateField('recibidoPorNombre', e.target.value)}
                placeholder="Nombre completo (o dejar vacío)"
              />
            </div>

            <div className="acta-field-group">
              <label className="acta-label">Fecha de recepción</label>
              <input
                type="text"
                className="acta-input"
                value={formData.recibidoPorFecha}
                onChange={e => onUpdateField('recibidoPorFecha', e.target.value)}
                placeholder="Ej. 16/09/2026"
              />
            </div>

            <div className="acta-field-group">
              <label className="acta-label">Hora de recepción</label>
              <input
                type="text"
                className="acta-input"
                value={formData.recibidoPorHora}
                onChange={e => onUpdateField('recibidoPorHora', e.target.value)}
                placeholder="Ej. 10:30 AM"
              />
            </div>

            <div className="acta-field-group">
              <label className="acta-label">Estilo de Logo en Hoja</label>
              <select
                className="acta-select"
                value={formData.logoStyle || 'clean'}
                onChange={e => onUpdateField('logoStyle', e.target.value as LogoStyle)}
              >
                <option value="clean">Limpio (Fondo transparente - Ideal impresión)</option>
                <option value="badge">Insignia AMEX (Recortada)</option>
                <option value="original">Original Completo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Historial de Actas */}
      {isHistorialOpen && (
        <div className="acta-modal-backdrop" onClick={() => onOpenHistorial(false)}>
          <div className="acta-modal-content" onClick={e => e.stopPropagation()}>
            <div className="acta-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                <i className="fa-solid fa-clock-rotate-left text-sky-400"></i> Historial de Actas Guardadas
              </h3>
              <button
                type="button"
                onClick={() => onOpenHistorial(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="acta-modal-body">
              {historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  No hay actas guardadas en el historial reciente.
                </div>
              ) : (
                <div className="acta-historial-list">
                  {historial.map(item => (
                    <div
                      key={item.id}
                      className="acta-historial-row"
                      onClick={() => onRestoreHistorial(item)}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                          {item.destinatario || 'Sin destinatario'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Fecha: {item.fecha} • {item.paquetes?.length || 0} paquetes
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="acta-btn-xs-load">Cargar</span>
                        <button
                          type="button"
                          className="acta-btn-xs-del"
                          onClick={e => onDeleteHistorialItem(item.id, e)}
                          title="Eliminar registro"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
