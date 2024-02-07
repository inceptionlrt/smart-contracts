const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying InstETHRateProvider with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const InstETHRateProviderFactory = await hre.ethers.getContractFactory("InstETHRateProvider");
  const rateProvider = await InstETHRateProviderFactory.deploy();
  await rateProvider.waitForDeployment();

  console.log("RateProvider address: ", (await rateProvider.getAddress()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
