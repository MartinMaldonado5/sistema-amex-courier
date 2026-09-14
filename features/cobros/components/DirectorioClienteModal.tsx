'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Building2,
  DollarSign,
  Package,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ExternalLink,
  Receipt,
  Users
} from 'lucide-react';
import { ResumenCliente360, ItemCobroWR } from '../types';
import { KambistaService } from '../services/kambista.service';

interface DirectorioClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteResumen: ResumenCliente360 | null;
  tcVenta: number;
  onNavigateToCobros?: (clienteNombre: string) => void;
  guardarTarifaCliente?: (clienteNombre: string, tarifa: number) => void;
}

export const DirectorioClienteModal: React.FC<DirectorioClienteModalProps> = ({
  isOpen,
  onClose,
  clienteResumen,
  tcVenta,
  onNavigateToCobros,
  guardarTarifaCliente
}) => {
  if (!isOpen || !clienteResumen) return null;

  const [tabInterna, setTabInterna] = useState<'wrs' | 'pagos' | 'consignatarios'>('wrs');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [tarifaInput, setTarifaInput] = useState<string>(clienteResumen.tarifaPorKgUsd?.toString() || '7.00');
  const [tarifaSavedFeedback, setTarifaSavedFeedback] = useState(false);

  React.useEffect(() => {
    if (clienteResumen.tarifaPorKgUsd) {
      setTarifaInput(clienteResumen.tarifaPorKgUsd.toString());
    }
  }, [clienteResumen.tarifaPorKgUsd]);

  const handleSaveTarifa = (tarifaNum: number) => {
    if (tarifaNum <= 0 || isNaN(tarifaNum)) return;
    setTarifaInput(tarifaNum.toFixed(2));
    if (guardarTarifaCliente) {
      guardarTarifaCliente(clienteResumen.clienteNombre, tarifaNum);
      setTarifaSavedFeedback(true);
      setTimeout(() => setTarifaSavedFeedback(false), 2000);
    }
  };

  // Conversiones a Soles
  const totalFacturadoPen = useMemo(
    () => KambistaService.convertUsdToPen(clienteResumen.totalFacturadoUsd, tcVenta),
    [clienteResumen.totalFacturadoUsd, tcVenta]
  );
  const totalPagadoPen = useMemo(
    () => KambistaService.convertUsdToPen(clienteResumen.totalPagadoUsd, tcVenta),
    [clienteResumen.totalPagadoUsd, tcVenta]
  );
  const deudaPendientePen = useMemo(
    () => KambistaService.convertUsdToPen(clienteResumen.deudaPendienteUsd, tcVenta),
    [clienteResumen.deudaPendienteUsd, tcVenta]
  );

  const wrsFiltrados = useMemo(() => {
    if (!filtroTexto.trim()) return clienteResumen.historialWRs;
    const q = filtroTexto.trim().toUpperCase();
    return clienteResumen.historialWRs.filter(
      (w) =>
        w.wr.toUpperCase().includes(q) ||
        w.trackingUsa?.toUpperCase().includes(q) ||
        w.consignatarioNombre?.toUpperCase().includes(q) ||
        w.notas?.toUpperCase().includes(q)
    );
  }, [clienteResumen.historialWRs, filtroTexto]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              {clienteResumen.esCorporativo ? (
                <Building2 className="w-6 h-6 text-amber-300" />
              ) : (
                <User className="w-6 h-6 text-blue-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  {clienteResumen.clienteNombre}
                </h2>
                {clienteResumen.esCorporativo ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> CUENTA CORPORATIVA
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                    CLIENTE PARTICULAR
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Expediente y Estado de Cuenta &bull; TC Kambista Referencial: S/ {tcVenta.toFixed(3)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
          {/* Total Facturado */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Facturado
            </span>
            <div className="text-lg font-black font-mono text-gray-900 dark:text-white mt-0.5">
              ${clienteResumen.totalFacturadoUsd.toFixed(2)}
            </div>
            <div className="text-[11px] font-mono text-gray-500">
              S/ {totalFacturadoPen.toFixed(2)}
            </div>
          </div>

          {/* Total Cobrado */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Total Cobrado (Pagado)
            </span>
            <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              ${clienteResumen.totalPagadoUsd.toFixed(2)}
            </div>
            <div className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-300">
              S/ {totalPagadoPen.toFixed(2)}
            </div>
          </div>

          {/* Deuda Pendiente */}
          <div className={`p-3.5 rounded-xl border shadow-sm ${
            clienteResumen.deudaPendienteUsd > 0
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Deuda Pendiente
            </span>
            <div className="text-lg font-black font-mono text-red-600 dark:text-red-400 mt-0.5">
              ${clienteResumen.deudaPendienteUsd.toFixed(2)}
            </div>
            <div className="text-[11px] font-mono text-red-700/80 dark:text-red-300">
              S/ {deudaPendientePen.toFixed(2)}
            </div>
          </div>

          {/* Paquetes Entregados / Almacén */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Despachos & Almacén
            </span>
            <div className="text-sm font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs font-mono font-bold">
                {clienteResumen.totalEntregados} Entregados
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs font-mono font-bold">
                {clienteResumen.totalEnAlmacen} En Almacén
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              Total {clienteResumen.totalWrsHistoricos} paquetes registrados &bull; {clienteResumen.totalPesoHistoricoKg?.toFixed(1) || 0} kg
            </div>
          </div>
        </div>

        {/* CONFIGURACIÓN DE TARIFA POR KILO ($/KG) */}
        <div className="mx-6 my-2 p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              $/KG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Tarifa de Cobro por Kilo
                </span>
                {clienteResumen.tarifaPersonalizada ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    PERSONALIZADA
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    CALCULADA / BASE
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                Tarifa activa: <strong className="text-blue-700 font-mono">${(parseFloat(tarifaInput) || clienteResumen.tarifaPorKgUsd || 7).toFixed(2)} USD / kg</strong> &bull; &asymp; S/ {KambistaService.convertUsdToPen(parseFloat(tarifaInput) || clienteResumen.tarifaPorKgUsd || 7, tcVenta).toFixed(2)} PEN / kg
              </p>
            </div>
          </div>

          {/* SELECTOR RÁPIDO: PRESETS $6, $7, $8 Y CAMPO EDITABLE */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500">Ajustar tarifa:</span>
            {[6.0, 7.0, 8.0, 8.5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSaveTarifa(preset)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                  parseFloat(tarifaInput) === preset
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ${preset.toFixed(2)}
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-1">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="50"
                  value={tarifaInput}
                  onChange={(e) => setTarifaInput(e.target.value)}
                  className="w-20 pl-5 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSaveTarifa(parseFloat(tarifaInput))}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Guardar
              </button>
            </div>

            {tarifaSavedFeedback && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
              </span>
            )}
          </div>
        </div>

        {/* TABS NAVEGACIÓN DENTRO DEL EXPEDIENTE */}
        <div className="px-6 pt-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setTabInterna('wrs')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tabInterna === 'wrs'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Historial de Paquetes WR ({clienteResumen.historialWRs.length})
            </button>

            <button
              onClick={() => setTabInterna('pagos')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                tabInterna === 'pagos'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Comprobantes de Pago ({clienteResumen.historialPagos.length})
            </button>

            {clienteResumen.esCorporativo && clienteResumen.subConsignatarios && (
              <button
                onClick={() => setTabInterna('consignatarios')}
                className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  tabInterna === 'consignatarios'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                Sub-Destinatarios ({clienteResumen.subConsignatarios.length})
              </button>
            )}
          </div>

          {tabInterna === 'wrs' && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por WR, tracking..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* CONTENIDO TAB */}
        <div className="flex-1 overflow-y-auto p-6">
          {tabInterna === 'wrs' && (
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">WR / Tracking</th>
                    {clienteResumen.esCorporativo && <th className="px-3 py-2.5">Consignatario</th>}
                    <th className="px-3 py-2.5">Peso</th>
                    <th className="px-3 py-2.5">Precio USD</th>
                    <th className="px-3 py-2.5">Precio PEN (TC S/{tcVenta})</th>
                    <th className="px-3 py-2.5">Estado Pago</th>
                    <th className="px-3 py-2.5">Estado Entrega</th>
                    <th className="px-3 py-2.5">Notas / Despacho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {wrsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron paquetes registrados.
                      </td>
                    </tr>
                  ) : (
                    wrsFiltrados.map((item, idx) => {
                      const itemPen = KambistaService.convertUsdToPen(item.precioUsd, tcVenta);
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-3 py-2 font-mono font-bold text-gray-900 dark:text-white">
                            {item.wr}
                            {item.cajaNumero && (
                              <span className="block text-[10px] text-gray-500 font-sans">
                                Caja: {item.cajaNumero}
                              </span>
                            )}
                          </td>
                          {clienteResumen.esCorporativo && (
                            <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                              {item.consignatarioNombre || '-'}
                            </td>
                          )}
                          <td className="px-3 py-2 font-mono">{item.pesoKg.toFixed(2)} kg</td>
                          <td className="px-3 py-2 font-mono font-bold text-gray-900 dark:text-white">
                            ${item.precioUsd.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            S/ {itemPen.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            {item.estadoPago === 'PAGADO' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                PAGADO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                FALTA
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.estadoEntrega === 'ENTREGADO' || item.estadoEntrega === 'RECOGIDO' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                ENTREGADO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                EN ALMACÉN
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-[11px] max-w-xs truncate">
                            {item.entregaInfo
                              ? `${item.entregaInfo.tipoRetirante}: ${item.entregaInfo.nombreRetirante} (${item.entregaInfo.fechaHoraEntrega})`
                              : item.notas || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tabInterna === 'pagos' && (
            <div className="space-y-3">
              {clienteResumen.historialPagos.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <Receipt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">No hay comprobantes de pago registrados aún en esta sesión.</p>
                  <p className="text-xs text-gray-400 mt-1">Los pagos confirmados desde la hoja diaria se auditan aquí automáticamente.</p>
                </div>
              ) : (
                clienteResumen.historialPagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                          {pago.codigoPago}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {pago.metodoPago}
                        </span>
                        {pago.numeroOperacion && (
                          <span className="text-xs text-gray-500 font-mono">
                            Op: {pago.numeroOperacion}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Fecha: {pago.fechaPago} &bull; Registrado por: {pago.registradoPor}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        WRs liquidados: <span className="font-mono font-semibold">{pago.wrsLiquidados.join(', ')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                        {pago.monedaCobrada === 'USD' ? `$${pago.montoUsdTotal.toFixed(2)}` : `S/ ${pago.montoPenTotal.toFixed(2)}`}
                      </div>
                      <div className="text-[11px] font-mono text-gray-500">
                        TC Kambista: S/ {pago.tipoCambioKambista.toFixed(3)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tabInterna === 'consignatarios' && clienteResumen.subConsignatarios && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clienteResumen.subConsignatarios.map((sub, idx) => {
                const subWrs = clienteResumen.historialWRs.filter(
                  (w) => w.consignatarioNombre?.toUpperCase() === sub.toUpperCase()
                );
                let subTotalUsd = 0;
                let subPagadoUsd = 0;
                subWrs.forEach((w) => {
                  subTotalUsd += w.precioUsd;
                  if (w.estadoPago === 'PAGADO') subPagadoUsd += w.precioUsd;
                });
                const subDeuda = subTotalUsd - subPagadoUsd;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        {sub}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {subWrs.length} paquetes registrados
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                        ${subTotalUsd.toFixed(2)} USD
                      </span>
                      {subDeuda > 0 ? (
                        <div className="text-[11px] font-semibold text-red-600">
                          Debe: ${subDeuda.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-[11px] font-semibold text-emerald-600">
                          Al día
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 truncate">
            Hojas donde figura: <span className="font-semibold text-gray-700 dark:text-gray-300">{clienteResumen.lotesHistoricos.join(', ')}</span>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToCobros && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCobros(clienteResumen.clienteNombre);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-3.5 h-3.5" />
                {clienteResumen.deudaPendienteUsd > 0 ? 'Cobrar en Módulo de Cobros' : 'Ver en Módulo de Cobros'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Cerrar Expediente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Retrocompatibilidad
export const Client360Modal = DirectorioClienteModal;
