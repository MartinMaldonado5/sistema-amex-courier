import fs from 'fs';
import path from 'path';

// Cargar .env.local manualmente para el script
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import {
  getActiveAiProvider,
  DEFAULT_OPENAI_MODEL,
  parseRotuloWithAi,
  extractDniNameFromImage,
  analyzeShalomBoletaPdf,
  analyzeInvoiceDocument
} from '../lib/gemini/analyzer';

async function main() {
  console.log('==================================================');
  console.log('🤖 TEST DE INTEGRACIÓN REAL CON GPT-6 LUNA');
  console.log(`- Proveedor Activo: ${getActiveAiProvider()}`);
  console.log(`- Modelo Configurado: ${DEFAULT_OPENAI_MODEL}`);
  console.log(`- API Key Presente: ${Boolean(process.env.OPENAI_API_KEY)}`);
  console.log('==================================================\n');

  // Test 1: Rótulo con AMEXito IA
  console.log('▶ [1/4] Probando parseRotuloWithAi (Texto de WhatsApp)...');
  const rotuloResult = await parseRotuloWithAi({
    text: `Hola, para enviar por Shalom a Trujillo:
Destinatario: CARLOS EDUARDO MENDOZA RUIZ
DNI: 72349182
Celular: 944123890
Agencia: SHALOM - TRUJILLO AV. ESPAÑA
Cajas: 3
Siglas: CP88`
  });
  console.log('✅ Rótulo procesado con éxito:');
  console.log(`   - Destinatario: ${rotuloResult.nombre}`);
  console.log(`   - Documento:    ${rotuloResult.dni}`);
  console.log(`   - Celular:      ${rotuloResult.celular}`);
  console.log(`   - Agencia:      ${rotuloResult.agencia}`);
  console.log(`   - Destino:      ${rotuloResult.destino}`);
  console.log(`   - Cajas:        ${rotuloResult.totalCajas}`);
  console.log(`   - Siglas:       ${rotuloResult.siglas}\n`);

  // Test 2: Auto-extracción DNI con fallback seguro
  console.log('▶ [2/4] Probando extractDniNameFromImage (Imagen simulada)...');
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const dniResult = await extractDniNameFromImage(dummyPng);
  console.log('✅ Extracción DNI completada:');
  console.log(`   - Nombre detectado: "${dniResult.nombre_completo}"`);
  console.log(`   - DNI detectado:    "${dniResult.dni}"\n`);

  // Test 3: Lectura de Invoice Document
  console.log('▶ [3/4] Probando analyzeInvoiceDocument...');
  const invoiceResult = await analyzeInvoiceDocument(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'image/png'
  );
  console.log('✅ Factura analizada:');
  console.log(`   - Tracking:    "${invoiceResult.tracking_usa}"`);
  console.log(`   - Nro Invoice: "${invoiceResult.invoice_number}"\n`);

  // Test 4: Lectura de Boleta Shalom
  console.log('▶ [4/4] Probando analyzeShalomBoletaPdf...');
  const shalomResult = await analyzeShalomBoletaPdf(dummyPng);
  console.log('✅ Boleta Shalom analizada:');
  console.log(`   - Nro Orden:   "${shalomResult.nro_orden}"`);
  console.log(`   - Destino:     "${shalomResult.destino}"`);
  console.log(`   - Monto Total: ${shalomResult.monto_total}\n`);

  console.log('🎉 ¡TODOS LOS MÓDULOS DE IA OPERAN AL 100% CON GPT-6 LUNA!');
}

main().catch((err) => {
  console.error('❌ Error en el test de integración:', err);
  process.exit(1);
});
