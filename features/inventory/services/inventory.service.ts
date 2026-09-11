import { supabase } from '@/lib/supabase/client';
import {
  Paquete,
  TipoUbicacion,
  TipoEstadoEntrega,
  EstanteriaPosicion,
  MovimientoKardex,
  AlmacenSede
} from '@/types';
import { BatchShelfData, SinglePositionData, TransferFormData } from '../types';

export const inventoryService = {
  // Sedes
  async getSedes(): Promise<AlmacenSede[]> {
    const { data } = await supabase
      .from('almacenes_sedes')
      .select('*')
      .order('nombre', { ascending: true });

    if (!data) return [];
    return data.map(s => ({
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      tipo: s.tipo || 'ALMACEN',
      direccion: s.direccion || '',
      ciudad: s.ciudad || '',
      pais: s.pais || '',
      esActivo: s.es_activo ?? true,
      creadoEn: s.creado_en || ''
    }));
  },

  // Posiciones de estantería
  async getPosiciones(): Promise<EstanteriaPosicion[]> {
    const { data } = await supabase
      .from('estanterias_posiciones')
      .select('*')
      .order('codigo_posicion', { ascending: true });

    if (!data) return [];
    return data.map(p => ({
      id: p.id,
      almacenId: p.almacen_id || '',
      codigoEstante: p.codigo_estante,
      nivelPiso: p.nivel_piso,
      codigoPosicion: p.codigo_posicion,
      zonaTipo: p.zona_tipo || 'ALMACENAJE',
      capacidadMaxPaquetes: p.capacidad_max_paquetes || 40,
      pesoMaxKg: Number(p.peso_max_kg || 150),
      descripcion: p.descripcion || '',
      creadoEn: p.creado_en || ''
    }));
  },

  // Movimientos Kardex
  async getKardex(limit = 200): Promise<MovimientoKardex[]> {
    const { data } = await supabase
      .from('movimientos_kardex')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(limit);

    if (!data) return [];
    return data.map(k => ({
      id: k.id,
      paqueteId: k.paquete_id || undefined,
      codigoPaquete: k.codigo_paquete,
      consignatario: k.consignatario || '',
      origenDescripcion: k.origen_descripcion,
      destinoDescripcion: k.destino_descripcion,
      tipoMovimiento: k.tipo_movimiento,
      motivo: k.motivo || '',
      usuarioOperador: k.usuario_operador || 'Operador AMEX',
      creadoEn: k.creado_en || new Date().toISOString()
    }));
  },

  // Traslado / Reubicación de paquetes
  async executeTransfer(
    idsToMove: string[],
    transferData: TransferFormData,
    paquetesList: Paquete[]
  ): Promise<{ updatedPackages: Paquete[] }> {
    const targetPos =
      transferData.targetAnaquel === 'REC' || transferData.targetAnaquel === 'DSP'
        ? transferData.targetAnaquel
        : `${transferData.targetAnaquel}-${transferData.targetPiso}`;

    await supabase
      .from('paquetes')
      .update({
        ubicacion_actual: transferData.targetUbicacion,
        anaquel: transferData.targetAnaquel,
        piso: transferData.targetPiso,
        posicion_estante: targetPos
      })
      .in('id', idsToMove);

    const kardexInserts = [];
    const updatedPackages: Paquete[] = [];

    for (const id of idsToMove) {
      const pkg = paquetesList.find(p => p.id === id);
      if (pkg) {
        const origenStr = `${pkg.ubicacionActual} (${pkg.posicionEstante || 'REC'})`;
        const destinoStr = `${transferData.targetUbicacion} (${targetPos})`;

        kardexInserts.push({
          paquete_id: pkg.id,
          codigo_paquete: pkg.numeroReciboBodega,
          consignatario: pkg.nombreConsignatario || pkg.codigoCasillero,
          origen_descripcion: origenStr,
          destino_descripcion: destinoStr,
          tipo_movimiento: 'REUBICACION',
          motivo: transferData.motivo,
          usuario_operador: transferData.operador
        });

        updatedPackages.push({
          ...pkg,
          ubicacionActual: transferData.targetUbicacion,
          anaquel: transferData.targetAnaquel,
          piso: transferData.targetPiso,
          posicionEstante: targetPos
        });
      }
    }

    if (kardexInserts.length > 0) {
      await supabase.from('movimientos_kardex').insert(kardexInserts);
    }

    return { updatedPackages };
  },

  // Guardar edición de paquete
  async updatePackage(updated: Paquete): Promise<void> {
    await supabase
      .from('paquetes')
      .update({
        codigo_casillero: updated.codigoCasillero,
        numero_recibo_bodega: updated.numeroReciboBodega,
        tracking_usa: updated.trackingUsa,
        tipo_empaque: updated.tipoEmpaque,
        numero_factura: updated.numeroFactura,
        dni_consignatario: updated.dniConsignatario,
        nombre_consignatario: updated.nombreConsignatario,
        descripcion: updated.descripcion,
        peso_kg: updated.pesoKg,
        valor_declarado_usd: updated.valorDeclaradoUsd,
        ubicacion_actual: updated.ubicacionActual,
        anaquel: updated.anaquel,
        piso: updated.piso,
        posicion_estante: updated.posicionEstante,
        metodo_entrega: updated.metodoEntrega,
        estado_entrega: updated.estadoEntrega
      })
      .eq('id', updated.id);
  },

  // Eliminar paquete individual
  async deletePackage(id: string): Promise<void> {
    await supabase.from('paquetes').delete().eq('id', id);
  },

  // Cambio rápido de estado individual
  async quickStatusChange(pkg: Paquete, newStatus: TipoEstadoEntrega): Promise<void> {
    await supabase.from('paquetes').update({ estado_entrega: newStatus }).eq('id', pkg.id);

    await supabase.from('movimientos_kardex').insert({
      paquete_id: pkg.id,
      codigo_paquete: pkg.numeroReciboBodega,
      consignatario: pkg.nombreConsignatario || pkg.codigoCasillero,
      origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
      destino_descripcion: `Estado actualizado a: ${newStatus}`,
      tipo_movimiento: newStatus === 'Entregado' ? 'ENTREGA' : 'ESTADO_CAMBIO',
      motivo: 'Ajuste operativo desde Almacén Central Lince',
      usuario_operador: 'Operador Logístico AMEX'
    });
  },

  // Cambio de estado masivo en lote
  async batchStatusChange(
    selectedIds: string[],
    targetStatus: TipoEstadoEntrega,
    paquetesList: Paquete[]
  ): Promise<Paquete[]> {
    await supabase.from('paquetes').update({ estado_entrega: targetStatus }).in('id', selectedIds);

    const updatedList: Paquete[] = [];
    const kardexInserts = [];

    for (const id of selectedIds) {
      const pkg = paquetesList.find(p => p.id === id);
      if (pkg) {
        const updated = { ...pkg, estadoEntrega: targetStatus };
        updatedList.push(updated);

        kardexInserts.push({
          paquete_id: pkg.id,
          codigo_paquete: pkg.numeroReciboBodega,
          consignatario: pkg.nombreConsignatario || pkg.codigoCasillero,
          origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
          destino_descripcion: `Estado en lote: ${targetStatus}`,
          tipo_movimiento: targetStatus === 'Entregado' ? 'ENTREGA' : 'ESTADO_CAMBIO',
          motivo: 'Cambio masivo de estado desde Almacén Lince',
          usuario_operador: 'Operador Logístico AMEX'
        });
      }
    }

    if (kardexInserts.length > 0) {
      await supabase.from('movimientos_kardex').insert(kardexInserts);
    }

    return updatedList;
  },

  // Eliminación masiva en lote
  async batchDelete(selectedIds: string[]): Promise<void> {
    await supabase.from('paquetes').delete().in('id', selectedIds);
  },

  // Crear posición individual
  async createPosition(
    positionData: SinglePositionData,
    sedesList: AlmacenSede[]
  ): Promise<EstanteriaPosicion | null> {
    const sede = sedesList.find(s => s.codigo === positionData.almacenCodigo);
    const almacenId = sede ? sede.id : null;
    const codigoPos = `${positionData.codigoEstante}-${positionData.nivelPiso}`;

    const { data, error } = await supabase
      .from('estanterias_posiciones')
      .insert({
        almacen_id: almacenId,
        codigo_estante: positionData.codigoEstante.toUpperCase(),
        nivel_piso: positionData.nivelPiso.toUpperCase(),
        codigo_posicion: codigoPos.toUpperCase(),
        zona_tipo: positionData.zonaTipo,
        capacidad_max_paquetes: Number(positionData.capacidadMaxPaquetes),
        peso_max_kg: Number(positionData.pesoMaxKg),
        descripcion: positionData.descripcion
      })
      .select()
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      almacenId: data.almacen_id || '',
      codigoEstante: data.codigo_estante,
      nivelPiso: data.nivel_piso,
      codigoPosicion: data.codigo_posicion,
      zonaTipo: data.zona_tipo || 'ALMACENAJE',
      capacidadMaxPaquetes: data.capacidad_max_paquetes || 40,
      pesoMaxKg: Number(data.peso_max_kg || 150),
      descripcion: data.descripcion || '',
      creadoEn: data.creado_en || ''
    };
  },

  // Crear anaquel completo en lote (N pisos)
  async createBatchShelf(
    batchData: BatchShelfData,
    sedesList: AlmacenSede[]
  ): Promise<EstanteriaPosicion[]> {
    const codigoEstanteClean = batchData.codigoEstante.trim().toUpperCase();
    const sede = sedesList.find(s => s.codigo === batchData.almacenCodigo);
    const almacenId = sede ? sede.id : null;

    const newPositionsToInsert = [];
    for (let i = 1; i <= batchData.cantidadPisos; i++) {
      const nivelPiso = `P${i}`;
      const codigoPosicion = `${codigoEstanteClean}-${nivelPiso}`;
      newPositionsToInsert.push({
        almacen_id: almacenId,
        codigo_estante: codigoEstanteClean,
        nivel_piso: nivelPiso,
        codigo_posicion: codigoPosicion,
        zona_tipo: batchData.zonaTipo,
        capacidad_max_paquetes: Number(batchData.capacidadPorPiso),
        peso_max_kg: Number(batchData.pesoPorPiso),
        descripcion: batchData.descripcion || `Anaquel ${codigoEstanteClean} - Piso ${i}`
      });
    }

    const { data, error } = await supabase
      .from('estanterias_posiciones')
      .insert(newPositionsToInsert)
      .select();

    if (error || !data) return [];
    return data.map(p => ({
      id: p.id,
      almacenId: p.almacen_id || '',
      codigoEstante: p.codigo_estante,
      nivelPiso: p.nivel_piso,
      codigoPosicion: p.codigo_posicion,
      zonaTipo: p.zona_tipo || 'ALMACENAJE',
      capacidadMaxPaquetes: p.capacidad_max_paquetes || 40,
      pesoMaxKg: Number(p.peso_max_kg || 150),
      descripcion: p.descripcion || '',
      creadoEn: p.creado_en || ''
    }));
  },

  // Actualizar posición
  async updatePosition(
    id: string,
    updatedData: {
      zonaTipo: string;
      capacidadMaxPaquetes: number;
      pesoMaxKg: number;
      descripcion?: string;
    }
  ): Promise<void> {
    await supabase
      .from('estanterias_posiciones')
      .update({
        zona_tipo: updatedData.zonaTipo,
        capacidad_max_paquetes: updatedData.capacidadMaxPaquetes,
        peso_max_kg: updatedData.pesoMaxKg,
        descripcion: updatedData.descripcion
      })
      .eq('id', id);
  },

  // Eliminar posición
  async deletePosition(id: string): Promise<void> {
    await supabase.from('estanterias_posiciones').delete().eq('id', id);
  }
};
