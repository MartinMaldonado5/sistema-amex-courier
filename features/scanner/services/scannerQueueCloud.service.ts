import { supabase } from '@/lib/supabase/client';
import { ScannedLog } from '@/types';

export const ScannerQueueCloudService = {
  /**
   * Carga la cola de lecturas pendientes del escáner desde Supabase en la nube
   */
  async loadStagingQueueFromCloud(userEmail?: string): Promise<ScannedLog[] | null> {
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from('scanner_staging_queue')
        .select('queue_items, total_items')
        .eq('usuario_email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data || !Array.isArray(data.queue_items)) {
        return null;
      }

      return data.queue_items as ScannedLog[];
    } catch (err) {
      console.warn('[ScannerQueueCloudService] Error al cargar cola de la nube:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza la cola de lecturas del escáner en Supabase
   */
  async saveStagingQueueToCloud(params: {
    queue: ScannedLog[];
    userEmail: string;
    userId?: string;
  }): Promise<boolean> {
    if (!params.userEmail) return false;
    try {
      const { error } = await supabase.from('scanner_staging_queue').upsert(
        {
          usuario_id: params.userId || null,
          usuario_email: params.userEmail.toLowerCase().trim(),
          queue_items: params.queue,
          total_items: params.queue.length,
          actualizado_en: new Date().toISOString()
        },
        { onConflict: 'usuario_email' }
      );

      if (error) {
        console.warn('[ScannerQueueCloudService] Error guardando cola en la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[ScannerQueueCloudService] Error en saveStagingQueueToCloud:', err);
      return false;
    }
  },

  /**
   * Limpia la cola del escáner en la nube cuando se vacía o se sincroniza al 100%
   */
  async clearStagingQueueFromCloud(userEmail?: string): Promise<boolean> {
    if (!userEmail) return false;
    try {
      const { error } = await supabase
        .from('scanner_staging_queue')
        .delete()
        .eq('usuario_email', userEmail.toLowerCase().trim());

      return !error;
    } catch (err) {
      console.warn('[ScannerQueueCloudService] Error en clearStagingQueueFromCloud:', err);
      return false;
    }
  }
};
