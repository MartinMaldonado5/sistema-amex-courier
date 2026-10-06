import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim();
    const modalidad = (searchParams.get('modalidad') || '').trim();
    const cuadre = (searchParams.get('cuadre') || '').trim();

    const admin = getSupabaseAdmin();

    // 1. Si hay búsqueda por término, verificar si coincide con guía AMX o WR en los detalles
    let manifestIdsFromDetails: string[] | null = null;
    if (search) {
      const { data: matchedDetails } = await admin
        .from('manifiestos_tib_detalles')
        .select('manifiesto_id')
        .or(`numero_guia_amx.ilike.%${search}%,numero_wr.ilike.%${search}%,observacion.ilike.%${search}%`)
        .limit(200);

      if (matchedDetails && matchedDetails.length > 0) {
        manifestIdsFromDetails = Array.from(new Set(matchedDetails.map((d) => d.manifiesto_id)));
      }
    }

    // 2. Consulta principal de manifiestos
    let query = admin
      .from('manifiestos_tib')
      .select('*')
      .order('creado_en', { ascending: false });

    if (modalidad && modalidad !== 'TODAS') {
      query = query.eq('modalidad', modalidad);
    }

    if (cuadre === 'PERFECTO') {
      query = query.eq('es_cuadre_perfecto', true);
    } else if (cuadre === 'DESCUADRE') {
      query = query.eq('es_cuadre_perfecto', false);
    }

    if (search) {
      if (manifestIdsFromDetails && manifestIdsFromDetails.length > 0) {
        // Coincide por cabecera O por detalle
        const idsList = `(${manifestIdsFromDetails.map((id) => `"${id}"`).join(',')})`;
        query = query.or(
          `fecha_vuelo.ilike.%${search}%,archivo_nombre.ilike.%${search}%,creado_por.ilike.%${search}%,id.in.${idsList}`
        );
      } else {
        query = query.or(
          `fecha_vuelo.ilike.%${search}%,archivo_nombre.ilike.%${search}%,creado_por.ilike.%${search}%`
        );
      }
    }

    const { data: manifiestos, error } = await query.limit(50);

    if (error) {
      console.error('Error al listar manifiestos_tib:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Obtener estadísticas globales para los KPIs
    const { data: allStats, error: statsErr } = await admin
      .from('manifiestos_tib')
      .select('guias_extraidas, paquetes_extraidos, es_cuadre_perfecto');

    let totalManifiestos = 0;
    let totalGuias = 0;
    let totalPaquetes = 0;
    let totalCuadrePerfecto = 0;

    if (!statsErr && allStats) {
      totalManifiestos = allStats.length;
      allStats.forEach((m) => {
        totalGuias += Number(m.guias_extraidas || 0);
        totalPaquetes += Number(m.paquetes_extraidos || 0);
        if (m.es_cuadre_perfecto) totalCuadrePerfecto++;
      });
    }

    const tasaCuadre =
      totalManifiestos > 0 ? Math.round((totalCuadrePerfecto / totalManifiestos) * 100) : 100;

    return NextResponse.json({
      success: true,
      manifiestos: manifiestos || [],
      stats: {
        totalManifiestos,
        totalGuias,
        totalPaquetes,
        totalCuadrePerfecto,
        tasaCuadre,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno al consultar historial';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
