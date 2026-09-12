'use client';

import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import {
  usePickingData,
  usePickingExecution,
  PickingKpiCards,
  PickingToolbar,
  PickingOrderCard,
  NewPickingOrderModal,
  EditPickingOrderModal,
  PickingExecutionModal,
  PickingManifestModal,
  PickingService,
  type PickingTabProps,
  type OrdenPicking
} from '@/features/picking';

export default function PickingTab({
  paquetes = [],
  clientes = [],
  onUpdatePackage
}: PickingTabProps) {
  const {
    ordenes,
    setOrdenes,
    itemsMap,
    setItemsMap,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    totalOrders,
    activeOrders,
    completedOrders,
    totalPendingPackages,
    filteredOrders,
    fetchPickingData
  } = usePickingData();

  // Modales
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [activeExecutionOrder, setActiveExecutionOrder] = useState<OrdenPicking | null>(null);
  const [manifestOrder, setManifestOrder] = useState<OrdenPicking | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrdenPicking | null>(null);

  // Hook de ejecución de escaneo
  const {
    scanFeedbackMessage,
    inModalScanInput,
    setInModalScanInput,
    handleToggleItemCollected,
    handleProcessBarcodeInPicking
  } = usePickingExecution({
    itemsMap,
    setItemsMap,
    setOrdenes,
    activeExecutionOrder,
    setActiveExecutionOrder
  });

  // DESPACHAR ORDEN CONSOLIDADA (SHALOM / OLVA)
  const handleDispatchOrder = async (order: OrdenPicking) => {
    const currentItems = itemsMap[order.id] || [];
    const pendingItems = currentItems.filter((it) => it.estadoItem !== 'RECOLECTADO');

    if (pendingItems.length > 0) {
      if (!confirm(`Hay ${pendingItems.length} paquete(s) pendientes de recolectar. ¿Deseas despachar de todas formas?`)) {
        return;
      }
    }

    try {
      await PickingService.dispatchOrder(order, currentItems, paquetes, onUpdatePackage);
      await fetchPickingData();
      setActiveExecutionOrder(null);
      setManifestOrder(order);
      alert(`✓ ¡Éxito! Orden ${order.codigoOrden} despachada hacia ${order.transportistaAgencia}. Manifiesto generado.`);
    } catch (err) {
      console.error('Error despachando orden:', err);
      alert('Error al despachar la orden.');
    }
  };

  // Eliminar orden de picking
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta orden de picking?')) return;
    try {
      await PickingService.deleteOrder(orderId);
      await fetchPickingData();
    } catch (err) {
      console.error('Error eliminando orden:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="sap-breadcrumb">
        <span>Operaciones y Almacenes</span> / <span>Listas de Picking, Búsqueda de WRs y Despacho a Agencias</span>
      </div>

      {/* KPI RIBBON DE ÓRDENES DE PICKING */}
      <PickingKpiCards
        totalOrders={totalOrders}
        activeOrders={activeOrders}
        totalPendingPackages={totalPendingPackages}
        completedOrders={completedOrders}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* BANDEJA PRINCIPAL DE ÓRDENES */}
      <div className="card-panel">
        <PickingToolbar
          filteredCount={filteredOrders.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading}
          onRefresh={fetchPickingData}
          onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
        />

        {/* LISTADO DE TARJETAS DE ÓRDENES */}
        <div style={{ padding: '0 16px 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: '12px' }}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <PickingOrderCard
                key={order.id}
                order={order}
                items={itemsMap[order.id] || []}
                onOpenExecution={setActiveExecutionOrder}
                onOpenEdit={setEditingOrder}
                onOpenManifest={setManifestOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <ClipboardList className="w-12 h-12 text-slate-300" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontWeight: 800, color: '#334155', fontSize: '14px', margin: 0 }}>No hay listas de picking creadas</p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Presiona <strong>&quot;➕ Nueva Lista de Picking&quot;</strong> para pegar códigos WR y asignarle a los operarios la ruta de anaqueles.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <NewPickingOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        paquetes={paquetes}
        clientes={clientes}
        onOrderCreated={fetchPickingData}
      />

      <EditPickingOrderModal
        order={editingOrder}
        items={editingOrder ? itemsMap[editingOrder.id] || [] : []}
        paquetes={paquetes}
        clientes={clientes}
        onClose={() => setEditingOrder(null)}
        onOrderSaved={fetchPickingData}
      />

      <PickingExecutionModal
        order={activeExecutionOrder}
        items={activeExecutionOrder ? itemsMap[activeExecutionOrder.id] || [] : []}
        scanFeedbackMessage={scanFeedbackMessage}
        inModalScanInput={inModalScanInput}
        setInModalScanInput={setInModalScanInput}
        onProcessBarcode={handleProcessBarcodeInPicking}
        onToggleItemCollected={handleToggleItemCollected}
        onClose={() => setActiveExecutionOrder(null)}
        onOpenManifest={setManifestOrder}
        onDispatchOrder={handleDispatchOrder}
      />

      <PickingManifestModal
        order={manifestOrder}
        items={manifestOrder ? itemsMap[manifestOrder.id] || [] : []}
        onClose={() => setManifestOrder(null)}
      />
    </div>
  );
}
