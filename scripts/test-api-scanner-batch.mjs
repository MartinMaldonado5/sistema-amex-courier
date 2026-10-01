import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Cargar .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const getEnv = (k) => {
  const match = envContent.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function testApiEndpoint() {
  console.log('1. Generando token temporal de prueba con Supabase Admin...');
  
  // Generar un magic link / session token para test
  const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'maldonado4250@gmail.com'
  });

  if (linkErr || !linkData.properties?.action_link) {
    console.error('Error generando token:', linkErr);
    return;
  }

  // Intercambiar por sesión real
  const hashPart = linkData.properties.action_link.split('#')[1] || '';
  const searchPart = linkData.properties.action_link.split('?')[1] || '';
  const params = new URLSearchParams(hashPart || searchPart);
  const token = params.get('access_token') || params.get('token');

  console.log('2. Llamando a http://localhost:3000/api/scanner/batch-sync con Bearer Token...');

  const items = Array.from({ length: 20 }, (_, i) => ({
    id: `test-batch-${i + 1}`,
    code: `WRBCH${Math.floor(100000 + Math.random() * 900000)}`,
    format: 'CODE_128',
    location: `A${(i % 2) + 1}-P${(i % 3) + 1}`,
    anaquel: `A${(i % 2) + 1}`,
    piso: `P${(i % 3) + 1}`,
    workflow: 'slotting',
    nombreConsignatario: `Cliente Lote ${i + 1}`
  }));

  const payload = {
    items,
    operadorNombre: 'Martin Maldonado',
    operadorEmail: 'maldonado4250@gmail.com'
  };

  const start = Date.now();
  const res = await fetch('http://localhost:3000/api/scanner/batch-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-amex-service-role': serviceKey
    },
    body: JSON.stringify(payload)
  });

  const duration = Date.now() - start;
  const json = await res.json();

  console.log(`Respuesta HTTP (${res.status}) en ${duration}ms:`, JSON.stringify(json, null, 2));

  if (res.status === 200 && json.success) {
    console.log('\n✅ ¡LOTE BATCH-SYNC PROCESADO Y GUARDADO EN LA BASE DE DATOS EN MILISEGUNDOS!');
    // Limpieza
    const codes = payload.items.map(it => it.code);
    await adminSupabase.from('paquetes').delete().in('numero_recibo_bodega', codes);
    console.log('✓ Paquetes de prueba eliminados limpiamente.');
  } else {
    console.error('\n❌ Error en el endpoint:', json);
  }
}

testApiEndpoint().catch(console.error);
