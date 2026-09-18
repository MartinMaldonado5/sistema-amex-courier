'use client';

import React from 'react';
import {
  Layers,
  Truck,
  CreditCard,
  Package,
  TrendingUp,
  ArrowRight,
  Store,
  MapPin
} from 'lucide-react';
import {
  ShelfCapacityStat,
  PaymentMethodStat,
  DeliveryChannelStat,
  PackageTypeStat
} from '../types';

interface AnalyticsChartsSectionProps {
  shelfStats: ShelfCapacityStat[];
  paymentStats: PaymentMethodStat[];
  deliveryChannels: DeliveryChannelStat[];
  packageTypes: PackageTypeStat[];
  onNavigateTab: (tabId: string) => void;
}

export function AnalyticsChartsSection({
  shelfStats,
  paymentStats,
  deliveryChannels,
  packageTypes,
  onNavigateTab
}: AnalyticsChartsSectionProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        flexShrink: 0
      }}
    >
      {/* 1. OCUPACIÓN DE ANAQUELES WMS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers style={{ width: '16px', height: '16px', color: '#64748b' }} />
              Ocupación WMS · Almacén Lince
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('mm-lince')}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Ver WMS</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shelfStats.map(shelf => {
              const isHigh = shelf.percentage >= 85;

              return (
                <div key={shelf.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>{shelf.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {shelf.count} / {shelf.capacity}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isHigh ? '#fef2f2' : '#f1f5f9',
                          color: isHigh ? '#ef4444' : '#64748b'
                        }}
                      >
                        {shelf.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: isHigh ? '#ef4444' : '#2563eb',
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${shelf.percentage}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <span>Capacidad total: 440 bultos</span>
          <span style={{ fontWeight: 500, color: '#0f172a' }}>Slotting dinámico</span>
        </div>
      </div>

      {/* 2. CANALES DE DISTRIBUCIÓN & TIPOS DE BULTO */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck style={{ width: '16px', height: '16px', color: '#64748b' }} />
              Canales de Distribución & Envíos
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {deliveryChannels.map(channel => (
              <div key={channel.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500, color: '#0f172a' }}>{channel.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                      {channel.count} bultos
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                      ({channel.percentage}%)
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: '#334155',
                      height: '100%',
                      borderRadius: '9999px',
                      width: `${channel.percentage}%`,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desglose de tipos de bulto */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Clasificación de Empaques
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {packageTypes.map(pt => (
                <div
                  key={pt.type}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                  <span>{pt.label}:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{pt.count}</strong>
                  <span style={{ color: '#94a3b8' }}>({pt.totalWeightKg}kg)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECAUDACIÓN POR MEDIO DE PAGO */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard style={{ width: '16px', height: '16px', color: '#64748b' }} />
              Canales de Recaudación (Vouchers)
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('fico-cobros')}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Ver Vouchers</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          {paymentStats.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <CreditCard style={{ width: '28px', height: '28px', color: '#cbd5e1', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', fontWeight: 500, margin: 0, color: '#64748b' }}>
                Sin comprobantes conciliados en este rango
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {paymentStats.map(pm => (
                <div key={pm.method}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12px', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
                      <span style={{ color: '#0f172a', fontWeight: 500 }}>{pm.label}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>({pm.count} ops)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        S/ {pm.totalSoles.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                        {pm.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: '#334155',
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${pm.percentage}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <span>Moneda principal: Soles (PEN)</span>
          <span style={{ fontWeight: 500, color: '#0f172a' }}>Auditoría activa</span>
        </div>
      </div>
    </div>
  );
}
