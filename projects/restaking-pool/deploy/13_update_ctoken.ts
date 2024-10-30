import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;
  
  // Fetch cToken proxy address from previous deployment
  const cToken = await get("cToken");
  console.log("cToken proxy address:", cToken.address);

  // Retrieve proxy admin address and the current implementation address
  const cTokenAdmin = await upgrades.erc1967.getAdminAddress(cToken.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(cToken.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", cTokenAdmin);

  // Prepare the new cToken implementation
  const cTokenFactory = await ethers.getContractFactory("cToken");
  const newImpl = await upgrades.prepareUpgrade(cToken.address, cTokenFactory);
  console.log(`Upgrading implementation from ${currentImpl} to ${newImpl}`);

  if (typeof newImpl !== "string") {
    console.log("Upgrade requires manual scheduling. Receipt:", newImpl);
    return true;
  }

  // Execute or schedule the upgrade based on the network
  if (network.name === "mainnet") {
    const upgradeTx = await proxyAdmin.upgradeAndCall.populateTransaction(cToken.address, newImpl, "0x");
    console.log("Mainnet upgrade transaction populated:", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await proxyAdmin.upgradeAndCall(cToken.address, newImpl, "0x");
    console.log("Upgrade transaction executed:", upgradeTx);
  }

  return true;
};

module.exports = func;
module.exports.tags = ["13_update_ctoken"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "13";
