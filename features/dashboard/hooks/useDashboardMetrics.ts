'use client';

import { useState, useMemo } from 'react';
import {
  Paquete,
  Cliente,
  OrdenEntrega,
  CobroVoucher
} from '@/types';
import {
  TimeFilter,
  PackageStatusFilter,
  DailyTaskItem,
  ShelfCapacityStat,
  PaymentMethodStat,
  DeliveryChannelStat,
  PackageTypeStat,
  ExecutiveKpis
} from '../types';

interface UseDashboardMetricsProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  entregas: OrdenEntrega[];
  cobros: CobroVoucher[];
}

export function useDashboardMetrics({
  paquetes = [],
  clientes = [],
  entregas = [],
  cobros = []
}: UseDashboardMetricsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [packageFilter, setPackageFilter] = useState<PackageStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado temporal
  const isWithinTimeRange = (dateStr?: string) => {
    if (!dateStr || timeFilter === 'ALL') return true;
    try {
      const itemDate = new Date(dateStr);
      if (isNaN(itemDate.getTime())) return true;
      const now = new Date();

      if (timeFilter === 'TODAY') {
        return (
          itemDate.getDate() === now.getDate() &&
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === 'WEEK') {
        const diffMs = now.getTime() - itemDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }

      if (timeFilter === 'MONTH') {
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      }
    } catch {
      return true;
    }
    return true;
  };

  // Paquetes clasificados
  const paquetesLince = useMemo(
    () => paquetes.filter(p => p.ubicacionActual === 'AmexLince' || p.estadoEntrega === 'EnAlmacen'),
    [paquetes]
  );

  const paquetesMiami = useMemo(
    () => paquetes.filter(p => p.ubicacionActual === 'TibCourierMiami'),
    [paquetes]
  );

  const paquetesEnRuta = useMemo(
    () => paquetes.filter(p => p.estadoEntrega === 'EnRutaCarroAmex'),
    [paquetes]
  );

  const paquetesEntregados = useMemo(
    () =>
      paquetes.filter(
        p =>
          p.estadoEntrega === 'Entregado' ||
          p.estadoEntrega === 'EntregadoDomicilio' ||
          p.estadoEntrega === 'RecogidoAlmacen'
      ),
    [paquetes]
  );

  const paquetesSinUbicar = useMemo(
    () =>
      paquetesLince.filter(
        p =>
          !p.posicionEstante ||
          p.posicionEstante === 'REC' ||
          p.posicionEstante === 'REC-P1' ||
          p.posicionEstante.includes('RECEPCION') ||
          p.posicionEstante.includes('ALMACEN LINCE') ||
          !p.posicionEstante.includes('-')
      ),
    [paquetesLince]
  );

  const totalPesoLince = useMemo(
    () => paquetesLince.reduce((acc, p) => acc + (Number(p.pesoKg) || 0), 0),
    [paquetesLince]
  );

  // Métricas Financieras (Cobros)
  const cobrosFiltrados = useMemo(
    () => cobros.filter(c => isWithinTimeRange(c.creado_en || c.fecha_operacion)),
    [cobros, timeFilter]
  );

  const financialMetrics = useMemo(() => {
    let totalCobradoSoles = 0;
    let totalCobradoDolares = 0;
    let totalPendienteSoles = 0;
    let totalPendienteDolares = 0;
    let validados = 0;
    let pendientes = 0;

    cobrosFiltrados.forEach(c => {
      const monto = Number(c.monto || 0);
      if (c.estado === 'VALIDADO') {
        validados++;
        if (c.moneda === 'PEN') {
          totalCobradoSoles += monto;
        } else {
          totalCobradoDolares += monto;
        }
      } else if (c.estado === 'PENDIENTE') {
        pendientes++;
        if (c.moneda === 'PEN') {
          totalPendienteSoles += monto;
        } else {
          totalPendienteDolares += monto;
        }
      }
    });

    const totalCobrosCount = validados + pendientes;
    const tasaCobranza =
      totalCobrosCount > 0 ? Math.round((validados / totalCobrosCount) * 100) : 100;

    return {
      totalCobradoSoles,
      totalCobradoDolares,
      totalPendienteSoles,
      totalPendienteDolares,
      tasaCobranza,
      validados,
      pendientes,
      totalVouchers: cobrosFiltrados.length
    };
  }, [cobrosFiltrados]);

  // Órdenes de Entrega
  const ordenesActivas = useMemo(
    () => entregas.filter(e => e.estado !== 'ENTREGADO'),
    [entregas]
  );

  const ordenesListas = useMemo(
    () => entregas.filter(e => e.estado === 'LISTO_ENTREGA'),
    [entregas]
  );

  // Clientes con paquetes activos
  const clientesConPaquetes = useMemo(() => {
    const casillerosActivos = new Set(
      paquetes
        .filter(p => p.estadoEntrega !== 'Entregado' && p.estadoEntrega !== 'EntregadoDomicilio' && p.estadoEntrega !== 'RecogidoAlmacen')
        .map(p => p.codigoCasillero)
    );
    return casillerosActivos.size;
  }, [paquetes]);

  // KPIs Maestros
  const kpis: ExecutiveKpis = useMemo(() => {
    const totalPkg = paquetes.length;
    const deliveredPkg = paquetesEntregados.length;
    const tasaEntrega = totalPkg > 0 ? Math.round((deliveredPkg / totalPkg) * 100) : 0;
    const pesoPromedio =
      paquetesLince.length > 0 ? Number((totalPesoLince / paquetesLince.length).toFixed(1)) : 0;

    return {
      totalCobradoSoles: financialMetrics.totalCobradoSoles,
      totalCobradoDolares: financialMetrics.totalCobradoDolares,
      totalPendienteSoles: financialMetrics.totalPendienteSoles,
      totalPendienteDolares: financialMetrics.totalPendienteDolares,
      tasaCobranzaPorcentaje: financialMetrics.tasaCobranza,
      totalVouchers: financialMetrics.totalVouchers,
      vouchersValidadosCount: financialMetrics.validados,
      vouchersPendientesCount: financialMetrics.pendientes,

      totalPaquetes: totalPkg,
      paquetesEnLince: paquetesLince.length,
      paquetesEnRuta: paquetesEnRuta.length,
      paquetesEnMiami: paquetesMiami.length,
      paquetesEntregados: deliveredPkg,
      paquetesSinUbicar: paquetesSinUbicar.length,
      totalPesoKgLince: Number(totalPesoLince.toFixed(1)),
      pesoPromedioKg: pesoPromedio,

      totalClientes: clientes.length,
      clientesConPaquetesActivos: clientesConPaquetes,
      tasaEntregaPorcentaje: tasaEntrega,
      ordenesMostradorActivas: ordenesActivas.length,
      ordenesMostradorListas: ordenesListas.length
    };
  }, [
    paquetes,
    paquetesLince,
    paquetesEnRuta,
    paquetesMiami,
    paquetesEntregados,
    paquetesSinUbicar,
    totalPesoLince,
    financialMetrics,
    clientes,
    clientesConPaquetes,
    ordenesActivas,
    ordenesListas
  ]);

  // TAREAS DIARIAS OPERATIVAS (Backlog Crítico del Negocio)
  const dailyTasks: DailyTaskItem[] = useMemo(() => {
    const tasks: DailyTaskItem[] = [];

    // 1. Cobros Pendientes de Auditar
    if (financialMetrics.pendientes > 0) {
      tasks.push({
        id: 'task-cobros',
        title: 'Auditoría de Vouchers WhatsApp',
        description: `${financialMetrics.pendientes} comprobantes por validar antes de liberar paquetes`,
        count: financialMetrics.pendientes,
        badgeText: `${financialMetrics.pendientes} por auditar`,
        amountText: `S/ ${financialMetrics.totalPendienteSoles.toFixed(2)} por cobrar`,
        urgency: 'critical',
        icon: 'Receipt',
        targetTab: 'fico-cobros',
        actionLabel: 'Validar Vouchers'
      });
    }

    // 2. Slotting / Ubicación de Paquetes en Almacén
    if (paquetesSinUbicar.length > 0) {
      tasks.push({
        id: 'task-slotting',
        title: 'Asignar Anaquel / Slotting',
        description: `${paquetesSinUbicar.length} bultos en mesa de recepción pendientes de ubicar en estante`,
        count: paquetesSinUbicar.length,
        badgeText: `${paquetesSinUbicar.length} sin anaquel`,
        urgency: 'warning',
        icon: 'Boxes',
        targetTab: 'mm-lince',
        actionLabel: 'Ubicar en Anaqueles'
      });
    }

    // 3. Órdenes de Mostrador Activas
    if (ordenesActivas.length > 0) {
      tasks.push({
        id: 'task-mostrador',
        title: 'Entregas Mostrador Lince',
        description: `${ordenesActivas.length} órdenes en mostrador (${ordenesListas.length} listas para entrega)`,
        count: ordenesActivas.length,
        badgeText: `${ordenesActivas.length} órdenes`,
        urgency: 'info',
        icon: 'Store',
        targetTab: 'shp-entregas',
        actionLabel: 'Atender Mostrador'
      });
    }

    // 4. Reparto Local Carro AMEX
    if (paquetesEnRuta.length > 0) {
      tasks.push({
        id: 'task-ruta',
        title: 'Despacho Carro AMEX en Ruta',
        description: `${paquetesEnRuta.length} paquetes en traslado hacia domicilios en Lima Metropolitana`,
        count: paquetesEnRuta.length,
        badgeText: `${paquetesEnRuta.length} en ruta`,
        urgency: 'info',
        icon: 'Car',
        targetTab: 'shp-deliveries',
        actionLabel: 'Monitorear Ruta'
      });
    }

    // 5. Picking Agencias de Provincia (Shalom / Olva)
    const paquetesAgencia = paquetes.filter(
      p => p.metodoEntrega === 'AgenciaProvincia' && p.estadoEntrega !== 'Entregado'
    );
    if (paquetesAgencia.length > 0) {
      tasks.push({
        id: 'task-picking',
        title: 'Picking Shalom / Olva',
        description: `${paquetesAgencia.length} paquetes destinados a agencias de provincia por consolidar`,
        count: paquetesAgencia.length,
        badgeText: `${paquetesAgencia.length} provincia`,
        urgency: 'info',
        icon: 'ClipboardList',
        targetTab: 'wms-picking',
        actionLabel: 'Iniciar Picking'
      });
    }

    return tasks;
  }, [financialMetrics, paquetesSinUbicar, ordenesActivas, ordenesListas, paquetesEnRuta, paquetes]);

  // Capacidad de Anaqueles (WMS)
  const shelfStats: ShelfCapacityStat[] = useMemo(() => {
    // A1
    const a1Count = paquetesLince.filter(p => (p.posicionEstante || p.anaquel || '').startsWith('A1')).length;
    const a1Cap = 120; // 3 pisos x 40
    const a1Pct = Math.min(100, Math.round((a1Count / a1Cap) * 100));

    // A2
    const a2Count = paquetesLince.filter(p => (p.posicionEstante || p.anaquel || '').startsWith('A2')).length;
    const a2Cap = 120;
    const a2Pct = Math.min(100, Math.round((a2Count / a2Cap) * 100));

    // Mesa Recepción (REC)
    const recCount = paquetesLince.filter(
      p =>
        (p.posicionEstante || '').startsWith('REC') ||
        (p.posicionEstante || '').includes('RECEPCION') ||
        (p.posicionEstante || '').includes('ALMACEN LINCE')
    ).length;
    const recCap = 100;
    const recPct = Math.min(100, Math.round((recCount / recCap) * 100));

    // Despacho (DSP)
    const dspCount = paquetesLince.filter(p => (p.posicionEstante || '').startsWith('DSP')).length;
    const dspCap = 100;
    const dspPct = Math.min(100, Math.round((dspCount / dspCap) * 100));

    return [
      {
        code: 'A1',
        name: 'Anaquel Principal A1 (P1 · P2 · P3)',
        zone: 'Almacenaje en Custodia',
        count: a1Count,
        capacity: a1Cap,
        percentage: a1Pct,
        color: '#7c3aed',
        status: a1Pct >= 90 ? 'warning' : a1Pct >= 60 ? 'optimal' : 'normal'
      },
      {
        code: 'A2',
        name: 'Anaquel Secundario A2 (P1 · P2 · P3)',
        zone: 'Almacenaje en Custodia',
        count: a2Count,
        capacity: a2Cap,
        percentage: a2Pct,
        color: '#2563eb',
        status: a2Pct >= 90 ? 'warning' : a2Pct >= 60 ? 'optimal' : 'normal'
      },
      {
        code: 'REC',
        name: 'Mesa Central de Recepción (REC)',
        zone: 'Desconsolidación y Entrada',
        count: recCount,
        capacity: recCap,
        percentage: recPct,
        color: '#d97706',
        status: recPct >= 70 ? 'warning' : 'normal'
      },
      {
        code: 'DSP',
        name: 'Bahía de Despacho & Salida (DSP)',
        zone: 'Zona de Carga y Rutas',
        count: dspCount,
        capacity: dspCap,
        percentage: dspPct,
        color: '#059669',
        status: dspPct >= 70 ? 'warning' : 'normal'
      }
    ];
  }, [paquetesLince]);

  // Medios de Pago (Finanzas)
  const paymentStats: PaymentMethodStat[] = useMemo(() => {
    const map: Record<string, { count: number; totalSoles: number; color: string; label: string }> = {
      YAPE: { count: 0, totalSoles: 0, color: '#7c3aed', label: 'Yape Móvil' },
      BCP: { count: 0, totalSoles: 0, color: '#0284c7', label: 'BCP Banco' },
      PLIN: { count: 0, totalSoles: 0, color: '#06b6d4', label: 'Plin Interbancario' },
      INTERBANK: { count: 0, totalSoles: 0, color: '#10b981', label: 'Interbank' },
      BBVA: { count: 0, totalSoles: 0, color: '#3b82f6', label: 'BBVA Continental' },
      EFECTIVO: { count: 0, totalSoles: 0, color: '#84cc16', label: 'Efectivo Mostrador' }
    };

    let grandTotal = 0;
    cobrosFiltrados.forEach(c => {
      const m = c.metodo_pago ? c.metodo_pago.toUpperCase() : 'YAPE';
      const target = map[m] || map['YAPE'];
      const amount = Number(c.monto || 0);
      target.count++;
      target.totalSoles += amount;
      grandTotal += amount;
    });

    return Object.entries(map)
      .map(([method, data]) => ({
        method,
        label: data.label,
        count: data.count,
        totalSoles: data.totalSoles,
        percentage: grandTotal > 0 ? Math.round((data.totalSoles / grandTotal) * 100) : 0,
        color: data.color
      }))
      .filter(p => p.count > 0 || grandTotal === 0);
  }, [cobrosFiltrados]);

  // Métodos de Entrega (Distribución Logística)
  const deliveryChannels: DeliveryChannelStat[] = useMemo(() => {
    const counts = {
      RecojoLince: 0,
      CarroAmexDomicilio: 0,
      AgenciaProvincia: 0
    };

    paquetes.forEach(p => {
      if (p.metodoEntrega === 'RecojoLince') counts.RecojoLince++;
      else if (p.metodoEntrega === 'CarroAmexDomicilio') counts.CarroAmexDomicilio++;
      else if (p.metodoEntrega === 'AgenciaProvincia') counts.AgenciaProvincia++;
      else counts.RecojoLince++;
    });

    const total = paquetes.length || 1;
    return [
      {
        channel: 'RecojoLince',
        label: 'Recojo Mostrador Lince',
        count: counts.RecojoLince,
        percentage: Math.round((counts.RecojoLince / total) * 100),
        color: '#2563eb'
      },
      {
        channel: 'CarroAmexDomicilio',
        label: 'Reparto Carro AMEX (Lima)',
        count: counts.CarroAmexDomicilio,
        percentage: Math.round((counts.CarroAmexDomicilio / total) * 100),
        color: '#7c3aed'
      },
      {
        channel: 'AgenciaProvincia',
        label: 'Agencias Provincia (Shalom/Olva)',
        count: counts.AgenciaProvincia,
        percentage: Math.round((counts.AgenciaProvincia / total) * 100),
        color: '#059669'
      }
    ];
  }, [paquetes]);

  // Tipos de Empaque (Cajas vs Sobres vs Sacas)
  const packageTypes: PackageTypeStat[] = useMemo(() => {
    let cajas = 0;
    let sobres = 0;
    let sacas = 0;
    let pesoCajas = 0;
    let pesoSobres = 0;
    let pesoSacas = 0;

    paquetes.forEach(p => {
      const t = (p.tipoEmpaque || 'CAJA').toUpperCase();
      const w = Number(p.pesoKg || 0);
      if (t.includes('SOBRE')) {
        sobres++;
        pesoSobres += w;
      } else if (t.includes('SACA')) {
        sacas++;
        pesoSacas += w;
      } else {
        cajas++;
        pesoCajas += w;
      }
    });

    const total = paquetes.length || 1;
    return [
      {
        type: 'CAJA',
        label: 'Cajas Estándar',
        count: cajas,
        totalWeightKg: Number(pesoCajas.toFixed(1)),
        percentage: Math.round((cajas / total) * 100),
        color: '#0284c7'
      },
      {
        type: 'SOBRE',
        label: 'Sobres / Documentos',
        count: sobres,
        totalWeightKg: Number(pesoSobres.toFixed(1)),
        percentage: Math.round((sobres / total) * 100),
        color: '#059669'
      },
      {
        type: 'SACA',
        label: 'Sacas Consolidadas',
        count: sacas,
        totalWeightKg: Number(pesoSacas.toFixed(1)),
        percentage: Math.round((sacas / total) * 100),
        color: '#d97706'
      }
    ];
  }, [paquetes]);

  // Paquetes Filtrados para la Consola en Vivo
  const filteredPaquetes = useMemo(() => {
    return paquetes.filter(p => {
      // Filtro de Estado
      if (packageFilter === 'LINCE') {
        const isLince = p.ubicacionActual === 'AmexLince' || p.estadoEntrega === 'EnAlmacen';
        if (!isLince) return false;
      } else if (packageFilter === 'EN_RUTA') {
        if (p.estadoEntrega !== 'EnRutaCarroAmex') return false;
      } else if (packageFilter === 'MIAMI') {
        if (p.ubicacionActual !== 'TibCourierMiami') return false;
      } else if (packageFilter === 'ENTREGADO') {
        const isDelivered =
          p.estadoEntrega === 'Entregado' ||
          p.estadoEntrega === 'EntregadoDomicilio' ||
          p.estadoEntrega === 'RecogidoAlmacen';
        if (!isDelivered) return false;
      } else if (packageFilter === 'PENDIENTE_PAGO') {
        // Paquetes no entregados
        const isDelivered =
          p.estadoEntrega === 'Entregado' ||
          p.estadoEntrega === 'EntregadoDomicilio' ||
          p.estadoEntrega === 'RecogidoAlmacen';
        if (isDelivered) return false;
      }

      // Buscador
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWr = (p.numeroReciboBodega || '').toLowerCase().includes(q);
        const matchTracking = (p.trackingUsa || '').toLowerCase().includes(q);
        const matchCasillero = (p.codigoCasillero || '').toLowerCase().includes(q);
        const matchName = (p.nombreConsignatario || '').toLowerCase().includes(q);
        const matchPos = (p.posicionEstante || '').toLowerCase().includes(q);
        const matchDesc = (p.descripcion || '').toLowerCase().includes(q);
        return matchWr || matchTracking || matchCasillero || matchName || matchPos || matchDesc;
      }

      return true;
    });
  }, [paquetes, packageFilter, searchQuery]);

  return {
    timeFilter,
    setTimeFilter,
    packageFilter,
    setPackageFilter,
    searchQuery,
    setSearchQuery,
    kpis,
    dailyTasks,
    shelfStats,
    paymentStats,
    deliveryChannels,
    packageTypes,
    filteredPaquetes
  };
}
