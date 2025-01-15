const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17",
  INCEPTION_LIBRARY = "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /**********************************
   *********** DEPLOYMENT ***********
   **********************************/

  // update InceptionVault_EL implementation

  const setterFacetFactory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: {
      InceptionLibrary: INCEPTION_LIBRARY
    },
  });

  const setterFacet = await setterFacetFactory.attach(IVAULT_ADDRESS);

  const InceptionVaultFactory = await ethers.getContractFactory("InceptionVault_EL", {
    libraries: {
      InceptionLibrary: INCEPTION_LIBRARY,
    },
  });

  const iVault = await InceptionVaultFactory.attach(IVAULT_ADDRESS);

  console.log("InceptionVault_EL upgraded");

  // deploy new InceptionEigenRestaker

  const InceptionEigenRestaker = await ethers.getContractFactory("InceptionEigenRestaker");
  const restaker = await InceptionEigenRestaker.deploy();
  await restaker.waitForDeployment();
  const newRestakerImpl = await restaker.getAddress();

  console.log(`Restaker has been deployed at the address: ${newRestakerImpl}`);

  // update InceptionEigenRestaker implementation at InceptionVault_EL

  tx = await setterFacet.upgradeTo(newRestakerImpl);
  await tx.wait();

  console.log(`Inception Restaker Impl has been upgraded for the vault: ${IVAULT_ADDRESS}`);

  // deploy new EigenLayerFacet

  const EigenLayerFacet_Factory = await hre.ethers.getContractFactory("EigenLayerFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });

  const eigenFacet = await EigenLayerFacet_Factory.deploy();
  await eigenFacet.waitForDeployment();
  const eigenFacetAddress = await eigenFacet.getAddress();

  console.log(`eigenFacetAddress: ${eigenFacetAddress}`);

  // update EigenLayerFacet at InceptionVault_EL

  tx = await iVault.setEigenLayerFacet(eigenFacetAddress);
  await tx.wait();

  console.log(`eigenFacetAddress has been upgraded for the vault: ${IVAULT_ADDRESS}`);

  console.log("InceptionVault upgraded");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
