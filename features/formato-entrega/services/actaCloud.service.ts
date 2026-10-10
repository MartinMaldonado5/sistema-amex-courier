import { supabase } from '@/lib/supabase/client';
import { ActaEntregaData, ActaHistorialItem } from '../types';

export const ActaCloudService = {
  /**
   * Carga el borrador activo del usuario desde Supabase
   */
  async loadDraftFromCloud(userEmail?: string): Promise<ActaEntregaData | null> {
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from('actas_entrega_borradores')
        .select('form_data')
        .eq('usuario_email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data || !data.form_data) {
        return null;
      }

      return data.form_data as ActaEntregaData;
    } catch (err) {
      console.warn('[ActaCloudService] Error al cargar borrador de la nube:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza el borrador del acta de entrega en la nube
   */
  async saveDraftToCloud(params: {
    formData: ActaEntregaData;
    userEmail: string;
    userId?: string;
  }): Promise<boolean> {
    if (!params.userEmail) return false;
    try {
      const { error } = await supabase.from('actas_entrega_borradores').upsert(
        {
          usuario_id: params.userId || null,
          usuario_email: params.userEmail.toLowerCase().trim(),
          form_data: params.formData,
          actualizado_en: new Date().toISOString()
        },
        { onConflict: 'usuario_email' }
      );

      if (error) {
        console.warn('[ActaCloudService] Error guardando borrador en la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[ActaCloudService] Error en saveDraftToCloud:', err);
      return false;
    }
  },

  /**
   * Limpia el borrador del usuario en la nube al restablecer el formulario
   */
  async clearDraftFromCloud(userEmail?: string): Promise<boolean> {
    if (!userEmail) return false;
    try {
      const { error } = await supabase
        .from('actas_entrega_borradores')
        .delete()
        .eq('usuario_email', userEmail.toLowerCase().trim());

      return !error;
    } catch (err) {
      console.warn('[ActaCloudService] Error en clearDraftFromCloud:', err);
      return false;
    }
  },

  /**
   * Obtiene el historial global de actas emitidas desde la nube
   */
  async fetchHistorialFromCloud(limit: number = 30): Promise<ActaHistorialItem[]> {
    try {
      const { data, error } = await supabase
        .from('actas_entrega_historial')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        fecha: row.fecha || '',
        remitente: 'AMEX COURRIER',
        destinatario: row.destinatario || '',
        paquetes: Array.isArray(row.paquetes) ? row.paquetes : [],
        cargoTexto: row.observaciones || '',
        recibidoPorNombre: row.destinatario || '',
        recibidoPorFecha: row.fecha || '',
        recibidoPorHora: '',
        logoStyle: 'clean',
        creadoEn: row.creado_en,
        operadorNombre: row.operador_nombre,
        operadorEmail: row.operador_email
      }));
    } catch (err) {
      console.warn('[ActaCloudService] Error al obtener historial:', err);
      return [];
    }
  },

  /**
   * Guarda un acta emitida en el historial permanente de Supabase
   */
  async saveActaToCloud(params: {
    data: ActaEntregaData;
    operadorNombre?: string;
    operadorEmail?: string;
    operadorId?: string;
  }): Promise<string | null> {
    try {
      const codigoActa = `ACT-${Date.now().toString().slice(-6)}`;
      const { data, error } = await supabase
        .from('actas_entrega_historial')
        .insert({
          codigo_acta: codigoActa,
          destinatario: params.data.destinatario || 'CLIENTE AMEX',
          paquetes: params.data.paquetes || [],
          fecha: params.data.fecha || new Date().toLocaleDateString(),
          observaciones: params.data.cargoTexto || null,
          operador_nombre: params.operadorNombre || 'Operador Logístico',
          operador_email: params.operadorEmail || null,
          operador_id: params.operadorId || null
        })
        .select('id')
        .single();

      if (error) {
        console.warn('[ActaCloudService] Error registrando acta en historial:', error.message);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.warn('[ActaCloudService] Error en saveActaToCloud:', err);
      return null;
    }
  },

  /**
   * Elimina un acta del historial permanente
   */
  async deleteActaFromCloud(actaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('actas_entrega_historial')
        .delete()
        .eq('id', actaId);

      return !error;
    } catch (err) {
      console.warn('[ActaCloudService] Error al eliminar acta:', err);
      return false;
    }
  }
};
