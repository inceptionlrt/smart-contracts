// deplot proxy
const { ethers, upgrades } = require("hardhat");

const FRAX_IOV_ADDR = "0xB4091B924DCDf4464F200ad4c01B50C0Ec575353";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const iovFactory = await hre.ethers.getContractFactory("InOmniVault_E2");
  await upgrades.upgradeProxy(FRAX_IOV_ADDR, iovFactory, {
    kind: "transparent",
  });
  console.log("Frax IOV upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

