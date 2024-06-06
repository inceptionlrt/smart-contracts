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
  // 2. Impersonate operator
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);
  // 3. Staker implementation
  console.log("- Restaker implementation");
  const restakerImp = await ethers.deployContract("InceptionRestaker");
  // 4. Inception vault
  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory);
  const iVault = await upgrades.deployProxy(iVaultFactory, [
    a.vaultName,
    a.iVaultOperator,
    a.strategyManager,
    await iToken.getAddress(),
    a.assetStrategy,
  ]);
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
    let iVaultOperator, staker, staker2, staker3;
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
      TARGET = await iVault.TARGET();
      snapshot = await helpers.takeSnapshot();
    });

    after(async function () {
      await iVault.removeAllListeners();
      await delegationManager.removeAllListeners();
    })

    describe("Deposit", function () {
      let ratio;

      const states = [
        {
          name: "there is no bonus and nothing delegated to EL",
          withBonus: false,
          delegatedBefore: false
        },
        {
          name: "bonus is available and nothing delegated to EL",
          withBonus: true,
          delegatedBefore: false
        },
        {
          name: "bonus is available and some amount delegated to EL",
          withBonus: true,
          delegatedBefore: true
        },
      ]

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
          amount: () => TARGET * 9n / 10n,
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
      ]

      states.forEach(function (state) {
        let localSnapshot;
        let totalBonus = 0n;
        it(`---Prepare state: ${state.name}`, async function () {
          await snapshot.restore();
          ratio = await iVault.ratio();
          if (state.withBonus) {
            await iVault.connect(staker3).deposit(TARGET / 3n, staker3.address);
            const balanceOf = await iToken.balanceOf(staker3.address);
            const tx = await iVault.connect(staker3).flashWithdraw(balanceOf, staker3.address);
            const rec = await tx.wait();
            const collectedFee = rec.logs.find((l) => l.eventName === 'FlashWithdrawFee')?.args.amount || 0n;
            totalBonus += collectedFee / 2n;
          }
          console.log(`EL balance:\t\t\t${(await iVault.getTotalDelegated()).format()}`);
          console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
          console.log(`Flash pool:\t\t\t${(await iVault.currentFlashCapacity()).format()}`);
          console.log(`Available bonus:\t${totalBonus.format()}`);

          if (state.delegatedBefore) {
            //Delegate
            await iVault.connect(staker3).deposit(TARGET + e18, staker3.address);
            const totalAssets = await iVault.totalAssets();
            const redeemReservedAmount = await iVault.redeemReservedAmount();
            const currentFlashCapacity = await iVault.currentFlashCapacity();
            const freeCapacity = totalAssets - redeemReservedAmount - currentFlashCapacity - totalBonus;
            console.log(`Free capacity: ${freeCapacity}`);
            await iVault.connect(iVaultOperator).delegateToOperator(freeCapacity, nodeOperators[0], ethers.ZeroHash, [ethers.ZeroHash, 0]);
            await addRewardsToStrategy(a.assetStrategy, e18, staker3);
            //flash withdrawal the rest
            const shares = await iVault.convertToShares(TARGET);
            let tx = await iVault.connect(staker3).flashWithdraw(shares, staker3.address);
            let rec = await tx.wait();
            totalBonus += (rec.logs.find((l) => l.eventName === 'FlashWithdrawFee').args.amount || 0n);
          }

          console.log(`EL balance:\t\t\t${(await iVault.getTotalDelegated()).format()}`);
          console.log(`Total assets:\t\t${(await iVault.totalAssets()).format()}`);
          console.log(`Flash pool:\t\t\t${(await iVault.currentFlashCapacity()).format()}`);
          console.log(`Available bonus:\t${totalBonus.format()}`);
          console.log(`Initial ratio:\t${(await iVault.ratio()).format()}`);
          expect(await iVault.currentFlashCapacity()).to.be.closeTo(0n, 1n);
          localSnapshot = await takeSnapshot();
        })

        amounts.forEach(function (arg) {
          it(`Deposit ${arg.name}`, async function () {
            if (localSnapshot) {
              await localSnapshot.restore();
            } else {
              expect(false).to.be.true("Can not restore local snapshot");
            }
            const ratioBefore = await iVault.ratio();
            console.log(`Initial ratio:\t${ratioBefore.format()}`);

            //Deposit 1st time
            let availableBonus = totalBonus;
            const predepositAmount = arg.predepositAmount();
            const receiver = arg.receiver();
            const flashCapacityBefore = TARGET >= predepositAmount ? predepositAmount : TARGET;
            if (predepositAmount > 0n) {
              await iVault.connect(staker).deposit(predepositAmount, receiver);
              const predepositBonus = await iVault.calculateDepositBonus(flashCapacityBefore, 0n);
              availableBonus = (availableBonus - predepositBonus) > 0 ? availableBonus - predepositBonus : 0n;
            }
            console.log(`Ratio after predeposit:\t${(await iVault.ratio()).format()}`);

            const balanceBefore = await iToken.balanceOf(receiver);
            const totalDepositedBefore = await iVault.getTotalDeposited();
            const totalAssetsBefore = await iVault.totalAssets();
            console.log(`Target: ${TARGET.format()}`);
            console.log(`flashCapacityBeforeCalc: ${flashCapacityBefore.format()}`);
            console.log(`flashCapacityBefore: ${(await iVault.currentFlashCapacity()).format()}`);

            const amount = await arg.amount();
            console.log(`amount: ${amount.format()}`);
            const lack = TARGET - flashCapacityBefore;
            console.log(`lack: ${lack.format()}`);
            const replenishedAmount = lack > 0 ? (lack >= amount ? amount : lack) : 0n;
            console.log(`replenishedAmount: ${replenishedAmount.format()}`);
            const calculatedBonus = await iVault.calculateDepositBonus(replenishedAmount, (flashCapacityBefore * e18) / TARGET);

            console.log(`calculatedBonus: ${calculatedBonus.format()}`);
            console.log(`available bonus: ${availableBonus.format()}`);
            const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
            console.log(`Expected bonus: ${expectedBonus.format()}`);
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
            expect(receipt.logs.find((l) => l.eventName === 'DepositBonus')?.args.amount || 0n).to.be.closeTo(expectedBonus, transactErr);

            const balanceAfter = await iToken.balanceOf(receiver);
            const totalDepositedAfter = await iVault.getTotalDeposited();
            const totalAssetsAfter = await iVault.totalAssets();
            const flashCapacityAfter = await iVault.currentFlashCapacity();
            const ratioAfter = await iVault.ratio();
            console.log(`Ratio after:\t${ratioAfter.format()}`);
            console.log(`Rewards after:\t${(availableBonus - expectedBonus).format()}`);

            expect(balanceAfter - balanceBefore).to.be.closeTo(expectedShares, transactErr);
            expect(balanceAfter - balanceBefore).to.be.closeTo(convertedShares, transactErr);

            expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount + expectedBonus, transactErr);
            expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
            expect(flashCapacityAfter).to.be.closeTo(flashCapacityBefore + replenishedAmount, transactErr);
            expect(ratioAfter).to.be.closeTo(ratioBefore, ratioErr); //Ratio stays the same
          })
        })
      })
    })

    describe("Flash withdrawal", function () {

      const args = [
        {
          name: "part when pool capacity is full",
          poolCapacity: () => TARGET,
          freeBalance: () => e18,
          amount: () => TARGET / 4n,
          receiver: () => staker,
        },
        {
          name: "all pool capacity is full",
          poolCapacity: () => TARGET,
          freeBalance: () => e18,
          amount: () => TARGET,
          receiver: () => staker,
        },
        {
          name: "when pool capacity is less than target",
          poolCapacity: () => TARGET * 3n / 4n,
          freeBalance: () => e18,
          amount: () => TARGET / 4n,
          receiver: () => staker,
        },
        {
          name: "min amount",
          poolCapacity: () => TARGET * 3n / 4n,
          freeBalance: () => e18,
          amount: async () => await iVault.minAmount(),
          receiver: () => staker,
        },

      ]

      args.forEach(function (arg) {
        it(`Flash withdrawal: ${arg.name}`, async function () {
          //Deposit
          const poolCapacity = arg.poolCapacity();
          const freeBalance = arg.freeBalance();
          const predepositAmount = freeBalance > 0 ? TARGET + freeBalance : poolCapacity;
          await iVault.connect(staker).deposit(predepositAmount, staker.address);
          if (poolCapacity < TARGET) {
            const amount = TARGET - poolCapacity;
            await iVault.connect(staker).flashWithdraw(amount, staker.address);
          }

          //flashWithdraw
          const ratioBefore = await iVault.ratio()
          console.log(`Ratio before:\t${ratioBefore.format()}`);

          const balanceBefore = await iToken.balanceOf(staker);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const totalAssetsBefore = await iVault.totalAssets();
          const flashCapacityBefore = await iVault.currentFlashCapacity();
          console.log(`flashCapacityBefore: ${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          const shares = (amount * ratioBefore) / e18;
          const receiver = await arg.receiver();
          const expectedFee = await iVault.calculateFlashUnstakeFee(amount, flashCapacityBefore * e18 / TARGET);
          console.log(`amount: ${amount.format()}`);
          console.log(`exepcted fee: ${expectedFee.format()}`);

          let tx = await iVault.connect(staker).flashWithdraw(shares, receiver.address);
          const receipt = await tx.wait();
          const withdrawEvent = receipt.logs?.filter((e) => e.eventName === "Withdraw");
          expect(withdrawEvent.length).to.be.eq(1);
          expect(withdrawEvent[0].args["sender"]).to.be.eq(staker.address);
          expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address)
          expect(withdrawEvent[0].args["owner"]).to.be.eq(staker.address);
          expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, transactErr);
          expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, transactErr);
          //DepositBonus event
          expect(receipt.logs.find((l) => l.eventName === 'FlashWithdrawFee')?.args.amount || 0n)
            .to.be.closeTo(expectedFee, transactErr);

          const balanceAfter = await iToken.balanceOf(staker);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalAssetsAfter = await iVault.totalAssets();
          const flashCapacityAfter = await iVault.currentFlashCapacity();
          console.log(`balance diff: ${(balanceBefore - balanceAfter).format()}`);
          console.log(`totalDeposited diff: ${(totalDepositedBefore - totalDepositedAfter).format()}`);
          console.log(`totalAssets diff: ${(totalAssetsBefore - totalAssetsAfter).format()}`);
          console.log(`flashCapacity diff: ${(flashCapacityBefore - flashCapacityAfter).format()}`);
        })


      })
    })

  })
})