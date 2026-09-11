'use client';

import React from 'react';
import { supabase } from '@/lib/supabase/client';
import { soundEffects } from '@/lib/audio/soundEffects';
import PasteWrListModal from '@/components/modals/PasteWrListModal';
import NewSheetModal from '@/components/modals/NewSheetModal';
import MobileScannerModal from '@/components/scanner/MobileScannerModal';
import SheetsHub from './SheetsHub';
import './live-sheets.css';

import {
  LiveSheetsTabProps,
  useLiveSheetsData,
  useLiveSheetsPresence,
  useLiveSheetsKeyboard,
  LiveSheetsHeader,
  LiveSheetsToolbar,
  FormulaBar,
  SpreadsheetGrid,
  LiveSheetsBottomBar
} from '@/features/live-sheets';

// Re-export types and constants for backwards compatibility
export * from '@/features/live-sheets/types';

export default function LiveSheetsTab({
  paquetes = [],
  clientes = [],
  onViewPdf,
  currentUser
}: LiveSheetsTabProps) {
  const operatorName = currentUser?.nombre || 'Operador Lince';

  // 1. Hook para datos, cálculos de filas y estadísticas
  const data = useLiveSheetsData({
    paquetes,
    operatorName
  });

  // 2. Hook para presencia en tiempo real y cursores remotos
  const presence = useLiveSheetsPresence({
    activeHojaId: data.activeHojaId,
    currentUser,
    activeCell: { col: 'D', row: 2, val: '' }, // Fallback inicial
    setItems: data.setItems,
    setHojas: data.setHojas,
    setDocTitle: data.setDocTitle
  });

  // 3. Hook para navegación por teclado, escaneo por pistola láser y edición directa
  const keyboard = useLiveSheetsKeyboard({
    activeHojaId: data.activeHojaId,
    items: data.items,
    setItems: data.setItems,
    visibleRows: data.visibleRows,
    paquetes,
    operatorName: presence.operatorName,
    checkCodeInManifest: data.checkCodeInManifest,
    handleClearScanAtRow: data.handleClearScanAtRow,
    broadcastActiveCell: presence.broadcastActiveCell
  });

  // Si no hay hoja abierta, mostrar el Hub de Hojas de Cálculo
  if (!data.activeHojaId) {
    return (
      <SheetsHub
        hojas={data.hojas}
        isLoading={data.isLoadingSheets}
        currentUser={currentUser}
        onOpenSheet={sheetId => {
          data.setActiveHojaId(sheetId);
          const found = data.hojas.find(h => h.id === sheetId);
          if (found) data.setDocTitle(found.titulo || 'AMEX WR');
        }}
        onCreateSheet={data.handleCreateSheetFromHub}
        onRenameSheet={data.handleRenameSheetFromHub}
        onDeleteSheet={data.handleDeleteSheetFromHub}
        onDuplicateSheet={data.handleDuplicateSheetFromHub}
      />
    );
  }

  return (
    <div className="gsheet-container">
      {/* Barra de URL + Header superior */}
      <LiveSheetsHeader
        activeHojaId={data.activeHojaId}
        docTitle={data.docTitle}
        setDocTitle={data.setDocTitle}
        onTitleBlur={data.handleTitleBlur}
        isStarred={data.isStarred}
        setIsStarred={data.setIsStarred}
        realtimeStatus={presence.realtimeStatus}
        collaborators={presence.collaborators}
        stats={data.stats}
        onBackToHub={() => data.setActiveHojaId(null)}
        onExportExcel={data.handleExportExcel}
        onOpenPasteModal={() => keyboard.setIsPasteModalOpen(true)}
        onFocusBarcodeInput={keyboard.focusBarcodeInput}
        onLoadFromDatabase={data.handleLoadFromDatabase}
        onResetScans={data.handleResetScans}
      />

      {/* Barra de herramientas */}
      <LiveSheetsToolbar
        onResetScans={data.handleResetScans}
        onRefresh={() => data.fetchItems(data.activeHojaId || '')}
        onExportExcel={data.handleExportExcel}
        searchInSheet={data.searchInSheet}
        setSearchInSheet={data.setSearchInSheet}
        onOpenPasteModal={() => keyboard.setIsPasteModalOpen(true)}
        onLoadFromDatabase={data.handleLoadFromDatabase}
        barcodeInput={keyboard.barcodeInput}
        setBarcodeInput={keyboard.setBarcodeInput}
        barcodeInputRef={keyboard.barcodeInputRef}
        onManualScanSubmit={keyboard.handleManualScanSubmit}
        onOpenCameraScanner={() => keyboard.setIsCameraScannerOpen(true)}
        isMuted={keyboard.isMuted}
        setIsMuted={keyboard.setIsMuted}
        onSyncToMainPackages={data.handleSyncToMainPackages}
      />

      {/* Barra de fórmulas */}
      <FormulaBar
        activeCell={keyboard.activeCell}
        setActiveCell={keyboard.setActiveCell}
        onFormulaSubmit={keyboard.handleFormulaSubmit}
      />

      {/* Cuadrícula de hoja de cálculo */}
      <SpreadsheetGrid
        isLoadingItems={data.isLoadingItems}
        isLoadingSheets={data.isLoadingSheets}
        visibleRows={data.visibleRows}
        activeCell={keyboard.activeCell}
        editingCell={keyboard.editingCell}
        editingValue={keyboard.editingValue}
        setEditingValue={keyboard.setEditingValue}
        setActiveCell={keyboard.setActiveCell}
        setEditingCell={keyboard.setEditingCell}
        getRemoteUserOnCell={presence.getRemoteUserOnCell}
        handleCellClick={keyboard.handleCellClick}
        handleCellDoubleClick={keyboard.handleCellDoubleClick}
        commitInlineCellEdit={keyboard.commitInlineCellEdit}
        getCellValue={keyboard.getCellValue}
        getItemIdForRow={keyboard.getItemIdForRow}
        broadcastActiveCell={presence.broadcastActiveCell}
        handleClearScanAtRow={data.handleClearScanAtRow}
        onOpenPasteModal={() => keyboard.setIsPasteModalOpen(true)}
        onLoadFromDatabase={data.handleLoadFromDatabase}
      />

      {/* Barra inferior de pestañas de hojas */}
      <LiveSheetsBottomBar
        hojas={data.hojas}
        activeHojaId={data.activeHojaId}
        setActiveHojaId={data.setActiveHojaId}
        onOpenNewSheetModal={() => keyboard.setIsNewSheetModalOpen(true)}
        totalRows={data.items.length}
        stats={data.stats}
      />

      {/* Modales */}
      <PasteWrListModal
        isOpen={keyboard.isPasteModalOpen}
        onClose={() => keyboard.setIsPasteModalOpen(false)}
        paquetes={paquetes}
        onImport={async importedItems => {
          if (!data.activeHojaId || importedItems.length === 0) return;

          const rowsToInsert = importedItems.map((it, idx) => ({
            hoja_id: data.activeHojaId,
            codigo_wr: it.codigoWr,
            casillero: it.casillero || it.codigoWr.replace(/^[A-Za-z]+0*/, ''),
            tracking_usa: '',
            consignatario: it.consignatario || '',
            peso_kg: it.pesoKg || 0,
            posicion_estante: it.posicionEstante || 'REC',
            notas: '',
            estado: 'PENDIENTE',
            veces_escaneado: 0,
            orden: data.items.length + idx + 1
          }));

          const { data: inserted, error } = await supabase.from('hojas_cotejo_items').insert(rowsToInsert).select();
          if (!error && inserted) {
            soundEffects.playBulkLoaded();
            data.fetchItems(data.activeHojaId);
            keyboard.setIsPasteModalOpen(false);
          }
        }}
      />

      <NewSheetModal
        isOpen={keyboard.isNewSheetModalOpen}
        onClose={() => keyboard.setIsNewSheetModalOpen(false)}
        operatorName={presence.operatorName}
        onCreated={newSheet => {
          data.fetchHojas();
          data.setActiveHojaId(newSheet.id);
          data.setDocTitle(newSheet.titulo || 'AMEX WR');
          keyboard.setIsNewSheetModalOpen(false);
        }}
      />

      <MobileScannerModal
        isOpen={keyboard.isCameraScannerOpen}
        onClose={() => keyboard.setIsCameraScannerOpen(false)}
        onConfirm={code => {
          keyboard.processBarcodeScan(code);
        }}
        paquetes={paquetes}
        clientes={clientes}
      />
    </div>
  );
}
