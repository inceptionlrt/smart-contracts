// deplot proxy
const { ethers, upgrades } = require("hardhat");

const ADAPTER_ADDRESS = "0x3712e359d87ACd6D4dE6E22607303256D2fa631f";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const adapterFactory = await hre.ethers.getContractFactory("FraxFerryLZCrossChainAdapterL2");
  await upgrades.upgradeProxy(ADAPTER_ADDRESS, adapterFactory, {
    kind: "transparent",
  });
  console.log("Frax LZ adapter upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

