'use client';

import React from 'react';
import {
  AlertCircle,
  Receipt,
  Boxes,
  Store,
  Car,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { DailyTaskItem } from '../types';

interface DailyTasksSectionProps {
  tasks: DailyTaskItem[];
  onNavigateTab: (tabId: string, params?: any) => void;
}

export function DailyTasksSection({ tasks, onNavigateTab }: DailyTasksSectionProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Receipt':
        return <Receipt style={{ width: '18px', height: '18px' }} />;
      case 'Boxes':
        return <Boxes style={{ width: '18px', height: '18px' }} />;
      case 'Store':
        return <Store style={{ width: '18px', height: '18px' }} />;
      case 'Car':
        return <Car style={{ width: '18px', height: '18px' }} />;
      case 'ClipboardList':
        return <ClipboardList style={{ width: '18px', height: '18px' }} />;
      default:
        return <AlertCircle style={{ width: '18px', height: '18px' }} />;
    }
  };

  const getUrgencyStyles = (urgency: DailyTaskItem['urgency']) => {
    switch (urgency) {
      case 'critical':
        return {
          bgBadge: '#fef2f2',
          textBadge: '#991b1b',
          borderBadge: '#fecaca',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          borderCard: '#fca5a5'
        };
      case 'warning':
        return {
          bgBadge: '#fffbeb',
          textBadge: '#92400e',
          borderBadge: '#fde68a',
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          borderCard: '#fcd34d'
        };
      case 'info':
        return {
          bgBadge: '#eff6ff',
          textBadge: '#1e40af',
          borderBadge: '#bfdbfe',
          iconBg: '#dbeafe',
          iconColor: '#2563eb',
          borderCard: '#93c5fd'
        };
      default:
        return {
          bgBadge: '#ecfdf5',
          textBadge: '#065f46',
          borderBadge: '#a7f3d0',
          iconBg: '#d1fae5',
          iconColor: '#059669',
          borderCard: '#6ee7b7'
        };
    }
  };

  return (
    <div
      style={{
        padding: '8px 18px',
        flexShrink: 0
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles style={{ width: '16px', height: '16px', color: '#d97706' }} />
                Tareas Diarias & Prioridades Operativas del Negocio
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '10.5px',
                  fontWeight: 900,
                  background: tasks.length > 0 ? '#fef2f2' : '#ecfdf5',
                  color: tasks.length > 0 ? '#b91c1c' : '#047857',
                  border: tasks.length > 0 ? '1px solid #fecaca' : '1px solid #a7f3d0'
                }}
              >
                {tasks.length} {tasks.length === 1 ? 'pendiente' : 'pendientes'}
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Flujos que requieren validación, reubicación de bultos o despacho el día de hoy
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px dashed #cbd5e1'
            }}
          >
            <CheckCircle2 style={{ width: '32px', height: '32px', color: '#10b981', margin: '0 auto 6px' }} />
            <p style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              ¡Todo al día en la operación!
            </p>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              No hay cobros pendientes, bultos sin anaquel ni órdenes rezagadas en este momento.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px'
            }}
          >
            {tasks.map(task => {
              const styles = getUrgencyStyles(task.urgency);
              return (
                <div
                  key={task.id}
                  onClick={() => onNavigateTab(task.targetTab, task.targetParams)}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="hover:bg-white hover:border-blue-300 hover:shadow-sm"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: styles.iconBg,
                        color: styles.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getIcon(task.icon)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </span>
                        {task.badgeText && (
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 900,
                              background: styles.bgBadge,
                              color: styles.textBadge,
                              border: `1px solid ${styles.borderBadge}`,
                              flexShrink: 0
                            }}
                          >
                            {task.badgeText}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '11px', color: '#64748b', margin: '3px 0 0 0', lineHeight: 1.3 }}>
                        {task.description}
                      </p>

                      {task.amountText && (
                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#047857', marginTop: '4px', fontFamily: 'monospace' }}>
                          {task.amountText}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#2563eb'
                    }}
                  >
                    <span>{task.actionLabel}</span>
                    <ArrowRight style={{ width: '13px', height: '13px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
