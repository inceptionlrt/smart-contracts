// Tests for InceptionVault_S contract;
// The S in name does not mean only Symbiotic; this file contains tests for Symbiotic and Mellow adapters

import * as helpers from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hardhat from "hardhat";
import { emptyBytes, adapters } from "../../../constants";
import { stETH } from "../../data/assets/inception-vault-s";
import { calculateRatio, e18, getRandomStaker, randomBI, toWei } from "../../helpers/utils";
import { initVault } from "../../src/init-vault";
import { vaults } from "../../data/vaults";

const mellowVaults = vaults.mellow;
const { ethers, network } = hardhat;
const assetData = stETH;

describe(`Inception Symbiotic Vault ${assetData.assetName}`, function () {
  let iToken, iVault, ratioFeed, asset, mellowAdapter, withdrawalQueue;
  let iVaultOperator, staker, staker2, staker3;
  let ratioErr, transactErr;
  let snapshot;

  before(async function () {
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
      = await initVault(assetData, { adapters: [adapters.Mellow] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);

    snapshot = await helpers.takeSnapshot();
  });

  after(async function () {
    await iVault?.removeAllListeners();
  });

  describe("Delegate to mellow vault", function () {
    let ratio, firstDeposit;

    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker3).deposit(e18, staker3.address);
      firstDeposit = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, firstDeposit, emptyBytes);
      await assetData.addRewardsMellowVault(toWei(0.001), mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      ratio = await iVault.ratio();
      console.log(`Initial ratio: ${ratio.format()}`);
    });

    const args = [
      {
        name: "random amounts ~ e18",
        depositAmount: async () => toWei(1),
      },
      {
        name: "amounts which are close to min",
        depositAmount: async () => (await iVault.withdrawMinAmount()) + 1n,
      },
    ];

    args.forEach(function (arg) {
      it(`Deposit and delegate ${arg.name} many times`, async function () {
        await iVault.setTargetFlashCapacity(1n);
        let totalDelegated = 0n;
        const count = 10;
        for (let i = 0; i < count; i++) {
          const deposited = await arg.depositAmount();
          await iVault.connect(staker).deposit(deposited, staker.address);
          const delegated = await iVault.getFreeBalance();
          await iVault
            .connect(iVaultOperator)
            .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, delegated, emptyBytes);

          totalDelegated += deposited;
        }
        console.log(`Final ratio:\t${(await iVault.ratio()).format()}`);
        console.log(`Total delegated:\t${totalDelegated.format()}`);

        const balanceExpected = (totalDelegated * ratio) / e18;
        const totalSupplyExpected = balanceExpected + firstDeposit;
        const err = BigInt(count) * transactErr * 2n;

        const balanceAfter = await iToken.balanceOf(staker.address);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
        );
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Staker balance after: ${balanceAfter.format()}`);
        console.log(`Total deposited after: ${totalDepositedAfter.format()}`);
        console.log(`Total delegated after: ${totalDelegatedAfter.format()}`);
        console.log(`Total delegatedTo after: ${totalDelegatedToAfter.format()}`);
        console.log(`Total assets after: ${totalAssetsAfter.format()}`);

        expect(balanceAfter - balanceExpected).to.be.closeTo(0, err);
        expect(totalDepositedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0n, err);
        expect(totalDelegatedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0n, err);
        expect(totalSupplyAfter - totalSupplyExpected).to.be.closeTo(0, err);
        expect(totalAssetsAfter).to.be.lte(transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, BigInt(count) * ratioErr);
      });
    });

    const args2 = [
      {
        name: "by the same staker",
        staker: async () => staker,
      },
      {
        name: "by different stakers",
        staker: async () => await getRandomStaker(iVault, asset, staker3, toWei(1)),
      },
    ];

    args2.forEach(function (arg) {
      it(`Deposit many times and delegate once ${arg.name}`, async function () {
        await iVault.setTargetFlashCapacity(1n);
        let totalDeposited = 0n;
        const count = 10;
        for (let i = 0; i < count; i++) {
          const staker = await arg.staker();
          const deposited = await randomBI(18);
          await iVault.connect(staker).deposit(deposited, staker.address);
          totalDeposited += deposited;
        }
        const totalDelegated = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, totalDelegated, emptyBytes);

        console.log(`Final ratio:\t${await iVault.ratio()}`);
        console.log(`Total deposited:\t${totalDeposited.format()}`);
        console.log(`Total delegated:\t${totalDelegated.format()}`);

        const balanceExpected = (totalDelegated * ratio) / e18;
        const totalSupplyExpected = balanceExpected + firstDeposit;
        const err = BigInt(count) * transactErr * 2n;

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
        );
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Total deposited after: ${totalDepositedAfter.format()}`);
        console.log(`Total delegated after: ${totalDelegatedAfter.format()}`);
        console.log(`Total delegatedTo after: ${totalDelegatedToAfter.format()}`);
        console.log(`Total assets after: ${totalAssetsAfter.format()}`);

        expect(totalDepositedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0n, err);
        expect(totalDelegatedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0n, err);
        expect(totalSupplyAfter - totalSupplyExpected).to.be.closeTo(0n, err);
        expect(totalAssetsAfter).to.be.lte(transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, BigInt(count) * ratioErr);
      });
    });

    const args3 = [
      {
        name: "to the different operators",
        count: 20,
        mellowVault: i => mellowVaults[i % mellowVaults.length].vaultAddress,
      },
      {
        name: "to the same operator",
        count: 10,
        mellowVault: i => mellowVaults[0].vaultAddress,
      },
    ];

    args3.forEach(function (arg) {
      it(`Delegate many times ${arg.name}`, async function () {
        for (let i = 1; i < mellowVaults.length; i++) {
          await mellowAdapter.addMellowVault(mellowVaults[i].vaultAddress);
        }

        await iVault.setTargetFlashCapacity(1n);
        //Deposit by 2 stakers
        const totalDelegated = toWei(60);
        await iVault.connect(staker).deposit(totalDelegated / 2n, staker.address);
        await iVault.connect(staker2).deposit(totalDelegated / 2n, staker2.address);
        //Delegate
        for (let i = 0; i < arg.count; i++) {
          const taBefore = await iVault.totalAssets();
          const mVault = arg.mellowVault(i);
          console.log(`#${i} mellow vault: ${mVault}`);
          const fb = await iVault.getFreeBalance();
          const amount = fb / BigInt(arg.count - i);
          await expect(
            iVault.connect(iVaultOperator).delegate(await mellowAdapter.getAddress(), mVault, amount, emptyBytes),
          )
            .to.emit(iVault, "DelegatedTo")
            .withArgs(mellowAdapter.address, mVault, amount);

          const taAfter = await iVault.totalAssets();
          expect(taBefore - taAfter).to.be.closeTo(amount, transactErr);
        }
        console.log(`Final ratio:\t${await iVault.ratio()}`);

        const balanceExpected = (totalDelegated * ratio) / e18;
        const totalSupplyExpected = balanceExpected + firstDeposit;
        const err = BigInt(arg.count) * transactErr * 2n;

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
        );
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Total deposited after: ${totalDepositedAfter.format()}`);
        console.log(`Total delegated after: ${totalDelegatedAfter.format()}`);
        console.log(`Total delegatedTo after: ${totalDelegatedToAfter.format()}`);
        console.log(`Total assets after: ${totalAssetsAfter.format()}`);

        expect(totalDepositedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0, err);
        expect(totalDelegatedAfter - ((firstDeposit * e18) / ratio + totalDelegated)).to.be.closeTo(0, err);
        expect(totalSupplyAfter - totalSupplyExpected).to.be.closeTo(0, err);
        expect(totalAssetsAfter).to.be.lte(transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, BigInt(arg.count) * ratioErr);
      });
    });

    //Delegate invalid params
    const invalidArgs = [
      {
        name: "amount is 0",
        deposited: toWei(1),
        amount: async () => 0n,
        mVault: async () => mellowVaults[0].vaultAddress,
        operator: () => iVaultOperator,
      },
      {
        name: "amount is greater than free balance",
        deposited: toWei(10),
        targetCapacityPercent: e18,
        amount: async () => (await iVault.getFreeBalance()) + 1n,
        mVault: async () => mellowVaults[0].vaultAddress,
        operator: () => iVaultOperator,
        customError: "InsufficientCapacity",
        source: () => iVault,
      },
      // {
      //   name: "unknown mellow vault",
      //   deposited: toWei(1),
      //   amount: async () => await iVault.getFreeBalance(),
      //   mVault: async () => mellowVaults[1].vaultAddress,
      //   operator: () => iVaultOperator,
      //   customError: "InactiveWrapper",
      //   source: () => mellowAdapter,
      // },
      // {
      //   name: "mellow vault is zero address",
      //   deposited: toWei(1),
      //   amount: async () => await iVault.getFreeBalance(),
      //   mVault: async () => ethers.ZeroAddress,
      //   operator: () => iVaultOperator,
      //   customError: "NullParams",
      //   source: () => iVault,
      // },
      {
        name: "caller is not an operator",
        deposited: toWei(1),
        amount: async () => await iVault.getFreeBalance(),
        mVault: async () => mellowVaults[0].vaultAddress,
        operator: () => staker,
        customError: "OnlyOperatorAllowed",
        source: () => iVault,
      },
    ];

    invalidArgs.forEach(function (arg) {
      it(`delegateToMellowVault reverts when ${arg.name}`, async function () {
        if (arg.targetCapacityPercent) {
          await iVault.setTargetFlashCapacity(arg.targetCapacityPercent);
        }
        await asset.connect(staker3).approve(await iVault.getAddress(), arg.deposited);
        await iVault.connect(staker3).deposit(arg.deposited, staker3.address);

        const operator = arg.operator();
        const delegateAmount = await arg.amount();
        const mVault = await arg.mVault();

        if (arg.customError) {
          await expect(
            iVault.connect(operator).delegate(await mellowAdapter.getAddress(), mVault, delegateAmount, emptyBytes),
          ).to.be.revertedWithCustomError(arg.source(), arg.customError);
        } else {
          await expect(
            iVault.connect(operator).delegate(await mellowAdapter.getAddress(), mVault, delegateAmount, emptyBytes),
          ).to.be.reverted;
        }
      });
    });

    it("delegateToMellowVault reverts when iVault is paused", async function () {
      const amount = randomBI(18);
      await iVault.connect(staker).deposit(amount, staker.address);
      await iVault.pause();
      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes),
      ).to.be.revertedWith("Pausable: paused");
    });

    it("delegateToMellowVault reverts when mellowAdapter is paused", async function () {
      if (await iVault.paused()) {
        await iVault.unpause();
      }
      const amount = randomBI(18);
      await iVault.connect(staker).deposit(amount, staker.address);
      await mellowAdapter.pause();

      await expect(
        iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes),
      ).to.be.revertedWith("Pausable: paused");
      await mellowAdapter.unpause();
    });
  });
});
