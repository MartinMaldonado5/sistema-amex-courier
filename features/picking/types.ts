import { Paquete, Cliente, OrdenPicking, ItemPicking, TipoEstadoPicking } from '@/types';

export type { Paquete, Cliente, OrdenPicking, ItemPicking, TipoEstadoPicking };

export type StatusFilter = 'ALL' | 'PENDING' | 'COMPLETED';

export interface PickingTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  onUpdatePackage?: (pkg: Paquete) => void;
}

export interface ScanFeedbackMessage {
  text: string;
  isError: boolean;
}

export interface ParsedPastedItem {
  code: string;
  pkg?: Paquete;
  cli?: Cliente;
  anaquel: string;
  isLocated: boolean;
}
