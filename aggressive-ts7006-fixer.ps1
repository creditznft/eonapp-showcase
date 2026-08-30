# Aggressive TS7006 Fixer - Bulk Replace Function Parameters
# This script finds all function parameters without type annotations and generates replacements

$files = @(
    'assets/js/creator-studio-page.js',
    'assets/js/utils/social-publisher.js',
    'assets/js/utils/p2p-nostr.js',
    'assets/js/games/voice-synthesis.js',
    'assets/js/utils/iot-control-hub.js',
    'assets/js/utils/eon-browser.js'
)

$totalReplacements = 0
$replacements = @()

foreach ($file in $files) {
    if (!(Test-Path $file)) { continue }
    
    $content = Get-Content $file -Raw
    
    # Find all function declarations with parameters
    # Pattern: function NAME(param1, param2, ...) 
    $fnPattern = 'function\s+(\w+)\s*\(\s*([^)]+)\s*\)'
    $matches = [regex]::Matches($content, $fnPattern)
    
    foreach ($match in $matches) {
        $fnName = $match.Groups[1].Value
        $params = $match.Groups[2].Value
        
        # Skip if already has @type
        if ($params -match '@type') { continue }
        
        # Parse individual parameters
        $paramList = $params -split ',' | ForEach-Object { 
            $p = $_.Trim()
            if ($p -and $p -notmatch '@type') {
                # Extract just the param name (handle defaults like param = value)
                $p -replace '\s*=.*', ''
            }
        }
        
        if ($paramList.Count -gt 0) {
            $originalLine = $match.Value
            
            # Create annotated version
            $annotatedParams = @()
            $paramList | ForEach-Object { 
                if ($_) {
                    $annotatedParams += "/** @type {any} */ $_"
                }
            }
            $annotatedLine = "function $fnName(" + ($annotatedParams -join ', ') + ")"
            
            # Add to replacements list
            $replacements += @{
                File = $file
                Original = $originalLine
                Annotated = $annotatedLine
            }
            
            Write-Output "[TS7006] $file : $fnName($($annotatedParams -join ', '))"
            $totalReplacements++
        }
    }
}

Write-Output "`n=== SUMMARY ==="
Write-Output "Total function parameters found: $totalReplacements"
Write-Output "Files targeted: $($files.Count)"
Write-Output ""
Write-Output "=== REPLACEMENT OBJECTS FOR multi_replace_string_in_file ==="
Write-Output ""

# Generate JSON-compatible replacement array
$jsonReplacements = @()
foreach ($r in $replacements) {
    $jsonReplacements += @{
        filePath = $r.File
        oldString = $r.Original
        newString = $r.Annotated
    }
}

# Output as compact JSON
$jsonReplacements | ConvertTo-Json -Depth 1 | Write-Output
