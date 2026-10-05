import type { Paquete, Cliente } from './index';

export type ScanWorkflowMode = 'slotting' | 'lookup' | 'delivery' | 'relocate' | 'general';

export interface BaseScanExtra {
  mode: ScanWorkflowMode;
  pkg?: Paquete;
  cli?: Cliente;
  location?: string;
  anaquel?: string;
  piso?: string;
}

export interface SlottingScanExtra extends BaseScanExtra {
  mode: 'slotting';
  location: string;
  anaquel: string;
  piso: string;
}

export interface RelocateScanExtra extends BaseScanExtra {
  mode: 'relocate';
  location: string;
  anaquel: string;
  piso: string;
}

export interface LookupScanExtra extends BaseScanExtra {
  mode: 'lookup';
}

export interface DeliveryScanExtra extends BaseScanExtra {
  mode: 'delivery';
}

export interface GeneralScanExtra extends BaseScanExtra {
  mode: 'general';
}

export type ScanConfirmExtra =
  | SlottingScanExtra
  | RelocateScanExtra
  | LookupScanExtra
  | DeliveryScanExtra
  | GeneralScanExtra;

export type OnScanConfirmHandler = (
  code: string,
  format: string,
  extra?: ScanConfirmExtra
) => void;
