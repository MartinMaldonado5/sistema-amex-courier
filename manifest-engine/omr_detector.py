import cv2
import numpy as np
from typing import Dict, Optional

def detect_modalidad_omr(image: np.ndarray) -> str:
    """
    Detecta cuál casilla de verificación está marcada en el encabezado
    (DOMICILIO, OFICINA o PROVINCIA) utilizando análisis morfológico de densidad.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]
    
    # El bloque de modalidades se ubica en la esquina superior derecha (0 a 35% del alto, 65% a 98% del ancho)
    header_crop = gray[0:int(h * 0.35), int(w * 0.65):w]
    
    # Binarizar invirtiendo (marcas en blanco, fondo en negro)
    thresh = cv2.adaptiveThreshold(
        header_crop, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 21, 10
    )
    
    # Buscar contornos rectangulares (casillas de verificación)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        aspect_ratio = bw / float(bh)
        area = bw * bh
        
        # Filtro de tamaño aproximado de un checkbox (ancho y alto entre 15 y 80 px, proporción 0.7 a 1.4)
        if 0.7 <= aspect_ratio <= 1.4 and 250 <= area <= 6000:
            roi = thresh[y:y+bh, x:x+bw]
            total_pixels = bw * bh
            marked_pixels = cv2.countNonZero(roi)
            density = marked_pixels / float(total_pixels)
            boxes.append({'y': y, 'x': x, 'w': bw, 'h': bh, 'density': density})
            
    # Ordenar casillas de arriba a abajo (DOMICILIO = arriba, OFICINA = medio, PROVINCIA = abajo)
    boxes = sorted(boxes, key=lambda b: b['y'])
    
    if len(boxes) >= 3:
        # Evaluar cuál tiene mayor densidad de trazo ('X' o marca)
        top_box = boxes[0]      # Domicilio
        middle_box = boxes[1]   # Oficina
        bottom_box = boxes[2]   # Provincia
        
        scores = {
            'DOMICILIO': top_box['density'],
            'OFICINA': middle_box['density'],
            'PROVINCIA': bottom_box['density']
        }
        max_modalidad = max(scores, key=scores.get)
        if scores[max_modalidad] > 0.15:
            return max_modalidad

    # Fallback por defecto si no se detecta marca fuerte
    return 'OFICINA'
