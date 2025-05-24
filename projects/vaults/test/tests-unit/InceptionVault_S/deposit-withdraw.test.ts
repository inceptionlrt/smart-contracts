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
  randomBIMax,
  toWei
} from "../../helpers/utils";
import { adapters, emptyBytes } from "../../src/constants";
import { initVault, MAX_TARGET_PERCENT } from "../../src/init-vault";

const { ethers, network } = hardhat;
const assetData = stETH;
const mellowVaults = vaults.mellow;

describe(`Inception Symbiotic Vault ${assetData.assetName}`, function () {
  let iToken, iVault, ratioFeed, asset, mellowAdapter, withdrawalQueue;
  let iVaultOperator, staker, staker2, staker3, treasury;
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
      = await initVault(assetData, { adapters: [adapters.Mellow, adapters.Symbiotic] }));

    ratioErr = assetData.ratioErr;
    transactErr = assetData.transactErr;

    [, staker, staker2, staker3] = await ethers.getSigners();

    staker = await assetData.impersonateStaker(staker, iVault);
    staker2 = await assetData.impersonateStaker(staker2, iVault);
    staker3 = await assetData.impersonateStaker(staker3, iVault);
    treasury = await iVault.treasury(); //deployer

    snapshot = await helpers.takeSnapshot();
  });

  after(async function () {
    await iVault?.removeAllListeners();
  });

  describe("Deposit bonus params setter and calculation", function () {
    let targetCapacityPercent, MAX_PERCENT, localSnapshot;
    before(async function () {
      await iVault.setTargetFlashCapacity(1n);
      MAX_PERCENT = await iVault.MAX_PERCENT();
    });

    const depositBonusSegment = [
      {
        fromUtilization: async () => 0n,
        fromPercent: async () => await iVault.maxBonusRate(),
        toUtilization: async () => await iVault.depositUtilizationKink(),
        toPercent: async () => await iVault.optimalBonusRate(),
      },
      {
        fromUtilization: async () => await iVault.depositUtilizationKink(),
        fromPercent: async () => await iVault.optimalBonusRate(),
        toUtilization: async () => await iVault.MAX_PERCENT(),
        toPercent: async () => await iVault.optimalBonusRate(),
      },
      {
        fromUtilization: async () => await iVault.MAX_PERCENT(),
        fromPercent: async () => 0n,
        toUtilization: async () => ethers.MaxUint256,
        toPercent: async () => 0n,
      },
    ];

    const args = [
      {
        name: "Normal bonus rewards profile > 0",
        newMaxBonusRate: BigInt(2 * 10 ** 8), //2%
        newOptimalBonusRate: BigInt(0.2 * 10 ** 8), //0.2%
        newDepositUtilizationKink: BigInt(25 * 10 ** 8), //25%
      },
      {
        name: "Optimal utilization = 0 => always optimal rate",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: BigInt(10 ** 8), //1%
        newDepositUtilizationKink: 0n,
      },
      {
        name: "Optimal bonus rate = 0",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: 0n,
        newDepositUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal bonus rate = max > 0 => rate is constant over utilization",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: BigInt(2 * 10 ** 8),
        newDepositUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal bonus rate = max = 0 => no bonus",
        newMaxBonusRate: 0n,
        newOptimalBonusRate: 0n,
        newDepositUtilizationKink: BigInt(25 * 10 ** 8),
      },
      //Will fail when OptimalBonusRate > MaxBonusRate
    ];

    const amounts = [
      {
        name: "min amount from 0",
        flashCapacity: targetCapacity => 0n,
        amount: async () => (await iVault.convertToAssets(await iVault.withdrawMinAmount())) + 1n,
      },
      {
        name: "1 wei from 0",
        flashCapacity: targetCapacity => 0n,
        amount: async () => 1n,
      },
      {
        name: "from 0 to 25% of TARGET",
        flashCapacity: targetCapacity => 0n,
        amount: async () => (targetCapacityPercent * 25n) / 100n,
      },
      {
        name: "from 0 to 25% + 1wei of TARGET",
        flashCapacity: targetCapacity => 0n,
        amount: async () => (targetCapacityPercent * 25n) / 100n,
      },
      {
        name: "from 25% to 100% of TARGET",
        flashCapacity: targetCapacity => (targetCapacity * 25n) / 100n,
        amount: async () => (targetCapacityPercent * 75n) / 100n,
      },
      {
        name: "from 0% to 100% of TARGET",
        flashCapacity: targetCapacity => 0n,
        amount: async () => targetCapacityPercent,
      },
      {
        name: "from 0% to 200% of TARGET",
        flashCapacity: targetCapacity => 0n,
        amount: async () => targetCapacityPercent * 2n,
      },
    ];

    args.forEach(function (arg) {
      it(`setDepositBonusParams: ${arg.name}`, async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await expect(
          iVault.setDepositBonusParams(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newDepositUtilizationKink),
        )
          .to.emit(iVault, "DepositBonusParamsChanged")
          .withArgs(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newDepositUtilizationKink);
        expect(await iVault.maxBonusRate()).to.be.eq(arg.newMaxBonusRate);
        expect(await iVault.optimalBonusRate()).to.be.eq(arg.newOptimalBonusRate);
        expect(await iVault.depositUtilizationKink()).to.be.eq(arg.newDepositUtilizationKink);
        localSnapshot = await helpers.takeSnapshot();
      });

      amounts.forEach(function (amount) {
        it(`calculateDepositBonus for ${amount.name}`, async function () {
          await localSnapshot.restore();
          const deposited = toWei(100);
          targetCapacityPercent = e18;
          const targetCapacity = (deposited * targetCapacityPercent) / MAX_TARGET_PERCENT;
          await iVault.connect(staker).deposit(deposited, staker.address);
          let flashCapacity = amount.flashCapacity(targetCapacity);
          await iVault
            .connect(iVaultOperator)
            .delegate(
              await mellowAdapter.getAddress(),
              mellowVaults[0].vaultAddress,
              deposited - flashCapacity - 1n,
              emptyBytes,
            );
          await iVault.setTargetFlashCapacity(targetCapacityPercent); //1%
          console.log(`Flash capacity:\t\t${await iVault.getFlashCapacity()}`);

          let _amount = await amount.amount();
          let depositBonus = 0n;
          while (_amount > 0n) {
            for (const feeFunc of depositBonusSegment) {
              const utilization = (flashCapacity * MAX_PERCENT) / targetCapacity;
              const fromUtilization = await feeFunc.fromUtilization();
              const toUtilization = await feeFunc.toUtilization();
              if (_amount > 0n && fromUtilization <= utilization && utilization < toUtilization) {
                const fromPercent = await feeFunc.fromPercent();
                const toPercent = await feeFunc.toPercent();
                const upperBound = (toUtilization * targetCapacityPercent) / MAX_PERCENT;
                const replenished = upperBound > flashCapacity + _amount ? _amount : upperBound - flashCapacity;
                const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                const bonusPercent = fromPercent + (slope * (flashCapacity + replenished / 2n)) / targetCapacityPercent;
                const bonus = (replenished * bonusPercent) / MAX_PERCENT;
                console.log(`Replenished:\t\t\t${replenished.format()}`);
                console.log(`Bonus percent:\t\t\t${bonusPercent.format()}`);
                console.log(`Bonus:\t\t\t\t\t${bonus.format()}`);
                flashCapacity += replenished;
                _amount -= replenished;
                depositBonus += bonus;
              }
            }
          }
          const contractBonus = await iVault.calculateDepositBonus(await amount.amount());
          console.log(`Expected deposit bonus:\t${depositBonus.format()}`);
          console.log(`Contract deposit bonus:\t${contractBonus.format()}`);
          expect(contractBonus).to.be.closeTo(depositBonus, 1n);
        });
      });
    });

    const invalidArgs = [
      {
        name: "MaxBonusRate > MAX_PERCENT",
        newMaxBonusRate: () => MAX_PERCENT + 1n,
        newOptimalBonusRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newDepositUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "OptimalBonusRate > MAX_PERCENT",
        newMaxBonusRate: () => BigInt(2 * 10 ** 8),
        newOptimalBonusRate: () => MAX_PERCENT + 1n,
        newDepositUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "DepositUtilizationKink > MAX_PERCENT",
        newMaxBonusRate: () => BigInt(2 * 10 ** 8),
        newOptimalBonusRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newDepositUtilizationKink: () => MAX_PERCENT + 1n,
        customError: "ParameterExceedsLimits",
      },
      {
        name: "newOptimalBonusRate > newMaxBonusRate",
        newMaxBonusRate: () => BigInt(0.2 * 10 ** 8),
        newOptimalBonusRate: () => BigInt(2 * 10 ** 8),
        newDepositUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "InconsistentData",
      },
    ];
    invalidArgs.forEach(function (arg) {
      it(`setDepositBonusParams reverts when ${arg.name}`, async function () {
        await expect(
          iVault.setDepositBonusParams(
            arg.newMaxBonusRate(),
            arg.newOptimalBonusRate(),
            arg.newDepositUtilizationKink(),
          ),
        ).to.be.revertedWithCustomError(iVault, arg.customError);
      });
    });

    it("setDepositBonusParams reverts when caller is not an owner", async function () {
      await expect(
        iVault.connect(staker).setDepositBonusParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Withdraw fee params setter and calculation", function () {
    let targetCapacityPercent, MAX_PERCENT, localSnapshot;
    before(async function () {
      MAX_PERCENT = await iVault.MAX_PERCENT();
    });

    const withdrawFeeSegment = [
      {
        fromUtilization: async () => 0n,
        fromPercent: async () => await iVault.maxFlashFeeRate(),
        toUtilization: async () => await iVault.withdrawUtilizationKink(),
        toPercent: async () => await iVault.optimalWithdrawalRate(),
      },
      {
        fromUtilization: async () => await iVault.withdrawUtilizationKink(),
        fromPercent: async () => await iVault.optimalWithdrawalRate(),
        toUtilization: async () => ethers.MaxUint256,
        toPercent: async () => await iVault.optimalWithdrawalRate(),
      },
    ];

    const args = [
      {
        name: "Normal withdraw fee profile > 0",
        newMaxFlashFeeRate: BigInt(2 * 10 ** 8), //2%
        newOptimalWithdrawalRate: BigInt(0.2 * 10 ** 8), //0.2%
        newWithdrawUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal utilization = 0 => always optimal rate",
        newMaxFlashFeeRate: BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: BigInt(10 ** 8), //1%
        newWithdrawUtilizationKink: 0n,
      },
      {
        name: "Optimal withdraw rate = 0",
        newMaxFlashFeeRate: BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: 0n,
        newWithdrawUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal withdraw rate = max > 0 => rate is constant over utilization",
        newMaxFlashFeeRate: BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: BigInt(2 * 10 ** 8),
        newWithdrawUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal withdraw rate = max = 0 => no fee",
        newMaxFlashFeeRate: 0n,
        newOptimalWithdrawalRate: 0n,
        newWithdrawUtilizationKink: BigInt(25 * 10 ** 8),
      },
      //Will fail when optimalWithdrawalRate > MaxFlashFeeRate
    ];

    const amounts = [
      {
        name: "from 200% to 0% of TARGET",
        flashCapacity: targetCapacity => targetCapacity * 2n,
        amount: async () => await iVault.getFlashCapacity(),
      },
      {
        name: "from 100% to 0% of TARGET",
        flashCapacity: targetCapacity => targetCapacity,
        amount: async () => await iVault.getFlashCapacity(),
      },
      {
        name: "1 wei from 100%",
        flashCapacity: targetCapacity => targetCapacity,
        amount: async () => 1n,
      },
      {
        name: "min amount from 100%",
        flashCapacity: targetCapacity => targetCapacity,
        amount: async () => (await iVault.convertToAssets(await iVault.withdrawMinAmount())) + 1n,
      },
      {
        name: "from 100% to 25% of TARGET",
        flashCapacity: targetCapacity => targetCapacity,
        amount: async () => (targetCapacityPercent * 75n) / 100n,
      },
      {
        name: "from 100% to 25% - 1wei of TARGET",
        flashCapacity: targetCapacity => targetCapacity,
        amount: async () => (targetCapacityPercent * 75n) / 100n + 1n,
      },
      {
        name: "from 25% to 0% of TARGET",
        flashCapacity: targetCapacity => (targetCapacity * 25n) / 100n,
        amount: async () => await iVault.getFlashCapacity(),
      },
    ];

    args.forEach(function (arg) {
      it(`setFlashWithdrawFeeParams: ${arg.name}`, async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await expect(
          iVault.setFlashWithdrawFeeParams(
            arg.newMaxFlashFeeRate,
            arg.newOptimalWithdrawalRate,
            arg.newWithdrawUtilizationKink,
          ),
        )
          .to.emit(iVault, "WithdrawFeeParamsChanged")
          .withArgs(arg.newMaxFlashFeeRate, arg.newOptimalWithdrawalRate, arg.newWithdrawUtilizationKink);

        expect(await iVault.maxFlashFeeRate()).to.be.eq(arg.newMaxFlashFeeRate);
        expect(await iVault.optimalWithdrawalRate()).to.be.eq(arg.newOptimalWithdrawalRate);
        expect(await iVault.withdrawUtilizationKink()).to.be.eq(arg.newWithdrawUtilizationKink);
        localSnapshot = await helpers.takeSnapshot();
      });

      amounts.forEach(function (amount) {
        it(`calculateFlashWithdrawFee for: ${amount.name}`, async function () {
          await localSnapshot.restore();
          const deposited = toWei(100);
          targetCapacityPercent = e18;
          const targetCapacity = (deposited * targetCapacityPercent) / MAX_TARGET_PERCENT;
          await iVault.connect(staker).deposit(deposited, staker.address);
          let flashCapacity = amount.flashCapacity(targetCapacity);
          await iVault
            .connect(iVaultOperator)
            .delegate(
              await mellowAdapter.getAddress(),
              mellowVaults[0].vaultAddress,
              deposited - flashCapacity - 1n,
              emptyBytes,
            );
          await iVault.setTargetFlashCapacity(targetCapacityPercent); //1%
          console.log(`Flash capacity:\t\t\t${await iVault.getFlashCapacity()}`);

          let _amount = await amount.amount();
          let withdrawFee = 0n;
          while (_amount > 1n) {
            for (const feeFunc of withdrawFeeSegment) {
              const utilization = (flashCapacity * MAX_PERCENT) / targetCapacity;
              const fromUtilization = await feeFunc.fromUtilization();
              const toUtilization = await feeFunc.toUtilization();
              if (_amount > 0n && fromUtilization < utilization && utilization <= toUtilization) {
                console.log(`Utilization:\t\t\t${utilization.format()}`);
                const fromPercent = await feeFunc.fromPercent();
                const toPercent = await feeFunc.toPercent();
                const lowerBound = (fromUtilization * targetCapacityPercent) / MAX_PERCENT;
                const replenished = lowerBound > flashCapacity - _amount ? flashCapacity - lowerBound : _amount;
                const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                const withdrawFeePercent =
                  fromPercent + (slope * (flashCapacity - replenished / 2n)) / targetCapacityPercent;
                const fee = (replenished * withdrawFeePercent) / MAX_PERCENT;
                console.log(`Replenished:\t\t\t${replenished.format()}`);
                console.log(`Fee percent:\t\t\t${withdrawFeePercent.format()}`);
                console.log(`Fee:\t\t\t\t\t${fee.format()}`);
                flashCapacity -= replenished;
                _amount -= replenished;
                withdrawFee += fee;
              }
            }
          }
          const contractFee = await iVault.calculateFlashWithdrawFee(await amount.amount());
          console.log(`Expected withdraw fee:\t${withdrawFee.format()}`);
          console.log(`Contract withdraw fee:\t${contractFee.format()}`);
          expect(contractFee).to.be.closeTo(withdrawFee, 1n);
          expect(contractFee).to.be.gt(0n); //flashWithdraw fee is always greater than 0
        });
      });
    });

    const invalidArgs = [
      {
        name: "MaxBonusRate > MAX_PERCENT",
        newMaxFlashFeeRate: () => MAX_PERCENT + 1n,
        newOptimalWithdrawalRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newWithdrawUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "OptimalBonusRate > MAX_PERCENT",
        newMaxFlashFeeRate: () => BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: () => MAX_PERCENT + 1n,
        newWithdrawUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "DepositUtilizationKink > MAX_PERCENT",
        newMaxFlashFeeRate: () => BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newWithdrawUtilizationKink: () => MAX_PERCENT + 1n,
        customError: "ParameterExceedsLimits",
      },
      {
        name: "newOptimalWithdrawalRate > newMaxFlashFeeRate",
        newMaxFlashFeeRate: () => BigInt(2 * 10 ** 8),
        newOptimalWithdrawalRate: () => BigInt(3 * 10 ** 8),
        newWithdrawUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "InconsistentData",
      },
    ];
    invalidArgs.forEach(function (arg) {
      it(`setFlashWithdrawFeeParams reverts when ${arg.name}`, async function () {
        await expect(
          iVault.setFlashWithdrawFeeParams(
            arg.newMaxFlashFeeRate(),
            arg.newOptimalWithdrawalRate(),
            arg.newWithdrawUtilizationKink(),
          ),
        ).to.be.revertedWithCustomError(iVault, arg.customError);
      });
    });

    it("calculateFlashWithdrawFee reverts when capacity is not sufficient", async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker, staker).deposit(randomBI(19), staker.address);
      const capacity = await iVault.getFlashCapacity();
      await expect(iVault.calculateFlashWithdrawFee(capacity + 1n))
        .to.be.revertedWithCustomError(iVault, "InsufficientCapacity")
        .withArgs(capacity);
    });

    it("setFlashWithdrawFeeParams reverts when caller is not an owner", async function () {
      await expect(
        iVault
          .connect(staker)
          .setFlashWithdrawFeeParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Deposit: user can restake asset", function () {
    let ratio;

    before(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker3).deposit(e18, staker3.address);
      const amount = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
      ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
      console.log(`Initial ratio: ${ratio.format()}`);
    });

    afterEach(async function () {
      if (await iVault.paused()) {
        await iVault.unpause();
      }
    });

    it("maxDeposit: returns max amount that can be delegated to strategy", async function () {
      expect(await iVault.maxDeposit(staker.address)).to.equal(2n ** 256n - 1n)
    });

    const args = [
      {
        amount: async () => 4798072939323319141n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 999999999999999999n,
        receiver: () => ethers.Wallet.createRandom().address,
      },
      {
        amount: async () => 888888888888888888n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 777777777777777777n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 666666666666666666n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 555555555555555555n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 444444444444444444n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 333333333333333333n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 222222222222222222n,
        receiver: () => staker.address,
      },
      {
        amount: async () => 111111111111111111n,
        receiver: () => staker.address,
      },
      {
        amount: async () => (await iVault.convertToAssets(await iVault.withdrawMinAmount())) + 1n,
        receiver: () => staker.address,
      },
    ];

    args.forEach(function (arg) {
      it(`Deposit amount ${arg.amount}`, async function () {
        const receiver = arg.receiver();
        const balanceBefore = await iToken.balanceOf(receiver);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();

        const amount = await arg.amount();
        const convertedShares = await iVault.convertToShares(amount);
        const expectedShares = (amount * (await iVault.ratio())) / e18;

        const tx = await iVault.connect(staker).deposit(amount, receiver);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(receiver);
        expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
        expect(events[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);

        const balanceAfter = await iToken.balanceOf(receiver);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const ratioAfter = await iVault.ratio();
        console.log(`Ratio after: ${ratioAfter}`);

        expect(balanceAfter - balanceBefore).to.be.closeTo(expectedShares, transactErr);
        expect(balanceAfter - balanceBefore).to.be.closeTo(convertedShares, transactErr);

        expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount, transactErr);
        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
        expect(ratioAfter).to.be.closeTo(ratio, ratioErr); //Ratio stays the same
      });

      it(`Mint amount ${arg.amount}`, async function () {
        const receiver = arg.receiver();
        const balanceBefore = await iToken.balanceOf(receiver);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();

        const shares = await arg.amount();
        const convertedAmount = await iVault.convertToAssets(shares);

        const tx = await iVault.connect(staker).mint(shares, receiver);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(receiver);
        expect(events[0].args["amount"]).to.be.closeTo(convertedAmount, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(shares, transactErr);

        const balanceAfter = await iToken.balanceOf(receiver);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const ratioAfter = await iVault.ratio();
        console.log(`Ratio after: ${ratioAfter}`);

        expect(balanceAfter - balanceBefore).to.be.closeTo(shares, transactErr);
        expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(convertedAmount, transactErr);
        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(convertedAmount, transactErr); //Everything stays on iVault after deposit
        expect(ratioAfter).to.be.closeTo(ratio, ratioErr); //Ratio stays the same
      });

      it("Delegate free balance", async function () {
        const delegatedBefore = await iVault.getDelegatedTo(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
        );
        const totalDepositedBefore = await iVault.getTotalDeposited();
        console.log(`Delegated before: ${delegatedBefore}`);
        console.log(`Total deposited before: ${totalDepositedBefore}`);

        const amount = await iVault.getFreeBalance();
        await expect(
          iVault
            .connect(iVaultOperator)
            .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes),
        )
          .to.emit(iVault, "DelegatedTo")
          .withArgs(mellowAdapter.address, mellowVaults[0].vaultAddress, amount);

        const delegatedAfter = await iVault.getDelegatedTo(
          await mellowAdapter.getAddress(),
          mellowVaults[0].vaultAddress,
        );
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const ratioAfter = await iVault.ratio();
        console.log(`Ratio after: ${ratioAfter}`);

        expect(delegatedAfter - delegatedBefore).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(totalAssetsAfter).to.be.lte(transactErr);
      });
    });

    it("Deposit with Referral code", async function () {
      const receiver = staker;
      const balanceBefore = await iToken.balanceOf(receiver);
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalAssetsBefore = await iVault.totalAssets();
      const amount = await toWei(1);
      const convertedShares = await iVault.convertToShares(amount);
      const expectedShares = (amount * (await iVault.ratio())) / e18;
      const code = ethers.encodeBytes32String(randomAddress().slice(0, 8));
      const tx = await iVault.connect(staker2).depositWithReferral(amount, receiver, code);
      const receipt = await tx.wait();
      let events = receipt.logs?.filter(e => {
        return e.eventName === "Deposit";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker2.address);
      expect(events[0].args["receiver"]).to.be.eq(receiver);
      expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
      expect(events[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);
      //Code event
      events = receipt.logs?.filter(e => {
        return e.eventName === "ReferralCode";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["code"]).to.be.eq(code);

      const balanceAfter = await iToken.balanceOf(receiver);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();

      expect(balanceAfter - balanceBefore).to.be.closeTo(expectedShares, transactErr);
      expect(balanceAfter - balanceBefore).to.be.closeTo(convertedShares, transactErr);

      expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount, transactErr);
      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
      expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr); //Ratio stays the same
    });

    const depositInvalidArgs = [
      {
        name: "amount is 0",
        amount: async () => 0n,
        receiver: () => staker.address,
        isCustom: true,
        error: "LowerMinAmount",
      },
      {
        name: "amount < min",
        amount: async () => (await iVault.withdrawMinAmount()) - 1n,
        receiver: () => staker.address,
        isCustom: true,
        error: "LowerMinAmount",
      },
      {
        name: "to zero address",
        amount: async () => randomBI(18),
        isCustom: true,
        receiver: () => ethers.ZeroAddress,
        error: "NullParams",
      },
    ];

    depositInvalidArgs.forEach(function (arg) {
      it(`Reverts when: deposit ${arg.name}`, async function () {
        const amount = await arg.amount();
        const receiver = arg.receiver();
        if (arg.isCustom) {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWithCustomError(
            iVault,
            arg.error,
          );
        } else {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWith(arg.error);
        }
      });
    });

    it("Reverts: deposit when iVault is paused", async function () {
      await iVault.pause();
      const depositAmount = randomBI(19);
      await expect(iVault.connect(staker).deposit(depositAmount, staker.address)).to.be.revertedWith(
        "Pausable: paused",
      );
    });

    it("Reverts: mint when iVault is paused", async function () {
      await iVault.pause();
      const shares = randomBI(19);
      await expect(iVault.connect(staker).mint(shares, staker.address)).to.be.revertedWith("Pausable: paused");
    });

    it("Reverts: depositWithReferral when iVault is paused", async function () {
      await iVault.pause();
      const depositAmount = randomBI(19);
      const code = ethers.encodeBytes32String(randomAddress().slice(0, 8));
      await expect(iVault.connect(staker2).depositWithReferral(depositAmount, staker, code)).to.be.revertedWith(
        "Pausable: paused",
      );
    });

    it("Reverts: deposit when targetCapacity is not set", async function () {
      await snapshot.restore();
      const depositAmount = randomBI(19);
      await expect(iVault.connect(staker).deposit(depositAmount, staker.address)).to.be.revertedWithCustomError(
        iVault,
        "NullParams",
      );
    });

    const convertSharesArgs = [
      {
        name: "amount = 0",
        amount: async () => 0n,
      },
      {
        name: "amount = 1",
        amount: async () => 0n,
      },
      {
        name: "amount < min",
        amount: async () => (await iVault.withdrawMinAmount()) - 1n,
      },
    ];

    convertSharesArgs.forEach(function (arg) {
      it(`Convert to shares: ${arg.name}`, async function () {
        const amount = await arg.amount();
        const ratio = await iVault.ratio();
        expect(await iVault.convertToShares(amount)).to.be.eq((amount * ratio) / e18);
      });
    });

    // it.skip("Max mint and deposit", async function () {
    //   const stakerBalance = await asset.balanceOf(staker);
    //   const calculatedBonus = await iVault.calculateDepositBonus(stakerBalance);
    //   const realBonus = await iVault.depositBonusAmount();
    //   const bonus = realBonus > calculatedBonus ? calculatedBonus : realBonus;
    //   expect(await iVault.maxDeposit(staker)).to.be.eq(stakerBalance);
    // });

    it("Max mint and deposit when iVault is paused equal 0", async function () {
      await iVault.pause();
      const maxMint = await iVault.maxMint(staker);
      const maxDeposit = await iVault.maxDeposit(staker);
      expect(maxMint).to.be.eq(0n);
      expect(maxDeposit).to.be.eq(0n);
    });

    // it("Max mint and deposit reverts when > available amount", async function() {
    //   const maxMint = await iVault.maxMint(staker);
    //   await expect(iVault.connect(staker).mint(maxMint + 1n, staker.address)).to.be.revertedWithCustomError(
    //     iVault,
    //     "ExceededMaxMint",
    //   );
    // });
  });

  describe("Deposit with bonus for replenish", function () {
    const states = [
      // {
      //   name: "deposit bonus = 0",
      //   withBonus: false,
      // },
      {
        name: "deposit bonus > 0",
        withBonus: true,
      },
    ];

    const amounts = [
      {
        name: "for the first time",
        predepositAmount: targetCapacity => 0n,
        amount: targetCapacity => randomBIMax(targetCapacity / 4n) + targetCapacity / 4n,
        receiver: () => staker.address,
      },
      {
        name: "more",
        predepositAmount: targetCapacity => targetCapacity / 3n,
        amount: targetCapacity => randomBIMax(targetCapacity / 3n),
        receiver: () => staker.address,
      },
      {
        name: "up to target cap",
        predepositAmount: targetCapacity => targetCapacity / 10n,
        amount: targetCapacity => (targetCapacity * 9n) / 10n,
        receiver: () => staker.address,
      },
      {
        name: "all rewards",
        predepositAmount: targetCapacity => 0n,
        amount: targetCapacity => targetCapacity,
        receiver: () => staker.address,
      },
      {
        name: "up to target cap and above",
        predepositAmount: targetCapacity => targetCapacity / 10n,
        amount: targetCapacity => targetCapacity,
        receiver: () => staker.address,
      },
      {
        name: "above target cap",
        predepositAmount: targetCapacity => targetCapacity,
        amount: targetCapacity => randomBI(19),
        receiver: () => staker.address,
      },
    ];

    states.forEach(function (state) {
      let localSnapshot;
      const targetCapacityPercent = e18;
      const targetCapacity = e18;
      it(`---Prepare state: ${state.name}`, async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await iVault.setDepositMinAmount(1n);
        const deposited = (targetCapacity * MAX_TARGET_PERCENT) / targetCapacityPercent;
        if (state.withBonus) {
          await iVault.setTargetFlashCapacity(targetCapacityPercent);
          await iVault.connect(staker3).deposit(toWei(1.5), staker3.address);
          const balanceOf = await iToken.balanceOf(staker3.address);
          await iVault.connect(staker3)["flashWithdraw(uint256,address,uint256)"](balanceOf, staker3.address, 0n);
          await iVault.setTargetFlashCapacity(1n);
        }

        await iVault.connect(staker3).deposit(deposited, staker3.address);
        console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
        console.log(`Deposit bonus:\t\t${(await iVault.depositBonusAmount()).format()}`);
        localSnapshot = await helpers.takeSnapshot();
      });

      // it.skip("Max mint and deposit", async function () {
      //   const stakerBalance = await asset.balanceOf(staker);
      //   const calculatedBonus = await iVault.calculateDepositBonus(stakerBalance);
      //   const realBonus = await iVault.depositBonusAmount();
      //   const bonus = realBonus > calculatedBonus ? calculatedBonus : realBonus;
      //   // expect(await iVault.maxMint(staker)).to.be.eq(await iVault.convertToShares(stakerBalance + bonus));
      //   expect(await iVault.maxDeposit(staker)).to.be.eq(stakerBalance);
      // });

      amounts.forEach(function (arg) {
        it(`Deposit ${arg.name}`, async function () {
          if (localSnapshot) {
            await localSnapshot.restore();
          } else {
            expect(false).to.be.true("Can not restore local snapshot");
          }

          const flashCapacityBefore = arg.predepositAmount(targetCapacity);
          const freeBalance = await iVault.getFreeBalance();
          await iVault
            .connect(iVaultOperator)
            .delegate(
              await mellowAdapter.getAddress(),
              mellowVaults[0].vaultAddress,
              freeBalance - flashCapacityBefore,
              emptyBytes,
            );
          await iVault.setTargetFlashCapacity(targetCapacityPercent);
          await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
          const calculatedRatio = await calculateRatio(iVault, iToken);
          await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
          const ratioBefore = await iVault.ratio();

          let availableBonus = await iVault.depositBonusAmount();
          const receiver = arg.receiver();
          const stakerSharesBefore = await iToken.balanceOf(receiver);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const totalAssetsBefore = await iVault.totalAssets();
          console.log(`Target capacity:\t\t${targetCapacity.format()}`);
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount(targetCapacity);
          console.log(`Amount:\t\t\t\t\t${amount.format()}`);
          const calculatedBonus = await iVault.calculateDepositBonus(amount);
          console.log(`Calculated bonus:\t\t${calculatedBonus.format()}`);
          console.log(`Available bonus:\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t${expectedBonus.format()}`);
          const convertedShares = await iVault.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await iVault.ratio())) / e18;
          const previewShares = await iVault.previewDeposit(amount);

          const tx = await iVault.connect(staker).deposit(amount, receiver);
          const receipt = await tx.wait();
          const depositEvent = receipt.logs?.filter(e => e.eventName === "Deposit");
          expect(depositEvent.length).to.be.eq(1);
          expect(depositEvent[0].args["sender"]).to.be.eq(staker.address);
          expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
          expect(depositEvent[0].args["amount"]).to.be.closeTo(amount, transactErr);
          expect(depositEvent[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);
          //DepositBonus event
          expect(receipt.logs.find(l => l.eventName === "DepositBonus")?.args.amount || 0n).to.be.closeTo(
            expectedBonus,
            transactErr,
          );

          const stakerSharesAfter = await iToken.balanceOf(receiver);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalAssetsAfter = await iVault.totalAssets();
          const flashCapacityAfter = await iVault.getFlashCapacity();
          const ratioAfter = await iVault.ratio();
          console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
          console.log(`Bonus after:\t\t\t${availableBonus.format()}`);

          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, transactErr);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, transactErr);

          expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount + expectedBonus, transactErr);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
          expect(flashCapacityAfter).to.be.closeTo(flashCapacityBefore + amount + expectedBonus, transactErr);
          expect(ratioAfter).to.be.closeTo(ratioBefore, ratioErr); //Ratio stays the same
          expect(previewShares).to.be.eq(stakerSharesAfter - stakerSharesBefore); //Ratio stays the same
        });
      });
    });
  });

  describe("Withdraw: user can unstake", function () {
    let ratio, totalDeposited, TARGET;

    before(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      const freeBalance = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, freeBalance, emptyBytes);
      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      totalDeposited = await iVault.getTotalDeposited();
      TARGET = 1000_000n;
      await iVault.setTargetFlashCapacity(TARGET);
      ratio = await iVault.ratio();
      console.log(`Initial ratio: ${ratio}`);
    });

    const testData = [
      {
        name: "random e18",
        amount: async shares => 724399519262012598n,
        receiver: () => staker.address,
      },
      {
        name: "999999999999999999",
        amount: async shares => 999999999999999999n,
        receiver: () => staker2.address,
      },
      {
        name: "888888888888888888",
        amount: async shares => 888888888888888888n,
        receiver: () => staker2.address,
      },
      {
        name: "777777777777777777",
        amount: async shares => 777777777777777777n,
        receiver: () => staker2.address,
      },
      {
        name: "666666666666666666",
        amount: async shares => 666666666666666666n,
        receiver: () => staker2.address,
      },
      {
        name: "555555555555555555",
        amount: async shares => 555555555555555555n,
        receiver: () => staker2.address,
      },
      {
        name: "444444444444444444",
        amount: async shares => 444444444444444444n,
        receiver: () => staker2.address,
      },
      {
        name: "333333333333333333",
        amount: async shares => 333333333333333333n,
        receiver: () => staker2.address,
      },
      {
        name: "222222222222222222",
        amount: async shares => 222222222222222222n,
        receiver: () => staker2.address,
      },
      {
        name: "111111111111111111",
        amount: async shares => 111111111111111111n,
        receiver: () => staker2.address,
      },
      {
        name: "min amount",
        amount: async shares => (await iVault.convertToAssets(await iVault.withdrawMinAmount())) + 1n,
        receiver: () => staker2.address,
      },
      {
        name: "all",
        amount: async shares => shares,
        receiver: () => staker2.address,
      },
    ];

    testData.forEach(function (test) {
      it(`Withdraw ${test.name}`, async function () {
        const ratioBefore = await iVault.ratio();
        const balanceBefore = await iToken.balanceOf(staker.address);
        const amount = await test.amount(balanceBefore);
        const assetValue = await iVault.convertToAssets(amount);
        const stakerPWBefore = await iVault.getPendingWithdrawalOf(test.receiver());
        const withdrawalEpochBefore = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
        const totalEpochSharesBefore = withdrawalEpochBefore[1];

        const tx = await iVault.connect(staker).withdraw(amount, test.receiver());
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
        const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(test.receiver());
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(assetValue, transactErr);
        expect(events[0].args["iShares"]).to.be.eq(amount);

        expect(balanceBefore - (await iToken.balanceOf(staker.address))).to.be.eq(amount);
        expect((await iVault.getPendingWithdrawalOf(test.receiver())) - stakerPWBefore).to.be.closeTo(
          assetValue,
          transactErr,
        );
        expect(epochShares - totalEpochSharesBefore).to.be.closeTo(amount, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratioBefore, ratioErr);
      });
    });
  });

  describe("Withdraw: negative cases", function () {
    before(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      const freeBalance = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, freeBalance, emptyBytes);
      await assetData.addRewardsMellowVault(toWei(0.001), mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
    });

    const invalidData = [
      {
        name: "> balance",
        amount: async () => (await iToken.balanceOf(staker.address)) + 1n,
        receiver: () => staker.address,
        error: "ERC20: burn amount exceeds balance",
      },
      {
        name: "< min amount",
        amount: async () => (await iVault.convertToShares(await iVault.withdrawMinAmount())) - 1n,
        receiver: () => staker.address,
        customError: "LowerMinAmount",
      },
      {
        name: "0",
        amount: async () => 0n,
        receiver: () => staker.address,
        customError: "NullParams",
      },
      {
        name: "to zero address",
        amount: async () => randomBI(18),
        receiver: () => ethers.ZeroAddress,
        customError: "InvalidAddress",
      },
    ];

    invalidData.forEach(function (test) {
      it(`Reverts: withdraws ${test.name}`, async function () {
        const amount = await test.amount();
        const receiver = test.receiver();
        if (test.customError) {
          await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWithCustomError(
            iVault,
            test.customError,
          );
        } else if (test.error) {
          await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWith(test.error);
        }
      });
    });

    it("Withdraw small amount many times", async function () {
      const ratioBefore = await iVault.ratio();
      console.log(`Ratio before:\t${ratioBefore.format()}`);

      const count = 100;
      const amount = await iVault.withdrawMinAmount();
      for (let i = 0; i < count; i++) {
        await iVault.connect(staker).withdraw(amount, staker.address);
      }
      const ratioAfter = await iVault.ratio();
      console.log(`Ratio after:\t${ratioAfter.format()}`);

      expect(ratioBefore - ratioAfter).to.be.closeTo(0, count);

      await iVault.connect(staker).withdraw(e18, staker.address);
      console.log(`Ratio after withdraw 1eth:\t${await iVault.ratio()}`);
      expect(await iVault.ratio()).to.be.closeTo(ratioAfter, ratioErr);
    });

    it("Reverts: withdraw when iVault is paused", async function () {
      await iVault.pause();
      await expect(iVault.connect(staker).withdraw(toWei(1), staker.address)).to.be.revertedWith("Pausable: paused");
      await iVault.unpause();
    });

    it("Reverts: withdraw when targetCapacity is not set", async function () {
      await snapshot.restore();
      await expect(iVault.connect(staker).withdraw(toWei(1), staker.address)).to.be.revertedWithCustomError(
        iVault,
        "NullParams",
      );
    });
  });

  describe("Flash withdraw with fee", function () {
    const targetCapacityPercent = e18;
    const targetCapacity = e18;
    let deposited = 0n;
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      deposited = (targetCapacity * MAX_TARGET_PERCENT) / targetCapacityPercent;
      await iVault.connect(staker3).deposit(deposited, staker.address);
      const freeBalance = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, freeBalance, emptyBytes);

      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      await iVault.setTargetFlashCapacity(targetCapacityPercent);
    });

    const args = [
      {
        name: "part of the free balance when pool capacity > TARGET",
        poolCapacity: targetCapacityPercent => targetCapacityPercent + e18,
        amount: async () => (await iVault.getFreeBalance()) / 2n,
        receiver: () => staker,
      },
      {
        name: "all of the free balance when pool capacity > TARGET",
        poolCapacity: targetCapacityPercent => targetCapacityPercent + e18,
        amount: async () => await iVault.getFreeBalance(),
        receiver: () => staker,
      },
      {
        name: "all when pool capacity > TARGET",
        poolCapacity: targetCapacityPercent => targetCapacityPercent + e18,
        amount: async () => await iVault.getFlashCapacity(),
        receiver: () => staker,
      },
      {
        name: "partially when pool capacity = TARGET",
        poolCapacity: targetCapacityPercent => targetCapacityPercent,
        amount: async () => (await iVault.getFlashCapacity()) / 2n,
        receiver: () => staker,
      },
      {
        name: "all when pool capacity = TARGET",
        poolCapacity: targetCapacityPercent => targetCapacityPercent,
        amount: async () => await iVault.getFlashCapacity(),
        receiver: () => staker,
      },
      {
        name: "partially when pool capacity < TARGET",
        poolCapacity: targetCapacityPercent => (targetCapacityPercent * 3n) / 4n,
        amount: async () => (await iVault.getFlashCapacity()) / 2n,
        receiver: () => staker,
      },
      {
        name: "all when pool capacity < TARGET",
        poolCapacity: targetCapacityPercent => (targetCapacityPercent * 3n) / 4n,
        amount: async () => await iVault.getFlashCapacity(),
        receiver: () => staker,
      },
    ];

    args.forEach(function (arg) {
      it(`flashWithdraw: ${arg.name}`, async function () {
        //Undelegate from Mellow
        const undelegatePercent = arg.poolCapacity(targetCapacityPercent);
        const undelegateAmount = (deposited * undelegatePercent) / MAX_TARGET_PERCENT;
        await iVault.withdrawFromMellowAndClaim(mellowVaults[0].vaultAddress, undelegateAmount);
        //flashWithdraw
        const ratioBefore = await iVault.ratio();
        console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);

        const sharesBefore = await iToken.balanceOf(staker);
        const assetBalanceBefore = await asset.balanceOf(staker);
        const treasuryBalanceBefore = await asset.balanceOf(treasury);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();
        const flashCapacityBefore = await iVault.getFlashCapacity();
        const freeBalanceBefore = await iVault.getFreeBalance();
        console.log(`flashCapacityBefore:\t${flashCapacityBefore.format()}`);
        console.log(`freeBalanceBefore:\t\t${freeBalanceBefore.format()}`);

        const amount = await arg.amount();
        const shares = await iVault.convertToShares(amount);
        const receiver = await arg.receiver();
        const expectedFee = await iVault.calculateFlashWithdrawFee(amount);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        const tx = await iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](shares, receiver.address, 0n);
        const receipt = await tx.wait();
        const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, transactErr);
        expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, transactErr);
        const fee = withdrawEvent[0].args["fee"];
        expect(fee).to.be.closeTo(expectedFee, transactErr);

        const sharesAfter = await iToken.balanceOf(staker);
        const assetBalanceAfter = await asset.balanceOf(staker);
        const treasuryBalanceAfter = await asset.balanceOf(treasury);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const flashCapacityAfter = await iVault.getFlashCapacity();
        console.log(`Balance diff:\t\t\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`TotalDeposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
        console.log(`TotalAssets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`FlashCapacity diff:\t\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Fee:\t\t\t\t\t${fee.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(shares);
        expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
        expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, transactErr);
      });

      it(`redeem(shares,receiver,owner): ${arg.name}`, async function () {
        //Undelegate from Mellow
        const undelegatePercent = arg.poolCapacity(targetCapacityPercent);
        const undelegateAmount = (deposited * undelegatePercent) / MAX_TARGET_PERCENT;
        await iVault.withdrawFromMellowAndClaim(mellowVaults[0].vaultAddress, undelegateAmount);

        //flashWithdraw
        const ratioBefore = await iVault.ratio();
        console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);

        const sharesBefore = await iToken.balanceOf(staker);
        const assetBalanceBefore = await asset.balanceOf(staker);
        const treasuryBalanceBefore = await asset.balanceOf(treasury);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();
        const flashCapacityBefore = await iVault.getFlashCapacity();
        const freeBalanceBefore = await iVault.getFreeBalance();
        console.log(`flashCapacityBefore:\t${flashCapacityBefore.format()}`);
        console.log(`freeBalanceBefore:\t\t${freeBalanceBefore.format()}`);

        const amount = await arg.amount();
        const shares = await iVault.convertToShares(amount); //+1 to compensate rounding after converting from shares to amount
        const previewAmount = await iVault.previewRedeem(shares);
        const receiver = await arg.receiver();
        const expectedFee = await iVault.calculateFlashWithdrawFee(amount);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        const tx = await iVault.connect(staker)["redeem(uint256,address,address)"](shares, receiver.address, staker.address);
        const receipt = await tx.wait();
        const withdrawEvent = receipt.logs?.filter(e => e.eventName === "Withdraw");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, transactErr);
        expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, transactErr);
        const feeEvent = receipt.logs?.filter(e => e.eventName === "WithdrawalFee");
        const fee = feeEvent[0].args["fee"];
        expect(fee).to.be.closeTo(expectedFee, transactErr);

        const sharesAfter = await iToken.balanceOf(staker);
        const assetBalanceAfter = await asset.balanceOf(staker);
        const treasuryBalanceAfter = await asset.balanceOf(treasury);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const flashCapacityAfter = await iVault.getFlashCapacity();
        console.log(`Balance diff:\t\t\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`TotalDeposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
        console.log(`TotalAssets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`FlashCapacity diff:\t\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Fee:\t\t\t\t\t${fee.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(shares);
        expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
        expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, transactErr);
        expect(previewAmount).to.be.eq(assetBalanceAfter - assetBalanceBefore);
      });
    });

    it("Reverts when capacity is not sufficient", async function () {
      const shares = await iToken.balanceOf(staker.address);
      const capacity = await iVault.getFlashCapacity();
      await expect(iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](shares, staker.address, 0n))
        .to.be.revertedWithCustomError(iVault, "InsufficientCapacity")
        .withArgs(capacity);
    });

    it("Reverts when amount < min", async function () {
      const withdrawMinAmount = await iVault.withdrawMinAmount();
      const shares = (await iVault.convertToShares(withdrawMinAmount)) - 1n;
      await expect(iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](shares, staker.address, 0n))
        .to.be.revertedWithCustomError(iVault, "LowerMinAmount")
        .withArgs(withdrawMinAmount);
    });

    it("Reverts redeem when owner != message sender", async function () {
      await iVault.connect(staker).deposit(e18, staker.address);
      const amount = await iVault.getFlashCapacity();
      await expect(
        iVault.connect(staker)["redeem(uint256,address,address)"](amount, staker.address, staker2.address),
      ).to.be.revertedWithCustomError(iVault, "MsgSenderIsNotOwner");
    });

    it("Reverts when iVault is paused", async function () {
      await iVault.connect(staker).deposit(e18, staker.address);
      await iVault.pause();
      const amount = await iVault.getFlashCapacity();
      await expect(iVault.connect(staker)["flashWithdraw(uint256,address,uint256)"](amount, staker.address, 0n)).to.be.revertedWith(
        "Pausable: paused",
      );
      await expect(
        iVault.connect(staker)["redeem(uint256,address,address)"](amount, staker.address, staker.address),
      ).to.be.revertedWith("Pausable: paused");
      await iVault.unpause();
    });
  });

  describe("Max redeem", function () {
    beforeEach(async function () {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await iVault.connect(staker3).deposit(randomBI(18), staker3.address);
      const freeBalance = await iVault.getFreeBalance();
      await iVault
        .connect(iVaultOperator)
        .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, freeBalance / 2n, emptyBytes);
      await assetData.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);

      const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
    });

    const args = [
      {
        name: "User amount = 0",
        sharesOwner: () => ethers.Wallet.createRandom(),
        maxRedeem: async () => 0n,
      },
      {
        name: "User amount < flash capacity",
        sharesOwner: () => staker,
        deposited: randomBI(18),
        maxRedeem: async () => await iToken.balanceOf(staker),
      },
      {
        name: "User amount = flash capacity",
        sharesOwner: () => staker,
        deposited: randomBI(18),
        delegated: async deposited => (await iVault.totalAssets()) - deposited,
        maxRedeem: async () => await iToken.balanceOf(staker),
      },
      {
        name: "User amount > flash capacity > 0",
        sharesOwner: () => staker,
        deposited: randomBI(18),
        delegated: async deposited => (await iVault.totalAssets()) - randomBI(17),
        maxRedeem: async () => await iVault.convertToShares(await iVault.getFlashCapacity()),
      },
      {
        name: "User amount > flash capacity = 0",
        sharesOwner: () => staker3,
        delegated: async deposited => await iVault.totalAssets(),
        maxRedeem: async () => 0n,
      },
    ];

    async function prepareState(arg) {
      const sharesOwner = arg.sharesOwner();
      console.log(sharesOwner.address);
      if (arg.deposited) {
        await iVault.connect(sharesOwner).deposit(arg.deposited, sharesOwner.address);
      }

      if (arg.delegated) {
        const delegated = await arg.delegated(arg.deposited);
        await iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapter.getAddress(), mellowVaults[0].vaultAddress, delegated, emptyBytes);
      }
      return sharesOwner;
    }

    args.forEach(function (arg) {
      it(`maxReedem: ${arg.name}`, async function () {
        const sharesOwner = await prepareState(arg);

        const maxRedeem = await iVault.maxRedeem(sharesOwner);
        const expectedMaxRedeem = await arg.maxRedeem();

        console.log(`User shares:\t\t${(await iToken.balanceOf(sharesOwner)).format()}`);
        console.log(`flashCapacity:\t\t${(await iVault.convertToShares(await iVault.getFlashCapacity())).format()}`);
        console.log(`total assets:\t\t${await iVault.totalAssets()}`);
        console.log(`maxRedeem:\t\t\t${maxRedeem.format()}`);
        console.log(`expected Redeem:\t${expectedMaxRedeem.format()}`);

        if (maxRedeem > 0n) {
          await iVault.connect(sharesOwner)["redeem( uint256 shares, address receiver, address owner )"](maxRedeem, sharesOwner.address, sharesOwner.address);
        }
        expect(maxRedeem).to.be.closeTo(expectedMaxRedeem, ratioErr);
      });
    });

    it("Reverts when iVault is paused", async function () {
      await iVault.connect(staker).deposit(e18, staker.address);
      await iVault.pause();
      expect(await iVault.maxRedeem(staker)).to.be.eq(0n);
    });
  });

  describe("Deposit slippage", function () {
    it("Deposited less shares than min out", async function() {
      await snapshot.restore();
      await iVault.setTargetFlashCapacity(1n);
      await expect(
        iVault.connect(staker)["deposit(uint256,address,uint256)"](toWei(1), staker.address, toWei(100))
      ).to.be.revertedWithCustomError(iVault, "SlippageMinOut");
    });
  });
});
