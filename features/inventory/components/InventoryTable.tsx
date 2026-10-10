'use client';

import React from 'react';
import {
  Boxes,
  Camera
} from 'lucide-react';
import { Paquete } from '@/types';
import { formatFechaModificadoParts } from '@/lib/excelExport';
import RowActionsDropdown from './RowActionsDropdown';

export interface InventoryTableProps {
  filteredPaquetes: Paquete[];
  paginatedPaquetes: Paquete[];
  selectedIds: string[];
  totalCount?: number;
  onToggleSelect: (id: string) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuickDeliver?: (pkg: Paquete) => void;
  onOpenTransferModal: (pkg: Paquete) => void;
  onOpenEditModal: (pkg: Paquete) => void;
  onSelectThermalPkg: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
  onOpenTibImage?: (pkg: Paquete) => void;
  onDeletePackage: (id: string, wrCode: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
}

export default function InventoryTable({
  filteredPaquetes,
  paginatedPaquetes,
  selectedIds,
  totalCount,
  onToggleSelect,
  onSelectAll,
  onQuickDeliver,
  onOpenTransferModal,
  onOpenEditModal,
  onSelectThermalPkg,
  onViewPdf,
  onOpenTibImage,
  onDeletePackage,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalPages
}: InventoryTableProps) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto" data-lenis-prevent-horizontal>
        <table className="w-full border-collapse text-xs text-left">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-xs">
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <th className="py-2.5 px-3.5 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredPaquetes.length}
                  onChange={onSelectAll}
                />
              </th>
              <th className="py-2.5 px-3.5">Guía WR</th>
              <th className="py-2.5 px-3.5">Tracking</th>
              <th className="py-2.5 px-3.5">Cliente</th>
              <th className="py-2.5 px-3.5">Tipo Paquete</th>
              <th className="py-2.5 px-3.5">Peso</th>
              <th className="py-2.5 px-3.5">Ubicación</th>
              <th className="py-2.5 px-3.5">Estado AMEX</th>
              <th className="py-2.5 px-3.5 whitespace-nowrap">Modificado</th>
              <th className="py-2.5 px-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPaquetes.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  <Boxes style={{ width: '40px', height: '40px', margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                  <div style={{ fontWeight: 800, color: '#64748b' }}>
                    No se encontraron paquetes con los filtros seleccionados
                  </div>
                </td>
              </tr>
            ) : (
              paginatedPaquetes.map((pkg, index) => {
                const pos =
                  pkg.posicionEstante ||
                  (pkg.anaquel && pkg.piso ? `${pkg.anaquel}-${pkg.piso}` : 'REC');
                const isSelected = selectedIds.includes(pkg.id);

                return (
                  <tr
                    key={pkg.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(pkg.id)}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: '#0f172a',
                            fontFamily: 'monospace',
                            fontSize: '13px'
                          }}
                        >
                          {pkg.numeroReciboBodega}
                        </div>
                        {onOpenTibImage && (
                          <button
                            type="button"
                            title={pkg.tibImagenUrl ? "Ver Foto TIB (Guardada)" : "Consultar Foto de Bodega TIB"}
                            onClick={() => onOpenTibImage(pkg)}
                            style={{
                              background: pkg.tibImagenUrl ? '#eff6ff' : '#f8fafc',
                              border: pkg.tibImagenUrl ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              color: pkg.tibImagenUrl ? '#2563eb' : '#64748b',
                              padding: '2px 6px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: 700,
                              boxShadow: pkg.tibImagenUrl ? '0 1px 2px rgba(37,99,235,0.08)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Camera style={{ width: '11px', height: '11px' }} />
                            <span>{pkg.tibImagenUrl ? 'Foto' : 'Ver'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#475569',
                          fontFamily: 'monospace',
                          fontWeight: 600
                        }}
                      >
                        {pkg.trackingUsa || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#2563eb' }}>
                        {pkg.nombreConsignatario || 'Consignatario no asignado'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#1e293b',
                          fontSize: '12px',
                          textTransform: 'uppercase'
                        }}
                        title={pkg.descripcion || undefined}
                      >
                        {pkg.tipoEmpaque || 'CAJA'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {Number(pkg.pesoKg || 0).toFixed(2)}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 900,
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: pos.startsWith('REC') ? '#fef3c7' : '#eff6ff',
                          color: pos.startsWith('REC') ? '#b45309' : '#1d4ed8',
                          border: pos.startsWith('REC') ? '1px solid #fde68a' : '1px solid #bfdbfe'
                        }}
                      >
                        {pos}
                      </span>
                    </td>
                    {/* ESTADO AMEX (Operativo Interno) */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background:
                            pkg.estadoAmex === 'en_almacen' || pkg.estadoAmex === 'recibido'
                              ? '#e0e7ff'
                              : pkg.estadoAmex === 'listo_recojo'
                              ? '#fef3c7'
                              : pkg.estadoAmex === 'en_ruta'
                              ? '#f3e8ff'
                              : pkg.estadoAmex === 'entregado'
                              ? '#dcfce7'
                              : '#f1f5f9',
                          color:
                            pkg.estadoAmex === 'en_almacen' || pkg.estadoAmex === 'recibido'
                              ? '#3730a3'
                              : pkg.estadoAmex === 'listo_recojo'
                              ? '#92400e'
                              : pkg.estadoAmex === 'en_ruta'
                              ? '#6b21a8'
                              : pkg.estadoAmex === 'entregado'
                              ? '#15803d'
                              : '#475569',
                          border:
                            pkg.estadoAmex === 'en_almacen' || pkg.estadoAmex === 'recibido'
                              ? '1px solid #c7d2fe'
                              : pkg.estadoAmex === 'listo_recojo'
                              ? '1px solid #fde68a'
                              : pkg.estadoAmex === 'en_ruta'
                              ? '1px solid #e9d5ff'
                              : pkg.estadoAmex === 'entregado'
                              ? '1px solid #bbf7d0'
                              : '1px solid #e2e8f0'
                        }}
                      >
                        {pkg.estadoAmex === 'en_almacen' || pkg.estadoAmex === 'recibido'
                          ? '📦 EN ALMACÉN'
                          : pkg.estadoAmex === 'listo_recojo'
                          ? '🏪 LISTO RECOJO'
                          : pkg.estadoAmex === 'en_ruta'
                          ? '🚚 EN RUTA'
                          : pkg.estadoAmex === 'entregado'
                          ? '✅ ENTREGADO'
                          : (pkg.estadoAmex || 'EN ALMACÉN').toUpperCase()}
                      </span>
                    </td>

                    {/* MODIFICADO (Fecha y Hora idéntico a TIB: DD/MM/AAAA HH:mm:ss) */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const modParts = formatFechaModificadoParts(pkg.actualizadoEn || pkg.creadoEn);
                        if (!modParts) {
                          return <span style={{ color: '#94a3b8' }}>—</span>;
                        }
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#1e293b',
                                fontFamily: 'monospace'
                              }}
                            >
                              {modParts.fecha}
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: '#64748b',
                                fontFamily: 'monospace'
                              }}
                            >
                              {modParts.hora}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <RowActionsDropdown
                        pkg={pkg}
                        index={index}
                        totalRows={paginatedPaquetes.length}
                        onQuickDeliver={onQuickDeliver ? (p) => {
                          if (confirm(`¿Confirmar entrega del paquete ${p.numeroReciboBodega} a ${p.nombreConsignatario || 'cliente'}?`)) {
                            onQuickDeliver(p);
                          }
                        } : undefined}
                        onOpenTransferModal={onOpenTransferModal}
                        onOpenEditModal={onOpenEditModal}
                        onSelectThermalPkg={onSelectThermalPkg}
                        onViewPdf={onViewPdf}
                        onOpenTibImage={onOpenTibImage}
                        onDeletePackage={onDeletePackage}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredPaquetes.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <span>
              {(() => {
                const total = totalCount !== undefined ? totalCount : filteredPaquetes.length;
                return (
                  <>
                    Mostrando <b>{total > 0 ? (currentPage - 1) * pageSize + 1 : 0}</b> -{' '}
                    <b>{Math.min(currentPage * pageSize, total)}</b> de{' '}
                    <b>{total}</b> paquetes
                  </>
                );
              })()}
            </span>

            <span style={{ color: '#cbd5e1' }}>•</span>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-md border text-xs font-bold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-800 hover:bg-slate-50 border-slate-300 cursor-pointer"
            >
              Anterior
            </button>

            <span className="px-2.5 py-1 font-extrabold text-blue-600 text-xs">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-md border text-xs font-bold transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed bg-white text-slate-800 hover:bg-slate-50 border-slate-300 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
