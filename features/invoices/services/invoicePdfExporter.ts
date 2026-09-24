import jsPDF from 'jspdf';
import { InvoiceData } from '../types';

function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '•')
    .replace(/[^\x20-\x7E\xA0-\xFF\u2022]/g, '')
    .trim();
}

/**
 * Genera y descarga un PDF de la factura con el formato de zxzxzxzx.docx
 */
export async function generateInvoicePdf(data: InvoiceData, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm (idéntico a Word letter)
  });

  const marginX = 14;
  const pageWidth = 215.9;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 18;

  // 1. Título "Invoice"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(46, 91, 151); // #2E5B97
  doc.text('Invoice', marginX, currentY);
  currentY += 10;

  // 2. Encabezado en dos columnas (Izquierda: Empresa | Derecha: Metadatos)
  const leftX = marginX;
  const rightLabelX = 140;
  const rightValueX = pageWidth - marginX;

  // Columna Izquierda (Empresa)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(83, 83, 83); // #535353
  doc.text(sanitizeText(data.companyName || 'ACCESSORIES SALES'), leftX, currentY);

  // Columna Derecha (Invoice Number)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Invoice Number:', rightLabelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(String(data.invoiceNumber || '')), rightValueX, currentY, { align: 'right' });

  currentY += 5;

  // Columna Izquierda (Address)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(83, 83, 83);
  doc.text(sanitizeText(data.companyAddress || '4771 NW 72nd Ave Miami'), leftX, currentY);

  // Columna Derecha (Invoice Date)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Invoice Date:', rightLabelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(data.invoiceDate || '30/07/2026'), rightValueX, currentY, { align: 'right' });

  currentY += 5;

  // Columna Derecha (Payment Terms)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Payment Terms:', rightLabelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(data.paymentTerms || 'Due On Receipt'), rightValueX, currentY, { align: 'right' });

  currentY += 4;

  // Columna Izquierda (Phone)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(83, 83, 83);
  doc.text(sanitizeText(data.companyCityPhone || 'FL 33166 Phone:702-5159055'), leftX, currentY);

  // Columna Derecha (Invoice Due Date)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Invoice Due Date:', rightLabelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(data.invoiceDueDate || '30/07/2026'), rightValueX, currentY, { align: 'right' });

  currentY += 6;

  // Columna Derecha (Invoice Amount)
  const formattedAmount = `$${typeof data.invoiceAmount === 'number' ? data.invoiceAmount.toFixed(2) : String(data.invoiceAmount || '0.00').replace('$', '')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(60, 59, 59);
  doc.text('Invoice Amount:', rightLabelX, currentY);
  doc.setTextColor(33, 33, 33);
  doc.text(formattedAmount, rightValueX, currentY, { align: 'right' });

  currentY += 5;

  // Columna Derecha (Created By)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Created By:', rightLabelX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizeText(data.createdBy || 'ORDER Ronxana'), rightValueX, currentY, { align: 'right' });

  currentY += 12;

  // 3. Destinatarios: Bill To y Ship To
  const colHalfWidth = contentWidth / 2;
  const billToX = marginX;
  const shipToX = marginX + colHalfWidth;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 59, 59);
  doc.text('Bill To', billToX, currentY);
  doc.text('Ship To', shipToX, currentY);

  currentY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(33, 33, 33);
  doc.text(sanitizeText(data.billToName || ''), billToX, currentY);
  doc.text(sanitizeText(data.shipToName || data.billToName || ''), shipToX, currentY);

  currentY += 8;

  // 4. Tabla de Ítems
  // Anchos de columnas en mm: Item Name (52%), Qty (12%), Unit Price (18%), Total (18%)
  const wItem = contentWidth * 0.52;
  const wQty = contentWidth * 0.12;
  const wPrice = contentWidth * 0.18;
  const wTotal = contentWidth * 0.18;

  const xItem = marginX;
  const xQty = xItem + wItem;
  const xPrice = xQty + wQty;
  const xTotal = xPrice + wPrice;

  // Encabezado con fondo azul #2E5B97
  const headerHeight = 7.5;
  doc.setFillColor(46, 91, 151); // #2E5B97
  doc.rect(marginX, currentY, contentWidth, headerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Item Name', xItem + 3, currentY + 5.2);
  doc.text('Quantity', xQty + (wQty / 2), currentY + 5.2, { align: 'center' });
  doc.text('Unit Price', xPrice + wPrice - 3, currentY + 5.2, { align: 'right' });
  doc.text('Total', xTotal + wTotal - 3, currentY + 5.2, { align: 'right' });

  currentY += headerHeight;

  // Caja de items (altura mínima como en Word: ~110 mm)
  const bodyStartY = currentY;
  const bodyMinHeight = 110;
  let bodyContentY = currentY + 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(33, 33, 33);

  (data.items || []).forEach(item => {
    doc.text(sanitizeText(item.name || ''), xItem + 3, bodyContentY);
    doc.text(String(item.quantity || ''), xQty + (wQty / 2), bodyContentY, { align: 'center' });
    const pStr = item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '';
    const tStr = item.total ? `$${Number(item.total).toFixed(2)}` : '';
    doc.text(pStr, xPrice + wPrice - 3, bodyContentY, { align: 'right' });
    doc.text(tStr, xTotal + wTotal - 3, bodyContentY, { align: 'right' });
    bodyContentY += 4.5;
  });

  const actualBodyHeight = Math.max(bodyMinHeight, bodyContentY - bodyStartY + 5);

  // Líneas divisorias de la tabla (gris suave #999999)
  doc.setDrawColor(153, 153, 153);
  doc.setLineWidth(0.2);

  // Borde exterior del cuerpo (izq, der, fondo)
  doc.line(marginX, bodyStartY, marginX, bodyStartY + actualBodyHeight); // Borde izq
  doc.line(marginX + contentWidth, bodyStartY, marginX + contentWidth, bodyStartY + actualBodyHeight); // Borde der
  doc.line(marginX, bodyStartY + actualBodyHeight, marginX + contentWidth, bodyStartY + actualBodyHeight); // Borde inferior

  // Líneas verticales internas de columnas
  doc.line(xQty, bodyStartY, xQty, bodyStartY + actualBodyHeight);
  doc.line(xPrice, bodyStartY, xPrice, bodyStartY + actualBodyHeight);
  doc.line(xTotal, bodyStartY, xTotal, bodyStartY + actualBodyHeight);

  // Guardar archivo solo con el nombre de Bill To
  const cleanBillTo = (data.billToName || 'INVOICE').trim();
  const safeBillTo = cleanBillTo.replace(/[/\\?%*:|"<>]/g, '').trim() || 'INVOICE';
  const finalFilename = filename || `${safeBillTo}.pdf`;

  doc.save(finalFilename);
}
