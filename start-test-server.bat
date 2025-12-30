@echo off
echo ========================================
echo   Starting Chat Server for Testing
echo ========================================
echo.
echo Server will start on port 5000
echo After this starts, open another terminal and run: ngrok http 5000
echo.
echo Press Ctrl+C to stop the server
echo.
cd server
node index.js

