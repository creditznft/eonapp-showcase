@echo off
echo =============================================
echo  EONAPP.ch - Git Setup + Push to GitHub
echo =============================================
echo.

cd /d "%~dp0"

REM Initialize if needed
if not exist ".git" (
  echo Initializing git repository...
  git init
  git branch -M main
)

REM Set username
git config --global user.name "creditznft"
echo Git username: creditznft

REM Check email
for /f "delims=" %%i in ('git config --global user.email 2^>nul') do set GITEMAIL=%%i
if "%GITEMAIL%"=="" (
  echo.
  echo ERROR: Git email not configured on this machine.
  echo Run this command first, then re-run this script:
  echo.
  echo   git config --global user.email "your@email.com"
  echo.
  echo Tip: use the email linked to your GitHub account
  echo      or creditznft@users.noreply.github.com
  echo.
  pause
  exit /b 1
)
echo Git email: %GITEMAIL%

REM Set/update remote
git remote remove origin 2>nul
git remote add origin https://github.com/creditznft/EONAPP.git
echo Remote: https://github.com/creditznft/EONAPP.git

echo.
echo Staging all changes...
git add -A

REM Check if anything to commit
git diff --cached --quiet
if %ERRORLEVEL% == 0 (
  echo Nothing new to commit. Pushing existing commits...
) else (
  echo Creating commit...
  git commit -m "Session 3: Flagship tools, P2P Nostr, SW v16, app-data hardening"
)

echo.
echo Pushing to GitHub...
echo (If prompted for credentials: username=creditznft, password=YOUR_GITHUB_PAT_TOKEN)
echo (Get PAT: GitHub.com - Settings - Developer Settings - Personal Access Tokens - Tokens Classic)
echo.
git push -u origin main

if %ERRORLEVEL% == 0 (
  echo.
  echo ============================================
  echo  SUCCESS! Pushed to GitHub.
  echo  Cloudflare Pages will auto-deploy from main.
  echo  Live at: https://eonapp.ch
  echo ============================================
) else (
  echo.
  echo ============================================
  echo  PUSH FAILED. Common fixes:
  echo  1. Auth error: use Personal Access Token as password
  echo     GitHub.com - Settings - Dev Settings - PAT Classic - New token (repo scope)
  echo  2. Branch mismatch: try "git push -u origin master" if "main" fails
  echo  3. Conflicts: git pull origin main --allow-unrelated-histories
  echo ============================================
)

pause
