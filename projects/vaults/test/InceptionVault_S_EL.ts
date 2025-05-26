import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ZeroAddress } from "ethers";
import hardhat from "hardhat";
import { wstETH } from "./data/assets/stETH";
import { vaults } from "./data/vaults";
import {
  addRewardsToStrategy,
  calculateRatio,
  e18,
  mineBlocks,
  toWei,
} from "./helpers/utils";
import { adapters, emptyBytes } from "./src/constants";
import { abi, initVault } from "./src/init-vault";

const { ethers, upgrades, network } = hardhat;
const assetData = wstETH;
const eigenLayerVaults = vaults.eigenLayer;

describe(`Inception Symbiotic Vault ${assetData.assetName}`, function() {
  const coder = abi;
  const encodedSignatureWithExpiry = coder.encode(
    ["tuple(uint256 expiry, bytes signature)"], [{ expiry: 0, signature: ethers.ZeroHash }],
  );
  const delegateData = [ethers.ZeroHash, encodedSignatureWithExpiry];

  let iToken, iVault, ratioFeed, asset, eigenLayerAdapter, withdrawalQueue;
  let iVaultOperator, deployer, staker, staker2, staker3, treasury;
  let ratioErr, transactErr;
  let snapshot;

  before(async function() {
    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: assetData.url ? assetData.url : network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, ratioFeed, asset, iVaultOperator, eigenLayerAdapter, withdrawalQueue } =
      await initVault(assetData, {
        adapters: [adapters.EigenLayer],
        eigenAdapterContractName: "InceptionEigenAdapter",
      }));

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

  describe("InceptionEigenAdapter", function() {
    let adapter, iVaultMock, trusteeManager;

    beforeEach(async function() {
      await snapshot.restore();
      iVaultMock = staker2;
      trusteeManager = staker3;

      console.log(`iVaultMock balance of asset after: ${await asset.balanceOf(iVaultMock.address)}`);
      console.log(`trusteeManager balance of asset after: ${await asset.balanceOf(trusteeManager.address)}`);

      const InceptionEigenAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter", iVaultMock);
      adapter = await upgrades.deployProxy(InceptionEigenAdapterFactory, [
        await deployer.getAddress(),
        assetData.rewardsCoordinator,
        assetData.delegationManager,
        assetData.strategyManager,
        assetData.assetStrategy,
        assetData.assetAddress,
        trusteeManager.address,
        iVault.address,
      ]);
    });

    it("getOperatorAddress: equals 0 address before any delegation", async function() {
      expect(await adapter.getOperatorAddress()).to.be.eq(ethers.ZeroAddress);
    });

    it("getOperatorAddress: reverts when _data length is < 2", async function() {
      const amount = toWei(0);
      console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
      await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
      await expect(adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], amount, [])).to.be.revertedWithCustomError(adapter, "InvalidDataLength");
    });

    it("getOperatorAddress: equals operator after delegation", async function() {
      console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
      await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);
      expect(await adapter.getOperatorAddress()).to.be.eq(eigenLayerVaults[0]);
    });

    it("delegateToOperator: reverts when called by not a trustee", async function() {
      const amount = toWei(1);
      await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
      await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

      await expect(
        adapter.connect(staker).delegate(eigenLayerVaults[0], 0n, delegateData),
      ).to.be.revertedWithCustomError(adapter, "NotVaultOrTrusteeManager");
    });

    it("delegateToOperator: reverts when delegates to 0 address", async function() {
      const amount = toWei(1);
      await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
      await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

      await expect(
        adapter.connect(trusteeManager).delegate(ethers.ZeroAddress, 0n, delegateData),
      ).to.be.revertedWithCustomError(adapter, "NullParams");
    });

    it("delegateToOperator: reverts when delegates unknown operator", async function() {
      const amount = toWei(1);
      await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
      await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);

      const unknownOperator = ethers.Wallet.createRandom().address;
      await expect(adapter.connect(trusteeManager)
        .delegate(unknownOperator, 0n, delegateData))
        .to.be.revertedWithCustomError(iVault, "OperatorNotRegistered");
    });

    it("withdrawFromEL: reverts when called by not a trustee", async function() {
      const amount = toWei(1);
      await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
      await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);
      await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);

      await expect(adapter.connect(staker).withdraw(ZeroAddress, amount / 2n, [], false)).to.be.revertedWithCustomError(
        adapter,
        "NotVaultOrTrusteeManager",
      );
    });

    it("getVersion: equals 3", async function() {
      expect(await adapter.getVersion()).to.be.eq(3);
    });

    it("pause(): only owner can", async function() {
      expect(await adapter.paused()).is.false;
      await adapter.connect(iVaultMock).pause();
      expect(await adapter.paused()).is.true;
    });

    it("pause(): another address can not", async function() {
      await expect(adapter.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("unpause(): only owner can", async function() {
      await adapter.connect(iVaultMock).pause();
      expect(await adapter.paused()).is.true;

      await adapter.connect(iVaultMock).unpause();
      expect(await adapter.paused()).is.false;
    });

    it("unpause(): another address can not", async function() {
      await adapter.connect(iVaultMock).pause();
      expect(await adapter.paused()).is.true;
      await expect(adapter.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("EigenLayer | Base flow no flash", function() {
    let delegatedEL = 0n;
    let tx;
    let undelegateEpoch;

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
      const totalDeposited = toWei(20);
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
      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
    });

    it("Delegate to EigenLayer#1", async function() {
      const amount = (await iVault.getFreeBalance()) / 3n;
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);

      delegatedEL += amount;
    });

    it("Delegate all to eigenOperator#1", async function() {
      const amount = await iVault.getFreeBalance();
      expect(amount).to.be.gt(0n);
      const totalAssetsBefore = await iVault.totalAssets();

      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
      delegatedEL += amount;
    });

    it("Update ratio", async function() {
      const ratio = await iVault.ratio();
      console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).eq(ratio);
    });

    it("Update asset ratio", async function() {
      console.log("totalDelegatedBefore", await iVault.getTotalDelegated());
      await addRewardsToStrategy(assetData.assetStrategy, e18, staker3);
      console.log("totalDelegatedAfter", await iVault.getTotalDelegated());
      const ratio = await iVault.ratio();
      console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
      expect(await iVault.ratio()).lt(e18);
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

      const withdrawalEpoch = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
      const totalPW = withdrawalEpoch[1];

      expect(stakerPW).to.be.eq(0n);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(totalPW).to.be.closeTo(shares, transactErr);
    });

    // it("Update ratio after all shares burn", async function () {
    //   const calculatedRatio = await iVault.ratio();
    //   console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
    //   expect(calculatedRatio).to.be.eq(999999045189759685n); //Because all shares have been burnt at this point
    //
    //   await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
    //   console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
    //   expect(await iVault.ratio()).eq(calculatedRatio);
    // });

    it("Undelegate from EigenLayer", async function() {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      undelegateEpoch = await withdrawalQueue.currentEpoch();

      console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

      tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(),
          [[eigenLayerAdapter.address, eigenLayerVaults[0], totalDelegatedBefore, []]],
        );
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
    });

    it("Claim from EigenLayer", async function() {
      const receipt = await tx.wait();

      const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter");
      let withdrawalQueuedEvent;
      receipt.logs.forEach(log => {
        try {
          const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
          if (parsedLog) {
            console.log("🔹 Event Detected:");
            console.log(parsedLog);
            withdrawalQueuedEvent = parsedLog.args;
            return;
          }
        } catch (error) {
        }
      });

      const wData = {
        staker1: withdrawalQueuedEvent["stakerAddress"],
        staker2: eigenLayerVaults[0],
        staker3: eigenLayerAdapter.address,
        nonce1: withdrawalQueuedEvent["nonce"],
        nonce2: withdrawalQueuedEvent["withdrawalStartBlock"],
        tokens: [withdrawalQueuedEvent["strategy"]],
        shares: [withdrawalQueuedEvent["shares"]],
      };

      console.log(wData);

      // Encode the data
      const _data = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      await mineBlocks(50);

      await iVault.connect(iVaultOperator).claim(
        undelegateEpoch, [eigenLayerAdapter.address], [eigenLayerVaults[0]], [_data],
      );

      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();

      console.log(`Total deposited after claim:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated after claim:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets after claim:\t\t\t${totalAssetsBefore.format()}`);
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

      console.log(`staker2PWBefore: ${staker2PWBefore.toString()}`);
      console.log(`staker2PWBefore: ${(await iVault.redeemReservedAmount()).toString()}`);
      console.log(`staker2PWBefore: ${(await asset.balanceOf(iVault.address)).toString()}`);
      console.log(`staker2PWBefore: ${(await eigenLayerAdapter.getDepositedShares()).toString()}`);

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
      expect(totalAssetsAfter).to.be.closeTo(0n, transactErr * 3n);
    });
  });

  describe("Emergency undelegate", function() {
    let undelegateTx;

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
      let totalDeposited = toWei(20);
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
      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
    });

    it("Delegate to EigenLayer#1", async function() {
      const amount = await iVault.getFreeBalance();
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);
      expect(await iVault.getTotalDelegated()).to.be.closeTo(toWei(20), transactErr);
    });

    it("Emergency undelegate", async function() {
      undelegateTx = await iVault.connect(iVaultOperator)
        .emergencyUndelegate([eigenLayerAdapter.address], [eigenLayerVaults[0]], [toWei(5)], [[]]);

      expect(await iVault.getTotalPendingWithdrawals()).to.be.eq(0);
      expect(await iVault.getTotalDelegated()).to.be.closeTo(toWei(15), transactErr);
      expect(await iVault.getTotalPendingEmergencyWithdrawals()).to.be.closeTo(toWei(5), transactErr);
      expect(await iVault.ratio()).to.be.closeTo(toWei(1), ratioErr);
    });

    it("User withdraw", async function() {
      const tx = await iVault.connect(staker).withdraw(toWei(2), staker);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.eq(toWei(2));
      expect(events[0].args["iShares"]).to.be.eq(toWei(2));
      expect(await iVault.ratio()).to.be.closeTo(toWei(1), ratioErr);
    });

    it("Emergency claim", async function() {
      const receipt = await undelegateTx.wait();

      const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter");
      let withdrawalQueuedEvent;
      receipt.logs.forEach(log => {
        try {
          const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
          if (parsedLog) {
            console.log("🔹 Event Detected:");
            withdrawalQueuedEvent = parsedLog.args;
            return;
          }
        } catch (error) {
        }
      });

      const wData = {
        staker1: withdrawalQueuedEvent["stakerAddress"],
        staker2: eigenLayerVaults[0],
        staker3: eigenLayerAdapter.address,
        nonce1: withdrawalQueuedEvent["nonce"],
        nonce2: withdrawalQueuedEvent["withdrawalStartBlock"],
        tokens: [withdrawalQueuedEvent["strategy"]],
        shares: [withdrawalQueuedEvent["shares"]],
      };

      console.log(wData);

      // Encode the data
      const _data = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      await mineBlocks(50);

      await iVault.connect(iVaultOperator).emergencyClaim(
        [eigenLayerAdapter.address], [eigenLayerVaults[0]], [_data],
      );

      expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(5), transactErr);
      expect(await iVault.ratio()).to.be.closeTo(toWei(1), ratioErr);
    });

    it("Force undelegate & claim", async function() {
      await iVault.connect(iVaultOperator).undelegate(await withdrawalQueue.currentEpoch(), []);

      expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(5), transactErr);
      expect(await withdrawalQueue.totalAmountRedeem()).to.be.closeTo(toWei(2), transactErr);
      expect(await iVault.ratio()).to.be.closeTo(toWei(1), ratioErr);
      // ----------------
    });

    it("Redeem", async function() {
      const tx = await iVault.connect(staker).redeem(staker.address);
      const receipt = await tx.wait();
      const events = receipt.logs?.filter(e => e.eventName === "Redeem");

      expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
      expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(3), transactErr);
      expect(await iVault.ratio()).to.be.closeTo(toWei(1), ratioErr);
    });
  });

  describe("Two adapters", function() {
    let eigenLayerAdapter2, undelegateEpoch, tx;
    let totalDeposited = 0n;

    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("Add second adapter", async function() {
      let [deployer] = await ethers.getSigners();
      const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter");

      eigenLayerAdapter2 = await upgrades.deployProxy(eigenLayerAdapterFactory, [
        await deployer.getAddress(),
        assetData.rewardsCoordinator,
        assetData.delegationManager,
        assetData.strategyManager,
        assetData.assetStrategy,
        assetData.assetAddress,
        assetData.iVaultOperator,
        iVault.address,
      ]);

      eigenLayerAdapter2.address = await eigenLayerAdapter2.getAddress();
      await iVault.addAdapter(eigenLayerAdapter2.address);
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
      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
    });

    it("Delegate to EigenLayer", async function() {
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, toWei(10), []);

      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter2.address, eigenLayerVaults[1], 0n, delegateData);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter2.address, ZeroAddress, toWei(10), []);

      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
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

      const withdrawalEpoch = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
      const totalPW = withdrawalEpoch[1];

      expect(stakerPW).to.be.eq(0n);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(totalPW).to.be.closeTo(shares, transactErr);
    });

    it("Undelegate from EigenLayer", async function() {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();

      const delegatedTo1 = await iVault.getDelegatedTo(eigenLayerAdapter.address, eigenLayerVaults[0]);
      const delegatedTo2 = await iVault.getDelegatedTo(eigenLayerAdapter2.address, eigenLayerVaults[1]);

      undelegateEpoch = await withdrawalQueue.currentEpoch();

      console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
      console.log(`Delegated to 1:\t\t\t${delegatedTo1.format()}`);
      console.log(`Delegated to 2:\t\t\t${delegatedTo2.format()}`);

      tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(),
          [
            [eigenLayerAdapter.address, eigenLayerVaults[0], delegatedTo1, []],
            [eigenLayerAdapter2.address, eigenLayerVaults[1], delegatedTo2, []],
          ]);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
      console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);

      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
    });

    it("Claim from EigenLayer", async function() {
      const receipt = await tx.wait();

      const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter");
      let withdrawalQueuedEvent = [];
      receipt.logs.forEach(log => {
        try {
          const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
          if (parsedLog && parsedLog.name == "StartWithdrawal") {
            withdrawalQueuedEvent.push(parsedLog.args);
          }
        } catch (error) {
        }
      });

      const wData = {
        staker1: withdrawalQueuedEvent[0]["stakerAddress"],
        staker2: eigenLayerVaults[0],
        staker3: eigenLayerAdapter.address,
        nonce1: withdrawalQueuedEvent[0]["nonce"],
        nonce2: withdrawalQueuedEvent[0]["withdrawalStartBlock"],
        tokens: [withdrawalQueuedEvent[0]["strategy"]],
        shares: [withdrawalQueuedEvent[0]["shares"]],
      };

      console.log(wData);

      // Encode the data
      const _data = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      const wData2 = {
        staker1: withdrawalQueuedEvent[1]["stakerAddress"],
        staker2: eigenLayerVaults[1],
        staker3: eigenLayerAdapter2.address,
        nonce1: withdrawalQueuedEvent[1]["nonce"],
        nonce2: withdrawalQueuedEvent[1]["withdrawalStartBlock"],
        tokens: [withdrawalQueuedEvent[1]["strategy"]],
        shares: [withdrawalQueuedEvent[1]["shares"]],
      };

      // Encode the data
      const _data2 = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData2]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      await mineBlocks(50);

      await iVault.connect(iVaultOperator).claim(
        undelegateEpoch,
        [eigenLayerAdapter.address, eigenLayerAdapter2.address],
        [eigenLayerVaults[0], eigenLayerVaults[1]],
        [_data, _data2],
      );

      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();

      console.log(`Total deposited after claim:\t\t\t${totalDepositedBefore.format()}`);
      console.log(`Total delegated after claim:\t\t\t${totalDelegatedBefore.format()}`);
      console.log(`Total assets after claim:\t\t\t${totalAssetsBefore.format()}`);

      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
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

      console.log(`staker2PWBefore: ${staker2PWBefore.toString()}`);
      console.log(`staker2PWBefore: ${(await iVault.redeemReservedAmount()).toString()}`);
      console.log(`staker2PWBefore: ${(await asset.balanceOf(iVault.address)).toString()}`);
      console.log(`staker2PWBefore: ${(await eigenLayerAdapter.getDepositedShares()).toString()}`);

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
      expect(totalAssetsAfter).to.be.closeTo(0n, transactErr * 3n);

      expect(await iVault.ratio()).to.be.closeTo(e18, 1n);
    });
  });

  describe("Emergency undelegate cannot finish normal undelegation flow", function() {
    it("deposit & delegate & undelegate", async function() {
      const elVault = eigenLayerVaults[0];
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);

      // deposit & delegate 10
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, elVault, 0n, delegateData);
      await iVault.connect(iVaultOperator).delegate(await eigenLayerAdapter.getAddress(), ZeroAddress, toWei(9), []);

      // withdraw 3
      await iVault.connect(staker).withdraw(toWei(3), staker.address);

      // emergency undelegate 5
      await iVault.connect(iVaultOperator).emergencyUndelegate([await eigenLayerAdapter.getAddress()], [elVault], [toWei(5)], [[]]);
      // normal undelegate 3
      let tx = await iVault.connect(iVaultOperator).undelegate(await withdrawalQueue.currentEpoch(), [[await eigenLayerAdapter.getAddress(), elVault, toWei(3), []]]);

      // get emergency claimer
      const receipt = await tx.wait();

      const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapter");
      let withdrawalQueuedEvent;
      receipt.logs.forEach(log => {
        try {
          const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
          if (parsedLog) {
            console.log("🔹 Event Detected:");
            withdrawalQueuedEvent = parsedLog.args;
            return;
          }
        } catch (error) {
        }
      });

      const wData = {
        staker1: withdrawalQueuedEvent["stakerAddress"],
        staker2: elVault,
        staker3: eigenLayerAdapter.address,
        nonce1: withdrawalQueuedEvent["nonce"],
        nonce2: withdrawalQueuedEvent["withdrawalStartBlock"],
        tokens: [withdrawalQueuedEvent["strategy"]],
        shares: [withdrawalQueuedEvent["shares"]],
      };

      // Encode the data
      const _data = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      await mineBlocks(50);

      // claim
      await expect(iVault.connect(iVaultOperator).emergencyClaim([eigenLayerAdapter.address], [elVault], [_data]))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "OnlyEmergency");
    });
  });

  describe("Eigenlayer: redelegate & undelegate", function() {
    beforeEach(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);

      // deposit
      let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);

      // delegate
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, toWei(5), []);
      await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);
    });

    it("should be able to re-delegate", async function() {
      // redelegate to a new operator
      let tx = await eigenLayerAdapter.connect(iVaultOperator).redelegate(vaults.eigenLayer[1], {
        signature: "0x",
        expiry: 0,
      }, ethers.ZeroHash);
      let receipt = await tx.wait();

      // check that required events are emitted
      expect(tx).to.be.emit(eigenLayerAdapter, "RedelegatedTo");
      expect(tx).to.be.emit(eigenLayerAdapter, "WithdrawalsQueued");

      // check that operator has been updated in EL
      const delegationManager = await ethers.getContractAt("IDelegationManager", assetData.delegationManager);
      expect(await delegationManager.delegatedTo(eigenLayerAdapter.address)).to.be.eq(vaults.eigenLayer[1]);

      // check that queued withdrawal root exists
      const withdrawalRoots = receipt.logs.filter(e => e.eventName === "WithdrawalsQueued")[0].args["withdrawalRoots"][0];
      const queuedWithdrawalRoots = await delegationManager.getQueuedWithdrawalRoots(eigenLayerAdapter.address);
      expect(queuedWithdrawalRoots.length).to.be.eq(1);
      expect(queuedWithdrawalRoots[0]).to.be.eq(withdrawalRoots);

      // check that total deposited zero
      expect(await eigenLayerAdapter.getTotalDeposited()).to.be.eq(0n);

      // claim withdrawals
      const queuedWithdrawal = (await delegationManager.getQueuedWithdrawals(eigenLayerAdapter.address))[0][0];
      const claimData = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [queuedWithdrawal]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[false]]),
      ];

      await mineBlocks(50);
      await eigenLayerAdapter.connect(iVaultOperator).claim(claimData, false);
      // ------------------------------

      // Check that total deposited equal to previous
      expect(await eigenLayerAdapter.getTotalDeposited()).to.be.closeTo(toWei(5), transactErr);
    });

    it("should be able to undelegate", async function() {
      const vaultBalanceBefore = await iVault.totalAssets();

      // undelegate operator
      let tx = await eigenLayerAdapter.connect(iVaultOperator).undelegate();
      let receipt = await tx.wait();

      // check that required events are emitted
      expect(tx).to.be.emit(eigenLayerAdapter, "RedelegatedTo");
      expect(tx).to.be.emit(eigenLayerAdapter, "WithdrawalsQueued");

      // check that operator has been updated in EL
      const delegationManager = await ethers.getContractAt("IDelegationManager", assetData.delegationManager);
      expect(await delegationManager.delegatedTo(eigenLayerAdapter.address)).to.be.eq(ZeroAddress);

      // check that queued withdrawal root exists
      const withdrawalRoots = receipt.logs.filter(e => e.eventName === "WithdrawalsQueued")[0].args["withdrawalRoots"][0];
      const queuedWithdrawalRoots = await delegationManager.getQueuedWithdrawalRoots(eigenLayerAdapter.address);
      expect(queuedWithdrawalRoots.length).to.be.eq(1);
      expect(queuedWithdrawalRoots[0]).to.be.eq(withdrawalRoots);

      // claim withdrawals
      const queuedWithdrawal = (await delegationManager.getQueuedWithdrawals(eigenLayerAdapter.address))[0][0];
      const claimData = [
        coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [queuedWithdrawal]),
        coder.encode(["address[][]"], [[[assetData.assetAddress]]]),
        coder.encode(["bool[]"], [[true]]),
      ];

      await mineBlocks(50);
      await eigenLayerAdapter.connect(iVaultOperator).claim(claimData, false);
      // ------------------------------

      // check that total deposited equal to zero
      // check that vault balance increased
      const vaultBalanceAfter = await iVault.totalAssets();
      expect(await eigenLayerAdapter.getTotalDeposited()).to.be.eq(0);
      expect(vaultBalanceAfter - vaultBalanceBefore).to.be.closeTo(toWei(5), transactErr);
    });
  });

  describe("Eigenlayer: rewards", function() {
    it("Can be called only by trustee", async function() {
      await expect(eigenLayerAdapter.connect(staker).claimRewards(assetData.assetAddress, "0x"))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "NotVaultOrTrusteeManager");
    });

    it("Can set rewards coordinator", async function() {
      await expect(eigenLayerAdapter.setRewardsCoordinator(assetData.rewardsCoordinator, ethers.Wallet.createRandom().address))
        .to.be.emit(eigenLayerAdapter, "RewardCoordinatorChanged");
    });
  });

  describe("Eigenlayer: input args", function() {
    beforeEach(async function() {
      await snapshot.restore();
    });

    it("Delegate: input args", async function() {
      await eigenLayerAdapter.pause();
      await expect(eigenLayerAdapter.connect(iVaultOperator).delegate(eigenLayerVaults[0], 0n, []))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Undelegate: input args", async function() {
      await expect(eigenLayerAdapter.connect(staker).undelegate())
        .to.be.revertedWithCustomError(eigenLayerAdapter, "NotVaultOrTrusteeManager");

      await eigenLayerAdapter.pause();
      await expect(eigenLayerAdapter.connect(iVaultOperator).undelegate())
        .to.be.revertedWith("Pausable: paused");
    });

    it("Redelegate: input args", async function() {
      await expect(eigenLayerAdapter.connect(staker).redelegate(
        vaults.eigenLayer[1], {
          signature: "0x",
          expiry: 0,
        }, ethers.ZeroHash,
      )).to.be.revertedWithCustomError(eigenLayerAdapter, "NotVaultOrTrusteeManager");

      await expect(eigenLayerAdapter.connect(iVaultOperator).redelegate(
        ZeroAddress, {
          signature: "0x",
          expiry: 0,
        }, ethers.ZeroHash,
      )).to.be.revertedWithCustomError(eigenLayerAdapter, "ZeroAddress");

      await eigenLayerAdapter.pause();
      await expect(eigenLayerAdapter.connect(iVaultOperator).redelegate(
        ZeroAddress, {
          signature: "0x",
          expiry: 0,
        }, ethers.ZeroHash,
      )).to.be.revertedWith("Pausable: paused");
    });

    it("Withdraw: input args", async function() {
      await expect(eigenLayerAdapter.connect(iVaultOperator).withdraw(ZeroAddress, 0n, ["0x"], false))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "InvalidDataLength");

      await eigenLayerAdapter.pause();
      await expect(eigenLayerAdapter.connect(iVaultOperator).withdraw(ZeroAddress, 0n, [], false))
        .to.be.revertedWith("Pausable: paused");
    });

    it("Claim: input args", async function() {
      await expect(eigenLayerAdapter.connect(staker).claim([], false))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "NotVaultOrTrusteeManager");

      await expect(eigenLayerAdapter.connect(iVaultOperator).claim(["0x", "0x"], false))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "InvalidDataLength");

      await expect(eigenLayerAdapter.connect(iVaultOperator).claim(["0x", "0x", "0x", "0x"], false))
        .to.be.revertedWithCustomError(eigenLayerAdapter, "InvalidDataLength");

      await eigenLayerAdapter.pause();
      await expect(eigenLayerAdapter.connect(iVaultOperator).claim([], false))
        .to.be.revertedWith("Pausable: paused");
    });
  });
});

