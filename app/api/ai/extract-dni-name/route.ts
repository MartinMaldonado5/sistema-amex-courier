import { NextRequest, NextResponse } from 'next/server';
import { extractDniNameFromImage } from '@/lib/openai/analyzer';

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

    if (!result.nombre_completo && !result.dni) {
      console.warn('[API DNI Extraction Warning]: No se detectaron nombres ni DNI en la imagen.');
      return NextResponse.json(
        {
          success: false,
          error: 'La IA no pudo detectar nombres ni número de DNI legibles en la imagen proporcionada.'
        },
        { status: 422 }
      );
    }

    console.log('[API DNI Extraction Success]:', {
      nombre: result.nombre_completo,
      dni: result.dni
    });

    return NextResponse.json({
      success: true,
      nombre_completo: result.nombre_completo || '',
      dni: result.dni || '',
      nombres: result.nombres || '',
      apellidos: result.apellidos || ''
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al procesar el documento con IA';
    console.error('[API DNI Extraction Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
