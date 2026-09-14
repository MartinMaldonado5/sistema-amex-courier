'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Users,
  Check,
  RefreshCw
} from 'lucide-react';
import { ExcelCobrosParser, WorkbookParseResult } from '../services/excel-cobros-parser';
import { ClienteCobroLote } from '../types';

interface CobrosExcelImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (lotes: ClienteCobroLote[], modo: 'combinar' | 'reemplazar') => void;
}

export const CobrosExcelImporterModal: React.FC<CobrosExcelImporterModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  if (!isOpen) return null;

  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<WorkbookParseResult | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [modo, setModo] = useState<'combinar' | 'reemplazar'>('combinar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setParsing(true);
      setErrorMsg(null);
      const buffer = await file.arrayBuffer();
      const result = ExcelCobrosParser.parseWorkbook(buffer, file.name);

      if (Object.keys(result.sheets).length === 0) {
        throw new Error('No se encontraron hojas con datos de cobros válidos en el archivo.');
      }

      setParseResult(result);
      // Por defecto seleccionar las últimas 5 hojas más recientes
      const available = Object.keys(result.sheets);
      setSelectedSheets(available.slice(-6));
    } catch (err: any) {
      console.error('Error al procesar archivo Excel:', err);
      setErrorMsg(err.message || 'Error al procesar el archivo Excel. Asegúrate de que sea .xlsx o .xls');
    } finally {
      setParsing(false);
    }
  };

  const toggleSheet = (sname: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sname) ? prev.filter((s) => s !== sname) : [...prev, sname]
    );
  };

  const selectAll = () => {
    if (!parseResult) return;
    const all = Object.keys(parseResult.sheets);
    if (selectedSheets.length === all.length) {
      setSelectedSheets([]);
    } else {
      setSelectedSheets(all);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    if (selectedSheets.length === 0) {
      alert('Por favor selecciona al menos una hoja para importar.');
      return;
    }

    const lotesToImport: ClienteCobroLote[] = [];
    selectedSheets.forEach((sname) => {
      const sheet = parseResult.sheets[sname];
      if (sheet) {
        lotesToImport.push(...sheet.clientes);
      }
    });

    onImportSuccess(lotesToImport, modo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Importador Inteligente de Hojas de Cobros</h2>
              <p className="text-xs text-emerald-100">
                Sube el archivo Excel de cobros diarios (ej: ESTADO DE COBROS 2026 AYLEN...)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DRAG & DROP ZONE */}
          {!parseResult && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-emerald-50/30 dark:bg-emerald-950/20 transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Arrastra tu archivo Excel de Cobros aquí
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Detecta automáticamente todas las hojas (COBRO 11, COBRO 10, etc.), cuentas corporativas (CORP. FRAGMANI), precios y WRs.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Seleccionar Archivo de mi PC
              </button>
            </div>
          )}

          {parsing && (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Analizando fórmulas, clientes y paquetes WR del Excel...
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PARSE RESULT PREVIEW & SHEET PICKER */}
          {parseResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    {parseResult.fileName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Object.keys(parseResult.sheets).length} hojas detectadas con información de cobros
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setParseResult(null)}
                  className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* MODO DE IMPORTACIÓN */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="text-gray-700 dark:text-gray-300 font-bold">Modo:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    checked={modo === 'combinar'}
                    onChange={() => setModo('combinar')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Combinar (mantener datos existentes)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modo"
                    checked={modo === 'reemplazar'}
                    onChange={() => setModo('reemplazar')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Reemplazar completamente</span>
                </label>
              </div>

              {/* SELECCIÓN DE HOJAS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Selecciona las hojas a importar ({selectedSheets.length} de {Object.keys(parseResult.sheets).length})
                  </label>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    {selectedSheets.length === Object.keys(parseResult.sheets).length
                      ? 'Deseleccionar todas'
                      : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl p-2 bg-gray-50 dark:bg-gray-900/50">
                  {Object.values(parseResult.sheets).map((sheet) => {
                    const isSelected = selectedSheets.includes(sheet.sheetName);
                    return (
                      <div
                        key={sheet.sheetName}
                        onClick={() => toggleSheet(sheet.sheetName)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-gray-900 dark:text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{sheet.sheetName}</span>
                            <span className="text-[11px] text-gray-500">
                              {sheet.totalClientes} clientes &bull; {sheet.totalWRs} WRs
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${sheet.totalUsd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          {parseResult && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedSheets.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${
                selectedSheets.length === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/25'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Importar {selectedSheets.length} Hojas Seleccionadas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
