import { CotizacionKambista } from '../types';

const STORAGE_KEY = 'amex_kambista_tc_config';

const DEFAULT_COTIZACION: CotizacionKambista = {
  compra: 3.740,
  venta: 3.775,
  actualizadoEn: new Date().toISOString(),
  origen: 'DEFAULT'
};

export const KambistaService = {
  /**
   * Obtiene la cotización actual guardada en memoria/localStorage o por defecto
   */
  getCotizacionActual(): CotizacionKambista {
    if (typeof window === 'undefined') return DEFAULT_COTIZACION;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.venta && parsed.compra) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading Kambista TC from localStorage:', e);
    }
    return DEFAULT_COTIZACION;
  },

  /**
   * Guarda una cotización personalizada fijada por el operador para el turno
   */
  setCotizacionManual(compra: number, venta: number): CotizacionKambista {
    const updated: CotizacionKambista = {
      compra: Number(compra) || DEFAULT_COTIZACION.compra,
      venta: Number(venta) || DEFAULT_COTIZACION.venta,
      actualizadoEn: new Date().toISOString(),
      origen: 'MANUAL_OPERADOR'
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving Kambista TC to localStorage:', e);
      }
    }
    return updated;
  },

  /**
   * Intenta consultar en tiempo real el tipo de cambio referencial de Kambista / SBS / Sunat
   */
  async fetchLiveExchangeRate(): Promise<CotizacionKambista> {
    try {
      // Usar servicio público de cotización peruana o proxy seguro
      const res = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.compra && data.venta) {
          const cotizacion: CotizacionKambista = {
            compra: Number(data.compra),
            venta: Number(data.venta),
            actualizadoEn: new Date().toISOString(),
            origen: 'KAMBISTA_LIVE'
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cotizacion));
          }
          return cotizacion;
        }
      }
    } catch (err) {
      console.warn('No se pudo conectar a la API en vivo de TC, usando configuración actual:', err);
    }
    return this.getCotizacionActual();
  },

  /**
   * Convierte un monto en dólares (USD) a soles peruanos (PEN) usando el tipo de cambio venta
   */
  convertUsdToPen(amountUsd: number, tc?: number): number {
    const activeTc = tc || this.getCotizacionActual().venta;
    return Math.round(amountUsd * activeTc * 100) / 100;
  },

  /**
   * Convierte un monto en soles (PEN) a dólares (USD) usando el tipo de cambio
   */
  convertPenToUsd(amountPen: number, tc?: number): number {
    const activeTc = tc || this.getCotizacionActual().venta;
    if (!activeTc || activeTc <= 0) return 0;
    return Math.round((amountPen / activeTc) * 100) / 100;
  },

  /**
   * Formatea un valor monetario en Dólares ($ 0.00)
   */
  formatUsd(amount: number | string): string {
    const val = Number(amount) || 0;
    return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /**
   * Formatea un valor monetario en Soles (S/ 0.00)
   */
  formatPen(amount: number | string): string {
    const val = Number(amount) || 0;
    return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};
