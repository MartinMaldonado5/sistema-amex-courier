import { supabase } from '@/lib/supabase/client';
import {
  HojaCotejo,
  ItemCotejo,
  TipoProcesoCotejo,
  TipoEstadoItemCotejo
} from '@/types';

export const sheetsService = {
  async fetchHojas(): Promise<HojaCotejo[]> {
    const { data, error } = await supabase
      .from('hojas_cotejo')
      .select('*')
      .order('actualizado_en', { ascending: false });

    if (error) {
      console.error('Error fetching hojas_cotejo:', error);
      throw error;
    }

    if (!data) return [];

    return data.map(h => ({
      id: h.id,
      titulo: h.titulo,
      descripcion: h.descripcion || '',
      tipoProceso: (h.tipo_proceso as TipoProcesoCotejo) || 'RECEPCION_LINCE',
      estado: h.estado || 'ACTIVA',
      sedeId: h.sede_id,
      creadoPor: h.creado_por || 'AMEX',
      creadoEn: h.creado_en,
      actualizadoEn: h.actualizado_en
    }));
  },

  async fetchItems(hojaId: string): Promise<ItemCotejo[]> {
    if (!hojaId) return [];

    const { data, error } = await supabase
      .from('hojas_cotejo_items')
      .select('*')
      .eq('hoja_id', hojaId)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }

    if (!data) return [];

    return data.map(i => ({
      id: i.id,
      hojaId: i.hoja_id,
      codigoWr: i.codigo_wr,
      trackingUsa: i.tracking_usa,
      casillero: i.casillero,
      consignatario: i.consignatario,
      pesoKg: Number(i.peso_kg || 0),
      posicionEstante: i.posicion_estante,
      notas: i.notas,
      estado: (i.estado as TipoEstadoItemCotejo) || 'PENDIENTE',
      escaneadoEn: i.escaneado_en,
      escaneadoPor: i.escaneado_por,
      vecesEscaneado: i.veces_escaneado || 0,
      orden: i.orden,
      creadoEn: i.creado_en,
      actualizadoEn: i.actualizado_en
    }));
  },

  async updateSheetTitle(hojaId: string, titulo: string): Promise<void> {
    const { error } = await supabase
      .from('hojas_cotejo')
      .update({ titulo: titulo.trim() })
      .eq('id', hojaId);
    if (error) throw error;
  },

  async createSheet(
    titulo: string,
    descripcion: string = 'Cotejo y pistoleo en tiempo real de bultos recibidos',
    tipoProceso: TipoProcesoCotejo = 'RECEPCION_LINCE',
    creadoPor: string = 'AMEX'
  ): Promise<HojaCotejo | null> {
    const { data, error } = await supabase
      .from('hojas_cotejo')
      .insert({
        titulo: titulo || 'AMEX WR',
        descripcion,
        tipo_proceso: tipoProceso,
        creado_por: creadoPor
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion || '',
      tipoProceso: (data.tipo_proceso as TipoProcesoCotejo) || 'RECEPCION_LINCE',
      estado: data.estado || 'ACTIVA',
      sedeId: data.sede_id,
      creadoPor: data.creado_por || 'AMEX',
      creadoEn: data.creado_en,
      actualizadoEn: data.actualizado_en
    };
  },

  async deleteSheet(hojaId: string): Promise<void> {
    await supabase.from('hojas_cotejo_items').delete().eq('hoja_id', hojaId);
    const { error } = await supabase.from('hojas_cotejo').delete().eq('id', hojaId);
    if (error) throw error;
  },

  async duplicateSheet(hojaId: string, operatorName: string, originalSheet: HojaCotejo): Promise<HojaCotejo | null> {
    const newSheet = await this.createSheet(
      `${originalSheet.titulo} (Copia)`,
      originalSheet.descripcion,
      originalSheet.tipoProceso,
      operatorName
    );

    if (!newSheet) return null;

    const { data: originalItems } = await supabase
      .from('hojas_cotejo_items')
      .select('*')
      .eq('hoja_id', hojaId);

    if (originalItems && originalItems.length > 0) {
      const cloned = originalItems.map(it => ({
        hoja_id: newSheet.id,
        codigo_wr: it.codigo_wr,
        casillero: it.casillero,
        consignatario: it.consignatario,
        tracking_usa: it.tracking_usa,
        peso_kg: it.peso_kg,
        posicion_estante: it.posicion_estante,
        notas: it.notas,
        estado: it.estado,
        escaneado_en: it.escaneado_en,
        escaneado_por: it.escaneado_por,
        veces_escaneado: it.veces_escaneado,
        orden: it.orden
      }));
      await supabase.from('hojas_cotejo_items').insert(cloned);
    }

    return newSheet;
  },

  async insertItems(rows: any[]): Promise<any[]> {
    const { data, error } = await supabase.from('hojas_cotejo_items').insert(rows).select();
    if (error) throw error;
    return data || [];
  },

  async updateItem(itemId: string, patch: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('hojas_cotejo_items')
      .update(patch)
      .eq('id', itemId);
    if (error) throw error;
  },

  async resetScans(hojaId: string): Promise<void> {
    const { error } = await supabase
      .from('hojas_cotejo_items')
      .update({
        estado: 'PENDIENTE',
        tracking_usa: null,
        notas: null,
        escaneado_en: null,
        escaneado_por: null,
        veces_escaneado: 0,
        actualizado_en: new Date().toISOString()
      })
      .eq('hoja_id', hojaId);
    if (error) throw error;
  },

  async clearScanAtRow(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('hojas_cotejo_items')
      .update({
        tracking_usa: null,
        notas: null,
        estado: 'PENDIENTE',
        escaneado_en: null,
        escaneado_por: null,
        veces_escaneado: 0,
        actualizado_en: new Date().toISOString()
      })
      .eq('id', itemId);
    if (error) throw error;
  },

  async syncScannedToMainPackages(scannedItems: ItemCotejo[]): Promise<number> {
    let updatedCount = 0;
    for (const item of scannedItems) {
      const { error } = await supabase
        .from('paquetes')
        .update({
          ubicacion_actual: 'AmexLince',
          estado_entrega: 'EnAlmacen',
          posicion_estante: item.posicionEstante || 'REC'
        })
        .eq('numero_recibo_bodega', item.codigoWr);

      if (!error) updatedCount++;
    }
    return updatedCount;
  }
};
