import { describe, it, expect } from 'vitest';
import { BatchSyncScannerSchema } from '@/lib/validations/scanner.schema';
import { smartFormatWr, isValidWr } from '@/lib/validations/wr';

describe('Módulo 6.1: Optimización de Sincronización Masiva (.in batching)', () => {
  it('valida exitosamente un lote masivo de 250 items con BatchSyncScannerSchema', () => {
    const items = Array.from({ length: 250 }, (_, i) => ({
      id: `scan-${i + 1}`,
      code: `WR${String(100000000 + i).padStart(9, '0')}`,
      format: 'CODE_128',
      location: 'A1-P2',
      anaquel: 'A1',
      piso: 'P2',
      workflow: 'slotting' as const,
      nombreConsignatario: `Consignatario ${i + 1}`,
      operadorEmail: 'operador@amexcourier.com',
      operadorNombre: 'Operador Logístico AMEX',
    }));

    const result = BatchSyncScannerSchema.safeParse({
      items,
      operadorNombre: 'Operador Logístico AMEX',
      operadorEmail: 'operador@amexcourier.com',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items.length).toBe(250);
    }
  });

  it('agrupa correctamente 200 paquetes del mismo anaquel en 1 sola llamada SQL .in("id", ids)', () => {
    // Simulación del algoritmo de agrupación en app/api/scanner/batch-sync/route.ts
    interface UpdateGroup {
      fields: Record<string, unknown>;
      ids: Set<string>;
    }

    const updateGroups = new Map<string, UpdateGroup>();
    const packageMap = new Map<string, { id: string; numero_recibo_bodega: string }>();

    // Supongamos 200 paquetes existentes en base de datos
    for (let i = 1; i <= 200; i++) {
      const code = `WR${String(400000000 + i).padStart(9, '0')}`;
      packageMap.set(code, { id: `uuid-${i}`, numero_recibo_bodega: code });
    }

    // El operario escaneó los 200 paquetes al estante A1-P2
    const items = Array.from({ length: 200 }, (_, i) => ({
      id: `scan-${i + 1}`,
      code: `WR${String(400000000 + i + 1).padStart(9, '0')}`,
      location: 'A1-P2',
      anaquel: 'A1',
      piso: 'P2',
      estadoAmex: 'en_almacen',
    }));

    const nowIso = new Date().toISOString();

    for (const log of items) {
      const upper = log.code.trim().toUpperCase();
      const loc = log.location;
      const [ana, pis] = loc.split('-');
      const estadoAmex = log.estadoAmex;

      const isLevelLess = ['OFI', 'DSP-Z1', 'DSP-Z2', 'TRANSITO', 'REC', 'DSP'].includes(ana);
      const finalPiso = isLevelLess ? null : pis;
      const finalPosicion = isLevelLess ? ana : loc;

      const matchedPkg = packageMap.get(upper);
      if (matchedPkg) {
        const groupKey = `${ana}::${finalPiso ?? ''}::${finalPosicion}::${estadoAmex}`;
        if (!updateGroups.has(groupKey)) {
          updateGroups.set(groupKey, {
            fields: {
              anaquel: ana,
              piso: finalPiso,
              posicion_estante: finalPosicion,
              ubicacion_actual: 'AmexLince',
              estado_amex: estadoAmex,
              actualizado_en: nowIso,
            },
            ids: new Set<string>(),
          });
        }
        updateGroups.get(groupKey)!.ids.add(matchedPkg.id);
      }
    }

    // Debe existir exactamente 1 grupo que contiene los 200 IDs
    expect(updateGroups.size).toBe(1);
    const firstGroup = Array.from(updateGroups.values())[0];
    expect(firstGroup.ids.size).toBe(200);
    expect(firstGroup.fields.anaquel).toBe('A1');
    expect(firstGroup.fields.piso).toBe('P2');
    expect(firstGroup.fields.posicion_estante).toBe('A1-P2');
  });

  it('agrupa eficientemente paquetes distribuidos en múltiples anaqueles', () => {
    interface UpdateGroup {
      fields: Record<string, unknown>;
      ids: Set<string>;
    }

    const updateGroups = new Map<string, UpdateGroup>();
    const packageMap = new Map<string, { id: string }>();

    for (let i = 1; i <= 200; i++) {
      packageMap.set(`WR${i}`, { id: `uuid-${i}` });
    }

    // 200 items distribuidos entre 4 anaqueles (50 cada uno)
    const targets = ['A1-P1', 'A1-P2', 'A2-P1', 'A2-P2'];
    for (let i = 1; i <= 200; i++) {
      const loc = targets[i % 4];
      const [ana, pis] = loc.split('-');
      const groupKey = `${ana}::${pis}::${loc}::en_almacen`;

      if (!updateGroups.has(groupKey)) {
        updateGroups.set(groupKey, {
          fields: { anaquel: ana, piso: pis, posicion_estante: loc },
          ids: new Set<string>(),
        });
      }
      updateGroups.get(groupKey)!.ids.add(`uuid-${i}`);
    }

    // En vez de 200 queries individuales, solo son 4 consultas masivas .in('id', ids)
    expect(updateGroups.size).toBe(4);
    Array.from(updateGroups.values()).forEach((grp) => {
      expect(grp.ids.size).toBe(50);
    });
  });

  it('maneja ubicaciones sin piso ("OFI", "DSP-Z1", "TRANSITO") asignando piso null', () => {
    const anaquel = 'DSP-Z1';
    const isLevelLess = ['OFI', 'DSP-Z1', 'DSP-Z2', 'TRANSITO', 'REC', 'DSP'].includes(anaquel);
    const finalPiso = isLevelLess ? null : 'P1';
    const finalPosicion = isLevelLess ? anaquel : `${anaquel}-P1`;

    expect(isLevelLess).toBe(true);
    expect(finalPiso).toBeNull();
    expect(finalPosicion).toBe('DSP-Z1');
  });

  it('asegura formato WR válido para paquetes nuevos ingresados por escáner', () => {
    const rawCode = '12345';
    let newWr = smartFormatWr(rawCode);
    if (!isValidWr(newWr)) {
      const digitsOnly = rawCode.replace(/\D/g, '');
      const paddedDigits = (digitsOnly.length >= 9 ? digitsOnly.slice(-9) : digitsOnly).padStart(9, '0');
      newWr = `WR${paddedDigits}`;
    }

    expect(newWr).toBe('WR000012345');
    expect(newWr.length).toBe(11);
    expect(isValidWr(newWr)).toBe(true);
  });
});
