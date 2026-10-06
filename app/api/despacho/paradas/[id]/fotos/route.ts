import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2, getR2ViewUrl } from '@/lib/r2/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getDateSegments, sanitizeFileName } from '@/lib/r2/datePartitionedUpload';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paradaId } = await params;
    if (!paradaId) {
      return NextResponse.json({ error: 'ID de parada no proporcionado.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const destinatario = (formData.get('destinatario') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo de imagen.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen (JPEG, PNG, WEBP, etc.).' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede exceder los 15 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { year, month, day } = getDateSegments();
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const cleanDestinatario = sanitizeFileName(destinatario || 'entrega');
    const fileName = `${timestamp}_${cleanDestinatario}.${ext}`;
    const subPath = `despacho-rutas/${year}/${month}/${day}/${paradaId}/${fileName}`;

    // Subida a Cloudflare R2 FOLDER AMEX
    const { key, url: rawUrl, publicUrl } = await uploadFileToR2(buffer, subPath, file.type);
    const finalPhotoUrl = getR2ViewUrl(key) || publicUrl || rawUrl;

    const admin = getSupabaseAdmin();

    // 1. Obtener fotos actuales de la parada
    const { data: parada, error: fetchErr } = await admin
      .from('despacho_paradas')
      .select('fotos')
      .eq('id', paradaId)
      .single();

    if (fetchErr) {
      console.error('Error buscando parada:', fetchErr);
      return NextResponse.json({ error: 'Parada no encontrada en la base de datos.' }, { status: 404 });
    }

    const currentFotos: string[] = Array.isArray(parada?.fotos) ? parada.fotos : [];
    const updatedFotos = [...currentFotos, finalPhotoUrl];

    // 2. Actualizar parada con la nueva foto
    const { error: updateErr } = await admin
      .from('despacho_paradas')
      .update({ fotos: updatedFotos })
      .eq('id', paradaId);

    if (updateErr) {
      console.error('Error actualizando fotos de parada:', updateErr);
      return NextResponse.json({ error: 'Error al asociar la foto a la parada.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: finalPhotoUrl,
      fotos: updatedFotos
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al procesar la subida de foto';
    console.error('[API Despacho Foto Upload Error]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paradaId } = await params;
    if (!paradaId) {
      return NextResponse.json({ error: 'ID de parada no proporcionado.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const fotoUrl = body.fotoUrl;

    if (!fotoUrl) {
      return NextResponse.json({ error: 'Se requiere la URL de la foto a eliminar.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data: parada, error: fetchErr } = await admin
      .from('despacho_paradas')
      .select('fotos')
      .eq('id', paradaId)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: 'Parada no encontrada.' }, { status: 404 });
    }

    const currentFotos: string[] = Array.isArray(parada?.fotos) ? parada.fotos : [];
    const updatedFotos = currentFotos.filter(f => f !== fotoUrl);

    const { error: updateErr } = await admin
      .from('despacho_paradas')
      .update({ fotos: updatedFotos })
      .eq('id', paradaId);

    if (updateErr) {
      return NextResponse.json({ error: 'Error al actualizar las fotos de la parada.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fotos: updatedFotos
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar la foto';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
