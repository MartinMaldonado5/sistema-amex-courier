'use client';

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Paquete, TipoUbicacion, EstanteriaPosicion } from '@/types';
import { TransferFormData } from '../types';

export interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageForAction: Paquete | null;
  selectedIds: string[];
  transferData: TransferFormData;
  setTransferData: React.Dispatch<React.SetStateAction<TransferFormData>>;
  shelfGroups: { [key: string]: EstanteriaPosicion[] };
  onConfirmTransfer: (e: React.FormEvent) => Promise<void> | void;
}

export default function TransferModal({
  isOpen,
  onClose,
  selectedPackageForAction,
  selectedIds,
  transferData,
  setTransferData,
  shelfGroups,
  onConfirmTransfer
}: TransferModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft className="w-5 h-5 text-blue-600" /> Reubicar / Trasladar Paquete(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onConfirmTransfer} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>
              {selectedPackageForAction
                ? `Paquete: ${selectedPackageForAction.numeroReciboBodega}`
                : `Paquetes seleccionados en lote: ${selectedIds.length} unidades`}
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Almacén / Sede de Destino</label>
            <select
              value={transferData.targetUbicacion}
              onChange={e => setTransferData({ ...transferData, targetUbicacion: e.target.value as TipoUbicacion })}
              className="form-control"
              required
            >
              <option value="AmexLince">Sede Central Lince (Lima)</option>
              <option value="Entregado">Entregado a Cliente / Finalizado</option>
            </select>
          </div>

          {/* Selector de Anaquel / Zona y Piso / Nivel */}
          {(() => {
            const isLevelLess =
              transferData.targetAnaquel === 'DSP-Z1' ||
              transferData.targetAnaquel === 'DSP-Z2' ||
              transferData.targetAnaquel === 'DSP' ||
              transferData.targetAnaquel?.startsWith('DSP') ||
              transferData.targetAnaquel === 'OFI' ||
              transferData.targetAnaquel === 'REC' ||
              transferData.targetAnaquel === 'TRANSITO';

            const availableShelves = (() => {
              const list = Object.keys(shelfGroups);
              if (!list.includes('REC')) list.push('REC');
              if (!list.includes('DSP') && !list.some(k => k.startsWith('DSP'))) list.push('DSP');
              return list;
            })();

            const getShelfDisplayName = (key: string) => {
              if (key === 'DSP-Z1') return '📦 Despacho Zona 1 (DSP-Z1)';
              if (key === 'DSP-Z2') return '📦 Despacho Zona 2 (DSP-Z2)';
              if (key === 'DSP') return '📦 Zona de Despacho (DSP)';
              if (key === 'OFI') return '🏢 Oficina (OFI)';
              if (key === 'REC') return '📥 Recepción (REC)';
              if (key.startsWith('DSP')) return `📦 Despacho (${key})`;
              return `🗄️ Anaquel ${key}`;
            };

            const handleAnaquelChange = (newAnaquel: string) => {
              const noLevel =
                newAnaquel === 'DSP-Z1' ||
                newAnaquel === 'DSP-Z2' ||
                newAnaquel === 'DSP' ||
                newAnaquel.startsWith('DSP') ||
                newAnaquel === 'OFI' ||
                newAnaquel === 'REC' ||
                newAnaquel === 'TRANSITO';

              setTransferData({
                ...transferData,
                targetAnaquel: newAnaquel,
                targetPiso: noLevel ? '' : (transferData.targetPiso || 'P1')
              });
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isLevelLess ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                      {isLevelLess ? 'Zona / Ubicación Destino' : 'Anaquel Destino'}
                    </label>
                    <select
                      value={transferData.targetAnaquel}
                      onChange={e => handleAnaquelChange(e.target.value)}
                      className="form-control"
                      required
                    >
                      {availableShelves.map(shelfKey => (
                        <option key={shelfKey} value={shelfKey}>
                          {getShelfDisplayName(shelfKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isLevelLess && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Piso / Nivel</label>
                      <select
                        value={transferData.targetPiso || 'P1'}
                        onChange={e => setTransferData({ ...transferData, targetPiso: e.target.value })}
                        className="form-control"
                        required
                      >
                        <option value="P1">Piso 1 (Inferior)</option>
                        <option value="P2">Piso 2 (Medio)</option>
                        <option value="P3">Piso 3 (Medio Alto)</option>
                        <option value="P4">Piso 4 (Superior)</option>
                      </select>
                    </div>
                  )}
                </div>

                {isLevelLess && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderLeft: '4px solid #2563eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '11.5px', color: '#1e40af', fontWeight: 700 }}>
                      {transferData.targetAnaquel.startsWith('DSP')
                        ? '🚚 Zona de Despacho en piso: No tiene niveles ni estantería.'
                        : transferData.targetAnaquel === 'OFI'
                        ? '🏢 Oficina / Custodia interna (sin niveles de estante).'
                        : '📥 Recepción general / Sin niveles de estante.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Motivo del Movimiento</label>
            <select
              value={transferData.motivo}
              onChange={e => setTransferData({ ...transferData, motivo: e.target.value })}
              className="form-control"
              required
            >
              <option value="Reubicación WMS de Almacén">Reubicación WMS de Almacén</option>
              <option value="Ingreso de Carga a Almacén Lince">Ingreso de Carga a Almacén Lince</option>
              <option value="Traslado a Zona de Despacho">Traslado a Zona de Despacho</option>
              <option value="Ajuste de Espacio / Reordenamiento">Ajuste de Espacio / Reordenamiento</option>
              <option value="Pase a Ruta de Reparto Lince">Pase a Ruta de Reparto Lince</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>Operador Responsable</label>
            <input
              type="text"
              value={transferData.operador}
              onChange={e => setTransferData({ ...transferData, operador: e.target.value })}
              className="form-control"
              required
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700 }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ fontWeight: 800 }}>
              ✓ Confirmar Traslado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
