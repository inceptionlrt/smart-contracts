const { ethers, upgrades } = require("hardhat");
const fs = require('node:fs/promises');



const loadState = async () => {
  const data = await fs.readFile('state.json', { encoding: 'utf8' });
  const obj = JSON.parse(data);
  return obj;
}

const saveState = async (state) => {
  const data = JSON.stringify(state);
  await fs.writeFile('state.json', data, { encoding: 'utf8' });
}

const deployVaultAndToken = async (operatorAddress, strategyAddress, inceptionLibAddress, ratioFeedAddress, underlyingL1) => {
  // Intended for testnet use - mainnet already has this deployed
  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["InsfrxETH", "InsfrxETH"], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);

  // 2. Inception vault (mock)
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InceptionVaultMock", {
    libraries: {
      InceptionLibrary: inceptionLibAddress, // "0x3022ad4552b5fb285F36C71Bdd1545c33a4937ca",
    },
  });
  const iVault = await upgrades.deployProxy(
    InceptionVaultFactory,
    ["InceptionSfrxEthVault", operatorAddress, underlyingL1, iTokenAddress, strategyAddress],
    { unsafeAllowLinkedLibraries: true, kind: "transparent" },
  );
  await iVault.waitForDeployment();
  const iVaultAddress = await iVault.getAddress();
  console.log(`InceptionVault address: ${iVaultAddress}`);
  // 3. set the vault
  tx = await iToken.setVault(iVaultAddress);
  await tx.wait();
  // 6. set RatioFeed
  tx = await iVault.setRatioFeed(ratioFeedAddress);
  await tx.wait();

  const feed = await ethers.getContractAt("contracts/vaults/interfaces/common/IInceptionRatioFeed.sol:IInceptionRatioFeed", ratioFeedAddress);
  //await feed.updateRatioBatch([iTokenAddress], ["1000000000000000000"]); // currently reverts with L1 ratiofeed due to access stuff

  return [iTokenAddress, iVaultAddress];
};

const deployERC20Rebalancer = async (
  defaultChainId,
  inceptionToken,
  underlyingAsset,
  lockbox,
  inceptionVault,
  defaultAdapter,
  operator,
) => {
  const ERC20RebalancerFactory = await hre.ethers.getContractFactory("ERC20Rebalancer");
  const rebalancer = await upgrades.deployProxy(
    ERC20RebalancerFactory,
    [defaultChainId, inceptionToken, underlyingAsset, lockbox, inceptionVault, defaultAdapter, operator],
    { kind: "transparent" },
  );
  await rebalancer.waitForDeployment();
  console.log(`Rebalancer deployed, setup...`);
  const rebalancerAddr = await rebalancer.getAddress();
  console.log(`ERC20Rebalancer address: ${rebalancerAddr}`);
  await rebalancer.setInfoMaxDelay(36000n);

  return rebalancerAddr;
};

const setRebalancerForItoken = async (reb, it) => {
  const itoken = await ethers.getContractAt("InceptionToken", it);
  await itoken.setRebalancer(reb);
}

const deployL1adapter = async (deployer, lzEndpointL1, eidL2, chainidL2) => {

  const args_x = [lzEndpointL1, deployer, [eidL2], [chainidL2]];
  console.log("Deploying L1 adapter...");
  const contractFactory = await ethers.getContractFactory("LZCrossChainAdapterL1");
  const contract = await upgrades.deployProxy(contractFactory, args_x, {
    kind: "transparent",
  });
  await contract.waitForDeployment();
  console.log(
    `Proxy deployed at:`,
    await contract.getAddress(),
  );

  const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(
    await contract.getAddress(),
  );
  console.log("ProxyAdmin deployed at:", proxyAdminAddress);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    await contract.getAddress(),
  );
  console.log("Implementation deployed at:", implementationAddress);

  return contract.getAddress();

}

const setTargetReceiver = async (adapter, tr) => {
  const a = await ethers.getContractAt("LZCrossChainAdapterL1", adapter);
  await a.setTargetReceiver(tr);
}

const main = async () => {
  const [deployer] = await ethers.getSigners();
  // Stage 1: this deploys and configures L1 contracts that don't depend on knowing L2 addresses
  let obj = await loadState();

  if ((!obj.iTokenAddressL1 || !obj.iVaultAddressL1) && (!obj.strategyAddress || !obj.inceptionLibAddress || !obj.ratioFeedAddressL1 || !obj.underlyingAssetL1)) {
    console.log("Missing required config info for IV-L1 deployment");
    return;
  }

  if (!obj.rebalancer && (!obj.chainIdL1 || !obj.underlyingAssetL1 || !obj.lockbox || !obj.crossChainL1)) {
    console.log("Missing required config info for rebalancer deployment");
    return;
  }

  if (!obj.crossChainL1 && (!obj.chainIdL1 || !obj.lzEndpointL1 || !obj.eidL2 || !obj.chainidL2)) {
    console.log("Missing required config info for adapter deployment");
    return;
  }

  console.log(obj);
  if (!obj.iTokenAddressL1 || !obj.iVaultAddressL1) {
    console.log(`Deploying IOVL1...`);
    [obj.iTokenAddressL1, obj.iVaultAddressL1] = await deployVaultAndToken(await deployer.getAddress(), obj.strategyAddress, obj.inceptionLibAddress, obj.ratioFeedAddressL1, obj.underlyingAssetL1);
  }
  await saveState(obj);

  if (!!obj.crossChainL1) {
    console.log(`Deploying L1 CCA...`);
    obj.crossChainL1 = await deployL1adapter(await deployer.getAddress(), obj.lzEndpointL1, obj.eidL2, obj.chainIdL2);
  }
  await saveState(obj);


  if (!obj.rebalancer) {
    console.log(`Deploying rebalancer...`);
    obj.rebalancer = await deployERC20Rebalancer(obj.chainIdL1, obj.iTokenAddressL1, obj.underlyingAssetL1, obj.lockbox, obj.iVaultAddressL1, obj.crossChainL1, await deployer.getAddress());
    await setRebalancerForItoken(obj.rebalancer, obj.iTokenAddressL1);
    await setTargetReceiver(obj.crossChainL1, obj.rebalancer);
  }
  await saveState(obj);
}

main().then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });