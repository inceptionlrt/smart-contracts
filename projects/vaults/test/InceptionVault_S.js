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
  zeroWithdrawalData,
} = require("./helpers/utils.js");

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

let mellowRestaker;
const nodeOperators = [
  //Ethereum
  "0xEA9F738eAD0b011030D65A50a43CAc5EC67fD3fD",
  "0xa42CD0029F681b08B61f535E846F2A36F468C1c2",
  "0xe5801326014dB4F6729264Db38F5F5430bc2fbFa",
  "0x2E68D03f2234895b3ba5899B80785E2598ed7FAC",
  "0x5ACCC90436492F24E6aF278569691e2c942A676d",

  //Holesky
  //https://holesky.eigenlayer.xyz/restake
  // "0x78FDDe7a5006cC64E109aeD99cA7B0Ad3d8687bb",
  // "0x1B71f18fc496194b21D0669B5ADfE299a8cFEc42",
  // "0x4Dbfa8bcccb1740d8044E1A093F9A078A88E45FE",
  // "0x5B9A8c72B29Ee17e72ba8B9626Bf43a75B15FB3d",
  // "0x139A091BcAad0ee1DAabe93cbBd194736B197FB6",
];

assets = [
  {
    assetName: "stETH",
    assetAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    assetPoolName: "LidoMockPool",
    vaultName: "InstEthVault",
    vaultFactory: "InVault_S_E2",
    iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
    withdrawalDelayBlocks: 50400,
    ratioErr: 3n,
    transactErr: 5n,
    // blockNumber: 17453047,
    impersonateStaker: async (staker, iVault, asset) => {
      const donor = await impersonateWithEth("0x43594da5d6A03b2137a04DF5685805C676dEf7cB", toWei(1));
      await asset.connect(donor).transfer(staker.address, toWei(1000));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
    operators: [
      {
        name: "Mellow",
        address: () => mellowRestaker.address,
      },
    ],
  },
];

const minWithdrawalDelayBlocks = 50400;
const nodeOperatorToRestaker = new Map();
const forcedWithdrawals = [];
let MAX_TARGET_PERCENT;

const [mellowWrapperAddress, mellowVaultAddress, mellowBondStrategyAddress, mellowVaultOperatorAddress, stEthAddress, wstEthAddress] = [
  "0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d",
  "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
  "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
  "0x4a3c7F2470Aa00ebE6aE7cB1fAF95964b9de1eF4",
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
];

const [mellowWrapperAddress2, mellowVaultAddress2, mellowBondStrategyAddress2, mellowVaultOperatorAddress2, stEthAddress2, wstEthAddress2] =
  [
    "0xdC1741f9bD33DD791942CC9435A90B0983DE8665",
    "0x5fD13359Ba15A84B76f7F87568309040176167cd",
    "0xc3A149b5Ca3f4A5F17F5d865c14AA9DBb570F10A",
    "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
    "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  ];

const initVault = async (a) => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
  console.log("- MellowVault");
  const mellowVault = await ethers.getContractAt("IMellowVault", mellowVaultAddress);
  await mellowVault.on("WithdrawalsProcessed", (users, statuses) => {
    console.log("===WithdrawalsProcessed ", users, statuses);
  });

  const mellowVault2 = await ethers.getContractAt("IMellowVault", mellowVaultAddress2);
  await mellowVault2.on("WithdrawalsProcessed", (users, statuses) => {
    console.log("===WithdrawalsProcessed2 ", users, statuses);
  });

  // 1. Inception token
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();
  // 2. Impersonate operator
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);

  console.log("- Mellow restaker");
  const mellowRestakerFactory = await ethers.getContractFactory("IMellowRestaker");
  mellowRestaker = await upgrades.deployProxy(mellowRestakerFactory, [
    [mellowWrapperAddress, mellowWrapperAddress2],
    [mellowVaultAddress, mellowVaultAddress2],
    stEthAddress,
    a.iVaultOperator,
  ]);
  mellowRestaker.address = await mellowRestaker.getAddress();

  // // 4. Delegation manager
  // console.log("- Delegation manager");
  // const delegationManager = await ethers.getContractAt("IDelegationManager", a.delegationManager);
  // await delegationManager.on("WithdrawalQueued", (newRoot, migratedWithdrawal) => {
  //   console.log(`===Withdrawal queued: ${migratedWithdrawal.shares[0]}`);
  // });
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
    [a.vaultName, a.iVaultOperator, a.assetAddress, iToken.address, mellowRestaker.address],
    {
      unsafeAllowLinkedLibraries: true,
    }
  );
  iVault.address = await iVault.getAddress();
  await iVault.on("DelegatedTo", (restaker, elOperator) => {
    nodeOperatorToRestaker.set(elOperator, restaker);
    console.log(`===Restaker to operator ${elOperator}, ${restaker}`);
  });

  await iVault.setRatioFeed(ratioFeed.address);
  await mellowRestaker.setVault(iVault.address);
  await iToken.setVault(iVault.address);
  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  // in % (100 * e18 == 100 %)
  await iVault.setTargetFlashCapacity(toWei(1));
  console.log(`... iVault initialization completed ....`);

  iVault.withdrawFromELAndClaim = async function (nodeOperator, amount) {
    const tx = await this.connect(iVaultOperator).undelegateFrom(nodeOperator, amount);
    const restaker = nodeOperatorToRestaker.get(nodeOperator);
    const withdrawalData = await withdrawDataFromTx(tx, nodeOperator, restaker);
    await mineBlocks(minWithdrawalDelayBlocks);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(restaker, [withdrawalData]);
  };

  /*
  Mocks address with role OPERATOR (Gnosis Safe multisig) for the DefaultBondStrategy which in turn is an OPERATOR for the mVault.
   */
  const mellowVaultOperatorMock = await ethers.deployContract("OperatorMock", [mellowBondStrategyAddress]);
  mellowVaultOperatorMock.address = await mellowVaultOperatorMock.getAddress();
  await network.provider.send("hardhat_setCode", [mellowVaultOperatorAddress, await mellowVaultOperatorMock.getDeployedCode()]);
  for (let i = 0; i < 5; i++) {
    const slot = "0x" + i.toString(16);
    const value = await network.provider.send("eth_getStorageAt", [mellowVaultOperatorMock.address, slot, "latest"]);
    await network.provider.send("hardhat_setStorageAt", [mellowVaultOperatorAddress, slot, value]);
  }
  const mellowVaultOperator = await ethers.getContractAt("OperatorMock", mellowVaultOperatorAddress);
  iVault.withdrawFromMellowAndClaim = async function (amount) {
    await this.connect(iVaultOperator).undelegateFrom(mellowRestaker.address, amount);
    await mellowVaultOperator.processWithdrawals([mellowRestaker.address]);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(mellowRestaker.address, [zeroWithdrawalData]);
  };

  const mellowVaultOperatorMock2 = await ethers.deployContract("OperatorMock", [mellowBondStrategyAddress2]);
  mellowVaultOperatorMock2.address = await mellowVaultOperatorMock2.getAddress();
  await network.provider.send("hardhat_setCode", [mellowVaultOperatorAddress2, await mellowVaultOperatorMock2.getDeployedCode()]);
  for (let i = 0; i < 5; i++) {
    const slot = "0x" + i.toString(16);
    const value = await network.provider.send("eth_getStorageAt", [mellowVaultOperatorMock2.address, slot, "latest"]);
    await network.provider.send("hardhat_setStorageAt", [mellowVaultOperatorAddress2, slot, value]);
  }
  const mellowVaultOperator2 = await ethers.getContractAt("OperatorMock", mellowVaultOperatorAddress2);
  iVault.withdrawFromMellowAndClaim = async function (amount) {
    await this.connect(iVaultOperator).undelegateFrom(mellowRestaker.address, amount);
    await mellowVaultOperator2.processWithdrawals([mellowRestaker.address]);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(mellowRestaker.address, [zeroWithdrawalData]);
  };

  iVault.undelegateAndClaimVault = async function (nodeOperator, amount) {
    const tx = await this.connect(iVaultOperator).undelegateVault(amount);
    const restaker = await this.getAddress();
    const withdrawalData = await withdrawDataFromTx(tx, nodeOperator, restaker);
    await mineBlocks(minWithdrawalDelayBlocks);
    await this.connect(iVaultOperator).claimCompletedWithdrawals(restaker, [withdrawalData]);
  };

  mellowVault.address = await mellowVault.getAddress();
  mellowVault2.address = await mellowVault2.getAddress();

  return [
    iToken,
    iVault,
    ratioFeed,
    asset,
    iVaultOperator,
    mellowRestaker,
    mellowVaultOperator,
    mellowVault,
    mellowVaultOperator2,
    mellowVault2,
    iLibrary,
  ];
};

assets.forEach(function (a) {
  describe(`Inception Symbiotic Vault ${a.assetName}`, function () {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowRestaker, mellowVaultOperator, mellowVault, mellowVaultOperator2, mellowVault2, iLibrary;
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
        iVaultOperator,
        mellowRestaker,
        mellowVaultOperator,
        mellowVault,
        mellowVaultOperator2,
        mellowVault2,
        iLibrary,
      ] = await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();
      staker = await a.impersonateStaker(staker, iVault, asset);
      staker2 = await a.impersonateStaker(staker2, iVault, asset);
      staker3 = await a.impersonateStaker(staker3, iVault, asset);
      treasury = await iVault.treasury(); //deployer

      snapshot = await helpers.takeSnapshot();
    });

    after(async function () {
      if (iVault) {
        await iVault.removeAllListeners();
      }
    });

    describe("Base flow no flash", function () {
      let totalDeposited = 0n;
      let delegatedMellow = 0n;
      let rewardsEL = 0n;
      let rewardsMellow = 0n;
      let extra;
      let withdrawalData;

      before(async function () {
        await snapshot.restore();
      });

      it("Initial stats", async function () {
        expect(await iVault.ratio()).to.be.eq(e18);
        expect(await iVault.totalAssets()).to.be.eq(0n);
        expect(await iVault.getTotalDeposited()).to.be.eq(0n);
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
        expect(await iVault.getFlashCapacity()).to.be.eq(0n);
        expect(await iVault.getFreeBalance()).to.be.eq(0n);
      });

      it("User can deposit to iVault", async function () {
        totalDeposited += toWei(20);
        const expectedShares = totalDeposited; //Because ratio is 1e18 at the first deposit
        const tx = await iVault.connect(staker).deposit(totalDeposited, staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(totalDeposited, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);

        expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(totalDeposited, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
        expect(await iVault.getTotalDelegated()).to.be.eq(0); //Nothing has been delegated yet
        expect(await calculateRatio(iVault, iToken)).to.be.closeTo(e18, 1n);
      });

      //Only stEth supports Mellow
      if (a.assetName === "stETH") {
        it("DelegateAuto to Mellow", async function () {
          const amount = await iVault.getFreeBalance();
          expect(amount).to.be.gt(0n);
          const totalAssetsBefore = await iVault.totalAssets();

          // 1% FlashPool reserved
          await mellowRestaker.changeAllocation(mellowVault.address, toWei(25));
          await mellowRestaker.changeAllocation(mellowVault2.address, toWei(74));
          await iVault.connect(iVaultOperator).delegateAuto();
          delegatedMellow += amount;

          const mellowBalance = await mellowVault.balanceOf(mellowRestaker.address);
          const mellowBalance2 = await mellowVault2.balanceOf(mellowRestaker.address);
          const totalAssetsAfter = await iVault.totalAssets();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const delegatedTo = await iVault.getDelegatedTo(mellowVault.address);
          const delegatedTo2 = await iVault.getDelegatedTo(mellowVault2.address);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          console.log("Mellow LP token balance: ", mellowBalance.format());
          console.log("Mellow LP token balance2: ", mellowBalance2.format());
          console.log("Amount delegated: ", delegatedMellow.format());

          expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
          expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow - 4n, transactErr);
          expect(delegatedTo).to.be.closeTo((totalDeposited * 25n) / 100n - 2n, transactErr);
          expect(delegatedTo2).to.be.closeTo((totalDeposited * 74n) / 100n - 2n, transactErr);
          expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * 2n);
          expect(mellowBalance).to.be.gt(delegatedTo / 2n); //Amount of shares is at least greater than half of delegated amount
          expect(mellowBalance2).to.be.gt(delegatedTo2 / 2n); //Amount of shares is at least greater than half of delegated amount
          expect(await calculateRatio(iVault, iToken)).to.be.closeTo(e18, ratioErr);
        });
      } else {
      }

      it("Update ratio", async function () {
        const ratio = await calculateRatio(iVault, iToken);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      if (a.assetName === "stETH") {
        it("Add rewards to Mellow protocol and estimate ratio", async function () {
          const ratioBefore = await calculateRatio(iVault, iToken);
          const totalDelegatedToBefore = await iVault.getDelegatedTo(mellowVault.address);
          const totalDelegatedBefore = await iVault.getTotalDelegated();
          console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
          console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

          const wstEth = await ethers.getContractAt("IWSteth", wstEthAddress);
          const wrapAmount = e18;
          await asset.connect(staker3).approve(wstEthAddress, wrapAmount);
          await wstEth.connect(staker3).wrap(wrapAmount);
          const wstEthErc20 = await ethers.getContractAt("IERC20", wstEthAddress);
          const wrtEthAmount = await wstEthErc20.balanceOf(staker3);
          await wstEthErc20.connect(staker3).transfer(mellowVaultAddress, wrtEthAmount);

          const ratioAfter = await calculateRatio(iVault, iToken);
          const totalDelegatedToAfter = await iVault.getDelegatedTo(mellowVault.address);
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          rewardsMellow += totalDelegatedToAfter - totalDelegatedToBefore;

          console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
          console.log(`Delegated to after:\t\t${totalDelegatedToAfter.format()}`);
          console.log(`mellow rewards:\t\t\t${rewardsMellow.format()}`);
          await ratioFeed.updateRatioBatch([iToken.address], [ratioAfter]);
          expect(totalDelegatedAfter - totalDelegatedBefore).to.be.eq(totalDelegatedToAfter - totalDelegatedToBefore);
        });
      }

      it("Estimate the amount that user can withdraw", async function () {
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        expect(assetValue).closeTo(totalDeposited + rewardsEL + rewardsMellow, transactErr * 10n);
      });

      it("User can withdraw all", async function () {
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
        expect(await calculateRatio(iVault, iToken)).to.be.eq(e18); //Because all shares have been burnt at this point
      });

      if (a.assetName === "stETH") {
        it("Withdraw from Mellow", async function () {
          const totalAssetsBefore = await iVault.totalAssets();
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const totalDelegatedBefore = await iVault.getTotalDelegated();
          console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
          console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
          console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

          const amount = await iVault.getDelegatedTo(mellowVault.address);
          const amount2 = await iVault.getDelegatedTo(mellowVault2.address);
          await iVault.connect(iVaultOperator).undelegateFrom(mellowVault.address, amount);
          await iVault.connect(iVaultOperator).undelegateFrom(mellowVault2.address, amount2);

          const totalAssetsAfter = await iVault.totalAssets();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const totalDelegatedTo = await iVault.getDelegatedTo(mellowVault.address);
          const totalDelegatedTo2 = await iVault.getDelegatedTo(mellowVault2.address);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();

          console.log(`Total assets after:\t\t${totalAssetsAfter.format()}`);
          console.log(`Total delegated after:\t${totalDelegatedAfter.format()}`);
          console.log(`Total deposited after:\t${totalDepositedAfter.format()}`);
          console.log(`Pending from Mellow:\t${pendingWithdrawalsMellowAfter.format()}`);

          expect(totalAssetsAfter).to.be.eq(totalAssetsBefore); //Nothing has come to the iVault yet
          expect(totalDelegatedAfter).to.be.closeTo(rewardsEL, transactErr);
          expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
          expect(totalDelegatedTo2).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr); //Total deposited amount did not change
          expect(pendingWithdrawalsMellowAfter).to.be.closeTo(amount + amount2 - 4n, transactErr); // Diff of 4wei
        });
      }

      if (a.assetName === "stETH") {
        it("Process request from the Mellow", async function () {
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();
          console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
          console.log(`Pending from Mellow before:\t${pendingWithdrawalsMellowBefore.format()}`);

          await mellowVaultOperator.processWithdrawals([mellowRestaker.address]);
          await mellowVaultOperator2.processWithdrawals([mellowRestaker.address]);

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();
          console.log(`Total deposited after:\t${totalDepositedAfter.format()}`);
          console.log(`Pending from Mellow:\t${pendingWithdrawalsMellowAfter.format()}`);

          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(pendingWithdrawalsMellowAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
        });

        it("Claim Mellow withdrawal", async function () {
          const totalAssetsBefore = await iVault.totalAssets();
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();

          await iVault.connect(iVaultOperator).claimCompletedWithdrawals();

          const totalAssetsAfter = await iVault.totalAssets();
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();

          // expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(pendingWithdrawalsMellowAfter).to.be.eq(0n);
        });
      }

      it("Staker is able to redeem", async function () {
        extra = 0n;
        if (!(await iVault.isAbleToRedeem(staker2.address))[0]) {
          extra = 100000000000000000000n;
          await asset.connect(staker3).transfer(iVault.address, extra);
          await iVault.connect(staker3).updateEpoch();
        }
        console.log(`Staker2 pending withdrawals: ${await iVault.getPendingWithdrawalOf(staker2.address)}`);
        console.log(`Redeem reserve: ${await iVault.redeemReservedAmount()}`);
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
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
        expect(totalDepositedAfter).to.be.closeTo(extra, transactErr * 5n);
        expect(totalAssetsAfter).to.be.closeTo(extra, transactErr * 4n);
      });
    });
  });
});
