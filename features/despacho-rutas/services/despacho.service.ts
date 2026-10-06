import { supabase } from '@/lib/supabase/client';
import {
  DespachoRuta,
  DespachoParada,
  DespachoRutaConParadas,
  CrearRutaInput,
  CrearParadaInput,
  EstadoParada
} from '@/types/despacho';
import { normalizePhoneNumber } from '@/lib/utils/phoneUtils';

export class DespachoService {
  /**
   * Obtiene todas las rutas ordenadas por fecha reciente
   */
  async getRutas(fecha?: string): Promise<DespachoRuta[]> {
    let query = supabase
      .from('despachos_rutas')
      .select('*')
      .order('creado_en', { ascending: false });

    if (fecha) {
      query = query.eq('fecha_despacho', fecha);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error al obtener rutas:', error);
      throw error;
    }

    return (data || []).map(r => this.mapRutaDbToDomain(r));
  }

  /**
   * Obtiene una ruta completa con todas sus paradas
   */
  async getRutaById(rutaId: string): Promise<DespachoRutaConParadas | null> {
    const { data: rutaData, error: rutaErr } = await supabase
      .from('despachos_rutas')
      .select('*')
      .eq('id', rutaId)
      .single();

    if (rutaErr || !rutaData) {
      console.error('Error al buscar ruta:', rutaErr);
      return null;
    }

    const { data: paradasData, error: paradasErr } = await supabase
      .from('despacho_paradas')
      .select('*')
      .eq('ruta_id', rutaId)
      .order('orden', { ascending: true });

    if (paradasErr) {
      console.error('Error al buscar paradas:', paradasErr);
      throw paradasErr;
    }

    const ruta = this.mapRutaDbToDomain(rutaData);
    const paradas = (paradasData || []).map(p => this.mapParadaDbToDomain(p));

    return {
      ...ruta,
      paradas
    };
  }

  /**
   * Crea una ruta con todas sus paradas de forma atómica
   */
  async crearRutaConParadas(
    rutaInput: CrearRutaInput,
    paradasInput: CrearParadaInput[]
  ): Promise<DespachoRutaConParadas> {
    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoRuta = `RUT-${datePrefix}-${randomSuffix}`;

    const fechaDespacho = rutaInput.fechaDespacho || now.toISOString().slice(0, 10);

    // 1. Insertar Ruta en despachos_rutas
    const { data: rutaCreada, error: rutaErr } = await supabase
      .from('despachos_rutas')
      .insert({
        codigo_ruta: codigoRuta,
        nombre_ruta: rutaInput.nombreRuta.trim(),
        fecha_despacho: fechaDespacho,
        chofer_nombre: rutaInput.choferNombre.trim(),
        chofer_telefono: rutaInput.choferTelefono ? rutaInput.choferTelefono.trim() : null,
        vehiculo_placa: rutaInput.vehiculoPlaca ? rutaInput.vehiculoPlaca.trim().toUpperCase() : null,
        notas: rutaInput.notas ? rutaInput.notas.trim() : null,
        estado: 'EN_RUTA',
        total_paradas: paradasInput.length,
        paradas_entregadas: 0
      })
      .select()
      .single();

    if (rutaErr || !rutaCreada) {
      console.error('Error creando ruta:', rutaErr);
      throw rutaErr;
    }

    // 2. Insertar Paradas en despacho_paradas
    const paradasPayload = paradasInput.map((p, idx) => {
      const phoneNorm = normalizePhoneNumber(p.telefono);
      return {
        ruta_id: rutaCreada.id,
        orden: p.orden ?? idx + 1,
        destinatario: p.destinatario.trim(),
        wr_bultos: p.wrBultos.trim() || '1 CJ',
        direccion: p.direccion.trim(),
        distrito: p.distrito.trim(),
        telefono_raw: p.telefono.trim(),
        telefono_normalizado: phoneNorm.normalized || p.telefono.trim(),
        monto_cobro: p.montoCobro || 0,
        moneda_cobro: p.monedaCobro || 'USD',
        estado: 'PENDIENTE'
      };
    });

    const { data: paradasCreadas, error: paradasErr } = await supabase
      .from('despacho_paradas')
      .insert(paradasPayload)
      .select();

    if (paradasErr) {
      console.error('Error insertando paradas:', paradasErr);
      // Rollback intentando eliminar la ruta
      await supabase.from('despachos_rutas').delete().eq('id', rutaCreada.id);
      throw paradasErr;
    }

    const ruta = this.mapRutaDbToDomain(rutaCreada);
    const paradas = (paradasCreadas || []).map(p => this.mapParadaDbToDomain(p));

    return {
      ...ruta,
      paradas
    };
  }

  /**
   * Actualiza el estado de una parada individual (Entregado, Ausente, etc.)
   */
  async actualizarEstadoParada(
    paradaId: string,
    estado: EstadoParada,
    motivo?: string
  ): Promise<void> {
    const entregadoEn = estado === 'ENTREGADO' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('despacho_paradas')
      .update({
        estado,
        motivo_no_entrega: motivo ? motivo.trim() : null,
        entregado_en: entregadoEn
      })
      .eq('id', paradaId);

    if (error) {
      console.error('Error actualizando estado de parada:', error);
      throw error;
    }
  }

  /**
   * Elimina una ruta completa y sus paradas en cascada
   */
  async eliminarRuta(rutaId: string): Promise<void> {
    const { error } = await supabase
      .from('despachos_rutas')
      .delete()
      .eq('id', rutaId);

    if (error) {
      console.error('Error eliminando ruta:', error);
      throw error;
    }
  }

  /**
   * Sube una fotografía o comprobante de entrega para una parada
   */
  async subirFotoParada(
    paradaId: string,
    file: File,
    destinatario?: string
  ): Promise<{ url: string; fotos: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (destinatario) {
      formData.append('destinatario', destinatario);
    }

    const res = await fetch(`/api/despacho/paradas/${paradaId}/fotos`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al subir la fotografía de la parada.');
    }

    return {
      url: data.url,
      fotos: data.fotos || []
    };
  }

  /**
   * Elimina una foto previamente asociada a una parada
   */
  async eliminarFotoParada(paradaId: string, fotoUrl: string): Promise<string[]> {
    const res = await fetch(`/api/despacho/paradas/${paradaId}/fotos`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fotoUrl })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al eliminar la fotografía de la parada.');
    }

    return data.fotos || [];
  }

  private mapRutaDbToDomain(db: any): DespachoRuta {
    return {
      id: db.id,
      codigoRuta: db.codigo_ruta,
      nombreRuta: db.nombre_ruta,
      fechaDespacho: db.fecha_despacho,
      choferNombre: db.chofer_nombre,
      choferTelefono: db.chofer_telefono,
      vehiculoPlaca: db.vehiculo_placa,
      estado: db.estado,
      totalParadas: db.total_paradas ?? 0,
      paradasEntregadas: db.paradas_entregadas ?? 0,
      notas: db.notas,
      creadoPor: db.creado_por,
      creadoEn: db.creado_en,
      actualizadoEn: db.actualizado_en
    };
  }

  private mapParadaDbToDomain(db: any): DespachoParada {
    return {
      id: db.id,
      rutaId: db.ruta_id,
      orden: db.orden,
      destinatario: db.destinatario,
      wrBultos: db.wr_bultos,
      direccion: db.direccion,
      distrito: db.distrito,
      telefonoRaw: db.telefono_raw,
      telefonoNormalizado: db.telefono_normalizado,
      montoCobro: Number(db.monto_cobro) || 0,
      monedaCobro: db.moneda_cobro || 'USD',
      estado: db.estado,
      motivoNoEntrega: db.motivo_no_entrega,
      entregadoEn: db.entregado_en,
      fotos: Array.isArray(db.fotos) ? db.fotos : [],
      creadoEn: db.creado_en
    };
  }
}

export const despachoService = new DespachoService();
