const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, network } = require("hardhat");
const { expect } = require("chai");
const hre = require("hardhat");
const { max } = require("hardhat/internal/util/bigint");
const { advanceBlocks } = require("../scripts/utils");
const toBN = ethers.BigNumber.from;
const abi = ethers.utils.defaultAbiCoder;
const NetworkSnapshotter = require("./helpers/utils");

const stakerAddress = "",
  staker2Address = "0xCf682451E33c206efF5E95B5df80c935d1F094C6",
  staker3Address = "0xbaF50525B394AbB75Fd92750ec2D645F3014401C",
  operatorAddress = "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
  zeroAddress = "0x0000000000000000000000000000000000000000",
  rETHAddress = "0x178E141a0E3b34152f73Ff610437A7bf9B83267A",
  rocketPoolAddress = "0xa9a6a14a3643690d0286574976f45abbdad8f505",
  stETHAddress = "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F",
  lidoPoolAddress = "";

// EigenLayer address
const strategyManagerAddress = "0x779d1b5315df083e3F9E94cB495983500bA8E907",
  rEthStrategyAddress = "0x879944A8cB437a5f8061361f82A6d4EED59070b5";

const e18 = toBN("1000000000000000000");

const initVault = async () => {
  console.log(`... Initialization of Inception ....`);
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting block number: ${block.number}`);
  // rETH
  const assetFactory = await hre.ethers.getContractFactory("rETH");
  const asset = assetFactory.attach(rETHAddress);
  // rPool
  const assetPoolFactory = await hre.ethers.getContractFactory("RocketMockPool");
  const assetPool = assetPoolFactory.attach(rocketPoolAddress);

  // 1. Inception token
  const iTokenFactory = await hre.ethers.getContractFactory("InceptionToken");
  const iToken = await iTokenFactory.deploy();
  await iToken.initialize("EigenETH^2", "EigenETH^2");
  // 2. Impersonate operator
  const operator = await impersonateAccount(operatorAddress, toWei(1));
  // 3. Inception vault
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InrEthVault");
  const iVault = await InceptionVaultFactory.deploy();
  await iVault.initialize(operator.address, strategyManagerAddress, iToken.address, rEthStrategyAddress);

  await iToken.setVault(iVault.address);
  console.log(`... iVault initialization completed ....`);
  snapshotter = new NetworkSnapshotter();
  await snapshotter.snapshot();
  return [iToken, iVault, asset, assetPool, operator];
};

async function impersonateAccount(address, balance) {
  await helpers.impersonateAccount(address);
  const account = await ethers.getSigner(address);
  // Adjust staker ETH balance
  const [treasury] = await ethers.getSigners();
  await treasury.sendTransaction({
    to: address,
    value: balance,
  });
  console.log(`Account impersonated at address: ${account.address}`);
  console.log(`Account balance Eth: ${(await ethers.provider.getBalance(account.address)).toString()}`);

  return account;
}

async function impersonateStaker(address, iVault, asset, assetPool) {
  const staker = await impersonateAccount(address, toWei(22));
  await assetPool.connect(staker).deposit({ value: toWei(20) });
  const balanceAfter = await asset.balanceOf(staker.address);
  await asset.connect(staker).approve(iVault.address, balanceAfter.toString());

  return staker;
}

describe("Inception pool V3 rEth", function () {
  let iToken, iVault, asset, assetPool, operator, staker, staker2;
  this.timeout(150000);

  before(async function () {
    [iToken, iVault, asset, assetPool, operator] = await initVault();
  });

  //----Setters
  describe("Base flow", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);
      ratio = await iVault.ratio();
    });

    it("Initial ratio is 1", async function () {
      const r = await iVault.ratio();
      console.log(`Current ratio is: ${r.toString()}`);
      expect(r).to.be.eq(e18);
    });

    it("Deposit", async function () {
      const amount = toBN("9292557565124725653");
      const expectedShares = amount.mul(e18).div(await iVault.ratio());
      const tx = await iVault.connect(staker).deposit(amount, staker.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "Deposit";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.closeTo(amount, 1);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, 2);

      expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, 2);
      expect(await iVault.ratio()).to.be.eq(ratio);
    });

    it("Update asset ratio", async function () {
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker);
      console.log(`New ratio is: ${await iVault.ratio()}`);
    });

    it("Withdraw all", async function () {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "Withdraw";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.closeTo(assetValue.mul(e18).div(await iVault.ratio()), 2);
      expect(events[0].args["iShares"]).to.be.eq(shares);

      expect(await iToken.balanceOf(staker.address)).to.be.eq(toBN(0));
      expect(await iVault.ratio()).to.be.eq(e18); //Ratio becomes 1 once again if everything was taken out
    });

    it("Withdraw from EL", async function () {
      console.log(`iVault balance before: ${await iVault.totalAssets()}`);
      await withdrawFromEL(iVault, operator);
      const pendingWithdrawal = (await iVault.getPendingWithdrawalOf(staker2.address))[0];
      console.log(`Pending withdrawals: ${pendingWithdrawal}`);
      console.log(`iVault balance after: ${await iVault.totalAssets()}`);
      console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
      expect(await iVault.totalAssets()).to.be.gt(pendingWithdrawal);
      expect(await iVault.ratio()).to.be.eq(ratio);
    });

    it("Redeem withdraw", async function () {
      const pendingWithdrawal = await iVault.getPendingWithdrawalOf(staker2.address);

      const balanceBefore = await asset.balanceOf(staker2.address);
      const tx = await iVault.connect(operator).redeem(staker2.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "Redeem";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(operator.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["amount"]).to.be.eq(pendingWithdrawal[0]);

      const balanceAfter = await asset.balanceOf(staker2.address);
      expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(pendingWithdrawal[0], 1);
      expect((await iVault.getPendingWithdrawalOf(staker2.address))[0]).to.be.eq(toBN(0));
      expect(await iVault.getTotalDeposited()).to.be.closeTo(0, 3);
      expect(await iVault.ratio()).to.be.eq(e18); //Ratio becomes 1 once again if everything was taken out
    });
  });

  describe("Setters", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateAccount(staker2Address, toWei(1));
      ratio = await iVault.ratio();
      console.log(`Ratio ${ratio.toString()}`);
    });

    it(`setOperator(): only owner can`, async function () {
      await iVault.setOperator(staker2Address);

      const amount = toWei(2);
      await iVault.connect(staker).deposit(amount, staker.address);
      const shares = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(shares.div(2), staker.address);
      await iVault.connect(staker2).withdrawFromEL();
    });

    it(`setOperator(): another address can not`, async function () {
      await expect(iVault.connect(staker).setOperator(staker2Address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it(`setMinAmount(): only owner can`, async function () {
      const newMinAmount = randomBN(3);
      await iVault.setMinAmount(newMinAmount);
      expect(await iVault.minAmount()).to.be.eq(newMinAmount);
    });

    it(`setMinAmount(): another address can not`, async function () {
      await expect(iVault.connect(staker).setMinAmount(randomBN(3))).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it(`setDepositFee(): only owner can`, async function () {
      const newDepositFee = randomBN(3);
      await iVault.setDepositFee(newDepositFee);
      expect(await iVault.depositFee()).to.be.eq(newDepositFee);
    });

    it(`setDepositFee(): another address can not`, async function () {
      await expect(iVault.connect(staker).setDepositFee(randomBN(3))).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("deposit: user can restake asset", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
      ratio = await iVault.ratio();
    });

    const testData = [
      {
        amount: async () => "4798072939323319141",
        receiver: () => staker.address,
      },
      {
        amount: async () => "999999999999999999",
        receiver: () => staker.address,
      },
      {
        amount: async () => "888888888888888888",
        receiver: () => staker.address,
      },
      {
        amount: async () => "777777777777777777",
        receiver: () => staker.address,
      },
      {
        amount: async () => "666666666666666666",
        receiver: () => staker.address,
      },
      {
        amount: async () => "555555555555555555",
        receiver: () => staker.address,
      },
      {
        amount: async () => "444444444444444444",
        receiver: () => staker.address,
      },
      {
        amount: async () => "333333333333333333",
        receiver: () => staker.address,
      },
      {
        amount: async () => "222222222222222222",
        receiver: () => staker.address,
      },
      {
        amount: async () => "111111111111111111",
        receiver: () => staker.address,
      },
      {
        amount: async () => (await iVault.convertToAssets(await iVault.minAmount())).add(1).toString(),
        receiver: () => staker.address,
      },
    ];

    testData.forEach(function (test) {
      it(`Deposit amount ${test.amount}`, async function () {
        const receiver = test.receiver();
        const balanceBefore = await iToken.balanceOf(receiver);
        const totalDepositedBefore = await iVault.getTotalDeposited();

        const amount = toBN(await test.amount());
        const convertedShares = await iVault.convertToShares(amount);
        const expectedShares = amount.mul(e18).div(await iVault.ratio());

        const tx = await iVault.connect(staker).deposit(amount, receiver);
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "Deposit";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(amount, 1);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, 10);

        const balanceAfter = await iToken.balanceOf(receiver);
        const totalDepositedAfter = await iVault.getTotalDeposited();

        expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(expectedShares, 2);
        expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(convertedShares, 2);

        expect(totalDepositedAfter.sub(totalDepositedBefore)).to.be.closeTo(amount, 2); //All assets go to EL
        expect(await iVault.totalAssets()).to.be.eq(0); //Nothing on iVault
        expect(await iVault.ratio()).to.be.closeTo(ratio, 2); //Ratio stays the same
      });
    });

    const invalidData = [
      {
        name: "shares amount is 0",
        amount: toBN(1),
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: deposited less than min amount",
      },
      {
        name: "deposit amount is 0",
        amount: toBN(0),
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: deposited less than min amount",
      },
      {
        name: "deposit to zero address",
        amount: randomBN(18),
        isCustom: true,
        receiver: () => zeroAddress,
        error: "NullParams",
      },
    ];

    invalidData.forEach(function (test) {
      it(`Deposit reverts when: ${test.name}`, async function () {
        const amount = test.amount;
        const receiver = test.receiver();
        if (test.isCustom) {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWithCustomError(iVault, test.error);
        } else {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWith(test.error);
        }
      });

      it(`Convert to shares: ${test.name}`, async function () {
        expect(await iVault.connect(staker).convertToShares(test.amount)).to.be.eq(test.amount.mul(e18).div(await iVault.ratio()), 1);
      });
    });

    it("Deposit random amounts many times", async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      ratio = await iVault.ratio();

      let totalDeposited = toBN(0);
      const count = 50;
      for (let i = 0; i < count; i++) {
        const amount = randomBN(17);
        const tx = await iVault.connect(staker).deposit(amount, staker.address);
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "Deposit";
        });
        console.log(`Ratio after depositing:\t${await iVault.ratio()}`);

        totalDeposited = totalDeposited.add(toBN(events[0].args["amount"]));
      }
      console.log(`Total deposited:\t${format(totalDeposited)}`);
      console.log(`Ratio:\t\t\t\t${format(await iVault.ratio())}`);

      const totalExpectedShares = totalDeposited.mul(e18).div(await iVault.ratio());
      const err = totalDeposited.mul(count * 2).div(await iVault.ratio());
      expect((await iToken.balanceOf(staker.address)).sub(totalExpectedShares)).to.be.closeTo(0, err);

      expect(await iVault.totalAssets()).to.be.eq(0);
      expect(await iVault.ratio()).to.be.closeTo(ratio, count);
    });

    it("Deposit small amount many times", async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);

      const amount = toBN(await iVault.minAmount()).add(1);
      for (let i = 0; i < 100; i++) {
        await iVault.connect(staker).deposit(amount, staker.address);
      }
      console.log(`Ratio after deposit 10wei 100times:\t${await iVault.ratio()}`);

      await iVault.connect(staker).deposit(e18, staker.address);
      console.log(`Ratio after deposit 1eth:\t${await iVault.ratio()}`);
      expect(await iVault.ratio()).to.be.eq(e18);
    });
  });

  describe("withdraw: user can unstake", function () {
    let ratio, totalDeposited;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);

      await iVault.connect(staker).deposit(toWei(10), staker.address);
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
      totalDeposited = await iVault.getTotalDeposited();
      ratio = await iVault.ratio();
    });

    const testData = [
      {
        name: "random e18",
        amount: async (shares) => "724399519262012598",
        receiver: () => staker.address,
      },
      {
        name: "999999999999999999",
        amount: async (shares) => "999999999999999999",
        receiver: () => staker2.address,
      },
      {
        name: "888888888888888888",
        amount: async (shares) => "888888888888888888",
        receiver: () => staker2.address,
      },
      {
        name: "777777777777777777",
        amount: async (shares) => "777777777777777777",
        receiver: () => staker2.address,
      },
      {
        name: "666666666666666666",
        amount: async (shares) => "666666666666666666",
        receiver: () => staker2.address,
      },
      {
        name: "555555555555555555",
        amount: async (shares) => "555555555555555555",
        receiver: () => staker2.address,
      },
      {
        name: "444444444444444444",
        amount: async (shares) => "444444444444444444",
        receiver: () => staker2.address,
      },
      {
        name: "333333333333333333",
        amount: async (shares) => "333333333333333333",
        receiver: () => staker2.address,
      },
      {
        name: "222222222222222222",
        amount: async (shares) => "222222222222222222",
        receiver: () => staker2.address,
      },
      {
        name: "111111111111111111",
        amount: async (shares) => "111111111111111111",
        receiver: () => staker2.address,
      },
      // {
      //   name: "min amount",
      //   amount: async (shares) => (await iVault.getAssetETHValue(await iVault.minAmount())).add(1).toString(),
      //   receiver: () => staker2.address,
      // },
      {
        name: "all",
        amount: async (shares) => shares.toString(),
        receiver: () => staker2.address,
      },
    ];

    testData.forEach(function (test) {
      it(`Withdraw ${test.name}`, async function () {
        const balanceBefore = await iToken.balanceOf(staker.address);
        const shares = toBN(await test.amount(balanceBefore));
        console.log(` ========== SHARES: ${shares.toString()} ========== `);
        const assetValue = await iVault.convertToAssets(shares);
        const pendingWithdrawalBefore = await iVault.getPendingWithdrawalOf(test.receiver());

        const tx = await iVault.connect(staker).withdraw(shares, test.receiver());
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "Withdraw";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(test.receiver());
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(assetValue, 2);
        expect(events[0].args["iShares"]).to.be.eq(shares);

        expect(balanceBefore.sub(await iToken.balanceOf(staker.address))).to.be.eq(shares);
        expect((await iVault.getPendingWithdrawalOf(test.receiver()))[0].sub(pendingWithdrawalBefore[0])).to.be.closeTo(assetValue, 3);
        expect(await iVault.totalAssets()).to.be.eq(0);

        //If did withdraw all ratio = 1
        if ((await iToken.totalSupply()).eq(toBN(0))) {
          expect(await iVault.ratio()).to.eq(e18);
        } else {
          expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
        }

        console.log(`getTotalDeposited: ${await iVault.getTotalDeposited()}`);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, 2);
      });
    });
  });

  describe("withdraw: invalid amounts", function () {
    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateAccount(staker2Address, toWei(1));
      ratio = await iVault.ratio();
      const amount = toWei(10);
      await iVault.connect(staker).deposit(amount, staker.address);
    });

    const invalidData = [
      {
        name: "Withdraw < min amount",
        amount: async () => (await iVault.minAmount()).sub(1),
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: amount is less than the minimum withdrawal",
      },
      {
        name: "Withdraw 0",
        amount: async () => toBN(0),
        receiver: () => staker.address,
        isCustom: true,
        error: "NullParams",
      },
      {
        name: "Withdraw in favor of zero address",
        amount: async () => randomBN(18),
        receiver: () => zeroAddress,
        isCustom: true,
        error: "NullParams",
      },
    ];

    invalidData.forEach(function (test) {
      it(`Reverts: ${test.name}`, async function () {
        const amount = await test.amount();
        const receiver = test.receiver();
        if (test.isCustom) {
          await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWithCustomError(iVault, test.error);
        } else {
          await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWith(test.error);
        }
      });
    });

    it("Withdraw small amount many times", async function () {
      const ratioBefore = await iVault.ratio();
      for (let i = 0; i < 100; i++) {
        await iVault.connect(staker).withdraw("100", staker.address);
      }
      console.log(`Ratio after withdraw 10wei 100times:\t${await iVault.ratio()}`);
      expect(await iVault.ratio()).to.be.closeTo(ratioBefore, 10);

      await iVault.connect(staker).withdraw(e18, staker.address);
      console.log(`Ratio after withdraw 1eth:\t${await iVault.ratio()}`);
      expect(await iVault.ratio()).to.be.closeTo(ratioBefore, 10);
    });
  });

  describe("withdrawFromEL: operator can request assets back from EL", function () {
    let ratio, ratioDiff, depositedAmount, withdrawal1Amount, withdrawal2Amount, withdrawalData, withdrawalAssets, shares1, shares2;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);

      //Deposit and withdraw
      depositedAmount = randomBN(19);
      console.log(`Deposit amount: ${depositedAmount}`);
      await iVault.connect(staker).deposit(depositedAmount, staker.address);

      ratio = await iVault.ratio();
      console.log(`Ratio ${ratio.toString()}`);
    });

    it("Operator can withdrawFromEL", async function () {
      shares1 = toBN("460176234800292249");
      withdrawal1Amount = await iVault.convertToAssets(shares1);
      console.log(`--- Staker going to withdraw: ${shares1}/${withdrawal1Amount}`);
      await iVault.connect(staker).withdraw(shares1, staker.address);
      console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

      const tx = await iVault.connect(operator).withdrawFromEL();
      const receipt = await tx.wait();
      const startWithdrawal = receipt.events?.filter((e) => {
        return e.event === "StartWithdrawal";
      });
      expect(startWithdrawal.length).to.be.eq(1);

      const withdrawalQueued = receipt.events?.filter((e) => {
        return e.event === "WithdrawalQueued";
      });
      expect(withdrawalQueued.length).to.be.eq(1);
      expect(await iVault.totalAssets()).to.be.eq(0);
      expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
      console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
      expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.closeTo(shares1, 2);

      const WithdrawalQueuedEvent = receipt.events[2].args;
      withdrawalData = [
        WithdrawalQueuedEvent["strategies"],
        WithdrawalQueuedEvent["shares"],
        iVault.address,
        [iVault.address, WithdrawalQueuedEvent["nonce"]],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        WithdrawalQueuedEvent["delegatedAddress"],
      ];
      withdrawalAssets = [];
      const StrategyBaseFactory = await hre.ethers.getContractFactory("StrategyBaseDummy");
      for (const strategyAddress of WithdrawalQueuedEvent["strategies"]) {
        const strategy = StrategyBaseFactory.attach(strategyAddress);
        const assetAddress = await strategy.underlyingToken();
        withdrawalAssets.push(assetAddress);
      }
    });

    it("Reverts: when pending withdrawals already covered", async function () {
      await expect(iVault.connect(operator).withdrawFromEL()).revertedWithCustomError(iVault, "WithdrawFutile");
    });

    it("Operator can withdrawFromEL more when there are uncovered pending withdrawals", async function () {
      shares2 = toBN("460176234800292249");
      withdrawal2Amount = await iVault.convertToAssets(shares2);
      console.log(`--- Staker going to withdraw: ${shares2}/${withdrawal2Amount}`);
      await iVault.connect(staker).withdraw(shares2, staker.address);
      console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

      //Change asset ratio
      const ratioBefore = await iVault.ratio();
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
      ratio = await iVault.ratio();
      ratioDiff = ratioBefore.sub(ratio);

      const tx = await iVault.connect(operator).withdrawFromEL();
      console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
      console.log(`#############RATIO: ${(await iVault.ratio()).toString()}`);
      const receipt = await tx.wait();
      const startWithdrawal = receipt.events?.filter((e) => {
        return e.event === "StartWithdrawal";
      });
      expect(startWithdrawal.length).to.be.eq(1);

      const withdrawalQueued = receipt.events?.filter((e) => {
        return e.event === "WithdrawalQueued";
      });
      expect(withdrawalQueued.length).to.be.eq(1);
      expect(await iVault.totalAssets()).to.be.eq(0);
      expect(await iVault.ratio()).to.be.closeTo(ratio, 4);

      const WithdrawalQueuedEvent = receipt.events[2].args;
      const withdrawalData = [
        WithdrawalQueuedEvent["strategies"],
        WithdrawalQueuedEvent["shares"],
        iVault.address,
        [iVault.address, WithdrawalQueuedEvent["nonce"]],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        WithdrawalQueuedEvent["delegatedAddress"],
      ];
      const withdrawalAssets = [];
      const StrategyBaseFactory = await hre.ethers.getContractFactory("StrategyBaseDummy");
      for (const strategyAddress of WithdrawalQueuedEvent["strategies"]) {
        const strategy = StrategyBaseFactory.attach(strategyAddress);
        const assetAddress = await strategy.underlyingToken();
        withdrawalAssets.push(assetAddress);
      }
      expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.closeTo(shares1.add(shares2), 2);

      //Claim from EL
      await mineBlocks("15");
      await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets);
      console.log(`#############Claim the 2nd withdrawal`);
      console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).toString()}`);
      console.log(`iVault assets:\t\t\t\t${await iVault.totalAssets()}`);
      console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
      console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
      expect((await iVault.totalAssets()).sub(withdrawal2Amount)).to.be.closeTo(0, 2);
      expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.closeTo(shares1, 2);
    });

    it("Reverts: not an operator", async function () {
      await expect(iVault.connect(staker).withdrawFromEL()).to.be.revertedWith("InceptionVault: only operator allowed");
    });

    it("Claim missed withdrawal from EL", async function () {
      await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets);
      console.log(`#############Claim the 1st withdrawal`);
      console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).toString()}`);
      console.log(`iVault assets:\t\t\t\t${await iVault.totalAssets()}`);
      console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
      console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);

      await iVault.connect(operator).depositExta();
      const claimedFromEL = await iVault.totalAssets();
      const pendingWithdrawals = (await iVault.getPendingWithdrawalOf(staker.address))[0];
      expect(claimedFromEL.sub(pendingWithdrawals)).to.be.closeTo(0, 10);
      expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.closeTo(toBN(0), 2);
    });

    it("Staker is able to redeem", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
    });

    it("Staker redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
      console.log(`#############Redeem`);
      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${stakerBalanceAfter}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
      const stakerUnstakeAmountAssetValue = withdrawal1Amount.add(withdrawal2Amount);
      expect(stakerPendingWithdrawalsBefore[0].sub(stakerPendingWithdrawalsAfter[0])).to.be.closeTo(stakerUnstakeAmountAssetValue, 5);
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(stakerUnstakeAmountAssetValue, 5);
      console.log(`Ratio: ${await iVault.ratio()}`);
      console.log(`Total asset: ${await iVault.totalAssets()}`);
    });
  });

  describe("withdrawFromEL and redeem in a loop", function () {
    let ratio,
      stakers,
      withdrawals = new Map();

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);
      stakers = [staker, staker2];
      //Deposit
      for (const s of stakers) {
        await iVault.connect(s).deposit(randomBN(19), s.address);
      }

      ratio = await iVault.ratio();
      console.log(`Ratio ${ratio.toString()}`);
    });

    const count = 10;
    for (let i = 0; i < count; i++) {
      it(`${i}. Iteration`, async function () {
        withdrawals.set(staker.address, toBN(0));
        withdrawals.set(staker2.address, toBN(0));

        //Withdraw staker1 only
        let shares = randomBN(16);
        await iVault.connect(staker).withdraw(shares, staker.address);
        let w = withdrawals.get(staker.address);
        withdrawals.set(staker.address, w.add(shares));

        //Withdraw EL
        let tx = await iVault.connect(operator).withdrawFromEL();
        const w1data = await withdrawDataFromTx(tx, iVault);

        //Withdraw staker and staker2
        for (const s of stakers) {
          const shares = randomBN(16);
          await iVault.connect(s).withdraw(shares, s.address);
          const w = withdrawals.get(s.address);
          withdrawals.set(s.address, w.add(shares));
        }

        //Withdraw EL
        tx = await iVault.connect(operator).withdrawFromEL();
        const w2data = await withdrawDataFromTx(tx, iVault);

        await mineBlocks("15");
        //ClaimEL w1
        await iVault.connect(staker).claimCompletedWithdrawals(w1data[0], w1data[1]);
        //ClaimEL w2
        await iVault.connect(staker).claimCompletedWithdrawals(w2data[0], w2data[1]);

        const pwStaker1 = (await iVault.getPendingWithdrawalOf(staker.address))[0];
        const pwStaker2 = (await iVault.getPendingWithdrawalOf(staker2.address))[0];
        console.log(`Pending withdrawal staker1:\t${pwStaker1}`);
        console.log(`Pending withdrawal staker2:\t${pwStaker2}`);
        console.log(`Pending withdrawal sum:\t\t${pwStaker1.add(pwStaker2)}`);
        console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
        console.log(`iToken balance staker1:\t${await iToken.balanceOf(staker.address)}`);
        console.log(`iToken balance staker2:\t${await iToken.balanceOf(staker2.address)}`);

        //Staker1 redeems
        console.log(`### Staker1 redeems`);
        await iVault.redeem(staker.address);
        console.log(`Pending withdrawal staker1:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
        console.log(`Ratio: ${await iVault.ratio()}`);

        console.log(`### Staker2 redeems`);
        await iVault.redeem(staker2.address);
        console.log(`iToken balance staker2:\t\t${await iToken.balanceOf(staker2.address)}`);
        console.log(`Pending withdrawal staker2:\t${(await iVault.getPendingWithdrawalOf(staker2.address))[0]}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });
    }

    it("Stakers withdraw all and redeem", async function () {
      //Stakers withdraw all
      for (const s of stakers) {
        const shares = await iToken.balanceOf(s.address);
        await iVault.connect(s).withdraw(shares, s.address);
        const w = withdrawals.get(s.address);
        withdrawals.set(s.address, w.add(shares));
      }
      //Withdraw and claim from EL
      await withdrawFromEL(iVault, operator);
      //Stakers redeem
      let stakerCounter = 1;
      for (const s of stakers) {
        console.log(`iToken balance staker${stakerCounter} before:\t\t${await iToken.balanceOf(s.address)}`);
        console.log(`iVault assets before:\t\t\t\t${await iVault.totalAssets()}`);
        console.log(`Pending withdrawal staker${stakerCounter} before:\t${(await iVault.getPendingWithdrawalOf(s.address))[0]}`);
        console.log(`### Staker${stakerCounter} redeems`);
        await iVault.redeem(s.address);
        console.log(`Pending withdrawal staker${stakerCounter} after:\t${(await iVault.getPendingWithdrawalOf(s.address))[0]}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
        stakerCounter++;
      }
      expect(await iVault.totalAssets()).to.be.lt(100);
    });
  });

  describe("claimCompletedWithdrawals: claims withdraw from EL", function () {
    let ratio, depositedAmount, withdrawalAmount, withdrawalData, withdrawalAssets;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateAccount(staker2Address, toWei(1));
      ratio = await iVault.ratio();

      //Deposit and withdraw
      depositedAmount = randomBN(19);
      await iVault.connect(staker).deposit(depositedAmount, staker.address);
      // const shares = await iToken.balanceOf(staker.address);
      withdrawalAmount = randomBN(18);
      await iVault.connect(staker).withdraw(withdrawalAmount, staker.address);
      console.log(`Pending withdrawals: ${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

      const tx = await iVault.connect(operator).withdrawFromEL();
      const receipt = await tx.wait();
      const WithdrawalQueuedEvent = receipt.events[2].args;
      withdrawalData = [
        WithdrawalQueuedEvent["strategies"],
        WithdrawalQueuedEvent["shares"],
        iVault.address,
        [iVault.address, WithdrawalQueuedEvent["nonce"]],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        WithdrawalQueuedEvent["delegatedAddress"],
      ];
      withdrawalAssets = [];
      const StrategyBaseFactory = await hre.ethers.getContractFactory("StrategyBaseDummy");
      for (const strategyAddress of WithdrawalQueuedEvent["strategies"]) {
        const strategy = StrategyBaseFactory.attach(strategyAddress);
        const assetAddress = await strategy.underlyingToken();
        withdrawalAssets.push(assetAddress);
      }
    });

    it("Reverts: when claim without delay", async function () {
      await expect(iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets)).to.be.revertedWith(
        "StrategyManager.completeQueuedWithdrawal: withdrawalDelayBlocks period has not yet passed"
      );
    });

    it("Successful claim from EL", async function () {
      await mineBlocks("15");
      console.log(`iVault assets before: ${await iVault.totalAssets()}`);
      const epochBefore = await iVault.epoch();

      await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets);
      console.log(`iVault assets after: ${await iVault.totalAssets()}`);

      expect(await iVault.totalAssets()).to.be.closeTo(await iVault.convertToAssets(withdrawalAmount), 5);
      expect(await iVault.epoch()).to.be.eq(epochBefore.add(1));
      expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
    });

    it("getTotalDeposited() = iVault + EL", async function () {
      const amount = await iVault.getTotalDeposited();
      console.log(`getTotalDeposited: ${amount}`);
      expect(amount).to.be.closeTo(depositedAmount, 5);
    });

    it("Reverts: when claim the 2nd time", async function () {
      await expect(iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets)).to.be.revertedWith(
        "InceptionVault: there is no withdrawal"
      );
    });

    it("New deposit will not affect iVault balance", async function () {
      const amount = randomBN(18);
      await iVault.connect(staker).deposit(amount, staker.address);

      expect(await iVault.totalAssets()).to.be.closeTo(await iVault.convertToAssets(withdrawalAmount), 5);
    });
  });

  describe("redeem: withdraw can be retrieved from iVault", function () {
    let ratio, stakerAmount, staker2Amount, stakerUnstakeAmount, staker2UnstakeAmount;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);
      ratio = await iVault.ratio();
    });

    it("Stakers deposit", async function () {
      stakerAmount = toBN("9399680561290658040");
      await iVault.connect(staker).deposit(stakerAmount, staker.address);
      staker2Amount = toBN("1348950494309030813");
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
      console.log(`Staker amount: ${stakerAmount}`);
      console.log(`Staker2 amount: ${staker2Amount}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker has nothing to claim yet", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
    });

    it("Staker withdraws", async function () {
      const shares = await iToken.balanceOf(staker.address);
      stakerUnstakeAmount = shares.div(2);
      await iVault.connect(staker).withdraw(stakerUnstakeAmount, staker.address);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is not able to claim yet", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
    });

    it("Reverts: when redeem the same epoch", async function () {
      await expect(iVault.connect(operator).redeem(staker.address)).to.be.revertedWith("InceptionVault: claimer is not able to claim");
    });

    it("Withdraw and claim from EL", async function () {
      await withdrawFromEL(iVault, operator);
      console.log(`iVault total assets: ${await iVault.totalAssets()}`);
      console.log(`Staker1 pending withdrawal: ${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is now able to claim", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
    });

    it("Staker2 withdraws < staker pending withdrawal", async function () {
      const stakerPendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
      staker2UnstakeAmount = stakerPendingWithdrawal[0].div(10);
      await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
    });

    it("Staker2 is not able to claim yet", async function () {
      expect(await iVault.isAbleToRedeem(staker2.address)).to.be.false;
    });

    it("Staker is still able to claim", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
    });

    it("Reverts: when staker redeems out of turn", async function () {
      await expect(iVault.connect(operator).redeem(staker2.address)).to.be.revertedWith("InceptionVault: claimer is not able to claim");
    });

    it("Staker withdraws again which makes epoch been reset", async function () {
      const shares = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(shares.div(2), staker.address);
      stakerUnstakeAmount = stakerUnstakeAmount.add(shares.div(2));
      console.log(`Pending withdrawals: ${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
      console.log(`Unstake amount: ${stakerUnstakeAmount.toString()}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is not able to claim again", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
    });

    it("Withdraw and claim from EL", async function () {
      await withdrawFromEL(iVault, operator);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is able to claim", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
    });

    it("Staker2 is able to claim", async function () {
      expect(await iVault.isAbleToRedeem(staker2.address)).to.be.true;
    });

    it("Staker redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
      const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(stakerUnstakeAmount);
      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${stakerBalanceAfter}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
      console.log(`stakerUnstakeAmountAssetValue: ${stakerUnstakeAmountAssetValue.toString()}`);
      console.log(`stakerPendingWithdrawalsBefore[0]: ${stakerPendingWithdrawalsBefore[0].toString()}`);

      expect(stakerPendingWithdrawalsBefore[0].sub(stakerPendingWithdrawalsAfter[0])).to.be.closeTo(stakerUnstakeAmountAssetValue, 10);
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(stakerUnstakeAmount, 5);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker2 redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker2.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker2.address);
      await iVault.redeem(staker2.address);
      const stakerBalanceAfter = await asset.balanceOf(staker2.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker2.address);

      console.log(`Staker balance after: ${stakerBalanceAfter}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
      const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(staker2UnstakeAmount);
      expect(stakerPendingWithdrawalsBefore[0].sub(stakerPendingWithdrawalsAfter[0])).to.be.closeTo(stakerUnstakeAmountAssetValue, 10);
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(stakerUnstakeAmountAssetValue, 5);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Ratio is ok after all", async function () {
      expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
    });
  });

  describe("redeem: to many addresses", function () {
    let ratio, recipients, pendingShares;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);

      await iVault.connect(staker).deposit("9292557565124725653", staker.address);
    });

    const count = 3;
    for (let j = 0; j < count; j++) {
      it(`${j} Withdraw to 5 random addresses`, async function () {
        recipients = [];
        pendingShares = toBN(0);
        for (let i = 0; i < 5; i++) {
          const recipient = ethers.Wallet.createRandom().address;
          const shares = randomBN(17);
          pendingShares = pendingShares.add(shares);
          await iVault.connect(staker).withdraw(shares, recipient);
          recipients.push(recipient);
        }
      });

      it(`${j} Withdraw from EL and update ratio`, async function () {
        let tx = await iVault.connect(operator).withdrawFromEL();
        const data = await withdrawDataFromTx(tx, iVault);

        await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
        ratio = await iVault.ratio();
        console.log(`New ratio is: ${ratio}`);

        await mineBlocks("15");
        await iVault.connect(staker).claimCompletedWithdrawals(data[0], data[1]);
        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Total withdrawed shares to assets ${await iVault.convertToAssets(pendingShares)}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it(`${j} Recipients claim`, async function () {
        for (const r of recipients) {
          const rBalanceBefore = await asset.balanceOf(r);
          const rPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(r);
          await iVault.redeem(r);
          const rBalanceAfter = await asset.balanceOf(r);
          const rPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(r);

          expect(rBalanceAfter.sub(rPendingWithdrawalsBefore[0])).to.be.closeTo(0, 10);
          expect(rBalanceBefore.sub(rPendingWithdrawalsAfter[0])).to.be.closeTo(0, 10);
        }
        expect(await iVault.ratio()).to.be.lte(ratio);
        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it(`${j} Deposit extra from iVault`, async function () {
        const totalDepositedBefore = await iVault.getTotalDeposited();

        await iVault.connect(operator).depositExta();
        const totalDepositedAfter = await iVault.getTotalDeposited();

        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);

        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, 1);
        expect(await iVault.totalAssets()).to.be.lte(100);
        expect(await iVault.ratio()).to.be.lte(ratio);
      });
    }

    it("Update asset ratio and withdraw the rest", async function () {
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
      ratio = await iVault.ratio();
      console.log(`New ratio is: ${ratio}`);

      //Withdraw all and take from EL
      const shares = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(shares, staker.address);
      await withdrawFromEL(iVault, operator);
      await iVault.connect(operator).redeem(staker.address);

      console.log(`iVault total assets: ${await iVault.totalAssets()}`);
      console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);

      await iVault.connect(operator).depositExta();
      console.log(`iVault total assets: ${await iVault.totalAssets()}`);
      console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
      expect(await iVault.totalAssets()).to.be.lte(100);
    });
  });

  describe("Redeem all after asset ratio changed", function () {
    let staker1UnstakeAmount, staker2UnstakeAmount, withdrawRatio;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);
    });

    it("Stakers deposit", async function () {
      const staker1Amount = toBN("9399680561290658040");
      await iVault.connect(staker).deposit(staker1Amount, staker.address);
      const staker2Amount = toBN("1348950494309030813");
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
      console.log(`Staker desposited:\t${format(staker1Amount)}`);
      console.log(`Staker2 deposited:\t${format(staker2Amount)}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Change ratio - transfer to strategy", async function () {
      console.log(`Ratio before:\t${await iVault.ratio()}`);
      await updateTheStrategyRatio(rEthStrategyAddress, e18, staker2);
      withdrawRatio = await iVault.ratio();
      console.log(`Ratio after:\t${withdrawRatio}`);
    });

    it("Staker1 withdraws", async function () {
      staker1UnstakeAmount = await iToken.balanceOf(staker.address);
      expect(staker1UnstakeAmount).to.be.gt(0);
      const expectedPending = await iVault.convertToAssets(staker1UnstakeAmount);
      await iVault.connect(staker).withdraw(staker1UnstakeAmount, staker.address);
      const pendingWithdrawal = (await iVault.getPendingWithdrawalOf(staker.address))[0];
      console.log(`Pending withdrawal: ${format(pendingWithdrawal)}`);

      expect(pendingWithdrawal).to.be.closeTo(expectedPending, 2);
      expect(pendingWithdrawal).to.be.closeTo(staker1UnstakeAmount.mul(e18).div(withdrawRatio), 20);
      console.log(`Ratio after: ${await iVault.ratio()}`);
    });

    it("Staker2 withdraws", async function () {
      staker2UnstakeAmount = await iToken.balanceOf(staker2.address);
      expect(staker2UnstakeAmount).to.be.gt(0);
      const expectedPending = await iVault.convertToAssets(staker2UnstakeAmount);
      await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
      const pendingWithdrawal = (await iVault.getPendingWithdrawalOf(staker2.address))[0];
      console.log(`Pending withdrawal: ${format(pendingWithdrawal)}`);

      expect(pendingWithdrawal).to.be.closeTo(expectedPending, 2);
      expect(pendingWithdrawal).to.be.closeTo(staker2UnstakeAmount.mul(e18).div(withdrawRatio), 20);
      console.log(`Ratio after: ${await iVault.ratio()}`);
    });

    it("Withdraw and claim from EL", async function () {
      console.log(`Total assets before: ${format(await iVault.totalAssets())}`);
      await withdrawFromEL(iVault, operator);
      console.log(`Total assets after: ${format(await iVault.totalAssets())}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Stakers are able to redeem", async function () {
      expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
      expect(await iVault.isAbleToRedeem(staker2.address)).to.be.true;
    });

    it("Staker redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${format(stakerBalanceAfter)}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);

      expect(stakerPendingWithdrawalsBefore[0].sub(stakerPendingWithdrawalsAfter[0])).to.be.closeTo(
        stakerBalanceAfter.sub(stakerBalanceBefore),
        2
      );
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker2 redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker2.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker2.address);
      await iVault.redeem(staker2.address);
      const stakerBalanceAfter = await asset.balanceOf(staker2.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker2.address);

      console.log(`Staker balance after: ${format(stakerBalanceAfter)}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);

      expect(stakerPendingWithdrawalsBefore[0].sub(stakerPendingWithdrawalsAfter[0])).to.be.closeTo(
        stakerBalanceAfter.sub(stakerBalanceBefore),
        2
      );
      console.log(`Ratio: ${await iVault.ratio()}`);
    });
  });

  describe("iToken ratio depends on the ratio of strategies", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      staker = await impersonateStaker(stakerAddress, iVault, asset, assetPool);
      staker2 = await impersonateStaker(staker2Address, iVault, asset, assetPool);
      await iVault.connect(staker).deposit(e18, staker.address);
      ratio = await iVault.ratio();
    });

    const testData = [
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
      { amount: "1000000000000000000" },
    ];

    testData.forEach(function (test) {
      it(`Transfer ${test.amount} to strategy`, async function () {
        const ratioBefore = await iVault.ratio();

        await updateTheStrategyRatio(rEthStrategyAddress, test.amount, staker2);

        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${ratioBefore}`);
        console.log(`Ratio after:\t${ratioAfter}`);

        expect(ratioAfter).to.be.lt(ratioBefore);
      });
    });
  });
});

async function updateTheStrategyRatio(strategyAddress, amount, staker) {
  const iStrategyFactory = await ethers.getContractFactory("StrategyBaseDummy");
  const strategy = iStrategyFactory.attach(strategyAddress);

  const tokenAddress = await strategy.underlyingToken();
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const token = iTokenFactory.attach(tokenAddress);
  await token.connect(staker).transfer(strategy.address, amount);
}

async function withdrawFromEL(iVault, operator) {
  const tx = await iVault.connect(operator).withdrawFromEL();
  const [withdrawalData, assetsToWithdraw] = await withdrawDataFromTx(tx, iVault);

  await mineBlocks("15");

  await iVault.claimCompletedWithdrawals(withdrawalData, assetsToWithdraw);
}

async function withdrawDataFromTx(tx, iVault) {
  const receipt = await tx.wait();

  if (receipt.events.length !== 3) {
    console.log("WRONG NUMBER OF EVENTS in withdrawFromEigenLayerEthAmount()");
    return;
  }

  const WithdrawalQueuedEvent = receipt.events[2].args;
  const withdrawalData = [
    WithdrawalQueuedEvent["strategies"],
    WithdrawalQueuedEvent["shares"],
    iVault.address,
    [iVault.address, WithdrawalQueuedEvent["nonce"]],
    WithdrawalQueuedEvent["withdrawalStartBlock"],
    WithdrawalQueuedEvent["delegatedAddress"],
  ];

  const assetsToWithdraw = [];
  const StrategyBaseFactory = await hre.ethers.getContractFactory("StrategyBaseDummy");
  for (const strategyAddress of WithdrawalQueuedEvent["strategies"]) {
    const strategy = StrategyBaseFactory.attach(strategyAddress);
    const assetAddress = await strategy.underlyingToken();
    assetsToWithdraw.push(assetAddress);
  }
  return [withdrawalData, assetsToWithdraw];
}

const toWei = (ether) => ethers.utils.parseEther(ether.toString());

function randomBN(length) {
  if (length > 0) {
    let randomNum = "";
    randomNum += Math.floor(Math.random() * 9) + 1; // generates a random digit 1-9
    for (let i = 0; i < length - 1; i++) {
      randomNum += Math.floor(Math.random() * 10); // generates a random digit 0-9
    }
    return toBN(randomNum);
  } else {
    return toBN(0);
  }
}

const mineBlock = async () => {
  network.provider.send("evm_mine");
};

const mineBlocks = async (count) => {
  console.log(`WAIT FOR ${count} BLOCKs`);
  for (let i = 0; i < count; i++) {
    await mineBlock();
  }
};

function format(bn) {
  return bn.toBigInt().toLocaleString("de-DE");
}
