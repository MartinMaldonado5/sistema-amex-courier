export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
}

export interface InvoiceData {
  // --- CAMPOS EDITABLES ---
  invoiceNumber: string;
  billToName: string;
  shipToName: string;
  items: InvoiceItem[];
  invoiceAmount: number | string;

  // --- CAMPOS FIJOS (IDÉNTICOS AL WORD zxzxzxzx.docx) ---
  companyName: string;       // "ACCESSORIES SALES"
  companyAddress: string;    // "4771 NW 72nd Ave Miami"
  companyCityPhone: string;  // "FL 33166 Phone:702-5159055"
  invoiceDate: string;       // "30/07/2026" o fecha actual
  paymentTerms: string;      // "Due On Receipt"
  invoiceDueDate: string;    // "30/07/2026"
  createdBy: string;         // "ORDER Ronxana"

  // Metadatos adicionales opcionales
  savedAt?: string;
}

export const INITIAL_INVOICE_DATA: InvoiceData = {
  // Campos editables por defecto con el ejemplo del documento original
  invoiceNumber: 'I000430460',
  billToName: 'FRANKLIN JHUNIOR PEREZ QUISPE',
  shipToName: 'FRANKLIN JHUNIOR PEREZ QUISPE',
  invoiceAmount: '195.82',
  items: [
    { id: '1', name: 'ZAPATILLAS NIKE BLANCA', quantity: 1, unitPrice: '24.47', total: '24.47' },
    { id: '2', name: 'ZAPATILLAS NIKE NEGRAS', quantity: 1, unitPrice: '24.47', total: '24.47' },
    { id: '3', name: 'CONJUNO JUICY COUTURE ROSA', quantity: 1, unitPrice: '24.48', total: '24.48' },
    { id: '4', name: 'SHORT JORDAN BLANCO Y NEGRO', quantity: 1, unitPrice: '24.48', total: '24.48' },
    { id: '5', name: 'SET VICTORIA SECRET', quantity: 1, unitPrice: '24.48', total: '24.48' },
    { id: '6', name: 'SHORT NIKE LILA', quantity: 1, unitPrice: '24.48', total: '24.48' },
    { id: '7', name: 'SHORT CALVIN KLEIN JEANS', quantity: 1, unitPrice: '24.48', total: '24.48' },
    { id: '8', name: 'PANTALON TOMMY HILFIGER JEANS', quantity: 1, unitPrice: '24.48', total: '24.48' }
  ],

  // Campos fijos idénticos al docx original
  companyName: 'ACCESSORIES SALES',
  companyAddress: '4771 NW 72nd Ave Miami',
  companyCityPhone: 'FL 33166 Phone:702-5159055',
  invoiceDate: '30/07/2026',
  paymentTerms: 'Due On Receipt',
  invoiceDueDate: '30/07/2026',
  createdBy: 'ORDER Ronxana'
};
