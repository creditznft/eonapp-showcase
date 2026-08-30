[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$SourceRoot,

  [Parameter(Mandatory = $true)]
  [string]$EvidenceRoot,

  [string]$EonOrigin = 'http://127.0.0.1:5173'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$expectedSourceZipSha256 = '9da1fb6dc641eb45e6890a28834fe5bc669d9571d77fad3c007d65ebe1798757'
$approvedPorts = @(8188, 8189, 8000)
$sourceRootResolved = (Resolve-Path -LiteralPath $SourceRoot).Path
New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
$evidenceRootResolved = (Resolve-Path -LiteralPath $EvidenceRoot).Path

$requiredFiles = @(
  'package.json',
  'package-lock.json',
  'assets/js/local-ai/comfyui-local-media.js',
  'assets/js/local-ai/comfyui-image-lab.js',
  'assets/js/local-ai/comfyui-image-workflow-registry.js',
  'assets/js/local-ai/local-image-proof.js',
  'program/EONAPP_W625A_OWNER_CODEX_REAL_COMFY_PROOF_COMMANDS_2026-07-11.md'
)

$requiredFileResults = foreach ($relative in $requiredFiles) {
  $full = Join-Path $sourceRootResolved $relative
  [pscustomobject]@{
    path = $relative
    exists = Test-Path -LiteralPath $full -PathType Leaf
  }
}

$missing = @($requiredFileResults | Where-Object { -not $_.exists })
if ($missing.Count -gt 0) {
  throw "Required W624L/W625A files are missing: $($missing.path -join ', ')"
}

$endpointResults = @()
foreach ($port in $approvedPorts) {
  $endpoint = "http://127.0.0.1:$port"
  $systemStatsReached = $false
  $corsExact = $false
  $checkpointCount = 0
  $errorMessage = $null

  try {
    $statsResponse = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Headers @{ Origin = $EonOrigin } -Uri "$endpoint/system_stats"
    $systemStatsReached = ($statsResponse.StatusCode -eq 200)
    $allowOrigin = [string]$statsResponse.Headers['Access-Control-Allow-Origin']
    $corsExact = ($allowOrigin -eq $EonOrigin)

    try {
      $checkpointInfo = Invoke-RestMethod -TimeoutSec 15 -Headers @{ Origin = $EonOrigin } -Uri "$endpoint/object_info/CheckpointLoaderSimple"
      $values = @($checkpointInfo.CheckpointLoaderSimple.input.required.ckpt_name[0])
      $checkpointCount = $values.Count
    } catch {
      $errorMessage = "Checkpoint discovery failed: $($_.Exception.Message)"
    }
  } catch {
    $errorMessage = $_.Exception.Message
  }

  $endpointResults += [pscustomobject]@{
    endpoint = $endpoint
    approvedLoopback = $true
    systemStatsReached = $systemStatsReached
    exactOriginCorsAllowed = $corsExact
    checkpointCount = $checkpointCount
    error = $errorMessage
  }
}

$responding = @($endpointResults | Where-Object { $_.systemStatsReached })
$ready = @($responding | Where-Object { $_.exactOriginCorsAllowed -and $_.checkpointCount -gt 0 })

$report = [ordered]@{
  schema = 'eonapp.w625a.owner-runtime-preflight.v1'
  recordedAt = (Get-Date).ToUniversalTime().ToString('o')
  authority = [ordered]@{
    expectedSourceArchiveSha256 = $expectedSourceZipSha256
    sourceRoot = '<redacted-owner-source-root>'
    requiredFiles = $requiredFileResults
  }
  policy = [ordered]@{
    eonOrigin = $EonOrigin
    approvedHosts = @('127.0.0.1', 'localhost')
    approvedPorts = $approvedPorts
    lanOrPublicEndpointProbed = $false
    runtimeOrModelInstalled = $false
    sourceOrRuntimeMutated = $false
    localVideoAttempted = $false
  }
  endpoints = $endpointResults
  summary = [ordered]@{
    respondingApprovedEndpointCount = $responding.Count
    exactCorsAndCheckpointReadyEndpointCount = $ready.Count
    browserGenerationProofComplete = $false
    verdict = if ($ready.Count -gt 0) { 'preflight-ready-browser-proof-required' } else { 'preflight-blocked' }
  }
}

$outPath = Join-Path $evidenceRootResolved 'W625A_OWNER_RUNTIME_PREFLIGHT.json'
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $outPath -Encoding UTF8
Write-Host "Wrote redacted preflight: $outPath"
Write-Host "Responding approved endpoints: $($responding.Count)"
Write-Host "Exact-CORS + checkpoint-ready endpoints: $($ready.Count)"
Write-Host 'This preflight is read-only and is not real image proof.'
