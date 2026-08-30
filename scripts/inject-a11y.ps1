$mj = @('archive.html','creator-studio.html','get-free-ai-power.html','hustle.html','index.html','market.html','onboarding.html','realm.html','signal.html','team-realm.html','workbench.html')
$all = (Get-ChildItem "*.html").Name
$targets = $all | Where-Object { $_ -notin $mj }
$tag = '<script type="module" src="/assets/js/utils/accessibility-autoload.js"></script>'
$n = 0
foreach ($f in $targets) {
    $c = [System.IO.File]::ReadAllText("$PWD\$f")
    if ($c -match 'accessibility') { Write-Host "SKIP: $f"; continue }
    $c2 = $c.Replace('</body>',"$tag`n</body>")
    if ($c2 -ne $c) {
        [System.IO.File]::WriteAllText("$PWD\$f", $c2)
        $n++
        Write-Host "PATCHED: $f"
    } else {
        Write-Host "WARN no body tag: $f"
    }
}
Write-Host "Done: $n files patched"
