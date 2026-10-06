# Motor Python de Digitalización de Manifiestos TIB Courier

Servicio de alta precisión para extraer datos de los manifiestos físicos de TIB Courier entregados a AMEX.
Utiliza **OpenCV**, **NumPy**, **PyMuPDF**, **OMR** y **Tesseract OCR**.

## Despliegue en VPS (Hostinger / Ubuntu)

### Opción 1: Con Docker (Recomendado)
```bash
cd manifest-engine
docker build -t amex-manifest-engine .
docker run -d --name manifest-engine -p 8000:8000 --restart always amex-manifest-engine
```

### Opción 2: Con Python venv directo
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa libgl1 libglib2.0-0 python3-pip python3-venv

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000
```

## Endpoints
- `GET /health`: Verificación de estado
- `POST /process-manifest`: Procesa un archivo PDF multipágina o imagen y retorna el JSON estructurado con el cuadre matemático (159 guías / 196 paquetes).
