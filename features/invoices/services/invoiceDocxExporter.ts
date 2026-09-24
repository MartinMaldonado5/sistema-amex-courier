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
  HeightRule
} from 'docx';
import saveAs from 'file-saver';
import { InvoiceData } from '../types';

/**
 * Genera y descarga un documento de Word (.docx) editable
 * con el formato y diseño idéntico al documento original zxzxzxzx.docx.
 */
export async function generateInvoiceDocx(data: InvoiceData, filename?: string): Promise<void> {
  const fontMain = 'Tahoma';
  const colorPrimary = '2E5B97'; // Azul corporativo exacto de zxzxzxzx.docx
  const colorTextDark = '3C3B3B';
  const colorValueDark = '212121';
  const colorMuted = '535353';
  const borderColor = '999999';

  const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 6,
    color: borderColor
  };

  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: 'FFFFFF'
  };

  // Párrafo de Título Principal: "Invoice"
  const titleParagraph = new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({
        text: 'Invoice',
        font: fontMain,
        size: 36, // 18pt
        bold: true,
        color: colorPrimary
      })
    ]
  });

  // Tabla invisible de Encabezado Superior (Izquierda: Empresa | Derecha: Metadatos Factura)
  const headerMetaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder
    },
    rows: [
      new TableRow({
        children: [
          // Columna Izquierda: Datos de la Empresa (ACCESSORIES SALES)
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: data.companyName || 'ACCESSORIES SALES',
                    font: 'Arial',
                    size: 19, // ~9.5pt
                    color: colorMuted
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: data.companyAddress || '4771 NW 72nd Ave Miami',
                    font: fontMain,
                    size: 16, // 8pt
                    color: colorMuted
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: data.companyCityPhone || 'FL 33166 Phone:702-5159055',
                    font: fontMain,
                    size: 19,
                    color: colorMuted
                  })
                ]
              })
            ]
          }),

          // Columna Derecha: Metadatos de la Factura (Invoice Number, Dates, Amount, etc.)
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              // Invoice Number
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'Invoice Number: ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: String(data.invoiceNumber || ''),
                    font: 'Arial',
                    size: 19,
                    color: colorTextDark
                  })
                ]
              }),
              // Invoice Date
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'Invoice Date: ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: String(data.invoiceDate || '30/07/2026'),
                    font: fontMain,
                    size: 19,
                    color: colorTextDark
                  })
                ]
              }),
              // Payment Terms
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'Payment Terms: ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: String(data.paymentTerms || 'Due On Receipt'),
                    font: fontMain,
                    size: 19,
                    color: colorTextDark
                  })
                ]
              }),
              // Invoice Due Date
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'Invoice Due Date: ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: String(data.invoiceDueDate || '30/07/2026'),
                    font: fontMain,
                    size: 19,
                    color: colorTextDark
                  })
                ]
              }),
              // Invoice Amount
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: 'Invoice Amount:  ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: `$${typeof data.invoiceAmount === 'number' ? data.invoiceAmount.toFixed(2) : String(data.invoiceAmount || '0.00').replace('$', '')}`,
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorValueDark
                  })
                ]
              }),
              // Created By
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Created By:   ',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  }),
                  new TextRun({
                    text: String(data.createdBy || 'ORDER Ronxana'),
                    font: fontMain,
                    size: 19,
                    color: colorTextDark
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  // Espaciador antes de Bill To / Ship To
  const middleSpacer = new Paragraph({ spacing: { after: 120 }, children: [] });

  // Tabla de Destinatarios: Bill To (Izquierda) | Ship To (Derecha)
  const recipientsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: noBorder,
      right: noBorder,
      insideHorizontal: noBorder,
      insideVertical: noBorder
    },
    rows: [
      // Fila 1: Títulos "Bill To" y "Ship To"
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { left: 0, right: 20 },
            children: [
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: 'Bill To',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { left: 20, right: 0 },
            children: [
              new Paragraph({
                spacing: { after: 20 },
                children: [
                  new TextRun({
                    text: 'Ship To',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: colorTextDark
                  })
                ]
              })
            ]
          })
        ]
      }),
      // Fila 2: Nombres de destinatarios
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { left: 0, right: 20 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: data.billToName || '',
                    font: fontMain,
                    size: 18,
                    bold: true,
                    color: colorValueDark
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { left: 20, right: 0 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: data.shipToName || data.billToName || '',
                    font: fontMain,
                    size: 18,
                    bold: true,
                    color: colorValueDark
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const preTableSpacer = new Paragraph({ spacing: { after: 100 }, children: [] });

  // Preparar párrafos para el cuerpo de la tabla (Col 0: Items, Col 1: Qty, Col 2: Price, Col 3: Total)
  const itemNameParagraphs = (data.items || []).map(item =>
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: item.name || '',
          font: fontMain,
          size: 19,
          color: colorValueDark
        })
      ]
    })
  );

  const quantityParagraphs = (data.items || []).map(item =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: String(item.quantity || ''),
          font: fontMain,
          size: 19,
          color: colorValueDark
        })
      ]
    })
  );

  const unitPriceParagraphs = (data.items || []).map(item =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: item.unitPrice ? `$${Number(item.unitPrice).toFixed(2)}` : '',
          font: fontMain,
          size: 19,
          color: colorValueDark
        })
      ]
    })
  );

  const totalParagraphs = (data.items || []).map(item =>
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: item.total ? `$${Number(item.total).toFixed(2)}` : '',
          font: fontMain,
          size: 19,
          color: colorValueDark
        })
      ]
    })
  );

  // Asegurar que si la tabla tiene pocos items, haya espacio en blanco para mantener la altura visual
  if (itemNameParagraphs.length === 0) {
    itemNameParagraphs.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 19 })] }));
    quantityParagraphs.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 19 })] }));
    unitPriceParagraphs.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 19 })] }));
    totalParagraphs.push(new Paragraph({ children: [new TextRun({ text: ' ', size: 19 })] }));
  }

  // Tabla Principal con encabezado #2E5B97 y caja de items
  // Anchos proporcionales a zxzxzxzx.docx: Item Name ~52%, Qty ~12%, Unit Price ~18%, Total ~18%
  const colWidthItem = { size: 52, type: WidthType.PERCENTAGE };
  const colWidthQty = { size: 12, type: WidthType.PERCENTAGE };
  const colWidthPrice = { size: 18, type: WidthType.PERCENTAGE };
  const colWidthTotal = { size: 18, type: WidthType.PERCENTAGE };

  const invoiceItemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Fila 0: Encabezados con fondo azul corporativo (#2E5B97) y texto blanco
      new TableRow({
        height: { value: 650, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: colWidthItem,
            shading: { fill: colorPrimary },
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: 'Item Name',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: 'FFFFFF'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: colWidthQty,
            shading: { fill: colorPrimary },
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Quantity',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: 'FFFFFF'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: colWidthPrice,
            shading: { fill: colorPrimary },
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Unit Price',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: 'FFFFFF'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: colWidthTotal,
            shading: { fill: colorPrimary },
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Total',
                    font: fontMain,
                    size: 19,
                    bold: true,
                    color: 'FFFFFF'
                  })
                ]
              })
            ]
          })
        ]
      }),

      // Fila 1: Cuerpo de la tabla (altura mínima 4155 dxa idéntica a zxzxzxzx.docx)
      new TableRow({
        height: { value: 4155, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: colWidthItem,
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: thinBorder,
              left: thinBorder,
              right: thinBorder
            },
            children: itemNameParagraphs
          }),
          new TableCell({
            width: colWidthQty,
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: thinBorder,
              left: thinBorder,
              right: thinBorder
            },
            children: quantityParagraphs
          }),
          new TableCell({
            width: colWidthPrice,
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: thinBorder,
              left: thinBorder,
              right: thinBorder
            },
            children: unitPriceParagraphs
          }),
          new TableCell({
            width: colWidthTotal,
            margins: { left: 120, right: 120, top: 120, bottom: 120 },
            borders: {
              top: noBorder,
              bottom: thinBorder,
              left: thinBorder,
              right: thinBorder
            },
            children: totalParagraphs
          })
        ]
      })
    ]
  });

  // Ensamblar Documento DOCX con márgenes y tamaño de página exactos de zxzxzxzx.docx
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // 8.5 in
              height: 15840 // 11 in
            },
            margin: {
              top: 1440,
              bottom: 1440,
              left: 450,
              right: 550
            }
          }
        },
        children: [
          titleParagraph,
          headerMetaTable,
          middleSpacer,
          recipientsTable,
          preTableSpacer,
          invoiceItemsTable
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeNumber = (data.invoiceNumber || 'USA').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeBillTo = (data.billToName || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalFilename = filename || `Invoice_${safeNumber}_${safeBillTo}.docx`;

  saveAs(blob, finalFilename);
}
