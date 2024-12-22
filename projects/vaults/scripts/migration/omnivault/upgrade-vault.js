// deplot proxy
const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0xDc4c9339247cb3f64cdd46e80a0b89bD08c0C734";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const InceptionVaultFactory = await hre.ethers.getContractFactory("InceptionVaultMock", {
    libraries: {
      InceptionLibrary: "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca",
    },
  });

  await upgrades.upgradeProxy(IVAULT_ADDRESS, InceptionVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
  });
  console.log("InceptionVault upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

