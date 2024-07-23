import { ethers, upgrades } from "hardhat";
import { DeployFunction, DeploymentsExtension } from "hardhat-deploy/types";
import { ozDeploy } from "../scripts/deploy-helpers";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const transferAdminOwnership = async ({ get }: DeploymentsExtension, contractName: string, to: string) => {
  const contract = await get(contractName);
  await upgrades.admin.transferProxyAdminOwnership(contract.address, to);
  console.log(`ProxyAdmin ownership of ${contractName} transferred to ${to}`);
  await sleep(24_000);
};

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { execute, get } = deployments;
  const { deployer, governance, treasury } = await getNamedAccounts();

  if (network.name !== "mainnet") {
    return true;
  }

  const config = await get("ProtocolConfig");

  await ozDeploy(deployments, "cToken", [config.address, "GenesisLRT restaked ETH", "genETH"], true);

  await transferAdminOwnership(deployments, "cToken", governance);

  return true;
};

module.exports = func;
module.exports.tags = ["02_rename"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "02";
