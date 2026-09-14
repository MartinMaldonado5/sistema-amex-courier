import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClienteCobroLote,
  ItemCobroWR,
  TransaccionPago,
  CotizacionKambista,
  FiltrosCobrosLote,
  ResumenCliente360,
  MetodoPagoCobro,
  TipoRetirante,
  RegistroEntrega,
  VoucherCobroItem
} from '../types';
import { KambistaService } from '../services/kambista.service';
import { INITIAL_COBROS_LOTES } from '../data/initial-data';

const STORAGE_LOTES_KEY = 'amex_cobros_lotes_v2';
const STORAGE_PAGOS_KEY = 'amex_cobros_pagos_v2';
const STORAGE_TARIFAS_KEY = 'amex_clientes_tarifas_v1';

export function useCobrosOperaciones() {
  const [tarifasPorCliente, setTarifasPorCliente] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_TARIFAS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.warn('Error reading tarifas from localStorage:', e);
    }
    return {};
  });

  const [lotes, setLotes] = useState<ClienteCobroLote[]>(() => {
    if (typeof window === 'undefined') return INITIAL_COBROS_LOTES;
    try {
      const saved = localStorage.getItem(STORAGE_LOTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading lotes from localStorage:', e);
    }
    return INITIAL_COBROS_LOTES;
  });

  const [pagos, setPagos] = useState<TransaccionPago[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_PAGOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading pagos from localStorage:', e);
    }
    return [];
  });

  const [cotizacionKambista, setCotizacionKambista] = useState<CotizacionKambista>(() =>
    KambistaService.getCotizacionActual()
  );

  // Sync tarifas a localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_TARIFAS_KEY, JSON.stringify(tarifasPorCliente));
      } catch (e) {
        console.warn('Failed saving tarifas to localStorage:', e);
      }
    }
  }, [tarifasPorCliente]);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_LOTES_KEY, JSON.stringify(lotes));
      } catch (e) {
        console.warn('Failed saving lotes to localStorage:', e);
      }
    }
  }, [lotes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PAGOS_KEY, JSON.stringify(pagos));
      } catch (e) {
        console.warn('Failed saving pagos to localStorage:', e);
      }
    }
  }, [pagos]);

  // Lista de fechas/hojas disponibles en orden cronológico inverso
  const availableFechas = useMemo(() => {
    const set = new Set<string>();
    lotes.forEach((l) => {
      if (l.fechaLote) set.add(l.fechaLote);
    });
    return Array.from(set);
  }, [lotes]);

  const [filtros, setFiltros] = useState<FiltrosCobrosLote>(() => ({
    fechaLote: 'TODOS',
    mes: 'TODOS',
    tipoPersona: 'TODOS',
    rangoMonto: 'TODOS',
    filtroVoucher: 'TODOS',
    busqueda: '',
    estadoPago: 'TODOS',
    estadoEntrega: 'TODOS',
    soloCorporativos: false
  }));

  // Asegurar que si availableFechas cambia y no hay fecha seleccionada válida, maneje correctamente
  useEffect(() => {
    if (
      filtros.fechaLote !== 'TODOS' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(filtros.fechaLote) &&
      availableFechas.length > 0 &&
      !availableFechas.includes(filtros.fechaLote)
    ) {
      setFiltros((prev) => ({ ...prev, fechaLote: 'TODOS' }));
    }
  }, [availableFechas, filtros.fechaLote]);

  // Refrescar TC Kambista en vivo al montar
  useEffect(() => {
    KambistaService.fetchLiveExchangeRate().then((tc) => {
      setCotizacionKambista(tc);
    });
  }, []);

  const updateCotizacionManual = useCallback((compra: number, venta: number) => {
    const updated = KambistaService.setCotizacionManual(compra, venta);
    setCotizacionKambista(updated);
  }, []);

  const refreshKambistaLive = useCallback(async () => {
    const live = await KambistaService.fetchLiveExchangeRate();
    setCotizacionKambista(live);
    return live;
  }, []);

  // Lotes filtrados para la vista operativa
  const lotesFiltrados = useMemo(() => {
    return lotes.filter((lote) => {
      // 1. Filtro fecha / día específico (soporta coincidencia directa o fecha ISO YYYY-MM-DD tipo calendario)
      if (filtros.fechaLote && filtros.fechaLote !== 'TODOS') {
        if (lote.fechaLote !== filtros.fechaLote) {
          const isoMatch = filtros.fechaLote.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (isoMatch) {
            const fMes = isoMatch[2].padStart(2, '0');
            const fDia = isoMatch[3].padStart(2, '0');
            const loteM = (lote.fechaLote || '').match(/(\d{1,2})[.\/-](\d{1,2})/);
            if (loteM) {
              const lDia = loteM[1].padStart(2, '0');
              const lMes = loteM[2].padStart(2, '0');
              if (lDia !== fDia || lMes !== fMes) return false;
            } else {
              const lSingle = (lote.fechaLote || '').match(/(\d{1,2})/);
              if (lSingle) {
                const lDia = lSingle[1].padStart(2, '0');
                if (lDia !== fDia || fMes !== '09') return false;
              } else {
                return false;
              }
            }
          } else {
            return false;
          }
        }
      }

      // 2. Filtro por mes (ej. "08" Agosto, "09" Septiembre)
      if (filtros.mes && filtros.mes !== 'TODOS') {
        const fechaUpper = (lote.fechaLote || '').toUpperCase();
        const matchMes =
          fechaUpper.includes(`.${filtros.mes}`) ||
          fechaUpper.includes(`/${filtros.mes}`) ||
          fechaUpper.includes(`-${filtros.mes}-`) ||
          (filtros.mes === '08' && fechaUpper.includes('AGO')) ||
          (filtros.mes === '09' && fechaUpper.includes('SEP'));
        if (!matchMes) return false;
      }

      // 3. Filtro tipo de persona (Particular vs Corporativo)
      if (filtros.tipoPersona === 'PARTICULAR' && lote.esCorporativo) {
        return false;
      }
      if (filtros.tipoPersona === 'CORPORATIVO' && !lote.esCorporativo) {
        return false;
      }

      // 4. Filtro por rango de monto ($ USD)
      if (filtros.rangoMonto === 'MENOR_20' && lote.totalPrecioUsd >= 20) {
        return false;
      }
      if (filtros.rangoMonto === 'ENTRE_20_100' && (lote.totalPrecioUsd < 20 || lote.totalPrecioUsd > 100)) {
        return false;
      }
      if (filtros.rangoMonto === 'MAYOR_100' && lote.totalPrecioUsd <= 100) {
        return false;
      }

      // 5. Filtro comprobante / voucher
      if (filtros.filtroVoucher === 'CON_VOUCHER') {
        const hasVoucher = Boolean(lote.comprobanteUrl || (lote.vouchersList && lote.vouchersList.length > 0));
        if (!hasVoucher) return false;
      }
      if (filtros.filtroVoucher === 'SIN_VOUCHER') {
        const hasVoucher = Boolean(lote.comprobanteUrl || (lote.vouchersList && lote.vouchersList.length > 0));
        if (hasVoucher) return false;
      }

      // 6. Filtro estado pago
      if (filtros.estadoPago !== 'TODOS' && lote.estadoGlobalPago !== filtros.estadoPago) {
        return false;
      }

      // 7. Filtro estado entrega
      if (filtros.estadoEntrega !== 'TODOS' && lote.estadoGlobalEntrega !== filtros.estadoEntrega) {
        return false;
      }

      // 8. Filtro corporativo toggle legado
      if (filtros.soloCorporativos && !lote.esCorporativo) {
        return false;
      }

      // 9. Filtro búsqueda de texto
      if (filtros.busqueda.trim()) {
        const q = filtros.busqueda.trim().toUpperCase();
        const matchCliente = lote.clienteNombre.toUpperCase().includes(q);
        const matchSub = lote.subConsignatarios?.some((s) => s.toUpperCase().includes(q));
        const matchObs = lote.observacionesLote?.toUpperCase().includes(q);
        const matchWR = lote.itemsWR.some(
          (w) =>
            w.wr.toUpperCase().includes(q) ||
            w.trackingUsa?.toUpperCase().includes(q) ||
            w.consignatarioNombre?.toUpperCase().includes(q) ||
            w.notas?.toUpperCase().includes(q)
        );

        if (!matchCliente && !matchSub && !matchObs && !matchWR) {
          return false;
        }
      }

      return true;
    });
  }, [lotes, filtros]);

  // Estadísticas del lote / hoja activa
  const statsActivas = useMemo(() => {
    let totalUsd = 0;
    let pagadoUsd = 0;
    let pendienteUsd = 0;
    let totalWrs = 0;
    let wrsEntregados = 0;
    let wrsEnAlmacen = 0;
    let totalClientes = lotesFiltrados.length;
    let totalCorporativos = 0;

    lotesFiltrados.forEach((l) => {
      totalUsd += l.totalPrecioUsd;
      pagadoUsd += l.totalPagadoUsd;
      pendienteUsd += l.totalPendienteUsd;
      if (l.esCorporativo) totalCorporativos++;

      l.itemsWR.forEach((w) => {
        totalWrs++;
        if (w.estadoEntrega === 'ENTREGADO' || w.estadoEntrega === 'RECOGIDO') {
          wrsEntregados++;
        } else {
          wrsEnAlmacen++;
        }
      });
    });

    const totalPen = KambistaService.convertUsdToPen(totalUsd, cotizacionKambista.venta);
    const pagadoPen = KambistaService.convertUsdToPen(pagadoUsd, cotizacionKambista.venta);
    const pendientePen = KambistaService.convertUsdToPen(pendienteUsd, cotizacionKambista.venta);

    return {
      totalClientes,
      totalCorporativos,
      totalWrs,
      wrsEntregados,
      wrsEnAlmacen,
      totalUsd: Math.round(totalUsd * 100) / 100,
      pagadoUsd: Math.round(pagadoUsd * 100) / 100,
      pendienteUsd: Math.round(pendienteUsd * 100) / 100,
      totalPen,
      pagadoPen,
      pendientePen,
      porcentajeCobrado: totalUsd > 0 ? Math.round((pagadoUsd / totalUsd) * 100) : 0
    };
  }, [lotesFiltrados, cotizacionKambista.venta]);

  /**
   * Registrar Pago (completo o parcial por WRs seleccionados)
   */
  const registrarPago = useCallback(
    (params: {
      loteId: string;
      wrIdsSeleccionados: string[];
      moneda: 'USD' | 'PEN';
      montoTotalPagado: number;
      metodoPago: MetodoPagoCobro;
      numeroOperacion?: string;
      comprobanteUrl?: string;
      voucherKey?: string;
      tipoCambioUsado?: number;
      notas?: string;
      registradoPor?: string;
      voucherItem?: VoucherCobroItem;
    }) => {
      const tc = params.tipoCambioUsado || cotizacionKambista.venta;
      const fechaNow = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      setLotes((prevLotes) => {
        return prevLotes.map((lote) => {
          if (lote.id !== params.loteId) return lote;

          // Actualizar solo los WRs seleccionados
          const updatedWRs: ItemCobroWR[] = lote.itemsWR.map((item) => {
            if (!params.wrIdsSeleccionados.includes(item.id)) {
              return item;
            }

            const itemUsd = item.precioUsd;
            const itemPen = KambistaService.convertUsdToPen(itemUsd, tc);

            return {
              ...item,
              estadoPago: 'PAGADO' as const,
              pagadoEn: fechaNow,
              pagoId: `PAG-${Date.now()}`,
              montoPagadoUsd: itemUsd,
              montoPagadoPen: itemPen,
              tipoCambioAplicado: tc,
              metodoPago: params.metodoPago,
              numeroOperacion: params.numeroOperacion || item.numeroOperacion,
              comprobanteUrl: params.comprobanteUrl || item.comprobanteUrl,
              voucherCodigo: params.voucherItem?.codigoCobro || item.voucherCodigo,
              notas: params.notas ? `${item.notas ? item.notas + ' | ' : ''}${params.notas}` : item.notas
            };
          });

          // Recalcular métricas del lote
          let pagadoUsd = 0;
          let pendienteUsd = 0;
          let countPagados = 0;

          updatedWRs.forEach((w) => {
            if (w.estadoPago === 'PAGADO') {
              pagadoUsd += w.precioUsd;
              countPagados++;
            } else {
              pendienteUsd += w.precioUsd;
            }
          });

          const estadoGlobalPago: 'PAGADO' | 'FALTA' | 'PARCIAL' =
            countPagados === updatedWRs.length
              ? 'PAGADO'
              : countPagados === 0
              ? 'FALTA'
              : 'PARCIAL';

          // Actualizar lista de vouchers del cliente
          const existingVouchers = lote.vouchersList || [];
          let updatedVouchersList = existingVouchers;
          if (params.voucherItem) {
            updatedVouchersList = [
              params.voucherItem,
              ...existingVouchers.filter((v) => v.id !== params.voucherItem?.id)
            ];
          }

          return {
            ...lote,
            itemsWR: updatedWRs,
            totalPagadoUsd: Math.round(pagadoUsd * 100) / 100,
            totalPendienteUsd: Math.round(pendienteUsd * 100) / 100,
            estadoGlobalPago,
            comprobanteUrl: params.comprobanteUrl || lote.comprobanteUrl,
            metodoPago: params.metodoPago || lote.metodoPago,
            numeroOperacion: params.numeroOperacion || lote.numeroOperacion,
            vouchersList: updatedVouchersList,
            actualizadoEn: new Date().toISOString()
          };
        });
      });

      // Registrar transacción en el historial de pagos
      const targetLote = lotes.find((l) => l.id === params.loteId);
      const wrsCodes = targetLote
        ? targetLote.itemsWR
            .filter((w) => params.wrIdsSeleccionados.includes(w.id))
            .map((w) => w.wr)
        : [];

      const nuevoPago: TransaccionPago = {
        id: `pag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        codigoPago: params.voucherItem?.codigoCobro || `PAG-${Date.now().toString().slice(-6)}`,
        clienteNombre: targetLote ? targetLote.clienteNombre : 'CLIENTE',
        fechaPago: fechaNow,
        monedaCobrada: params.moneda,
        tipoCambioKambista: tc,
        montoUsdTotal:
          params.moneda === 'USD'
            ? params.montoTotalPagado
            : KambistaService.convertPenToUsd(params.montoTotalPagado, tc),
        montoPenTotal:
          params.moneda === 'PEN'
            ? params.montoTotalPagado
            : KambistaService.convertUsdToPen(params.montoTotalPagado, tc),
        metodoPago: params.metodoPago,
        numeroOperacion: params.numeroOperacion,
        comprobanteUrl: params.comprobanteUrl,
        wrsLiquidados: wrsCodes,
        registradoPor: params.registradoPor || 'Operador',
        notas: params.notas,
        creadoEn: new Date().toISOString()
      };

      setPagos((prev) => [nuevoPago, ...prev]);
      return nuevoPago;
    },
    [cotizacionKambista.venta, lotes]
  );

  /**
   * Registrar Entrega Física / Despacho (Titular, Familiar, Motorizado Didi/Uber/Particular)
   */
  const registrarEntrega = useCallback(
    (params: {
      loteId: string;
      wrIdsSeleccionados: string[];
      tipoRetirante: TipoRetirante;
      nombreRetirante: string;
      dniRetirante?: string;
      tipoMotorizado?: 'DIDI' | 'UBER' | 'PEDIDOSYA' | 'PROPIO' | 'OTRO';
      placaVehiculo?: string;
      observaciones?: string;
      registradoPor?: string;
    }) => {
      const fechaHoraEntrega = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const registroEntrega: RegistroEntrega = {
        tipoRetirante: params.tipoRetirante,
        nombreRetirante: params.nombreRetirante,
        dniRetirante: params.dniRetirante,
        tipoMotorizado: params.tipoMotorizado,
        placaVehiculo: params.placaVehiculo,
        fechaHoraEntrega,
        registradoPor: params.registradoPor || 'Operador',
        observaciones: params.observaciones
      };

      setLotes((prevLotes) => {
        return prevLotes.map((lote) => {
          if (lote.id !== params.loteId) return lote;

          const updatedWRs: ItemCobroWR[] = lote.itemsWR.map((item) => {
            if (!params.wrIdsSeleccionados.includes(item.id)) {
              return item;
            }

            return {
              ...item,
              estadoEntrega: 'ENTREGADO' as const,
              entregaInfo: registroEntrega,
              notas: params.observaciones
                ? `${item.notas ? item.notas + ' | ' : ''}Entrega: ${params.observaciones}`
                : item.notas
            };
          });

          let countEntregados = 0;
          updatedWRs.forEach((w) => {
            if (w.estadoEntrega === 'ENTREGADO' || w.estadoEntrega === 'RECOGIDO') {
              countEntregados++;
            }
          });

          const estadoGlobalEntrega: 'EN_ALMACEN' | 'ENTREGADO' | 'PARCIAL' =
            countEntregados === updatedWRs.length
              ? 'ENTREGADO'
              : countEntregados === 0
              ? 'EN_ALMACEN'
              : 'PARCIAL';

          return {
            ...lote,
            itemsWR: updatedWRs,
            estadoGlobalEntrega,
            actualizadoEn: new Date().toISOString()
          };
        });
      });
    },
    []
  );

  /**
   * Toggle rápido de estado de pago para un WR individual (1 solo clic, como en Excel)
   */
  const togglePagoRapidoWR = useCallback(
    (loteId: string, wrId: string) => {
      setLotes((prev) => {
        return prev.map((lote) => {
          if (lote.id !== loteId) return lote;

          const updatedWRs = lote.itemsWR.map((w) => {
            if (w.id !== wrId) return w;
            const nuevoEstado = w.estadoPago === 'PAGADO' ? 'FALTA' : 'PAGADO';
            return {
              ...w,
              estadoPago: nuevoEstado as 'PAGADO' | 'FALTA',
              pagadoEn: nuevoEstado === 'PAGADO' ? new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : undefined
            };
          });

          let pagadoUsd = 0;
          let pendienteUsd = 0;
          let countPagados = 0;
          updatedWRs.forEach((w) => {
            if (w.estadoPago === 'PAGADO') {
              pagadoUsd += w.precioUsd;
              countPagados++;
            } else {
              pendienteUsd += w.precioUsd;
            }
          });

          const estadoGlobalPago: 'PAGADO' | 'FALTA' | 'PARCIAL' =
            countPagados === updatedWRs.length
              ? 'PAGADO'
              : countPagados === 0
              ? 'FALTA'
              : 'PARCIAL';

          return {
            ...lote,
            itemsWR: updatedWRs,
            totalPagadoUsd: Math.round(pagadoUsd * 100) / 100,
            totalPendienteUsd: Math.round(pendienteUsd * 100) / 100,
            estadoGlobalPago,
            actualizadoEn: new Date().toISOString()
          };
        });
      });
    },
    []
  );

  /**
   * Toggle rápido de estado de entrega para un WR individual
   */
  const toggleEntregaRapidaWR = useCallback(
    (loteId: string, wrId: string) => {
      setLotes((prev) => {
        return prev.map((lote) => {
          if (lote.id !== loteId) return lote;

          const updatedWRs = lote.itemsWR.map((w) => {
            if (w.id !== wrId) return w;
            const nuevoEstado = w.estadoEntrega === 'ENTREGADO' ? 'EN_ALMACEN' : 'ENTREGADO';
            return {
              ...w,
              estadoEntrega: nuevoEstado as 'ENTREGADO' | 'EN_ALMACEN'
            };
          });

          let countEntregados = 0;
          updatedWRs.forEach((w) => {
            if (w.estadoEntrega === 'ENTREGADO' || w.estadoEntrega === 'RECOGIDO') {
              countEntregados++;
            }
          });

          const estadoGlobalEntrega: 'EN_ALMACEN' | 'ENTREGADO' | 'PARCIAL' =
            countEntregados === updatedWRs.length
              ? 'ENTREGADO'
              : countEntregados === 0
              ? 'EN_ALMACEN'
              : 'PARCIAL';

          return {
            ...lote,
            itemsWR: updatedWRs,
            estadoGlobalEntrega,
            actualizadoEn: new Date().toISOString()
          };
        });
      });
    },
    []
  );

  /**
   * Toggle global de pago para toda la persona (1 clic para marcar todos sus WRs como PAGADO o FALTA)
   */
  const toggleGlobalPagoPersona = useCallback((loteId: string) => {
    setLotes((prev) => {
      return prev.map((lote) => {
        if (lote.id !== loteId) return lote;
        const nuevoEstado = lote.estadoGlobalPago === 'PAGADO' ? 'FALTA' : 'PAGADO';
        const isPaid = nuevoEstado === 'PAGADO';
        const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        const updatedWRs = lote.itemsWR.map((w) => ({
          ...w,
          estadoPago: nuevoEstado as 'PAGADO' | 'FALTA',
          pagadoEn: isPaid ? hora : undefined
        }));

        return {
          ...lote,
          itemsWR: updatedWRs,
          totalPagadoUsd: isPaid ? lote.totalPrecioUsd : 0,
          totalPendienteUsd: isPaid ? 0 : lote.totalPrecioUsd,
          estadoGlobalPago: nuevoEstado as 'PAGADO' | 'FALTA',
          actualizadoEn: new Date().toISOString()
        };
      });
    });
  }, []);

  /**
   * Toggle global de entrega para toda la persona (1 clic para marcar todos sus WRs como ENTREGADO o EN_ALMACEN)
   */
  const toggleGlobalEntregaPersona = useCallback((loteId: string) => {
    setLotes((prev) => {
      return prev.map((lote) => {
        if (lote.id !== loteId) return lote;
        const nuevoEstado = lote.estadoGlobalEntrega === 'ENTREGADO' ? 'EN_ALMACEN' : 'ENTREGADO';

        const updatedWRs = lote.itemsWR.map((w) => ({
          ...w,
          estadoEntrega: nuevoEstado as 'ENTREGADO' | 'EN_ALMACEN'
        }));

        return {
          ...lote,
          itemsWR: updatedWRs,
          estadoGlobalEntrega: nuevoEstado as 'ENTREGADO' | 'EN_ALMACEN',
          actualizadoEn: new Date().toISOString()
        };
      });
    });
  }, []);

  /**
   * Eliminar lote / registro de cobro de una persona
   */
  const eliminarLotePersona = useCallback((loteId: string) => {
    setLotes((prev) => prev.filter((l) => l.id !== loteId));
  }, []);

  /**
   * Registrar nuevo cobro diario asignando una persona y sus WRs de warehouse
   */
  const registrarNuevoCobroPersona = useCallback(
    (params: {
      fechaLote?: string;
      clienteNombre: string;
      esCorporativo?: boolean;
      observaciones?: string;
      itemsWR: Array<{
        wr: string;
        pesoKg: number;
        precioUsd: number;
        cajaNumero?: string;
        trackingUsa?: string;
        consignatarioNombre?: string;
        notas?: string;
      }>;
      estadoInicialPago?: 'PAGADO' | 'FALTA';
      estadoInicialEntrega?: 'EN_ALMACEN' | 'ENTREGADO';
    }) => {
      const fechaLoteNorm = params.fechaLote?.trim() || new Date().toLocaleDateString('es-PE');
      const clienteNombreNorm = params.clienteNombre.trim().toUpperCase();
      const estadoPago = params.estadoInicialPago || 'FALTA';
      const estadoEntrega = params.estadoInicialEntrega || 'EN_ALMACEN';
      const isPaid = estadoPago === 'PAGADO';

      const wrs: ItemCobroWR[] = params.itemsWR.map((item, idx) => ({
        id: `wr_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        wr: item.wr.trim().toUpperCase() || `WR-${Date.now().toString().slice(-6)}`,
        cajaNumero: item.cajaNumero?.trim() || undefined,
        trackingUsa: item.trackingUsa?.trim() || undefined,
        pesoKg: Number(item.pesoKg) || 0,
        precioUsd: Number(item.precioUsd) || 0,
        estadoPago,
        estadoEntrega,
        consignatarioNombre: item.consignatarioNombre?.trim() || undefined,
        notas: item.notas?.trim() || undefined
      }));

      let totalPeso = 0;
      let totalUsd = 0;
      wrs.forEach((w) => {
        totalPeso += w.pesoKg;
        totalUsd += w.precioUsd;
      });

      const nuevoLote: ClienteCobroLote = {
        id: `lote_${fechaLoteNorm.replace(/[^a-zA-Z0-9]/g, '_')}_${clienteNombreNorm.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        clienteNombre: clienteNombreNorm,
        esCorporativo: Boolean(params.esCorporativo),
        subConsignatarios: params.esCorporativo
          ? Array.from(new Set(wrs.map((w) => w.consignatarioNombre).filter(Boolean) as string[]))
          : [],
        fechaLote: fechaLoteNorm,
        hojaExcelOrigen: fechaLoteNorm,
        itemsWR: wrs,
        totalPesoKg: Math.round(totalPeso * 100) / 100,
        totalPrecioUsd: Math.round(totalUsd * 100) / 100,
        totalPagadoUsd: isPaid ? Math.round(totalUsd * 100) / 100 : 0,
        totalPendienteUsd: isPaid ? 0 : Math.round(totalUsd * 100) / 100,
        estadoGlobalPago: estadoPago,
        estadoGlobalEntrega: estadoEntrega,
        observacionesLote: params.observaciones?.trim() || undefined,
        actualizadoEn: new Date().toISOString()
      };

      setLotes((prev) => [nuevoLote, ...prev]);

      return nuevoLote;
    },
    []
  );

  /**
   * Importar Lotes masivamente desde el parser de Excel
   */
  const importarLotesDesdeExcel = useCallback(
    (nuevosLotes: ClienteCobroLote[], modo: 'reemplazar' | 'combinar' = 'combinar') => {
      setLotes((prev) => {
        if (modo === 'reemplazar') {
          return nuevosLotes;
        }

        // Combinar evitando duplicados por id
        const map = new Map<string, ClienteCobroLote>();
        nuevosLotes.forEach((l) => map.set(l.id, l));
        prev.forEach((l) => {
          if (!map.has(l.id)) {
            map.set(l.id, l);
          }
        });
        return Array.from(map.values());
      });

      // Si hay nuevos lotes, seleccionar la fecha del primer lote importado
      if (nuevosLotes.length > 0 && nuevosLotes[0].fechaLote) {
        setFiltros((prev) => ({ ...prev, fechaLote: nuevosLotes[0].fechaLote }));
      }
    },
    []
  );

  /**
   * Obtener vista 360° histórica de cualquier cliente o corporación
   */
  /**
   * Obtiene la tarifa por kilo ($/kg) asignada o calculada para un cliente
   */
  const getTarifaCliente = useCallback(
    (clienteNombre: string): { tarifa: number; personalizada: boolean } => {
      if (!clienteNombre) return { tarifa: 7.0, personalizada: false };
      const key = clienteNombre.toUpperCase().trim();

      // 1. Si existe tarifa explícitamente configurada en el directorio 360
      if (tarifasPorCliente[key] !== undefined && tarifasPorCliente[key] > 0) {
        return { tarifa: tarifasPorCliente[key], personalizada: true };
      }

      // 2. Si no, calcular promedio histórico a partir de sus paquetes previos
      const norm = key;
      const clientLotes = lotes.filter((l) => l.clienteNombre.toUpperCase().trim() === norm);
      let totalPeso = 0;
      let totalUsd = 0;
      let esCorp = clientLotes.some((l) => l.esCorporativo);

      clientLotes.forEach((l) => {
        l.itemsWR.forEach((w) => {
          if (w.pesoKg > 0 && w.precioUsd > 0) {
            totalPeso += w.pesoKg;
            totalUsd += w.precioUsd;
          }
        });
      });

      if (totalPeso > 0 && totalUsd > 0) {
        const calculated = Math.round((totalUsd / totalPeso) * 100) / 100;
        if (calculated >= 3 && calculated <= 30) {
          return { tarifa: calculated, personalizada: false };
        }
      }

      // 3. Tarifa por defecto de mercado: $6.00/kg para corporativos, $7.00/kg para particulares
      const defaultTarifa = esCorp ? 6.0 : 7.0;
      return { tarifa: defaultTarifa, personalizada: false };
    },
    [tarifasPorCliente, lotes]
  );

  /**
   * Guarda y persiste en localStorage la tarifa personalizada por kilo ($/kg) para un cliente
   */
  const guardarTarifaCliente = useCallback(
    (clienteNombre: string, tarifa: number) => {
      if (!clienteNombre) return;
      const key = clienteNombre.toUpperCase().trim();
      setTarifasPorCliente((prev) => ({
        ...prev,
        [key]: Math.round(tarifa * 100) / 100
      }));
    },
    []
  );

  /**
   * Resumen analítico 360 de un cliente específico
   */
  const getResumenCliente360 = useCallback(
    (clienteNombre: string): ResumenCliente360 | null => {
      if (!clienteNombre) return null;

      const norm = clienteNombre.trim().toUpperCase();
      const matchingLotes = lotes.filter((l) => {
        const isClient = l.clienteNombre.toUpperCase() === norm;
        const isSub = l.subConsignatarios?.some((s) => s.toUpperCase() === norm);
        return isClient || isSub;
      });

      if (matchingLotes.length === 0) return null;

      let esCorporativo = matchingLotes.some((l) => l.esCorporativo);
      let totalWrsHistoricos = 0;
      let totalFacturadoUsd = 0;
      let totalPagadoUsd = 0;
      let totalPendienteUsd = 0;
      let totalEntregados = 0;
      let totalEnAlmacen = 0;
      let totalPesoHistoricoKg = 0;
      const lotesSet = new Set<string>();
      const subsSet = new Set<string>();
      const allWRs: ItemCobroWR[] = [];

      matchingLotes.forEach((l) => {
        lotesSet.add(l.fechaLote);
        l.subConsignatarios?.forEach((s) => subsSet.add(s));

        l.itemsWR.forEach((w) => {
          // Si buscamos un sub-consignatario dentro de un corporativo
          if (!l.esCorporativo || !w.consignatarioNombre || w.consignatarioNombre.toUpperCase() === norm || l.clienteNombre.toUpperCase() === norm) {
            allWRs.push(w);
            totalWrsHistoricos++;
            totalFacturadoUsd += w.precioUsd;
            totalPesoHistoricoKg += w.pesoKg || 0;

            if (w.estadoPago === 'PAGADO') {
              totalPagadoUsd += w.precioUsd;
            } else {
              totalPendienteUsd += w.precioUsd;
            }

            if (w.estadoEntrega === 'ENTREGADO' || w.estadoEntrega === 'RECOGIDO') {
              totalEntregados++;
            } else {
              totalEnAlmacen++;
            }
          }
        });
      });

      const clientPagos = pagos.filter(
        (p) => p.clienteNombre.toUpperCase().includes(norm) || norm.includes(p.clienteNombre.toUpperCase())
      );

      const { tarifa: tarifaPorKgUsd, personalizada: tarifaPersonalizada } = getTarifaCliente(clienteNombre);

      return {
        clienteNombre,
        esCorporativo,
        totalWrsHistoricos,
        totalFacturadoUsd: Math.round(totalFacturadoUsd * 100) / 100,
        totalPagadoUsd: Math.round(totalPagadoUsd * 100) / 100,
        deudaPendienteUsd: Math.round(totalPendienteUsd * 100) / 100,
        totalEntregados,
        totalEnAlmacen,
        totalPesoHistoricoKg: Math.round(totalPesoHistoricoKg * 100) / 100,
        tarifaPorKgUsd,
        tarifaPersonalizada,
        lotesHistoricos: Array.from(lotesSet),
        subConsignatarios: Array.from(subsSet),
        historialWRs: allWRs,
        historialPagos: clientPagos
      };
    },
    [lotes, pagos, getTarifaCliente]
  );

  /**
   * Resetear a datos iniciales de la empresa si es necesario
   */
  const restaurarDatosEjemplo = useCallback(() => {
    setLotes(INITIAL_COBROS_LOTES);
    setPagos([]);
    setTarifasPorCliente({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_LOTES_KEY);
      localStorage.removeItem(STORAGE_PAGOS_KEY);
      localStorage.removeItem(STORAGE_TARIFAS_KEY);
    }
  }, []);

  return {
    lotes,
    lotesFiltrados,
    pagos,
    availableFechas,
    filtros,
    setFiltros,
    cotizacionKambista,
    updateCotizacionManual,
    refreshKambistaLive,
    statsActivas,
    registrarPago,
    registrarEntrega,
    togglePagoRapidoWR,
    toggleEntregaRapidaWR,
    toggleGlobalPagoPersona,
    toggleGlobalEntregaPersona,
    eliminarLotePersona,
    registrarNuevoCobroPersona,
    importarLotesDesdeExcel,
    getResumenCliente360,
    getTarifaCliente,
    guardarTarifaCliente,
    tarifasPorCliente,
    restaurarDatosEjemplo
  };
}
