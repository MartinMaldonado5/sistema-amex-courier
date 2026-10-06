import io
import os
import pytesseract
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from preprocessor import pdf_to_images, bytes_to_cv2_image, auto_rotate_and_deskew
from omr_detector import detect_modalidad_omr
from parser import parse_header_metadata, parse_full_page_text
from reconciler import reconcile_manifest

app = FastAPI(
    title="AMEX TIB Manifest Digitizer Engine",
    description="Motor de alta precisión para digitalización de guías y manifiestos físicos de TIB Courier con OpenCV, PyMuPDF, OMR y OCR",
    version="1.0.0"
)

# Habilitar CORS para comunicación directa con el frontend Next.js de AMEX
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "manifest-engine", "version": "1.0.0"}

@app.post("/process-manifest")
async def process_manifest(file: UploadFile = File(...)):
    """
    Procesa un PDF multipágina o imagen de manifiesto físico de TIB Courier:
    1. Rasteriza a 300 DPI (PyMuPDF).
    2. Corrige orientación y rotación (OpenCV).
    3. Detecta la modalidad con OMR (DOMICILIO, OFICINA, PROVINCIA).
    4. Extrae fecha, totales de encabezado y todas las filas [GUIA, WRs].
    5. Ejecuta auditoría matemática de cuadre (159 guías / 196 paquetes).
    """
    filename = file.filename.lower()
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="El archivo subido está vacío.")
        
    try:
        pages_cv2 = []
        if filename.endswith(".pdf"):
            pages_cv2 = pdf_to_images(content, dpi=300)
        elif any(filename.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]):
            img = bytes_to_cv2_image(content)
            if img is not None:
                pages_cv2 = [img]
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Debe ser PDF o Imagen (.jpg, .png).")
            
        if not pages_cv2:
            raise HTTPException(status_code=400, detail="No se pudieron extraer páginas del documento.")

        # 1. Procesar la primera página para metadatos de cabecera y OMR
        first_page = auto_rotate_and_deskew(pages_cv2[0])
        
        # OCR de la primera página
        config_tess = "--psm 6"
        first_page_ocr = pytesseract.image_to_string(first_page, lang="spa+eng", config=config_tess)
        
        header_metadata = parse_header_metadata(first_page_ocr)
        modalidad = detect_modalidad_omr(first_page)
        header_metadata['modalidad'] = modalidad

        # 2. Procesar todas las páginas para extraer las filas de la tabla
        all_rows = []
        paginas_procesadas = len(pages_cv2)
        
        for p_idx, page in enumerate(pages_cv2):
            if p_idx > 0:
                page_deskewed = auto_rotate_and_deskew(page)
            else:
                page_deskewed = first_page
                
            page_ocr = pytesseract.image_to_string(page_deskewed, lang="spa+eng", config="--psm 6")
            page_rows = parse_full_page_text(page_ocr)
            
            for row in page_rows:
                row['pagina'] = p_idx + 1
                all_rows.append(row)

        # 3. Cuadre Matemático y Auditoría
        reconciliation = reconcile_manifest(header_metadata, all_rows)

        return {
            "success": True,
            "archivo": file.filename,
            "total_paginas": paginas_procesadas,
            "encabezado": header_metadata,
            "cuadre": reconciliation,
            "filas": all_rows
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error durante el procesamiento del manifiesto: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
