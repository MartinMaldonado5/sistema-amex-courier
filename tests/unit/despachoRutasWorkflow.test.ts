import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  getWhatsAppUrl,
  getGoogleMapsUrl,
  normalizeDistrito,
  parseQuickPasteRows,
  ZONAS_LIMA_DISTRITOS
} from '@/lib/utils/phoneUtils';

describe('Módulo de Despacho y Rutas: Utilidades y Flujo de Chofer', () => {
  describe('Normalización Telefónica (Perú e Internacional)', () => {
    it('normaliza correctamente celulares peruanos de 9 dígitos con espacios', () => {
      const res = normalizePhoneNumber('997 370 290');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('51997370290');
      expect(res.telUri).toBe('tel:+51997370290');
      expect(res.display).toBe('+51 997 370 290');
      expect(res.isInternational).toBe(false);
    });

    it('normaliza números peruanos que ya incluyen el código +51', () => {
      const res = normalizePhoneNumber('+51 997 749 502');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('51997749502');
      expect(res.telUri).toBe('tel:+51997749502');
      expect(res.display).toBe('+51 997 749 502');
    });

    it('maneja números internacionales como Ecuador (+593)', () => {
      const res = normalizePhoneNumber('+593 99 814 6510');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('593998146510');
      expect(res.telUri).toBe('tel:+593998146510');
      expect(res.isInternational).toBe(true);
    });

    it('maneja valores vacíos o inválidos sin romper la aplicación', () => {
      const resEmpty = normalizePhoneNumber('');
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.normalized).toBe('');
      expect(resEmpty.display).toBe('Sin teléfono');

      const resShort = normalizePhoneNumber('123');
      expect(resShort.isValid).toBe(false);
    });
  });

  describe('Generador de Enlaces Directos para el Chofer', () => {
    it('genera enlace de WhatsApp oficial con mensaje pre-cargado amigable', () => {
      const url = getWhatsAppUrl('997370290', 'Daniel Valdivia', '5 CJS', 'Calle Francia 510');
      expect(url).toContain('https://wa.me/51997370290');
      expect(url).toContain(encodeURIComponent('Daniel Valdivia'));
      expect(url).toContain(encodeURIComponent('5 CJS'));
      expect(url).toContain(encodeURIComponent('Calle Francia 510'));
    });

    it('retorna cadena vacía en WhatsApp si el teléfono es inválido', () => {
      const url = getWhatsAppUrl('', 'Cliente');
      expect(url).toBe('');
    });

    it('genera enlace de navegación Google Maps con dirección y distrito', () => {
      const url = getGoogleMapsUrl('Av Mariscal Cáceres 136', 'Miraflores');
      expect(url).toContain('https://www.google.com/maps/search/?api=1');
      expect(url).toContain(encodeURIComponent('Av Mariscal Cáceres 136, Miraflores, Lima, Perú'));
    });
  });

  describe('Normalización de Distritos de Lima y Catálogo de 43 Distritos', () => {
    it('estandariza abreviaturas comunes de Lima', () => {
      expect(normalizeDistrito('SURCO')).toBe('SANTIAGO DE SURCO');
      expect(normalizeDistrito('MOLINA')).toBe('LA MOLINA');
      expect(normalizeDistrito('SJL')).toBe('SAN JUAN DE LURIGANCHO');
      expect(normalizeDistrito('SMP')).toBe('SAN MARTIN DE PORRES');
      expect(normalizeDistrito('SAN BORJA')).toBe('SAN BORJA');
    });

    it('contiene las 4 zonas tradicionales con exactamente 43 distritos', () => {
      const norte = ZONAS_LIMA_DISTRITOS.find(z => z.zona.includes('Lima Norte'));
      const centro = ZONAS_LIMA_DISTRITOS.find(z => z.zona.includes('Lima Centro'));
      const este = ZONAS_LIMA_DISTRITOS.find(z => z.zona.includes('Lima Este'));
      const sur = ZONAS_LIMA_DISTRITOS.find(z => z.zona.includes('Lima Sur'));

      expect(norte?.distritos).toHaveLength(8);
      expect(centro?.distritos).toHaveLength(16);
      expect(este?.distritos).toHaveLength(8);
      expect(sur?.distritos).toHaveLength(11);

      const totalTradicionales = (norte?.distritos.length || 0) +
        (centro?.distritos.length || 0) +
        (este?.distritos.length || 0) +
        (sur?.distritos.length || 0);

      expect(totalTradicionales).toBe(43);
    });

    it('normaliza distritos con tildes o variaciones de escritura', () => {
      expect(normalizeDistrito('Ancón')).toBe('ANCON');
      expect(normalizeDistrito('Breña')).toBe('BREÑA');
      expect(normalizeDistrito('Rímac')).toBe('RIMAC');
      expect(normalizeDistrito('Lurín')).toBe('LURIN');
      expect(normalizeDistrito('Cercado de Lima (Lima)')).toBe('CERCADO DE LIMA');
    });
  });

  describe('Parser de Pegado Rápido desde Excel (Quick Paste)', () => {
    it('parsea correctamente líneas tabuladas copiadas de ENTREGAS 2026.xlsx', () => {
      const excelClipboard = [
        'NOMBRE\twr\tDIRECCIÓN Y TELEFONO\tDISTRITO\tCEL',
        'DANIEL VALDIVIA\t405148\tCALLE FRANCIA 510 DPTO 602\tMIRAFLORES\t997 370 290',
        'LISS CASTILLO\t404403- MAS 8 CJS\tAV MARISCAL CACERES 136\tMIRAFLORES\t969 738 878\t14.70',
        'WALTER FUSTER\t10 CJS\tAV AVIACION 2905\tSAN BORJA\t970 794 911'
      ].join('\n');

      const paradas = parseQuickPasteRows(excelClipboard);

      expect(paradas).toHaveLength(3);

      // Parada 1
      expect(paradas[0].destinatario).toBe('DANIEL VALDIVIA');
      expect(paradas[0].wrBultos).toBe('405148');
      expect(paradas[0].direccion).toBe('CALLE FRANCIA 510 DPTO 602');
      expect(paradas[0].distrito).toBe('MIRAFLORES');
      expect(paradas[0].telefono).toBe('997 370 290');
      expect(paradas[0].montoCobro).toBe(0);

      // Parada 2 (con bultos y cobro)
      expect(paradas[1].destinatario).toBe('LISS CASTILLO');
      expect(paradas[1].wrBultos).toBe('404403- MAS 8 CJS');
      expect(paradas[1].montoCobro).toBe(14.70);

      // Parada 3 (con bultos CJS)
      expect(paradas[2].destinatario).toBe('WALTER FUSTER');
      expect(paradas[2].wrBultos).toBe('10 CJS');
      expect(paradas[2].distrito).toBe('SAN BORJA');
    });

    it('ignora filas vacías o cabeceras repetidas', () => {
      const raw = `
        NOMBRE\twr\tDIRECCIÓN\tDISTRITO\tCEL
        
        CLIENTE: LISS CASTILLO
        VICTOR SCALISI\t6 CJS\tCALLE 10\tSURCO\t999 888 777
      `;
      const paradas = parseQuickPasteRows(raw);
      expect(paradas).toHaveLength(1);
      expect(paradas[0].destinatario).toBe('VICTOR SCALISI');
    });
  });
});
