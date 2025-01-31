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

  const EigenLayerFacet_Factory = await hre.ethers.getContractFactory("EigenLayerFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const eigenFacet = await EigenLayerFacet_Factory.deploy();
  await eigenFacet.deployed();
  console.log(`eigenFacetAddress: ${eigenFacet.address}`);

  /********************************************
   ************* EigenSetterFacet *************
   ********************************************/

  const EigenSetterFacet_Factory = await ethers.getContractFactory("EigenSetterFacet", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const eigenSetterFacet = await EigenSetterFacet_Factory.deploy();
  await eigenSetterFacet.deployed();
  console.log(`eigenSetterFacetAddress: ${eigenSetterFacet.address}`);

  /********************************************
   *************** ERC4626Facet ***************
   ********************************************/

  const ERC4626Facet_EL_E2_Factory = await ethers.getContractFactory("ERC4626Facet_EL_E2", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const erc4626Facet_E2 = await ERC4626Facet_EL_E2_Factory.deploy();
  await erc4626Facet_E2.deployed();
  console.log(`erc4626FacetAddress E2: ${erc4626Facet_E2.address}`);

  const ERC4626Facet_EL_E1_Factory = await ethers.getContractFactory("ERC4626Facet_EL_E1", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const erc4626Facet_E1 = await ERC4626Facet_EL_E1_Factory.deploy();
  await erc4626Facet_E1.deployed();
  console.log(`erc4626FacetAddress E1: ${erc4626Facet_E1.address}`);

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

