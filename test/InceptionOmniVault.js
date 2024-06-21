const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const { takeSnapshot } = require("@nomicfoundation/hardhat-network-helpers");
const { toWei, randomBI, e18, randomBIMax, addRewardsToStrategy } = require("./helpers/utils");


BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

async function init() {
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- Omni vault");
  const iVaultFactory = await ethers.getContractFactory("InstEthOmniVault");
  const omniVault = await upgrades.deployProxy(iVaultFactory, [iToken.address]);
  omniVault.address = await omniVault.getAddress();

  await iToken.setVault(omniVault.address);

  return [iToken, omniVault];
}

describe("Inception omni vault", function() {
  this.timeout(150000);
  let omniVault, iToken;
  let owner, staker1, staker2, staker3;
  let snapshot;
  let TARGET;

   before(async function() {
     [owner, staker1, staker2, staker3] = await ethers.getSigners();
     [iToken, omniVault] = await init();
     snapshot = await takeSnapshot();
   })

  describe("Base flow", function() {
    let deposited, freeBalance, depositFees;

    before(async function() {
      await snapshot.restore();
      TARGET = toWei(10);
      await omniVault.setTargetFlashCapacity(TARGET);
    })

    it("Initial ratio", async function() {
      const ratio = await omniVault.ratio();
      console.log(`Initial ratio:\t\t${ratio.format()}`);
    })

    it("Initial total deposited", async function() {
      const initialDeposit = await omniVault.getTotalDeposited();
      console.log(`Initial deposited:\t${initialDeposit.format()}`);
      expect(initialDeposit).to.be.eq(0n);
    })

    it("Deposit to vault", async function() {
      freeBalance = randomBI(19);
      deposited = TARGET + freeBalance;
      const expectedShares = (deposited * e18) / (await omniVault.ratio());
      const tx = await omniVault.connect(staker1).deposit(staker1.address, {value: deposited});
      const receipt = await tx.wait();
      const events = receipt.logs?.filter((e) => e.eventName === "Deposit");
      expect(events.length).to.be.eq(1);
      expect(events[0].args["sender"]).to.be.eq(staker1.address);
      expect(events[0].args["receiver"]).to.be.eq(staker1.address);
      expect(events[0].args["amount"]).to.be.eq(deposited);
      expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, 1n);
      expect(receipt.logs.find((l) => l.eventName === 'DepositBonus')).to.be.undefined; //Because there is no bonus collected yet
      console.log(`Ratio after:\t\t${(await omniVault.ratio()).format()}`);

      expect(await iToken.balanceOf(staker1.address)).to.be.closeTo(expectedShares, 1n);
      expect(await omniVault.totalAssets()).to.be.eq(deposited);
      expect(await omniVault.getFlashCapacity()).to.be.eq(deposited);
      expect(await omniVault.getTotalDeposited()).to.be.eq(deposited);
      expect(await omniVault.ratio()).to.be.eq(e18);
    })

    it("Flash withdraw all", async function () {
      const sharesBefore = await iToken.balanceOf(staker1);
      const senderBalanceBefore = await ethers.provider.getBalance(staker1);
      const receiver = staker2;
      const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
      const treasuryBalanceBefore = await ethers.provider.getBalance(owner);
      const totalDepositedBefore = await omniVault.getTotalDeposited();
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
      const withdrawEvent = receipt.logs?.filter((e) => e.eventName === "Withdraw");
      expect(withdrawEvent.length).to.be.eq(1);
      expect(withdrawEvent[0].args["sender"]).to.be.eq(staker1.address);
      expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
      expect(withdrawEvent[0].args["owner"]).to.be.eq(staker1.address);
      expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
      expect(withdrawEvent[0].args["iShares"]).to.be.eq(sharesBefore);
      //DepositBonus event
      const collectedFees = receipt.logs.find((l) => l.eventName === 'FlashWithdrawFee').args.amount;
      depositFees = collectedFees / 2n;
      expect(collectedFees).to.be.closeTo(expectedFee, 1n);

      const sharesAfter = await iToken.balanceOf(staker1);
      const senderBalanceAfter = await ethers.provider.getBalance(staker1);
      const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
      const treasuryBalanceAfter = await ethers.provider.getBalance(owner);
      const totalDepositedAfter = await omniVault.getTotalDeposited();
      const totalAssetsAfter = await omniVault.totalAssets();
      const flashCapacityAfter = await omniVault.getFlashCapacity();
      console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
      console.log(`Sender balance diff:\t${(senderBalanceBefore - senderBalanceAfter).format()}`);
      console.log(`Receiver balance diff:\t${(receiverBalanceAfter - receiverBalanceBefore).format()}`);
      console.log(`Treasury balance diff:\t${(treasuryBalanceAfter - treasuryBalanceBefore).format()}`);
      console.log(`Total deposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
      console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
      console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
      console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

      expect(sharesBefore - sharesAfter).to.be.eq(sharesBefore);
      expect(senderBalanceBefore - senderBalanceAfter).to.be.closeTo(txFee, 1n);
      expect(receiverBalanceAfter - receiverBalanceBefore).to.be.closeTo(amount - expectedFee, 1n);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 1n);
      expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, 1n);
      expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, 1n);
      expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
    });
  })

  describe("Deposit", function () {
    let ratio;

    const states = [
      {
        name: "with bonus",
        withBonus: true,
      },
      {
        name: "without bonus",
        withBonus: false,
      },
    ]

    const amounts = [
      {
        name: "for the first time",
        predepositAmount: () => 0n,
        amount: async () => randomBIMax(TARGET / 4n) + TARGET / 4n,
        receiver: () => staker1.address,
      },
      {
        name: "more",
        predepositAmount: () => TARGET / 3n,
        amount: async () => randomBIMax(TARGET / 3n),
        receiver: () => staker1.address,
      },
      {
        name: "min amount",
        predepositAmount: () => TARGET / 3n,
        amount: async () => randomBIMax(TARGET / 3n),
        receiver: () => staker1.address,
      },
      {
        name: "up to target cap",
        predepositAmount: () => TARGET / 10n,
        amount: async () => TARGET * 9n / 10n,
        receiver: () => staker1.address,
      },
      {
        name: "all rewards",
        predepositAmount: () => 0n,
        amount: async () => TARGET,
        receiver: () => staker1.address,
      },
      {
        name: "up to target cap and above",
        predepositAmount: () => TARGET / 10n,
        amount: async () => TARGET,
        receiver: () => staker1.address,
      },
      {
        name: "above target cap",
        predepositAmount: () => TARGET,
        amount: async () => randomBI(19),
        receiver: () => staker1.address,
      },
    ]

    states.forEach(function (state) {
      let localSnapshot;
      let totalBonus = 0n;
      it(`---Prepare state: ${state.name}`, async function () {
        await snapshot.restore();
        ratio = await omniVault.ratio();
        TARGET = toWei(100);
        await omniVault.setTargetFlashCapacity(TARGET);
        if (state.withBonus) {
          await omniVault.connect(staker3).deposit(staker3.address, {value: TARGET/4n});
          const balanceOf = await iToken.balanceOf(staker3.address);
          const tx = await omniVault.connect(staker3).flashWithdraw(balanceOf, staker3.address);
          const rec = await tx.wait();
          const collectedFee = rec.logs.find((l) => l.eventName === 'FlashWithdrawFee')?.args.amount || 0n;
          totalBonus += collectedFee / 2n;
        }
        console.log(`Total assets:\t\t${(await omniVault.totalAssets()).format()}`);
        console.log(`Flash pool:\t\t\t${(await omniVault.getFlashCapacity()).format()}`);
        console.log(`Available bonus:\t${totalBonus.format()}`);
        console.log(`Initial ratio:\t\t${(await omniVault.ratio()).format()}`);
        expect(await omniVault.getFlashCapacity()).to.be.closeTo(0n, 2n);
        expect(await omniVault.totalAssets()).to.be.closeTo(totalBonus, 2n);
        localSnapshot = await takeSnapshot();
      })

      amounts.forEach(function (arg) {
        it(`Deposit ${arg.name}`, async function () {
          if (localSnapshot) {
            await localSnapshot.restore();
          } else {
            expect(false).to.be.true("Can not restore local snapshot");
          }
          const ratioBefore = await omniVault.ratio();

          //Deposit 1st time
          let availableBonus = totalBonus;
          const predepositAmount = arg.predepositAmount();
          let flashCapacityBefore = predepositAmount;
          const receiver = arg.receiver();
          if (predepositAmount > 0n) {
            const calculatedPredepositBonus = await omniVault.calculateDepositBonus(predepositAmount);
            const expectedPredepositBonus = availableBonus > calculatedPredepositBonus ? calculatedPredepositBonus : availableBonus;
            availableBonus -= expectedPredepositBonus;
            flashCapacityBefore += expectedPredepositBonus;
            let tx = await omniVault.connect(staker3).deposit(staker3, {value: predepositAmount});
            let rec = await tx.wait();
            let bonus = (rec.logs.find((l) => l.eventName === 'DepositBonus')?.args.amount || 0n);
            console.log(`Predeposit expected bonus:\t${expectedPredepositBonus.format()}`);
            console.log(`Predeposit actual bonus:\t${bonus.format()}`);
            console.log(`Bonus left:\t\t\t\t${availableBonus.format()}`);
            expect(await omniVault.getFlashCapacity()).to.be.closeTo(flashCapacityBefore, 2n);
          }
          console.log(`Ratio after predeposit:\t${(await omniVault.ratio()).format()}`);
          console.log('--------------------------------');

          const stakerSharesBefore = await iToken.balanceOf(receiver);
          const totalDepositedBefore = await omniVault.getTotalDeposited();
          const totalAssetsBefore = await omniVault.totalAssets();
          console.log(`Target:\t\t\t\t\t${TARGET.format()}`);
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          console.log(`Amount:\t\t\t\t\t${amount.format()}`);
          const calculatedBonus = await omniVault.calculateDepositBonus(amount);
          console.log(`calculatedBonus:\t\t${calculatedBonus.format()}`);
          console.log(`available bonus:\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t${expectedBonus.format()}`);
          const convertedShares = await omniVault.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await omniVault.ratio())) / e18;

          const tx = await omniVault.connect(staker1).deposit(receiver, {value: amount});
          const receipt = await tx.wait();
          const depositEvent = receipt.logs?.filter((e) => e.eventName === "Deposit");
          expect(depositEvent.length).to.be.eq(1);
          console.log(depositEvent[0].args);
          expect(depositEvent[0].args["sender"]).to.be.eq(staker1.address);
          expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
          expect(depositEvent[0].args["amount"]).to.be.eq(amount);
          console.log(receipt.logs.find((l) => l.eventName === 'DepositBonus')?.args.amount);
          expect(depositEvent[0].args["iShares"]).to.be.closeTo(convertedShares, 1n);
          //DepositBonus event
          expect(receipt.logs.find((l) => l.eventName === 'DepositBonus')?.args.amount || 0n).to.be.closeTo(expectedBonus, 1n);

          const stakerSharesAfter = await iToken.balanceOf(receiver);
          const totalDepositedAfter = await omniVault.getTotalDeposited();
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          const ratioAfter = await omniVault.ratio();
          console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
          console.log(`Bonus after:\t\t\t${availableBonus.format()}`);

          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, 1n);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, 1n);

          expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount + expectedBonus, 1n);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.eq(amount); //Everything stays on omniVault after deposit
          expect(flashCapacityAfter).to.be.closeTo(flashCapacityBefore + amount + expectedBonus, 1n);
          expect(ratioAfter).to.be.closeTo(ratioBefore, 1n); //Ratio stays the same
        })
      })
    })
  })

})