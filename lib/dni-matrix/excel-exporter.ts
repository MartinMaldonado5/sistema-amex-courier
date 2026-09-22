import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { DniSlotData } from './db';

/**
 * Exporta los datos de los expedientes a un archivo Microsoft Excel (.xlsx)
 * con exactamente 2 columnas:
 * 1. Nombres y Apellidos
 * 2. DNI
 */
export function exportDniDataToExcel(
  slots: DniSlotData[],
  onSuccess?: (msg: string) => void
): void {
  // Filtrar todos los cupos que contengan nombre o DNI registrado
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

  // Estructurar exactamente las 2 columnas solicitadas
  const data = populatedSlots.map((s) => ({
    'Nombres y Apellidos': (s.label || '').trim().toUpperCase(),
    'DNI': (s.dni || '').trim()
  }));

  // Crear la hoja de cálculo a partir del arreglo de objetos
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Configurar anchos óptimos de columna
  worksheet['!cols'] = [
    { wch: 42 }, // Columna 1: Nombres y Apellidos (ancho amplio)
    { wch: 22 }  // Columna 2: DNI
  ];

  // Crear el libro de trabajo y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DNI y Datos');

  // Escribir el buffer binario en formato XLSX
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `DNI_Reporte_${populatedSlots.length}_Registros_${dateStr}.xlsx`;

  saveAs(blob, filename);
  onSuccess?.(`¡Excel descargado con éxito (${populatedSlots.length} registros en 2 columnas)!`);
}
