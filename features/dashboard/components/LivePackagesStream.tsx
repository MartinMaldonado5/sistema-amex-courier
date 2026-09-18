'use client';

import React from 'react';
import {
  Package,
  Search,
  Printer,
  FileText,
  ChevronRight,
  ExternalLink,
  MapPin,
  Truck,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Paquete } from '@/types';
import { PackageStatusFilter } from '../types';

interface LivePackagesStreamProps {
  paquetes: Paquete[];
  allPaquetesCount: number;
  linceCount: number;
  rutaCount: number;
  entregadosCount: number;
  packageFilter: PackageStatusFilter;
  onChangeFilter: (filter: PackageStatusFilter) => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  onPrintLabel: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export function LivePackagesStream({
  paquetes,
  allPaquetesCount,
  linceCount,
  rutaCount,
  entregadosCount,
  packageFilter,
  onChangeFilter,
  searchQuery,
  onChangeSearch,
  onPrintLabel,
  onViewPdf,
  onNavigateTab
}: LivePackagesStreamProps) {
  const getDeliveryMethodBadge = (metodo?: string) => {
    switch (metodo) {
      case 'CarroAmexDomicilio':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Truck style={{ width: '12px', height: '12px', color: '#64748b' }} />
            Carro AMEX
          </span>
        );
      case 'AgenciaProvincia':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MapPin style={{ width: '12px', height: '12px', color: '#64748b' }} />
            Agencia Provincia
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Store style={{ width: '12px', height: '12px', color: '#64748b' }} />
            Recojo Lince
          </span>
        );
    }
  };

  const getStatusBadge = (estado?: string) => {
    switch (estado) {
      case 'EnRutaCarroAmex':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
            En Ruta
          </span>
        );
      case 'Entregado':
      case 'EntregadoDomicilio':
      case 'RecogidoAlmacen':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Entregado
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b' }} />
            En Almacén
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '380px',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Cabecera con Segmented Filter y Buscador */}
      <div
        style={{
          padding: '16px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}
      >
        {/* Pestañas de Filtro Rápido (Segmented Control) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid #e2e8f0',
            gap: '2px',
            overflowX: 'auto'
          }}
        >
          {[
            { key: 'ALL', label: 'Todos', count: allPaquetesCount },
            { key: 'LINCE', label: 'En Almacén Lince', count: linceCount },
            { key: 'EN_RUTA', label: 'En Ruta', count: rutaCount },
            { key: 'ENTREGADO', label: 'Entregados', count: entregadosCount }
          ].map(f => {
            const isActive = packageFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onChangeFilter(f.key as PackageStatusFilter)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                  cursor: 'pointer',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease'
                }}
              >
                <span>{f.label}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: isActive ? '#0f172a' : '#94a3b8'
                  }}
                >
                  ({f.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador de Alta Fidelidad */}
        <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
          <Search
            style={{
              width: '16px',
              height: '16px',
              color: '#94a3b8',
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onChangeSearch(e.target.value)}
            placeholder="Buscar WR#, Tracking, Cliente..."
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 400,
              color: '#0f172a',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Lista / Tabla de Bultos */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: '280px', maxHeight: '440px' }}>
        {paquetes.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <Package style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              No se encontraron registros
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              Ajusta los filtros seleccionados o registra un nuevo recibo de bodega (WR)
            </p>
          </div>
        ) : (
          <div>
            {paquetes.slice(0, 60).map(pkg => {
              return (
                <div
                  key={pkg.id}
                  style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'background 0.12s ease'
                  }}
                  className="hover:bg-slate-50"
                >
                  {/* Identidad del Paquete y Consignatario */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {pkg.tipoEmpaque === 'SOBRE' ? (
                        <FileText style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <Package style={{ width: '16px', height: '16px' }} />
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          {pkg.numeroReciboBodega}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            fontWeight: 500,
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {pkg.codigoCasillero}
                        </span>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {pkg.nombreConsignatario || 'Cliente AMEX'}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '4px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {pkg.pesoKg ? `${pkg.pesoKg} kg` : '0.0 kg'}
                        </span>
                        <span>•</span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: '#0f172a',
                            background: '#f8fafc',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {pkg.posicionEstante || 'A1-P1'}
                        </span>
                        <span>•</span>
                        {getDeliveryMethodBadge(pkg.metodoEntrega)}
                        <span>•</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                          {pkg.descripcion || 'Mercancía general'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado Operativo & Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {getStatusBadge(pkg.estadoEntrega)}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onPrintLabel(pkg)}
                        style={{
                          padding: '6px 10px',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          color: '#334155',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          transition: 'background 0.12s ease'
                        }}
                        title="Imprimir Etiqueta Térmica"
                        className="hover:bg-slate-50"
                      >
                        <Printer style={{ width: '13px', height: '13px', color: '#64748b' }} />
                        <span className="hidden sm:inline">Ticket</span>
                      </button>

                      {pkg.facturaPdfUrl && (
                        <button
                          type="button"
                          onClick={() => onViewPdf(pkg.facturaPdfUrl || '')}
                          style={{
                            padding: '6px 10px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#334155',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            transition: 'background 0.12s ease'
                          }}
                          title="Ver Factura PDF en Cloudflare R2"
                          className="hover:bg-slate-50"
                        >
                          <FileText style={{ width: '13px', height: '13px', color: '#64748b' }} />
                          <span className="hidden sm:inline">PDF</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onNavigateTab('mm-lince')}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          borderRadius: '6px'
                        }}
                        title="Ver en Almacén Lince"
                        className="hover:text-slate-900"
                      >
                        <ChevronRight style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
