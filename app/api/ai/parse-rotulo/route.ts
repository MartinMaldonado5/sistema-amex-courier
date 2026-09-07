import { NextRequest, NextResponse } from 'next/server';
import { parseRotuloWithAi } from '@/lib/gemini/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, imageBase64 } = body;

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Debes proporcionar un texto del pedido o una captura de pantalla en formato base64.' },
        { status: 400 }
      );
    }

    const data = await parseRotuloWithAi({
      text: typeof text === 'string' ? text : undefined,
      imageBase64: typeof imageBase64 === 'string' ? imageBase64 : undefined
    });

    return NextResponse.json({
      success: true,
      data
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al interpretar el rótulo con AMEXito IA';
    console.error('[API Gemini Parse Rotulo Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
