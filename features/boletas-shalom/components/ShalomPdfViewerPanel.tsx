'use client';

import React from 'react';
import { FileText, ExternalLink, Copy, Check, X } from 'lucide-react';
import { BoletaShalom } from '@/types';
import { getR2ViewUrl } from '@/lib/r2/client';

interface ShalomPdfViewerPanelProps {
  selectedBoleta: BoletaShalom;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onClose: () => void;
}

export const ShalomPdfViewerPanel: React.FC<ShalomPdfViewerPanelProps> = ({
  selectedBoleta,
  copiedId,
  onCopy,
  onClose
}) => {
  const viewerUrl = getR2ViewUrl(selectedBoleta.pdf_url);

  return (
    <aside className="shalom-viewer-panel">
      <div className="shalom-viewer-header">
        <div className="shalom-viewer-title-group">
          <span className="shalom-viewer-title">
            <FileText size={16} className="text-sky-400" />
            Guía {selectedBoleta.numero_guia}
          </span>
          <span className="shalom-viewer-sub">
            {selectedBoleta.destinatario_nombre} • {selectedBoleta.destino}
          </span>
        </div>

        <div className="shalom-viewer-tools">
          <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shalom-btn-icon"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            className="shalom-btn-icon"
            title="Copiar enlace del PDF"
            onClick={() => onCopy(viewerUrl, 'viewer-url')}
          >
            {copiedId === 'viewer-url' ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          <button
            type="button"
            className="shalom-btn-icon"
            title="Cerrar visor"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="shalom-viewer-iframe-wrap">
        <iframe
          src={viewerUrl}
          className="shalom-viewer-iframe"
          title={`Boleta ${selectedBoleta.numero_guia}`}
        />
      </div>

      {/* Metadatos extraídos de la Boleta / Ticket */}
      <div className="shalom-viewer-metadata">
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">N° Orden / Cód:</span>
          <span className="shalom-meta-val font-mono text-sky-400">
            {selectedBoleta.nro_orden || selectedBoleta.numero_guia}
            {(selectedBoleta.codigo || selectedBoleta.codigo_seguimiento) && (
              <span className="text-slate-400 ml-1">
                (Cód: {selectedBoleta.codigo || selectedBoleta.codigo_seguimiento})
              </span>
            )}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Fechas:</span>
          <span className="shalom-meta-val">
            Emisión: {selectedBoleta.fecha_emision} {selectedBoleta.hora_emision || ''}
            {selectedBoleta.fecha_traslado && (
              <span className="text-sky-300 ml-1">| Traslado: {selectedBoleta.fecha_traslado}</span>
            )}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Remitente:</span>
          <span className="shalom-meta-val">
            {selectedBoleta.remitente_nombre || 'QUINTANA CORNEJO BLANCA ESTHER'}
            {(selectedBoleta.remitente_dni || selectedBoleta.remitente_documento) && (
              <span className="text-slate-400 ml-1">
                (DNI: {selectedBoleta.remitente_dni || selectedBoleta.remitente_documento}
                {selectedBoleta.remitente_telefono ? ` | Tel: ${selectedBoleta.remitente_telefono}` : ''})
              </span>
            )}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Destinatario:</span>
          <span className="shalom-meta-val">
            {selectedBoleta.destinatario_nombre}
            {(selectedBoleta.destinatario_dni || selectedBoleta.destinatario_documento) && (
              <span className="text-slate-400 ml-1">
                (DNI: {selectedBoleta.destinatario_dni || selectedBoleta.destinatario_documento}
                {selectedBoleta.destinatario_telefono ? ` | Tel: ${selectedBoleta.destinatario_telefono}` : ''})
              </span>
            )}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Origen:</span>
          <span className="shalom-meta-val truncate max-w-[220px]" title={selectedBoleta.origen}>
            {selectedBoleta.origen || 'LINCE - LIMA'}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Destino:</span>
          <span className="shalom-meta-val truncate max-w-[220px]" title={selectedBoleta.destino}>
            {selectedBoleta.destino}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Entrega:</span>
          <span className="shalom-meta-val text-sky-400">
            {selectedBoleta.tipo_entrega || selectedBoleta.agencia_destino || 'ENTREGAR EN AGENCIA'}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Detalle Envío:</span>
          <span className="shalom-meta-val">
            {selectedBoleta.cantidad || 1}x {selectedBoleta.descripcion || selectedBoleta.contenido_bultos || 'BULTO'}
            {' '}({selectedBoleta.peso !== undefined ? selectedBoleta.peso : (selectedBoleta.peso_total || 0)} {selectedBoleta.unidad_medida || 'Volumen'})
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Forma de Pago:</span>
          <span className="shalom-meta-val text-amber-400">
            {selectedBoleta.forma_pago || (selectedBoleta.modalidad_pago === 'PAGO_DESTINO' ? 'Pendiente de Pago' : selectedBoleta.modalidad_pago || 'Pendiente')}
          </span>
        </div>
        <div className="shalom-meta-row">
          <span className="shalom-meta-key">Monto Total:</span>
          <span className="shalom-meta-val text-emerald-400 font-mono font-bold">
            S/ {(Number(selectedBoleta.monto_total) || 0).toFixed(2)}
          </span>
        </div>
        {selectedBoleta.observaciones && (
          <div className="shalom-meta-row">
            <span className="shalom-meta-key">Observaciones:</span>
            <span className="shalom-meta-val text-[11px] text-slate-300 italic truncate max-w-[220px]" title={selectedBoleta.observaciones}>
              {selectedBoleta.observaciones}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
