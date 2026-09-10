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

export interface ShalomBoletaExtractedData {
  nro_orden: string;
  codigo: string;
  fecha_emision: string; // YYYY-MM-DD
  hora_emision: string;
  fecha_traslado: string; // YYYY-MM-DD
  origen: string;
  destino: string;
  remitente_nombre: string;
  remitente_dni: string;
  remitente_telefono: string;
  destinatario_nombre: string;
  destinatario_dni: string;
  destinatario_telefono: string;
  tipo_entrega: string;
  forma_pago: string;
  monto_total: number;
  moneda: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  peso: number;
  observaciones: string;
  // Campos de compatibilidad
  numero_guia: string;
  codigo_seguimiento: string;
  remitente_documento: string;
  destinatario_documento: string;
  modalidad_pago: string;
  contenido_bultos: string;
  peso_total: number;
  agencia_destino?: string;
}

/**
 * Analiza un documento PDF o imagen de ticket / boleta de SHALOM (ej: DATOS TICKET SHALOM)
 * Utiliza Gemini 3.5 Flash Lite para extracción estructurada de alta precisión
 */
export async function analyzeShalomBoletaPdf(pdfBase64: string): Promise<ShalomBoletaExtractedData> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  const { mimeType, base64 } = parseBase64Data(pdfBase64);
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analiza detalladamente este comprobante impreso correspondiente a un TICKET / BOLETA DE SHALOM (DATOS TICKET SHALOM / SHALOM EMPRESARIAL S.A.C).

Examina minuciosamente todas las secciones del ticket:
1. Encabezado y sub-encabezado con ciudad y sede (ej: "AREQUIPA - CERRO COLORADO / ZAMACOLA - TERRESTRE").
2. Bloque "DATOS":
   - "NRO. ORDEN:" (ej: 95294190)
   - "CÓDIGO:" (código alfanumérico corto, ej: 7HH7)
   - "Fecha Emision:" (Fecha y hora, ej: 2026-09-09 17:53:14)
   - "Fecha Traslado:" (Fecha programada de traslado, ej: 2026-09-10)
3. Bloques de Origen y Destino:
   - "Origen:" (dirección o agencia de salida)
   - "Destino:" (dirección o agencia de llegada)
4. "DATOS DEL REMITENTE":
   - "Nombre:" (Nombres y apellidos o razón social)
   - "DNI:" o RUC
   - "Telefono:"
5. "DATOS DEL DESTINATARIO":
   - "Nombre:" (Nombres y apellidos de quien recibe)
   - "DNI:" o RUC
   - "Telefono:"
6. "ENTREGA":
   - "Direccion:" o modalidad (ej: "ENTREGAR EN AGENCIA" o dirección a domicilio)
7. "FORMA DE PAGO": (ej: "Pendiente de Pago", "Pagado", "Contado", "Crédito")
8. Tabla de Ítems / Encomienda:
   - "Descripción": (ej: "BULTO", "PAQUETE", etc.)
   - "Cantidad": (número entero, ej: 1)
   - "Unidad de medida": (ej: "Volumen", "Peso", "Unidad")
   - "Peso": (valor numérico decimal, ej: 0.120)
9. "Observaciones:" (textos informativos, seguros, garantías, etc.)
10. "TOTAL: S/." (Importe total en soles, ej: 33.00)

Devuelve EXCLUSIVAMENTE un objeto JSON estricto sin markdown:
{
  "nro_orden": "95294190",
  "codigo": "7HH7",
  "fecha_emision": "YYYY-MM-DD",
  "hora_emision": "HH:mm:ss",
  "fecha_traslado": "YYYY-MM-DD",
  "origen": "ORIGEN DETALLADO",
  "destino": "DESTINO DETALLADO",
  "remitente_nombre": "NOMBRE REMITENTE",
  "remitente_dni": "DNI REMITENTE",
  "remitente_telefono": "TELEFONO REMITENTE",
  "destinatario_nombre": "NOMBRE DESTINATARIO",
  "destinatario_dni": "DNI DESTINATARIO",
  "destinatario_telefono": "TELEFONO DESTINATARIO",
  "tipo_entrega": "ENTREGAR EN AGENCIA",
  "forma_pago": "Pendiente de Pago",
  "descripcion": "BULTO",
  "cantidad": 1,
  "unidad_medida": "Volumen",
  "peso": 0.120,
  "observaciones": "TEXTO DE OBSERVACIONES",
  "monto_total": 33.00,
  "moneda": "PEN"
}

Reglas estrictas:
- Todo en mayúsculas salvo fechas u horas.
- Fechas siempre en formato ISO YYYY-MM-DD.
- Si algún dato no aparece o no es legible, asigna "" (cadena vacía) o 0 (cero) en campos numéricos.
- No agregues explicaciones ni comillas invertidas markdown.`;

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType || 'application/pdf', data: base64 } },
          { text: prompt }
        ]
      }
    ]
  });

  const text = response.text || '{}';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    const nroOrden = (parsed.nro_orden || parsed.numero_guia || '').trim().toUpperCase();
    const codigo = (parsed.codigo || parsed.codigo_seguimiento || '').trim().toUpperCase();
    const fechaEmision = (parsed.fecha_emision || '').trim();
    const horaEmision = (parsed.hora_emision || '').trim();
    const fechaTraslado = (parsed.fecha_traslado || '').trim();
    const remitenteNombre = (parsed.remitente_nombre || 'AMEX COURIER').trim().toUpperCase();
    const remitenteDni = (parsed.remitente_dni || parsed.remitente_documento || '').trim();
    const remitenteTel = (parsed.remitente_telefono || '').trim();
    const destNombre = (parsed.destinatario_nombre || '').trim().toUpperCase();
    const destDni = (parsed.destinatario_dni || parsed.destinatario_documento || '').trim();
    const destTel = (parsed.destinatario_telefono || '').trim();
    const origen = (parsed.origen || 'LIMA').trim().toUpperCase();
    const destino = (parsed.destino || '').trim().toUpperCase();
    const tipoEntrega = (parsed.tipo_entrega || 'ENTREGAR EN AGENCIA').trim().toUpperCase();
    const formaPago = (parsed.forma_pago || 'Pendiente de Pago').trim();
    const desc = (parsed.descripcion || parsed.contenido_bultos || 'BULTO').trim().toUpperCase();
    const cantidad = parseInt(parsed.cantidad, 10) || 1;
    const unidadMedida = (parsed.unidad_medida || 'Volumen').trim();
    const peso = parseFloat(parsed.peso || parsed.peso_total) || 0;
    const montoTotal = parseFloat(parsed.monto_total) || 0;
    const observaciones = (parsed.observaciones || '').trim();

    return {
      nro_orden: nroOrden,
      codigo,
      fecha_emision: fechaEmision,
      hora_emision: horaEmision,
      fecha_traslado: fechaTraslado,
      origen,
      destino,
      remitente_nombre: remitenteNombre,
      remitente_dni: remitenteDni,
      remitente_telefono: remitenteTel,
      destinatario_nombre: destNombre,
      destinatario_dni: destDni,
      destinatario_telefono: destTel,
      tipo_entrega: tipoEntrega,
      forma_pago: formaPago,
      monto_total: montoTotal,
      moneda: (parsed.moneda || 'PEN').trim().toUpperCase(),
      descripcion: desc,
      cantidad,
      unidad_medida: unidadMedida,
      peso,
      observaciones,
      // Alias
      numero_guia: nroOrden || codigo,
      codigo_seguimiento: codigo,
      remitente_documento: remitenteDni,
      destinatario_documento: destDni,
      modalidad_pago: formaPago.toUpperCase().includes('PENDIENTE') ? 'PAGO_DESTINO' : formaPago.toUpperCase(),
      contenido_bultos: desc,
      peso_total: peso,
      agencia_destino: tipoEntrega
    };
  } catch (err) {
    console.error('Error al parsear respuesta JSON de Gemini para ticket Shalom:', cleanJson, err);
    throw new Error('No se pudo estructurar la información del comprobante de Shalom.');
  }
}
