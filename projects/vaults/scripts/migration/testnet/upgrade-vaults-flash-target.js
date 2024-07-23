const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0x4267Cf4df74C5cBDC2E97F0633f2caBFe9F999F2",
  libAddress = "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /**********************************
   *********** DEPLOYMENT ***********
   **********************************/

  const InceptionVaultFactory = await ethers.getContractFactory("InVault_E2", {
    libraries: {
      InceptionLibrary: libAddress,
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
