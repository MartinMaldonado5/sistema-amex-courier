import OpenAI, { toFile } from 'openai';

function getOpenAiKey(): string {
  return process.env.OPENAI_API_KEY || '';
}

// Modelos por defecto
export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';

/**
 * Singleton del Cliente OpenAI (GPT-6 Luna):
 * Mantiene conexiones TLS/HTTP persistentes y reutiliza el cliente.
 */
let openAiClientInstance: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (!openAiClientInstance) {
    const apiKey = getOpenAiKey();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno.');
    }
    openAiClientInstance = new OpenAI({ apiKey });
  }
  return openAiClientInstance;
}

/**
 * Opciones dinámicas para el modelo OpenAI configurado.
 * Para modelos con capacidad de razonamiento (como GPT-6 Luna o familias o1/o3),
 * aplica reasoning_effort: 'low' y max_completion_tokens para reducir la latencia
 * a más de la mitad y evitar tokens de pensamiento innecesarios en tareas de extracción.
 */
export function getOpenAiModelOptions(maxTokens = 1000) {
  const modelName = DEFAULT_OPENAI_MODEL.toLowerCase();
  const isReasoningModel =
    modelName.includes('luna') ||
    modelName.includes('o1') ||
    modelName.includes('o3') ||
    modelName.startsWith('gpt-6');

  if (isReasoningModel) {
    return {
      max_completion_tokens: maxTokens,
      reasoning_effort: 'low' as const
    };
  }
  return {
    max_tokens: maxTokens,
    temperature: 0.1
  };
}

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
 * Parseo directo y optimizado de JSON devuelto por los modelos de IA
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAiJsonResponse<T = any>(rawText?: string | null): T {
  if (!rawText) return {} as T;
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Seguir al fallback de limpieza
    }
  }
  const cleanJson = trimmed.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson || '{}');
}

/**
 * Analiza facturas de compra/invoices para el módulo de inventario
 */
export async function analyzeInvoiceDocument(fileBase64: string, mimeType: string) {
  const prompt = `Analiza esta factura de compra/invoice de paquete importado. 
Extrae la siguiente información en formato JSON estricto:
{
  "tracking_usa": "número de rastreo de la tienda o courier USA si aparece",
  "invoice_number": "número de factura/invoice de la compra",
  "descripcion_mercancia": "breve descripción del producto comprado",
  "peso_kg": 0.0,
  "valor_usd": 0.00
}
Si algún valor no es visible, retorna cadena vacía o 0.
Devuelve exclusivamente un objeto JSON válido con los campos solicitados.`;

  const client = getOpenAiClient();
  const isPdf = (mimeType || '').toLowerCase().includes('pdf');

  if (isPdf) {
    const buffer = Buffer.from(fileBase64, 'base64');
    const file = await toFile(buffer, 'invoice.pdf', { type: 'application/pdf' });
    const uploaded = await client.files.create({ file, purpose: 'user_data' });

    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        response_format: { type: 'json_object' },
        ...getOpenAiModelOptions(1000),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'file', file: { file_id: uploaded.id } }
            ]
          }
        ]
      });
      return parseAiJsonResponse(response.choices[0]?.message?.content);
    } finally {
      await client.files.delete(uploaded.id).catch(() => {});
    }
  }

  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    response_format: { type: 'json_object' },
    ...getOpenAiModelOptions(1000),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/jpeg'};base64,${fileBase64}`
            }
          }
        ]
      }
    ]
  });

  return parseAiJsonResponse(response.choices[0]?.message?.content);
}

/**
 * Analiza la imagen del anverso del DNI para extraer nombres, apellidos y número de DNI automáticamente
 */
export async function extractDniNameFromImage(imageInput: string): Promise<{
  nombre_completo: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
}> {
  const { mimeType, base64 } = parseBase64Data(imageInput);

  const prompt = `Analiza con máxima precisión la imagen de este Documento de Identidad del Perú (DNI 1.0 clásico azul/amarillo, DNIe 2.0/3.0 electrónico blanco, o Carnet de Extranjería CE).

Tu objetivo es leer y extraer con la máxima fidelidad:
1. El número del documento de identidad ("dni")
2. Los nombres y apellidos de la persona ("nombres", "apellidos", "nombre_completo")

============================================================
REGLAS CRÍTICAS PARA IDENTIFICAR EL NÚMERO DE DNI (8 DÍGITOS OBLIGATORIO):
============================================================
En el Perú existen 4 tipos de documentos. Aplica las siguientes reglas según el tipo de documento detectado:

1. DNI ELECTRÓNICO (DNIe 2.0 y 3.0 - Tarjeta blanca/celeste con chip):
   - El número de DNI se encuentra en la ESQUINA SUPERIOR DERECHA, rotulado con la etiqueta "CUI" (Código Único de Identificación).
     Ejemplo: "CUI 76219579-3".
     El número de DNI son ÚNICAMENTE los 8 dígitos antes del guión: "76219579". El último número tras el guión (ej: -3) es el dígito verificador y NO forma parte del DNI.
   - También está impreso en vertical al lado izquierdo o sobre la fotografía en miniatura: "76219579".
   - ⚠️ ¡ADVERTENCIA ESTRICTA Y PROHIBICIÓN!: En el centro de la tarjeta, debajo de los prenombres o al lado de "Sexo F/M", aparece un número de 6 DÍGITOS (ej: "873517"). ¡ESE NÚMERO DE 6 DÍGITOS NO ES EL DNI! Es un código de ubigeo o lote de emisión de la tarjeta. NUNCA extraigas un número de 6 dígitos. Un DNI peruano tiene SIEMPRE EXACTAMENTE 8 DÍGITOS.
   - Tampoco confundas el "N° de Tarjeta" de 10 dígitos (ej: 0203284723) con el DNI.

2. DNI CLÁSICO AZUL (DNI 1.0) o AMARILLO (MENORES):
   - El número de 8 dígitos está en la esquina superior derecha en color negro o rojo (ej: "45879632" o "45879632-1"). Extrae los 8 dígitos principales antes del guión.

4. ZONA DE LECTURA MECÁNICA MRZ (Líneas inferiores con signos <<< en DNI electrónico):
   - La línea con "I<PER..." contiene el DNI de 8 dígitos tras PER (ej: "I<PER73674972<5..." -> DNI: "73674972").
   - La línea inferior contiene "APELLIDOS<<NOMBRES<<" (ej: "CABALLERO<<ALEXANDER<ASMIR<<" -> Apellidos: CABALLERO, Nombres: ALEXANDER ASMIR).
   - Siempre examina la zona MRZ para extraer o verificar el DNI y los nombres con máxima precisión.

5. ORIENTACIÓN Y REFLEJOS:
   - Lee el documento sin importar si está orientado horizontalmente o con inclinación.

FORMATO DE SALIDA JSON ESTRICTO:
{
  "dni": "SOLO DIGITOS DEL DNI (8 dígitos para DNI peruano, ej: 73674972; 9 dígitos para CE)",
  "nombres": "NOMBRES DE LA PERSONA",
  "apellidos": "APELLIDOS DE LA PERSONA",
  "nombre_completo": "[NOMBRES] [APELLIDOS] EN MAYÚSCULAS"
}

Reglas estrictas:
1. El campo "dni" DEBE ser los 8 dígitos reales del DNI (ej: "73674972"). Si viste 6 dígitos como "873517", DESCÁRTALO y busca el CUI de 8 dígitos en la esquina superior derecha o en la línea MRZ "I<PER...".
2. "nombre_completo": siempre primero nombres de pila y luego apellidos (ej: "ALEXANDER ASMIR CABALLERO CACERES").
3. Todo el texto de nombres debe estar 100% en MAYÚSCULAS y limpio de símbolos extraños o puntuaciones innecesarias.
4. Si la imagen no es un documento o resulta totalmente ilegible, devuelve en formato JSON: {"dni": "", "nombre_completo": ""}.`;

  let responseRaw = '';

  const client = getOpenAiClient();
  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    response_format: { type: 'json_object' },
    ...getOpenAiModelOptions(1000),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`
            }
          }
        ]
      }
    ]
  });
  responseRaw = response.choices[0]?.message?.content || '{}';

  try {
    const parsed = parseAiJsonResponse(responseRaw);
    const nombreCompleto = (parsed.nombre_completo || '').trim().toUpperCase();
    let rawDni = (parsed.dni || '').toString().replace(/[^0-9A-Za-z]/g, '').trim();

    // Si viene con guión o dígito verificador pegado (9 dígitos de DNI estándar que no empieza en 00):
    if (rawDni.length === 9 && !rawDni.startsWith('00')) {
      rawDni = rawDni.slice(0, 8);
    }

    // Regla de salvaguarda: Un DNI peruano NUNCA tiene 6 dígitos (código de ubigeo o lote)
    if (rawDni.length === 6) {
      console.warn(`[DNI Parser] Se descartó código interno de 6 dígitos (${rawDni}), no corresponde a un DNI.`);
      rawDni = '';
    }

    return {
      nombre_completo: nombreCompleto,
      dni: rawDni,
      nombres: (parsed.nombres || '').trim().toUpperCase(),
      apellidos: (parsed.apellidos || '').trim().toUpperCase()
    };
  } catch (err) {
    console.error('Error al parsear respuesta JSON de IA para DNI:', responseRaw, err);
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
  items?: ExtractedRotuloData[];
}

/**
 * AMEXito IA: Interpreta capturas de pantalla de WhatsApp o textos no estructurados
 * y extrae todos los campos requeridos para el rótulo de agencias (individual o lista múltiple)
 */
export async function parseRotuloWithAi(input: {
  text?: string;
  imageBase64?: string;
}): Promise<ExtractedRotuloData> {
  const prompt = `Eres AMEXito IA, el asistente inteligente de AMEX Courier Perú especializado en logística y rotulación de agencias.
Tu objetivo es analizar el texto y/o la imagen de un mensaje de WhatsApp u orden de envío, y extraer de forma estructurada los datos del o los destinatarios para generar rótulos de agencia de transporte (Shalom, Olva, Cruz del Sur u otra).

IMPORTANTE: Si el contenido contiene MÁS DE UN PEDIDO O DESTINATARIO (ej: 2, 3, 4 o 5 personas distintas en un mismo mensaje de WhatsApp), extrae CADA UNO en una lista de pedidos.

Estructura de salida requerida en JSON:
{
  "pedidos": [
    {
      "siglas": "Código o clave del paquete alfanumérico (ej: 'CE79', 'CE39', 'CP89', 'CP58', 'CE150', 'CP 68'). Si no hay, dejar en blanco ''",
      "totalCajas": "Cantidad total de cajas o bultos solo el número (ej: '2 cajas' -> '2', '3 cajas' -> '3', si no especifica poner '1')",
      "agencia": "Debe ser exactamente una de estas 4 opciones en mayúsculas: 'SHALOM', 'CRUZ DEL SUR', 'OLVA', o 'OTRA'",
      "agenciaOtra": "Si la agencia fue 'OTRA', el nombre de dicha agencia (ej: 'MARVISUR', 'MÓVIL BUS'). Si es Shalom, Cruz del Sur u Olva, dejar en blanco ''",
      "nombre": "Nombres y apellidos completos del destinatario (en MAYÚSCULAS)",
      "dni": "Número de identificación del destinatario: DNI (8 dígitos), Carnet de Extranjería / CE (ej: '008619120'), o RUC (11 dígitos). Solo dígitos alfanuméricos limpios sin guiones",
      "celular": "Número telefónico o de celular del destinatario (ej: '934548741', '981081414'. Solo los 9 dígitos sin espacios ni guiones)",
      "destino": "Destino completo, departamento/ciudad, agencia de entrega y/o dirección de destino (ej: 'ANCASH - CASMA - CASMA SHALOM AV. MIGUEL GRAU', 'TACNA - AV. VIGIL - SHALOM', 'CHANCAY', 'CHIMBOTE (AV. JOSÉ GÁLVEZ 767)'). En MAYÚSCULAS",
      "remitente": "Siempre 'AMEX COURIER PERÚ' (fijo e inalterable)"
    }
  ]
}

Reglas estrictas:
1. Devuelve un objeto JSON con la propiedad "pedidos" conteniendo de 1 a N pedidos detectados.
2. Limpia los números de teléfono y documentos de espacios o guiones.
3. Si algún campo no se encuentra en el texto o imagen, devuelve cadena vacía "".
4. No inventes información; solo extrae lo que esté presente o se deduzca claramente del contexto.`;

  let responseRaw = '';

  const client = getOpenAiClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentParts: any[] = [];

  if (input.imageBase64) {
    const { mimeType, base64 } = parseBase64Data(input.imageBase64);
    contentParts.push({
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${base64}` }
    });
  }

  if (input.text && input.text.trim()) {
    contentParts.push({
      type: 'text',
      text: `Texto del pedido a interpretar:\n${input.text.trim()}`
    });
  }

  contentParts.push({ type: 'text', text: prompt });

  const response = await client.chat.completions.create({
    model: DEFAULT_OPENAI_MODEL,
    response_format: { type: 'json_object' },
    ...getOpenAiModelOptions(1000),
    messages: [
      {
        role: 'user',
        content: contentParts
      }
    ]
  });
  responseRaw = response.choices[0]?.message?.content || '{}';

  try {
    const parsed = parseAiJsonResponse(responseRaw);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawList: any[] = Array.isArray(parsed.pedidos)
      ? parsed.pedidos
      : (Array.isArray(parsed) ? parsed : [parsed]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizeOrder = (p: any): ExtractedRotuloData => {
      let agencia: 'SHALOM' | 'CRUZ DEL SUR' | 'OLVA' | 'OTRA' = 'SHALOM';
      const rawAgencia = String(p.agencia || '').toUpperCase();
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
        siglas: (p.siglas || '').trim().toUpperCase(),
        totalCajas: (p.totalCajas || '').trim(),
        agencia,
        agenciaOtra: (p.agenciaOtra || '').trim().toUpperCase(),
        nombre: (p.nombre || '').trim().toUpperCase(),
        dni: (p.dni || '').trim().toUpperCase(),
        celular: (p.celular || '').trim(),
        destino: (p.destino || '').trim().toUpperCase(),
        remitente: 'AMEX COURIER PERÚ'
      };
    };

    const items = rawList.map(normalizeOrder).filter((it) => it.nombre || it.destino || it.dni);
    const firstItem = items[0] || normalizeOrder(parsed);

    return {
      ...firstItem,
      items: items.length > 0 ? items : [firstItem]
    };
  } catch (err) {
    console.error('Error al parsear respuesta JSON de IA para rótulo:', responseRaw, err);
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
 * Utiliza GPT-6 Luna con JSON estricto para máxima velocidad y precisión
 */
export async function analyzeShalomBoletaPdf(pdfBase64: string): Promise<ShalomBoletaExtractedData> {
  const { mimeType, base64 } = parseBase64Data(pdfBase64);

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

Devuelve un objeto JSON estructurado con estos campos:
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
- Devuelve exclusivamente el objeto JSON válido.`;

  let responseRaw = '';

  const client = getOpenAiClient();
  const isPdf = (mimeType || '').toLowerCase().includes('pdf');

  if (isPdf) {
    const buffer = Buffer.from(base64, 'base64');
    const file = await toFile(buffer, 'ticket.pdf', { type: 'application/pdf' });
    const uploaded = await client.files.create({ file, purpose: 'user_data' });

    try {
      const response = await client.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        response_format: { type: 'json_object' },
        ...getOpenAiModelOptions(1000),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'file', file: { file_id: uploaded.id } }
            ]
            }
          ]
        });
      responseRaw = response.choices[0]?.message?.content || '{}';
    } finally {
      await client.files.delete(uploaded.id).catch(() => {});
    }
  } else {
    const response = await client.chat.completions.create({
      model: DEFAULT_OPENAI_MODEL,
      response_format: { type: 'json_object' },
      ...getOpenAiModelOptions(1000),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${base64}`
              }
            }
          ]
        }
      ]
    });
    responseRaw = response.choices[0]?.message?.content || '{}';
  }

  try {
    const parsed = parseAiJsonResponse(responseRaw);
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
    console.error('Error al parsear respuesta JSON de IA para ticket Shalom:', responseRaw, err);
    throw new Error('No se pudo estructurar la información del comprobante de Shalom.');
  }
}
