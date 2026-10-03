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

  // 2. Recuadro Central de Paquetes (Adaptativo de 1 a 100 códigos)
  let numDocxCols = 1;
  let codeFontSize = 21;
  let leftCellWidth = 55;
  let rightCellWidth = 45;

  if (pkgCount > 80) {
    numDocxCols = 5;
    codeFontSize = 13;
    leftCellWidth = 76;
    rightCellWidth = 24;
  } else if (pkgCount > 54) {
    numDocxCols = 4;
    codeFontSize = 14;
    leftCellWidth = 72;
    rightCellWidth = 28;
  } else if (pkgCount > 28) {
    numDocxCols = 3;
    codeFontSize = 16;
    leftCellWidth = 68;
    rightCellWidth = 32;
  } else if (pkgCount > 12) {
    numDocxCols = 2;
    codeFontSize = 18;
    leftCellWidth = 62;
    rightCellWidth = 38;
  }

  let packageContentChildren: (Paragraph | Table)[] = [];

  if (pkgCount === 0) {
    packageContentChildren = [new Paragraph({ text: '[Sin paquetes agregados]' })];
  } else if (numDocxCols === 1) {
    packageContentChildren = validPkgs.map(
      (code) =>
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: code,
              bold: true,
              font: 'Courier New',
              size: codeFontSize
            })
          ]
        })
    );
  } else {
    // Distribuir en tabla interna sin bordes de numDocxCols columnas
    const rowsPerCol = Math.ceil(pkgCount / numDocxCols);
    const innerRows: TableRow[] = [];
    const noneBorder = { style: BorderStyle.NONE, size: 0, color: 'auto' };

    for (let r = 0; r < rowsPerCol; r++) {
      const cells: TableCell[] = [];
      for (let c = 0; c < numDocxCols; c++) {
        const itemIdx = (c * rowsPerCol) + r;
        const codeText = itemIdx < pkgCount ? validPkgs[itemIdx] : '';
        cells.push(
          new TableCell({
            borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
            width: { size: Math.floor(100 / numDocxCols), type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: codeText,
                    bold: true,
                    font: 'Courier New',
                    size: codeFontSize
                  })
                ]
              })
            ]
          })
        );
      }
      innerRows.push(new TableRow({ children: cells }));
    }

    const innerGridTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: noneBorder,
        bottom: noneBorder,
        left: noneBorder,
        right: noneBorder,
        insideHorizontal: noneBorder,
        insideVertical: noneBorder
      },
      rows: innerRows
    });

    packageContentChildren = [innerGridTable];
  }

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
            width: { size: leftCellWidth, type: WidthType.PERCENTAGE },
            children: packageContentChildren
          }),
          new TableCell({
            width: { size: rightCellWidth, type: WidthType.PERCENTAGE },
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
                    size: pkgCount > 50 ? 20 : 24
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

          // Cláusula de Cargo (Centrado)
          new Paragraph({
            alignment: AlignmentType.CENTER,
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
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: 'Anteriormente en buen estado y conforme a lo descrito.',
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
