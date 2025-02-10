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
  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["InsfrxETH", "InsfrxETH"], { kind: "transparent" });
  await iToken.waitForDeployment();
  const iTokenAddress = await iToken.getAddress();
  console.log(`InceptionToken address: ${iTokenAddress}`);
  //return iTokenAddress;
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
  tx = await iVault.setRatioFeed(ratioFeedAddress);//("0x90D5a4860e087462F8eE15B52D9b1914BdC977B5");
  await tx.wait();

  const feed = await ethers.getContractAt("IInceptionRatioFeed", ratioFeedAddress); //"0x90D5a4860e087462F8eE15B52D9b1914BdC977B5");
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
  // set rebalancer as target receiver in L1 adapter
  const l1addapter = await ethers.getContractAt("LZCrossChainAdapterL1", defaultAdapter);
  // TODO fix (permissions on L1 adapter?)
  //  await l1addapter.setTargetReceiver(rebalancerAddr);

  return rebalancerAddr;
};

const setRebalancerForItoken = async (reb, it) => {
  const itoken = ethers.getContractAt("InceptionToken", it);
  // TODO fix (permissions on L1 adapter?)
  //await itoken.setRebalancer(reb);
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

  console.log(obj);
  if (!obj.iTokenAddressL1 || !obj.iVaultAddressL1) {
    console.log(`Deploying IOVL1...`);
    [obj.iTokenAddressL1, obj.iVaultAddressL1] = await deployVaultAndToken(await deployer.getAddress(), obj.strategyAddress, obj.inceptionLibAddress, obj.ratioFeedAddressL1, obj.underlyingAssetL1);
  }
  await saveState(obj);

  if (!obj.rebalancer) {
    console.log(`Deploying rebalancer...`);
    obj.rebalancer = await deployERC20Rebalancer(obj.chainIdL1, obj.iTokenAddressL1, obj.underlyingAssetL1, obj.lockbox, obj.iVaultAddressL1, obj.crossChainL1, await deployer.getAddress());
    await setRebalancerForItoken(obj.rebalancer, obj.iTokenAddressL1);
  }
  await saveState(obj);
}

main().then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });