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
  miamiCount: number;
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
  miamiCount,
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
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              background: '#faf5ff',
              color: '#7e22ce',
              border: '1px solid #f3e8ff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Truck style={{ width: '10px', height: '10px' }} />
            Carro AMEX
          </span>
        );
      case 'AgenciaProvincia':
        return (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <MapPin style={{ width: '10px', height: '10px' }} />
            Agencia Prov.
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Store style={{ width: '10px', height: '10px' }} />
            Recojo Lince
          </span>
        );
    }
  };

  const getStatusBadge = (estado?: string) => {
    switch (estado) {
      case 'EnRutaCarroAmex':
        return (
          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, background: '#faf5ff', color: '#9333ea', border: '1px solid #f3e8ff' }}>
            En Ruta
          </span>
        );
      case 'Entregado':
      case 'EntregadoDomicilio':
      case 'RecogidoAlmacen':
        return (
          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            Entregado
          </span>
        );
      default:
        return (
          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
            En Almacén
          </span>
        );
    }
  };

  return (
    <div
      style={{
        padding: '8px 18px 24px 18px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '380px',
        flexShrink: 0
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '360px',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera con pestañas y buscador */}
        <div
          style={{
            padding: '12px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            flexShrink: 0
          }}
        >
          {/* Pestañas de Filtro Rápido */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <button
              type="button"
              onClick={() => onChangeFilter('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: packageFilter === 'ALL' ? '#0f172a' : '#ffffff',
                color: packageFilter === 'ALL' ? '#ffffff' : '#475569',
                boxShadow: packageFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: packageFilter === 'ALL' ? '#0f172a' : '#e2e8f0'
              }}
            >
              Todos ({allPaquetesCount})
            </button>

            <button
              type="button"
              onClick={() => onChangeFilter('LINCE')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: packageFilter === 'LINCE' ? '#2563eb' : '#eff6ff',
                color: packageFilter === 'LINCE' ? '#ffffff' : '#1e40af',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: packageFilter === 'LINCE' ? '#2563eb' : '#bfdbfe'
              }}
            >
              En Almacén Lince ({linceCount})
            </button>

            <button
              type="button"
              onClick={() => onChangeFilter('EN_RUTA')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: packageFilter === 'EN_RUTA' ? '#7c3aed' : '#faf5ff',
                color: packageFilter === 'EN_RUTA' ? '#ffffff' : '#6b21a8',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: packageFilter === 'EN_RUTA' ? '#7c3aed' : '#e9d5ff'
              }}
            >
              En Ruta Carro ({rutaCount})
            </button>

            <button
              type="button"
              onClick={() => onChangeFilter('MIAMI')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: packageFilter === 'MIAMI' ? '#0284c7' : '#f0f9ff',
                color: packageFilter === 'MIAMI' ? '#ffffff' : '#0369a1',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: packageFilter === 'MIAMI' ? '#0284c7' : '#bae6fd'
              }}
            >
              Miami Hub ({miamiCount})
            </button>

            <button
              type="button"
              onClick={() => onChangeFilter('ENTREGADO')}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                background: packageFilter === 'ENTREGADO' ? '#059669' : '#ecfdf5',
                color: packageFilter === 'ENTREGADO' ? '#ffffff' : '#065f46',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: packageFilter === 'ENTREGADO' ? '#059669' : '#a7f3d0'
              }}
            >
              Entregados ({entregadosCount})
            </button>
          </div>

          {/* Buscador Rápido */}
          <div style={{ position: 'relative', width: '240px', flexShrink: 0 }}>
            <Search
              style={{
                width: '14px',
                height: '14px',
                color: '#94a3b8',
                position: 'absolute',
                left: '10px',
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
                paddingLeft: '32px',
                paddingRight: '10px',
                paddingTop: '6px',
                paddingBottom: '6px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
          </div>
        </div>

        {/* Lista con Scroll de Bultos */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '260px', maxHeight: '420px' }}>
          {paquetes.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Package style={{ width: '40px', height: '40px', color: '#cbd5e1', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#475569', margin: 0 }}>
                No se encontraron paquetes
              </p>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Ajusta los filtros seleccionados o registra un nuevo recibo de bodega (WR)
              </p>
            </div>
          ) : (
            <div>
              {paquetes.slice(0, 60).map(pkg => {
                const isLince = pkg.ubicacionActual === 'AmexLince' || pkg.estadoEntrega === 'EnAlmacen';
                const isMiami = pkg.ubicacionActual === 'TibCourierMiami';

                return (
                  <div
                    key={pkg.id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'background 0.12s ease'
                    }}
                    className="hover:bg-slate-50"
                  >
                    {/* Información Principal */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          flexShrink: 0,
                          background: isLince ? '#eff6ff' : isMiami ? '#f0f9ff' : '#ecfdf5',
                          border: isLince ? '1px solid #bfdbfe' : isMiami ? '1px solid #bae6fd' : '1px solid #a7f3d0'
                        }}
                      >
                        {pkg.tipoEmpaque === 'SOBRE' ? '✉️' : '📦'}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '13px', color: '#0f172a' }}>
                            {pkg.numeroReciboBodega}
                          </span>
                          <span
                            style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              background: '#f1f5f9',
                              color: '#334155'
                            }}
                          >
                            {pkg.codigoCasillero}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#1e293b',
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
                            fontSize: '11px',
                            color: '#64748b',
                            marginTop: '3px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {pkg.pesoKg ? `${pkg.pesoKg} kg` : '0.0 kg'}
                          </span>
                          <span>•</span>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              color: '#7c3aed',
                              background: '#faf5ff',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid #f3e8ff'
                            }}
                          >
                            {pkg.posicionEstante || 'A1-P1'}
                          </span>
                          <span>•</span>
                          {getDeliveryMethodBadge(pkg.metodoEntrega)}
                          <span>•</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {pkg.descripcion || 'Mercancía general'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estado & Acciones de Fila */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {getStatusBadge(pkg.estadoEntrega)}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onPrintLabel(pkg)}
                          style={{
                            padding: '6px 8px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                          title="Imprimir Etiqueta Térmica"
                        >
                          <Printer style={{ width: '13px', height: '13px' }} />
                          <span className="hidden sm:inline">Ticket</span>
                        </button>

                        {pkg.facturaPdfUrl && (
                          <button
                            type="button"
                            onClick={() => onViewPdf(pkg.facturaPdfUrl || '')}
                            style={{
                              padding: '6px 8px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#047857',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                            title="Ver Factura PDF en Cloudflare R2"
                          >
                            <FileText style={{ width: '13px', height: '13px' }} />
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
    </div>
  );
}
