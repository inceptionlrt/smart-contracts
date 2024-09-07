import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;

  if (network.name === "mainnet") {
    return true;
  }

  const RestakerFacets = await get("RestakerFacets");
  const restakerFacetsAdmin = await upgrades.erc1967.getAdminAddress(RestakerFacets.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(RestakerFacets.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", restakerFacetsAdmin);

  const newImpl = await upgrades.prepareUpgrade(RestakerFacets.address, await ethers.getContractFactory("RestakerFacets"));
  console.log(`changing implementation from ${currentImpl} to ${newImpl}`);
  if (typeof newImpl !== "string") {
    console.log("returned receipt, schedule tx manually", newImpl);
    return true;
  }

  const upgradeTx = await proxyAdmin.upgradeAndCall(RestakerFacets.address, newImpl, "0x");
  console.log("upgrade tx", upgradeTx.hash);

  return true;
};

module.exports = func;
module.exports.tags = ["12_update_facets"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "12";
