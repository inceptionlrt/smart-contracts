import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import {
  calculateRatio,
  e18,
  setBlockTimestamp,
  toWei,
} from "../helpers/utils";
import { adapters, emptyBytes } from "../src/constants";
import { abi, initVault, MAX_TARGET_PERCENT } from "../src/init-vault-new";
import { testrunConfig } from '../testrun.config';

const { ethers, network } = hardhat;
const assetData = testrunConfig.assetData;
const symbioticVaults = assetData.adapters.symbiotic;
const mellowVaults = assetData.adapters.mellow;

describe(`Inception Symbiotic Vault ${assetData.asset.name} e2e tests`, function () {
  this.timeout(150000);
  let iToken, iVault, ratioFeed, asset, mellowAdapter, symbioticAdapter, withdrawalQueue;
  let iVaultOperator, deployer, staker, staker2, staker3, treasury;
  let ratioErr, transactErr;
  let snapshot;
  let params;

  before(async function() {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.asset.name.toLowerCase())) {
        console.log(`${assetData.asset.name} is not in the list, going to skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, symbioticAdapter, withdrawalQueue }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [deployer, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);
    treasury = await iVault.treasury(); //deployer

    snapshot = await helpers.takeSnapshot();
  });

  after(async function() {
    if (iVault) {
      await iVault.removeAllListeners();
    }
  });

  describe("Symbiotic Native | Base flow no flash", function() {
    let totalDeposited = 0n;
    let delegatedSymbiotic = 0n;
    let rewardsSymbiotic = 0n;

    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("Initial stats", async function() {
      expect(await iVault.ratio()).to.be.eq(e18);
      expect(await iVault.totalAssets()).to.be.eq(0n);
      expect(await iVault.getTotalDeposited()).to.be.eq(0n);
      expect(await iVault.getTotalDelegated()).to.be.eq(0n);
      expect(await iVault.getFlashCapacity()).to.be.eq(0n);
      expect(await iVault.getFreeBalance()).to.be.eq(0n);
      expect((await symbioticAdapter.getAllVaults())[0]).to.be.eq(symbioticVaults[0].vaultAddress);
      expect(await symbioticAdapter.isVaultSupported(symbioticVaults[0].vaultAddress)).to.be.eq(true);
    });

    it("User can deposit to iVault", async function() {
      totalDeposited += toWei(20);
      const expectedShares = totalDeposited; //Because ratio is 1e18 at the first deposit
      const tx = await iVault.connect(staker).deposit(totalDeposited, staker.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Deposit");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.closeTo(totalDeposited, transactErr);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);

      expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(totalDeposited, transactErr);
      expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
      expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
    });

    it("Delegate to symbioticVault#1", async function() {
      const amount = (await iVault.totalAssets()) / 3n;
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      const sVault = await ethers.getContractAt("IVault", symbioticVaults[0].vaultAddress);
      const code = await ethers.provider.getCode(symbioticVaults[0].vaultAddress);
      console.log("Deployed Code len:", code.length);
      //  await sVault.connect(staker).deposit(staker.address, amount);
      console.log("totalStake: ", await sVault.totalStake());

      await iVault
        .connect(iVaultOperator)
        .delegate(await symbioticAdapter.getAddress(), symbioticVaults[0].vaultAddress, amount, emptyBytes);
      delegatedSymbiotic += amount;

      console.log("totalStake new: ", await sVault.totalStake());

      const symbioticBalance = await symbioticVaults[0].vault.activeBalanceOf(symbioticAdapter.address);
      const symbioticBalance2 = await symbioticVaults[1].vault.activeBalanceOf(symbioticAdapter.address);
      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const delegatedTo = await symbioticAdapter.getDeposited(symbioticVaults[0].vaultAddress);
      // const delegatedTo2 = await symbioticAdapter.getDeposited(symbioticVaults[1].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log("Mellow LP token balance: ", symbioticBalance.format());
      console.log("Mellow LP token balance2: ", symbioticBalance2.format());
      console.log("Amount delegated: ", delegatedSymbiotic.format());

      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
      expect(totalDelegatedAfter).to.be.closeTo(delegatedSymbiotic, transactErr);
      expect(delegatedTo).to.be.closeTo(amount, transactErr);
      // expect(delegatedTo2).to.be.closeTo(0n, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr);
      expect(symbioticBalance).to.be.gte(amount / 2n);
      expect(symbioticBalance2).to.be.eq(0n);
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
    });

    it("Add new symbioticVault", async function() {
      await expect(symbioticAdapter.addVault(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        symbioticAdapter,
        "ZeroAddress",
      );
      await expect(symbioticAdapter.addVault(await iVaultOperator.getAddress())).to.be.revertedWithCustomError(
        symbioticAdapter,
        "NotContract",
      );
      await expect(symbioticAdapter.addVault(symbioticVaults[1].vaultAddress))
        .to.emit(symbioticAdapter, "VaultAdded")
        .withArgs(symbioticVaults[1].vaultAddress);
      await expect(symbioticAdapter.addVault(symbioticVaults[1].vaultAddress)).to.be.revertedWithCustomError(
        symbioticAdapter,
        "AlreadyAdded",
      );
    });

    it("Delegate all to symbioticVault#2", async function() {
      const amount = await iVault.getFreeBalance();
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate(await symbioticAdapter.getAddress(), await iVaultOperator.getAddress(), amount, emptyBytes),
      ).to.be.revertedWithCustomError(symbioticAdapter, "InvalidVault");

      await iVault
        .connect(iVaultOperator)
        .delegate(await symbioticAdapter.getAddress(), symbioticVaults[1].vaultAddress, amount, emptyBytes);
      delegatedSymbiotic += amount;

      const symbioticBalance = await symbioticVaults[0].vault.activeBalanceOf(symbioticAdapter.address);
      const symbioticBalance2 = await symbioticVaults[1].vault.activeBalanceOf(symbioticAdapter.address);
      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const delegatedTo2 = await symbioticAdapter.getDeposited(symbioticVaults[1].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log("Symbiotic LP token balance: ", symbioticBalance.format());
      console.log("Symbiotic LP token balance2: ", symbioticBalance2.format());
      console.log("Amount delegated: ", delegatedSymbiotic.format());

      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
      expect(totalDelegatedAfter).to.be.closeTo(delegatedSymbiotic, transactErr * 2n);
      expect(delegatedTo2).to.be.closeTo(amount, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * 2n);
      expect(symbioticBalance2).to.be.gte(amount / 2n);
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
    });

    it("Update ratio", async function() {
      const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
      console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).eq(ratio);
    });

    it("Add rewards to Symbiotic protocol and estimate ratio, it remains the same", async function() {
      const ratioBefore = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToBefore = await symbioticAdapter.getDeposited(symbioticVaults[0].vaultAddress);
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
      console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

      console.log(`vault bal before: ${await asset.balanceOf(symbioticVaults[0].vaultAddress)}`);
      await asset.connect(staker3).transfer(symbioticVaults[0].vaultAddress, e18);
      console.log(`vault bal after: ${await asset.balanceOf(symbioticVaults[0].vaultAddress)}`);

      const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToAfter = await symbioticAdapter.getDeposited(symbioticVaults[0].vaultAddress);
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      expect(ratioAfter).to.be.eq(ratioBefore);
      expect(totalDelegatedToAfter - totalDelegatedToBefore).to.be.eq(0n);
      expect(totalDelegatedAfter - totalDelegatedBefore).to.be.eq(totalDelegatedToAfter - totalDelegatedToBefore);
    });

    it("User can withdraw all", async function() {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
      console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);
      const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.eq(assetValue);
      expect(events[0].args["iShares"]).to.be.eq(shares);

      const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
      const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      expect(stakerPW).to.be.eq(0n);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(epochShares).to.be.closeTo(shares, transactErr);
    });

    it("Update ratio after all shares burn", async function() {
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
      expect(calculatedRatio).to.be.eq(e18); //Because all shares have been burnt at this point

      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).eq(calculatedRatio);
    });

    let symbioticVaultEpoch1;
    let symbioticVaultEpoch2;
    let undelegateClaimer1;
    let undelegateClaimer2;

    it("Undelegate from Symbiotic", async function() {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

      const amount = await symbioticAdapter.getDeposited(symbioticVaults[0].vaultAddress);
      const amount2 = await symbioticAdapter.getDeposited(symbioticVaults[1].vaultAddress);
      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [
          [await symbioticAdapter.getAddress(), symbioticVaults[0].vaultAddress, amount, emptyBytes],
          [await symbioticAdapter.getAddress(), symbioticVaults[1].vaultAddress, amount2, emptyBytes],
        ]);

      const receipt = await tx.wait();
      const events = receipt.logs
        ?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));

      expect(events.length).to.be.eq(2);
      undelegateClaimer1 = events[0].args["claimer"];
      undelegateClaimer2 = events[1].args["claimer"];

      symbioticVaultEpoch1 = (await symbioticVaults[0].vault.currentEpoch()) + 1n;
      symbioticVaultEpoch2 = (await symbioticVaults[1].vault.currentEpoch()) + 1n;

      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const totalDelegatedTo = await symbioticAdapter.getDeposited(symbioticVaults[0].vaultAddress);
      const totalDelegatedTo2 = await symbioticAdapter.getDeposited(symbioticVaults[1].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const pendingWithdrawalsSymbioticAfter = await symbioticAdapter.pendingWithdrawalAmount();
      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      console.log(`Pending from Symbiotic:\t\t${pendingWithdrawalsSymbioticAfter.format()}`);

      expect(totalAssetsAfter).to.be.eq(totalAssetsBefore); //Nothing has come to the iVault yet
      expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
      expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
      expect(totalDelegatedTo2).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
      expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
      expect(pendingWithdrawalsSymbioticAfter).to.be.closeTo(amount + amount2, transactErr * 2n);
    });

    it("Process request to transfers pending funds to symbioticAdapter", async function() {
      console.log(`current epoch of 1: ${await symbioticVaults[0].vault.currentEpoch()}`);
      console.log(`current epoch of 2: ${await symbioticVaults[1].vault.currentEpoch()}`);

      const epochDuration1 = await symbioticVaults[0].vault.epochDuration();
      const epochDuration2 = await symbioticVaults[1].vault.epochDuration();

      const nextEpochStart1 = await symbioticVaults[0].vault.nextEpochStart();
      const nextEpochStart2 = await symbioticVaults[1].vault.nextEpochStart();

      const maxNextEpochStart = nextEpochStart1 > nextEpochStart2 ? nextEpochStart1 : nextEpochStart2;
      const maxEpochDuration = epochDuration1 > epochDuration2 ? epochDuration1 : epochDuration2;

      console.log(`maxNextEpochStart: ${maxNextEpochStart}`);

      await setBlockTimestamp(Number(maxNextEpochStart + maxEpochDuration + 1n));

      console.log(`current epoch of 1: ${await symbioticVaults[0].vault.currentEpoch()}`);
    });

    it("Cannot remove symbioticVault", async function() {
      await expect(symbioticAdapter.removeVault(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(symbioticAdapter, "ZeroAddress");
      await expect(symbioticAdapter.removeVault(await iVaultOperator.getAddress()))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotContract");
      await expect(symbioticAdapter.removeVault(symbioticVaults[1].vaultAddress))
        .to.be.revertedWithCustomError(symbioticAdapter, "VaultNotEmpty");
    });

    it("Claim Symbiotic withdrawal transfer funds from Symbiotic to the vault", async function() {
      const pendingWithdrawalsSymbiotic = await symbioticAdapter.pendingWithdrawalAmount();
      const totalAssetsBefore = await iVault.totalAssets();
      const adapterBalanceBefore = await asset.balanceOf(symbioticAdapter.address);

      // Vault 1
      params = abi.encode(
        ["address", "address"],
        [await iVaultOperator.getAddress(), undelegateClaimer1],
      );

      await expect(iVault.connect(iVaultOperator).claim(
        1, [await symbioticAdapter.getAddress()], [await iVaultOperator.getAddress()], [[params]]),
      ).to.be.revertedWithCustomError(symbioticAdapter, "InvalidVault");

      params = abi.encode(
        ["address", "address"],
        [symbioticVaults[0].vaultAddress, undelegateClaimer1],
      );

      // Vault 2
      let params2 = abi.encode(
        ["address", "address"],
        [symbioticVaults[1].vaultAddress, undelegateClaimer2],
      );

      await iVault.connect(iVaultOperator).claim(1,
        [await symbioticAdapter.getAddress(), await symbioticAdapter.getAddress()],
        [symbioticVaults[0].vaultAddress, symbioticVaults[1].vaultAddress],
        [[params], [params2]],
      );

      await expect(iVault.connect(iVaultOperator).claim(
        1, [await symbioticAdapter.getAddress()], [symbioticVaults[0].vaultAddress], [[params]]),
      ).to.be.revertedWithCustomError(symbioticAdapter, "NothingToClaim");

      const totalAssetsAfter = await iVault.totalAssets();
      const adapterBalanceAfter = await asset.balanceOf(mellowAdapter.address);

      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsSymbiotic, transactErr);
      expect(adapterBalanceBefore).to.be.closeTo(adapterBalanceAfter, transactErr);
    });

    it("Remove symbioticVault", async function() {
      await expect(symbioticAdapter.removeVault(symbioticVaults[1].vaultAddress))
        .to.emit(symbioticAdapter, "VaultRemoved")
        .withArgs(symbioticVaults[1].vaultAddress);

      await expect(symbioticAdapter.removeVault(symbioticVaults[1].vaultAddress))
        .to.be.revertedWithCustomError(symbioticAdapter, "NotAdded");
    });

    it("Staker is able to redeem", async function() {
      const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
      const redeemReserve = await iVault.redeemReservedAmount();
      const freeBalance = await iVault.getFreeBalance();

      console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
      console.log("Redeem reserve", redeemReserve.format());
      console.log("Free balance", freeBalance.format());
      console.log("Redeem reserve after", await iVault.redeemReservedAmount());

      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Redeem withdraw", async function() {
      const balanceBefore = await asset.balanceOf(staker2.address);
      const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

      const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(iVaultOperator.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const balanceAfter = await asset.balanceOf(staker2.address);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      console.log(`Pending withdrawals after:\t${staker2PWAfter.format()}`);
      console.log(`Ratio after:\t\t\t\t${(await iVault.ratio()).format()}`);

      expect(staker2PWAfter).to.be.eq(0n);
      expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(0n, transactErr);
      expect(totalAssetsAfter).to.be.closeTo(0n, transactErr);
    });
  });

  describe("Base flow no flash", function() {
    let totalDeposited = 0n;
    let delegatedMellow = 0n;
    let rewardsMellow = 0n;
    let undelegatedEpoch;

    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("Initial stats", async function() {
      expect(await iVault.ratio()).to.be.eq(e18);
      expect(await iVault.totalAssets()).to.be.eq(0n);
      expect(await iVault.getTotalDeposited()).to.be.eq(0n);
      expect(await iVault.getTotalDelegated()).to.be.eq(0n);
      expect(await iVault.getFlashCapacity()).to.be.eq(0n);
      expect(await iVault.getFreeBalance()).to.be.eq(0n);
    });

    it("User can deposit to iVault", async function() {
      totalDeposited += toWei(20);
      const expectedShares = totalDeposited; //Because ratio is 1e18 at the first deposit
      const tx = await iVault.connect(staker).deposit(totalDeposited, staker.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Deposit");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.closeTo(totalDeposited, transactErr);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);

      expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(totalDeposited, transactErr);
      expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
      expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
    });

    it("Delegate to mellowVault#1", async function() {
      const amount = (await iVault.getFreeBalance()) / 3n;
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
      delegatedMellow += amount;

      const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowAdapter.address);
      const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowAdapter.address);
      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const delegatedTo = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress);
      const delegatedTo2 = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log("Mellow LP token balance: ", mellowBalance.format());
      console.log("Mellow LP token balance2: ", mellowBalance2.format());
      console.log("Amount delegated: ", delegatedMellow.format());

      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
      expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr);
      expect(delegatedTo).to.be.closeTo(amount, transactErr);
      expect(delegatedTo2).to.be.closeTo(0n, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr);
      expect(mellowBalance).to.be.gte(amount / 2n);
      expect(mellowBalance2).to.be.eq(0n);
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
    });

    it("Add new mellowVault", async function() {
      await expect(mellowAdapter.addMellowVault(mellowVaults[1].vaultAddress))
        .to.emit(mellowAdapter, "VaultAdded")
        .withArgs(mellowVaults[1].vaultAddress);
    });

    it("Delegate all to mellowVault#2", async function() {
      const amount = await iVault.getFreeBalance();
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress, amount, emptyBytes);
      delegatedMellow += amount;

      const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowAdapter.address);
      const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowAdapter.address);
      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const delegatedTo2 = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log("Mellow LP token balance: ", mellowBalance.format());
      console.log("Mellow LP token balance2: ", mellowBalance2.format());
      console.log("Amount delegated: ", delegatedMellow.format());

      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
      expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr * 2n);
      expect(delegatedTo2).to.be.closeTo(amount, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * 2n);
      expect(mellowBalance2).to.be.gte(amount / 2n);
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
    });

    it("Update ratio", async function() {
      const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
      console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).eq(ratio);
    });

    it("Add rewards to Mellow protocol and estimate ratio", async function() {
      const ratioBefore = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToBefore = await iVault.getDelegatedTo(
        await mellowAdapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
      console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

      await asset.connect(staker3).transfer(mellowVaults[0].vaultAddress, e18);

      const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToAfter = await iVault.getDelegatedTo(
        await mellowAdapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      rewardsMellow += totalDelegatedToAfter - totalDelegatedToBefore;

      console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
      console.log(`Delegated to after:\t\t${totalDelegatedToAfter.format()}`);
      console.log(`mellow rewards:\t\t\t${rewardsMellow.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratioAfter]);
      expect(totalDelegatedAfter - totalDelegatedBefore).to.be.eq(totalDelegatedToAfter - totalDelegatedToBefore);
    });

    it("Estimate the amount that user can withdraw", async function() {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      expect(assetValue).closeTo(totalDeposited + rewardsMellow, transactErr * 10n);
    });

    it("User can withdraw all", async function() {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
      console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);
      const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.eq(assetValue);
      expect(events[0].args["iShares"]).to.be.eq(shares);

      const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
      const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      expect(stakerPW).to.be.eq(0n);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(epochShares).to.be.closeTo(shares, transactErr);
    });

    // it("Update ratio after all shares burn", async function () {
    //   const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
    //   console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
    //   expect(calculatedRatio).to.be.eq(e18); //Because all shares have been burnt at this point
    //
    //   await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
    //   console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
    //   expect(await iVault.ratio()).eq(calculatedRatio);
    // });

    let undelegateClaimer1;
    let undelegateClaimer2;

    it("Undelegate from Mellow", async function() {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();

      undelegatedEpoch = await withdrawalQueue.currentEpoch();
      const totalSupply = await withdrawalQueue.getRequestedShares(undelegatedEpoch);

      console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

      console.log(
        "Mellow1 delegated",
        await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress),
      );
      console.log(
        "Mellow2 delegated",
        await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress),
      );

      const assets1 = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress);
      const assets2 = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress);

      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [
          [await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, assets1, emptyBytes],
          [await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress, assets2, emptyBytes],
        ]);

      const receipt = await tx.wait();
      const events = receipt.logs
        ?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));

      expect(events.length).to.be.eq(2);
      undelegateClaimer1 = events[0].args["claimer"];
      undelegateClaimer2 = events[1].args["claimer"];

      console.log(
        "Mellow1 delegated",
        await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress),
      );
      console.log(
        "Mellow2 delegated",
        await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress),
      );

      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const totalDelegatedTo = await iVault.getDelegatedTo(
        await mellowAdapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDelegatedTo2 = await iVault.getDelegatedTo(
        await mellowAdapter.getAddress(),
        mellowVaults[1].vaultAddress,
      );
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      // console.log(`Pending from Mellow:\t\t${pendingWithdrawalsMellowAfter.format()}`);

      expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
      expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
      expect(totalDelegatedTo2).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
      expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
      // expect(pendingWithdrawalsMellowAfter).to.be.closeTo(amount + amount2, transactErr * 2n);
    });

    it("Claim Mellow withdrawal transfer funds from adapter to vault", async function() {
      await helpers.time.increase(1209900);

      const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      const totalAssetsBefore = await iVault.totalAssets();
      const withdrawalEpochBefore = await withdrawalQueue.withdrawals(undelegatedEpoch);

      const params1 = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer1]);
      const params2 = abi.encode(["address", "address"], [mellowVaults[1].vaultAddress, undelegateClaimer2]);

      await iVault
        .connect(iVaultOperator)
        .claim(
          undelegatedEpoch,
          [await mellowAdapter.getAddress(), await mellowAdapter.getAddress()],
          [mellowVaults[0].vaultAddress, mellowVaults[1].vaultAddress],
          [[params1], [params2]],
        );

      const withdrawalEpochAfter = await withdrawalQueue.withdrawals(1);
      const totalAssetsAfter = await iVault.totalAssets();

      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      expect(withdrawalEpochAfter[2] - withdrawalEpochBefore[2]).to.be.closeTo(
        pendingWithdrawalsMellowBefore,
        transactErr,
      );
    });

    it("getTotalDeposited includes redeemable amount", async function() {
      const totalDeposited = await iVault.getTotalDeposited();
      const totalDelegated = await iVault.getTotalDelegated();
      const totalAssets = await iVault.totalAssets();
      const totalPendingWithdrawals = await iVault.getTotalPendingWithdrawals();
      const totalPendingEmergencyWithdrawals = await iVault.getTotalPendingEmergencyWithdrawals();
      const redeemable = await iVault.redeemReservedAmount();

      expect(totalDeposited).to.be.eq(
        totalDelegated + totalAssets + totalPendingWithdrawals + totalPendingEmergencyWithdrawals - redeemable,
      );
    });

    it("Staker is able to redeem", async function() {
      const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
      const redeemReserve = await iVault.redeemReservedAmount();
      const freeBalance = await iVault.getFreeBalance();

      console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
      console.log("Redeem reserve", redeemReserve.format());
      console.log("Free balance", freeBalance.format());

      console.log("Redeem reserve after", await iVault.redeemReservedAmount());
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Redeem withdraw", async function() {
      const balanceBefore = await asset.balanceOf(staker2.address);
      const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

      const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(iVaultOperator.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const balanceAfter = await asset.balanceOf(staker2.address);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      console.log(`Pending withdrawals after:\t${staker2PWAfter.format()}`);
      console.log(`Ratio after:\t\t\t\t${(await iVault.ratio()).format()}`);

      expect(staker2PWAfter).to.be.eq(0n);
      expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr + 13n);
      expect(totalDepositedAfter).to.be.closeTo(0n, transactErr + 13n);
      expect(totalAssetsAfter).to.be.closeTo(0n, transactErr + 13n);
    });
  });

  describe("Base flow with flash withdraw", function() {
    let targetCapacity, deposited, freeBalance, depositFees;
    before(async function() {
      await snapshot.restore();
      targetCapacity = e18;
      await iVault.setTargetFlashCapacity(targetCapacity); //1%
    });

    it("Initial ratio is 1e18", async function() {
      const ratio = await iVault.ratio();
      console.log(`Current ratio is:\t\t\t\t${ratio.format()}`);
      expect(ratio).to.be.eq(e18);
    });

    it("Initial delegation is 0", async function() {
      expect(await iVault.getTotalDelegated()).to.be.eq(0n);
    });

    it("Deposit to Vault", async function() {
      // made by user
      deposited = toWei(10);
      freeBalance = (deposited * (MAX_TARGET_PERCENT - targetCapacity)) / MAX_TARGET_PERCENT;
      const expectedShares = (deposited * e18) / (await iVault.ratio());
      const tx = await iVault.connect(staker).deposit(deposited, staker.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Deposit");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.closeTo(deposited, transactErr);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);
      expect(receipt.logs.find(l => l.eventName === "DepositBonus")).to.be.undefined;
      console.log(`Ratio after: ${await iVault.ratio()}`);

      expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(deposited, transactErr);
      expect(await iVault.getFlashCapacity()).to.be.closeTo(deposited, transactErr);
      expect(await iVault.getFreeBalance()).to.be.closeTo(freeBalance, transactErr);
      expect(await iVault.getTotalDeposited()).to.be.closeTo(deposited, transactErr);
      expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
      expect(await iVault.ratio()).to.be.eq(e18);
    });

    it("Delegate freeBalance", async function() {
      // made by operator
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const expectedFlashCapacity = (deposited * targetCapacity) / MAX_TARGET_PERCENT;

      const amount = await iVault.getFreeBalance();

      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes),
      )
        .to.emit(iVault, "DelegatedTo")
        .withArgs(mellowAdapter.address, mellowVaults[0].vaultAddress, amount);

      const delegatedTotal = await iVault.getTotalDelegated();
      const delegatedTo = await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress);
      expect(totalDepositedBefore).to.be.closeTo(await iVault.getTotalDeposited(), transactErr);
      expect(delegatedTotal).to.be.closeTo(amount, transactErr);
      expect(delegatedTo).to.be.closeTo(amount, transactErr);
      expect(await iVault.getFreeBalance()).to.be.closeTo(0n, transactErr);
      expect(await iVault.getFlashCapacity()).to.be.closeTo(expectedFlashCapacity, transactErr);
      expect(await iVault.ratio()).closeTo(e18, ratioErr);
    });

    it("Update asset ratio", async function() {
      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).lt(e18);
    });

    it("Flash withdraw all capacity", async function() {
      // made by user (flash capacity tests ends on this step)
      const sharesBefore = await iToken.balanceOf(staker);
      const assetBalanceBefore = await asset.balanceOf(staker);
      const treasuryBalanceBefore = await asset.balanceOf(treasury);
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalAssetsBefore = await iVault.totalAssets();
      const flashCapacityBefore = await iVault.getFlashCapacity();
      const freeBalanceBefore = await iVault.getFreeBalance();
      console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);
      console.log(`Free balance before:\t${freeBalanceBefore.format()}`);

      const amount = await iVault.getFlashCapacity();
      const shares = await iVault.convertToShares(amount);
      const receiver = staker;
      const expectedFee = await iVault.calculateFlashWithdrawFee(await iVault.convertToAssets(shares));
      console.log(`Amount:\t\t\t\t\t${amount.format()}`);
      console.log(`Shares:\t\t\t\t\t${shares.format()}`);
      console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

      let tx = await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](shares, receiver.address, 0n);
      const receipt = await tx.wait();
      const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");
      expect(withdrawEvent.length).to.be.eq(1);
      expect(withdrawEvent[0].args["sender"]).to.be.eq(staker.address);
      expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
      expect(withdrawEvent[0].args["owner"]).to.be.eq(staker.address);
      expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, transactErr);
      expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, transactErr);
      expect(withdrawEvent[0].args["fee"]).to.be.closeTo(expectedFee, transactErr);
      const collectedFees = withdrawEvent[0].args["fee"];
      depositFees = collectedFees / 2n;

      const sharesAfter = await iToken.balanceOf(staker);
      const assetBalanceAfter = await asset.balanceOf(staker);
      const treasuryBalanceAfter = await asset.balanceOf(treasury);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();
      const flashCapacityAfter = await iVault.getFlashCapacity();
      const depositBonus = await iVault.depositBonusAmount();
      console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
      console.log(`Total deposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
      console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
      console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
      console.log(`Deposit bonus:\t\t\t${depositBonus.format()}`);
      console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

      expect(sharesBefore - sharesAfter).to.be.eq(shares);
      expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
      expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
      expect(flashCapacityAfter).to.be.closeTo(0n, transactErr);
    });

    // made by user (withdrawal of funds if something left after flash withdraw)
    it("Withdraw all", async function() {
      const ratioBefore = await iVault.ratio();
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
      console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);

      const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.eq(assetValue);
      expect(events[0].args["iShares"]).to.be.eq(shares);

      const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
      const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      expect(stakerPW).to.be.eq(0n);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(epochShares).to.be.closeTo(shares, transactErr);

      console.log(`Total delegated:\t\t\t\t${(await iVault.getTotalDelegated()).format()}`);
      console.log(`Total deposited:\t\t\t\t${(await iVault.getTotalDeposited()).format()}`);
      expect(await iVault.ratio()).to.be.eq(ratioBefore);
    });

    let undelegateClaimer;

    it("Undelegate from Mellow", async function() {
      // made by operator
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      console.log(`Total deposited before:\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t${totalAssetsBefore.format()}`);
      console.log("======================================================");

      const amount = await iVault.getTotalDelegated();

      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes]]);

      const receipt = await tx.wait();
      const events = receipt.logs
        ?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));

      expect(events.length).to.be.eq(1);
      undelegateClaimer = events[0].args["claimer"];

      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const totalDelegatedTo = await iVault.getDelegatedTo(
        await mellowAdapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());

      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      console.log(`Pending from Mellow:\t\t${pendingWithdrawalsMellowAfter.format()}`);

      // expect(totalAssetsAfter).to.be.eq(totalAssetsBefore); //Nothing has come to the iVault yet
      expect(totalDelegatedAfter).to.be.closeTo(0, transactErr);
      expect(totalDelegatedTo).to.be.closeTo(0, transactErr); //Everything was requested for withdrawal from Mellow
      expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
    });

    // made by operator
    it("Claim Mellow withdrawal transfer funds from adapter to vault", async function() {
      await helpers.time.increase(1209900);

      const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      const totalAssetsBefore = await iVault.totalAssets();
      // const adapterBalanceBefore = await asset.balanceOf(mellowAdapter.address);
      const withdrawalEpochBefore = await withdrawalQueue.withdrawals(1);

      const params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer]);
      await iVault
        .connect(iVaultOperator)
        .claim(1, [await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [[params]]);

      const withdrawalEpochAfter = await withdrawalQueue.withdrawals(1);
      const totalAssetsAfter = await iVault.totalAssets();
      // const adapterBalanceAfter = await asset.balanceOf(mellowAdapter.address);

      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      expect(withdrawalEpochAfter[2] - withdrawalEpochBefore[2]).to.be.closeTo(
        pendingWithdrawalsMellowBefore,
        transactErr,
      );
      // expect(adapterBalanceBefore - adapterBalanceAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
    });

    // made by user
    it("Staker is able to redeem", async function() {
      const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
      const redeemReserve = await iVault.redeemReservedAmount();
      const freeBalance = await iVault.getFreeBalance();

      console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
      console.log("Redeem reserve", redeemReserve.format());
      console.log("Free balance", freeBalance.format());

      console.log("Redeem reserve after", await iVault.redeemReservedAmount());
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    // made by operator
    it("Redeem withdraw", async function() {
      const balanceBefore = await asset.balanceOf(staker2.address);
      const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

      const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(iVaultOperator.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const balanceAfter = await asset.balanceOf(staker2.address);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
      console.log(`Pending withdrawals after:\t${staker2PWAfter.format()}`);
      console.log(`Ratio after:\t\t\t\t${(await iVault.ratio()).format()}`);

      expect(staker2PWAfter).to.be.eq(0n);
      expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(0n, transactErr * 3n);
      expect(totalAssetsAfter).to.be.closeTo(depositFees, transactErr * 3n);
    });
  });
});
