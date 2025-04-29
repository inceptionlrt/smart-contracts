// Just slashing tests for all adapters

import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { calculateRatio, setBlockTimestamp, toWei } from "./helpers/utils";
import { adapters, emptyBytes } from './src/constants';
import { abi, initVault } from "./src/init-vault-new";
import {testrunConfig} from './testrun.config';

const assetDataNew = testrunConfig.assetData;

const mellowVaults = assetDataNew.adapters.mellow;
const symbioticVaults = assetDataNew.adapters.symbiotic;
const { ethers, network, upgrades } = hardhat;

async function skipEpoch(symbioticVault) {
  let epochDuration = await symbioticVault.vault.epochDuration();
  let nextEpochStart = await symbioticVault.vault.nextEpochStart();
  await setBlockTimestamp(Number(nextEpochStart + epochDuration + 1n));
}

async function symbioticClaimParams(symbioticVault, claimer) {
  return abi.encode(
    ["address", "uint256", "address"],
    [symbioticVault.vaultAddress, (await symbioticVault.vault.currentEpoch()) - 1n, claimer],
  );
}

async function mellowClaimParams(mellowVault, claimer) {
  return abi.encode(["address", "address"], [mellowVault.vaultAddress, claimer]);
}

let iToken, iVault, ratioFeed, asset, mellowAdapter, symbioticAdapter, iLibrary, withdrawalQueue;
let iVaultOperator, deployer, staker, staker2, staker3, treasury;
let ratioErr, transactErr;
let snapshot;
let params;

describe("Symbiotic Vault Slashing", function () {

  before(async function () {
    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: network.config.forking.url,
          blockNumber: assetDataNew.blockNumber ? assetDataNew.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, symbioticAdapter, iLibrary, withdrawalQueue } =
      await initVault(assetDataNew, { adapters: [adapters.Mellow, adapters.Symbiotic] }));
    ratioErr = assetDataNew.ratioErr;
    transactErr = assetDataNew.transactErr;

    [deployer, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetDataNew.impersonateStaker(staker, iVault);
    staker2 = await assetDataNew.impersonateStaker(staker2, iVault);
    staker3 = await assetDataNew.impersonateStaker(staker3, iVault);
    treasury = await iVault.treasury(); //deployer

    snapshot = await helpers.takeSnapshot();
  });

  after(async function () {
    if (iVault) {
      await iVault.removeAllListeners();
    }
  });

  describe(`Symbiotic ${assetDataNew.asset.name}`, function () {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    // flow: deposit -> delegate -> withdraw -> undelegate -> claim -> redeem
    it("one withdrawal without slash", async function () {
      const depositAmount = toWei(10);
      // deposit
      let tx = await iVault.connect(staker).deposit(depositAmount, staker.address);
      await tx.wait();
      // assert vault balance (token/asset)
      expect(await asset.balanceOf(iVault.address)).to.be.eq(depositAmount);
      expect(await iToken.totalSupply()).to.be.eq(depositAmount);
      expect(await iVault.totalAssets()).to.be.eq(depositAmount);
      // assert user balance (shares)
      expect(await iToken.balanceOf(staker.address)).to.be.eq(depositAmount);
      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes);
      await tx.wait();
      // assert delegated amount
      expect(await iVault.getTotalDelegated()).to.be.eq(depositAmount);
      // assert vault balance (token/asset)
      expect(await iToken.totalSupply()).to.be.eq(depositAmount);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await iVault.totalAssets()).to.be.eq(0);

      // one withdraw
      let shares = await iToken.balanceOf(staker.address);
      tx = await iVault.connect(staker).withdraw(shares, staker.address);
      await tx.wait();

      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await iVault.totalAssets()).to.be.eq(0);
      expect(await iVault.getTotalDelegated()).to.be.eq(depositAmount);
      // shares burned
      expect(await iToken.totalSupply()).to.be.eq(0);
      expect(await iToken.balanceOf(staker.address)).to.be.eq(0);

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));

      expect(await withdrawalQueue.currentEpoch()).to.be.eq(1, 'Current epoch should be 1');
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(depositAmount);

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      expect(epochShares).to.be.eq(shares);
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      const adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      // assert balances
      expect(await iVault.getTotalDelegated()).to.be.eq(0);
      expect(await iToken.totalSupply()).to.be.eq(0);
      expect(events[0].args["epoch"]).to.be.eq(1);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(0);
      expect(await withdrawalQueue.currentEpoch()).to.be.eq(2, 'Current epoch should be 2');

      expect(events[0].args["adapter"]).to.be.eq(symbioticAdapter.address);
      expect(events[0].args["actualAmounts"]).to.be.eq(depositAmount);
      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      const params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(depositAmount);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(depositAmount);

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(0);

      expect(events[0].args["amount"]).to.be.closeTo(depositAmount, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------
    });

    // flow:
    // deposit -> delegate -> withdraw -> undelegate -> claim ->
    // withdraw -> slash -> undelegate -> claim -> redeem -> redeem
    it("2 withdraw & slash between undelegate", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();

      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // undelegate
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [toWei(2)], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // second withdraw
      tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // undelegate
      let amount = await iVault.convertToAssets(
        await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch()),
      );
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [amount], [emptyBytes]);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(1.8), transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> deposit #2 -> delegate -> withdraw #1 -> undelegate -> claim ->
    // withdraw #2 -> undelegate -> slash -> claim -> redeem -> redeem
    it("2 withdraw & slash after undelegate", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();

      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();
      // ----------------

      // second withdraw
      tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
      await tx.wait();
      // ----------------

      // undelegate
      const withdrawalEpoch = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      claimer = adapterEvents[0].args["claimer"];
      // ----------------

      console.log("pending withdrawals", await iVault.getTotalPendingWithdrawals());

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      console.log("pending withdrawals", await iVault.getTotalPendingWithdrawals());

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(1.8), transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> deposit #2 -> delegate #1 -> withdraw #1 -> slash -> withdraw #2 ->
    // deposit #3 -> delegate #2 -> undelegate -> claim -> redeem -> redeem
    it("slash between withdraw", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();

      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // deposit
      tx = await iVault.connect(staker3).deposit(toWei(2), staker3.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(2), emptyBytes);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // undelegate
      let epochShares = await iVault.convertToAssets(
        await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch()),
      );
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(1797344482370384621n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(1797344482370384621n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> deposit #2 -> delegate #1 -> withdraw #1 -> slash -> withdraw #2 ->
    // slash -> deposit #3 -> delegate #2 -> undelegate -> claim -> redeem -> redeem
    it("withdraw->slash->withdraw->slash", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();

      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // apply slash
      totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // deposit
      tx = await iVault.connect(staker3).deposit(toWei(2), staker3.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(2), emptyBytes);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------

      // undelegate
      let epochShares = await iVault.convertToAssets(
        await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch()),
      );
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(1614954516503730780n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(1614954516503730780n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1238424970834390498n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 -> slash -> withdraw #2 ->
    // slash -> deposit #2 -> delegate #2 -> undelegate -> claim -> redeem -> redeem
    it("withdraw all->slash->redeem all", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // undelegate
      let amount = await iVault.getTotalDelegated();

      console.log("amount", amount);
      console.log("requested", await iVault.convertToAssets(await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch())));

      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [amount], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(8986722411851923107n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 -> undelegate -> slash -> claim -> redeem
    it("slash after undelegate", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(4493361205925961555n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 -> undelegate -> claim -> deposit #2 -> slash
    it("slash after deposit", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2.5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // deposit
      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1034482758620689656n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 -> undelegate -> claim -> slash
    it("slash after claim", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2.5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1111111111111111111n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 ->  withdraw #1 -> undelegate -> slash -> claim -> redeem
    it("2 withdraw from one user in epoch", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(6290705688296346177n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------
    });

    // flow:
    // deposit #1 -> delegate #1 -> withdraw #1 -> undelegate -> slash -> claim -> withdraw -> undelegate -> claim -> redeem
    it("2 withdraw from one user in different epochs", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // apply slash
      const totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let amount = await iVault.convertToAssets(
        await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch()),
      );

      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [amount], [emptyBytes]);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(6290705688296346177n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------
    });

    it("redeem unavailable claim", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let undelegateEvents = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];
      // ----------------

      // failed redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events.length).to.be.equals(0);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(undelegateEvents[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();
      // ----------------

      // success redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(toWei(5), transactErr);
      // ----------------

      // failed redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events.length).to.be.equals(0);
      // ----------------

    });

    it("undelegate from symbiotic and mellow", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(mellowAdapter.address, mellowVaults[0].vaultAddress, toWei(5), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(4), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      tx = await iVault.connect(iVaultOperator)
        .undelegate(
          [mellowAdapter.address, symbioticAdapter.address],
          [mellowVaults[0].vaultAddress, symbioticVaults[0].vaultAddress],
          [toWei(2), toWei(2)],
          [emptyBytes, emptyBytes],
        );
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer2 = adapterEvents[0].args["claimer"];

      adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      let claimer1 = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      console.log("before", await symbioticVaults[0].vault.totalStake());
      console.log("before totalDelegated", await iVault.getTotalDelegated());
      console.log("pending withdrawals", await iVault.getTotalPendingWithdrawals());

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1053370378591850307n, ratioErr);
      // ----------------

      console.log("after", await symbioticVaults[0].vault.totalStake());
      console.log("after totalDelegated", await iVault.getTotalDelegated());

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      tx = await iVault.connect(iVaultOperator)
        .claim(
          events[0].args["epoch"],
          [mellowAdapter.address, symbioticAdapter.address],
          [mellowVaults[0].vaultAddress, symbioticVaults[0].vaultAddress],
          [[await mellowClaimParams(mellowVaults[0], claimer1)], [await symbioticClaimParams(symbioticVaults[0], claimer2)]],
        );
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1053370378591850307n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(3797334803877071085n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1053370378591850307n, ratioErr);
      // ----------------
    });

    it("partially undelegate from mellow", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(mellowAdapter.address, mellowVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      console.log("total delegated before", await iVault.getTotalDelegated());

      await assetDataNew.addRewardsMellowVault(toWei(5), mellowVaults[0].vaultAddress);

      console.log("total delegated after", await iVault.getTotalDelegated());
      console.log("request shares", await iVault.convertToAssets(toWei(5)));

      // undelegate
      tx = await iVault.connect(iVaultOperator)
        .undelegate([mellowAdapter.address], [mellowVaults[0].vaultAddress], [toWei(5)], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

      let adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(4187799577779380601n);
      expect(events[0].args["actualAmounts"]).to.be.eq(812200422220619399n);
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(0n);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(999644904143841352n, ratioErr);
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      params = await mellowClaimParams(mellowVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [mellowAdapter.address], [mellowVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.closeTo(toWei(5), transactErr);
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(0n);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(999644904143841352n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(toWei(5), transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(999644904143841352n, ratioErr);
      // ----------------
    });

    it("emergency undelegate", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // emergency undelegate
      tx = await iVault.connect(iVaultOperator)
        .emergencyUndelegate(
          [symbioticAdapter.address],
          [symbioticVaults[0].vaultAddress],
          [toWei(5)],
          [emptyBytes],
        );

      let receipt = await tx.wait();
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------

      await skipEpoch(symbioticVaults[0]);

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();
      // ----------------

      // emergency claim
      tx = await iVault.connect(iVaultOperator)
        .emergencyClaim(
          [symbioticAdapter.address],
          [symbioticVaults[0].vaultAddress],
          [[await symbioticClaimParams(symbioticVaults[0], claimer)]],
        );

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // undelegate and claim
      tx = await iVault.connect(iVaultOperator).undelegate([], [], [], []);

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(1797344482370384621n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112752741401218766n, ratioErr);
      // ----------------
    });

    it("multiple deposits and delegates", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // deposit
      tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes);
      await tx.wait();
      // ----------------

      // one withdraw
      tx = await iVault.connect(staker).withdraw(toWei(5), staker.address);
      await tx.wait();
      // ----------------

      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);

      // ----------------
      // apply slash
      let totalStake = await symbioticVaults[0].vault.totalStake();
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);
      let ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1112746792749504069n, ratioErr);

      // ----------------

      // update ratio
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      // ----------------
      // claim
      await skipEpoch(symbioticVaults[0]);
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112746792749504069n, ratioErr);

      // ----------------
      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(4493385227060883306n, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112746792749504069n, ratioErr);
      // ----------------
      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1112746792749504069n, ratioErr);
      // ----------------
    });

    it(`base flow: deposit -> delegate -> SLASH > withdraw -> undelegate -> claim -> redeem
    with check ratio after each step`, async function () {
      const depositAmount = toWei(10);
      // deposit
      let tx = await iVault.connect(staker).deposit(depositAmount, staker.address);
      await tx.wait();
      // assert vault balance (token/asset)
      expect(await asset.balanceOf(iVault.address)).to.be.eq(depositAmount);
      expect(await iToken.totalSupply()).to.be.eq(depositAmount);
      expect(await iVault.totalAssets()).to.be.eq(depositAmount);
      // assert user balance (shares)
      expect(await iToken.balanceOf(staker.address)).to.be.eq(depositAmount);

      let ratio = await calculateRatio(iVault, iToken);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      let contractRatio = await iVault.ratio();
      expect(contractRatio).to.eq(toWei(1), ratioErr);

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes);
      await tx.wait();
      // assert delegated amount
      expect(await iVault.getTotalDelegated()).to.be.eq(depositAmount);
      // assert vault balance (token/asset)
      expect(await iToken.totalSupply()).to.be.eq(depositAmount);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await iVault.totalAssets()).to.be.eq(0);

      ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1000000000000000000n, ratioErr);

      // slash
      // let totalDelegated = await iVault.getTotalDelegated();
      let totalStake = await symbioticVaults[0].vault.totalStake();

      // slash half of the stake
      await assetDataNew.applySymbioticSlash(symbioticVaults[0].vault, totalStake / 2n);
      // const totalDelegated2 = await iVault.getTotalDelegated();
      // console.log("totalDelegated", totalDelegated);
      // console.log("totalDelegated2", totalDelegated2);

      // console.log("diff", totalDelegated - totalDelegated * e18 / 2n);
      ratio = await calculateRatio(iVault, iToken);
      const totalSupply = await iToken.totalSupply();
      expect(ratio).to.be.closeTo(totalSupply * BigInt(10 ** 18) / await iVault.getTotalDelegated(), ratioErr);
      return;

      // one withdraw
      let shares = await iToken.balanceOf(staker.address);
      tx = await iVault.connect(staker).withdraw(shares, staker.address);
      await tx.wait();

      ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1000000000000000000n, ratioErr);


      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await iVault.totalAssets()).to.be.eq(0);
      expect(await iVault.getTotalDelegated()).to.be.eq(depositAmount);
      // shares burned
      expect(await iToken.totalSupply()).to.be.eq(0);
      expect(await iToken.balanceOf(staker.address)).to.be.eq(0);

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));

      expect(await withdrawalQueue.currentEpoch()).to.be.eq(1, 'Current epoch should be 1');
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(depositAmount);

      ratio = await calculateRatio(iVault, iToken);
      expect(ratio).to.be.closeTo(1000000000000000000n, ratioErr);


      // undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      expect(epochShares).to.be.eq(shares);
      tx = await iVault.connect(iVaultOperator)
        .undelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [epochShares], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      const adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      // assert balances
      expect(await iVault.getTotalDelegated()).to.be.eq(0);
      expect(await iToken.totalSupply()).to.be.eq(0);
      expect(events[0].args["epoch"]).to.be.eq(1);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(0);
      expect(await withdrawalQueue.totalSharesToWithdraw()).to.be.eq(0);
      expect(await withdrawalQueue.currentEpoch()).to.be.eq(2, 'Current epoch should be 2');


      expect(events[0].args["adapter"]).to.be.eq(symbioticAdapter.address);
      expect(events[0].args["actualAmounts"]).to.be.eq(depositAmount);
      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // claim
      await skipEpoch(symbioticVaults[0]);
      const params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .claim(events[0].args["epoch"], [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(depositAmount);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(depositAmount);

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(0);

      expect(events[0].args["amount"]).to.be.closeTo(depositAmount, transactErr);
      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------
    });
  });

  describe("Withdrawal queue: negative cases", async function () {
    let customVault, withdrawalQueue;

    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);

      [customVault] = await ethers.getSigners();
      const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
      withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [customVault.address, [], [], 0]);
      withdrawalQueue.address = await withdrawalQueue.getAddress();
    });

    it("only vault", async function () {
      await expect(withdrawalQueue.connect(staker).request(iVault.address, toWei(1)))
        .to.be.revertedWithCustomError(withdrawalQueue, "OnlyVaultAllowed");

      await expect(withdrawalQueue.connect(staker)
        .undelegate(await withdrawalQueue.currentEpoch(), [iVault.address], [iVault.address], [1n], [0n]))
        .to.be.revertedWithCustomError(withdrawalQueue, "OnlyVaultAllowed");

      await expect(withdrawalQueue.connect(staker)
        .claim(await withdrawalQueue.currentEpoch(), [iVault.address], [iVault.address], [1n]))
        .to.be.revertedWithCustomError(withdrawalQueue, "OnlyVaultAllowed");

      await expect(withdrawalQueue.connect(staker).redeem(iVault.address))
        .to.be.revertedWithCustomError(withdrawalQueue, "OnlyVaultAllowed");
    });

    it("zero value", async function () {
      await expect(withdrawalQueue.connect(customVault).request(iVault.address, 0)).to.be.revertedWithCustomError(
        withdrawalQueue, "ValueZero");

      await expect(withdrawalQueue.connect(customVault)
        .undelegate(await withdrawalQueue.currentEpoch(), [iVault.address], [iVault.address], [0], [0n]))
        .to.be.revertedWithCustomError(withdrawalQueue, "ValueZero");
    });

    it("undelegate failed", async function () {
      await withdrawalQueue.connect(customVault).request(iVault.address, toWei(5));

      await expect(withdrawalQueue.connect(customVault)
        .undelegate(2, [iVault.address], [iVault.address], [0n], [0n]))
        .to.be.revertedWithCustomError(withdrawalQueue, "UndelegateEpochMismatch()");
    });

    it("claim failed", async function () {
      await expect(
        withdrawalQueue.connect(customVault).claim(1, [mellowAdapter.address], [mellowVaults[0].vaultAddress], [1n]),
      ).to.be.revertedWithCustomError(withdrawalQueue, "ClaimUnknownAdapter");
    });

    it("initialize", async function () {
      const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
      await expect(upgrades.deployProxy(withdrawalQueueFactory, ["0x0000000000000000000000000000000000000000", [], [], 0]))
        .to.be.revertedWithCustomError(withdrawalQueue, "ValueZero");

      await expect(upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [staker.address], [], 0]))
        .to.be.revertedWithCustomError(withdrawalQueue, "ValueZero");

      await expect(withdrawalQueue.initialize(iVault.address, [], [], 0))
        .to.be.revertedWith("Initializable: contract is already initialized");
    });
  });

  describe("Withdrawal queue: legacy", async function () {
    it("Redeem", async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);

      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
      const legacyWithdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory,
        [
          iVault.address,
          [staker.address, staker2.address, staker3.address],
          [toWei(1), toWei(2.5), toWei(1.5)],
          toWei(5),
        ],
      );

      legacyWithdrawalQueue.address = await legacyWithdrawalQueue.getAddress();
      await iVault.setWithdrawalQueue(legacyWithdrawalQueue);

      expect(await legacyWithdrawalQueue.currentEpoch()).to.be.eq(2);
      expect(await legacyWithdrawalQueue.totalSharesToWithdraw()).to.be.eq(0);
      expect(await legacyWithdrawalQueue.totalAmountRedeem()).to.be.eq(toWei(5));
      expect(await legacyWithdrawalQueue.getPendingWithdrawalOf(staker.address)).to.be.eq(toWei(1));
      expect(await legacyWithdrawalQueue.getPendingWithdrawalOf(staker2.address)).to.be.eq(toWei(2.5));
      expect(await legacyWithdrawalQueue.getPendingWithdrawalOf(staker3.address)).to.be.eq(toWei(1.5));

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(1), transactErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker2).redeem(staker2.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(2.5), transactErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker3).redeem(staker3.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");
      expect(events[0].args["amount"]).to.be.closeTo(toWei(1.5), transactErr);
      // ----------------
    });
  });

  describe("pending emergency", async function () {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("symbiotic", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // emergency undelegate
      tx = await iVault.connect(iVaultOperator)
        .emergencyUndelegate([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [toWei(5)], [emptyBytes]);
      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      const adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address)
        .map(log => symbioticAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await iVault.getTotalPendingEmergencyWithdrawals()).to.be.eq(toWei(5));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      await skipEpoch(symbioticVaults[0]);

      // emergency claim
      let params = await symbioticClaimParams(symbioticVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator)
        .emergencyClaim([symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]]);
      await tx.wait();

      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(5));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // undelegate and claim
      tx = await iVault.connect(iVaultOperator).undelegate([], [], [], []);
      await tx.wait();

      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(5));
      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(toWei(2));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(3));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------
    });

    it("mellow", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();
      // ----------------

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(mellowAdapter.address, mellowVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      // ----------------

      // emergency undelegate
      tx = await iVault.connect(iVaultOperator)
        .emergencyUndelegate([mellowAdapter.address], [mellowVaults[0].vaultAddress], [toWei(5)], [emptyBytes]);
      await tx.wait();

      let receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      const adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      expect(await iVault.getTotalPendingEmergencyWithdrawals()).to.be.eq(toWei(5));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // withdraw
      tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
      await tx.wait();

      expect(await calculateRatio(iVault, iToken)).to.be.eq(toWei(1));
      // ----------------

      await skipEpoch(symbioticVaults[0]);

      // emergency claim
      let params = await mellowClaimParams(mellowVaults[0], claimer);
      tx = await iVault.connect(iVaultOperator).emergencyClaim(
        [mellowAdapter.address], [mellowVaults[0].vaultAddress], [[params]],
      );
      await tx.wait();

      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(5));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // undelegate and claim
      tx = await iVault.connect(iVaultOperator).undelegate([], [], [], []);
      await tx.wait();

      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(5));
      expect(await withdrawalQueue.totalAmountRedeem()).to.be.eq(toWei(2));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------

      // redeem
      tx = await iVault.connect(staker).redeem(staker.address);
      receipt = await tx.wait();
      events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
      expect(await asset.balanceOf(iVault.address)).to.be.eq(toWei(3));
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(toWei(1), ratioErr);
      // ----------------
    });
  });

  describe('ratio change after adding rewards', async function () {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("mellow", async function () {
      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await tx.wait();

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(mellowAdapter.address, mellowVaults[0].vaultAddress, toWei(10), emptyBytes);
      await tx.wait();
      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(1000000000000000000n, ratioErr);


      // add rewards
      const totalStake = await symbioticVaults[0].vault.totalStake();
      console.log("total delegated before", await iVault.getTotalDelegated());

      // await assetData.addRewardsMellowVault(totalStake, mellowVaults[0].vaultAddress);
      await assetDataNew.addRewardsMellowVault(toWei(10000), mellowVaults[0].vaultAddress);
      let ratio = await calculateRatio(iVault, iToken);
      console.log("total delegated after", await iVault.getTotalDelegated());

      expect(await calculateRatio(iVault, iToken)).to.be.closeTo(737886489752208013n, ratioErr);
    });

    // TODO
    // it("symbiotic", async function () {
    // });
  });
});
