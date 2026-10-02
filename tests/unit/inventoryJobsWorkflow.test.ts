import { describe, it, expect, afterAll } from 'vitest';
import writeXlsxFile from 'write-excel-file/node';
import readXlsxFile from 'read-excel-file/node';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const tmpDir = path.join(os.tmpdir(), 'amex-workflow-test-' + Date.now());
fs.mkdirSync(tmpDir, { recursive: true });

describe('Módulo 13 (Worker & Cruce TIB) hacia Módulo 3 (Inventario)', () => {
  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 200));
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  it(
    'extrae correctamente el estado de los 3 archivos TIB (Entregado, Enviado, Recibido) y los transfiere a la columna Estado TIB/Entrega',
    async () => {
    // 1. Crear Inventario base como lo genera exportDbInventory
    const invHeaders = [
      { value: 'N°', fontWeight: 'bold' as const },
      { value: 'WR', fontWeight: 'bold' as const },
      { value: 'Tracking', fontWeight: 'bold' as const },
      { value: 'Cliente', fontWeight: 'bold' as const },
      { value: 'Tipo Paquete', fontWeight: 'bold' as const },
      { value: 'Peso (Kg)', fontWeight: 'bold' as const },
      { value: 'Estado AMEX', fontWeight: 'bold' as const },
      { value: 'Estado Entrega', fontWeight: 'bold' as const },
      { value: 'Posición WMS', fontWeight: 'bold' as const },
      { value: 'Almacén Actual', fontWeight: 'bold' as const },
      { value: 'Usuario que Ingresó (Email)', fontWeight: 'bold' as const },
      { value: 'Descripción del Paquete', fontWeight: 'bold' as const },
      { value: 'Fecha de Registro', fontWeight: 'bold' as const }
    ];

    const invRows = [
      [
        { type: Number, value: 1 },
        { type: String, value: 'WR-ENTREGADO-01' },
        { type: String, value: 'TRK001' },
        { type: String, value: 'Cliente 1' },
        { type: String, value: 'CAJA' },
        { type: Number, value: 1.5 },
        { type: String, value: 'RECIBIDO' },
        { type: String, value: 'En Almacén' },
        { type: String, value: 'A1-P1' },
        { type: String, value: 'Almacén Central Lince' },
        { type: String, value: 'admin@amex.com' },
        { type: String, value: 'Paquete 1' },
        { type: String, value: '01/10/2026' }
      ],
      [
        { type: Number, value: 2 },
        { type: String, value: 'WR-ENVIADO-02' },
        { type: String, value: 'TRK002' },
        { type: String, value: 'Cliente 2' },
        { type: String, value: 'SOBRE' },
        { type: Number, value: 0.5 },
        { type: String, value: 'RECIBIDO' },
        { type: String, value: 'En Almacén' },
        { type: String, value: 'A1-P2' },
        { type: String, value: 'Almacén Central Lince' },
        { type: String, value: 'admin@amex.com' },
        { type: String, value: 'Paquete 2' },
        { type: String, value: '01/10/2026' }
      ],
      [
        { type: Number, value: 3 },
        { type: String, value: 'WR-RECIBIDO-03' },
        { type: String, value: 'TRK003' },
        { type: String, value: 'Cliente 3' },
        { type: String, value: 'CAJA' },
        { type: Number, value: 2.0 },
        { type: String, value: 'RECIBIDO' },
        { type: String, value: 'En Almacén' },
        { type: String, value: 'A2-P1' },
        { type: String, value: 'Almacén Central Lince' },
        { type: String, value: 'admin@amex.com' },
        { type: String, value: 'Paquete 3' },
        { type: String, value: '01/10/2026' }
      ]
    ];

    const invFile = await writeXlsxFile([invHeaders, ...invRows]);
    const invPath = path.join(tmpDir, 'Inventario_Test.xlsx');
    fs.writeFileSync(invPath, await invFile.toBuffer());

    // 2. Crear los 3 archivos TIB
    // Archivo 1: ENTREGADO TIB
    const tibHeaders = [
      { value: 'WR', fontWeight: 'bold' as const },
      { value: 'Tracking', fontWeight: 'bold' as const },
      { value: 'Cliente', fontWeight: 'bold' as const },
      { value: 'Tipo Paquete', fontWeight: 'bold' as const },
      { value: 'Peso', fontWeight: 'bold' as const },
      { value: 'Estado', fontWeight: 'bold' as const }
    ];

    const deliveredRows = [
      [
        { type: String, value: 'WR-ENTREGADO-01' },
        { type: String, value: 'TRK001-UPD' },
        { type: String, value: 'Cliente 1 Entregado' },
        { type: String, value: 'CAJA' },
        { type: Number, value: 1.8 },
        { type: String, value: 'ENTREGADO A CLIENTE' }
      ]
    ];
    const deliveredFile = await writeXlsxFile([tibHeaders, ...deliveredRows]);
    const deliveredPath = path.join(tmpDir, 'ENTREGADO_TIB.xlsx');
    fs.writeFileSync(deliveredPath, await deliveredFile.toBuffer());

    // Archivo 2: ENVIADO TIB
    const sentRows = [
      [
        { type: String, value: 'WR-ENVIADO-02' },
        { type: String, value: 'TRK002-UPD' },
        { type: String, value: 'Cliente 2 Enviado' },
        { type: String, value: 'SOBRE' },
        { type: Number, value: 0.6 },
        { type: String, value: 'EN RUTA' }
      ]
    ];
    const sentFile = await writeXlsxFile([tibHeaders, ...sentRows]);
    const sentPath = path.join(tmpDir, 'ENVIADO_TIB.xlsx');
    fs.writeFileSync(sentPath, await sentFile.toBuffer());

    // Archivo 3: RECIBIDO TIB
    const receivedRows = [
      [
        { type: String, value: 'WR-RECIBIDO-03' },
        { type: String, value: 'TRK003-UPD' },
        { type: String, value: 'Cliente 3 Recibido' },
        { type: String, value: 'CAJA' },
        { type: Number, value: 2.1 },
        { type: String, value: 'RECIBIDO EN SEDE' }
      ]
    ];
    const receivedFile = await writeXlsxFile([tibHeaders, ...receivedRows]);
    const receivedPath = path.join(tmpDir, 'RECIBIDO_TIB.xlsx');
    fs.writeFileSync(receivedPath, await receivedFile.toBuffer());

    const outputPath = path.join(tmpDir, 'Inventario_COMPLETADO.xlsx');
    const csvPath = path.join(tmpDir, 'UNMATCHED.csv');

    // 3. Ejecutar el procesador C# del Worker
    const exePath = path.resolve('worker/processor/AmexInventoryProcessor/publish/win-x64/AmexInventoryProcessor.exe');

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(exePath, [invPath, deliveredPath, sentPath, receivedPath, outputPath, csvPath]);
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Processor exited with code ${code}: ${stderr}`));
      });
    });

    // 4. Verificar que el Excel generado contenga los estados extraídos de cada TIB
    const outputData = await readXlsxFile(outputPath) as any;
    const rows = Array.isArray(outputData) && outputData[0]?.data ? outputData[0].data : outputData;

    expect(rows.length).toBe(4); // 1 header + 3 data rows
    const headerRow = rows[0];
    const colEstadoEntrega = headerRow.findIndex((h: string) => String(h).toUpperCase().replace(/\s/g, '').includes('ESTADOENTREGA'));
    const colEstadoAmex = headerRow.findIndex((h: string) => String(h).toUpperCase().replace(/\s/g, '').includes('ESTADOAMEX'));

    expect(colEstadoEntrega).toBeGreaterThan(-1);
    expect(colEstadoAmex).toBeGreaterThan(-1);

    // Fila 1: vino de ENTREGADO TIB
    const rowEntregado = rows.find((r: any[]) => r[1] === 'WR-ENTREGADO-01');
    expect(rowEntregado[colEstadoEntrega]).toBe('ENTREGADO A CLIENTE');
    expect(rowEntregado[colEstadoAmex]).toBe('RECIBIDO'); // Conserva el estado AMEX intacto

    // Fila 2: vino de ENVIADO TIB
    const rowEnviado = rows.find((r: any[]) => r[1] === 'WR-ENVIADO-02');
    expect(rowEnviado[colEstadoEntrega]).toBe('EN RUTA');
    expect(rowEnviado[colEstadoAmex]).toBe('RECIBIDO');

    // Fila 3: vino de RECIBIDO TIB
    const rowRecibido = rows.find((r: any[]) => r[1] === 'WR-RECIBIDO-03');
    expect(rowRecibido[colEstadoEntrega]).toBe('RECIBIDO EN SEDE');
    expect(rowRecibido[colEstadoAmex]).toBe('RECIBIDO');

    // 5. Verificar la lógica de normalización de syncDb
    function normalizeKey(str: string): string {
      return str.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');
    }

    const normHeaders = headerRow.map((h: any) => normalizeKey(String(h || '')));
    let estadoTibIdx = normHeaders.findIndex((h: string) => h === 'ESTADOTIB' || h === 'ESTADOENTREGA' || h === 'ESTADODEENTREGA');
    if (estadoTibIdx === -1) {
      estadoTibIdx = normHeaders.findIndex((h: string) => (h.includes('TIB') || h.includes('ENTREGA')) && !h.includes('AMEX'));
    }

    expect(estadoTibIdx).toBe(colEstadoEntrega);
    expect(normHeaders[estadoTibIdx]).toBe('ESTADOENTREGA');
  }, 25000);
});
