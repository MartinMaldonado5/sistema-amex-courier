import { GoogleGenAI } from '@google/genai';

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

// Modelo oficial por defecto del sistema
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Separa el MIME type y el string Base64 puro de un Data URL
 */
export function parseBase64Data(dataUrl: string): { mimeType: string; base64: string } {
  if (dataUrl.startsWith('data:')) {
    const commaIndex = dataUrl.indexOf(',');
    const mimeMatch = dataUrl.substring(0, commaIndex).match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64 = dataUrl.substring(commaIndex + 1);
    return { mimeType, base64 };
  }
  return { mimeType: 'image/jpeg', base64: dataUrl };
}

/**
 * Analiza facturas de compra/invoices para el módulo de inventario
 */
export async function analyzeInvoiceDocument(fileBase64: string, mimeType: string) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analiza esta factura de compra/invoice de paquete importado. 
Extrae la siguiente información en formato JSON estricto:
{
  "tracking_usa": "número de rastreo de la tienda o courier USA si aparece",
  "invoice_number": "número de factura/invoice de la compra",
  "descripcion_mercancia": "breve descripción del producto comprado",
  "peso_kg": 0.0,
  "valor_usd": 0.00
}
Si algún valor no es visible, retorna cadena vacía o 0. Solo devuelve el objeto JSON sin formato markdown extra.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: fileBase64 } },
          { text: prompt }
        ]
      }
    ]
  });

  const text = response.text || '{}';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}

/**
 * Analiza la imagen del anverso del DNI para extraer nombres y apellidos automáticamente
 */
export async function extractDniNameFromImage(imageInput: string): Promise<{
  nombre_completo: string;
  nombres?: string;
  apellidos?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  const { mimeType, base64 } = parseBase64Data(imageInput);
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analiza detenidamente la imagen del ANVERSO (frente) de este Documento Nacional de Identidad (DNI) o cédula.
Tu única tarea es leer y extraer con la máxima fidelidad los nombres de pila y apellidos de la persona registrada en el documento.
Examina los campos:
- Primer Apellido (Apellido Paterno)
- Segundo Apellido (Apellido Materno)
- Pre Nombres / Nombres (1, 2, 3 o más nombres)
O la zona inferior MRZ si está disponible.

Devuelve EXCLUSIVAMENTE un objeto JSON estricto sin comillas invertidas ni explicaciones adicionales:
{
  "nombres": "NOMBRES DE LA PERSONA",
  "apellidos": "APELLIDOS DE LA PERSONA",
  "nombre_completo": "NOMBRES Y APELLIDOS EN ORDEN: [NOMBRES] [APELLIDOS] EN MAYÚSCULAS"
}

Reglas estrictas:
1. El campo "nombre_completo" DEBE estructurarse siempre primero con los nombres de pila y luego los apellidos. Ejemplo: "LEONARDO AILTON ROJAS YUPANQUI".
2. Todo el texto debe estar 100% en MAYÚSCULAS y limpio de símbolos extraños o puntuaciones innecesarias.
3. Si la imagen no es un DNI o los nombres resultan totalmente ilegibles, devuelve {"nombre_completo": ""}.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt }
        ]
      }
    ]
  });

  const text = response.text || '{}';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    const nombreCompleto = (parsed.nombre_completo || '').trim().toUpperCase();
    return {
      nombre_completo: nombreCompleto,
      nombres: (parsed.nombres || '').trim().toUpperCase(),
      apellidos: (parsed.apellidos || '').trim().toUpperCase()
    };
  } catch (err) {
    console.error('Error al parsear respuesta JSON de Gemini:', cleanJson, err);
    throw new Error('No se pudo procesar la respuesta de la Inteligencia Artificial.');
  }
}
