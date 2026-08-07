@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title DrillDeck Final Live Check

echo.
echo  ======================================================
echo             DRILLDECK FINAL LIVE CHECK
echo  ======================================================
echo.
echo Make sure start-drilldeck.bat is already running.
echo This check compiles the frontend, tests the API and creates temporary data.
echo All temporary records are removed at the end.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found.
  pause
  exit /b 1
)

echo [1/3] Static verification...
node scripts\verify-project.js
if errorlevel 1 goto failed

echo.
echo [2/3] Production frontend build...
call npm.cmd run build --prefix client
if errorlevel 1 goto failed

echo.
echo [3/3] Live frontend, API, admin and SQL persistence test...
node scripts\live-smoke-test.js
if errorlevel 1 goto failed

echo.
echo [SUCCESS] Every final automated check passed.
echo Take a screenshot of this window as testing evidence.
pause
exit /b 0

:failed
echo.
echo [FAILED] Read the error above. Keep this window open and take a screenshot.
pause
exit /b 1
