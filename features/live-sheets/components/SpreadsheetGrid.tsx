import React, { useRef } from 'react';
import { FileSpreadsheet, ClipboardPaste, Sparkles } from 'lucide-react';
import { ActiveCell, EditingCell, SheetRow } from '../types';

interface SpreadsheetGridProps {
  isLoadingItems: boolean;
  isLoadingSheets: boolean;
  visibleRows: SheetRow[];
  activeCell: ActiveCell;
  editingCell: EditingCell | null;
  editingValue: string;
  setEditingValue: (val: string) => void;
  setActiveCell: React.Dispatch<React.SetStateAction<ActiveCell>>;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCell | null>>;
  getRemoteUserOnCell: (col: string, rowNum: number) => { name: string; color: string; cell: string } | undefined;
  handleCellClick: (col: string, row: number, val: string, itemId?: string) => void;
  handleCellDoubleClick: (col: string, rowNum: number, currentVal: string, itemId?: string) => void;
  commitInlineCellEdit: () => Promise<void>;
  getCellValue: (col: string, rowNum: number) => string;
  getItemIdForRow: (rowNum: number) => string | undefined;
  broadcastActiveCell: (col: string, row: number) => void;
  handleClearScanAtRow: (itemId: string) => Promise<void>;
  onOpenPasteModal: () => void;
  onLoadFromDatabase: () => void;
}

export function SpreadsheetGrid({
  isLoadingItems,
  isLoadingSheets,
  visibleRows,
  activeCell,
  editingCell,
  editingValue,
  setEditingValue,
  setActiveCell,
  setEditingCell,
  getRemoteUserOnCell,
  handleCellClick,
  handleCellDoubleClick,
  commitInlineCellEdit,
  getCellValue,
  getItemIdForRow,
  broadcastActiveCell,
  handleClearScanAtRow,
  onOpenPasteModal,
  onLoadFromDatabase
}: SpreadsheetGridProps) {
  const rowDomRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Renderizar input inline en celda activa
  const renderCellInput = (col: string, rowNum: number, itemId?: string) => (
    <input
      autoFocus
      className="gsheet-cell-inline-input"
      value={editingValue}
      onChange={e => {
        setEditingValue(e.target.value);
        setActiveCell(prev => ({ ...prev, val: e.target.value }));
      }}
      onBlur={commitInlineCellEdit}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitInlineCellEdit();
          const nextRow = rowNum + 1;
          const nextVal = getCellValue(col, nextRow);
          const nextId = getItemIdForRow(nextRow);
          setActiveCell({ col, row: nextRow, val: nextVal, itemId: nextId });
          broadcastActiveCell(col, nextRow);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          commitInlineCellEdit();
          const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
          const colIdx = COLS.indexOf(col);
          if (colIdx < COLS.length - 1) {
            const nextCol = COLS[colIdx + 1];
            const nextVal = getCellValue(nextCol, rowNum);
            setActiveCell({ col: nextCol, row: rowNum, val: nextVal, itemId });
            broadcastActiveCell(nextCol, rowNum);
          }
        } else if (e.key === 'Escape') {
          setEditingCell(null);
        }
      }}
    />
  );

  return (
    <div className="gsheet-viewport">
      <table className="gsheet-table">
        <thead>
          {/* Fila 0: Letras de Columnas (A, B, C, D, E, F...) */}
          <tr>
            <th className="gsheet-corner-header">◰</th>
            <th className="gsheet-col-letter" style={{ width: '180px' }}>
              A
            </th>
            <th className="gsheet-col-letter" style={{ width: '150px' }}>
              B
            </th>
            <th className="gsheet-col-letter" style={{ width: '110px' }}>
              C
            </th>
            <th className="gsheet-col-letter" style={{ width: '160px' }}>
              D
            </th>
            <th className="gsheet-col-letter" style={{ width: '140px' }}>
              E
            </th>
            <th className="gsheet-col-letter" style={{ width: '180px' }}>
              F
            </th>
            {/* Columnas vacías estilo Google Sheets */}
            <th className="gsheet-col-letter" style={{ width: '90px' }}>
              G
            </th>
            <th className="gsheet-col-letter" style={{ width: '90px' }}>
              H
            </th>
            <th className="gsheet-col-letter" style={{ width: '90px' }}>
              I
            </th>
            <th className="gsheet-col-letter" style={{ width: '90px' }}>
              J
            </th>
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
            <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
            <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
            <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
            <th className="gsheet-header-cell" style={{ background: '#f8f9fa' }}></th>
          </tr>
        </thead>

        <tbody>
          {isLoadingItems || isLoadingSheets ? (
            Array.from({ length: 12 }).map((_, i) => (
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
                <td className="gsheet-cell"></td>
                <td className="gsheet-cell"></td>
                <td className="gsheet-cell"></td>
                <td className="gsheet-cell"></td>
              </tr>
            ))
          ) : visibleRows.length === 0 ? (
            <tr>
              <td className="gsheet-row-num">2</td>
              <td
                colSpan={10}
                style={{ padding: '60px 20px', textAlign: 'center', color: '#5f6368', background: '#ffffff' }}
              >
                <FileSpreadsheet size={42} className="text-slate-300 mx-auto mb-3" />
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#202124', margin: '0 0 6px 0' }}>
                  La hoja de cotejo está vacía
                </p>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: '#5f6368',
                    margin: '0 0 14px 0',
                    maxWidth: '440px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                >
                  Pega tu lista de Google Sheets con las columnas <b>NOMBRE</b>, <b>CODIGO WAREHOUSE</b> y{' '}
                  <b>CODIGO TIB</b>, o dispara la pistola inalámbrica.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button type="button" className="gsheet-btn-action paste" onClick={onOpenPasteModal}>
                    <ClipboardPaste size={14} />
                    Pegar de Excel / Sheets
                  </button>
                  <button type="button" className="gsheet-btn-action secondary" onClick={onLoadFromDatabase}>
                    <Sparkles size={14} className="text-sky-600" />
                    Cargar de Supabase
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            visibleRows.map((r, rIdx) => {
              const rowNum = rIdx + 2;

              if (r.isSeparator) {
                return (
                  <tr key={r.id} className="gsheet-separator-row">
                    <td className="gsheet-row-num">{rowNum}</td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
                    <td className="gsheet-cell"></td>
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
                  key={r.id}
                  ref={el => {
                    rowDomRefs.current[r.id] = el;
                  }}
                >
                  <td className="gsheet-row-num">{rowNum}</td>

                  {/* Columna A: NOMBRE */}
                  {(() => {
                    const remoteUserA = getRemoteUserOnCell('A', rowNum);
                    const isEditingA = editingCell?.col === 'A' && editingCell.row === rowNum;
                    return (
                      <td
                        className={`gsheet-cell ${r.nombre ? 'gsheet-group-left' : ''} ${
                          r.isGroupStart ? 'gsheet-group-top' : ''
                        } ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${
                          isCellActive('A') ? 'active-cell' : ''
                        } ${remoteUserA ? 'gsheet-cell-remote-active' : ''}`}
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
                    return (
                      <td
                        className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${
                          r.isGroupStart ? 'gsheet-group-top' : ''
                        } ${r.isGroupEnd ? 'gsheet-group-bottom' : ''} ${
                          isCellActive('B') ? 'active-cell' : ''
                        } ${remoteUserB ? 'gsheet-cell-remote-active' : ''}`}
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

                  {/* Columna C: CODIGO TIB */}
                  {(() => {
                    const remoteUserC = getRemoteUserOnCell('C', rowNum);
                    const isEditingC = editingCell?.col === 'C' && editingCell.row === rowNum;
                    return (
                      <td
                        className={`gsheet-cell ${r.isManifestFound ? 'gsheet-cell-mint' : ''} ${
                          r.nombre ? 'gsheet-group-right' : ''
                        } ${r.isGroupStart ? 'gsheet-group-top' : ''} ${
                          r.isGroupEnd ? 'gsheet-group-bottom' : ''
                        } ${isCellActive('C') ? 'active-cell' : ''} ${remoteUserC ? 'gsheet-cell-remote-active' : ''}`}
                        onClick={() => handleCellClick('C', rowNum, r.codigoTib, r.id)}
                        onDoubleClick={() => handleCellDoubleClick('C', rowNum, r.codigoTib, r.id)}
                        title="Celda C: Escribe para modificar o borrar"
                        style={{
                          outline: remoteUserC ? `2px solid ${remoteUserC.color}` : undefined
                        }}
                      >
                        {remoteUserC && (
                          <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUserC.color }}>
                            {remoteUserC.name}
                          </div>
                        )}
                        {isEditingC ? renderCellInput('C', rowNum, r.id) : r.codigoTib}
                      </td>
                    );
                  })()}

                  {/* Columna D: CODIGO ESCANEADO */}
                  {(() => {
                    const remoteUserD = getRemoteUserOnCell('D', rowNum);
                    const isEditingD = editingCell?.col === 'D' && editingCell.row === rowNum;
                    return (
                      <td
                        className={`gsheet-cell ${colDClass} ${isCellActive('D') ? 'active-cell' : ''} ${
                          remoteUserD ? 'gsheet-cell-remote-active' : ''
                        }`}
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
                    return (
                      <td
                        className={`gsheet-cell ${colEClass} ${isCellActive('E') ? 'active-cell' : ''} ${
                          remoteUserE ? 'gsheet-cell-remote-active' : ''
                        }`}
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
                    return (
                      <td
                        className={`gsheet-cell ${isCellActive('F') ? 'active-cell' : ''} ${
                          remoteUserF ? 'gsheet-cell-remote-active' : ''
                        }`}
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

                  {/* Columnas vacías G, H, I, J */}
                  {['G', 'H', 'I', 'J'].map(col => {
                    const isActive = isCellActive(col);
                    const isEditing = editingCell?.col === col && editingCell.row === rowNum;
                    const remoteUser = getRemoteUserOnCell(col, rowNum);
                    return (
                      <td
                        key={`col-${col}-${rowNum}`}
                        className={`gsheet-cell ${isActive ? 'active-cell' : ''} ${
                          remoteUser ? 'gsheet-cell-remote-active' : ''
                        }`}
                        onClick={() => handleCellClick(col, rowNum, '', r.id)}
                        onDoubleClick={() => handleCellDoubleClick(col, rowNum, '', r.id)}
                        style={{
                          outline: remoteUser ? `2px solid ${remoteUser.color}` : undefined
                        }}
                      >
                        {remoteUser && (
                          <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUser.color }}>
                            {remoteUser.name}
                          </div>
                        )}
                        {isEditing ? renderCellInput(col, rowNum, r.id) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}

          {/* Filas vacías interactivas al final */}
          {Array.from({ length: Math.max(12, 35 - visibleRows.length) }).map((_, i) => {
            const extraRowNum = (visibleRows.length === 0 ? 1 : visibleRows.length) + i + 2;
            const isRowActive = (col: string) => activeCell.col === col && activeCell.row === extraRowNum;
            const isEditingInRow = (col: string) => editingCell?.col === col && editingCell.row === extraRowNum;

            return (
              <tr key={`empty-tail-${i}`}>
                <td className="gsheet-row-num">{extraRowNum}</td>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(col => {
                  const isActive = isRowActive(col);
                  const isEditing = isEditingInRow(col);
                  const remoteUser = getRemoteUserOnCell(col, extraRowNum);

                  return (
                    <td
                      key={`tail-${col}-${extraRowNum}`}
                      className={`gsheet-cell ${isActive ? 'active-cell' : ''} ${
                        remoteUser ? 'gsheet-cell-remote-active' : ''
                      }`}
                      onClick={() => handleCellClick(col, extraRowNum, '', undefined)}
                      onDoubleClick={() => handleCellDoubleClick(col, extraRowNum, '', undefined)}
                      style={{
                        outline: remoteUser ? `2px solid ${remoteUser.color}` : undefined
                      }}
                    >
                      {remoteUser && (
                        <div className="gsheet-remote-cursor-tag" style={{ backgroundColor: remoteUser.color }}>
                          {remoteUser.name}
                        </div>
                      )}
                      {isEditing ? renderCellInput(col, extraRowNum, undefined) : null}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
