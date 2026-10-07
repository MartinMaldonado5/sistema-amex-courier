import { supabase } from '@/lib/supabase/client';
import {
  Paquete,
  TipoUbicacion,
  TipoEstadoEntrega,
  TipoEstadoAmex,
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
    const isLevelLess =
      transferData.targetAnaquel === 'OFI' ||
      transferData.targetAnaquel === 'DSP-Z1' ||
      transferData.targetAnaquel === 'DSP-Z2' ||
      transferData.targetAnaquel === 'REC' ||
      transferData.targetAnaquel === 'DSP' ||
      transferData.targetAnaquel?.startsWith('DSP') ||
      transferData.targetAnaquel?.includes('DESPACHO');

    const targetPos = isLevelLess
      ? transferData.targetAnaquel
      : `${transferData.targetAnaquel}-${transferData.targetPiso || 'P1'}`;

    await supabase
      .from('paquetes')
      .update({
        ubicacion_actual: transferData.targetUbicacion,
        anaquel: transferData.targetAnaquel,
        piso: isLevelLess ? null : (transferData.targetPiso || 'P1'),
        posicion_estante: targetPos
      })
      .in('id', idsToMove);

    const kardexInserts = [];
    const updatedPackages: Paquete[] = [];

    for (const id of idsToMove) {
      const pkg = paquetesList.find(p => p.id === id);
      if (pkg) {
        const origenStr = `${pkg.ubicacionActual} (${pkg.posicionEstante || 'OFI'})`;
        const destinoStr = `${transferData.targetUbicacion} (${targetPos})`;

        kardexInserts.push({
          paquete_id: pkg.id,
          codigo_paquete: pkg.numeroReciboBodega,
          consignatario: pkg.nombreConsignatario || 'Cliente AMEX',
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
          piso: isLevelLess ? undefined : transferData.targetPiso,
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
        numero_recibo_bodega: updated.numeroReciboBodega,
        tracking: updated.tracking || updated.trackingUsa || '',
        tipo_empaque: updated.tipoEmpaque,
        dni_consignatario: updated.dniConsignatario,
        nombre_consignatario: updated.nombreConsignatario,
        descripcion: updated.descripcion,
        peso_kg: updated.pesoKg,
        ubicacion_actual: updated.ubicacionActual,
        anaquel: updated.anaquel,
        piso: updated.piso,
        posicion_estante: updated.posicionEstante,
        estado_tib: updated.estadoTib || updated.estadoEntrega || 'EnAlmacen',
        estado_amex: updated.estadoAmex || 'recibido'
      })
      .eq('id', updated.id);
  },

  // Eliminar paquete individual con Soft Delete y Auditoría
  async deletePackage(id: string, motivo: string = 'Eliminación manual desde Almacén Lince'): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    const now = new Date().toISOString();

    await supabase
      .from('paquetes')
      .update({
        eliminado_en: now,
        eliminado_por: userId,
        motivo_eliminacion: motivo
      })
      .eq('id', id);

    await supabase.from('auditoria_sistema').insert({
      usuario_id: userId,
      usuario_nombre: authData?.user?.user_metadata?.nombre_completo || 'Operador Logístico AMEX',
      usuario_email: authData?.user?.email || 'sistemaamexcourier@gmail.com',
      modulo: 'INVENTARIO',
      accion: 'ELIMINAR_SOFT',
      registro_id: id,
      detalles: `Eliminación lógica de paquete individual. Motivo: ${motivo}`,
      valores_anteriores: { id, eliminado: false },
      valores_nuevos: { id, eliminado_en: now, motivo_eliminacion: motivo }
    });
  },

  // Cambio rápido de estado individual TIB
  async quickStatusChange(pkg: Paquete, newStatus: TipoEstadoEntrega): Promise<void> {
    await supabase.from('paquetes').update({ estado_tib: newStatus }).eq('id', pkg.id);

    await supabase.from('movimientos_kardex').insert({
      paquete_id: pkg.id,
      codigo_paquete: pkg.numeroReciboBodega,
      consignatario: pkg.nombreConsignatario || 'Cliente AMEX',
      origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
      destino_descripcion: `Estado TIB actualizado a: ${newStatus}`,
      tipo_movimiento: newStatus === 'Entregado' ? 'ENTREGA' : 'ESTADO_CAMBIO',
      motivo: 'Ajuste operativo desde Almacén Central Lince',
      usuario_operador: 'Operador Logístico AMEX'
    });
  },

  // Cambio rápido de estado operativo individual AMEX
  async quickStatusAmexChange(pkg: Paquete, newStatusAmex: TipoEstadoAmex): Promise<void> {
    await supabase.from('paquetes').update({ estado_amex: newStatusAmex }).eq('id', pkg.id);

    await supabase.from('movimientos_kardex').insert({
      paquete_id: pkg.id,
      codigo_paquete: pkg.numeroReciboBodega,
      consignatario: pkg.nombreConsignatario || 'Cliente AMEX',
      origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
      destino_descripcion: `Estado AMEX actualizado a: ${newStatusAmex}`,
      tipo_movimiento: newStatusAmex === 'entregado' ? 'ENTREGA' : 'ESTADO_CAMBIO',
      motivo: 'Ajuste de ciclo interno AMEX desde Almacén Central Lince',
      usuario_operador: 'Operador Logístico AMEX'
    });
  },

  // Entrega rápida en 1 clic desde el mostrador/almacén
  async quickDeliver(pkg: Paquete): Promise<Paquete> {
    await supabase
      .from('paquetes')
      .update({
        estado_amex: 'entregado',
        estado_tib: 'Entregado',
        ubicacion_actual: 'Entregado'
      })
      .eq('id', pkg.id);

    await supabase.from('movimientos_kardex').insert({
      paquete_id: pkg.id,
      codigo_paquete: pkg.numeroReciboBodega,
      consignatario: pkg.nombreConsignatario || 'Cliente AMEX',
      origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
      destino_descripcion: 'Entregado al Cliente Final en Mostrador Lince',
      tipo_movimiento: 'ENTREGA',
      motivo: 'Entrega directa rápida desde Módulo de Inventario',
      usuario_operador: 'Operador Logístico AMEX'
    });

    return {
      ...pkg,
      estadoAmex: 'entregado',
      estadoTib: 'Entregado',
      estadoEntrega: 'Entregado',
      ubicacionActual: 'Entregado'
    };
  },

  // Cambio de estado masivo en lote (solo afecta a la columna de Estado AMEX)
  async batchStatusChange(
    selectedIds: string[],
    arg2: Paquete[] | TipoEstadoEntrega,
    arg3: TipoEstadoAmex | Paquete[],
    arg4?: TipoEstadoAmex | TipoEstadoEntrega
  ): Promise<Paquete[]> {
    let paquetesList: Paquete[] = [];
    let targetStatusAmex: TipoEstadoAmex = 'recibido';
    let targetStatusTib: TipoEstadoEntrega | undefined = undefined;

    if (Array.isArray(arg2)) {
      // Firma: batchStatusChange(selectedIds, paquetesList, targetStatusAmex, targetStatusTib?)
      paquetesList = arg2;
      targetStatusAmex = (arg3 as TipoEstadoAmex) || 'recibido';
      targetStatusTib = arg4 as TipoEstadoEntrega | undefined;
    } else {
      // Firma previa: batchStatusChange(selectedIds, targetStatusTib, paquetesList, targetStatusAmex?)
      targetStatusTib = arg2 as TipoEstadoEntrega | undefined;
      paquetesList = (arg3 as Paquete[]) || [];
      targetStatusAmex = (arg4 as TipoEstadoAmex) || 'recibido';
    }

    // Por requerimiento: el cambio masivo solo afecta a la columna estado_amex
    const updatePayload: Record<string, any> = {
      estado_amex: targetStatusAmex
    };
    if (targetStatusTib) {
      updatePayload.estado_tib = targetStatusTib;
    }

    await supabase.from('paquetes').update(updatePayload).in('id', selectedIds);

    const updatedList: Paquete[] = [];
    const kardexInserts = [];

    for (const id of selectedIds) {
      const pkg = paquetesList.find(p => p.id === id);
      if (pkg) {
        const updated: Paquete = {
          ...pkg,
          estadoAmex: targetStatusAmex,
          ...(targetStatusTib ? { estadoTib: targetStatusTib, estadoEntrega: targetStatusTib } : {})
        };
        updatedList.push(updated);

        kardexInserts.push({
          paquete_id: pkg.id,
          codigo_paquete: pkg.numeroReciboBodega,
          consignatario: pkg.nombreConsignatario || 'Cliente AMEX',
          origen_descripcion: `AmexLince (${pkg.posicionEstante || 'REC'})`,
          destino_descripcion: `Estado AMEX masivo: ${targetStatusAmex}`,
          tipo_movimiento: targetStatusAmex === 'entregado' ? 'ENTREGA' : 'ESTADO_CAMBIO',
          motivo: 'Cambio masivo de estado AMEX desde Almacén Lince',
          usuario_operador: 'Operador Logístico AMEX'
        });
      }
    }

    if (kardexInserts.length > 0) {
      await supabase.from('movimientos_kardex').insert(kardexInserts);
    }

    return updatedList;
  },

  // Eliminación masiva en lote con Soft Delete y Auditoría
  async batchDelete(selectedIds: string[], motivo: string = 'Eliminado desde vista Inventario'): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    const now = new Date().toISOString();

    await supabase
      .from('paquetes')
      .update({
        eliminado_en: now,
        eliminado_por: userId,
        motivo_eliminacion: motivo
      })
      .in('id', selectedIds);

    // Registro inmutable de auditoría
    for (const id of selectedIds) {
      await supabase.from('auditoria_sistema').insert({
        usuario_id: userId,
        usuario_nombre: authData?.user?.user_metadata?.nombre_completo || 'Operador Logístico AMEX',
      usuario_email: authData?.user?.email || 'sistemaamexcourier@gmail.com',
        modulo: 'INVENTARIO',
        accion: 'ELIMINAR_SOFT',
        registro_id: id,
        detalles: `Eliminación lógica de paquete. Motivo: ${motivo}`,
        valores_anteriores: { id, eliminado: false },
        valores_nuevos: { id, eliminado_en: now, motivo_eliminacion: motivo }
      });
    }
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
