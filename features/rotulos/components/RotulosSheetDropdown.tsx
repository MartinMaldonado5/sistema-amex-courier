'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MAX_SHEETS, type RotuloSlotData } from '../types';

interface RotulosSheetDropdownProps {
  currentSheet: number;
  totalSheets: number;
  slots: RotuloSlotData[];
  handleSelectSheet: (sheetNum: number) => void;
  handleAddNewSheet: () => void;
  handleDeleteCurrentSheet: () => void;
}

export const RotulosSheetDropdown: React.FC<RotulosSheetDropdownProps> = ({
  currentSheet,
  totalSheets,
  slots,
  handleSelectSheet,
  handleAddNewSheet,
  handleDeleteCurrentSheet
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Calcular conteo de llenado de la hoja actual
  const currentSheetSlots = slots.slice((currentSheet - 1) * 5, currentSheet * 5);
  const currentFilledCount = currentSheetSlots.filter(
    (s) => Boolean(s.nombre?.trim() || s.destino?.trim())
  ).length;

  return (
    <div className="rotulo-header-sheet-group" ref={dropdownRef}>
      {/* Botón Principal Desplegable de Hojas */}
      <button
        type="button"
        className={`btn-rotulo-sheet-dropdown ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Hoja actual #${currentSheet} de ${totalSheets} — Clic para cambiar de hoja`}
        aria-expanded={isOpen}
      >
        <i className="fa-solid fa-layer-group sheet-dropdown-icon"></i>
        <span className="sheet-dropdown-title">
          Hoja {currentSheet}
          <span className="sheet-dropdown-total-sub">/{totalSheets}</span>
        </span>
        <span
          className={`sheet-dropdown-badge ${
            currentFilledCount === 5 ? 'full' : currentFilledCount > 0 ? 'partial' : 'empty'
          }`}
          title={`${currentFilledCount} de 5 rótulos llenados en esta hoja`}
        >
          {currentFilledCount}/5
        </span>
        <i className={`fa-solid fa-chevron-down sheet-dropdown-chevron ${isOpen ? 'open' : ''}`}></i>
      </button>

      {/* Botón Directo + Hoja en Cabecera */}
      {totalSheets < MAX_SHEETS && (
        <button
          type="button"
          className="btn-rotulo-add-sheet-header"
          onClick={handleAddNewSheet}
          title="Agregar nueva hoja A4 (+5 rótulos)"
        >
          <i className="fa-solid fa-plus"></i>
          <span>Hoja</span>
        </button>
      )}

      {/* Menú Desplegable Vertical */}
      {isOpen && (
        <div className="rotulo-sheet-dropdown-menu">
          <div className="sheet-dropdown-menu-header">
            <span>GESTIÓN DE HOJAS A4</span>
            <span className="sheet-dropdown-header-count">
              {totalSheets} de {MAX_SHEETS}
            </span>
          </div>

          <div className="sheet-dropdown-items-list">
            {Array.from({ length: totalSheets }, (_, i) => {
              const sheetNum = i + 1;
              const sheetSlots = slots.slice(i * 5, (i + 1) * 5);
              const filled = sheetSlots.filter(
                (s) => Boolean(s.nombre?.trim() || s.destino?.trim())
              ).length;
              const isCurrent = sheetNum === currentSheet;

              return (
                <button
                  key={sheetNum}
                  type="button"
                  className={`sheet-dropdown-item ${isCurrent ? 'selected' : ''}`}
                  onClick={() => {
                    handleSelectSheet(sheetNum);
                    setIsOpen(false);
                  }}
                  title={`Seleccionar Hoja #${sheetNum}`}
                >
                  <div className="sheet-dropdown-item-info">
                    <i
                      className={
                        isCurrent
                          ? 'fa-solid fa-file-lines item-icon active'
                          : 'fa-regular fa-file item-icon'
                      }
                    ></i>
                    <span className="sheet-dropdown-item-name">Hoja {sheetNum}</span>
                  </div>
                  <div className="sheet-dropdown-item-meta">
                    <span
                      className={`sheet-dropdown-pill ${
                        filled === 5 ? 'full' : filled > 0 ? 'partial' : 'empty'
                      }`}
                    >
                      {filled}/5
                    </span>
                    {isCurrent && <i className="fa-solid fa-check checkmark-icon"></i>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="sheet-dropdown-menu-divider"></div>

          <div className="sheet-dropdown-menu-actions">
            {totalSheets < MAX_SHEETS && (
              <button
                type="button"
                className="sheet-dropdown-action-btn add-btn"
                onClick={handleAddNewSheet}
                title="Añadir una nueva hoja A4 vacía"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Nueva Hoja (+5 rótulos)</span>
              </button>
            )}

            {totalSheets > 1 && (
              <button
                type="button"
                className="sheet-dropdown-action-btn delete-btn"
                onClick={handleDeleteCurrentSheet}
                title={`Eliminar Hoja #${currentSheet}`}
              >
                <i className="fa-solid fa-trash-can"></i>
                <span>Borrar Hoja Actual (#{currentSheet})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
