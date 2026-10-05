'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Paquete, ScannedLog } from '@/types';
import {
  SYSTEM_MODULES,
  hasModuleAccess,
  type UserAccessContext
} from '@/lib/navigation/registry';

interface OperatorHubTabProps {
  currentUser?: (UserAccessContext & { nombre?: string; email?: string }) | null;
  paquetes?: Paquete[];
  scannedLogs?: ScannedLog[];
  onNavigateTab: (tabId: string) => void;
  onRefreshData?: () => Promise<void>;
}

export default function OperatorHubTab({
  currentUser,
  paquetes = [],
  scannedLogs = [],
  onNavigateTab,
  onRefreshData
}: OperatorHubTabProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Módulos asignados al usuario (excluyendo el dashboard mismo)
  const allowedModules = useMemo(() => {
    if (!currentUser) return [];
    return SYSTEM_MODULES.filter(
      (m) => m.id !== 'dashboard' && hasModuleAccess(currentUser, m.tabId)
    );
  }, [currentUser]);

  // Métricas del turno
  const paquetesEnAlmacen = useMemo(() => {
    return paquetes.filter(
      (p) =>
        p.ubicacionActual === 'AmexLince' &&
        p.estadoAmex !== 'entregado'
    ).length;
  }, [paquetes]);

  const paquetesRecibidosHoy = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return paquetes.filter((p) => p.creadoEn?.startsWith(today)).length;
  }, [paquetes]);

  const escaneosHoy = scannedLogs.length;

  const primerNombre = (currentUser?.nombre || 'Operador').split(' ')[0];

  return (
    <div
      style={{
        padding: '24px 28px 60px',
        color: '#f8fafc',
        maxWidth: 1360,
        margin: '0 auto',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* ═══ HERO BANNER OPERATIVO ═══ */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.45) 50%, rgba(15, 23, 42, 0.95) 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 28,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 30px rgba(37, 99, 235, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Identidad del Operador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: '2px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                flexShrink: 0
              }}
            >
              {(currentUser?.nombre || 'AMEX')[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    margin: 0,
                    color: '#f8fafc',
                    letterSpacing: '-0.3px'
                  }}
                >
                  ¡Hola, {primerNombre}! 👋
                </h1>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 8px #22c55e'
                    }}
                  />
                  {currentUser?.rol || 'Operador Logístico'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
                Bienvenido a tu estación operativa de AMEX Courier. Selecciona tu herramienta de trabajo para iniciar.
              </p>
            </div>
          </div>

          {/* Reloj y Estado en Tiempo Real */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '12px 20px',
              textAlign: 'right',
              backdropFilter: 'blur(8px)',
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#38bdf8',
                fontFamily: 'monospace',
                letterSpacing: '1px'
              }}
            >
              {currentTime || '--:--:--'}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                textTransform: 'capitalize',
                marginTop: 2
              }}
            >
              {currentDate || 'Cargando...'}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#4ade80',
                fontWeight: 700,
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 5
              }}
            >
              <i className="fa-solid fa-wifi" style={{ fontSize: 9 }} />
              <span>Conectado · Almacén Lince</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TARJETAS DE MÉTRICAS OPERATIVAS DEL TURNO ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Stock en Almacén
              </span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', marginTop: 4 }}>
                {paquetesEnAlmacen}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Paquetes listos en Lince</span>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(251, 146, 60, 0.15)',
                border: '1px solid rgba(251, 146, 60, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c',
                fontSize: 18
              }}
            >
              <i className="fa-solid fa-boxes-stacked" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Ingresos Hoy
              </span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#38bdf8', marginTop: 4 }}>
                {paquetesRecibidosHoy}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Recepcionados hoy</span>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontSize: 18
              }}
            >
              <i className="fa-solid fa-truck-ramp-box" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Tus Escaneos
              </span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#4ade80', marginTop: 4 }}>
                {escaneosHoy}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Códigos leídos en sesión</span>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(74, 222, 128, 0.15)',
                border: '1px solid rgba(74, 222, 128, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80',
                fontSize: 18
              }}
            >
              <i className="fa-solid fa-barcode" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Módulos Habilitados
              </span>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#c084fc', marginTop: 4 }}>
                {allowedModules.length}
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Herramientas activas</span>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(192, 132, 252, 0.15)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                fontSize: 18
              }}
            >
              <i className="fa-solid fa-shield-check" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TÍTULO DE SECCIÓN: HERRAMIENTAS ASIGNADAS ═══ */}
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fa-solid fa-layer-group" style={{ color: '#38bdf8' }} />
            Tus Estaciones de Trabajo
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
            Acceso directo y exclusivo a los módulos operativos autorizados para tu rol
          </p>
        </div>
        {onRefreshData && (
          <button
            onClick={() => onRefreshData()}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <i className="fa-solid fa-arrows-rotate" /> Actualizar
          </button>
        )}
      </div>

      {/* ═══ CUADRÍCULA DE TARJETAS DE MÓDULOS (SOLO ASIGNADOS) ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: 20,
          marginBottom: 36
        }}
      >
        {allowedModules.map((m) => {
          const isScanner = m.id === 'scanner';
          return (
            <div
              key={m.id}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 18,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 14px 34px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
                      border: '1.5px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      fontSize: 20
                    }}
                  >
                    <i className={m.icon} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#64748b',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '3px 8px',
                      borderRadius: 6
                    }}
                  >
                    Módulo #{m.number}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', margin: '0 0 6px' }}>
                  {m.label}
                </h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {m.id === 'mm-lince' && 'Control de stock físico, anaqueles A1/A2, pisos P1-P4 y estados logísticos de paquetes.'}
                  {m.id === 'scanner' && 'Lectura de códigos de barras, QR y asignación directa a ubicaciones de almacén.'}
                  {m.id === 'info-amex' && 'Visualización de comprobantes, fotografías de saca/cajas y documentación adjunta.'}
                  {m.id === 'auditoria' && 'Registro inmutable de movimientos, eventos de escaneo y trazabilidad de operaciones.'}
                  {m.id === 'despacho-rutas' && 'Planificación de rutas de entrega, choferes asignados y notificaciones por WhatsApp.'}
                  {m.id === 'fico-cobros' && 'Control de fletes, cargos administrativos, vouchers bancarios y liquidación.'}
                  {m.id === 'rotulos-a4' && 'Generación e impresión de rótulos térmicos y plantillas A4 para agencias de provincia.'}
                  {m.id === 'boletas-shalom' && 'Gestión de facturación, remesas y boletas de envío hacia la red Shalom.'}
                  {m.id === 'formato-entrega' && 'Emisión de actas de entrega, constancias firmadas y cargos de recepción.'}
                  {m.id === 'dni-matrix' && 'Procesamiento de documentos de identidad, escaneo OCR y matriz DNI.'}
                  {m.id === 'live-sheets' && 'Hojas de cálculo en tiempo real vinculadas a los manifiestos operativos de AMEX.'}
                  {!['mm-lince', 'scanner', 'info-amex', 'auditoria', 'despacho-rutas', 'fico-cobros', 'rotulos-a4', 'boletas-shalom', 'formato-entrega', 'dni-matrix', 'live-sheets'].includes(m.id) &&
                    'Herramienta operativa configurada y habilitada para tus funciones.'}
                </p>
              </div>

              {/* Botones de acción */}
              {isScanner ? (
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6,
                      marginBottom: 10
                    }}
                  >
                    <button
                      onClick={() => onNavigateTab('scanner-slotting')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-layer-group" style={{ fontSize: 10 }} /> 6.1 Asignar
                    </button>
                    <button
                      onClick={() => onNavigateTab('scanner-lookup')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(74, 222, 128, 0.12)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                        color: '#4ade80',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-magnifying-glass-location" style={{ fontSize: 10 }} /> 6.2 Localizar
                    </button>
                    <button
                      onClick={() => onNavigateTab('scanner-delivery')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(192, 132, 252, 0.12)',
                        border: '1px solid rgba(192, 132, 252, 0.3)',
                        color: '#c084fc',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-truck-fast" style={{ fontSize: 10 }} /> 6.3 Despachar
                    </button>
                    <button
                      onClick={() => onNavigateTab('scanner-relocate')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: 'rgba(251, 146, 60, 0.12)',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        color: '#fb923c',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                    >
                      <i className="fa-solid fa-right-left" style={{ fontSize: 10 }} /> 6.4 Reubicar
                    </button>
                  </div>
                  <button
                    onClick={() => onNavigateTab('mobile-scanner')}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    <i className="fa-solid fa-expand" /> Abrir Escáner Principal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onNavigateTab(m.tabId)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <span>Abrir {m.shortLabel}</span>
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ CONSEJOS DE SEGURIDAD OPERATIVA ═══ */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 14,
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            fontSize: 16,
            flexShrink: 0
          }}
        >
          <i className="fa-solid fa-lightbulb" />
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          <strong style={{ color: '#f8fafc' }}>Recordatorio Operativo AMEX:</strong> Recuerda verificar que el código WR coincida con la etiqueta física antes de confirmar el anaquel o despacho. Cualquier incidencia queda registrada en la trazabilidad de auditoría.
        </div>
      </div>
    </div>
  );
}
