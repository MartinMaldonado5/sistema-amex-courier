import jsPDF from 'jspdf';
import saveAs from 'file-saver';

export interface RotuloSlotData {
  id: number; // 1 a 5
  nombre: string;
  dni: string;
  celular: string;
  agencia: 'SHALOM' | 'CRUZ DEL SUR' | 'OLVA' | 'MARVISUR' | 'MÓVIL BUS' | 'FLORES' | 'CIVA' | 'ANTEZANA' | 'OTRA' | string;
  agenciaOtra?: string;
  destino: string;
  remitente?: string;
  observacion?: string;
  totalRotulos?: number;
  totalCajas?: string | number;
  cajasPorBulto?: string | number;
  numeroRotulo?: number;
  siglas?: string;
  groupId?: string;
}

/**
 * Genera un archivo PDF en tamaño físico A4 (210 mm x 297 mm)
 * dividido exactamente en 5 franjas de 59.4 mm de alto cada una.
 */
export async function generateRotulosA4Pdf(
  slots: RotuloSlotData[],
  sheetTitle: string = 'Rotulos_Agencias_A4'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const stripHeight = 59.4; // 297 mm / 5 = 59.4 mm
  const pageWidth = 210.0;  // 210 mm
  const totalSheets = Math.max(1, Math.ceil(slots.length / 5));

  for (let pageIdx = 0; pageIdx < totalSheets; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    const pageSlots = slots.slice(pageIdx * 5, pageIdx * 5 + 5);

    for (let i = 0; i < 5; i++) {
      const slot = pageSlots[i] || {
        id: pageIdx * 5 + i + 1,
        nombre: '',
        dni: '',
        celular: '',
        agencia: 'SHALOM',
        destino: ''
      };

      const yStart = i * stripHeight;
      const yEnd = yStart + stripHeight;

    // Solo dibujar contenido si la franja tiene datos
    const hasData = Boolean(
      slot.nombre?.trim() ||
      slot.dni?.trim() ||
      slot.celular?.trim() ||
      slot.destino?.trim()
    );

    if (hasData) {
      // 1. Cabecera pequeña de la franja (Remitente y bulto/embalaje)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // Slate-600
      const remitenteText = slot.remitente?.trim() || 'AMEX COURIER PERÚ';
      doc.text(remitenteText.toUpperCase(), 12, yStart + 7.5);

      const bNum = slot.numeroRotulo || 1;
      const bTotR = slot.totalRotulos || 1;
      const bTotC = slot.totalCajas || '1';
      const obsText = (
        slot.observacion?.trim() ||
        `RÓTULO ${bNum} DE ${bTotR} • TOTAL: ${bTotC} ${Number(bTotC) === 1 ? 'CAJA' : 'CAJAS'}`
      ).toUpperCase();

      doc.setFont('helvetica', 'bold');
      let obsFontSize = 8.8;
      doc.setFontSize(obsFontSize);
      doc.setTextColor(15, 23, 42); // Slate-900 (alta legibilidad)
      const maxObsWidth = pageWidth - 12 - (12 + doc.getTextWidth(remitenteText.toUpperCase()) + 8);
      while (doc.getTextWidth(obsText) > maxObsWidth && obsFontSize > 6.0) {
        obsFontSize -= 0.5;
        doc.setFontSize(obsFontSize);
      }
      doc.text(obsText, pageWidth - 12, yStart + 7.5, { align: 'right' });

      // Siglas / Código de envío (alineado a la derecha junto al destinatario)
      if (slot.siglas?.trim()) {
        const siglasText = slot.siglas.trim().toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); // Slate-900
        const siglaWidth = Math.max(24, doc.getTextWidth(siglasText) + 8);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.4);
        doc.roundedRect(pageWidth - 12 - siglaWidth, yStart + 13.5, siglaWidth, 8, 1.2, 1.2, 'FD');
        doc.text(siglasText, pageWidth - 12 - (siglaWidth / 2), yStart + 19.2, { align: 'center' });
      }

      // 2. Destinatario (Nombres y Apellidos en grande y negrita)
      doc.setFont('helvetica', 'bold');
      let nombreFontSize = 19;
      doc.setFontSize(nombreFontSize);
      doc.setTextColor(15, 23, 42); // Slate-900
      const nombreText = (slot.nombre || 'NOMBRE Y APELLIDO').toUpperCase();
      const maxNombreWidth = slot.siglas?.trim() ? pageWidth - 12 - 40 - 12 : pageWidth - 24;
      while (doc.getTextWidth(nombreText) > maxNombreWidth && nombreFontSize > 13) {
        nombreFontSize -= 0.5;
        doc.setFontSize(nombreFontSize);
      }
      doc.text(nombreText, 12, yStart + 19.5);

      // 3. DNI / RUC y CELULAR (distribuidos en línea para mayor presencia)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // Slate-900 para máxima nitidez
      const dniText = slot.dni ? `DNI / RUC: ${slot.dni}` : 'DNI / RUC: —';
      const celText = slot.celular ? `CEL: ${slot.celular}` : 'CEL: —';
      doc.text(dniText, 12, yStart + 31.5);
      const dniWidth = doc.getTextWidth(dniText);
      doc.text(celText, 12 + dniWidth + 10, yStart + 31.5);

      // 4. Recuadro destacado para la Agencia y el Destino (en la franja inferior)
      const agencyName = slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
        ? slot.agenciaOtra.toUpperCase()
        : slot.agencia;

      // Colores según agencia
      let badgeR = 220, badgeG = 38, badgeB = 38; // Shalom rojo
      let badgeTextR = 255, badgeTextG = 255, badgeTextB = 255;

      if (agencyName.includes('CRUZ DEL SUR')) {
        badgeR = 30; badgeG = 58; badgeB = 138; // Navy azul
      } else if (agencyName.includes('OLVA')) {
        badgeR = 234; badgeG = 179; badgeB = 8;  // Amarillo Olva
        badgeTextR = 0; badgeTextG = 0; badgeTextB = 0; // Texto negro
      } else if (agencyName.includes('MARVISUR')) {
        badgeR = 234; badgeG = 88; badgeB = 12; // Naranja Marvisur
      } else if (agencyName.includes('MÓVIL') || agencyName.includes('MOVIL')) {
        badgeR = 139; badgeG = 92; badgeB = 246; // Púrpura Móvil Bus
      } else if (agencyName.includes('FLORES')) {
        badgeR = 16; badgeG = 185; badgeB = 129; // Esmeralda Flores Hermanos
      } else if (agencyName.includes('CIVA')) {
        badgeR = 244; badgeG = 63; badgeB = 94; // Rosa / Rojo Civa
      } else if (agencyName.includes('ANTEZANA')) {
        badgeR = 2; badgeG = 132; badgeB = 199; // Celeste Antezana
      } else if (slot.agencia === 'OTRA') {
        badgeR = 79; badgeG = 70; badgeB = 229; // Indigo
      }

      // Pastilla de la Agencia
      const badgeWidth = Math.max(34, doc.getTextWidth(agencyName) + 10);
      doc.setFillColor(badgeR, badgeG, badgeB);
      doc.roundedRect(12, yStart + 42, badgeWidth, 9.5, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(badgeTextR, badgeTextG, badgeTextB);
      doc.text(agencyName, 12 + badgeWidth / 2, yStart + 48.2, { align: 'center' });

      // Texto del Destino / Agencia de Entrega (adaptado para hasta 80 caracteres)
      const maxDestWidth = pageWidth - 12 - (12 + badgeWidth + 4);
      const destinoRaw = slot.destino?.trim() ? slot.destino.trim().toUpperCase() : 'DESTINO NO ESPECIFICADO';
      const fullDestText = `DESTINO: ${destinoRaw}`;

      doc.setFont('helvetica', 'bold');
      let destFontSize = 12.5;
      doc.setFontSize(destFontSize);
      doc.setTextColor(15, 23, 42);

      // Si entra en 1 sola línea ajustando levemente (textos cortos a medianos):
      if (doc.getTextWidth(fullDestText) <= maxDestWidth) {
        doc.text(fullDestText, 12 + badgeWidth + 4, yStart + 48.2);
      } else {
        // Para destinos largos de hasta 80 caracteres, aprovechar al 100% la primera línea
        destFontSize = 9.5;
        doc.setFontSize(destFontSize);
        let line1 = '';
        let line2 = '';

        const lines = doc.splitTextToSize(fullDestText, maxDestWidth);
        if (lines.length === 2 && doc.getTextWidth(lines[0]) >= maxDestWidth * 0.65) {
          line1 = lines[0];
          line2 = lines[1];
        } else {
          let idx1 = 0;
          while (idx1 < fullDestText.length && doc.getTextWidth(fullDestText.slice(0, idx1 + 1)) <= maxDestWidth) {
            idx1++;
          }
          line1 = fullDestText.slice(0, idx1);
          const rest = fullDestText.slice(idx1).trimStart();

          let idx2 = 0;
          while (idx2 < rest.length && doc.getTextWidth(rest.slice(0, idx2 + 1)) <= maxDestWidth) {
            idx2++;
          }
          line2 = rest.slice(0, idx2);

          if (idx2 < rest.length) {
            destFontSize = 8.5;
            doc.setFontSize(destFontSize);
            let s1 = 0;
            while (s1 < fullDestText.length && doc.getTextWidth(fullDestText.slice(0, s1 + 1)) <= maxDestWidth) {
              s1++;
            }
            line1 = fullDestText.slice(0, s1);
            const sRest = fullDestText.slice(s1).trimStart();
            let s2 = 0;
            while (s2 < sRest.length && doc.getTextWidth(sRest.slice(0, s2 + 1)) <= maxDestWidth) {
              s2++;
            }
            line2 = sRest.slice(0, s2);
          }
        }

        if (!line2) {
          doc.text(line1, 12 + badgeWidth + 4, yStart + 48.2);
        } else {
          doc.text(line1, 12 + badgeWidth + 4, yStart + 45.5);
          doc.text(line2, 12 + badgeWidth + 4, yStart + 50.5);
        }
      }

    } else {
      // Franja vacía: marca de agua tenue
      const sheetNum = pageIdx + 1;
      const slotInSheet = i + 1;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225); // Slate-300
      doc.text(`[ Hoja ${sheetNum} — Espacio #${slotInSheet} libre ]`, pageWidth / 2, yStart + 29.7, { align: 'center' });
    }

    // 6. Línea de corte punteada entre franjas (solo las rayas, sin textos)
    if (i < 4) {
      doc.setDrawColor(180, 190, 205);
      doc.setLineWidth(0.35);
      doc.setLineDashPattern([2.5, 2.5], 0);
      doc.line(6, yEnd, pageWidth - 6, yEnd);
      doc.setLineDashPattern([], 0); // Restaurar línea sólida
    }
  }
  }

  // Descarga del PDF
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanTitle = sheetTitle.replace(/[\\/:*?"<>|]/g, '_').trim();
  const filename = `${cleanTitle}_${totalSheets}Hojas_${dateStr}.pdf`;

  const pdfBlob = doc.output('blob');
  saveAs(pdfBlob, filename);
}
