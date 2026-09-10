import { NextRequest, NextResponse } from 'next/server';
import { analyzeShalomBoletaPdf } from '@/lib/gemini/analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64 } = body;

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere el archivo PDF en formato base64.' },
        { status: 400 }
      );
    }

    const extracted = await analyzeShalomBoletaPdf(pdfBase64);

    return NextResponse.json({
      success: true,
      data: extracted
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al analizar la boleta con IA';
    console.error('[API Gemini Shalom Boleta OCR Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
