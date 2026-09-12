'use client';

import React from 'react';
import { ClipboardList, Plus, RefreshCw, Search } from 'lucide-react';

interface PickingToolbarProps {
  filteredCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenNewOrderModal: () => void;
}

export const PickingToolbar: React.FC<PickingToolbarProps> = ({
  filteredCount,
  searchTerm,
  setSearchTerm,
  isLoading,
  onRefresh,
  onOpenNewOrderModal
}) => {
  return (
    <>
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClipboardList className="w-4 h-4 text-blue-600" /> Listas de Picking & Consolidación para Despacho
          </h3>
          <span className="panel-count">{filteredCount}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenNewOrderModal}
            className="btn btn-primary"
            style={{ height: '38px', padding: '0 14px', fontSize: '12.5px', borderRadius: '8px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb' }}
          >
            <Plus className="w-4 h-4" /> ➕ Nueva Lista de Picking (Pegar WRs)
          </button>

          <button
            onClick={onRefresh}
            className="btn btn-secondary"
            style={{ height: '38px', padding: '0 10px', fontSize: '12px', borderRadius: '8px', fontWeight: 700 }}
            title="Actualizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por código de orden, agencia (Shalom, Olva) u operador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              paddingLeft: '34px',
              paddingRight: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
        </div>
      </div>
    </>
  );
};
