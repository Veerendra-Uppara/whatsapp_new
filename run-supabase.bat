@echo off
echo ========================================
echo Starting Server with Supabase Database
echo ========================================
echo.
set /p PASSWORD="Enter your Supabase database password: "
echo.
set DATABASE_URL=postgresql://postgres:%PASSWORD%@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres
echo DATABASE_URL configured!
echo.
echo Starting server...
echo Look for: "Connected to PostgreSQL database (Supabase)"
echo.
cd server
node index.js
pause

