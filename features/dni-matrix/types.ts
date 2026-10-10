import { Paquete, Cliente } from '@/types';
import { DniSlotData } from '@/lib/dni-matrix/db';
import { DniPrintSize } from '@/lib/dni-matrix/docx-exporter';

export type CloudSyncStatus = 'synced' | 'saving' | 'error';

export interface DniMatrixTabProps {
  paquetes?: Paquete[];
  clientes?: Cliente[];
  currentUser?: { nombre?: string; email?: string; rol?: string; id?: string } | null;
  onGlobalRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

export interface ZoomImageState {
  url: string;
  title: string;
  rotation: number;
  side?: 'anverso' | 'reverso';
}

export interface DniStats {
  ready: number;
  partial: number;
  empty: number;
}

export type DniFilterType = 'all' | 'ready' | 'partial' | 'empty';

export { type DniSlotData, type DniPrintSize };
