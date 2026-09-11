'use client';

import React from 'react';
import { Package, RefreshCw, UploadCloud } from 'lucide-react';

interface ShalomHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onOpenUpload: () => void;
}

export const ShalomHeader: React.FC<ShalomHeaderProps> = ({
  isLoading,
  onRefresh,
  onOpenUpload
}) => {
  return (
    <header className="shalom-header">
      <div className="shalom-header-left">
        <div className="shalom-title-row">
          <span className="shalom-badge">Módulo 10</span>
          <h1 className="shalom-title">
            <Package className="text-sky-400" size={24} /> Boletas de Shalom
          </h1>
        </div>
        <p className="shalom-subtitle">
          Archivo digital inteligente y buscador instantáneo de encomiendas escaneadas & AMEXito AI
        </p>
      </div>

      <div className="shalom-header-actions">
        <button
          type="button"
          className="shalom-btn-secondary"
          onClick={onRefresh}
          title="Recargar datos"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          Actualizar
        </button>

        <button
          type="button"
          className="shalom-btn-primary"
          onClick={onOpenUpload}
        >
          <UploadCloud size={17} />
          + Cargar Nueva Boleta
        </button>
      </div>
    </header>
  );
};
