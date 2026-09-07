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

export interface ExtractedRotuloData {
  siglas?: string;
  totalCajas?: string;
  agencia?: 'SHALOM' | 'CRUZ DEL SUR' | 'OLVA' | 'OTRA';
  agenciaOtra?: string;
  nombre?: string;
  dni?: string;
  celular?: string;
  destino?: string;
  remitente?: string;
}

/**
 * AMEXito IA: Interpreta capturas de pantalla de WhatsApp o textos no estructurados
 * y extrae todos los campos requeridos para el rótulo de agencias (Módulo 9)
 */
export async function parseRotuloWithAi(input: {
  text?: string;
  imageBase64?: string;
}): Promise<ExtractedRotuloData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Eres AMEXito IA, el asistente inteligente de AMEX Courier Perú especializado en logística y rotulación de agencias.
Tu objetivo es analizar el texto y/o la imagen de un mensaje de WhatsApp u orden de envío, y extraer de forma estructurada los datos del destinatario para generar un rótulo de agencia de transporte (Shalom, Olva, Cruz del Sur u otra).

Analiza detalladamente el contenido y extrae los siguientes datos en formato JSON estricto:
{
  "siglas": "Código o clave del paquete alfanumérico (ej: 'CE79', 'CE39', 'CP89', 'CP58', 'CE150', 'CP 68'). Si no hay, dejar en blanco ''",
  "totalCajas": "Cantidad total de cajas o bultos solo el número (ej: '2 cajas' -> '2', '3 cajas' -> '3', si no especifica poner '1')",
  "agencia": "Debe ser exactamente una de estas 4 opciones en mayúsculas: 'SHALOM', 'CRUZ DEL SUR', 'OLVA', o 'OTRA'",
  "agenciaOtra": "Si la agencia fue 'OTRA', el nombre de dicha agencia (ej: 'MARVISUR', 'MÓVIL BUS'). Si es Shalom, Cruz del Sur u Olva, dejar en blanco ''",
  "nombre": "Nombres y apellidos completos del destinatario (en MAYÚSCULAS)",
  "dni": "Número de identificación del destinatario: DNI (8 dígitos), Carnet de Extranjería / CE (ej: '008619120'), o RUC (11 dígitos). Solo dígitos alfanuméricos limpios sin guiones",
  "celular": "Número telefónico o de celular del destinatario (ej: '934548741', '981081414'. Solo los 9 dígitos sin espacios ni guiones)",
  "destino": "Destino completo, departamento/ciudad, agencia de entrega y/o dirección de destino (ej: 'ANCASH - CASMA - CASMA SHALOM AV. MIGUEL GRAU', 'TACNA - AV. VIGIL - SHALOM', 'CHANCAY', 'CHIMBOTE (AV. JOSÉ GÁLVEZ 767)'). En MAYÚSCULAS",
  "remitente": "Si se especifica un remitente distinto, colocarlo; en caso contrario poner 'AMEX COURIER PERÚ'"
}

Reglas estrictas:
1. Devuelve EXCLUSIVAMENTE el objeto JSON válido sin bloques markdown extra, sin comentarios.
2. Limpia los números de teléfono y documentos de espacios o guiones.
3. Si algún campo no se encuentra en el texto o imagen, devuelve cadena vacía "".
4. No inventes información; solo extrae lo que esté presente o se deduzca claramente del contexto.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (input.imageBase64) {
    const { mimeType, base64 } = parseBase64Data(input.imageBase64);
    parts.push({ inlineData: { mimeType, data: base64 } });
  }

  if (input.text && input.text.trim()) {
    parts.push({ text: `Texto del pedido a interpretar:\n${input.text.trim()}` });
  }

  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts
      }
    ]
  });

  const text = response.text || '{}';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);

    // Normalizar agencia
    let agencia: 'SHALOM' | 'CRUZ DEL SUR' | 'OLVA' | 'OTRA' = 'SHALOM';
    const rawAgencia = String(parsed.agencia || '').toUpperCase();
    if (rawAgencia.includes('CRUZ')) {
      agencia = 'CRUZ DEL SUR';
    } else if (rawAgencia.includes('OLVA')) {
      agencia = 'OLVA';
    } else if (rawAgencia.includes('SHALOM')) {
      agencia = 'SHALOM';
    } else if (rawAgencia && rawAgencia !== 'SHALOM') {
      agencia = 'OTRA';
    }

    return {
      siglas: (parsed.siglas || '').trim().toUpperCase(),
      totalCajas: (parsed.totalCajas || '').trim(),
      agencia,
      agenciaOtra: (parsed.agenciaOtra || '').trim().toUpperCase(),
      nombre: (parsed.nombre || '').trim().toUpperCase(),
      dni: (parsed.dni || '').trim().toUpperCase(),
      celular: (parsed.celular || '').trim(),
      destino: (parsed.destino || '').trim().toUpperCase(),
      remitente: (parsed.remitente || 'AMEX COURIER PERÚ').trim().toUpperCase()
    };
  } catch (err) {
    console.error('Error al parsear respuesta JSON de Gemini para rótulo:', cleanJson, err);
    throw new Error('No se pudo procesar la respuesta de la Inteligencia Artificial.');
  }
}
