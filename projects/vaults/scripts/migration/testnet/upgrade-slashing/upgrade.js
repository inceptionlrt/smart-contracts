const { ethers, upgrades } = require("hardhat");

const IVAULT_ADDRESS = "0x4267Cf4df74C5cBDC2E97F0633f2caBFe9F999F2";
const INCEPTION_LIBRARY = "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /**********************************
   *********** DEPLOYMENT ***********
   **********************************/

    // update InceptionVault_EL implementation

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
  const iVault = await InceptionVaultFactory.attach(IVAULT_ADDRESS);

  console.log("InceptionVault_EL upgraded");

  // deploy new InceptionEigenRestaker

  const InceptionEigenRestaker = await ethers.getContractFactory("InceptionEigenRestaker");
  const restaker = await InceptionEigenRestaker.deploy();
  await restaker.waitForDeployment();
  const newRestakerImpl = await restaker.getAddress();

  console.log(`Restaker has been deployed at the address: ${newRestakerImpl}`);

  // update InceptionEigenRestaker implementation at InceptionVault_EL

  tx = await iVault.upgradeTo(newRestakeImp);
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
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

