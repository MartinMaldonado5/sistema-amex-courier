import { NextRequest, NextResponse } from 'next/server';
import { analyzeShalomBoletaPdf, SHALOM_AI_MODEL } from '@/lib/openai/analyzer';
import { authorizeUser } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const { pdfBase64 } = body;

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere el archivo PDF o imagen en formato base64.' },
        { status: 400 }
      );
    }
    if (pdfBase64.length > 14_000_000) {
      return NextResponse.json({ error: 'El archivo supera el límite de 10 MB.' }, { status: 413 });
    }

    const extracted = await analyzeShalomBoletaPdf(pdfBase64);

    return NextResponse.json({
      success: true,
      data: extracted,
      model: SHALOM_AI_MODEL
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al analizar la boleta con IA';
    console.error('[API OpenAI Shalom Boleta OCR Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
