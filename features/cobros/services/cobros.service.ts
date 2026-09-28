import { supabase } from '@/lib/supabase/client';
import { exportCobrosToExcel } from '@/lib/excelExport';
import { CobroVoucher } from '../types';

export const CobrosService = {
  /**
   * Carga todos los comprobantes de cobro desde Supabase
   */
  async fetchCobros(): Promise<CobroVoucher[]> {
    const { data, error } = await supabase
      .from('cobros_vouchers')
      .select('*')
      .is('eliminado_en', null)
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error fetching cobros_vouchers:', error);
      throw error;
    }
    return (data as CobroVoucher[]) || [];
  },

  /**
   * Eliminación lógica (Soft Delete) de un comprobante de cobro con registro de auditoría
   */
  async softDeleteVoucher(id: string, motivo: string = 'Eliminación manual desde Módulo Cobros'): Promise<void> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('cobros_vouchers')
      .update({
        eliminado_en: now,
        eliminado_por: userId,
        motivo_eliminacion: motivo
      })
      .eq('id', id);

    if (error) throw error;

    await supabase.from('auditoria_sistema').insert({
      usuario_id: userId,
      usuario_nombre: authData?.user?.user_metadata?.nombre_completo || 'Operador Logístico AMEX',
      usuario_email: authData?.user?.email || 'sistemaamexcourier@gmail.com',
      modulo: 'COBROS',
      accion: 'ELIMINAR_SOFT',
      registro_id: id,
      detalles: `Eliminación lógica de comprobante. Motivo: ${motivo}`,
      valores_anteriores: { id, eliminado: false },
      valores_nuevos: { id, eliminado_en: now, motivo_eliminacion: motivo }
    });
  },

  /**
   * Sube la imagen del comprobante a Cloudflare R2 vía /api/storage/upload
   */
  async uploadVoucherImage(params: {
    file: File;
    codigoCobro: string;
    clienteNombre: string;
    metodoPago: string;
  }): Promise<{ url: string; key: string }> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('folder', 'vouchers');
    formData.append('codigoCobro', params.codigoCobro);
    formData.append('clienteNombre', params.clienteNombre);
    formData.append('metodoPago', params.metodoPago);

    const uploadRes = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al subir el voucher a Cloudflare R2');
    }

    const uploadData = await uploadRes.json();
    return { url: uploadData.url, key: uploadData.key };
  },

  /**
   * Registra el voucher en la base de datos Supabase
   */
  async saveVoucher(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('cobros_vouchers').insert([payload]);
    if (error) throw error;
  },

  /**
   * Actualiza el estado de un comprobante (VALIDADO o RECHAZADO)
   */
  async updateStatus(id: string, newStatus: 'VALIDADO' | 'RECHAZADO'): Promise<void> {
    const { error } = await supabase
      .from('cobros_vouchers')
      .update({
        estado: newStatus,
        validado_por: 'Administración AMEX',
        validado_en: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Exporta la lista de comprobantes a archivo Excel (.xlsx)
   */
  exportToExcel(cobros: CobroVoucher[]): void {
    exportCobrosToExcel(cobros);
  }
};
