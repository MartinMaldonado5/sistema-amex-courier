# 🚀 Plan de Implementación: Optimización de Latencia y Rendimiento en AMEXito IA

> **Proyecto:** `sistema-amex-courier`  
> **Objetivo:** Reducir el tiempo de respuesta del botón de Inteligencia Artificial (AMEXito IA, Extracción de DNI, Rótulos A4 y Boletas Shalom) de **~6 a 12 segundos** a **menos de 2.5 segundos** aplicando la arquitectura probada de `bot-finanzas-ia`.

---

## 📊 1. Resumen Diagnóstico y Metas de Rendimiento

| Etapa | Estado Actual | Meta con Optimización | Reducción de Latencia |
| :--- | :--- | :--- | :--- |
| **Transferencia de Imagen (Red)** | 2.5s – 5.0s *(Base64 5-12MB)* | **0.1s – 0.2s** *(Canvas JPEG 150KB)* | **~95% más rápido** |
| **Inferencia OpenAI GPT-6 Luna** | 3.0s – 5.0s *(Prompt libre / alias)* | **1.2s – 1.8s** *(JSON estricto)* | **~60% más rápido** |
| **Conexiones y Handshake** | Instanciación por petición | **Pool HTTP/2 persistente (Singleton)** | **~200ms ahorrados** |
| **Tiempo Total de Respuesta** | **~6.0s – 12.0s** | **⚡ < 2.2 segundos** | **~75% de mejora global** |

---

## 🛠️ 2. Fases del Plan de Implementación

### Fase 1: Compresión Inteligente de Imágenes en el Cliente (Frontend)
**Archivos a intervenir:**
* `features/dni-matrix/hooks/useDniMatrixState.ts`
* `features/rotulos/services/rotulos.service.ts`
* `components/tabs/BoletasShalomTab.tsx`

**Acciones:**
1. Crear una función utilitaria `compressImageForAi(base64Str: string, maxWidth = 1200, quality = 0.82): Promise<string>` en `lib/utils/imageCompressor.ts`.
2. Redimensionar capturas de pantalla de alta resolución (4K/1080p) o fotos de celular a un ancho máximo de 1200px (suficiente para OCR de texto nítido en DNIs, rótulos y comprobantes).
3. Reducir el tamaño de la carga útil de **8 MB a ~120-180 KB** antes de disparar el `fetch('/api/ai/...')`.

---

### Fase 2: Instancia Singleton y Configuración de Modelo Oficial en Backend
**Archivo a intervenir:**
* `lib/openai/analyzer.ts`

**Acciones:**
1. **Singleton del Cliente OpenAI:**
   Instanciar el cliente `OpenAI` una sola vez a nivel de módulo para mantener el pool de conexiones TLS persistentes:
   ```typescript
    let openAiClientInstance: OpenAI | null = null;
    export function getOpenAiClient(): OpenAI {
      if (!openAiClientInstance) {
        openAiClientInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      }
      return openAiClientInstance;
   }
   ```
2. **Modelo único:**
   Configurar GPT-6 Luna como modelo usado por todos los analizadores mediante `OPENAI_MODEL`.
   ```typescript
    export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';
   ```

---

### Fase 3: Modo JSON Estricto de OpenAI
**Archivo a intervenir:**
* `lib/openai/analyzer.ts`

**Acciones:**
1. Configurar `response_format: { type: 'json_object' }` en todas las llamadas:
   * `extractDniNameFromImage`
   * `parseRotuloWithAi`
   * `analyzeShalomBoletaPdf`
   * `analyzeInvoiceDocument`
2. **Beneficio:** Evita que el modelo genere bloques markdown adicionales (```json ... ```) o introducciones de texto, forzando una respuesta JSON estructurada.
3. Parsear el contenido devuelto por `response.choices[0]?.message?.content`.

---

### Fase 4: Feedback Visual Inmediato y Sonido Optimista
**Archivos a intervenir:**
* `features/dni-matrix/components/DniSlotEditor.tsx`
* `features/rotulos/components/AmexitoAiRotulosPanel.tsx`

**Acciones:**
1. Mostrar estado de carga animado (*skeleton/pulse*) en el botón de AMEXito inmediatamente al hacer clic.
2. Añadir sonido de confirmación al recibir la respuesta estructurada sin bloquear la interacción con otros cupos de la matriz.

---

## 🧪 3. Plan de Pruebas y Verificación

1. **Prueba de Carga de Red:** Medir el tamaño de la petición en la pestaña *Network* de DevTools (debe ser < 300 KB en lugar de > 5 MB).
2. **Prueba de Extracción de DNI:** Pegar captura desde WhatsApp Web y cronometrar la extracción del nombre y número de DNI (meta: < 2.0 s).
3. **Prueba de Rótulos Múltiples:** Enviar texto con 3 destinatarios y validar asignación instantánea en slots A4.
4. **Prueba de Boleta Shalom:** Subir ticket en PDF/imagen y verificar mapeo completo en el formulario de Shalom.

---

## 📋 4. Checklist de Entrega

- [x] Crear `lib/utils/imageCompressor.ts`
- [x] Integrar compresión en `useDniMatrixState` y `rotulos.service`
- [x] Actualizar `lib/openai/analyzer.ts` para usar OpenAI GPT-6 Luna y respuestas JSON
- [x] Configurar `OPENAI_API_KEY` y `OPENAI_MODEL` en `.env.local`
- [x] Pruebas de rendimiento y latencia final en `http://localhost:3000`
