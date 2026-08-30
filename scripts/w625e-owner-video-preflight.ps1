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

$approvedPorts = @(8188, 8189, 8000)
$sourceRootResolved = (Resolve-Path -LiteralPath $SourceRoot).Path
New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
$evidenceRootResolved = (Resolve-Path -LiteralPath $EvidenceRoot).Path

$requiredFiles = @(
  'package.json',
  'package-lock.json',
  'assets/js/local-ai/comfyui-video-capability.js',
  'assets/js/local-ai/comfyui-video-workflow-registry.js',
  'assets/js/local-ai/comfyui-video-runtime.js',
  'assets/js/local-ai/comfyui-video-lab.js',
  'assets/js/local-ai/local-video-proof.js',
  'assets/js/local-ai/local-video-efficiency-governor.js',
  'assets/js/local-ai/local-creator-certification.js',
  'program/EONAPP_W625E_CODEX_REAL_LOCAL_AI_VIDEO_RUNBOOK_2026-07-11.md',
  'program/EONAPP_W625E_OWNER_CODEX_REAL_VIDEO_PROOF_COMMANDS_2026-07-11.md'
)

$requiredFileResults = foreach ($relative in $requiredFiles) {
  $full = Join-Path $sourceRootResolved $relative
  [pscustomobject]@{ path = $relative; exists = Test-Path -LiteralPath $full -PathType Leaf }
}

$missing = @($requiredFileResults | Where-Object { -not $_.exists })
if ($missing.Count -gt 0) {
  throw "Required W625D-H source files are missing: $($missing.path -join ', ')"
}

$endpointResults = @()
foreach ($port in $approvedPorts) {
  $endpoint = "http://127.0.0.1:$port"
  $systemStatsReached = $false
  $corsExact = $false
  $deviceCount = 0
  $errorMessage = $null
  try {
    $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 10 -Headers @{ Origin = $EonOrigin } -Uri "$endpoint/system_stats"
    $systemStatsReached = ($response.StatusCode -eq 200)
    $allowOrigin = [string]$response.Headers['Access-Control-Allow-Origin']
    $corsExact = ($allowOrigin -eq $EonOrigin)
    try {
      $stats = $response.Content | ConvertFrom-Json
      $deviceCount = @($stats.devices).Count
    } catch {
      $errorMessage = "System facts JSON could not be inspected: $($_.Exception.Message)"
    }
  } catch {
    $errorMessage = $_.Exception.Message
  }
  $endpointResults += [pscustomobject]@{
    endpoint = $endpoint
    approvedLoopback = $true
    systemStatsReached = $systemStatsReached
    exactOriginCorsAllowed = $corsExact
    reportedDeviceCount = $deviceCount
    error = $errorMessage
  }
}

$responding = @($endpointResults | Where-Object { $_.systemStatsReached })
$exactCors = @($responding | Where-Object { $_.exactOriginCorsAllowed })

$report = [ordered]@{
  schema = 'eonapp.w625e.owner-video-preflight.v1'
  recordedAt = (Get-Date).ToUniversalTime().ToString('o')
  authority = [ordered]@{
    sourceRoot = '<redacted-owner-source-root>'
    requiredFiles = $requiredFileResults
  }
  policy = [ordered]@{
    eonOrigin = $EonOrigin
    approvedHosts = @('127.0.0.1', 'localhost')
    approvedPorts = $approvedPorts
    lanOrPublicEndpointProbed = $false
    runtimeModelWorkflowOrNodeInstalled = $false
    sourceOrRuntimeMutated = $false
    imageOrVideoJobSubmitted = $false
    cloudFallbackAttempted = $false
  }
  endpoints = $endpointResults
  manualEvidenceStillRequired = [ordered]@{
    usableVramBytes = $true
    systemRamBytes = $true
    freeStorageBytes = $true
    acPowerAndThermalState = $true
    reviewedWorkflowAndModelReadiness = $true
    ownerFourGbFallback = $true
    supportedReferenceDevice = $true
  }
  summary = [ordered]@{
    respondingApprovedEndpointCount = $responding.Count
    exactOriginCorsEndpointCount = $exactCors.Count
    realVideoProofComplete = $false
    verdict = if ($exactCors.Count -gt 0) { 'preflight-ready-manual-capability-and-browser-proof-required' } else { 'preflight-blocked' }
  }
}

$outPath = Join-Path $evidenceRootResolved 'W625E_OWNER_VIDEO_PREFLIGHT.json'
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $outPath -Encoding UTF8
Write-Host "Wrote redacted preflight: $outPath"
Write-Host "Responding approved endpoints: $($responding.Count)"
Write-Host "Exact-origin CORS endpoints: $($exactCors.Count)"
Write-Host 'This preflight is read-only and cannot certify a real video.'
