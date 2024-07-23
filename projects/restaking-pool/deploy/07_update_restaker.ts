import { ethers, upgrades } from "hardhat";
import { DeployFunction, DeploymentsExtension } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;

  const restakerDeployer = await get("RestakerDeployer");

  if (!restakerDeployer.args) {
    throw Error("restakerDeployer deployment doesnt contain args");
  }

  const beaconAddr = restakerDeployer.args[0];

  const currentImpl = await upgrades.beacon.getImplementationAddress(beaconAddr);
  const upgradeableBeacon = await ethers.getContractAt("IUpgradeableBeacon", beaconAddr);

  const newImpl = await upgrades.prepareUpgrade(beaconAddr, await ethers.getContractFactory("Restaker"), {
    redeployImplementation: "always",
  });

  console.log(`changing implementation from ${currentImpl} to ${newImpl}`);
  if (typeof newImpl !== "string") {
    console.log("returned receipt, schedule tx manually", newImpl);
    return true;
  }

  if (network.name === "mainnet") {
    const upgradeTx = await upgradeableBeacon.upgradeTo.populateTransaction(newImpl);
    console.log("upgrade tx", upgradeTx);

    await schedule({
      transaction: upgradeTx,
    });
  } else {
    const upgradeTx = await upgradeableBeacon.upgradeTo(newImpl);
    console.log("upgrade tx", upgradeTx);
  }

  return true;
};

module.exports = func;
module.exports.tags = ["07_update_restaker"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "07";
