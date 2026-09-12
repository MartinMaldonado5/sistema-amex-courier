'use client';

import React, { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import { OrdenPicking, ItemPicking, TipoEstadoPicking, Paquete, Cliente } from '../types';
import { PickingService } from '../services/picking.service';

interface EditPickingOrderModalProps {
  order: OrdenPicking | null;
  items: ItemPicking[];
  paquetes: Paquete[];
  clientes: Cliente[];
  onClose: () => void;
  onOrderSaved: () => void;
}

export const EditPickingOrderModal: React.FC<EditPickingOrderModalProps> = ({
  order,
  items,
  paquetes,
  clientes,
  onClose,
  onOrderSaved
}) => {
  const [agencia, setAgencia] = useState('SHALOM');
  const [destino, setDestino] = useState('LIMA / PROVINCIAS');
  const [operador, setOperador] = useState('Operador Logístico AMEX');
  const [notas, setNotas] = useState('');
  const [newWrs, setNewWrs] = useState('');
  const [orderItems, setOrderItems] = useState<ItemPicking[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setAgencia(order.transportistaAgencia || 'SHALOM');
      setDestino(order.destinoCiudad || 'LIMA / PROVINCIAS');
      setOperador(order.operadorAsignado || 'Operador Logístico AMEX');
      setNotas(order.notas || '');
      setNewWrs('');
      setOrderItems([...items]);
    }
  }, [order, items]);

  if (!order) return null;

  const handleRemoveItem = (itemId: string) => {
    if (orderItems.length <= 1) {
      alert('La orden de picking debe tener al menos 1 paquete.');
      return;
    }
    setOrderItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updatedItems = [...orderItems];
      const newItemsToInsert: Record<string, unknown>[] = [];

      if (newWrs.trim()) {
        const tokens = newWrs
          .split(/[\n,;\t ]+/)
          .map((t) => t.trim().toUpperCase())
          .filter((t) => t.length > 0);

        for (const token of tokens) {
          if (!updatedItems.some((it) => it.codigoReciboBodega.toUpperCase() === token)) {
            const foundPkg = paquetes.find((p) => p.numeroReciboBodega.toUpperCase() === token);
            const foundCli = clientes.find((c) => c.codigoCasillero === foundPkg?.codigoCasillero);

            const newItem: ItemPicking = {
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              ordenPickingId: order.id,
              paqueteId: foundPkg?.id,
              codigoReciboBodega: token,
              trackingUsa: foundPkg?.trackingUsa || '',
              consignatario: foundCli?.nombre || foundPkg?.nombreConsignatario || 'Cliente',
              dniConsignatario: foundCli?.documentoIdentidad || foundPkg?.dniConsignatario || '',
              telefonoConsignatario: foundCli?.telefono || '',
              ciudadDestino: destino,
              direccionDestino: foundCli?.direccionEntrega || '',
              ubicacionAnaquel:
                foundPkg?.posicionEstante ||
                (foundPkg?.anaquel ? `${foundPkg.anaquel}-${foundPkg.piso || 'P1'}` : 'A1-P1'),
              estadoItem: 'PENDIENTE',
              pesoKg: foundPkg?.pesoKg || 1.0,
              creadoEn: new Date().toISOString()
            };

            newItemsToInsert.push({
              orden_picking_id: order.id,
              paquete_id: newItem.paqueteId,
              codigo_recibo_bodega: newItem.codigoReciboBodega,
              tracking_usa: newItem.trackingUsa,
              consignatario: newItem.consignatario,
              dni_consignatario: newItem.dniConsignatario,
              telefono_consignatario: newItem.telefonoConsignatario,
              ciudad_destino: newItem.ciudadDestino,
              direccion_destino: newItem.direccionDestino,
              ubicacion_anaquel: newItem.ubicacionAnaquel,
              estado_item: 'PENDIENTE',
              peso_kg: newItem.pesoKg
            });

            updatedItems.push(newItem);
          }
        }
      }

      const removedIds = items.filter((dbIt) => !updatedItems.some((u) => u.id === dbIt.id)).map((x) => x.id);

      const totalPkgs = updatedItems.length;
      const recolectadosCount = updatedItems.filter((it) => it.estadoItem === 'RECOLECTADO').length;
      const nextState: TipoEstadoPicking =
        recolectadosCount === totalPkgs && totalPkgs > 0
          ? 'COMPLETADO'
          : recolectadosCount > 0
          ? 'EN_PROCESO'
          : 'PENDIENTE';

      await PickingService.saveEditedOrder({
        orderId: order.id,
        agencia,
        destino,
        operador,
        notas,
        totalPaquetes: totalPkgs,
        recolectadosCount,
        nextState,
        newItemsToInsert,
        removedItemIds: removedIds
      });

      alert(`✓ Orden de Picking ${order.codigoOrden} actualizada con éxito (${totalPkgs} paquetes).`);
      onOrderSaved();
      onClose();
    } catch (err) {
      console.error('Error al editar orden de picking:', err);
      alert('Error al actualizar la orden de picking.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '600px', maxHeight: '92vh' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
            <Edit3 className="w-5 h-5" /> Editar Lista de Picking ({order.codigoOrden})
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Agencia</label>
              <select
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                className="form-control"
              >
                <option value="SHALOM">🔴 SHALOM (Agencia / Provincia)</option>
                <option value="OLVA COURIER">🟡 OLVA COURIER (Nacional)</option>
                <option value="MARVISUR">🔵 MARVISUR (Carga Pesada)</option>
                <option value="CARRO AMEX LINCE">🟢 CARRO AMEX</option>
                <option value="AGENCIA PROVINCIA">🟣 OTRA AGENCIA</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Ciudad Destino</label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Operador Responsable</label>
              <input
                type="text"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Notas</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="form-control"
              />
            </div>
          </div>

          {/* LISTA ACTUAL DE ITEMS DE PICKING */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
              📦 Paquetes en esta Lista ({orderItems.length}):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px' }}>
              {orderItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 900, color: '#1e3a8a', fontFamily: 'monospace', fontSize: '13px' }}>
                      {item.codigoReciboBodega}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      📍 {item.ubicacionAnaquel}
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {item.consignatario}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#dc2626',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AGREGAR MÁS WRS A LA LISTA */}
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
              ➕ Agregar más WRs (Pega códigos separados por coma o espacio):
            </label>
            <textarea
              rows={2}
              value={newWrs}
              onChange={(e) => setNewWrs(e.target.value)}
              placeholder="WR000455, WR000456"
              className="form-control"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ fontWeight: 800 }}>
              {isSaving ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
