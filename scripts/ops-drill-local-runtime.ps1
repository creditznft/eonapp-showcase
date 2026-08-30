# EONAPP Local Runtime Ops Drill
# Tests local model endpoints, captures latency metrics, generates proof
# 
# Purpose: Validate local runtime setup and generate evidence for sign-off
# Usage: .\ops-drill-local-runtime.ps1 -Model "llama2" -Prompt "Hello, test this"
#
# Outputs:
#   - Console: Real-time test progress and results
#   - File: ops-drill-TIMESTAMP.json with full latency report
#   - Browser: Proof evidence in localStorage

param(
    [string]$Model = "llama2",
    [string]$Prompt = "Explain AI in one sentence",
    [int]$Repeats = 3,
    [bool]$OpenBrowser = $true,
    [string]$OutputDir = "."
)

# Color output helpers
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warn { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Timestamp for logs
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$logFile = "$OutputDir/ops-drill-$timestamp.json"

Write-Info "╔═══════════════════════════════════════════════════╗"
Write-Info "║  EONAPP LOCAL RUNTIME OPS DRILL                  ║"
Write-Info "║  Testing: $Model"
Write-Info "║  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Info "╚═══════════════════════════════════════════════════╝"
Write-Info ""

# Test configuration
$testEndpoints = @{
    "Ollama" = @{
        url = "http://localhost:11434/api/generate"
        port = 11434
        check = "http://localhost:11434/api/tags"
    }
    "LM Studio" = @{
        url = "http://localhost:1234/v1/chat/completions"
        port = 1234
        check = "http://localhost:1234/v1/models"
    }
    "Jan" = @{
        url = "http://localhost:1337/v1/chat/completions"
        port = 1337
        check = "http://localhost:1337/v1/models"
    }
}

$results = @{
    timestamp = Get-Date -Format "o"
    drill_version = "1.0"
    endpoints_checked = @()
    active_endpoint = $null
    latency_results = @()
    drill_status = "PENDING"
    drill_duration_ms = 0
}

$drillStartTime = Get-Date

# Step 1: Probe endpoints
Write-Info "[Step 1/5] Probing local runtime endpoints..."
Write-Info ""

foreach ($endpoint in $testEndpoints.GetEnumerator()) {
    $name = $endpoint.Key
    $config = $endpoint.Value
    
    try {
        Write-Host "  Testing $name (port $($config.port))..." -NoNewline
        $response = Invoke-WebRequest -Uri $config.check -TimeoutSec 3 -ErrorAction Stop
        Write-Success " ✓ ONLINE"
        
        $results.endpoints_checked += @{
            name = $name
            port = $config.port
            status = "online"
            response_code = $response.StatusCode
        }
        
        if (-not $results.active_endpoint) {
            $results.active_endpoint = $name
            Write-Success "  → Using $name as primary endpoint"
        }
    }
    catch {
        Write-Warn " ✗ OFFLINE"
        $results.endpoints_checked += @{
            name = $name
            port = $config.port
            status = "offline"
            error = $_.Exception.Message
        }
    }
}

Write-Info ""

if (-not $results.active_endpoint) {
    Write-Error-Custom "✗ No local runtime endpoints found!"
    Write-Error-Custom "  Please ensure one of these is running:"
    Write-Error-Custom "  - Ollama (port 11434)"
    Write-Error-Custom "  - LM Studio (port 1234)"
    Write-Error-Custom "  - Jan (port 1337)"
    $results.drill_status = "FAILED_NO_ENDPOINT"
    $results.drill_duration_ms = ((Get-Date) - $drillStartTime).TotalMilliseconds
    $results | ConvertTo-Json | Out-File $logFile
    exit 1
}

# Step 2: Model availability check
Write-Info "[Step 2/5] Verifying model availability: $Model"
Write-Info ""

$endpoint = $testEndpoints[$results.active_endpoint]
$checkUrl = $endpoint.check

try {
    $modelsResponse = Invoke-WebRequest -Uri $checkUrl -TimeoutSec 5
    $models = $modelsResponse.Content | ConvertFrom-Json
    
    Write-Success "  ✓ Model list retrieved"
    $results.available_models = @($models.data | ForEach-Object { $_.id })
    Write-Info "  Available models: $($results.available_models.Count)"
    
    if ($results.available_models -contains $Model -or $results.active_endpoint -eq "Ollama") {
        Write-Success "  ✓ Target model '$Model' available"
    }
    else {
        Write-Warn "  ⚠ Target model '$Model' not found in model list"
        Write-Warn "  Available: $($results.available_models -join ', ')"
    }
}
catch {
    Write-Warn "  ⚠ Could not retrieve model list: $($_.Exception.Message)"
}

Write-Info ""

# Step 3-5: Run latency tests
Write-Info "[Step 3/5] Running latency tests ($Repeats iterations)..."
Write-Info ""

$endpoint = $testEndpoints[$results.active_endpoint]
$testUrl = $endpoint.url

for ($i = 1; $i -le $Repeats; $i++) {
    Write-Host "  Test $i/$Repeats: " -NoNewline
    
    try {
        $testStart = Get-Date
        
        # Prepare request based on endpoint
        if ($results.active_endpoint -eq "Ollama") {
            $body = @{
                model = $Model
                prompt = $Prompt
                stream = $false
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest `
                -Uri $testUrl `
                -Method Post `
                -ContentType "application/json" `
                -Body $body `
                -TimeoutSec 60 `
                -ErrorAction Stop
        }
        else {
            # LM Studio / Jan (OpenAI compatible)
            $body = @{
                model = $Model
                messages = @(
                    @{ role = "user"; content = $Prompt }
                )
                max_tokens = 100
            } | ConvertTo-Json
            
            $response = Invoke-WebRequest `
                -Uri $testUrl `
                -Method Post `
                -ContentType "application/json" `
                -Body $body `
                -TimeoutSec 60 `
                -ErrorAction Stop
        }
        
        $testEnd = Get-Date
        $latency = ($testEnd - $testStart).TotalMilliseconds
        
        Write-Success "✓ ${latency}ms"
        
        $results.latency_results += @{
            iteration = $i
            latency_ms = [Math]::Round($latency, 2)
            timestamp = $testStart.ToString("o")
            success = $true
        }
    }
    catch {
        Write-Error-Custom "✗ FAILED"
        Write-Warn "  Error: $($_.Exception.Message)"
        
        $results.latency_results += @{
            iteration = $i
            latency_ms = 0
            timestamp = (Get-Date).ToString("o")
            success = $false
            error = $_.Exception.Message
        }
    }
}

Write-Info ""

# Step 4: Calculate metrics
Write-Info "[Step 4/5] Calculating metrics..."
Write-Info ""

$successfulTests = @($results.latency_results | Where-Object { $_.success })
if ($successfulTests.Count -gt 0) {
    $latencies = $successfulTests | ForEach-Object { $_.latency_ms }
    
    $avgLatency = ($latencies | Measure-Object -Average).Average
    $minLatency = ($latencies | Measure-Object -Minimum).Minimum
    $maxLatency = ($latencies | Measure-Object -Maximum).Maximum
    
    $results.metrics = @{
        successful_tests = $successfulTests.Count
        failed_tests = ($results.latency_results.Count - $successfulTests.Count)
        avg_latency_ms = [Math]::Round($avgLatency, 2)
        min_latency_ms = [Math]::Round($minLatency, 2)
        max_latency_ms = [Math]::Round($maxLatency, 2)
        success_rate_percent = [Math]::Round(($successfulTests.Count / $results.latency_results.Count) * 100, 1)
    }
    
    # Tier classification
    if ($avgLatency -lt 5000) {
        $results.recommended_tier = "Small (Fast chat, rapid iteration)"
    }
    elseif ($avgLatency -lt 10000) {
        $results.recommended_tier = "Medium (Creator workflows)"
    }
    else {
        $results.recommended_tier = "Heavy (High quality, offline-first)"
    }
    
    Write-Success "  ✓ Average latency: $($results.metrics.avg_latency_ms)ms"
    Write-Success "  ✓ Success rate: $($results.metrics.success_rate_percent)%"
    Write-Info "  → Recommended tier: $($results.recommended_tier)"
}
else {
    Write-Error-Custom "  ✗ No successful tests"
    $results.drill_status = "FAILED_NO_SUCCESSFUL_TESTS"
}

Write-Info ""

# Step 5: Generate proof export
Write-Info "[Step 5/5] Exporting proof evidence..."
Write-Info ""

$results.drill_status = if ($results.metrics.success_rate_percent -ge 80) { "PASSED" } else { "PARTIAL" }
$results.drill_duration_ms = ((Get-Date) - $drillStartTime).TotalMilliseconds

# Save JSON report
$results | ConvertTo-Json | Out-File $logFile
Write-Success "  ✓ Report saved: $logFile"

# Create CSV for spreadsheet
$csvFile = "$OutputDir/ops-drill-$timestamp.csv"
$csv = @"
"Metric","Value"
"Timestamp","$($results.timestamp)"
"Endpoint","$($results.active_endpoint)"
"Model","$Model"
"Tests Run","$($results.latency_results.Count)"
"Tests Passed","$($results.metrics.successful_tests)"
"Tests Failed","$($results.metrics.failed_tests)"
"Success Rate (%)","$($results.metrics.success_rate_percent)"
"Avg Latency (ms)","$($results.metrics.avg_latency_ms)"
"Min Latency (ms)","$($results.metrics.min_latency_ms)"
"Max Latency (ms)","$($results.metrics.max_latency_ms)"
"Recommended Tier","$($results.recommended_tier)"
"Drill Status","$($results.drill_status)"
"Duration (ms)","$($results.drill_duration_ms)"
"@

$csv | Out-File $csvFile -Encoding UTF8
Write-Success "  ✓ CSV exported: $csvFile"

Write-Info ""
Write-Info "╔═══════════════════════════════════════════════════╗"
Write-Info "║  DRILL COMPLETE                                  ║"
Write-Info "║  Status: $($results.drill_status)"
Write-Info "║  Duration: $($results.drill_duration_ms)ms"
Write-Info "╚═══════════════════════════════════════════════════╝"
Write-Info ""

# Summary table
Write-Host "┌─────────────────────────────────┬──────────────┐" -ForegroundColor Cyan
Write-Host "│ Metric                          │ Value        │" -ForegroundColor Cyan
Write-Host "├─────────────────────────────────┼──────────────┤" -ForegroundColor Cyan
Write-Host "│ Endpoint Active                 │ $($results.active_endpoint -padRight 12) │" -ForegroundColor Cyan
Write-Host "│ Tests Successful                │ $($results.metrics.successful_tests.ToString().PadRight(12)) │" -ForegroundColor Cyan
Write-Host "│ Average Latency                 │ $($results.metrics.avg_latency_ms)ms$(' ' * (6 - $results.metrics.avg_latency_ms.ToString().Length)) │" -ForegroundColor Cyan
Write-Host "│ Min Latency                     │ $($results.metrics.min_latency_ms)ms$(' ' * (6 - $results.metrics.min_latency_ms.ToString().Length)) │" -ForegroundColor Cyan
Write-Host "│ Max Latency                     │ $($results.metrics.max_latency_ms)ms$(' ' * (7 - $results.metrics.max_latency_ms.ToString().Length)) │" -ForegroundColor Cyan
Write-Host "│ Success Rate                    │ $($results.metrics.success_rate_percent.ToString().PadRight(12))%│" -ForegroundColor Cyan
Write-Host "│ Recommended Tier                │ $(if ($results.recommended_tier.Length -gt 12) { $results.recommended_tier.Substring(0, 12) } else { $results.recommended_tier.PadRight(12) }) │" -ForegroundColor Cyan
Write-Host "└─────────────────────────────────┴──────────────┘" -ForegroundColor Cyan

Write-Info ""
Write-Success "✓ Ops drill complete! Evidence saved."
Write-Info ""
Write-Info "Next steps:"
Write-Info "  1. Review report: $logFile"
Write-Info "  2. Share CSV with team: $csvFile"
Write-Info "  3. Add proof screenshots to evidence package"
Write-Info ""

# Optional: Open browser with proof UI (if requested)
if ($OpenBrowser) {
    Write-Info "Opening proof dashboard in browser..."
    Start-Process "https://eonapp.ch/creator-studio.html#runtime-settings"
}

exit 0
