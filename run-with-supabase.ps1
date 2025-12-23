# Interactive script to start server with Supabase
Write-Host "=== Starting Server with Supabase Database ===" -ForegroundColor Cyan
Write-Host ""

# Prompt for password
$password = Read-Host "Enter your Supabase database password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
    Write-Host "❌ Password cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting DATABASE_URL..." -ForegroundColor Yellow

$env:DATABASE_URL = "postgresql://postgres:$passwordPlain@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"

Write-Host "✅ DATABASE_URL configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
Write-Host "Look for: '✅ Connected to PostgreSQL database (Supabase)'" -ForegroundColor Yellow
Write-Host ""

cd server
node index.js

