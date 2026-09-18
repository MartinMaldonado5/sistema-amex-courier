import { Paquete, Cliente, OrdenEntrega, CobroVoucher } from '@/types';

export type TimeFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
export type PackageStatusFilter = 'ALL' | 'LINCE' | 'EN_RUTA' | 'ENTREGADO' | 'PENDIENTE_PAGO';

export interface DailyTaskItem {
  id: string;
  title: string;
  description: string;
  count: number;
  badgeText?: string;
  amountText?: string;
  urgency: 'critical' | 'warning' | 'info' | 'success';
  icon: string;
  targetTab: string;
  targetParams?: any;
  actionLabel: string;
}

export interface ShelfCapacityStat {
  code: string;
  name: string;
  zone: string;
  count: number;
  capacity: number;
  percentage: number;
  color: string;
  status: 'normal' | 'optimal' | 'warning' | 'full';
}

export interface PaymentMethodStat {
  method: string;
  label: string;
  count: number;
  totalSoles: number;
  percentage: number;
  color: string;
}

export interface DeliveryChannelStat {
  channel: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PackageTypeStat {
  type: string;
  label: string;
  count: number;
  totalWeightKg: number;
  percentage: number;
  color: string;
}

export interface ExecutiveKpis {
  // Finanzas
  totalCobradoSoles: number;
  totalCobradoDolares: number;
  totalPendienteSoles: number;
  totalPendienteDolares: number;
  tasaCobranzaPorcentaje: number;
  totalVouchers: number;
  vouchersValidadosCount: number;
  vouchersPendientesCount: number;

  // Carga e Inventario
  totalPaquetes: number;
  paquetesEnLince: number;
  paquetesEnRuta: number;
  paquetesEntregados: number;
  paquetesSinUbicar: number;
  totalPesoKgLince: number;
  pesoPromedioKg: number;

  // Clientes & Entrega
  totalClientes: number;
  clientesConPaquetesActivos: number;
  tasaEntregaPorcentaje: number;
  ordenesMostradorActivas: number;
  ordenesMostradorListas: number;
}

export interface DashboardTabProps {
  paquetes: Paquete[];
  clientes: Cliente[];
  entregas: OrdenEntrega[];
  cobros: CobroVoucher[];
  onNavigateTab: (tabId: string, extra?: any) => void;
  onNewPackage: () => void;
  onPrintLabel: (pkg: Paquete) => void;
  onViewPdf: (url: string) => void;
  onRefreshData?: () => Promise<void> | void;
}
