import { NextRequest, NextResponse } from 'next/server';
import { extractDniNameFromImage } from '@/lib/gemini/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere la imagen del anverso en formato base64.' },
        { status: 400 }
      );
    }

    const result = await extractDniNameFromImage(imageBase64);

    if (!result.nombre_completo) {
      return NextResponse.json(
        {
          success: false,
          error: 'La IA no pudo detectar nombres legibles en la imagen proporcionada.'
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      nombre_completo: result.nombre_completo,
      nombres: result.nombres || '',
      apellidos: result.apellidos || ''
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar el documento con IA';
    console.error('[API Gemini DNI Extraction Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
