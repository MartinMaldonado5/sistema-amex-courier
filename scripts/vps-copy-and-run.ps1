param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$LocalFile,
    [Parameter(Mandatory=$false, Position=1)]
    [string]$RemoteCommand = "node /tmp/test-bench-tib.js"
)

$ErrorActionPreference = "Stop"
$baseDir = Split-Path -Parent $PSScriptRoot
$resolvedPath = Join-Path $baseDir $LocalFile
$envLocalPath = Join-Path $baseDir ".env.local"
$askPassPath = Join-Path $baseDir "askpass.bat"

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

$fileName = Split-Path $resolvedPath -Leaf
Write-Host "Copiando $fileName a ${vpsHost}:/tmp/$fileName ..."
scp -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$resolvedPath" "root@${vpsHost}:/tmp/$fileName"

Write-Host "Copiando al contenedor amex-worker..."
$cmd = "docker cp /tmp/$fileName amex-worker:/tmp/$fileName && rm -f /tmp/$fileName && docker exec amex-worker $RemoteCommand"
ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=30 "root@$vpsHost" $cmd
