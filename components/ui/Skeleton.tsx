'use client';

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'rectangular' | 'circular' | 'rounded';
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Componente base de Skeleton con Shimmer adaptativo y fluido (Light & Dark)
 */
export function Skeleton({
  className = '',
  width,
  height,
  borderRadius,
  variant = 'rounded',
  theme = 'auto',
  style,
  ...props
}: SkeletonProps) {
  const defaultRadius =
    variant === 'circular' ? '9999px' : variant === 'rounded' ? '8px' : '0px';

  const themeClass = theme === 'dark' ? 'dark' : '';

  return (
    <div
      className={`skeleton-shimmer ${themeClass} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        borderRadius: borderRadius ?? defaultRadius,
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style
      }}
      {...props}
    />
  );
}

// ============================================================================
// COMPONENTES AUXILIARES DE SKELETON
// ============================================================================

/**
 * Skeleton para tarjetas KPI adaptables a tema claro u oscuro
 */
export function KpiCardsSkeleton({
  count = 4,
  theme = 'auto'
}: {
  count?: number;
  theme?: 'light' | 'dark' | 'auto';
}) {
  const isDark = theme === 'dark';

  return (
    <div className="skeleton-grid-kpi-auto">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={isDark ? 'skeleton-card-dark' : 'skeleton-card-light'}
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="45%" height="12px" borderRadius="4px" theme={theme} />
            <Skeleton width="28px" height="28px" variant="rounded" borderRadius="8px" theme={theme} />
          </div>
          <Skeleton width="65%" height="26px" borderRadius="6px" theme={theme} />
          <Skeleton width="55%" height="11px" borderRadius="4px" theme={theme} />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tablas de datos (Responsive con scroll horizontal y soporte claro/oscuro)
 */
export function TableSkeleton({
  rows = 5,
  columns = 7,
  showHeader = true,
  theme = 'auto'
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={isDark ? 'skeleton-card-dark' : 'skeleton-card-light'}
      style={{
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: columns > 5 ? '720px' : '100%' }}>
          {showHeader && (
            <div
              style={{
                background: isDark ? 'rgba(14, 20, 34, 0.85)' : '#f8fafc',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                padding: '12px 16px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                  key={i}
                  height="13px"
                  width={i === 0 ? '40px' : i === 1 ? '120px' : i === 2 ? '140px' : '100px'}
                  borderRadius="4px"
                  theme={theme}
                  style={{ flex: i === 2 ? 2 : 1 }}
                />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <div
                key={rIdx}
                style={{
                  padding: '12px 16px',
                  borderBottom: rIdx < rows - 1 ? (isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9') : 'none',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <Skeleton
                    key={cIdx}
                    height="16px"
                    width={
                      cIdx === 0
                        ? '32px'
                        : cIdx === 1
                        ? '90px'
                        : cIdx === 2
                        ? '140px'
                        : cIdx === columns - 1
                        ? '70px'
                        : '100px'
                    }
                    borderRadius="6px"
                    theme={theme}
                    style={{ flex: cIdx === 2 ? 2 : 1 }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton para la Matriz Visual de Anaqueles WMS
 */
export function MatrixSkeleton({ shelvesCount = 3 }: { shelvesCount?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
      {Array.from({ length: shelvesCount }).map((_, sIdx) => (
        <div
          key={sIdx}
          className="skeleton-card-light"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '10px'
            }}
          >
            <Skeleton width="130px" height="18px" borderRadius="6px" />
            <Skeleton width="70px" height="20px" borderRadius="6px" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 3 }).map((_, fIdx) => (
              <div
                key={fIdx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Skeleton width="110px" height="13px" />
                  <Skeleton width="40px" height="13px" />
                </div>
                <Skeleton width="100%" height="7px" borderRadius="999px" />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Skeleton width="55px" height="18px" borderRadius="4px" />
                  <Skeleton width="55px" height="18px" borderRadius="4px" />
                  <Skeleton width="55px" height="18px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SKELETONS DEDICADOS POR MÓDULO (PROFESIONALES & ULTRA REALISTAS)
// ============================================================================

/**
 * 1. SKELETON: DASHBOARD / PANEL OPERATIVO
 */
export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width="180px" height="12px" />
          <Skeleton width="280px" height="26px" borderRadius="8px" />
          <Skeleton width="340px" height="13px" />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Skeleton width="120px" height="38px" borderRadius="8px" />
          <Skeleton width="130px" height="38px" borderRadius="8px" />
        </div>
      </div>

      {/* 4 KPIs */}
      <KpiCardsSkeleton count={4} />

      {/* Barra de Acceso Rápido */}
      <div className="skeleton-card-light" style={{ padding: '12px 16px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="130px" height="32px" borderRadius="8px" style={{ flexShrink: 0 }} />
        ))}
      </div>

      {/* Grid Principal 2 Columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="skeleton-card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="160px" height="18px" borderRadius="6px" />
          <Skeleton width="100%" height="180px" borderRadius="10px" />
        </div>
        <div className="skeleton-card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="180px" height="18px" borderRadius="6px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Skeleton width="40%" height="14px" />
                <Skeleton width="25%" height="14px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Reciente */}
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

/**
 * 2. SKELETON: COTEJO & PISTOLEO LIVE (SHEETS)
 */
export function LiveSheetsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Cabecera con Sync Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton width="80px" height="20px" borderRadius="12px" />
            <Skeleton width="220px" height="24px" borderRadius="6px" />
          </div>
          <Skeleton width="280px" height="12px" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="110px" height="34px" borderRadius="8px" />
          <Skeleton width="100px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* Pistoleo Hero Box */}
      <div style={{ background: '#0f172a', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width="34px" height="34px" variant="circular" theme="dark" />
        <Skeleton width="100%" height="34px" borderRadius="8px" theme="dark" style={{ flex: 1 }} />
        <Skeleton width="90px" height="34px" borderRadius="8px" theme="dark" />
      </div>

      {/* Stats Bar & Progress */}
      <div className="skeleton-card-light" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <Skeleton width="85px" height="22px" borderRadius="6px" />
          <Skeleton width="95px" height="22px" borderRadius="6px" />
          <Skeleton width="80px" height="22px" borderRadius="6px" />
        </div>
        <Skeleton width="180px" height="12px" borderRadius="999px" />
      </div>

      {/* Spreadsheet Dense Table */}
      <TableSkeleton rows={8} columns={9} />
    </div>
  );
}

/**
 * 3. SKELETON: ALMACÉN CENTRAL (LINCE) / INVENTARIO
 */
export function InventorySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width="160px" height="12px" />
          <Skeleton width="260px" height="26px" borderRadius="8px" />
          <Skeleton width="320px" height="13px" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="130px" height="38px" borderRadius="8px" />
        </div>
      </div>

      {/* Visual Shelves Slotting */}
      <MatrixSkeleton shelvesCount={3} />

      {/* Search & Filter bar */}
      <div className="skeleton-card-light" style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Skeleton width="280px" height="36px" borderRadius="8px" style={{ flex: '1 1 200px' }} />
        <Skeleton width="120px" height="36px" borderRadius="8px" />
        <Skeleton width="120px" height="36px" borderRadius="8px" />
      </div>

      {/* Table */}
      <TableSkeleton rows={6} columns={8} />
    </div>
  );
}

/**
 * 4. SKELETON: ENTREGAS & BÚSQUEDA WR
 */
export function EntregasSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Big Search Hero Card */}
      <div className="skeleton-card-light" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="220px" height="20px" borderRadius="6px" />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Skeleton width="100%" height="46px" borderRadius="10px" style={{ flex: '1 1 280px' }} />
          <Skeleton width="120px" height="46px" borderRadius="10px" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="110px" height="32px" borderRadius="20px" style={{ flexShrink: 0 }} />
        ))}
      </div>

      {/* Cards List or Table */}
      <TableSkeleton rows={6} columns={7} />
    </div>
  );
}

/**
 * 5. SKELETON: COBROS & VOUCHERS (FICO)
 */
export function CobrosSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width="150px" height="12px" />
          <Skeleton width="250px" height="26px" borderRadius="8px" />
        </div>
        <Skeleton width="140px" height="36px" borderRadius="8px" />
      </div>

      {/* 3 Financial KPIs */}
      <KpiCardsSkeleton count={3} />

      {/* Voucher Upload & Audit Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
        <div className="skeleton-card-light" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Skeleton width="50px" height="50px" variant="circular" />
          <Skeleton width="180px" height="16px" borderRadius="4px" />
          <Skeleton width="240px" height="12px" borderRadius="4px" />
        </div>
        <div className="skeleton-card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton width="150px" height="16px" borderRadius="4px" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <Skeleton width="45%" height="14px" />
              <Skeleton width="25%" height="14px" />
            </div>
          ))}
        </div>
      </div>

      {/* Billing Table */}
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

/**
 * 6. SKELETON: DESPACHO CARRO AMEX
 */
export function DeliveriesSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Route Header */}
      <div className="skeleton-card-light" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton width="44px" height="44px" variant="rounded" borderRadius="10px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="180px" height="20px" borderRadius="6px" />
            <Skeleton width="260px" height="12px" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="110px" height="34px" borderRadius="8px" />
          <Skeleton width="130px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* Stops Manifest Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card-light" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Skeleton width="28px" height="28px" variant="circular" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' }}>
              <Skeleton width="60%" height="16px" borderRadius="4px" />
              <Skeleton width="40%" height="12px" borderRadius="4px" />
            </div>
            <Skeleton width="90px" height="24px" borderRadius="12px" />
            <Skeleton width="80px" height="32px" borderRadius="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. SKELETON: PICKING SHALOM / OLVA
 */
export function PickingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Agency Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="120px" height="36px" borderRadius="10px" />
          <Skeleton width="110px" height="36px" borderRadius="10px" />
        </div>
        <Skeleton width="140px" height="34px" borderRadius="8px" />
      </div>

      {/* Progress Card */}
      <div className="skeleton-card-light" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="140px" height="14px" />
          <Skeleton width="50px" height="14px" />
        </div>
        <Skeleton width="100%" height="8px" borderRadius="999px" />
      </div>

      {/* Checklist items table */}
      <TableSkeleton rows={6} columns={7} />
    </div>
  );
}

/**
 * 8. SKELETON: ESCÁNER DE CÓDIGOS (MOBILE & DESKTOP SCANNER)
 */
export function ScannerSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Skeleton width="190px" height="22px" borderRadius="6px" />
          <Skeleton width="280px" height="12px" />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Skeleton width="34px" height="34px" borderRadius="8px" />
          <Skeleton width="34px" height="34px" borderRadius="8px" />
        </div>
      </div>

      {/* Grid: Viewfinder Camera vs Right Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Camera Simulation Frame */}
        <div className="skeleton-card-light" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', background: '#0f172a', borderRadius: '16px', gap: '16px' }}>
          <Skeleton width="80px" height="80px" variant="circular" theme="dark" />
          <Skeleton width="200px" height="14px" borderRadius="4px" theme="dark" />
          <Skeleton width="70%" height="2px" theme="dark" />
        </div>

        {/* Target Shelf & Scan Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="skeleton-card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton width="140px" height="16px" />
            <Skeleton width="100%" height="40px" borderRadius="8px" />
          </div>
          <div className="skeleton-card-light" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Skeleton width="160px" height="16px" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <Skeleton width="35%" height="13px" />
                <Skeleton width="30%" height="13px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 9. SKELETON: PROCESADOR DE DNI (DNI MATRIX) - 100% TEMA OSCURO
 */
export function DniMatrixSkeleton() {
  return (
    <div className="skeleton-dark-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', padding: '14px 16px 60px 16px', boxSizing: 'border-box' }}>
      {/* Header Dark */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton width="80px" height="22px" borderRadius="20px" theme="dark" />
            <Skeleton width="220px" height="24px" borderRadius="6px" theme="dark" />
          </div>
          <Skeleton width="320px" height="12px" theme="dark" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="110px" height="36px" borderRadius="8px" theme="dark" />
          <Skeleton width="130px" height="36px" borderRadius="8px" theme="dark" />
        </div>
      </div>

      {/* 10 Cupos Slots Horizontal Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} width="80px" height="34px" borderRadius="8px" theme="dark" style={{ flexShrink: 0 }} />
        ))}
      </div>

      {/* Dual Card Preview: Anverso & Reverso */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="skeleton-card-dark" style={{ height: '220px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Skeleton width="120px" height="16px" theme="dark" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width="80px" height="50px" borderRadius="6px" theme="dark" />
          </div>
          <Skeleton width="90px" height="24px" borderRadius="6px" theme="dark" />
        </div>
        <div className="skeleton-card-dark" style={{ height: '220px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Skeleton width="120px" height="16px" theme="dark" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Skeleton width="80px" height="50px" borderRadius="6px" theme="dark" />
          </div>
          <Skeleton width="90px" height="24px" borderRadius="6px" theme="dark" />
        </div>
      </div>

      {/* AI Extraction Data Card */}
      <div className="skeleton-card-dark" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="180px" height="18px" theme="dark" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <Skeleton width="100%" height="34px" borderRadius="6px" theme="dark" />
          <Skeleton width="100%" height="34px" borderRadius="6px" theme="dark" />
          <Skeleton width="100%" height="34px" borderRadius="6px" theme="dark" />
        </div>
      </div>
    </div>
  );
}

/**
 * 10. SKELETON: RÓTULOS AGENCIAS (ROTULOS A4) - 100% TEMA OSCURO
 */
export function RotulosA4Skeleton() {
  return (
    <div className="skeleton-dark-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', padding: '16px 20px 60px 20px', boxSizing: 'border-box' }}>
      {/* Header Dark */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton width="80px" height="22px" borderRadius="20px" theme="dark" />
            <Skeleton width="230px" height="24px" borderRadius="6px" theme="dark" />
          </div>
          <Skeleton width="320px" height="12px" theme="dark" />
        </div>
        <Skeleton width="140px" height="38px" borderRadius="8px" theme="dark" />
      </div>

      {/* Agency Selector Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width="100px" height="36px" borderRadius="20px" theme="dark" style={{ flexShrink: 0 }} />
        ))}
      </div>

      {/* Split: Left Form vs Right A4 Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="skeleton-card-dark" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="140px" height="16px" theme="dark" />
          <Skeleton width="100%" height="36px" borderRadius="6px" theme="dark" />
          <Skeleton width="100%" height="36px" borderRadius="6px" theme="dark" />
          <Skeleton width="100%" height="36px" borderRadius="6px" theme="dark" />
          <Skeleton width="120px" height="38px" borderRadius="8px" theme="dark" />
        </div>
        <div className="skeleton-card-dark" style={{ padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '280px', gap: '14px' }}>
          <Skeleton width="75%" height="160px" borderRadius="8px" theme="dark" />
          <Skeleton width="140px" height="14px" theme="dark" />
        </div>
      </div>
    </div>
  );
}

/**
 * 11. SKELETON: BOLETAS DE SHALOM - 100% TEMA OSCURO
 */
export function BoletasShalomSkeleton() {
  return (
    <div className="skeleton-dark-container" style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', padding: '18px 24px 60px 24px', boxSizing: 'border-box' }}>
      {/* Header Shalom */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Skeleton width="85px" height="22px" borderRadius="20px" theme="dark" />
            <Skeleton width="210px" height="26px" borderRadius="8px" theme="dark" />
          </div>
          <Skeleton width="380px" height="13px" theme="dark" />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="105px" height="36px" borderRadius="8px" theme="dark" />
          <Skeleton width="160px" height="36px" borderRadius="8px" theme="dark" />
        </div>
      </div>

      {/* 4 KPIs Shalom Oscuros */}
      <KpiCardsSkeleton count={4} theme="dark" />

      {/* Filter Bar Shalom */}
      <div className="skeleton-card-dark" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="100%" height="38px" borderRadius="8px" theme="dark" />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Skeleton width="90px" height="32px" borderRadius="6px" theme="dark" />
          <Skeleton width="130px" height="32px" borderRadius="6px" theme="dark" />
          <Skeleton width="110px" height="32px" borderRadius="6px" theme="dark" />
          <Skeleton width="140px" height="32px" borderRadius="6px" theme="dark" />
          <Skeleton width="110px" height="32px" borderRadius="6px" theme="dark" />
        </div>
      </div>

      {/* Table Shalom Dark */}
      <ShalomTableSkeleton rows={6} />
    </div>
  );
}

/**
 * Skeleton dedicado para la tabla de Shalom durante filtros y búsquedas
 */
export function ShalomTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-card-dark" style={{ overflow: 'hidden', width: '100%' }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: '820px' }}>
          {/* Header Row */}
          <div style={{ background: 'rgba(14, 20, 34, 0.85)', padding: '12px 16px', display: 'flex', gap: '14px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Skeleton width="120px" height="12px" borderRadius="4px" theme="dark" />
            <Skeleton width="180px" height="12px" borderRadius="4px" theme="dark" style={{ flex: 1.5 }} />
            <Skeleton width="140px" height="12px" borderRadius="4px" theme="dark" style={{ flex: 1.2 }} />
            <Skeleton width="120px" height="12px" borderRadius="4px" theme="dark" />
            <Skeleton width="100px" height="12px" borderRadius="4px" theme="dark" />
            <Skeleton width="90px" height="12px" borderRadius="4px" theme="dark" />
            <Skeleton width="70px" height="12px" borderRadius="4px" theme="dark" />
          </div>

          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center',
                borderBottom: i < rows - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '120px' }}>
                <Skeleton width="95px" height="15px" borderRadius="4px" theme="dark" />
                <Skeleton width="65px" height="10px" borderRadius="4px" theme="dark" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1.5 }}>
                <Skeleton width="80%" height="15px" borderRadius="4px" theme="dark" />
                <Skeleton width="50%" height="11px" borderRadius="4px" theme="dark" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1.2 }}>
                <Skeleton width="70%" height="14px" borderRadius="4px" theme="dark" />
                <Skeleton width="45%" height="10px" borderRadius="4px" theme="dark" />
              </div>
              <Skeleton width="110px" height="14px" borderRadius="4px" theme="dark" />
              <Skeleton width="90px" height="22px" borderRadius="12px" theme="dark" />
              <Skeleton width="75px" height="16px" borderRadius="4px" theme="dark" />
              <div style={{ display: 'flex', gap: '6px' }}>
                <Skeleton width="28px" height="28px" borderRadius="6px" theme="dark" />
                <Skeleton width="28px" height="28px" borderRadius="6px" theme="dark" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Enrutador inteligente de Skeletons: renderiza el skeleton exacto según el tab activo
 */
export function PageSkeleton({ activeTab, tab }: { activeTab?: string; tab?: string }) {
  const current = (activeTab || tab || 'dashboard').trim().toLowerCase();

  switch (current) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'live-sheets':
      return <LiveSheetsSkeleton />;
    case 'mm-lince':
    case 'mm-inventory':
      return <InventorySkeleton />;
    case 'shp-entregas':
      return <EntregasSkeleton />;
    case 'fico-cobros':
      return <CobrosSkeleton />;
    case 'shp-deliveries':
      return <DeliveriesSkeleton />;
    case 'wms-picking':
      return <PickingSkeleton />;
    case 'mobile-scanner':
      return <ScannerSkeleton />;
    case 'dni-matrix':
      return <DniMatrixSkeleton />;
    case 'rotulos-a4':
      return <RotulosA4Skeleton />;
    case 'boletas-shalom':
      return <BoletasShalomSkeleton />;
    default:
      return <DashboardSkeleton />;
  }
}
