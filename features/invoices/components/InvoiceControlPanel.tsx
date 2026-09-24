'use client';

import React, { useState } from 'react';
import { InvoiceData, InvoiceItem } from '../types';
import { Cliente } from '@/types';

interface InvoiceControlPanelProps {
  data: InvoiceData;
  clientes?: Cliente[];
  isExporting: boolean;
  historial: InvoiceData[];
  isHistorialOpen: boolean;
  setIsHistorialOpen: (open: boolean) => void;
  isPasteModalOpen: boolean;
  setIsPasteModalOpen: (open: boolean) => void;
  pasteRawText: string;
  setPasteRawText: (text: string) => void;
  onUpdateInvoiceNumber: (num: string) => void;
  onGenerateRandomNumber: () => void;
  onUpdateInvoiceDate: (date: string) => void;
  onUpdateInvoiceDueDate: (date: string) => void;
  onSetTodayDates: () => void;
  onUpdateBillTo: (name: string) => void;
  onUpdateShipTo: (name: string) => void;
  onCopyBillToToShipTo: () => void;
  onSelectCliente: (cliente: Cliente, target: 'billTo' | 'shipTo' | 'both') => void;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, field: 'name' | 'quantity' | 'unitPrice' | 'total', value: string | number) => void;
  onUpdateInvoiceAmount: (amount: string | number) => void;
  onProcessPasteText: (text: string) => void;
  onClearItems: () => void;
  onResetToDefault: () => void;
  onSaveToHistorial: () => void;
  onRestoreFromHistorial: (item: InvoiceData) => void;
  onDeleteHistorialItem: (index: number) => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
}

export function InvoiceControlPanel({
  data,
  clientes = [],
  isExporting,
  historial,
  isHistorialOpen,
  setIsHistorialOpen,
  isPasteModalOpen,
  setIsPasteModalOpen,
  pasteRawText,
  setPasteRawText,
  onUpdateInvoiceNumber,
  onGenerateRandomNumber,
  onUpdateInvoiceDate,
  onUpdateInvoiceDueDate,
  onSetTodayDates,
  onUpdateBillTo,
  onUpdateShipTo,
  onCopyBillToToShipTo,
  onSelectCliente,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateInvoiceAmount,
  onProcessPasteText,
  onClearItems,
  onResetToDefault,
  onSaveToHistorial,
  onRestoreFromHistorial,
  onDeleteHistorialItem,
  onExportDocx,
  onExportPdf,
  onPrint
}: InvoiceControlPanelProps) {
  const [clientSearchBill, setClientSearchBill] = useState('');
  const [showClientDropdownBill, setShowClientDropdownBill] = useState(false);
  const [clientSearchShip, setClientSearchShip] = useState('');
  const [showClientDropdownShip, setShowClientDropdownShip] = useState(false);

  // Filtrado de clientes para autocompletado
  const filteredClientsBill = clientes.filter(c => {
    if (!clientSearchBill) return false;
    const q = clientSearchBill.toLowerCase();
    const name = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
    const doc = (c.documentoIdentidad || '').toLowerCase();
    return name.includes(q) || doc.includes(q);
  }).slice(0, 6);

  const filteredClientsShip = clientes.filter(c => {
    if (!clientSearchShip) return false;
    const q = clientSearchShip.toLowerCase();
    const name = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
    const doc = (c.documentoIdentidad || '').toLowerCase();
    return name.includes(q) || doc.includes(q);
  }).slice(0, 6);

  // Calcular suma automática para mostrar comparativa
  const calculatedSum = (data.items || []).reduce((acc, curr) => {
    const val = parseFloat(String(curr.total || '0').replace('$', '').trim());
    return acc + (isNaN(val) ? 0 : val);
  }, 0).toFixed(2);

  return (
    <aside className="invoice-control-panel no-print" aria-label="Panel de Configuración de Factura">
      {/* Cabecera del Panel */}
      <div className="invoice-panel-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Facturas / Invoices USA
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                  ACCESSORIES SALES
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Plantilla exacta Word (zxzxzxzx.docx) • Edición de campos restringidos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsHistorialOpen(!isHistorialOpen)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/60 flex items-center gap-1.5 transition-colors"
            title="Ver historial de facturas guardadas"
          >
            <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
            <span>Historial ({historial.length})</span>
          </button>
        </div>

        {/* Botonera de Exportación Principal */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {/* Exportar Word */}
          <button
            type="button"
            onClick={onExportDocx}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/40 shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-file-word text-sm text-blue-200"></i>
            <span>{isExporting ? 'Generando...' : 'Descargar Word (.docx)'}</span>
          </button>

          {/* Exportar PDF */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 border border-rose-400/40 shadow-lg shadow-red-900/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <i className="fa-solid fa-file-pdf text-sm text-red-200"></i>
            <span>Descargar PDF</span>
          </button>

          {/* Imprimir */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 active:scale-[0.98] transition-all"
          >
            <i className="fa-solid fa-print text-sm text-sky-400"></i>
            <span>Imprimir A4</span>
          </button>
        </div>
      </div>

      {/* Cuerpo del Formulario con Scroll */}
      <div className="invoice-panel-body">
        {/* SECCIÓN 1: INVOICE NUMBER */}
        <div className="invoice-form-section">
          <div className="section-title">
            <i className="fa-solid fa-hashtag text-blue-400"></i>
            <span>1. Número de Factura (Editable)</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={data.invoiceNumber || ''}
                onChange={e => onUpdateInvoiceNumber(e.target.value)}
                placeholder="Ej: I000430460"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={onGenerateRandomNumber}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Generar correlativo aleatorio"
            >
              <i className="fa-solid fa-dice text-amber-400"></i>
              <span>Aleatorio</span>
            </button>
          </div>
        </div>

        {/* SECCIÓN 2: FECHAS DE LA FACTURA (INVOICE DATE & DUE DATE) */}
        <div className="invoice-form-section">
          <div className="flex items-center justify-between mb-1">
            <div className="section-title mb-0">
              <i className="fa-solid fa-calendar-days text-blue-400"></i>
              <span>2. Fechas de la Factura (Editables)</span>
            </div>
            <button
              type="button"
              onClick={onSetTodayDates}
              className="px-2.5 py-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/70 hover:bg-sky-900/70 rounded-md border border-sky-800/60 transition-colors flex items-center gap-1.5"
              title="Colocar fecha actual de hoy en ambos campos"
            >
              <i className="fa-solid fa-calendar-check text-[10px]"></i>
              <span>Hoy</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Invoice Date */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Invoice Date (Emisión) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={data.invoiceDate || ''}
                onChange={e => onUpdateInvoiceDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Invoice Due Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Invoice Due Date (Venc.) <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => onUpdateInvoiceDueDate(data.invoiceDate || '')}
                  className="text-[10px] text-slate-400 hover:text-sky-400 font-semibold"
                  title="Copiar fecha de emisión al vencimiento"
                >
                  = Emisión
                </button>
              </div>
              <input
                type="text"
                value={data.invoiceDueDate || ''}
                onChange={e => onUpdateInvoiceDueDate(e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: BILL TO & SHIP TO */}
        <div className="invoice-form-section">
          <div className="section-title">
            <i className="fa-solid fa-user-tag text-blue-400"></i>
            <span>3. Destinatarios: Bill To & Ship To (Editables)</span>
          </div>

          <div className="space-y-4">
            {/* Bill To */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Bill To (Nombre completo) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Facturación</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={data.billToName || ''}
                  onChange={e => {
                    onUpdateBillTo(e.target.value);
                    setClientSearchBill(e.target.value);
                    setShowClientDropdownBill(true);
                  }}
                  onFocus={() => setShowClientDropdownBill(true)}
                  placeholder="Ej: FRANKLIN JHUNIOR PEREZ QUISPE"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
                />

                {/* Dropdown sugerencias clientes */}
                {showClientDropdownBill && filteredClientsBill.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] text-slate-400 font-bold bg-slate-950 uppercase tracking-wider">
                      Clientes del Sistema
                    </div>
                    {filteredClientsBill.map(c => {
                      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim().toUpperCase();
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelectCliente(c, 'billTo');
                            setShowClientDropdownBill(false);
                            setClientSearchBill('');
                          }}
                          className="px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white cursor-pointer border-b border-slate-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.documentoIdentidad || ''}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Ship To con botón de copiar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Ship To (Nombre completo) <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={onCopyBillToToShipTo}
                  className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 transition-colors"
                  title="Copiar el mismo nombre de Bill To"
                >
                  <i className="fa-solid fa-clone text-[10px]"></i>
                  <span>Copiar de Bill To</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={data.shipToName || ''}
                  onChange={e => {
                    onUpdateShipTo(e.target.value);
                    setClientSearchShip(e.target.value);
                    setShowClientDropdownShip(true);
                  }}
                  onFocus={() => setShowClientDropdownShip(true)}
                  placeholder="Ej: FRANKLIN JHUNIOR PEREZ QUISPE"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-blue-500"
                />

                {/* Dropdown sugerencias clientes para Ship To */}
                {showClientDropdownShip && filteredClientsShip.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-48 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] text-slate-400 font-bold bg-slate-950 uppercase tracking-wider">
                      Clientes del Sistema
                    </div>
                    {filteredClientsShip.map(c => {
                      const fullName = `${c.nombre || ''} ${c.apellido || ''}`.trim().toUpperCase();
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelectCliente(c, 'shipTo');
                            setShowClientDropdownShip(false);
                            setClientSearchShip('');
                          }}
                          className="px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white cursor-pointer border-b border-slate-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{c.documentoIdentidad || ''}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: ÍTEMS DE LA FACTURA */}
        <div className="invoice-form-section">
          <div className="flex items-center justify-between mb-3">
            <div className="section-title mb-0">
              <i className="fa-solid fa-list-check text-blue-400"></i>
              <span>4. Ítems: Nombre, Cantidad, Precio y Total</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClearItems}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/70 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Borrar o vaciar todos los ítems copiados/agregados a la tabla"
              >
                <i className="fa-solid fa-trash-can text-rose-400"></i>
                <span>Borrar Todo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPasteModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-800/60 flex items-center gap-1 transition-colors"
                title="Pegar lista desde Excel o portapapeles"
              >
                <i className="fa-solid fa-paste"></i>
                <span>Pegar Excel</span>
              </button>

              <button
                type="button"
                onClick={onAddItem}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-colors"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Agregar Ítem</span>
              </button>
            </div>
          </div>

          {/* Tabla de edición de ítems */}
          <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-slate-900/60">
            <div className="grid grid-cols-12 bg-slate-800/80 px-2 py-1.5 text-[11px] font-bold text-slate-300 border-b border-slate-700">
              <div className="col-span-5">Item Name</div>
              <div className="col-span-2 text-center">Cant.</div>
              <div className="col-span-2 text-right">Unit ($)</div>
              <div className="col-span-2 text-right">Total ($)</div>
              <div className="col-span-1 text-center"></div>
            </div>

            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {(data.items || []).map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-12 gap-1 px-2 py-1.5 items-center hover:bg-slate-800/40">
                  {/* Item Name */}
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={e => onUpdateItem(item.id, 'name', e.target.value.toUpperCase())}
                      placeholder="Descripción del ítem"
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity ?? ''}
                      onChange={e => onUpdateItem(item.id, 'quantity', e.target.value)}
                      className="w-full px-1.5 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-white text-center font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice ?? ''}
                      onChange={e => onUpdateItem(item.id, 'unitPrice', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-1.5 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-white text-right font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.total ?? ''}
                      onChange={e => onUpdateItem(item.id, 'total', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-1.5 py-1 bg-slate-950 border border-slate-700/80 rounded text-xs text-sky-300 font-bold text-right font-mono focus:outline-none focus:border-blue-500"
                      title="Total de la fila (calculado automáticamente o ajustable)"
                    />
                  </div>

                  {/* Botón eliminar */}
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                      title="Eliminar ítem"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}

              {(!data.items || data.items.length === 0) && (
                <div className="p-4 text-center text-xs text-slate-500 italic">
                  No hay ítems registrados. Haz clic en "+ Agregar Ítem" o "Pegar Excel".
                </div>
              )}
            </div>

            {/* Barra inferior de la tabla de ítems */}
            <div className="px-3 py-2 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClearItems}
                  className="text-[11px] font-semibold text-rose-400/90 hover:text-rose-300 transition-colors flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 px-2 py-0.5 rounded border border-rose-800/40"
                  title="Borrar todos los ítems de la tabla"
                >
                  <i className="fa-solid fa-trash-can text-[10px]"></i>
                  <span>Borrar todo</span>
                </button>
                <span className="text-slate-600">|</span>
                <button
                  type="button"
                  onClick={onResetToDefault}
                  className="text-[11px] text-slate-400 hover:text-sky-400 transition-colors"
                >
                  Restablecer ejemplo Word
                </button>
              </div>

              <div className="text-slate-300 font-semibold">
                Subtotal calculado: <span className="text-white font-mono font-bold">${calculatedSum}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 5: INVOICE AMOUNT (GRAN TOTAL) */}
        <div className="invoice-form-section">
          <div className="section-title">
            <i className="fa-solid fa-dollar-sign text-emerald-400"></i>
            <span>5. Invoice Amount / Monto Total Factura (Editable)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="text"
                value={String(data.invoiceAmount || '').replace('$', '')}
                onChange={e => onUpdateInvoiceAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-base text-emerald-400 font-mono font-black focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Botón sincronizar si el usuario modificó manualmente y quiere volver a la suma */}
            <button
              type="button"
              onClick={() => onUpdateInvoiceAmount(calculatedSum)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Sincronizar con la suma automática de los ítems"
            >
              <i className="fa-solid fa-arrows-rotate text-sky-400"></i>
              <span>Auto-Suma (${calculatedSum})</span>
            </button>
          </div>
        </div>

        {/* SECCIÓN 6: INFORMACIÓN FIJA (SOLO LECTURA) */}
        <div className="invoice-form-section opacity-75">
          <div className="section-title text-slate-400">
            <i className="fa-solid fa-lock text-slate-500"></i>
            <span>Datos Fijos de la Plantilla (No Editables - Idénticos a Word)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-400">
            <div>
              <span className="font-bold text-slate-300">Empresa:</span> {data.companyName}
            </div>
            <div>
              <span className="font-bold text-slate-300">Términos:</span> {data.paymentTerms}
            </div>
            <div>
              <span className="font-bold text-slate-300">Dirección:</span> {data.companyAddress}
            </div>
            <div>
              <span className="font-bold text-slate-300">Creado por:</span> {data.createdBy}
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-300">Teléfono:</span> {data.companyCityPhone}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PEGADO RÁPIDO DE ÍTEMS DESDE EXCEL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-paste text-sky-400"></i>
                Pegado Rápido de Ítems desde Excel / Portapapeles
              </h3>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copia varias filas desde Excel o texto (columnas: <strong>Nombre | Cantidad | Precio Unitario</strong>) y pégalas aquí directamente:
            </p>

            <textarea
              rows={8}
              value={pasteRawText}
              onChange={e => setPasteRawText(e.target.value)}
              placeholder="Ejemplo:&#10;ZAPATILLAS NIKE BLANCA&#9;1&#9;24.47&#10;ZAPATILLAS NIKE NEGRAS&#9;1&#9;24.47&#10;CONJUNO JUICY COUTURE&#9;2&#9;35.00"
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPasteRawText('')}
                disabled={!pasteRawText}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-rose-900/50 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                title="Limpiar el contenido del cuadro de texto"
              >
                <i className="fa-solid fa-eraser text-[11px]"></i>
                <span>Limpiar texto</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onProcessPasteText(pasteRawText)}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow"
                >
                  Procesar e Insertar Ítems
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE INVOICES */}
      {isHistorialOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
                Historial de Invoices Guardados
              </h3>
              <button
                type="button"
                onClick={() => setIsHistorialOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
              {historial.map((item, idx) => (
                <div key={idx} className="py-2.5 px-3 flex items-center justify-between hover:bg-slate-800/40 rounded-lg">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-sky-400">{item.invoiceNumber}</span>
                      <span>•</span>
                      <span>{item.billToName || 'Sin cliente'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Monto: <strong className="text-emerald-400">${item.invoiceAmount}</strong> • {item.items?.length || 0} ítems • {item.savedAt || 'Reciente'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRestoreFromHistorial(item)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition-colors"
                    >
                      Cargar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistorialItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Eliminar del historial"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}

              {historial.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 italic">
                  No hay facturas guardadas en el historial todavía.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHistorialOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
