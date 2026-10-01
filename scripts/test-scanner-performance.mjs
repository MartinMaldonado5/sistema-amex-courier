import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Cargar .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const getEnv = (k) => {
  const match = envContent.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('========================================================================');
console.log(' 🔬 PRUEBA INTENSIVA DE ESTRÉS: MÓDULO DE ESCÁNER Y SUBIDA A BASE DE DATOS');
console.log(' Conectado a Supabase:', supabaseUrl);
console.log('========================================================================\n');

// Generar 10 paquetes de prueba
const testBatch = Array.from({ length: 10 }, (_, i) => ({
  id: `test-scan-${Date.now()}-${i}`,
  code: `WRTEST${Math.floor(100000 + Math.random() * 900000)}`,
  format: 'CODE_128',
  location: `A1-P${(i % 3) + 1}`,
  anaquel: 'A1',
  piso: `P${(i % 3) + 1}`,
  nombreConsignatario: `Cliente Prueba ${i + 1}`,
  workflow: 'slotting',
  time: new Date().toLocaleTimeString(),
  synced: false
}));

async function testCurrentSequentialMethod() {
  console.log('--- TEST 1: MÉTODO ACTUAL (Bucles secuenciales cliente a cliente N+1) ---');
  console.log(`Simulando subida de ${testBatch.length} paquetes escaneados...\n`);

  const startTime = Date.now();
  let roundTrips = 0;
  const itemTimes = [];

  for (let idx = 0; idx < testBatch.length; idx++) {
    const log = testBatch[idx];
    const itemStart = Date.now();
    const upper = log.code.trim().toUpperCase();
    const loc = log.location;
    const [ana, pis] = loc.split('-');

    // 1. SELECT individual
    roundTrips++;
    const { data: foundList } = await supabase
      .from('paquetes')
      .select('id, numero_recibo_bodega, nombre_consignatario, ubicacion_actual, posicion_estante, eliminado_en')
      .or(`numero_recibo_bodega.eq.${upper},tracking_usa.eq.${upper}`)
      .limit(1);

    let targetPkgId = null;

    if (foundList && foundList.length > 0) {
      // 2. UPDATE individual
      roundTrips++;
      const matchedPkg = foundList[0];
      targetPkgId = matchedPkg.id;
      await supabase
        .from('paquetes')
        .update({
          anaquel: ana,
          piso: pis,
          posicion_estante: loc,
          ubicacion_actual: 'AmexLince',
          estado_entrega: 'EnAlmacen',
          actualizado_en: new Date().toISOString()
        })
        .eq('id', matchedPkg.id);

      // 3. Trazabilidad
      roundTrips++;
      await supabase.from('historial_trazabilidad').insert({
        paquete_id: matchedPkg.id,
        ubicacion: loc,
        descripcion_evento: `[TEST] Escaneado clasificado a ${loc}`,
        usuario_operador: 'Operador Test'
      });
    } else {
      // 2. INSERT individual
      roundTrips++;
      const { data: newPkg } = await supabase
        .from('paquetes')
        .insert({
          numero_recibo_bodega: upper,
          tracking_usa: '',
          tipo_empaque: 'Paquete',
          descripcion: 'Mercadería de prueba escáner',
          valor_declarado_usd: 50.0,
          ubicacion_actual: 'AmexLince',
          anaquel: ana,
          piso: pis,
          posicion_estante: loc,
          estado_entrega: 'EnAlmacen'
        })
        .select('id')
        .single();

      if (newPkg) {
        targetPkgId = newPkg.id;
        // 3. Trazabilidad
        roundTrips++;
        await supabase.from('historial_trazabilidad').insert({
          paquete_id: newPkg.id,
          ubicacion: loc,
          descripcion_evento: `[TEST] Ingreso prueba a ${loc}`,
          usuario_operador: 'Operador Test'
        });
      }
    }

    // 4. Kardex individual
    roundTrips++;
    await supabase.from('movimientos_kardex').insert({
      paquete_id: targetPkgId,
      codigo_paquete: upper,
      consignatario: log.nombreConsignatario,
      origen_descripcion: 'Recepción Test',
      destino_descripcion: `AmexLince (${loc})`,
      tipo_movimiento: 'SLOTTING',
      motivo: `[TEST] Clasificación a estante ${loc}`,
      usuario_operador: 'Operador Test'
    });

    // 5. Escaneos log individual
    roundTrips++;
    await supabase.from('escaneos_log').insert({
      codigo: log.code,
      paquete_id: targetPkgId,
      formato: log.format,
      modo_workflow: 'slotting',
      ubicacion: loc,
      operador: 'Operador Test'
    });

    const itemElapsed = Date.now() - itemStart;
    itemTimes.push(itemElapsed);
    console.log(`  Item ${idx + 1}/${testBatch.length} (${log.code}): ${itemElapsed} ms (5 llamadas HTTP completadas)`);
  }

  const totalTime = Date.now() - startTime;
  const avgPerItem = Math.round(totalTime / testBatch.length);

  console.log('\n📊 RESULTADOS MÉTODO ACTUAL:');
  console.log(`- Tiempo total para ${testBatch.length} paquetes: ${totalTime} ms (${(totalTime / 1000).toFixed(2)} segundos)`);
  console.log(`- Peticiones HTTP totales al servidor Supabase: ${roundTrips} round-trips`);
  console.log(`- Promedio por cada paquete: ${avgPerItem} ms`);
  console.log(`- PROYECCIÓN PARA 50 PAQUETES: ${((avgPerItem * 50) / 1000).toFixed(1)} segundos (con 250 peticiones)`);
  console.log(`- PROYECCIÓN PARA 100 PAQUETES: ${((avgPerItem * 100) / 1000).toFixed(1)} segundos (con 500 peticiones)`);

  // Limpiar paquetes de prueba
  const testWrs = testBatch.map(t => t.code);
  await supabase.from('paquetes').delete().in('numero_recibo_bodega', testWrs);
  console.log('\n✓ Paquetes de prueba eliminados limpiamente.');
}

async function testOptimizedBatchMethod() {
  console.log('\n------------------------------------------------------------------------');
  console.log('--- TEST 2: MÉTODO OPTIMIZADO (Procesamiento por Lotes / Batch Server) ---');
  console.log(`Simulando subida en bloque de ${testBatch.length} paquetes escaneados...\n`);

  const startTime = Date.now();
  let roundTrips = 0;

  const codes = testBatch.map(b => b.code.toUpperCase());

  // 1. SELECT masivo (1 solo round-trip para TODOS los paquetes)
  roundTrips++;
  const { data: existingList } = await supabase
    .from('paquetes')
    .select('id, numero_recibo_bodega, tracking_usa')
    .or(`numero_recibo_bodega.in.(${codes.map(c => `"${c}"`).join(',')}),tracking_usa.in.(${codes.map(c => `"${c}"`).join(',')})`);

  const existingMap = new Map();
  for (const p of existingList || []) {
    if (p.numero_recibo_bodega) existingMap.set(p.numero_recibo_bodega.toUpperCase(), p);
    if (p.tracking_usa) existingMap.set(p.tracking_usa.toUpperCase(), p);
  }

  const toInsert = [];
  const toUpdate = [];

  for (const log of testBatch) {
    const upper = log.code.toUpperCase();
    const loc = log.location;
    const [ana, pis] = loc.split('-');
    const existing = existingMap.get(upper);

    if (existing) {
      toUpdate.push({
        id: existing.id,
        anaquel: ana,
        piso: pis,
        posicion_estante: loc,
        ubicacion_actual: 'AmexLince',
        estado_entrega: 'EnAlmacen',
        actualizado_en: new Date().toISOString()
      });
    } else {
      toInsert.push({
        numero_recibo_bodega: upper,
        tracking_usa: '',
        tipo_empaque: 'Paquete',
        descripcion: 'Mercadería de prueba escáner batch',
        valor_declarado_usd: 50.0,
        ubicacion_actual: 'AmexLince',
        anaquel: ana,
        piso: pis,
        posicion_estante: loc,
        estado_entrega: 'EnAlmacen'
      });
    }
  }

  // 2. Insert masivo
  let insertedPkgs = [];
  if (toInsert.length > 0) {
    roundTrips++;
    const { data: created } = await supabase
      .from('paquetes')
      .insert(toInsert)
      .select('id, numero_recibo_bodega');
    insertedPkgs = created || [];
  }

  // Mapear IDs
  const allPkgEntries = [];
  for (const p of insertedPkgs) {
    allPkgEntries.push({ id: p.id, code: p.numero_recibo_bodega });
  }
  for (const u of toUpdate) {
    allPkgEntries.push({ id: u.id, code: testBatch.find(t => t.id === u.id)?.code || '' });
  }

  // 3. Trazabilidad masiva (1 solo INSERT para todos los items)
  roundTrips++;
  const trazabilidadRows = allPkgEntries.map(e => ({
    paquete_id: e.id,
    ubicacion: 'A1-P1',
    descripcion_evento: '[TEST] Ingreso masivo lote escáner',
    usuario_operador: 'Operador Test'
  }));
  await supabase.from('historial_trazabilidad').insert(trazabilidadRows);

  // 4. Kardex masivo (1 solo INSERT para todos los items)
  roundTrips++;
  const kardexRows = allPkgEntries.map(e => ({
    paquete_id: e.id,
    codigo_paquete: e.code,
    consignatario: 'Cliente Batch Test',
    origen_descripcion: 'Recepción Test',
    destino_descripcion: 'AmexLince (A1-P1)',
    tipo_movimiento: 'SLOTTING',
    motivo: '[TEST] Clasificación masiva batch',
    usuario_operador: 'Operador Test'
  }));
  await supabase.from('movimientos_kardex').insert(kardexRows);

  // 5. Escaneos log masivo (1 solo INSERT para todos los items)
  roundTrips++;
  const escaneosRows = allPkgEntries.map(e => ({
    codigo: e.code,
    paquete_id: e.id,
    formato: 'CODE_128',
    modo_workflow: 'slotting',
    ubicacion: 'A1-P1',
    operador: 'Operador Test'
  }));
  await supabase.from('escaneos_log').insert(escaneosRows);

  const totalTime = Date.now() - startTime;

  console.log('🚀 RESULTADOS MÉTODO POR LOTES (BATCH):');
  console.log(`- Tiempo total para ${testBatch.length} paquetes: ${totalTime} ms (${(totalTime / 1000).toFixed(2)} segundos)`);
  console.log(`- Peticiones HTTP totales al servidor: ${roundTrips} (en vez de 50)`);
  console.log(`- TIEMPO ESTIMADO PARA 100 PAQUETES: ~${(totalTime * 1.5) / 1000}s (en vez de 45-90 segundos)`);

  // Limpieza
  const testWrs = testBatch.map(t => t.code);
  await supabase.from('paquetes').delete().in('numero_recibo_bodega', testWrs);
  console.log('\n✓ Paquetes de prueba batch eliminados limpiamente.');
}

async function run() {
  await testCurrentSequentialMethod();
  await testOptimizedBatchMethod();
}

run().catch(console.error);
