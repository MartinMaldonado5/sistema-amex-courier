import React from 'react';
import { ActiveCell } from '../types';

interface FormulaBarProps {
  activeCell: ActiveCell;
  setActiveCell: React.Dispatch<React.SetStateAction<ActiveCell>>;
  onFormulaSubmit: (e: React.FormEvent) => void;
}

export function FormulaBar({ activeCell, setActiveCell, onFormulaSubmit }: FormulaBarProps) {
  return (
    <form onSubmit={onFormulaSubmit} className="gsheet-formula-bar">
      <div className="gsheet-name-box">
        {activeCell.col}
        {activeCell.row}
      </div>
      <div className="gsheet-fx-symbol">fx</div>
      <input
        type="text"
        className="gsheet-formula-input"
        value={activeCell.val}
        onChange={e => setActiveCell(prev => ({ ...prev, val: e.target.value }))}
        placeholder="Selecciona una celda o dispara la pistola..."
      />
    </form>
  );
}
