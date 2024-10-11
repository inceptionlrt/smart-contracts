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

describe("RestakingPool AVS", function () {
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

  describe("AVS", function () {
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

    // for (let i = 0n; i < difficult; i++) {
    //   const signerIndex = Number(i) % signers.length;

    //   it(`unstake from contract (${i}/${difficult})`, async () => {
    //     const signer = signers[signerIndex]();
    //     const stakeAmount = randomBN(18);
    //     console.log(`Stake amount: ${stakeAmount}`);
    //     await pool.connect(signer)["stake()"]({ value: stakeAmount });
    //     /// get tokens amount and unstake a bit less
    //     const sharesAmount = await cToken.balanceOf(signer.address);
    //     console.log(`Shares amount: ${sharesAmount}`);
    //     await updateRatio(feed, cToken, (await cToken.ratio()) - randomBN(15));

    //     await pool.connect(signer).unstake(signer, sharesAmount);
    //   });
    // }

    it("adds AVS rewards", async () => {
      this.timeout(15000000000);
      let freeBalance = await pool.getPending();
      let targetCap = await getTargetCapacity();
      let flashCapacity = await pool.getFlashCapacity();
      let totalAssets = await pool.totalAssets();
      let totalPending = await pool.getPending();
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
      
      expect(freeBalance).to.be.eq(flashCapacity);
      expect(flashCapacity).to.be.eq(totalAssets);
      expect(totalAssets).to.be.eq(totalPending);
      
      await pool.connect(governance).setRewardsTimeline(604800); // Around 7 days
      await pool.connect(operator).addRewards({value: toWei(5)});

      const latest = await time.latest();
      await time.increaseTo(latest + 345600) // Jump 4 days

      freeBalance = await pool.getPending();
      targetCap = await getTargetCapacity();
      flashCapacity = await pool.getFlashCapacity();
      totalAssets = await pool.totalAssets();
      totalPending = await pool.getPending();

      console.log(freeBalance);
      console.log(flashCapacity);
      console.log(totalAssets);
      console.log(totalPending);

      // Approximately pool.balance(Original) + 4 days of rewards
      expect(totalPending).to.be.approximately("3857142857142857200", "100000000000000000");
    });
  });
});

async function updateRatio(ratioFeed: RatioFeed, token: CToken, ratio: BigInt) {
  await increaseChainTimeForSeconds(60 * 60 * 12 + 1); //+12h
  await ratioFeed.connect(operator).updateRatio(token, ratio.toString());
  expect(await token.ratio()).to.be.eq(ratio);
}
