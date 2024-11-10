const { ethers } = require("hardhat");
const fs = require("fs");

const INCEPTION_LIBRARY = "";

const deployVault = async (addresses, vaultName, tokenName, tokenSymbol) => {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ${vaultName} with the account: ${deployer.address}`);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  /*********************************************
   ************** EigenLayerFacet **************
   *********************************************/

  const EigenLayerFacet_Factory = await hre.ethers.getContractFactory("EigenLayerFacet");
  const eigenFacet = await EigenLayerFacet_Factory.deploy();
  const eigenFacetAddress = await eigenFacet.getAddress();
  console.log(`eigenFacetAddress: ${eigenFacetAddress}`);

  /********************************************
   ************* EigenSetterFacet *************
   ********************************************/

  const EigenSetterFacet_Factory = await hre.ethers.getContractFactory("EigenLayerFacet");
  const eigenSetterFacet = await EigenSetterFacet_Factory.deploy();
  const eigenSetterFacetAddress = await eigenSetterFacet.getAddress();
  console.log(`eigenSetterFacetAddress: ${eigenSetterFacetAddress}`);

  /********************************************
   *************** ERC4626Facet ***************
   ********************************************/

  const ERC4626Facet_EL_E2_Factory = await ethers.getContractFactory("ERC4626Facet_EL_E2", {
    libraries: { InceptionLibrary: INCEPTION_LIBRARY },
  });
  const erc4626Facet = await ERC4626Facet_EL_E2_Factory.deploy();
  const erc4626FacetAddress = await erc4626Facet.getAddress();
  console.log(`erc4626FacetAddress: ${erc4626FacetAddress}`);

  const fininalBalance = await deployer.provider.getBalance(deployer.address);
  console.log(`deployed spent: ${initBalance - fininalBalance}`);

  /********************************************
   ************** Save Addresses **************
   ********************************************/

  const facetAddresses = {
    erc4626Facet: erc4626FacetAddress,
    eigenSetterFacet: eigenSetterFacetAddress,
    eigenFacet: eigenFacetAddress,
  };

  const json_addresses = JSON.stringify(facetAddresses);
  fs.writeFileSync(`./scripts/migration/facet_addresses/${network.name}.json`, json_addresses);
};

module.exports = {
  deployVault,
};

