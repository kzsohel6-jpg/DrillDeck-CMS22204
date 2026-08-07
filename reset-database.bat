@echo off
setlocal
cd /d "%~dp0"
echo.
echo Close the DrillDeck API and Client windows first.
echo This resets local DrillDeck accounts, attempts and scenario records.
echo The complete scenario library will be recreated at the next start.
echo.
choice /C YN /M "Continue"
if errorlevel 2 exit /b 0
if exist "server\database\drilldeck-final.sqlite" del /Q "server\database\drilldeck-final.sqlite"
echo Database reset successfully.
pause
