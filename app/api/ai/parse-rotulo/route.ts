import { NextRequest, NextResponse } from 'next/server';
import { parseRotuloWithAi } from '@/lib/openai/analyzer';
import { authorizeUser } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const { text, imageBase64 } = body;

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Debes proporcionar un texto del pedido o una captura de pantalla en formato base64.' },
        { status: 400 }
      );
    }
    if (typeof text === 'string' && text.length > 20_000) {
      return NextResponse.json({ error: 'El texto supera el límite permitido.' }, { status: 413 });
    }
    if (typeof imageBase64 === 'string' && imageBase64.length > 14_000_000) {
      return NextResponse.json({ error: 'La imagen supera el límite permitido.' }, { status: 413 });
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
    console.error('[API OpenAI Parse Rotulo Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
