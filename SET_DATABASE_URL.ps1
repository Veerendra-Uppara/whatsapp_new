# PowerShell script to set DATABASE_URL for Supabase
# Replace YOUR_PASSWORD_HERE with your actual Supabase database password

$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD_HERE@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"

Write-Host "DATABASE_URL has been set!" -ForegroundColor Green
Write-Host "Current DATABASE_URL: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now restart your server to use Supabase PostgreSQL" -ForegroundColor Cyan
Write-Host "To start server: cd server; node index.js" -ForegroundColor Cyan

