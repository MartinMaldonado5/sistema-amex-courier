# ---- Etapa 1: compilar el procesador C# para linux-x64 ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dotnet-build
WORKDIR /src
COPY processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj ./processor/AmexInventoryProcessor/
RUN dotnet restore ./processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj -r linux-x64
COPY processor/AmexInventoryProcessor/ ./processor/AmexInventoryProcessor/
RUN dotnet publish ./processor/AmexInventoryProcessor/AmexInventoryProcessor.csproj \
    -c Release -r linux-x64 --self-contained true \
    -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true \
    -o /out/processor

# ---- Etapa 2: runtime Node + binario C# ----
FROM node:20-bookworm-slim
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=256
WORKDIR /app
COPY --from=dotnet-build /out/processor /app/processor
RUN chmod +x /app/processor/AmexInventoryProcessor
COPY worker/package.json ./worker/package.json
RUN cd worker && npm install --omit=dev --no-audit --no-fund
COPY worker/worker.js ./worker/worker.js
COPY assets/FUENTE_VACIA.xlsx ./assets/FUENTE_VACIA.xlsx
ENV PROCESSOR=/app/processor/AmexInventoryProcessor
ENV EMPTY_TEMPLATE=/app/assets/FUENTE_VACIA.xlsx
ENV WORK_DIR=/tmp/amex-jobs
EXPOSE 10000
CMD ["node", "worker/worker.js"]
