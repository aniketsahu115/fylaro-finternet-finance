@echo off
echo Starting Fylaro Finance Development Environment...
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ERROR: backend directory not found!
    pause
    exit /b 1
)

REM Check if backend node_modules exists
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check if frontend node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo Starting backend server...
start "Fylaro Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting frontend server...
start "Fylaro Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Fylaro Finance servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:8080
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WindowTitle eq Fylaro Backend*" /T /F
taskkill /FI "WindowTitle eq Fylaro Frontend*" /T /F
