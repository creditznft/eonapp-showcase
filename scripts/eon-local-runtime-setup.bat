@echo off
REM EONAPP Local Runtime Manager - Windows Auto-Installer
REM Downloads and installs everything needed for local AI models
REM No command line knowledge required!

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  EONAPP Local Runtime Auto-Setup              ║
echo ║  Windows Edition                              ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Check if running as admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  This installer needs Admin privileges
    echo.
    echo Please right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo 🔍 Checking your system...
echo.

REM Get system info
for /f "tokens=1,2" %%A in ('tasklist /FI "IMAGENAME eq Ollama.exe" /V /FO LIST') do set OLLAMA_CHECK=%%B
for /f "tokens=* delims=" %%A in ('powershell -Command "[math]::Round((Get-Volume -DriveLetter C).SizeRemaining / 1GB)"') do set FREE_SPACE=%%A

echo   CPU: %PROCESSOR_IDENTIFIER%
echo   RAM: %TOTAL_PHYSICAL_MEMORY% MB
echo   Free Disk Space: %FREE_SPACE% GB
echo.

if exist "C:\Users\%USERNAME%\AppData\Local\Ollama\ollama.exe" (
    echo ✅ Ollama already installed
) else (
    echo 📥 Ollama not found - will download
)

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  STEP 1: Download Ollama                      ║
echo ╚════════════════════════════════════════════════╝
echo.
echo Downloading Ollama setup (~200 MB)...
echo This may take 2-5 minutes depending on your internet speed
echo.

REM Download Ollama
powershell -Command "& {
    $url = 'https://ollama.ai/download/OllamaSetup.exe'
    $output = 'C:\Users\%USERNAME%\Downloads\OllamaSetup.exe'
    
    try {
        Write-Host '⏳ Starting download...'
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
        $client = New-Object System.Net.WebClient
        $client.DownloadFile($url, $output)
        Write-Host '✅ Download complete: ' $output
    } catch {
        Write-Host '❌ Download failed: ' $_
        exit 1
    }
}"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Download failed. Please try again or visit: https://ollama.ai/download
    echo.
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  STEP 2: Install Ollama                       ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 👉 Starting Ollama installer...
echo When prompted, click "Install" and follow on-screen steps
echo.
pause

REM Run Ollama installer
start "" "C:\Users\%USERNAME%\Downloads\OllamaSetup.exe"

REM Wait for installation
echo ⏳ Waiting for installation to complete...
echo (This may take 2-3 minutes)
echo.

setlocal enabledelayedexpansion
set /A timeout=0
:wait_for_ollama
timeout /t 5 /nobreak
set /A timeout=!timeout!+1
tasklist /FI "IMAGENAME eq OllamaSetup.exe" /FO CSV | find /I "OllamaSetup" >nul
if errorlevel 1 (
    echo.
    echo ✅ Installation complete!
) else (
    if !timeout! gtr 60 (
        echo ⚠️  Installation taking longer than expected
    )
    goto wait_for_ollama
)

echo.
echo ╔════════════════════════════════════════════════╗
echo ║  STEP 3: Download First Model                 ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Wait for Ollama service to be ready
echo ⏳ Initializing Ollama service... (may take 30 seconds)
timeout /t 10 /nobreak

echo.
echo Which model would you like?
echo.
echo [1] Mistral 7B (RECOMMENDED - fastest, 4.1 GB)
echo [2] Neural-Chat 7B (balanced, 4.7 GB)
echo [3] Zephyr 7B (code-focused, 4.2 GB)
echo [4] Skip (download later)
echo.

set /P MODEL_CHOICE="Choose (1-4): "

if "%MODEL_CHOICE%"=="1" (
    set MODEL_NAME=mistral
    set MODEL_DISPLAY=Mistral 7B
) else if "%MODEL_CHOICE%"=="2" (
    set MODEL_NAME=neural-chat
    set MODEL_DISPLAY=Neural-Chat 7B
) else if "%MODEL_CHOICE%"=="3" (
    set MODEL_NAME=zephyr
    set MODEL_DISPLAY=Zephyr 7B
) else (
    echo ⏭️  Skipping model download
    goto final_setup
)

echo.
echo 📥 Downloading %MODEL_DISPLAY%...
echo This may take 5-15 minutes
echo Your internet speed affects download time
echo.
echo You can minimize this window and use your computer while downloading
echo.

REM Download model via Ollama
start "Ollama Model Download" cmd /c "ollama pull %MODEL_NAME% && echo. && echo ✅ Download complete! && pause"

:final_setup
echo.
echo ╔════════════════════════════════════════════════╗
echo ║  Setup Complete!                              ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 🎉 Your local AI runtime is ready!
echo.
echo Next steps:
echo   1. Open EONAPP: https://eonapp.ch/creator-studio.html
echo   2. Go to Creator Studio
echo   3. Look for the "Local Provider" option
echo   4. Start creating with your local model!
echo.
echo 💡 Tips:
echo   • Keep Ollama running in background
echo   • Server starts automatically on reboot
echo   • Can download more models anytime
echo.
echo 📚 Learn more: https://eonapp.ch/docs/local-models
echo.
pause
