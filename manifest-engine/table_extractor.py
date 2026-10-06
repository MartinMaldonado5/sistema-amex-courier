import cv2
import numpy as np
from typing import List, Dict, Tuple

def extract_table_rows(image: np.ndarray) -> List[Dict[str, np.ndarray]]:
    """
    Detecta la tabla principal en la página utilizando operaciones morfológicas
    y recorta cada fila en sus 3 columnas: [GUIA, OBSERVACION, WR].
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Binarizar invirtiendo
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 15, 5
    )
    
    h, w = gray.shape
    
    # 1. Detectar líneas horizontales
    h_kernel_len = max(15, w // 40)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_kernel_len, 1))
    horizontal_lines = cv2.erode(thresh, h_kernel, iterations=2)
    horizontal_lines = cv2.dilate(horizontal_lines, h_kernel, iterations=2)
    
    # 2. Detectar líneas verticales
    v_kernel_len = max(15, h // 40)
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_kernel_len))
    vertical_lines = cv2.erode(thresh, v_kernel, iterations=2)
    vertical_lines = cv2.dilate(vertical_lines, v_kernel, iterations=2)
    
    # 3. Máscara de la cuadrícula completa
    table_mask = cv2.add(horizontal_lines, vertical_lines)
    
    # 4. Encontrar contornos de las celdas
    contours, _ = cv2.findContours(table_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    cells = []
    for c in contours:
        x, y, cw, ch = cv2.boundingRect(c)
        # Filtrar celdas de tamaño razonable para la tabla de manifiesto
        if cw > 40 and 15 < ch < 120 and cw < (w * 0.9):
            cells.append({'x': x, 'y': y, 'w': cw, 'h': ch})
            
    # Si la detección morfológica no encuentra celdas completas, 
    # retornar la imagen completa segmentada por tercios horizontales
    if not cells:
        return []
        
    # Agrupar celdas por filas (coordenada Y similar, tolerancia +/- 12px)
    cells = sorted(cells, key=lambda c: c['y'])
    rows = []
    current_row = []
    current_y = None
    
    for cell in cells:
        if current_y is None or abs(cell['y'] - current_y) < 14:
            current_row.append(cell)
            current_y = cell['y']
        else:
            if len(current_row) >= 2:
                current_row = sorted(current_row, key=lambda c: c['x'])
                rows.append(current_row)
            current_row = [cell]
            current_y = cell['y']
            
    if len(current_row) >= 2:
        rows.append(sorted(current_row, key=lambda c: c['x']))
        
    extracted_rows = []
    for r in rows:
        # Típicamente columna 0: GUIA, última columna: WR
        guia_cell = r[0]
        wr_cell = r[-1]
        
        guia_crop = image[guia_cell['y']:guia_cell['y']+guia_cell['h'], guia_cell['x']:guia_cell['x']+guia_cell['w']]
        wr_crop = image[wr_cell['y']:wr_cell['y']+wr_cell['h'], wr_cell['x']:wr_cell['x']+wr_cell['w']]
        
        extracted_rows.append({
            'guia_img': guia_crop,
            'wr_img': wr_crop,
            'y': guia_cell['y']
        })
        
    return extracted_rows
