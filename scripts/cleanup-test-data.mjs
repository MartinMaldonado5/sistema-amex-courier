import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cargar variables de entorno
const envPath = path.resolve(__dirname, '..', '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  }
}

const supabaseUrl = envVars.SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${envVars.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: envVars.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: envVars.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});
const bucketName = envVars.CLOUDFLARE_R2_BUCKET_NAME || 'amex-courier-cloud';

async function main() {
  console.log('=====================================================');
  console.log('🧹 INICIANDO LIMPIEZA TOTAL DE DATOS DE PRUEBA');
  console.log('   - Módulo 3: Inventario (Paquetes, Kardex, Escaneos)');
  console.log('   - Módulo 13: Worker & Jobs (Jobs, TIB, R2, Cache VPS)');
  console.log('=====================================================\n');

  // --- PARTE 1: LIMPIEZA EN SUPABASE ---
  console.log('--- [1/3] Limpiando Base de Datos Supabase ---');

  // A. Tablas dependientes de paquetes
  const { count: cEscaneos, error: errEsc } = await supabase
    .from('escaneos_log')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ escaneos_log eliminados: ${cEscaneos ?? 'OK'} ${errEsc ? `(Error: ${errEsc.message})` : ''}`);

  const { count: cTraza, error: errTraza } = await supabase
    .from('historial_trazabilidad')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ historial_trazabilidad eliminados: ${cTraza ?? 'OK'} ${errTraza ? `(Error: ${errTraza.message})` : ''}`);

  const { count: cKardex, error: errKardex } = await supabase
    .from('movimientos_kardex')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ movimientos_kardex eliminados: ${cKardex ?? 'OK'} ${errKardex ? `(Error: ${errKardex.message})` : ''}`);

  // B. Tabla paquetes (Módulo 3)
  const { count: cPaquetes, error: errPaq } = await supabase
    .from('paquetes')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ paquetes eliminados (Módulo 3): ${cPaquetes ?? 'OK'} ${errPaq ? `(Error: ${errPaq.message})` : ''}`);

  // C. Auditoría de inventario
  const { count: cAudit, error: errAudit } = await supabase
    .from('auditoria_sistema')
    .delete({ count: 'exact' })
    .eq('modulo', 'INVENTARIO');
  console.log(`✓ auditoria_sistema (INVENTARIO) eliminados: ${cAudit ?? 'OK'} ${errAudit ? `(Error: ${errAudit.message})` : ''}`);

  // D. Módulo 13: inventario_jobs y inventario_tib_diario
  const { count: cJobs, error: errJobs } = await supabase
    .from('inventario_jobs')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ inventario_jobs eliminados (Módulo 13): ${cJobs ?? 'OK'} ${errJobs ? `(Error: ${errJobs.message})` : ''}`);

  const { count: cTib, error: errTib } = await supabase
    .from('inventario_tib_diario')
    .delete({ count: 'exact' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log(`✓ inventario_tib_diario eliminados (Módulo 13): ${cTib ?? 'OK'} ${errTib ? `(Error: ${errTib.message})` : ''}`);

  // --- PARTE 2: LIMPIEZA EN CLOUDFLARE R2 ---
  console.log('\n--- [2/3] Limpiando Archivos en Cloudflare R2 ---');
  const prefixes = [
    'FOLDER AMEX/inventario-jobs/',
    'FOLDER AMEX/inventario-tib/',
    'FOLDER AMEX/benchmark/'
  ];

  let totalR2Deleted = 0;
  for (const prefix of prefixes) {
    let continuationToken = undefined;
    do {
      const listCmd = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken
      });
      const listRes = await s3.send(listCmd);
      if (listRes.Contents && listRes.Contents.length > 0) {
        const objectsToDelete = listRes.Contents.map(c => ({ Key: c.Key }));
        await s3.send(new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectsToDelete }
        }));
        totalR2Deleted += objectsToDelete.length;
        console.log(`✓ Eliminados ${objectsToDelete.length} archivos de R2 con prefijo "${prefix}"`);
      }
      continuationToken = listRes.NextContinuationToken;
    } while (continuationToken);
  }
  console.log(`✓ Total de archivos eliminados en Cloudflare R2: ${totalR2Deleted}`);

  // --- PARTE 3: LIMPIEZA EN EL VPS WORKER (CACHE LOCAL) ---
  console.log('\n--- [3/3] Limpiando Cache en VPS Worker ---');
  try {
    const vpsExecScript = path.resolve(__dirname, 'vps-exec.ps1');
    const vpsCmd = `powershell -ExecutionPolicy Bypass -File "${vpsExecScript}" "docker exec amex-worker rm -rf /app/cache/tib-active/* /tmp/amex-jobs/*"`;
    execSync(vpsCmd, { stdio: 'inherit' });
    console.log('✓ Cache y archivos temporales borrados dentro del contenedor amex-worker en VPS.');
  } catch (err) {
    console.warn('⚠️ No se pudo ejecutar el comando en VPS:', err.message);
  }

  // Verificar estado del worker tras la purga
  try {
    const vpsHost = envVars.VPS_HOST || '2.25.89.222';
    const status = await fetch(`http://${vpsHost}:10000/`).then(r => r.json());
    console.log('\n📊 Estado del VPS Worker tras la limpieza:');
    console.log(`   - Status: ${status.status}`);
    console.log(`   - delivered exists: ${status.tibCache?.delivered?.exists}`);
    console.log(`   - sent exists: ${status.tibCache?.sent?.exists}`);
    console.log(`   - received exists: ${status.tibCache?.received?.exists}`);
  } catch (err) {
    console.log('Worker status fetch:', err.message);
  }

  console.log('\n=====================================================');
  console.log('🎉 LIMPIEZA COMPLETA EJECUTADA CON ÉXITO');
  console.log('=====================================================');
}

main().catch(err => {
  console.error('❌ Error general durante la limpieza:', err);
  process.exit(1);
});
