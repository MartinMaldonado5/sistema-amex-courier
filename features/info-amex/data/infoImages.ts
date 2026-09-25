export interface AmexInfoImage {
  id: string;
  title: string;
  category: 'tarifas' | 'pagos' | 'casillero' | 'sede';
  categoryLabel: string;
  badgeColor: string;
  filename: string;
  imageUrl: string;
  description: string;
  quickSummary: string[];
  suggestedWhatsappText: string;
}

export const AMEX_INFO_IMAGES: AmexInfoImage[] = [
  {
    id: 'tarifa-general',
    title: 'Tarifa General Courier USA - Lima / Provincias',
    category: 'tarifas',
    categoryLabel: 'Tarifario General',
    badgeColor: '#f59e0b',
    filename: 'tarifa-general-courier.jpeg',
    imageUrl: '/images/info-amex/tarifa-general-courier.jpeg',
    description: 'Tarifario general de paquetería desde Miami: $19 primer kilo (incluye trámite y entrega a domicilio en zonas de cobertura) y $8 por kilo adicional.',
    quickSummary: [
      'Primer kilo: $19 (Trámite administrativo + Entrega a domicilio en zona de cobertura)',
      'Cobro mínimo: 1 KG (Kilo adicional: $8 exacto)',
      'Consolidación en Miami: GRATIS',
      'Compras superiores a $200 pagan impuestos aprox. 24%',
      '2 vuelos por semana para entregas más rápidas',
      'Envíos a provincia por Shalom o Cruz del Sur (pago en destino)'
    ],
    suggestedWhatsappText: `✈️ *TARIFAS Y SERVICIOS AMEX COURIER* 📦

📦 *Primer kilo:* $19 USD (Incluye trámite administrativo y entrega a domicilio en zonas de cobertura).
⚖️ *Kilo adicional:* $8 USD por kilo (se cobra el peso exacto).
✅ *Consolidación en Miami:* Totalmente GRATIS.
⏱️ *Frecuencia:* 2 vuelos a la semana para entregas directas y seguras.
📍 *Envíos a provincia:* Vía Shalom o Cruz del Sur (pago en destino).
📌 *Nota:* Compras mayores a $200 USD pagan impuestos de aduana (aprox. 24%).`
  },
  {
    id: 'tarifa-medicinas',
    title: 'Tarifa Especial Medicinas, Vitaminas y Suplementos',
    category: 'tarifas',
    categoryLabel: 'Tarifa Especial Salud',
    badgeColor: '#0ea5e9',
    filename: 'tarifa-medicinas-suplementos.jpeg',
    imageUrl: '/images/info-amex/tarifa-medicinas-suplementos.jpeg',
    description: 'Tarifa especial para importación de medicamentos, vitaminas y suplementos: $25 primer kilo con delivery incluido y $15 kilo adicional.',
    quickSummary: [
      'Primer kilo: $25 (Incluye delivery en zonas de cobertura)',
      'Kilo adicional: $15',
      'Tiempo de entrega: 5 a 7 días una vez recibido en Miami',
      'Instagram: @AMEXCOURIERINT',
      'WhatsApp soporte: +51 942 804 464'
    ],
    suggestedWhatsappText: `💊 *IMPORTACIÓN DE MEDICINAS Y SUPLEMENTOS - AMEX COURIER* ✈️

🔹 *Primer kilo:* $25 USD (incluye delivery en zonas de cobertura).
🔹 *Kilo adicional:* $15 USD.
⏱️ *Tiempo estimado de entrega:* 5 a 7 días hábiles una vez recibido en nuestro almacén de Miami.
📱 *WhatsApp directo de atención:* +51 942 804 464
📸 *Instagram:* @AMEXCOURIERINT`
  },
  {
    id: 'shipping-address',
    title: 'Dirección del Casillero Postal en Miami (Shipping Address)',
    category: 'casillero',
    categoryLabel: 'Casillero USA',
    badgeColor: '#10b981',
    filename: 'shipping-address-miami.jpeg',
    imageUrl: '/images/info-amex/shipping-address-miami.jpeg',
    description: 'Guía oficial para completar la dirección de envío (Shipping Address) en tiendas de EE.UU. (Amazon, eBay, Walmart, etc.).',
    quickSummary: [
      'Nombre / Name: TU NOMBRE Y APELLIDO / AMEX (Ej: JOSÉ PÉREZ / AMEX)',
      'Dirección / Address: 8010 NW 66 TH STREET',
      'Ciudad / City: MIAMI',
      'Estado / State: FLORIDA (FL)',
      'Código Postal / ZIP Code: 33166',
      'Teléfono / Telephone: +1 7869530702'
    ],
    suggestedWhatsappText: `🇺🇸 *DIRECCIÓN DE TU CASILLERO EN MIAMI - AMEX COURIER* 📦

Ingresa exactamente estos datos en la dirección de entrega (*Shipping Address*) de tu tienda (Amazon, eBay, etc.):

👤 *Nombre / Name:* [Tu Nombre y Apellido] / AMEX
🏠 *Dirección / Address:* 8010 NW 66 TH STREET
🌆 *Ciudad / City:* MIAMI
🗺️ *Estado / State:* FLORIDA (FL)
📮 *Código Postal / Zip Code:* 33166
📞 *Teléfono / Phone:* +1 7869530702

⚠️ *Importante:* No olvides agregar " / AMEX" al lado de tu nombre para que tu paquete sea clasificado de inmediato al llegar a bodega.`
  },
  {
    id: 'datos-pago',
    title: 'Cuentas Bancarias Oficiales BBVA y RUC de la Empresa',
    category: 'pagos',
    categoryLabel: 'Cuentas Bancarias',
    badgeColor: '#6366f1',
    filename: 'datos-pago-bbva.jpeg',
    imageUrl: '/images/info-amex/datos-pago-bbva.jpeg',
    description: 'Información fiscal y bancaria oficial de AMEX COURIER S.A.C. para transferencias en soles y dólares vía BBVA Banco Continental.',
    quickSummary: [
      'Razón Social: AMEX COURIER S.A.C.',
      'RUC: 20607649082',
      'Banco: BBVA',
      'Cta. Corriente Soles: 0011-0372-0100052214',
      'CCI Soles: 011-372-000100052214-02',
      'Cta. Corriente Dólares: 0011-0372-0100052362',
      'CCI Dólares: 011-372-000100052362-09'
    ],
    suggestedWhatsappText: `💳 *DATOS DE PAGO OFICIALES - AMEX COURIER S.A.C.* 🏛️

🏢 *RUC:* 20607649082
🏢 *Razón Social:* AMEX COURIER S.A.C.
🏦 *Banco:* BBVA

💵 *CUENTAS EN SOLES (S/):*
• Cta. Corriente Soles: \`0011-0372-0100052214\`
• CCI Interbancario: \`011-372-000100052214-02\`

💲 *CUENTAS EN DÓLARES ($ USD):*
• Cta. Corriente Dólares: \`0011-0372-0100052362\`
• CCI Interbancario: \`011-372-000100052362-09\`

📲 Por favor envíanos la constancia de pago con tu código de tracking o nombre para validar tu comprobante.`
  },
  {
    id: 'sede-lince',
    title: 'Dirección de Recojo en Oficina Principal Lince (Lima)',
    category: 'sede',
    categoryLabel: 'Sede de Recojo',
    badgeColor: '#ec4899',
    filename: 'direccion-recojo-lince.jpeg',
    imageUrl: '/images/info-amex/direccion-recojo-lince.jpeg',
    description: 'Ubicación central de entrega y retiro personal de paquetes en la tienda/oficina AMEX en Lince, Lima.',
    quickSummary: [
      'Dirección: Av. José Leal 1436, Lince, Lima',
      'Referencia: Cerca a zonas céntricas de Lince',
      'Atención rápida para retiro presencial de paquetes',
      'Garantía: Confianza, Rapidez y Exclusividad'
    ],
    suggestedWhatsappText: `📍 *NUESTRA DIRECCIÓN DE RECOJO EN LIMA - AMEX COURIER* 🏢

¡Tu paquete ya está listo para retiro presencial!

🏢 *Sede Central:*
Av. José Leal 1436, Lince - Lima.

Google Maps / Waze: Av. José Leal 1436, Lince.
¡Tu envío en las mejores manos! 📦✨`
  }
];
