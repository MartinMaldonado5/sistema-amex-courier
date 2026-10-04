import writeXlsxFile from 'write-excel-file/browser';
import { Paquete, MovimientoKardex, Cliente, OrdenPicking, ItemPicking } from '@/types';

/**
 * Utilidad genérica para exportar cualquier arreglo de objetos a un archivo Excel (.xlsx) profesional
 * con auto-ajuste de ancho de columnas y cabeceras limpias.
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, any>[]
) {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar a Excel.');
    return;
  }

  // Crear columnas con ancho óptimo y cabeceras formateadas.
  const headers = Object.keys(data[0]);
  const columns = headers.map(key => {
    let maxLen = key.length;
    for (const row of data) {
      const val = row[key];
      const strVal = val !== null && val !== undefined ? String(val) : '';
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }
    return {
      header: { value: key, fontWeight: 'bold' as const },
      cell: (row: Record<string, any>) => ({ value: row[key] ?? '' }),
      width: Math.min(Math.max(maxLen + 3, 11), 60)
    };
  });
  const safeSheetName = sheetName.slice(0, 31).replace(/[\\/?*[\]]/g, '') || 'Datos AMEX';
  const finalFilename = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  void writeXlsxFile(data, { sheet: safeSheetName, columns }).toFile(finalFilename);
}

export function mapEstadoAmexLabel(estado?: string | null): string {
  if (!estado) return 'Recibido';
  const norm = estado.trim().toLowerCase();
  if (norm === 'recibido') return 'Recibido';
  if (norm === 'en_almacen' || norm === 'enalmacen') return 'En Almacén';
  if (norm === 'listo_recojo' || norm === 'listorecojo') return 'Listo para Recojo';
  if (norm === 'en_ruta' || norm === 'enruta') return 'En Ruta';
  if (norm === 'entregado') return 'Entregado';
  return norm.charAt(0).toUpperCase() + norm.slice(1);
}

export function mapEstadoTibLabel(estado?: string | null): string {
  if (!estado) return 'En Almacén';
  const norm = estado.trim();
  if (norm.toLowerCase() === 'enviado' || norm === 'Enviado') return 'Enviado';
  if (norm.toLowerCase() === 'recibido' || norm === 'Recibido') return 'Recibido';
  if (norm === 'EnAlmacen') return 'En Almacén';
  if (norm === 'EnRutaCarroAmex') return 'Enviado';
  if (norm === 'ListoParaRecojo') return 'Listo para Recojo';
  if (norm === 'Entregado' || norm === 'EntregadoDomicilio' || norm === 'RecogidoAlmacen') return 'Entregado';
  return norm;
}

/**
 * Exportador profesional de Paquetes / Inventario a Excel (.xlsx)
 */
export function exportPaquetesToExcel(paquetes: Paquete[], filenamePrefix = 'Inventario_AMEX_Lince') {
  const formattedData = paquetes.map((p, idx) => ({
    'N°': idx + 1,
    'WR': p.numeroReciboBodega,
    'Tracking': p.trackingUsa || '',
    'Cliente': p.nombreConsignatario || '',
    'Tipo Paquete': p.tipoEmpaque || '',
    'Peso (Kg)': p.pesoKg && Number(p.pesoKg) > 0 ? Number(p.pesoKg) : '',
    'Estado AMEX': mapEstadoAmexLabel(p.estadoAmex),
    'Estado TIB': mapEstadoTibLabel(p.estadoEntrega),
    'Posición WMS': p.posicionEstante || (p.anaquel && p.piso ? `${p.anaquel}-${p.piso}` : 'REC'),
    'Almacén Actual': p.ubicacionActual === 'Entregado'
      ? 'Entregado'
      : 'Almacén Central Lince',
    'Usuario que Ingresó (Email)': p.usuarioEmail || '',
    'Descripción del Paquete': p.descripcion || '',
    'Fecha de Registro': p.creadoEn ? new Date(p.creadoEn).toLocaleString('es-PE') : ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`${filenamePrefix}_${dateStr}`, 'Inventario', formattedData);
}

/**
 * Exportador profesional de Kardex de Movimientos a Excel (.xlsx)
 */
export function exportKardexToExcel(kardexList: MovimientoKardex[], filenamePrefix = 'Kardex_Movimientos_AMEX') {
  const formattedData = kardexList.map((k, idx) => ({
    'N°': idx + 1,
    'Fecha y Hora': new Date(k.creadoEn).toLocaleString('es-PE'),
    'Guía / WR': k.codigoPaquete,
    'Consignatario': k.consignatario || '',
    'Origen': k.origenDescripcion,
    'Destino': k.destinoDescripcion,
    'Tipo Movimiento': k.tipoMovimiento,
    'Motivo': k.motivo || '',
    'Operador Responsable': k.usuarioOperador,
    'Email Operador': k.usuarioEmail || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`${filenamePrefix}_${dateStr}`, 'Kardex WMS', formattedData);
}

/**
 * Exportador profesional de Cola de Escaneo a Excel (.xlsx)
 */
export function exportScannerLogsToExcel(
  logs: Array<{
    code: string;
    format: string;
    location?: string;
    nombreConsignatario?: string;
    time: string;
    synced?: boolean;
    operadorEmail?: string;
    operadorNombre?: string;
  }>,
  filenamePrefix = 'Lecturas_Escaneo_AMEX'
) {
  const formattedData = logs.map((l, idx) => ({
    'N°': idx + 1,
    'Código WR / Tracking': l.code,
    'Formato': l.format,
    'Ubicación Estante WMS': l.location || 'N/A',
    'Consignatario': l.nombreConsignatario || '',
    'Operador': l.operadorNombre || '',
    'Email Operador': l.operadorEmail || '',
    'Hora Escaneo': l.time,
    'Estado Sincronización': l.synced ? 'Sincronizado Master' : 'Borrador Local (Pendiente)'
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`${filenamePrefix}_${dateStr}`, 'Lecturas Escáner', formattedData);
}

/**
 * Exportador profesional de Manifiesto / Orden de Picking a Excel (.xlsx)
 */
export function exportPickingOrderToExcel(order: OrdenPicking, items: ItemPicking[]) {
  const formattedData = items.map((item, idx) => ({
    'Item N°': idx + 1,
    'Orden Picking': order.codigoOrden,
    'Guía WR': item.codigoReciboBodega,
    'Tracking USA': item.trackingUsa || '',
    'Ubicación Anaquel': item.ubicacionAnaquel || 'REC',
    'Consignatario': item.consignatario || '',
    'DNI': item.dniConsignatario || '',
    'Teléfono': item.telefonoConsignatario || '',
    'Ciudad Destino': item.ciudadDestino || order.destinoCiudad || 'Lima / Provincia',
    'Transportista / Agencia': order.transportistaAgencia,
    'Peso (Kg)': Number(item.pesoKg || 0),
    'Estado Picking': item.estadoItem === 'RECOLECTADO' ? 'RECOLECTADO / EN BARRIDO' : 'PENDIENTE',
    'Hora Recolección': item.recolectadoEn ? new Date(item.recolectadoEn).toLocaleTimeString('es-PE') : '-'
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`Manifiesto_Picking_${order.codigoOrden}_${dateStr}`, `Orden_${order.codigoOrden}`, formattedData);
}

/**
 * Exportador profesional de Clientes a Excel (.xlsx)
 */
export function exportClientesToExcel(clientes: Cliente[]) {
  const formattedData = clientes.map((c, idx) => ({
    'N°': idx + 1,
    'Importador / Cliente': c.nombre,
    'DNI / RUC': c.documentoIdentidad,
    'WhatsApp / Teléfono': c.telefono,
    'Email': c.email || '',
    'Departamento': c.departamento,
    'Provincia': c.provincia,
    'Distrito': c.distrito,
    'Dirección': c.direccionEntrega || '',
    'Agencia Preferida': c.transportistaPreferido || '',
    'Fecha de Registro': c.creadoEn ? new Date(c.creadoEn).toLocaleString('es-PE') : ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`Directorio_Clientes_AMEX_${dateStr}`, 'Clientes', formattedData);
}

/**
 * Exportador profesional de Liquidaciones Financieras a Excel (.xlsx)
 */
export function exportLiquidacionesToExcel(paquetes: Paquete[]) {
  const formattedData = paquetes.map((p, idx) => {
    const flete = Number(p.pesoKg || 0) * 12.0;
    const admin = 5.0;
    const totalUsd = flete + admin;
    const totalPen = totalUsd * 3.80;

    return {
      'N°': idx + 1,
      'Cliente Importador': p.nombreConsignatario || 'No asignado',
      'Guía WR #': p.numeroReciboBodega,
      'Peso (Kg)': Number(p.pesoKg || 0),
      'Flete ($ USD)': flete,
      'Admin Fee ($ USD)': admin,
      'Total USD ($)': totalUsd,
      'Total Soles (S/)': totalPen,
      'Estado Pago': 'PAGADO YAPE/BCP'
    };
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`Liquidaciones_AMEX_${dateStr}`, 'Liquidaciones', formattedData);
}

/**
 * Exportador profesional de Hoja de Ruta de Reparto (Carro AMEX) a Excel (.xlsx)
 */
export function exportHojaDeRutaToExcel(
  paquetes: (Paquete & { cliente?: Cliente })[],
  chofer = 'Carlos Mendoza (Camioneta AMEX)',
  ruta = 'Ruta Lima Metropolitana'
) {
  const formattedData = paquetes.map((p, idx) => ({
    'Parada N°': idx + 1,
    'Guía WR': p.numeroReciboBodega,
    'Cliente / Consignatario': p.nombreConsignatario || p.cliente?.nombre || 'No asignado',
    'DNI / Documento': p.dniConsignatario || p.cliente?.documentoIdentidad || '',
    'Teléfono / WhatsApp': p.cliente?.telefono || '',
    'Distrito': p.cliente?.distrito || 'Lima',
    'Dirección de Entrega': p.cliente?.direccionEntrega || 'Dirección de contacto',
    'Tipo Empaque': p.tipoEmpaque,
    'Peso (Kg)': Number(p.pesoKg || 0),
    'Estado Entrega': p.estadoEntrega === 'EnRutaCarroAmex' ? 'EN RUTA' : p.estadoEntrega,
    'Conductor Asignado': chofer,
    'Zona / Ruta': ruta,
    'Firma de Conformidad': ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`Hoja_Ruta_CarroAMEX_${dateStr}`, 'Hoja de Ruta', formattedData);
}

/**
 * Exportador profesional de Historial de Entregas & Evidencias a Excel (.xlsx)
 */
export function exportEntregasToExcel(entregas: any[], filenamePrefix = 'Historial_Entregas_AMEX') {
  const formattedData = entregas.map((e, idx) => ({
    'N°': idx + 1,
    'Código Entrega': e.codigo_entrega,
    'Tipo': e.tipo_entrega,
    'Cliente Consignatario': e.cliente_nombre,
    'DNI / Documento': e.cliente_documento || '',
    'Receptor (Quien Recibió)': e.receptor_nombre || e.cliente_nombre,
    'DNI Receptor': e.receptor_documento || '',
    'Parentesco': e.receptor_parentesco || 'Titular',
    'Total Paquetes': e.total_paquetes || 0,
    'WRs Entregados': Array.isArray(e.paquetes_data) ? e.paquetes_data.map((p: any) => p.numeroReciboBodega || p.wr || p).join(', ') : '',
    'Total Fotos Evidencia': Array.isArray(e.fotos_evidencia) ? e.fotos_evidencia.length : 0,
    'Operador Responsable': e.operador_asignado,
    'Estado': e.estado,
    'Fecha Creación': e.creado_en ? new Date(e.creado_en).toLocaleString('es-PE') : '',
    'Fecha Entrega': e.entregado_en ? new Date(e.entregado_en).toLocaleString('es-PE') : '',
    'Notas / Observaciones': e.notas || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`${filenamePrefix}_${dateStr}`, 'Entregas', formattedData);
}

/**
 * Exportador profesional de Cobros & Vouchers de WhatsApp a Excel (.xlsx)
 */
export function exportCobrosToExcel(cobros: any[], filenamePrefix = 'Cobros_Vouchers_AMEX') {
  const formattedData = cobros.map((c, idx) => ({
    'N°': idx + 1,
    'Código Cobro': c.codigo_cobro,
    'Cliente / Consignatario': c.cliente_nombre,
    'Teléfono WhatsApp': c.cliente_telefono || '',
    'Monto': Number(c.monto || 0),
    'Moneda': c.moneda || 'PEN',
    'Método de Pago': c.metodo_pago,
    'N° Operación': c.numero_operacion || 'S/N',
    'WRs Pagados': Array.isArray(c.paquetes_wrs) ? c.paquetes_wrs.map((w: any) => w.numeroReciboBodega || w.wr || w).join(', ') : '',
    'Estado Pago': c.estado,
    'Registrado Por': c.registrado_por,
    'Fecha Operación': c.fecha_operacion || '',
    'Fecha Registro': c.creado_en ? new Date(c.creado_en).toLocaleString('es-PE') : '',
    'Enlace Voucher R2': c.voucher_url || '',
    'Notas': c.notas || ''
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  exportToExcel(`${filenamePrefix}_${dateStr}`, 'Cobros Vouchers', formattedData);
}




