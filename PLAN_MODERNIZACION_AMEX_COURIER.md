# 📋 Plan de Modernización y Refactorización Profesional: Sistema Amex Courier

Este documento define el plan estructurado para transformar el sistema actual en una plataforma de nivel empresarial, eliminando deuda técnica, garantizando seguridad estricta y optimizando la experiencia del usuario y del desarrollador.

---

## 🏗️ Fase 1: Limpieza de Repositorio y Archivos Residuales (Inmediato)

### Objetivos:
- Reducir el tamaño del repositorio y evitar fugas de datos operativos o credenciales.

### Acciones concretas:
1. **Archivar / Eliminar Scripts Residuales:**
   - Remover de `scripts/`: `test-api-route.mjs`, `test-api-route.ts`, `test-file-route.mjs`, `test-upload.mjs`, `test-services.mjs`, `gen-certs.mjs`.
   - Mantener únicamente scripts esenciales de migración o mantenimiento estructurado.
2. **Eliminar Archivos Temporales en Raíz:**
   - Eliminar `ESTADO DE COBROS 2026 AYLEN EL DIA VIERNES 11-09-2026.xlsx`.
   - Asegurar que `*.xlsx` en la raíz esté ignorado en `.gitignore` sin excepciones accidentales.
3. **Migración de Carpeta Local `INFO IMAGENES DE AMEX`:**
   - Subir las imágenes históricas a Cloudflare R2 (`FOLDER AMEX/imagenes-info/`).
   - Guardar las referencias/URLs en la tabla `info_imagenes` de Supabase.
   - Eliminar la carpeta pesada del repositorio local para aligerar clones y despliegues.

---

## 🌐 Fase 2: Descomposición del Monolito Frontend en Rutas Reales (App Router)

### Diagnóstico actual:
`app/page.tsx` acumula casi 900 líneas controlando 13 pestañas con estado local (`activeTabState`). Si el usuario recarga la página o quiere compartir un link directo con otro operario, la navegación se vuelve compleja.

### Nueva Arquitectura de Rutas Next.js:
Transformar las pestañas en páginas individuales con un `layout.tsx` persistente con barra lateral (Sidebar) y encabezado:

```
app/
├── layout.tsx                   # Layout global con Sidebar y Header persistente
├── page.tsx                     # Redirección automática a /dashboard
├── (routes)/
│   ├── dashboard/page.tsx       # Módulo 1: Panel Operativo
│   ├── live-sheets/page.tsx     # Módulo 2: Amex Excel / Hojas en vivo
│   ├── inventario/page.tsx      # Módulo 3: Inventario y WMS
│   ├── cobros/page.tsx          # Módulo 4: Cobros y Vouchers
│   ├── clientes/page.tsx        # Módulo 5: Directorio de Clientes
│   ├── escaner/page.tsx         # Módulo 6: Escáner de Códigos Móvil
│   ├── dni-matrix/page.tsx      # Módulo 7: Procesador de DNI
│   ├── rotulos/page.tsx         # Módulo 8: Rótulos Agencias
│   ├── shalom/page.tsx          # Módulo 9: Boletas Shalom
│   ├── entregas/page.tsx        # Módulo 10: Formato de Entrega
│   ├── facturas/page.tsx        # Módulo 11: Invoices USA
│   ├── info-amex/page.tsx       # Módulo 12: Info Imágenes AMEX
│   └── completar-inventario/    # Módulo 13: Completar Inventario con TIB
│       └── page.tsx
```

### Beneficios:
- **Carga bajo demanda (Lazy Chunking):** Solo se descarga el código del módulo que el usuario está viendo.
- **URLs limpias y compartibles:** El chofer abre directamente `https://amex.pe/escaner`, cobranzas abre `https://amex.pe/cobros`.
- **Mantenibilidad:** Archivos de 100-200 líneas en lugar de un archivo de 900 líneas.

---

## 🔐 Fase 3: Seguridad de APIs, Middleware y Matriz Dinámica de Roles (RBAC)

### Diagnóstico actual:
- No hay control estricto de roles en las API Routes (`service_role` ejecutado sin validar la sesión del usuario peticionario).
- Usuario hardcodeado como `"Operador Logístico AMEX"`.

### Decisiones de Diseño Acordadas:
1. **Autenticación Formal con Supabase Auth:**
   - Inicio de sesión con **Correo Electrónico y Contraseña**.
   - Recuperación de contraseña vía correo corporativo.
   - Manejo de tokens JWT / Cookies seguras `httpOnly` mediante `@supabase/ssr`.
2. **Matriz Dinámica Configurable de Roles y Permisos (`roles` y `permisos_modulos`):**
   - El **Administrador** puede crear nuevos roles (ej. *Administrador*, *Jefe de Almacén*, *Chofer Callao*, *Auxiliar de Cobranzas*) y gestionar permisos granulares por módulo mediante casillas de verificación:
     - `ver` (lectura de la pantalla).
     - `crear` (ingreso de nuevos registros / escaneo).
     - `editar` (modificar consignatario, notas, reubicar estante).
     - `eliminar` (derecho a eliminar registros).
     - `exportar` (descarga de reportes en Excel).
   - Estructura en Supabase:
     ```sql
     CREATE TABLE public.perfiles_usuarios (
       id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
       nombre_completo TEXT NOT NULL,
       email TEXT NOT NULL UNIQUE,
       rol_id UUID REFERENCES public.roles_sistema(id),
       activo BOOLEAN DEFAULT true,
       creado_en TIMESTAMPTZ DEFAULT now()
     );

     CREATE TABLE public.roles_sistema (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       nombre TEXT NOT NULL UNIQUE,
       descripcion TEXT,
       permisos JSONB NOT NULL DEFAULT '{}'::jsonb
     );
     ```
3. **Next.js Auth & Security Middleware (`middleware.ts`):**
   - Interceptar cada petición de ruta (`/inventario`, `/cobros`, etc.) y endpoints `/api/*`.
   - Si no hay sesión válida o si el rol no tiene el permiso activo para ese módulo, redirigir a `/login` o devolver `403 Forbidden`.

---

## 📜 Fase 4: Gobernanza de Datos, Soft Delete y Panel de Auditoría

### Objetivos:
- Prevenir pérdida accidental de paquetes o comprobantes financieros.
- Conocer con precisión milimétrica **quién, cuándo y qué acción** se realizó en cada módulo.
- Capacidad de **recuperar datos eliminados por error** en 1 clic.

### Decisiones de Diseño Acordadas:
1. **Gobernanza mediante Eliminación Lógica (Soft Delete):**
   - Los paquetes, clientes o cobros no se borran físicamente de la base de datos con `DELETE`.
   - Se añaden columnas a las tablas críticas (`paquetes`, `cobros_vouchers`, etc.):
     - `eliminado_en TIMESTAMPTZ DEFAULT NULL`
     - `eliminado_por UUID REFERENCES auth.users(id)`
     - `motivo_eliminacion TEXT`
   - Las consultas estándar filtran automáticamente `WHERE eliminado_en IS NULL`.
2. **Registro Inmutable de Auditoría (`auditoria_sistema`):**
   ```sql
   CREATE TABLE public.auditoria_sistema (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     usuario_id UUID REFERENCES auth.users(id),
     usuario_nombre TEXT NOT NULL,
     usuario_email TEXT NOT NULL,
     modulo TEXT NOT NULL,           -- 'INVENTARIO', 'COBROS', 'ESCANER', 'COMPLETAR_TIB'
     accion TEXT NOT NULL,           -- 'CREAR', 'EDITAR', 'ELIMINAR_SOFT', 'RESTAURAR', 'TRANSFERENCIA'
     registro_id TEXT,               -- ID del paquete, voucher o cliente afectado
     valores_anteriores JSONB,       -- Snapshot previo para auditoría forense
     valores_nuevos JSONB,           -- Snapshot nuevo
     ip_origen TEXT,
     creado_en TIMESTAMPTZ DEFAULT now()
   );
   CREATE INDEX idx_auditoria_fecha ON public.auditoria_sistema(creado_en DESC);
   CREATE INDEX idx_auditoria_modulo ON public.auditoria_sistema(modulo, accion);
   ```
3. **Panel Visual de Auditoría en el Frontend (Módulo Admin):**
   - Vista tipo *Timeline / Registro de Actividad* accesible solo para Administradores.
   - Filtros avanzados por: Rango de fechas, Operador/Usuario, Módulo y Tipo de Acción.
   - **Botón "Restaurar":** Si un operario eliminó por error un paquete o lote, el Administrador puede hacer clic en "Restaurar" para reintegrarlo al inventario activo al instante sin perder la trazabilidad.

---

## ⚡ Fase 5: Infraestructura del Worker 24/7 en la Nube

### Diagnóstico actual:
- El worker en Render Free se duerme por inactividad.
- El worker local funciona perfecto en la máquina actual, pero no atiende cuando la PC está apagada.

### Opciones de Despliegue 24/7:
1. **Google Cloud Run (Serverless Container):**
   - Usar el contenedor Docker que ya creamos (`Dockerfile`).
   - Se activa por demanda o se mantiene con `min-instances: 1` con un costo menor a $5-$8 USD/mes.
2. **VPS Ligero (Hetzner / DigitalOcean / Railway):**
   - Costo fijo: $4 a $5 USD/mes.
   - Ejecuta Node.js + C# en Linux con `systemd` o Docker Compose sin pausas ni suspensiones.

---

## 🚀 Cronograma de Ejecución Sugerido

| Etapa | Alcance | Prioridad |
| :--- | :--- | :---: |
| **Paso 1** | Limpieza de archivos innecesarios (`scripts/`, excel raíz, etc.) |  Alta (Inmediata) |
| **Paso 2** | Creación de Rutas Reales de Next.js (`/inventario`, `/cobros`, etc.) |  Alta |
| **Paso 3** | Tabla de Auditoría e historial de cambios en Supabase |  Media |
| **Paso 4** | Roles de usuario y Middleware de seguridad en API Routes |  Alta |
| **Paso 5** | Despliegue del worker a Cloud Run o Railway para funcionamiento 24/7 |  Media |
