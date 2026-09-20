import { RotuloSlotData, generateRotulosA4Pdf } from '@/lib/rotulos/rotulos-pdf';
import { DEFAULT_SLOTS, MAX_SHEETS, generarTextoBulto } from '../types';

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
              numeroRotulo: 1,
              totalRotulos: 1,
              observacion: s.totalCajas ? generarTextoBulto(1, 1, s.totalCajas) : s.observacion
            };
          }
          return {
            ...s,
            agencia: cleanAgencia
          };
        });
      }
    } catch (e) {
      console.warn('Error loading rotulos slots from storage:', e);
    }
    return null;
  },

  /**
   * Guarda los slots en localStorage
   */
  saveSlotsToStorage(slots: RotuloSlotData[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch (e) {
      console.warn('Error saving rotulos slots to storage:', e);
    }
  },

  /**
   * Borra los slots guardados
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
   * Consulta al endpoint de AMEXito IA para extraer datos de WhatsApp o imagen
   */
  async parseWithAi(params: { text?: string; imageBase64?: string }): Promise<Partial<RotuloSlotData> & { items?: Array<Partial<RotuloSlotData>> }> {
    const res = await fetch('/api/ai/parse-rotulo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text?.trim() || undefined,
        imageBase64: params.imageBase64 || undefined
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
  async generatePdf(slots: RotuloSlotData[], totalSheets: number): Promise<void> {
    await generateRotulosA4Pdf(slots, `Rotulos_Agencias_${slots.length}x_${totalSheets}Hojas_A4`);
  }
};
