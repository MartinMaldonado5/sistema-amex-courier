import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser } from '@/lib/auth/guards';
import {
  QueryPaquetesSchema,
  CreatePaqueteSchema,
} from '@/lib/validations/paquetes.schema';
import { validateQuery, validateBody } from '@/lib/api/validate';
import type { Paquete, TipoEstadoTib, TipoEstadoEntrega, TipoEstadoAmex, TipoMetodoEntrega, TipoUbicacion } from '@/types';

function mapPaqueteRow(row: Record<string, unknown>): Paquete {
  const posicion = String(
    row.posicion_estante ||
      (row.anaquel && row.piso ? `${row.anaquel}-${row.piso}` : 'REC')
  );
  const [anaquel, piso] = posicion.includes('-') ? posicion.split('-') : [posicion, 'P1'];

  return {
    id: String(row.id),
    numeroReciboBodega: String(row.numero_recibo_bodega || ''),
    tracking: String(row.tracking || row.tracking_usa || ''),
    trackingUsa: String(row.tracking || row.tracking_usa || ''),
    tipoEmpaque: String(row.tipo_empaque || ''),
    numeroFactura: '',
    dniConsignatario: String(row.dni_consignatario || ''),
    nombreConsignatario: String(row.nombre_consignatario || ''),
    descripcion: String(row.descripcion || ''),
    pesoKg: row.peso_kg !== null && row.peso_kg !== undefined ? Number(row.peso_kg) : 0,
    ubicacionActual: (row.ubicacion_actual as TipoUbicacion) || 'AmexLince',
    anaquel: String(row.anaquel || anaquel),
    piso: String(row.piso || piso),
    posicionEstante: posicion,
    estadoTib: ((row.estado_tib || row.estado_entrega) as TipoEstadoTib) || 'EnAlmacen',
    estadoEntrega: ((row.estado_tib || row.estado_entrega) as TipoEstadoTib) || 'EnAlmacen',
    estadoAmex: (row.estado_amex as TipoEstadoAmex) || 'recibido',
    facturaPdfUrl: '',
    usuarioEmail: String(row.usuario_email || ''),
    creadoPor: row.creado_por ? String(row.creado_por) : undefined,
    creadoEn: String(row.creado_en || ''),
  };
}

/**
 * GET /api/paquetes — Consulta paginada de paquetes con filtros e índices en servidor.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const queryValidation = validateQuery(QueryPaquetesSchema, req.nextUrl.searchParams);
    if (!queryValidation.ok) return queryValidation.response;

    const { page, pageSize, search, estadoTib, estadoEntrega, ubicacionActual, sortBy, sortOrder } =
      queryValidation.data;

    const admin = getSupabaseAdmin();
    let query = admin
      .from('paquetes')
      .select('*', { count: 'exact' })
      .is('eliminado_en', null);

    const filterStatus = estadoTib || estadoEntrega;
    if (filterStatus) {
      query = query.eq('estado_tib', filterStatus);
    }

    if (ubicacionActual) {
      query = query.eq('ubicacion_actual', ubicacionActual);
    }

    if (search) {
      const cleanSearch = search.trim();
      query = query.or(
        `numero_recibo_bodega.ilike.%${cleanSearch}%,dni_consignatario.ilike.%${cleanSearch}%,tracking.ilike.%${cleanSearch}%,nombre_consignatario.ilike.%${cleanSearch}%`
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

    const { data: rows, count, error } = await query;

    if (error) {
      console.error('[API /api/paquetes GET Error]:', error);
      return NextResponse.json(
        { error: 'Error al consultar paquetes en base de datos.' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    const data = (rows || []).map((r) => mapPaqueteRow(r as Record<string, unknown>));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('[API /api/paquetes GET Unexpected Error]:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar consulta de paquetes.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/paquetes — Creación validada de un paquete con auditoría.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const bodyValidation = await validateBody(CreatePaqueteSchema, req);
    if (!bodyValidation.ok) return bodyValidation.response;

    const data = bodyValidation.data;
    const admin = getSupabaseAdmin();

    const insertRow = {
      numero_recibo_bodega: data.numeroReciboBodega,
      tracking: data.tracking || data.trackingUsa || '',
      tipo_empaque: data.tipoEmpaque,
      dni_consignatario: data.dniConsignatario || null,
      nombre_consignatario: data.nombreConsignatario || null,
      descripcion: data.descripcion,
      peso_kg: data.pesoKg,
      ubicacion_actual: data.ubicacionActual,
      anaquel: data.anaquel || null,
      piso: data.piso || null,
      posicion_estante: data.posicionEstante || null,
      estado_tib: data.estadoTib || data.estadoEntrega || 'EnAlmacen',
      estado_amex: (data as any).estadoAmex || 'recibido',
      creado_por: auth.user.id,
      usuario_email: auth.user.email || null,
    };

    const { data: created, error } = await admin
      .from('paquetes')
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error('[API /api/paquetes POST Error]:', error);
      return NextResponse.json(
        { error: 'No se pudo registrar el paquete en la base de datos.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: mapPaqueteRow(created as Record<string, unknown>),
        message: 'Paquete registrado exitosamente.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API /api/paquetes POST Unexpected Error]:', err);
    return NextResponse.json(
      { error: 'Error interno al crear el paquete.' },
      { status: 500 }
    );
  }
}
