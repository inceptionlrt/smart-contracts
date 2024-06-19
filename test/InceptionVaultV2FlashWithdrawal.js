const { ethers, upgrades, network } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
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
  sleep,
} = require("./helpers/utils.js");
const { takeSnapshot } = require("@nomicfoundation/hardhat-network-helpers");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

assets = [
  // {
  //   assetName: "lsEth",
  //   assetAddress: "0x1d8b30cC38Dba8aBce1ac29Ea27d9cFd05379A09",
  //   assetPoolName: "MockPool",
  //   assetPool: "x_x_x",
  //   vaultName: "InmEthVault",
  //   vaultFactory: "InVault_E1",
  //   strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
  //   assetStrategy: "0x05037A81BD7B4C9E0F7B430f1F2A22c31a2FD943",
  //   iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
  //   delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
  //   withdrawalDelayBlocks: 10,
  //   ratioErr: 2n,
  //   transactErr: 5n,
  //   // blockNumber: 18943377,
  //   impersonateStaker: async (staker, iVault, asset, assetPool) => {
  //     const donor = await impersonateWithEth("0xa2fB8224C34a2E8711d6494aB71F24c68B38c442", toWei(1));
  //     console.log(`balance: ${await asset.balanceOf(donor.address)}`);
  //     await asset.connect(donor).transfer(staker.address, toWei(32));
  //     const balanceAfter = await asset.balanceOf(staker.address);
  //     await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
  //     console.log(`allowance: ${await asset.allowance(staker.address, await iVault.getAddress())}`);
  //     return staker;
  //   },
  // },
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
    withdrawalDelayBlocks: 10,
    ratioErr: 2n,
    transactErr: 5n,
    withdrawErr: 0n,
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
    withdrawalDelayBlocks: 10,
    ratioErr: 3n,
    transactErr: 4n,
    withdrawErr: 1n,
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
const initVault = async (a) => {
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
  console.log("- InceptionLibrary");
  const iLibrary = await ethers.deployContract("InceptionLibrary");
  // 4. Inception vault
  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, { libraries: { InceptionLibrary: await iLibrary.getAddress() } });
  const iVault = await iVaultFactory.deploy();
  await iVault.initialize(a.vaultName, a.iVaultOperator, a.strategyManager, await iToken.getAddress(), a.assetStrategy);

  iVault.address = await iVault.getAddress();

  await iVault.on("DelegatedTo", (restaker, elOperator) => {
    nodeOperatorToRestaker.set(elOperator, restaker);
    console.log(`===Restaker to operator ${elOperator}, ${restaker}`);
  });

  console.log("- Delegation manager");
  const delegationManager = await ethers.getContractAt("IDelegationManager", a.delegationManager);
  await delegationManager.on("WithdrawalQueued", (newRoot, migratedWithdrawal) => {
    console.log(`===Withdrawal queued: ${migratedWithdrawal.shares[0]}`);
  });

  // deploy InceptonRatioFeed
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  console.log(`ratioFeed: ${await ratioFeed.getAddress()}`);
  await ratioFeed.updateRatioBatch([await iToken.getAddress()], [e18]);

  await iVault.setDelegationManager(a.delegationManager);
  await iVault.upgradeTo(await restakerImp.getAddress());
  await iVault.setRatioFeed(await ratioFeed.getAddress());
  await iVault.addELOperator(nodeOperators[0]);
  await iToken.setVault(await iVault.getAddress());
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

  return [iToken, iVault, ratioFeed, asset, assetPool, strategy, iVaultOperator, restakerImp, delegationManager];
};

assets.forEach(function (a) {
  describe(`Inception pool V2 ${a.assetName}`, function () {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, assetPool, strategy, restakerImp, delegationManager;
    let iVaultOperator, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;
    let TARGET;

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
            jsonRpcUrl: a.url ? a.url : config.networks.hardhat.forking.url,
            blockNumber: a.blockNumber ? a.blockNumber : config.networks.hardhat.forking.blockNumber,
          },
        },
      ]);

      [iToken, iVault, ratioFeed, asset, assetPool, strategy, iVaultOperator, restakerImp, delegationManager] = await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();
      staker = await a.impersonateStaker(staker, iVault, asset, assetPool);
      staker2 = await a.impersonateStaker(staker2, iVault, asset, assetPool);
      staker3 = await a.impersonateStaker(staker3, iVault, asset, assetPool);
      treasury = await iVault.treasury();
      snapshot = await helpers.takeSnapshot();
    });

    after(async function () {
      await iVault.removeAllListeners();
      await delegationManager.removeAllListeners();
    });

    describe("Base flow", function () {
      let deposited, freeBalance, depositFees;
      before(async function () {
        await snapshot.restore();
        TARGET = toWei(15);
        await iVault.setTargetFlashCapacity(TARGET);
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
        freeBalance = toWei(5);
        deposited = TARGET + freeBalance;
        const expectedShares = (deposited * e18) / (await iVault.ratio());
        const tx = await iVault.connect(staker).deposit(deposited, staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(deposited, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);
        expect(receipt.logs.find((l) => l.eventName === "DepositBonus")).to.be.undefined;
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

        const amount = await iVault.getFreeBalance();
        await expect(iVault.connect(iVaultOperator).delegateToOperator(amount, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]))
          .to.emit(iVault, "DelegatedTo")
          .withArgs((stakerAddress) => {
            expect(stakerAddress).to.be.properAddress;
            expect(stakerAddress).to.be.not.eq(ethers.ZeroAddress);
            return true;
          }, nodeOperators[0]);
        const delegatedTotal = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(nodeOperators[0]);
        expect(totalDepositedBefore).to.be.eq(await iVault.getTotalDeposited());
        expect(delegatedTotal).to.be.closeTo(amount, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(await iVault.getFreeBalance()).to.be.closeTo(0n, 1n);
        expect(await iVault.getFlashCapacity()).to.be.closeTo(TARGET, 1n);
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
        const expectedFee = await iVault.calculateFlashUnstakeFee(amount);
        console.log(`Amount:\t\t\t\t\t${amount.format()}`);
        console.log(`Shares:\t\t\t\t\t${shares.format()}`);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        let tx = await iVault.connect(staker).flashWithdraw(shares, receiver.address);
        const receipt = await tx.wait();
        const withdrawEvent = receipt.logs?.filter((e) => e.eventName === "FlashWithdraw");
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
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        console.log(`Shares:\t\t\t\t\t\t\t${shares.format()}`);
        console.log(`Asset value:\t\t\t\t\t${assetValue.format()}`);
        const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => e.eventName === "Withdraw");
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
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Withdraw from EigenLayer and claim", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const amount = await iVault.totalAmountToWithdraw();
        console.log(`Total deposited after:\t\t\t${totalDepositedBefore.format()}`);
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
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Redeem withdraw", async function () {
        const balanceBefore = await asset.balanceOf(staker2.address);
        const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

        const tx = await iVault.connect(iVaultOperator).redeem(staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => e.eventName === "Redeem");
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

    describe("Deposit", function () {
      let ratio;

      const states = [
        {
          name: "there is no bonus and nothing delegated to EL",
          withBonus: false,
          delegatedBefore: false,
        },
        {
          name: "bonus is available and nothing delegated to EL",
          withBonus: true,
          delegatedBefore: false,
        },
        {
          name: "bonus is available and some amount delegated to EL",
          withBonus: true,
          delegatedBefore: true,
        },
      ];

      const amounts = [
        {
          name: "for the first time",
          predepositAmount: () => 0n,
          amount: () => randomBIMax(TARGET / 4n) + TARGET / 4n,
          receiver: () => staker.address,
        },
        {
          name: "more",
          predepositAmount: () => TARGET / 3n,
          amount: () => randomBIMax(TARGET / 3n),
          receiver: () => staker.address,
        },
        {
          name: "up to target cap",
          predepositAmount: () => TARGET / 10n,
          amount: () => (TARGET * 9n) / 10n,
          receiver: () => staker.address,
        },
        {
          name: "all rewards",
          predepositAmount: () => 0n,
          amount: () => TARGET,
          receiver: () => staker.address,
        },
        {
          name: "up to target cap and above",
          predepositAmount: () => TARGET / 10n,
          amount: () => TARGET,
          receiver: () => staker.address,
        },
        {
          name: "above target cap",
          predepositAmount: () => TARGET,
          amount: () => randomBI(19),
          receiver: () => staker.address,
        },
      ];

      states.forEach(function (state) {
        let localSnapshot;
        let totalBonus = 0n;
        it(`---Prepare state: ${state.name}`, async function () {
          await snapshot.restore();
          ratio = await iVault.ratio();
          TARGET = toWei(15);
          await iVault.setTargetFlashCapacity(TARGET);
          if (state.withBonus) {
            await iVault.connect(staker3).deposit(TARGET / 3n, staker3.address);
            const balanceOf = await iToken.balanceOf(staker3.address);
            const tx = await iVault.connect(staker3).flashWithdraw(balanceOf, staker3.address);
            const rec = await tx.wait();
            const collectedFee = rec.logs.find((l) => l.eventName === "FlashWithdraw")?.args.fee || 0n;
            totalBonus += collectedFee / 2n;
          }
          console.log(`EL balance:\t\t\t${(await iVault.getTotalDelegated()).format()}`);
          console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
          console.log(`Flash pool:\t\t\t${(await iVault.getFlashCapacity()).format()}`);
          console.log(`Available bonus:\t${totalBonus.format()}`);

          if (state.delegatedBefore) {
            //Delegate
            await iVault.connect(staker3).deposit(TARGET + e18, staker3.address);
            const freeBalance = await iVault.getFreeBalance();
            console.log(`Free capacity: ${freeBalance}`);
            await iVault.connect(iVaultOperator).delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
            await addRewardsToStrategy(a.assetStrategy, e18, staker3);
            const calculatedRatio = await calculateRatio(iVault, iToken);
            await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
            //flash withdrawal the rest
            const shares = await iVault.convertToShares(TARGET);
            let tx = await iVault.connect(staker3).flashWithdraw(shares, staker3.address);
            let rec = await tx.wait();
            totalBonus += rec.logs.find((l) => l.eventName === "FlashWithdraw").args.fee || 0n;
          }

          console.log(`EL balance:\t\t\t${(await iVault.getTotalDelegated()).format()}`);
          console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
          console.log(`Flash pool:\t\t\t${(await iVault.getFlashCapacity()).format()}`);
          console.log(`Available bonus:\t${totalBonus.format()}`);
          console.log(`Initial ratio:\t${(await iVault.ratio()).format()}`);
          expect(await iVault.getFlashCapacity()).to.be.closeTo(0n, a.transactErr);
          localSnapshot = await takeSnapshot();
        });

        amounts.forEach(function (arg) {
          it(`Deposit ${arg.name}`, async function () {
            if (localSnapshot) {
              await localSnapshot.restore();
            } else {
              expect(false).to.be.true("Can not restore local snapshot");
            }
            const ratioBefore = await iVault.ratio();

            //Deposit 1st time
            let availableBonus = totalBonus;
            const predepositAmount = arg.predepositAmount();
            let flashCapacityBefore = predepositAmount;
            const receiver = arg.receiver();
            if (predepositAmount > 0n) {
              const calculatedPredepositBonus = await iVault.calculateDepositBonus(predepositAmount);
              const expectedPredepositBonus = availableBonus > calculatedPredepositBonus ? calculatedPredepositBonus : availableBonus;
              availableBonus -= expectedPredepositBonus;
              flashCapacityBefore += expectedPredepositBonus;
              let tx = await iVault.connect(staker).deposit(predepositAmount, receiver);
              let rec = await tx.wait();
              let bonus = rec.logs.find((l) => l.eventName === "DepositBonus")?.args.amount || 0n;
              console.log(`Predeposit expected bonus:\t${expectedPredepositBonus.format()}`);
              console.log(`Predeposit actual bonus:\t${bonus.format()}`);
              console.log(`Bonus left:\t\t\t\t${availableBonus.format()}`);
              expect(await iVault.getFlashCapacity()).to.be.closeTo(flashCapacityBefore, a.transactErr);
            }
            console.log(`Ratio after predeposit:\t${(await iVault.ratio()).format()}`);
            console.log("--------------------------------");

            const stakerSharesBefore = await iToken.balanceOf(receiver);
            const totalDepositedBefore = await iVault.getTotalDeposited();
            const totalAssetsBefore = await iVault.totalAssets();
            console.log(`Target:\t\t\t\t${TARGET.format()}`);
            console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

            const amount = await arg.amount();
            console.log(`amount: ${amount.format()}`);
            const calculatedBonus = await iVault.calculateDepositBonus(amount);
            console.log(`calculatedBonus:\t\t${calculatedBonus.format()}`);
            console.log(`available bonus:\t\t${availableBonus.format()}`);
            const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
            availableBonus -= expectedBonus;
            console.log(`Expected bonus:\t\t${expectedBonus.format()}`);
            const convertedShares = await iVault.convertToShares(amount + expectedBonus);
            const expectedShares = ((amount + expectedBonus) * (await iVault.ratio())) / e18;

            const tx = await iVault.connect(staker).deposit(amount, receiver);
            const receipt = await tx.wait();
            const depositEvent = receipt.logs?.filter((e) => e.eventName === "Deposit");
            expect(depositEvent.length).to.be.eq(1);
            expect(depositEvent[0].args["sender"]).to.be.eq(staker.address);
            expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
            expect(depositEvent[0].args["amount"]).to.be.closeTo(amount, transactErr);
            expect(depositEvent[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);
            //DepositBonus event
            expect(receipt.logs.find((l) => l.eventName === "DepositBonus")?.args.amount || 0n).to.be.closeTo(expectedBonus, transactErr);

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

    describe("Flash withdrawal", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await iVault.connect(staker3).deposit(toWei(10), staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegateToOperator(freeBalance, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        TARGET = toWei(15);
        await iVault.setTargetFlashCapacity(TARGET);
      });

      const args = [
        {
          name: "part of the free balance when pool capacity > TARGET",
          poolCapacity: () => TARGET + e18,
          amount: async () => (await iVault.getFreeBalance()) / 2n,
          receiver: () => staker,
        },
        {
          name: "all of the free balance when pool capacity > TARGET",
          poolCapacity: () => TARGET + e18,
          amount: async () => await iVault.getFreeBalance(),
          receiver: () => staker,
        },
        {
          name: "all when pool capacity > TARGET",
          poolCapacity: () => TARGET + e18,
          amount: async () => await iVault.getFlashCapacity(),
          receiver: () => staker,
        },
        {
          name: "partially when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => (await iVault.getFlashCapacity()) / 2n,
          receiver: () => staker,
        },
        {
          name: "all when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => await iVault.getFlashCapacity(),
          receiver: () => staker,
        },
        {
          name: "partially when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => (await iVault.getFlashCapacity()) / 2n,
          receiver: () => staker,
        },
        {
          name: "all when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => await iVault.getFlashCapacity(),
          receiver: () => staker,
        },
      ];

      args.forEach(function (arg) {
        it(`Flash withdrawal: ${arg.name}`, async function () {
          //Deposit
          const predepositAmount = arg.poolCapacity();
          await iVault.connect(staker).deposit(predepositAmount, staker.address);

          //flashWithdraw
          const ratioBefore = await iVault.ratio();
          console.log(`Ratio before:\t${ratioBefore.format()}`);

          const sharesBefore = await iToken.balanceOf(staker);
          const assetBalanceBefore = await asset.balanceOf(staker);
          const treasuryBalanceBefore = await asset.balanceOf(treasury);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const totalAssetsBefore = await iVault.totalAssets();
          const flashCapacityBefore = await iVault.getFlashCapacity();
          const freeBalanceBefore = await iVault.getFreeBalance();
          console.log(`flashCapacityBefore: ${flashCapacityBefore.format()}`);
          console.log(`freeBalanceBefore: ${freeBalanceBefore.format()}`);

          const amount = await arg.amount();
          const shares = await iVault.convertToShares(amount);
          const receiver = await arg.receiver();
          const expectedFee = await iVault.calculateFlashUnstakeFee(amount);
          console.log(`amount: ${amount.format()}`);
          console.log(`shares: ${shares.format()}`);
          console.log(`expected fee: ${expectedFee.format()}`);

          let tx = await iVault.connect(staker).flashWithdraw(shares, receiver.address);
          const receipt = await tx.wait();
          const withdrawEvent = receipt.logs?.filter((e) => e.eventName === "FlashWithdraw");
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
          console.log(`balance diff: ${(sharesBefore - sharesAfter).format()}`);
          console.log(`totalDeposited diff: ${(totalDepositedBefore - totalDepositedAfter).format()}`);
          console.log(`totalAssets diff: ${(totalAssetsBefore - totalAssetsAfter).format()}`);
          console.log(`flashCapacity diff: ${(flashCapacityBefore - flashCapacityAfter).format()}`);
          console.log(`fee: ${fee.format()}`);

          expect(sharesBefore - sharesAfter).to.be.eq(shares);
          expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
          expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
          expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
          expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
          expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, transactErr);
        });
      });
    });

    describe("Deposit rewards calculation", function () {
      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(500);
        await iVault.setTargetFlashCapacity(TARGET);
      });

      const feeFunctions = [
        {
          from: 0n,
          to: toWei(0.25), //25%
          k: -toWei(0.05),
          b: toWei(0.015),
          depositBonus: async function (amount, currentFlashCap) {
            //y1
            const TARGET = await iVault.targetCapacity();
            const currentUtilization = (currentFlashCap * e18) / TARGET;
            const y1 = (-5n * currentUtilization) / 100n + toWei(0.015);
            //y2
            const upperBound = (this.to * TARGET) / e18;
            const replenish = upperBound > amount ? amount : upperBound;
            const targetUtilization = ((currentFlashCap + replenish) * e18) / TARGET;
            const y2 = (-5n * targetUtilization) / 100n + toWei(0.015);

            //(y1+y2)/2
            const medianBonusPercent = (y1 + y2) / 2n;
            //deposit bonus
            //replenish * (y1+y2)/2
            const bonus = (replenish * medianBonusPercent) / e18;
            console.log(`---Section 1`);
            return {
              bonus: bonus,
              replenished: replenish,
            };
          },
        },
        {
          from: toWei(0.25),
          to: toWei(1),
          k: 0n,
          b: toWei(0.0025),
          depositBonus: async function (amount, currentFlashCap) {
            const TARGET = await iVault.targetCapacity();
            const upperBound = (this.to * TARGET) / e18;
            const replenish = upperBound > currentFlashCap + amount ? amount : upperBound - currentFlashCap;
            const bonus = (replenish * toWei(0.0025)) / e18;
            console.log(`---Section 2`);
            return {
              bonus: bonus,
              replenished: replenish,
            };
          },
        },
        {
          from: toWei(1),
          to: ethers.MaxUint256, //inf+
          k: 0n,
          b: 0n,
          depositBonus: async function (amount, currentFlashCap) {
            console.log(`---Section 3`);
            return {
              bonus: 0n,
              replenished: amount,
            };
          },
        },
      ];

      const args = [
        {
          name: "from 0 to 25% of TARGET",
          flashCapacity: () => 0n,
          amount: () => (TARGET * 25n) / 100n,
        },
        {
          name: "from 25% to 100% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amount: () => (TARGET * 75n) / 100n,
        },
        {
          name: "from 0% to 100% of TARGET",
          flashCapacity: () => 0n,
          amount: () => TARGET,
        },
        {
          name: "from 0% to 200% of TARGET",
          flashCapacity: () => 0n,
          amount: () => TARGET * 2n,
        },
        {
          name: "0 to 100Eth",
          flashCapacity: () => 0n,
          amount: () => toWei(100),
        },
        {
          name: "0 to 125Eth",
          flashCapacity: () => 0n,
          amount: () => toWei(125),
        },
        {
          name: "0 to 150Eth",
          flashCapacity: () => 0n,
          amount: () => toWei(150),
        },
        {
          name: "0 to 500Eth",
          flashCapacity: () => 0n,
          amount: () => toWei(500),
        },
        {
          name: "0 to 600Eth",
          flashCapacity: () => 0n,
          amount: () => toWei(600),
        },
      ];

      args.forEach(function (arg) {
        it(`Deposit ${arg.name}`, async function () {
          let flashCapacity = arg.flashCapacity();
          if (flashCapacity > 0n) {
            await iVault.connect(staker).deposit(flashCapacity, staker.address);
          }
          let amount = arg.amount();
          let expectedBonus = 0n;
          while (amount > 0n) {
            for (const feeFunc of feeFunctions) {
              const utilization = (flashCapacity * e18) / TARGET;
              if (amount > 0n && feeFunc.from <= utilization && utilization < feeFunc.to) {
                console.log(`Utilization:\t\t\t${utilization.format()}`);
                const { bonus, replenished } = await feeFunc.depositBonus(amount, flashCapacity);
                console.log(`Replenished:\t\t\t${replenished.format()}`);
                console.log(`Bonus:\t\t\t\t\t${bonus.format()}`);
                flashCapacity += replenished;
                amount -= replenished;
                expectedBonus += bonus;
              }
            }
          }
          let contractBonus = await iVault.calculateDepositBonus(arg.amount());
          console.log(`Expected deposit bonus:\t${expectedBonus.format()}`);
          console.log(`Contract deposit bonus:\t${contractBonus.format()}`);
          expect(contractBonus).to.be.closeTo(expectedBonus, 1n);
        });

        /*        it(`Deposit#2 ${arg.name}`, async function () {
          let flashCapacity = arg.flashCapacity();
          if (flashCapacity > 0n) {
            await iVault.connect(staker).deposit(flashCapacity, staker.address);
          }
          let amount = arg.amount();
          let depositBonus = 0n;
          while (amount > 0n) {
            for(const feeFunc of feeFunctions) {
              const initialUtilization = flashCapacity * e18 / TARGET;
              if(amount > 0n && feeFunc.from <= initialUtilization && initialUtilization < feeFunc.to) {
                console.log(`Utilization:\t\t\t${initialUtilization.format()}`);
                const y1 =  initialUtilization * feeFunc.k / e18  + feeFunc.b;
                //y2
                const upperBound = feeFunc.to * TARGET / e18;
                const replenished = upperBound > flashCapacity + amount ? amount : upperBound - flashCapacity;
                const targetUtilization = (flashCapacity + replenished) * e18 / TARGET;
                const y2 = targetUtilization * feeFunc.k / e18  + feeFunc.b;

                //(y1+y2)/2
                const medianBonusPercent = (y1 + y2) / 2n;
                //deposit bonus
                //replenish * (y1+y2)/2
                const bonus = replenished * medianBonusPercent / e18;
                console.log(`Replenished:\t\t\t${replenished.format()}`);
                console.log(`Bonus:\t\t\t\t\t${bonus.format()}`);
                flashCapacity += replenished;
                amount -= replenished;
                depositBonus += bonus;
              }
            }
          }
          console.log(`Total Deposit bonus:\t${depositBonus.format()}`);
        })*/

        /*        it(`Deposit ${arg.name}`, async function () {
          let flashCapacity = arg.flashCapacity();
          if (flashCapacity > 0n) {
            await iVault.connect(staker).deposit(flashCapacity, staker.address);
          }
          let amount = arg.amount();

          let bonus = await iVault.calculateDepositBonus(amount);
          console.log(`${arg.name}: ${bonus.format()}`);

        })*/
      });
    });

    describe("Withdraw fee calculation", function () {
      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(100);
        await iVault.setTargetFlashCapacity(TARGET);
      });

      const feeFunctions = [
        {
          from: ethers.MaxUint256, //inf+
          to: toWei(1),
          k: 0n,
          b: 0n,
          withdrawFee: async function (amount, currentFlashCap) {
            console.log(`---Section 3`);
            const TARGET = await iVault.targetCapacity();
            const replenish = TARGET > currentFlashCap - amount ? currentFlashCap - TARGET : amount;
            return {
              fee: 0n,
              replenished: replenish,
            };
          },
        },
        {
          from: toWei(1),
          to: toWei(0.25),
          k: 0n,
          b: toWei(0.005),
          withdrawFee: async function (amount, currentFlashCap) {
            const TARGET = await iVault.targetCapacity();
            const lowerBound = (this.to * TARGET) / e18;
            const replenish = lowerBound > currentFlashCap - amount ? currentFlashCap - lowerBound : amount;
            const fee = (replenish * toWei(0.005)) / e18;
            console.log(`---Section 2`);
            return {
              fee: fee,
              replenished: replenish,
            };
          },
        },
        {
          from: toWei(0.25), //25%
          to: 0n,
          k: -toWei(0.1),
          b: toWei(0.03),
          withdrawFee: async function (amount, currentFlashCap) {
            //y1
            const TARGET = await iVault.targetCapacity();
            const currentUtilization = (currentFlashCap * e18) / TARGET;
            const y1 = -currentUtilization / 10n + toWei(0.03);
            //y2
            const replenish = amount;
            const targetUtilization = ((currentFlashCap - replenish) * e18) / TARGET;
            const y2 = -targetUtilization / 10n + toWei(0.03);

            //(y1+y2)/2
            const medianBonusPercent = (y1 + y2) / 2n;
            //deposit bonus
            //replenish * (y1+y2)/2
            const fee = (replenish * medianBonusPercent) / e18;
            console.log(`---Section 1`);
            return {
              fee: fee,
              replenished: replenish,
            };
          },
        },
      ];

      const args = [
        {
          name: "from 200% to 100% of TARGET",
          flashCapacity: () => TARGET * 2n,
          amountPercent: () => 50n, //the half of flash capacity
        },
        {
          name: "from 100% to 25% of TARGET",
          flashCapacity: () => TARGET,
          amountPercent: () => 75n,
        },
        {
          name: "from 25 to 0% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amountPercent: () => 100n,
        },
        {
          name: "from 100% to 0% of TARGET",
          flashCapacity: () => TARGET,
          amountPercent: () => 100n,
        },
        {
          name: "from 200% to 0% of TARGET",
          flashCapacity: () => TARGET * 2n,
          amountPercent: () => 100n,
        },
        {
          name: "20Eth",
          flashCapacity: () => toWei(20),
          amountPercent: () => 100n,
        },
        {
          name: "25Eth",
          flashCapacity: () => toWei(25),
          amountPercent: () => 100n,
        },
        {
          name: "30Eth",
          flashCapacity: () => toWei(30),
          amountPercent: () => 100n,
        },
        {
          name: "100Eth",
          flashCapacity: () => toWei(100),
          amountPercent: () => 100n,
        },
        {
          name: "120Eth",
          flashCapacity: () => toWei(120),
          amountPercent: () => 100n,
        },
      ];

      args.forEach(function (arg) {
        it(`Flash withdraw ${arg.name}`, async function () {
          let flashCapacity = arg.flashCapacity();
          if (flashCapacity > 0n) {
            await iVault.connect(staker).deposit(flashCapacity + a.withdrawErr * 2n, staker.address);
          }
          const initialCapacity = await iVault.getFlashCapacity();
          console.log(`Initial capacity:\t\t${initialCapacity.format()}`);

          const amount = (initialCapacity * arg.amountPercent()) / 100n;
          let _amount = amount;
          let expectedFee = 0n;
          while (_amount > 0n) {
            for (const feeFunc of feeFunctions) {
              const utilization = (flashCapacity * e18) / TARGET;
              if (_amount > 0n && feeFunc.to < utilization && utilization <= feeFunc.from) {
                console.log(`Utilization:\t\t\t${utilization.format()}`);
                const { fee, replenished } = await feeFunc.withdrawFee(_amount, flashCapacity);
                console.log(`Replenished:\t\t\t${replenished.format()}`);
                console.log(`Bonus:\t\t\t\t\t${fee.format()}`);
                flashCapacity -= replenished;
                _amount -= replenished;
                expectedFee += fee;
              }
            }
          }
          let contractFee = await iVault.calculateFlashUnstakeFee(amount);
          console.log(`Expected withdraw fee:\t${expectedFee.format()}`);
          console.log(`Contract withdraw fee:\t${contractFee.format()}`);
          expect(contractFee).to.be.closeTo(expectedFee, 1n);
        });
      });
    });
  });
});
