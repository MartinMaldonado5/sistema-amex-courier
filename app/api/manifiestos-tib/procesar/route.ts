import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/lib/auth/guards';
import OpenAI from 'openai';

export const maxDuration = 120; // 2 minutos para procesamiento de documentos multipágina

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo PDF o imagen.' }, { status: 400 });
    }

    // 1. Intentar procesar en el microservicio Python VPS dedicado
    const vpsHost = process.env.VPS_HOST || '2.25.89.222';
    const engineUrl = process.env.MANIFEST_ENGINE_URL || `http://${vpsHost}:8000`;

    try {
      const pythonFormData = new FormData();
      pythonFormData.append('file', file);

      const pyRes = await fetch(`${engineUrl}/process-manifest`, {
        method: 'POST',
        body: pythonFormData,
        signal: AbortSignal.timeout(90000),
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        return NextResponse.json(pyData);
      }
    } catch (pyErr) {
      console.warn(`[Manifiesto TIB] Fallo de conexión con motor Python VPS (${engineUrl}):`, pyErr);
      // Fallback a motor IA Vision si el VPS no está encendido o en mantenimiento
    }

    // 2. Motor de Contingencia / Fallback con IA Vision y Structured Output
    if (process.env.OPENAI_API_KEY) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Analiza este manifiesto diario de entrega de TIB Courier a AMEX.
Debes extraer:
1. Encabezado: Fecha de vuelo, modalidad (OFICINA, DOMICILIO o PROVINCIA según el checkbox marcado), total de guías declaradas, total de paquetes embarcados declarados.
2. Cada fila de la tabla:
   - "guia": código AMX (ej: AMX000009060)
   - "wrs": lista de códigos WR asociados (ej: ["WR000469622", "WR000465623"]). Si hay múltiples WRs separados por barra, guión o saltos de línea, extráelos todos como elementos separados.
   - "observacion": cualquier texto en la columna observación.

Cuadre estricto: Asegúrate de extraer absolutamente todas las filas de todas las hojas sin omitir ninguna.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'manifest_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                encabezado: {
                  type: 'object',
                  properties: {
                    fecha_vuelo: { type: 'string' },
                    cliente: { type: 'string' },
                    modalidad: { type: 'string', enum: ['OFICINA', 'DOMICILIO', 'PROVINCIA'] },
                    guias_declaradas: { type: 'number' },
                    paquetes_declarados: { type: 'number' }
                  },
                  required: ['fecha_vuelo', 'cliente', 'modalidad', 'guias_declaradas', 'paquetes_declarados'],
                  additionalProperties: false
                },
                filas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      guia: { type: 'string' },
                      wrs: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      observacion: { type: 'string' }
                    },
                    required: ['guia', 'wrs', 'observacion'],
                    additionalProperties: false
                  }
                }
              },
              required: ['encabezado', 'filas'],
              additionalProperties: false
            }
          }
        }
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      const header = parsed.encabezado || {};
      const filas = parsed.filas || [];

      // Ejecutar reconciliación matemática
      const guiasDeclaradas = Number(header.guias_declaradas || 0);
      const paquetesDeclarados = Number(header.paquetes_declarados || 0);

      const totalGuiasExtraidas = filas.length;
      let totalWrsExtraidos = 0;
      const guiasMultiPaquete: any[] = [];
      const guiasSinPaquete: any[] = [];

      for (const f of filas) {
        const wrs = f.wrs || [];
        totalWrsExtraidos += wrs.length;
        if (wrs.length > 1) {
          guiasMultiPaquete.push({ guia: f.guia, cantidad: wrs.length, wrs });
        } else if (wrs.length === 0) {
          guiasSinPaquete.push({ guia: f.guia, observacion: f.observacion });
        }
      }

      const difGuias = totalGuiasExtraidas - guiasDeclaradas;
      const difPaquetes = totalWrsExtraidos - paquetesDeclarados;
      const cuadrePerfecto = guiasDeclaradas > 0 && difGuias === 0 && difPaquetes === 0;

      return NextResponse.json({
        success: true,
        archivo: file.name,
        motor: 'openai_vision_contingency',
        encabezado: header,
        cuadre: {
          cuadre_perfecto: cuadrePerfecto,
          status_code: cuadrePerfecto ? 'CUADRE_PERFECTO' : 'DESCUADRE',
          mensaje: cuadrePerfecto
            ? `✓ Cuadre Perfecto: 100% de coincidencia (${totalGuiasExtraidas} Guías / ${totalWrsExtraidos} Paquetes).`
            : `⚠️ Descuadre detectado: Guías (${totalGuiasExtraidas}/${guiasDeclaradas}) • Paquetes (${totalWrsExtraidos}/${paquetesDeclarados})`,
          totales: {
            guias_declaradas: guiasDeclaradas,
            guias_extraidas: totalGuiasExtraidas,
            diferencia_guias: difGuias,
            paquetes_declarados: paquetesDeclarados,
            paquetes_extraidos: totalWrsExtraidos,
            diferencia_paquetes: difPaquetes
          },
          auditoria: {
            total_guias_con_multiples_paquetes: guiasMultiPaquete.length,
            guias_multi_paquete: guiasMultiPaquete,
            total_guias_sin_paquete: guiasSinPaquete.length,
            guias_sin_paquete: guiasSinPaquete
          }
        },
        filas
      });
    }

    return NextResponse.json(
      { error: 'No se pudo conectar al motor Python VPS y no hay clave OPENAI_API_KEY configurada para contingencia.' },
      { status: 503 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al procesar el manifiesto';
    console.error('[API Manifiestos TIB]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
