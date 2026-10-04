param()

$ErrorActionPreference = "Stop"
$baseDir = Split-Path -Parent $PSScriptRoot
$processorDir = Join-Path $baseDir "worker/processor/AmexInventoryProcessor"
$envLocalPath = Join-Path $baseDir ".env.local"
$askPassPath = Join-Path $baseDir "askpass.bat"

if (-not (Test-Path $processorDir)) {
    throw "No se encontró el directorio $processorDir"
}

$vpsHost = "2.25.89.222"
$vpsPassword = $env:VPS_ROOT_PASSWORD

if (Test-Path $envLocalPath) {
    $passMatch = Select-String -Path $envLocalPath -Pattern "^VPS_ROOT_PASSWORD=(.*)$"
    if ($passMatch) {
        $vpsPassword = $passMatch.Matches[0].Groups[1].Value.Trim()
    }
    $hostMatch = Select-String -Path $envLocalPath -Pattern "^VPS_HOST=(.*)$"
    if ($hostMatch) {
        $vpsHost = $hostMatch.Matches[0].Groups[1].Value.Trim()
    }
}

if ($vpsPassword) {
    "@echo $vpsPassword" | Set-Content -Path $askPassPath -Encoding ASCII
    $env:SSH_ASKPASS = (Resolve-Path $askPassPath).Path
    $env:SSH_ASKPASS_REQUIRE = "force"
}

Write-Host "1. Preparando directorio remoto en VPS: ${vpsHost}:/tmp/build-processor..."
ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=15 "root@$vpsHost" "rm -rf /tmp/build-processor && mkdir -p /tmp/build-processor"

Write-Host "2. Subiendo código fuente C# a VPS..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$processorDir/Program.cs" "$processorDir/AmexInventoryProcessor.csproj" "root@${vpsHost}:/tmp/build-processor/"

Write-Host "3. Compilando y publicando procesador C# (.NET 8 linux-x64)..."
$buildCmd = "docker run --rm -v /tmp/build-processor:/src -w /src mcr.microsoft.com/dotnet/sdk:8.0 dotnet publish AmexInventoryProcessor.csproj -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=false -o /src/out"
ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=15 "root@$vpsHost" $buildCmd

Write-Host "4. Copiando nuevo procesador a amex-worker:/app/processor/..."
$installCmd = "docker cp /tmp/build-processor/out/. amex-worker:/app/processor/ && docker exec amex-worker chmod +x /app/processor/AmexInventoryProcessor && echo 'COMPILACION_E_INSTALACION_EXITOSA'"
ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=15 "root@$vpsHost" $installCmd

Write-Host "Procesador C# actualizado e instalado en el contenedor amex-worker."
