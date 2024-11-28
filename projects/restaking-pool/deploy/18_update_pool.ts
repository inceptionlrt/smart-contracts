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

  const [deployer] = await ethers.getSigners();

  console.log(`deployer address: ${deployer.address}`);
  console.log(`deployer balance: ${await ethers.provider.getBalance(deployer.address)}`);

  /// 1. InceptionLibrary Deployment
  let libAddress = "";
  if (network.name === "mainnet") {
    libAddress = "0x8a6a8a7233b16d0ecaa7510bfd110464a0d69f66";
  } else {
    libAddress = "0x4db1487f376efe5116af8491ece85f52e7082ce8";
  }
  console.log("InceptionLibrary address(15):", libAddress);

  /// 2. RestakingPool Upgrade
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
module.exports.tags = ["15_upgrade_pool"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "15";

