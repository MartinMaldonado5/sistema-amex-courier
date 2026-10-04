import { NextRequest, NextResponse } from 'next/server';
import { getR2Client, R2_BUCKET_NAME, R2_ROOT_FOLDER } from '@/lib/r2/client';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { authorizeUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

/**
 * GET /api/inventario-jobs/download?key=...
 * Descarga directa y segura de archivos de resultado .xlsx de inventario_jobs desde R2.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Falta el parámetro "key".' }, { status: 400 });
    }

    key = decodeURIComponent(key).trim().replace(/^\/+/, '');
    if (!key || key.includes('\0') || key.split('/').some((s) => s === '..')) {
      return NextResponse.json({ error: 'Clave de archivo inválida.' }, { status: 400 });
    }

    const client = getR2Client();
    let response;
    let finalKey = key;

    try {
      response = await client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: finalKey,
        })
      );
    } catch (firstErr: unknown) {
      if (!key.startsWith(R2_ROOT_FOLDER)) {
        finalKey = `${R2_ROOT_FOLDER}/${key}`;
        response = await client.send(
          new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: finalKey,
          })
        );
      } else {
        throw firstErr;
      }
    }

    if (!response || !response.Body) {
      return NextResponse.json({ error: 'Archivo no encontrado en R2.' }, { status: 404 });
    }

    const byteArray = await response.Body.transformToByteArray();
    const filename = finalKey.split('/').pop() || 'Inventario_COMPLETADO.xlsx';

    return new NextResponse(Buffer.from(byteArray), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al descargar archivo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
