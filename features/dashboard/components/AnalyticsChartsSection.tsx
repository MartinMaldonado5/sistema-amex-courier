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
        padding: '8px 18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '12px',
        flexShrink: 0
      }}
    >
      {/* 1. OCUPACIÓN DE ANAQUELES WMS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers style={{ width: '16px', height: '16px', color: '#7c3aed' }} />
              Ocupación de Anaqueles (Almacén Lince)
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('mm-lince')}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>Ver WMS</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {shelfStats.map(shelf => {
              const isHigh = shelf.percentage >= 80;
              const barColor = isHigh ? '#dc2626' : shelf.color;

              return (
                <div key={shelf.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11.5px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#1e293b' }}>{shelf.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                        {shelf.count} / {shelf.capacity}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: isHigh ? '#fee2e2' : '#f1f5f9',
                          color: isHigh ? '#dc2626' : '#475569'
                        }}
                      >
                        {shelf.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: barColor,
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${shelf.percentage}%`,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
          <span>Capacidad total estimada: 440 bultos</span>
          <span style={{ fontWeight: 700, color: '#059669' }}>Slotting dinámico</span>
        </div>
      </div>

      {/* 2. CANALES DE ENTREGA & ENVÍOS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Truck style={{ width: '16px', height: '16px', color: '#0284c7' }} />
              Canales de Distribución & Envíos
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('shp-deliveries')}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>Ver Rutas</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deliveryChannels.map(channel => (
              <div key={channel.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11.5px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{channel.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                      {channel.count} paquetes
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
                      ({channel.percentage}%)
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: channel.color,
                      height: '100%',
                      borderRadius: '9999px',
                      width: `${channel.percentage}%`,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desglose de tipos de empaque */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
              Tipos de Bulto Registrados
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {packageTypes.map(pt => (
                <div
                  key={pt.type}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: pt.color }} />
                  <span>{pt.label}:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{pt.count}</strong>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>({pt.totalWeightKg}kg)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONCILIACIÓN DE PAGOS & MEDIOS DE COBRO */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard style={{ width: '16px', height: '16px', color: '#059669' }} />
              Canales de Recaudación (Medios de Pago)
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('fico-cobros')}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <span>Ver Vouchers</span>
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </button>
          </div>

          {paymentStats.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <CreditCard style={{ width: '28px', height: '28px', color: '#cbd5e1', margin: '0 auto 6px' }} />
              <p style={{ fontSize: '11.5px', fontWeight: 700, margin: 0, color: '#64748b' }}>
                Sin vouchers registrados en este periodo
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentStats.map(pm => (
                <div key={pm.method}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '11.5px', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pm.color }} />
                      <strong style={{ color: '#1e293b' }}>{pm.label}</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>({pm.count} ops)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#064e3b' }}>
                        S/ {pm.totalSoles.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>
                        {pm.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '7px', overflow: 'hidden' }}>
                    <div
                      style={{
                        background: pm.color,
                        height: '100%',
                        borderRadius: '9999px',
                        width: `${pm.percentage}%`,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
          <span>Moneda principal: Soles (PEN)</span>
          <span style={{ fontWeight: 700, color: '#059669' }}>Auditoría activa</span>
        </div>
      </div>
    </div>
  );
}
