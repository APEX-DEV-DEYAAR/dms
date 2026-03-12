@echo off
title Letterhead Control System - Full Reset
echo ============================================
echo   Letterhead Control System - FULL RESET
echo ============================================
echo.
echo   WARNING: This will DELETE all data:
echo     - uploads folder
echo     - node_modules
echo     - database (letterhead_control)
echo.
set /p confirm="Are you sure? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)
echo.

:: Kill any existing node processes on our ports
echo [1/6] Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 2^>nul') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 2^>nul') do taskkill /F /PID %%a >nul 2>&1
echo       Done.

:: Clear uploads
echo [2/6] Clearing uploads folder...
if exist "%~dp0uploads" rmdir /S /Q "%~dp0uploads"
mkdir "%~dp0uploads"
echo       Done.

:: Clear node_modules and reinstall
echo [3/6] Clearing node_modules...
if exist "%~dp0node_modules" rmdir /S /Q "%~dp0node_modules"
if exist "%~dp0server\node_modules" rmdir /S /Q "%~dp0server\node_modules"
if exist "%~dp0client\node_modules" rmdir /S /Q "%~dp0client\node_modules"
if exist "%~dp0server\dist" rmdir /S /Q "%~dp0server\dist"
echo       Done.

:: Clear npm cache
echo [4/6] Clearing npm cache...
call npm cache clean --force >nul 2>&1
echo       Done.

:: Install dependencies
echo [5/6] Installing dependencies...
cd /d "%~dp0"
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo       Done.

:: Reset database
echo [6/6] Resetting database...
echo       Dropping and recreating letterhead_control database...
psql -U postgres -c "DROP DATABASE IF EXISTS letterhead_control;" 2>nul
psql -U postgres -c "CREATE DATABASE letterhead_control;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo       WARNING: Could not reset database via psql.
    echo       Make sure PostgreSQL is running and psql is in PATH.
    echo       You may need to manually create the 'letterhead_control' database.
)
echo       Done.

echo.
echo ============================================
echo   Reset complete. Run start.bat to launch.
echo ============================================
echo.
pause
