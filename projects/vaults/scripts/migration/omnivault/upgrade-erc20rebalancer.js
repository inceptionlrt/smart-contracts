// deplot proxy
const { ethers, upgrades } = require("hardhat");

const REBALANCER_ADDRESS = "0xb64183373e60Dd42015d8fC637Fa7514A3E5CD10";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const ERC20RebalancerFactory = await hre.ethers.getContractFactory("ERC20Rebalancer");
  await upgrades.upgradeProxy(REBALANCER_ADDRESS, ERC20RebalancerFactory, {
    kind: "transparent",
  });
  console.log("Rebalancer upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

