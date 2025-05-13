import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { stETH } from "../../data/assets/inception-vault-s";
import { vaults } from "../../data/vaults";
import {
  calculateRatio,
  e18,
  randomAddress,
  randomBI,
  toWei,
} from "../../helpers/utils";
import { adapters, emptyBytes } from "../../src/constants";
import { abi, initVault } from "../../src/init-vault";

const { ethers, network } = hardhat;
const mellowVaults = vaults.mellow;

const assetData = stETH;
describe(`Inception Symbiotic Vault ${assetData.assetName}`, function() {
  let iToken, iVault, ratioFeed, asset, mellowAdapter, withdrawalQueue;
  let iVaultOperator, deployer, staker, staker2, staker3;
  let ratioErr, transactErr;
  let snapshot;
  let params;

  before(async function() {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.assetName.toLowerCase())) {
        console.log(`${assetData.assetName} is not in the list, going to skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [
      {
        forking: {
          jsonRpcUrl: assetData.url ? assetData.url : network.config.forking.url,
          blockNumber: assetData.blockNumber ? assetData.blockNumber : network.config.forking.blockNumber,
        },
      },
    ]);

    ({ iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, withdrawalQueue }
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [deployer, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  after(async function() {
    await iVault?.removeAllListeners();
  });

  describe("Mellow vaults management", function() {
    beforeEach(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(e18, staker.address);
    });

    it("addMellowVault reverts when already added", async function() {
      const mellowVault = mellowVaults[0].vaultAddress;
      // const wrapper = mellowVaults[0].wrapperAddress;
      await expect(mellowAdapter.addMellowVault(mellowVault)).to.revertedWithCustomError(mellowAdapter, "AlreadyAdded");
    });

    it("addMellowVault vault is 0 address", async function() {
      const mellowVault = ethers.ZeroAddress;
      // const wrapper = mellowVaults[1].wrapperAddress;
      await expect(mellowAdapter.addMellowVault(mellowVault)).to.revertedWithCustomError(mellowAdapter, "ZeroAddress");
    });

    // it("addMellowVault wrapper is 0 address", async function () {
    //   const mellowVault = mellowVaults[1].vaultAddress;
    //   const wrapper = ethers.ZeroAddress;
    //   await expect(mellowAdapter.addMellowVault(mellowVault)).to.revertedWithCustomError(
    //     mellowAdapter,
    //     "ZeroAddress",
    //   );
    // });

    it("addMellowVault reverts when called by not an owner", async function() {
      const mellowVault = mellowVaults[1].vaultAddress;
      const wrapper = mellowVaults[1].wrapperAddress;
      await expect(mellowAdapter.connect(staker).addMellowVault(mellowVault)).to.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    //   it("changeMellowWrapper", async function () {
    //     const mellowVault = mellowVaults[1].vaultAddress;
    //     const prevValue = mellowVaults[1].wrapperAddress;
    //     await expect(mellowAdapter.addMellowVault(mellowVault))
    //       .to.emit(mellowAdapter, "VaultAdded")
    //       .withArgs(mellowVault, prevValue);
    //     expect(await mellowAdapter.mellowDepositWrappers(mellowVault)).to.be.eq(prevValue);

    //     const newValue = mellowVaults[1].wrapperAddress;
    //     await expect(mellowAdapter.changeMellowWrapper(mellowVault, newValue))
    //       .to.emit(mellowAdapter, "WrapperChanged")
    //       .withArgs(mellowVault, prevValue, newValue);
    //     expect(await mellowAdapter.mellowDepositWrappers(mellowVault)).to.be.eq(newValue);

    //     const freeBalance = await iVault.getFreeBalance();
    //     await expect(iVault.connect(iVaultOperator).delegate(await mellowAdapter.getAddress(), mellowVault, freeBalance, emptyBytes))
    //       .emit(iVault, "DelegatedTo")
    //       .withArgs(mellowAdapter.address, mellowVault, freeBalance);
    //   });

    //   it("changeMellowWrapper reverts when vault is 0 address", async function () {
    //     const vaultAddress = ethers.ZeroAddress;
    //     const newValue = ethers.Wallet.createRandom().address;
    //     await expect(mellowAdapter.changeMellowWrapper(vaultAddress, newValue)).to.be.revertedWithCustomError(
    //       mellowAdapter,
    //       "ZeroAddress",
    //     );
    //   });

    //   it("changeMellowWrapper reverts when wrapper is 0 address", async function () {
    //     const vaultAddress = mellowVaults[0].vaultAddress;
    //     const newValue = ethers.ZeroAddress;
    //     await expect(mellowAdapter.changeMellowWrapper(vaultAddress, newValue)).to.be.revertedWithCustomError(
    //       mellowAdapter,
    //       "ZeroAddress",
    //     );
    //   });

    //   it("changeMellowWrapper reverts when vault is unknown", async function () {
    //     const vaultAddress = mellowVaults[2].vaultAddress;
    //     const newValue = mellowVaults[2].wrapperAddress;
    //     await expect(mellowAdapter.changeMellowWrapper(vaultAddress, newValue)).to.be.revertedWithCustomError(
    //       mellowAdapter,
    //       "NoWrapperExists",
    //     );
    //   });

    //   it("changeMellowWrapper reverts when called by not an owner", async function () {
    //     const vaultAddress = mellowVaults[0].vaultAddress;
    //     const newValue = ethers.Wallet.createRandom().address;
    //     await expect(mellowAdapter.connect(staker).changeMellowWrapper(vaultAddress, newValue)).to.be.revertedWith(
    //       "Ownable: caller is not the owner",
    //     );
    //   });
  });

  describe("undelegateFromMellow: request withdrawal from mellow vault", function() {
    let totalDeposited, assets1, assets2, vault1Delegated, vault2Delegated;

    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      totalDeposited = 10n * e18;
      await iVault.connect(staker).deposit(totalDeposited, staker.address);
    });

    it("Delegate to mellowVault#1", async function() {
      vault1Delegated = (await iVault.getFreeBalance()) / 2n;
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, vault1Delegated, emptyBytes);

      expect(await mellowAdapter.getDeposited(mellowVaults[0].vaultAddress)).to.be.closeTo(
        vault1Delegated,
        transactErr,
      );
    });

    it("Add mellowVault#2 and delegate the rest", async function() {
      await mellowAdapter.addMellowVault(mellowVaults[1].vaultAddress);
      vault2Delegated = await iVault.getFreeBalance();

      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress, vault2Delegated, emptyBytes);

      expect(await mellowAdapter.getDeposited(mellowVaults[1].vaultAddress)).to.be.closeTo(
        vault2Delegated,
        transactErr,
      );
      expect(await mellowAdapter.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr * 2n);
      expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
    });

    it("Staker withdraws shares1", async function() {
      assets1 = e18;
      const shares = await iVault.convertToShares(assets1);
      console.log(`Staker is going to withdraw:\t${assets1.format()}`);
      await iVault.connect(staker).withdraw(shares, staker.address);
      console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
    });

    let undelegateClaimer1;

    it("undelegateFromMellow from mellowVault#1 by operator", async function() {
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      const pendingWithdrawalsBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      const ratioBefore = await calculateRatio(iVault, iToken, withdrawalQueue);

      let tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, assets1, emptyBytes]]);
      const receipt = await tx.wait();

      const events = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      undelegateClaimer1 = events[0].args["claimer"];

      expect(await mellowAdapter["pendingWithdrawalAmount(address,bool)"](mellowVaults[0].vaultAddress, false)).to.be.equal(
        assets1,
      );

      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const pendingWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      const vault1DelegatedAfter = await mellowAdapter.getDeposited(mellowVaults[0].vaultAddress);
      // const withdrawRequest = await mellowAdapter.pendingMellowRequest(mellowVaults[0].vaultAddress);
      const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);

      expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets1, transactErr);
      expect(pendingWithdrawalsAfter - pendingWithdrawalsBefore).to.be.closeTo(assets1, transactErr);
      expect(vault1DelegatedAfter).to.be.closeTo(vault1Delegated - assets1, transactErr);
      // expect(withdrawRequest.to).to.be.eq(mellowAdapter.address);
      // expect(withdrawRequest.timestamp).to.be.eq((await ethers.provider.getBlock("latest")).timestamp);
      expect(ratioAfter).to.be.closeTo(ratioBefore, 1n);
    });

    // it("Adding rewards to mellowVault#1 increases pending withdrawal respectively", async function () {
    //   const pendingMellowWithdrawalsBefore = await mellowAdapter.pendingWithdrawalAmount();
    //   const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
    //   const vault1DelegatedBefore = await mellowAdapter.getDeposited(mellowVaults[0].vaultAddress);
    //   const ratioBefore = await iVault.ratio();

    //   //Add rewards
    //   await assetData.addRewardsMellowVault(10n * e18, mellowVaults[0].vaultAddress);
    //   const vault1DelegatedAfter = await mellowAdapter.getDeposited(mellowVaults[0].vaultAddress);
    //   const pendingMellowWithdrawalsAfter = await mellowAdapter.pendingWithdrawalAmount();
    //   rewards =
    //     vault1DelegatedAfter + pendingMellowWithdrawalsAfter - vault1DelegatedBefore - pendingMellowWithdrawalsBefore;
    //   vault1Delegated += rewards;
    //   totalDeposited += rewards;
    //   //Update ratio
    //   const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
    //   await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
    //   ratio = await iVault.ratio();
    //   ratioDiff = ratioBefore - ratio;

    //   const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
    //   expect((pendingMellowWithdrawalsBefore * vault1DelegatedAfter) / vault1DelegatedBefore).to.be.closeTo(
    //     pendingMellowWithdrawalsAfter,
    //     transactErr,
    //   );
    //   expect((totalPendingMellowWithdrawalsBefore * vault1DelegatedAfter) / vault1DelegatedBefore).to.be.closeTo(
    //     totalPendingMellowWithdrawalsAfter,
    //     transactErr,
    //   );
    //   expect(totalDeposited).to.be.closeTo(await iVault.getTotalDeposited(), transactErr);
    // });

    it("Staker withdraws shares2 to Staker2", async function() {
      assets2 = e18;
      const shares = await iVault.convertToShares(assets2);
      console.log(`Staker is going to withdraw:\t${assets2.format()}`);
      await iVault.connect(staker).withdraw(shares, staker2.address);
      console.log(
        `Staker2's pending withdrawals:\t${(await iVault.getPendingWithdrawals(await mellowAdapter.getAddress())).format()}`,
      );
    });

    // it("undelegateFromMellow replaces pending withdraw from mellowVault#1", async function () {
    //   const ratioBeforeUndelegate = await iVault.ratio();

    //   const amount = assets2;
    //   await expect(iVault.connect(iVaultOperator).undelegate(await withdrawalQueue.currentEpoch(), await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes))
    //     .to.emit(iVault, "UndelegatedFrom")
    //     .withArgs(mellowAdapter.address, a => {
    //       expect(a).to.be.closeTo(amount, transactErr);
    //       return true;
    //     });

    //   const pendingMellowWithdrawalsAfter = await mellowAdapter.pendingWithdrawalAmount();
    //   const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
    //   const totalDelegatedAfter = await iVault.getTotalDelegated();
    //   const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);

    //   expect(pendingMellowWithdrawalsAfter).to.be.closeTo(amount, transactErr);
    //   expect(totalPendingMellowWithdrawalsAfter).to.be.closeTo(amount, transactErr);
    //   expect(totalDeposited - totalDelegatedAfter).to.be.closeTo(amount, transactErr);
    //   expect(ratioAfter).to.be.closeTo(ratioBeforeUndelegate, ratioErr);
    // });

    let undelegateClaimer2;

    it("undelegateFromMellow all from mellowVault#2", async function() {
      const pendingMellowWithdrawalsBefore = await mellowAdapter.pendingWithdrawalAmount();
      const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawals(
        await mellowAdapter.getAddress(),
      );

      //Amount can slightly exceed delegatedTo, but final number will be corrected
      //undelegateFromMellow fails when deviation is too big
      const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      const undelegatedAmount = await iVault.convertToAssets(epochShares);

      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(),
          [[await mellowAdapter.getAddress(), mellowVaults[1].vaultAddress, undelegatedAmount, emptyBytes]]
        );

      const receipt = await tx.wait();
      const events = receipt.logs?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      receipt.logs?.filter(log => console.log(log.address));
      undelegateClaimer2 = events[0].args["claimer"];

      // todo: recheck
      // .to.emit(iVault, "UndelegatedFrom")
      // .withArgs(mellowAdapter.address, mellowVaults[1].vaultAddress, a => {
      //   expect(a).to.be.closeTo(0, transactErr);
      //   return true;
      // });

      expect(await mellowAdapter["pendingWithdrawalAmount(address,bool)"](mellowVaults[1].vaultAddress, false)).to.be.equal(
        undelegatedAmount,
      );

      const pendingMellowWithdrawalsAfter = await mellowAdapter.pendingWithdrawalAmount();
      const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      // expect(pendingMellowWithdrawalsAfter - pendingMellowWithdrawalsBefore).to.be.closeTo(
      //   vault2Delegated,
      //   transactErr,
      // );
      expect(totalPendingMellowWithdrawalsAfter - totalPendingMellowWithdrawalsBefore).to.be.closeTo(
        undelegatedAmount,
        transactErr,
      );
      expect(totalDeposited - totalDelegatedAfter).to.be.closeTo(undelegatedAmount + assets2, transactErr);
      expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), transactErr);
    });

    it("Can not claim when adapter balance is 0", async function() {
      vault2Delegated = vault2Delegated - (await mellowAdapter.claimableAmount());
      params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer1]);
      await expect(
        iVault
          .connect(iVaultOperator)
          .claim(1, [await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [[params]]),
      ).to.be.revertedWithCustomError(mellowAdapter, "ValueZero");
    });

    it("Process pending withdrawal from mellowVault#1 and mellowVault#2 to mellowAdapter", async function() {
      await helpers.time.increase(1209900);

      // todo: recheck
      // const adapterBalanceBefore = await mellowAdapter.claimableAmount();
      // const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawals(
      //   await mellowAdapter.getAddress(),
      // );
      // const totalDepositedBefore = await iVault.getTotalDeposited();
      // console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
      // console.log(`Pending from Mellow before:\t\t${totalPendingMellowWithdrawalsBefore.format()}`);
      //
      // // await mellowVaults[0].curator.processWithdrawals([mellowAdapter.address]);
      // await helpers.time.increase(1209900);
      //
      // const adapterBalanceAfter = await mellowAdapter.claimableAmount();
      // const pendingMellowWithdrawalsAfter = await mellowAdapter.pendingWithdrawalAmount();
      // const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
      // const totalDepositedAfter = await iVault.getTotalDeposited();
      // console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
      // console.log(`Pending from Mellow:\t\t\t${totalPendingMellowWithdrawalsAfter.format()}`);
      // console.log(`Adapter balance diff:\t\t\t${(adapterBalanceAfter - adapterBalanceBefore).format()}`);
      //
      // expect(adapterBalanceAfter - adapterBalanceBefore).to.be.closeTo(vault2Delegated + assets1, transactErr);
      // expect(pendingMellowWithdrawalsAfter).to.be.closeTo(0, transactErr);
      // expect(totalPendingMellowWithdrawalsAfter).to.be.closeTo(vault2Delegated + assets1, transactErr);
      // expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
      // expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), transactErr);
    });

    // it("Process pending withdrawal from mellowVault#2 to mellowAdapter", async function () {
    //   const adapterBalanceBefore = await mellowAdapter.claimableAmount();
    //   const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
    //   const totalDepositedBefore = await iVault.getTotalDeposited();
    //   console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
    //   console.log(`Pending from Mellow before:\t\t${totalPendingMellowWithdrawalsBefore.format()}`);

    //   // await mellowVaults[1].curator.processWithdrawals([mellowRestaker.address]);
    //   await helpers.time.increase(1209900);
    //   await mellowAdapter.claimPending();

    //   const adapterBalanceAfter = await mellowAdapter.claimableAmount();
    //   const pendingMellowWithdrawalsAfter = await mellowAdapter.pendingWithdrawalAmount();
    //   const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());
    //   const totalDepositedAfter = await iVault.getTotalDeposited();
    //   console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
    //   console.log(`Pending from Mellow:\t\t\t${totalPendingMellowWithdrawalsAfter.format()}`);
    //   console.log(`Adapter balance diff:\t\t\t${(adapterBalanceAfter - adapterBalanceBefore).format()}`);

    //   expect(adapterBalanceAfter - adapterBalanceBefore).to.be.closeTo(vault2Delegated, transactErr);
    //   expect(pendingMellowWithdrawalsAfter).to.be.eq(0n);
    //   expect(totalPendingMellowWithdrawalsAfter).to.be.eq(totalPendingMellowWithdrawalsBefore);
    //   expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
    //   expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), transactErr);
    // });

    it("Can not claim funds from mellowAdapter when iVault is paused", async function() {
      await iVault.pause();
      await expect(
        iVault
          .connect(iVaultOperator)
          .claim(
            await withdrawalQueue.currentEpoch(),
            [await mellowAdapter.getAddress()],
            [mellowVaults[0].vaultAddress],
            [emptyBytes],
          ),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Claim funds from mellowAdapter to iVault", async function() {
      if (await iVault.paused()) {
        await iVault.unpause();
      }
      const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawals(await mellowAdapter.getAddress());

      // const usersTotalWithdrawals = await iVault.totalSharesToWithdraw();
      const totalAssetsBefore = await iVault.totalAssets();
      const freeBalanceBefore = await iVault.getFreeBalance();

      params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer1]);
      await iVault
        .connect(iVaultOperator)
        .claim(1, [await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [[params]]);
      params = abi.encode(["address", "address"], [mellowVaults[1].vaultAddress, undelegateClaimer2]);
      await iVault
        .connect(iVaultOperator)
        .claim(2, [await mellowAdapter.getAddress()], [mellowVaults[1].vaultAddress], [[params]]);
      console.log("getTotalDelegated", await iVault.getTotalDelegated());
      console.log("totalAssets", await iVault.totalAssets());
      console.log(
        "getPendingWithdrawalAmountFromMellow",
        await await iVault.getPendingWithdrawals(await mellowAdapter.getAddress()),
      );
      console.log("redeemReservedAmount", await iVault.redeemReservedAmount());
      console.log("depositBonusAmount", await iVault.depositBonusAmount());

      const totalAssetsAfter = await iVault.totalAssets();
      const adapterBalanceAfter = await mellowAdapter.claimableAmount();
      const freeBalanceAfter = await iVault.getFreeBalance();

      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(totalPendingMellowWithdrawalsBefore, transactErr);
      expect(adapterBalanceAfter).to.be.eq(0n, transactErr);
      //Withdraw leftover goes to freeBalance
      // expect(freeBalanceAfter - freeBalanceBefore).to.be.closeTo(
      //   totalPendingMellowWithdrawalsBefore - usersTotalWithdrawals,
      //   transactErr,
      // );

      console.log("vault ratio:", await iVault.ratio());
      console.log("calculated ratio:", await calculateRatio(iVault, iToken, withdrawalQueue));

      expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), transactErr);
    });

    it("Staker is able to redeem", async function() {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Staker2 is able to redeem", async function() {
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Staker redeems withdrawals", async function() {
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPWBefore = await iVault.getPendingWithdrawalOf(staker.address);

      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${stakerBalanceAfter.format()}`);
      console.log(`Staker pending withdrawals after: ${stakerPWAfter.format()}`);

      expect(stakerPWBefore - stakerPWAfter).to.be.closeTo(assets1, transactErr * 2n);
      expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(assets1, transactErr * 2n);
      expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), 1n);
    });
  });

  describe("undelegateFromMellow: negative cases", function() {
    beforeEach(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(randomBI(19), staker.address);
      const freeBalance = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, freeBalance, emptyBytes);
      console.log(`Delegated amount: \t${freeBalance.format()}`);
    });

    const invalidArgs = [
      // {
      //   name: "amount is 0",
      //   amount: async () => 0n,
      //   mellowVault: async () => mellowVaults[0].vaultAddress,
      //   operator: () => iVaultOperator,
      //   customError: "ValueZero",
      //   source: () => mellowAdapter,
      // },
      // {
      //   name: "amount > delegatedTo",
      //   amount: async () => (await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress)) + e18,
      //   mellowVault: async () => mellowVaults[0].vaultAddress,
      //   operator: () => iVaultOperator,
      //   customError: "BadMellowWithdrawRequest",
      //   source: () => mellowAdapter,
      // },
      // {
      //   name: "mellowVault is unregistered",
      //   amount: async () => await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress),
      //   mellowVault: async () => mellowVaults[1].vaultAddress,
      //   operator: () => iVaultOperator,
      //   customError: "InvalidVault",
      //   source: () => mellowAdapter,
      // },
      {
        name: "mellowVault is 0 address",
        amount: async () => await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress),
        mellowVault: async () => ethers.ZeroAddress,
        operator: () => iVaultOperator,
        customError: "InvalidAddress",
        source: () => iVault,
      },
      {
        name: "called by not an operator",
        amount: async () => await iVault.getDelegatedTo(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress),
        mellowVault: async () => mellowVaults[0].vaultAddress,
        operator: () => staker,
        customError: "OnlyOperatorAllowed",
        source: () => iVault,
      },
    ];

    invalidArgs.forEach(function(arg) {
      it(`Reverts: when ${arg.name}`, async function() {
        const amount = await arg.amount();
        const mellowVault = await arg.mellowVault();
        console.log(`Undelegate amount: \t${amount.format()}`);
        if (arg.customError) {
          await expect(
            iVault
              .connect(arg.operator())
              .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVault, amount, emptyBytes]]),
          ).to.be.revertedWithCustomError(arg.source(), arg.customError);
        } else {
          await expect(
            iVault
              .connect(arg.operator())
              .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVault, amount, emptyBytes]]),
          ).to.be.revertedWith(arg.error);
        }
      });
    });

    it("Reverts: undelegate when iVault is paused", async function() {
      const amount = randomBI(17);
      await iVault.pause();
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes]]),
      ).to.be.revertedWith("Pausable: paused");
      await iVault.unpause();
    });

    it("Reverts: undelegate when mellowAdapter is paused", async function() {
      if (await iVault.paused()) {
        await iVault.unpause();
      }

      const amount = randomBI(17);
      await mellowAdapter.pause();
      await expect(
        iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes]]),
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Redeem: retrieves assets after they were received from Mellow", function() {
    let ratio, stakerAmount, staker2Amount, stakerUnstakeAmount1, staker2UnstakeAmount;
    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker3).deposit(e18, staker3.address);
      await iVault
        .connect(iVaultOperator)
        .delegate(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
          await iVault.getFreeBalance(),
          emptyBytes,
        );
      await ratioFeed.updateRatioBatch([iToken.address], [await calculateRatio(iVault, iToken, withdrawalQueue)]);
      ratio = await iVault.ratio();
    });

    it("Deposit and Delegate partially", async function() {
      stakerAmount = 9_399_680_561_290_658_040n;
      await iVault.connect(staker).deposit(stakerAmount, staker.address);
      staker2Amount = 1_348_950_494_309_030_813n;
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);

      const delegated = (await iVault.getFreeBalance()) - e18;
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, delegated, emptyBytes);

      await ratioFeed.updateRatioBatch([iToken.address], [await calculateRatio(iVault, iToken, withdrawalQueue)]);
      console.log(`Staker amount: ${stakerAmount}`);
      console.log(`Staker2 amount: ${staker2Amount}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker has nothing to claim yet", async function() {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
    });

    it("Staker withdraws half of their shares", async function() {
      const shares = await iToken.balanceOf(staker.address);
      stakerUnstakeAmount1 = shares / 2n;
      await iVault.connect(staker).withdraw(stakerUnstakeAmount1, staker.address);
      await ratioFeed.updateRatioBatch([iToken.address], [await calculateRatio(iVault, iToken, withdrawalQueue)]);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is not able to redeem yet", async function() {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
    });

    // todo: recheck
    // it("updateEpoch can not unlock withdrawals without enough freeBalance", async function () {
    //   const redeemReserveBefore = await iVault.redeemReservedAmount();
    //   const freeBalanceBefore = await iVault.getFreeBalance();
    //   const epochBefore = await iVault.epoch();
    //   await iVault.connect(iVaultOperator).updateEpoch();
    //
    //   const redeemReserveAfter = await iVault.redeemReservedAmount();
    //   const freeBalanceAfter = await iVault.getFreeBalance();
    //   const epochAfter = await iVault.epoch();
    //
    //   expect(redeemReserveAfter).to.be.eq(redeemReserveBefore);
    //   expect(freeBalanceAfter).to.be.eq(freeBalanceBefore);
    //   expect(epochAfter).to.be.eq(epochBefore);
    // });

    it("Withdraw from mellowVault amount = pending withdrawals", async function() {
      const redeemReserveBefore = await iVault.redeemReservedAmount();
      const freeBalanceBefore = await iVault.getFreeBalance();

      const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      const amount = await iVault.convertToAssets(epochShares);

      const tx = await iVault
        .connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, epochShares, emptyBytes]]);

      const receipt = await tx.wait();
      let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
      const adapterEvents = receipt.logs
        ?.filter(log => log.address === mellowAdapter.address)
        .map(log => mellowAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      await helpers.time.increase(1209900);

      if (events[0].args["actualAmounts"] > 0) {
        params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, claimer]);
        await iVault
          .connect(iVaultOperator)
          .claim(
            events[0].args["epoch"],
            [await mellowAdapter.getAddress()],
            [mellowVaults[0].vaultAddress],
            [[params]],
          );
      }

      const redeemReserveAfter = await iVault.redeemReservedAmount();
      const freeBalanceAfter = await iVault.getFreeBalance();
      await ratioFeed.updateRatioBatch([iToken.address], [await calculateRatio(iVault, iToken, withdrawalQueue)]);
      console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
      console.log(`Pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
      console.log(`Ratio: ${await iVault.ratio()}`);

      expect(redeemReserveAfter - redeemReserveBefore).to.be.closeTo(amount, transactErr);
      // expect(freeBalanceAfter).to.be.closeTo(freeBalanceBefore, transactErr); // todo: recheck
    });

    it("Staker is now able to redeem", async function() {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Redeem reverts when iVault is paused", async function() {
      await iVault.pause();
      await expect(iVault.connect(iVaultOperator).redeem(staker.address)).to.be.revertedWith("Pausable: paused");
    });

    it("Unpause after previous test", async function() {
      await iVault.unpause();
    });

    it("Staker2 withdraws < freeBalance", async function() {
      staker2UnstakeAmount = (await iVault.getFreeBalance()) - 1000_000_000n;
      await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
    });

    it("Staker2 can not claim the same epoch even if freeBalance is enough", async function() {
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
    });

    it("Staker is still able to claim", async function() {
      const ableRedeem = await iVault.isAbleToRedeem(staker.address);
      expect(ableRedeem[0]).to.be.true;
      expect([...ableRedeem[1]]).to.have.members([0n]);
    });

    // it("Stakers new withdrawal goes to the end of queue", async function () {
    //   stakerUnstakeAmount2 = (await iToken.balanceOf(staker.address)) / 2n;
    //   await iVault.connect(staker).withdraw(stakerUnstakeAmount2, staker.address);
    //
    //   console.log(`Pending withdrawals: ${await iVault.getPendingWithdrawalOf(staker.address)}`);
    //   console.log(`Unstake amount: ${stakerUnstakeAmount2.toString()}`);
    //   console.log(`Ratio: ${await calculateRatio(iVault, iToken, withdrawalQueue)}`);
    //
    //   expect(newQueuedWithdrawal.epoch).to.be.eq(2n); //queue length - 1
    //   expect(newQueuedWithdrawal.receiver).to.be.eq(staker.address);
    //   expect(newQueuedWithdrawal.amount).to.be.closeTo(
    //     await iVault.convertToAssets(stakerUnstakeAmount2),
    //     transactErr,
    //   );
    // });

    it("Staker is still able to redeem the 1st withdrawal", async function() {
      const ableRedeem = await iVault.isAbleToRedeem(staker.address);
      expect(ableRedeem[0]).to.be.true;
      expect([...ableRedeem[1]]).to.have.members([0n]);
    });

    // i"updateEpoch unlocks pending withdrawals in order they were submitted", async function () {
    //       //   const staker2Pending = await iVault.getPendingWithdrawalOf(staker2.address);
    //       //   const redeemReserveBefore = await iVault.redeemReservedAmount();
    //       //   const freeBalanceBefore = await iVault.getFreeBalance();
    //       //   const epochBefore = await iVault.epoch();
    //       //   await iVault.connect(iVaultOperator).updateEpoch();
    //       //
    //       //   const redeemReserveAfter = await iVault.redeemReservedAmount();
    //       //   const freeBalanceAfter = await iVault.getFreeBalance();
    //       //   const epochAfter = await iVault.epoch();
    //       //
    //       //   expect(redeemReserveAfter - redeemReserveBefore).to.be.closeTo(staker2Pending, transactErr);
    //       //   expect(freeBalanceBefore - freeBalanceAfter).to.be.closeTo(staker2Pending, transactErr);
    //       //   expect(epochAfter).to.be.eq(epochBefore + 1n);
    //       // });t(

    // it("Staker2 is able to claim", async function () {
    //   const ableRedeem = await iVault.isAbleToRedeem(staker2.address);
    //   expect(ableRedeem[0]).to.be.true;
    //   expect([...ableRedeem[1]]).to.have.members([1n]);
    // });

    it("Staker is able to claim only the 1st wwl", async function() {
      const ableRedeem = await iVault.isAbleToRedeem(staker.address);
      expect(ableRedeem[0]).to.be.true;
      expect([...ableRedeem[1]]).to.have.members([0n]);
    });

    it("Staker redeems withdrawals", async function() {
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
      const stakerRedeemedAmount = await iVault.convertToAssets(stakerUnstakeAmount1);
      // const stakerPendingAmount = await iVault.convertToAssets(stakerUnstakeAmount2);

      await iVault.connect(staker).redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${stakerBalanceAfter}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);
      console.log(`stakerUnstakeAmountAssetValue: ${stakerRedeemedAmount}`);
      console.log(`stakerPendingWithdrawalsBefore[0]: ${stakerPendingWithdrawalsBefore}`);

      expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
        stakerRedeemedAmount,
        transactErr,
      );
      // expect(stakerPendingWithdrawalsAfter).to.be.closeTo(stakerPendingAmount, transactErr);
      expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(stakerRedeemedAmount, transactErr);
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
      expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), ratioErr);
    });

    // todo: recheck
    // it("Staker2 redeems withdrawals", async function () {
    //   const stakerBalanceBefore = await asset.balanceOf(staker2.address);
    //   const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker2.address);
    //
    //   await iVault.connect(staker2).redeem(staker2.address);
    //   const stakerBalanceAfter = await asset.balanceOf(staker2.address);
    //   const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker2.address);
    //
    //   console.log(`Staker balance after: ${stakerBalanceAfter}`);
    //   console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);
    //   const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(staker2UnstakeAmount);
    //   expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
    //     stakerUnstakeAmountAssetValue,
    //     transactErr * 2n,
    //   );
    //   expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2n);
    //   expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
    //   expect(await iVault.ratio()).to.be.closeTo(await calculateRatio(iVault, iToken, withdrawalQueue), ratioErr);
    // });
  });

  describe("Redeem: to the different addresses", function() {
    let ratio, recipients, pendingShares, undelegatedEpoch;

    before(async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit("9292557565124725653", staker.address);
      const amount = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
    });

    const count = 3;
    for (let j = 0; j < count; j++) {
      it(`${j} Withdraw to 5 random addresses`, async function() {
        recipients = [];
        pendingShares = 0n;
        for (let i = 0; i < 5; i++) {
          const recipient = randomAddress();
          const shares = randomBI(17);
          pendingShares = pendingShares + shares;
          await iVault.connect(staker).withdraw(shares, recipient);
          recipients.push(recipient);
        }
      });

      it(`${j} Withdraw from EL and update ratio`, async function() {
        undelegatedEpoch = await withdrawalQueue.currentEpoch();
        let amount = await iVault.convertToAssets(await withdrawalQueue.getRequestedShares(undelegatedEpoch));

        const tx = await iVault
          .connect(iVaultOperator)
          .undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes]]);
        const receipt = await tx.wait();
        let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

        const adapterEvents = receipt.logs
          ?.filter(log => log.address === mellowAdapter.address)
          .map(log => mellowAdapter.interface.parseLog(log));
        let claimer = adapterEvents[0].args["claimer"];

        await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
        const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        console.log(`New ratio is: ${ratio}`);

        // await mellowVaults[0].curator.processWithdrawals([mellowRestaker.address]);
        await helpers.time.increase(1209900);

        if (events[0].args["actualAmounts"] > 0) {
          params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, claimer]);
          await iVault
            .connect(iVaultOperator)
            .claim(undelegatedEpoch, [await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [[params]]);
        }

        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Total withdrawn shares to assets ${await iVault.convertToAssets(pendingShares)}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it(`${j} Recipients claim`, async function() {
        for (const r of recipients) {
          const rBalanceBefore = await asset.balanceOf(r);
          const rPendingWithdrawalsBefore = await withdrawalQueue.getPendingWithdrawalOf(r);
          await iVault.connect(deployer).redeem(r);
          const rBalanceAfter = await asset.balanceOf(r);
          const rPendingWithdrawalsAfter = await withdrawalQueue.getPendingWithdrawalOf(r);

          console.log("rBalanceAfter", rBalanceAfter);
          console.log("rPendingWithdrawalsBefore", rPendingWithdrawalsBefore);
          expect(rBalanceAfter - rPendingWithdrawalsBefore).to.be.closeTo(0, transactErr);
          expect(rBalanceBefore - rPendingWithdrawalsAfter).to.be.closeTo(0, transactErr);
        }

        expect(await iVault.ratio()).to.be.lte(ratio);
        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });
    }

    it("Update asset ratio and withdraw the rest", async function() {
      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      ratio = await iVault.ratio();
      console.log(`New ratio is: ${ratio}`);

      //Withdraw all and take from EL
      const shares = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(shares, staker.address);
      const amount = await iVault.getTotalDelegated();
      console.log("totalDElegated", amount);
      console.log("shares", shares);
      await iVault.withdrawFromMellowAndClaim(mellowVaults[0].vaultAddress, amount);
      // await iVault.undelegate(await withdrawalQueue.currentEpoch(), await withdrawalQueue.currentEpoch(), [])
      await iVault.connect(iVaultOperator).redeem(staker.address);

      console.log(`iVault total assets: ${await iVault.totalAssets()}`);
      console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
    });
  });

  describe("Emergency undelegate cannot finish normal undelegation flow", function() {
    it("deposit & delegate & undelegate", async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);

      // deposit & delegate 10
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      await iVault.connect(iVaultOperator).delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, toWei(10), emptyBytes);

      // withdraw 3
      await iVault.connect(staker).withdraw(toWei(3), staker.address);

      // emergency undelegate 5
      await iVault.connect(iVaultOperator).emergencyUndelegate([await mellowAdapter.getAddress()], [mellowVaults[0].vaultAddress], [toWei(5)], [emptyBytes]);
      // normal undelegate 3
      let tx = await iVault.connect(iVaultOperator).undelegate(await withdrawalQueue.currentEpoch(), [[await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, toWei(3), emptyBytes]]);

      // get emergency claimer
      let receipt = await tx.wait();
      let adapterEvents = receipt.logs?.filter(log => log.address === mellowAdapter.address).map(log => mellowAdapter.interface.parseLog(log));
      let claimer = adapterEvents[0].args["claimer"];

      await helpers.time.increase(1209900);

      // claim
      const params = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, claimer]);
      await expect(
        iVault.connect(iVaultOperator).emergencyClaim([mellowAdapter.address], [mellowVaults[0].vaultAddress], [[params]]),
      ).to.be.revertedWithCustomError(mellowAdapter, "OnlyEmergency");
    });
  });

});
