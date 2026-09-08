$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$manifest = Get-Content -Raw (Join-Path $projectRoot 'module.json') | ConvertFrom-Json
$stage = Join-Path $projectRoot ("artifacts\BDVM.Management-{0}" -f $manifest.version)
dotnet build (Join-Path $projectRoot 'BDVM.Management.csproj') -c Release
node --test (Join-Path $projectRoot 'tests\management.test.cjs')
New-Item -ItemType Directory -Force $stage | Out-Null
Copy-Item -Force (Join-Path $projectRoot 'bin\Release\net48\BDVM.Management.dll'), (Join-Path $projectRoot 'module.json'), (Join-Path $projectRoot 'README.md'), (Join-Path $projectRoot 'LICENSE') $stage
Copy-Item -Recurse -Force (Join-Path $projectRoot 'Assets') $stage
Compress-Archive -Force (Join-Path $stage '*') ("$stage.zip")
Write-Output ("Packaged {0}" -f "$stage.zip")
