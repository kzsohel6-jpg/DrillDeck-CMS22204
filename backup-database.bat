@echo off
setlocal
cd /d "%~dp0"

if not exist "server\database\drilldeck-final.sqlite" (
  echo No DrillDeck database exists yet. Run the application and save some activity first.
  pause
  exit /b 0
)

if not exist "server\database\backups" mkdir "server\database\backups"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; Copy-Item 'server\database\drilldeck-final.sqlite' ('server\database\backups\drilldeck-'+$stamp+'.sqlite'); Write-Host ('Backup created: server\database\backups\drilldeck-'+$stamp+'.sqlite')"
pause
