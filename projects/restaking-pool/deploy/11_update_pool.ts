import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { schedule } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ deployments, network }) {
  const { get } = deployments;
  const RestakingPool = await get("RestakingPool");
  console.log("Restaking Pool address: ", RestakingPool.address);

  const restakinPoolAdmin = await upgrades.erc1967.getAdminAddress(RestakingPool.address);
  const currentImpl = await upgrades.erc1967.getImplementationAddress(RestakingPool.address);
  const proxyAdmin = await ethers.getContractAt("IProxyAdmin", restakinPoolAdmin);

  /// 1. InceptionLibrary
  let libAddress = "";
  if (network.name === "mainnet") {
    libAddress = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";
  } else {
    const libFactory = await ethers.getContractFactory("InceptionLibrary");
    const lib = await libFactory.deploy();
    await lib.waitForDeployment();
    libAddress = await lib.getAddress();
  }
  console.log("InceptionLibrary address:", libAddress);

  const RestakingPoolFactory = await ethers.getContractFactory("RestakingPool", {
    libraries: {
      InceptionLibrary: libAddress,
    },
  });

  const newImpl = await upgrades.prepareUpgrade(RestakingPool.address, RestakingPoolFactory, {
    unsafeAllowLinkedLibraries: true,
  });
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
module.exports.tags = ["11_update_pool"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "11";
