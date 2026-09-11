'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface ShalomFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  yearFilter: string;
  onYearChange: (value: string) => void;
  yearOptions: number[];
  monthFilter: string;
  onMonthChange: (value: string) => void;
  dayFilter: string;
  onDayChange: (value: string) => void;
  destinoFilter: string;
  onDestinoChange: (value: string) => void;
  modalidadFilter: string;
  onModalidadChange: (value: string) => void;
  onClearFilters: () => void;
}

export const ShalomFilterBar: React.FC<ShalomFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  yearFilter,
  onYearChange,
  yearOptions,
  monthFilter,
  onMonthChange,
  dayFilter,
  onDayChange,
  destinoFilter,
  onDestinoChange,
  modalidadFilter,
  onModalidadChange,
  onClearFilters
}) => {
  return (
    <div className="shalom-filter-bar">
      <div className="shalom-search-row">
        <div className="shalom-search-input-wrap">
          <Search size={17} className="shalom-search-icon" />
          <input
            type="text"
            className="shalom-search-input"
            placeholder="¿Qué buscas? N° Orden, Código, Destinatario, DNI, Teléfono, Destino..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="shalom-search-clear"
              onClick={() => onSearchChange('')}
              title="Limpiar búsqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="shalom-filters-row">
        <div className="shalom-filter-group">
          <span className="shalom-filter-label">Año:</span>
          <select
            className="shalom-select"
            value={yearFilter}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="">Todos los años</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="shalom-filter-group">
          <span className="shalom-filter-label">Mes:</span>
          <select
            className="shalom-select"
            value={monthFilter}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            <option value="">Todos los meses</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>

        <div className="shalom-filter-group">
          <span className="shalom-filter-label">Día:</span>
          <select
            className="shalom-select"
            value={dayFilter}
            onChange={(e) => onDayChange(e.target.value)}
          >
            <option value="">Todos los días</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="shalom-filter-group">
          <span className="shalom-filter-label">Destino:</span>
          <input
            type="text"
            className="shalom-select"
            placeholder="Ej: TRUJILLO..."
            style={{ width: '130px' }}
            value={destinoFilter}
            onChange={(e) => onDestinoChange(e.target.value.toUpperCase())}
          />
        </div>

        <div className="shalom-filter-group">
          <span className="shalom-filter-label">Modalidad:</span>
          <select
            className="shalom-select"
            value={modalidadFilter}
            onChange={(e) => onModalidadChange(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="PAGO_DESTINO">Pago en Destino</option>
            <option value="PAGADO">Pagado (Contado)</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </div>

        <button
          type="button"
          className="shalom-btn-clear-filters"
          onClick={onClearFilters}
        >
          <Filter size={13} />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};
