import { describe, it, expect } from 'vitest';
import {
  renderPackagesTableCanvas,
  copyPackagesTableAsImage
} from '@/features/inventory/utils/clipboardTableImage';
import { Paquete } from '@/types';

describe('clipboardTableImage utility', () => {
  const mockPackages: Paquete[] = [
    {
      id: 'pkg-1',
      numeroReciboBodega: 'WR-001',
      tracking: '1Z999AA10123456784',
      trackingUsa: '1Z999AA10123456784',
      tipoEmpaque: 'CAJA',
      nombreConsignatario: 'JUAN PEREZ FLORES',
      descripcion: 'Zapatillas Nike',
      pesoKg: 2.5,
      ubicacionActual: 'AmexLince',
      posicionEstante: 'A1-2',
      anaquel: 'A1',
      piso: '2',
      estadoTib: 'Recibido',
      estadoAmex: 'en_almacen',
      creadoEn: '2026-10-07T12:00:00Z'
    },
    {
      id: 'pkg-2',
      numeroReciboBodega: 'WR-002',
      tracking: 'TBA123456789',
      trackingUsa: 'TBA123456789',
      tipoEmpaque: 'SOBRE',
      nombreConsignatario: 'CATALINA GOMEZ',
      descripcion: 'Ropa deportiva',
      pesoKg: 1.2,
      ubicacionActual: 'Entregado',
      posicionEstante: 'DSP-01',
      anaquel: 'DSP',
      piso: '1',
      estadoTib: 'Recibido',
      estadoAmex: 'entregado',
      creadoEn: '2026-10-07T12:00:00Z'
    }
  ];

  it('fails gracefully when copying an empty list of packages', async () => {
    const res = await copyPackagesTableAsImage([]);
    expect(res.success).toBe(false);
    expect(res.count).toBe(0);
    expect(res.error).toContain('No hay paquetes');
  });

  it('safely returns null when rendering canvas in Node environment without document', () => {
    // In vitest node environment, document is undefined
    const canvas = renderPackagesTableCanvas(mockPackages);
    expect(canvas).toBeNull();
  });

  it('handles simulated DOM environment and creates canvas correctly', () => {
    const mockContext = {
      scale: () => {},
      fillStyle: '',
      fillRect: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {}
      }),
      font: '',
      fillText: () => {},
      textAlign: '',
      measureText: (text: string) => ({ width: text.length * 8 }),
      beginPath: () => {},
      roundRect: () => {},
      fill: () => {},
      stroke: () => {},
      strokeRect: () => {},
      strokeStyle: '',
      lineWidth: 1
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      style: { width: '', height: '' },
      getContext: () => mockContext
    };

    // Temporarily define global document
    (globalThis as unknown as { document: unknown }).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
      }
    };

    try {
      const canvas = renderPackagesTableCanvas(mockPackages);
      expect(canvas).not.toBeNull();
      // Width is 820 * 2 = 1640
      expect((canvas as unknown as typeof mockCanvas).width).toBe(1640);
    } finally {
      // Cleanup global document
      delete (globalThis as unknown as { document?: unknown }).document;
    }
  });
});
