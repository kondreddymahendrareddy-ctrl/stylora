@echo off
echo ===================================================
echo   Starting STYLORA - AI Personal Stylist System
echo ===================================================
echo.
echo Launching Backend Server on http://localhost:5000...
start "STYLORA Backend Server" cmd /k "cd server && npm run dev"

echo Launching Frontend Client on http://localhost:3000...
start "STYLORA Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo ===================================================
echo   Both services have been launched!
echo   Client URL: http://localhost:3000
echo   API URL:    http://localhost:5000
echo ===================================================
