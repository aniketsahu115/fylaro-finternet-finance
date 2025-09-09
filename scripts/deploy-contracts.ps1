# Fylaro Smart Contract Deployment Script for Windows PowerShell

param(
    [Parameter(Mandatory=$true)]
    [string]$Network,
    
    [switch]$Verify,
    
    [switch]$Help
)

function Write-ColoredOutput {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Status {
    param([string]$Text)
    Write-ColoredOutput "[INFO] $Text" "Blue"
}

function Write-Success {
    param([string]$Text)
    Write-ColoredOutput "[SUCCESS] $Text" "Green"
}

function Write-Warning {
    param([string]$Text)
    Write-ColoredOutput "[WARNING] $Text" "Yellow"
}

function Write-Error {
    param([string]$Text)
    Write-ColoredOutput "[ERROR] $Text" "Red"
}

if ($Help) {
    Write-Host "Usage: .\deploy-contracts.ps1 -Network <network> [-Verify]"
    Write-Host ""
    Write-Host "Networks:"
    Write-Host "  localhost    Local Hardhat network"
    Write-Host "  bscTestnet   BSC Testnet"
    Write-Host "  bsc          BSC Mainnet"
    Write-Host "  sepolia      Ethereum Sepolia Testnet"
    Write-Host "  ethereum     Ethereum Mainnet"
    Write-Host "  polygon      Polygon Mainnet"
    Write-Host "  arbitrum     Arbitrum Mainnet"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Verify      Verify contracts on block explorer after deployment"
    Write-Host "  -Help        Show this help message"
    exit 0
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Error ".env file not found!"
    Write-Status "Please copy .env.example to .env and fill in your configuration"
    Write-Status "Copy-Item .env.example .env"
    exit 1
}

# Check if private key is set
$envContent = Get-Content ".env" -Raw
if ($envContent -match "your_private_key_here") {
    Write-Error "Please update your PRIVATE_KEY in .env file"
    exit 1
}

Write-Status "🚀 Fylaro Smart Contract Deployment"
Write-Status "===================================="

# Validate network
$validNetworks = @("localhost", "bscTestnet", "bsc", "sepolia", "ethereum", "polygon", "arbitrum")
if ($Network -notin $validNetworks) {
    Write-Error "Invalid network: $Network"
    Write-Host "Valid networks: $($validNetworks -join ', ')"
    exit 1
}

Write-Status "Deploying to network: $Network"

# Compile contracts
Write-Status "Compiling contracts..."
& npx hardhat compile

if ($LASTEXITCODE -ne 0) {
    Write-Error "Contract compilation failed"
    exit 1
}

Write-Success "Contracts compiled successfully"

# Deploy contracts
if ($Network -eq "localhost") {
    Write-Status "Deploying to local network..."
    & npx hardhat run scripts/deploy-local.js --network localhost
} else {
    Write-Status "Deploying to $Network..."
    & npx hardhat run scripts/deploy.js --network $Network
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed"
    exit 1
}

Write-Success "Deployment completed successfully!"

# Verify contracts if requested
if ($Verify -and $Network -ne "localhost") {
    Write-Status "Verifying contracts..."
    Start-Sleep -Seconds 10  # Wait for blocks to be mined
    & npx hardhat run scripts/verify.js --network $Network
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Contract verification completed"
    } else {
        Write-Warning "Contract verification failed (this is normal for some networks)"
    }
}

Write-Success "🎉 All done!"
Write-Status "📋 Check the deployments/ folder for contract addresses"
Write-Status "📝 Update your frontend and backend .env files with the new addresses"
