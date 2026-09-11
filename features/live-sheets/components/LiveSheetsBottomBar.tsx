import React from 'react';
import { Plus } from 'lucide-react';
import { HojaCotejo } from '@/types';
import { SheetStats } from '../types';

interface LiveSheetsBottomBarProps {
  hojas: HojaCotejo[];
  activeHojaId: string;
  setActiveHojaId: (id: string) => void;
  onOpenNewSheetModal: () => void;
  totalRows: number;
  stats: SheetStats;
}

export function LiveSheetsBottomBar({
  hojas,
  activeHojaId,
  setActiveHojaId,
  onOpenNewSheetModal,
  totalRows,
  stats
}: LiveSheetsBottomBarProps) {
  return (
    <footer className="gsheet-bottom-bar">
      <div className="gsheet-bottom-left">
        <button
          type="button"
          className="gsheet-add-tab-btn"
          onClick={onOpenNewSheetModal}
          title="Añadir hoja"
        >
          <Plus size={16} />
        </button>

        {hojas.map((h, idx) => (
          <div
            key={h.id}
            className={`gsheet-tab-item ${h.id === activeHojaId ? 'active' : ''}`}
            onClick={() => setActiveHojaId(h.id)}
          >
            <span>{h.titulo || `Sheet${idx + 1}`}</span>
          </div>
        ))}
      </div>

      <div className="gsheet-bottom-right">
        <span>{totalRows} filas</span>
        <span>•</span>
        <span className="text-emerald-700 font-semibold">{stats.encontrados} encontrados</span>
        <span>•</span>
        <span className="text-red-700 font-semibold">{stats.noEncontrados} no encontrados</span>
      </div>
    </footer>
  );
}
