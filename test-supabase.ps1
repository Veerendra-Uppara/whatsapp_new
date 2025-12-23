# Test Supabase Connection
# This will prompt for password and test the connection

param(
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "Setting up Supabase connection..." -ForegroundColor Cyan

$env:DATABASE_URL = "postgresql://postgres:$Password@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"

Write-Host "DATABASE_URL has been set!" -ForegroundColor Green
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow

# Test the connection by running a simple Node.js script
$testScript = @"
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to Supabase PostgreSQL!');
    client.release();
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
"@

$testScript | Out-File -FilePath "test-connection.js" -Encoding UTF8

cd server
node ../test-connection.js
$testResult = $LASTEXITCODE

cd ..
Remove-Item test-connection.js -ErrorAction SilentlyContinue

if ($testResult -eq 0) {
    Write-Host ""
    Write-Host "✅ Supabase connection successful!" -ForegroundColor Green
    Write-Host "You can now start your server with: cd server; node index.js" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Connection failed. Please check your password and try again." -ForegroundColor Red
}

