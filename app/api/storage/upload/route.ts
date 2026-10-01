import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToR2 } from '@/lib/r2/client';
import { authorizeUser } from '@/lib/auth/guards';
import {
  buildEntregaPath,
  buildInvoicePath,
  buildDniPath,
  buildManifiestoPath,
  buildVoucherPath,
  getDateSegments,
  sanitizeFileName
} from '@/lib/r2/datePartitionedUpload';
import { UploadMetadataSchema } from '@/lib/validations/storage.schema';
import { formatZodError } from '@/lib/api/validate';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawFolder = ((formData.get('folder') as string) || 'entregas').toLowerCase().replace(/^\/+|\/+$/g, '');

    const metaParsed = UploadMetadataSchema.safeParse({
      folder: rawFolder,
      codigoEntrega: formData.get('codigoEntrega') || '',
      codigoCobro: formData.get('codigoCobro') || '',
      clienteNombre: formData.get('clienteNombre') || '',
      receptorNombre: formData.get('receptorNombre') || '',
      wrNumero: formData.get('wrNumero') || '',
      casillero: formData.get('casillero') || '',
      tienda: formData.get('tienda') || '',
      metodoPago: formData.get('metodoPago') || 'YAPE',
      tipoDni: formData.get('tipoDni') || 'ANVERSO',
    });

    if (!metaParsed.success) {
      return NextResponse.json(
        { error: 'Metadatos de subida inválidos.', details: formatZodError(metaParsed.error) },
        { status: 400 }
      );
    }

    const {
      folder,
      codigoEntrega,
      codigoCobro,
      clienteNombre,
      receptorNombre,
      wrNumero,
      casillero,
      tienda,
      metodoPago,
      tipoDni
    } = metaParsed.data;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite permitido de 25 MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let subPath = '';

    // Generar ruta inteligente según el módulo
    if (folder === 'entregas' || folder === 'expedientes' || folder === 'fotos') {
      const clienteOReceptor = receptorNombre || clienteNombre || 'CLIENTE';
      subPath = buildEntregaPath(codigoEntrega || '', clienteOReceptor, file.name);
    } else if (folder === 'vouchers' || folder === 'vouchers-pagos') {
      const ext = file.name.split('.').pop() || 'webp';
      subPath = buildVoucherPath(codigoCobro || 'VOU', clienteNombre || 'CLIENTE', metodoPago, ext);
    } else if (folder === 'facturas' || folder === 'facturas-invoices') {
      subPath = buildInvoicePath(wrNumero || '', clienteNombre || '', tienda || '', file.name);
    } else if (folder === 'dnis' || folder === 'documentos-dni') {
      const ext = file.name.split('.').pop() || 'jpg';
      subPath = buildDniPath(casillero || '', clienteNombre || '', tipoDni, ext);
    } else if (folder === 'manifiestos' || folder === 'manifiestos-despacho') {
      const ext = file.name.split('.').pop() || 'pdf';
      subPath = buildManifiestoPath('CARRO_AMEX', codigoEntrega || 'RUTA', ext);
    } else {
      const { year, month, day } = getDateSegments();
      const cleanName = sanitizeFileName(file.name.split('.')[0]) + '.' + (file.name.split('.').pop() || 'bin');
      subPath = `documentos/${year}/${month}/${day}/${cleanName}`;
    }

    const { url, publicUrl, key } = await uploadFileToR2(buffer, subPath, file.type || 'application/octet-stream');

    return NextResponse.json({
      success: true,
      url,
      publicUrl,
      key,
      path: subPath,
      fileName: file.name,
      sizeBytes: file.size
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al subir archivo a Cloudflare R2';
    console.error('[R2 Upload Error]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
