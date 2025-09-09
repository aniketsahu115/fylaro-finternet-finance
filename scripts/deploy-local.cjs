const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Starting local test deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockUSDT for testing
  console.log("Deploying MockUSDT...");
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.deployed();
  console.log("MockUSDT deployed to:", mockUSDT.address);

  // Deploy FylaroDeployer
  console.log("Deploying FylaroDeployer...");
  const FylaroDeployer = await ethers.getContractFactory("FylaroDeployer");
  const fylaroDeployer = await FylaroDeployer.deploy(
    mockUSDT.address,
    deployer.address, // feeCollector
    deployer.address // treasuryWallet
  );
  await fylaroDeployer.deployed();
  console.log("FylaroDeployer deployed to:", fylaroDeployer.address);

  // Deploy the entire ecosystem
  console.log("Deploying Fylaro ecosystem...");
  const tx = await fylaroDeployer.deployEcosystem();
  await tx.wait();

  // Get all deployed contract addresses
  const addresses = await fylaroDeployer.getAllContractAddresses();

  console.log("\n📋 Local Deployment Summary:");
  console.log("============================");
  console.log("MockUSDT:", mockUSDT.address);
  console.log("FylaroDeployer:", fylaroDeployer.address);
  console.log("InvoiceToken:", addresses._invoiceToken);
  console.log("Marketplace:", addresses._marketplace);
  console.log("CreditScoring:", addresses._creditScoring);
  console.log("PaymentTracker:", addresses._paymentTracker);
  console.log("UnifiedLedger:", addresses._unifiedLedger);
  console.log("RiskAssessment:", addresses._riskAssessment);
  console.log("LiquidityPool:", addresses._liquidityPool);
  console.log("FinternentGateway:", addresses._finternetGateway);

  // Get some test USDT
  console.log("\n💰 Getting test USDT from faucet...");
  await mockUSDT.faucet();
  const balance = await mockUSDT.balanceOf(deployer.address);
  console.log("USDT balance:", ethers.utils.formatUnits(balance, 6));

  console.log("\n✅ Local test deployment completed!");
  console.log("🔧 You can now test the contracts locally");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test deployment failed:", error);
    process.exit(1);
  });
