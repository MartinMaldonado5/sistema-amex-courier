'use client';

import React, { useState } from 'react';
import { AMEX_INFO_IMAGES, AmexInfoImage } from '@/features/info-amex/data/infoImages';
import { copyImageToClipboard, copyTextToClipboard, downloadImage } from '@/features/info-amex/utils/clipboard';
import '@/features/info-amex/components/infoAmex.css';

export default function InfoAmexTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  const handleCopyImage = async (item: AmexInfoImage) => {
    showToast('Copiando imagen al portapapeles...', 'info');
    const ok = await copyImageToClipboard(item.imageUrl);
    if (ok) {
      showToast(`¡Imagen copiada! Ve a WhatsApp y presiona Ctrl + V para enviarla.`);
    } else {
      showToast(`Enlace copiado. También puedes arrastrar la imagen directamente hacia WhatsApp.`, 'info');
    }
  };

  const handleCopyText = async (item: AmexInfoImage) => {
    const ok = await copyTextToClipboard(item.suggestedWhatsappText);
    if (ok) {
      showToast(`¡Texto para WhatsApp copiado al portapapeles!`);
    } else {
      showToast(`No se pudo copiar el texto automáticamente.`, 'error');
    }
  };

  // Helper para alimentar el evento dragstart con el archivo Blob real
  const handleDragStart = async (e: React.DragEvent<HTMLImageElement>, item: AmexInfoImage) => {
    try {
      const fullUrl = window.location.origin + item.imageUrl;
      e.dataTransfer.setData('text/uri-list', fullUrl);
      e.dataTransfer.setData('text/plain', fullUrl);

      // Descargar el blob para pasarlo como archivo al DataTransfer de WhatsApp Web
      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], item.filename, { type: 'image/jpeg' });
      if (e.dataTransfer.items && e.dataTransfer.items.add) {
        e.dataTransfer.items.add(file);
      }
    } catch {
      // Si falla la conversión a File, el navegador transferirá la URL del tag <img>
    }
  };

  const filteredImages = AMEX_INFO_IMAGES.filter((img) => {
    const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      img.title.toLowerCase().includes(query) ||
      img.description.toLowerCase().includes(query) ||
      img.quickSummary.some((s) => s.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="info-amex-container">
      {/* Toast Flotante */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 99999,
            background:
              toastMessage.type === 'success'
                ? '#10b981'
                : toastMessage.type === 'error'
                ? '#ef4444'
                : '#2563eb',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            fontSize: '13.5px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <i
            className={`fa-solid ${
              toastMessage.type === 'success'
                ? 'fa-circle-check'
                : toastMessage.type === 'error'
                ? 'fa-circle-xmark'
                : 'fa-spinner fa-spin'
            }`}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Cabecera / Filtros */}
      <div className="info-amex-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase'
                }}
              >
                Atención Clientes
              </span>
              <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 700 }}>
                Imágenes Fijas Oficiales
              </span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '23px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-photo-film" style={{ color: '#f59e0b' }} />
              Imágenes e Información Corporativa AMEX
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: '6px 0 0 0', lineHeight: 1.4 }}>
              Arrastra directamente cualquier imagen a tu ventana de WhatsApp o haz clic en <strong>"Copiar Imagen"</strong> para pegarla con <kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>Ctrl + V</kbd>.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '10px 16px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fa-brands fa-whatsapp" style={{ color: '#22c55e', fontSize: '24px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Modo Rápido</div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>Arrastrar o Copiar a WhatsApp</div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="info-amex-filter-bar">
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '13px'
              }}
            />
            <input
              type="text"
              placeholder="Buscar por tarifa, BBVA, casillero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`info-amex-filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-layer-group" />
            Todas ({AMEX_INFO_IMAGES.length})
          </button>
          <button
            onClick={() => setSelectedCategory('tarifas')}
            className={`info-amex-filter-btn ${selectedCategory === 'tarifas' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-tag" />
            Tarifas de Envío
          </button>
          <button
            onClick={() => setSelectedCategory('casillero')}
            className={`info-amex-filter-btn ${selectedCategory === 'casillero' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-box" />
            Casillero Miami
          </button>
          <button
            onClick={() => setSelectedCategory('pagos')}
            className={`info-amex-filter-btn ${selectedCategory === 'pagos' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-building-columns" />
            Cuentas BBVA
          </button>
          <button
            onClick={() => setSelectedCategory('sede')}
            className={`info-amex-filter-btn ${selectedCategory === 'sede' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-location-dot" />
            Sede Lince
          </button>
        </div>
      </div>

      {/* Grid de Imágenes Fijas (Sin Modales ni Popups) */}
      <div className="info-amex-grid">
        {filteredImages.map((item) => (
          <div key={item.id} className="info-card">
            {/* Categoría */}
            <span className="info-card-badge" style={{ backgroundColor: item.badgeColor }}>
              {item.categoryLabel}
            </span>

            {/* Hint de Arrastrar */}
            <div className="info-card-drag-hint">
              <i className="fa-solid fa-hand" /> Arrastra a WhatsApp
            </div>

            {/* Contenedor Fijo de la Imagen */}
            <div className="info-card-media">
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="eager"
                draggable={true}
                onDragStart={(e) => handleDragStart(e, item)}
                className="info-card-img"
                title="Arrastra esta imagen hacia WhatsApp Web o a cualquier ventana"
              />
              <div className="info-card-drag-bottom-banner">
                <i className="fa-solid fa-arrow-up-right-from-square" /> Haz clic sostenido y arrastra hacia WhatsApp
              </div>
            </div>

            {/* Contenido Fijo */}
            <div className="info-card-content">
              <h3 className="info-card-title">{item.title}</h3>
              <p className="info-card-desc">{item.description}</p>

              {/* Puntos Clave */}
              <div className="info-card-points">
                {item.quickSummary.map((point, pIdx) => (
                  <div key={pIdx} className="info-card-point-item">
                    <i className="fa-solid fa-check" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Acciones Rápidas */}
              <div className="info-card-actions">
                <button
                  type="button"
                  className="info-action-btn info-action-btn-copy-img"
                  onClick={() => handleCopyImage(item)}
                  title="Copia la imagen real al portapapeles. Luego presiona Ctrl + V en WhatsApp"
                >
                  <i className="fa-regular fa-copy" />
                  Copiar Imagen
                </button>

                <button
                  type="button"
                  className="info-action-btn info-action-btn-copy-text"
                  onClick={() => handleCopyText(item)}
                  title="Copia el mensaje de WhatsApp con formato listo para enviar"
                >
                  <i className="fa-brands fa-whatsapp" />
                  Copiar Texto
                </button>

                <button
                  type="button"
                  className="info-action-btn info-action-btn-download"
                  onClick={() => downloadImage(item.imageUrl, item.filename)}
                  title="Descargar imagen en tamaño original"
                >
                  <i className="fa-solid fa-download" />
                  Descargar Imagen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div
          style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8'
          }}
        >
          <i className="fa-solid fa-image" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }} />
          <h3 style={{ color: '#ffffff', margin: '0 0 6px 0' }}>No se encontraron imágenes</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>Prueba con otro término o selecciona "Todas".</p>
        </div>
      )}
    </div>
  );
}
