const { ethers } = require("hardhat");

const ownerAddress = "0x8e6C8799B542E507bfDDCA1a424867e885D96e79";

// TODO
const minDelay = "";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying InceptionTimeLock with the account: ${deployer.address}`);

  const args = [minDelay, [deployer.address], [ownerAddress]];

  const timelock = await ethers.deployContract("InceptionTimeLock", args);
  await timelock.waitForDeployment();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
