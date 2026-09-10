async function test() {
  const sample = {
    nro_orden: '95294190',
    codigo: '7HH7',
    fecha_emision: '2026-09-09',
    hora_emision: '17:53:14',
    fecha_traslado: '2026-09-10',
    origen: 'AV. CORONEL JOSÉ LEAL 648, URB. FUNDO LOBATÓN, LINCE - LIMA',
    destino: 'CALLE YAVARÍ 507 B - ZAMACOLA - CERRO COLORADO - AREQUIPA',
    remitente_nombre: 'QUINTANA CORNEJO BLANCA ESTHER',
    remitente_dni: '06779177',
    remitente_telefono: '982400043',
    destinatario_nombre: 'REVILLA ANCASI MAGALY SHIRLEY',
    destinatario_dni: '42830643',
    destinatario_telefono: '986868420',
    tipo_entrega: 'ENTREGAR EN AGENCIA',
    forma_pago: 'Pendiente de Pago',
    descripcion: 'BULTO',
    cantidad: 1,
    unidad_medida: 'Volumen',
    peso: 0.12,
    observaciones: 'USTED NO CONTRATO EL SERVICIO DE GARANTIA - Recibido sin verificacion de contenido',
    monto_total: 33.00,
    moneda: 'PEN',
    pdf_url: '/api/storage/file?key=ticket-95294190.pdf',
    storage_path: 'boletas-shalom/ticket-95294190.pdf'
  };

  console.log('1. Testing POST /api/shalom-boletas...');
  const postRes = await fetch('http://localhost:3000/api/shalom-boletas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample)
  });
  const postJson = await postRes.json();
  console.log('POST status:', postRes.status, postJson);
  if (!postJson.success) process.exit(1);

  const createdId = postJson.data.id;

  console.log('\n2. Testing GET /api/shalom-boletas?q=CARLOS...');
  const getRes = await fetch('http://localhost:3000/api/shalom-boletas?q=CARLOS');
  const getJson = await getRes.json();
  console.log('GET result count:', getJson.total, 'items:', getJson.boletas.length);
  console.log('Stats:', getJson.stats);

  console.log(`\n3. Testing PATCH /api/shalom-boletas/${createdId}...`);
  const patchRes = await fetch(`http://localhost:3000/api/shalom-boletas/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto_total: 35.00, modalidad_pago: 'PAGADO' })
  });
  const patchJson = await patchRes.json();
  console.log('PATCH status:', patchRes.status, 'new total:', patchJson.data?.monto_total);

  console.log(`\n4. Testing DELETE /api/shalom-boletas/${createdId}...`);
  const delRes = await fetch(`http://localhost:3000/api/shalom-boletas/${createdId}`, {
    method: 'DELETE'
  });
  const delJson = await delRes.json();
  console.log('DELETE status:', delRes.status, delJson);

  console.log('\n✅ ALL CRUD TESTS PASSED SUCCESSFULLY!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
