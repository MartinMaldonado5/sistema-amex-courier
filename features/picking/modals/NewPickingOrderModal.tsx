'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { Paquete, Cliente, ParsedPastedItem } from '../types';
import { PickingService } from '../services/picking.service';

interface NewPickingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  paquetes: Paquete[];
  clientes: Cliente[];
  onOrderCreated: () => void;
}

export const NewPickingOrderModal: React.FC<NewPickingOrderModalProps> = ({
  isOpen,
  onClose,
  paquetes,
  clientes,
  onOrderCreated
}) => {
  const [agencia, setAgencia] = useState('SHALOM');
  const [destino, setDestino] = useState('LIMA / PROVINCIAS');
  const [operador, setOperador] = useState('Operador Logístico AMEX');
  const [notas, setNotas] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'select'>('paste');
  const [rawPastedCodes, setRawPastedCodes] = useState('');
  const [selectedInventoryPkgIds, setSelectedInventoryPkgIds] = useState<string[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const linceAvailablePackages = useMemo(() => {
    return paquetes.filter((p) => p.ubicacionActual === 'AmexLince' || p.estadoEntrega === 'EnAlmacen');
  }, [paquetes]);

  const pastedParsedItems: ParsedPastedItem[] = useMemo(() => {
    if (!rawPastedCodes.trim()) return [];

    const tokens = rawPastedCodes
      .split(/[\n,;\t ]+/)
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0);

    const uniqueTokens = Array.from(new Set(tokens));

    return uniqueTokens.map((token) => {
      const foundPkg = paquetes.find(
        (p) =>
          p.numeroReciboBodega.toUpperCase() === token ||
          p.trackingUsa.toUpperCase() === token ||
          p.codigoCasillero.toUpperCase() === token ||
          (token.length >= 5 && p.numeroReciboBodega.toUpperCase().includes(token))
      );

      const foundCli = clientes.find(
        (c) =>
          c.codigoCasillero.toUpperCase() === token ||
          (foundPkg && c.codigoCasillero.toUpperCase() === foundPkg.codigoCasillero.toUpperCase())
      );

      const anaquel =
        foundPkg?.posicionEstante ||
        (foundPkg?.anaquel ? `${foundPkg.anaquel}-${foundPkg.piso || 'P1'}` : 'A1-P1');

      return {
        code: token,
        pkg: foundPkg,
        cli: foundCli,
        anaquel,
        isLocated: Boolean(foundPkg)
      };
    });
  }, [rawPastedCodes, paquetes, clientes]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrder(true);

    try {
      const now = new Date();
      const codeSuffix = Math.floor(100 + Math.random() * 900);
      const codigoOrden = `PCK-${agencia.replace(/\s+/g, '')}-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${codeSuffix}`;

      let itemsToInsert: Array<{
        codigo_recibo_bodega: string;
        tracking_usa: string;
        consignatario: string;
        dni_consignatario: string;
        telefono_consignatario: string;
        ciudad_destino: string;
        direccion_destino: string;
        ubicacion_anaquel: string;
        paquete_id: string | null;
        peso_kg: number;
      }> = [];

      if (inputMode === 'paste') {
        if (pastedParsedItems.length === 0) {
          alert('Por favor pega al menos un código WR o tracking.');
          setIsCreatingOrder(false);
          return;
        }

        itemsToInsert = pastedParsedItems.map((item) => ({
          codigo_recibo_bodega: item.pkg ? item.pkg.numeroReciboBodega : item.code,
          tracking_usa: item.pkg ? item.pkg.trackingUsa : '',
          consignatario: item.cli ? item.cli.nombre : (item.pkg?.nombreConsignatario || 'Cliente'),
          dni_consignatario: item.cli ? item.cli.documentoIdentidad : (item.pkg?.dniConsignatario || ''),
          telefono_consignatario: item.cli ? item.cli.telefono || '' : '',
          ciudad_destino: item.cli ? item.cli.provincia || destino : destino,
          direccion_destino: item.cli ? item.cli.direccionEntrega || '' : '',
          ubicacion_anaquel: item.anaquel,
          paquete_id: item.pkg ? item.pkg.id : null,
          peso_kg: item.pkg ? item.pkg.pesoKg : 1.0
        }));
      } else {
        if (selectedInventoryPkgIds.length === 0) {
          alert('Por favor selecciona al menos un paquete del inventario.');
          setIsCreatingOrder(false);
          return;
        }

        const selectedPkgs = paquetes.filter((p) => selectedInventoryPkgIds.includes(p.id));
        itemsToInsert = selectedPkgs.map((pkg) => {
          const cli = clientes.find((c) => c.codigoCasillero === pkg.codigoCasillero);
          return {
            codigo_recibo_bodega: pkg.numeroReciboBodega,
            tracking_usa: pkg.trackingUsa,
            consignatario: cli ? cli.nombre : (pkg.nombreConsignatario || 'Cliente'),
            dni_consignatario: cli ? cli.documentoIdentidad : (pkg.dniConsignatario || ''),
            telefono_consignatario: cli ? cli.telefono || '' : '',
            ciudad_destino: cli ? cli.provincia || destino : destino,
            direccion_destino: cli ? cli.direccionEntrega || '' : '',
            ubicacion_anaquel: pkg.posicionEstante || `${pkg.anaquel || 'A1'}-${pkg.piso || 'P1'}`,
            paquete_id: pkg.id,
            peso_kg: pkg.pesoKg
          };
        });
      }

      await PickingService.createPickingOrder({
        codigoOrden,
        agencia,
        destino,
        operador,
        notas,
        items: itemsToInsert
      });

      setRawPastedCodes('');
      setSelectedInventoryPkgIds([]);
      setNotas('');
      onOrderCreated();
      onClose();

      alert(`✓ Orden de Picking ${codigoOrden} creada con éxito (${itemsToInsert.length} paquetes asignados a estanterías).`);
    } catch (err) {
      console.error('Error al crear orden de picking:', err);
      alert('Error al crear la orden de picking.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
            <ClipboardList className="w-5 h-5" /> Nueva Lista de Picking para Agencias
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateOrder} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Agencia de Transporte / Destino</label>
              <select
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                className="form-control"
                required
              >
                <option value="SHALOM">🔴 SHALOM (Agencia / Provincia)</option>
                <option value="OLVA COURIER">🟡 OLVA COURIER (Nacional)</option>
                <option value="MARVISUR">🔵 MARVISUR (Carga Pesada)</option>
                <option value="CARRO AMEX LINCE">🟢 CARRO AMEX (Reparto Local Lima)</option>
                <option value="AGENCIA PROVINCIA">🟣 OTRA AGENCIA PROVINCIA</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Ciudad Destino / Ruta</label>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="form-control"
                placeholder="Ej: LIMA / TRUJILLO / AREQUIPA"
                required
              />
            </div>
          </div>

          <div className="wms-modal-grid-2">
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Operador Responsable en Almacén</label>
              <input
                type="text"
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                className="form-control"
                placeholder="Nombre del operario"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Notas de Despacho (Opcional)</label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="form-control"
                placeholder="Ej: Salida turno tarde 4:00 PM"
              />
            </div>
          </div>

          {/* Selector de modo de carga: Pegar Códigos vs Selección */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              style={{
                background: inputMode === 'paste' ? '#2563eb' : '#f1f5f9',
                color: inputMode === 'paste' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📋 Pegar Lista de Códigos WR
            </button>
            <button
              type="button"
              onClick={() => setInputMode('select')}
              style={{
                background: inputMode === 'select' ? '#2563eb' : '#f1f5f9',
                color: inputMode === 'select' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              📦 Seleccionar de Inventario ({linceAvailablePackages.length} en almacén)
            </button>
          </div>

          {inputMode === 'paste' ? (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Pega los códigos WR o Trackings (separados por líneas, comas o espacios):
              </label>
              <textarea
                rows={4}
                value={rawPastedCodes}
                onChange={(e) => setRawPastedCodes(e.target.value)}
                placeholder="WR000451&#10;WR000452&#10;WR000458"
                className="form-control"
                style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.4' }}
                required
              />

              {pastedParsedItems.length > 0 && (
                <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                    🎯 {pastedParsedItems.length} Códigos Detectados y Ubicados en Almacén:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {pastedParsedItems.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '4px 6px',
                          background: '#ffffff',
                          borderRadius: '4px',
                          border: '1px solid #f1f5f9',
                          fontSize: '11.5px'
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                          {item.code}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.pkg?.nombreConsignatario || 'Cliente'}
                        </span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: item.isLocated ? '#dbeafe' : '#fef3c7',
                            color: item.isLocated ? '#1e40af' : '#92400e'
                          }}
                        >
                          📍 {item.anaquel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px' }}>
              {linceAvailablePackages.map((pkg) => {
                const isChecked = selectedInventoryPkgIds.includes(pkg.id);
                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedInventoryPkgIds((prev) =>
                        isChecked ? prev.filter((x) => x !== pkg.id) : [...prev, pkg.id]
                      );
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isChecked ? '#eff6ff' : 'transparent',
                      fontSize: '12px'
                    }}
                  >
                    <input type="checkbox" checked={isChecked} readOnly />
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                      {pkg.numeroReciboBodega}
                    </span>
                    <span style={{ color: '#64748b', flex: 1 }}>{pkg.nombreConsignatario}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>
                      📍 {pkg.posicionEstante || `${pkg.anaquel || 'A1'}-${pkg.piso || 'P1'}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isCreatingOrder} className="btn btn-primary" style={{ fontWeight: 800 }}>
              {isCreatingOrder ? 'Creando Orden...' : '✓ Crear y Asignar Orden de Picking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
