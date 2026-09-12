import { supabase } from '@/lib/supabase/client';
import { exportPickingOrderToExcel } from '@/lib/excelExport';
import { OrdenPicking, ItemPicking, TipoEstadoPicking, Paquete } from '../types';

export const PickingService = {
  /**
   * Carga todas las órdenes de picking e items desde Supabase
   */
  async fetchPickingData(): Promise<{
    ordenes: OrdenPicking[];
    itemsMap: Record<string, ItemPicking[]>;
  }> {
    const { data: ordData, error: ordError } = await supabase
      .from('ordenes_picking')
      .select('*')
      .order('creado_en', { ascending: false });

    if (ordError) {
      console.warn('Error fetching ordenes_picking:', ordError);
      return { ordenes: [], itemsMap: {} };
    }

    const mappedOrders: OrdenPicking[] = (ordData || []).map((o) => ({
      id: o.id,
      codigoOrden: o.codigo_orden,
      transportistaAgencia: o.transportista_agencia,
      destinoCiudad: o.destino_ciudad || 'LIMA / PROVINCIAS',
      estado: o.estado as TipoEstadoPicking,
      operadorAsignado: o.operador_asignado || 'Operador AMEX',
      totalPaquetes: o.total_paquetes || 0,
      recolectadosPaquetes: o.recolectados_paquetes || 0,
      notas: o.notas || '',
      creadoPor: o.creado_por || 'Administración',
      creadoEn: o.creado_en,
      completadoEn: o.completado_en
    }));

    const { data: itData, error: itError } = await supabase
      .from('items_picking')
      .select('*')
      .order('ubicacion_anaquel', { ascending: true });

    if (itError) {
      console.warn('Error fetching items_picking:', itError);
      return { ordenes: mappedOrders, itemsMap: {} };
    }

    const map: Record<string, ItemPicking[]> = {};
    (itData || []).forEach((item) => {
      const ordId = item.orden_picking_id;
      if (!map[ordId]) map[ordId] = [];
      map[ordId].push({
        id: item.id,
        ordenPickingId: item.orden_picking_id,
        paqueteId: item.paquete_id,
        codigoReciboBodega: item.codigo_recibo_bodega,
        trackingUsa: item.tracking_usa,
        consignatario: item.consignatario,
        dniConsignatario: item.dni_consignatario,
        telefonoConsignatario: item.telefono_consignatario,
        ciudadDestino: item.ciudad_destino,
        direccionDestino: item.direccion_destino,
        ubicacionAnaquel: item.ubicacion_anaquel || 'A1-P1',
        estadoItem: item.estado_item as 'PENDIENTE' | 'RECOLECTADO',
        recolectadoEn: item.recolectado_en,
        recolectadoPor: item.recolectado_por,
        pesoKg: Number(item.peso_kg || 1.0),
        creadoEn: item.creado_en
      });
    });

    return { ordenes: mappedOrders, itemsMap: map };
  },

  /**
   * Crea una nueva orden de picking e inserta sus items
   */
  async createPickingOrder(params: {
    codigoOrden: string;
    agencia: string;
    destino: string;
    operador: string;
    notas: string;
    items: Array<{
      codigo_recibo_bodega: string;
      tracking_usa: string;
      consignatario: string;
      dni_consignatario: string;
      telefono_consignatario: string;
      ciudad_destino: string;
      direccion_destino: string;
      ubicacion_anaquel: string;
      paquete_id: string | null;
      peso_kg: number;
    }>;
  }): Promise<string> {
    const { data: orderData, error: orderError } = await supabase
      .from('ordenes_picking')
      .insert({
        codigo_orden: params.codigoOrden,
        transportista_agencia: params.agencia,
        destino_ciudad: params.destino,
        estado: 'PENDIENTE',
        operador_asignado: params.operador,
        total_paquetes: params.items.length,
        recolectados_paquetes: 0,
        notas: params.notas,
        creado_por: 'Administración AMEX'
      })
      .select()
      .single();

    if (orderError || !orderData) {
      throw new Error(orderError?.message || 'Error creando orden');
    }

    const formattedItems = params.items.map((it) => ({
      ...it,
      orden_picking_id: orderData.id,
      estado_item: 'PENDIENTE'
    }));

    const { error: itemsError } = await supabase.from('items_picking').insert(formattedItems);
    if (itemsError) {
      throw new Error(itemsError.message || 'Error insertando items de picking');
    }

    return orderData.id;
  },

  /**
   * Actualiza el estado de un item individual recolectado
   */
  async toggleItemCollected(
    itemId: string,
    nextState: 'PENDIENTE' | 'RECOLECTADO'
  ): Promise<void> {
    const isCollected = nextState === 'RECOLECTADO';
    const { error } = await supabase
      .from('items_picking')
      .update({
        estado_item: nextState,
        recolectado_en: isCollected ? new Date().toISOString() : null,
        recolectado_por: isCollected ? 'Operador Logístico AMEX' : null
      })
      .eq('id', itemId);

    if (error) throw error;
  },

  /**
   * Actualiza los conteos y estado de la orden de picking
   */
  async updateOrderProgress(
    orderId: string,
    recolectadosCount: number,
    totalCount: number
  ): Promise<TipoEstadoPicking> {
    const newOrderState: TipoEstadoPicking =
      recolectadosCount === totalCount && totalCount > 0
        ? 'COMPLETADO'
        : recolectadosCount > 0
        ? 'EN_PROCESO'
        : 'PENDIENTE';

    const { error } = await supabase
      .from('ordenes_picking')
      .update({
        recolectados_paquetes: recolectadosCount,
        estado: newOrderState,
        completado_en: recolectadosCount === totalCount ? new Date().toISOString() : null
      })
      .eq('id', orderId);

    if (error) throw error;
    return newOrderState;
  },

  /**
   * Actualiza la información de cabecera y lista de items de una orden editada
   */
  async saveEditedOrder(params: {
    orderId: string;
    agencia: string;
    destino: string;
    operador: string;
    notas: string;
    totalPaquetes: number;
    recolectadosCount: number;
    nextState: TipoEstadoPicking;
    newItemsToInsert: Record<string, unknown>[];
    removedItemIds: string[];
  }): Promise<void> {
    if (params.newItemsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('items_picking').insert(params.newItemsToInsert);
      if (insertError) throw insertError;
    }

    if (params.removedItemIds.length > 0) {
      const { error: delError } = await supabase.from('items_picking').delete().in('id', params.removedItemIds);
      if (delError) throw delError;
    }

    const { error: ordError } = await supabase
      .from('ordenes_picking')
      .update({
        transportista_agencia: params.agencia,
        destino_ciudad: params.destino,
        operador_asignado: params.operador,
        notas: params.notas,
        total_paquetes: params.totalPaquetes,
        recolectados_paquetes: params.recolectadosCount,
        estado: params.nextState
      })
      .eq('id', params.orderId);

    if (ordError) throw ordError;
  },

  /**
   * Despacha la orden completa hacia la agencia, actualiza los paquetes en inventario, trazabilidad y kardex
   */
  async dispatchOrder(
    order: OrdenPicking,
    items: ItemPicking[],
    allPackages: Paquete[],
    onUpdatePackage?: (pkg: Paquete) => void
  ): Promise<void> {
    await supabase
      .from('ordenes_picking')
      .update({
        estado: 'DESPACHADO',
        completado_en: new Date().toISOString()
      })
      .eq('id', order.id);

    for (const item of items) {
      if (item.paqueteId) {
        await supabase
          .from('paquetes')
          .update({
            estado_entrega: 'Entregado',
            ubicacion_actual: 'Entregado'
          })
          .eq('id', item.paqueteId);

        if (onUpdatePackage) {
          const match = allPackages.find((p) => p.id === item.paqueteId);
          if (match) {
            onUpdatePackage({
              ...match,
              estadoEntrega: 'Entregado',
              ubicacionActual: 'Entregado'
            });
          }
        }

        await supabase.from('historial_trazabilidad').insert({
          paquete_id: item.paqueteId,
          ubicacion: `Despachado a Agencia ${order.transportistaAgencia}`,
          descripcion_evento: `Entregado al transportista ${order.transportistaAgencia} (Orden ${order.codigoOrden})`,
          usuario_operador: 'Operador Logístico AMEX'
        });
      }

      await supabase.from('movimientos_kardex').insert({
        paquete_id: item.paqueteId,
        codigo_paquete: item.codigoReciboBodega,
        consignatario: item.consignatario || 'Cliente',
        origen_descripcion: `AmexLince (${item.ubicacionAnaquel})`,
        destino_descripcion: `Agencia ${order.transportistaAgencia} (${item.ciudadDestino || 'Provincia'})`,
        tipo_movimiento: 'DESPACHO_AGENCIA',
        motivo: `Despacho consolidado en Orden ${order.codigoOrden}`,
        usuario_operador: 'Operador Logístico AMEX'
      });
    }
  },

  /**
   * Elimina una orden de picking
   */
  async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase.from('ordenes_picking').delete().eq('id', orderId);
    if (error) throw error;
  },

  /**
   * Exporta la orden de picking a archivo Excel (.xlsx)
   */
  exportToExcel(order: OrdenPicking, items: ItemPicking[]): void {
    exportPickingOrderToExcel(order, items);
  }
};
