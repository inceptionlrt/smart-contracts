const { ethers, network, upgrades } = require("hardhat");
const { expect } = require("chai");
const toBN = ethers.BigNumber.from;
const {
  updateStrategyRatio,
  withdrawDataFromTx,
  impersonateWithEth,
  getStaker,
  getRandomStaker,
  Snapshotter,
  mineBlocks,
  toWei,
  randomBN,
  format,
  randomAddress,
} = require("./helpers/utils.js");

const e18 = toBN("1000000000000000000");
const ratioErr = 2;
const transactErr = 2;

const initVault = async () => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");
  // rETH
  console.log("- rETH token");
  const assetFactory = await ethers.getContractFactory("rETH");
  const asset = assetFactory.attach(rETHAddress);
  // rPool
  console.log("- Rocket pool");
  const assetPoolFactory = await ethers.getContractFactory("RocketMockPool");
  const assetPool = assetPoolFactory.attach(rocketPoolAddress);
  // Strategy
  console.log("- Strategy");
  const strategy = await ethers.getContractAt("IStrategy", rEthStrategyAddress);

  // 1. Inception token
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["EigenETH^2", "EigenETH^2"]);
  // 2. Impersonate operator
  const operator = await impersonateWithEth(operatorAddress, toWei(1));
  // 3. Staker implementation
  console.log("- Staker implementation");
  const InceptionStakerFactory = await ethers.getContractFactory("InceptionStaker");
  const stakerImplementation = await InceptionStakerFactory.deploy();

  // 4. Inception vault
  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory("InrEthVault");
  const iVault = await upgrades.deployProxy(iVaultFactory, [operator.address, strategyManagerAddress, iToken.address, rEthStrategyAddress]);
  await iVault.setDelegationManager(delegationManagerAddress);
  await iVault.upgradeTo(stakerImplementation.address);

  await iToken.setVault(iVault.address);
  console.log(`... iVault initialization completed ....`);

  iVault.withdrawFromELAndClaim = async function (stakerOperator, amount) {
    const tx = await this.connect(operator).undelegateFrom(stakerOperator, amount);
    const withdrawalData = await withdrawDataFromTx(tx, this, stakerOperator);

    await mineBlocks(15);
    await this.connect(operator).claimCompletedWithdrawals([withdrawalData]);
  };

  return [iToken, iVault, asset, assetPool, strategy, operator];
};

describe("Inception pool V4 rEth", function () {
  let iToken, iVault, asset, assetPool, strategy, donor, snapshotter, operator, staker, staker2;
  this.timeout(150000);

  before(async function () {
    [iToken, iVault, asset, assetPool, strategy, operator] = await initVault();
    donor = await impersonateWithEth(donorAddress, 1);
    staker = await getStaker(stakerAddress, iVault, asset, donor);
    staker2 = await getStaker(staker2Address, iVault, asset, donor);
    await iVault.addELOperator(stakerOperator1); //Add default operator
    snapshotter = new Snapshotter();
    await snapshotter.snapshot();
  });

  describe("Base flow", function () {
    before(async function () {
      await snapshotter.revert();
    });

    it("Initial ratio is 1e18", async function () {
      const ratio = await iVault.ratio();
      console.log(`Current ratio is: ${ratio.toString()}`);
      expect(ratio).to.be.eq(e18);
    });

    it("Deposit to Vault", async function () {
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
      expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);

      expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(amount, transactErr);
      expect(await iVault.getTotalDeposited()).to.be.closeTo(amount, transactErr);
      expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
      expect(await iVault.ratio()).to.be.eq(e18);
    });

    it("Delegate", async function () {
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);

      const delegatedTotal = await iVault.getTotalDelegated();
      const delegatedTo = await iVault.getDelegatedTo(stakerOperator1);
      expect(delegatedTotal).to.be.closeTo(amount, transactErr);
      expect(delegatedTo).to.be.closeTo(amount, transactErr);
    });

    it("Update asset ratio", async function () {
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      console.log(`New ratio is: ${format(await iVault.ratio())}`);
      expect(await iVault.ratio()).lt(e18);
    });

    it("Withdraw all", async function () {
      const shares = await iToken.balanceOf(staker.address);
      const assetValue = await iVault.convertToAssets(shares);
      console.log(`shares:\t\t\t\t\t${format(shares)}`);
      console.log(`asset value:\t\t\t${format(assetValue)}`);
      const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "Withdraw";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["owner"]).to.be.eq(staker.address);
      expect(events[0].args["amount"]).to.be.eq(assetValue);
      expect(events[0].args["iShares"]).to.be.eq(shares);

      const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
      const totalPW = await iVault.totalAmountToWithdraw();
      expect(stakerPW).to.be.eq(0);
      expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      expect(totalPW).to.be.closeTo(assetValue, transactErr);

      console.log(`Total delegated: ${await iVault.getTotalDelegated()}`);
      expect(await iVault.ratio()).to.be.eq(e18);
    });

    it("Withdraw from EL", async function () {
      const totalAssetsBefore = await iVault.totalAssets();
      const totalDepositedBefore = await iVault.getTotalDeposited();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
      const amount = await iVault.totalAmountToWithdraw();
      console.log(`Total deposited after:\t${format(totalDepositedBefore)}`);
      console.log(`Total delegated before:\t\t\t${format(totalDelegatedBefore)}`);
      console.log(`Total assets before:\t\t\t${totalAssetsBefore}`);
      console.log(`Staker2 pending withdrawals:\t${format(staker2PW)}`);

      await iVault.withdrawFromELAndClaim(stakerOperator1, amount);

      const totalAssetsAfter = await iVault.totalAssets();
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalDelegatedAfter = await iVault.getTotalDelegated();
      const redeemReserve = await iVault.redeemReservedAmount();

      console.log(`Available withdrawals:\t${await iVault.isAbleToRedeem(staker2.address)}`);
      console.log(`Total deposited after:\t${format(totalDepositedAfter)}`);
      console.log(`Total delegated after:\t${format(totalDelegatedAfter)}`);
      console.log(`Total assets after:\t\t${format(totalAssetsAfter)}`);
      console.log(`Redeem reserve:\t\t\t${format(redeemReserve)}`);

      expect(totalAssetsAfter.sub(totalAssetsBefore)).to.be.closeTo(amount, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
      expect(redeemReserve).to.be.eq(staker2PW);
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
      expect(totalDelegatedAfter).to.be.closeTo(0, transactErr * 4);
      expect(await iVault.ratio()).to.be.eq(e18);
    });

    it("Redeem withdraw", async function () {
      const balanceBefore = await asset.balanceOf(staker2.address);
      const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

      const tx = await iVault.connect(operator).redeem(staker2.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "Redeem";
      });
      // console.log(events[0]);
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(operator.address);
      expect(events[0].args["receiver"]).to.be.eq(staker2.address);
      expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const balanceAfter = await asset.balanceOf(staker2.address);
      const totalDepositedAfter = await iVault.getTotalDeposited();
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets after:\t\t\t${format(totalAssetsAfter)}`);
      console.log(`Total deposited after:\t\t${format(totalDepositedAfter)}`);
      console.log(`Pending withdrawals after:\t${format(staker2PWAfter)}`);
      console.log(`Ratio after:\t${(await iVault.ratio()).toString()}`);

      expect(staker2PWAfter).to.be.eq(0);
      expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(staker2PWBefore, transactErr);
      expect(totalDepositedAfter).to.be.closeTo(0, transactErr * 4);
      expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
    });
  });

  describe("Setters", function () {
    beforeEach(async function () {
      await snapshotter.revert();
    });

    it("setOperator(): only owner can", async function () {
      const newOperator = staker2;
      const tx = await iVault.setOperator(newOperator.address);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "OperatorChanged";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["prevValue"].toLowerCase()).to.be.eq(operator.address.toLowerCase());
      expect(events[0].args["newValue"].toLowerCase()).to.be.eq(newOperator.address.toLowerCase());

      await iVault.connect(staker).deposit(toWei(2), staker.address);
      const amount = await iVault.totalAssets();
      await iVault.connect(newOperator).delegateToOperator(stakerOperator1, amount);
    });

    it("setOperator(): reverts when caller is not an operator", async function () {
      await expect(iVault.connect(staker).setOperator(staker2Address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("addELOperator(): only owner can", async function () {
      const tx = await iVault.addELOperator(operators[0]);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "ELOperatorAdded";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["newELOperator"].toLowerCase()).to.be.eq(operators[0].toLowerCase());
    });

    it("addELOperator(): reverts when caller is not an owner", async function () {
      await expect(iVault.connect(operator).addELOperator(operators[0])).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("addELOperator(): reverts when address is not a staker-operator", async function () {
      await expect(iVault.addELOperator(randomAddress())).to.be.revertedWith("InceptionVault: it's not an EL operator");
    });

    it("addELOperator(): reverts when address is zero address", async function () {
      await expect(iVault.addELOperator(ethers.constants.AddressZero)).to.be.revertedWith("InceptionVault: it's not an EL operator");
    });

    it("addELOperator(): reverts when address has been added already", async function () {
      await iVault.addELOperator(operators[0]);
      await expect(iVault.addELOperator(operators[0])).to.be.revertedWith("InceptionVault: operator already exists");
    });

    it("setDelegationManager(): only owner can", async function () {
      const newManager = staker2.address;
      const tx = await iVault.setDelegationManager(newManager);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "DelegationManagerChanged";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["prevValue"].toLowerCase()).to.be.eq(delegationManagerAddress.toLowerCase());
      expect(events[0].args["newValue"].toLowerCase()).to.be.eq(newManager.toLowerCase());
      expect(await iVault.delegationManager()).to.be.eq(newManager);
    });

    it("setDelegationManager(): reverts when caller is not an operator", async function () {
      await expect(iVault.connect(staker).setDelegationManager(staker2Address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("setMinAmount(): only owner can", async function () {
      const prevValue = await iVault.minAmount();
      const newMinAmount = randomBN(3);
      const tx = await iVault.setMinAmount(newMinAmount);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "MinAmountChanged";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["prevValue"]).to.be.eq(prevValue);
      expect(events[0].args["newValue"]).to.be.eq(newMinAmount);
      expect(await iVault.minAmount()).to.be.eq(newMinAmount);
    });

    it("setMinAmount(): another address can not", async function () {
      await expect(iVault.connect(staker).setMinAmount(randomBN(3))).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("setDepositFee(): only owner can", async function () {
      const prevValue = await iVault.depositFee();
      const newDepositFee = randomBN(3);
      const tx = await iVault.setDepositFee(newDepositFee);
      const receipt = await tx.wait();
      const events = receipt.events?.filter((e) => {
        return e.event === "DepositFeeChanged";
      });
      expect(events.length).to.be.eq(1);
      expect(events[0].args["prevValue"]).to.be.eq(prevValue);
      expect(events[0].args["newValue"]).to.be.eq(newDepositFee);
      expect(await iVault.depositFee()).to.be.eq(newDepositFee);
    });

    it("setDepositFee(): another address can not", async function () {
      await expect(iVault.connect(staker).setDepositFee(randomBN(3))).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("deposit: user can restake asset", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      //Deposit to change ratio
      await asset.connect(donor).approve(iVault.address, e18);
      await iVault.connect(donor).deposit(e18, donor.address);
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      ratio = await iVault.ratio();
    });

    const args = [
      {
        amount: async () => "4798072939323319141",
        receiver: () => staker.address,
      },
      {
        amount: async () => "999999999999999999",
        receiver: () => staker2.address,
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

    args.forEach(function (arg) {
      it(`Deposit amount ${arg.amount}`, async function () {
        const receiver = arg.receiver();
        const balanceBefore = await iToken.balanceOf(receiver);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();

        const amount = toBN(await arg.amount());
        const convertedShares = await iVault.convertToShares(amount);
        const expectedShares = amount.mul(await iVault.ratio()).div(e18);

        const tx = await iVault.connect(staker).deposit(amount, receiver);
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "Deposit";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(receiver);
        expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
        expect(events[0].args["iShares"].sub(expectedShares)).to.be.closeTo(0, transactErr);

        const balanceAfter = await iToken.balanceOf(receiver);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();

        expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(expectedShares, transactErr);
        expect(balanceAfter.sub(balanceBefore)).to.be.closeTo(convertedShares, transactErr);

        expect(totalDepositedAfter.sub(totalDepositedBefore)).to.be.closeTo(amount, transactErr);
        expect(totalAssetsAfter.sub(totalAssetsBefore)).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr); //Ratio stays the same
      });
      it("Delegate all", async function () {
        const delegatedBefore = await iVault.getDelegatedTo(stakerOperator1);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        console.log(`Delegated before: ${delegatedBefore}`);
        console.log(`Total deposited before: ${totalDepositedBefore}`);

        const amount = await iVault.totalAssets();
        const tx = await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "DelegatedTo";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.constants.AddressZero);
        expect(events[0].args["stakerAddress"]).to.be.properAddress;
        expect(events[0].args["operatorAddress"].toLowerCase()).to.be.eq(stakerOperator1.toLowerCase());
        expect(events[0].args["amount"]).to.be.eq(amount);

        const delegatedAfter = await iVault.getDelegatedTo(stakerOperator1);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();

        expect(delegatedAfter.sub(delegatedBefore)).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
      });
    });

    const depositInvalidArgs = [
      {
        name: "amount is 0",
        amount: async () => 0n,
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: deposited less than min amount",
      },
      {
        name: "amount < min",
        amount: async () => (await iVault.minAmount()).sub(1),
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: deposited less than min amount",
      },
      {
        name: "to zero address",
        amount: async () => randomBN(18),
        isCustom: true,
        receiver: () => ethers.constants.AddressZero,
        error: "NullParams",
      },
    ];

    depositInvalidArgs.forEach(function (arg) {
      it(`Reverts when: deposit ${arg.name}`, async function () {
        const amount = await arg.amount();
        const receiver = arg.receiver();
        if (arg.isCustom) {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWithCustomError(iVault, arg.error);
        } else {
          await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWith(arg.error);
        }
      });
    });

    const convertSharesArgs = [
      {
        name: "amount = 0",
        amount: async () => toBN(0),
      },
      {
        name: "amount = 1",
        amount: async () => toBN(0),
      },
      {
        name: "amount < min",
        amount: async () => (await iVault.minAmount()).sub(1),
      },
    ];

    convertSharesArgs.forEach(function (arg) {
      it(`Convert to shares: ${arg.name}`, async function () {
        const amount = await arg.amount();
        const ratio = await iVault.ratio();
        expect(await iVault.convertToShares(amount)).to.be.eq(amount.mul(ratio).div(e18));
      });
    });
  });

  describe("Deposit and delegateToOperator", function () {
    let ratio, firstDeposit;

    beforeEach(async function () {
      await snapshotter.revert();
      await asset.connect(donor).approve(iVault.address, e18);
      await iVault.connect(donor).deposit(e18, donor.address);
      firstDeposit = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, firstDeposit);
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      ratio = await iVault.ratio();
      console.log(`Initial ratio: ${ratio}`);
    });

    const args2 = [
      {
        name: "random amounts ~ e18",
        depositAmount: async () => toWei(1),
      },
      {
        name: "amounts which are close to min",
        depositAmount: async () => (await iVault.minAmount()).add(1),
      },
    ];

    args2.forEach(function (arg) {
      it(`Deposit and delegate ${arg.name} many times`, async function () {
        let totalDelegated = toBN(0);
        const count = 10;
        for (let i = 0; i < count; i++) {
          const deposited = await arg.depositAmount();
          await iVault.connect(staker).deposit(deposited, staker.address);
          const delegated = await iVault.totalAssets();
          await iVault.connect(operator).delegateToOperator(stakerOperator1, delegated);

          totalDelegated = totalDelegated.add(deposited);
        }
        console.log(`Final ratio:\t${await iVault.ratio()}`);
        console.log(`Total delegated:\t${format(totalDelegated)}`);

        const balanceExpected = totalDelegated.mul(ratio).div(e18);
        const totalSupplyExpected = balanceExpected.add(firstDeposit);
        const err = count * transactErr * 2;

        const balanceAfter = await iToken.balanceOf(staker.address);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(stakerOperator1);
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Staker balance after: ${format(balanceAfter)}`);
        console.log(`Total deposited after: ${format(totalDepositedAfter)}`);
        console.log(`Total delegated after: ${format(totalDelegatedAfter)}`);
        console.log(`Total delegatedTo after: ${format(totalDelegatedToAfter)}`);
        console.log(`Total assets after: ${format(totalAssetsAfter)}`);

        expect(balanceAfter.sub(balanceExpected)).to.be.closeTo(0, err);
        expect(totalDepositedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalDelegatedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalSupplyAfter.sub(totalSupplyExpected)).to.be.closeTo(0, err);
        expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, count * ratioErr);
      });
    });

    const args3 = [
      {
        name: "by the same staker",
        staker: async () => staker,
      },
      {
        name: "by different stakers",
        staker: async () => await getRandomStaker(iVault, asset, donor, toWei(10)),
      },
    ];

    args3.forEach(function (arg) {
      it(`Deposit many times and delegate once ${arg.name}`, async function () {
        let totalDeposited = toBN(0);
        const count = 10;
        for (let i = 0; i < count; i++) {
          const staker = await arg.staker();
          const deposited = await randomBN(19);
          await iVault.connect(staker).deposit(deposited, staker.address);
          totalDeposited = totalDeposited.add(deposited);
        }
        const totalDelegated = await iVault.totalAssets();
        await iVault.connect(operator).delegateToOperator(stakerOperator1, totalDelegated);
        console.log(`Final ratio:\t${await iVault.ratio()}`);
        console.log(`Total deposited:\t${format(totalDeposited)}`);
        console.log(`Total delegated:\t${format(totalDelegated)}`);

        const balanceExpected = totalDelegated.mul(ratio).div(e18);
        const totalSupplyExpected = balanceExpected.add(firstDeposit);
        const err = count * transactErr * 2;

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(stakerOperator1);
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Total deposited after: ${format(totalDepositedAfter)}`);
        console.log(`Total delegated after: ${format(totalDelegatedAfter)}`);
        console.log(`Total delegatedTo after: ${format(totalDelegatedToAfter)}`);
        console.log(`Total assets after: ${format(totalAssetsAfter)}`);

        expect(totalDepositedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalDelegatedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalSupplyAfter.sub(totalSupplyExpected)).to.be.closeTo(0, err);
        expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, count * ratioErr);
      });
    });

    const args4 = [
      {
        name: "to the different operators",
        count: 20,
        stakerOperator: (i) => operators[i % operators.length],
      },
      {
        name: "to the same operator",
        count: 10,
        stakerOperator: (i) => operators[0],
      },
    ];

    args4.forEach(function (arg) {
      it(`Delegate many times ${arg.name}`, async function () {
        //Deposit by 2 stakers
        const totalDelegated = toWei(100);
        await iVault.connect(staker).deposit(totalDelegated.div(2), staker.address);
        await iVault.connect(staker2).deposit(totalDelegated.div(2), staker2.address);
        const deployedStakers = [];
        //Delegate
        for (let i = 0; i < arg.count; i++) {
          const taBefore = await iVault.totalAssets();
          const stakerOperator = arg.stakerOperator(i);
          console.log(`#${i} Operator: ${stakerOperator}`);

          const isFirstDelegation = !deployedStakers.includes(stakerOperator);
          if (isFirstDelegation) {
            await iVault.addELOperator(stakerOperator); //Add operator
            deployedStakers.push(stakerOperator); //Remember the address
          }
          const ta = await iVault.totalAssets();
          const amount = ta.div(arg.count - i);
          const tx = await iVault.connect(operator).delegateToOperator(stakerOperator, amount);
          const receipt = await tx.wait();
          let events = receipt.events?.filter((e) => {
            return e.event === "DelegatedTo";
          });
          expect(events.length).to.be.eq(1);
          expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.constants.AddressZero);
          expect(events[0].args["stakerAddress"]).to.be.properAddress;
          expect(events[0].args["operatorAddress"].toLowerCase()).to.be.eq(stakerOperator.toLowerCase());
          expect(events[0].args["amount"]).to.be.eq(amount);

          //Check that RestakerDeployed event was emitted on the first delegation
          if (isFirstDelegation) {
            let events = receipt.events?.filter((e) => {
              return e.event === "RestakerDeployed";
            });
            expect(events.length).to.be.eq(1);
            expect(events[0].args["restaker"]).to.be.not.eq(ethers.constants.AddressZero);
            expect(events[0].args["restaker"]).to.be.properAddress;
          } else {
            expect(receipt.events.map((e) => e.event)).to.not.include("RestakerDeployed");
          }
          const taAfter = await iVault.totalAssets();
          expect(taBefore.sub(taAfter)).to.be.closeTo(amount, transactErr);
        }
        console.log(`Final ratio:\t${await iVault.ratio()}`);

        const balanceExpected = totalDelegated.mul(ratio).div(e18);
        const totalSupplyExpected = balanceExpected.add(firstDeposit);
        const err = arg.count * transactErr * 2;

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedToAfter = await iVault.getDelegatedTo(stakerOperator1);
        const totalSupplyAfter = await iToken.totalSupply();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Total deposited after: ${format(totalDepositedAfter)}`);
        console.log(`Total delegated after: ${format(totalDelegatedAfter)}`);
        console.log(`Total delegatedTo after: ${format(totalDelegatedToAfter)}`);
        console.log(`Total assets after: ${format(totalAssetsAfter)}`);

        expect(totalDepositedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalDelegatedAfter.sub(firstDeposit.mul(e18).div(ratio).add(totalDelegated))).to.be.closeTo(0, err);
        expect(totalSupplyAfter.sub(totalSupplyExpected)).to.be.closeTo(0, err);
        expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, arg.count * ratioErr);
      });
    });

    //Delegate invalid params
    const invalidArgs = [
      {
        name: "amount is 0",
        deposited: toWei(1),
        amount: async () => toBN(0),
        stakerOperator: async () => stakerOperator1,
        operator: () => operator,
        isCustom: false,
        error: "StrategyBase.deposit: newShares cannot be zero",
      },
      {
        name: "amount is 1",
        deposited: toWei(1),
        amount: async () => toBN(1),
        stakerOperator: async () => stakerOperator1,
        operator: () => operator,
        isCustom: false,
        error: "StrategyBase.deposit: newShares cannot be zero",
      },
      {
        name: "amount is greater than iVault balance",
        deposited: toWei(1),
        amount: async () => toWei(1).add(1),
        stakerOperator: async () => stakerOperator1,
        operator: () => operator,
        isCustom: true,
        error: "InsufficientCapacity",
      },
      {
        name: "operator is not added to iVault",
        deposited: toWei(1),
        amount: async () => await iVault.totalAssets(),
        stakerOperator: async () => operators[0],
        operator: () => operator,
        isCustom: true,
        error: "OperatorNotRegistered",
      },
      {
        name: "operator is zero address",
        deposited: toWei(1),
        amount: async () => await iVault.totalAssets(),
        stakerOperator: async () => ethers.constants.AddressZero,
        operator: () => operator,
        isCustom: true,
        error: "NullParams",
      },
      {
        name: "caller is not an operator",
        deposited: toWei(1),
        amount: async () => await iVault.totalAssets(),
        stakerOperator: async () => ethers.constants.AddressZero,
        operator: () => staker,
        isCustom: false,
        error: "InceptionVault: only operator allowed",
      },
    ];

    invalidArgs.forEach(function (arg) {
      it(`Reverts when: delegate ${arg.name}`, async function () {
        await asset.connect(donor).approve(iVault.address, arg.deposited);
        await iVault.connect(donor).deposit(arg.deposited, donor.address);

        const operator = arg.operator();
        const delegateAmount = await arg.amount();
        const stakerOperator = await arg.stakerOperator();

        if (arg.isCustom) {
          await expect(iVault.connect(operator).delegateToOperator(stakerOperator, delegateAmount)).to.be.revertedWithCustomError(
            iVault,
            arg.error
          );
        } else {
          await expect(iVault.connect(operator).delegateToOperator(stakerOperator, delegateAmount)).to.be.revertedWith(arg.error);
        }
      });
    });
  });

  describe("withdraw: user can unstake", function () {
    let ratio, totalDeposited;

    before(async function () {
      await snapshotter.revert();
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      const totalAssets = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, totalAssets);
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      totalDeposited = await iVault.getTotalDeposited();
      ratio = await iVault.ratio();
      console.log(`Initial ratio: ${ratio}`);
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
      {
        name: "min amount",
        amount: async (shares) => (await iVault.convertToAssets(await iVault.minAmount())).add(1).toString(),
        receiver: () => staker2.address,
      },
      {
        name: "all",
        amount: async (shares) => shares.toString(),
        receiver: () => staker2.address,
      },
    ];

    testData.forEach(function (test) {
      it(`Withdraw ${test.name}`, async function () {
        const ratioBefore = await iVault.ratio();
        const balanceBefore = await iToken.balanceOf(staker.address);
        const amount = toBN(await test.amount(balanceBefore));
        const assetValue = await iVault.convertToAssets(amount);
        const stakerPWBefore = await iVault.getPendingWithdrawalOf(test.receiver());
        const totalPWBefore = await iVault.totalAmountToWithdraw();

        const tx = await iVault.connect(staker).withdraw(amount, test.receiver());
        const receipt = await tx.wait();
        const events = receipt.events?.filter((e) => {
          return e.event === "Withdraw";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(test.receiver());
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(assetValue, transactErr);
        expect(events[0].args["iShares"]).to.be.eq(amount);

        expect(balanceBefore.sub(await iToken.balanceOf(staker.address))).to.be.eq(amount);
        expect((await iVault.getPendingWithdrawalOf(test.receiver())).sub(stakerPWBefore)).to.be.closeTo(assetValue, transactErr);
        expect((await iVault.totalAmountToWithdraw()).sub(totalPWBefore)).to.be.closeTo(assetValue, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);

        //If did withdraw all ratio = 1
        if ((await iToken.totalSupply()).gt(0)) {
          expect(await iVault.ratio()).to.be.closeTo(ratioBefore, ratioErr);
        } else {
          expect(await iVault.ratio()).to.eq(e18);
        }
      });
    });
  });

  describe("withdraw: invalid amounts", function () {
    before(async function () {
      await snapshotter.revert();
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      const totalAssets = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, totalAssets);
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
    });

    const invalidData = [
      {
        name: "> balance",
        amount: async () => (await iToken.balanceOf(staker.address)).add(1),
        receiver: () => staker.address,
        isCustom: false,
        error: "ERC20: burn amount exceeds balance",
      },
      {
        name: "< min amount",
        amount: async () => (await iVault.minAmount()).sub(1),
        receiver: () => staker.address,
        isCustom: false,
        error: "InceptionVault: amount is less than the minimum withdrawal",
      },
      {
        name: "0",
        amount: async () => toBN(0),
        receiver: () => staker.address,
        isCustom: true,
        error: "NullParams",
      },
      {
        name: "to zero address",
        amount: async () => randomBN(18),
        receiver: () => ethers.constants.AddressZero,
        isCustom: true,
        error: "NullParams",
      },
    ];

    invalidData.forEach(function (test) {
      it(`Reverts: withdraws ${test.name}`, async function () {
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
      console.log(`Ratio before:\t${format(ratioBefore)}`);

      const count = 100;
      const amount = await iVault.minAmount();
      for (let i = 0; i < count; i++) {
        await iVault.connect(staker).withdraw(amount, staker.address);
      }
      const ratioAfter = await iVault.ratio();
      console.log(`Ratio after:\t${format(ratioAfter)}`);

      expect(ratioBefore.sub(ratioAfter)).to.be.closeTo(0, count);

      await iVault.connect(staker).withdraw(e18, staker.address);
      console.log(`Ratio after withdraw 1eth:\t${await iVault.ratio()}`);
      expect(await iVault.ratio()).to.be.closeTo(ratioAfter, ratioErr);
    });
  });

  describe("undelegateFrom: operator can retrieve asset from EL", function () {
    let ratio, ratioDiff, depositedAmount, assets1, assets2, withdrawalData1, withdrawalData2, withdrawalAssets, shares1, shares2;

    before(async function () {
      await snapshotter.revert();

      //Deposit and delegate to default stakerOperator
      depositedAmount = randomBN(19);
      await iVault.connect(staker).deposit(depositedAmount, staker.address);
      const totalAssets = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, totalAssets);
    });

    it("Operator can undelegateFrom stakerOperator", async function () {
      shares1 = toBN("460176234800292249");
      assets1 = await iVault.convertToAssets(shares1);
      console.log(`--- Staker is going to withdraw: ${format(shares1)}/${format(assets1)}`);
      await iVault.connect(staker).withdraw(shares1, staker.address);
      console.log(`Staker's pending withdrawals:\t${format(await iVault.getPendingWithdrawalOf(staker.address))}`);

      const pendingWithdrawalsELBefore = await iVault.getPendingWithdrawalAmountFromEL();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      const tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, assets1);
      const receipt = await tx.wait();
      const startWithdrawal = receipt.events?.filter((e) => {
        return e.event === "StartWithdrawal";
      });
      expect(startWithdrawal.length).to.be.eq(1);
      const WithdrawalQueuedEvent = receipt.events[0].args;
      withdrawalData1 = [
        WithdrawalQueuedEvent["stakerAddress"],
        stakerOperator1,
        iVault.address,
        WithdrawalQueuedEvent["nonce"],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        [WithdrawalQueuedEvent["strategy"]],
        [WithdrawalQueuedEvent["shares"]],
      ];
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      expect(totalDelegatedBefore.sub(totalDelegatedAfter)).to.be.closeTo(assets1, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(0, transactErr);
      const pendingWithdrawalsELAfter = await iVault.getPendingWithdrawalAmountFromEL();
      console.log(`EL's pending withdrawals:\t\t${format(pendingWithdrawalsELAfter)}`);
      expect(pendingWithdrawalsELAfter.sub(pendingWithdrawalsELBefore)).to.be.closeTo(shares1, transactErr);
    });

    it("Operator can do more undelegateFrom stakerOperator", async function () {
      shares2 = toBN("460176234800292249");
      assets2 = await iVault.convertToAssets(shares2);
      console.log(`--- Staker is going to withdraw: ${format(shares2)}/${format(assets2)}`);
      await iVault.connect(staker).withdraw(shares2, staker2.address);
      console.log(`Staker's pending withdrawals:\t${format(await iVault.getPendingWithdrawalOf(staker.address))}`);

      //Change asset ratio
      const ratioBefore = await iVault.ratio();
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      ratio = await iVault.ratio();
      ratioDiff = ratioBefore.sub(ratio);

      const totalPWBefore = await iVault.getPendingWithdrawalAmountFromEL();
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      const tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, assets1);
      const receipt = await tx.wait();
      const startWithdrawal = receipt.events?.filter((e) => {
        return e.event === "StartWithdrawal";
      });
      expect(startWithdrawal.length).to.be.eq(1);
      const WithdrawalQueuedEvent = receipt.events[0].args;
      withdrawalData2 = [
        WithdrawalQueuedEvent["stakerAddress"],
        stakerOperator1,
        iVault.address,
        WithdrawalQueuedEvent["nonce"],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        [WithdrawalQueuedEvent["strategy"]],
        [WithdrawalQueuedEvent["shares"]],
      ];
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      expect(totalDelegatedBefore.sub(totalDelegatedAfter)).to.be.closeTo(assets2, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(0, transactErr);
      expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
      const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();
      expect(totalPWAfter.sub(totalPWBefore)).to.be.closeTo(shares2, transactErr);
    });

    it("Claim the 2nd withdrawal from EL", async function () {
      await mineBlocks(15);
      await iVault.connect(staker).claimCompletedWithdrawals([withdrawalData2]);
      const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();

      console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).toString()}`);
      console.log(`iVault assets:\t\t\t\t${format(await iVault.totalAssets())}`);
      console.log(`Pending withdrawal staker:\t${format(await iVault.getPendingWithdrawalOf(staker.address))}`);
      console.log(`Pending withdrawal staker2:\t${format(await iVault.getPendingWithdrawalOf(staker2.address))}`);
      console.log(`Total pending withdrawal:\t${format(totalPWAfter)}`);

      expect((await iVault.totalAssets()).sub(assets2)).to.be.closeTo(0, transactErr);
      expect(totalPWAfter.sub(shares1)).to.be.closeTo(0, transactErr);
    });

    it("Claim missed withdrawal from EL", async function () {
      await iVault.claimCompletedWithdrawals([withdrawalData1]);
      const totalPendingWithdrawalAfter = await iVault.getPendingWithdrawalAmountFromEL();
      const totalAssetsAfter = await iVault.totalAssets();
      const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);

      console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).toString()}`);
      console.log(`Total assets:\t\t\t\t${format(totalAssetsAfter)}`);
      console.log(`Pending withdrawal staker:\t${format(stakerPWAfter)}`);
      console.log(`Pending withdrawal staker2:\t${format(staker2PWAfter)}`);
      console.log(`Total pending withdrawal:\t${format(totalPendingWithdrawalAfter)}`);

      expect(stakerPWAfter.sub(assets1)).to.be.closeTo(0, transactErr);
      expect(staker2PWAfter.sub(assets2)).to.be.closeTo(0, transactErr);
      expect(totalAssetsAfter.sub(assets1).sub(assets2)).to.be.gt(0);
      expect(totalPendingWithdrawalAfter).to.be.eq(toBN(0));
    });

    it("Reverts: when delegating pending withdrawals back to EL", async function () {
      const totalAssets = await iVault.totalAssets();
      await expect(iVault.connect(operator).delegateToOperator(stakerOperator1, totalAssets)).to.be.revertedWithCustomError(
        iVault,
        "InsufficientCapacity"
      );
    });

    it("Operator can delegate part of leftover", async function () {
      const totalAssets = await iVault.totalAssets();
      const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const part = totalAssets.sub(stakerPWAfter).sub(staker2PWAfter).div(2);
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, part);
      const totalDelegatedAfter = await iVault.getTotalDelegated();

      expect(totalDelegatedAfter.sub(totalDelegatedBefore)).to.be.closeTo(part, transactErr);
    });

    it("Operator can delegate all leftover", async function () {
      const totalAssets = await iVault.totalAssets();
      const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
      const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
      const leftover = totalAssets.sub(stakerPWAfter).sub(staker2PWAfter);
      const totalDelegatedBefore = await iVault.getTotalDelegated();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, leftover);

      const totalDelegatedAfter = await iVault.getTotalDelegated();
      expect(totalDelegatedAfter.sub(totalDelegatedBefore)).to.be.closeTo(leftover, transactErr);
    });

    it("Staker is able to redeem", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Staker2 is able to redeem", async function () {
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Staker redeems withdrawals", async function () {
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPWBefore = await iVault.getPendingWithdrawalOf(staker.address);

      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${format(stakerBalanceAfter)}`);
      console.log(`Staker pending withdrawals after: ${format(stakerPWAfter)}`);

      expect(stakerPWBefore.sub(stakerPWAfter)).to.be.closeTo(assets1, transactErr * 2);
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(assets1, transactErr * 2);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });
  });

  describe("undelegateFrom different operators", function () {
    const withdrawalData = [];
    let totalAssetsBefore;

    before(async function () {
      await snapshotter.revert();
      for (const operatorAddress of operators) {
        await iVault.addELOperator(operatorAddress); //Add default operator
      }
    });

    it("Deposit and delegate to different operators", async function () {
      //Deposit
      const staker1Amount = randomBN(19);
      await iVault.connect(staker).deposit(staker1Amount, staker.address);
      const staker2Amount = randomBN(19);
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
      totalAssetsBefore = await iVault.totalAssets();

      //Delegate to each operator
      let i = 0;
      for (const operatorAddress of operators) {
        const ta = await iVault.totalAssets();
        const amount = ta.div(operators.length - i);
        await iVault.connect(operator).delegateToOperator(operatorAddress, amount);
        expect(await iVault.getDelegatedTo(operatorAddress)).to.be.closeTo(amount, transactErr);
      }
    });

    it("Stakers withdraw", async function () {
      const staker1Amount = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(staker1Amount, staker.address);
      const staker2Amount = await iToken.balanceOf(staker2.address);
      await iVault.connect(staker2).withdraw(staker2Amount, staker2.address);
    });

    it("undelegateFrom each operator and claim", async function () {
      for (const operatorAddress of operators) {
        const amount = await iVault.getDelegatedTo(operatorAddress);
        let tx = await iVault.connect(operator).undelegateFrom(operatorAddress, amount);
        const data = await withdrawDataFromTx(tx, iVault, operatorAddress);
        withdrawalData.push(data);
      }
      console.log(withdrawalData);
    });

    it("claim from EL", async function () {
      await mineBlocks(15);
      let i = 0;
      for (const data of withdrawalData) {
        console.log(`Withdraw #${++i}`);
        await iVault.claimCompletedWithdrawals([data]);
      }
      const totalAssetsAfter = await iVault.totalAssets();

      console.log(`Total assets before: ${format(totalAssetsBefore)}`);
      console.log(`Total assets after: ${format(totalAssetsAfter)}`);
      console.log(`Total pending wwls: ${format(await iVault.totalAmountToWithdraw())}`);

      expect(totalAssetsAfter).to.be.closeTo(totalAssetsBefore, transactErr * operators.length);

      await asset.connect(donor).approve(iVault.address, 1000);
      await iVault.connect(donor).deposit(1000, donor.address);
      await iVault.connect(operator).updateEpoch();

      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });
  });

  describe("undelegateFrom with invalid params", function () {
    beforeEach(async function () {
      await snapshotter.revert();
      await iVault.connect(staker).deposit(randomBN(19), staker.address);
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
      console.log(`Delegated amount: \t${format(amount)}`);
    });

    const invalidArgs = [
      {
        name: "0 amount",
        amount: async () => toBN(0),
        stakerOperator: async () => stakerOperator1,
        operator: () => operator,
        error: "StrategyManager._removeShares: shareAmount should not be zero!",
      },
      {
        name: "from unknown operator",
        amount: async () => await iVault.getDelegatedTo(stakerOperator1),
        stakerOperator: async () => randomAddress(),
        operator: () => operator,
        isCustom: true,
        error: "OperatorNotRegistered",
      },
      {
        name: "from _MOCK_ADDRESS",
        amount: async () => await iVault.getDelegatedTo(stakerOperator1),
        stakerOperator: async () => "0x0000000000000000000000000010000000000000",
        operator: () => operator,
        isCustom: true,
        error: "OperatorNotRegistered",
      },
      {
        name: "from zero address",
        amount: async () => await iVault.getDelegatedTo(stakerOperator1),
        stakerOperator: async () => ethers.constants.AddressZero,
        operator: () => operator,
        isCustom: true,
        error: "OperatorNotRegistered",
      },
      {
        name: "not an operator",
        amount: async () => await iVault.getDelegatedTo(stakerOperator1),
        stakerOperator: async () => ethers.constants.AddressZero,
        operator: () => staker,
        error: "InceptionVault: only operator allowed",
      },
    ];

    invalidArgs.forEach(function (arg) {
      it(`Reverts: when undelegates ${arg.name}`, async function () {
        const amount = await arg.amount();
        const stakerOperator = await arg.stakerOperator();
        console.log(`Undelegate amount: \t${format(amount)}`);
        if (arg.isCustom) {
          await expect(iVault.connect(arg.operator()).undelegateFrom(stakerOperator, amount)).to.be.revertedWithCustomError(
            iVault,
            arg.error
          );
        } else {
          await expect(iVault.connect(arg.operator()).undelegateFrom(stakerOperator, amount)).to.be.revertedWith(arg.error);
        }
      });
    });
  });

  describe("undelegateFrom and redeem in a loop", function () {
    let ratio,
      stakers,
      withdrawals = new Map();

    before(async function () {
      await snapshotter.revert();
      stakers = [staker, staker2];
      //Deposit and delegate
      for (const s of stakers) {
        await iVault.connect(s).deposit(randomBN(19), s.address);
      }
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
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

        //Withdraw EL#1
        const totalPW1 = await iVault.totalAmountToWithdraw();
        console.log(`Total pending withdrawals#1: ${totalPW1}`);
        let tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, totalPW1);
        const w1data = await withdrawDataFromTx(tx, iVault, stakerOperator1);
        const totalPWEL1 = await iVault.getPendingWithdrawalAmountFromEL();
        expect(totalPWEL1).to.be.closeTo(totalPW1, transactErr);

        //Withdraw staker and staker2
        for (const s of stakers) {
          const shares = randomBN(16);
          await iVault.connect(s).withdraw(shares, s.address);
          const w = withdrawals.get(s.address);
          withdrawals.set(s.address, w.add(shares));
        }

        //Withdraw EL#2
        const totalPW2 = await iVault.totalAmountToWithdraw();
        tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, totalPW2.sub(totalPWEL1));
        const w2data = await withdrawDataFromTx(tx, iVault, stakerOperator1);
        const totalPWEL2 = await iVault.getPendingWithdrawalAmountFromEL();
        expect(totalPWEL2.sub(totalPWEL1)).to.be.closeTo(totalPW2.sub(totalPW1), transactErr);

        await mineBlocks(15);
        //ClaimEL w1
        await iVault.connect(staker).claimCompletedWithdrawals([w1data]);
        expect(await iVault.totalAssets()).to.be.closeTo(totalPW1, transactErr * 4 * (i + 1));
        //ClaimEL w2
        await iVault.connect(staker).claimCompletedWithdrawals([w2data]);
        expect(await iVault.totalAssets()).to.be.closeTo(totalPW2, transactErr * 4 * (i + 1));
        expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.eq(0); //Everything was claims from EL;
        console.log(`Total pwwls: ${format(totalPWEL2)}`);
        console.log(`Total assets: ${format(await iVault.totalAssets())}`);

        const staker1BalanceBefore = await asset.balanceOf(staker.address);
        const staker2BalanceBefore = await asset.balanceOf(staker2.address);
        const staker1PW = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);

        //Staker1 redeems
        console.log(`### Staker1 redeems`);
        const staker1RedeemBefore = await iVault.isAbleToRedeem(staker.address);
        console.log(`Staker redeem epoch ${staker1RedeemBefore}`);
        expect(staker1RedeemBefore[0]).to.be.true;
        await iVault.redeem(staker.address);
        const staker1BalanceAfter = await asset.balanceOf(staker.address);
        expect(await iVault.getPendingWithdrawalOf(staker.address)).to.be.eq(0);
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
        expect(staker1BalanceAfter.sub(staker1BalanceBefore)).to.be.closeTo(staker1PW, transactErr * 2);

        //Staker2 redeems
        console.log(`### Staker2 redeems`);
        const staker2RedeemBefore = await iVault.isAbleToRedeem(staker2.address);
        console.log(`Staker redeem epoch ${staker2RedeemBefore}`);
        expect(staker2RedeemBefore[0]).to.be.true;
        await iVault.redeem(staker2.address);
        const staker2BalanceAfter = await asset.balanceOf(staker2.address);
        expect(await iVault.getPendingWithdrawalOf(staker2.address)).to.be.eq(0);
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
        expect(staker2BalanceAfter.sub(staker2BalanceBefore)).to.be.closeTo(staker2PW, transactErr * 2);
        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });
    }

    it("Stakers withdraw all and redeem", async function () {
      //Stakers withdraw all
      console.log(`Total pending withdrawals: ${format(await iVault.totalAmountToWithdraw())}`);
      for (const s of stakers) {
        const shares = await iToken.balanceOf(s.address);
        await iVault.connect(s).withdraw(shares, s.address);
        const w = withdrawals.get(s.address);
        withdrawals.set(s.address, w.add(shares));
      }
      //Withdraw and claim from EL
      const amount = await iVault.totalAmountToWithdraw();
      await iVault.withdrawFromELAndClaim(stakerOperator1, amount);

      //Stakers redeem
      let stakerCounter = 1;
      for (const s of stakers) {
        console.log(`iToken balance staker${stakerCounter} before:\t\t${await iToken.balanceOf(s.address)}`);
        console.log(`iVault assets before:\t\t\t\t${format(await iVault.totalAssets())}`);
        console.log(`Pending withdrawal staker${stakerCounter} before:\t${format(await iVault.getPendingWithdrawalOf(s.address))}`);
        console.log(`### Staker${stakerCounter} redeems`);
        await iVault.redeem(s.address);
        console.log(`Pending withdrawal staker${stakerCounter} after:\t${format(await iVault.getPendingWithdrawalOf(s.address))}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
        stakerCounter++;
      }
      expect(await iVault.totalAssets()).to.be.lt(100);
    });
  });

  describe("claimCompletedWithdrawals: claims withdraw from EL", function () {
    let ratio, delegatedAmount, withdrawalAmount, withdrawalData, withdrawalCount;

    before(async function () {
      await snapshotter.revert();
      ratio = await iVault.ratio();

      //Deposit and withdraw
      await iVault.connect(staker).deposit(toWei(10), staker.address);
      delegatedAmount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, delegatedAmount);

      //Withdraw 10 times
      withdrawalCount = 10;
      for (let i = 0; i < withdrawalCount; i++) {
        await iVault.connect(staker).withdraw(randomBN(18), staker.address);
      }
      withdrawalAmount = await iVault.getPendingWithdrawalOf(staker.address);
      console.log(`Pending withdrawals: ${withdrawalAmount}`);

      const tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, withdrawalAmount);
      const receipt = await tx.wait();
      const WithdrawalQueuedEvent = receipt.events[0].args;

      withdrawalData = [
        WithdrawalQueuedEvent["stakerAddress"],
        stakerOperator1,
        iVault.address,
        WithdrawalQueuedEvent["nonce"],
        WithdrawalQueuedEvent["withdrawalStartBlock"],
        [WithdrawalQueuedEvent["strategy"]],
        [WithdrawalQueuedEvent["shares"]],
      ];
    });

    it("Reverts: when claim without delay", async function () {
      await expect(iVault.connect(staker).claimCompletedWithdrawals([withdrawalData])).to.be.revertedWith(
        "DelegationManager.completeQueuedAction: withdrawalDelayBlocks period has not yet passed"
      );
    });

    it("Successful claim from EL", async function () {
      await mineBlocks(15);
      console.log(`iVault assets before: ${await iVault.totalAssets()}`);
      const epochBefore = await iVault.epoch();

      await iVault.connect(staker).claimCompletedWithdrawals([withdrawalData]);
      console.log(`iVault assets after: ${await iVault.totalAssets()}`);

      expect(await iVault.getPendingWithdrawalOf(staker.address)).to.be.closeTo(withdrawalAmount, transactErr);
      expect(await iVault.totalAssets()).to.be.closeTo(withdrawalAmount, transactErr);
      expect(await iVault.epoch()).to.be.eq(withdrawalCount - 1);
      expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
    });

    it("getTotalDeposited() = iVault + EL", async function () {
      const amount = await iVault.getTotalDeposited();
      console.log(`getTotalDeposited: ${amount}`);
      expect(amount).to.be.closeTo(delegatedAmount, transactErr);
    });

    it("Reverts: when claim the 2nd time", async function () {
      await expect(iVault.connect(staker).claimCompletedWithdrawals([withdrawalData])).to.be.revertedWith(
        "DelegationManager.completeQueuedAction: action is not in queue"
      );
    });
  });

  describe("redeem: withdraw can be retrieved from iVault", function () {
    let ratio, stakerAmount, staker2Amount, stakerUnstakeAmount, staker2UnstakeAmount, firstDeposit;

    before(async function () {
      await snapshotter.revert();
      await asset.connect(donor).approve(iVault.address, e18);
      await iVault.connect(donor).deposit(e18, donor.address);
      firstDeposit = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, firstDeposit);
      ratio = await iVault.ratio();
    });

    it("Stakers deposit", async function () {
      stakerAmount = toBN("9399680561290658040");
      await iVault.connect(staker).deposit(stakerAmount, staker.address);
      staker2Amount = toBN("1348950494309030813");
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
      await iVault.connect(operator).delegateToOperator(stakerOperator1, await iVault.totalAssets());
      console.log(`Staker amount: ${stakerAmount}`);
      console.log(`Staker2 amount: ${staker2Amount}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker has nothing to claim yet", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
    });

    it("Staker withdraws half", async function () {
      const shares = await iToken.balanceOf(staker.address);
      stakerUnstakeAmount = shares.div(2);
      await iVault.connect(staker).withdraw(stakerUnstakeAmount, staker.address);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is not able to claim yet", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
    });

    it("Reverts: when redeems the same epoch", async function () {
      await expect(iVault.connect(operator).redeem(staker.address)).to.be.revertedWith("InceptionVault: redeem can not be proceed");
    });

    it("Withdraw and claim from EL 1", async function () {
      const amount = await iVault.totalAmountToWithdraw();
      await iVault.withdrawFromELAndClaim(stakerOperator1, amount);
      console.log(`Total assets:\t\t${format(await iVault.totalAssets())}`);
      console.log(`Pending withdrawals:\t${format(await iVault.getPendingWithdrawalOf(staker.address))}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is now able to claim", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Staker2 withdraws < staker pending withdrawal", async function () {
      const stakerPendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
      staker2UnstakeAmount = stakerPendingWithdrawal.div(10);
      await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
    });

    it("Staker2 is not able to claim yet", async function () {
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
    });

    it("Staker is still able to claim", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Reverts: when staker2 redeems out of turn", async function () {
      await expect(iVault.connect(operator).redeem(staker2.address)).to.be.revertedWith("InceptionVault: redeem can not be proceed");
    });

    it("New withdrawal is going to the end of the queue", async function () {
      const shares = (await iToken.balanceOf(staker.address)).div(2);
      await iVault.connect(staker).withdraw(shares, staker.address);
      stakerUnstakeAmount = stakerUnstakeAmount.add(shares);
      console.log(`Pending withdrawals: ${await iVault.getPendingWithdrawalOf(staker.address)}`);
      console.log(`Unstake amount: ${stakerUnstakeAmount.toString()}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is still able to claim", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
    });

    it("Withdraw and claim from EL to cover only staker2 withdrawal", async function () {
      const amount = await iVault.getPendingWithdrawalOf(staker2.address);
      await iVault.withdrawFromELAndClaim(stakerOperator1, amount.add(transactErr * 2));
      console.log(`Total assets:\t\t${format(await iVault.totalAssets())}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Staker is able to claim only the 1st wwl", async function () {
      const ableRedeem = await iVault.isAbleToRedeem(staker.address);
      expect(ableRedeem[0]).to.be.true;
      expect(ableRedeem[1].map((n) => n.toNumber())).to.have.members([0]);
    });

    it("Staker2 is able to claim", async function () {
      const ableRedeem = await iVault.isAbleToRedeem(staker2.address);
      expect(ableRedeem[0]).to.be.true;
      expect(ableRedeem[1].map((n) => n.toNumber())).to.have.members([1]);
    });

    it("Deposit and update epoch to cover pending wwls", async function () {
      const totalPWBefore = await iVault.totalAmountToWithdraw();
      const redeemReserveBefore = await iVault.redeemReservedAmount();
      console.log(`Total pending wwls: ${format(totalPWBefore)}`);
      console.log(`Redeem reserver before: ${format(redeemReserveBefore)}`);

      const amount = totalPWBefore.sub(redeemReserveBefore).add(100);
      await asset.connect(donor).approve(iVault.address, amount);
      await iVault.connect(donor).deposit(amount, donor.address);

      await expect(iVault.connect(staker).updateEpoch()).to.be.revertedWith("InceptionVault: only operator allowed");

      await iVault.connect(operator).updateEpoch();

      const redeemReserveAfter = await iVault.redeemReservedAmount();
      console.log(`Redeem reserver after: ${format(redeemReserveAfter)}`);
      expect(redeemReserveAfter).to.be.closeTo(totalPWBefore, transactErr * 4);

      const ableRedeem = await iVault.isAbleToRedeem(staker.address);
      console.log(`Staker redeem: ${ableRedeem}`);
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      expect(ableRedeem[1].map((n) => n.toNumber())).to.have.members([0, 2]);
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
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);
      console.log(`stakerUnstakeAmountAssetValue: ${stakerUnstakeAmountAssetValue}`);
      console.log(`stakerPendingWithdrawalsBefore[0]: ${stakerPendingWithdrawalsBefore}`);

      expect(stakerPendingWithdrawalsBefore.sub(stakerPendingWithdrawalsAfter)).to.be.closeTo(
        stakerUnstakeAmountAssetValue,
        transactErr * 2
      );
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
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
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);
      const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(staker2UnstakeAmount);
      expect(stakerPendingWithdrawalsBefore.sub(stakerPendingWithdrawalsAfter)).to.be.closeTo(
        stakerUnstakeAmountAssetValue,
        transactErr * 2
      );
      expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Ratio is ok after all", async function () {
      expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
    });
  });

  describe("redeem: to many addresses", function () {
    let ratio, recipients, pendingShares;

    before(async function () {
      await snapshotter.revert();
      await iVault.connect(staker).deposit("9292557565124725653", staker.address);
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
    });

    const count = 3;
    for (let j = 0; j < count; j++) {
      it(`${j} Withdraw to 5 random addresses`, async function () {
        recipients = [];
        pendingShares = toBN(0);
        for (let i = 0; i < 5; i++) {
          const recipient = randomAddress();
          const shares = randomBN(17);
          pendingShares = pendingShares.add(shares);
          await iVault.connect(staker).withdraw(shares, recipient);
          recipients.push(recipient);
        }
      });

      it(`${j} Withdraw from EL and update ratio`, async function () {
        const amount = await iVault.totalAmountToWithdraw();
        let tx = await iVault.connect(operator).undelegateFrom(stakerOperator1, amount);
        const data = await withdrawDataFromTx(tx, iVault, stakerOperator1);

        await updateStrategyRatio(rEthStrategyAddress, e18, donor);
        ratio = await iVault.ratio();
        console.log(`New ratio is: ${ratio}`);

        await mineBlocks(15);
        await iVault.connect(staker).claimCompletedWithdrawals([data]);
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

          expect(rBalanceAfter.sub(rPendingWithdrawalsBefore)).to.be.closeTo(0, transactErr);
          expect(rBalanceBefore.sub(rPendingWithdrawalsAfter)).to.be.closeTo(0, transactErr);
        }
        expect(await iVault.ratio()).to.be.lte(ratio);
        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it(`${j} Deposit extra from iVault`, async function () {
        const totalDepositedBefore = await iVault.getTotalDeposited();

        const amount = await iVault.totalAssets();
        await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
        const totalDepositedAfter = await iVault.getTotalDeposited();

        console.log(`Total assets: ${await iVault.totalAssets()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);

        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(await iVault.totalAssets()).to.be.lte(100);
        expect(await iVault.ratio()).to.be.lte(ratio);
      });
    }

    it("Update asset ratio and withdraw the rest", async function () {
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      ratio = await iVault.ratio();
      console.log(`New ratio is: ${ratio}`);

      //Withdraw all and take from EL
      const shares = await iToken.balanceOf(staker.address);
      await iVault.connect(staker).withdraw(shares, staker.address);

      const amount = await iVault.getTotalDelegated();
      await iVault.withdrawFromELAndClaim(stakerOperator1, amount);
      await iVault.connect(operator).redeem(staker.address);

      console.log(`iVault total assets: ${await iVault.totalAssets()}`);
      console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
    });
  });

  describe("Redeem all after asset ratio changed", function () {
    let staker1UnstakeAmount, staker2UnstakeAmount, withdrawRatio;

    before(async function () {
      await snapshotter.revert();
    });

    it("Stakers deposit and delegate", async function () {
      const staker1Amount = toBN("9399680561290658040");
      await iVault.connect(staker).deposit(staker1Amount, staker.address);
      const staker2Amount = toBN("1348950494309030813");
      await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
      console.log(`Staker desposited:\t${format(staker1Amount)}`);
      console.log(`Staker2 deposited:\t${format(staker2Amount)}`);
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
      console.log(`Ratio after delegation:\t${await iVault.ratio()}`);
    });

    it("Change ratio - transfer to strategy", async function () {
      console.log(`Ratio before:\t${await iVault.ratio()}`);
      await updateStrategyRatio(rEthStrategyAddress, e18, donor);
      withdrawRatio = await iVault.ratio();
      console.log(`Ratio after update:\t${withdrawRatio}`);
    });

    it("Staker1 withdraws", async function () {
      staker1UnstakeAmount = await iToken.balanceOf(staker.address);
      expect(staker1UnstakeAmount).to.be.gt(0);
      const expectedPending = await iVault.convertToAssets(staker1UnstakeAmount);
      await iVault.connect(staker).withdraw(staker1UnstakeAmount, staker.address);
      const pendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
      console.log(`Pending withdrawal: ${format(pendingWithdrawal)}`);

      expect(pendingWithdrawal).to.be.closeTo(expectedPending, transactErr);
      expect(pendingWithdrawal).to.be.closeTo(staker1UnstakeAmount.mul(e18).div(withdrawRatio), transactErr * 2);
      console.log(`Ratio after: ${await iVault.ratio()}`);
    });

    it("Staker2 withdraws", async function () {
      staker2UnstakeAmount = await iToken.balanceOf(staker2.address);
      expect(staker2UnstakeAmount).to.be.gt(0);
      const expectedPending = await iVault.convertToAssets(staker2UnstakeAmount);
      await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
      const pendingWithdrawal = await iVault.getPendingWithdrawalOf(staker2.address);
      console.log(`Pending withdrawal: ${format(pendingWithdrawal)}`);

      expect(pendingWithdrawal).to.be.closeTo(expectedPending, transactErr);
      expect(pendingWithdrawal).to.be.closeTo(staker2UnstakeAmount.mul(e18).div(withdrawRatio), transactErr * 2);
      console.log(`Ratio after: ${await iVault.ratio()}`);
    });

    it("Withdraw and claim from EL", async function () {
      console.log(`Total assets before: ${format(await iVault.totalAssets())}`);
      const amount = await iVault.totalAmountToWithdraw();
      await iVault.withdrawFromELAndClaim(stakerOperator1, amount);
      console.log(`Total assets after: ${format(await iVault.totalAssets())}`);
      console.log(`Ratio: ${await iVault.ratio()}`);
    });

    it("Stakers are able to redeem", async function () {
      expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
    });

    it("Staker redeems withdrawals", async function () {
      console.log(`Ratio: ${await iVault.ratio()}`);
      const stakerBalanceBefore = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
      await iVault.redeem(staker.address);
      const stakerBalanceAfter = await asset.balanceOf(staker.address);
      const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

      console.log(`Staker balance after: ${format(stakerBalanceAfter)}`);
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);

      expect(stakerPendingWithdrawalsBefore.sub(stakerPendingWithdrawalsAfter)).to.be.closeTo(
        stakerBalanceAfter.sub(stakerBalanceBefore),
        transactErr
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
      console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);

      expect(stakerPendingWithdrawalsBefore.sub(stakerPendingWithdrawalsAfter)).to.be.closeTo(
        stakerBalanceAfter.sub(stakerBalanceBefore),
        transactErr
      );
      console.log(`Ratio: ${await iVault.ratio()}`);
    });
  });

  describe("iToken ratio depends on the ratio of strategies", function () {
    let ratio;

    before(async function () {
      await snapshotter.revert();
      await iVault.connect(staker).deposit(e18, staker.address);
      const amount = await iVault.totalAssets();
      await iVault.connect(operator).delegateToOperator(stakerOperator1, amount);
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

        await updateStrategyRatio(rEthStrategyAddress, test.amount, staker2);

        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${ratioBefore}`);
        console.log(`Ratio after:\t${ratioAfter}`);

        expect(ratioAfter).to.be.lt(ratioBefore);
      });
    });
  });
});
