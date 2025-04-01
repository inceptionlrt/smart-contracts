
import hardhat from "hardhat";
import { e18, impersonateWithEth } from "../helpers/utils";
import { mellowVaults } from "./test-data/assets/mellow-vauts";
import { symbioticVaults } from "./test-data/assets/symbiotic-vaults";
const { ethers, upgrades, network } = hardhat;
import { emptyBytes } from './constants';
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

export async function initVault(assetData, options?: { initAdapters?: boolean }) {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(assetData.assetName, assetData.assetAddress);
  asset.address = await asset.getAddress();

  let emergencyClaimer;
  if (options?.initAdapters) {
    console.log("- Emergency claimer");
    // const emergencyClaimerFactory = await ethers.getContractFactory("EmergencyClaimer");
    // emergencyClaimer = await upgrades.deployProxy(emergencyClaimerFactory);
    // emergencyClaimer.address = await emergencyClaimer.getAddress();

    /// =============================== Mellow Vaults ===============================

    for (const mVaultInfo of mellowVaults) {
      console.log(`- MellowVault ${mVaultInfo.name} and curator`);
      mVaultInfo.vault = await ethers.getContractAt("IMellowVault", mVaultInfo.vaultAddress);

      const mellowVaultOperatorMock = await ethers.deployContract("OperatorMock", [mVaultInfo.bondStrategyAddress]);
      mellowVaultOperatorMock.address = await mellowVaultOperatorMock.getAddress();
      await network.provider.send("hardhat_setCode", [
        mVaultInfo.curatorAddress, await mellowVaultOperatorMock.getDeployedCode(),
      ]);

      //Copy storage values
      for (let i = 0; i < 5; i++) {
        const slot = "0x" + i.toString(16);
        const value = await network.provider.send("eth_getStorageAt", [mellowVaultOperatorMock.address, slot, "latest"]);
        await network.provider.send("hardhat_setStorageAt", [mVaultInfo.curatorAddress, slot, value]);
      }

      mVaultInfo.curator = await ethers.getContractAt("OperatorMock", mVaultInfo.curatorAddress);
    }

    /// =============================== Symbiotic Vaults ===============================
    for (const sVaultInfo of symbioticVaults) {
      console.log(`- Symbiotic ${sVaultInfo.name}`);
      sVaultInfo.vault = await ethers.getContractAt("IVault", sVaultInfo.vaultAddress);
    }
  }

  /// =============================== Inception Vault ===============================
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- iVault operator");
  const iVaultOperator = await impersonateWithEth(assetData.iVaultOperator, e18);

  let mellowAdapter, symbioticAdapter;
  if (options?.initAdapters) {
    console.log("- Mellow Adapter");
    const mellowAdapterFactory = await ethers.getContractFactory("IMellowAdapter");
    mellowAdapter = await upgrades.deployProxy(mellowAdapterFactory, [
      [mellowVaults[0].vaultAddress], assetData.assetAddress, assetData.iVaultOperator,
    ]);

    mellowAdapter.address = await mellowAdapter.getAddress();

    console.log("- Symbiotic Adapter");
    const symbioticAdapterFactory = await ethers.getContractFactory("ISymbioticAdapter");
    symbioticAdapter = await upgrades.deployProxy(symbioticAdapterFactory, [
      [symbioticVaults[0].vaultAddress], assetData.assetAddress, assetData.iVaultOperator,
    ]);
    symbioticAdapter.address = await symbioticAdapter.getAddress();
  }

  console.log("- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.updateRatioBatch([iToken.address], [e18]); //Set initial ratio e18
  ratioFeed.address = await ratioFeed.getAddress();

  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  const iVaultFactory = await ethers.getContractFactory(assetData.vaultFactory, {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });
  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [assetData.vaultName, assetData.iVaultOperator, assetData.assetAddress, iToken.address],
    {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();

  const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [], [], 0]);
  withdrawalQueue.address = await withdrawalQueue.getAddress();

  // if (options?.initAdapters) {
  //   await emergencyClaimer.setMellowAdapter(mellowAdapter.address);
  //   await emergencyClaimer.setSymbioticAdapter(symbioticAdapter.address);
  // }

  await iVault.setRatioFeed(ratioFeed.address);

  if (options?.initAdapters) {
    await iVault.addAdapter(symbioticAdapter.address);
    await iVault.addAdapter(mellowAdapter.address);
  }

  await iVault.setWithdrawalQueue(withdrawalQueue.address);

  if (options?.initAdapters) {
    await mellowAdapter.setInceptionVault(iVault.address);
    // await mellowAdapter.setEmergencyClaimer(emergencyClaimer.address);
    await mellowAdapter.setEthWrapper("0x7A69820e9e7410098f766262C326E211BFa5d1B1");
    await symbioticAdapter.setInceptionVault(iVault.address);
    // await symbioticAdapter.setEmergencyClaimer(emergencyClaimer.address);
  }

  await iToken.setVault(iVault.address);

  if (options?.initAdapters) {
    // await emergencyClaimer.approveSpender(assetData.assetAddress, mellowAdapter.address);
    MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
    console.log("... iVault initialization completed ....");

    iVault.withdrawFromMellowAndClaim = async function (withdrawalQueue, mellowVaultAddress, amount) {
      const tx = await this.connect(iVaultOperator).emergencyUndelegate(
        [await mellowAdapter.getAddress()], [mellowVaultAddress], [amount], [emptyBytes],
      );

      const receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

      // NEW
      const adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      // await mellowAdapter.withdraw(mellowVaultAddress, amount, ["0x"]);
      // await mellowVaults[0].curator.processWithdrawals([mellowAdapter.address]);

      await helpers.time.increase(1209900);
      const params = abi.encode(["address", "address"], [mellowVaultAddress, claimer]);
      if (events[0].args["actualAmounts"] > 0) {
        await this.connect(iVaultOperator).emergencyClaim(
          [await mellowAdapter.getAddress()], [mellowVaultAddress], [[params]],
        );
      }
    }
  }

  return {
    iToken, iVault, ratioFeed, asset, iVaultOperator, iLibrary, withdrawalQueue,
    mellowAdapter, symbioticAdapter,
  };
};

export const abi = ethers.AbiCoder.defaultAbiCoder();
export let MAX_TARGET_PERCENT: BigInt;
