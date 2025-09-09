import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting Fylaro Finternet Finance deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await deployer.provider.getBalance(deployer.address)).toString()
  );

  // Configuration - Update these addresses based on your network
  const config = {
    // For BSC Mainnet
    stablecoin: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
    feeCollector: deployer.address, // You can change this to a dedicated fee collector
    treasuryWallet: deployer.address, // You can change this to a multisig wallet
  };

  // For testnets, you might want to deploy a mock stablecoin
  const network = await ethers.provider.getNetwork();
  console.log(
    "Deploying to network:",
    network.name,
    "Chain ID:",
    network.chainId
  );

  let stablecoinAddress = config.stablecoin;

  // Deploy mock USDT for testnets
  if (
    network.chainId === 97 ||
    network.chainId === 11155111 ||
    network.chainId === 31337
  ) {
    console.log("Deploying mock USDT for testnet...");
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.deployed();
    stablecoinAddress = mockUSDT.address;
    console.log("MockUSDT deployed to:", mockUSDT.address);
  }

  // Deploy FylaroDeployer
  console.log("Deploying FylaroDeployer...");
  const FylaroDeployer = await ethers.getContractFactory("FylaroDeployer");
  const fylaroDeployer = await FylaroDeployer.deploy(
    stablecoinAddress,
    config.feeCollector,
    config.treasuryWallet
  );
  await fylaroDeployer.deployed();
  console.log("FylaroDeployer deployed to:", fylaroDeployer.address);

  // Deploy the entire ecosystem
  console.log("Deploying Fylaro ecosystem...");
  const tx = await fylaroDeployer.deployEcosystem();
  const receipt = await tx.wait();

  console.log("Ecosystem deployment transaction:", receipt.transactionHash);

  // Get all deployed contract addresses
  const addresses = await fylaroDeployer.getAllContractAddresses();

  const deployedContracts = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    deploymentTimestamp: new Date().toISOString(),
    stablecoin: stablecoinAddress,
    fylaroDeployer: fylaroDeployer.address,
    invoiceToken: addresses._invoiceToken,
    marketplace: addresses._marketplace,
    creditScoring: addresses._creditScoring,
    paymentTracker: addresses._paymentTracker,
    unifiedLedger: addresses._unifiedLedger,
    riskAssessment: addresses._riskAssessment,
    liquidityPool: addresses._liquidityPool,
    finternetGateway: addresses._finternetGateway,
  };

  console.log("\n📋 Deployment Summary:");
  console.log("======================");
  console.log("Network:", deployedContracts.network);
  console.log("Chain ID:", deployedContracts.chainId);
  console.log("Deployer:", deployedContracts.deployer);
  console.log("\n📄 Contract Addresses:");
  console.log("FylaroDeployer:", deployedContracts.fylaroDeployer);
  console.log("Stablecoin (USDT):", deployedContracts.stablecoin);
  console.log("InvoiceToken:", deployedContracts.invoiceToken);
  console.log("Marketplace:", deployedContracts.marketplace);
  console.log("CreditScoring:", deployedContracts.creditScoring);
  console.log("PaymentTracker:", deployedContracts.paymentTracker);
  console.log("UnifiedLedger:", deployedContracts.unifiedLedger);
  console.log("RiskAssessment:", deployedContracts.riskAssessment);
  console.log("LiquidityPool:", deployedContracts.liquidityPool);
  console.log("FinternentGateway:", deployedContracts.finternetGateway);

  // Save deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentPath,
    `${network.name}-${network.chainId}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deployedContracts, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Generate environment variables file
  const envVars = `
# Fylaro Finternet Finance Contract Addresses - ${network.name}
# Generated on ${deployedContracts.deploymentTimestamp}

# Network Configuration
BLOCKCHAIN_NETWORK=${network.name}
CHAIN_ID=${network.chainId}
RPC_URL=${
    network.chainId === 56
      ? "https://bsc-dataseed.binance.org/"
      : "https://data-seed-prebsc-1-s1.binance.org:8545/"
  }

# Contract Addresses
FYLARO_DEPLOYER_ADDRESS=${deployedContracts.fylaroDeployer}
STABLECOIN_ADDRESS=${deployedContracts.stablecoin}
INVOICE_TOKEN_ADDRESS=${deployedContracts.invoiceToken}
MARKETPLACE_ADDRESS=${deployedContracts.marketplace}
CREDIT_SCORING_ADDRESS=${deployedContracts.creditScoring}
PAYMENT_TRACKER_ADDRESS=${deployedContracts.paymentTracker}
UNIFIED_LEDGER_ADDRESS=${deployedContracts.unifiedLedger}
RISK_ASSESSMENT_ADDRESS=${deployedContracts.riskAssessment}
LIQUIDITY_POOL_ADDRESS=${deployedContracts.liquidityPool}
FINTERNET_GATEWAY_ADDRESS=${deployedContracts.finternetGateway}

# Deployment Info
DEPLOYER_ADDRESS=${deployedContracts.deployer}
DEPLOYMENT_TIMESTAMP=${deployedContracts.deploymentTimestamp}
`;

  const envFile = path.join(__dirname, "..", `.env.${network.name}`);
  fs.writeFileSync(envFile, envVars);
  console.log(`📝 Environment variables saved to: ${envFile}`);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n🔧 Next Steps:");
  console.log("1. Copy the contract addresses to your frontend .env file");
  console.log("2. Copy the contract addresses to your backend .env file");
  console.log("3. Update your web3 configuration files");
  console.log("4. Test the contracts with your frontend");
  console.log("5. Verify contracts on blockchain explorer (optional)");

  if (network.chainId !== 31337) {
    console.log("\n🔍 To verify contracts, run:");
    console.log(
      `npx hardhat verify --network ${network.name} ${fylaroDeployer.address} "${stablecoinAddress}" "${config.feeCollector}" "${config.treasuryWallet}"`
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
