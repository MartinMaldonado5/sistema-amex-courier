import writeXlsxFile from 'write-excel-file/node';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface DbInventoryOptions {
  filtroEstado?: 'activos' | 'todos';
}

export interface GeneratedInventory {
  buffer: Buffer;
  count: number;
  filtroEstado: 'activos' | 'todos';
  wrs: string[];
}

function mapEstadoLabel(estado?: string | null): string {
  if (!estado) return 'En Almacén';
  const norm = estado.trim();
  if (norm.toLowerCase() === 'enviado' || norm === 'Enviado') return 'Enviado';
  if (norm.toLowerCase() === 'recibido' || norm === 'Recibido') return 'Recibido';
  if (norm === 'EnAlmacen') return 'En Almacén';
  if (norm === 'EnRutaCarroAmex') return 'En Ruta Carro Amex';
  if (norm === 'ListoParaRecojo') return 'Listo para Recojo';
  if (norm === 'Entregado') return 'Entregado';
  return norm;
}

/**
 * Consulta de conteo rápido para mostrar en la interfaz cuántos paquetes hay listos en BD
 */
export async function getDbInventoryCount(options?: DbInventoryOptions): Promise<{ count: number }> {
  const admin = getSupabaseAdmin();
  const filtro = options?.filtroEstado || 'activos';

  let query = admin
    .from('paquetes')
    .select('id', { count: 'exact', head: true })
    .is('eliminado_en', null);

  if (filtro === 'activos') {
    query = query.neq('estado_entrega', 'Entregado');
  }

  const { count, error } = await query;
  if (error) {
    console.error('Error obteniendo conteo de inventario en BD:', error);
    return { count: 0 };
  }

  return { count: count ?? 0 };
}

/**
 * Extrae paquetes de la base de datos oficial y genera en memoria un archivo Excel (.xlsx)
 * con el formato estándar idéntico al procesador TIB.
 */
export async function generateInventoryExcelBufferFromDb(
  options?: DbInventoryOptions
): Promise<GeneratedInventory> {
  const admin = getSupabaseAdmin();
  const filtro = options?.filtroEstado || 'activos';

  let query = admin
    .from('paquetes')
    .select(`
      numero_recibo_bodega,
      tracking_usa,
      nombre_consignatario,
      tipo_empaque,
      peso_kg,
      estado_entrega,
      estado_amex,
      anaquel,
      piso,
      posicion_estante,
      ubicacion_actual,
      usuario_email,
      descripcion,
      creado_en
    `)
    .is('eliminado_en', null)
    .order('creado_en', { ascending: false });

  if (filtro === 'activos') {
    query = query.neq('estado_entrega', 'Entregado');
  }

  const { data: paquetes, error } = await query;
  if (error) {
    throw new Error(`Error al consultar paquetes de la base de datos: ${error.message}`);
  }

  if (!paquetes || paquetes.length === 0) {
    throw new Error(
      filtro === 'activos'
        ? 'No hay paquetes activos en almacén para cruzar.'
        : 'No hay paquetes registrados en el sistema para cruzar.'
    );
  }

  // Encabezados con estilos en negrita
  const headerRow = [
    { value: 'N°', fontWeight: 'bold' as const, align: 'center' as const },
    { value: 'WR', fontWeight: 'bold' as const },
    { value: 'Tracking', fontWeight: 'bold' as const },
    { value: 'Cliente', fontWeight: 'bold' as const },
    { value: 'Tipo Paquete', fontWeight: 'bold' as const },
    { value: 'Peso (Kg)', fontWeight: 'bold' as const, align: 'right' as const },
    { value: 'Estado AMEX', fontWeight: 'bold' as const },
    { value: 'Estado Entrega', fontWeight: 'bold' as const },
    { value: 'Posición WMS', fontWeight: 'bold' as const },
    { value: 'Almacén Actual', fontWeight: 'bold' as const },
    { value: 'Usuario que Ingresó (Email)', fontWeight: 'bold' as const },
    { value: 'Descripción del Paquete', fontWeight: 'bold' as const },
    { value: 'Fecha de Registro', fontWeight: 'bold' as const }
  ];

  const wrs: string[] = [];

  const dataRows = paquetes.map((p, idx) => {
    const wr = String(p.numero_recibo_bodega || '').trim().toUpperCase();
    wrs.push(wr);

    const pesoVal = p.peso_kg !== null && p.peso_kg !== undefined && Number(p.peso_kg) > 0
      ? Number(Number(p.peso_kg).toFixed(2))
      : null;

    const posicionWms = p.posicion_estante ||
      (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC-P1');

    const almacen = p.ubicacion_actual === 'Entregado'
      ? 'Entregado'
      : 'Almacén Central Lince';

    const fechaStr = p.creado_en
      ? new Date(p.creado_en).toLocaleString('es-PE', { timeZone: 'America/Lima' })
      : '';

    return [
      { type: Number, value: idx + 1 },
      { type: String, value: wr },
      { type: String, value: String(p.tracking_usa || '') },
      { type: String, value: String(p.nombre_consignatario || '') },
      { type: String, value: String(p.tipo_empaque || 'CAJA') },
      pesoVal !== null
        ? { type: Number, value: pesoVal }
        : { type: String, value: '' },
      { type: String, value: String(p.estado_amex || 'recibido').toUpperCase() },
      { type: String, value: mapEstadoLabel(p.estado_entrega) },
      { type: String, value: posicionWms },
      { type: String, value: almacen },
      { type: String, value: String(p.usuario_email || '') },
      { type: String, value: String(p.descripcion || 'Mercadería ingresada por Escáner') },
      { type: String, value: fechaStr }
    ];
  });

  const fileInstance = await writeXlsxFile([headerRow, ...dataRows]);
  const buffer = await fileInstance.toBuffer();

  return {
    buffer,
    count: paquetes.length,
    filtroEstado: filtro,
    wrs
  };
}
