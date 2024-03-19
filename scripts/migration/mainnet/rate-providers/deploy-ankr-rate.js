const { ethers } = require("hardhat");
const { printBalance } = require("../../../utils");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying InankrETHRateProvider with the account: ${deployer.address}`);
  await printBalance(deployer);

  const RateProviderFactory = await hre.ethers.getContractFactory("InankrETHRateProvider");
  const rateProvider = await RateProviderFactory.deploy("0x814CC6B8fd2555845541FB843f37418b05977d8d");
  await rateProvider.waitForDeployment();

  console.log("RateProvider address: ", (await rateProvider.getAddress()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
