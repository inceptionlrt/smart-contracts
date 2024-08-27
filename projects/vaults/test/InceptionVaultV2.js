const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const config = require("../hardhat.config");
const { expect } = require("chai");
const {
  addRewardsToStrategy,
  withdrawDataFromTx,
  impersonateWithEth,
  getRandomStaker,
  calculateRatio,
  mineBlocks,
  toWei,
  randomBI,
  randomBIMax,
  randomAddress,
  e18,
  day
} = require("./helpers/utils.js");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

assets = [
  {
    assetName: "rETH",
    assetAddress: "0x7322c24752f79c05FFD1E2a6FCB97020C1C264F1",
    assetPoolName: "RocketMockPool",
    assetPool: "0x320f3aAB9405e38b955178BBe75c477dECBA0C27",
    vaultName: "InrEthVault",
    vaultFactory: "InVault_E2",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    assetStrategy: "0x3A8fBdf9e77DFc25d09741f51d3E181b25d0c4E0",
    iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    withdrawalDelayBlocks: 400,
    ratioErr: 2n,
    transactErr: 5n,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x570EDBd50826eb9e048aA758D4d78BAFa75F14AD", toWei(1));
      await asset.connect(donor).transfer(staker.address, toWei(1000));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
  {
    assetName: "stETH",
    assetAddress: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    assetPoolName: "LidoMockPool",
    assetPool: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    vaultName: "InstEthVault",
    vaultFactory: "InVault_E2",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    assetStrategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
    iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    withdrawalDelayBlocks: 20,
    ratioErr: 3n,
    transactErr: 5n,
    // blockNumber: 17453047,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x66b25CFe6B9F0e61Bd80c4847225Baf4EE6Ba0A2", toWei(1));
      await asset.connect(donor).transfer(staker.address, toWei(1000));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
];

//https://holesky.eigenlayer.xyz/restake
const nodeOperators = [
  "0x78FDDe7a5006cC64E109aeD99cA7B0Ad3d8687bb",
  "0x1B71f18fc496194b21D0669B5ADfE299a8cFEc42",
  "0x4Dbfa8bcccb1740d8044E1A093F9A078A88E45FE",
  "0x5B9A8c72B29Ee17e72ba8B9626Bf43a75B15FB3d",
  "0x139A091BcAad0ee1DAabe93cbBd194736B197FB6",
];
const minWithdrawalDelayBlocks = 10;
const nodeOperatorToRestaker = new Map();
const forcedWithdrawals = [];
let MAX_TARGET_PERCENT;

const initVault = async a => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
  console.log("- Asset pool");
  const assetPool = await ethers.getContractAt(a.assetPoolName, a.assetPool);
  console.log("- Strategy");
  const strategy = await ethers.getContractAt("IStrategy", a.assetStrategy);

  // 1. Inception token
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();
  // 2. Impersonate operator
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);
  // 3. Staker implementation
  console.log("- Restaker implementation");
  const restakerImp = await ethers.deployContract("InceptionRestaker");
  restakerImp.address = await restakerImp.getAddress();
  // 4. Delegation manager
  console.log("- Delegation manager");
  const delegationManager = await ethers.getContractAt("IDelegationManager", a.delegationManager);
  await delegationManager.on("WithdrawalQueued", (newRoot, migratedWithdrawal) => {
    console.log(`===Withdrawal queued: ${migratedWithdrawal.shares[0]}`);
  });
  // 5. Ratio feed
  console.log("- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.updateRatioBatch([iToken.address], [e18]); //Set initial ratio e18
  ratioFeed.address = await ratioFeed.getAddress();
  // 6. Inception library
  console.log("- InceptionLibrary");
  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  // 7. Inception vault
  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });
  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [a.vaultName, a.iVaultOperator, a.strategyManager, iToken.address, a.assetStrategy],
    { unsafeAllowLinkedLibraries: true },
  );
  iVault.address = await iVault.getAddress();
  await iVault.on("DelegatedTo", (restaker, elOperator) => {
    nodeOperatorToRestaker.set(elOperator, restaker);
    console.log(`===Restaker to operator ${elOperator}, ${restaker}`);
  });
  await iVault.setDelegationManager(a.delegationManager);
  await iVault.upgradeTo(restakerImp.address);
  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.addELOperator(nodeOperators[0]);
  await iToken.setVault(iVault.address);
  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  // in % (100 * e18 == 100 %)
  await iVault.setTargetFlashCapacity(1n);
  console.log(`... iVault initialization completed ....`);

  iVault.withdrawFromELAndClaim = async function (nodeOperator, amount) {
    const tx = await this.connect(iVaultOperator).undelegateFrom(nodeOperator, amount);
    const restaker = nodeOperatorToRestaker.get(nodeOperator);
    const withdrawalData = await withdrawDataFromTx(tx, nodeOperator, restaker);
    await mineBlocks(minWithdrawalDelayBlocks);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(restaker, [withdrawalData]);
  };

  iVault.undelegateAndClaimVault = async function (nodeOperator, amount) {
    const tx = await this.connect(iVaultOperator).undelegateVault(amount);
    const restaker = await this.getAddress();
    const withdrawalData = await withdrawDataFromTx(tx, nodeOperator, restaker);
    await mineBlocks(minWithdrawalDelayBlocks);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(restaker, [withdrawalData]);
  };

  return [
    iToken,
    iVault,
    ratioFeed,
    asset,
    assetPool,
    strategy,
    iVaultOperator,
    restakerImp,
    delegationManager,
    iLibrary,
  ];
};

assets.forEach(function (a) {
  describe(`Inception pool V2 ${a.assetName}`, function () {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, assetPool, strategy, restakerImp, delegationManager, iLibrary;
    let iVaultOperator, deployer, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;

    before(async function () {
      if (process.env.ASSETS) {
        const assets = process.env.ASSETS.toLocaleLowerCase().split(",");
        if (!assets.includes(a.assetName.toLowerCase())) {
          console.log(`${a.assetName} is not in the list, going to skip`);
          this.skip();
        }
      }

      await network.provider.send("hardhat_reset", [
        {
          forking: {
            jsonRpcUrl: a.url ? a.url : config.default.networks.hardhat.forking.url,
            blockNumber: a.blockNumber ? a.blockNumber : config.default.networks.hardhat.forking.blockNumber,
          },
        },
      ]);

      [
        iToken,
        iVault,
        ratioFeed,
        asset,
        assetPool,
        strategy,
        iVaultOperator,
        restakerImp,
        delegationManager,
        iLibrary,
      ] = await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();
      staker = await a.impersonateStaker(staker, iVault, asset, assetPool);
      staker2 = await a.impersonateStaker(staker2, iVault, asset, assetPool);
      staker3 = await a.impersonateStaker(staker3, iVault, asset, assetPool);
      treasury = await iVault.treasury(); //deployer

      snapshot = await helpers.takeSnapshot();
    });

    after(async function () {
      if (iVault) {
        await iVault.removeAllListeners();
      }
      if (delegationManager) {
        await delegationManager.removeAllListeners();
      }
    });

    describe("Base flow", function () {
      let deposited, extra;
      before(async function () {
        await snapshot.restore();
      });

      it("Initial ratio is 1e18", async function () {
        const ratio = await iVault.ratio();
        console.log(`Current ratio is:\t\t\t\t${ratio.format()}`);
        expect(await iVault.asset()).to.be.eq(await asset.getAddress());
        expect(ratio).to.be.eq(e18);
      });

      it("Initial delegation is 0", async function () {
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
      });

      it("Deposit to Vault", async function () {
        deposited = toWei(20);
        const expectedShares = (deposited * e18) / (await iVault.ratio());
        const tx = await iVault.connect(staker).deposit(deposited, staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(deposited, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);
        console.log(`Ratio after: ${await iVault.ratio()}`);

        expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(deposited, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(deposited, transactErr);
        expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Delegate partially", async function () {
        const amount = (await iVault.totalAssets()) / 2n;
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        const delegatedTotal = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(nodeOperators[0]);
        expect(delegatedTotal).to.be.closeTo(amount, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(await iVault.ratio()).closeTo(e18, 1n);
      });

      it("Delegate all", async function () {
        const amount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        const delegatedTotal = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(nodeOperators[0]);
        expect(delegatedTotal).to.be.closeTo(deposited, transactErr);
        expect(delegatedTo).to.be.closeTo(deposited, transactErr);
        expect(await iVault.ratio()).lte(e18);
      });

      it("Update asset ratio", async function () {
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const ratio = await calculateRatio(iVault, iToken);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).lt(e18);
      });

      it("Withdraw all", async function () {
        const ratioBefore = await iVault.ratio();
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
        console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);
        const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.eq(assetValue);
        expect(events[0].args["iShares"]).to.be.eq(shares);

        const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const totalPW = await iVault.totalAmountToWithdraw();
        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
        expect(totalPW).to.be.closeTo(assetValue, transactErr);

        console.log(`Total delegated:\t\t\t\t${(await iVault.getTotalDelegated()).format()}`);
        expect(await iVault.ratio()).to.be.eq(ratioBefore);
      });

      it("Withdraw from EigenLayer and claim", async function () {
        const ratioBefore = await iVault.ratio();
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        let amount = await iVault.totalAmountToWithdraw();
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Staker2 pending withdrawals:\t${staker2PW.format()}`);

        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);
        extra = 0n;
        if (!(await iVault.isAbleToRedeem(staker2.address))[0]) {
          console.log(
            `--- Going to change target flash capacity and transfer 1000 wei${a.assetName} to iVault to supply withdrawals ---`,
          );
          await asset.connect(staker3).transfer(iVault.address, 1000n);
          extra += 1000n;
          await iVault.connect(staker3).updateEpoch();
        }

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const redeemReserve = await iVault.redeemReservedAmount();

        console.log(`Available withdrawals:\t${await iVault.isAbleToRedeem(staker2.address)}`);
        console.log(`Total deposited after:\t${totalDepositedAfter.format()}`);
        console.log(`Total delegated after:\t${totalDelegatedAfter.format()}`);
        console.log(`Total assets after:\t\t${totalAssetsAfter.format()}`);
        console.log(`Redeem reserve:\t\t\t${redeemReserve.format()}`);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount + extra, transactErr * 2n);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore + extra, transactErr);
        expect(redeemReserve).to.be.eq(staker2PW);
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr * 4n);
        expect(await iVault.ratio()).to.be.eq(ratioBefore);
      });

      it("Redeem withdraw", async function () {
        const balanceBefore = await asset.balanceOf(staker2.address);
        const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

        const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(iVaultOperator.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const balanceAfter = await asset.balanceOf(staker2.address);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending withdrawals after:\t${staker2PWAfter.format()}`);
        console.log(`Ratio after:\t\t\t\t${(await iVault.ratio()).format()}`);

        expect(staker2PWAfter).to.be.eq(0n);
        expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(extra, transactErr * 5n);
        expect(totalAssetsAfter).to.be.closeTo(extra, transactErr * 2n);
      });
    });

    describe("Base flow with flash withdraw", function () {
      let targetCapacity, deposited, freeBalance, depositFees;
      before(async function () {
        await snapshot.restore();
        targetCapacity = e18;
        await iVault.setTargetFlashCapacity(targetCapacity); //1%
      });

      it("Initial ratio is 1e18", async function () {
        const ratio = await iVault.ratio();
        console.log(`Current ratio is:\t\t\t\t${ratio.format()}`);
        expect(ratio).to.be.eq(e18);
      });

      it("Initial delegation is 0", async function () {
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
      });

      it("Deposit to Vault", async function () {
        deposited = toWei(10);
        freeBalance = (deposited * (MAX_TARGET_PERCENT - targetCapacity)) / MAX_TARGET_PERCENT;
        const expectedShares = (deposited * e18) / (await iVault.ratio());
        const tx = await iVault.connect(staker).deposit(deposited, staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(deposited, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);
        expect(receipt.logs.find(l => l.eventName === "DepositBonus")).to.be.undefined;
        console.log(`Ratio after: ${await iVault.ratio()}`);

        expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(deposited, transactErr);
        expect(await iVault.getFlashCapacity()).to.be.closeTo(deposited, transactErr);
        expect(await iVault.getFreeBalance()).to.be.closeTo(freeBalance, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(deposited, transactErr);
        expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Delegate freeBalance", async function () {
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const expectedFlashCapacity = (deposited * targetCapacity) / MAX_TARGET_PERCENT;

        const amount = await iVault.getFreeBalance();
        await expect(
          iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]),
        )
          .to.emit(iVault, "DelegatedTo")
          .withArgs(
            stakerAddress => {
              expect(stakerAddress).to.be.properAddress;
              expect(stakerAddress).to.be.not.eq(ethers.ZeroAddress);
              return true;
            },
            nodeOperators[0],
            amount,
          );
        const delegatedTotal = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(nodeOperators[0]);
        expect(totalDepositedBefore).to.be.closeTo(await iVault.getTotalDeposited(), 1n);
        expect(delegatedTotal).to.be.closeTo(amount, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(await iVault.getFreeBalance()).to.be.closeTo(0n, 1n);
        expect(await iVault.getFlashCapacity()).to.be.closeTo(expectedFlashCapacity, 1n);
        expect(await iVault.ratio()).closeTo(e18, 1n);
      });

      it("Update asset ratio", async function () {
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).lt(e18);
      });

      it("Flash withdraw all capacity", async function () {
        const sharesBefore = await iToken.balanceOf(staker);
        const assetBalanceBefore = await asset.balanceOf(staker);
        const treasuryBalanceBefore = await asset.balanceOf(treasury);
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalAssetsBefore = await iVault.totalAssets();
        const flashCapacityBefore = await iVault.getFlashCapacity();
        const freeBalanceBefore = await iVault.getFreeBalance();
        console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);
        console.log(`Free balance before:\t${freeBalanceBefore.format()}`);

        const amount = await iVault.getFlashCapacity();
        const shares = await iVault.convertToShares(amount);
        const receiver = staker;
        const expectedFee = await iVault.calculateFlashWithdrawFee(amount);
        console.log(`Amount:\t\t\t\t\t${amount.format()}`);
        console.log(`Shares:\t\t\t\t\t${shares.format()}`);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        let tx = await iVault.connect(staker).flashWithdraw(shares, receiver.address);
        const receipt = await tx.wait();
        const withdrawEvent = receipt.logs?.filter(e => e.eventName === "FlashWithdraw");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(staker.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, transactErr);
        expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, transactErr);
        expect(withdrawEvent[0].args["fee"]).to.be.closeTo(expectedFee, transactErr);
        const collectedFees = withdrawEvent[0].args["fee"];
        depositFees = collectedFees / 2n;

        const sharesAfter = await iToken.balanceOf(staker);
        const assetBalanceAfter = await asset.balanceOf(staker);
        const treasuryBalanceAfter = await asset.balanceOf(treasury);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();
        const flashCapacityAfter = await iVault.getFlashCapacity();
        console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`Total deposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
        console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(shares);
        expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
        expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, transactErr);
      });

      it("Withdraw all", async function () {
        const ratioBefore = await iVault.ratio();
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
        console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);
        const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.eq(assetValue);
        expect(events[0].args["iShares"]).to.be.eq(shares);

        const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const totalPW = await iVault.totalAmountToWithdraw();
        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
        expect(totalPW).to.be.closeTo(assetValue, transactErr);

        console.log(`Total delegated:\t\t\t\t${(await iVault.getTotalDelegated()).format()}`);
        console.log(`Total deposited:\t\t\t\t${(await iVault.getTotalDeposited()).format()}`);
        expect(await iVault.ratio()).to.be.eq(ratioBefore);
      });

      it("Withdraw from EigenLayer and claim", async function () {
        const ratioBefore = await iVault.ratio();
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const amount = await iVault.totalAmountToWithdraw();
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Staker2 pending withdrawals:\t${staker2PW.format()}`);

        console.log(`-------- !!!! ${nodeOperators[0]}`);
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const redeemReserve = await iVault.redeemReservedAmount();

        console.log(`Available withdrawals:\t${await iVault.isAbleToRedeem(staker2.address)}`);
        console.log(`Total deposited after:\t${totalDepositedAfter.format()}`);
        console.log(`Total delegated after:\t${totalDelegatedAfter.format()}`);
        console.log(`Total assets after:\t\t${totalAssetsAfter.format()}`);
        console.log(`Redeem reserve:\t\t\t${redeemReserve.format()}`);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr * 2n);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(redeemReserve).to.be.eq(staker2PW);
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr * 4n);
        expect(await iVault.ratio()).to.be.eq(ratioBefore);
      });

      it("Redeem withdraw", async function () {
        const balanceBefore = await asset.balanceOf(staker2.address);
        const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

        const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(iVaultOperator.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["amount"]).to.be.eq(staker2PWBefore);

        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const balanceAfter = await asset.balanceOf(staker2.address);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending withdrawals after:\t${staker2PWAfter.format()}`);
        console.log(`Ratio after:\t\t\t\t${(await iVault.ratio()).format()}`);

        expect(staker2PWAfter).to.be.eq(0n);
        expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(0n, transactErr * 5n);
        expect(totalAssetsAfter).to.be.closeTo(depositFees, transactErr * 2n);
      });
    });

    describe("iVault setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      it("setTreasuryAddress(): only owner can", async function () {
        const treasury = await iVault.treasury();
        const newTreasury = ethers.Wallet.createRandom().address;
        await expect(iVault.setTreasuryAddress(newTreasury))
          .to.emit(iVault, "TreasuryChanged")
          .withArgs(treasury, newTreasury);
        expect(await iVault.treasury()).to.be.eq(newTreasury);
      });

      it("setTreasuryAddress(): reverts when set to zero address", async function () {
        await expect(iVault.setTreasuryAddress(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setTreasuryAddress(): reverts when caller is not an operator", async function () {
        await expect(iVault.connect(staker).setTreasuryAddress(staker2.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setOperator(): only owner can", async function () {
        const newOperator = staker2;
        const tx = await iVault.setOperator(newOperator.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "OperatorChanged");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["prevValue"]).to.be.eq(iVaultOperator.address);
        expect(events[0].args["newValue"]).to.be.eq(newOperator.address);

        await iVault.connect(staker).deposit(toWei(2), staker.address);
        const amount = await iVault.getFreeBalance();
        await iVault
          .connect(newOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
      });

      it("setOperator(): reverts when set to zero address", async function () {
        await expect(iVault.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setOperator(): reverts when caller is not an operator", async function () {
        await expect(iVault.connect(staker).setOperator(staker2.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("addELOperator(): only owner can", async function () {
        const newELOperator = nodeOperators[1];
        const tx = await iVault.addELOperator(newELOperator);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "ELOperatorAdded");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["newELOperator"]).to.be.eq(newELOperator);
      });

      it("addELOperator(): reverts when caller is not an owner", async function () {
        await expect(iVault.connect(iVaultOperator).addELOperator(nodeOperators[0])).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("addELOperator(): reverts when address is not a staker-operator", async function () {
        await expect(iVault.addELOperator(randomAddress())).to.be.revertedWithCustomError(
          iVault,
          "NotEigenLayerOperator",
        );
      });

      it("addELOperator(): reverts when address is zero address", async function () {
        await expect(iVault.addELOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          iVault,
          "NotEigenLayerOperator",
        );
      });

      it("addELOperator(): reverts when address has been added already", async function () {
        await expect(iVault.addELOperator(nodeOperators[0])).to.be.revertedWithCustomError(
          iVault,
          "EigenLayerOperatorAlreadyExists",
        );
      });

      it("setDelegationManager(): immutable", async function () {
        const newManager = ethers.Wallet.createRandom().address;
        await expect(iVault.connect(deployer).setDelegationManager(newManager)).to.be.revertedWithCustomError(
          iVault,
          "DelegationManagerImmutable",
        );
      });

      it("setDelegationManager(): reverts when caller is not an operator", async function () {
        await expect(iVault.connect(staker).setDelegationManager(staker2.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setRatioFeed(): only owner can", async function () {
        const ratioFeed = await iVault.ratioFeed();
        const newRatioFeed = ethers.Wallet.createRandom().address;
        await expect(iVault.setRatioFeed(newRatioFeed))
          .to.emit(iVault, "RatioFeedChanged")
          .withArgs(ratioFeed, newRatioFeed);
        expect(await iVault.ratioFeed()).to.be.eq(newRatioFeed);
      });

      it("setRatioFeed(): reverts when new value is zero address", async function () {
        await expect(iVault.setRatioFeed(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setRatioFeed(): reverts when caller is not an owner", async function () {
        const newRatioFeed = ethers.Wallet.createRandom().address;
        await expect(iVault.connect(staker).setRatioFeed(newRatioFeed)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setMinAmount(): only owner can", async function () {
        const prevValue = await iVault.minAmount();
        const newMinAmount = randomBI(3);
        const tx = await iVault.setMinAmount(newMinAmount);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "MinAmountChanged");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["prevValue"]).to.be.eq(prevValue);
        expect(events[0].args["newValue"]).to.be.eq(newMinAmount);
        expect(await iVault.minAmount()).to.be.eq(newMinAmount);
      });

      it("setMinAmount(): another address can not", async function () {
        await expect(iVault.connect(staker).setMinAmount(randomBI(3))).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setName(): only owner can", async function () {
        const prevValue = await iVault.name();
        const newValue = "New name";
        await expect(iVault.setName(newValue)).to.emit(iVault, "NameChanged").withArgs(prevValue, newValue);
        expect(await iVault.name()).to.be.eq(newValue);
      });

      it("setName(): reverts when name is blank", async function () {
        await expect(iVault.setName("")).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setName(): another address can not", async function () {
        await expect(iVault.connect(staker).setName("New name")).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("updateEpoch(): reverts when paused", async function () {
        await iVault.pause();
        await expect(iVault.connect(iVaultOperator).updateEpoch()).to.be.revertedWith("Pausable: paused");
      });

      it("pause(): only owner can", async function () {
        expect(await iVault.paused()).is.false;
        await iVault.pause();
        expect(await iVault.paused()).is.true;
      });

      it("pause(): another address can not", async function () {
        await expect(iVault.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("pause(): reverts when already paused", async function () {
        await iVault.pause();
        await expect(iVault.pause()).to.be.revertedWith("Pausable: paused");
      });

      it("unpause(): only owner can", async function () {
        await iVault.pause();
        expect(await iVault.paused()).is.true;

        await iVault.unpause();
        expect(await iVault.paused()).is.false;
      });

      it("unpause(): another address can not", async function () {
        await iVault.pause();
        expect(await iVault.paused()).is.true;
        await expect(iVault.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("upgradeTo(): only owner can", async function () {
        const newRestakeImp = await ethers.deployContract("InceptionRestaker");
        const tx = await iVault.upgradeTo(await newRestakeImp.getAddress());
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "ImplementationUpgraded");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["prevValue"]).to.be.eq(await restakerImp.getAddress());
        expect(events[0].args["newValue"]).to.be.eq(await newRestakeImp.getAddress());
      });

      it("upgradeTo(): reverts when set to zero address", async function () {
        await expect(iVault.upgradeTo(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NotContract");
      });

      it("upgradeTo(): reverts when caller is not an operator", async function () {
        const newRestakeImp = await ethers.deployContract("InceptionRestaker");
        await expect(iVault.connect(staker).upgradeTo(await newRestakeImp.getAddress())).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("upgradeTo(): reverts when paused", async function () {
        const newRestakeImp = await ethers.deployContract("InceptionRestaker");
        await iVault.pause();
        await expect(iVault.upgradeTo(await newRestakeImp.getAddress())).to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
      });

      it("setTargetFlashCapacity(): only owner can", async function () {
        const prevValue = await iVault.targetCapacity();
        const newValue = randomBI(18);
        await expect(iVault.connect(deployer).setTargetFlashCapacity(newValue))
          .to.emit(iVault, "TargetCapacityChanged")
          .withArgs(prevValue, newValue);
        expect(await iVault.targetCapacity()).to.be.eq(newValue);
      });

      it("setTargetFlashCapacity(): reverts when caller is not an owner", async function () {
        const newValue = randomBI(18);
        await expect(iVault.connect(staker).setTargetFlashCapacity(newValue)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setProtocolFee(): sets share of flashWithdrawFee that goes to treasury", async function () {
        const prevValue = await iVault.protocolFee();
        const newValue = randomBI(10);
        await expect(iVault.setProtocolFee(newValue))
          .to.emit(iVault, "ProtocolFeeChanged")
          .withArgs(prevValue, newValue);
        expect(await iVault.protocolFee()).to.be.eq(newValue);
      });

      it("setProtocolFee(): reverts when > MAX_PERCENT", async function () {
        const newValue = (await iVault.MAX_PERCENT()) + 1n;
        await expect(iVault.setProtocolFee(newValue))
          .to.be.revertedWithCustomError(iVault, "ParameterExceedsLimits")
          .withArgs(newValue);
      });

      it("setProtocolFee(): reverts when caller is not an owner", async function () {
        const newValue = randomBI(10);
        await expect(iVault.connect(staker).setProtocolFee(newValue)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("setRewardsTimeline(): only owner can", async function () {
        const prevValue = await iVault.rewardsTimeline();
        const newValue = randomBI(2) * day;
        await expect(iVault.connect(deployer).setRewardsTimeline(newValue))
          .to.emit(iVault, "RewardsTimelineChanged")
          .withArgs(prevValue, newValue);

        expect(prevValue).to.be.eq(day * 7n); //default value is 7d
        expect(await iVault.rewardsTimeline()).to.be.eq(newValue);
      })

      it("setRewardsTimeline(): reverts when < 1 day", async function () {
        await expect(iVault.connect(deployer).setRewardsTimeline(day - 1n))
          .to.be.revertedWithCustomError(iVault, "InconsistentData");
      })

      it("setRewardsTimeline(): reverts when caller is not an owner", async function () {
        const newValue = randomBI(6);
        await expect(iVault.connect(staker).setRewardsTimeline(newValue)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

    });

    describe("Deposit bonus params setter and calculation", function () {
      let targetCapacityPercent, MAX_PERCENT, localSnapshot;
      before(async function () {
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
          amount: async () => (await iVault.convertToAssets(await iVault.minAmount())) + 1n,
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
              .delegateToOperator(deposited - flashCapacity - 1n, nodeOperators[0], ethers.ZeroHash, [
                ethers.ZeroHash,
                0,
              ]);
            await iVault.connect(deployer).setTargetFlashCapacity(targetCapacityPercent); //1%
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
                  const bonusPercent =
                    fromPercent + (slope * (flashCapacity + replenished / 2n)) / targetCapacityPercent;
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
            let contractBonus = await iVault.calculateDepositBonus(await amount.amount());
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
          iVault
            .connect(staker)
            .setDepositBonusParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
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
          amount: async () => (await iVault.convertToAssets(await iVault.minAmount())) + 1n,
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
              .delegateToOperator(deposited - flashCapacity - 1n, nodeOperators[0], ethers.ZeroHash, [
                ethers.ZeroHash,
                0,
              ]);
            await iVault.connect(deployer).setTargetFlashCapacity(targetCapacityPercent); //1%
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
            let contractFee = await iVault.calculateFlashWithdrawFee(await amount.amount());
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
        await iVault.connect(staker).deposit(randomBI(19), staker.address);
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

    describe("iToken management", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      it("Reverts: when not an owner mints", async function () {
        await expect(iToken.connect(staker).mint(staker.address, toWei(1))).to.be.revertedWith(
          "InceptionToken: only vault allowed",
        );
      });

      it("Reverts: when not an owner burns", async function () {
        const amount = toWei(1);
        await iVault.connect(staker).deposit(amount, staker.address);
        await expect(iToken.connect(staker).burn(staker.address, toWei(1) / 2n)).to.be.revertedWith(
          "InceptionToken: only vault allowed",
        );
      });

      it("setVault(): only owner can", async function () {
        await expect(iToken.setVault(staker2.address))
          .to.emit(iToken, "VaultChanged")
          .withArgs(await iVault.getAddress(), staker2.address);
        expect(await iToken.vault()).to.be.eq(staker2.address);
      });

      it("setVault(): another address can not", async function () {
        await expect(iToken.connect(staker).setVault(staker2.address)).to.be.revertedWith(
          "Ownable: caller is not the owner",
        );
      });

      it("pause(): only owner can", async function () {
        expect(await iToken.paused()).is.false;
        await expect(iToken.pause()).to.emit(iToken, "Paused").withArgs(deployer.address);
        expect(await iToken.paused()).is.true;
      });

      it("pause(): another address can not", async function () {
        await expect(iToken.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("pause(): reverts when it has already been paused", async function () {
        await iToken.pause();
        await expect(iToken.pause()).to.be.revertedWith("InceptionToken: paused");
      });

      it("Reverts: deposit to iVault when iToken is paused", async function () {
        await iToken.pause();
        await expect(iVault.connect(staker).deposit(toWei(1), staker.address)).to.be.revertedWith(
          "InceptionToken: token transfer while paused",
        );
      });

      it("Reverts: deposit to iVault when iToken is paused", async function () {
        await iToken.pause();
        await expect(iVault.connect(staker).deposit(toWei(1), staker.address)).to.be.revertedWith(
          "InceptionToken: token transfer while paused",
        );
      });

      it("unpause(): only owner can", async function () {
        await iToken.pause();
        expect(await iToken.paused()).is.true;
        await expect(iToken.unpause()).to.emit(iToken, "Unpaused").withArgs(deployer.address);
        expect(await iToken.paused()).is.false;
      });

      it("unpause(): another address can not", async function () {
        await iToken.pause();
        expect(await iToken.paused()).is.true;
        await expect(iToken.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("unpause(): when it is not paused", async function () {
        await expect(iToken.unpause()).to.be.revertedWith("InceptionToken: not paused");
      });

      it("User can transfer iToken", async function () {
        await iVault.connect(staker).deposit(toWei(1), staker.address);
        const amount = await iToken.balanceOf(staker.address);
        await iToken.connect(staker).transfer(staker2.address, amount);
        expect(await iToken.balanceOf(staker2.address)).to.be.eq(amount);
        expect(await iToken.balanceOf(staker.address)).to.be.eq(0n);
      });
    });

    describe("InceptionRestaker", function () {
      let restaker, iVaultMock, trusteeManager;

      beforeEach(async function () {
        await snapshot.restore();
        console.log("- Restaker");
        iVaultMock = staker2;
        trusteeManager = staker3;
        const factory = await ethers.getContractFactory("InceptionRestaker", iVaultMock);
        restaker = await upgrades.deployProxy(factory, [
          a.delegationManager,
          a.strategyManager,
          a.assetStrategy,
          trusteeManager.address,
        ]);
      });

      it("depositAssetIntoStrategy: reverts when called by not a trustee", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await expect(restaker.connect(staker).depositAssetIntoStrategy(amount)).to.be.revertedWith(
          "InceptionRestaker: only vault or trustee manager",
        );
      });

      it("getOperatorAddress: equals 0 address before any delegation", async function () {
        expect(await restaker.getOperatorAddress()).to.be.eq(ethers.ZeroAddress);
      });

      it("getOperatorAddress: equals operator after delegation", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await restaker.connect(trusteeManager).depositAssetIntoStrategy(amount);
        await restaker
          .connect(trusteeManager)
          .delegateToOperator(nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        expect(await restaker.getOperatorAddress()).to.be.eq(nodeOperators[0]);
      });

      it("delegateToOperator: reverts when called by not a trustee", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await restaker.connect(trusteeManager).depositAssetIntoStrategy(amount);

        await expect(
          restaker.connect(staker).delegateToOperator(nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWith("InceptionRestaker: only vault or trustee manager");
      });

      it("delegateToOperator: reverts when delegates to 0 address", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await restaker.connect(trusteeManager).depositAssetIntoStrategy(amount);

        await expect(
          restaker
            .connect(trusteeManager)
            .delegateToOperator(ethers.ZeroAddress, ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWithCustomError(restaker, "NullParams");
      });

      it("delegateToOperator: reverts when delegates unknown operator", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await restaker.connect(trusteeManager).depositAssetIntoStrategy(amount);

        const unknownOperator = ethers.Wallet.createRandom().address;
        await expect(
          restaker.connect(trusteeManager).delegateToOperator(unknownOperator, ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWith("DelegationManager._delegate: operator is not registered in EigenLayer");
      });

      it("withdrawFromEL: reverts when called by not a trustee", async function () {
        const amount = toWei(1);
        await asset.connect(iVaultMock).approve(await restaker.getAddress(), amount);
        await restaker.connect(trusteeManager).depositAssetIntoStrategy(amount);
        await restaker
          .connect(trusteeManager)
          .delegateToOperator(nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);

        await expect(restaker.connect(staker).withdrawFromEL(amount / 2n)).to.be.revertedWith(
          "InceptionRestaker: only vault or trustee manager",
        );
      });

      it("getVersion: equals 1", async function () {
        expect(await restaker.getVersion()).to.be.eq(1);
      });

      it("pause(): only owner can", async function () {
        expect(await restaker.paused()).is.false;
        await restaker.connect(iVaultMock).pause();
        expect(await restaker.paused()).is.true;
      });

      it("pause(): another address can not", async function () {
        await expect(restaker.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("unpause(): only owner can", async function () {
        await restaker.connect(iVaultMock).pause();
        expect(await restaker.paused()).is.true;

        await restaker.connect(iVaultMock).unpause();
        expect(await restaker.paused()).is.false;
      });

      it("unpause(): another address can not", async function () {
        await restaker.connect(iVaultMock).pause();
        expect(await restaker.paused()).is.true;
        await expect(restaker.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("Deposit: user can restake asset", function () {
      let ratio, TARGET;

      before(async function () {
        await snapshot.restore();
        //Deposit to change ratio
        try {
          // await asset.connect(staker3).approve(await iVault.getAddress(), e18);
          await iVault.connect(staker3).deposit(e18, staker3.address);
          const amount = await iVault.totalAssets();
          await iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
          await addRewardsToStrategy(a.assetStrategy, e18, staker3);
          const ratio = await calculateRatio(iVault, iToken);
          await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        } catch (e) {
          console.warn("Deposit to strategy failed");
        }
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${ratio.format()}`);
      });

      it("maxDeposit: returns max amount that can be delegated to strategy", async function () {
        expect(await iVault.maxDeposit(staker.address)).to.be.gt(0n);
      });

      const args = [
        {
          amount: async () => 4798072939323319141n,
          receiver: () => staker.address,
        },
        {
          amount: async () => 999999999999999999n,
          receiver: () => staker2.address,
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
          amount: async () => (await iVault.convertToAssets(await iVault.minAmount())) + 1n,
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
        it("Delegate free balance", async function () {
          const delegatedBefore = await iVault.getDelegatedTo(nodeOperators[0]);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          console.log(`Delegated before: ${delegatedBefore}`);
          console.log(`Total deposited before: ${totalDepositedBefore}`);

          const amount = await iVault.getFreeBalance();
          const tx = await iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
          const receipt = await tx.wait();
          const events = receipt.logs?.filter(e => e.eventName === "DelegatedTo");
          expect(events.length).to.be.eq(1);
          expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.ZeroAddress);
          expect(events[0].args["stakerAddress"]).to.be.properAddress;
          expect(events[0].args["operatorAddress"]).to.be.eq(nodeOperators[0]);

          const delegatedAfter = await iVault.getDelegatedTo(nodeOperators[0]);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalAssetsAfter = await iVault.totalAssets();
          const ratioAfter = await iVault.ratio();
          console.log(`Ratio after: ${ratioAfter}`);

          expect(delegatedAfter - delegatedBefore).to.be.closeTo(amount, transactErr);
          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(totalAssetsAfter).to.be.lte(transactErr);
        });
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
          amount: async () => (await iVault.minAmount()) - 1n,
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
        await iVault.unpause();
      });

      it("Reverts: depositWithReferral when iVault is paused", async function () {
        await iVault.pause();
        const depositAmount = randomBI(19);
        const code = ethers.encodeBytes32String(randomAddress().slice(0, 8));
        await expect(iVault.connect(staker).depositWithReferral(depositAmount, staker, code)).to.be.revertedWith(
          "Pausable: paused",
        );
        await iVault.unpause();
      });

      it("Reverts: deposit when targetCapacity is not set", async function () {
        await iVault.setTargetFlashCapacity(0n);
        const depositAmount = randomBI(19);
        await expect(iVault.connect(staker).deposit(depositAmount, staker.address)).to.be.revertedWithCustomError(
          iVault,
          "InceptionOnPause",
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
          amount: async () => (await iVault.minAmount()) - 1n,
        },
      ];

      convertSharesArgs.forEach(function (arg) {
        it(`Convert to shares: ${arg.name}`, async function () {
          const amount = await arg.amount();
          const ratio = await iVault.ratio();
          expect(await iVault.convertToShares(amount)).to.be.eq((amount * ratio) / e18);
        });
      });
    });

    describe("Deposit with bonus for replenish", function () {
      const states = [
        {
          name: "deposit bonus = 0",
          withBonus: false,
        },
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
          const deposited = (targetCapacity * MAX_TARGET_PERCENT) / targetCapacityPercent;
          if (state.withBonus) {
            await iVault.setTargetFlashCapacity(targetCapacityPercent);
            await iVault.connect(staker3).deposit(toWei(1.5), staker3.address);
            const balanceOf = await iToken.balanceOf(staker3.address);
            await iVault.connect(staker3).flashWithdraw(balanceOf, staker3.address);
            await iVault.setTargetFlashCapacity(1n);
          }

          await iVault.connect(staker3).deposit(deposited, staker3.address);
          console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
          console.log(`Deposit bonus:\t\t${(await iVault.depositBonusAmount()).format()}`);
          localSnapshot = await helpers.takeSnapshot();
        });

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
              .delegateToOperator(freeBalance - flashCapacityBefore, nodeOperators[0], ethers.ZeroHash, [
                ethers.ZeroHash,
                0,
              ]);
            await iVault.setTargetFlashCapacity(targetCapacityPercent);
            await addRewardsToStrategy(a.assetStrategy, e18, staker3);
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
          });
        });
      });
    });

    describe("Deposit and delegateToOperator", function () {
      let ratio, firstDeposit;

      beforeEach(async function () {
        await snapshot.restore();
        await asset.connect(staker3).approve(await iVault.getAddress(), e18);
        await iVault.connect(staker3).deposit(e18, staker3.address);
        firstDeposit = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(firstDeposit, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await addRewardsToStrategy(a.assetStrategy, toWei(0.001), staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${ratio.format()}`);
      });

      const args2 = [
        {
          name: "random amounts ~ e18",
          depositAmount: async () => toWei(1),
        },
        {
          name: "amounts which are close to min",
          depositAmount: async () => (await iVault.minAmount()) + 1n,
        },
      ];

      args2.forEach(function (arg) {
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
              .delegateToOperator(delegated, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);

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
          const totalDelegatedToAfter = await iVault.getDelegatedTo(nodeOperators[0]);
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

      const args3 = [
        {
          name: "by the same staker",
          staker: async () => staker,
        },
        {
          name: "by different stakers",
          staker: async () => await getRandomStaker(iVault, asset, staker3, toWei(1)),
        },
      ];

      args3.forEach(function (arg) {
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
            .delegateToOperator(totalDelegated, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
          console.log(`Final ratio:\t${await iVault.ratio()}`);
          console.log(`Total deposited:\t${totalDeposited.format()}`);
          console.log(`Total delegated:\t${totalDelegated.format()}`);

          const balanceExpected = (totalDelegated * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = BigInt(count) * transactErr * 2n;

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const totalDelegatedToAfter = await iVault.getDelegatedTo(nodeOperators[0]);
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

      const args4 = [
        {
          name: "to the different operators",
          count: 20,
          stakerOperator: i => nodeOperators[i % nodeOperators.length],
        },
        {
          name: "to the same operator",
          count: 10,
          stakerOperator: i => nodeOperators[0],
        },
      ];

      args4.forEach(function (arg) {
        it(`Delegate many times ${arg.name}`, async function () {
          await iVault.setTargetFlashCapacity(1n);
          //Deposit by 2 stakers
          const totalDelegated = toWei(60);
          await iVault.connect(staker).deposit(totalDelegated / 2n, staker.address);
          await iVault.connect(staker2).deposit(totalDelegated / 2n, staker2.address);
          const deployedStakers = [nodeOperators[0]];
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
            const fb = await iVault.getFreeBalance();
            const amount = fb / BigInt(arg.count - i);
            const tx = await iVault
              .connect(iVaultOperator)
              .delegateToOperator(amount, stakerOperator, ethers.ZeroHash, [ethers.ZeroHash, 0]);
            const receipt = await tx.wait();
            let events = receipt.logs?.filter(e => {
              return e.eventName === "DelegatedTo";
            });
            expect(events.length).to.be.eq(1);
            expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.ZeroAddress);
            expect(events[0].args["stakerAddress"]).to.be.properAddress;
            expect(events[0].args["operatorAddress"]).to.be.eq(stakerOperator);

            //Check that RestakerDeployed event was emitted on the first delegation
            if (isFirstDelegation) {
              let events = receipt.logs?.filter(e => {
                return e.eventName === "RestakerDeployed";
              });
              expect(events.length).to.be.eq(1);
              expect(events[0].args["restaker"]).to.be.not.eq(ethers.ZeroAddress);
              expect(events[0].args["restaker"]).to.be.properAddress;
            } else {
              expect(receipt.logs.map(e => e.event)).to.not.include("RestakerDeployed");
            }
            const taAfter = await iVault.totalAssets();
            expect(taBefore - taAfter).to.be.closeTo(amount, transactErr);
          }
          console.log(`Final ratio:\t${await iVault.ratio()}`);

          const balanceExpected = (totalDelegated * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = BigInt(arg.count) * transactErr * 2n;

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const totalDelegatedToAfter = await iVault.getDelegatedTo(nodeOperators[0]);
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
          stakerOperator: async () => nodeOperators[0],
          operator: () => iVaultOperator,
        },
        {
          name: "amount is 1",
          deposited: toWei(1),
          amount: async () => 1n,
          stakerOperator: async () => nodeOperators[0],
          operator: () => iVaultOperator,
          error: "StrategyBase.deposit: newShares cannot be zero",
        },
        {
          name: "amount is greater than free balance",
          deposited: toWei(10),
          targetCapacityPercent: e18,
          amount: async () => (await iVault.getFreeBalance()) + 1n,
          stakerOperator: async () => nodeOperators[0],
          operator: () => iVaultOperator,
          isCustom: true,
          error: "InsufficientCapacity",
        },
        {
          name: "operator is not added to iVault",
          deposited: toWei(1),
          amount: async () => await iVault.getFreeBalance(),
          stakerOperator: async () => nodeOperators[1],
          operator: () => iVaultOperator,
          isCustom: true,
          error: "OperatorNotRegistered",
        },
        {
          name: "operator is zero address",
          deposited: toWei(1),
          amount: async () => await iVault.totalAssets(),
          stakerOperator: async () => ethers.ZeroAddress,
          operator: () => iVaultOperator,
          isCustom: true,
          error: "NullParams",
        },
        {
          name: "caller is not an operator",
          deposited: toWei(1),
          amount: async () => await iVault.totalAssets(),
          stakerOperator: async () => ethers.ZeroAddress,
          operator: () => staker,
          isCustom: true,
          error: "OnlyOperatorAllowed",
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`Reverts when: delegate ${arg.name}`, async function () {
          if (arg.targetCapacityPercent) {
            await iVault.setTargetFlashCapacity(arg.targetCapacityPercent);
          }
          await asset.connect(staker3).approve(await iVault.getAddress(), arg.deposited);
          await iVault.connect(staker3).deposit(arg.deposited, staker3.address);

          const operator = arg.operator();
          const delegateAmount = await arg.amount();
          const stakerOperator = await arg.stakerOperator();

          if (arg.isCustom) {
            await expect(
              iVault
                .connect(operator)
                .delegateToOperator(delegateAmount, stakerOperator, ethers.ZeroHash, [ethers.ZeroHash, 0]),
            ).to.be.revertedWithCustomError(iVault, arg.error);
          } else if (arg.error) {
            await expect(
              iVault
                .connect(operator)
                .delegateToOperator(delegateAmount, stakerOperator, ethers.ZeroHash, [ethers.ZeroHash, 0]),
            ).to.be.revertedWith(arg.error);
          } else {
            await expect(
              iVault
                .connect(operator)
                .delegateToOperator(delegateAmount, stakerOperator, ethers.ZeroHash, [ethers.ZeroHash, 0]),
            ).to.be.reverted;
          }
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

      it("Reverts: delegate when iVault is paused", async function () {
        const amount = randomBI(18);
        await iVault.connect(staker).deposit(amount, staker.address);
        await iVault.pause();
        await expect(
          iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
      });

      it("Reverts: when there is no restaker implementation", async function () {
        const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, {
          libraries: { InceptionLibrary: await iLibrary.getAddress() },
        });
        const iVault = await upgrades.deployProxy(
          iVaultFactory,
          [a.vaultName, a.iVaultOperator, a.strategyManager, iToken.address, a.assetStrategy],
          { unsafeAllowLinkedLibraries: true },
        );
        await iVault.setDelegationManager(a.delegationManager);
        await iVault.setRatioFeed(ratioFeed.address);
        await iVault.addELOperator(nodeOperators[0]);
        await iToken.setVault(await iVault.getAddress());
        await iVault.setTargetFlashCapacity(1n);

        const amount = toWei(1);
        await asset.connect(staker).approve(await iVault.getAddress(), amount);
        await iVault.connect(staker).deposit(amount, staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await expect(
          iVault
            .connect(iVaultOperator)
            .delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWithCustomError(iVault, "ImplementationNotSet");
      });
    });

    describe("Withdraw: user can unstake", function () {
      let ratio, totalDeposited, TARGET;

      before(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        const freeBalanace = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(freeBalanace, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
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
          amount: async shares => (await iVault.convertToAssets(await iVault.minAmount())) + 1n,
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
          const totalPWBefore = await iVault.totalAmountToWithdraw();

          const tx = await iVault.connect(staker).withdraw(amount, test.receiver());
          const receipt = await tx.wait();
          const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
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
          expect((await iVault.totalAmountToWithdraw()) - totalPWBefore).to.be.closeTo(assetValue, transactErr);
          expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
          expect(await iVault.ratio()).to.be.closeTo(ratioBefore, ratioErr);
        });
      });
    });

    describe("Withdraw: negative cases", function () {
      before(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await addRewardsToStrategy(a.assetStrategy, toWei(0.001), staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      });

      const invalidData = [
        {
          name: "> balance",
          amount: async () => (await iToken.balanceOf(staker.address)) + 1n,
          receiver: () => staker.address,
          isCustom: false,
          error: "ERC20: burn amount exceeds balance",
        },
        {
          name: "< min amount",
          amount: async () => (await iVault.minAmount()) - 1n,
          receiver: () => staker.address,
          isCustom: true,
          error: "LowerMinAmount",
        },
        {
          name: "0",
          amount: async () => 0n,
          receiver: () => staker.address,
          isCustom: true,
          error: "NullParams",
        },
        {
          name: "to zero address",
          amount: async () => randomBI(18),
          receiver: () => ethers.ZeroAddress,
          isCustom: true,
          error: "NullParams",
        },
      ];

      invalidData.forEach(function (test) {
        it(`Reverts: withdraws ${test.name}`, async function () {
          const amount = await test.amount();
          const receiver = test.receiver();
          if (test.isCustom) {
            await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWithCustomError(
              iVault,
              test.error,
            );
          } else {
            await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWith(test.error);
          }
        });
      });

      it("Withdraw small amount many times", async function () {
        const ratioBefore = await iVault.ratio();
        console.log(`Ratio before:\t${ratioBefore.format()}`);

        const count = 100;
        const amount = await iVault.minAmount();
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

      it("Reverts: withdraw when target capacity is not set", async function () {
        await iVault.setTargetFlashCapacity(0n);
        await expect(iVault.connect(staker).withdraw(toWei(1), staker.address)).to.be.revertedWithCustomError(
          iVault,
          "InceptionOnPause",
        );
        await iVault.setTargetFlashCapacity(1n);
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
          .delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
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
          //Undelegate from EL
          const undelegatePercent = arg.poolCapacity(targetCapacityPercent);
          const undelegateAmount = (deposited * undelegatePercent) / MAX_TARGET_PERCENT;
          await iVault.withdrawFromELAndClaim(nodeOperators[0], undelegateAmount);

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
          const shares = await iVault.convertToShares(amount + 1n); //+1 to compensate rounding after converting from shares to amount
          const receiver = await arg.receiver();
          const expectedFee = await iVault.calculateFlashWithdrawFee(amount);
          console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

          let tx = await iVault.connect(staker).flashWithdraw(shares, receiver.address);
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
      });

      it("Reverts when capacity is not sufficient", async function () {
        const shares = await iToken.balanceOf(staker.address);
        const capacity = await iVault.getFlashCapacity();
        await expect(iVault.connect(staker).flashWithdraw(shares, staker.address))
          .to.be.revertedWithCustomError(iVault, "InsufficientCapacity")
          .withArgs(capacity);
      });

      it("Reverts when amount < min", async function () {
        const minAmount = await iVault.minAmount();
        const shares = (await iVault.convertToShares(minAmount)) - 1n;
        await expect(iVault.connect(staker).flashWithdraw(shares, staker.address))
          .to.be.revertedWithCustomError(iVault, "LowerMinAmount")
          .withArgs(minAmount);
      });

      it("Reverts when iVault is paused", async function () {
        await iVault.connect(staker).deposit(e18, staker.address);
        await iVault.pause();
        const amount = await iVault.getFlashCapacity();
        await expect(iVault.connect(staker).flashWithdraw(amount, staker.address)).to.be.revertedWith(
          "Pausable: paused",
        );
      });
    });

    describe("UndelegateFrom: request withdrawal assets staked by restaker", function () {
      let ratio,
        ratioDiff,
        depositedAmount,
        assets1,
        assets2,
        withdrawalData1,
        withdrawalData2,
        withdrawalAssets,
        shares1,
        shares2;
      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await new Promise(r => setTimeout(r, 2000));
        //Deposit and delegate to default stakerOperator
        depositedAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
      });

      it("Operator can undelegateFrom stakerOperator", async function () {
        shares1 = 460176234800292249n;
        assets1 = await iVault.convertToAssets(shares1);
        console.log(`Staker is going to withdraw:\t${shares1.format()}/${assets1.format()}`);
        await iVault.connect(staker).withdraw(shares1, staker.address);
        console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
        const pendingWithdrawalsELBefore = await iVault.getPendingWithdrawalAmountFromEL();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const ratioBefore = await iVault.ratio();

        const tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], assets1);
        const receipt = await tx.wait();
        const startWithdrawal = receipt.logs?.filter(e => e.eventName === "StartWithdrawal");
        expect(startWithdrawal.length).to.be.eq(1);
        const WithdrawalQueuedEvent = startWithdrawal[0].args;
        withdrawalData1 = [
          WithdrawalQueuedEvent["stakerAddress"],
          nodeOperators[0],
          nodeOperatorToRestaker.get(nodeOperators[0]),
          WithdrawalQueuedEvent["nonce"],
          WithdrawalQueuedEvent["withdrawalStartBlock"],
          [WithdrawalQueuedEvent["strategy"]],
          [WithdrawalQueuedEvent["shares"]],
        ];
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const ratioAfter = await iVault.ratio();

        expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets1, transactErr);
        expect(await iVault.totalAssets()).to.be.lte(transactErr);
        const pendingWithdrawalsELAfter = await iVault.getPendingWithdrawalAmountFromEL();
        console.log(`EL's pending withdrawals:\t\t${pendingWithdrawalsELAfter.format()}`);
        expect(pendingWithdrawalsELAfter - pendingWithdrawalsELBefore).to.be.closeTo(shares1, transactErr);
        expect(ratioAfter).to.be.closeTo(ratioBefore, 1n);
      });

      it("Operator can do more undelegateFrom stakerOperator", async function () {
        shares2 = 460176234800292249n;
        assets2 = await iVault.convertToAssets(shares2);
        console.log(`Staker is going to withdraw:\t${shares2.format()}/${assets2.format()}`);
        await iVault.connect(staker).withdraw(shares2, staker2.address);
        console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);

        //Change asset ratio
        const ratioBefore = await iVault.ratio();
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        ratioDiff = ratioBefore - ratio;

        const totalPWBefore = await iVault.getPendingWithdrawalAmountFromEL();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const ratioBeforeUndelegate = await iVault.ratio();
        const tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], assets2);
        const receipt = await tx.wait();
        const startWithdrawal = receipt.logs?.filter(e => e.eventName === "StartWithdrawal");
        expect(startWithdrawal.length).to.be.eq(1);
        const WithdrawalQueuedEvent = startWithdrawal[0].args;
        withdrawalData2 = [
          WithdrawalQueuedEvent["stakerAddress"],
          nodeOperators[0],
          nodeOperatorToRestaker.get(nodeOperators[0]),
          WithdrawalQueuedEvent["nonce"],
          WithdrawalQueuedEvent["withdrawalStartBlock"],
          [WithdrawalQueuedEvent["strategy"]],
          [WithdrawalQueuedEvent["shares"]],
        ];
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const ratioAfter = await iVault.ratio();

        expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets2, transactErr);
        expect(await iVault.totalAssets()).to.be.lte(transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
        const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();
        expect(totalPWAfter - totalPWBefore).to.be.closeTo(shares2, transactErr);
        expect(ratioAfter).to.be.closeTo(ratioBeforeUndelegate, ratioErr);
      });

      it("Claim the 2nd withdrawal from EL", async function () {
        await mineBlocks(minWithdrawalDelayBlocks);
        console.log(`Restaker: ${withdrawalData2[2]}`);
        console.log(`Withdrawal data: ${withdrawalData2}`);
        await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData2[2], [withdrawalData2]);
        const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();

        console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).format()}`);
        console.log(`iVault assets:\t\t\t\t${(await iVault.totalAssets()).format()}`);
        console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
        console.log(`Pending withdrawal staker2:\t${(await iVault.getPendingWithdrawalOf(staker2.address)).format()}`);
        console.log(`Total pending withdrawal:\t${totalPWAfter.format()}`);

        expect((await iVault.totalAssets()) - assets2).to.be.lte(transactErr);
        expect(totalPWAfter - shares1).to.be.closeTo(0, transactErr);
      });

      it("Claim missed withdrawal from EL", async function () {
        await iVault.claimCompletedWithdrawals(withdrawalData1[2], [withdrawalData1]);
        const totalPendingWithdrawalAfter = await iVault.getPendingWithdrawalAmountFromEL();
        const totalAssetsAfter = await iVault.totalAssets();
        const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);

        console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).toString()}`);
        console.log(`Total assets:\t\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Pending withdrawal staker:\t${stakerPWAfter.format()}`);
        console.log(`Pending withdrawal staker2:\t${staker2PWAfter.format()}`);
        console.log(`Total pending withdrawal:\t${totalPendingWithdrawalAfter.format()}`);

        expect(stakerPWAfter - assets1).to.be.closeTo(0, transactErr);
        expect(staker2PWAfter - assets2).to.be.closeTo(0, transactErr);
        expect(totalAssetsAfter - assets1 - assets2).to.be.gt(0);
        expect(totalPendingWithdrawalAfter).to.be.eq(0n);
      });

      it("Reverts: when delegating pending withdrawals back to EL", async function () {
        const totalAssets = await iVault.totalAssets();
        await expect(
          iVault
            .connect(iVaultOperator)
            .delegateToOperator(totalAssets, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]),
        ).to.be.revertedWithCustomError(iVault, "InsufficientCapacity");
      });

      it("Operator can delegate part of leftover", async function () {
        const totalAssets = await iVault.totalAssets();
        const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const part = (totalAssets - stakerPWAfter - staker2PWAfter) / 2n;
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(part, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        const totalDelegatedAfter = await iVault.getTotalDelegated();

        expect(totalDelegatedAfter - totalDelegatedBefore).to.be.closeTo(part, transactErr);
      });

      it("Operator can delegate all leftover", async function () {
        const totalAssets = await iVault.totalAssets();
        const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const leftover = totalAssets - stakerPWAfter - staker2PWAfter;
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(leftover, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);

        const totalDelegatedAfter = await iVault.getTotalDelegated();
        expect(totalDelegatedAfter - totalDelegatedBefore).to.be.closeTo(leftover, transactErr);
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

        console.log(`Staker balance after: ${stakerBalanceAfter.format()}`);
        console.log(`Staker pending withdrawals after: ${stakerPWAfter.format()}`);

        expect(stakerPWBefore - stakerPWAfter).to.be.closeTo(assets1, transactErr * 2n);
        expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(assets1, transactErr * 2n);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });
    });

    describe.skip("UndelegateVault: request withdrawal assets staked by iVault", function () {
      let ratio,
        ratioDiff,
        depositedAmount,
        assets1,
        assets2,
        withdrawalData1,
        withdrawalData2,
        withdrawalAssets,
        shares1,
        shares2;
      before(async function () {
        await snapshot.restore();
        await new Promise(r => setTimeout(r, 2000));
        //Deposit and delegate to default stakerOperator
        depositedAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        await iVault.connect(iVaultOperator).depositAssetIntoStrategyFromVault(await iVault.getFreeBalance());
        await iVault
          .connect(iVaultOperator)
          .delegateToOperatorFromVault(nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
      });

      it("Operator can undelegate for iVault", async function () {
        shares1 = 460176234800292249n;
        assets1 = await iVault.convertToAssets(shares1);
        console.log(`Staker is going to withdraw:\t${shares1.format()}/${assets1.format()}`);
        await iVault.connect(staker).withdraw(shares1, staker.address);
        console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
        const pendingWithdrawalsELBefore = await iVault.getPendingWithdrawalAmountFromEL();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const ratioBefore = await iVault.ratio();

        const tx = await iVault.connect(iVaultOperator).undelegateVault(assets1);
        const receipt = await tx.wait();
        const startWithdrawal = receipt.logs?.filter(e => e.eventName === "StartWithdrawal");
        expect(startWithdrawal.length).to.be.eq(1);
        const WithdrawalQueuedEvent = startWithdrawal[0].args;
        withdrawalData1 = [
          WithdrawalQueuedEvent["stakerAddress"],
          nodeOperators[0],
          nodeOperatorToRestaker.get(nodeOperators[0]),
          WithdrawalQueuedEvent["nonce"],
          WithdrawalQueuedEvent["withdrawalStartBlock"],
          [WithdrawalQueuedEvent["strategy"]],
          [WithdrawalQueuedEvent["shares"]],
        ];
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const ratioAfter = await iVault.ratio();

        expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets1, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(0, transactErr);
        const pendingWithdrawalsELAfter = await iVault.getPendingWithdrawalAmountFromEL();
        console.log(`EL's pending withdrawals:\t\t${pendingWithdrawalsELAfter.format()}`);
        expect(pendingWithdrawalsELAfter - pendingWithdrawalsELBefore).to.be.closeTo(shares1, transactErr);
        expect(ratioAfter).to.be.closeTo(ratioBefore, 5n);
      });

      it("Operator can do more undelegateFrom stakerOperator", async function () {
        shares2 = 460176234800292249n;
        assets2 = await iVault.convertToAssets(shares2);
        console.log(`Staker is going to withdraw:\t${shares2.format()}/${assets2.format()}`);
        await iVault.connect(staker).withdraw(shares2, staker2.address);
        console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);

        //Change asset ratio
        const ratioBefore = await iVault.ratio();
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        ratioDiff = ratioBefore - ratio;

        const totalPWBefore = await iVault.getPendingWithdrawalAmountFromEL();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const ratioBeforeUndelegate = await iVault.ratio();
        const tx = await iVault.connect(iVaultOperator).undelegateVault(assets2);
        const receipt = await tx.wait();
        const startWithdrawal = receipt.logs?.filter(e => e.eventName === "StartWithdrawal");
        expect(startWithdrawal.length).to.be.eq(1);
        const WithdrawalQueuedEvent = startWithdrawal[0].args;
        withdrawalData2 = [
          WithdrawalQueuedEvent["stakerAddress"],
          nodeOperators[0],
          nodeOperatorToRestaker.get(nodeOperators[0]),
          WithdrawalQueuedEvent["nonce"],
          WithdrawalQueuedEvent["withdrawalStartBlock"],
          [WithdrawalQueuedEvent["strategy"]],
          [WithdrawalQueuedEvent["shares"]],
        ];
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const ratioAfter = await iVault.ratio();

        expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets2, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(0, transactErr);
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
        const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();
        expect(totalPWAfter - totalPWBefore).to.be.closeTo(shares2, transactErr);
        expect(ratioAfter).to.be.closeTo(ratioBeforeUndelegate, ratioErr);
      });

      it("Claim the 2nd withdrawal from EL", async function () {
        await mineBlocks(minWithdrawalDelayBlocks);
        console.log(`Restaker: ${withdrawalData2[2]}`);
        console.log(`Withdrawal data: ${withdrawalData2}`);
        await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData2[2], [withdrawalData2]);
        const totalPWAfter = await iVault.getPendingWithdrawalAmountFromEL();

        console.log(`iVault assets:\t\t\t\t${(await iVault.totalAssets()).format()}`);
        console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
        console.log(`Pending withdrawal staker2:\t${(await iVault.getPendingWithdrawalOf(staker2.address)).format()}`);
        console.log(`Total pending withdrawal:\t${totalPWAfter.format()}`);
        console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).format()}`);

        expect((await iVault.totalAssets()) - assets2).to.be.closeTo(0, transactErr);
        expect(totalPWAfter - shares1).to.be.closeTo(0, transactErr);
      });

      it("Claim missed withdrawal from EL", async function () {
        await iVault.claimCompletedWithdrawals(withdrawalData1[2], [withdrawalData1]);
        const totalPendingWithdrawalAfter = await iVault.getPendingWithdrawalAmountFromEL();
        const totalAssetsAfter = await iVault.totalAssets();
        const stakerPWAfter = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);

        console.log(`Total assets:\t\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Pending withdrawal staker:\t${stakerPWAfter.format()}`);
        console.log(`Pending withdrawal staker2:\t${staker2PWAfter.format()}`);
        console.log(`Total pending withdrawal:\t${totalPendingWithdrawalAfter.format()}`);
        console.log(`Ratio:\t\t\t\t\t\t${(await iVault.ratio()).format()}`);

        expect(stakerPWAfter - assets1).to.be.closeTo(0, transactErr);
        expect(staker2PWAfter - assets2).to.be.closeTo(0, transactErr);
        expect(totalAssetsAfter - assets1 - assets2).to.be.gt(0);
        expect(totalPendingWithdrawalAfter).to.be.eq(0n);
      });
    });

    describe("UndelegateFrom different operators", function () {
      const withdrawalData = [];
      let totalAssetsBefore;

      before(async function () {
        await snapshot.restore();
        await new Promise(r => setTimeout(r, 2000));
        for (const operatorAddress of nodeOperators.slice(1)) {
          await iVault.addELOperator(operatorAddress); //Add default operator
        }
      });

      it("Deposit and delegate to different operators", async function () {
        //Deposit
        const staker1Amount = randomBI(19);
        await iVault.connect(staker).deposit(staker1Amount, staker.address);
        const staker2Amount = randomBI(19);
        await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
        totalAssetsBefore = await iVault.totalAssets();

        //Delegate to each operator
        let i = 0;
        for (const operatorAddress of nodeOperators) {
          const ta = await iVault.totalAssets();
          const amount = ta / BigInt(nodeOperators.length - i);
          await iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, operatorAddress, ethers.ZeroHash, [ethers.ZeroHash, 0]);
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
        for (const operatorAddress of nodeOperators) {
          const amount = await iVault.getDelegatedTo(operatorAddress);
          let tx = await iVault.connect(iVaultOperator).undelegateFrom(operatorAddress, amount);
          const data = await withdrawDataFromTx(tx, operatorAddress, nodeOperatorToRestaker.get(operatorAddress));
          withdrawalData.push(data);
        }
      });

      it("claim from EL", async function () {
        await mineBlocks(minWithdrawalDelayBlocks);
        let i = 0;
        for (const data of withdrawalData) {
          console.log(`Withdraw #${++i}`);
          await iVault.claimCompletedWithdrawals(data[2], [data]);
        }
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets before: ${totalAssetsBefore.format()}`);
        console.log(`Total assets after: ${totalAssetsAfter.format()}`);
        console.log(`Total pending wwls: ${(await iVault.totalAmountToWithdraw()).format()}`);

        expect(totalAssetsAfter).to.be.closeTo(totalAssetsBefore, transactErr * BigInt(nodeOperators.length));

        await asset.connect(staker3).approve(await iVault.getAddress(), 1000);
        await iVault.connect(staker3).deposit(1000, staker3.address);
        await iVault.connect(iVaultOperator).updateEpoch();

        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
      });
    });

    describe("Force undelegate by node operator", function () {
      let ratio,
        ratioDiff,
        depositedAmount,
        assets1,
        assets2,
        withdrawalData1,
        withdrawalData2,
        withdrawalAssets,
        shares1,
        shares2;
      let nodeOperator, restaker, delegatedNodeOperator1;
      before(async function () {
        await snapshot.restore();
        await new Promise(r => setTimeout(r, 2000));
        forcedWithdrawals.length = 0;
        await iVault.addELOperator(nodeOperators[1]);
        //Deposit and delegate to default stakerOperator
        depositedAmount = toWei(20);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        const totalAssets = await iVault.totalAssets();
        delegatedNodeOperator1 = totalAssets / 2n;
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(delegatedNodeOperator1, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(totalAssets / 4n, nodeOperators[1], ethers.ZeroHash, [ethers.ZeroHash, 0]);
      });

      it("Node operator makes force undelegate", async function () {
        nodeOperator = await impersonateWithEth(nodeOperators[0], 0n);
        restaker = nodeOperatorToRestaker.get(nodeOperator.address);

        console.log(`Total delegated ${await iVault.getTotalDelegated()}`);
        console.log(`Ratio before ${await iVault.ratio()}`);
        console.log(`Shares before ${await delegationManager.operatorShares(nodeOperators[0], a.assetStrategy)}`);

        //Force undelegate
        const tx = await delegationManager.connect(nodeOperator).undelegate(restaker);
        const receipt = await tx.wait();
        console.log(`Ratio after ${await iVault.ratio()}`);
        console.log(`Total delegated ${await iVault.getTotalDelegated()}`);
        console.log(`Shares after ${await delegationManager.operatorShares(nodeOperators[0], a.assetStrategy)}`);

        const withdrawalQueued = receipt.logs?.filter(e => e.eventName === "WithdrawalQueued");
        expect(withdrawalQueued.length).to.be.eq(1);
        const WithdrawalQueuedEvent = withdrawalQueued[0].args.toObject();
        withdrawalData1 = [
          WithdrawalQueuedEvent.withdrawal.staker,
          nodeOperator.address,
          nodeOperatorToRestaker.get(nodeOperators[0]),
          WithdrawalQueuedEvent.withdrawal.nonce,
          WithdrawalQueuedEvent.withdrawal.startBlock,
          [...WithdrawalQueuedEvent.withdrawal.strategies],
          [...WithdrawalQueuedEvent.withdrawal.shares],
        ];
      });

      it("Deposits paused", async function () {
        await expect(iVault.connect(staker).deposit(randomBI(18), staker.address)).to.be.revertedWithCustomError(
          iVault,
          "InceptionOnPause",
        );
      });

      it("Withdrawals paused", async function () {
        const shares = await iToken.balanceOf(staker.address);
        await expect(iVault.connect(staker).withdraw(shares, staker.address)).to.be.revertedWithCustomError(
          iVault,
          "InceptionOnPause",
        );
      });

      it("forceUndelegateRecovery: only iVault operator can", async function () {
        await expect(
          iVault.connect(staker).forceUndelegateRecovery(delegatedNodeOperator1, restaker),
        ).to.be.revertedWithCustomError(iVault, "OnlyOperatorAllowed");
      });

      it("Fix ratio with forceUndelegateRecovery", async function () {
        const pendingWwlsBefore = await iVault.getPendingWithdrawalAmountFromEL();
        await iVault.connect(iVaultOperator).forceUndelegateRecovery(delegatedNodeOperator1, restaker);
        const pendingWwlsAfter = await iVault.getPendingWithdrawalAmountFromEL();
        const ratioAfter = await iVault.ratio();
        console.log(`Ratio after ${ratioAfter}`);
        expect(pendingWwlsAfter - pendingWwlsBefore).to.be.eq(delegatedNodeOperator1);
      });

      it("Add rewards to strategy", async function () {
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
      });

      it("Claim force undelegate", async function () {
        await mineBlocks(minWithdrawalDelayBlocks);
        const restaker = nodeOperatorToRestaker.get(nodeOperator.address);
        const iVaultBalanceBefore = await asset.balanceOf(iVault.address);

        console.log(`iVault balance before: ${iVaultBalanceBefore.format()}`);
        await iVault.connect(staker).claimCompletedWithdrawals(restaker, [withdrawalData1]);

        const iVaultBalanceAfter = await asset.balanceOf(iVault.address);
        const pendingWwlsAfter = await iVault.getPendingWithdrawalAmountFromEL();
        console.log(`iVault balance after: ${iVaultBalanceAfter.format()}`);
        console.log(`Pending wwls after: ${pendingWwlsAfter.format()}`);
        console.log(`Ratio after: ${await iVault.ratio()}`);
      });
    });

    describe("UndelegateFrom: negative cases", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit(randomBI(19), staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        console.log(`Delegated amount: \t${freeBalance.format()}`);
      });

      const invalidArgs = [
        {
          name: "0 amount",
          amount: async () => 0n,
          nodeOperator: async () => nodeOperators[0],
          operator: () => iVaultOperator,
          error: "StrategyManager._removeShares: shareAmount should not be zero!",
        },
        {
          name: "from unknown operator",
          amount: async () => await iVault.getDelegatedTo(nodeOperators[0]),
          nodeOperator: async () => randomAddress(),
          operator: () => iVaultOperator,
          isCustom: true,
          error: "OperatorNotRegistered",
        },
        {
          name: "from _MOCK_ADDRESS",
          amount: async () => await iVault.getDelegatedTo(nodeOperators[0]),
          nodeOperator: async () => {
            await iVault.addELOperator(nodeOperators[1]);
            return nodeOperators[1];
          },
          operator: () => iVaultOperator,
          isCustom: true,
          error: "NullParams",
        },
        {
          name: "from zero address",
          amount: async () => await iVault.getDelegatedTo(nodeOperators[0]),
          nodeOperator: async () => ethers.ZeroAddress,
          operator: () => iVaultOperator,
          isCustom: true,
          error: "OperatorNotRegistered",
        },
        {
          name: "not an operator",
          amount: async () => await iVault.getDelegatedTo(nodeOperators[0]),
          nodeOperator: async () => nodeOperators[0],
          operator: () => staker,
          isCustom: true,
          error: "OnlyOperatorAllowed",
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`Reverts: when undelegates ${arg.name}`, async function () {
          const amount = await arg.amount();
          const nodeOperator = await arg.nodeOperator();
          console.log(`Undelegate amount: \t${amount.format()}`);
          if (arg.isCustom) {
            await expect(
              iVault.connect(arg.operator()).undelegateFrom(nodeOperator, amount),
            ).to.be.revertedWithCustomError(iVault, arg.error);
          } else {
            await expect(iVault.connect(arg.operator()).undelegateFrom(nodeOperator, amount)).to.be.revertedWith(
              arg.error,
            );
          }
        });
      });

      it("Reverts: undelegate when iVault is paused", async function () {
        const amount = randomBI(18);
        await iVault.pause();
        await expect(iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], amount)).to.be.revertedWith(
          "Pausable: paused",
        );
        await iVault.unpause();
      });
    });

    describe.skip("UndelegateVault: negative cases", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit(randomBI(19), staker.address);
        const amount = await iVault.totalAssets();
        await iVault.connect(iVaultOperator).depositAssetIntoStrategyFromVault(amount);
        await iVault
          .connect(iVaultOperator)
          .delegateToOperatorFromVault(nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        console.log(`Delegated amount: \t${amount.format()}`);
      });

      const invalidArgs = [
        {
          name: "0 amount",
          amount: async () => 0n,
          operator: () => iVaultOperator,
          error: "StrategyManager._removeShares: shareAmount should not be zero!",
        },
        {
          name: "not an operator",
          amount: async () => await iVault.getDelegatedTo(nodeOperators[0]),
          operator: () => staker,
          isCustom: true,
          error: "OnlyOperatorAllowed",
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`Reverts: when undelegates ${arg.name}`, async function () {
          const amount = await arg.amount();
          console.log(`Undelegate amount: \t${amount.format()}`);
          if (arg.isCustom) {
            await expect(iVault.connect(arg.operator()).undelegateVault(amount)).to.be.revertedWithCustomError(
              iVault,
              arg.error,
            );
          } else {
            await expect(iVault.connect(arg.operator()).undelegateVault(amount)).to.be.revertedWith(arg.error);
          }
        });
      });

      it("Reverts: undelegate when iVault is paused", async function () {
        const amount = randomBI(18);
        await iVault.pause();
        await expect(iVault.connect(iVaultOperator).undelegateVault(amount)).to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
      });
    });

    describe("UndelegateFrom and redeem in a loop", function () {
      let ratio,
        stakers,
        withdrawals = new Map();

      before(async function () {
        await snapshot.restore();
        await new Promise(r => setTimeout(r, 2000));
        stakers = [staker, staker2];
        //Deposit and delegate
        for (const s of stakers) {
          await iVault.connect(s).deposit(randomBI(19), s.address);
        }
        const amount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        ratio = await iVault.ratio();
        console.log(`Ratio ${ratio.toString()}`);
      });

      const count = 10;
      for (let i = 0; i < count; i++) {
        it(`${i}. Iteration`, async function () {
          withdrawals.set(staker.address, 0n);
          withdrawals.set(staker2.address, 0n);

          //Withdraw staker1 only
          let shares = randomBI(16);
          await iVault.connect(staker).withdraw(shares, staker.address);
          let w = withdrawals.get(staker.address);
          withdrawals.set(staker.address, w + shares);

          //Withdraw EL#1
          const totalPW1 = await iVault.totalAmountToWithdraw();
          console.log(`Total pending withdrawals#1: ${totalPW1}`);
          let tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], totalPW1);
          const w1data = await withdrawDataFromTx(tx, nodeOperators[0], nodeOperatorToRestaker.get(nodeOperators[0]));
          const totalPWEL1 = await iVault.getPendingWithdrawalAmountFromEL();
          expect(totalPWEL1).to.be.closeTo(totalPW1, transactErr);

          //Withdraw staker and staker2
          for (const s of stakers) {
            const shares = randomBI(16);
            await iVault.connect(s).withdraw(shares, s.address);
            const w = withdrawals.get(s.address);
            withdrawals.set(s.address, w + shares);
          }

          //Withdraw EL#2
          const totalPW2 = await iVault.totalAmountToWithdraw();
          tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], totalPW2 - totalPWEL1);
          const w2data = await withdrawDataFromTx(tx, nodeOperators[0], nodeOperatorToRestaker.get(nodeOperators[0]));
          const totalPWEL2 = await iVault.getPendingWithdrawalAmountFromEL();
          expect(totalPWEL2 - totalPWEL1).to.be.closeTo(totalPW2 - totalPW1, transactErr);

          await mineBlocks(minWithdrawalDelayBlocks);
          //ClaimEL w1
          await iVault.connect(staker).claimCompletedWithdrawals(w1data[2], [w1data]);
          expect(await iVault.totalAssets()).to.be.closeTo(totalPW1, transactErr * 4n * BigInt(i + 1));
          //ClaimEL w2
          await iVault.connect(staker).claimCompletedWithdrawals(w2data[2], [w2data]);
          expect(await iVault.totalAssets()).to.be.closeTo(totalPW2, transactErr * 4n * BigInt(i + 1));
          expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.eq(0); //Everything was claims from EL;
          console.log(`Total pwwls: ${totalPWEL2.format()}`);
          console.log(`Total assets: ${(await iVault.totalAssets()).format()}`);

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
          expect(staker1BalanceAfter - staker1BalanceBefore).to.be.closeTo(staker1PW, transactErr * 2n);

          //Staker2 redeems
          console.log(`### Staker2 redeems`);
          const staker2RedeemBefore = await iVault.isAbleToRedeem(staker2.address);
          console.log(`Staker redeem epoch ${staker2RedeemBefore}`);
          expect(staker2RedeemBefore[0]).to.be.true;
          await iVault.redeem(staker2.address);
          const staker2BalanceAfter = await asset.balanceOf(staker2.address);
          expect(await iVault.getPendingWithdrawalOf(staker2.address)).to.be.eq(0);
          expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
          expect(staker2BalanceAfter - staker2BalanceBefore).to.be.closeTo(staker2PW, transactErr * 2n);
          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Ratio: ${await iVault.ratio()}`);
        });
      }

      it("Stakers withdraw all and redeem", async function () {
        //Stakers withdraw all
        console.log(`Total pending withdrawals: ${(await iVault.totalAmountToWithdraw()).format()}`);
        for (const s of stakers) {
          const shares = await iToken.balanceOf(s.address);
          await iVault.connect(s).withdraw(shares, s.address);
          const w = withdrawals.get(s.address);
          withdrawals.set(s.address, w + shares);
        }
        //Withdraw and claim from EL
        const amount = await iVault.totalAmountToWithdraw();
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);

        //Stakers redeem
        let stakerCounter = 1;
        for (const s of stakers) {
          console.log(`iToken balance staker${stakerCounter} before:\t\t${await iToken.balanceOf(s.address)}`);
          console.log(`iVault assets before:\t\t\t\t${(await iVault.totalAssets()).format()}`);
          console.log(
            `Pending withdrawal staker${stakerCounter} before:\t${(await iVault.getPendingWithdrawalOf(s.address)).format()}`,
          );
          console.log(`### Staker${stakerCounter} redeems`);
          await iVault.redeem(s.address);
          console.log(
            `Pending withdrawal staker${stakerCounter} after:\t${(await iVault.getPendingWithdrawalOf(s.address)).format()}`,
          );
          console.log(`Ratio: ${await iVault.ratio()}`);
          stakerCounter++;
        }
        expect(await iVault.totalAssets()).to.be.lt(100);
      });
    });

    describe("claimCompletedWithdrawals: claims withdraw from EL", function () {
      let ratio, delegatedAmount, withdrawalAmount, withdrawalData, withdrawalCount, withdrawalAssets;

      before(async function () {
        await snapshot.restore();
        await new Promise(r => setTimeout(r, 2000));
        ratio = await iVault.ratio();

        //Deposit and withdraw
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        delegatedAmount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(delegatedAmount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);

        //Withdraw 10 times
        withdrawalCount = 12;
        for (let i = 0; i < withdrawalCount; i++) {
          await iVault.connect(staker).withdraw(randomBI(18), staker.address);
        }
        withdrawalAmount =
          (await iVault.getPendingWithdrawalOf(staker.address)) + BigInt(withdrawalCount) * transactErr * 2n;
        console.log(`Pending withdrawals: ${withdrawalAmount}`);

        const tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], withdrawalAmount);
        withdrawalData = await withdrawDataFromTx(tx, nodeOperators[0], nodeOperatorToRestaker.get(nodeOperators[0]));
      });

      beforeEach(async function () {
        if (await iVault.paused()) {
          await iVault.unpause();
        }
      });

      it("Reverts: when iVault is paused", async function () {
        await iVault.pause();
        await expect(iVault.claimCompletedWithdrawals(withdrawalData[2], [withdrawalData])).to.be.revertedWith(
          "Pausable: paused",
        );
      });

      it("Reverts: when claim without delay", async function () {
        await expect(
          iVault.connect(staker).claimCompletedWithdrawals(withdrawalData[2], [withdrawalData]),
        ).to.be.revertedWith(
          "DelegationManager._completeQueuedWithdrawal: minWithdrawalDelayBlocks period has not yet passed",
        );
      });

      it("Successful claim from EL", async function () {
        await mineBlocks(minWithdrawalDelayBlocks);
        console.log(`iVault assets before: ${await iVault.totalAssets()}`);
        const epochBefore = await iVault.epoch();
        console.log(`Epoch before: ${epochBefore}`);

        await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData[2], [withdrawalData]);
        console.log(`iVault assets after: ${await iVault.totalAssets()}`);
        console.log(`Epoch after: ${await iVault.epoch()}`);

        expect(await iVault.totalAssets()).to.be.closeTo(withdrawalAmount, transactErr);
        expect(await iVault.epoch()).to.be.eq(epochBefore + BigInt(withdrawalCount));
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
      });

      it("getTotalDeposited() = iVault + EL", async function () {
        const amount = await iVault.getTotalDeposited();
        console.log(`getTotalDeposited: ${amount}`);
        expect(amount).to.be.closeTo(delegatedAmount, transactErr);
      });

      it("Reverts: when claim the 2nd time", async function () {
        await expect(
          iVault.connect(staker).claimCompletedWithdrawals(withdrawalData[2], [withdrawalData]),
        ).to.be.revertedWith("DelegationManager._completeQueuedWithdrawal: action is not in queue");
      });
    });

    describe("claimCompletedWithdrawals: claim multiple undelegates", function () {
      let ratio,
        delegatedAmount,
        withdrawalAmount = 0n,
        withdrawalCount;
      const wDatas = [];

      before(async function () {
        await snapshot.restore();
        ratio = await iVault.ratio();

        //Deposit and withdraw
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        delegatedAmount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(delegatedAmount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);

        //Withdraw and undelegate 10 times
        withdrawalCount = 10;
        for (let i = 0; i < withdrawalCount; i++) {
          const amount = randomBI(18);
          withdrawalAmount += amount;
          await iVault.connect(staker).withdraw(amount, staker.address);
          const tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], amount);
          const wData = await withdrawDataFromTx(tx, nodeOperators[0], nodeOperatorToRestaker.get(nodeOperators[0]));
          wDatas.push(wData);
        }
        await mineBlocks(minWithdrawalDelayBlocks);
      });

      it("Reverts: node operator does not match", async function () {
        await expect(iVault.connect(staker).claimCompletedWithdrawals(ethers.Wallet.createRandom().address, wDatas)).to
          .be.reverted;
      });

      it("Successful claim from EL", async function () {
        const epochBefore = await iVault.epoch();
        console.log(`Epoch before: ${epochBefore}`);

        await iVault.connect(staker).claimCompletedWithdrawals(nodeOperatorToRestaker.get(nodeOperators[0]), wDatas);
        console.log(`iVault assets after: ${await iVault.totalAssets()}`);
        console.log(`Epoch after: ${await iVault.epoch()}`);

        expect(await iVault.getPendingWithdrawalOf(staker.address)).to.be.closeTo(
          withdrawalAmount,
          transactErr * BigInt(withdrawalCount),
        );
        expect(await iVault.totalAssets()).to.be.closeTo(withdrawalAmount, transactErr * BigInt(withdrawalCount));
        expect(await iVault.epoch()).to.be.eq(epochBefore + BigInt(withdrawalCount));
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
      });
    });

    describe("Redeem: retrieves assets after they were taken from EL", function () {
      let ratio, stakerAmount, staker2Amount, stakerUnstakeAmount, staker2UnstakeAmount, firstDeposit;
      before(async function () {
        await snapshot.restore();
        await asset.connect(staker3).approve(await iVault.getAddress(), e18);
        await iVault.connect(staker3).deposit(e18, staker3.address);
        firstDeposit = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(firstDeposit, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await iVault.setTargetFlashCapacity(1n);
        ratio = await iVault.ratio();
      });

      it("Stakers deposit", async function () {
        stakerAmount = 9399680561290658040n;
        await iVault.connect(staker).deposit(stakerAmount, staker.address);
        staker2Amount = 1348950494309030813n;
        await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(await iVault.getFreeBalance(), nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        console.log(`Staker amount: ${stakerAmount}`);
        console.log(`Staker2 amount: ${staker2Amount}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("maxRedeem returns maximum amount of shares that can be redeemed from the owner balance", async function () {
        expect(await iVault.maxRedeem(staker)).to.be.eq(await iToken.balanceOf(staker));
        expect(await iVault.maxRedeem(staker2)).to.be.eq(await iToken.balanceOf(staker2));
      });

      it("Staker has nothing to claim yet", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
      });

      it("Staker withdraws half", async function () {
        const shares = await iToken.balanceOf(staker.address);
        stakerUnstakeAmount = shares / 2n;
        await iVault.connect(staker).withdraw(stakerUnstakeAmount, staker.address);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is not able to claim yet", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.false;
      });

      it("Reverts: when redeems the same epoch", async function () {
        await expect(iVault.connect(iVaultOperator).redeem(staker.address)).to.be.revertedWithCustomError(
          iVault,
          "IsNotAbleToRedeem",
        );
      });

      it("updateEpoch without available does not affect pending withdrawals", async function () {
        const wwlBefore = await iVault.claimerWithdrawalsQueue(0);
        const epochBefore = await iVault.epoch();
        await iVault.connect(staker).updateEpoch();

        const wwlAfter = await iVault.claimerWithdrawalsQueue(0);
        const epochAfter = await iVault.epoch();
        expect(wwlBefore).to.be.deep.eq(wwlAfter);
        expect(epochAfter).to.be.eq(epochBefore);
      });

      it("Withdraw and claim from EL 1", async function () {
        const amount = await iVault.totalAmountToWithdraw();
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);
        console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
        console.log(`Pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is now able to claim", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      });

      it("Reverts: redeem when iVault is paused", async function () {
        await iVault.pause();
        await expect(iVault.connect(iVaultOperator).redeem(staker.address)).to.be.revertedWith("Pausable: paused");
      });

      it("Unpause after previous test", async function () {
        await iVault.unpause();
      });

      it("Staker2 withdraws < staker pending withdrawal", async function () {
        const stakerPendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
        staker2UnstakeAmount = stakerPendingWithdrawal / 10n;
        await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
      });

      it("Staker2 is not able to claim yet", async function () {
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.false;
      });

      it("Staker is still able to claim", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      });

      it("Reverts: when staker2 redeems out of turn", async function () {
        await expect(iVault.connect(iVaultOperator).redeem(staker2.address)).to.be.revertedWithCustomError(
          iVault,
          "IsNotAbleToRedeem",
        );
      });

      it("New withdrawal is going to the end of the queue", async function () {
        const shares = (await iToken.balanceOf(staker.address)) / 2n;
        await iVault.connect(staker).withdraw(shares, staker.address);
        stakerUnstakeAmount = stakerUnstakeAmount + shares;
        console.log(`Pending withdrawals: ${await iVault.getPendingWithdrawalOf(staker.address)}`);
        console.log(`Unstake amount: ${stakerUnstakeAmount.toString()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is still able to claim", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
      });

      it("Withdraw and claim from EL to cover only staker2 withdrawal", async function () {
        const amount = await iVault.getPendingWithdrawalOf(staker2.address);
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount + transactErr * 2n);
        console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is able to claim only the 1st wwl", async function () {
        const ableRedeem = await iVault.isAbleToRedeem(staker.address);
        expect(ableRedeem[0]).to.be.true;
        expect([...ableRedeem[1]]).to.have.members([0n]);
      });

      it("Staker2 is able to claim", async function () {
        const ableRedeem = await iVault.isAbleToRedeem(staker2.address);
        expect(ableRedeem[0]).to.be.true;
        expect([...ableRedeem[1]]).to.have.members([1n]);
      });

      it("Deposit and update epoch to cover pending wwls", async function () {
        const totalPWBefore = await iVault.totalAmountToWithdraw();
        const redeemReserveBefore = await iVault.redeemReservedAmount();
        console.log(`Total pending wwls:\t\t${totalPWBefore.format()}`);
        console.log(`Redeem reserve before:\t${redeemReserveBefore.format()}`);

        const amount = totalPWBefore - redeemReserveBefore + 100n;
        await asset.connect(staker3).approve(await iVault.getAddress(), amount);
        await iVault.connect(staker3).deposit(amount, staker3.address);
        await iVault.connect(iVaultOperator).updateEpoch();

        const redeemReserveAfter = await iVault.redeemReservedAmount();
        console.log(`Redeem reserve after:\t${redeemReserveAfter.format()}`);
        expect(redeemReserveAfter).to.be.closeTo(totalPWBefore, transactErr * 4n);

        const ableRedeem = await iVault.isAbleToRedeem(staker.address);
        console.log(`Staker redeem: ${ableRedeem}`);
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;
        expect([...ableRedeem[1]]).to.have.members([0n, 2n]);
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

        expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
          stakerUnstakeAmountAssetValue,
          transactErr * 3n,
        );
        expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 3n);
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
        expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
          stakerUnstakeAmountAssetValue,
          transactErr * 2n,
        );
        expect(stakerBalanceAfter - stakerBalanceBefore).to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2n);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Ratio is ok after all", async function () {
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
      });
    });

    describe("Redeem: to the different addresses", function () {
      let ratio, recipients, pendingShares;

      before(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit("9292557565124725653", staker.address);
        const amount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
      });

      const count = 3;
      for (let j = 0; j < count; j++) {
        it(`${j} Withdraw to 5 random addresses`, async function () {
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

        it(`${j} Withdraw from EL and update ratio`, async function () {
          const amount = await iVault.totalAmountToWithdraw();
          let tx = await iVault.connect(iVaultOperator).undelegateFrom(nodeOperators[0], amount);
          const data = await withdrawDataFromTx(tx, nodeOperators[0], nodeOperatorToRestaker.get(nodeOperators[0]));

          await addRewardsToStrategy(a.assetStrategy, e18, staker3);
          const calculatedRatio = await calculateRatio(iVault, iToken);
          await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
          ratio = await iVault.ratio();
          console.log(`New ratio is: ${ratio}`);

          await mineBlocks(minWithdrawalDelayBlocks);
          await iVault.connect(staker).claimCompletedWithdrawals(data[2], [data]);
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

            expect(rBalanceAfter - rPendingWithdrawalsBefore).to.be.closeTo(0, transactErr);
            expect(rBalanceBefore - rPendingWithdrawalsAfter).to.be.closeTo(0, transactErr);
          }
          expect(await iVault.ratio()).to.be.lte(ratio);
          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Ratio: ${await iVault.ratio()}`);
        });

        it(`${j} Deposit extra from iVault`, async function () {
          const totalDepositedBefore = await iVault.getTotalDeposited();

          const amount = await iVault.getFreeBalance();
          await iVault
            .connect(iVaultOperator)
            .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
          const totalDepositedAfter = await iVault.getTotalDeposited();

          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Ratio: ${await iVault.ratio()}`);

          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(await iVault.totalAssets()).to.be.lte(100);
          expect(await iVault.ratio()).to.be.lte(ratio);
        });
      }

      it("Update asset ratio and withdraw the rest", async function () {
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        ratio = await iVault.ratio();
        console.log(`New ratio is: ${ratio}`);

        //Withdraw all and take from EL
        const shares = await iToken.balanceOf(staker.address);
        await iVault.connect(staker).withdraw(shares, staker.address);
        const amount = await iVault.getTotalDelegated();
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);
        await iVault.connect(iVaultOperator).redeem(staker.address);

        console.log(`iVault total assets: ${await iVault.totalAssets()}`);
        console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
      });
    });

    describe("addRewards: gradually adds amount to the iVault", function () {
      const totalDays = 7n;
      let totalRewardsAmount;
      before(async function () {
        await snapshot.restore();
        await asset.connect(staker3).transfer(iVaultOperator.address, 10n * e18);
        const operatorBalance = await asset.balanceOf(iVaultOperator.address);
        await asset.connect(iVaultOperator).approve(iVault.address, operatorBalance);
        await iVault.connect(deployer).setRewardsTimeline(totalDays * 86400n);
      });

      it("addRewards when there are no other rewards have been added", async function () {
        const operatorBalanceBefore = await asset.balanceOf(iVaultOperator.address);
        const iVaultBalanceBefore = await asset.balanceOf(iVault.address);
        const totalAssetsBefore = await iVault.totalAssets();

        const latestBlock = await ethers.provider.getBlock('latest');
        const nextBlockTimestamp = BigInt(latestBlock.timestamp) + randomBI(2);
        await helpers.time.setNextBlockTimestamp(nextBlockTimestamp);

        totalRewardsAmount = randomBI(17);
        console.log("Amount:", totalRewardsAmount.format());
        await expect(iVault.connect(iVaultOperator).addRewards(totalRewardsAmount))
          .to.emit(iVault, "RewardsAdded")
          .withArgs((amount) => {
            expect(amount).to.be.closeTo(totalRewardsAmount, transactErr)
            return true;
          }, nextBlockTimestamp);

        const operatorBalanceAfter = await asset.balanceOf(iVaultOperator.address);
        const iVaultBalanceAfter = await asset.balanceOf(iVault.address);
        const totalAssetsAfter = await iVault.totalAssets();

        console.log("Operator balance diff:", (operatorBalanceBefore - operatorBalanceAfter).format());
        console.log("iVault balance diff:", (iVaultBalanceAfter - iVaultBalanceBefore).format());
        console.log("Total assets diff:", (totalAssetsAfter - totalAssetsBefore).format());
        expect(operatorBalanceBefore - operatorBalanceAfter).to.be.closeTo(totalRewardsAmount, transactErr);
        expect(iVaultBalanceAfter - iVaultBalanceBefore).to.be.closeTo(totalRewardsAmount, transactErr);
        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(0n, totalDays);
      })

      it("Can not add more rewards until the end of timeline", async function () {
        const amount = randomBI(17);
        await expect(iVault.connect(iVaultOperator).addRewards(amount))
          .to.revertedWithCustomError(iVault, "TimelineNotOver");
      })

      it("Stake some amount", async function() {
        await iVault.connect(staker).deposit(10n * e18, staker.address);
      })

      it("Check total assets every day", async function () {
        let startTimeline = await iVault.startTimeline();
        let latestBlock;
        let daysPassed;
        do {
          const totalAssetsBefore = await iVault.totalAssets();
          await helpers.time.increase(day);
          latestBlock = await ethers.provider.getBlock('latest');
          const currentTime = BigInt(latestBlock.timestamp);
          daysPassed = (currentTime - startTimeline) / day;

          const totalAssetsAfter = await iVault.totalAssets();
          console.log("Total assets increased by:", (totalAssetsAfter - totalAssetsBefore).format());
          console.log("Ratio:", await calculateRatio(iVault, iToken));
          expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(totalRewardsAmount / totalDays, totalDays);

        } while (daysPassed < totalDays)

        console.log("Total assets after:\t\t", (await iVault.totalAssets()).format());
        console.log("iVault balance after:\t", (await asset.balanceOf(iVault.address)).format());
      })

      it("Total assets does not change on a next day after timeline passed", async function() {
        const totalAssetsBefore = await iVault.totalAssets();
        await helpers.time.increase(day);
        const totalAssetsAfter = await iVault.totalAssets();

        console.log("Total assets increased by:", (totalAssetsAfter - totalAssetsBefore).format());
        expect(totalAssetsAfter).to.be.eq(totalAssetsBefore);
      })

      it("New rewards can be added", async function() {
        const operatorBalanceBefore = await asset.balanceOf(iVaultOperator.address);
        const iVaultBalanceBefore = await asset.balanceOf(iVault.address);
        const totalAssetsBefore = await iVault.totalAssets();

        const latestBlock = await ethers.provider.getBlock('latest');
        const nextBlockTimestamp = BigInt(latestBlock.timestamp) + randomBI(2);
        await helpers.time.setNextBlockTimestamp(nextBlockTimestamp);

        totalRewardsAmount = randomBI(17);
        console.log("Amount:", totalRewardsAmount.format());
        await expect(iVault.connect(iVaultOperator).addRewards(totalRewardsAmount))
          .to.emit(iVault, "RewardsAdded")
          .withArgs((amount) => {
            expect(amount).to.be.closeTo(totalRewardsAmount, transactErr)
            return true;
          }, nextBlockTimestamp);

        const operatorBalanceAfter = await asset.balanceOf(iVaultOperator.address);
        const iVaultBalanceAfter = await asset.balanceOf(iVault.address);
        const totalAssetsAfter = await iVault.totalAssets();

        console.log("Operator balance diff:", (operatorBalanceBefore - operatorBalanceAfter).format());
        console.log("iVault balance diff:", (iVaultBalanceAfter - iVaultBalanceBefore).format());
        console.log("Total assets diff:", (totalAssetsAfter - totalAssetsBefore).format());
        expect(operatorBalanceBefore - operatorBalanceAfter).to.be.closeTo(totalRewardsAmount, transactErr);
        expect(iVaultBalanceAfter - iVaultBalanceBefore).to.be.closeTo(totalRewardsAmount, transactErr);
        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(0n, totalDays);
      })
    })

    describe("Redeem all after asset ratio changed", function () {
      let staker1UnstakeAmount, staker2UnstakeAmount, withdrawRatio;
      let TARGET;
      before(async function () {
        await snapshot.restore();
        TARGET = 1000_000n;
        await iVault.setTargetFlashCapacity(TARGET);
      });

      it("Stakers deposit and delegate", async function () {
        const staker1Amount = 9399680561290658040n;
        await iVault.connect(staker).deposit(staker1Amount, staker.address);
        const staker2Amount = 1348950494309030813n;
        await iVault.connect(staker2).deposit(staker2Amount, staker2.address);
        console.log(`Staker desposited:\t${staker1Amount.format()}`);
        console.log(`Staker2 deposited:\t${staker2Amount.format()}`);
        const amount = await iVault.getFreeBalance();
        await iVault
          .connect(iVaultOperator)
          .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        console.log(`Ratio after delegation:\t${await iVault.ratio()}`);
      });

      it("Change ratio - transfer to strategy", async function () {
        console.log(`Ratio before:\t\t${(await iVault.ratio()).format()}`);
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        withdrawRatio = await iVault.ratio();
        console.log(`Ratio after update:\t${withdrawRatio.format()}`);
      });

      it("Staker1 withdraws", async function () {
        staker1UnstakeAmount = await iToken.balanceOf(staker.address);
        expect(staker1UnstakeAmount).to.be.gt(0);
        const expectedPending = await iVault.convertToAssets(staker1UnstakeAmount);
        await iVault.connect(staker).withdraw(staker1UnstakeAmount, staker.address);
        const pendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
        console.log(`Pending withdrawal:\t${pendingWithdrawal.format()}`);

        expect(pendingWithdrawal).to.be.closeTo(expectedPending, transactErr);
        expect(pendingWithdrawal).to.be.closeTo((staker1UnstakeAmount * e18) / withdrawRatio, transactErr * 3n);
        console.log(`Ratio after:\t\t\t${await iVault.ratio()}`);
      });

      it("Staker2 withdraws", async function () {
        staker2UnstakeAmount = await iToken.balanceOf(staker2.address);
        expect(staker2UnstakeAmount).to.be.gt(0);
        const expectedPending = await iVault.convertToAssets(staker2UnstakeAmount);
        await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
        const pendingWithdrawal = await iVault.getPendingWithdrawalOf(staker2.address);
        console.log(`Pending withdrawal:\t${pendingWithdrawal.format()}`);

        expect(pendingWithdrawal).to.be.closeTo(expectedPending, transactErr);
        expect(pendingWithdrawal).to.be.closeTo((staker2UnstakeAmount * e18) / withdrawRatio, transactErr * 3n);
        console.log(`Ratio after: ${await iVault.ratio()}`);
      });

      it("Withdraw and claim from EL", async function () {
        console.log(`Total assets before: ${(await iVault.totalAssets()).format()}`);
        const amount = await iVault.totalAmountToWithdraw();
        await iVault.withdrawFromELAndClaim(nodeOperators[0], amount);
        console.log(`Total assets after: ${(await iVault.totalAssets()).format()}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Stakers are able to redeem", async function () {
        expect((await iVault.isAbleToRedeem(staker.address))[0]).to.be.true;

        console.log(
          `--- Going to change target flash capacity and transfer 1000 wei${a.assetName} to iVault to supply withdrawals ---`,
        );
        await iVault.setTargetFlashCapacity(1n);
        await asset.connect(staker3).transfer(iVault.address, 1000n);
        await iVault.connect(staker3).updateEpoch();
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
      });

      it("Staker redeems withdrawals", async function () {
        console.log(`Ratio: ${await iVault.ratio()}`);
        const stakerBalanceBefore = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
        await iVault.redeem(staker.address);
        const stakerBalanceAfter = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

        console.log(`Staker balance after: ${stakerBalanceAfter.format()}`);
        console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);

        expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
          stakerBalanceAfter - stakerBalanceBefore,
          transactErr,
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

        console.log(`Staker balance after: ${stakerBalanceAfter.format()}`);
        console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter}`);

        expect(stakerPendingWithdrawalsBefore - stakerPendingWithdrawalsAfter).to.be.closeTo(
          stakerBalanceAfter - stakerBalanceBefore,
          transactErr,
        );
        console.log(`Ratio: ${await iVault.ratio()}`);
      });
    });

    //Deprecated flow. Ratio calculation moved to the backend
    describe.skip("iToken ratio depends on the ratio of strategies", function () {
      before(async function () {
        await snapshot.restore();
        await iVault.connect(staker).deposit(e18, staker.address);
        const amount = await iVault.totalAssets();
      });

      it("Ratio is not affected by strategy rewards until the first deposit to EL", async function () {
        const ratioBefore = await iVault.ratio();
        await addRewardsToStrategy(a.assetStrategy, toWei(1), staker2);
        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${ratioBefore.format()}`);
        console.log(`Ratio after:\t${ratioAfter.format()}`);
        console.log(`Diff:\t\t\t${(ratioBefore - ratioAfter).format()}`);

        expect(ratioAfter).to.be.eq(ratioBefore);
      });

      it("Ratio declines along with the ratio of rebase-like asset", async function () {
        const ratioBefore = await iVault.ratio();
        await asset.connect(staker2).transfer(await iVault.getAddress(), toWei(1));
        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${ratioBefore.format()}`);
        console.log(`Ratio after:\t${ratioAfter.format()}`);
        console.log(`Diff:\t\t\t${(ratioBefore - ratioAfter).format()}`);

        expect(ratioAfter).to.be.lt(ratioBefore);
      });

      const testData = [
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" },
      ];

      testData.forEach(function (test) {
        it(`Ratio declines when the strategy rewards are growing: ${test.amount}`, async function () {
          const amount = await iVault.totalAssets();
          if (amount > 10n) {
            await iVault
              .connect(iVaultOperator)
              .delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
          }
          const ratioBefore = await iVault.ratio();
          await addRewardsToStrategy(a.assetStrategy, test.amount, staker2);
          const ratioAfter = await iVault.ratio();

          console.log(`Ratio before:\t${ratioBefore.format()}`);
          console.log(`Ratio after:\t${ratioAfter.format()}`);
          console.log(`Diff:\t\t\t${(ratioBefore - ratioAfter).format()}`);

          expect(ratioAfter).to.be.lt(ratioBefore);
        });
      });
    });
  });
});
