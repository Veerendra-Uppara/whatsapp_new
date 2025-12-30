@echo off
echo ========================================
echo   Local Testing Setup for Chat App
echo ========================================
echo.

echo Step 1: Building React app...
cd client
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open a NEW terminal and run: cd server ^&^& npm start
echo 2. Open ANOTHER terminal and run: ngrok http 5000
echo 3. Copy the ngrok HTTPS URL and share it with your friend
echo.
echo Press any key to exit...
pause >nul

