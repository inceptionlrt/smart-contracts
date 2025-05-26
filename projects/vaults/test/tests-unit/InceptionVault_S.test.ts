import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { e18, skipEpoch, symbioticClaimParams, toWei } from "../helpers/utils";
import { initVault } from "../src/init-vault-new";
const { ethers, network } = hardhat;
import { testrunConfig } from '../testrun.config';
import { adapters, emptyBytes } from "../src/constants";

const assetData = testrunConfig.assetData;
const symbioticVaults = assetData.adapters.symbiotic;

describe(`Inception Symbiotic Vault ${assetData.asset.name}`, function () {
  let iVault;
  let asset;
  let staker: HardhatEthersSigner, staker2: HardhatEthersSigner;
  let transactErr: bigint;
  let snapshot: helpers.SnapshotRestorer;
  let ratioFeed;
  let iToken;
  let iVaultOperator;
  let symbioticAdapter;
  let withdrawalQueue;

  before(async function () {
    if (process.env.ASSETS) {
      const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
      if (!assets.includes(assetData.asset.name.toLowerCase())) {
        console.log(`Asset "${assetData.asset.name}" is not in test data, skip`);
        this.skip();
      }
    }

    await network.provider.send("hardhat_reset", [{
      forking: {
        jsonRpcUrl: network.config.forking.url,
        blockNumber: assetData.blockNumber || network.config.forking.blockNumber,
      },
    }]);

    ({ iToken, iVault, iVaultOperator, asset, ratioFeed, symbioticAdapter, withdrawalQueue } =
      await initVault(assetData, { adapters: [adapters.Symbiotic] }));
    transactErr = assetData.transactErr;

    [, staker, staker2] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  describe("Flash withdrawal: setFlashMinAmount method", () => {
    const flashMinAmount = toWei(1);
    const depositedAmount = toWei(2);

    beforeEach(async () => {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(e18); //1%

      // deposit to vault
      const tx = await iVault.connect(staker).deposit(depositedAmount, staker.address);
      await tx.wait();

      // set flash min amount
      await iVault.setFlashMinAmount(flashMinAmount);
    });

    it("Flash min amount could be set", async () => {
      expect(await iVault.flashMinAmount()).to.be.eq(flashMinAmount);
    });

    it("Event FlashMinAmountChanged is emitted", async () => {
      // act
      const newFlashMinAmount = 2n;
      const tx = await iVault.setFlashMinAmount(newFlashMinAmount);
      const receipt = await tx.wait();

      // assert
      const event = receipt.logs?.find(e => e.eventName === "FlashMinAmountChanged");
      expect(event).to.exist;
      expect(event.args).to.have.lengthOf(2);
      expect(event?.args[0]).to.be.eq(flashMinAmount);
      expect(event?.args[1]).to.be.eq(newFlashMinAmount);
    });

    it("Error when set flash min amount to 0", async () => {
      await expect(iVault.setFlashMinAmount(0)).to.be.revertedWithCustomError(iVault, "NullParams");
    });

    it("Flash min amount could be set only by owner", async () => {
      await expect(iVault.connect(staker2).setFlashMinAmount(flashMinAmount)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("Successfully withdraw MORE than min flash amount", async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(staker);
      const withdrawalAmount = flashMinAmount + 1n;

      // act
      const tx = await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](withdrawalAmount, staker.address, 0n);
      const receipt = await tx.wait();
      const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");

      // assert
      const collectedFees = withdrawEvent[0].args["fee"];
      const assetBalanceAfter = await asset.balanceOf(staker);
      expect(assetBalanceAfter).to.be.closeTo(assetBalanceBefore + withdrawalAmount - collectedFees, transactErr);
    });

    it("Successfully withdraw the amount EQUAL to min flash amount", async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(staker);
      const withdrawalAmount = flashMinAmount;

      // act
      const tx = await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](withdrawalAmount, staker.address, 0n);
      const receipt = await tx.wait();
      const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");

      // assert
      const collectedFees = withdrawEvent[0].args["fee"];
      const assetBalanceAfter = await asset.balanceOf(staker);
      expect(assetBalanceAfter).to.be.closeTo(assetBalanceBefore + withdrawalAmount - collectedFees, transactErr);
    });

    it("Error when withdraw the amount LESS to min flash amount", async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(staker);
      const withdrawalAmount = flashMinAmount - 1n;
      // act
      const withdrawalTx = iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](withdrawalAmount, staker.address, 0n);
      await expect(withdrawalTx).to.be.revertedWithCustomError(iVault, "LowerMinAmount");

      // assert
      const assetBalanceAfter = await asset.balanceOf(staker);
      expect(assetBalanceAfter).to.be.closeTo(assetBalanceBefore, transactErr);
    });
  });

  describe('setDepositMinAmount method', () => {
    const depositMinAmount = toWei(1);

    before(async () => {
      await iVault.setTargetFlashCapacity(e18); //1%
      // const helpers = await import('@nomicfoundation/hardhat-network-helpers');
      snapshot = await helpers.takeSnapshot();
    });

    beforeEach(async () => {
      await snapshot.restore();
      await iVault.setDepositMinAmount(depositMinAmount);
    });

    it('Deposit min amount could be set', async () => {
      expect(await iVault.depositMinAmount()).to.be.eq(depositMinAmount);
    });

    it('Event DepositMinAmountChanged is emitted', async () => {
      // act
      const newDepositMinAmount = 2n;
      const tx = await iVault.setDepositMinAmount(newDepositMinAmount);
      const receipt = await tx.wait();

      // assert
      const event = receipt.logs?.find(e => e.eventName === 'DepositMinAmountChanged');
      expect(event).to.exist;
      expect(event.args).to.have.lengthOf(2);
      expect(event?.args[0]).to.be.eq(depositMinAmount);
      expect(event?.args[1]).to.be.eq(newDepositMinAmount);
    });

    it('Error when set deposit min amount to 0', async () => {
      await expect(iVault.setDepositMinAmount(0)).to.be.revertedWithCustomError(iVault, 'NullParams');
    });

    it('Deposit min amount could be set only by owner', async () => {
      await expect(iVault.connect(staker2).setDepositMinAmount(depositMinAmount)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Successfully deposit MORE than min deposit amount', async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(iVault.address);
      const depositAmount = depositMinAmount + 1n;

      // act
      const tx = await iVault.connect(staker).deposit(depositAmount, staker.address);
      await tx.wait();

      // assert
      const assetBalanceAfter = await asset.balanceOf(iVault.address);
      expect(assetBalanceAfter).to.be.eq(assetBalanceBefore + depositAmount);
    });

    it('Successfully deposit the amount EQUAL to min deposit amount', async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(iVault.address);
      const depositAmount = depositMinAmount;

      // act
      const tx = await iVault.connect(staker).deposit(depositAmount, staker.address);
      await tx.wait();

      // assert
      const assetBalanceAfter = await asset.balanceOf(iVault.address);
      expect(assetBalanceAfter).to.be.eq(assetBalanceBefore + depositAmount);
    });

    it('Error when deposit the amount LESS to min deposit amount', async () => {
      // arrange
      const assetBalanceBefore = await asset.balanceOf(iVault.address);
      const depositAmount = depositMinAmount - 1n;

      // act
      const depositTx = iVault.connect(staker).deposit(depositAmount, staker.address);
      await expect(depositTx).to.be.revertedWithCustomError(iVault, 'LowerMinAmount');

      // assert
      const assetBalanceAfter = await asset.balanceOf(iVault.address);
      expect(assetBalanceAfter).to.be.eq(assetBalanceBefore);
    });
  });

  describe('decimals method', () => {
    it('should return token decimals', async () => {
      const tokenAddress = await iVault.inceptionToken();

      const iVaultDecimals = await iVault.decimals();
      const tokenDecimals = await (await ethers.getContractAt('IERC20Metadata', tokenAddress)).decimals();

      expect(iVaultDecimals).to.be.eq(tokenDecimals);
      expect(iVaultDecimals).to.be.eq(18n);
    });
  });

  describe('migrateDepositBonus method', () => {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(e18);
    });

    it('should migrate deposit bonus to a new vault', async () => {
      // Arrange
      // set ratio to 1:1
      await ratioFeed.updateRatioBatch([iToken.address], [toWei(1)]);

      // deposit
      let depositTx = await iVault.connect(staker).deposit(toWei(10), staker.address);
      await depositTx.wait();

      // flash withdraw (to generate deposit bonus)
      let flashWithdrawTx =
        await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](toWei(5), staker.address, 0n);
      await flashWithdrawTx.wait();

      // Assert: check deposit bonus
      const depositBonusAmount = await iVault.depositBonusAmount();
      expect(depositBonusAmount).to.be.gt(0);

      // Act
      const { iVault: iVaultNew } = await initVault(assetData);
      await (await iVault.migrateDepositBonus(await iVaultNew.getAddress())).wait();

      // Assert: bonus migrated
      const oldDepositBonus = await iVault.depositBonusAmount();
      expect(oldDepositBonus, 'Old vault deposit bonus should equal 0').to.be.eq(0);

      const newVaultBalance = await asset.balanceOf(iVaultNew.address);
      expect(newVaultBalance, 'New vault balance should equal to transferred deposit bonus').to.be.eq(depositBonusAmount);
    });

    it('should revert if the new vault address is zero', async () => {
      await expect(iVault.migrateDepositBonus(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        iVault,
        'InvalidAddress'
      );
    });

    it('should revert if there is no deposit bonus to migrate', async () => {
      expect(await iVault.depositBonusAmount(), 'Deposit bonus should be 0').to.be.eq(0);

      await expect(iVault.migrateDepositBonus(staker.address)).to.be.revertedWithCustomError(iVault, 'NullParams');
    });

    it('should revert if there are delegated funds', async () => {
      // Arrange
      // deposit + delegate
      const depositAmount = toWei(10);
      await (await iVault.connect(staker).deposit(depositAmount, staker.address)).wait();
      await (await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(5), emptyBytes)).wait();

      // flash withdraw (to generate deposit bonus)
      let flashWithdrawTx =
        await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](toWei(1), staker.address, 0n);
      await flashWithdrawTx.wait();

      const depositBonusAmount = await iVault.depositBonusAmount();
      expect(depositBonusAmount, 'Deposit bonus should exist').to.be.gt(0);

      const { iVault: iVaultNew } = await initVault(assetData);

      // Act/Assert
      await expect(iVault.migrateDepositBonus(iVaultNew.address)).to.be.revertedWithCustomError(iVault, 'ValueZero');
    });

    it('should only allow the owner to migrate the deposit bonus', async () => {
      await expect(iVault.connect(staker).migrateDepositBonus(staker.address)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      );
    });

    it('should emit an event', async () => {
      // Arrange
      // deposit
      let depositTx = await iVault.connect(staker).deposit(toWei(50), staker.address);
      await depositTx.wait();

      // flash withdraw (to generate deposit bonus)
      let flashWithdrawTx =
        await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](toWei(25), staker.address, 0n);
      await flashWithdrawTx.wait();
      const depositBonusAmount = await iVault.depositBonusAmount();

      // Act
      const { iVault: iVaultNew } = await initVault(assetData);
      const migrateTx = await (await iVault.migrateDepositBonus(await iVaultNew.getAddress())).wait();

      // Assert: event emitted
      await expect(migrateTx)
        .to.emit(iVault, 'DepositBonusTransferred')
        .withArgs(iVaultNew.address, depositBonusAmount);
    });
  });

  describe('Undelegation', function () {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("request two withdrawals in the same epoch", async function () {
      const depositAmount = toWei(10);

      await (await iVault.connect(staker).deposit(depositAmount, staker.address)).wait();

      await (await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes)).wait();

      // first withdraw
      await iVault.connect(staker).withdraw(toWei(1), staker.address);

      const previousSymbioticVault = await symbioticVaults[0].vault.currentEpoch();

      // first undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      let receipt = await (await iVault.connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[symbioticAdapter.address, symbioticVaults[0].vaultAddress, epochShares, []]]))
        .wait();
      let adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address).map(log => symbioticAdapter.interface.parseLog(log));
      let claimer1 = adapterEvents[0].args["claimer"];

      // second withdraw
      await iVault.connect(staker).withdraw(toWei(1), staker.address);

      // second undelegate
      epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      receipt = await (await iVault.connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[symbioticAdapter.address, symbioticVaults[0].vaultAddress, epochShares, []]]))
        .wait();
      adapterEvents = receipt.logs?.filter(log => log.address === symbioticAdapter.address).map(log => symbioticAdapter.interface.parseLog(log));
      let claimer2 = adapterEvents[0].args["claimer"];

      await skipEpoch(symbioticVaults[0]);
      expect(await symbioticVaults[0].vault.currentEpoch()).to.be.greaterThan(previousSymbioticVault);

      let balanceBefore = await iVault.totalAssets();

      // claim
      let params = await symbioticClaimParams(symbioticVaults[0], claimer1);
      await iVault.connect(iVaultOperator).claim(
        1, [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]],
      );

      expect((await iVault.totalAssets()) - balanceBefore).to.be.eq(toWei(1));
      balanceBefore = await iVault.totalAssets();

      // claim
      params = await symbioticClaimParams(symbioticVaults[0], claimer2);
      await iVault.connect(iVaultOperator).claim(
        2, [symbioticAdapter.address], [symbioticVaults[0].vaultAddress], [[params]],
      );

      expect((await iVault.totalAssets()) - balanceBefore).to.be.eq(toWei(1));
    });

    it('epoch should be changed if undelegate current epoch', async () => {
      // Arrange: deposit > delegate > withdraw
      const depositAmount = toWei(10);

      await (await iVault.connect(staker).deposit(depositAmount, staker.address)).wait();

      await (await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes)).wait();

      const tx = await iVault.connect(staker).withdraw(toWei(1), staker.address);
      await tx.wait();

      const currentEpoch = await withdrawalQueue.currentEpoch();

      // Act: undelegate
      let epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
      await (await iVault.connect(iVaultOperator)
        .undelegate(await withdrawalQueue.currentEpoch(), [[symbioticAdapter.address, symbioticVaults[0].vaultAddress, epochShares, []]]))
        .wait();

      // Assert: epoch increased
      const newEpoch = await withdrawalQueue.currentEpoch();
      expect(newEpoch).to.eq(currentEpoch + 1n);
    });

    it('should revert if requested amount is greater than available capacity', async () => {
      const depositAmount = toWei(10);
      // deposit
      let tx = await iVault.connect(staker).deposit(depositAmount, staker.address);
      await tx.wait();

      // delegate
      tx = await iVault.connect(iVaultOperator)
        .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, depositAmount, emptyBytes);
      await tx.wait();

      // one withdraw
      let shares = await iToken.balanceOf(staker.address);
      tx = await iVault.connect(staker).withdraw(shares, staker.address);
      await tx.wait();

      // Act/Assert: undelegate and check revered with error
      await expect(iVault.connect(iVaultOperator).undelegate(
        await withdrawalQueue.currentEpoch(),
        []
      )).to.be.revertedWithCustomError(iVault, "InsufficientFreeBalance");
    });
  });

  describe('claimAdapterFreeBalance', () => {
    beforeEach(async () => {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
    });

    it("can be called only by operator", async() => {
      await expect(iVault.connect(staker).claimAdapterFreeBalance(symbioticAdapter.address))
        .to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");

      await expect(symbioticAdapter.claimFreeBalance())
        .to.be.revertedWithCustomError(symbioticAdapter, "NotVaultOrTrusteeManager");
    });

    it('should claim free balance for the adapter', async () => {
      // Arrange
      const amount = toWei(5);
      await asset.connect(staker).transfer(symbioticAdapter.address, amount);

      const vaultBalanceBefore = await iVault.totalAssets();
      const adapterBalanceBefore = await asset.balanceOf(symbioticAdapter.address);

      console.log(`Vault balance before: ${vaultBalanceBefore}`);
      console.log(`Adapter balance before: ${adapterBalanceBefore}`);

      // Act
      await iVault.connect(iVaultOperator).claimAdapterFreeBalance(symbioticAdapter.address);

      // Assert: assets transferred to vault
      const adapterBalance = await asset.balanceOf(symbioticAdapter.address);
      expect(adapterBalance).to.be.eq(0n);
      const vaultBalanceAfter = await iVault.totalAssets();
      expect(vaultBalanceAfter).to.be.eq(vaultBalanceBefore + amount);
    });
  });
});
