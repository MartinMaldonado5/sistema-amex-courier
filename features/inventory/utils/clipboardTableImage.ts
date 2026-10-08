import { Paquete } from '@/types';

/**
 * Genera un canvas de alta resolución con la tabla corporativa de paquetes
 * con las columnas: Guía WR, Cliente / Consignatario, Ubicación (WMS) y Estado.
 */
export function renderPackagesTableCanvas(packages: Paquete[]): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const dpr = 2; // Factor de resolución 2x Retina para nitidez en pantallas de celular y WhatsApp

  const width = 820;
  const headerHeight = 85;
  const columnHeaderHeight = 36;
  const rowHeight = 38;
  const footerHeight = 44;
  const totalRows = Math.min(packages.length, 100); // Límite razonable por imagen
  const height = headerHeight + columnHeaderHeight + (totalRows * rowHeight) + footerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);

  // 1. Fondo general con esquinas redondeadas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Cabecera Corporativa (Gradiente Azul AMEX)
  const headerGrad = ctx.createLinearGradient(0, 0, width, headerHeight);
  headerGrad.addColorStop(0, '#0f172a');
  headerGrad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, width, headerHeight);

  // Logo / Título
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📦 AMEX COURIER', 20, 36);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Almacén Central Lince • Reporte de Bultos & Ubicación', 20, 56);

  // Fecha actual
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaStr = now.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Generado: ${fechaStr} ${horaStr}`, width - 20, 34);

  // Badge Contador de Bultos
  const totalKg = packages.reduce((acc, p) => acc + Number(p.pesoKg || 0), 0).toFixed(2);
  const badgeText = `${packages.length} ${packages.length === 1 ? 'BULTO' : 'BULTOS'} (${totalKg} kg)`;
  const badgeWidth = ctx.measureText(badgeText).width + 20;
  const badgeX = width - 20 - badgeWidth;
  const badgeY = 44;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, 24, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 16);

  // 3. Encabezados de Columna
  ctx.textAlign = 'left';
  const colY = headerHeight;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, colY, width, columnHeaderHeight);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, colY + columnHeaderHeight - 1, width, 1);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Coordenadas de columnas
  const colX = {
    wr: 20,
    nombre: 170,
    ubicacion: 480,
    estado: 660
  };

  ctx.fillText('GUÍA WR', colX.wr, colY + 23);
  ctx.fillText('CLIENTE / CONSIGNATARIO', colX.nombre, colY + 23);
  ctx.fillText('UBICACIÓN (WMS)', colX.ubicacion, colY + 23);
  ctx.fillText('ESTADO AMEX', colX.estado, colY + 23);

  // 4. Filas de Paquetes
  let currentY = headerHeight + columnHeaderHeight;

  packages.slice(0, totalRows).forEach((pkg, index) => {
    // Fondo alternado
    ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(0, currentY, width, rowHeight);

    // Borde inferior sutil
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, currentY + rowHeight - 1, width, 1);

    // Columna 1: Guía WR
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12.5px "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
    const wrText = pkg.numeroReciboBodega || pkg.tracking || 'S/N';
    ctx.fillText(wrText, colX.wr, currentY + 24);

    // Columna 2: Nombre de Cliente / Consignatario
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const rawNombre = (pkg.nombreConsignatario || 'CLIENTE AMEX').trim();
    const cleanNombre = rawNombre.length > 34 ? `${rawNombre.slice(0, 32)}...` : rawNombre;
    ctx.fillText(cleanNombre, colX.nombre, currentY + 24);

    // Columna 3: Ubicación WMS (Insignia visual)
    const pos =
      pkg.posicionEstante ||
      (pkg.anaquel && pkg.piso ? `${pkg.anaquel}-${pkg.piso}` : pkg.anaquel || 'REC');
    
    // Colores según zona
    let locBg = '#f1f5f9';
    let locColor = '#334155';
    let locBorder = '#cbd5e1';

    if (pos.startsWith('DSP')) {
      locBg = '#fdf2f8';
      locColor = '#9d174d';
      locBorder = '#fbcfe8';
    } else if (pos.startsWith('OFI')) {
      locBg = '#eff6ff';
      locColor = '#1d4ed8';
      locBorder = '#bfdbfe';
    } else if (pos.startsWith('A1') || pos.startsWith('A2')) {
      locBg = '#f0fdf4';
      locColor = '#15803d';
      locBorder = '#bbf7d0';
    } else if (pos.startsWith('REC')) {
      locBg = '#fffbeb';
      locColor = '#b45309';
      locBorder = '#fde68a';
    }

    const locText = `📍 ${pos}`;
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const locWidth = ctx.measureText(locText).width + 16;
    const locPillY = currentY + 8;

    ctx.fillStyle = locBg;
    ctx.beginPath();
    ctx.roundRect(colX.ubicacion, locPillY, locWidth, 22, 6);
    ctx.fill();

    ctx.strokeStyle = locBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = locColor;
    ctx.fillText(locText, colX.ubicacion + 8, locPillY + 15);

    // Columna 4: Estado AMEX (Píldora de estado)
    const rawEst = (pkg.estadoAmex || 'en_almacen').toLowerCase();
    const est = rawEst === 'recibido' ? 'en_almacen' : rawEst;
    let estBg = '#faf5ff';
    let estColor = '#7e22ce';
    let estLabel = 'EN ALMACÉN';

    if (est === 'entregado') {
      estBg = '#f0fdf4';
      estColor = '#15803d';
      estLabel = 'ENTREGADO';
    } else if (est === 'en_almacen') {
      estBg = '#faf5ff';
      estColor = '#7e22ce';
      estLabel = 'EN ALMACÉN';
    } else if (est === 'en_ruta') {
      estBg = '#fff7ed';
      estColor = '#c2410c';
      estLabel = 'EN RUTA';
    } else if (est === 'listo_recojo') {
      estBg = '#f0fdfa';
      estColor = '#0f766e';
      estLabel = 'LISTO RECOJO';
    }

    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const estWidth = ctx.measureText(estLabel).width + 16;
    const estPillY = currentY + 8;

    ctx.fillStyle = estBg;
    ctx.beginPath();
    ctx.roundRect(colX.estado, estPillY, estWidth, 22, 6);
    ctx.fill();

    ctx.fillStyle = estColor;
    ctx.fillText(estLabel, colX.estado + 8, estPillY + 15);

    currentY += rowHeight;
  });

  // 5. Pie de Página Corporativo
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, currentY, width, footerHeight);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, currentY, width, 1);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ Sistema AMEX Courier • Consulta en tiempo real de almacén', 20, currentY + 26);

  ctx.textAlign = 'right';
  ctx.fillText(`Mostrando ${packages.length} paquete(s)`, width - 20, currentY + 26);

  // Borde externo completo alrededor de la tarjeta
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  return canvas;
}

/**
 * Copia directamente la tabla de paquetes renderizada como imagen PNG al portapapeles.
 * Retorna true si tuvo éxito, o false si hubo un error.
 */
export async function copyPackagesTableAsImage(packages: Paquete[]): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  if (!packages || packages.length === 0) {
    return { success: false, count: 0, error: 'No hay paquetes seleccionados o filtrados para copiar.' };
  }

  try {
    const canvas = renderPackagesTableCanvas(packages);
    if (!canvas) {
      throw new Error('Canvas no está disponible en este entorno.');
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });

    if (!blob) {
      throw new Error('No se pudo generar la imagen a partir del canvas.');
    }

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return { success: true, count: packages.length };
    } else {
      // Fallback: descargar la imagen si la API de portapapeles está bloqueada
      downloadBlob(blob, `amex-paquetes-${Date.now()}.png`);
      return {
        success: true,
        count: packages.length,
        error: 'El navegador no permitió copiar directo; se descargó como imagen PNG.'
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('Error al copiar imagen:', err);

    // Fallback secundario de descarga
    try {
      const canvas = renderPackagesTableCanvas(packages);
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `amex-paquetes-${Date.now()}.png`;
        a.click();
        return {
          success: true,
          count: packages.length,
          error: 'No se pudo copiar al portapapeles directamente; se descargó como imagen PNG.'
        };
      }
      return { success: false, count: packages.length, error: msg };
    } catch {
      return { success: false, count: packages.length, error: msg };
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
