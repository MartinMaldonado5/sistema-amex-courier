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
        return <Receipt style={{ width: '16px', height: '16px' }} />;
      case 'Boxes':
        return <Boxes style={{ width: '16px', height: '16px' }} />;
      case 'Store':
        return <Store style={{ width: '16px', height: '16px' }} />;
      case 'Car':
        return <Car style={{ width: '16px', height: '16px' }} />;
      case 'ClipboardList':
        return <ClipboardList style={{ width: '16px', height: '16px' }} />;
      default:
        return <AlertCircle style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getUrgencyDotColor = (urgency: DailyTaskItem['urgency']) => {
    switch (urgency) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#2563eb';
      default:
        return '#10b981';
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Prioridades Operativas del Turno
            </span>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: tasks.length > 0 ? '#f59e0b' : '#10b981'
                }}
              />
              {tasks.length} {tasks.length === 1 ? 'pendiente' : 'pendientes'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            Flujos logísticos que requieren validación, reubicación de bultos o emisión en piso
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        >
          <CheckCircle2 style={{ width: '28px', height: '28px', color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Operación completamente al día
          </p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
            No se registran cobros pendientes de conciliar, bultos sin anaquel ni órdenes rezagadas.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {tasks.map(task => {
            const dotColor = getUrgencyDotColor(task.urgency);
            return (
              <div
                key={task.id}
                onClick={() => onNavigateTab(task.targetTab, task.targetParams)}
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
                className="hover:border-slate-400 hover:bg-slate-50"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getIcon(task.icon)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </span>
                      {task.badgeText && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor }} />
                          {task.badgeText}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {task.description}
                    </p>

                    {task.amountText && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
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
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#2563eb'
                  }}
                >
                  <span>{task.actionLabel}</span>
                  <ArrowRight style={{ width: '12px', height: '12px' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
