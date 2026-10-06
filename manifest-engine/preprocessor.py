import io
from typing import List, Tuple
import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image

def pdf_to_images(pdf_bytes: bytes, dpi: int = 300) -> List[np.ndarray]:
    """
    Convierte cada página de un PDF en una imagen NumPy (formato BGR para OpenCV).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    
    zoom = dpi / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img_data = pix.tobytes("png")
        
        # Convertir a imagen OpenCV (BGR)
        nparr = np.frombuffer(img_data, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        images.append(img_bgr)
        
    doc.close()
    return images

def bytes_to_cv2_image(image_bytes: bytes) -> np.ndarray:
    """Convierte un buffer de bytes de imagen (PNG/JPG) a formato OpenCV BGR."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def auto_rotate_and_deskew(image: np.ndarray) -> np.ndarray:
    """
    Detecta si la imagen está rotada a 90, 180 o 270 grados y corrige
    la inclinación usando detección de líneas morfológicas.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Verificar relación de aspecto. Si el ancho es mucho mayor que el alto,
    # y el documento es vertical (A4), rotar 90 grados a la derecha o izquierda.
    h, w = gray.shape[:2]
    if w > h:
        # Página apaisada -> Rotar a vertical estándar
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape[:2]

    # 2. Detección de ángulo de inclinación (Deskew)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    
    # Buscar contornos de líneas
    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        # Si la inclinación está dentro de un rango sutil (-10 a 10 grados), corregir
        if abs(angle) > 0.5 and abs(angle) < 15:
            (center_h, center_w) = (h // 2, w // 2)
            M = cv2.getRotationMatrix2D((center_w, center_h), angle, 1.0)
            image = cv2.warpAffine(
                image, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            
    return image
