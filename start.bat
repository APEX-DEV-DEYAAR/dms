@echo off
title Letterhead Control System - Startup
echo ============================================
echo   Letterhead Control System - Start
echo ============================================
echo.

:: Kill any existing node processes on our ports
echo [1/3] Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 2^>nul') do taskkill /F /PID %%a >nul 2>&1
echo       Done.

:: Install dependencies if needed
echo [2/3] Checking dependencies...
cd /d "%~dp0"
if not exist "%~dp0node_modules" (
    echo       Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
)
echo       Done.

:: Start server and client
echo [3/3] Starting server and client...
echo.
echo ============================================
echo   Starting Backend  (http://localhost:3001)
echo   Starting Frontend (http://localhost:5173)
echo ============================================
echo.
echo   Server will auto-run migrations and you
echo   can seed data with: cd server ^&^& npm run seed
echo.
echo   Close this window to stop both processes.
echo ============================================
echo.

cd /d "%~dp0"
start "LCS-Server" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul
start "LCS-Client" cmd /k "cd /d %~dp0client && npm run dev"

echo Both processes started in separate windows.
echo.
pause
