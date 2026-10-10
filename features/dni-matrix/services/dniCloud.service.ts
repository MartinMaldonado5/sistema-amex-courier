import { supabase } from '@/lib/supabase/client';
import { DniSlotData } from '@/lib/dni-matrix/db';
import { DniPrintSize } from '@/lib/dni-matrix/docx-exporter';

export interface DniCloudSettings {
  printSize?: DniPrintSize;
  soundEnabled?: boolean;
  activeSlotId?: number;
}

export interface DniCloudDraft {
  slots: DniSlotData[];
  settings: DniCloudSettings;
  totalSlots: number;
}

export const DniCloudService = {
  /**
   * Carga el borrador de la matriz DNI desde Supabase en la nube
   */
  async loadDraftFromCloud(userEmail?: string): Promise<DniCloudDraft | null> {
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from('dni_matrix_borradores')
        .select('slots_data, settings, total_slots')
        .eq('usuario_email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const slots = Array.isArray(data.slots_data) ? (data.slots_data as DniSlotData[]) : [];
      return {
        slots,
        settings: (data.settings as DniCloudSettings) || {},
        totalSlots: data.total_slots || 100
      };
    } catch (err) {
      console.warn('[DniCloudService] Error al cargar borrador de la nube:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza el borrador de la matriz DNI en Supabase
   */
  async saveDraftToCloud(params: {
    slots: DniSlotData[];
    settings?: DniCloudSettings;
    totalSlots: number;
    userEmail: string;
    userId?: string;
  }): Promise<boolean> {
    if (!params.userEmail) return false;
    try {
      const { error } = await supabase.from('dni_matrix_borradores').upsert(
        {
          usuario_id: params.userId || null,
          usuario_email: params.userEmail.toLowerCase().trim(),
          slots_data: params.slots,
          settings: params.settings || {},
          total_slots: params.totalSlots,
          actualizado_en: new Date().toISOString()
        },
        { onConflict: 'usuario_email' }
      );

      if (error) {
        console.warn('[DniCloudService] Error en upsert de borrador en la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[DniCloudService] Error guardando borrador en la nube:', err);
      return false;
    }
  },

  /**
   * Elimina el borrador de la nube cuando el usuario reinicia o borra el lote
   */
  async clearDraftFromCloud(userEmail?: string): Promise<boolean> {
    if (!userEmail) return false;
    try {
      const { error } = await supabase
        .from('dni_matrix_borradores')
        .delete()
        .eq('usuario_email', userEmail.toLowerCase().trim());

      if (error) {
        console.warn('[DniCloudService] Error eliminando borrador de la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[DniCloudService] Error en clearDraftFromCloud:', err);
      return false;
    }
  }
};
