import { uploadFileToR2 } from './client';

/**
 * Sanitiza una cadena para uso seguro en rutas de almacenamiento
 */
function sanitizeFileNamePart(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Solo alfanumérico, guiones y guiones bajos
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);
}

/**
 * Sube una boleta de Shalom a Cloudflare R2 organizándola por fecha:
 * FOLDER AMEX/boletas-shalom/YYYY/MM/DD/SHALOM_{NRO_GUIA}_{DESTINATARIO}_{TIMESTAMP}.pdf
 */
export async function uploadShalomBoletaPdf(
  fileBuffer: Buffer,
  fechaEmision: string,
  nroGuia: string,
  destinatario: string
): Promise<{ url: string; publicUrl: string; key: string }> {
  // Parsear fecha o usar fecha actual
  let year = '2026';
  let month = '01';
  let day = '01';

  if (fechaEmision && /^\d{4}-\d{2}-\d{2}$/.test(fechaEmision)) {
    const parts = fechaEmision.split('-');
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    const now = new Date();
    year = String(now.getFullYear());
    month = String(now.getMonth() + 1).padStart(2, '0');
    day = String(now.getDate()).padStart(2, '0');
  }

  const cleanGuia = sanitizeFileNamePart(nroGuia) || 'SIN_GUIA';
  const cleanDest = sanitizeFileNamePart(destinatario) || 'CLIENTE';
  const timestamp = Date.now();

  const fileName = `SHALOM_${cleanGuia}_${cleanDest}_${timestamp}.pdf`;
  const subPath = `boletas-shalom/${year}/${month}/${day}/${fileName}`;

  return await uploadFileToR2(fileBuffer, subPath, 'application/pdf');
}
