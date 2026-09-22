'use client';

import React from 'react';
import { ActaEntregaData } from '../types';

interface ActaDocumentPreviewProps {
  data: ActaEntregaData;
}

export default function ActaDocumentPreview({ data }: ActaDocumentPreviewProps) {
  const validPkgs = (data.paquetes || []).filter(p => p && p.trim().length > 0);
  const pkgCount = validPkgs.length;
  const countLabel = `${pkgCount} ${pkgCount === 1 ? 'PAQUETE' : 'PAQUETES'}`;

  // Selección de Logo según configuración
  const logoSrc = data.logoStyle === 'original'
    ? '/logo-amex.jpg'
    : data.logoStyle === 'badge'
      ? '/images/logo-amex-badge.jpg'
      : '/images/logo-amex-clean.png';

  return (
    <div className="acta-document-container" id="acta-print-area">
      <div className="acta-a4-sheet">
        {/* Encabezado: Logo AMEX Courier + Título */}
        <div className="acta-header-row">
          <div className="acta-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo AMEX Courier"
              className={`acta-logo-img ${data.logoStyle === 'clean' ? 'is-clean' : 'is-badge'}`}
            />
          </div>
          <div className="acta-title-wrap">
            <h1 className="acta-main-title">ACTA DE ENTREGA</h1>
          </div>
        </div>

        {/* 1. Tabla Superior de Datos */}
        <table className="acta-meta-table">
          <tbody>
            <tr>
              <td className="acta-meta-label">Fecha:</td>
              <td className="acta-meta-value">{data.fecha || '—'}</td>
            </tr>
            <tr>
              <td className="acta-meta-label">Remitente:</td>
              <td className="acta-meta-value">{data.remitente || 'AMEX COURRIER'}</td>
            </tr>
            <tr>
              <td className="acta-meta-label">Destinatario:</td>
              <td className="acta-meta-value font-bold-name">
                {data.destinatario ? data.destinatario.toUpperCase() : '____________________________________'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 2. Recuadro Central de Paquetes */}
        <div className="acta-packages-box">
          <div className="acta-packages-col-left">
            {validPkgs.length > 0 ? (
              <div className="acta-codes-grid">
                {validPkgs.map((code, idx) => (
                  <div key={`${code}-${idx}`} className="acta-pkg-code">
                    {code}
                  </div>
                ))}
              </div>
            ) : (
              <div className="acta-empty-placeholder">
                [Sin paquetes agregados]
              </div>
            )}
          </div>

          <div className="acta-packages-col-right">
            <span className="acta-packages-count-badge">
              {countLabel}
            </span>
          </div>
        </div>

        {/* 3. Cláusula de Cargo y Conformidad */}
        <div className="acta-cargo-clause">
          <span className="acta-cargo-tag">CARGO: </span>
          <span className="acta-cargo-underlined">
            Certifico que he recibido el(los) paquete(s) indicado(s)
          </span>
          <div className="acta-cargo-underlined-indented">
            Anteriormente en buen estado y conforme a lo descrito.
          </div>
        </div>

        {/* 4. Tabla Recibido Por */}
        <div className="acta-recibido-section">
          <div className="acta-recibido-header">
            Recibido por
          </div>
          <table className="acta-recibido-table">
            <tbody>
              <tr>
                <td className="acta-field-label">Nombre:</td>
                <td className="acta-field-fill">
                  {data.recibidoPorNombre || ''}
                </td>
              </tr>
              <tr>
                <td className="acta-field-label">Fecha:</td>
                <td className="acta-field-fill">
                  {data.recibidoPorFecha || ''}
                </td>
              </tr>
              <tr>
                <td className="acta-field-label">Hora:</td>
                <td className="acta-field-fill">
                  {data.recibidoPorHora || ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Línea de Firma */}
        <div className="acta-signature-section">
          <span className="acta-sig-label">Firma:</span>
          <div className="acta-sig-line"></div>
        </div>
      </div>
    </div>
  );
}
