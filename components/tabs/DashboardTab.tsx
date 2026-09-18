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
        background: '#f8fafc',
        padding: '24px 32px',
        gap: '24px',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. CABECERA OPERATIVA: ESTADO DEL SISTEMA & ACCIONES PRINCIPALES */}
      <DashboardHeader
        timeFilter={timeFilter}
        onChangeTimeFilter={setTimeFilter}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onNewPackage={onNewPackage}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. GRID DE KPIS OPERATIVOS (CON MÉTRICA REINA EN RATIO 2.5X) */}
      <ExecutiveKpiGrid
        kpis={kpis}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. TAREAS OPERATIVAS DIARIAS & PRIORIDADES */}
      <DailyTasksSection
        tasks={dailyTasks}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. SECCIÓN ANALÍTICA: CAPACIDAD WMS, CANALES & RECAUDACIÓN */}
      <AnalyticsChartsSection
        shelfStats={shelfStats}
        paymentStats={paymentStats}
        deliveryChannels={deliveryChannels}
        packageTypes={packageTypes}
        onNavigateTab={onNavigateTab}
      />

      {/* 5. FLUJO OPERATIVO EN VIVO: CONSOLA DE RASTREO WRs */}
      <LivePackagesStream
        paquetes={filteredPaquetes}
        allPaquetesCount={paquetes.length}
        linceCount={kpis.paquetesEnLince}
        rutaCount={kpis.paquetesEnRuta}
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
