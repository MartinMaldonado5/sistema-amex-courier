import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authorizeUser, getUserDisplayName, hasAdminRole } from '@/lib/auth/guards';
import { syncCompletedExcelToDatabase } from '@/lib/inventory-jobs/syncDb';

/**
 * POST /api/inventario-jobs/[id]/sync-db
 * Sincroniza e inyecta los resultados del cruce TIB directamente en la tabla paquetes y kardex de Supabase.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorizeUser();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    if (!id || !/^[a-f0-9-]{10,60}$/i.test(id)) {
      return NextResponse.json({ error: 'ID de trabajo inválido.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let query = admin
      .from('inventario_jobs')
      .select('*')
      .eq('id', id);

    if (!(await hasAdminRole(auth.user))) {
      query = query.eq('usuario_id', auth.user.id);
    }

    const { data: job, error: jobErr } = await query.single();
    if (jobErr || !job) {
      return NextResponse.json({ error: 'Trabajo no encontrado o sin permisos.' }, { status: 404 });
    }

    if (job.estado !== 'done' || !job.resultado_key) {
      return NextResponse.json(
        { error: 'El trabajo aún no ha terminado exitosamente o no contiene archivo de resultado.' },
        { status: 400 }
      );
    }

    // Ejecutar sincronización a base de datos
    const result = await syncCompletedExcelToDatabase(job.resultado_key, {
      jobId: job.id,
      userEmail: auth.user.email || '',
      userNombre: getUserDisplayName(auth.user),
      userId: auth.user.id
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Fallo al sincronizar en base de datos.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `¡Éxito! Se actualizaron ${result.updatedCount} paquetes${result.insertedCount > 0 ? ` y se registraron ${result.insertedCount} nuevos` : ''} en la base de datos master.`,
      updatedCount: result.updatedCount,
      insertedCount: result.insertedCount,
      totalRows: result.totalRows,
      detalles: result.detalles
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar datos a la base de datos.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
