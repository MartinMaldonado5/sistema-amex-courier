import fs from 'node:fs';
import path from 'node:path';
import writeXlsxFile from 'write-excel-file/node';

const outDir = path.resolve('benchmark-data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generando dataset para Benchmark (35,000 filas TIB + 1,000 paquetes de inventario)...');

// 1. Generar 1,000 paquetes de inventario
const invHeaders = [
  { value: 'N°', fontWeight: 'bold' },
  { value: 'WR', fontWeight: 'bold' },
  { value: 'Tracking', fontWeight: 'bold' },
  { value: 'Cliente', fontWeight: 'bold' },
  { value: 'Tipo Paquete', fontWeight: 'bold' },
  { value: 'Peso (Kg)', fontWeight: 'bold' },
  { value: 'Estado Entrega', fontWeight: 'bold' },
];

const invRows = [];
for (let i = 1; i <= 1000; i++) {
  invRows.push([
    { type: Number, value: i },
    { type: String, value: `WR-PERU-${100000 + i}` },
    { type: String, value: `1Z999AA1012345${i.toString().padStart(4, '0')}` },
    { type: String, value: `CLIENTE AMEX ${i}` },
    { type: String, value: i % 2 === 0 ? 'CAJA' : 'SOBRE' },
    { type: Number, value: Number((Math.random() * 5 + 0.5).toFixed(2)) },
    { type: String, value: 'En Almacén' },
  ]);
}

const invInstance = await writeXlsxFile([invHeaders, ...invRows]);
const invBuffer = await invInstance.toBuffer();
fs.writeFileSync(path.join(outDir, 'Inventario.xlsx'), invBuffer);
console.log('✓ Inventario.xlsx generado (1,000 filas)');

// Función para generar TIBs
async function generateTib(filename, rowCount, wrStart, wrEnd) {
  const tibHeaders = [
    { value: 'WR', fontWeight: 'bold' },
    { value: 'TRACKING', fontWeight: 'bold' },
    { value: 'CLIENTE', fontWeight: 'bold' },
    { value: 'TIPO PAQUETE', fontWeight: 'bold' },
    { value: 'PESO', fontWeight: 'bold' },
    { value: 'ESTADO', fontWeight: 'bold' },
  ];

  const tibRows = [];
  for (let i = 1; i <= rowCount; i++) {
    const isMatch = Math.random() < 0.2;
    const wrNum = isMatch
      ? Math.floor(Math.random() * (wrEnd - wrStart + 1)) + wrStart
      : 500000 + i;

    tibRows.push([
      { type: String, value: `WR-PERU-${wrNum}` },
      { type: String, value: `1Z999AA1012345${(wrNum % 10000).toString().padStart(4, '0')}` },
      { type: String, value: `CLIENTE CONSIGNATARIO ${wrNum}` },
      { type: String, value: i % 3 === 0 ? 'CAJA' : 'PAQUETE' },
      { type: Number, value: Number((Math.random() * 8 + 0.2).toFixed(2)) },
      { type: String, value: 'Recibido en Miami' },
    ]);
  }

  const tibInstance = await writeXlsxFile([tibHeaders, ...tibRows]);
  const tibBuffer = await tibInstance.toBuffer();
  fs.writeFileSync(path.join(outDir, filename), tibBuffer);
  console.log(`✓ ${filename} generado (${rowCount.toLocaleString()} filas)`);
}

await generateTib('ENTREGADO TIB.xlsx', 15000, 100001, 100400);
await generateTib('ENVIADO TIB.xlsx', 15000, 100401, 100800);
await generateTib('RECIBIDO TIB.xlsx', 5000, 100801, 101000);

console.log('Dataset generado con éxito en /benchmark-data.');
