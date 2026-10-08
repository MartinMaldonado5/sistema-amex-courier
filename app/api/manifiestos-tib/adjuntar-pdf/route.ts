import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';
import { uploadFileToR2 } from '@/lib/r2/client';
import { getDateSegments, sanitizeFileName } from '@/lib/r2/datePartitionedUpload';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await req.formData();
    const id = formData.get('id') as string | null;
    const file = formData.get('file') as File | null;

    if (!id || !file) {
      return NextResponse.json({ error: 'Faltan parámetros id o archivo PDF.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Verificar existencia del manifiesto
    const { data: manifiesto, error: manErr } = await admin
      .from('manifiestos_tib')
      .select('id, fecha_vuelo')
      .eq('id', id)
      .single();

    if (manErr || !manifiesto) {
      return NextResponse.json({ error: 'Manifiesto no encontrado.' }, { status: 404 });
    }

    // 2. Subir archivo a Cloudflare R2
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const { year, month, day } = getDateSegments();
    const cleanBase = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || `MANIFIESTO_${manifiesto.fecha_vuelo}`;
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const subPath = `manifiestos-tib/${year}/${month}/${day}/${cleanBase}.${ext}`;

    const r2Upload = await uploadFileToR2(fileBuffer, subPath, file.type || 'application/pdf');

    // 3. Actualizar registro en base de datos
    const { error: updErr } = await admin
      .from('manifiestos_tib')
      .update({
        archivo_url: r2Upload.url,
        archivo_nombre: file.name,
      })
      .eq('id', id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      archivo_url: r2Upload.url,
      archivo_nombre: file.name,
      mensaje: 'PDF original adjuntado correctamente al manifiesto.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al adjuntar archivo PDF';
    console.error('[API Manifiestos TIB Adjuntar PDF]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
