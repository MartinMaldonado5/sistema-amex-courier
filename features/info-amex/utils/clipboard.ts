/**
 * Copia una imagen al portapapeles como archivo PNG Blob
 * para que al presionar Ctrl+V en WhatsApp Web o cualquier app se pegue como imagen directamente.
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Crear un canvas para convertir con seguridad a PNG si no lo está (ClipboardItem requiere image/png para máximo soporte)
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    const pngBlob = await new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b), 'image/png');
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });

    if (pngBlob && navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': pngBlob });
      await navigator.clipboard.write([item]);
      return true;
    }

    // Fallback: Si ClipboardItem falla o no se pudo convertir, copiar el enlace directo
    await navigator.clipboard.writeText(window.location.origin + imageUrl);
    return false;
  } catch (err) {
    console.error('Error al copiar imagen al portapapeles:', err);
    try {
      await navigator.clipboard.writeText(window.location.origin + imageUrl);
      return false;
    } catch {
      return false;
    }
  }
}

/**
 * Copia texto con formato al portapapeles
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Error al copiar texto:', err);
    return false;
  }
}

/**
 * Descarga la imagen al equipo del usuario
 */
export function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
