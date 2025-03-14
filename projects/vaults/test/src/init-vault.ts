
import hardhat from "hardhat";
import { e18, impersonateWithEth } from "../helpers/utils.js";
const { ethers, upgrades } = hardhat;

export async function initVault(assetInfo, options?: { initAdapters?: boolean }) {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(assetInfo.assetName, assetInfo.assetAddress);
  asset.address = await asset.getAddress();

  /// =============================== Inception Vault ===============================
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- iVault operator");
  const iVaultOperator = await impersonateWithEth(assetInfo.iVaultOperator, e18);

  console.log("- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.updateRatioBatch([iToken.address], [e18]); //Set initial ratio e18
  ratioFeed.address = await ratioFeed.getAddress();

  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  const iVaultFactory = await ethers.getContractFactory(assetInfo.vaultFactory, {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });
  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [assetInfo.vaultName, assetInfo.iVaultOperator, assetInfo.assetAddress, iToken.address],
    {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();

  const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [], [], 0]);
  withdrawalQueue.address = await withdrawalQueue.getAddress();

  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.setWithdrawalQueue(withdrawalQueue.address);
  await iToken.setVault(iVault.address);

  return {
    iToken, iVault, ratioFeed, asset, iVaultOperator, iLibrary, withdrawalQueue,
    // mellowAdapter, symbioticAdapter,
  };
};
