import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const instructivoPath = path.resolve('ARCHIVOS A ANALIZAR PARA AUTOMATIZAR LOS COBROS/INSTRUCTIVO DE EMBARQUE N1 24 SET.xlsx');
console.log('Leyendo instructivo de prueba:', instructivoPath);

const buf = fs.readFileSync(instructivoPath);
const wb = XLSX.read(buf, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// 1. Detectar cabecera dinámica
let headerIndex = -1;
let wrCol = -1;
let consigCol = -1;
let descCol = -1;
let dniCol = -1;
let obsCol = -1;

for (let r = 0; r < Math.min(20, data.length); r++) {
  const row = data[r] || [];
  for (let c = 0; c < row.length; c++) {
    const val = String(row[c]).toUpperCase().trim();
    if (val === 'WR' || val.includes('CODIGO WAREHOUSE')) {
      headerIndex = r;
      wrCol = c;
      break;
    }
  }
  if (headerIndex !== -1) {
    const hrow = data[headerIndex] || [];
    for (let c = 0; c < hrow.length; c++) {
      const h = String(hrow[c]).toUpperCase().trim();
      if (h.includes('CONSIGNATARIO') || h.includes('DESTINATARIO')) consigCol = c;
      if (h.includes('DESCRIPCION')) descCol = c;
      if (h.includes('IDENTIDAD') || h.includes('DNI') || h.includes('RUC')) dniCol = c;
      if (h.includes('OBSERVACION')) obsCol = c;
    }
    break;
  }
}

console.log('Cabecera detectada en fila:', headerIndex, { wrCol, consigCol, descCol, dniCol, obsCol });

const filas = [];
for (let i = headerIndex + 1; i < data.length; i++) {
  const r = data[i];
  if (!r) continue;
  const rawWr = String(r[wrCol] || '').trim();
  if (!rawWr || rawWr === 'WR' || rawWr.startsWith('#')) continue;

  const matches = rawWr.match(/WR\d{5,12}/gi);
  if (!matches || matches.length === 0) continue;

  const wrs = Array.from(new Set(matches.map(w => w.toUpperCase())));
  const delimiter = rawWr.includes('/') ? ' / ' : ' - ';

  filas.push({
    filaOriginal: i + 1,
    rawWr,
    wr: rawWr,
    wrs,
    delimiter,
    esMultiWr: wrs.length > 1,
    consignatario: String(r[consigCol] || '').trim(),
    cliente: String(r[consigCol] || '').trim(),
    descripcion: String(r[descCol] || '').trim(),
    dni: String(r[dniCol] || '').trim(),
    observaciones: String(r[obsCol] || '').trim(),
  });
}

console.log(`Instructivo parseado: ${filas.length} filas extraídas.`);
const multiWrCount = filas.filter(f => f.esMultiWr).length;
console.log(`Celdas con múltiples WRs agrupados: ${multiWrCount}`);

console.log('\nEnviando las filas al VPS de Hostinger (http://2.25.89.222:10000/cruzar-cobros)...');
const t0 = Date.now();

fetch('http://2.25.89.222:10000/cruzar-cobros', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filas, fuente: 'sent', includeFallbacks: true }),
})
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  })
  .then(resp => {
    const totalDuration = Date.now() - t0;
    console.log('\n======================================================');
    console.log('✅ RESPUESTA EXITOSA DEL VPS HOSTINGER');
    console.log('======================================================');
    console.log('Tiempo total (red + VPS):', totalDuration, 'ms');
    console.log('Duración interna en VPS:', resp.duracionMs, 'ms');
    console.log('Total filas procesadas:', resp.totalFilas);
    console.log('Coincidencias completas (100% WRs encontrados):', resp.coincidenciasCompletas);
    console.log('Coincidencias parciales:', resp.coincidenciasParciales);
    console.log('Sin coincidencia:', resp.sinCoincidencia);
    console.log('Tasa de éxito:', ((resp.coincidenciasCompletas / resp.totalFilas) * 100).toFixed(1) + '%');

    // Muestra de resultados con multi-WR
    console.log('\n--- MUESTRA DE FILAS CON MULTI-WR CRUZADAS EN EL VPS ---');
    const multiSamples = resp.filasCruzadas.filter(f => f.esMultiWr).slice(0, 5);
    multiSamples.forEach((f, idx) => {
      console.log(`\n[${idx + 1}] Fila ${f.filaOriginal}: ${f.cliente}`);
      console.log(`    Celda WR original (Agrupada): "${f.wr}"`);
      console.log(`    Sub-WRs detectados (${f.wrs.length}): [${f.wrs.join(', ')}]`);
      console.log(`    Trackings TIB combinados: "${f.tracking}"`);
      console.log(`    Pesos individuales: "${f.pesoFormateado}"`);
      console.log(`    Peso Total consolidado: ${f.pesoTotal} lb`);
      console.log(`    Estado: ${f.encontrado ? 'ENCONTRADO 100%' : 'PARCIAL'}`);
    });
  })
  .catch(err => {
    console.error('❌ Error en cruce VPS:', err);
  });
