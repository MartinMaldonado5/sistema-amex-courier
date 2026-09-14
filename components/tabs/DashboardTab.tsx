'use client';

import React, { useState } from 'react';
import {
  useDashboardMetrics,
  DashboardHeader,
  ExecutiveKpiGrid,
  DailyTasksSection,
  AnalyticsChartsSection,
  LivePackagesStream,
  DashboardTabProps
} from '@/features/dashboard';

export default function DashboardTab({
  paquetes = [],
  clientes = [],
  entregas = [],
  cobros = [],
  onNavigateTab,
  onNewPackage,
  onPrintLabel,
  onViewPdf,
  onRefreshData
}: DashboardTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
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
  } = useDashboardMetrics({
    paquetes,
    clientes,
    entregas,
    cobros
  });

  const handleRefresh = async () => {
    if (!onRefreshData) return;
    try {
      setIsRefreshing(true);
      await onRefreshData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div
      className="cmd-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#f8fafc'
      }}
    >
      {/* 1. BARRA SUPERIOR: CENTRO DE COMANDO & ACCIONES */}
      <DashboardHeader
        timeFilter={timeFilter}
        onChangeTimeFilter={setTimeFilter}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onNewPackage={onNewPackage}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. GRILLA DE KPIs EJECUTIVOS MAESTROS (FINANZAS, VOLUMEN, ALMACÉN, CLIENTES) */}
      <ExecutiveKpiGrid
        kpis={kpis}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. TAREAS DIARIAS CRÍTICAS & PRIORIDADES OPERATIVAS DEL DÍA */}
      <DailyTasksSection
        tasks={dailyTasks}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. GRÁFICOS ANALÍTICOS: OCUPACIÓN WMS, CANALES DE ENVÍO Y MEDIOS DE PAGO */}
      <AnalyticsChartsSection
        shelfStats={shelfStats}
        paymentStats={paymentStats}
        deliveryChannels={deliveryChannels}
        packageTypes={packageTypes}
        onNavigateTab={onNavigateTab}
      />

      {/* 5. CONSOLA DE RASTREO EN VIVO DE WRs & BULTOS */}
      <LivePackagesStream
        paquetes={filteredPaquetes}
        allPaquetesCount={paquetes.length}
        linceCount={kpis.paquetesEnLince}
        rutaCount={kpis.paquetesEnRuta}
        miamiCount={kpis.paquetesEnMiami}
        entregadosCount={kpis.paquetesEntregados}
        packageFilter={packageFilter}
        onChangeFilter={setPackageFilter}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        onPrintLabel={onPrintLabel}
        onViewPdf={onViewPdf}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
}
