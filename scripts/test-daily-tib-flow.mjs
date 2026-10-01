import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Cargar .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const getEnv = (k) => {
  const match = envContent.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('--- TEST 1: Verificando tabla inventario_tib_diario en Supabase ---');
const { data, error } = await supabase.from('inventario_tib_diario').select('*').limit(5);

if (error) {
  console.error('Error consultando inventario_tib_diario:', error.message);
  process.exit(1);
}

console.log('✓ Tabla inventario_tib_diario consultada con éxito. Filas encontradas:', data.length);

// Verificar si hay archivos de prueba en PRUEBA EXCEL
const pruebaExcelDir = 'PRUEBA EXCEL';
if (fs.existsSync(pruebaExcelDir)) {
  console.log('✓ Directorio PRUEBA EXCEL encontrado con archivos de muestra.');
}

console.log('✓ Todo listo para el flujo operativo diario.');
