import jsPDF from 'jspdf';

export interface ManifestDataForPdf {
  id: string;
  fecha_vuelo: string;
  cliente: string;
  modalidad: string;
  guias_declaradas: number;
  paquetes_declarados: number;
  guias_extraidas: number;
  paquetes_extraidos: number;
  es_cuadre_perfecto: boolean;
  archivo_nombre: string;
  creado_por: string;
  creado_en: string;
}

export interface ManifestRowForPdf {
  guia: string;
  wrs: string[];
  observacion: string;
  fila_index?: number;
}

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

export function generateManifestDigitalPdf(
  manifest: ManifestDataForPdf,
  filas: ManifestRowForPdf[]
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182 mm

  const rowsPerPage = 28;
  const totalPages = Math.max(1, Math.ceil(filas.length / rowsPerPage));

  for (let page = 1; page <= totalPages; page++) {
    if (page > 1) {
      doc.addPage();
    }

    let y = 14;

    // --- ENCABEZADO SUPERIOR ---
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(marginX, y, contentWidth, 24, 2, 2, 'F');

    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('SISTEMA AMEX COURIER', marginX + 8, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('MANIFIESTO OFICIAL DE RECEPCIÓN & ENTREGA TIB', marginX + 8, y + 14);
    doc.text(`Doc Ref: ${sanitizeText(manifest.archivo_nombre || 'manifiesto.pdf')}`, marginX + 8, y + 19);

    // Badge Cuadre
    const cuadreColor = manifest.es_cuadre_perfecto ? [16, 185, 129] : [225, 29, 72];
    const cuadreText = manifest.es_cuadre_perfecto ? 'CUADRE PERFECTO' : 'DESCUADRE';
    doc.setFillColor(cuadreColor[0], cuadreColor[1], cuadreColor[2]);
    doc.roundedRect(pageWidth - marginX - 44, y + 5, 38, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cuadreText, pageWidth - marginX - 25, y + 9.5, { align: 'center' });

    // Fecha / Vuelo en badge derecho
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`VUELO: ${sanitizeText(manifest.fecha_vuelo)}`, pageWidth - marginX - 25, y + 16, { align: 'center' });
    doc.text(`MOD: ${sanitizeText(manifest.modalidad)}`, pageWidth - marginX - 25, y + 20, { align: 'center' });

    y += 28;

    // --- CAJAS DE METADATOS Y TOTALES (Solo en Página 1) ---
    if (page === 1) {
      const colW = contentWidth / 4;

      const stats = [
        { label: 'MODALIDAD', value: sanitizeText(manifest.modalidad || 'OFICINA'), sub: 'Ruta / Tipo' },
        { label: 'GUÍAS AMX', value: `${manifest.guias_extraidas} / ${manifest.guias_declaradas}`, sub: 'Extraídas / Declaradas' },
        { label: 'PAQUETES WR', value: `${manifest.paquetes_extraidos} / ${manifest.paquetes_declarados}`, sub: 'Bultos confirmados' },
        { label: 'OPERADOR', value: sanitizeText(manifest.creado_por || 'AMEX Admin').slice(0, 16), sub: 'Registrado en sistema' },
      ];

      stats.forEach((st, idx) => {
        const boxX = marginX + idx * colW;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(boxX, y, colW - 2, 13, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(st.label, boxX + 4, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(st.value, boxX + 4, y + 8.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(st.sub, boxX + 4, y + 11.5);
      });

      y += 16;
    }

    // --- TABLA DE GUÍAS Y WRs ---
    // Cabecera de Tabla
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginX, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    const cNum = marginX + 4;
    const cGuia = marginX + 16;
    const cObs = marginX + 60;
    const cWr = marginX + 115;
    const cCant = pageWidth - marginX - 6;

    doc.text('#', cNum, y + 4.8);
    doc.text('GUÍA AMX', cGuia, y + 4.8);
    doc.text('OBSERVACIÓN', cObs, y + 4.8);
    doc.text('CÓDIGOS WR ASIGNADOS', cWr, y + 4.8);
    doc.text('CANT', cCant, y + 4.8, { align: 'right' });

    y += 7;

    // Filas correspondientes a esta página
    const startIdx = (page - 1) * rowsPerPage;
    const endIdx = Math.min(filas.length, startIdx + rowsPerPage);
    const pageRows = filas.slice(startIdx, endIdx);

    pageRows.forEach((row, i) => {
      const globalIdx = startIdx + i + 1;
      const rowHeight = 7;
      const isEven = i % 2 === 0;

      // Fondo alternado
      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252); // slate-50
      }
      doc.rect(marginX, y, contentWidth, rowHeight, 'F');

      // Línea inferior sutil
      doc.setDrawColor(241, 245, 249);
      doc.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);

      // #
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(String(globalIdx), cNum, y + 4.8);

      // GUÍA
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(2, 132, 199); // sky-600
      doc.text(sanitizeText(row.guia || '-'), cGuia, y + 4.8);

      // OBSERVACIÓN
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105); // slate-600
      const obsText = sanitizeText(row.observacion || '-').slice(0, 36);
      doc.text(obsText, cObs, y + 4.8);

      // WRs
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const wrsJoined = row.wrs && row.wrs.length > 0 ? row.wrs.join(', ') : 'SIN WR';
      const isMulti = row.wrs && row.wrs.length > 1;

      if (isMulti) {
        doc.setTextColor(124, 58, 237); // violet-600
      } else if (wrsJoined === 'SIN WR') {
        doc.setTextColor(225, 29, 72); // rose-600
      } else {
        doc.setTextColor(30, 41, 59); // slate-800
      }

      const wrsDisplay = sanitizeText(wrsJoined).slice(0, 42);
      doc.text(wrsDisplay, cWr, y + 4.8);

      // CANTIDAD
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(String(row.wrs?.length || 0), cCant, y + 4.8, { align: 'right' });

      y += rowHeight;
    });

    // --- SECCIÓN DE FIRMAS (En la última página) ---
    if (page === totalPages) {
      const signY = pageHeight - 32;

      // Líneas de firma
      const signW = 65;
      const leftSignX = marginX + 15;
      const rightSignX = pageWidth - marginX - 15 - signW;

      doc.setDrawColor(148, 163, 184);
      doc.line(leftSignX, signY, leftSignX + signW, signY);
      doc.line(rightSignX, signY, rightSignX + signW, signY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text('CONFORMIDAD AMEX COURIER', leftSignX + signW / 2, signY + 3.5, { align: 'center' });
      doc.text('ENTREGA / TRANSPORTISTA TIB', rightSignX + signW / 2, signY + 3.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`Operador: ${sanitizeText(manifest.creado_por || 'Admin')}`, leftSignX + signW / 2, signY + 6.5, { align: 'center' });
      doc.text('Firma y Sello del Chofer/Despacho', rightSignX + signW / 2, signY + 6.5, { align: 'center' });
    }

    // --- PIE DE PÁGINA ---
    const footerY = pageHeight - 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generado por Sistema Amex Courier • Fecha de Registro: ${sanitizeText(manifest.creado_en || '')}`,
      marginX,
      footerY
    );
    doc.text(
      `Página ${page} de ${totalPages}`,
      pageWidth - marginX,
      footerY,
      { align: 'right' }
    );
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
