// deplot proxy
const { ethers, upgrades } = require("hardhat");

const ADAPTER_ADDRESS = "0x3b0154Bb623A04f991294333bF07037bc2EBd054";

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

