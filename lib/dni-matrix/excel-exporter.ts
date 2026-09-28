import writeXlsxFile from 'write-excel-file/browser';
import { saveAs } from 'file-saver';
import { DniSlotData } from './db';

/**
 * Exporta los expedientes a un archivo Excel con dos columnas:
 * Nombres y Apellidos, y DNI.
 */
export function exportDniDataToExcel(
  slots: DniSlotData[],
  onSuccess?: (msg: string) => void
): void {
  const populatedSlots = slots
    .filter((s) => (s.label && s.label.trim()) || (s.dni && s.dni.trim()))
    .sort((a, b) => a.id - b.id);

  if (populatedSlots.length === 0) {
    const hasAnyImage = slots.some((s) => s.anverso || s.reverso);
    if (hasAnyImage) {
      throw new Error(
        'Hay imágenes cargadas pero no tienen Nombres ni DNI registrados. Usa "Extraer Nombres y DNI con AMEXito" o escríbelos a mano antes de exportar.'
      );
    }
    throw new Error('No hay expedientes con nombres o DNI registrados para exportar.');
  }

  const data = populatedSlots.map((s) => ({
    nombres: (s.label || '').trim().toUpperCase(),
    dni: (s.dni || '').trim()
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `DNI_Reporte_${populatedSlots.length}_Registros_${dateStr}.xlsx`;
  const writer = writeXlsxFile(data, {
    sheet: 'DNI y Datos',
    columns: [
      {
        header: { value: 'Nombres y Apellidos', fontWeight: 'bold' },
        cell: (row) => ({ value: row.nombres }),
        width: 42
      },
      {
        header: { value: 'DNI', fontWeight: 'bold' },
        cell: (row) => ({ value: row.dni }),
        width: 22
      }
    ]
  });

  void writer.toBlob().then((blob) => {
    saveAs(blob, filename);
    onSuccess?.(`¡Excel descargado con éxito (${populatedSlots.length} registros en 2 columnas)!`);
  });
}
