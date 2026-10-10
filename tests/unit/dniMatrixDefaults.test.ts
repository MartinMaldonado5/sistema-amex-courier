import { describe, it, expect } from 'vitest';
import { DNI_SIZE_PRESETS, DniPrintSize } from '@/lib/dni-matrix/docx-exporter';

describe('DNI Matrix Defaults & Size Presets', () => {
  it('has xlarge preset configured as 17.5 x 11.0 cm with maximum occupancy', () => {
    const xlarge = DNI_SIZE_PRESETS.xlarge;
    expect(xlarge).toBeDefined();
    expect(xlarge.widthCm).toBe(17.5);
    expect(xlarge.heightCm).toBe(11.0);
    expect(xlarge.widthMm).toBe(175);
    expect(xlarge.heightMm).toBe(110);
    expect(xlarge.widthPx).toBe(661);
    expect(xlarge.heightPx).toBe(416);
    expect(xlarge.name).toContain('Extra Grande');
    expect(xlarge.name).toContain('Recomendado');
  });

  it('has large and standard presets properly configured', () => {
    const large = DNI_SIZE_PRESETS.large;
    expect(large.widthCm).toBe(16.5);
    expect(large.heightCm).toBe(10.4);

    const standard = DNI_SIZE_PRESETS.standard;
    expect(standard.widthCm).toBe(12.0);
    expect(standard.heightCm).toBe(7.5);
  });

  it('preserves valid print size presets keys', () => {
    const keys: DniPrintSize[] = ['xlarge', 'large', 'standard'];
    keys.forEach((k) => {
      expect(DNI_SIZE_PRESETS[k]).toBeDefined();
    });
  });
});
