param(
    [string]$WorkerPath = "worker/worker.js"
)

$ErrorActionPreference = "Stop"
$baseDir = Split-Path -Parent $PSScriptRoot
$resolvedWorkerPath = Join-Path $baseDir $WorkerPath
$envLocalPath = Join-Path $baseDir ".env.local"
$askPassPath = Join-Path $baseDir "askpass.bat"

if (-not (Test-Path $resolvedWorkerPath)) {
    throw "No se encontró el archivo $resolvedWorkerPath"
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

Write-Host "Copiando worker.js a ${vpsHost}:/tmp/worker.js vía scp..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$resolvedWorkerPath" "root@${vpsHost}:/tmp/worker.js"

Write-Host "Actualizando contenedor Docker amex-worker..."
$cmd = "docker cp /tmp/worker.js amex-worker:/app/worker/worker.js && rm -f /tmp/worker.js && docker restart amex-worker && echo SUCCESS_WORKER_RESTARTED"
ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=15 "root@$vpsHost" $cmd
