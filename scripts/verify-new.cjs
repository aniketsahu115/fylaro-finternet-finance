const { ethers, run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = await ethers.provider.getNetwork();
  console.log(
    `🔍 Verifying contracts on ${network.name} (Chain ID: ${network.chainId})`
  );

  // Load deployment info
  const deploymentFile = path.join(
    __dirname,
    "..",
    "deployments",
    `${network.name}-${network.chainId}.json`
  );

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found:", deploymentFile);
    console.error(
      "Please deploy contracts first using: npx hardhat run scripts/deploy.cjs --network <network>"
    );
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("📄 Loaded deployment info from:", deploymentFile);

  // Verify MockUSDT if on testnet
  if (network.chainId === 97 || network.chainId === 11155111) {
    try {
      console.log("Verifying MockUSDT...");
      await run("verify:verify", {
        address: deployment.stablecoin,
        constructorArguments: [],
      });
      console.log("✅ MockUSDT verified");
    } catch (error) {
      console.warn("⚠️ MockUSDT verification failed:", error.message);
    }
  }

  // Verify FylaroDeployer
  try {
    console.log("Verifying FylaroDeployer...");
    await run("verify:verify", {
      address: deployment.fylaroDeployer,
      constructorArguments: [
        deployment.stablecoin,
        deployment.deployer, // feeCollector
        deployment.deployer, // treasuryWallet
      ],
    });
    console.log("✅ FylaroDeployer verified");
  } catch (error) {
    console.warn("⚠️ FylaroDeployer verification failed:", error.message);
  }

  // Note: The other contracts are deployed by FylaroDeployer,
  // so they need to be verified individually with their specific constructor arguments
  console.log("\n📝 Note: Other contracts were deployed by FylaroDeployer.");
  console.log(
    "To verify them, you'll need to check their constructor arguments manually."
  );

  console.log("\n✅ Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
