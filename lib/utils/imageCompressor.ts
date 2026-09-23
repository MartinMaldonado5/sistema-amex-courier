/**
 * Utilidad de compresión inteligente de imágenes en el cliente (Frontend)
 * para optimización de latencia en peticiones a Gemini / AMEXito IA.
 * 
 * Reduce imágenes de 5-12 MB (cámara de celular / capturas 4K) a ~120-180 KB
 * manteniendo nitidez tipográfica óptima para OCR de DNIs, rótulos y boletas.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Comprime una imagen en formato base64 o data URL reduciendo dimensiones y peso.
 * Si se ejecuta en el servidor (SSR) o el input no es imagen, retorna el valor original intacto.
 */
export async function compressImageForAi(
  base64OrDataUrl: string,
  maxWidth = 1200,
  quality = 0.85,
  rotationDegrees = 0
): Promise<string> {
  if (typeof window === 'undefined' || !base64OrDataUrl) {
    return base64OrDataUrl;
  }

  // Si no es imagen (ej: application/pdf), retornar sin modificar
  if (base64OrDataUrl.startsWith('data:application/pdf') || base64OrDataUrl.includes('application/pdf')) {
    return base64OrDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;
          const origWidth = width;
          const origHeight = height;

          // Redimensionar proporcionalmente si supera maxWidth
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const normRotation = ((rotationDegrees % 360) + 360) % 360;
          const isSideways = normRotation === 90 || normRotation === 270;

          const canvas = document.createElement('canvas');
          canvas.width = isSideways ? height : width;
          canvas.height = isSideways ? width : height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(base64OrDataUrl);
            return;
          }

          // Renderizado suavizado de alta calidad para preservar caracteres tipográficos
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fondo blanco para manejar PNGs transparentes al exportar a JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Si hay rotación, centrar y rotar el lienzo para enviar la imagen derecha a la IA
          if (normRotation !== 0) {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((normRotation * Math.PI) / 180);
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
            ctx.restore();
          } else {
            ctx.drawImage(img, 0, 0, width, height);
          }

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          if (process.env.NODE_ENV === 'development') {
            const origSizeKB = Math.round((base64OrDataUrl.length * 3) / 4 / 1024);
            const compSizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
            const savedPct = origSizeKB > 0 ? Math.round(((origSizeKB - compSizeKB) / origSizeKB) * 100) : 0;
            console.debug(
              `⚡ [AMEXito Compressor] ${origWidth}x${origHeight} (${origSizeKB} KB) ➔ Rot:${normRotation}° ➔ ${canvas.width}x${canvas.height} (${compSizeKB} KB) | Reducción: -${savedPct}%`
            );
          }

          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('[AMEXito Compressor] Error al comprimir en canvas, usando original:', err);
          resolve(base64OrDataUrl);
        }
      };

      img.onerror = (e) => {
        console.warn('[AMEXito Compressor] No se pudo cargar imagen para compresión:', e);
        resolve(base64OrDataUrl);
      };

      // Si es base64 puro sin cabecera data:, anteponer data:image/jpeg;base64,
      if (!base64OrDataUrl.startsWith('data:')) {
        img.src = `data:image/jpeg;base64,${base64OrDataUrl}`;
      } else {
        img.src = base64OrDataUrl;
      }
    } catch (err) {
      console.warn('[AMEXito Compressor] Excepción en compressImageForAi:', err);
      resolve(base64OrDataUrl);
    }
  });
}

/**
 * Convierte y comprime un archivo (File) para envío directo a la API de IA.
 * Si es PDF se mantiene en PDF, si es imagen se redimensiona a JPEG comprimido.
 */
export async function compressFileForAi(
  file: File,
  maxWidth = 1200,
  quality = 0.82
): Promise<{ mimeType: string; base64: string }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      mimeType: 'application/pdf',
      base64: buffer.toString('base64')
    };
  }

  // Es una imagen (JPEG, PNG, WEBP, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const rawDataUrl = reader.result as string;
        const compressedDataUrl = await compressImageForAi(rawDataUrl, maxWidth, quality);
        
        // Extraer mimeType y base64 puro
        const commaIdx = compressedDataUrl.indexOf(',');
        const base64 = commaIdx !== -1 ? compressedDataUrl.substring(commaIdx + 1) : compressedDataUrl;
        const mimeMatch = compressedDataUrl.substring(0, commaIdx).match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

        resolve({ mimeType, base64 });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
