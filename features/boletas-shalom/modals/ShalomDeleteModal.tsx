'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { BoletaShalom } from '@/types';

interface ShalomDeleteModalProps {
  isOpen: boolean;
  boleta: BoletaShalom | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ShalomDeleteModal: React.FC<ShalomDeleteModalProps> = ({
  isOpen,
  boleta,
  isDeleting,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !boleta) return null;

  return (
    <div className="shalom-modal-overlay">
      <div className="shalom-confirm-modal">
        <div className="shalom-confirm-icon">
          <Trash2 size={26} />
        </div>
        <h3 className="shalom-confirm-title">¿Eliminar esta boleta?</h3>
        <p className="shalom-confirm-text">
          Estás a punto de eliminar la boleta <strong>N° {boleta.numero_guia}</strong> de{' '}
          <strong>{boleta.destinatario_nombre}</strong> con destino a <strong>{boleta.destino}</strong>.
          Esta acción no se puede deshacer.
        </p>
        <div className="shalom-confirm-actions">
          <button
            type="button"
            className="shalom-btn-cancel"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="shalom-btn-delete"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};
