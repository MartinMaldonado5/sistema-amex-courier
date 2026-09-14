import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Edit2, Copy, Trash2 } from 'lucide-react';
import { HojaCotejo } from '@/types';
import { SheetStats, SelectionStats } from '../types';

interface LiveSheetsBottomBarProps {
  hojas: HojaCotejo[];
  activeHojaId: string;
  setActiveHojaId: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet?: (sheetId: string, newName: string) => void;
  onDuplicateSheet?: (sheetId: string) => void;
  onDeleteSheet?: (sheetId: string) => void;
  totalRows: number;
  stats: SheetStats;
  selectionStats?: SelectionStats;
}

function formatStatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  if (Math.abs(val - Math.round(val)) < 0.0001) {
    return Math.round(val).toLocaleString();
  }
  return parseFloat(val.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function LiveSheetsBottomBar({
  hojas,
  activeHojaId,
  setActiveHojaId,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
  totalRows,
  stats,
  selectionStats
}: LiveSheetsBottomBarProps) {
  const [menuSheetId, setMenuSheetId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuSheetId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (sheet: HojaCotejo) => {
    setEditingSheetId(sheet.id);
    setEditValue(sheet.nombreHoja || sheet.titulo || 'Hoja');
    setMenuSheetId(null);
  };

  const handleFinishRename = (sheetId: string) => {
    if (editValue.trim() && onRenameSheet) {
      onRenameSheet(sheetId, editValue.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <footer className="gsheet-bottom-bar">
      <div className="gsheet-bottom-left">
        <button
          type="button"
          className="gsheet-add-tab-btn"
          onClick={onAddSheet}
          title="Añadir nueva hoja a este libro"
        >
          <Plus size={16} />
        </button>

        {hojas.map((h, idx) => {
          const isActive = h.id === activeHojaId;
          const isMenuOpen = menuSheetId === h.id;
          const isEditing = editingSheetId === h.id;
          const displayName = h.nombreHoja || h.titulo || `Hoja ${idx + 1}`;

          return (
            <div
              key={h.id}
              className={`gsheet-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (!isEditing) setActiveHojaId(h.id);
              }}
              onDoubleClick={e => {
                e.stopPropagation();
                handleStartRename(h);
              }}
              title="Doble clic para renombrar"
            >
              {isEditing ? (
                <input
                  type="text"
                  className="gsheet-tab-inline-input"
                  value={editValue}
                  autoFocus
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleFinishRename(h.id);
                    if (e.key === 'Escape') setEditingSheetId(null);
                  }}
                  onBlur={() => handleFinishRename(h.id)}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span>{displayName}</span>
              )}

              {/* Botón de opciones de pestaña */}
              <button
                type="button"
                className="gsheet-tab-options-btn"
                onClick={e => {
                  e.stopPropagation();
                  setMenuSheetId(isMenuOpen ? null : h.id);
                }}
                title="Opciones de la hoja"
              >
                <ChevronDown size={12} />
              </button>

              {/* Menú desplegable contextual de la pestaña */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="gsheet-tab-dropdown"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="gsheet-tab-dropdown-item"
                    onClick={() => handleStartRename(h)}
                  >
                    <Edit2 size={13} />
                    <span>Renombrar</span>
                  </button>

                  {onDuplicateSheet && (
                    <button
                      type="button"
                      className="gsheet-tab-dropdown-item"
                      onClick={() => {
                        setMenuSheetId(null);
                        onDuplicateSheet(h.id);
                      }}
                    >
                      <Copy size={13} />
                      <span>Duplicar</span>
                    </button>
                  )}

                  {onDeleteSheet && hojas.length > 1 && (
                    <button
                      type="button"
                      className="gsheet-tab-dropdown-item danger"
                      onClick={() => {
                        setMenuSheetId(null);
                        onDeleteSheet(h.id);
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="gsheet-bottom-right">
        {selectionStats && selectionStats.count > 0 ? (
          <div className="gsheet-stats-excel-bar">
            {selectionStats.hasNumbers && (
              <span className="gsheet-stat-item">
                Average: <strong>{formatStatNumber(selectionStats.average)}</strong>
              </span>
            )}
            <span className="gsheet-stat-item">
              Count: <strong>{selectionStats.count}</strong>
            </span>
            {selectionStats.hasNumbers && (
              <span className="gsheet-stat-item">
                Sum: <strong>{formatStatNumber(selectionStats.sum)}</strong>
              </span>
            )}
          </div>
        ) : (
          <div className="gsheet-stats-excel-bar gsheet-stats-ready">
            <span className="gsheet-stat-item" style={{ color: '#80868b' }}>Listo</span>
          </div>
        )}
      </div>
    </footer>
  );
}
