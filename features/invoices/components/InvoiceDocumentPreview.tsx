'use client';

import React from 'react';
import { InvoiceData } from '../types';

interface InvoiceDocumentPreviewProps {
  data: InvoiceData;
}

export function InvoiceDocumentPreview({ data }: InvoiceDocumentPreviewProps) {
  const formattedAmount = typeof data.invoiceAmount === 'number'
    ? `$${data.invoiceAmount.toFixed(2)}`
    : `$${String(data.invoiceAmount || '0.00').replace('$', '')}`;

  return (
    <div className="invoice-preview-container">
      {/* Barra de estado / encabezado de la hoja */}
      <div className="invoice-preview-toolbar no-print">
        <span className="invoice-preview-badge">
          <i className="fa-solid fa-file-lines text-sky-400"></i> Vista Previa A4 / Letter (Idéntico al Word)
        </span>
        <span className="invoice-preview-info">
          N° {data.invoiceNumber || 'S/N'} • {data.items?.length || 0} ítems • {formattedAmount}
        </span>
      </div>

      {/* Hoja Física Simulada (A4/Letter) */}
      <div className="invoice-paper" id="invoice-printable-area">
        {/* Título Principal */}
        <div className="invoice-title">Invoice</div>

        {/* Encabezado Superior en 2 Columnas */}
        <div className="invoice-top-grid">
          {/* Columna Izquierda: Datos de la Empresa (Fijos) */}
          <div className="invoice-company-box">
            <div className="company-name">{data.companyName}</div>
            <div className="company-address">{data.companyAddress}</div>
            <div className="company-phone">{data.companyCityPhone}</div>
          </div>

          {/* Columna Derecha: Metadatos de la Factura */}
          <div className="invoice-meta-box">
            <div className="meta-row">
              <span className="meta-label">Invoice Number</span>
              <span className="meta-value font-mono">{data.invoiceNumber || '-'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Invoice Date:</span>
              <span className="meta-value">{data.invoiceDate || '30/07/2026'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Payment Terms:</span>
              <span className="meta-value">{data.paymentTerms || 'Due On Receipt'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Invoice Due Date:</span>
              <span className="meta-value">{data.invoiceDueDate || '30/07/2026'}</span>
            </div>
            <div className="meta-row amount-row">
              <span className="meta-label">Invoice Amount:</span>
              <span className="meta-value amount-highlight">{formattedAmount}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Created By:</span>
              <span className="meta-value">{data.createdBy || 'ORDER Ronxana'}</span>
            </div>
          </div>
        </div>

        {/* Sección de Destinatarios: Bill To / Ship To */}
        <div className="invoice-recipients-grid">
          <div className="recipient-col">
            <div className="recipient-header">Bill To</div>
            <div className="recipient-name">{data.billToName || '—'}</div>
          </div>
          <div className="recipient-col">
            <div className="recipient-header">Ship To</div>
            <div className="recipient-name">{data.shipToName || data.billToName || '—'}</div>
          </div>
        </div>

        {/* Tabla de Ítems */}
        <div className="invoice-table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th className="col-item-name">Item Name</th>
                <th className="col-qty">Quantity</th>
                <th className="col-price">Unit Price</th>
                <th className="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Cuerpo de la tabla que contiene las listas y llena el espacio visual */}
              <tr className="table-tall-body-row">
                {/* Columna 1: Nombres de ítems */}
                <td className="cell-items-column">
                  <div className="column-inner-list">
                    {(data.items || []).map((item, idx) => (
                      <div key={item.id || idx} className="item-name-line">
                        {item.name || <span className="opacity-40 italic">Sin descripción</span>}
                      </div>
                    ))}
                    {(!data.items || data.items.length === 0) && (
                      <div className="empty-items-notice">No se han registrado ítems</div>
                    )}
                  </div>
                </td>

                {/* Columna 2: Cantidades */}
                <td className="cell-qty-column">
                  <div className="column-inner-list text-center">
                    {(data.items || []).map((item, idx) => (
                      <div key={item.id || idx} className="qty-line">
                        {item.quantity ?? '1'}
                      </div>
                    ))}
                  </div>
                </td>

                {/* Columna 3: Precios Unitarios */}
                <td className="cell-price-column">
                  <div className="column-inner-list text-right">
                    {(data.items || []).map((item, idx) => {
                      const p = item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '';
                      return (
                        <div key={item.id || idx} className="price-line">
                          {p}
                        </div>
                      );
                    })}
                  </div>
                </td>

                {/* Columna 4: Totales de Fila */}
                <td className="cell-total-column">
                  <div className="column-inner-list text-right">
                    {(data.items || []).map((item, idx) => {
                      const t = item.total ? `$${Number(item.total).toFixed(2)}` : '';
                      return (
                        <div key={item.id || idx} className="total-line">
                          {t}
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
