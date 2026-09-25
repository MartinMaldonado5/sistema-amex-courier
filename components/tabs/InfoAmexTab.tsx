'use client';

import React, { useState } from 'react';
import { AMEX_INFO_IMAGES, AmexInfoImage } from '@/features/info-amex/data/infoImages';
import { copyImageToClipboard, copyTextToClipboard, downloadImage } from '@/features/info-amex/utils/clipboard';
import '@/features/info-amex/components/infoAmex.css';

export default function InfoAmexTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
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

  // Toggle de selección individual de imagen
  const handleToggleSelect = (id: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Seleccionar todas o deseleccionar todas
  const handleSelectAll = (filteredItems: AmexInfoImage[]) => {
    if (selectedImageIds.length === filteredItems.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(filteredItems.map((img) => img.id));
    }
  };

  // Helper para arrastrar una sola imagen
  const handleDragStartSingle = async (e: React.DragEvent<HTMLElement>, item: AmexInfoImage) => {
    try {
      const fullUrl = window.location.origin + item.imageUrl;
      e.dataTransfer.setData('text/uri-list', fullUrl);
      e.dataTransfer.setData('text/plain', fullUrl);

      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], item.filename, { type: 'image/jpeg' });
      if (e.dataTransfer.items && e.dataTransfer.items.add) {
        e.dataTransfer.items.add(file);
      }
    } catch {
      // Fallback nativo de URL
    }
  };

  // Helper para arrastrar MÚLTIPLES imágenes a la vez hacia WhatsApp
  const handleDragStartMultiple = async (e: React.DragEvent<HTMLElement>, selectedItems: AmexInfoImage[]) => {
    try {
      const urls = selectedItems.map((item) => window.location.origin + item.imageUrl).join('\n');
      e.dataTransfer.setData('text/uri-list', urls);
      e.dataTransfer.setData('text/plain', urls);

      // Cargar en paralelo todos los blobs para añadirlos como archivos múltiples al DataTransfer
      const filePromises = selectedItems.map(async (item) => {
        const res = await fetch(item.imageUrl);
        const blob = await res.blob();
        return new File([blob], item.filename, { type: 'image/jpeg' });
      });

      const files = await Promise.all(filePromises);
      if (e.dataTransfer.items && e.dataTransfer.items.add) {
        files.forEach((f) => {
          e.dataTransfer.items.add(f);
        });
      }
    } catch (err) {
      console.error('Error al empaquetar archivos múltiples:', err);
    }
  };

  // Copiar todos los textos de los elementos seleccionados
  const handleCopyCombinedTexts = async (selectedItems: AmexInfoImage[]) => {
    const combined = selectedItems
      .map((item, idx) => `──────────────\n📌 *(${idx + 1}) ${item.title}*\n${item.suggestedWhatsappText}`)
      .join('\n\n');

    const ok = await copyTextToClipboard(combined);
    if (ok) {
      showToast(`¡Textos de las ${selectedItems.length} imágenes copiados al portapapeles!`);
    } else {
      showToast(`No se pudo copiar el texto.`, 'error');
    }
  };

  // Descargar todas las seleccionadas
  const handleDownloadAllSelected = (selectedItems: AmexInfoImage[]) => {
    selectedItems.forEach((item, index) => {
      setTimeout(() => {
        downloadImage(item.imageUrl, item.filename);
      }, index * 250);
    });
    showToast(`Iniciando descarga de ${selectedItems.length} imágenes...`);
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

  const selectedImagesList = AMEX_INFO_IMAGES.filter((img) => selectedImageIds.includes(img.id));

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
                Imágenes Corporativas AMEX
              </span>
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '23px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-photo-film" style={{ color: '#f59e0b' }} />
              Imágenes e Información Corporativa AMEX
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: '6px 0 0 0', lineHeight: 1.4 }}>
              Arrastra una imagen individual o <strong>selecciona varias imágenes</strong> con la casilla de verificación para arrastrarlas juntas a WhatsApp en un solo movimiento.
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
            <i className="fa-brands fa-whatsapp" style={{ color: '#22c55e', fontSize: '26px' }} />
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>WhatsApp Web</div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 800 }}>Envío Individual o Múltiple</div>
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
            Tarifas
          </button>
          <button
            onClick={() => setSelectedCategory('casillero')}
            className={`info-amex-filter-btn ${selectedCategory === 'casillero' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-box" />
            Casillero
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

          {/* Botón para seleccionar todo el grupo */}
          <button
            onClick={() => handleSelectAll(filteredImages)}
            style={{
              marginLeft: 'auto',
              background: 'rgba(51, 65, 85, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fa-solid ${selectedImageIds.length === filteredImages.length && filteredImages.length > 0 ? 'fa-square-check' : 'fa-check-double'}`} />
            {selectedImageIds.length === filteredImages.length && filteredImages.length > 0
              ? 'Deseleccionar Todas'
              : 'Seleccionar Todas'}
          </button>
        </div>
      </div>

      {/* BARRA DE ACCIÓN PARA SELECCIÓN MÚLTIPLE */}
      {selectedImagesList.length > 0 && (
        <div className="info-multi-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                background: '#22c55e',
                color: '#ffffff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '13px'
              }}
            >
              {selectedImagesList.length}
            </span>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 800 }}>
                {selectedImagesList.length === 1
                  ? '1 Imagen Seleccionada'
                  : `${selectedImagesList.length} Imágenes Seleccionadas`}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                Arrastra la cápsula verde directamente hacia el chat de WhatsApp Web.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* CÁPSULA ARRASTRABLE DEL LOTE */}
            <div
              className="info-multi-drag-zone"
              draggable={true}
              onDragStart={(e) => handleDragStartMultiple(e, selectedImagesList)}
              title="Haz clic sostenido aquí y suéltalo en WhatsApp para enviar todas las seleccionadas a la vez"
            >
              <i className="fa-solid fa-hand-holding-hand" style={{ fontSize: '16px' }} />
              <span>ARRASTRAR LOTE ({selectedImagesList.length}) A WHATSAPP</span>
            </div>

            {/* Copiar textos combinados */}
            <button
              type="button"
              onClick={() => handleCopyCombinedTexts(selectedImagesList)}
              style={{
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                padding: '9px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-brands fa-whatsapp" /> Copiar Textos
            </button>

            {/* Descargar seleccionadas */}
            <button
              type="button"
              onClick={() => handleDownloadAllSelected(selectedImagesList)}
              style={{
                background: 'rgba(51, 65, 85, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '9px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-download" /> Descargar ({selectedImagesList.length})
            </button>

            {/* Desmarcar */}
            <button
              type="button"
              onClick={() => setSelectedImageIds([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '12.5px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid de Imágenes Fijas */}
      <div className="info-amex-grid">
        {filteredImages.map((item) => {
          const isSelected = selectedImageIds.includes(item.id);
          return (
            <div key={item.id} className={`info-card ${isSelected ? 'selected' : ''}`}>
              {/* Casilla de Selección Múltiple */}
              <label
                className="info-card-checkbox-label"
                onClick={(e) => e.stopPropagation()}
                title="Marca para incluir en el envío múltiple"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleSelect(item.id)}
                  className="info-card-checkbox"
                />
                <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? '#4ade80' : '#cbd5e1' }}>
                  {isSelected ? 'SELECCIONADA' : 'SELECCIONAR'}
                </span>
              </label>

              {/* Categoría */}
              <span className="info-card-badge" style={{ backgroundColor: item.badgeColor }}>
                {item.categoryLabel}
              </span>

              {/* Contenedor Fijo de la Imagen */}
              <div className="info-card-media">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="eager"
                  draggable={true}
                  onDragStart={(e) => handleDragStartSingle(e, item)}
                  className="info-card-img"
                  title="Arrastra esta imagen individual hacia WhatsApp Web o márcala para envío múltiple"
                />
                <div className="info-card-drag-bottom-banner">
                  <i className="fa-solid fa-arrow-up-right-from-square" /> Arrastra a WhatsApp
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
          );
        })}
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
