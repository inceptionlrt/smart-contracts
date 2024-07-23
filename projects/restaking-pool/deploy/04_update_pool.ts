import { BigNumberish, ContractTransaction } from "ethers";
import { BytesLike } from "ethers/lib.commonjs/utils/data";
import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const schedule = async ({
  transaction,
  predecessor,
  salt,
  delay,
}: {
  transaction: ContractTransaction;
  predecessor?: BytesLike;
  salt?: BytesLike;
  delay?: BigNumberish;
}) => {
  const timelock = await ethers.getContractAt("ITimelockController", "0xc70470Cdc428d6A3966cd25F476F84D898158638");

  if (!delay) {
    delay = await timelock.getMinDelay();
  }

  const res = await timelock.schedule(
    transaction.to,
    transaction.value || "0",
    transaction.data,
    predecessor || ethers.ZeroHash,
    salt || ethers.ZeroHash,
    delay,
  );
  await res.wait();
  console.log(res.hash);
};

const func: DeployFunction = async function ({ deployments, network }) {
  if (network.name !== "mainnet") {
    return true;
  }

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

  const upgradeTx = await proxyAdmin.upgradeAndCall.populateTransaction(RestakingPool.address, newImpl, "0x");

  console.log("upgrade tx", upgradeTx);

  // only for mainnet
  await schedule({
    transaction: upgradeTx,
  });

  return true;
};

module.exports = func;
module.exports.tags = ["04_upgrade_pool"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "04";
