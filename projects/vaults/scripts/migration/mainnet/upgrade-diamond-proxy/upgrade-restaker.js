const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const BeaconProxyPatternV2 = await ethers.getContractFactory("InceptionEigenAdapter");
  const beaconImpl = await BeaconProxyPatternV2.deploy();
  await beaconImpl.deployed();
  console.log(`-------- Adapter has been deployed at the address: ${beaconImpl.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

