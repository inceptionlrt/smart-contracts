import { takeSnapshot, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { deployConfig, deployEigenMocks, deployLiquidRestaking, deployRestakerContacts } from "./helpers/deploy";
import { CToken, ExpensiveStakerMock, ProtocolConfig, RatioFeed, RestakerDeployer, RestakingPool } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { _1E18, dataRoot, pubkeys, signature } from "./helpers/constants";
import { calcRatio, divideAndCeil, randomBN, randomBNbyMax, toWei } from "./helpers/math";
import { increaseChainTimeForSeconds } from "./helpers/evmutils";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const TOKEN_NAME = "Token Name",
  TOKEN_SYMBOL = "Token Symbol",
  TEST_PROVIDER = "TEST_PROVIDER",
  DISTRIBUTE_GAS_LIMIT = 250_000n,
  MIN_UNSTAKE = 10_000_000_000n,
  MIN_STAKE = 1000_000_000n,
  MAX_TVL = 32n * _1E18;
const day = 86400n;

const ceilN = (n: bigint, d: bigint) => n / d + (n % d ? 1n : 0n);

let governance: HardhatEthersSigner,
  operator: HardhatEthersSigner,
  treasury: HardhatEthersSigner,
  signer1: HardhatEthersSigner,
  signer2: HardhatEthersSigner,
  signer3: HardhatEthersSigner,
  signer4: HardhatEthersSigner;

const init = async () => {
  [governance, operator, treasury, signer1, signer2, signer3, signer4] = await ethers.getSigners();

  const protocolConfig = await deployConfig([governance, operator, treasury]);

  // EigenLayr
  const el = await deployEigenMocks();

  // Restaker
  const { restakerDeployer } = await deployRestakerContacts({
    ...el,
    owner: governance.address,
    protocolConfig,
  });

  const { restakingPool, ratioFeed, cToken } = await deployLiquidRestaking({
    protocolConfig,
    tokenName: TOKEN_NAME,
    tokenSymbol: TOKEN_SYMBOL,
    distributeGasLimit: DISTRIBUTE_GAS_LIMIT,
    maxTVL: MAX_TVL,
  });

  return [protocolConfig, restakingPool, cToken, ratioFeed, restakerDeployer];
};

describe("RestakingPool", function () {
  this.timeout(15_000);
  let config: ProtocolConfig,
    pool: RestakingPool,
    cToken: CToken,
    feed: RatioFeed,
    deployer: RestakerDeployer,
    expensiveStaker: ExpensiveStakerMock;
  let snapshot: SnapshotRestorer;
  let MAX_PERCENT;

  async function getTargetCapacity() {
    const targetCapacityPercent = await pool.targetCapacity();
    const totalAssets = await cToken.totalAssets();
    const maxPercent = await pool.MAX_PERCENT();
    return (targetCapacityPercent * totalAssets) / maxPercent;
  }

  before(async function () {
    [config, pool, cToken, feed, deployer] = await init();
    await pool.connect(governance).setFlashUnstakeFeeParams(30n * 10n ** 7n, 5n * 10n ** 7n, 25n * 10n ** 8n);
    await pool.connect(governance).setStakeBonusParams(15n * 10n ** 7n, 25n * 10n ** 6n, 25n * 10n ** 8n);
    await pool.connect(governance).setProtocolFee(50n * 10n ** 8n);
    await pool.connect(governance).setTargetFlashCapacity(1n);

    snapshot = await takeSnapshot();
    MAX_PERCENT = await pool.MAX_PERCENT();
  });

  describe("Getters and Setters", function () {
    before(async function () {
      await snapshot.restore();
      await feed.setRatioThreshold(10n ** 8n); //60%
    });

    describe("Min stake/unstake values over the ratio", function () {
      const ratios = [
        toWei(1),
        toWei(0.9),
        toWei(0.7),
        toWei(0.5),
        toWei(0.3),
        toWei(0.1),
        toWei(0.05),
        toWei(0.025),
        toWei(0.0125),
        randomBN(16),
        randomBN(14),
        randomBN(12),
      ];

      ratios.forEach(function (ratio) {
        it(`Update ratio: ${ratio}`, async function () {
          await updateRatio(feed, cToken, ratio);
          console.log(`Ratio:\t\t\t${await cToken.ratio()}`);
        });

        it(`getMinStake() at ratio: ${ratio}`, async function () {
          console.log(`Min stake:\t\t${await pool.getMinStake()}`);
          expect(await pool.getMinStake()).to.be.gte(1n);
        });

        it("getMinUnstake()", async function () {
          console.log(`Min unstake:\t${await pool.getMinUnstake()}`);
          expect(await pool.getMinUnstake()).to.be.eq(1n);
        });
      });
    });

    it("setDistributeGasLimit()", async function () {
      await expect(pool.setDistributeGasLimit("30")).to.emit(pool, "DistributeGasLimitChanged").withArgs(DISTRIBUTE_GAS_LIMIT, "30");
    });

    it("setDistributeGasLimit(): reverts: only governance can", async function () {
      await expect(pool.connect(operator).setDistributeGasLimit("30")).to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });

    // TODO: check that distribute gas limit cannot be greater than max

    it("setTargetFlashCapacity(): only governance can", async function () {
      const prevValue = await pool.targetCapacity();
      const newValue = randomBN(18);
      await expect(pool.connect(governance).setTargetFlashCapacity(newValue))
        .to.emit(pool, "TargetCapacityChanged")
        .withArgs(prevValue, newValue);
      expect(await pool.targetCapacity()).to.be.eq(newValue);
    });

    it("setTargetFlashCapacity(): reverts when caller is not an owner", async function () {
      const newValue = randomBN(18);
      await expect(pool.connect(signer1).setTargetFlashCapacity(newValue)).to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });

    it("setProtocolFee(): sets share of flashWithdrawFee that goes to treasury", async function () {
      const prevValue = await pool.protocolFee();
      const newValue = randomBN(10);
      await expect(pool.setProtocolFee(newValue)).to.emit(pool, "ProtocolFeeChanged").withArgs(prevValue, newValue);
      expect(await pool.protocolFee()).to.be.eq(newValue);
    });

    it("setProtocolFee(): reverts when > MAX_PERCENT", async function () {
      const newValue = (await pool.MAX_PERCENT()) + 1n;
      await expect(pool.setProtocolFee(newValue)).to.be.revertedWithCustomError(pool, "ParameterExceedsLimits").withArgs(newValue);
    });

    it("setProtocolFee(): reverts when caller is not an owner", async function () {
      const newValue = randomBN(10);
      await expect(pool.connect(signer1).setProtocolFee(newValue))
          .to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });

    it("setRewardsTimeline(): only owner can", async function () {
      const prevValue = await pool.rewardsTimeline();
      const newValue = randomBN(2) * day;
      await expect(pool.connect(governance).setRewardsTimeline(newValue))
          .to.emit(pool, "RewardsTimelineChanged")
          .withArgs(prevValue, newValue);

      expect(prevValue).to.be.eq(day * 7n); //default value is 7d
      expect(await pool.rewardsTimeline()).to.be.eq(newValue);
    })

    it("setRewardsTimeline(): reverts when < 1 day", async function () {
      await expect(pool.connect(governance).setRewardsTimeline(day - 1n))
          .to.be.revertedWithCustomError(pool, "InconsistentData");
    })

    it("setRewardsTimeline(): reverts when caller is not an owner", async function () {
      const newValue = randomBN(6);
      await expect(pool.connect(signer1).setRewardsTimeline(newValue))
          .to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });
  });

  describe("Stake", function () {
    before(async function () {
      await snapshot.restore();
    });

    it("Reverts: when amount > available", async () => {
      const available = await pool.availableToStake();
      expect(available).to.be.eq(MAX_TVL);
      await expect(pool.connect(signer1)["stake()"]({ value: available + 1n })).to.be.revertedWithCustomError(
        pool,
        "PoolStakeAmGreaterThanAvailable"
      );
    });

    const amounts = [
      { name: "Random value", amount: async (x) => randomBN(19) },
      {
        name: "999999999999999999",
        amount: async (x) => 999999999999999999n,
      },
      {
        name: "888888888888888888",
        amount: async (x) => 888888888888888888n,
      },
      {
        name: "777777777777777777",
        amount: async (x) => 777777777777777777n,
      },
      {
        name: "666666666666666666",
        amount: async (x) => 666666666666666666n,
      },
      {
        name: "555555555555555555",
        amount: async (x) => 555555555555555555n,
      },
      {
        name: "444444444444444444",
        amount: async (x) => 444444444444444444n,
      },
      {
        name: "333333333333333333",
        amount: async (x) => 333333333333333333n,
      },
      {
        name: "222222222222222222",
        amount: async (x) => 222222222222222222n,
      },
      {
        name: "111111111111111111",
        amount: async (x) => 111111111111111111n,
      },
      { name: "Min amount", amount: async (x) => await x.getMinStake() },
    ];

    amounts.forEach((param) => {
      it(`Stake: ${param.name}`, async function () {
        // Update ratio
        const ratio = (await cToken.ratio()) - 1n;
        await updateRatio(feed, cToken, ratio);
        const signerBalanceBefore = await cToken.balanceOf(signer1.address);
        const totalSupplyBefore = await cToken.totalSupply();
        const available = await pool.availableToStake();
        expect(available).to.be.eq(MAX_TVL - ceilN(totalSupplyBefore * _1E18, ratio));

        // Stake
        const amount = await param.amount(pool);
        const expectedShares = (amount * ratio) / _1E18;
        await expect(pool.connect(signer1)["stake()"]({ value: amount }))
          .to.emit(pool, "Staked")
          .withArgs(signer1.address, amount.toString(), expectedShares.toString());

        const signerBalanceAfter = await cToken.balanceOf(signer1.address);
        const totalSupplyAfter = await cToken.totalSupply();

        expect(signerBalanceAfter - signerBalanceBefore).to.be.closeTo(expectedShares, 1);
        expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(expectedShares, 1);
      });
    });

    it("Stake with referral code", async function () {
      // Update ratio
      const ratio = (await cToken.ratio()) - 1n;
      await updateRatio(feed, cToken, ratio);
      const signerBalanceBefore = await cToken.balanceOf(signer1.address);
      const totalSupplyBefore = await cToken.totalSupply();
      const available = await pool.availableToStake();
      expect(available).to.be.eq(MAX_TVL - ceilN(totalSupplyBefore * _1E18, ratio));

      // Stake
      const amount = _1E18;
      const expectedShares = (amount * ratio) / _1E18;
      const code = ethers.encodeBytes32String("promo");
      await expect(pool.connect(signer1)["stake(bytes32)"](code, { value: amount }))
        .to.emit(pool, "Staked")
        .withArgs(signer1.address, amount.toString(), expectedShares.toString())
        .and.to.emit(pool, "ReferralStake")
        .withArgs(code);

      const signerBalanceAfter = await cToken.balanceOf(signer1.address);
      const totalSupplyAfter = await cToken.totalSupply();

      expect(signerBalanceAfter - signerBalanceBefore).to.be.closeTo(expectedShares, 1);
      expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(expectedShares, 1);
    });

    it("Reverts: when amount < min", async function () {
      const amount = (await pool.getMinStake()) - 1n;
      await expect(pool.connect(signer1)["stake()"]({ value: amount })).to.be.revertedWithCustomError(pool, "PoolStakeAmLessThanMin");
    });

    it("Reverts: when amount > available", async () => {
      await expect(pool.connect(signer1)["stake()"]({ value: (await pool.availableToStake()) + 1n })).to.be.revertedWithCustomError(
        pool,
        "PoolStakeAmGreaterThanAvailable"
      );
    });

    it("Increase max tvl", async () => {
      const newMax = 2_000_000_000_000_000n * _1E18;
      await expect(pool.setMaxTVL(newMax))
        .to.emit(pool, "MaxTVLChanged")
        .withArgs(32n * _1E18, newMax);
    });

    //Stake many times with different ratio values
    it("Stake many times with different signers and ratio", async function () {
      await snapshot.restore();
      const signers = [signer1, signer2, signer3];
      const signersShares = new Map();
      signersShares.set(signer1.address, 0n);
      signersShares.set(signer2.address, 0n);
      signersShares.set(signer3.address, 0n);
      let ratio,
        expectedTotalSupply = 0n,
        expectedPoolBalance = 0n;

      const iterations = 50;
      await pool.setMaxTVL(BigInt(iterations) * 10n * _1E18);
      for (let i = 0; i < iterations; i++) {
        ratio = (await cToken.ratio()) - randomBN(15);
        await updateRatio(feed, cToken, ratio);

        for (const signer of signers) {
          const amount = randomBNbyMax(10n ** 18n - MIN_STAKE + MIN_UNSTAKE);
          expectedPoolBalance = expectedPoolBalance + amount;
          await pool.connect(signer)["stake()"]({ value: amount });
          const shares = (amount * ratio) / _1E18;
          const currentShares = signersShares.get(signer.address);
          signersShares.set(signer.address, currentShares + shares);
          expectedTotalSupply = expectedTotalSupply + shares;
        }
      }
      expect(await cToken.balanceOf(signer1.address)).to.be.closeTo(signersShares.get(signer1.address), 100);
      expect(await cToken.balanceOf(signer2.address)).to.be.closeTo(signersShares.get(signer2.address), 100);
      expect(await cToken.balanceOf(signer3.address)).to.be.closeTo(signersShares.get(signer3.address), 100);
      expect(await cToken.totalSupply()).to.be.closeTo(expectedTotalSupply, 300);
      expect(await ethers.provider.getBalance(await pool.getAddress())).to.be.eq(expectedPoolBalance);
    });
  });

  describe("Stake bonus params setter and calculation", function () {
    let localSnapshot;

    const depositBonusSegment = [
      {
        fromUtilization: async () => 0n,
        fromPercent: async () => await pool.maxBonusRate(),
        toUtilization: async () => await pool.stakeUtilizationKink(),
        toPercent: async () => await pool.optimalBonusRate(),
      },
      {
        fromUtilization: async () => await pool.stakeUtilizationKink(),
        fromPercent: async () => await pool.optimalBonusRate(),
        toUtilization: async () => await pool.MAX_PERCENT(),
        toPercent: async () => await pool.optimalBonusRate(),
      },
      {
        fromUtilization: async () => await pool.MAX_PERCENT(),
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
        newstakeUtilizationKink: BigInt(25 * 10 ** 8), //25%
      },
      {
        name: "Optimal utilization = 0 => always optimal rate",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: BigInt(10 ** 8), //1%
        newstakeUtilizationKink: 0n,
      },
      {
        name: "Optimal bonus rate = 0",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: 0n,
        newstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal bonus rate = max > 0 => rate is constant over utilization",
        newMaxBonusRate: BigInt(2 * 10 ** 8),
        newOptimalBonusRate: BigInt(2 * 10 ** 8),
        newstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal bonus rate = max = 0 => no bonus",
        newMaxBonusRate: 0n,
        newOptimalBonusRate: 0n,
        newstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      //Will fail when OptimalBonusRate > MaxBonusRate
    ];

    const amounts = [
      {
        name: "min amount from 0",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => (await cToken.convertToAmount(await pool.getMinStake())) + 1n,
      },
      {
        name: "1 wei from 0",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => 1n,
      },
      {
        name: "from 0 to 25% of TARGET",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => (targetCapacity * 25n) / 100n,
      },
      {
        name: "from 0 to 25% + 1wei of TARGET",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => (targetCapacity * 25n) / 100n,
      },
      {
        name: "from 25% to 100% of TARGET",
        flashCapacity: (targetCapacity) => (targetCapacity * 25n) / 100n,
        amount: async (targetCapacity) => (targetCapacity * 75n) / 100n,
      },
      {
        name: "from 0% to 100% of TARGET",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => targetCapacity,
      },
      {
        name: "from 0% to 200% of TARGET",
        flashCapacity: (targetCapacity) => 0n,
        amount: async (targetCapacity) => targetCapacity * 2n,
      },
    ];

    args.forEach(function (arg) {
      it(`setStakeBonusParams: ${arg.name}`, async function () {
        await snapshot.restore();
        await pool.addRestaker(TEST_PROVIDER);
        await pool.connect(governance).setMaxTVL(64n * _1E18);
        await expect(pool.setStakeBonusParams(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newstakeUtilizationKink))
          .to.emit(pool, "StakeBonusParamsChanged")
          .withArgs(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newstakeUtilizationKink);

        expect(await pool.maxBonusRate()).to.be.eq(arg.newMaxBonusRate);
        expect(await pool.optimalBonusRate()).to.be.eq(arg.newOptimalBonusRate);
        expect(await pool.stakeUtilizationKink()).to.be.eq(arg.newstakeUtilizationKink);
        localSnapshot = await takeSnapshot();
      });

      amounts.forEach(function (amount) {
        it(`calculateDepositBonus for ${amount.name}`, async function () {
          await localSnapshot.restore();
          const batchDeposited = _1E18 * 32n;
          const targetCapacity = _1E18;

          //deposit = batchDeposit+targetCapacity
          await pool.connect(signer1)["stake()"]({ value: batchDeposited + targetCapacity });
          await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
          //Withdraw leftover
          const actualFlashCapacity = await pool.getFlashCapacity();
          let flashCapacity = amount.flashCapacity(targetCapacity);
          const flashUnstakeAmount = actualFlashCapacity - flashCapacity;
          await pool.connect(signer1).flashUnstake(flashUnstakeAmount, signer1.address);
          //Set percent
          const targetCapacityPercent = divideAndCeil(targetCapacity * MAX_PERCENT, flashCapacity + batchDeposited);
          await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);
          console.log(`Pool balance:\t\t\t\t${await ethers.provider.getBalance(pool.address)}`);
          console.log(`Target capacity percent:\t${(await pool.targetCapacity()).format()}`);
          console.log(`Flash capacity:\t\t\t\t${(await pool.getFlashCapacity()).format()}`);
          console.log(`Total deposited:\t\t\t${(await cToken.totalAssets()).format()}`);

          let _amount = await amount.amount(targetCapacity);
          console.log(`Amount:\t\t\t\t\t\t${_amount}`);
          let depositBonus = 0n;
          while (_amount > 0n) {
            for (const feeFunc of depositBonusSegment) {
              const utilization = (flashCapacity * MAX_PERCENT) / targetCapacity;
              const fromUtilization = await feeFunc.fromUtilization();
              const toUtilization = await feeFunc.toUtilization();
              if (_amount > 0n && fromUtilization <= utilization && utilization < toUtilization) {
                const fromPercent = await feeFunc.fromPercent();
                const toPercent = await feeFunc.toPercent();
                const upperBound = (toUtilization * targetCapacity) / MAX_PERCENT;
                const replenished = upperBound > flashCapacity + _amount ? _amount : upperBound - flashCapacity;
                const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                const bonusPercent = fromPercent + (slope * (flashCapacity + replenished / 2n)) / targetCapacity;
                const bonus = (replenished * bonusPercent) / MAX_PERCENT;
                console.log(`Replenished:\t\t\t\t${replenished.format()}`);
                console.log(`Bonus percent:\t\t\t\t${bonusPercent.format()}`);
                console.log(`Bonus:\t\t\t\t\t\t${bonus.format()}`);
                flashCapacity += replenished;
                _amount -= replenished;
                depositBonus += bonus;
              }
            }
          }
          let contractBonus = await pool.calculateStakeBonus(await amount.amount(targetCapacity));
          console.log(`Expected deposit bonus:\t\t${depositBonus.format()}`);
          console.log(`Contract deposit bonus:\t\t${contractBonus.format()}`);
          expect(contractBonus).to.be.closeTo(depositBonus, 1n);
        });
      });
    });

    const invalidArgs = [
      {
        name: "MaxBonusRate > MAX_PERCENT",
        newMaxBonusRate: () => MAX_PERCENT + 1n,
        newOptimalBonusRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newstakeUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "OptimalBonusRate > MAX_PERCENT",
        newMaxBonusRate: () => BigInt(2 * 10 ** 8),
        newOptimalBonusRate: () => MAX_PERCENT + 1n,
        newstakeUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "stakeUtilizationKink > MAX_PERCENT",
        newMaxBonusRate: () => BigInt(2 * 10 ** 8),
        newOptimalBonusRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        newstakeUtilizationKink: () => MAX_PERCENT + 1n,
        customError: "ParameterExceedsLimits",
      },
    ];
    invalidArgs.forEach(function (arg) {
      it(`setStakeBonusParams reverts when ${arg.name}`, async function () {
        await expect(
          pool.setStakeBonusParams(arg.newMaxBonusRate(), arg.newOptimalBonusRate(), arg.newstakeUtilizationKink())
        ).to.be.revertedWithCustomError(pool, arg.customError);
      });
    });

    it("setDepositBonusParams reverts when caller is not an owner", async function () {
      await expect(
        pool.connect(signer1).setStakeBonusParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8))
      ).to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });
  });

  describe("Stake with bonus", function () {
    const states = [
      {
        name: "deposit bonus > 0",
        withBonus: true,
      },
      {
        name: "deposit bonus = 0",
        withBonus: false,
      },
    ];

    const amounts = [
      {
        name: "for the first time",
        flashCapacity: (targetCapacity) => 0n,
        amount: (targetCapacity) => randomBNbyMax(targetCapacity / 4n) + targetCapacity / 4n,
      },
      {
        name: "more",
        flashCapacity: (targetCapacity) => targetCapacity / 3n,
        amount: (targetCapacity) => randomBNbyMax(targetCapacity / 3n),
      },
      {
        name: "up to target cap",
        flashCapacity: (targetCapacity) => targetCapacity / 10n,
        amount: (targetCapacity) => (targetCapacity * 9n) / 10n,
      },
      {
        name: "all rewards",
        flashCapacity: (targetCapacity) => 0n,
        amount: (targetCapacity) => targetCapacity,
      },
      {
        name: "up to target cap and above",
        flashCapacity: (targetCapacity) => targetCapacity / 10n,
        amount: (targetCapacity) => targetCapacity,
      },
      {
        name: "above target cap",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: (targetCapacity) => randomBN(19),
      },
    ];

    states.forEach(function (state) {
      amounts.forEach(function (arg) {
        it(`Stake ${arg.name} and ${state.name}`, async function () {
          //---Prepare state
          await snapshot.restore();
          await pool.addRestaker(TEST_PROVIDER);
          await pool.connect(governance).setMaxTVL(64n * _1E18);
          const batchDeposited = _1E18 * 32n;
          const targetCapacity = _1E18;
          //deposit = batchDeposit+targetCapacity
          await pool.connect(signer1)["stake()"]({ value: batchDeposited + targetCapacity * 2n });
          await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
          //Withdraw leftover
          await pool.connect(governance).setProtocolFee(60n * 10n ** 8n);
          if (!state.withBonus) {
            await pool.connect(governance).setProtocolFee(MAX_PERCENT);
          }
          const actualFlashCapacity = await pool.getFlashCapacity();
          let flashCapacityBefore = arg.flashCapacity(targetCapacity);
          const flashUnstakeAmount = actualFlashCapacity - flashCapacityBefore;
          await pool.connect(signer1).flashUnstake(flashUnstakeAmount, signer1.address);
          //Set percent
          const targetCapacityPercent = divideAndCeil(targetCapacity * MAX_PERCENT, flashCapacityBefore + batchDeposited);
          await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);
          let availableBonus = await pool.stakeBonusAmount();
          await updateRatio(feed, cToken, await calcRatio(cToken, pool));
          const ratioBefore = await cToken.ratio();
          const stakerSharesBefore = await cToken.balanceOf(signer1);
          const totalAssetsBefore = await cToken.totalAssets();
          console.log(`Pool balance:\t\t\t\t${await ethers.provider.getBalance(pool.address)}`);
          console.log(`Target capacity percent:\t${(await pool.targetCapacity()).format()}`);
          console.log(`Flash capacity:\t\t\t\t${(await pool.getFlashCapacity()).format()}`);
          console.log(`Total assets:\t\t\t\t${totalAssetsBefore.format()}`);
          console.log(`Available bonus:\t\t\t${availableBonus.format()}`);
          console.log(`Ratio before:\t\t\t\t${ratioBefore.format()}`);

          //---Deposit
          const amount = await arg.amount(targetCapacity);
          console.log(`Stake amount:\t\t\t\t${amount.format()}`);
          const calculatedBonus = await pool.calculateStakeBonus(amount);
          console.log(`Calculated bonus:\t\t\t${calculatedBonus.format()}`);
          console.log(`Available bonus:\t\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t\t${expectedBonus.format()}`);
          const convertedShares = await cToken.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await cToken.ratio())) / _1E18;
          console.log(`Expected shares:\t\t\t${expectedShares.format()}`);

          const tx = await pool.connect(signer1)["stake()"]({ value: amount });
          const receipt = await tx.wait();
          const depositEvent = receipt.logs?.filter((e) => e.eventName === "Staked");
          const stakerSharesAfter = await cToken.balanceOf(signer1);
          const totalAssetsAfter = await cToken.totalAssets();
          const flashCapacityAfter = await pool.getFlashCapacity();
          const ratioAfter = await calcRatio(cToken, pool);
          console.log(`Actual shares:\t\t\t\t${depositEvent[0].args["shares"]}`);
          console.log(`Ratio after:\t\t\t\t${ratioAfter.format()}`);
          console.log(`Bonus after:\t\t\t\t${availableBonus.format()}`);

          //Event
          expect(depositEvent.length).to.be.eq(1);
          expect(depositEvent[0].args["staker"]).to.be.eq(signer1.address);
          expect(depositEvent[0].args["amount"]).to.be.closeTo(amount + expectedBonus, 1n);
          expect(depositEvent[0].args["shares"] - expectedShares).to.be.closeTo(0, 1n);
          //DepositBonus event
          expect(receipt.logs.find((l) => l.eventName === "StakeBonus")?.args.amount || 0n).to.be.closeTo(expectedBonus, 1n);
          //Values
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, 1n);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, 1n);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount + expectedBonus, 1n); //Everything stays on pool after stake
          expect(flashCapacityAfter - flashCapacityBefore).to.be.closeTo(amount + expectedBonus, 1n);
          expect(ratioAfter).to.be.closeTo(ratioBefore, 1n); //Ratio stays the same
        });
      });
    });

    it("Reverts when target capacity is 0", async function () {
      const [config, pool, cToken, feed, deployer] = await init();
      await pool.addRestaker(TEST_PROVIDER);
      await pool.connect(governance).setMaxTVL(64n * _1E18);
      await expect(pool.connect(signer1)["stake()"]({ value: _1E18 })).to.be.revertedWithCustomError(pool, "TargetCapacityNotSet");
    });
  });

  describe("Unstake", function () {
    before(async function () {
      await snapshot.restore();
      await pool.setMaxTVL(200n * _1E18);
    });

    const amounts = [
      {
        name: "Random value to another address",
        shares: async () => randomBN(19),
        receiver: () => signer2,
      },
      {
        name: "999999999999999999",
        shares: async () => 999999999999999999n,
        receiver: () => signer1,
      },
      {
        name: "888888888888888888",
        shares: async () => 888888888888888888n,
        receiver: () => signer1,
      },
      {
        name: "777777777777777777",
        shares: async () => 777777777777777777n,
        receiver: () => signer1,
      },
      {
        name: "666666666666666666",
        shares: async () => 666666666666666666n,
        receiver: () => signer1,
      },
      {
        name: "555555555555555555",
        shares: async () => 555555555555555555n,
        receiver: () => signer1,
      },
      {
        name: "444444444444444444",
        shares: async () => 444444444444444444n,
        receiver: () => signer1,
      },
      {
        name: "333333333333333333",
        shares: async () => 333333333333333333n,
        receiver: () => signer1,
      },
      {
        name: "222222222222222222",
        shares: async () => 222222222222222222n,
        receiver: () => signer1,
      },
      {
        name: "111111111111111111",
        shares: async () => 111111111111111111n,
        receiver: () => signer1,
      },
      {
        name: "Min amount",
        shares: async (x: RestakingPool) => await x.getMinUnstake(),
        receiver: () => signer1,
      },
    ];

    const receiverUnstakesMap = new Map();
    amounts.forEach((param) => {
      it(`Unstake: ${param.name}`, async function () {
        // Stake once
        if ((await cToken.balanceOf(signer1.address)) === 0n) {
          await pool.connect(signer1)["stake()"]({ value: 50n * _1E18 });
        }
        //Update ratio
        const ratio = (await cToken.ratio()) - 1000n;
        await updateRatio(feed, cToken, ratio);
        //Values before

        const receiver = param.receiver();
        const ownerBalanceBefore = await cToken.balanceOf(signer1.address);
        const totalSupplyBefore = await cToken.totalSupply();
        const totalPendingUnstakesBefore = await pool.getTotalPendingUnstakes();
        const receiverPendingUnstakesBefore = await pool.getTotalUnstakesOf(receiver.address);

        //Unstake
        const shares = await param.shares(pool);
        const expectedAsset = (shares * _1E18) / ratio + 1n; //Rounding up

        await expect(pool.connect(signer1).unstake(receiver.address, shares))
          .to.emit(pool, "Unstaked")
          .withArgs(signer1.address, receiver.address, expectedAsset, shares);

        const ownerBalanceAfter = await cToken.balanceOf(signer1.address);
        const totalSupplyAfter = await cToken.totalSupply();
        const totalPendingUnstakesAfter = await pool.getTotalPendingUnstakes();
        const receiverPendingUnstakesAfter = await pool.getTotalUnstakesOf(receiver.address);
        const receiverPendingRequests = (await pool.getUnstakesOf(receiver.address)).map((bn) => bn.toString());
        if (!receiverUnstakesMap.has(receiver.address)) {
          receiverUnstakesMap.set(receiver.address, [`${receiver.address},${expectedAsset.toString()}`]);
        } else {
          receiverUnstakesMap.get(receiver.address).push(`${receiver.address},${expectedAsset.toString()}`);
        }

        expect(ownerBalanceBefore - ownerBalanceAfter).to.be.closeTo(shares, 1);
        expect(totalSupplyBefore - totalSupplyAfter).to.be.closeTo(shares, 1);
        expect(totalPendingUnstakesAfter - totalPendingUnstakesBefore).to.be.closeTo(expectedAsset, 1);
        expect(receiverPendingUnstakesAfter - receiverPendingUnstakesBefore).to.be.closeTo(expectedAsset, 1);

        expect(receiverPendingRequests).to.include.members(receiverUnstakesMap.get(receiver.address));
      });
    });

    it("Reverts: when shares < min", async function () {
      const shares = await cToken.convertToShares((await pool.getMinUnstake()) - 1n);
      await expect(pool.connect(signer1).unstake(signer1.address, shares)).to.be.revertedWithCustomError(pool, "PoolUnstakeAmLessThanMin");
    });

    it("Reverts: when exceed user balance", async function () {
      await pool.connect(signer1)["stake()"]({ value: 10n ** 18n });
      const shares = (await cToken.balanceOf(signer1.address)) + 1n;
      await expect(pool.connect(signer1).unstake(signer1.address, shares)).to.be.revertedWithCustomError(
        cToken,
        "ERC20InsufficientBalance"
      );
    });

    it("Reverts: receiver is zero address", async function () {
      await pool.connect(signer1)["stake()"]({ value: 10n ** 18n });
      const shares = await cToken.convertToShares(10n ** 18n);
      await expect(pool.connect(signer1).unstake(ethers.ZeroAddress, shares)).to.be.revertedWithCustomError(pool, "PoolZeroAddress");
    });

    it("Unstake all", async function () {
      const ratio = await cToken.ratio();

      const shares = await cToken.balanceOf(signer1.address);
      expect(shares).to.be.gt(0n);
      const expectedAsset = (shares * _1E18) / ratio + 1n; //Rounding up
      const totalPendingUnstakesBefore = await pool.getTotalPendingUnstakes();
      const receiverPendingUnstakesBefore = await pool.getTotalUnstakesOf(signer1.address);
      await pool.connect(signer1).unstake(signer1.address, shares);

      const ownerBalanceAfter = await cToken.balanceOf(signer1.address);
      const totalSupplyAfter = await cToken.totalSupply();
      const totalPendingUnstakesAfter = await pool.getTotalPendingUnstakes();
      const receiverPendingUnstakesAfter = await pool.getTotalUnstakesOf(signer1.address);

      expect(ownerBalanceAfter).to.be.eq(0);
      expect(totalSupplyAfter).to.be.eq(0);
      expect(totalPendingUnstakesAfter - totalPendingUnstakesBefore).to.be.closeTo(expectedAsset, 1);
      expect(receiverPendingUnstakesAfter - receiverPendingUnstakesBefore).to.be.closeTo(expectedAsset, 1);
    });
  });

  describe("Unstake fee params setter and calculation", function () {
    let localSnapshot;

    const withdrawFeeSegment = [
      {
        fromUtilization: async () => 0n,
        fromPercent: async () => await pool.maxFlashFeeRate(),
        toUtilization: async () => await pool.unstakeUtilizationKink(),
        toPercent: async () => await pool.optimalUnstakeRate(),
      },
      {
        fromUtilization: async () => await pool.unstakeUtilizationKink(),
        fromPercent: async () => await pool.optimalUnstakeRate(),
        toUtilization: async () => ethers.MaxUint256,
        toPercent: async () => await pool.optimalUnstakeRate(),
      },
    ];

    const args = [
      {
        name: "Normal withdraw fee profile > 0",
        maxFlashFeeRate: BigInt(2 * 10 ** 8), //2%
        optimalUnstakeRate: BigInt(0.2 * 10 ** 8), //0.2%
        unstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal utilization = 0 => always optimal rate",
        maxFlashFeeRate: BigInt(2 * 10 ** 8),
        optimalUnstakeRate: BigInt(10 ** 8), //1%
        unstakeUtilizationKink: 0n,
      },
      {
        name: "Optimal withdraw rate = 0",
        maxFlashFeeRate: BigInt(2 * 10 ** 8),
        optimalUnstakeRate: 0n,
        unstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal withdraw rate = max > 0 => rate is constant over utilization",
        maxFlashFeeRate: BigInt(2 * 10 ** 8),
        optimalUnstakeRate: BigInt(2 * 10 ** 8),
        unstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      {
        name: "Optimal withdraw rate = max = 0 => no fee",
        maxFlashFeeRate: 0n,
        optimalUnstakeRate: 0n,
        unstakeUtilizationKink: BigInt(25 * 10 ** 8),
      },
      //Will fail when optimalWithdrawalRate > MaxFlashFeeRate
    ];

    const amounts = [
      {
        name: "from 200% to 0% of TARGET",
        flashCapacity: (targetCapacity) => targetCapacity * 2n,
        amount: async (targetCapacity) => await pool.getFlashCapacity(),
      },
      {
        name: "from 200% to 100% of TARGET",
        flashCapacity: (targetCapacity) => targetCapacity * 2n,
        amount: async (targetCapacity) => targetCapacity,
      },
      {
        name: "from 100% to 0% of TARGET",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: async (targetCapacity) => await pool.getFlashCapacity(),
      },
      {
        name: "1 wei from 100%",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: async (targetCapacity) => 1n,
      },
      {
        name: "min amount from 100%",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: async (targetCapacity) => (await cToken.convertToAmount(await pool.getMinUnstake())) + 1n,
      },
      {
        name: "from 100% to 25% of TARGET",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: async (targetCapacity) => (targetCapacity * 75n) / 100n,
      },
      {
        name: "from 100% to 25% - 1wei of TARGET",
        flashCapacity: (targetCapacity) => targetCapacity,
        amount: async (targetCapacity) => (targetCapacity * 75n) / 100n + 1n,
      },
      {
        name: "from 25% to 0% of TARGET",
        flashCapacity: (targetCapacity) => (targetCapacity * 25n) / 100n,
        amount: async (targetCapacity) => await pool.getFlashCapacity(),
      },
    ];

    args.forEach(function (arg) {
      it(`setFlashWithdrawFeeParams: ${arg.name}`, async function () {
        await snapshot.restore();
        await pool.addRestaker(TEST_PROVIDER);
        await pool.connect(governance).setMaxTVL(64n * _1E18);
        await expect(pool.setFlashUnstakeFeeParams(arg.maxFlashFeeRate, arg.optimalUnstakeRate, arg.unstakeUtilizationKink))
          .to.emit(pool, "UnstakeFeeParamsChanged")
          .withArgs(arg.maxFlashFeeRate, arg.optimalUnstakeRate, arg.unstakeUtilizationKink);

        expect(await pool.maxFlashFeeRate()).to.be.eq(arg.maxFlashFeeRate);
        expect(await pool.optimalUnstakeRate()).to.be.eq(arg.optimalUnstakeRate);
        expect(await pool.unstakeUtilizationKink()).to.be.eq(arg.unstakeUtilizationKink);
        localSnapshot = await takeSnapshot();
      });

      amounts.forEach(function (amount) {
        it(`calculateFlashWithdrawFee for: ${amount.name}`, async function () {
          await localSnapshot.restore();
          const batchDeposited = _1E18 * 32n;
          const targetCapacity = toWei(4);
          let flashCapacity = amount.flashCapacity(targetCapacity);
          const targetCapacityPercent = (targetCapacity * MAX_PERCENT) / (flashCapacity + batchDeposited);
          console.log(`Target capacity percent:\t${targetCapacityPercent}`);

          await pool.connect(signer1)["stake()"]({ value: batchDeposited + flashCapacity });
          await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
          await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);
          console.log(`Flash capacity:\t\t\t\t${await pool.getFlashCapacity()}`);
          console.log(`Total deposited:\t\t\t${await cToken.totalAssets()}`);

          let _amount = await amount.amount(targetCapacity);
          let withdrawFee = 0n;
          while (_amount > 1n) {
            for (const feeFunc of withdrawFeeSegment) {
              const utilization = (flashCapacity * MAX_PERCENT) / targetCapacity;
              const fromUtilization = await feeFunc.fromUtilization();
              const toUtilization = await feeFunc.toUtilization();
              if (_amount > 0n && fromUtilization < utilization && utilization <= toUtilization) {
                console.log(`Utilization:\t\t\t\t${utilization.format()}`);
                const fromPercent = await feeFunc.fromPercent();
                const toPercent = await feeFunc.toPercent();
                const lowerBound = (fromUtilization * targetCapacity) / MAX_PERCENT;
                const replenished = lowerBound > flashCapacity - _amount ? flashCapacity - lowerBound : _amount;
                const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                const withdrawFeePercent = fromPercent + (slope * (flashCapacity - replenished / 2n)) / targetCapacity;
                const fee = (replenished * withdrawFeePercent) / MAX_PERCENT;
                console.log(`Replenished:\t\t\t\t${replenished.format()}`);
                console.log(`Fee percent:\t\t\t\t${withdrawFeePercent.format()}`);
                console.log(`Fee:\t\t\t\t\t\t${fee.format()}`);
                flashCapacity -= replenished;
                _amount -= replenished;
                withdrawFee += fee;
              }
            }
          }
          withdrawFee = withdrawFee === 0n ? 1n : withdrawFee;
          let contractFee = await pool.calculateFlashUnstakeFee(await amount.amount(targetCapacity));
          console.log(`Expected withdraw fee:\t\t${withdrawFee.format()}`);
          console.log(`Contract withdraw fee:\t\t${contractFee.format()}`);
          expect(contractFee).to.be.closeTo(withdrawFee, withdrawFee / MAX_PERCENT);
          expect(contractFee).to.be.gt(0n); //flashWithdraw fee is always greater than 0
        });
      });
    });

    const invalidArgs = [
      {
        name: "MaxBonusRate > MAX_PERCENT",
        maxFlashFeeRate: () => MAX_PERCENT + 1n,
        optimalUnstakeRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        unstakeUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "OptimalBonusRate > MAX_PERCENT",
        maxFlashFeeRate: () => BigInt(2 * 10 ** 8),
        optimalUnstakeRate: () => MAX_PERCENT + 1n,
        unstakeUtilizationKink: () => BigInt(25 * 10 ** 8),
        customError: "ParameterExceedsLimits",
      },
      {
        name: "DepositUtilizationKink > MAX_PERCENT",
        maxFlashFeeRate: () => BigInt(2 * 10 ** 8),
        optimalUnstakeRate: () => BigInt(0.2 * 10 ** 8), //0.2%
        unstakeUtilizationKink: () => MAX_PERCENT + 1n,
        customError: "ParameterExceedsLimits",
      },
    ];
    invalidArgs.forEach(function (arg) {
      it(`setFlashWithdrawFeeParams reverts when ${arg.name}`, async function () {
        await expect(
          pool.setFlashUnstakeFeeParams(arg.maxFlashFeeRate(), arg.optimalUnstakeRate(), arg.unstakeUtilizationKink())
        ).to.be.revertedWithCustomError(pool, arg.customError);
      });
    });

    it("calculateFlashWithdrawFee reverts when capacity is not sufficient", async function () {
      await snapshot.restore();
      await pool.connect(signer1)["stake()"]({ value: randomBN(19) });
      const capacity = await pool.getFlashCapacity();
      await expect(pool.calculateFlashUnstakeFee(capacity + 1n))
        .to.be.revertedWithCustomError(pool, "InsufficientCapacity")
        .withArgs(capacity);
    });

    it("setFlashWithdrawFeeParams reverts when caller is not an owner", async function () {
      await expect(
        pool.connect(signer1).setFlashUnstakeFeeParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8))
      ).to.be.revertedWithCustomError(pool, "OnlyGovernanceAllowed");
    });
  });

  describe("Flash unstake with fee", function () {
    let deposited = 0n;
    beforeEach(async function () {
      await snapshot.restore();
      await pool.setTargetFlashCapacity(1n);
      await pool.addRestaker(TEST_PROVIDER);
      await pool.connect(governance).setMaxTVL(64n * _1E18);
    });

    const args = [
      {
        name: "part of the free balance when pool capacity > TARGET",
        poolCapacity: (targetCapacity) => targetCapacity + _1E18,
        amount: async () => (await pool.getPending()) / 2n,
        receiver: () => signer1,
      },
      {
        name: "all of the free balance when pool capacity > TARGET",
        poolCapacity: (targetCapacity) => targetCapacity + _1E18,
        amount: async () => await pool.getPending(),
        receiver: () => signer1,
      },
      {
        name: "all when pool capacity > TARGET",
        poolCapacity: (targetCapacity) => targetCapacity + _1E18,
        amount: async () => await pool.getFlashCapacity(),
        receiver: () => signer1,
      },
      {
        name: "partially when pool capacity = TARGET",
        poolCapacity: (targetCapacity) => targetCapacity,
        amount: async () => (await pool.getFlashCapacity()) / 2n,
        receiver: () => signer1,
      },
      {
        name: "all when pool capacity = TARGET",
        poolCapacity: (targetCapacity) => targetCapacity,
        amount: async () => await pool.getFlashCapacity(),
        receiver: () => signer1,
      },
      {
        name: "partially when pool capacity < TARGET",
        poolCapacity: (targetCapacity) => (targetCapacity * 3n) / 4n,
        amount: async () => (await pool.getFlashCapacity()) / 2n,
        receiver: () => signer1,
      },
      {
        name: "all when pool capacity < TARGET",
        poolCapacity: (targetCapacity) => (targetCapacity * 3n) / 4n,
        amount: async () => await pool.getFlashCapacity(),
        receiver: () => signer1,
      },
      {
        name: "to another address",
        poolCapacity: (targetCapacity) => (targetCapacity * 3n) / 4n,
        amount: async () => await pool.getFlashCapacity(),
        receiver: () => signer2,
      },
    ];

    args.forEach(function (arg) {
      it(`flashWithdraw: ${arg.name}`, async function () {
        const batchDeposited = _1E18 * 32n;
        const targetCapacity = _1E18;
        let flashCapacityBefore = arg.poolCapacity(targetCapacity);
        const targetCapacityPercent = (targetCapacity * MAX_PERCENT) / (flashCapacityBefore + batchDeposited);
        console.log(`Target capacity percent:\t${targetCapacityPercent.format()}`);
        await pool.connect(signer1)["stake()"]({ value: batchDeposited + flashCapacityBefore + 1n });
        await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
        await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);

        const receiver = arg.receiver();
        const stakerSharesBefore = await cToken.balanceOf(signer1.address);
        const receiverEthBalanceBefore = await ethers.provider.getBalance(receiver.address);
        const treasuryBalanceBefore = await ethers.provider.getBalance(treasury);
        const totalAssetsBefore = await cToken.totalAssets();
        const freeBalanceBefore = await pool.getPending();
        const stakedBonusBefore = await pool.stakeBonusAmount();
        const ratioBefore = await calcRatio(cToken, pool, 1n);
        console.log(`Flash capacity before:\t\t${(await pool.getFlashCapacity()).format()}`);
        console.log(`Pending balance before:\t\t${freeBalanceBefore.format()}`);
        console.log(`Total assets:\t\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Ratio:\t\t\t\t\t\t${ratioBefore.format()}`);

        const amount = await arg.amount();
        const shares = await cToken.convertToShares(amount); //+1 to compensate rounding after converting from shares to amount
        const expectedFee = await pool.calculateFlashUnstakeFee(amount);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        let tx = await pool.connect(signer1).flashUnstake(shares, receiver.address);
        const receipt = await tx.wait();
        const txFee = receiver.address === signer1.address ? receipt?.gasUsed * receipt?.gasPrice : 0n;
        const withdrawEvent = receipt.logs?.filter((e) => e.eventName === "FlashUnstaked");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(signer1.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(signer1.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
        expect(withdrawEvent[0].args["shares"]).to.be.closeTo(shares, 1n);
        const fee = withdrawEvent[0].args["fee"];
        expect(fee).to.be.closeTo(expectedFee, 1n);

        const stakerSharesAfter = await cToken.balanceOf(signer1);
        const receiverEthBalanceAfter = await ethers.provider.getBalance(receiver);
        const treasuryBalanceAfter = await ethers.provider.getBalance(treasury);
        const totalAssetsAfter = await cToken.totalAssets();
        const flashCapacityAfter = await pool.getFlashCapacity();
        const stakedBonusAfter = await pool.stakeBonusAmount();
        const ratioAfter = await calcRatio(cToken, pool, 1n);
        console.log(`Shares diff:\t\t\t${(stakerSharesBefore - stakerSharesAfter).format()}`);
        console.log(`TotalAssets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`FlashCapacity diff:\t\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Ratio diff:\t\t${(ratioBefore - ratioAfter).format()}`);
        console.log(`Fee paid:\t\t\t\t${fee.format()}`);

        expect(stakerSharesBefore - stakerSharesAfter).to.be.eq(shares);
        expect(receiverEthBalanceAfter - receiverEthBalanceBefore).to.be.closeTo(amount - expectedFee - txFee, 1n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 1n);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, 1n);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
        expect(stakedBonusAfter - stakedBonusBefore).to.be.closeTo(expectedFee / 2n, 1n);
      });
    });

    it("Reverts when capacity is not sufficient", async function () {
      const batchDeposited = _1E18 * 32n;
      const targetCapacity = _1E18;
      const targetCapacityPercent = (targetCapacity * MAX_PERCENT) / (targetCapacity + batchDeposited);
      console.log(`Target capacity percent:\t${targetCapacityPercent.format()}`);
      await pool.connect(signer1)["stake()"]({ value: batchDeposited + targetCapacity + 1n });
      await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
      await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);

      const shares = await cToken.balanceOf(signer1.address);
      const capacity = await pool.getFlashCapacity();
      await expect(pool.connect(signer1).flashUnstake(shares, signer1.address))
        .to.be.revertedWithCustomError(pool, "InsufficientCapacity")
        .withArgs(capacity);
    });

    it("Reverts when amount < min", async function () {
      const batchDeposited = _1E18 * 32n;
      const targetCapacity = _1E18;
      const targetCapacityPercent = (targetCapacity * MAX_PERCENT) / (targetCapacity + batchDeposited);
      console.log(`Target capacity percent:\t${targetCapacityPercent.format()}`);
      await pool.connect(signer1)["stake()"]({ value: batchDeposited + targetCapacity + 1n });
      await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
      await pool.connect(governance).setTargetFlashCapacity(targetCapacityPercent);

      const minAmount = await pool.getMinUnstake();
      const shares = (await cToken.convertToShares(minAmount)) - 1n;
      await expect(pool.connect(signer1).flashUnstake(shares, signer1.address)).to.be.revertedWithCustomError(
        pool,
        "PoolUnstakeAmLessThanMin"
      );
    });

    it("Reverts when targetFlashCapacity not set", async function () {
      const batchDeposited = _1E18 * 32n;
      await pool.connect(signer1)["stake()"]({ value: batchDeposited + _1E18 + 1n });
      await pool.connect(governance).setTargetFlashCapacity(0n);

      const shares = await cToken.balanceOf(signer1.address);
      await expect(pool.connect(signer1).flashUnstake(shares / 10n, signer1.address)).to.be.revertedWithCustomError(
        pool,
        "TargetCapacityNotSet"
      );
    });
  });

  describe("Deposit", function () {
    before(async function () {
      await snapshot.restore();
      await pool.addRestaker(TEST_PROVIDER);
      await pool.setMaxTVL(200n * _1E18);
    });

    it("Cannot add one provider twice", async () => {
      await expect(pool.addRestaker(TEST_PROVIDER)).to.be.revertedWithCustomError(pool, "PoolRestakerExists");
    });

    it("batchDeposit reverts when pool balance < 32Eth", async function () {
      await expect(pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot])).to.be.revertedWithCustomError(
        pool,
        "PoolInsufficientBalance"
      );
    });

    it("batchDeposit 1 key", async function () {
      await pool.connect(signer1)["stake()"]({ value: _1E18 * 33n });
      const poolBalanceBefore = await ethers.provider.getBalance(pool.address);
      await expect(pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]))
        .to.emit(pool, "Deposited")
        .withArgs(TEST_PROVIDER, [pubkeys[0]]);
      const poolBalanceAfter = await ethers.provider.getBalance(pool.address);
      console.log(`Pool balance diff: ${poolBalanceBefore - poolBalanceAfter}`);
      expect(poolBalanceBefore - poolBalanceAfter).to.be.eq(toWei(32));
    });

    it("batchDeposit 2 keys", async function () {
      await pool.connect(signer2)["stake()"]({ value: _1E18 * 65n });
      const poolBalanceBefore = await ethers.provider.getBalance(pool.address);
      await expect(pool.connect(operator).batchDeposit(TEST_PROVIDER, pubkeys, [signature, signature], [dataRoot, dataRoot]))
        .to.emit(pool, "Deposited")
        .withArgs(TEST_PROVIDER, pubkeys);
      const poolBalanceAfter = await ethers.provider.getBalance(pool.address);
      console.log(`Pool balance diff: ${poolBalanceBefore - poolBalanceAfter}`);
      expect(poolBalanceBefore - poolBalanceAfter).to.be.eq(toWei(64));
    });

    it("batchDeposit reverts when called by not an operator", async function () {
      await expect(
        pool.connect(governance).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot])
      ).to.be.revertedWithCustomError(pool, "OnlyOperatorAllowed");
    });

    it("batchDeposit reverts when provider does not exist", async function () {
      await pool.connect(signer2)["stake()"]({ value: _1E18 * 32n });
      await expect(pool.connect(operator).batchDeposit("provider", [pubkeys[0]], [signature], [dataRoot])).to.be.revertedWithCustomError(
        pool,
        "PoolRestakerNotExists"
      );
    });

    it("batchDeposit reverts when deposit amount > free balance", async function () {
      await snapshot.restore();
      await pool.addRestaker(TEST_PROVIDER);
      await pool.setMaxTVL(200n * _1E18);
      await pool.connect(signer2)["stake()"]({ value: _1E18 * 64n });
      console.log(`Pool balance:\t\t${await ethers.provider.getBalance(pool.address)}`);
      console.log(`target capacity:\t${await pool.targetCapacity()}`);
      console.log(`Free balance:\t\t${await pool.getFreeBalance()}`);
      await pool.setTargetFlashCapacity(10n * 10n ** 8n); //10%
      await expect(
        pool.connect(operator).batchDeposit(TEST_PROVIDER, pubkeys, [signature, signature], [dataRoot, dataRoot])
      ).to.be.revertedWithCustomError(pool, "PoolInsufficientBalance");
    });
  });

  describe("Distribute unstakes and claims", function () {
    before(async function () {
      await snapshot.restore();
      await pool.addRestaker(TEST_PROVIDER);
      await pool.setMaxTVL(_1E18 * _1E18);
      await pool.setTargetFlashCapacity(10n ** 8n); //1%
      await pool.connect(signer4)["stake()"]({ value: toWei(33) });
      await pool.connect(operator).batchDeposit(TEST_PROVIDER, [pubkeys[0]], [signature], [dataRoot]);
    });

    const difficult = 18;
    const signers = [() => signer1, () => signer2, () => signer3];

    for (let i = 0n; i < difficult; i++) {
      const signerIndex = Number(i) % signers.length;

      it(`unstake from contract (${i}/${difficult})`, async () => {
        const signer = signers[signerIndex]();
        const stakeAmount = randomBN(18);
        console.log(`Stake amount: ${stakeAmount}`);
        await pool.connect(signer)["stake()"]({ value: stakeAmount });
        /// get tokens amount and unstake a bit less
        const sharesAmount = await cToken.balanceOf(signer.address);
        console.log(`Shares amount: ${sharesAmount}`);
        await updateRatio(feed, cToken, (await cToken.ratio()) - randomBN(15));

        await pool.connect(signer).unstake(signer, sharesAmount);
      });
    }

    it("adds AVS rewards", async () => {
      this.timeout(15000000000);
      let freeBalance = await pool.getFreeBalance();
      let targetCap = await getTargetCapacity();
      let flashCapacity = await pool.getFlashCapacity();
      let totalAssets = await pool.totalAssets();
      let totalPendingB4 = await pool.getPending();
      const totalPendingUnstakes = await pool.getTotalPendingUnstakes();
      const signer1Expected = await pool.getTotalUnstakesOf(signers[0]());
      const signer2Expected = await pool.getTotalUnstakesOf(signers[1]());
      const signer3Expected = await pool.getTotalUnstakesOf(signers[2]());
      console.log(`Total assets:\t\t\t\t${(await cToken.totalAssets()).format()}`);
      console.log(`Free balance:\t\t\t\t${freeBalance.format()}`);
      console.log(`Target capacity:\t\t\t${targetCap.format()}`);
      console.log(`Total pending unstakes:\t\t${totalPendingUnstakes.format()}`);
      console.log(`signer1 pending unstakes:\t${signer1Expected.format()}`);
      console.log(`signer2 pending unstakes:\t${signer2Expected.format()}`);
      console.log(`signer3 pending unstakes:\t${signer3Expected.format()}`);
      
      expect(freeBalance).to.be.lt(flashCapacity);
      expect(flashCapacity).to.be.eq(totalAssets);
      expect(totalAssets).to.be.eq(totalPendingB4);
      console.log(totalPendingB4);

      await pool.connect(governance).setRewardsTimeline(604900); // Around 7 days
      await pool.connect(operator).addRewards({value: toWei(5)});

      const latest = await time.latest();
      await time.increaseTo(latest + 345700) // Jump 4 days

      freeBalance = await pool.getFreeBalance();
      targetCap = await getTargetCapacity();
      flashCapacity = await pool.getFlashCapacity();
      totalAssets = await pool.totalAssets();
      let totalPending = await pool.getPending();

      console.log(freeBalance);
      console.log(flashCapacity);
      console.log(totalAssets);
      console.log(totalPending);
      
      // Approximately pool.balance(Original) + 4 days of rewards
      expect(totalPending).to.be.approximately(totalPendingB4 + ((5n*10n**18n / 7n) * 4n), "100000000000000000");
    });

    it("distributeUnstakes", async () => {
      const freeBalance = await pool.getPending();
      const targetCap = await getTargetCapacity();
      const totalPendingUnstakes = await pool.getTotalPendingUnstakes();
      const signer1Expected = await pool.getTotalUnstakesOf(signers[0]());
      const signer2Expected = await pool.getTotalUnstakesOf(signers[1]());
      const signer3Expected = await pool.getTotalUnstakesOf(signers[2]());
      console.log(`Total assets:\t\t\t\t${(await cToken.totalAssets()).format()}`);
      console.log(`Free balance:\t\t\t\t${freeBalance.format()}`);
      console.log(`Target capacity:\t\t\t${targetCap.format()}`);
      console.log(`Total pending unstakes:\t\t${totalPendingUnstakes.format()}`);
      console.log(`signer1 pending unstakes:\t${signer1Expected.format()}`);
      console.log(`signer2 pending unstakes:\t${signer2Expected.format()}`);
      console.log(`signer3 pending unstakes:\t${signer3Expected.format()}`);

      await pool.connect(operator).distributeUnstakes();

      const signer1Distributed = await pool.claimableOf(signer1.address);
      const signer2Distributed = await pool.claimableOf(signer2.address);
      const signer3Distributed = await pool.claimableOf(signer3.address);

      expect(signer1Distributed).to.be.eq(signer1Expected);
      expect(signer2Distributed).to.be.eq(signer2Expected);
      expect(signer3Distributed).to.be.eq(signer3Expected);
    });

    for (let i = 0; i < signers.length; i++) {
      it(`claim unstake of signer${i}`, async () => {
        const claimable = await pool.claimableOf(signers[i]().address);
        // get how much expected
        await expect(pool.claimUnstake(signers[i]()))
          .to.emit(pool, "UnstakeClaimed")
          .withArgs(signers[i]().address, governance.address, claimable);
      });
    }

    it("Unstake all", async function () {
      const sharesAmount = await cToken.balanceOf(signer4.address);
      await pool.connect(signer4).unstake(signer4.address, sharesAmount);

      const freeBalance = await pool.getPending();
      const targetCap = await getTargetCapacity();
      const totalPendingUnstakes = await pool.getTotalPendingUnstakes();
      const poolBalance = await ethers.provider.getBalance(pool.address);
      console.log(`Total assets:\t\t\t\t${(await cToken.totalAssets()).format()}`);
      console.log(`Pool balance:\t\t\t\t${poolBalance.format()}`);
      console.log(`Free balance:\t\t\t\t${freeBalance.format()}`);
      console.log(`Target capacity:\t\t\t${targetCap.format()}`);
      console.log(`Total pending unstakes:\t\t${totalPendingUnstakes.format()}`);
    });

    it("Simulate unstakes transfer to the pool and distribute", async function () {
      const totalPendingUnstakesBefore = await pool.getTotalPendingUnstakes();
      const poolBalanceBefore = await pool.getFreeBalance();

      //Transfer amount + rewards to the pool
      const transferAmount = totalPendingUnstakesBefore - poolBalanceBefore;
      await signer1.sendTransaction({ to: pool.address, value: transferAmount });
      console.log(`Pending balance:\t\t\t\t${(await pool.getPending()).format()}`);
      await pool.connect(operator).distributeUnstakes();

      const totalPendingUnstakesAfter = await pool.getTotalPendingUnstakes();
      const poolBalanceAfter = await pool.getFreeBalance();
      const claimableAfter = await pool.claimableOf(signer4.address);
      const pendingUnstakesAfter = await pool.getUnstakes();
      console.log(`Pool balance after:\t\t\t\t${poolBalanceAfter.format()}`);
      console.log(`Total pending unstakes after:\t${totalPendingUnstakesAfter.format()}`);
      console.log(`Claimable after:\t\t\t\t${claimableAfter.format()}`);

      expect(totalPendingUnstakesAfter).to.be.eq(0n);
      expect(claimableAfter).to.be.eq(totalPendingUnstakesBefore);
      expect(pendingUnstakesAfter).to.be.empty;
    });

    it("Make final claim", async function () {
      const claimableBefore = await pool.claimableOf(signer4.address);
      const signerBalanceBefore = await ethers.provider.getBalance(signer4.address);

      await expect(pool.claimUnstake(signer4.address))
        .to.emit(pool, "UnstakeClaimed")
        .withArgs(signer4.address, governance.address, claimableBefore);

      const claimableAfter = await pool.claimableOf(signer4.address);
      const signerBalanceAfter = await ethers.provider.getBalance(signer4.address);
      const poolBalanceAfter = await ethers.provider.getBalance(pool.address);

      expect(signerBalanceAfter - signerBalanceBefore).to.be.eq(claimableBefore);
      expect(claimableAfter).to.be.eq(0n);
      expect(poolBalanceAfter).to.be.eq((5n*10n**18n / 7n) * 3n);  //  Remaining 3 days of AVS rewards
    });
  });

  describe("Claim rewards from restaker", function () {
    before(async function () {
      await snapshot.restore();
      await pool.addRestaker(TEST_PROVIDER);
    });

    it("only operator allowed", async () => {
      await expect(pool.claimRestaker(TEST_PROVIDER, "0")).to.be.revertedWithCustomError(pool, "OnlyOperatorAllowed");
    });

    it("claim without fee", async () => {
      const restakerAddr = await pool.getRestaker(TEST_PROVIDER);
      // send ETH to restaker
      await operator.sendTransaction({
        to: restakerAddr,
        value: _1E18,
      });

      const balanceBefore = await ethers.provider.getBalance(await pool.getAddress());

      await expect(pool.connect(operator).claimRestaker(TEST_PROVIDER, "0"))
        .to.emit(pool, "FeeClaimed")
        .withArgs(restakerAddr, treasury.address, 0, _1E18);
    });

    it("claim with fee", async () => {
      const restakerAddr = await pool.getRestaker(TEST_PROVIDER);
      // send ETH to restaker
      await operator.sendTransaction({
        to: restakerAddr,
        value: _1E18,
      });

      const balanceBefore = await ethers.provider.getBalance(await pool.getAddress());

      await expect(pool.connect(operator).claimRestaker(TEST_PROVIDER, "0"))
        .to.emit(pool, "FeeClaimed")
        .withArgs(restakerAddr, treasury.address, 0, _1E18);
    });

    it("fee is ambiguous", async () => {
      await expect(pool.connect(operator).claimRestaker(TEST_PROVIDER, "1000"))
        .to.be.revertedWithCustomError(pool, "AmbiguousFee")
        .withArgs(0, "1000");
    });
  });

  describe("addRewards: gradually adds rewards during timeline period", function () {
    const totalDays = 7n;
    let totalRewardsAmount;
    before(async function () {
      await snapshot.restore();
      await pool.connect(governance).setRewardsTimeline(totalDays * 86400n);
    });

    it("addRewards when there are no other rewards have been added", async function () {
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      const poolBalanceBefore = await ethers.provider.getBalance(pool.address);
      const totalAssetsBefore = await pool.totalAssets();

      const latestBlock = await ethers.provider.getBlock('latest');
      const nextBlockTimestamp = BigInt(latestBlock.timestamp) + randomBN(2);
      await time.setNextBlockTimestamp(nextBlockTimestamp);

      totalRewardsAmount = randomBN(17);
      console.log("Amount:", totalRewardsAmount.format());
      const tx = await pool.connect(operator).addRewards({value: totalRewardsAmount});

      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      const poolBalanceAfter = await ethers.provider.getBalance(pool.address);
      const totalAssetsAfter = await pool.totalAssets();
      console.log("Operator balance diff:", (operatorBalanceBefore - operatorBalanceAfter).format());
      console.log("pool balance diff:", (poolBalanceAfter - poolBalanceBefore).format());
      console.log("Total assets diff:", (totalAssetsAfter - totalAssetsBefore).format());

      await expect(tx).emit(pool, "RewardsAdded").withArgs(totalRewardsAmount, nextBlockTimestamp);
      await expect(tx).changeEtherBalance(operator, -totalRewardsAmount, {includeFee: false});
      await expect(tx).changeEtherBalance(pool, totalRewardsAmount);
      expect(totalAssetsAfter).to.be.closeTo(totalAssetsBefore, totalDays);
    })

    it("Can not add more rewards until the end of timeline", async function () {
      await expect(pool.connect(operator).addRewards({value: randomBN(18)}))
          .to.revertedWithCustomError(pool, "TimelineNotOver");
    })

    it("User can stake", async function() {
      const totalAssetsBefore = await pool.totalAssets();

      const amount = 10n * _1E18;
      await pool.connect(signer1)["stake()"]({ value: amount});

      const totalAssetsAfter = await pool.totalAssets();
      expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, totalDays);
    })

    it("Check total assets every day", async function () {
      let startTimeline = await pool.startTimeline();
      let latestBlock;
      let daysPassed;
      do {
        const totalAssetsBefore = await pool.totalAssets();
        const freeBalanceBefore = await pool.getFreeBalance();
        await time.increase(day);
        latestBlock = await ethers.provider.getBlock('latest');
        const currentTime = BigInt(latestBlock.timestamp);
        daysPassed = (currentTime - startTimeline) / day;

        const totalAssetsAfter = await pool.totalAssets();
        const freeBalanceAfter = await pool.getFreeBalance();
        const unlockedAmount = totalAssetsAfter - totalAssetsBefore;
        console.log(`${daysPassed}. Total assets increased by:`, unlockedAmount.format());
        expect(totalRewardsAmount / totalDays).to.be.closeTo(unlockedAmount, totalDays);
        expect(freeBalanceAfter - freeBalanceBefore).to.be.closeTo(unlockedAmount, totalDays);
      } while (daysPassed < totalDays)

      console.log("Total assets after:\t\t", (await pool.totalAssets()).format());
      console.log("pool balance after:\t", (await ethers.provider.getBalance(pool.address)).format());

      expect(await ethers.provider.getBalance(pool.address)).to.be.eq(await pool.totalAssets());
    })

    it("Total assets does not change on the next day after timeline passed", async function() {
      const totalAssetsBefore = await pool.totalAssets();
      await time.increase(day);
      const totalAssetsAfter = await pool.totalAssets();

      console.log("Total assets increased by:", (totalAssetsAfter - totalAssetsBefore).format());
      expect(totalAssetsAfter).to.be.eq(totalAssetsBefore);
      expect(await ethers.provider.getBalance(pool.address)).to.be.eq(await pool.totalAssets());
    })

    it("New rewards can be added", async function() {
      const operatorBalanceBefore = await ethers.provider.getBalance(operator.address);
      const poolBalanceBefore = await ethers.provider.getBalance(pool.address);
      const totalAssetsBefore = await pool.totalAssets();

      const latestBlock = await ethers.provider.getBlock('latest');
      const nextBlockTimestamp = BigInt(latestBlock.timestamp) + randomBN(2);
      await time.setNextBlockTimestamp(nextBlockTimestamp);

      totalRewardsAmount = randomBN(17);
      console.log("Amount:", totalRewardsAmount.format());
      const tx = await pool.connect(operator).addRewards({value: totalRewardsAmount});

      const operatorBalanceAfter = await ethers.provider.getBalance(operator.address);
      const poolBalanceAfter = await ethers.provider.getBalance(pool.address);
      const totalAssetsAfter = await pool.totalAssets();
      console.log("Operator balance diff:", (operatorBalanceBefore - operatorBalanceAfter).format());
      console.log("pool balance diff:", (poolBalanceAfter - poolBalanceBefore).format());
      console.log("Total assets diff:", (totalAssetsAfter - totalAssetsBefore).format());

      await expect(tx).emit(pool, "RewardsAdded").withArgs(totalRewardsAmount, nextBlockTimestamp);
      await expect(tx).changeEtherBalance(operator, -totalRewardsAmount, {includeFee: false});
      await expect(tx).changeEtherBalance(pool, totalRewardsAmount);
      expect(totalAssetsAfter).to.be.closeTo(totalAssetsBefore, totalDays);
    })
  })
});

async function updateRatio(ratioFeed: RatioFeed, token: CToken, ratio: BigInt) {
  await increaseChainTimeForSeconds(60 * 60 * 12 + 1); //+12h
  await ratioFeed.connect(operator).updateRatio(token, ratio.toString());
  expect(await token.ratio()).to.be.eq(ratio);
}
