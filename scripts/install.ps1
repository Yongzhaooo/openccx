#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Write-Host "Installing openccx..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 18+ is required. Install Node from https://nodejs.org/ and rerun this script."
    exit 1
}

$nodeVersion = & node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -lt 18) {
    Write-Error "Node.js 18+ is required. Current version: v$nodeVersion"
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is required to install the published openccx package."
    exit 1
}

Write-Host "Using Node v$nodeVersion"

# Install openccx globally
# If npm reports "install scripts blocked" for bun, rerun as:
#   npm install -g --allow-scripts=bun openccx
# (use an elevated PowerShell if the original install was elevated)
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
    $npm = Get-Command npm -ErrorAction Stop
}
& $npm.Source install -g openccx
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

$occx = Get-Command occx.cmd -ErrorAction SilentlyContinue
if (-not $occx) {
    $occx = Get-Command occx -ErrorAction SilentlyContinue
}
if (-not $occx) {
    $npmPrefix = & $npm.Source prefix -g
    Write-Error "openccx installed, but 'occx' is not on PATH. Add your npm global bin directory to PATH, then reopen PowerShell: $npmPrefix"
    exit 1
}

& $occx.Source help *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "openccx installed, but 'occx.cmd help' failed with exit code $LASTEXITCODE. Check your npm global install and PATH."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "openccx installed! Run 'occx init' to set up." -ForegroundColor Green
