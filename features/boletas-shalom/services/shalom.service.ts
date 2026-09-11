import { BoletaShalom, ModalidadPagoShalom } from '@/types';
import { FormFields, StatsState } from '../types';

export interface FetchBoletasResponse {
  boletas: BoletaShalom[];
  total: number;
  totalPages: number;
  stats?: StatsState;
}

export const shalomService = {
  async fetchBoletas(params: URLSearchParams, signal?: AbortSignal): Promise<FetchBoletasResponse> {
    const res = await fetch(`/api/shalom-boletas?${params.toString()}`, {
      signal
    });

    if (!res.ok) {
      throw new Error(`Servidor devolvió código HTTP ${res.status}`);
    }

    const json = await res.json();
    return {
      boletas: json.boletas || [],
      total: json.total || 0,
      totalPages: json.totalPages || 1,
      stats: json.stats
    };
  },

  async extractWithAi(file: File) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const res = await fetch('/api/ai/analyze-shalom-boleta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: base64 })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'No se pudo extraer la información con IA.');
    }

    return json.data;
  },

  async saveBoleta(file: File, formData: FormFields): Promise<BoletaShalom> {
    const ordenOrCodigo = formData.nro_orden.trim() || formData.codigo.trim() || formData.numero_guia?.trim();
    if (!ordenOrCodigo || !formData.destinatario_nombre.trim() || !formData.destino.trim()) {
      throw new Error('Por favor completa el Nro. de Orden o Código, Destinatario y Ciudad Destino.');
    }

    const formPayload = new FormData();
    formPayload.append('file', file);
    formPayload.append('nro_orden', formData.nro_orden.trim().toUpperCase());
    formPayload.append('codigo', formData.codigo.trim().toUpperCase());
    formPayload.append('numero_guia', ordenOrCodigo.toUpperCase());
    formPayload.append('codigo_seguimiento', formData.codigo.trim().toUpperCase());
    formPayload.append('fecha_emision', formData.fecha_emision);
    formPayload.append('hora_emision', formData.hora_emision.trim());
    formPayload.append('fecha_traslado', formData.fecha_traslado);
    formPayload.append('remitente_nombre', formData.remitente_nombre.trim().toUpperCase());
    formPayload.append('remitente_dni', formData.remitente_dni.trim());
    formPayload.append('remitente_telefono', formData.remitente_telefono.trim());
    formPayload.append('destinatario_nombre', formData.destinatario_nombre.trim().toUpperCase());
    formPayload.append('destinatario_dni', formData.destinatario_dni.trim());
    formPayload.append('destinatario_telefono', formData.destinatario_telefono.trim());
    formPayload.append('origen', formData.origen.trim().toUpperCase());
    formPayload.append('destino', formData.destino.trim().toUpperCase());
    formPayload.append('tipo_entrega', formData.tipo_entrega.trim().toUpperCase());
    formPayload.append('agencia_destino', formData.tipo_entrega.trim().toUpperCase());
    formPayload.append('forma_pago', formData.forma_pago.trim());
    formPayload.append('modalidad_pago', formData.forma_pago.toUpperCase().includes('PENDIENTE') ? 'PAGO_DESTINO' : formData.forma_pago.toUpperCase());
    formPayload.append('descripcion', formData.descripcion.trim().toUpperCase());
    formPayload.append('cantidad', String(formData.cantidad));
    formPayload.append('unidad_medida', formData.unidad_medida.trim());
    formPayload.append('peso', String(formData.peso));
    formPayload.append('observaciones', formData.observaciones.trim());
    formPayload.append('monto_total', String(formData.monto_total));
    formPayload.append('moneda', formData.moneda);

    const res = await fetch('/api/shalom-boletas', {
      method: 'POST',
      body: formPayload
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al guardar la boleta en la base de datos.');
    }

    return json.data;
  },

  async updateBoleta(id: string, editFormData: FormFields): Promise<BoletaShalom> {
    const res = await fetch(`/api/shalom-boletas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFormData)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al actualizar boleta.');
    }

    return json.data;
  },

  async deleteBoleta(id: string): Promise<void> {
    const res = await fetch(`/api/shalom-boletas/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Error al eliminar boleta');
    }
  }
};
