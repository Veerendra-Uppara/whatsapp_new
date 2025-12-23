@echo off
echo.
echo === Starting Chat Application ===
echo.

REM Check if PowerShell is available
powershell -ExecutionPolicy Bypass -File "%~dp0start-app.ps1"

pause

