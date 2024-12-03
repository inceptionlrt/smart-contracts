const fs = require("fs").promises;
const { ethers } = require("hardhat");
const { addresses } = require("../config-addresses");
const { generateTransactionData } = require("../../upgrade-diamond-proxy/set-signatures");

const IVAULT_ADDRESS = "0x838a7fe80f1af808bc5ad0f9b1ac6e26b2475e17";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Setting signatures with the account:", deployer.address);
  const initBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", initBalance.toString());

  const iVault = await ethers.getContractAt("InceptionVault_EL", IVAULT_ADDRESS);
  const [eigenSetterFacetAddress, erc4626FacetAddress, eigenFacetAddress] = await getFacetAddresses();

  let tx = await iVault.setSetterFacet(eigenSetterFacetAddress);
  await tx.wait();

  tx = await iVault.setEigenLayerFacet(eigenFacetAddress);
  await tx.wait();

  tx = await iVault.setERC4626Facet(erc4626FacetAddress);
  await tx.wait();

  const [sigs, accesses, targets] = await generateTransactionData();

  tx = await iVault.setSignaturesBatch(sigs, targets, accesses);
  await tx.wait();

  const iVaultSetters = await ethers.getContractAt("EigenSetterFacet", IVAULT_ADDRESS);

  const resp = await iVault.getFacetByTarget(iVaultSetters.interface.getFunction("setRewardsCoordinator").selector);
  console.log(`resp: ${resp.toString()}`);

  console.log(iVaultSetters.interface.getFunction("setRewardsCoordinator"));

  tx = await iVaultSetters.setRewardsCoordinator(addresses.RewardsCoordinator);
  await tx.wait();

  console.log("The signatures have been set");
  console.log(`spent: ${(initBalance - (await deployer.provider.getBalance(deployer.address))).toString()}`);
}

async function getFacetAddresses() {
  const filePath = `./scripts/migration/facet_addresses/${network.name}.json`;
  const jsonString = await fs.readFile(filePath, "utf8");
  const jsonObject = JSON.parse(jsonString);
  const dataMap = new Map(Object.entries(jsonObject));

  return [dataMap.get("eigenSetterFacet"), dataMap.get("erc4626Facet"), dataMap.get("eigenFacet")];
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

