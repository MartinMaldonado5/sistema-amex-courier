-- Migración: Incorporación del Piso 4 a los Anaqueles 1 (A1) y 2 (A2) y sincronización de posiciones WMS
INSERT INTO estanterias_posiciones (codigo_estante, nivel_piso, codigo_posicion, zona_tipo, capacidad_max_paquetes, peso_max_kg)
VALUES
  ('A1', 'P1', 'A1-P1', 'ALMACENAJE', 40, 150),
  ('A1', 'P2', 'A1-P2', 'ALMACENAJE', 40, 120),
  ('A1', 'P3', 'A1-P3', 'ALMACENAJE', 40, 80),
  ('A1', 'P4', 'A1-P4', 'ALMACENAJE', 40, 80),
  ('A2', 'P1', 'A2-P1', 'ALMACENAJE', 40, 150),
  ('A2', 'P2', 'A2-P2', 'ALMACENAJE', 40, 120),
  ('A2', 'P3', 'A2-P3', 'ALMACENAJE', 40, 80),
  ('A2', 'P4', 'A2-P4', 'ALMACENAJE', 40, 80),
  ('REC', 'P1', 'REC', 'RECEPCION', 100, 500),
  ('DSP', 'P1', 'DSP', 'DESPACHO', 100, 500)
ON CONFLICT DO NOTHING;
