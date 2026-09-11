'use client';

import React from 'react';
import {
  Boxes,
  MapPin,
  ArrowRightLeft,
  Edit3,
  Printer,
  FileText,
  Trash2
} from 'lucide-react';
import { Paquete } from '@/types';

export interface InventoryTableProps {
  filteredPaquetes: Paquete[];
  paginatedPaquetes: Paquete[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenTransferModal: (pkg: Paquete) => void;
  onOpenEditModal: (pkg: Paquete) => void;
  onSelectThermalPkg: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
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
  onToggleSelect,
  onSelectAll,
  onOpenTransferModal,
  onOpenEditModal,
  onSelectThermalPkg,
  onViewPdf,
  onDeletePackage,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalPages
}: InventoryTableProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800 }}>
              <th style={{ padding: '10px 14px', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredPaquetes.length}
                  onChange={onSelectAll}
                />
              </th>
              <th style={{ padding: '10px 14px' }}>Guía WR / Tracking</th>
              <th style={{ padding: '10px 14px' }}>Casillero / Cliente</th>
              <th style={{ padding: '10px 14px' }}>Descripción & Tipo</th>
              <th style={{ padding: '10px 14px' }}>Peso & Valor</th>
              <th style={{ padding: '10px 14px' }}>Ubicación Sede</th>
              <th style={{ padding: '10px 14px' }}>Anaquel & Piso (WMS)</th>
              <th style={{ padding: '10px 14px' }}>Estado</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPaquetes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  <Boxes style={{ width: '40px', height: '40px', margin: '0 auto 8px auto', color: '#cbd5e1' }} />
                  <div style={{ fontWeight: 800, color: '#64748b' }}>
                    No se encontraron paquetes con los filtros seleccionados
                  </div>
                </td>
              </tr>
            ) : (
              paginatedPaquetes.map(pkg => {
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
                    <td style={{ padding: '10px 14px' }}>
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
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {pkg.trackingUsa}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#2563eb' }}>{pkg.codigoCasillero}</div>
                      <div style={{ fontSize: '11.5px', color: '#334155' }}>
                        {pkg.nombreConsignatario || 'Consignatario no asignado'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div
                        style={{
                          color: '#0f172a',
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {pkg.descripcion || 'Sin descripción'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {pkg.tipoEmpaque || 'CAJA'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {Number(pkg.pesoKg || 0).toFixed(2)} kg
                      </div>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                        ${Number(pkg.valorDeclaradoUsd || 0).toFixed(2)} USD
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background:
                            pkg.ubicacionActual === 'AmexLince'
                              ? '#dcfce7'
                              : pkg.ubicacionActual === 'TibCourierMiami'
                              ? '#dbeafe'
                              : '#fef3c7',
                          color:
                            pkg.ubicacionActual === 'AmexLince'
                              ? '#15803d'
                              : pkg.ubicacionActual === 'TibCourierMiami'
                              ? '#1e40af'
                              : '#b45309'
                        }}
                      >
                        <MapPin className="w-3 h-3" />
                        {pkg.ubicacionActual === 'AmexLince'
                          ? 'Sede Lince'
                          : pkg.ubicacionActual === 'TibCourierMiami'
                          ? 'Miami Hub'
                          : pkg.ubicacionActual || 'Almacén'}
                      </span>
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
                        📍 {pos}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background:
                            pkg.estadoEntrega === 'EntregadoDomicilio' || pkg.estadoEntrega === 'RecogidoAlmacen'
                              ? '#dcfce7'
                              : pkg.estadoEntrega === 'EnRutaCarroAmex'
                              ? '#dbeafe'
                              : '#f1f5f9',
                          color:
                            pkg.estadoEntrega === 'EntregadoDomicilio' || pkg.estadoEntrega === 'RecogidoAlmacen'
                              ? '#15803d'
                              : pkg.estadoEntrega === 'EnRutaCarroAmex'
                              ? '#1d4ed8'
                              : '#475569'
                        }}
                      >
                        {pkg.estadoEntrega === 'EnAlmacen'
                          ? 'En Almacén'
                          : pkg.estadoEntrega === 'EnRutaCarroAmex'
                          ? 'En Ruta'
                          : pkg.estadoEntrega === 'ListoParaRecojo'
                          ? 'Listo Recojo'
                          : pkg.estadoEntrega === 'EntregadoDomicilio'
                          ? 'Entregado'
                          : pkg.estadoEntrega || 'En Almacén'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          title="Mover a otro Estante / Anaquel"
                          onClick={() => onOpenTransferModal(pkg)}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          title="Editar Paquete / Modificar Datos"
                          onClick={() => onOpenEditModal(pkg)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          title="Imprimir Rótulo Térmico 4x6"
                          onClick={() => onSelectThermalPkg(pkg)}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            color: '#166534',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {pkg.facturaPdfUrl && (
                          <button
                            title="Ver Factura PDF R2"
                            onClick={() => onViewPdf(pkg.facturaPdfUrl!)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          title="Eliminar Paquete"
                          onClick={() => onDeletePackage(pkg.id, pkg.numeroReciboBodega)}
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              Mostrando <b>{Math.min((currentPage - 1) * pageSize + 1, filteredPaquetes.length)}</b> -{' '}
              <b>{Math.min(currentPage * pageSize, filteredPaquetes.length)}</b> de{' '}
              <b>{filteredPaquetes.length}</b> paquetes
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
                color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                fontWeight: 700,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Anterior
            </button>

            <span style={{ padding: '4px 8px', fontWeight: 800, color: '#2563eb' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
                color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
                fontWeight: 700,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
