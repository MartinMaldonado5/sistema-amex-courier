import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { dniDb } from '@/lib/dni-matrix/db';

interface DniDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalSlots: number;
  padNum: (num: number) => string;
  onCleared: () => void;
  showToast: (text: string, type?: 'info' | 'success' | 'error') => void;
}

export function DniDeleteConfirmModal({
  isOpen,
  onClose,
  totalSlots,
  padNum,
  onCleared,
  showToast
}: DniDeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="dni-modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="dni-modal-card dni-modal-sm"
        style={{
          border: '1px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.22)'
        }}
      >
        <div className="dni-modal-body" style={{ padding: '28px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '62px',
              height: '62px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#ef4444',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)'
            }}
          >
            <Trash2 size={28} />
          </div>

          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.2px' }}>
            ¿Borrar todos los datos del lote?
          </h3>

          <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
            Esta acción eliminará de forma <strong>permanente e irreversible</strong> todos los expedientes (#001 a #{padNum(totalSlots)}), nombres cargados, y fotos de anverso y reverso guardadas en este navegador.
          </p>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '22px',
              textAlign: 'left'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>Esta acción no se puede deshacer. Se reiniciará la matriz en blanco con el cupo #001.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '10px 16px', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await dniDb.clearAllSlots();
                onCleared();
                showToast('Todos los datos del lote han sido eliminados correctamente', 'success');
              }}
              style={{
                flex: 1.3,
                padding: '10px 16px',
                fontWeight: 700,
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
              Sí, Borrar Todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
