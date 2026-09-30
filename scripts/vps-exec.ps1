param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Command
)

$baseDir = Split-Path -Parent $PSScriptRoot
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

ssh -n -o StrictHostKeyChecking=no -o ConnectTimeout=10 "root@$vpsHost" $Command
