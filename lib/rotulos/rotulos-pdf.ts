import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

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

  for (let i = 0; i < 5; i++) {
    const slot = slots[i] || {
      id: i + 1,
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
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      const remitenteText = slot.remitente?.trim() || 'AMEX COURIER PERÚ';
      doc.text(remitenteText.toUpperCase(), 12, yStart + 7);

      if (slot.observacion?.trim()) {
        const obsText = slot.observacion.toUpperCase();
        doc.setFont('helvetica', 'bold');
        let obsFontSize = 8.5;
        doc.setFontSize(obsFontSize);
        doc.setTextColor(15, 23, 42); // Slate-900 (alta legibilidad)
        const maxObsWidth = pageWidth - 12 - (12 + doc.getTextWidth(remitenteText.toUpperCase()) + 8);
        while (doc.getTextWidth(obsText) > maxObsWidth && obsFontSize > 6.0) {
          obsFontSize -= 0.5;
          doc.setFontSize(obsFontSize);
        }
        doc.text(obsText, pageWidth - 12, yStart + 7, { align: 'right' });
      }

      // Siglas / Código de envío (debajo del total de cajas, alineado a la derecha)
      if (slot.siglas?.trim()) {
        const siglasText = slot.siglas.trim().toUpperCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42); // Slate-900
        const siglaWidth = Math.max(22, doc.getTextWidth(siglasText) + 8);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.4);
        doc.roundedRect(pageWidth - 12 - siglaWidth, yStart + 10.2, siglaWidth, 7.5, 1.2, 1.2, 'FD');
        doc.text(siglasText, pageWidth - 12 - (siglaWidth / 2), yStart + 15.6, { align: 'center' });
      }

      // 2. Destinatario (Nombres y Apellidos en grande y negrita)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate-900
      const nombreText = (slot.nombre || 'NOMBRE Y APELLIDO').toUpperCase();
      doc.text(nombreText, 12, yStart + 16);

      // 3. DNI / RUC (debajo del nombre - mayor legibilidad)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42); // Slate-900 para máxima nitidez
      const dniText = slot.dni ? `DNI / RUC: ${slot.dni}` : 'DNI / RUC: —';
      doc.text(dniText, 12, yStart + 23.2);

      // 4. CELULAR (debajo del DNI, NO al costado - mayor tamaño)
      const celText = slot.celular ? `CEL: ${slot.celular}` : 'CEL: —';
      doc.text(celText, 12, yStart + 30.0);

      // 5. Recuadro destacado para la Agencia y el Destino (debajo del Celular)
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
      doc.roundedRect(12, yStart + 35, badgeWidth, 7.5, 1.5, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(badgeTextR, badgeTextG, badgeTextB);
      doc.text(agencyName, 12 + badgeWidth / 2, yStart + 40.2, { align: 'center' });

      // Texto del Destino / Agencia de Entrega (adaptado para hasta 80 caracteres)
      const maxDestWidth = pageWidth - 12 - (12 + badgeWidth + 4);
      const destinoRaw = slot.destino?.trim() ? slot.destino.trim().toUpperCase() : 'DESTINO NO ESPECIFICADO';
      const fullDestText = `DESTINO: ${destinoRaw}`;

      doc.setFont('helvetica', 'bold');
      let destFontSize = 11.5;
      doc.setFontSize(destFontSize);
      doc.setTextColor(15, 23, 42);

      // Si entra en 1 sola línea ajustando levemente (textos cortos a medianos):
      if (doc.getTextWidth(fullDestText) <= maxDestWidth) {
        doc.text(fullDestText, 12 + badgeWidth + 4, yStart + 40.2);
      } else {
        // Para destinos largos de hasta 80 caracteres, aprovechar al 100% la primera línea
        destFontSize = 9.0;
        doc.setFontSize(destFontSize);
        let line1 = '';
        let line2 = '';

        const lines = doc.splitTextToSize(fullDestText, maxDestWidth);
        if (lines.length === 2 && doc.getTextWidth(lines[0]) >= maxDestWidth * 0.65) {
          line1 = lines[0];
          line2 = lines[1];
        } else {
          // Si el quiebre estándar dejó la línea 1 a la mitad (por palabras largas o códigos), empacar al ancho máximo
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

          // Si aún sobra texto, reducir dinámicamente a 8.0pt o 7.5pt para garantizar los 100 caracteres completos
          if (idx2 < rest.length) {
            destFontSize = 8.0;
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

            if (s2 < sRest.length) {
              destFontSize = 7.5;
              doc.setFontSize(destFontSize);
              let t1 = 0;
              while (t1 < fullDestText.length && doc.getTextWidth(fullDestText.slice(0, t1 + 1)) <= maxDestWidth) {
                t1++;
              }
              line1 = fullDestText.slice(0, t1);
              const tRest = fullDestText.slice(t1).trimStart();
              let t2 = 0;
              while (t2 < tRest.length && doc.getTextWidth(tRest.slice(0, t2 + 1)) <= maxDestWidth) {
                t2++;
              }
              line2 = tRest.slice(0, t2);

              if (t2 < tRest.length) {
                destFontSize = 7.0;
                doc.setFontSize(destFontSize);
                let u1 = 0;
                while (u1 < fullDestText.length && doc.getTextWidth(fullDestText.slice(0, u1 + 1)) <= maxDestWidth) {
                  u1++;
                }
                line1 = fullDestText.slice(0, u1);
                const uRest = fullDestText.slice(u1).trimStart();
                let u2 = 0;
                while (u2 < uRest.length && doc.getTextWidth(uRest.slice(0, u2 + 1)) <= maxDestWidth) {
                  u2++;
                }
                line2 = uRest.slice(0, u2);
              }
            }
          }
        }

        if (!line2) {
          doc.text(line1, 12 + badgeWidth + 4, yStart + 40.2);
        } else {
          doc.text(line1, 12 + badgeWidth + 4, yStart + 38.0);
          doc.text(line2, 12 + badgeWidth + 4, yStart + 42.0);
        }
      }

      // 6. Línea divisoria interna sutil opcional o indicativo
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.3);
      doc.line(12, yStart + 47.5, pageWidth - 12, yStart + 47.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184);
      doc.text('ENTREGA EN AGENCIA / ENCOMIENDA  •  VERIFICAR DNI AL ENTREGAR', 12, yStart + 51.5);
    } else {
      // Franja vacía: marca de agua tenue
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // Slate-300
      doc.text(`[ Espacio #${slot.id} - Vacío ]`, pageWidth / 2, yStart + 30, { align: 'center' });
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

  // Descarga del PDF
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanTitle = sheetTitle.replace(/[\\/:*?"<>|]/g, '_').trim();
  const filename = `${cleanTitle}_${dateStr}.pdf`;

  const pdfBlob = doc.output('blob');
  saveAs(pdfBlob, filename);
}
