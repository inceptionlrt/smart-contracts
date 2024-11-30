import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get, save } = deployments;
  const CToken = await get("cToken");

  const ctokenAdmin = await upgrades.erc1967.getAdminAddress(CToken.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(CToken.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", ctokenAdmin);

  const factory = await ethers.getContractFactory("cToken");
  const newImpl = await upgrades.prepareUpgrade(CToken.address, factory);

  console.log(`Changing implementation from ${currentImpl} to ${newImpl}`);
  if (typeof newImpl !== "string") {
    console.log("Returned receipt, schedule tx manually", newImpl);
    return true;
  }

  if (network.name === "mainnet") {
    const upgradeTx = await proxyAdmin.getFunction("upgradeAndCall").populateTransaction(
      CToken.address,
      newImpl,
      "0x"
    );
    console.log("Upgrade tx", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await proxyAdmin.upgradeAndCall(CToken.address, newImpl, "0x");
    console.log("Upgrade tx hash:", upgradeTx.hash);
    await upgradeTx.wait();
  }

  const updatedDeployment = {
    address: CToken.address,
    abi: JSON.parse(factory.interface.formatJson()),
    implementation: newImpl,
  };

  await save("cToken", updatedDeployment);

  return true;
};

module.exports = func;
module.exports.tags = ["18_upgrade_token"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "18";
