import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

export interface FuenteTibOpcion {
  id: string;
  nombre: string;
  enviado_key: string;
  fecha: string;
  origen: 'vps_hostinger' | 'r2_backup';
}

/**
 * GET /api/cobros/ultimo-enviado
 * Consulta el estado del archivo ENVIADO TIB activo directamente en el VPS de Hostinger.
 */
export async function GET() {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const vpsHost = process.env.VPS_HOST || '2.25.89.222';
    const workerPort = process.env.WORKER_PORT || '10000';
    const workerUrl = process.env.WORKER_URL || process.env.INVENTORY_WORKER_URL || process.env.RENDER_WORKER_URL || `http://${vpsHost}:${workerPort}`;

    let vpsOnline = false;
    let tibActivoNombre = 'ENVIADO TIB.xlsx';
    let tibSizeMb = '14.7';
    let tibActualizadoEn = new Date().toISOString();

    // 1. Consultar estado en vivo del VPS de Hostinger
    try {
      const vpsRes = await fetch(`${workerUrl.replace(/\/+$/, '')}/`, {
        signal: AbortSignal.timeout(3000),
      });
      if (vpsRes.ok) {
        const vpsData = await vpsRes.json();
        const sentCache = vpsData?.tibCache?.sent;
        if (sentCache && sentCache.exists) {
          vpsOnline = true;
          tibActivoNombre = sentCache.meta?.nombre_archivo || 'ENVIADO TIB.xlsx';
          tibSizeMb = (sentCache.sizeBytes / (1024 * 1024)).toFixed(1);
          tibActualizadoEn = sentCache.meta?.updated_at || vpsData.time || new Date().toISOString();
        }
      }
    } catch {
      vpsOnline = false;
    }

    // Única opción oficial: El archivo TIB almacenado en el VPS de Hostinger
    const fuentesDisponibles: FuenteTibOpcion[] = [
      {
        id: 'vps-activo',
        nombre: `⚡ VPS Hostinger: ${tibActivoNombre} (${tibSizeMb} MB)`,
        enviado_key: 'vps-activo',
        fecha: tibActualizadoEn,
        origen: 'vps_hostinger',
      },
    ];

    // Fallback: Si el VPS estuviera apagado, buscar el último de R2 como respaldo
    if (!vpsOnline) {
      try {
        const admin = getSupabaseAdmin();
        const { data: diarios } = await admin
          .from('inventario_tib_diario')
          .select('id,nombre_archivo,r2_key,fecha,subido_en')
          .eq('tipo', 'sent')
          .order('fecha', { ascending: false })
          .limit(1);

        if (diarios && diarios.length > 0 && diarios[0].r2_key) {
          fuentesDisponibles.push({
            id: diarios[0].id,
            nombre: `Respaldo R2: ${diarios[0].nombre_archivo || 'ENVIADO.xlsx'} (${diarios[0].fecha})`,
            enviado_key: diarios[0].r2_key,
            fecha: diarios[0].subido_en || diarios[0].fecha,
            origen: 'r2_backup',
          });
        }
      } catch (err) {
        console.warn('[ultimo-enviado] Error buscando respaldo R2:', err);
      }
    }

    const seleccionado = fuentesDisponibles[0];

    return NextResponse.json({
      vps_online: vpsOnline,
      job_id: seleccionado.id,
      enviado_key: seleccionado.enviado_key,
      creado_en: seleccionado.fecha,
      nombre_archivo: tibActivoNombre,
      size_mb: tibSizeMb,
      fuentes_disponibles: fuentesDisponibles,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al buscar fuentes TIB.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
