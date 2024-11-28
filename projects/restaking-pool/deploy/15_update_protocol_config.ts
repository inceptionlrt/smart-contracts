import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;
  const ProtocolConfig = await get("ProtocolConfig");
  console.log("ProtocolConfig proxy address:", ProtocolConfig.address);

  const protocolConfigAdmin = await upgrades.erc1967.getAdminAddress(ProtocolConfig.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(ProtocolConfig.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", protocolConfigAdmin);

  const [deployer] = await ethers.getSigners();

  console.log(`deployer address: ${deployer.address}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer.address)}`);

  // Prepare ProtocolConfig contract factory
  const ProtocolConfigFactory = await ethers.getContractFactory("ProtocolConfig");

  const newImpl = await upgrades.prepareUpgrade(ProtocolConfig.address, ProtocolConfigFactory);
  console.log(`Upgrading implementation from ${currentImpl} to ${newImpl}`);

  if (typeof newImpl !== "string") {
    console.log("Upgrade requires manual scheduling. Receipt:", newImpl);
    return true;
  }

  if (network.name === "mainnet") {
    const upgradeTx = await proxyAdmin.upgradeAndCall.populateTransaction(ProtocolConfig.address, newImpl, "0x");
    console.log("Mainnet upgrade transaction populated:", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await proxyAdmin.upgradeAndCall(ProtocolConfig.address, newImpl, "0x");
    console.log("Upgrade transaction executed:", upgradeTx);
  }

  return true;
};

module.exports = func;
module.exports.tags = ["15_update_protocol_config"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "15";

