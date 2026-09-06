import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export interface RotuloSlotData {
  id: number; // 1 a 5
  nombre: string;
  dni: string;
  celular: string;
  agencia: 'SHALOM' | 'CRUZ DEL SUR' | 'OLVA' | 'OTRA';
  agenciaOtra?: string;
  destino: string;
  remitente?: string;
  observacion?: string;
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
      // 1. Cabecera pequeña de la franja (Remitente y bulto)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      const remitenteText = slot.remitente?.trim() || 'AMEX COURIER PERÚ';
      doc.text(remitenteText.toUpperCase(), 12, yStart + 7);

      if (slot.observacion?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(slot.observacion.toUpperCase(), pageWidth - 12, yStart + 7, { align: 'right' });
      }

      // 2. Destinatario (Nombres y Apellidos en grande y negrita)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // Slate-900
      const nombreText = (slot.nombre || 'NOMBRE Y APELLIDO').toUpperCase();
      doc.text(nombreText, 12, yStart + 16);

      // 3. DNI / RUC (debajo del nombre)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      const dniText = slot.dni ? `DNI / RUC: ${slot.dni}` : 'DNI / RUC: —';
      doc.text(dniText, 12, yStart + 22.8);

      // 4. CELULAR (debajo del DNI, NO al costado)
      const celText = slot.celular ? `CEL: ${slot.celular}` : 'CEL: —';
      doc.text(celText, 12, yStart + 29.2);

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

      // Texto del Destino / Agencia de Entrega (en grande al costado del badge)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(15, 23, 42);
      const destinoText = slot.destino ? slot.destino.toUpperCase() : 'DESTINO NO ESPECIFICADO';
      doc.text(`DESTINO: ${destinoText}`, 12 + badgeWidth + 5, yStart + 40.5);

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
