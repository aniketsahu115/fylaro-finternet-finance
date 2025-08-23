@echo off
echo 🚀 Starting Fylaro Finance Development Environment
echo =================================================

:: Check if node_modules exist
if not exist "node_modules" (
    echo [DEV] Installing frontend dependencies...
    call npm install
)

if not exist "backend\node_modules" (
    echo [DEV] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

:: Create basic .env files if they don't exist
if not exist ".env" (
    echo [DEV] Creating frontend .env file...
    echo VITE_API_URL=http://localhost:3001/api > .env
    echo VITE_WS_URL=ws://localhost:3001 >> .env
    echo VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/ >> .env
    echo VITE_BLOCKCHAIN_NETWORK=localhost >> .env
    echo VITE_ENVIRONMENT=development >> .env
)

if not exist "backend\.env" (
    echo [DEV] Creating backend .env file...
    copy "backend\.env.example" "backend\.env"
    echo [WARNING] Please update backend\.env with your configuration
)

echo [DEV] Starting backend server...
start "Fylaro Backend" cmd /k "cd backend && npm run dev"

:: Wait a moment for backend to start
timeout /t 3 /nobreak > nul

echo [DEV] Starting frontend development server...
start "Fylaro Frontend" cmd /k "npm run dev"

echo [SUCCESS] Development environment started!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo 🔌 WebSocket: ws://localhost:3001
echo.
echo Press any key to exit...
pause > nul
