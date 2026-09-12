'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';

interface AmexitoAiRotulosPanelProps {
  isAiCardExpanded: boolean;
  setIsAiCardExpanded: (expanded: boolean) => void;
  aiInputText: string;
  setAiInputText: (text: string) => void;
  aiImagePreview: string | null;
  setAiImagePreview: (preview: string | null) => void;
  isAiProcessing: boolean;
  handleProcessWithAmexito: () => void;
  handlePasteCapture: (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => void;
  playSound: (type: 'complete' | 'paste' | 'click' | 'error') => void;
  amexitoRef: React.RefObject<HTMLDivElement | null>;
}

export const AmexitoAiRotulosPanel: React.FC<AmexitoAiRotulosPanelProps> = ({
  isAiCardExpanded,
  setIsAiCardExpanded,
  aiInputText,
  setAiInputText,
  aiImagePreview,
  setAiImagePreview,
  isAiProcessing,
  handleProcessWithAmexito,
  handlePasteCapture,
  playSound,
  amexitoRef
}) => {
  return (
    <div
      className="rotulo-toolbar-col amexito"
      ref={amexitoRef}
      onPaste={(e) => {
        setIsAiCardExpanded(true);
        handlePasteCapture(e);
      }}
    >
      <button
        type="button"
        className={`btn-toolbar-col btn-amexito-col ${isAiCardExpanded ? 'open' : ''}`}
        onClick={() => {
          setIsAiCardExpanded(!isAiCardExpanded);
          playSound('click');
        }}
        title={isAiCardExpanded ? 'Ocultar AMEXito IA' : 'Usar AMEXito IA para autocompletar con texto o capturas'}
      >
        <div className="btn-col-content">
          <span className="ai-robot-icon">🤖</span>
          <span className="btn-col-title">AMEXito IA</span>
        </div>
        <div className="btn-col-right">
          {(aiImagePreview || aiInputText) && (
            <span className="amexito-dot-indicator" title="Con datos cargados"></span>
          )}
          <i className={`fa-solid ${isAiCardExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} btn-col-arrow`}></i>
        </div>
      </button>

      {isAiCardExpanded && (
        <div className="rotulo-ai-card expanded">
          <div className="ai-card-header">
            <div className="ai-card-identity">
              <div className="ai-avatar-icon">
                <span className="ai-robot-icon" style={{ fontSize: '1.2rem' }}>🤖</span>
              </div>
              <div className="ai-card-titles">
                <div className="ai-card-name-row">
                  <span className="ai-card-name">AMEXito IA</span>
                  {(aiImagePreview || aiInputText) && (
                    <span className="ai-card-badge-pending">
                      <i className="fa-solid fa-circle-check"></i> Con datos listos
                    </span>
                  )}
                </div>
                <span className="ai-card-sub">
                  Pega texto o presiona Ctrl + V con una captura para autocompletar automáticamente
                </span>
              </div>
            </div>

            <button
              type="button"
              className="ai-collapse-btn"
              onClick={() => {
                setIsAiCardExpanded(false);
                playSound('click');
              }}
              title="Ocultar AMEXito IA"
            >
              <i className="fa-solid fa-chevron-up"></i>
              <span>Ocultar</span>
            </button>
          </div>

          <div className="ai-input-area">
            <div className="ai-textarea-wrapper">
              <textarea
                className="ai-textarea"
                placeholder="Pega aquí el texto del pedido o presiona Ctrl + V con una captura de WhatsApp (ej: CE79, 2 cajas, Shalom, Nombre, DNI, Teléfono...)"
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                onPaste={handlePasteCapture}
                rows={2}
                autoFocus
              />
              {aiInputText && (
                <button
                  type="button"
                  className="ai-textarea-quick-clear"
                  onClick={() => setAiInputText('')}
                  title="Borrar texto"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {aiImagePreview && (
              <div className="ai-image-preview-chip">
                <div className="ai-image-thumb-wrapper">
                  <img src={aiImagePreview} alt="Captura cargada" className="ai-image-thumb" />
                </div>
                <div className="ai-image-info">
                  <div className="ai-image-header-line">
                    <strong>Captura de WhatsApp cargada</strong>
                    <span className="ai-image-ready-tag">Lista para extraer</span>
                  </div>
                  <span>AMEXito extraerá automáticamente los datos del envío</span>
                </div>
                <button
                  type="button"
                  className="ai-remove-img-btn"
                  onClick={() => setAiImagePreview(null)}
                  title="Quitar captura"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Quitar</span>
                </button>
              </div>
            )}

            <div className="ai-controls-row">
              {(aiInputText || aiImagePreview) && (
                <button
                  type="button"
                  className="ai-clear-btn"
                  onClick={() => {
                    setAiInputText('');
                    setAiImagePreview(null);
                  }}
                  title="Limpiar entrada de IA"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  <span>Limpiar</span>
                </button>
              )}

              <button
                type="button"
                className="ai-submit-btn"
                onClick={handleProcessWithAmexito}
                disabled={isAiProcessing || (!aiInputText.trim() && !aiImagePreview)}
                title="Interpretar con AMEXito IA y rellenar automáticamente los campos"
              >
                {isAiProcessing ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>AMEXito analizando...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Rellenar con AMEXito IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
