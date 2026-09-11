'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Check,
  FileText,
  User,
  MapPin,
  Package,
  DollarSign,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ModalidadPagoShalom } from '@/types';
import { FormFields, UploadStage, DEFAULT_FORM } from '../types';
import { shalomService } from '../services/shalom.service';

interface ShalomUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ShalomUploadModal: React.FC<ShalomUploadModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [uploadStage, setUploadStage] = useState<UploadStage>('DROPZONE');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [filePreviewBlobUrl, setFilePreviewBlobUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormFields>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
    setUploadStage('DROPZONE');
    setCurrentFile(null);
    setFilePreviewBlobUrl(null);
    setFormData(DEFAULT_FORM);
    setUploadError(null);
    setAiSuccessMsg(null);
    setIsExtractingAi(false);
    onClose();
  };

  const handleFileSelected = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Por favor selecciona un archivo en formato PDF de la boleta escaneada.');
      return;
    }

    setUploadError(null);
    setAiSuccessMsg(null);
    setIsExtractingAi(false);
    setCurrentFile(file);
    const blobUrl = URL.createObjectURL(file);
    setFilePreviewBlobUrl(blobUrl);

    setFormData({
      ...DEFAULT_FORM,
      fecha_emision: new Date().toISOString().split('T')[0]
    });
    setUploadStage('REVIEW');
  };

  const handleExtractWithAi = async () => {
    if (!currentFile) return;

    setIsExtractingAi(true);
    setUploadError(null);
    setAiSuccessMsg(null);

    try {
      const extracted = await shalomService.extractWithAi(currentFile);
      setFormData((prev) => ({
        ...prev,
        nro_orden: extracted.nro_orden || prev.nro_orden,
        codigo: extracted.codigo || prev.codigo,
        fecha_emision: extracted.fecha_emision || prev.fecha_emision,
        hora_emision: extracted.hora_emision || prev.hora_emision,
        fecha_traslado: extracted.fecha_traslado || prev.fecha_traslado,
        origen: extracted.origen || prev.origen,
        destino: extracted.destino || prev.destino,
        remitente_nombre: extracted.remitente_nombre || prev.remitente_nombre,
        remitente_dni: extracted.remitente_dni || prev.remitente_dni,
        remitente_telefono: extracted.remitente_telefono || prev.remitente_telefono,
        destinatario_nombre: extracted.destinatario_nombre || prev.destinatario_nombre,
        destinatario_dni: extracted.destinatario_dni || prev.destinatario_dni,
        destinatario_telefono: extracted.destinatario_telefono || prev.destinatario_telefono,
        tipo_entrega: extracted.tipo_entrega || prev.tipo_entrega,
        forma_pago: extracted.forma_pago || prev.forma_pago,
        descripcion: extracted.descripcion || prev.descripcion,
        cantidad: extracted.cantidad || prev.cantidad,
        unidad_medida: extracted.unidad_medida || prev.unidad_medida,
        peso: extracted.peso !== undefined ? extracted.peso : prev.peso,
        observaciones: extracted.observaciones || prev.observaciones,
        monto_total: Number(extracted.monto_total) || prev.monto_total,
        moneda: extracted.moneda || prev.moneda,
        numero_guia: extracted.nro_orden || extracted.codigo || prev.numero_guia,
        codigo_seguimiento: extracted.codigo || prev.codigo_seguimiento,
        agencia_destino: extracted.tipo_entrega || prev.agencia_destino,
        modalidad_pago: extracted.modalidad_pago || prev.modalidad_pago,
        contenido_bultos: extracted.descripcion || prev.contenido_bultos,
        peso_total: extracted.peso !== undefined ? extracted.peso : prev.peso_total
      }));

      setAiSuccessMsg('¡Datos extraídos con éxito por AMEXito AI!');
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.warn('Error al procesar con IA:', err);
      setUploadError(
        err instanceof Error ? err.message : 'No se pudo extraer la información con IA.'
      );
    } finally {
      setIsExtractingAi(false);
    }
  };

  const handleSaveBoleta = async (andLoadNext: boolean = false) => {
    if (!currentFile) {
      setUploadError('Falta el archivo PDF de la boleta.');
      return;
    }

    setIsSaving(true);
    setUploadError(null);

    try {
      await shalomService.saveBoleta(currentFile, formData);
      onSaved();

      if (andLoadNext) {
        if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
        setCurrentFile(null);
        setFilePreviewBlobUrl(null);
        setFormData(DEFAULT_FORM);
        setUploadStage('DROPZONE');
        setUploadError(null);
        setAiSuccessMsg(null);
        setIsExtractingAi(false);
      } else {
        handleClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la boleta.';
      setUploadError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="shalom-modal-overlay">
      <div className="shalom-modal-container">
        <div className="shalom-modal-header">
          <h3>
            <UploadCloud size={20} className="text-sky-400" />
            Cargar Boleta de Shalom (Boleta Escaneada & OCR)
          </h3>
          <button
            type="button"
            className="shalom-modal-close-btn"
            onClick={handleClose}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shalom-modal-body">
          {uploadError && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* ETAPA 1: Dropzone de Selección */}
          {uploadStage === 'DROPZONE' && (
            <div
              className="shalom-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0]);
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />
              <div className="shalom-dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <h4 className="shalom-dropzone-title">
                Arrastra el archivo PDF escaneado aquí o haz clic para buscar
              </h4>
              <p className="shalom-dropzone-subtitle">
                Compatible con los archivos PDF generados por cualquier escáner o impresora multifuncional. AMEXito AI leerá los datos al instante.
              </p>
              <span className="shalom-dropzone-tag">Solo archivos .PDF</span>
            </div>
          )}

          {/* ETAPA 2: Escaneando con IA */}
          {uploadStage === 'ANALYZING' && (
            <div className="shalom-ocr-scanning">
              <div className="shalom-radar-spinner" />
              <div className="flex flex-col gap-1 items-center">
                <h4 className="shalom-ocr-scan-title flex items-center gap-2">
                  <Sparkles size={18} className="text-sky-400 animate-pulse" />
                  AMEXito AI está leyendo la boleta de Shalom...
                </h4>
                <p className="shalom-ocr-scan-desc">
                  Extrayendo N° de guía, destinatario, DNI, ciudad destino, importes y modalidad de pago...
                </p>
              </div>
            </div>
          )}

          {/* ETAPA 3: Pantalla Dividida (PDF a la izquierda, Formulario a la derecha) */}
          {uploadStage === 'REVIEW' && (
            <div className="shalom-split-review">
              <div className="shalom-split-preview">
                <div className="shalom-split-preview-header">
                  <span>Vista Previa del Escaneo Original</span>
                  <span className="text-[11px] text-sky-400 font-semibold">{currentFile?.name}</span>
                </div>
                {filePreviewBlobUrl && (
                  <iframe
                    src={filePreviewBlobUrl}
                    className="shalom-split-preview-frame"
                    title="Previsualización PDF"
                  />
                )}
              </div>

              <div className="shalom-split-form">
                <div className="shalom-ai-toolbar">
                  <button
                    type="button"
                    className="shalom-btn-ai-extract"
                    onClick={handleExtractWithAi}
                    disabled={isExtractingAi || !currentFile}
                    title="Extraer campos automáticamente con Inteligencia Artificial"
                  >
                    {isExtractingAi ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>AMEXito AI extrayendo datos...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-amber-300" />
                        <span>🤖 Extraer datos con AMEXito AI</span>
                      </>
                    )}
                  </button>
                  <span className="shalom-ai-hint">
                    Opcional: completa a mano o pulsa el botón para auto-rellenar con IA.
                  </span>
                </div>

                {aiSuccessMsg && (
                  <div className="shalom-ai-success-banner">
                    <Check size={16} />
                    <span>{aiSuccessMsg}</span>
                  </div>
                )}

                {/* Sección 1: Datos Ticket Shalom */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <FileText size={14} /> 1. Datos Ticket Shalom
                  </div>
                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>NRO. ORDEN *</label>
                      <input
                        type="text"
                        className="shalom-input font-mono font-bold"
                        placeholder="Ej: 95294190"
                        value={formData.nro_orden}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nro_orden: e.target.value.toUpperCase(),
                            numero_guia: e.target.value.toUpperCase()
                          })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>CÓDIGO (RETIRO / TRACKING)</label>
                      <input
                        type="text"
                        className="shalom-input font-mono"
                        placeholder="Ej: 7HH7"
                        value={formData.codigo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            codigo: e.target.value.toUpperCase(),
                            codigo_seguimiento: e.target.value.toUpperCase()
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="shalom-form-grid-3">
                    <div className="shalom-field">
                      <label>Fecha Emisión *</label>
                      <input
                        type="date"
                        className="shalom-input"
                        value={formData.fecha_emision}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha_emision: e.target.value })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Hora Emisión</label>
                      <input
                        type="text"
                        className="shalom-input"
                        placeholder="17:53:14"
                        value={formData.hora_emision}
                        onChange={(e) =>
                          setFormData({ ...formData, hora_emision: e.target.value })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Fecha Traslado</label>
                      <input
                        type="date"
                        className="shalom-input"
                        value={formData.fecha_traslado}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha_traslado: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 2: Datos del Remitente */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <User size={14} /> 2. Datos del Remitente
                  </div>
                  <div className="shalom-field">
                    <label>Nombre Remitente</label>
                    <input
                      type="text"
                      className="shalom-input"
                      placeholder="QUINTANA CORNEJO BLANCA ESTHER"
                      value={formData.remitente_nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, remitente_nombre: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>DNI Remitente</label>
                      <input
                        type="text"
                        className="shalom-input font-mono"
                        placeholder="06779177"
                        value={formData.remitente_dni}
                        onChange={(e) =>
                          setFormData({ ...formData, remitente_dni: e.target.value })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Teléfono Remitente</label>
                      <input
                        type="text"
                        className="shalom-input font-mono"
                        placeholder="982400043"
                        value={formData.remitente_telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, remitente_telefono: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 3: Datos del Destinatario */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <User size={14} /> 3. Datos del Destinatario
                  </div>
                  <div className="shalom-field">
                    <label>Nombre Destinatario *</label>
                    <input
                      type="text"
                      className="shalom-input"
                      placeholder="REVILLA ANCASI MAGALY SHIRLEY"
                      value={formData.destinatario_nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, destinatario_nombre: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>DNI Destinatario</label>
                      <input
                        type="text"
                        className="shalom-input font-mono"
                        placeholder="42830643"
                        value={formData.destinatario_dni}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            destinatario_dni: e.target.value,
                            destinatario_documento: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Teléfono Destinatario</label>
                      <input
                        type="text"
                        className="shalom-input font-mono"
                        placeholder="986868420"
                        value={formData.destinatario_telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, destinatario_telefono: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 4: Origen, Destino y Entrega */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <MapPin size={14} /> 4. Origen, Destino y Entrega
                  </div>
                  <div className="shalom-field">
                    <label>Origen (Dirección / Agencia)</label>
                    <input
                      type="text"
                      className="shalom-input text-xs"
                      placeholder="AV. CORONEL JOSÉ LEAL 648, URB. FUNDO LOBATÓN, LINCE - LIMA"
                      value={formData.origen}
                      onChange={(e) =>
                        setFormData({ ...formData, origen: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="shalom-field">
                    <label>Destino (Dirección / Agencia Shalom) *</label>
                    <input
                      type="text"
                      className="shalom-input text-xs"
                      placeholder="CALLE YAVARÍ 507 B - ZAMACOLA - CERRO COLORADO - AREQUIPA"
                      value={formData.destino}
                      onChange={(e) =>
                        setFormData({ ...formData, destino: e.target.value.toUpperCase() })
                      }
                    />
                  </div>

                  <div className="shalom-field">
                    <label>Entrega</label>
                    <input
                      type="text"
                      className="shalom-input"
                      placeholder="ENTREGAR EN AGENCIA"
                      value={formData.tipo_entrega}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipo_entrega: e.target.value.toUpperCase(),
                          agencia_destino: e.target.value.toUpperCase()
                        })
                      }
                    />
                  </div>
                </div>

                {/* Sección 5: Detalle del Envío */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <Package size={14} /> 5. Detalle del Envío
                  </div>
                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>Descripción</label>
                      <input
                        type="text"
                        className="shalom-input"
                        placeholder="BULTO"
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                            contenido_bultos: e.target.value
                          })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="shalom-input font-mono"
                        value={formData.cantidad}
                        onChange={(e) =>
                          setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                  </div>

                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>Unidad de Medida</label>
                      <input
                        type="text"
                        className="shalom-input"
                        placeholder="Volumen"
                        value={formData.unidad_medida}
                        onChange={(e) =>
                          setFormData({ ...formData, unidad_medida: e.target.value })
                        }
                      />
                    </div>

                    <div className="shalom-field">
                      <label>Peso / Volumen</label>
                      <input
                        type="number"
                        step="0.001"
                        className="shalom-input font-mono"
                        placeholder="0.120"
                        value={formData.peso}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            peso: parseFloat(e.target.value) || 0,
                            peso_total: parseFloat(e.target.value) || 0
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sección 6: Pago, Total y Observaciones */}
                <div className="shalom-form-section">
                  <div className="shalom-form-section-title">
                    <DollarSign size={14} /> 6. Forma de Pago, Importe y Observaciones
                  </div>
                  <div className="shalom-form-grid-2">
                    <div className="shalom-field">
                      <label>Forma de Pago</label>
                      <input
                        type="text"
                        className="shalom-input"
                        placeholder="Pendiente de Pago"
                        value={formData.forma_pago}
                        onChange={(e) => {
                          const fp = e.target.value;
                          const mod: ModalidadPagoShalom = fp.toLowerCase().includes('pagad')
                            ? 'PAGADO'
                            : fp.toLowerCase().includes('credit')
                            ? 'CREDITO'
                            : 'PAGO_DESTINO';
                          setFormData({ ...formData, forma_pago: fp, modalidad_pago: mod });
                        }}
                      />
                    </div>

                    <div className="shalom-field">
                      <label>TOTAL (S/) *</label>
                      <input
                        type="number"
                        step="0.10"
                        className="shalom-input font-mono font-bold text-emerald-400"
                        placeholder="33.00"
                        value={formData.monto_total}
                        onChange={(e) =>
                          setFormData({ ...formData, monto_total: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="shalom-field">
                    <label>Observaciones</label>
                    <textarea
                      rows={2}
                      className="shalom-input text-xs"
                      placeholder="USTED NO CONTRATO EL SERVICIO DE GARANTIA..."
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({ ...formData, observaciones: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {uploadStage === 'REVIEW' && (
          <div className="shalom-modal-footer">
            <button
              type="button"
              className="shalom-btn-secondary"
              onClick={() => {
                setUploadStage('DROPZONE');
                if (filePreviewBlobUrl) URL.revokeObjectURL(filePreviewBlobUrl);
                setFilePreviewBlobUrl(null);
                setCurrentFile(null);
              }}
              disabled={isSaving}
            >
              Volver a Escanear
            </button>

            <button
              type="button"
              className="shalom-btn-save-next"
              onClick={() => handleSaveBoleta(true)}
              disabled={isSaving}
              title="Guarda esta boleta y deja listo para el siguiente PDF escaneado"
            >
              {isSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={15} />
              )}
              Guardar y Cargar Siguiente
            </button>

            <button
              type="button"
              className="shalom-btn-primary"
              onClick={() => handleSaveBoleta(false)}
              disabled={isSaving}
            >
              {isSaving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={16} />
              )}
              Guardar y Finalizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
