'use client';

import React from 'react';
import { Package, Calendar } from 'lucide-react';
import { StatsState } from '../types';

interface ShalomKpiGridProps {
  stats: StatsState;
}

export const ShalomKpiGrid: React.FC<ShalomKpiGridProps> = ({ stats }) => {
  return (
    <div className="shalom-kpi-grid">
      <div className="shalom-kpi-card">
        <div className="shalom-kpi-icon blue">
          <Package size={22} />
        </div>
        <div className="shalom-kpi-content">
          <span className="shalom-kpi-label">Boletas Hoy</span>
          <span className="shalom-kpi-value">{stats.totalHoy}</span>
          <span className="shalom-kpi-sub">Registradas hoy</span>
        </div>
      </div>

      <div className="shalom-kpi-card">
        <div className="shalom-kpi-icon emerald">
          <Calendar size={22} />
        </div>
        <div className="shalom-kpi-content">
          <span className="shalom-kpi-label">Boletas Este Mes</span>
          <span className="shalom-kpi-value">{stats.totalMes}</span>
          <span className="shalom-kpi-sub">Total acumulado mensual</span>
        </div>
      </div>
    </div>
  );
};
