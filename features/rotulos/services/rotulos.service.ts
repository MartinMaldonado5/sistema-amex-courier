import { RotuloSlotData, generateRotulosA4Pdf } from '@/lib/rotulos/rotulos-pdf';
import { DEFAULT_SLOTS, DEFAULT_REMITENTE, MAX_SHEETS, generarTextoBulto, type RotuloHistorialItem } from '../types';
import { compressImageForAi } from '@/lib/utils/imageCompressor';
import { supabase } from '@/lib/supabase/client';

const STORAGE_KEY = 'amex_rotulos_a4_slots_v2';
const LEGACY_STORAGE_KEY = 'amex_rotulos_a4_slots';

export const RotulosService = {
  /**
   * Carga los slots guardados en localStorage con validación y sanitización
   */
  loadSlotsFromStorage(): RotuloSlotData[] | null {
    if (typeof window === 'undefined') return null;
    try {
      // Migración de clave legacy si existe
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        if (legacyData && !legacyData.includes('KENNETH MALDONADO')) {
          localStorage.setItem(STORAGE_KEY, legacyData);
          saved = legacyData;
        }
      }

      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 5 && parsed.length % 5 === 0) {
        // Limitar estrictamente al máximo de MAX_SHEETS (5 hojas = 25 rótulos)
        return parsed.slice(0, MAX_SHEETS * 5).map((s: RotuloSlotData) => {
          const isSlotEmpty = !s.nombre?.trim() && !s.dni?.trim() && !s.celular?.trim() && !s.destino?.trim();
          const cleanAgencia = isSlotEmpty && s.agencia === 'SHALOM' ? '' : s.agencia;
          const isIndep = (!s.totalRotulos || s.totalRotulos <= 1) && !s.groupId;
          if (isIndep) {
            return {
              ...s,
              agencia: cleanAgencia,
              remitente: DEFAULT_REMITENTE,
              numeroRotulo: 1,
              totalRotulos: 1,
              observacion: s.totalCajas ? generarTextoBulto(1, 1, s.totalCajas) : s.observacion
            };
          }
          return {
            ...s,
            agencia: cleanAgencia,
            remitente: DEFAULT_REMITENTE
          };
        });
      }
    } catch (e) {
      console.warn('Error loading rotulos slots from storage:', e);
    }
    return null;
  },

  /**
   * Guarda los slots en localStorage como respaldo local
   */
  saveSlotsToStorage(slots: RotuloSlotData[]): void {
    if (typeof window === 'undefined') return;
    try {
      const sanitizedSlots = slots.map((s) => ({
        ...s,
        remitente: DEFAULT_REMITENTE
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedSlots));
    } catch (e) {
      console.warn('Error saving rotulos slots to storage:', e);
    }
  },

  /**
   * Borra los slots guardados en localStorage
   */
  clearStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Error clearing rotulos storage:', e);
    }
  },

  /**
   * Carga el borrador del usuario desde Supabase en la nube
   */
  async loadDraftFromCloud(userEmail?: string): Promise<{ slots: RotuloSlotData[]; totalHojas: number } | null> {
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from('rotulos_borradores')
        .select('slots_data, total_hojas')
        .eq('usuario_email', userEmail.toLowerCase().trim())
        .maybeSingle();

      if (error || !data || !Array.isArray(data.slots_data) || data.slots_data.length === 0) {
        return null;
      }

      const slots = data.slots_data.map((s: RotuloSlotData) => ({
        ...s,
        remitente: DEFAULT_REMITENTE
      }));

      return {
        slots,
        totalHojas: data.total_hojas || Math.max(1, Math.ceil(slots.length / 5))
      };
    } catch (err) {
      console.warn('[RotulosService] Error al cargar borrador de la nube:', err);
      return null;
    }
  },

  /**
   * Guarda el borrador del usuario en Supabase (Cloud Sync)
   */
  async saveDraftToCloud(params: {
    slots: RotuloSlotData[];
    totalHojas: number;
    userEmail: string;
    userId?: string;
  }): Promise<boolean> {
    if (!params.userEmail) return false;
    try {
      const sanitizedSlots = params.slots.map((s) => ({
        ...s,
        remitente: DEFAULT_REMITENTE
      }));

      const { error } = await supabase.from('rotulos_borradores').upsert(
        {
          usuario_id: params.userId || null,
          usuario_email: params.userEmail.toLowerCase().trim(),
          slots_data: sanitizedSlots,
          total_hojas: params.totalHojas,
          actualizado_en: new Date().toISOString()
        },
        { onConflict: 'usuario_email' }
      );

      if (error) {
        console.warn('[RotulosService] Error en upsert de borrador en la nube:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[RotulosService] Error guardando borrador en la nube:', err);
      return false;
    }
  },

  /**
   * Registra un evento de impresión o descarga de PDF en el historial permanente
   */
  async recordPrintEvent(params: {
    slots: RotuloSlotData[];
    tipoAccion: 'IMPRESION_DIRECTA' | 'DESCARGA_PDF';
    currentUser?: { id?: string; email?: string; nombre?: string } | null;
  }): Promise<{ success: boolean; loteId: string; count: number }> {
    const validSlots = params.slots.filter(
      (s) => (s.nombre && s.nombre.trim() !== '') || (s.dni && s.dni.trim() !== '') || (s.destino && s.destino.trim() !== '')
    );

    if (validSlots.length === 0) {
      return { success: true, loteId: '', count: 0 };
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const loteId = `ROT-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const rows = validSlots.map((s) => ({
      lote_impresion_id: loteId,
      tipo_accion: params.tipoAccion,
      operador_nombre: params.currentUser?.nombre || 'Operador Logístico AMEX',
      operador_email: params.currentUser?.email || null,
      operador_id: params.currentUser?.id || null,
      agencia: (s.agencia || 'OTRA').toUpperCase().trim(),
      agencia_otra: s.agenciaOtra || null,
      destinatario_nombre: (s.nombre || '').trim().toUpperCase(),
      destinatario_dni: (s.dni || '').trim() || null,
      destinatario_telefono: (s.celular || '').trim() || null,
      destino: (s.destino || '').trim().toUpperCase() || null,
      remitente: s.remitente || DEFAULT_REMITENTE,
      cantidad_rotulos: Math.max(1, Number(s.totalRotulos) || 1),
      total_cajas: String(s.totalCajas || '1'),
      numero_rotulo: Math.max(1, Number(s.numeroRotulo) || 1),
      siglas: (s.siglas || '').trim().toUpperCase() || null,
      observacion: (s.observacion || '').trim() || null,
      hoja_numero: Math.max(1, Math.ceil(s.id / 5)),
      slot_posicion: ((s.id - 1) % 5) + 1,
      slot_snapshot: s,
      creado_en: nowIso
    }));

    try {
      const { error } = await supabase.from('rotulos_historial').insert(rows);
      if (error) {
        console.error('[RotulosService] Error registrando historial de impresión:', error.message);
        return { success: false, loteId, count: 0 };
      }
      return { success: true, loteId, count: rows.length };
    } catch (err) {
      console.error('[RotulosService] Excepción registrando historial:', err);
      return { success: false, loteId, count: 0 };
    }
  },

  /**
   * Consulta el historial de rótulos con filtros y paginación
   */
  async fetchPrintHistory(filters?: {
    search?: string;
    agencia?: string;
    fecha?: 'hoy' | '7dias' | '30dias' | 'todos';
    operadorEmail?: string;
    limit?: number;
  }): Promise<RotuloHistorialItem[]> {
    try {
      let query = supabase
        .from('rotulos_historial')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.operadorEmail) {
        query = query.eq('operador_email', filters.operadorEmail.toLowerCase().trim());
      }

      if (filters?.agencia && filters.agencia !== 'TODAS') {
        query = query.eq('agencia', filters.agencia.toUpperCase().trim());
      }

      if (filters?.fecha && filters.fecha !== 'todos') {
        const now = new Date();
        if (filters.fecha === 'hoy') {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          query = query.gte('creado_en', startOfToday);
        } else if (filters.fecha === '7dias') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('creado_en', sevenDaysAgo);
        } else if (filters.fecha === '30dias') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('creado_en', thirtyDaysAgo);
        }
      }

      if (filters?.search && filters.search.trim() !== '') {
        const term = filters.search.trim().toUpperCase();
        query = query.or(
          `destinatario_nombre.ilike.%${term}%,destinatario_dni.ilike.%${term}%,destinatario_telefono.ilike.%${term}%,destino.ilike.%${term}%,siglas.ilike.%${term}%,lote_impresion_id.ilike.%${term}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error('[RotulosService] Error consultando historial:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((r: any) => ({
        id: r.id,
        loteImpresionId: r.lote_impresion_id,
        tipoAccion: r.tipo_accion,
        operadorNombre: r.operador_nombre,
        operadorEmail: r.operador_email,
        operadorId: r.operador_id,
        agencia: r.agencia,
        agenciaOtra: r.agencia_otra,
        destinatarioNombre: r.destinatario_nombre,
        destinatarioDni: r.destinatario_dni,
        destinatarioTelefono: r.destinatario_telefono,
        destino: r.destino,
        remitente: r.remitente,
        cantidadRotulos: r.cantidad_rotulos,
        totalCajas: r.total_cajas,
        numeroRotulo: r.numero_rotulo,
        siglas: r.siglas,
        observacion: r.observacion,
        hojaNumero: r.hoja_numero,
        slotPosicion: r.slot_posicion,
        slotSnapshot: r.slot_snapshot,
        creadoEn: r.creado_en
      }));
    } catch (err) {
      console.error('[RotulosService] Error en fetchPrintHistory:', err);
      return [];
    }
  },

  /**
   * Consulta al endpoint de AMEXito IA para extraer datos de WhatsApp o imagen
   */
  async parseWithAi(params: { text?: string; imageBase64?: string }): Promise<Partial<RotuloSlotData> & { items?: Array<Partial<RotuloSlotData>> }> {
    let imageBase64 = params.imageBase64 || undefined;
    if (imageBase64) {
      imageBase64 = await compressImageForAi(imageBase64, 1024, 0.82);
    }

    const res = await fetch('/api/ai/parse-rotulo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text?.trim() || undefined,
        imageBase64
      })
    });

    const resData = await res.json();
    if (!res.ok || !resData.success || !resData.data) {
      throw new Error(resData.error || 'AMEXito no pudo interpretar los datos del pedido.');
    }

    return resData.data;
  },

  /**
   * Genera y descarga el archivo PDF físico en formato A4
   */
  async generatePdf(slots: RotuloSlotData[], totalSheets: number, operadorNombre?: string): Promise<void> {
    await generateRotulosA4Pdf(slots, `Rotulos_Agencias_${slots.length}x_${totalSheets}Hojas_A4`, operadorNombre);
  }
};
