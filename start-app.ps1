# Start Chat Application - Server and Client
# This script starts both the server and React client

Write-Host "`n=== Starting Chat Application ===" -ForegroundColor Green
Write-Host ""

# Stop any existing Node.js processes on ports 5000 and 3000
Write-Host "Checking for existing processes..." -ForegroundColor Cyan
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($port5000) {
    Write-Host "Stopping process on port 5000..." -ForegroundColor Yellow
    $port5000 | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

if ($port3000) {
    Write-Host "Stopping process on port 3000..." -ForegroundColor Yellow
    $port3000 | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

Write-Host "Starting server on port 5000..." -ForegroundColor Cyan
$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; Write-Host '=== Server Running on port 5000 ===' -ForegroundColor Green; Write-Host ''; node index.js" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Starting React client on port 3000..." -ForegroundColor Cyan
$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$clientPath'; Write-Host '=== React Client Starting on port 3000 ===' -ForegroundColor Green; Write-Host ''; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Server: http://localhost:5000" -ForegroundColor Green
Write-Host "✅ Client: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "The browser should open automatically to http://localhost:3000" -ForegroundColor Yellow
Write-Host "Two PowerShell windows have been opened - one for server, one for client" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the application, close both PowerShell windows or press Ctrl+C in each window" -ForegroundColor Cyan
Write-Host ""

