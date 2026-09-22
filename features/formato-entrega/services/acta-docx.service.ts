import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  Packer,
  WidthType,
  BorderStyle,
  UnderlineType
} from 'docx';
import saveAs from 'file-saver';
import { ActaEntregaData } from '../types';

/**
 * Genera y descarga un documento de Word (.docx) editable
 * con el formato exacto del Acta de Entrega de AMEX Courier.
 */
export async function generateActaEntregaDocx(data: ActaEntregaData, filename?: string): Promise<void> {
  const validPkgs = (data.paquetes || []).filter(p => p && p.trim().length > 0);
  const pkgCount = validPkgs.length;
  const countLabel = `${pkgCount} ${pkgCount === 1 ? 'PAQUETE' : 'PAQUETES'}`;

  // 1. Tabla Superior de Datos (Fecha, Remitente, Destinatario)
  const topTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Fecha:', bold: true, font: 'Calibri', size: 21 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: data.fecha || '', font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Remitente:', bold: true, font: 'Calibri', size: 21 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: data.remitente || 'AMEX COURRIER', font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Destinatario:', bold: true, font: 'Calibri', size: 21 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 72, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: (data.destinatario || '').toUpperCase(), font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 2. Recuadro Central de Paquetes
  const packageParagraphs = validPkgs.map(
    (code) =>
      new Paragraph({
        children: [
          new TextRun({
            text: code,
            bold: true,
            font: 'Courier New',
            size: 21
          })
        ]
      })
  );

  const packagesBox = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 12, color: '000000' }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            children: packageParagraphs.length > 0 ? packageParagraphs : [new Paragraph({ text: '' })]
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            verticalAlign: 'center',
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: countLabel,
                    bold: true,
                    underline: { type: UnderlineType.SINGLE },
                    font: 'Calibri',
                    size: 24
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // 3. Tabla Recibido Por
  const recibidoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Recibido por', bold: true, font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({ text: 'Nombre:  ', bold: true, font: 'Calibri', size: 21 }),
                  new TextRun({ text: data.recibidoPorNombre || '', font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({ text: 'Fecha:  ', bold: true, font: 'Calibri', size: 21 }),
                  new TextRun({ text: data.recibidoPorFecha || '', font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({ text: 'Hora:  ', bold: true, font: 'Calibri', size: 21 }),
                  new TextRun({ text: data.recibidoPorHora || '', font: 'Calibri', size: 21 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Construir Documento Completo
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // ~2 cm
              bottom: 1134,
              left: 1134,
              right: 1134
            }
          }
        },
        children: [
          // Título
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: 'ACTA DE ENTREGA',
                bold: true,
                font: 'Calibri',
                size: 34,
                color: '0F172A'
              })
            ]
          }),

          // Tabla Superior
          topTable,

          new Paragraph({ spacing: { before: 200, after: 200 } }),

          // Recuadro de Paquetes
          packagesBox,

          new Paragraph({ spacing: { before: 200, after: 120 } }),

          // Cláusula de Cargo
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'CARGO: ', bold: true, font: 'Calibri', size: 19 }),
              new TextRun({
                text: 'Certifico que he recibido el(los) paquete(s) indicado(s)',
                underline: { type: UnderlineType.SINGLE },
                font: 'Calibri',
                size: 19
              })
            ]
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: '               Anteriormente en buen estado y conforme a lo descrito.',
                underline: { type: UnderlineType.SINGLE },
                font: 'Calibri',
                size: 19
              })
            ]
          }),

          // Tabla Recibido Por
          recibidoTable,

          new Paragraph({ spacing: { before: 400, after: 100 } }),

          // Línea de Firma
          new Paragraph({
            children: [
              new TextRun({
                text: 'Firma: __________________________________________________',
                font: 'Calibri',
                size: 21
              })
            ]
          })
        ]
      }
    ]
  });

  // Guardar archivo .docx
  const blob = await Packer.toBlob(doc);
  const safeClient = (data.destinatario || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalName = filename || `Acta_Entrega_${safeClient}_${Date.now()}.docx`;
  saveAs(blob, finalName);
}
