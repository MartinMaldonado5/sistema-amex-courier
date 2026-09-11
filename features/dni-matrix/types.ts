import { Paquete, Cliente } from '@/types';
import { DniSlotData } from '@/lib/dni-matrix/db';
import { DniPrintSize } from '@/lib/dni-matrix/docx-exporter';

export interface DniMatrixTabProps {
  paquetes?: Paquete[];
  clientes?: Cliente[];
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
}

export interface DniStats {
  ready: number;
  partial: number;
  empty: number;
}

export type DniFilterType = 'all' | 'ready' | 'partial' | 'empty';

export { type DniSlotData, type DniPrintSize };
