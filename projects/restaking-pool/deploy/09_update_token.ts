import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;
  const CToken = await get("cToken");
  const ctokenAdmin = await upgrades.erc1967.getAdminAddress(CToken.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(CToken.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", ctokenAdmin);

  const newImpl = await upgrades.prepareUpgrade(CToken.address, await ethers.getContractFactory("cToken"));
  console.log(`changing implementation from ${currentImpl} to ${newImpl}`);
  if (typeof newImpl !== "string") {
    console.log("returned receipt, schedule tx manually", newImpl);
    return true;
  }

  if (network.name === "mainnet") {
    const upgradeTx = await proxyAdmin.upgradeAndCall.populateTransaction(CToken.address, newImpl, "0x");
    console.log("upgrade tx", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await proxyAdmin.upgradeAndCall(CToken.address, newImpl, "0x");
    console.log("upgrade tx", upgradeTx);
  }

  return true;
};

module.exports = func;
module.exports.tags = ["09_update_token"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "09";
