import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

const TIB_API_URL = 'https://www.tibcourier.com/global-courier/ajax/readListaWarehouse.php';
const TIB_BASE_URL = 'https://www.tibcourier.com/global-courier/ajax/';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = req.nextUrl;
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 200), 1), 1000);

    const admin = getSupabaseAdmin();

    // 1. Total de paquetes con WR
    const { count: totalCount } = await admin
      .from('paquetes')
      .select('id', { count: 'exact', head: true })
      .not('numero_recibo_bodega', 'is', null)
      .neq('numero_recibo_bodega', '');

    // 2. Con imagen ya guardada
    const { count: withImageCount } = await admin
      .from('paquetes')
      .select('id', { count: 'exact', head: true })
      .not('numero_recibo_bodega', 'is', null)
      .neq('numero_recibo_bodega', '')
      .not('tib_imagen_url', 'is', null);

    // 3. Faltantes de imagen
    const { data: missingList, count: missingCount, error } = await admin
      .from('paquetes')
      .select('id, numero_recibo_bodega, tracking, nombre_consignatario, peso_kg, tib_imagen_url, tib_ticket_pdf_url, creado_en', { count: 'exact' })
      .not('numero_recibo_bodega', 'is', null)
      .neq('numero_recibo_bodega', '')
      .is('tib_imagen_url', null)
      .order('creado_en', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      totalPackages: totalCount || 0,
      withImage: withImageCount || 0,
      totalMissing: missingCount || 0,
      missing: (missingList || []).map((row: any) => ({
        id: row.id,
        numeroReciboBodega: row.numero_recibo_bodega,
        tracking: row.tracking || '',
        nombreConsignatario: row.nombre_consignatario || '',
        pesoKg: Number(row.peso_kg || 0),
        tibImagenUrl: row.tib_imagen_url || null,
        tibTicketPdfUrl: row.tib_ticket_pdf_url || null,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar estadísticas TIB';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const rawWr = String(body.wr || '').trim();
    const id = body.id ? String(body.id).trim() : null;
    const forceRefresh = Boolean(body.forceRefresh);

    if (!rawWr) {
      return NextResponse.json({ error: 'El parámetro "wr" es obligatorio.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Si no se fuerza refresco, verificar si ya tenemos la URL guardada en Supabase
    if (!forceRefresh) {
      let query = admin
        .from('paquetes')
        .select('id, numero_recibo_bodega, tracking, tib_imagen_url, tib_ticket_pdf_url, nombre_consignatario, peso_kg');

      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.ilike('numero_recibo_bodega', rawWr);
      }

      const { data: cached } = await query.maybeSingle();

      if (cached?.tib_imagen_url) {
        return NextResponse.json({
          ok: true,
          cached: true,
          tibImagenUrl: cached.tib_imagen_url,
          tibTicketPdfUrl: cached.tib_ticket_pdf_url,
          wr: cached.numero_recibo_bodega,
        });
      }
    }

    // 2. Extraer dígitos significativos del WR (WR000475750 -> 475750)
    const cleanNumericWr = rawWr.replace(/\D/g, '').replace(/^0+/, '');
    if (!cleanNumericWr) {
      return NextResponse.json({ error: 'Formato de WR inválido.' }, { status: 400 });
    }

    // 3. Consultar la API backend de TIBCARGO
    const tibResponse = await fetch(TIB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body: JSON.stringify({ warehouse: cleanNumericWr }),
      signal: AbortSignal.timeout(10000),
    });

    if (!tibResponse.ok) {
      return NextResponse.json(
        { error: `Error del servidor TIB (HTTP ${tibResponse.status})` },
        { status: 502 }
      );
    }

    const tibData = await tibResponse.json();

    if (!Array.isArray(tibData) || tibData.length === 0) {
      return NextResponse.json({
        ok: true,
        found: false,
        message: `No se encontró información en TIB para el WR ${rawWr}.`,
      });
    }

    const pkg = tibData[0];
    const tibImagenUrl = pkg.img ? `${TIB_BASE_URL}${pkg.img}` : null;
    const tibTicketPdfUrl = pkg.ticket ? `${TIB_BASE_URL}${pkg.ticket}` : null;

    // 4. Guardar en Supabase para persistencia y caché instantáneo
    if (tibImagenUrl || tibTicketPdfUrl) {
      const updatePayload: Record<string, any> = {
        tib_imagen_url: tibImagenUrl,
        tib_ticket_pdf_url: tibTicketPdfUrl,
        actualizado_en: new Date().toISOString(),
      };

      if (id) {
        await admin.from('paquetes').update(updatePayload).eq('id', id);
      } else {
        await admin
          .from('paquetes')
          .update(updatePayload)
          .ilike('numero_recibo_bodega', rawWr);
      }
    }

    return NextResponse.json({
      ok: true,
      found: true,
      cached: false,
      tibImagenUrl,
      tibTicketPdfUrl,
      tibData: {
        wr: pkg.wr,
        seqwr: pkg.seqwr,
        tracking: pkg.tracking,
        cliente: pkg.nclient,
        pesoKg: pkg.weight,
        estado: pkg.status,
        fecha: pkg.fecRegister,
        rack: pkg.rack,
        empaque: pkg.container,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al consultar TIB';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
