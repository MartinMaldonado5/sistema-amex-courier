import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
  status?: string; // Optional auto-detection based on ERP status string
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const VARIANT_MAP: Record<NonNullable<BadgeProps['variant']>, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
};

const DOT_MAP: Record<NonNullable<BadgeProps['variant']>, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  purple: 'bg-purple-500'
};

function getVariantFromStatus(status?: string): NonNullable<BadgeProps['variant']> {
  if (!status) return 'slate';
  const s = status.toUpperCase().trim();

  if (s === 'ENALMACEN' || s === 'EN ALMACEN' || s === 'ENTREGADO' || s === 'ENTREGADODOMICILIO' || s === 'RECOGIDOALMACEN' || s === 'ENCONTRADO' || s === 'ESCANEADO') {
    return 'green';
  }
  if (s === 'ENRUTACARROAMEX' || s === 'EN RUTA' || s === 'EN_TRANSITO' || s === 'TRANSITO') {
    return 'blue';
  }
  if (s === 'LISTOPARARECOJO' || s === 'PENDIENTE') {
    return 'amber';
  }
  if (s === 'NO_LISTADO' || s === 'NO ENCONTRADO' || s === 'EXTRAVIADO' || s === 'ANULADO') {
    return 'red';
  }
  return 'slate';
}

export default function Badge({
  children,
  variant,
  status,
  size = 'sm',
  dot = false,
  className = ''
}: BadgeProps) {
  const resolvedVariant = variant || (status ? getVariantFromStatus(status) : 'slate');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] font-semibold gap-1.5' : 'px-2.5 py-1 text-xs font-bold gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-full border leading-none shrink-0 ${VARIANT_MAP[resolvedVariant]} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_MAP[resolvedVariant]}`} />}
      {children}
    </span>
  );
}
