-- Migración: Cambio de Recepción (REC) a Oficina (OFI) y división de Despacho en Zona 1 y Zona 2 (sin pisos)

-- 1. Actualizar estanterias_posiciones
UPDATE estanterias_posiciones 
SET codigo_estante = 'OFI', 
    nivel_piso = 'N/A', 
    codigo_posicion = 'OFI', 
    zona_tipo = 'OFICINA', 
    descripcion = 'Oficina (OFI)' 
WHERE codigo_estante = 'REC';

UPDATE estanterias_posiciones 
SET codigo_estante = 'DSP-Z1', 
    nivel_piso = 'N/A', 
    codigo_posicion = 'DSP-Z1', 
    zona_tipo = 'DESPACHO', 
    descripcion = 'Despacho Zona 1 (DSP-Z1)' 
WHERE codigo_estante = 'DSP';

INSERT INTO estanterias_posiciones (codigo_estante, nivel_piso, codigo_posicion, zona_tipo, capacidad_max_paquetes, peso_max_kg, descripcion)
VALUES ('DSP-Z2', 'N/A', 'DSP-Z2', 'DESPACHO', 100, 500, 'Despacho Zona 2 (DSP-Z2)')
ON CONFLICT (almacen_id, codigo_posicion) DO NOTHING;

-- 2. Migrar paquetes existentes
UPDATE paquetes 
SET posicion_estante = 'OFI', 
    anaquel = 'OFI', 
    piso = NULL 
WHERE posicion_estante IN ('REC', 'REC-P1') OR anaquel = 'REC';

UPDATE paquetes 
SET posicion_estante = 'DSP-Z1', 
    anaquel = 'DSP-Z1', 
    piso = NULL 
WHERE posicion_estante IN ('DSP', 'DSP-P1') OR anaquel = 'DSP';
