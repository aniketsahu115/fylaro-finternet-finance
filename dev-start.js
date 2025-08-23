#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWindows = os.platform() === 'win32';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStatus(message) {
  log(`[DEV] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red');
}

async function checkDependencies() {
  logStatus('Checking dependencies...');
  
  // Check frontend dependencies
  if (!fs.existsSync('node_modules')) {
    logStatus('Installing frontend dependencies...');
    await runCommand('npm install');
  }
  
  // Check backend dependencies
  if (!fs.existsSync('backend/node_modules')) {
    logStatus('Installing backend dependencies...');
    process.chdir('backend');
    await runCommand('npm install');
    process.chdir('..');
  }
  
  logSuccess('Dependencies check completed');
}

async function setupEnvironment() {
  logStatus('Setting up environment files...');
  
  // Create frontend .env
  if (!fs.existsSync('.env')) {
    logStatus('Creating frontend .env file...');
    const frontendEnv = `VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_BLOCKCHAIN_NETWORK=localhost
VITE_ENVIRONMENT=development`;
    fs.writeFileSync('.env', frontendEnv);
  }
  
  // Create backend .env
  if (!fs.existsSync('backend/.env')) {
    logStatus('Creating backend .env file...');
    if (fs.existsSync('backend/.env.example')) {
      fs.copyFileSync('backend/.env.example', 'backend/.env');
      logWarning('Please update backend/.env with your configuration');
    }
  }
  
  logSuccess('Environment setup completed');
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
    
    if (options.pipe !== false) {
      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);
    }
  });
}

function startService(name, command, cwd = '.') {
  return new Promise((resolve) => {
    logStatus(`Starting ${name}...`);
    
    const child = spawn(command, [], {
      cwd,
      shell: true,
      stdio: 'inherit',
      detached: !isWindows
    });
    
    child.on('spawn', () => {
      logSuccess(`${name} started successfully`);
      resolve(child);
    });
    
    child.on('error', (error) => {
      logError(`Failed to start ${name}: ${error.message}`);
      resolve(null);
    });
    
    // Don't wait for the process to exit
    setTimeout(() => resolve(child), 2000);
  });
}

async function startServices() {
  logStatus('Starting development services...');
  
  // Start backend
  const backend = await startService('Backend Server', 'npm run dev', 'backend');
  
  // Wait a moment for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start frontend
  const frontend = await startService('Frontend Server', 'npm run dev');
  
  return { backend, frontend };
}

function setupGracefulShutdown(processes) {
  const cleanup = () => {
    logStatus('Shutting down development servers...');
    
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        if (isWindows) {
          spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
        } else {
          proc.kill('SIGTERM');
        }
      }
    });
    
    logSuccess('Development servers stopped');
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

async function displayInfo() {
  log('\n🎉 Development Environment Ready!', 'green');
  log('=====================================', 'green');
  log('📱 Frontend: http://localhost:5173', 'cyan');
  log('🔧 Backend API: http://localhost:3001', 'cyan');
  log('📊 Health Check: http://localhost:3001/health', 'cyan');
  log('🔌 WebSocket: ws://localhost:3001', 'cyan');
  log('\nPress Ctrl+C to stop all services\n', 'yellow');
}

async function main() {
  try {
    log('🚀 Starting Fylaro Finance Development Environment', 'bright');
    log('=================================================', 'bright');
    
    await checkDependencies();
    await setupEnvironment();
    
    const { backend, frontend } = await startServices();
    const processes = [backend, frontend].filter(Boolean);
    
    setupGracefulShutdown(processes);
    await displayInfo();
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    logError(`Failed to start development environment: ${error.message}`);
    process.exit(1);
  }
}

main();
