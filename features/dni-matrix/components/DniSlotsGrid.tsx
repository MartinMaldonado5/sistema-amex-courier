import React from 'react';
import { DniSlotData, DniFilterType, DniStats } from '../types';

interface DniSlotsGridProps {
  totalSlots: number;
  activeSlotId: number;
  currentFilter: DniFilterType;
  setCurrentFilter: (filter: DniFilterType) => void;
  stats: DniStats;
  progressPercent: number;
  filteredSlotIds: number[];
  slotsData: Record<number, DniSlotData>;
  quickJumpVal: string;
  setQuickJumpVal: (val: string) => void;
  padNum: (num: number) => string;
  getSlotStatus: (slot?: DniSlotData) => 'ready' | 'partial' | 'empty';
  setActiveSlotId: (idOrFn: number | ((prev: number) => number)) => void;
  setFocusedSide: (side: 'anverso' | 'reverso' | null) => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
}

export function DniSlotsGrid({
  totalSlots,
  activeSlotId,
  currentFilter,
  setCurrentFilter,
  stats,
  progressPercent,
  filteredSlotIds,
  slotsData,
  quickJumpVal,
  setQuickJumpVal,
  padNum,
  getSlotStatus,
  setActiveSlotId,
  setFocusedSide,
  playSound
}: DniSlotsGridProps) {
  return (
    <aside className="matrix-panel">
      <div className="matrix-header">
        <div className="matrix-title-row">
          <div className="matrix-heading">
            <h3>MATRIZ DE CUPOS</h3>
          </div>

          {/* Filtro de vista */}
          <div className="matrix-filter-group">
            <button
              className={`filter-chip ${currentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('all')}
            >
              Todos
            </button>
            <button
              className={`filter-chip ${currentFilter === 'ready' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('ready')}
            >
              Listos ({stats.ready})
            </button>
            <button
              className={`filter-chip ${currentFilter === 'partial' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('partial')}
            >
              1/2 ({stats.partial})
            </button>
            <button
              className={`filter-chip ${currentFilter === 'empty' ? 'active' : ''}`}
              onClick={() => setCurrentFilter('empty')}
            >
              Vacíos ({stats.empty})
            </button>
          </div>
        </div>

        {/* Métricas compactas */}
        <div className="matrix-stats-widget">
          <div className="matrix-stats-pills">
            <div className="mstat-pill total">
              <span className="mstat-lbl">TOTAL</span>
              <span className="mstat-num">{totalSlots}</span>
            </div>
            <div className="mstat-pill ready">
              <span className="stat-indicator"></span>
              <span className="mstat-lbl">COMPLETOS</span>
              <span className="mstat-num">{stats.ready}</span>
            </div>
            <div className="mstat-pill partial">
              <span className="stat-indicator"></span>
              <span className="mstat-lbl">INCOMPLETOS</span>
              <span className="mstat-num">{stats.partial}</span>
            </div>
            <div className="mstat-pill empty">
              <span className="stat-indicator"></span>
              <span className="mstat-lbl">VACÍOS</span>
              <span className="mstat-num">{stats.empty}</span>
            </div>
          </div>

          {/* Barra de Progreso del Lote */}
          <div className="matrix-progress-row" title="Progreso del lote">
            <span className="mprog-pct">{progressPercent}%</span>
            <div className="mprog-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Leyenda y Búsqueda directa */}
        <div className="matrix-toolbar">
          <div className="matrix-legend">
            <span className="legend-item">
              <span className="badge-dot green"></span> Completo
            </span>
            <span className="legend-item">
              <span className="badge-dot amber"></span> 1 cara
            </span>
            <span className="legend-item">
              <span className="badge-dot gray"></span> Vacío
            </span>
          </div>

          <div className="quick-jump">
            <input
              type="number"
              min="1"
              max={totalSlots}
              placeholder="# Cupo"
              value={quickJumpVal}
              onChange={(e) => setQuickJumpVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(quickJumpVal, 10);
                  if (!isNaN(val) && val >= 1 && val <= totalSlots) {
                    setActiveSlotId(val);
                    setQuickJumpVal('');
                  }
                }
              }}
              title="Escribe un número y presiona Enter para saltar"
            />
          </div>
        </div>
      </div>

      {/* Cuadrícula de la Matriz */}
      <div className="matrix-grid-scroll">
        <div className="matrix-grid">
          {filteredSlotIds.map((id) => {
            const s = slotsData[id];
            const st = getSlotStatus(s);
            const isActive = id === activeSlotId;

            const stateClass =
              st === 'ready'
                ? 'state-ready'
                : st === 'partial'
                ? 'state-partial'
                : 'state-empty';

            return (
              <div
                key={id}
                className={`slot-cell ${stateClass} ${isActive ? 'active-slot' : ''}`}
                onClick={() => {
                  playSound('click');
                  setActiveSlotId(id);
                  setFocusedSide(null);
                }}
              >
                <span className="slot-num">#{padNum(id)}</span>
                <span className="slot-status-icon">
                  {st === 'ready' ? '✓' : st === 'partial' ? '1/2' : '··'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
