import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;
  const RestakingPool = await get("RestakingPool");
  const restakinPoolAdmin = await upgrades.erc1967.getAdminAddress(RestakingPool.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(RestakingPool.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", restakinPoolAdmin);

  const newImpl = await upgrades.prepareUpgrade(
    RestakingPool.address,
    await ethers.getContractFactory("RestakingPool"),
  );
  console.log(`changing implementation from ${currentImpl} to ${newImpl}`);
  if (typeof newImpl !== "string") {
    console.log("returned receipt, schedule tx manually", newImpl);
    return true;
  }

  if (network.name === "mainnet") {
    const upgradeTx = await proxyAdmin.upgradeAndCall.populateTransaction(RestakingPool.address, newImpl, "0x");
    console.log("upgrade tx", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await proxyAdmin.upgradeAndCall(RestakingPool.address, newImpl, "0x");
    console.log("upgrade tx", upgradeTx);
  }

  return true;
};

module.exports = func;
module.exports.tags = ["06_update_pool"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "06";
