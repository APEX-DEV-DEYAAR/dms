@echo off
title Letterhead Control System - Startup
echo ============================================
echo   Letterhead Control System - Full Reset
echo ============================================
echo.

:: Kill any existing node processes on our ports
echo [1/7] Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 2^>nul') do taskkill /F /PID %%a >nul 2>&1
echo       Done.

:: Clear uploads
echo [2/7] Clearing uploads folder...
if exist "%~dp0uploads" rmdir /S /Q "%~dp0uploads"
mkdir "%~dp0uploads"
echo       Done.

:: Clear node_modules and reinstall
echo [3/7] Clearing node_modules cache...
if exist "%~dp0node_modules" rmdir /S /Q "%~dp0node_modules"
if exist "%~dp0server\node_modules" rmdir /S /Q "%~dp0server\node_modules"
if exist "%~dp0client\node_modules" rmdir /S /Q "%~dp0client\node_modules"
if exist "%~dp0server\dist" rmdir /S /Q "%~dp0server\dist"
echo       Done.

:: Clear npm cache
echo [4/7] Clearing npm cache...
call npm cache clean --force >nul 2>&1
echo       Done.

:: Install dependencies
echo [5/7] Installing dependencies...
cd /d "%~dp0"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo       Done.

:: Reset database
echo [6/7] Resetting database...
echo       Dropping and recreating letterhead_control database...
psql -U postgres -c "DROP DATABASE IF EXISTS letterhead_control;" 2>nul
psql -U postgres -c "CREATE DATABASE letterhead_control;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo       WARNING: Could not reset database via psql.
    echo       Make sure PostgreSQL is running and psql is in PATH.
    echo       You may need to manually create the 'letterhead_control' database.
)
echo       Done.

:: Start server and client
echo [7/7] Starting server and client...
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
