import jsPDF from 'jspdf';
import { ActaEntregaData } from '../types';

/**
 * Carga una imagen como DataURL de forma segura en el navegador
 */
async function getBase64ImageFromUrl(imageUrl: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('No se pudo cargar el logo para el PDF:', err);
    return null;
  }
}

/**
 * Sanitiza texto para evitar problemas con codificación WinAnsi en jsPDF
 */
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
 * Genera y descarga el archivo PDF en tamaño A4 idéntico al formato oficial
 */
export async function generateActaEntregaPdf(data: ActaEntregaData, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const marginX = 22; // Margen izquierdo y derecho estándar
  const pageWidth = 210;
  const contentWidth = pageWidth - (marginX * 2); // 166 mm
  let currentY = 24;

  // 1. Cargar Logo Oficial de AMEX COURIER
  const logoUrl = data.logoStyle === 'original' 
    ? '/logo-amex.jpg' 
    : data.logoStyle === 'badge' 
      ? '/images/logo-amex-badge.jpg' 
      : '/images/logo-amex-clean.png';

  const logoBase64 = await getBase64ImageFromUrl(logoUrl);

  // Encabezado con Logo y Título
  if (logoBase64) {
    try {
      if (data.logoStyle === 'clean') {
        // Logo limpio apaisado
        doc.addImage(logoBase64, 'PNG', marginX, currentY - 4, 48, 16);
      } else {
        // Logo tipo insignia
        doc.addImage(logoBase64, 'JPEG', marginX, currentY - 6, 45, 18);
      }
    } catch {
      // Continuar sin logo si ocurre algún error
    }
  }

  // Título del Documento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900

  // Si hay logo, posicionamos el título alineado o centrado
  const titleX = logoBase64 ? marginX + 54 : marginX;
  doc.text('ACTA DE ENTREGA', titleX, currentY + 7);

  currentY += 28;

  // 2. Tabla Superior de Datos (Fecha, Remitente, Destinatario)
  const labelColWidth = 42;
  const rowHeight = 11.5;

  const tableFields = [
    { label: 'Fecha:', value: sanitizeText(data.fecha) },
    { label: 'Remitente:', value: sanitizeText(data.remitente || 'AMEX COURRIER') },
    { label: 'Destinatario:', value: sanitizeText(data.destinatario).toUpperCase() }
  ];

  tableFields.forEach((field, index) => {
    const rowY = currentY + (index * rowHeight);

    // Fondo grisáceo suave idéntico a Google Docs (#f1f5f9)
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, rowY, labelColWidth, rowHeight, 'F');

    // Borde muy sutil o fondo blanco para valor
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.rect(marginX, rowY, contentWidth, rowHeight, 'S');

    // Texto Etiqueta
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(field.label, marginX + 4, rowY + 7.5);

    // Texto Valor
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(field.value, marginX + labelColWidth + 5, rowY + 7.5);
  });

  currentY += (tableFields.length * rowHeight) + 12;

  // 3. Recuadro Central de Paquetes (Adaptativo de 1 a 100 códigos)
  const validPkgs = (data.paquetes || []).map(p => sanitizeText(p)).filter(Boolean);
  const pkgCount = validPkgs.length;

  let numCols = 1;
  let fontSize = 11;
  let lineHeight = 6.8;
  let colWidth = 65;
  let badgeXPercent = 0.58;
  let badgeFontSize = 13;

  if (pkgCount > 80) {
    numCols = 5;
    fontSize = 6.8;
    lineHeight = 3.6;
    colWidth = 26.5;
    badgeXPercent = 0.77;
    badgeFontSize = 10;
  } else if (pkgCount > 54) {
    numCols = 4;
    fontSize = 7.4;
    lineHeight = 3.8;
    colWidth = 28.5;
    badgeXPercent = 0.74;
    badgeFontSize = 11;
  } else if (pkgCount > 28) {
    numCols = 3;
    fontSize = 8.4;
    lineHeight = 4.4;
    colWidth = 34;
    badgeXPercent = 0.68;
    badgeFontSize = 11.5;
  } else if (pkgCount > 12) {
    numCols = 2;
    fontSize = 9.5;
    lineHeight = 5.2;
    colWidth = 42;
    badgeXPercent = 0.62;
    badgeFontSize = 12;
  }

  const rowsPerCol = Math.ceil(pkgCount / numCols);
  const minBoxHeight = 65;
  const calculatedHeight = Math.max(minBoxHeight, (rowsPerCol * lineHeight) + 14);
  const boxHeight = Math.min(calculatedHeight, 95);

  // Borde negro formal continuo
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(0.8);
  doc.rect(marginX, currentY, contentWidth, boxHeight, 'S');

  // Códigos de paquetes distribuidos en columnas
  doc.setFont('courier', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(15, 23, 42);

  const pkgStartY = currentY + (numCols > 2 ? 8 : 10);
  const startX = marginX + 6;

  validPkgs.forEach((pkgCode, idx) => {
    const colIndex = Math.floor(idx / rowsPerCol);
    const rowIndex = idx % rowsPerCol;
    const xPos = startX + (colIndex * colWidth);
    const yPos = pkgStartY + (rowIndex * lineHeight);

    if (yPos <= currentY + boxHeight - 2) {
      doc.text(pkgCode, xPos, yPos);
    }
  });

  // Centro / Derecha: Conteo destacado de Paquetes
  const countLabel = `${pkgCount} ${pkgCount === 1 ? 'PAQUETE' : 'PAQUETES'}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(badgeFontSize);
  doc.setTextColor(15, 23, 42);

  const countX = marginX + (contentWidth * badgeXPercent);
  const countY = currentY + (boxHeight / 2) + 1;
  doc.text(countLabel, countX, countY);

  // Subrayado del conteo
  const textWidth = doc.getTextWidth(countLabel);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(countX, countY + 1.2, countX + textWidth, countY + 1.2);

  currentY += boxHeight + 11;

  // 4. Cláusula de Cargo (Centrado horizontal)
  const tagText = 'CARGO: ';
  const cargoLine1 = 'Certifico que he recibido el(los) paquete(s) indicado(s)';
  const cargoLine2 = 'Anteriormente en buen estado y conforme a lo descrito.';

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  const tagWidth = doc.getTextWidth(tagText);

  doc.setFont('helvetica', 'normal');
  const line1TextWidth = doc.getTextWidth(cargoLine1);
  const totalLine1Width = tagWidth + line1TextWidth;
  const line2Width = doc.getTextWidth(cargoLine2);

  const centerX = marginX + (contentWidth / 2);
  const line1StartX = centerX - (totalLine1Width / 2);
  const line2StartX = centerX - (line2Width / 2);

  // Línea 1 centrada: CARGO: [texto subrayado]
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tagText, line1StartX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(cargoLine1, line1StartX + tagWidth, currentY);
  // Subrayado de línea 1
  doc.line(line1StartX + tagWidth, currentY + 0.8, line1StartX + totalLine1Width, currentY + 0.8);

  // Línea 2 centrada: [texto subrayado]
  currentY += 5.5;
  doc.text(cargoLine2, line2StartX, currentY);
  // Subrayado de línea 2
  doc.line(line2StartX, currentY + 0.8, line2StartX + line2Width, currentY + 0.8);

  currentY += 14;

  // 5. Sección Recibido Por con Renglones Amplios
  // Encabezado
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, contentWidth, 9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, 9, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Recibido por', marginX + 5, currentY + 6.2);

  currentY += 9;

  const rowRecibidoHeight = 13;
  const recibidoFields = [
    { label: 'Nombre:', value: sanitizeText(data.recibidoPorNombre) },
    { label: 'Fecha:', value: sanitizeText(data.recibidoPorFecha) },
    { label: 'Hora:', value: sanitizeText(data.recibidoPorHora) }
  ];

  recibidoFields.forEach((item, index) => {
    const rowY = currentY + (index * rowRecibidoHeight);

    // Borde inferior sutil de la fila
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, rowY + rowRecibidoHeight, marginX + contentWidth, rowY + rowRecibidoHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(item.label, marginX + 5, rowY + 8.5);

    if (item.value) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(item.value, marginX + 28, rowY + 8.5);
    }
  });

  currentY += (recibidoFields.length * rowRecibidoHeight) + 22;

  // 6. Sección de Firma Amplia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Firma: ', marginX + 5, currentY);

  // Línea continua de firma
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.6);
  doc.line(marginX + 20, currentY, marginX + 135, currentY);

  // Guardar archivo PDF
  const safeClient = sanitizeText(data.destinatario).replace(/[^a-zA-Z0-9_-]/g, '_') || 'Cliente';
  const finalName = filename || `Acta_Entrega_${safeClient}_${Date.now()}.pdf`;
  doc.save(finalName);
}
