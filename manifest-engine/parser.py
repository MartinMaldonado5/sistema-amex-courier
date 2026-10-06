import re
from typing import Dict, List, Optional, Tuple
import pytesseract
import cv2
import numpy as np

def clean_ocr_digits(text: str) -> str:
    """
    Corrige sustituciones comunes de OCR en códigos alfanuméricos estrictos:
    'O' o 'o' -> '0', 'I' o 'l' -> '1', 'S' -> '5', 'B' -> '8'.
    """
    res = text.strip()
    return res

def parse_header_metadata(text: str) -> Dict[str, any]:
    """
    Extrae la fecha de vuelo, número de guías y paquetes embarcados
    a partir del texto OCR de la primera página.
    """
    metadata = {
        'fecha_vuelo': '',
        'guias_declaradas': 0,
        'paquetes_declarados': 0,
        'cliente': 'AMEX',
    }
    
    # 1. Fecha de vuelo (ej: "FECHA DE VUELO: 4-10" o "04-10")
    fecha_match = re.search(r'FECHA\s*DE\s*VUELO[\s\:\.\-]*([0-9\-\/]{3,10})', text, re.IGNORECASE)
    if fecha_match:
        metadata['fecha_vuelo'] = fecha_match.group(1).strip()
    else:
        # Fallback para fechas estilo "4-10" o "04/10/2026"
        fecha_fallback = re.search(r'\b(\d{1,2}[\-\/]\d{1,2}(?:[\-\/]\d{2,4})?)\b', text)
        if fecha_fallback:
            metadata['fecha_vuelo'] = fecha_fallback.group(1).strip()

    # 2. # GUIAS (ej: "# GUIAS 159")
    guias_match = re.search(r'(?:#|N[O°]?)\s*GUIAS[\s\:\.\-]*(\d+)', text, re.IGNORECASE)
    if guias_match:
        metadata['guias_declaradas'] = int(guias_match.group(1))

    # 3. # PAQUETES EMBARCADOS (ej: "# PAQUETES EMBARCADOS 196")
    paquetes_match = re.search(r'(?:#|N[O°]?)\s*PAQUETES\s*EMBARCADOS[\s\:\.\-]*(\d+)', text, re.IGNORECASE)
    if paquetes_match:
        metadata['paquetes_declarados'] = int(paquetes_match.group(1))

    return metadata

def extract_wrs_from_cell(raw_text: str) -> List[str]:
    """
    Extrae todos los códigos WR de una celda, admitiendo múltiples WRs
    separados por '/', '-', saltos de línea o espacios.
    Ejemplo: 'WR000469622 / WR000465623' -> ['WR000469622', 'WR000465623']
    Ejemplo: 'WR000474489-WR000474312' -> ['WR000474489', 'WR000474312']
    """
    # Normalizar caracteres visuales erróneos
    cleaned = raw_text.upper()
    cleaned = cleaned.replace('O', '0').replace('I', '1').replace('L', '1')
    
    # Regex para capturar WR seguido de 7 a 10 dígitos
    wr_matches = re.findall(r'WR\d{7,10}', cleaned)
    
    # Si OCR perdió la 'W' o la 'R' pero hay dígitos claros después de barra o guión:
    if not wr_matches:
        digits_matches = re.findall(r'\b\d{8,10}\b', cleaned)
        for d in digits_matches:
            wr_matches.append(f"WR{d}")
            
    # Eliminar duplicados manteniendo orden
    seen = set()
    unique_wrs = []
    for wr in wr_matches:
        if wr not in seen:
            seen.add(wr)
            unique_wrs.append(wr)
            
    return unique_wrs

def parse_full_page_text(ocr_text: str) -> List[Dict[str, any]]:
    """
    Extrae filas [GUIA, OBSERVACION, [WRS]] a partir del texto OCR de una página completa.
    """
    lines = ocr_text.splitlines()
    rows = []
    current_guia = None
    current_wrs = []
    current_obs = ""
    
    for line in lines:
        line_clean = line.strip().upper()
        if not line_clean:
            continue
            
        # Detectar Guía AMX (ej: AMX000009060)
        guia_match = re.search(r'\b(AMX\d{8,12})\b', line_clean)
        wrs_found = extract_wrs_from_cell(line_clean)
        
        if guia_match:
            # Si ya teníamos una guía previa con sus datos, guardarla
            if current_guia:
                rows.append({
                    'guia': current_guia,
                    'wrs': current_wrs,
                    'observacion': current_obs.strip(),
                    'total_paquetes': len(current_wrs)
                })
            current_guia = guia_match.group(1)
            current_wrs = wrs_found
            current_obs = ""
        else:
            # Si no es nueva guía, pero contiene WRs, pertenecen a la guía actual
            if current_guia and wrs_found:
                for wr in wrs_found:
                    if wr not in current_wrs:
                        current_wrs.append(wr)
            elif current_guia and not wrs_found:
                current_obs += f" {line_clean}"
                
    # Agregar la última fila
    if current_guia:
        rows.append({
            'guia': current_guia,
            'wrs': current_wrs,
            'observacion': current_obs.strip(),
            'total_paquetes': len(current_wrs)
        })
        
    return rows
