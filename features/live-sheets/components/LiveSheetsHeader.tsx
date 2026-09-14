import React from 'react';
import {
  FileSpreadsheet,
  Star,
  CloudCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { Collaborator, SheetStats } from '../types';

interface LiveSheetsHeaderProps {
  activeHojaId: string;
  docTitle: string;
  setDocTitle: (val: string) => void;
  onTitleBlur: () => void;
  isStarred: boolean;
  setIsStarred: (val: boolean) => void;
  realtimeStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  collaborators: Collaborator[];
  stats: SheetStats;
  onBackToHub: () => void;
  onExportExcel: () => void;
  onOpenPasteModal: () => void;
  onFocusBarcodeInput: () => void;
  onLoadFromDatabase: () => void;
  onResetScans: () => void;
}

export function LiveSheetsHeader({
  activeHojaId,
  docTitle,
  setDocTitle,
  onTitleBlur,
  isStarred,
  setIsStarred,
  realtimeStatus,
  collaborators,
  stats,
  onBackToHub,
  onExportExcel,
  onOpenPasteModal,
  onFocusBarcodeInput,
  onLoadFromDatabase,
  onResetScans
}: LiveSheetsHeaderProps) {
  return (
    <>
      {/* 1. Header Superior de Amex Excel */}
      <header className="gsheet-header-top">
        <div className="gsheet-header-left">
          {onBackToHub && (
            <button
              type="button"
              className="gsheet-back-to-hub-btn"
              onClick={onBackToHub}
              title="Volver a Amex Excel (Galería de libros)"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '5px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#3c4043',
                fontSize: '12.5px',
                fontWeight: 600,
                marginRight: '6px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f3f4')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ArrowLeft size={16} />
              <span>Amex Excel</span>
            </button>
          )}

          <div
            className="gsheet-logo-icon"
            onClick={onBackToHub}
            style={{ cursor: 'pointer' }}
            title="Página principal de Amex Excel (Volver a todos los libros)"
          >
            <FileSpreadsheet size={20} />
          </div>

          <div className="gsheet-title-meta">
            <div className="gsheet-title-row">
              <input
                type="text"
                className="gsheet-doc-title"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                onBlur={onTitleBlur}
                title="Renombrar documento"
              />
              <button
                type="button"
                className="gsheet-star-btn"
                onClick={() => setIsStarred(!isStarred)}
                title={isStarred ? 'Destacado' : 'No destacado'}
              >
                <Star size={15} fill={isStarred ? '#fbbc04' : 'none'} color={isStarred ? '#fbbc04' : '#5f6368'} />
              </button>
              <span
                className={`gsheet-sync-badge ${realtimeStatus === 'CONNECTED' ? 'live-synced' : ''}`}
                title="Sincronización en tiempo real con Supabase Realtime"
              >
                <CloudCheck
                  size={14}
                  className={realtimeStatus === 'CONNECTED' ? 'text-emerald-600' : 'text-amber-500'}
                />
                <span>{realtimeStatus === 'CONNECTED' ? 'En vivo' : 'Conectando...'}</span>
              </span>
            </div>

            <div className="gsheet-menu-bar">
              <button type="button" className="gsheet-menu-item" onClick={onExportExcel}>
                Archivo
              </button>
              <button type="button" className="gsheet-menu-item" onClick={onOpenPasteModal}>
                Editar
              </button>
              <button type="button" className="gsheet-menu-item" onClick={onFocusBarcodeInput}>
                Ver
              </button>
              <button type="button" className="gsheet-menu-item" onClick={onLoadFromDatabase}>
                Insertar
              </button>
              <button type="button" className="gsheet-menu-item" onClick={onResetScans}>
                Herramientas
              </button>
              <button
                type="button"
                className="gsheet-menu-item"
                onClick={() => alert('Sistema AMEX WR: Dispara la pistola de códigos directamente sobre la hoja.')}
              >
                Ayuda
              </button>
            </div>
          </div>
        </div>

        <div className="gsheet-header-right">
          {/* Indicador de Colaboradores en Vivo */}
          <div className="gsheet-presence-container">
            <div
              className="gsheet-presence-pill"
              title={
                collaborators.length > 0
                  ? `Colaboradores en vivo: ${collaborators
                      .map(c => `${c.name}${c.isCurrent ? ' (Tú)' : ''}`)
                      .join(', ')}`
                  : 'Conectando con Supabase Realtime...'
              }
            >
              <span
                className={`gsheet-presence-dot ${
                  realtimeStatus === 'CONNECTED'
                    ? 'online'
                    : realtimeStatus === 'CONNECTING'
                    ? 'connecting'
                    : 'offline'
                }`}
              />
              <span className="gsheet-presence-count">
                {collaborators.length} {collaborators.length === 1 ? 'operador' : 'operadores'} en vivo
              </span>

              <div className="gsheet-avatars-cluster">
                {collaborators.map(c => {
                  const initials = c.name
                    .split(' ')
                    .map(w => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={c.id}
                      className="gsheet-avatar-badge"
                      style={{ backgroundColor: c.color }}
                      title={`${c.name} ${c.isCurrent ? '(Tú)' : ''} ${c.activeCell ? `• Celda ${c.activeCell}` : ''}`}
                    >
                      <span>{initials}</span>
                      {c.isCurrent && <span className="gsheet-avatar-you-indicator">★</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="gsheet-stats-pill">
            <span>
              Total: <strong>{stats.total}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="gsheet-stat-tag found">
              <CheckCircle2 size={13} /> Encontrados: <strong>{stats.encontrados}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="gsheet-stat-tag not-found">
              <AlertTriangle size={13} /> Faltantes: <strong>{stats.noEncontrados + stats.pendientes}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sky-700 font-mono">
              <strong>{stats.progreso}%</strong>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
