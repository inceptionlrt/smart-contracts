import { DeployFunction } from "hardhat-deploy/types";
import { transferAdminOwnership } from "../scripts/deploy-helpers";

const func: DeployFunction = async function ({ getNamedAccounts, deployments, network }) {
  const { execute, get } = deployments;
  const { deployer, governance, treasury } = await getNamedAccounts();

  if (network.name !== "mainnet") {
    return true;
  }

  const executeCfg = {
    from: deployer,
    log: true,
  };

  await execute("ProtocolConfig", executeCfg, "setGovernance", governance);

  await transferAdminOwnership(deployments, "ProtocolConfig", governance);
  await transferAdminOwnership(deployments, "cToken", governance);
  await transferAdminOwnership(deployments, "FeeCollector", governance);
  await transferAdminOwnership(deployments, "RatioFeed", governance);
  await transferAdminOwnership(deployments, "RestakingPool", governance);
  await transferAdminOwnership(deployments, "RestakerFacets", governance);

  return true;
};

module.exports = func;
module.exports.tags = ["01_ownership"];
module.exports.dependencies = [];
module.exports.skip = false;
module.exports.id = "01";
