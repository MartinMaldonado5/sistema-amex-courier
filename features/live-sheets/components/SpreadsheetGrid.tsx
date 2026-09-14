import React, { useRef, useState, useEffect } from 'react';
import {
  ActiveCell,
  EditingCell,
  SheetRow,
  CellSelectionRange,
  SPREADSHEET_COLUMNS,
  MAX_SPREADSHEET_ROWS
} from '../types';

interface SpreadsheetGridProps {
  isLoadingItems: boolean;
  isLoadingSheets: boolean;
  visibleRows: SheetRow[];
  activeCell: ActiveCell;
  selectionRange?: CellSelectionRange | null;
  editingCell: EditingCell | null;
  editingValue: string;
  setEditingValue: (val: string) => void;
  setActiveCell: React.Dispatch<React.SetStateAction<ActiveCell>>;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
  getRemoteUserOnCell: (col: string, rowNum: number) => { name: string; color: string; cell: string } | undefined;
  handleCellClick: (col: string, row: number, val: string, itemId?: string) => void;
  handleCellDoubleClick: (col: string, rowNum: number, currentVal: string, itemId?: string) => void;
  handleCellMouseDown?: (col: string, rowNum: number, currentVal: string, itemId?: string, isShift?: boolean) => void;
  handleCellMouseEnter?: (col: string, rowNum: number) => void;
  commitInlineCellEdit: (valueOverride?: string) => Promise<void>;
  getCellValue: (col: string, rowNum: number) => string;
  getItemIdForRow: (rowNum: number) => string | undefined;
  broadcastActiveCell: (col: string, row: number) => void;
  handleClearScanAtRow: (itemId: string) => Promise<void>;
  onOpenPasteModal?: () => void;
  onLoadFromDatabase?: () => void;
}

export function SpreadsheetGrid({
  isLoadingItems,
  isLoadingSheets,
  visibleRows,
  activeCell,
  selectionRange,
  editingCell,
  editingValue,
  setEditingValue,
  setActiveCell,
  setEditingCell,
  getRemoteUserOnCell,
  handleCellClick,
  handleCellDoubleClick,
  handleCellMouseDown,
  handleCellMouseEnter,
  commitInlineCellEdit,
  getCellValue,
  getItemIdForRow,
  broadcastActiveCell,
  handleClearScanAtRow
}: SpreadsheetGridProps) {
  const rowDomRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const viewportRef = useRef<HTMLDivElement>(null);

  // Columnas exactas de la A a la Z (26 columnas)
  const COLS = SPREADSHEET_COLUMNS;

  // Ancho exacto por columna
  const getColWidth = (col: string): number => {
    switch (col) {
      case 'A': return 180;
      case 'B': return 150;
      case 'C': return 110;
      case 'D': return 160;
      case 'E': return 140;
      case 'F': return 180;
      default: return 90;
    }
  };

  // Virtual scrolling por filas para fluidez a 60fps con hasta 1000 filas
  const ROW_HEIGHT = 25;
  const TOTAL_BODY_ROWS = MAX_SPREADSHEET_ROWS - 1; // 999 filas de cuerpo (filas 2 a 1000)
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(700);
  const isAutoScrolling = useRef(false);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    setViewportHeight(vp.clientHeight || 700);

    let rafId: number | null = null;
    const onScroll = () => {
      if (isAutoScrolling.current) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setScrollTop(vp.scrollTop);
      });
    };

    const onResize = () => {
      setViewportHeight(vp.clientHeight || 700);
    };

    vp.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      vp.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Auto-scroll del viewport para mantener la celda activa visible horizontal y verticalmente
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    isAutoScrolling.current = true;

    // Scroll vertical (filas 2 a 1000, 25px cada una, cabecera fija 52px)
    const rowTop = (activeCell.row - 2) * ROW_HEIGHT + 52;
    const rowBottom = rowTop + ROW_HEIGHT;
    if (rowTop < vp.scrollTop + 56) {
      vp.scrollTop = Math.max(0, rowTop - 56);
    } else if (rowBottom > vp.scrollTop + vp.clientHeight - 8) {
      vp.scrollTop = rowBottom - vp.clientHeight + 8;
    }

    // Scroll horizontal (columnas A a Z)
    const colIdx = SPREADSHEET_COLUMNS.indexOf(activeCell.col as any);
    if (colIdx >= 0) {
      let colLeft = 44; // ancho de esquina ◰
      for (let i = 0; i < colIdx; i++) {
        colLeft += getColWidth(SPREADSHEET_COLUMNS[i]);
      }
      const colWidth = getColWidth(activeCell.col as any);
      const colRight = colLeft + colWidth;
      if (colLeft < vp.scrollLeft + 48) {
        vp.scrollLeft = Math.max(0, colLeft - 48);
      } else if (colRight > vp.scrollLeft + vp.clientWidth - 16) {
        vp.scrollLeft = colRight - vp.clientWidth + 16;
      }
    }

    // Sincronizar scrollTop state después de auto-scroll
    setScrollTop(vp.scrollTop);

    // Delay flag reset so the browser's scroll event fires and gets skipped
    requestAnimationFrame(() => {
      isAutoScrolling.current = false;
    });
  }, [activeCell.col, activeCell.row]);

  // Rango de filas renderizadas en el DOM con buffer para scroll fluido
  const rawStartIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const rawEndIndex = Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT);

  const bufferStart = Math.max(0, rawStartIndex - 20);
  const bufferEnd = Math.min(TOTAL_BODY_ROWS, rawEndIndex + 25);

  const activeRowIdx = activeCell.row - 2;
  const startIndex =
    activeRowIdx >= 0 && activeRowIdx < TOTAL_BODY_ROWS
      ? Math.min(bufferStart, Math.max(0, activeRowIdx - 5))
      : bufferStart;
  const endIndex =
    activeRowIdx >= 0 && activeRowIdx < TOTAL_BODY_ROWS
      ? Math.max(bufferEnd, Math.min(TOTAL_BODY_ROWS, activeRowIdx + 6))
      : bufferEnd;

  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = (TOTAL_BODY_ROWS - endIndex) * ROW_HEIGHT;

  // Calcular clases CSS de rango de selección estilo Excel
  const getSelectionClasses = (col: string, rowNum: number) => {
    if (!selectionRange) return '';
    const startIdx = COLS.indexOf(selectionRange.startCol as any);
    const endIdx = COLS.indexOf(selectionRange.endCol as any);
    if (startIdx === -1 || endIdx === -1) return '';

    const minCol = Math.min(startIdx, endIdx);
    const maxCol = Math.max(startIdx, endIdx);
    const minRow = Math.min(selectionRange.startRow, selectionRange.endRow);
    const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow);

    const curColIdx = COLS.indexOf(col as any);
    if (curColIdx < minCol || curColIdx > maxCol || rowNum < minRow || rowNum > maxRow) {
      return '';
    }

    const isMulti = selectionRange.startCol !== selectionRange.endCol || selectionRange.startRow !== selectionRange.endRow;
    if (!isMulti) return '';

    const classes = ['selected-range-cell'];
    if (rowNum === minRow) classes.push('selected-range-top');
    if (rowNum === maxRow) classes.push('selected-range-bottom');
    if (curColIdx === minCol) classes.push('selected-range-left');
    if (curColIdx === maxCol) classes.push('selected-range-right');

    return classes.join(' ');
  };

  // Renderizar input inline en celda activa
  const renderCellInput = (col: string, rowNum: number, itemId?: string) => (
    <input
      autoFocus
      className="gsheet-cell-inline-input"
      value={editingValue}
      onChange={e => {
        setEditingValue(e.target.value);
      }}
      onBlur={e => {
        const val = e.target.value;
        commitInlineCellEdit(val);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          const currentVal = (e.target as HTMLInputElement).value;
          commitInlineCellEdit(currentVal);
          const nextRow = Math.min(MAX_SPREADSHEET_ROWS, rowNum + 1);
          const nextVal = getCellValue(col, nextRow);
          const nextId = getItemIdForRow(nextRow);
          setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
          broadcastActiveCell(col, nextRow);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          const currentVal = (e.target as HTMLInputElement).value;
          commitInlineCellEdit(currentVal);
          const colIdx = COLS.indexOf(col as any);
          if (colIdx < COLS.length - 1) {
            const nextCol = COLS[colIdx + 1];
            const nextVal = getCellValue(nextCol, rowNum);
            const nextId = getItemIdForRow(rowNum);
            setActiveCell({ col: nextCol, row: rowNum, val: nextVal, itemId: nextId });
            broadcastActiveCell(nextCol, rowNum);
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingCell(null);
        }
      }}
    />
  );

  return (
    <div className="gsheet-viewport" ref={viewportRef}>
      <table className="gsheet-table">
        <thead>
          {/* Fila 0: Letras de Columnas (A hasta Z) */}
          <tr>
            <th className="gsheet-corner-header">◰</th>
            {COLS.map(col => {
              const width = `${getColWidth(col)}px`;
              return (
                <th
                  key={`col-hdr-${col}`}
                  className="gsheet-col-letter"
                  style={{ width, minWidth: width, maxWidth: width }}
                >
                  {col}
                </th>
              );
            })}
          </tr>

          {/* Fila 1: Encabezados Reales de AMEX WR */}
          <tr>
            <th className="gsheet-row-num">1</th>
            <th className="gsheet-header-cell">NOMBRE</th>
            <th className="gsheet-header-cell">CODIGO WAREHOUSE</th>
            <th className="gsheet-header-cell">CODIGO TIB</th>
            <th className="gsheet-header-cell">CODIGO ESCANEADO</th>
            <th className="gsheet-header-cell">ESTADO</th>
            <th className="gsheet-header-cell">NOMBRE ESCANEADO</th>
            {COLS.slice(6).map(col => (
              <th key={`hdr-empty-${col}`} className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoadingItems || isLoadingSheets ? (
            Array.from({ length: 15 }).map((_, i) => (
              <tr key={`load-skel-${i}`}>
                <td className="gsheet-row-num">{i + 2}</td>
                <td className="gsheet-cell">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '80%' }} />
                </td>
                <td className="gsheet-cell gsheet-cell-mint">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '90%' }} />
                </td>
                <td className="gsheet-cell gsheet-cell-mint">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '70%' }} />
                </td>
                <td className="gsheet-cell">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '85%' }} />
                </td>
                <td className="gsheet-cell">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} />
                </td>
                <td className="gsheet-cell">
                  <div className="skeleton-shimmer" style={{ height: '14px', width: '75%' }} />
                </td>
                {COLS.slice(6).map(col => (
                  <td key={`skel-${col}-${i}`} className="gsheet-cell"></td>
                ))}
              </tr>
            ))
          ) : (
            <>
              {topSpacerHeight > 0 && (
                <tr style={{ height: `${topSpacerHeight}px` }}>
                  <td
                    colSpan={COLS.length + 1}
                    style={{
                      height: `${topSpacerHeight}px`,
                      padding: 0,
                      border: 'none',
                      background: 'transparent'
                    }}
                  />
                </tr>
              )}

              {Array.from({ length: Math.max(0, endIndex - startIndex) }).map((_, sliceIdx) => {
                const rIdx = startIndex + sliceIdx;
                const rowNum = rIdx + 2;

                if (rIdx < visibleRows.length) {
                  const r = visibleRows[rIdx];

                  if (r.isSeparator) {
                    return (
                      <tr key={r.id ? `${r.id}-${rIdx}` : `sep-${rIdx}`} className="gsheet-separator-row">
                        <td className="gsheet-row-num">{rowNum}</td>
                        {COLS.map(col => (
                          <td key={`sep-${col}-${rowNum}`} className="gsheet-cell"></td>
                        ))}
                      </tr>
                    );
                  }

                  const isCellActive = (col: string) => activeCell.col === col && activeCell.row === rowNum;
                  const isNotFound = r.estado === 'NO ENCONTRADO';
                  const isFound = r.estado === 'ENCONTRADO';

                  const colDClass = isNotFound
                    ? 'gsheet-cell-red-alert'
                    : isFound
                    ? 'gsheet-cell-found-match'
                    : '';

                  const colEClass = isNotFound
                    ? 'gsheet-cell-status-not-found'
                    : isFound
                    ? 'gsheet-cell-status-found'
                    : '';

                  return (
                    <tr
                      key={r.id ? `${r.id}-${rIdx}` : `row-${rIdx}`}
                      ref={el => {
                        rowDomRefs.current[r.id] = el;
                      }}
                    >
                      <td className="gsheet-row-num">{rowNum}</td>

                      {/* Columna A: NOMBRE */}
                      {(() => {
                        const remoteUserA = getRemoteUserOnCell('A', rowNum);
                        const isEditingA = editingCell?.col === 'A' && editingCell.row === rowNum;
                        const selClass = getSelectionClasses('A', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${r.nombre ? 'gsheet-group-left' : ''} ${
                              r.isGroupStart ? 'gsheet-group-top' : ''
                            } ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${
                              isCellActive('A') ? 'active-cell' : ''
                            } ${isEditingA ? 'editing-cell' : ''} ${selClass} ${remoteUserA ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('A', rowNum, r.nombre, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('A', rowNum);
                            }}
                            onClick={() => handleCellClick('A', rowNum, r.nombre, r.id)}
                            onDoubleClick={() => handleCellDoubleClick('A', rowNum, r.nombre, r.id)}
                            title="Celda A: Escribe para modificar o borrar"
                            style={{
                              fontWeight: 600,
                              outline: remoteUserA ? `2px solid ${remoteUserA.color}` : undefined
                            }}
                          >
                            {remoteUserA && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserA.color }}>
                                {remoteUserA.name}
                              </div>
                            )}
                            {isEditingA ? renderCellInput('A', rowNum, r.id) : r.nombre}
                          </td>
                        );
                      })()}

                      {/* Columna B: CODIGO WAREHOUSE */}
                      {(() => {
                        const remoteUserB = getRemoteUserOnCell('B', rowNum);
                        const isEditingB = editingCell?.col === 'B' && editingCell.row === rowNum;
                        const selClass = getSelectionClasses('B', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${
                              r.isGroupStart ? 'gsheet-group-top' : ''
                            } ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${
                              isCellActive('B') ? 'active-cell' : ''
                            } ${isEditingB ? 'editing-cell' : ''} ${selClass} ${remoteUserB ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('B', rowNum, r.codigoWarehouse, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('B', rowNum);
                            }}
                            onClick={() => handleCellClick('B', rowNum, r.codigoWarehouse, r.id)}
                            onDoubleClick={() => handleCellDoubleClick('B', rowNum, r.codigoWarehouse, r.id)}
                            title="Celda B: Escribe para modificar o borrar"
                            style={{
                              outline: remoteUserB ? `2px solid ${remoteUserB.color}` : undefined
                            }}
                          >
                            {remoteUserB && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserB.color }}>
                                {remoteUserB.name}
                              </div>
                            )}
                            {isEditingB ? renderCellInput('B', rowNum, r.id) : r.codigoWarehouse}
                          </td>
                        );
                      })()}

                      {/* Columna C: CODIGO TIB (Automático / No editable) */}
                      {(() => {
                        const remoteUserC = getRemoteUserOnCell('C', rowNum);
                        const selClass = getSelectionClasses('C', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${
                              r.nombre ? 'gsheet-group-right' : ''
                            } ${r.isGroupStart ? 'gsheet-group-top' : ''} ${
                              r.isGroupEnd ? 'gsheet-group-bottom' : ''
                            } ${isCellActive('C') ? 'active-cell' : ''} ${selClass} ${remoteUserC ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('C', rowNum, r.codigoTib, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('C', rowNum);
                            }}
                            onClick={() => handleCellClick('C', rowNum, r.codigoTib, r.id)}
                            title="Columna C: Automática (Últimos 6 dígitos de Columna B - Solo lectura)"
                            style={{
                              outline: remoteUserC ? `2px solid ${remoteUserC.color}` : undefined,
                              cursor: 'cell'
                            }}
                          >
                            {remoteUserC && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserC.color }}>
                                {remoteUserC.name}
                              </div>
                            )}
                            {r.codigoTib}
                          </td>
                        );
                      })()}

                      {/* Columna D: CODIGO ESCANEADO */}
                      {(() => {
                        const remoteUserD = getRemoteUserOnCell('D', rowNum);
                        const isEditingD = editingCell?.col === 'D' && editingCell.row === rowNum;
                        const selClass = getSelectionClasses('D', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${colDClass} ${isCellActive('D') ? 'active-cell' : ''} ${
                              isEditingD ? 'editing-cell' : ''
                            } ${selClass} ${remoteUserD ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('D', rowNum, r.codigoEscaneado, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('D', rowNum);
                            }}
                            onClick={() => handleCellClick('D', rowNum, r.codigoEscaneado, r.id)}
                            onDoubleClick={() => handleCellDoubleClick('D', rowNum, r.codigoEscaneado, r.id)}
                            title={
                              r.codigoEscaneado
                                ? `Escaneado: ${r.codigoEscaneado} (Escribe para modificar o Supr/Backspace para borrar)`
                                : 'Celda D: Escribe para modificar o disparar'
                            }
                            style={{
                              outline: remoteUserD ? `2px solid ${remoteUserD.color}` : undefined
                            }}
                          >
                            {remoteUserD && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserD.color }}>
                                {remoteUserD.name}
                              </div>
                            )}
                            {isEditingD ? (
                              renderCellInput('D', rowNum, r.id)
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>{r.codigoEscaneado}</span>
                                {r.codigoEscaneado && (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleClearScanAtRow(r.id);
                                    }}
                                    title="Borrar este escaneo"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: isNotFound ? '#ffffff' : '#5f6368',
                                      cursor: 'pointer',
                                      padding: '0 2px',
                                      opacity: 0.7,
                                      fontSize: '11px',
                                      lineHeight: 1
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })()}

                      {/* Columna E: ESTADO */}
                      {(() => {
                        const remoteUserE = getRemoteUserOnCell('E', rowNum);
                        const isEditingE = editingCell?.col === 'E' && editingCell.row === rowNum;
                        const selClass = getSelectionClasses('E', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${colEClass} ${isCellActive('E') ? 'active-cell' : ''} ${
                              isEditingE ? 'editing-cell' : ''
                            } ${selClass} ${remoteUserE ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('E', rowNum, r.estado, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('E', rowNum);
                            }}
                            onClick={() => handleCellClick('E', rowNum, r.estado, r.id)}
                            onDoubleClick={() => handleCellDoubleClick('E', rowNum, r.estado, r.id)}
                            title="Celda E: Escribe para modificar o borrar estado"
                            style={{
                              outline: remoteUserE ? `2px solid ${remoteUserE.color}` : undefined
                            }}
                          >
                            {remoteUserE && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserE.color }}>
                                {remoteUserE.name}
                              </div>
                            )}
                            {isEditingE ? renderCellInput('E', rowNum, r.id) : r.estado}
                          </td>
                        );
                      })()}

                      {/* Columna F: NOMBRE ESCANEADO */}
                      {(() => {
                        const remoteUserF = getRemoteUserOnCell('F', rowNum);
                        const isEditingF = editingCell?.col === 'F' && editingCell.row === rowNum;
                        const selClass = getSelectionClasses('F', rowNum);
                        return (
                          <td
                            className={`gsheet-cell ${isCellActive('F') ? 'active-cell' : ''} ${
                              isEditingF ? 'editing-cell' : ''
                            } ${selClass} ${remoteUserF ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown('F', rowNum, r.nombreEscaneado, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter('F', rowNum);
                            }}
                            onClick={() => handleCellClick('F', rowNum, r.nombreEscaneado, r.id)}
                            onDoubleClick={() => handleCellDoubleClick('F', rowNum, r.nombreEscaneado, r.id)}
                            title="Celda F: Escribe para modificar o borrar"
                            style={{
                              color: isNotFound ? '#70757a' : '#202124',
                              fontWeight: isFound ? 700 : 400,
                              outline: remoteUserF ? `2px solid ${remoteUserF.color}` : undefined
                            }}
                          >
                            {remoteUserF && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserF.color }}>
                                {remoteUserF.name}
                              </div>
                            )}
                            {isEditingF ? renderCellInput('F', rowNum, r.id) : r.nombreEscaneado}
                          </td>
                        );
                      })()}

                      {/* Columnas G..Z */}
                      {COLS.slice(6).map(col => {
                        const isActive = isCellActive(col);
                        const isEditing = editingCell?.col === col && editingCell.row === rowNum;
                        const remoteUser = getRemoteUserOnCell(col, rowNum);
                        const selClass = getSelectionClasses(col, rowNum);
                        const cellVal = getCellValue(col, rowNum);
                        return (
                          <td
                            key={`col-${col}-${rowNum}`}
                            className={`gsheet-cell ${isActive ? 'active-cell' : ''} ${
                              isEditing ? 'editing-cell' : ''
                            } ${selClass} ${remoteUser ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown(col, rowNum, cellVal, r.id, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter(col, rowNum);
                            }}
                            onClick={() => handleCellClick(col, rowNum, cellVal, r.id)}
                            onDoubleClick={() => handleCellDoubleClick(col, rowNum, cellVal, r.id)}
                            style={{
                              outline: remoteUser ? `2px solid ${remoteUser.color}` : undefined
                            }}
                          >
                            {remoteUser && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUser.color }}>
                                {remoteUser.name}
                              </div>
                            )}
                            {isEditing ? renderCellInput(col, rowNum, r.id) : cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                } else {
                  // Filas vacías interactivas hasta la fila 1000
                  return (
                    <tr key={`empty-tail-${rIdx}`}>
                      <td className="gsheet-row-num">{rowNum}</td>
                      {COLS.map(col => {
                        const isActive = activeCell.col === col && activeCell.row === rowNum;
                        const isEditing = editingCell?.col === col && editingCell.row === rowNum;
                        const remoteUser = getRemoteUserOnCell(col, rowNum);
                        const selClass = getSelectionClasses(col, rowNum);
                        const cellVal = getCellValue(col, rowNum);

                        return (
                          <td
                            key={`tail-${col}-${rowNum}`}
                            className={`gsheet-cell ${isActive ? 'active-cell' : ''} ${
                              isEditing ? 'editing-cell' : ''
                            } ${selClass} ${remoteUser ? 'gsheet-cell-remote-active' : ''}`}
                            onMouseDown={e => {
                              if (e.button === 0 && handleCellMouseDown) {
                                handleCellMouseDown(col, rowNum, cellVal, undefined, e.shiftKey);
                              }
                            }}
                            onMouseEnter={() => {
                              if (handleCellMouseEnter) handleCellMouseEnter(col, rowNum);
                            }}
                            onClick={() => handleCellClick(col, rowNum, cellVal, undefined)}
                            onDoubleClick={() => {
                              if (col !== 'C') handleCellDoubleClick(col, rowNum, cellVal, undefined);
                            }}
                            style={{
                              outline: remoteUser ? `2px solid ${remoteUser.color}` : undefined
                            }}
                          >
                            {remoteUser && (
                              <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUser.color }}>
                                {remoteUser.name}
                              </div>
                            )}
                            {isEditing && col !== 'C' ? renderCellInput(col, rowNum, undefined) : cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }
              })}

              {bottomSpacerHeight > 0 && (
                <tr style={{ height: `${bottomSpacerHeight}px` }}>
                  <td
                    colSpan={COLS.length + 1}
                    style={{
                      height: `${bottomSpacerHeight}px`,
                      padding: 0,
                      border: 'none',
                      background: 'transparent'
                    }}
                  />
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
