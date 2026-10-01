import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { getR2Client, R2_BUCKET_NAME, R2_ROOT_FOLDER } from '@/lib/r2/client';
import { authorizeUser } from '@/lib/auth/guards';

/**
 * POST /api/inventario-jobs/presign
 * Genera URL presignada PUT para subida DIRECTA navegador → R2
 * (evita el límite de 4.5 MB de Vercel en serverless).
 * Body: { slot: 'inventory'|'delivered'|'sent'|'received', filename: string }
 */
const SLOTS = new Set(['inventory', 'delivered', 'sent', 'received']);
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB (lo valida el worker al descargar)

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json().catch(() => ({}));
    const slot = String(body.slot || '').trim();
    const filename = String(body.filename || '').trim();

    if (!SLOTS.has(slot)) {
      return NextResponse.json({ error: 'Slot inválido.' }, { status: 400 });
    }
    if (!filename.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Solo se permiten archivos .xlsx.' }, { status: 400 });
    }

    const isDailyTib = Boolean(body.isDailyTib);
    let key: string;
    let batch = '';

    if (isDailyTib) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());
      const y = parts.find((p) => p.type === 'year')?.value || '2026';
      const m = parts.find((p) => p.type === 'month')?.value || '01';
      const d = parts.find((p) => p.type === 'day')?.value || '01';
      const todayLima = `${y}-${m}-${d}`;
      const fecha = String(body.fecha || '').trim() || todayLima;
      key = `${R2_ROOT_FOLDER}/inventario-tib/diario/${fecha}/${slot}.xlsx`;
    } else {
      batch = randomUUID().replace(/-/g, '');
      key = `${R2_ROOT_FOLDER}/inventario-jobs/uploads/${batch}/${slot}.xlsx`;
    }

    const client = getR2Client();
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      { expiresIn: 900 } // 15 minutos
    );

    return NextResponse.json({
      key,
      uploadUrl,
      batch,
      maxBytes: MAX_FILE_BYTES,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo generar la URL de subida.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
