const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0x838a7fe80f1af808bc5ad0f9b1ac6e26b2475e17",
  INCEPTION_LIBRARY = "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /**********************************
   *********** DEPLOYMENT ***********
   **********************************/

  const InceptionVaultFactory = await ethers.getContractFactory("InceptionVault_EL", {
    libraries: {
      InceptionLibrary: INCEPTION_LIBRARY,
    },
  });

  let tx = await upgrades.upgradeProxy(IVAULT_ADDRESS, InceptionVaultFactory, {
    kind: "transparent",
    unsafeAllowLinkedLibraries: true,
    unsafeAllowRenames: true,
  });
  await tx.waitForDeployment();

  console.log("InceptionVault upgraded");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

