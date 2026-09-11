'use client';

import React from 'react';
import {
  FileText,
  MapPin,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BoletaShalom } from '@/types';
import { ShalomTableSkeleton } from '@/components/ui/Skeleton';

interface ShalomTableProps {
  boletas: BoletaShalom[];
  totalCount: number;
  selectedBoleta: BoletaShalom | null;
  isLoading: boolean;
  fetchError: string | null;
  copiedId: string | null;
  onSelectBoleta: (boleta: BoletaShalom) => void;
  onCopy: (text: string, id: string) => void;
  onOpenEdit: (boleta: BoletaShalom, e: React.MouseEvent) => void;
  onOpenDelete: (boleta: BoletaShalom, e: React.MouseEvent) => void;
  onRetry: () => void;
}

export const ShalomTable: React.FC<ShalomTableProps> = ({
  boletas,
  totalCount,
  selectedBoleta,
  isLoading,
  fetchError,
  copiedId,
  onSelectBoleta,
  onCopy,
  onOpenEdit,
  onOpenDelete,
  onRetry
}) => {
  return (
    <div className="shalom-table-card">
      <div className="shalom-table-header-info">
        <span className="shalom-table-count">
          Mostrando <strong>{boletas.length}</strong> de <strong>{totalCount}</strong> boletas
        </span>
        {selectedBoleta && (
          <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
            <Eye size={13} /> Boleta seleccionada en el visor
          </span>
        )}
      </div>

      {isLoading ? (
        <ShalomTableSkeleton rows={6} />
      ) : fetchError ? (
        <div className="shalom-empty-state">
          <div className="shalom-empty-icon" style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.12)' }}>
            <AlertCircle size={28} />
          </div>
          <h3 className="shalom-empty-title">Estado de Conexión</h3>
          <p className="shalom-empty-desc">{fetchError}</p>
          <button
            type="button"
            className="shalom-btn-primary"
            onClick={onRetry}
            style={{ marginTop: '8px' }}
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      ) : boletas.length === 0 ? (
        <div className="shalom-empty-state">
          <div className="shalom-empty-icon">
            <FileText size={28} />
          </div>
          <h3 className="shalom-empty-title">No se encontraron boletas</h3>
          <p className="shalom-empty-desc">
            No hay comprobantes que coincidan con los filtros aplicados. Carga los primeros escaneos con el botón superior.
          </p>
        </div>
      ) : (
        <div className="shalom-table-wrap">
          <table className="shalom-table">
            <thead>
              <tr>
                <th>N° Orden / Código</th>
                <th>Destinatario</th>
                <th>Destino / Entrega</th>
                <th>Fechas (Emisión / Traslado)</th>
                <th>Detalle Envío</th>
                <th>Forma de Pago</th>
                <th>Total</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {boletas.map((b) => {
                const isSelected = selectedBoleta?.id === b.id;
                const modClass =
                  b.modalidad_pago === 'PAGADO' || (b.forma_pago && b.forma_pago.toLowerCase().includes('pagad'))
                    ? 'pagado'
                    : b.modalidad_pago === 'CREDITO' || (b.forma_pago && b.forma_pago.toLowerCase().includes('credit'))
                    ? 'credito'
                    : 'pago-destino';

                const nroOrden = b.nro_orden || b.numero_guia || '—';
                const codigoSeg = b.codigo || b.codigo_seguimiento || '';
                const destDni = b.destinatario_dni || b.destinatario_documento || '';
                const destTel = b.destinatario_telefono || '';
                const detalleDesc = b.descripcion || b.contenido_bultos || 'BULTO';
                const detalleCant = b.cantidad || 1;
                const detallePeso = b.peso !== undefined && b.peso !== null ? b.peso : (b.peso_total || 0);
                const detalleUm = b.unidad_medida || 'Volumen';
                const entrega = b.tipo_entrega || b.agencia_destino || 'ENTREGAR EN AGENCIA';
                const formaPagoTexto = b.forma_pago || (b.modalidad_pago === 'PAGO_DESTINO' ? 'Pendiente de Pago' : b.modalidad_pago || 'Pendiente');

                return (
                  <tr
                    key={b.id}
                    className={`shalom-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectBoleta(b)}
                  >
                    <td>
                      <div className="shalom-cell-guia">
                        <span className="shalom-guia-code">
                          {nroOrden}
                          <button
                            type="button"
                            className="text-slate-500 hover:text-sky-400 p-0.5"
                            title="Copiar N° Orden"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopy(nroOrden, `g-${b.id}`);
                            }}
                          >
                            {copiedId === `g-${b.id}` ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                        {codigoSeg && (
                          <span className="shalom-tracking-code">
                            Cód: {codigoSeg}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="shalom-cell-cliente">
                        <span className="shalom-destinatario-name">
                          {b.destinatario_nombre}
                        </span>
                        <div className="shalom-destinatario-meta">
                          {destDni && <span>DNI: {destDni}</span>}
                          {destTel && <span>📞 {destTel}</span>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="shalom-cell-destino">
                        <span className="shalom-destino-badge">
                          <MapPin size={13} className="text-sky-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px]" title={b.destino}>{b.destino}</span>
                        </span>
                        <span className="shalom-agencia-name text-xs text-slate-400">{entrega}</span>
                      </div>
                    </td>

                    <td>
                      <div className="flex flex-col text-xs text-slate-300">
                        <span className="font-semibold">Emisión: {b.fecha_emision}</span>
                        {b.hora_emision && (
                          <span className="text-slate-500 text-[11px]">Hora: {b.hora_emision}</span>
                        )}
                        {b.fecha_traslado && (
                          <span className="text-sky-400 text-[11px] font-medium">Traslado: {b.fecha_traslado}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-200">
                          {detalleCant}x {detalleDesc}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {detallePeso} {detalleUm}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`shalom-modalidad-badge ${modClass}`}>
                        {formaPagoTexto}
                      </span>
                    </td>

                    <td>
                      <span className="shalom-monto-text text-emerald-400 font-mono font-bold">
                        S/ {(Number(b.monto_total) || 0).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <div className="shalom-actions-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="shalom-btn-icon"
                          title="Ver en Visor Integrado"
                          onClick={() => onSelectBoleta(b)}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="shalom-btn-icon"
                          title="Editar datos"
                          onClick={(e) => onOpenEdit(b, e)}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          className="shalom-btn-icon danger"
                          title="Eliminar boleta"
                          onClick={(e) => onOpenDelete(b, e)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
