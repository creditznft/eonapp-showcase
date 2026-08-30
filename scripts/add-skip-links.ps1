# Injects skip link and, where missing, a main landmark into HTML pages
# Run from EONAPP.CH root

$skipTag = '<a href="#main" class="skip-to-content" style="position:absolute;top:-40px;left:0;z-index:10000;padding:.5rem 1rem;background:#6366f1;color:#fff;font-weight:700;border-radius:0 0 .5rem 0;transition:top .15s;text-decoration:none" onfocus="this.style.top=''0''" onblur="this.style.top=''-40px''">Skip to main content</a>'

# Pages with skip link missing (have main)
$needSkipOnly = @('admin.html','games.html','reward-access.html','tools.html','onboarding.html')

# Pages missing both skip link + main landmark
$needBoth = @('campaign-admin.html','kpi-dashboard.html','kpi-token-dashboard.html','live-trading-dashboard.html')

function AddSkipLink($file) {
    $c = [System.IO.File]::ReadAllText("$PWD\$file")
    if ($c -match 'skip-to-content|eon-skip') { Write-Host "SKIP-ALREADY: $file"; return }
    # inject after <body or <body>
    $c2 = $c -replace '(<body[^>]*>)', "`$1`n$skipTag"
    if ($c2 -ne $c) {
        [System.IO.File]::WriteAllText("$PWD\$file", $c2)
        Write-Host "SKIP-ADDED: $file"
    } else {
        Write-Host "WARN no body: $file"
    }
}

function AddSkipLinkAndMain($file) {
    $c = [System.IO.File]::ReadAllText("$PWD\$file")
    if ($c -match 'skip-to-content|eon-skip') { Write-Host "SKIP-ALREADY: $file"; return }
    # Inject skip link after <body>
    $c2 = $c -replace '(<body[^>]*>)', "`$1`n$skipTag"
    # Add id="main" to first <div class="container"> or first large div
    # Try to find a suitable main content wrapper
    if ($c2 -match 'id="main"') {
        Write-Host "MAIN-ALREADY: $file"
    } elseif ($c2 -match '<div class="container"') {
        $c2 = $c2 -replace '<div class="container"', '<main id="main" class="container"', 1
        # close the main tag before </body>
        $c2 = $c2 -replace '(</body>)', "</main>`n`$1", 1
        Write-Host "MAIN-WRAPPED: $file"
    } elseif ($c2 -match '<div id="app"') {
        $c2 = $c2 -replace '<div id="app"', '<main id="main" class="app-root"'
        Write-Host "MAIN-WRAPPED-APP: $file"
    } else {
        # fallback: inject id="main" on first <section or first <div after header
        $c2 = $c2 -replace '(<div)', '<div id="main"', 1
        Write-Host "MAIN-DIV-ADDED: $file"
    }
    [System.IO.File]::WriteAllText("$PWD\$file", $c2)
    Write-Host "DONE: $file"
}

foreach ($f in $needSkipOnly) { AddSkipLink $f }
foreach ($f in $needBoth) { AddSkipLinkAndMain $f }

Write-Host "`nAll done."
