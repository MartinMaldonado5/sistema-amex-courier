import { supabase } from '@/lib/supabase/client';
import { InvoiceData } from '../types';

export const InvoiceCloudService = {
  /**
   * Carga el borrador de la factura activa desde Supabase en la nube
   */
  async loadDraftFromCloud(userEmail?: string): Promise<InvoiceData | null> {
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from('invoices_borradores')
        .select('invoice_data')
        .eq('usuario_email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data || !data.invoice_data) {
        return null;
      }

      return data.invoice_data as InvoiceData;
    } catch (err) {
      console.warn('[InvoiceCloudService] Error al cargar borrador de la nube:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza el borrador de la factura en Supabase
   */
  async saveDraftToCloud(params: {
    invoiceData: InvoiceData;
    userEmail: string;
    userId?: string;
  }): Promise<boolean> {
    if (!params.userEmail) return false;
    try {
      const { error } = await supabase.from('invoices_borradores').upsert(
        {
          usuario_id: params.userId || null,
          usuario_email: params.userEmail.toLowerCase().trim(),
          invoice_data: params.invoiceData,
          actualizado_en: new Date().toISOString()
        },
        { onConflict: 'usuario_email' }
      );

      if (error) {
        console.warn('[InvoiceCloudService] Error guardando borrador en la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[InvoiceCloudService] Error en saveDraftToCloud:', err);
      return false;
    }
  },

  /**
   * Limpia el borrador del usuario en la nube al restablecer
   */
  async clearDraftFromCloud(userEmail?: string): Promise<boolean> {
    if (!userEmail) return false;
    try {
      const { error } = await supabase
        .from('invoices_borradores')
        .delete()
        .eq('usuario_email', userEmail.toLowerCase().trim());

      return !error;
    } catch (err) {
      console.warn('[InvoiceCloudService] Error en clearDraftFromCloud:', err);
      return false;
    }
  },

  /**
   * Obtiene el historial de facturas emitidas desde la nube
   */
  async fetchHistorialFromCloud(limit: number = 30): Promise<InvoiceData[]> {
    try {
      const { data, error } = await supabase
        .from('invoices_historial')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data.map((row: any) => {
        const inv = (row.invoice_data as InvoiceData) || {};
        return {
          ...inv,
          id: row.id,
          invoiceNumber: row.invoice_number || inv.invoiceNumber,
          invoiceDate: row.invoice_date || inv.invoiceDate,
          shipToName: row.consignee_name || inv.shipToName,
          consigneeDni: row.consignee_dni || inv.consigneeDni,
          trackingUsa: row.tracking || inv.trackingUsa,
          savedAt: row.creado_en
        };
      });
    } catch (err) {
      console.warn('[InvoiceCloudService] Error al obtener historial:', err);
      return [];
    }
  },

  /**
   * Guarda una factura emitida en el historial permanente de Supabase
   */
  async saveInvoiceToCloud(params: {
    data: InvoiceData;
    operadorNombre?: string;
    operadorEmail?: string;
    operadorId?: string;
  }): Promise<string | null> {
    try {
      const totalFob = parseFloat(String(params.data.invoiceAmount || '0').replace('$', '').trim()) || 0;
      const { data, error } = await supabase
        .from('invoices_historial')
        .insert({
          invoice_number: params.data.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          invoice_date: params.data.invoiceDate || new Date().toLocaleDateString(),
          consignee_name: params.data.shipToName || params.data.billToName || 'CLIENTE AMEX',
          consignee_dni: params.data.consigneeDni || null,
          tracking: params.data.trackingUsa || null,
          total_value_fob: totalFob,
          items_count: Array.isArray(params.data.items) ? params.data.items.length : 0,
          invoice_data: params.data,
          operador_nombre: params.operadorNombre || 'Operador Logístico',
          operador_email: params.operadorEmail || null,
          operador_id: params.operadorId || null
        })
        .select('id')
        .single();

      if (error) {
        console.warn('[InvoiceCloudService] Error registrando factura en historial:', error.message);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.warn('[InvoiceCloudService] Error en saveInvoiceToCloud:', err);
      return null;
    }
  },

  /**
   * Elimina una factura del historial permanente
   */
  async deleteInvoiceFromCloud(invoiceIdOrNumber: string): Promise<boolean> {
    try {
      // Intenta borrar por id uuid o por invoice_number
      const { error } = await supabase
        .from('invoices_historial')
        .delete()
        .or(`id.eq.${invoiceIdOrNumber},invoice_number.eq.${invoiceIdOrNumber}`);

      return !error;
    } catch (err) {
      console.warn('[InvoiceCloudService] Error al eliminar factura:', err);
      return false;
    }
  }
};
