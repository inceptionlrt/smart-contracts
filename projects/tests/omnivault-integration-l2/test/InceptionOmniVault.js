require("dotenv").config();
const { ethers, upgrades, network } = require("hardhat");
const config = require("../hardhat.config");
const { expect } = require("chai");
const { takeSnapshot } = require("@nomicfoundation/hardhat-network-helpers");
const { toWei, randomBI, e18, randomBIMax } = require("./helpers/utils");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

function encodeArbitrumFees(maxSubmissionCost, maxGas, gasPriceBid) {
  const abiCoder = new ethers.AbiCoder();
  return [abiCoder.encode(["uint256", "uint256", "uint256"], [maxSubmissionCost, maxGas, gasPriceBid])];
}

function encodeOptimismFees(maxGas) {
  const abiCoder = new ethers.AbiCoder();
  return [abiCoder.encode(["uint256"], [maxGas])];
}

const adapters = [
  {
    name: "Arbitrum",
    tag: "arb",
    deploy: async args => {
      console.log("- Arbitrum adapter");
      const CrossChainAdapterL2 = await ethers.getContractFactory("CrossChainAdapterArbitrumL2", args.owner);
      const adapter = await upgrades.deployProxy(CrossChainAdapterL2, [args.targetL1, args.operator.address]);
      await adapter.waitForDeployment();
      adapter.address = await adapter.getAddress();
      return adapter;
    },
    url: process.env.RPC_URL_ARBITRUM,
    blockNumber: 257998023,
    feesFunc: () => encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n),
  },
  {
    name: "Optimism",
    tag: "opt",
    deploy: async args => {
      console.log("- Optimism adapter");
      const CrossChainAdapterL2 = await ethers.getContractFactory("CrossChainAdapterOptimismL2", args.owner);
      const adapter = await upgrades.deployProxy(CrossChainAdapterL2, [args.targetL1, args.operator.address]);
      await adapter.waitForDeployment();
      adapter.address = await adapter.getAddress();
      return adapter;
    },
    url: process.env.RPC_URL_OPTIMISM,
    blockNumber: 125920000,
    feesFunc: () => encodeOptimismFees(200_000n),
  },
];

let tx;
async function init(owner, operator, targetL1, adapterInfo) {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);

  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  await iToken.waitForDeployment();
  iToken.address = await iToken.getAddress();

  console.log("- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed", owner);
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.waitForDeployment();
  ratioFeed.address = await ratioFeed.getAddress();

  console.log("- Update Mock Ratio Feed with Mock Token");
  await (await ratioFeed.updateRatioBatch([iToken.address], [e18])).wait();

  const adapter = await adapterInfo.deploy({
    targetL1: targetL1.address,
    owner,
    operator,
    optMessenger: adapterInfo.optMessenger,
    optBridge: adapterInfo.optBridge,
  });

  // Deploy the OmniVault
  console.log("- Deploying OmniVault");
  const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault", owner);
  const omniVault = await upgrades.deployProxy(
    omniVaultFactory,
    ["Omnivault", operator.address, iToken.address, adapter.address],
    { initializer: "__InceptionOmniVault_init" },
  );
  await omniVault.waitForDeployment();
  omniVault.address = await omniVault.getAddress();
  await (await adapter.setVault(omniVault.address)).wait();

  await (await omniVault.setRatioFeed(ratioFeed.address)).wait();
  await (await iToken.setVault(omniVault.address)).wait();

  console.log("- Arbsys mock");
  const arbSysMock = await ethers.deployContract("ArbSysMock", []);
  arbSysMock.address = await arbSysMock.getAddress();

  if (adapterInfo.tag === "arb") {
    await adapter.setArbSys(arbSysMock.address);
  }

  return [iToken, omniVault, ratioFeed, adapter, arbSysMock];
}

adapters.forEach(function (adapterInfo) {
  describe(`Inception omni vault ${adapterInfo.name}`, function () {
    const optMessenger = network.config.addresses.OPT_DOMAIN_MESSENGER;
    const optBridge = network.config.addresses.OPT_BRIDGE;

    this.timeout(150000);
    let omniVault, iToken, ratioFeed, adapter, arbSysMock;
    let owner, operator, targetL1, staker1, staker2, staker3, treasury;
    let snapshot;
    let TARGET;

    async function addReplenishBonus(amount) {
      let collectedFee = 0n;
      if (amount > 0n) {
        await (await omniVault.connect(staker3).deposit(staker3.address, { value: amount })).wait();
        const shares = await iToken.balanceOf(staker3.address);
        const tx = await omniVault.connect(staker3).flashWithdraw(shares, staker3.address);
        const rec = await tx.wait();
        collectedFee += (rec.logs.find(l => l.eventName === "FlashWithdraw")?.args.fee || 0n) / 2n;
        console.log("Collected bonus:\t", collectedFee.format());
      }
      return collectedFee;
    }

    before(async function () {
      if (process.env.CHAINS) {
        const chains = process.env.CHAINS.toLocaleLowerCase().split(",");
        if (!adapterInfo.tag || !chains.includes(adapterInfo.tag.toLowerCase())) {
          console.log(`${adapterInfo.tag} is not in the list, going to skip`);
          this.skip();
        }
      }
      //Switch network
      console.log(adapterInfo.url);
      console.log(adapterInfo.blockNumber);

      await network.provider.send("hardhat_reset", [
        {
          forking: {
            jsonRpcUrl: adapterInfo.url,
            blockNumber: adapterInfo.blockNumber,
          },
        },
      ]);
      [owner, operator, targetL1, staker1, staker2, staker3] = await ethers.getSigners();
      adapterInfo.optMessenger = optMessenger;
      adapterInfo.optBridge = optBridge;
      [iToken, omniVault, ratioFeed, adapter, arbSysMock] = await init(owner, operator, targetL1, adapterInfo);
      treasury = await omniVault.treasuryAddress();
      snapshot = await takeSnapshot();
    });

    describe("Base flow", function () {
      let deposited, freeBalance, depositFees;

      before(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
      });

      it("Initial ratio", async function () {
        const ratio = await omniVault.ratio();
        console.log(`Initial ratio:\t\t${ratio.format()}`);
      });

      it("Deposit to vault", async function () {
        freeBalance = randomBI(19);
        deposited = TARGET + freeBalance;
        const expectedShares = (deposited * e18) / (await omniVault.ratio());
        const tx = await omniVault.connect(staker1).deposit(staker1.address, { value: deposited });
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker1.address);
        expect(events[0].args["receiver"]).to.be.eq(staker1.address);
        expect(events[0].args["amount"]).to.be.eq(deposited);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, 1n);
        expect(receipt.logs.find(l => l.eventName === "DepositBonus")).to.be.undefined; //Because there is no replenish rewards has been collected yet
        console.log(`Ratio after:\t\t${(await omniVault.ratio()).format()}`);

        expect(await iToken.balanceOf(staker1.address)).to.be.closeTo(expectedShares, 1n);
        expect(await omniVault.totalAssets()).to.be.eq(deposited);
        expect(await omniVault.getFlashCapacity()).to.be.eq(deposited);
        expect(await omniVault.ratio()).to.be.eq(e18);
      });

      it("Flash withdraw all", async function () {
        const sharesBefore = await iToken.balanceOf(staker1);
        const senderBalanceBefore = await ethers.provider.getBalance(staker1);
        const receiver = staker2;
        const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
        const treasuryBalanceBefore = await ethers.provider.getBalance(owner);
        const totalAssetsBefore = await omniVault.totalAssets();
        const flashCapacityBefore = await omniVault.getFlashCapacity();
        console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

        const amount = await omniVault.convertToAssets(sharesBefore);
        const expectedFee = await omniVault.calculateFlashUnstakeFee(amount);
        console.log(`Amount:\t\t\t\t\t${amount.format()}`);
        console.log(`Shares:\t\t\t\t\t${sharesBefore.format()}`);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        let tx = await omniVault.connect(staker1).flashWithdraw(sharesBefore, receiver.address);
        const receipt = await tx.wait();
        const txFee = BigInt(receipt.gasUsed * receipt.gasPrice);
        const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(staker1.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(staker1.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
        expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(sharesBefore, 1n);
        expect(withdrawEvent[0].args["fee"]).to.be.closeTo(expectedFee, 1n);
        const collectedFees = withdrawEvent[0].args["fee"];
        depositFees = collectedFees / 2n;

        const sharesAfter = await iToken.balanceOf(staker1);
        const senderBalanceAfter = await ethers.provider.getBalance(staker1);
        const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
        const treasuryBalanceAfter = await ethers.provider.getBalance(owner);
        const totalAssetsAfter = await omniVault.totalAssets();
        const flashCapacityAfter = await omniVault.getFlashCapacity();
        console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`Sender balance diff:\t${(senderBalanceBefore - senderBalanceAfter).format()}`);
        console.log(`Receiver balance diff:\t${(receiverBalanceAfter - receiverBalanceBefore).format()}`);
        console.log(`Treasury balance diff:\t${(treasuryBalanceAfter - treasuryBalanceBefore).format()}`);
        console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(sharesBefore);
        expect(senderBalanceBefore - senderBalanceAfter).to.be.closeTo(txFee, 1n);
        expect(receiverBalanceAfter - receiverBalanceBefore).to.be.closeTo(amount - expectedFee, 1n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 1n);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, 1n);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
      });
    });

    describe("Deposit", function () {
      let TARGET;

      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
      });

      const args = [
        {
          name: "1st time < TARGET",
          predepositAmount: () => 0n,
          amount: async () => TARGET / 2n,
          withdrawFeeFrom: () => 0n,
          receiver: () => staker1.address,
        },
        {
          name: "1st time > TARGET",
          predepositAmount: () => 0n,
          amount: async () => randomBIMax(TARGET),
          withdrawFeeFrom: () => 0n,
          receiver: () => staker1.address,
        },
        {
          name: "more wo rewards",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => 0n,
          receiver: () => staker1.address,
        },
        {
          name: "more with rewards",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => TARGET,
          receiver: () => staker1.address,
        },
        {
          name: "min amount",
          predepositAmount: () => 0n,
          amount: async () => await omniVault.minAmount(),
          withdrawFeeFrom: () => TARGET,
          receiver: () => staker1.address,
        },
        {
          name: "and redeem all rewards",
          predepositAmount: () => TARGET / 10n,
          amount: async () => (TARGET * 8n) / 10n,
          withdrawFeeFrom: () => TARGET / 10n,
          receiver: () => staker1.address,
        },
        {
          name: "up to target cap and above",
          predepositAmount: () => TARGET / 10n,
          amount: async () => TARGET,
          withdrawFeeFrom: () => TARGET / 2n,
          receiver: () => staker1.address,
        },
        {
          name: "above target cap",
          predepositAmount: () => TARGET + 1n,
          amount: async () => randomBI(19),
          withdrawFeeFrom: () => TARGET,
          receiver: () => staker1.address,
        },
        {
          name: "to another address",
          predepositAmount: () => TARGET / 10n,
          amount: async () => TARGET,
          withdrawFeeFrom: () => TARGET,
          receiver: () => staker2.address,
        },

        //Ratio < 1
        {
          name: "more wo rewards when ratio < 1",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => 0n,
          ratio: toWei(0.9),
          receiver: () => staker1.address,
        },
        {
          name: "more with rewards when ratio < 1",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => TARGET,
          ratio: toWei(0.9),
          receiver: () => staker1.address,
        },
        {
          name: "min amount when ratio < 1",
          predepositAmount: () => 0n,
          amount: async () => await omniVault.minAmount(),
          withdrawFeeFrom: () => TARGET,
          ratio: toWei(0.9),
          receiver: () => staker1.address,
        },
      ];

      args.forEach(function (arg) {
        it(`Deposit ${arg.name}`, async function () {
          //Predeposit
          const predepositAmount = arg.predepositAmount();
          if (predepositAmount > 0n) {
            const randomAddress = ethers.Wallet.createRandom().address;
            await omniVault.connect(staker3).deposit(randomAddress, { value: predepositAmount });
            expect(await omniVault.getFlashCapacity()).to.be.closeTo(predepositAmount, 2n);
          }

          //Add rewards
          let availableBonus = await addReplenishBonus(arg.withdrawFeeFrom());

          if (arg.ratio) {
            await ratioFeed.updateRatioBatch([await iToken.getAddress()], [arg.ratio]);
            console.log(`Ratio updated:\t\t\t${(await omniVault.ratio()).format()}`);
          }

          const receiver = arg.receiver();
          const stakerSharesBefore = await iToken.balanceOf(receiver);
          const totalAssetsBefore = await omniVault.totalAssets();
          const flashCapacityBefore = await omniVault.getFlashCapacity();
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          console.log(`Amount:\t\t\t\t\t${amount.format()}`);
          const calculatedBonus = await omniVault.calculateDepositBonus(amount);
          console.log(`Preview bonus:\t\t\t${calculatedBonus.format()}`);
          console.log(`Available bonus:\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t${expectedBonus.format()}`);
          const convertedShares = await omniVault.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await omniVault.ratio())) / e18;

          const tx = await omniVault.connect(staker1).deposit(receiver, { value: amount });
          const receipt = await tx.wait();
          const depositEvent = receipt.logs?.filter(e => e.eventName === "Deposit");
          expect(depositEvent.length).to.be.eq(1);
          expect(depositEvent[0].args["sender"]).to.be.eq(staker1.address);
          expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
          expect(depositEvent[0].args["amount"]).to.be.eq(amount);
          expect(depositEvent[0].args["iShares"]).to.be.closeTo(convertedShares, 1n);
          //DepositBonus event
          const actualBonus = receipt.logs.find(l => l.eventName === "DepositBonus")?.args.amount || 0n;
          console.log(`Actual bonus:\t\t\t${actualBonus.format()}`);

          const stakerSharesAfter = await iToken.balanceOf(receiver);
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          console.log(`Bonus after:\t\t\t${availableBonus.format()}`);

          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, 1n);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, 1n);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.eq(amount); //omniVault balance is the same
          expect(actualBonus).to.be.closeTo(expectedBonus, 1n);
          expect(flashCapacityAfter - flashCapacityBefore).to.be.closeTo(amount + expectedBonus, 1n); //rewarded bonus goes to flash capacity
        });
      });

      const invalidArgs = [
        {
          name: "amount is 0",
          amount: async () => 0n,
          receiver: () => staker1.address,
          customError: "LowerMinAmount",
        },
        {
          name: "amount < min",
          amount: async () => (await omniVault.minAmount()) - 1n,
          receiver: () => staker1.address,
          customError: "LowerMinAmount",
        },
        {
          name: "to zero address",
          amount: async () => randomBI(18),
          receiver: () => ethers.ZeroAddress,
          customError: "NullParams",
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`Reverts when deposit ${arg.name}`, async function () {
          const amount = await arg.amount();
          const receiver = arg.receiver();
          if (arg.customError) {
            await expect(omniVault.connect(staker1).deposit(receiver, { value: amount })).to.be.revertedWithCustomError(
              omniVault,
              arg.customError,
            );
          } else {
            await expect(omniVault.connect(staker1).deposit(receiver, { value: amount })).to.be.revertedWith(arg.error);
          }
        });
      });

      it("Reverts when omniVault is paused", async function () {
        await omniVault.pause();
        const depositAmount = randomBI(19);
        await expect(omniVault.connect(staker1).deposit(staker1.address, { value: depositAmount })).to.be.revertedWith(
          "Pausable: paused",
        );
        await omniVault.unpause();
      });

      it("Reverts when shares is 0", async function () {
        await omniVault.setMinAmount(0n);
        await expect(omniVault.connect(staker1).deposit(staker1.address, { value: 0n })).to.be.revertedWithCustomError(
          omniVault,
          "ResultISharesZero",
        );
      });
    });

    describe("Deposit bonus params setter and calculation", function () {
      let TARGET, MAX_PERCENT, localSnapshot;
      before(async function () {
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const depositBonusSegment = [
        {
          fromUtilization: async () => 0n,
          fromPercent: async () => await omniVault.maxBonusRate(),
          toUtilization: async () => await omniVault.depositUtilizationKink(),
          toPercent: async () => await omniVault.optimalBonusRate(),
        },
        {
          fromUtilization: async () => await omniVault.depositUtilizationKink(),
          fromPercent: async () => await omniVault.optimalBonusRate(),
          toUtilization: async () => await omniVault.MAX_PERCENT(),
          toPercent: async () => await omniVault.optimalBonusRate(),
        },
        {
          fromUtilization: async () => await omniVault.MAX_PERCENT(),
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
          flashCapacity: () => 0n,
          amount: async () => (await omniVault.convertToAssets(await omniVault.minAmount())) + 1n,
        },
        {
          name: "1 wei from 0",
          flashCapacity: () => 0n,
          amount: async () => 1n,
        },
        {
          name: "from 0 to 25% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => (TARGET * 25n) / 100n,
        },
        {
          name: "from 0 to 25% + 1wei of TARGET",
          flashCapacity: () => 0n,
          amount: async () => (TARGET * 25n) / 100n,
        },
        {
          name: "from 25% to 100% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amount: async () => (TARGET * 75n) / 100n,
        },
        {
          name: "from 0% to 100% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => TARGET,
        },
        {
          name: "from 0% to 200% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => TARGET * 2n,
        },
      ];

      args.forEach(function (arg) {
        it(`setDepositBonusParams: ${arg.name}`, async function () {
          await snapshot.restore();
          TARGET = e18;
          await omniVault.connect(owner).setTargetFlashCapacity(TARGET);

          await expect(
            omniVault.setDepositBonusParams(
              arg.newMaxBonusRate,
              arg.newOptimalBonusRate,
              arg.newDepositUtilizationKink,
            ),
          )
            .to.emit(omniVault, "DepositBonusParamsChanged")
            .withArgs(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newDepositUtilizationKink);

          expect(await omniVault.maxBonusRate()).to.be.eq(arg.newMaxBonusRate);
          expect(await omniVault.optimalBonusRate()).to.be.eq(arg.newOptimalBonusRate);
          expect(await omniVault.depositUtilizationKink()).to.be.eq(arg.newDepositUtilizationKink);
          localSnapshot = await takeSnapshot();
        });

        amounts.forEach(function (amount) {
          it(`calculateDepositBonus for ${amount.name}`, async function () {
            await localSnapshot.restore();
            let flashCapacity = amount.flashCapacity();
            if (flashCapacity > 0n) {
              await omniVault.connect(staker1).deposit(staker1.address, { value: flashCapacity });
            }
            let _amount = await amount.amount();
            let depositBonus = 0n;
            while (_amount > 0n) {
              for (const feeFunc of depositBonusSegment) {
                const utilization = (flashCapacity * MAX_PERCENT) / TARGET;
                const fromUtilization = await feeFunc.fromUtilization();
                const toUtilization = await feeFunc.toUtilization();
                if (_amount > 0n && fromUtilization <= utilization && utilization < toUtilization) {
                  const fromPercent = await feeFunc.fromPercent();
                  const toPercent = await feeFunc.toPercent();
                  const upperBound = (toUtilization * TARGET) / MAX_PERCENT;
                  const replenished = upperBound > flashCapacity + _amount ? _amount : upperBound - flashCapacity;
                  const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                  const bonusPercent = fromPercent + (slope * (flashCapacity + replenished / 2n)) / TARGET;
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
            let contractBonus = await omniVault.calculateDepositBonus(await amount.amount());
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
      ];
      invalidArgs.forEach(function (arg) {
        it(`setDepositBonusParams reverts when ${arg.name}`, async function () {
          await expect(
            omniVault.setDepositBonusParams(
              arg.newMaxBonusRate(),
              arg.newOptimalBonusRate(),
              arg.newDepositUtilizationKink(),
            ),
          ).to.be.revertedWithCustomError(omniVault, arg.customError);
        });
      });

      it("setDepositBonusParams reverts when caller is not an owner", async function () {
        await expect(
          omniVault
            .connect(staker1)
            .setDepositBonusParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Flash withdraw", function () {
      let TARGET, MAX_PERCENT, ratio;
      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const args = [
        {
          name: "some amount when capacity > TARGET",
          poolCapacity: () => TARGET * 2n,
          amount: async () => randomBIMax(TARGET / 2n),
          receiver: () => staker1,
        },
        {
          name: "all capacity above TARGET",
          poolCapacity: () => TARGET * 2n,
          amount: async () => (await omniVault.getFlashCapacity()) - TARGET,
          receiver: () => staker1,
        },
        {
          name: "all when pool capacity > TARGET",
          poolCapacity: () => TARGET + e18,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => staker1,
        },
        {
          name: "partially when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => staker1,
        },
        {
          name: "all when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => staker1,
        },
        {
          name: "partially when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => staker1,
        },
        {
          name: "all when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => staker1,
        },
        {
          name: "to another address",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => staker2,
        },
        {
          name: "after protocol fee has been changed",
          poolCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => staker1,
          protocolFee: () => BigInt(25 * 10 ** 8),
        },
      ];

      args.forEach(function (arg) {
        it(`flashWithdraw: ${arg.name}`, async function () {
          ratio = toWei(0.8);
          await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
          //Deposit
          const predepositAmount = arg.poolCapacity();
          await omniVault.connect(staker1).deposit(staker1.address, { value: predepositAmount });
          //Set protocol fee
          let protocolFee = await omniVault.protocolFee();
          if (arg.protocolFee) {
            protocolFee = arg.protocolFee();
            await omniVault.setProtocolFee(protocolFee);
          }
          //flashWithdraw
          const ratioBefore = await omniVault.ratio();
          console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);

          const receiver = await arg.receiver();
          const sharesBefore = await iToken.balanceOf(staker1);
          const assetBalanceBefore = await ethers.provider.getBalance(receiver);
          const treasuryBalanceBefore = await ethers.provider.getBalance(treasury);
          const totalAssetsBefore = await omniVault.totalAssets();
          const flashCapacityBefore = await omniVault.getFlashCapacity();
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          const shares = await omniVault.convertToShares(amount);
          const expectedFee = await omniVault.calculateFlashUnstakeFee(amount);
          console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

          let tx = await omniVault.connect(staker1).flashWithdraw(shares, receiver.address);
          const receipt = await tx.wait();
          const txFee = receiver.address === staker1.address ? BigInt(receipt.gasUsed * receipt.gasPrice) : 0n;
          const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");
          expect(withdrawEvent.length).to.be.eq(1);
          expect(withdrawEvent[0].args["sender"]).to.be.eq(staker1.address);
          expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
          expect(withdrawEvent[0].args["owner"]).to.be.eq(staker1.address);
          expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
          expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, 1n);
          const actualFee = withdrawEvent[0].args["fee"];
          console.log(`Actual fee:\t\t\t\t${actualFee.format()}`);

          const sharesAfter = await iToken.balanceOf(staker1);
          const assetBalanceAfter = await ethers.provider.getBalance(receiver);
          const treasuryBalanceAfter = await ethers.provider.getBalance(treasury);
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          console.log(`Shares diff:\t\t\t${(sharesBefore - sharesAfter).format()}`);
          console.log(`Receiver balance diff:\t${(assetBalanceAfter - assetBalanceBefore).format()}`);
          console.log(`TotalAssets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
          console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);

          expect(sharesBefore - sharesAfter).to.be.eq(shares);
          expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee - txFee, 1n);
          expect(actualFee).to.be.closeTo(expectedFee, 1n);
          const toDepositBonus = (expectedFee * (MAX_PERCENT - protocolFee)) / MAX_PERCENT;
          const toTreasury = (expectedFee * protocolFee) / MAX_PERCENT;
          expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(toTreasury, 1n);
          expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - toDepositBonus, 1n);
          expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
        });
      });

      it("Reverts when capacity is not sufficient", async function () {
        await omniVault.connect(staker1).deposit(staker1.address, { value: toWei(1) });
        ratio = toWei(0.8);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        const shares = await iToken.balanceOf(staker1.address);
        const capacity = await omniVault.getFlashCapacity();
        await expect(omniVault.connect(staker1).flashWithdraw(shares, staker1.address))
          .to.be.revertedWithCustomError(omniVault, "InsufficientCapacity")
          .withArgs(capacity);
      });

      it("Reverts when amount < min", async function () {
        await omniVault.connect(staker1).deposit(staker1.address, { value: toWei(1) });
        const minAmount = await omniVault.minAmount();
        const shares = (await omniVault.convertToShares(minAmount)) - 1n;
        await expect(omniVault.connect(staker1).flashWithdraw(shares, staker1.address))
          .to.be.revertedWithCustomError(omniVault, "LowerMinAmount")
          .withArgs(minAmount);
      });

      it("Reverts when omniVault is paused", async function () {
        await omniVault.connect(staker1).deposit(staker1.address, { value: toWei(1) });
        await omniVault.pause();
        const shares = await iToken.balanceOf(staker1.address);
        await expect(omniVault.connect(staker1).flashWithdraw(shares / 2n, staker1.address)).to.be.revertedWith(
          "Pausable: paused",
        );
      });

      it("Reverts when withdraws to 0 address", async function () {
        await omniVault.connect(staker1).deposit(staker1.address, { value: toWei(1) });
        const shares = await iToken.balanceOf(staker1.address);
        await expect(
          omniVault.connect(staker1).flashWithdraw(shares / 2n, ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("Reverts when shares = 0", async function () {
        await omniVault.connect(staker1).deposit(staker1.address, { value: toWei(1) });
        await expect(omniVault.connect(staker1).flashWithdraw(0n, staker1.address)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });
    });

    describe("Withdraw fee params setter and calculation", function () {
      let TARGET, MAX_PERCENT, localSnapshot;
      before(async function () {
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const withdrawFeeSegment = [
        {
          fromUtilization: async () => 0n,
          fromPercent: async () => await omniVault.maxFlashFeeRate(),
          toUtilization: async () => await omniVault.withdrawUtilizationKink(),
          toPercent: async () => await omniVault.optimalWithdrawalRate(),
        },
        {
          fromUtilization: async () => await omniVault.withdrawUtilizationKink(),
          fromPercent: async () => await omniVault.optimalWithdrawalRate(),
          toUtilization: async () => await omniVault.MAX_PERCENT(),
          toPercent: async () => await omniVault.optimalWithdrawalRate(),
        },
        {
          fromUtilization: async () => await omniVault.MAX_PERCENT(),
          fromPercent: async () => 0n,
          toUtilization: async () => ethers.MaxUint256,
          toPercent: async () => 0n,
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
          flashCapacity: () => TARGET * 2n,
          amount: async () => await omniVault.getFlashCapacity(),
        },
        {
          name: "from 100% to 0% of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
        },
        {
          name: "1 wei from 100%",
          flashCapacity: () => TARGET,
          amount: async () => 1n,
        },
        {
          name: "min amount from 100%",
          flashCapacity: () => TARGET,
          amount: async () => (await omniVault.convertToAssets(await omniVault.minAmount())) + 1n,
        },
        {
          name: "from 100% to 25% of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => (TARGET * 75n) / 100n,
        },
        {
          name: "from 100% to 25% - 1wei of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => (TARGET * 75n) / 100n + 1n,
        },
        {
          name: "from 25% to 0% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amount: async () => await omniVault.getFlashCapacity(),
        },
      ];

      args.forEach(function (arg) {
        it(`setFlashWithdrawFeeParams: ${arg.name}`, async function () {
          await snapshot.restore();
          TARGET = e18;
          await omniVault.connect(owner).setTargetFlashCapacity(TARGET);

          await expect(
            omniVault.setFlashWithdrawFeeParams(
              arg.newMaxFlashFeeRate,
              arg.newOptimalWithdrawalRate,
              arg.newWithdrawUtilizationKink,
            ),
          )
            .to.emit(omniVault, "WithdrawFeeParamsChanged")
            .withArgs(arg.newMaxFlashFeeRate, arg.newOptimalWithdrawalRate, arg.newWithdrawUtilizationKink);

          expect(await omniVault.maxFlashFeeRate()).to.be.eq(arg.newMaxFlashFeeRate);
          expect(await omniVault.optimalWithdrawalRate()).to.be.eq(arg.newOptimalWithdrawalRate);
          expect(await omniVault.withdrawUtilizationKink()).to.be.eq(arg.newWithdrawUtilizationKink);
          localSnapshot = await takeSnapshot();
        });

        amounts.forEach(function (amount) {
          it(`calculateFlashUnstakeFee for: ${amount.name}`, async function () {
            await localSnapshot.restore();
            if (amount.flashCapacity() > 0n) {
              await omniVault.connect(staker1).deposit(staker1.address, { value: amount.flashCapacity() });
            }
            let flashCapacity = await omniVault.getFlashCapacity();
            console.log(`flash capacity: ${flashCapacity.format()}`);
            let _amount = await amount.amount();
            let withdrawFee = 0n;
            while (_amount > 0n) {
              for (const feeFunc of withdrawFeeSegment) {
                const utilization = (flashCapacity * MAX_PERCENT) / TARGET;
                const fromUtilization = await feeFunc.fromUtilization();
                const toUtilization = await feeFunc.toUtilization();
                if (_amount > 0n && fromUtilization < utilization && utilization <= toUtilization) {
                  console.log(`Utilization:\t\t\t${utilization.format()}`);
                  const fromPercent = await feeFunc.fromPercent();
                  const toPercent = await feeFunc.toPercent();
                  const lowerBound = (fromUtilization * TARGET) / MAX_PERCENT;
                  const replenished = lowerBound > flashCapacity - _amount ? flashCapacity - lowerBound : _amount;
                  const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                  const withdrawFeePercent = fromPercent + (slope * (flashCapacity - replenished / 2n)) / TARGET;
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
            let contractFee = await omniVault.calculateFlashUnstakeFee(await amount.amount());
            console.log(`Expected withdraw fee:\t${withdrawFee.format()}`);
            console.log(`Contract withdraw fee:\t${contractFee.format()}`);
            expect(contractFee).to.be.closeTo(withdrawFee, 1n);
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
      ];
      invalidArgs.forEach(function (arg) {
        it(`setFlashWithdrawFeeParams reverts when ${arg.name}`, async function () {
          await expect(
            omniVault.setFlashWithdrawFeeParams(
              arg.newMaxFlashFeeRate(),
              arg.newOptimalWithdrawalRate(),
              arg.newWithdrawUtilizationKink(),
            ),
          ).to.be.revertedWithCustomError(omniVault, arg.customError);
        });
      });

      it("calculateFlashUnstakeFee reverts when capacity is not sufficient", async function () {
        await snapshot.restore();
        await omniVault.connect(staker1).deposit(staker1.address, { value: randomBI(19) });
        const capacity = await omniVault.getFlashCapacity();
        await expect(omniVault.calculateFlashUnstakeFee(capacity + 1n))
          .to.be.revertedWithCustomError(omniVault, "InsufficientCapacity")
          .withArgs(capacity);
      });

      it("setFlashWithdrawFeeParams reverts when caller is not an owner", async function () {
        await expect(
          omniVault
            .connect(staker1)
            .setFlashWithdrawFeeParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      it("setTreasuryAddress(): only owner can", async function () {
        const newTreasury = ethers.Wallet.createRandom().address;
        await expect(omniVault.setTreasuryAddress(newTreasury))
          .to.emit(omniVault, "TreasuryUpdated")
          .withArgs(newTreasury);
        expect(await omniVault.treasuryAddress()).to.be.eq(newTreasury);
      });

      it("setTreasuryAddress(): reverts when set to zero address", async function () {
        await expect(omniVault.setTreasuryAddress(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });

      it("setTreasuryAddress(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(staker1).setTreasuryAddress(staker1.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setRatioFeed(): only owner can", async function () {
        const ratioFeed = await omniVault.ratioFeed();
        const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
        const newRatioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
        newRatioFeed.address = await newRatioFeed.getAddress();
        await expect(omniVault.setRatioFeed(newRatioFeed.address))
          .to.emit(omniVault, "RatioFeedChanged")
          .withArgs(ratioFeed, newRatioFeed.address);
        expect(await omniVault.ratioFeed()).to.be.eq(newRatioFeed.address);

        const ratio = randomBI(18);
        await newRatioFeed.updateRatioBatch([await iToken.getAddress()], [ratio]);
        expect(await omniVault.ratio()).to.be.eq(ratio);
      });

      it("setRatioFeed(): reverts when new value is zero address", async function () {
        await expect(omniVault.setRatioFeed(ethers.ZeroAddress)).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setRatioFeed(): reverts when caller is not an owner", async function () {
        const newRatioFeed = ethers.Wallet.createRandom().address;
        await expect(omniVault.connect(staker1).setRatioFeed(newRatioFeed)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setOperator(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;
        await expect(omniVault.setOperator(newValue))
          .to.emit(omniVault, "OperatorChanged")
          .withArgs(operator.address, newValue);
        expect(await omniVault.operator()).to.be.eq(newValue);
      });

      it("setOperator(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(staker1).setOperator(staker1.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("ratio() reverts when ratioFeed is 0 address", async function () {
        const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
        const omniVault = await upgrades.deployProxy(
          omniVaultFactory,
          ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
          { initializer: "__InceptionOmniVault_init" },
        );
        omniVault.address = await omniVault.getAddress();
        await iToken.setVault(omniVault.address);
        await expect(omniVault.ratio()).revertedWithCustomError(omniVault, "RatioFeedNotSet");
      });

      it("setCrossChainAdapter(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;
        await expect(omniVault.setCrossChainAdapter(newValue))
          .to.emit(omniVault, "CrossChainAdapterChanged")
          .withArgs(newValue);
        expect(await omniVault.crossChainAdapter()).to.be.eq(newValue);
      });

      it("setCrossChainAdapter(): reverts when set to zero address", async function () {
        await expect(omniVault.setCrossChainAdapter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });

      it("setCrossChainAdapter(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(staker1).setCrossChainAdapter(staker1.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setMinAmount(): only owner can", async function () {
        const prevValue = await omniVault.minAmount();
        const newMinAmount = randomBI(4);
        await expect(omniVault.setMinAmount(newMinAmount))
          .to.emit(omniVault, "MinAmountChanged")
          .withArgs(prevValue, newMinAmount);
        expect(await omniVault.minAmount()).to.be.eq(newMinAmount);
        await expect(omniVault.connect(staker1).deposit(staker1.address, { value: newMinAmount - 1n }))
          .to.be.revertedWithCustomError(omniVault, "LowerMinAmount")
          .withArgs(newMinAmount);
      });

      it("setMinAmount(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(staker1).setMinAmount(randomBI(3))).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setTargetFlashCapacity(): only owner can", async function () {
        const prevValue = await omniVault.targetCapacity();
        const newValue = randomBI(18);
        await expect(omniVault.setTargetFlashCapacity(newValue))
          .to.emit(omniVault, "TargetCapacityChanged")
          .withArgs(prevValue, newValue);
        expect(await omniVault.targetCapacity()).to.be.eq(newValue);
      });

      it("setTargetFlashCapacity(): reverts when called by not an owner", async function () {
        const newValue = randomBI(18);
        await expect(omniVault.connect(staker1).setTargetFlashCapacity(newValue)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setTargetFlashCapacity(): reverts when sets to 0", async function () {
        await expect(omniVault.setTargetFlashCapacity(0n)).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setProtocolFee(): sets share of flashWithdrawFee that goes to treasury", async function () {
        const prevValue = await omniVault.protocolFee();
        const newValue = randomBI(10);
        await expect(omniVault.setProtocolFee(newValue))
          .to.emit(omniVault, "ProtocolFeeChanged")
          .withArgs(prevValue, newValue);
        expect(await omniVault.protocolFee()).to.be.eq(newValue);
      });

      it("setProtocolFee(): reverts when > MAX_PERCENT", async function () {
        const newValue = (await omniVault.MAX_PERCENT()) + 1n;
        await expect(omniVault.setProtocolFee(newValue))
          .to.be.revertedWithCustomError(omniVault, "ParameterExceedsLimits")
          .withArgs(newValue);
      });

      it("setProtocolFee(): reverts when caller is not an owner", async function () {
        const newValue = randomBI(10);
        await expect(omniVault.connect(staker1).setProtocolFee(newValue)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setName(): only owner can", async function () {
        const prevValue = await omniVault.name();
        const newValue = "New name";
        await expect(omniVault.setName(newValue)).to.emit(omniVault, "NameChanged").withArgs(prevValue, newValue);
        expect(await omniVault.name()).to.be.eq(newValue);
      });

      it("setName(): reverts when new name is blank", async function () {
        await expect(omniVault.setName("")).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setName(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(staker1).setName("New name")).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("pause(): only owner can", async function () {
        expect(await omniVault.paused()).is.false;
        await expect(omniVault.pause()).to.emit(omniVault, "Paused").withArgs(owner.address);
        expect(await omniVault.paused()).is.true;
      });

      it("pause(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(staker1).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("pause(): reverts when already paused", async function () {
        await omniVault.pause();
        await expect(omniVault.pause()).to.be.revertedWith("Pausable: paused");
      });

      it("unpause(): only owner can", async function () {
        await omniVault.pause();
        expect(await omniVault.paused()).is.true;

        await expect(omniVault.unpause()).to.emit(omniVault, "Unpaused").withArgs(owner.address);
        expect(await omniVault.paused()).is.false;
      });

      it("unpause(): reverts when called by not an owner", async function () {
        await omniVault.pause();
        expect(await omniVault.paused()).is.true;
        await expect(omniVault.connect(staker1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Bridge", function () {
      describe("Send info", function () {
        let TARGET = 10n ** 12n;

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        it("Adapter is set", async function () {
          expect(await omniVault.crossChainAdapter()).to.be.eq(adapter.address);
        });

        const args = [
          {
            name: "When there are no eth and shares",
            depositAmount: () => 0n,
            msgSender: () => operator,
          },
          {
            name: "After deposit",
            depositAmount: () => randomBI(11),
            msgSender: () => operator,
          },
          {
            name: "After deposit when deposit bonus > 0",
            depositAmount: () => randomBI(11),
            depositBonus: true,
            msgSender: () => operator,
          },
          {
            name: "When there are shares, but eth was sent to L1",
            depositAmount: () => TARGET + randomBI(11),
            depositBonus: true,
            sentToL1: amount => amount - TARGET,
            msgSender: () => operator,
          },
          {
            name: "Owner can call",
            depositAmount: () => TARGET + randomBI(11),
            depositBonus: true,
            sentToL1: amount => amount - TARGET,
            msgSender: () => owner,
          },
        ];
        args.forEach(function (arg) {
          it(`sendAssetsInfoToL1 ${arg.name}`, async function () {
            const msgSender = arg.msgSender();

            let amount = arg.depositAmount();
            if (amount > 0n) {
              await omniVault.connect(staker1).deposit(staker1, { value: amount });
            }

            let depositBonus = 0n;
            if (arg.depositBonus) {
              let collectedBonus = await addReplenishBonus(TARGET);
              expect(await omniVault.depositBonusAmount()).to.be.closeTo(collectedBonus, 1n);
              depositBonus = await omniVault.depositBonusAmount();
            }

            let sentToL1Amount = 0n;
            if (arg.sentToL1) {
              sentToL1Amount = arg.sentToL1(amount);
              const feeParams = adapterInfo.feesFunc();
              const fees = 3n * 10n ** 16n;
              await expect(omniVault.connect(msgSender).sendEthToL1(feeParams, { value: fees }))
                .to.emit(omniVault, "EthToL1Sent")
                .withArgs(sentToL1Amount + fees);
            }

            const freeBalance = await omniVault.getFreeBalance();
            const vaultBalance = await ethers.provider.getBalance(omniVault.address);
            const totalSupply = await iToken.totalSupply();
            const expectedVaultBalance = amount + depositBonus - sentToL1Amount;
            console.log("Deposited amt:\t\t", amount.format());
            console.log("Vault balance:\t\t", vaultBalance.format());
            console.log("Free balance:\t\t", freeBalance.format());
            console.log("Deposit bonus:\t\t", depositBonus.format());
            console.log("Actual sent:\t\t", sentToL1Amount.format());
            console.log("Total deposited:\t\t", (await omniVault.getTotalDeposited()).format());

            expect(vaultBalance).to.be.eq(expectedVaultBalance);

            const feeParams = adapterInfo.feesFunc();
            await expect(omniVault.connect(msgSender).sendAssetsInfoToL1(feeParams))
              .to.emit(omniVault, "MessageToL1Sent")
              .withArgs(totalSupply, amount - sentToL1Amount);
          });
        });

        it("Reverts when called by not an operator", async function () {
          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(staker1).sendAssetsInfoToL1(feeParams)).revertedWithCustomError(
            omniVault,
            "OnlyOwnerOrOperator",
          );
        });

        it("Reverts when crosschain adapter is 0 address", async function () {
          const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
          const omniVault = await upgrades.deployProxy(
            omniVaultFactory,
            ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
            { initializer: "__InceptionOmniVault_init" },
          );
          omniVault.address = await omniVault.getAddress();
          await omniVault.setRatioFeed(ratioFeed.address);
          await iToken.setVault(omniVault.address);

          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(operator).sendAssetsInfoToL1(feeParams)).revertedWithCustomError(
            omniVault,
            "CrossChainAdapterNotSet",
          );
        });
      });

      describe("Send eth", function () {
        let TARGET = toWei(10);

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        const args = [
          {
            name: "with extra value",
            value: 3n * 10n ** 16n,
          },
          {
            name: "without extra value",
            value: 0n,
          },
        ];
        args.forEach(function (arg) {
          it(`sendEthToL1 ${arg.name}`, async function () {
            const freeBalance = randomBI(18);
            const amount = TARGET + freeBalance;
            await omniVault.connect(staker1).deposit(staker1, { value: amount });

            const feeParams = adapterInfo.feesFunc();
            await expect(omniVault.connect(operator).sendEthToL1(feeParams, { value: arg.value }))
              .to.emit(omniVault, "EthToL1Sent")
              .withArgs(freeBalance + arg.value);
          });
        });

        it("Reverts when there is no free balance", async function () {
          await omniVault.connect(staker1).deposit(staker1, { value: TARGET - 1n });

          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(operator).sendEthToL1(feeParams, { value: 0n })).to.revertedWithCustomError(
            omniVault,
            "FreeBalanceIsZero",
          );
        });

        it("Reverts when called by not an operator", async function () {
          await omniVault.connect(staker1).deposit(staker1, { value: TARGET * 2n });
          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(staker1).sendEthToL1(feeParams, { value: 0n })).revertedWithCustomError(
            omniVault,
            "OnlyOwnerOrOperator",
          );
        });
      });
    });

    describe("Adapter", function () {
      describe("Getters and setters", function () {
        beforeEach(async function () {
          await snapshot.restore();
        });

        const setters = [
          {
            name: "operator address",
            setter: "setOperator",
            getter: "operator",
            event: "OperatorChanged",
          },
          {
            name: "l1 target address",
            setter: "setL1Target",
            getter: "l1Target",
            event: "L1TargetChanged",
          },
          {
            name: "vault address",
            setter: "setVault",
            getter: "vault",
            event: "VaultChanged",
          },
          {
            name: "arbsys",
            setter: "setArbSys",
            getter: "arbsys",
            event: "ArbSysChanged",
          },
        ];

        setters.forEach(function (arg) {
          it(`Set new ${arg.name}`, async function () {
            const prevValue = await adapter[arg.getter]();
            const newValue = ethers.Wallet.createRandom().address;
            await expect(adapter[arg.setter](newValue)).to.emit(adapter, arg.event).withArgs(prevValue, newValue);

            expect(await adapter[arg.getter]()).to.be.eq(newValue);
          });

          it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
            const newValue = ethers.Wallet.createRandom().address;
            await expect(adapter.connect(staker1)[arg.setter](newValue)).to.be.revertedWith(
              "Ownable: caller is not the owner",
            );
          });

          it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
            const newValue = ethers.ZeroAddress;
            await expect(adapter[arg.setter](newValue)).to.be.revertedWithCustomError(adapter, "SettingZeroAddress");
          });
        });

        it("Owner", async function () {
          expect(await adapter.owner()).to.be.eq(owner.address);
        });
      });

      describe("Send permissions", function () {
        it("sendAssetsInfoToL1 reverts when called by not vault", async function () {
          const tokensAmount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
            adapter.connect(staker1).sendAssetsInfoToL1(tokensAmount, ethAmount, []),
          ).to.be.revertedWithCustomError(adapter, "OnlyVault");
        });

        it("sendAssetsInfoToL1 reverts when l1 target is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: ethers.ZeroAddress,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          const amount = randomBI(18);
          await staker1.sendTransaction({ to: adapter.address, value: amount });
          await adapter.setVault(staker1.address);

          const tokensAmount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
            adapter.connect(staker1).sendAssetsInfoToL1(tokensAmount, ethAmount, []),
          ).to.be.revertedWithCustomError(adapter, "L1TargetNotSet");
        });

        it("sendEthToL1 reverts when called by not vault", async function () {
          const amount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
            adapter.connect(staker1).sendEthToL1(amount, [], { value: ethAmount }),
          ).to.be.revertedWithCustomError(adapter, "OnlyVault");
        });

        it("sendEthToL1 reverts when l1 target is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: ethers.ZeroAddress,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          await adapter.setVault(staker1.address);

          const amount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
            adapter.connect(staker1).sendEthToL1(amount, [], { value: ethAmount }),
          ).to.be.revertedWithCustomError(adapter, "L1TargetNotSet");
        });
      });

      describe("Recover funds", function () {
        beforeEach(async function () {
          await snapshot.restore();
        });

        it("recoverFunds sends eth back to vault", async function () {
          const amount = randomBI(18);
          await staker1.sendTransaction({ to: adapter.address, value: amount });

          const tx = await adapter.connect(operator).recoverFunds();
          await expect(tx).changeEtherBalance(adapter.address, -amount);
          await expect(tx).changeEtherBalance(omniVault.address, amount);
          await expect(tx).emit(adapter, "RecoverFundsInitiated").withArgs(amount);
        });

        it("recoverFunds reverts when called by not an operator", async function () {
          const amount = randomBI(18);
          await staker1.sendTransaction({ to: adapter.address, value: amount });

          await expect(adapter.connect(staker1).recoverFunds())
            .to.be.revertedWithCustomError(adapter, "OnlyOperatorCanCall")
            .withArgs(staker1.address);
        });

        it("Cannot recover when vault is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: targetL1.address,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          const amount = randomBI(18);
          await staker1.sendTransaction({ to: adapter.address, value: amount });

          await expect(adapter.connect(operator).recoverFunds()).to.be.revertedWithCustomError(adapter, "VaultNotSet");
        });
      });
    });
  });
});
