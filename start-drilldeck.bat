@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title DrillDeck Launcher

echo.
echo  ======================================================
echo              DRILLDECK DECISION TRAINING
echo  ======================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Install the current Node.js LTS version, restart Windows, then run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 18 (
  echo [ERROR] DrillDeck requires Node.js 18 or newer.
  echo Install the current Node.js LTS version and restart Windows.
  pause
  exit /b 1
)

call npm.cmd ls --prefix server --depth=0 >nul 2>nul
if errorlevel 1 (
  echo [1/4] Installing or repairing backend packages...
  call npm.cmd install --prefix server --no-audit --no-fund
  if errorlevel 1 goto install_error
) else (
  echo [1/4] Backend packages ready.
)

call npm.cmd ls --prefix client --depth=0 >nul 2>nul
if errorlevel 1 (
  echo [2/4] Installing or repairing frontend packages...
  call npm.cmd install --prefix client --no-audit --no-fund
  if errorlevel 1 goto install_error
) else (
  echo [2/4] Frontend packages ready.
)

echo [3/4] Running the static project check...
node scripts\verify-project.js
if errorlevel 1 goto verification_error

echo [4/4] Starting backend and frontend...

powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2; if($r.status -eq 'ok' -and $r.version -eq '5.0.0'){exit 0}else{exit 2}}catch{if(Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue){exit 2}else{exit 1}}"
if errorlevel 2 goto api_port_conflict
if errorlevel 1 (
  start "DrillDeck API" /D "%~dp0" cmd /k "npm.cmd run dev --prefix server"
) else (
  echo       Correct DrillDeck API is already running on port 5000.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try{$r=Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173' -TimeoutSec 2; if($r.StatusCode -eq 200 -and $r.Content -match 'drilldeck-version.+5.0.0'){exit 0}else{exit 2}}catch{if(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue){exit 2}else{exit 1}}"
if errorlevel 2 goto frontend_port_conflict
if errorlevel 1 (
  start "DrillDeck Client" /D "%~dp0" cmd /k "npm.cmd run dev --prefix client"
) else (
  echo       Correct DrillDeck frontend is already running on port 5173.
)

echo Waiting for both services to become ready...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$api=$false;$web=$false; for($i=0;$i -lt 60;$i++){try{$r=Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2; if($r.status -eq 'ok' -and $r.version -eq '5.0.0'){$api=$true}}catch{}; try{$w=Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:5173' -TimeoutSec 2; if($w.StatusCode -eq 200 -and $w.Content -match 'drilldeck-version.+5.0.0'){$web=$true}}catch{}; if($api -and $web){exit 0}; Start-Sleep -Seconds 1}; exit 1"
if errorlevel 1 (
  echo [WARNING] DrillDeck did not become ready within 60 seconds.
  echo Check the DrillDeck API and DrillDeck Client windows for an error message.
  pause
  exit /b 1
)

start "" http://localhost:5173
echo.
echo DrillDeck is running successfully.
echo Keep the two server windows open while using the application.
echo Run run-final-check.bat before your presentation for a full automated test.
timeout /t 3 /nobreak >nul
exit /b 0


:api_port_conflict
echo.
echo [ERROR] Port 5000 is already being used by a different or older API.
echo Close old DrillDeck API windows, then run this launcher again.
pause
exit /b 1

:frontend_port_conflict
echo.
echo [ERROR] Port 5173 is already being used by a different or older frontend.
echo Close old DrillDeck Client or Vite windows, then run this launcher again.
pause
exit /b 1

:install_error
echo.
echo [ERROR] Package installation failed.
echo Check the internet connection and read the npm error above, then run this launcher again.
echo If a partial node_modules folder was created, simply run this launcher again.
pause
exit /b 1

:verification_error
echo.
echo [ERROR] The static project check found a problem.
echo Keep this window open and read the message above.
pause
exit /b 1
