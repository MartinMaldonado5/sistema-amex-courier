'use client';

import React from 'react';
import { RotuloSlotData } from '@/lib/rotulos/rotulos-pdf';
import { MAX_SHEETS, getAgencyClass, generarTextoBulto } from '../types';
import { extractPrimerNombre } from '@/lib/auth/userUtils';
import { supabase } from '@/lib/supabase/client';

interface RotulosSheetPreviewProps {
  slots: RotuloSlotData[];
  currentSheetSlots: RotuloSlotData[];
  currentSheet: number;
  totalSheets: number;
  activeSlotId: number;
  setActiveSlotId: (id: number) => void;
  setCurrentSheet: (sheet: number) => void;
  slotsAiData?: Record<number, { text: string; image: string | null }>;
  currentUser?: { nombre?: string; email?: string } | null;
}

export const RotulosSheetPreview: React.FC<RotulosSheetPreviewProps> = ({
  slots,
  currentSheetSlots,
  currentSheet,
  totalSheets,
  activeSlotId,
  setActiveSlotId,
  setCurrentSheet,
  slotsAiData,
  currentUser
}) => {
  // Identificación del usuario actual (primer nombre)
  const [sessionUser, setSessionUser] = React.useState<{ nombre?: string; email?: string } | null>(currentUser || null);

  React.useEffect(() => {
    if (currentUser?.nombre || currentUser?.email) {
      setSessionUser(currentUser);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata || {};
        setSessionUser({
          nombre: (meta.nombre_completo as string) || (meta.nombre as string) || '',
          email: data.user.email || ''
        });
      }
    });
  }, [currentUser]);

  const primerNombre = extractPrimerNombre(sessionUser?.nombre, sessionUser?.email);

  // Estampa de fecha y hora en vivo para visualización e impresión exacta
  const [liveTimestamp, setLiveTimestamp] = React.useState<string>('');

  React.useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const getFormatted = () => {
      const now = new Date();
      return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };
    setLiveTimestamp(getFormatted());
    const interval = setInterval(() => {
      setLiveTimestamp(getFormatted());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderStrip = (slot: RotuloSlotData, isInteractive = true) => {
    const hasData = Boolean(slot.nombre || slot.dni || slot.celular || slot.destino);
    const agencyClass = getAgencyClass(slot.agencia);
    const agencyDisplayName =
      slot.agencia === 'OTRA' && slot.agenciaOtra?.trim()
        ? slot.agenciaOtra
        : (slot.agencia || 'SIN AGENCIA');

    const sheetNum = Math.ceil(slot.id / 5);
    const slotInSheet = ((slot.id - 1) % 5) + 1;
    const isEditingThisSlot = isInteractive && slot.id === activeSlotId;

    return (
      <div
        key={slot.id}
        className={`rotulo-strip-preview ${isEditingThisSlot ? 'active' : ''}`}
        onClick={
          isInteractive
            ? () => {
                setActiveSlotId(slot.id);
                setCurrentSheet(sheetNum);
              }
            : undefined
        }
        title={isInteractive ? `Clic para editar Hoja ${sheetNum} — Espacio #${slotInSheet}` : undefined}
      >
        {hasData ? (
          <>
            <div className="strip-header">
              <div className="strip-header-left">
                <div className="strip-remitente-logo-wrap" title="AMEX COURIER PERÚ">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/logo-amex-clean.png"
                    alt="AMEX Courier"
                    className="strip-remitente-logo-img"
                  />
                </div>
                {isEditingThisSlot && (
                  <span className="strip-active-tag">
                    <i className="fa-solid fa-pen-nib"></i> EDITANDO ESPACIO #{slotInSheet}
                  </span>
                )}
              </div>
              <div className="strip-header-right">
                <span className="strip-user-badge" title={`Operador: ${primerNombre}`}>
                  <i className="fa-solid fa-user" style={{ marginRight: '4px', fontSize: '0.62rem', opacity: 0.85 }}></i>
                  {primerNombre}
                </span>
                <span className="strip-timestamp-badge" title="Fecha y hora de emisión">
                  <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                  {slot.fechaImpresion || liveTimestamp || '00/00/0000 00:00:00'}
                </span>
                <span className="strip-bulto-badge">
                  <i className="fa-solid fa-box-archive" style={{ marginRight: '5px' }}></i>
                  {(slot.observacion?.trim() || generarTextoBulto(slot.numeroRotulo || 1, slot.totalRotulos || 1, slot.totalCajas || '1')).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="strip-destinatario-row">
              <div className="strip-destinatario" title={slot.nombre}>
                {slot.nombre || 'NOMBRE Y APELLIDO'}
              </div>
              {slot.siglas?.trim() && (
                <div className="strip-siglas-badge" title="Siglas / Código de envío">
                  {slot.siglas.trim().toUpperCase()}
                </div>
              )}
            </div>

            <div className="strip-docs-column">
              <div className="strip-doc-line">
                <span className="strip-doc-label">DNI / RUC:</span>
                <strong className="strip-doc-value">{slot.dni || '—'}</strong>
              </div>
              <div className="strip-doc-line">
                <span className="strip-doc-label">CEL:</span>
                <strong className="strip-doc-value">{slot.celular || '—'}</strong>
              </div>
            </div>

            <div className="strip-agency-row">
              <span className={`strip-agency-badge ${agencyClass}`} title={`Agencia: ${agencyDisplayName}`}>
                {agencyDisplayName}
              </span>
              <div className="strip-destination-box">
                <span className="strip-destination-label">DESTINO:</span>
                <span className="strip-destination-value">
                  {slot.destino?.trim() ? slot.destino.trim().toUpperCase() : 'DESTINO NO ESPECIFICADO'}
                </span>
              </div>
            </div>
          </>
        ) : (
          (() => {
            const hasAiData = Boolean(slotsAiData?.[slot.id]?.text || slotsAiData?.[slot.id]?.image);
            return (
              <div className={`strip-empty-placeholder ${hasAiData ? 'has-ai-pending' : ''}`}>
                <span>
                  {hasAiData ? (
                    <>
                      <span style={{ marginRight: '6px', fontSize: '1rem' }}>🤖</span>
                      <strong style={{ color: '#38bdf8' }}>
                        [ Hoja {sheetNum} — Espacio #{slotInSheet}: Datos de AMEXito IA listos para rellenar ]
                      </strong>
                    </>
                  ) : (
                    <>
                      <i className="fa-regular fa-square-plus" style={{ marginRight: '6px', opacity: 0.7 }}></i>
                      [ Hoja {sheetNum} — Espacio #{slotInSheet} libre {isInteractive ? '• Clic para editar' : ''} ]
                    </>
                  )}
                </span>
              </div>
            );
          })()
        )}
      </div>
    );
  };

  return (
    <div className="rotulos-preview-container">
      {/* 1. Hoja A4 en Pantalla */}
      <div className="rotulos-a4-sheet screen-only-sheet">
        {currentSheetSlots.map((slot) => renderStrip(slot, true))}
      </div>

      {/* Contenedor Oculto para Impresión (window.print()) con todas las hojas físicas */}
      <div className="print-sheets-wrapper">
        {Array.from({ length: totalSheets }, (_, sheetIdx) => {
          const pageSlots = slots.slice(sheetIdx * 5, (sheetIdx + 1) * 5);
          return (
            <div key={sheetIdx} className="rotulos-a4-sheet print-sheet-page">
              {pageSlots.map((slot) => renderStrip(slot, false))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
