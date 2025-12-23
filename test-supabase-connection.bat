@echo off
echo ========================================
echo Testing Supabase PostgreSQL Connection
echo ========================================
echo.
echo URL Format: postgresql://postgres:[YOUR-PASSWORD]@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres
echo.
set /p PASSWORD="Enter your Supabase database password: "
echo.
set DATABASE_URL=postgresql://postgres:%PASSWORD%@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres
echo.
echo Testing connection...
echo.

node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.connect().then(c=>{console.log('✅ SUCCESS: Connected to Supabase PostgreSQL!');c.release();p.end();process.exit(0);}).catch(e=>{console.error('❌ FAILED:',e.message);p.end();process.exit(1);});"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Connection successful! You can now run the server.
    echo Use: .\run-supabase.bat
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Connection failed! Please check your password.
    echo ========================================
)

pause

