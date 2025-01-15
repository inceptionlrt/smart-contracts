const { ethers } = require("hardhat");

const INCEPTION_LIBRARY = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /*********************************************
   ************** EigenLayerFacet **************
   *********************************************/

  const EigenLayerFacet_Factory = await hre.ethers.getContractFactory("SwellEigenLayerFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const eigenFacet = await EigenLayerFacet_Factory.deploy();
  await eigenFacet.deployed();
  console.log(`eigenFacetAddress: ${eigenFacet.address}`);

  /*********************************************
   ********** Spend on the deployment **********
   *********************************************/

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

