'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, ShieldCheck, Box, Sliders, Warehouse, RefreshCw, Layers } from 'lucide-react';
import { Paquete, EstanteriaPosicion, AlmacenSede } from '@/types';
import { BatchShelfData, SinglePositionData } from '@/features/inventory/types';
import { inventoryService } from '@/features/inventory/services/inventory.service';
import GestorAlmacenView from '@/features/inventory/components/GestorAlmacenView';
import ShelfPositionModal from '@/features/inventory/modals/ShelfPositionModal';
import EditPositionModal from '@/features/inventory/modals/EditPositionModal';
import { supabase } from '@/lib/supabase/client';

export interface ConfiguracionTabProps {
  paquetes?: Paquete[];
  currentUser?: {
    nombre: string;
    email: string;
    rol: string;
    isAdmin?: boolean;
  } | null;
  onNavigateTab?: (tabId: string) => void;
}

export default function ConfiguracionTab({
  paquetes = [],
  currentUser,
  onNavigateTab
}: ConfiguracionTabProps) {
  const [activeSection, setActiveSection] = useState<'almacen' | 'parametros'>('almacen');
  const [posicionesList, setPosicionesList] = useState<EstanteriaPosicion[]>([]);
  const [sedesList, setSedesList] = useState<AlmacenSede[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modales de Anaqueles y Posiciones
  const [isNewPositionModalOpen, setIsNewPositionModalOpen] = useState(false);
  const [newPositionMode, setNewPositionMode] = useState<'batch' | 'single'>('batch');
  const [editingPosition, setEditingPosition] = useState<EstanteriaPosicion | null>(null);

  // Formularios de Creación
  const [batchShelfData, setBatchShelfData] = useState<BatchShelfData>({
    almacenCodigo: 'LINCE',
    codigoEstante: '',
    cantidadPisos: 4,
    zonaTipo: 'ALMACENAJE',
    capacidadPorPiso: 40,
    pesoPorPiso: 150,
    descripcion: ''
  });

  const [newPositionData, setNewPositionData] = useState<SinglePositionData>({
    almacenCodigo: 'LINCE',
    codigoEstante: '',
    nivelPiso: 'P1',
    zonaTipo: 'ALMACENAJE',
    capacidadMaxPaquetes: 40,
    pesoMaxKg: 150,
    descripcion: ''
  });

  // Carga de datos de infraestructura
  const fetchInfraData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pos, sed] = await Promise.all([
        inventoryService.getPosiciones(),
        inventoryService.getSedes()
      ]);
      setPosicionesList(pos);
      setSedesList(sed);
    } catch (err) {
      console.error('Error fetching configuracion almacén:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfraData();

    // Suscripción Realtime a estanterías
    const channel = supabase
      .channel('configuracion_posiciones_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estanterias_posiciones' },
        () => {
          fetchInfraData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInfraData]);

  // Handlers para Crear en Lote
  const handleCreateBatchShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchShelfData.codigoEstante.trim()) {
      alert('Debes ingresar un código para el anaquel.');
      return;
    }
    try {
      const created = await inventoryService.createBatchShelf(batchShelfData, sedesList);
      if (created.length > 0) {
        setIsNewPositionModalOpen(false);
        setBatchShelfData({
          almacenCodigo: 'LINCE',
          codigoEstante: '',
          cantidadPisos: 4,
          zonaTipo: 'ALMACENAJE',
          capacidadPorPiso: 40,
          pesoPorPiso: 150,
          descripcion: ''
        });
        await fetchInfraData();
      } else {
        alert('No se pudieron crear las posiciones. Revisa la consola.');
      }
    } catch (err) {
      console.error('Error creando anaquel en lote:', err);
      alert('Error creando anaquel en lote.');
    }
  };

  // Handler para Crear Individual
  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionData.codigoEstante.trim() || !newPositionData.nivelPiso.trim()) {
      alert('Debes ingresar el anaquel y nivel de piso.');
      return;
    }
    try {
      const pos = await inventoryService.createPosition(newPositionData, sedesList);
      if (pos) {
        setIsNewPositionModalOpen(false);
        setNewPositionData({
          almacenCodigo: 'LINCE',
          codigoEstante: '',
          nivelPiso: 'P1',
          zonaTipo: 'ALMACENAJE',
          capacidadMaxPaquetes: 40,
          pesoMaxKg: 150,
          descripcion: ''
        });
        await fetchInfraData();
      } else {
        alert('No se pudo crear la posición.');
      }
    } catch (err) {
      console.error('Error creando posición individual:', err);
      alert('Error creando posición.');
    }
  };

  // Handler para Actualizar Posición
  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;
    try {
      await inventoryService.updatePosition(editingPosition.id, {
        zonaTipo: editingPosition.zonaTipo,
        capacidadMaxPaquetes: Number(editingPosition.capacidadMaxPaquetes),
        pesoMaxKg: Number(editingPosition.pesoMaxKg),
        descripcion: editingPosition.descripcion
      });
      setEditingPosition(null);
      await fetchInfraData();
    } catch (err) {
      console.error('Error actualizando posición:', err);
      alert('Error actualizando posición.');
    }
  };

  // Handler para Eliminar Posición
  const handleDeletePosition = async (posId: string) => {
    const pos = posicionesList.find(p => p.id === posId);
    if (!pos) return;

    if (!confirm(`¿Estás seguro de eliminar la posición física ${pos.codigoPosicion}?`)) {
      return;
    }

    try {
      await inventoryService.deletePosition(posId);
      await fetchInfraData();
    } catch (err) {
      console.error('Error eliminando posición:', err);
      alert('Error al eliminar posición.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#1e293b' }}>
      {/* Header del Módulo 18 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                padding: '8px 10px',
                borderRadius: '10px',
                color: '#ffffff',
                display: 'flex',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
              }}
            >
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                18. Configuración General del Sistema
              </h1>
            </div>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
            Gestión centralizada de infraestructura de almacenes, capacidades WMS, parámetros globales y políticas de operación.
          </p>
        </div>

        {/* Badge de Seguridad para Administrador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#92400e'
            }}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Acceso Exclusivo: Administrador</span>
          </div>

          <button
            onClick={fetchInfraData}
            disabled={isLoading}
            className="btn"
            style={{
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Subpestañas del Módulo de Configuración */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveSection('almacen')}
          style={{
            background: activeSection === 'almacen' ? '#2563eb' : '#ffffff',
            color: activeSection === 'almacen' ? '#ffffff' : '#475569',
            border: activeSection === 'almacen' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: activeSection === 'almacen' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none'
          }}
        >
          <Warehouse className="w-4 h-4" />
          <span>1. Anaqueles, Pisos & Capacidad WMS</span>
          <span
            style={{
              background: activeSection === 'almacen' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              color: activeSection === 'almacen' ? '#ffffff' : '#475569',
              fontSize: '11px',
              padding: '1px 7px',
              borderRadius: '999px',
              fontWeight: 800
            }}
          >
            {posicionesList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('parametros')}
          style={{
            background: activeSection === 'parametros' ? '#0f766e' : '#ffffff',
            color: activeSection === 'parametros' ? '#ffffff' : '#475569',
            border: activeSection === 'parametros' ? '1px solid #115e59' : '1px solid #cbd5e1',
            fontWeight: 800,
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: activeSection === 'parametros' ? '0 2px 6px rgba(15,118,110,0.25)' : 'none'
          }}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Parámetros & Políticas del Sistema</span>
        </button>
      </div>

      {/* SECCIÓN 1: Gestión de Anaqueles y Capacidad WMS */}
      {activeSection === 'almacen' && (
        <GestorAlmacenView
          posicionesList={posicionesList}
          paquetes={paquetes}
          onOpenBatchShelfModal={() => {
            setNewPositionMode('batch');
            setIsNewPositionModalOpen(true);
          }}
          onOpenSinglePositionModal={() => {
            setNewPositionMode('single');
            setIsNewPositionModalOpen(true);
          }}
          onEditPosition={pos => setEditingPosition(pos)}
          onFilterShelf={(shelfCode, floorLevel) => {
            if (onNavigateTab) {
              onNavigateTab('mm-lince');
            }
          }}
          onDeletePosition={handleDeletePosition}
        />
      )}

      {/* SECCIÓN 2: Parámetros y Políticas Globales */}
      {activeSection === 'parametros' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {/* Card: Reglas de Guía WR */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <Box className="w-5 h-5" />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Reglas de Guías WR (Warehouse Receipt)
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Validación estricta de 11 caracteres</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Todas las guías deben cumplir con el estándar de <strong>exactamente 11 caracteres</strong> alfanuméricos y comenzar con el prefijo <code>WR</code> (ej. <code>WR000474478</code>).
            </p>
            <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Longitud Exacta:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>11 caracteres</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Prefijo Requerido:</span>
                <span style={{ fontWeight: 800, color: '#16a34a' }}>WR / Wr / wr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Alcance:</span>
                <span style={{ fontWeight: 700 }}>Todo el sistema AMEX</span>
              </div>
            </div>
          </div>

          {/* Card: Infraestructura de Almacén */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <Warehouse className="w-5 h-5" />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Sede Central & Zonas de Almacén
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Infraestructura de custodia Lince</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              Almacén principal ubicado en Lima (Lince). Los paquetes se organizan físicamente en estantes con control de pisos y capacidad de carga en kilogramos.
            </p>
            <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Sede Activa:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>Lince (Lima, Perú)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Zonas Definidas:</span>
                <span style={{ fontWeight: 700 }}>Almacenaje, Recepción, Despacho, Oficina</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Posiciones Activas:</span>
                <span style={{ fontWeight: 800, color: '#16a34a' }}>{posicionesList.length} posiciones</span>
              </div>
            </div>
          </div>

          {/* Card: Rótulos Térmicos */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  Formatos de Impresión Térmica
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Rótulos de paquete y agencias</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              El sistema genera automáticamente etiquetas optimizadas para impresoras térmicas comerciales (Xprinter, Zebra, etc.) con códigos de barras Code128.
            </p>
            <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Medida Estándar:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>4 x 6 pulgadas (100 x 150 mm)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700 }}>Código de Barras:</span>
                <span style={{ fontWeight: 700 }}>Code128 Alta Densidad</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Modo Rápido:</span>
                <span style={{ fontWeight: 800, color: '#16a34a' }}>Impresión en 1-clic</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Posición (Lote o Individual) */}
      <ShelfPositionModal
        isOpen={isNewPositionModalOpen}
        onClose={() => setIsNewPositionModalOpen(false)}
        newPositionMode={newPositionMode}
        setNewPositionMode={setNewPositionMode}
        batchShelfData={batchShelfData}
        setBatchShelfData={setBatchShelfData}
        newPositionData={newPositionData}
        setNewPositionData={setNewPositionData}
        onCreateBatchShelf={handleCreateBatchShelf}
        onCreatePosition={handleCreatePosition}
      />

      {/* Modal para Editar Posición */}
      <EditPositionModal
        editingPosition={editingPosition}
        setEditingPosition={setEditingPosition}
        onSave={handleUpdatePosition}
      />
    </div>
  );
}
