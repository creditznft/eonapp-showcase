@echo off
setlocal
cd /d "%~dp0\..\.."
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required for this developer-preview bridge.
  echo A signed one-click desktop installer should replace this launcher before public release.
  pause
  exit /b 1
)
node tools\eon-local-bridge\server.mjs
pause
