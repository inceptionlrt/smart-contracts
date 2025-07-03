import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { calculateRatio, e18, impersonateWithEth, setBlockTimestamp, toWei } from "../helpers/utils";
import { adapters, emptyBytes } from "../src/constants";
import { abi, initVault, MAX_TARGET_PERCENT } from "../src/init-vault-new";
import { testrunConfig } from "../testrun.config";

const { ethers, network } = hardhat;
const assetData = testrunConfig.assetData;
const mellowVaults = assetData.adapters.mellowV3;

describe(`Baseflow using adapter for Mellow MultiVault ${assetData.asset.name}`, function () {
  this.timeout(150000);
  let iToken, iVault, ratioFeed, asset, mellowAdapter, symbioticAdapter, mellowV3Adapter, withdrawalQueue;
  let iVaultOperator, deployer, staker, staker2, staker3, treasury;
  let ratioErr, transactErr;
  let snapshot;
  let params;

  before(async function () {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.asset.name.toLowerCase())) {
        console.log(`${assetData.asset.name} is not in the list, going to skip`);
        this.skip();
      }
    }
    console.log("==============================");
    console.log(adapters.MellowV3);
    console.log("==============================");

    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({
      iToken,
      iVault,
      ratioFeed,
      asset,
      iVaultOperator,
      mellowAdapter,
      mellowV3Adapter,
      symbioticAdapter,
      withdrawalQueue,
    } = await initVault(assetData, { adapters: [adapters.MellowV3] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [deployer, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);
    treasury = await iVault.treasury(); //deployer

    snapshot = await helpers.takeSnapshot();
  });

  after(async function () {
    if (iVault) {
      await iVault.removeAllListeners();
    }
  });

  describe("Base flow no flash", function () {
    before(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    let totalDeposited, delegatedMellow, undelegatedEpoch;
    let rewardsMellow = 0n;

    it("Initial stats", async function () {
      expect(await iVault.ratio()).to.be.eq(e18);
      expect(await iVault.totalAssets()).to.be.eq(0n);
      expect(await iVault.getTotalDeposited()).to.be.eq(0n);
      expect(await iVault.getTotalDelegated()).to.be.eq(0n);
      expect(await iVault.getFlashCapacity()).to.be.eq(0n);
      expect(await iVault.getFreeBalance()).to.be.eq(0n);
    });

    it("User can deposit to iVault", async function () {
      totalDeposited = toWei(20);
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

    it("Delegate to mellowVault#1", async function () {
      const amount = await iVault.getFreeBalance();
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
      delegatedMellow = amount;

      const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowV3Adapter.address);
      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const delegatedTo = await iVault.getDelegatedTo(await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress);
      const totalDepositedAfter = await iVault.getTotalDeposited();

      console.log("Mellow LP token balance: ", mellowBalance.format());
      console.log("Amount delegated: ", delegatedMellow.format());

      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
      expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr);
      expect(delegatedTo).to.be.closeTo(amount, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr);
      expect(mellowBalance).to.be.gte(amount / 2n);
      expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
    });

    it("Update ratio", async function () {
      const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
      console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).eq(ratio);
    });

    it("Add rewards to Mellow protocol and estimate ratio", async function () {
      const ratioBefore = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToBefore = await iVault.getDelegatedTo(
        await mellowV3Adapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
      console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

      const wstETHAsset = await ethers.getContractAt("IERC20", assetData.asset.address);
      await wstETHAsset.connect(staker3).transfer(mellowVaults[0].vaultAddress, e18);

      const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);
      const totalDelegatedToAfter = await iVault.getDelegatedTo(
        await mellowV3Adapter.getAddress(),
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

    it("Estimate the amount that user can withdraw", async function () {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      expect(assetValue).closeTo(totalDeposited + rewardsMellow, transactErr * 10n);
    });

    it("User can withdraw all", async function () {
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

    let undelegateClaimer1;
    let undelegateClaimer2;

    it("Undelegate from Mellow", async function () {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();

      console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
      console.log(
        "Mellow1 delegated",
        await iVault.getDelegatedTo(await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress),
      );

      const assets1 = await iVault.getDelegatedTo(await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress);

      undelegatedEpoch = await withdrawalQueue.currentEpoch();
      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(undelegatedEpoch, [
          [await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress, assets1, []],
        ]);

      const receipt = await tx.wait();
      const events = receipt.logs
        ?.filter(log => log.address === mellowV3Adapter.address)
        .map(log => mellowV3Adapter.interface.parseLog(log));
      expect(events.length).to.be.eq(2);
      undelegateClaimer1 = events[1].args["claimer"];

      console.log(
        "Mellow1 delegated",
        await iVault.getDelegatedTo(await mellowV3Adapter.getAddress(), mellowVaults[0].vaultAddress),
      );

      const totalAssetsAfter = await iVault.totalAssets();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const totalDelegatedTo = await iVault.getDelegatedTo(
        await mellowV3Adapter.getAddress(),
        mellowVaults[0].vaultAddress,
      );
      const totalDepositedAfter = await iVault.getTotalDeposited();
      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);

      expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
      expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
      // expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
    });

    it("Claim from Mellow", async function () {
      await helpers.time.increase(1209900);

      const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawals(await mellowV3Adapter.getAddress());
      const totalAssetsBefore = await iVault.totalAssets();
      const withdrawalEpochBefore = await withdrawalQueue.withdrawals(undelegatedEpoch);

      const params1 = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer1]);

      await iVault
        .connect(iVaultOperator)
        .claim(undelegatedEpoch, [mellowV3Adapter.address], [mellowVaults[0].vaultAddress], [[params1]]);

      const withdrawalEpochAfter = await withdrawalQueue.withdrawals(1);
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
      console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);

      // expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      // expect(withdrawalEpochAfter[2] - withdrawalEpochBefore[2]).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
    });

    it("Staker is able to redeem", async function () {
      const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
      const redeemReserve = await iVault.redeemReservedAmount();
      const freeBalance = await iVault.getFreeBalance();

      console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
      console.log("Redeem reserve", redeemReserve.format());
      console.log("Free balance", freeBalance.format());

      console.log("Redeem reserve after", await iVault.redeemReservedAmount());
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Redeem withdraw", async function () {
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
});

