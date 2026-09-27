# Worker Inventario AMEX — Dockerfile en la raíz del repo porque la API de
# Render solo acepta ./Dockerfile con contexto raíz en el plan Free.
# El contexto de build es el repo clonado (solo archivos de git).

# ---- Etapa 1: compilar el procesador C# para linux-x64 ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dotnet-build
WORKDIR /src
COPY Automatizador_Inventario_AMEX_WhatsApp/processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj ./processor/AmexInventoryProcessor/
RUN dotnet restore ./processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj -r linux-x64
COPY Automatizador_Inventario_AMEX_WhatsApp/processor/AmexInventoryProcessor/ ./processor/AmexInventoryProcessor/
RUN dotnet publish ./processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj \
    -c Release -r linux-x64 --self-contained true \
    -p:PublishSingleFile=false \
    -o /out/processor

# ---- Etapa 2: runtime Node + binario C# ----
FROM node:20-bookworm-slim
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=256
# Limitar memoria del runtime .NET para sobrevivir en 512 MB (plan Free)
ENV DOTNET_gcServer=0
ENV DOTNET_GCHeapHardLimit=C800000
ENV DOTNET_EnableDiagnostics=0
WORKDIR /app
COPY --from=dotnet-build /out/processor /app/processor
RUN chmod +x /app/processor/AmexInventoryProcessor
COPY Automatizador_Inventario_AMEX_WhatsApp/worker/package.json ./worker/package.json
RUN cd worker && npm install --omit=dev --no-audit --no-fund
COPY Automatizador_Inventario_AMEX_WhatsApp/worker/worker.js ./worker/worker.js
COPY Automatizador_Inventario_AMEX_WhatsApp/assets/FUENTE_VACIA.xlsx ./assets/FUENTE_VACIA.xlsx
ENV PROCESSOR=/app/processor/AmexInventoryProcessor
ENV EMPTY_TEMPLATE=/app/assets/FUENTE_VACIA.xlsx
ENV WORK_DIR=/tmp/amex-jobs
EXPOSE 10000
CMD ["node", "worker/worker.js"]
