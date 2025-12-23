# Start server with Supabase database
# Usage: .\start-with-supabase.ps1 -Password "your_password"

param(
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "Setting DATABASE_URL for Supabase..." -ForegroundColor Cyan

$env:DATABASE_URL = "postgresql://postgres:$Password@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"

Write-Host "Starting server with Supabase PostgreSQL..." -ForegroundColor Green
Write-Host ""

cd server
node index.js

