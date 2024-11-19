const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const config = require("../hardhat.config");
const { expect } = require("chai");
const {
  impersonateWithEth,
  getRandomStaker,
  calculateRatio,
  toWei,
  randomBI,
  randomBIMax,
  randomAddress,
  e18,
} = require("./helpers/utils.js");
const { mineBlocks } = require("./helpers/utils");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const assets = [
  {
    assetName: "stETH",
    assetAddress: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    vaultName: "InstEthVault",
    vaultFactory: "InVault_S_E2",
    iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
    ratioErr: 3n,
    transactErr: 5n,
    blockNumber: 20462310,
    impersonateStaker: async function (staker, iVault) {
      const donor = await impersonateWithEth("0x43594da5d6A03b2137a04DF5685805C676dEf7cB", toWei(1));
      const stEth = await ethers.getContractAt("stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
      const stEthAmount = toWei(1000);
      await stEth.connect(donor).approve(this.assetAddress, stEthAmount);

      const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
      const balanceBefore = await wstEth.balanceOf(donor.address);
      await wstEth.connect(donor).wrap(stEthAmount);
      const balanceAfter = await wstEth.balanceOf(donor.address);

      const wstAmount = balanceAfter - balanceBefore;
      await wstEth.connect(donor).transfer(staker.address, wstAmount);
      await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);
      return staker;
    },
    addRewardsMellowVault: async function (amount, mellowVault) {
      const donor = await impersonateWithEth("0x43594da5d6A03b2137a04DF5685805C676dEf7cB", toWei(1));
      const stEth = await ethers.getContractAt("stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
      await stEth.connect(donor).approve(this.assetAddress, amount);

      const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
      const balanceBefore = await wstEth.balanceOf(donor);
      await wstEth.connect(donor).wrap(amount);
      const balanceAfter = await wstEth.balanceOf(donor);
      const wstAmount = balanceAfter - balanceBefore;
      await wstEth.connect(donor).transfer(mellowVault, wstAmount);
    },
  },
];

const nodeOperatorToRestaker = new Map();
let MAX_TARGET_PERCENT;

//https://docs.mellow.finance/mellow-lrt-lst-primitive/contract-deployments
const mellowVaults = [
  {
    name: "P2P",
    vaultAddress: "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
    wrapperAddress: "0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d",
    bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
    curatorAddress: "0x4a3c7F2470Aa00ebE6aE7cB1fAF95964b9de1eF4",
  },
  {
    name: "Mev Capital",
    vaultAddress: "0x5fD13359Ba15A84B76f7F87568309040176167cd",
    wrapperAddress: "0xdC1741f9bD33DD791942CC9435A90B0983DE8665",
    bondStrategyAddress: "0xc3A149b5Ca3f4A5F17F5d865c14AA9DBb570F10A",
    curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
  },
  {
    name: "Re7",
    vaultAddress: "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a",
    wrapperAddress: "0x70cD3464A41B6692413a1Ba563b9D53955D5DE0d",
    bondStrategyAddress: "0xcE3A8820265AD186E8C1CeAED16ae97176D020bA",
    curatorAddress: "0xE86399fE6d7007FdEcb08A2ee1434Ee677a04433",
  },
];

const initVault = async a => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
  asset.address = await asset.getAddress();

  /// =============================== Mellow Vaults ===============================
  for (const mVaultInfo of mellowVaults) {
    console.log(`- MellowVault ${mVaultInfo.name} and curator`);
    mVaultInfo.vault = await ethers.getContractAt("IMellowVault", mVaultInfo.vaultAddress);

    const mellowVaultOperatorMock = await ethers.deployContract("OperatorMock", [mVaultInfo.bondStrategyAddress]);
    mellowVaultOperatorMock.address = await mellowVaultOperatorMock.getAddress();
    await network.provider.send("hardhat_setCode", [
      mVaultInfo.curatorAddress,
      await mellowVaultOperatorMock.getDeployedCode(),
    ]);
    //Copy storage values
    for (let i = 0; i < 5; i++) {
      const slot = "0x" + i.toString(16);
      const value = await network.provider.send("eth_getStorageAt", [mellowVaultOperatorMock.address, slot, "latest"]);
      await network.provider.send("hardhat_setStorageAt", [mVaultInfo.curatorAddress, slot, value]);
    }
    mVaultInfo.curator = await ethers.getContractAt("OperatorMock", mVaultInfo.curatorAddress);
  }

  /// =============================== Inception Vault ===============================
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- iVault operator");
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);

  console.log("- Mellow restaker");
  const mellowRestakerFactory = await ethers.getContractFactory("IMellowRestaker");
  let mellowRestaker = await upgrades.deployProxy(mellowRestakerFactory, [
    [mellowVaults[0].wrapperAddress],
    [mellowVaults[0].vaultAddress],
    a.assetAddress,
    a.iVaultOperator,
  ]);
  mellowRestaker.address = await mellowRestaker.getAddress();
  // await mellowRestaker.setWrapped(wstEthAddress);

  console.log("- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.updateRatioBatch([iToken.address], [e18]); //Set initial ratio e18
  ratioFeed.address = await ratioFeed.getAddress();

  console.log("- InceptionLibrary");
  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });
  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [a.vaultName, a.iVaultOperator, a.assetAddress, iToken.address, mellowRestaker.address],
    {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();
  //TODO: check usages
  // await iVault.on("DelegatedTo", (restaker, elOperator) => {
  //   nodeOperatorToRestaker.set(elOperator, restaker);
  //   console.log(`===Restaker to operator ${elOperator}, ${restaker}`);
  // });

  await iVault.setRatioFeed(ratioFeed.address);
  await mellowRestaker.setVault(iVault.address);
  await iToken.setVault(iVault.address);
  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  console.log("... iVault initialization completed ....");

  iVault.withdrawFromMellowAndClaim = async function (mellowVaultAddress, amount) {
    await this.connect(iVaultOperator).undelegateFrom(mellowVaultAddress, amount);
    await mellowVaults[0].curator.processWithdrawals([mellowRestaker.address]);
    await this.connect(iVaultOperator).claimCompletedWithdrawals();
  };

  return [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowRestaker, iLibrary];
};

assets.forEach(function (a) {
  describe(`Inception Symbiotic Vault ${a.assetName}`, function () {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowRestaker, iLibrary;
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
            jsonRpcUrl: a.url ? a.url : network.config.forking.url,
            blockNumber: a.blockNumber ? a.blockNumber : network.config.forking.blockNumber,
          },
        },
      ]);

      [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowRestaker, iLibrary] = await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();

      staker = await a.impersonateStaker(staker, iVault);
      staker2 = await a.impersonateStaker(staker2, iVault);
      staker3 = await a.impersonateStaker(staker3, iVault);
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
      let rewardsMellow = 0n;

      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
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
        const events = receipt.logs?.filter(e => e.eventName === "Deposit");
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

      it("Delegate to mellowVault#1", async function () {
        const amount = (await iVault.getFreeBalance()) / 3n;
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount);
        delegatedMellow += amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowRestaker.address);
        const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowRestaker.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const delegatedTo2 = await iVault.getDelegatedTo(mellowVaults[1].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log("Mellow LP token balance: ", mellowBalance.format());
        console.log("Mellow LP token balance2: ", mellowBalance2.format());
        console.log("Amount delegated: ", delegatedMellow.format());

        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
        expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(delegatedTo2).to.be.closeTo(0n, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr);
        expect(mellowBalance).to.be.gte(amount / 2n);
        expect(mellowBalance2).to.be.eq(0n);
        expect(await calculateRatio(iVault, iToken)).to.be.closeTo(e18, ratioErr);
      });

      it("Add new mellowVault", async function () {
        await expect(mellowRestaker.addMellowVault(mellowVaults[1].vaultAddress, mellowVaults[1].wrapperAddress))
          .to.emit(mellowRestaker, "VaultAdded")
          .withArgs(mellowVaults[1].vaultAddress, mellowVaults[1].wrapperAddress);
      });

      it("Delegate all to mellowVault#2", async function () {
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[1].vaultAddress, amount);
        delegatedMellow += amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowRestaker.address);
        const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowRestaker.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo2 = await iVault.getDelegatedTo(mellowVaults[1].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log("Mellow LP token balance: ", mellowBalance.format());
        console.log("Mellow LP token balance2: ", mellowBalance2.format());
        console.log("Amount delegated: ", delegatedMellow.format());

        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
        expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr * 2n);
        expect(delegatedTo2).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * 2n);
        expect(mellowBalance2).to.be.gte(amount / 2n);
        expect(await calculateRatio(iVault, iToken)).to.be.closeTo(e18, ratioErr);
      });

      /*      it("DelegateAuto to Mellow", async function () {
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await mellowRestaker.changeAllocation(mellowVaults[0].vaultAddress, toWei(25));
        await mellowRestaker.changeAllocation(mellowVaults[1].vaultAddress, toWei(75));
        await iVault.connect(iVaultOperator).delegateAuto();
        delegatedMellow += amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowRestaker.address);
        const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowRestaker.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const delegatedTo2 = await iVault.getDelegatedTo(mellowVaults[1].vaultAddress);
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
      });*/

      it("Update ratio", async function () {
        const ratio = await calculateRatio(iVault, iToken);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      it("Add rewards to Mellow protocol and estimate ratio", async function () {
        const ratioBefore = await calculateRatio(iVault, iToken);
        const totalDelegatedToBefore = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
        console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

        await asset.connect(staker3).transfer(mellowVaults[0].vaultAddress, e18);

        const ratioAfter = await calculateRatio(iVault, iToken);
        const totalDelegatedToAfter = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        rewardsMellow += totalDelegatedToAfter - totalDelegatedToBefore;

        console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
        console.log(`Delegated to after:\t\t${totalDelegatedToAfter.format()}`);
        console.log(`mellow rewards:\t\t\t${rewardsMellow.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratioAfter]);
        expect(totalDelegatedAfter - totalDelegatedBefore).to.be.eq(totalDelegatedToAfter - totalDelegatedToBefore);
      });

      it("Estimate the amount that user can withdraw", async function () {
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        expect(assetValue).closeTo(totalDeposited + rewardsMellow, transactErr * 10n);
      });

      it("User can withdraw all", async function () {
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
      });

      it("Update ratio after all shares burn", async function () {
        const calculatedRatio = await calculateRatio(iVault, iToken);
        console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
        expect(calculatedRatio).to.be.eq(e18); //Because all shares have been burnt at this point

        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(calculatedRatio);
      });

      it("Undelegate from Mellow", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

        const amount = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const amount2 = await iVault.getDelegatedTo(mellowVaults[1].vaultAddress);
        await iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[0].vaultAddress, amount);
        await iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[1].vaultAddress, amount2);

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedTo = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const totalDelegatedTo2 = await iVault.getDelegatedTo(mellowVaults[1].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t${pendingWithdrawalsMellowAfter.format()}`);

        expect(totalAssetsAfter).to.be.eq(totalAssetsBefore); //Nothing has come to the iVault yet
        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
        expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        expect(totalDelegatedTo2).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
        expect(pendingWithdrawalsMellowAfter).to.be.closeTo(amount + amount2, transactErr * 2n);
      });

      it("Process request to transfers pending funds to mellowRestaker", async function () {
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const restakerBalanceBefore = await asset.balanceOf(mellowRestaker.address);
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Pending from Mellow before:\t\t${pendingWithdrawalsMellowBefore.format()}`);

        await mellowVaults[0].curator.processWithdrawals([mellowRestaker.address]);
        await mellowVaults[1].curator.processWithdrawals([mellowRestaker.address]);

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const restakerBalanceAfter = await asset.balanceOf(mellowRestaker.address);
        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t\t${pendingWithdrawalsMellowAfter.format()}`);
        console.log(`Restaker balance diff:\t\t\t${(restakerBalanceAfter - restakerBalanceBefore).format()}`);

        expect(restakerBalanceAfter - restakerBalanceBefore).to.be.eq(pendingWithdrawalsMellowBefore);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(pendingWithdrawalsMellowAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      });

      it("Claim Mellow withdrawal transfer funds from restaker to vault", async function () {
        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalAssetsBefore = await iVault.totalAssets();
        const restakerBalanceBefore = await asset.balanceOf(mellowRestaker.address);

        await iVault.connect(iVaultOperator).claimCompletedWithdrawals();

        const totalAssetsAfter = await iVault.totalAssets();
        const restakerBalanceAfter = await asset.balanceOf(mellowRestaker.address);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
        expect(restakerBalanceBefore - restakerBalanceAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      });

      it("Staker is able to redeem", async function () {
        const queuedPendingWithdrawal = (await iVault.claimerWithdrawalsQueue(0)).amount;
        const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
        const redeemReserve = await iVault.redeemReservedAmount();
        const freeBalance = await iVault.getFreeBalance();

        console.log("Queued withdrawal", queuedPendingWithdrawal.format());
        console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
        console.log("Redeem reserve", redeemReserve.format());
        console.log("Free balance", freeBalance.format());

        //Compensate transactions loses
        const diff = queuedPendingWithdrawal - freeBalance - redeemReserve;
        if (diff > 0n) {
          expect(diff).to.be.lte(transactErr * 2n);
          await asset.connect(staker3).transfer(iVault.address, diff + 1n);
          await iVault.connect(staker3).updateEpoch();
        }

        console.log("Redeem reserve after", await iVault.redeemReservedAmount());
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
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
        expect(totalDepositedAfter).to.be.closeTo(0n, transactErr);
        expect(totalAssetsAfter).to.be.closeTo(0n, transactErr);
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

        await expect(iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount))
          .to.emit(iVault, "DelegatedTo")
          .withArgs(
            stakerAddress => {
              expect(stakerAddress).to.be.properAddress;
              expect(stakerAddress).to.be.not.eq(ethers.ZeroAddress);
              return true;
            },
            mellowVaults[0].vaultAddress,
            amount,
          );

        const delegatedTotal = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        expect(totalDepositedBefore).to.be.closeTo(await iVault.getTotalDeposited(), 1n);
        expect(delegatedTotal).to.be.closeTo(amount, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(await iVault.getFreeBalance()).to.be.closeTo(0n, 1n);
        expect(await iVault.getFlashCapacity()).to.be.closeTo(expectedFlashCapacity, 1n);
        expect(await iVault.ratio()).closeTo(e18, 1n);
      });

      it("Update asset ratio", async function () {
        await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
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
        const expectedFee = await iVault.calculateFlashWithdrawFee(await iVault.convertToAssets(shares));
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
        const depositBonus = await iVault.depositBonusAmount();
        console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`Total deposited diff:\t${(totalDepositedBefore - totalDepositedAfter).format()}`);
        console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Deposit bonus:\t\t\t${depositBonus.format()}`);
        console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(shares);
        expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee, 2n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 2n);
        expect(totalDepositedBefore - totalDepositedAfter).to.be.closeTo(amount, transactErr);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, transactErr);
        expect(flashCapacityAfter).to.be.closeTo(0n, transactErr);
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

      it("Undelegate from Mellow", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        console.log(`Total deposited before:\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t${totalAssetsBefore.format()}`);
        console.log("======================================================");

        const amount = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        await iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[0].vaultAddress, amount);

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedTo = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();

        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t${pendingWithdrawalsMellowAfter.format()}`);

        expect(totalAssetsAfter).to.be.eq(totalAssetsBefore); //Nothing has come to the iVault yet
        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
        expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
        expect(pendingWithdrawalsMellowAfter).to.be.closeTo(amount, transactErr * 2n);
      });

      it("Process request to transfers pending funds to mellowRestaker", async function () {
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const restakerBalanceBefore = await asset.balanceOf(mellowRestaker.address);
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Pending from Mellow before:\t\t${pendingWithdrawalsMellowBefore.format()}`);

        await mellowVaults[0].curator.processWithdrawals([mellowRestaker.address]);
        await mellowVaults[1].curator.processWithdrawals([mellowRestaker.address]);

        const totalDepositedAfter = await iVault.getTotalDeposited();
        const pendingWithdrawalsMellowAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const restakerBalanceAfter = await asset.balanceOf(mellowRestaker.address);
        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t\t${pendingWithdrawalsMellowAfter.format()}`);
        console.log(`Restaker balance diff:\t\t\t${(restakerBalanceAfter - restakerBalanceBefore).format()}`);

        expect(restakerBalanceAfter - restakerBalanceBefore).to.be.eq(pendingWithdrawalsMellowBefore);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(pendingWithdrawalsMellowAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      });

      it("Claim Mellow withdrawal transfer funds from restaker to vault", async function () {
        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalAssetsBefore = await iVault.totalAssets();
        const restakerBalanceBefore = await asset.balanceOf(mellowRestaker.address);

        await iVault.connect(iVaultOperator).claimCompletedWithdrawals();

        const totalAssetsAfter = await iVault.totalAssets();
        const restakerBalanceAfter = await asset.balanceOf(mellowRestaker.address);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
        expect(restakerBalanceBefore - restakerBalanceAfter).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      });

      it("Staker is able to redeem", async function () {
        const queuedPendingWithdrawal = (await iVault.claimerWithdrawalsQueue(0)).amount;
        const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
        const redeemReserve = await iVault.redeemReservedAmount();
        const freeBalance = await iVault.getFreeBalance();

        console.log("Queued withdrawal", queuedPendingWithdrawal.format());
        console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
        console.log("Redeem reserve", redeemReserve.format());
        console.log("Free balance", freeBalance.format());

        const diff = queuedPendingWithdrawal - freeBalance - redeemReserve;
        if (diff > 0n) {
          expect(diff).to.be.lte(transactErr * 2n);
          await asset.connect(staker3).transfer(iVault.address, diff + 1n);
          await iVault.connect(staker3).updateEpoch();
        }

        console.log("Redeem reserve after", await iVault.redeemReservedAmount());
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
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
        expect(totalDepositedAfter).to.be.closeTo(0n, transactErr * 3n);
        expect(totalAssetsAfter).to.be.closeTo(depositFees, transactErr * 3n);
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
        await expect(iVault.setOperator(newOperator.address))
          .to.emit(iVault, "OperatorChanged")
          .withArgs(iVaultOperator.address, newOperator);

        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker).deposit(toWei(2), staker.address);
        const amount = await iVault.getFreeBalance();
        await iVault.connect(newOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount);
      });

      it("setOperator(): reverts when set to zero address", async function () {
        await expect(iVault.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setOperator(): reverts when caller is not an operator", async function () {
        await expect(iVault.connect(staker).setOperator(staker2.address)).to.be.revertedWith(
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
        await expect(iVault.setMinAmount(newMinAmount))
          .to.emit(iVault, "MinAmountChanged")
          .withArgs(prevValue, newMinAmount);
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
    });

    describe("Deposit bonus params setter and calculation", function () {
      let targetCapacityPercent, MAX_PERCENT, localSnapshot;
      before(async function () {
        await iVault.setTargetFlashCapacity(1n);
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
          await iVault.setTargetFlashCapacity(1n);
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
              .delegateToMellowVault(mellowVaults[0].vaultAddress, deposited - flashCapacity - 1n);
            await iVault.setTargetFlashCapacity(targetCapacityPercent); //1%
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
          await iVault.setTargetFlashCapacity(1n);
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
              .delegateToMellowVault(mellowVaults[0].vaultAddress, deposited - flashCapacity - 1n);
            await iVault.setTargetFlashCapacity(targetCapacityPercent); //1%
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
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker, staker).deposit(randomBI(19), staker.address);
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

    describe("Deposit: user can restake asset", function () {
      let ratio;

      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker3).deposit(e18, staker3.address);
        const amount = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount);
        await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
        ratio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
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
          const delegatedBefore = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          console.log(`Delegated before: ${delegatedBefore}`);
          console.log(`Total deposited before: ${totalDepositedBefore}`);

          const amount = await iVault.getFreeBalance();
          const tx = await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount);
          const receipt = await tx.wait();
          const events = receipt.logs?.filter(e => e.eventName === "DelegatedTo");
          expect(events.length).to.be.eq(1);
          //TODO: sort out
          // expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.ZeroAddress);
          expect(events[0].args["stakerAddress"]).to.be.properAddress;
          expect(events[0].args["operatorAddress"]).to.be.eq(mellowVaults[0].vaultAddress);

          const delegatedAfter = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalAssetsAfter = await iVault.totalAssets();
          const ratioAfter = await iVault.ratio();
          console.log(`Ratio after: ${ratioAfter}`);

          expect(delegatedAfter - delegatedBefore).to.be.closeTo(amount, transactErr);
          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(totalAssetsAfter).to.be.lte(transactErr);
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
        await snapshot.restore();
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
          await iVault.setTargetFlashCapacity(1n);
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
              .delegateToMellowVault(mellowVaults[0].vaultAddress, freeBalance - flashCapacityBefore);
            await iVault.setTargetFlashCapacity(targetCapacityPercent);
            await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
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

    describe("Deposit and delegateToMellowVault", function () {
      let ratio, firstDeposit;

      beforeEach(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker3).deposit(e18, staker3.address);
        firstDeposit = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, firstDeposit);
        await a.addRewardsMellowVault(toWei(0.001), mellowVaults[0].vaultAddress);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${ratio.format()}`);
      });

      const args = [
        {
          name: "random amounts ~ e18",
          depositAmount: async () => toWei(1),
        },
        {
          name: "amounts which are close to min",
          depositAmount: async () => (await iVault.minAmount()) + 1n,
        },
      ];

      args.forEach(function (arg) {
        it(`Deposit and delegate ${arg.name} many times`, async function () {
          await iVault.setTargetFlashCapacity(1n);
          let totalDelegated = 0n;
          const count = 10;
          for (let i = 0; i < count; i++) {
            const deposited = await arg.depositAmount();
            await iVault.connect(staker).deposit(deposited, staker.address);
            const delegated = await iVault.getFreeBalance();
            await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, delegated);

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
          const totalDelegatedToAfter = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
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

      const args2 = [
        {
          name: "by the same staker",
          staker: async () => staker,
        },
        {
          name: "by different stakers",
          staker: async () => await getRandomStaker(iVault, asset, staker3, toWei(1)),
        },
      ];

      args2.forEach(function (arg) {
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
          await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, totalDelegated);

          console.log(`Final ratio:\t${await iVault.ratio()}`);
          console.log(`Total deposited:\t${totalDeposited.format()}`);
          console.log(`Total delegated:\t${totalDelegated.format()}`);

          const balanceExpected = (totalDelegated * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = BigInt(count) * transactErr * 2n;

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const totalDelegatedToAfter = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
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

      const args3 = [
        {
          name: "to the different operators",
          count: 20,
          mellowVault: i => mellowVaults[i % mellowVaults.length].vaultAddress,
        },
        {
          name: "to the same operator",
          count: 10,
          mellowVault: i => mellowVaults[0].vaultAddress,
        },
      ];

      args3.forEach(function (arg) {
        it(`Delegate many times ${arg.name}`, async function () {
          for (let i = 1; i < mellowVaults.length; i++) {
            await mellowRestaker.addMellowVault(mellowVaults[i].vaultAddress, mellowVaults[i].wrapperAddress);
          }

          await iVault.setTargetFlashCapacity(1n);
          //Deposit by 2 stakers
          const totalDelegated = toWei(60);
          await iVault.connect(staker).deposit(totalDelegated / 2n, staker.address);
          await iVault.connect(staker2).deposit(totalDelegated / 2n, staker2.address);
          //Delegate
          for (let i = 0; i < arg.count; i++) {
            const taBefore = await iVault.totalAssets();
            const mVault = arg.mellowVault(i);
            console.log(`#${i} mellow vault: ${mVault}`);
            const fb = await iVault.getFreeBalance();
            const amount = fb / BigInt(arg.count - i);
            const tx = await iVault.connect(iVaultOperator).delegateToMellowVault(mVault, amount);
            const receipt = await tx.wait();
            let events = receipt.logs?.filter(e => {
              return e.eventName === "DelegatedTo";
            });
            expect(events.length).to.be.eq(1);
            //TODO fix
            // expect(events[0].args["stakerAddress"]).to.be.not.eq(ethers.ZeroAddress);
            // expect(events[0].args["stakerAddress"]).to.be.properAddress;
            // expect(events[0].args["operatorAddress"]).to.be.eq(mVault);
            const taAfter = await iVault.totalAssets();
            expect(taBefore - taAfter).to.be.closeTo(amount, transactErr);
          }
          console.log(`Final ratio:\t${await iVault.ratio()}`);

          const balanceExpected = (totalDelegated * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = BigInt(arg.count) * transactErr * 2n;

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalDelegatedAfter = await iVault.getTotalDelegated();
          const totalDelegatedToAfter = await iVault.getDelegatedTo(mellowVaults[0].vaultAddress);
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

      //Delegate auto
      const args4 = [
        {
          name: "1 vault; allocation 100%",
        },
        {
          name: "1 vault; allocation 100% and 0% to unregistered",
        },
        {
          name: "1 vault; allocation 50% and 50% to unregistered",
        },
        {
          name: "2 vaults; allocations: 100%, 0%",
        },
        {
          name: "2 vaults; allocations: 50%, 50%",
        },
        {
          name: "3 vaults; allocations: 33%, 33%, 33%",
        },
      ];

      args4.forEach(function (arg) {});

      //Delegate invalid params
      const invalidArgs = [
        {
          name: "amount is 0",
          deposited: toWei(1),
          amount: async () => 0n,
          mVault: async () => mellowVaults[0].vaultAddress,
          operator: () => iVaultOperator,
        },
        {
          name: "amount is greater than free balance",
          deposited: toWei(10),
          targetCapacityPercent: e18,
          amount: async () => (await iVault.getFreeBalance()) + 1n,
          mVault: async () => mellowVaults[0].vaultAddress,
          operator: () => iVaultOperator,
          customError: "InsufficientCapacity",
          source: () => iVault,
        },
        {
          name: "unknown mellow vault",
          deposited: toWei(1),
          amount: async () => await iVault.getFreeBalance(),
          mVault: async () => mellowVaults[1].vaultAddress,
          operator: () => iVaultOperator,
          customError: "InactiveWrapper",
          source: () => mellowRestaker,
        },
        {
          name: "mellow vault is zero address",
          deposited: toWei(1),
          amount: async () => await iVault.getFreeBalance(),
          mVault: async () => ethers.ZeroAddress,
          operator: () => iVaultOperator,
          customError: "NullParams",
          source: () => iVault,
        },
        {
          name: "caller is not an operator",
          deposited: toWei(1),
          amount: async () => await iVault.getFreeBalance(),
          mVault: async () => mellowVaults[0].vaultAddress,
          operator: () => staker,
          customError: "OnlyOperatorAllowed",
          source: () => iVault,
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`delegateToMellowVault reverts when ${arg.name}`, async function () {
          if (arg.targetCapacityPercent) {
            await iVault.setTargetFlashCapacity(arg.targetCapacityPercent);
          }
          await asset.connect(staker3).approve(await iVault.getAddress(), arg.deposited);
          await iVault.connect(staker3).deposit(arg.deposited, staker3.address);

          const operator = arg.operator();
          const delegateAmount = await arg.amount();
          const mVault = await arg.mVault();

          if (arg.customError) {
            await expect(
              iVault.connect(operator).delegateToMellowVault(mVault, delegateAmount),
            ).to.be.revertedWithCustomError(arg.source(), arg.customError);
          } else {
            await expect(iVault.connect(operator).delegateToMellowVault(mVault, delegateAmount)).to.be.reverted;
          }
        });
      });

      it("delegateToMellowVault reverts when iVault is paused", async function () {
        const amount = randomBI(18);
        await iVault.connect(staker).deposit(amount, staker.address);
        await iVault.pause();
        await expect(
          iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, amount),
        ).to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
      });
    });

    describe("Withdraw: user can unstake", function () {
      let ratio, totalDeposited, TARGET;

      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, freeBalance);
        await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
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
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        const freeBalance = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, freeBalance);
        await a.addRewardsMellowVault(toWei(0.001), mellowVaults[0].vaultAddress);
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      });

      const invalidData = [
        {
          name: "> balance",
          amount: async () => (await iToken.balanceOf(staker.address)) + 1n,
          receiver: () => staker.address,
          error: "ERC20: burn amount exceeds balance",
        },
        {
          name: "< min amount",
          amount: async () => (await iVault.convertToShares(await iVault.minAmount())) - 1n,
          receiver: () => staker.address,
          customError: "LowerMinAmount",
        },
        {
          name: "0",
          amount: async () => 0n,
          receiver: () => staker.address,
          customError: "NullParams",
        },
        {
          name: "to zero address",
          amount: async () => randomBI(18),
          receiver: () => ethers.ZeroAddress,
          customError: "NullParams",
        },
      ];

      invalidData.forEach(function (test) {
        it(`Reverts: withdraws ${test.name}`, async function () {
          const amount = await test.amount();
          const receiver = test.receiver();
          if (test.customError) {
            await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWithCustomError(
              iVault,
              test.customError,
            );
          } else if (test.error) {
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

      it("Reverts: withdraw when targetCapacity is not set", async function () {
        await snapshot.restore();
        await expect(iVault.connect(staker).withdraw(toWei(1), staker.address)).to.be.revertedWithCustomError(
          iVault,
          "InceptionOnPause",
        );
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
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, freeBalance);

        await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);
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
          await iVault.withdrawFromMellowAndClaim(mellowVaults[0].vaultAddress, undelegateAmount);

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
          const shares = await iVault.convertToShares(amount);
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

    describe("Mellow vaults management", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
        await iVault.connect(staker).deposit(e18, staker.address);
      });

      //TODO: must revert
      it("addMellowVault the same vault and delegate", async function () {
        const mellowVault = mellowVaults[0].vaultAddress;
        const wrapper = mellowVaults[0].wrapperAddress;

        const freeBalance = await iVault.getFreeBalance();
        await expect(iVault.connect(iVaultOperator).delegateToMellowVault(mellowVault, freeBalance))
          .emit(iVault, "DelegatedTo")
          .withArgs(ethers.ZeroAddress, mellowVault, freeBalance);

        console.log("Total deposited before", await iVault.getTotalDeposited());

        await expect(mellowRestaker.addMellowVault(mellowVault, wrapper))
          .to.emit(mellowRestaker, "VaultAdded")
          .withArgs(mellowVault, wrapper);

        console.log("Total deposited after", await iVault.getTotalDeposited());
      });

      it("addMellowVault with different wrapper", async function () {
        const mellowVault = mellowVaults[1].vaultAddress;
        const wrongWrapper = ethers.Wallet.createRandom().address;
        await expect(mellowRestaker.addMellowVault(mellowVault, wrongWrapper))
          .to.emit(mellowRestaker, "VaultAdded")
          .withArgs(mellowVault, wrongWrapper);
        expect(await mellowRestaker.mellowDepositWrappers(mellowVault)).to.be.eq(wrongWrapper);

        const wrapper = mellowVaults[1].wrapperAddress;
        await expect(mellowRestaker.addMellowVault(mellowVault, wrapper))
          .to.emit(mellowRestaker, "VaultAdded")
          .withArgs(mellowVault, wrapper);
        expect(await mellowRestaker.mellowDepositWrappers(mellowVault)).to.be.eq(wrongWrapper);

        const freeBalance = await iVault.getFreeBalance();
        await expect(iVault.connect(iVaultOperator).delegateToMellowVault(mellowVault, freeBalance))
          .emit(iVault, "DelegatedTo")
          .withArgs(ethers.ZeroAddress, mellowVault, freeBalance);
      });

      it("addMellowVault vault is 0 address", async function () {
        const mellowVault = ethers.ZeroAddress;
        const wrapper = mellowVaults[1].wrapperAddress;
        await expect(mellowRestaker.addMellowVault(mellowVault, wrapper))
          .to.emit(mellowRestaker, "VaultAdded")
          .withArgs(mellowVault, wrapper);
        expect(await mellowRestaker.mellowDepositWrappers(mellowVault)).to.be.eq(wrapper);
      });

      it("addMellowVault wrapper is 0 address", async function () {});

      it("addMellowVault reverts when called by not an owner", async function () {});
    });

    describe("UndelegateFrom: request withdrawal from mellow vault", function () {
      let ratio, ratioDiff, totalDeposited, assets1, assets2, rewards, vault1Delegated, vault2Delegated;

      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      it("Staker deposits and delegates to vault#1", async function () {
        totalDeposited = 10n * e18;
        await iVault.connect(staker).deposit(totalDeposited, staker.address);
        vault1Delegated = (await iVault.getFreeBalance()) / 2n;
        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[0].vaultAddress, vault1Delegated);

        expect(await mellowRestaker.getDeposited(mellowVaults[0].vaultAddress)).to.be.closeTo(
          vault1Delegated,
          transactErr,
        );
      });

      it("Add vault#2 and delegate the rest", async function () {
        await mellowRestaker.addMellowVault(mellowVaults[1].vaultAddress, mellowVaults[1].wrapperAddress);
        vault2Delegated = await iVault.getFreeBalance();

        await iVault.connect(iVaultOperator).delegateToMellowVault(mellowVaults[1].vaultAddress, vault2Delegated);

        expect(await mellowRestaker.getDeposited(mellowVaults[1].vaultAddress)).to.be.closeTo(
          vault2Delegated,
          transactErr,
        );
        expect(await mellowRestaker.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr * 2n);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);
      });

      it("Staker withdraws shares1", async function () {
        assets1 = e18;
        const shares = await iVault.convertToShares(assets1);
        console.log(`Staker is going to withdraw:\t${assets1.format()}`);
        await iVault.connect(staker).withdraw(shares, staker.address);
        console.log(`Staker's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker.address)).format()}`);
      });

      it("Operator can undelegateFrom mellow vault", async function () {
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        const pendingWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const ratioBefore = await calculateRatio(iVault, iToken);

        await expect(iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[0].vaultAddress, assets1))
          .to.emit(iVault, "StartMellowWithdrawal")
          //TODO fix address
          .withArgs(anyValue, assets => {
            expect(assets).to.be.closeTo(assets1, transactErr);
            return true;
          });
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const pendingWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const vault1DelegatedAfter = await mellowRestaker.getDeposited(mellowVaults[0].vaultAddress);
        const withdrawRequest = await mellowRestaker.pendingMellowRequest(mellowVaults[0].vaultAddress);
        const ratioAfter = await calculateRatio(iVault, iToken);

        expect(totalDelegatedBefore - totalDelegatedAfter).to.be.closeTo(assets1, transactErr);
        expect(pendingWithdrawalsAfter - pendingWithdrawalsBefore).to.be.closeTo(assets1, transactErr);
        expect(vault1DelegatedAfter).to.be.closeTo(vault1Delegated - assets1, transactErr);
        expect(withdrawRequest.to).to.be.eq(mellowRestaker.address);
        expect(withdrawRequest.timestamp).to.be.eq((await ethers.provider.getBlock("latest")).timestamp);
        expect(ratioAfter).to.be.closeTo(ratioBefore, 1n);
      });

      it("Adding mellow rewards increases pending withdrawal", async function () {
        const pendingMellowWithdrawalsBefore = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const vault1DelegatedBefore = await mellowRestaker.getDeposited(mellowVaults[0].vaultAddress);
        const ratioBefore = await iVault.ratio();

        //Add rewards
        await a.addRewardsMellowVault(10n * e18, mellowVaults[0].vaultAddress);
        const vault1DelegatedAfter = await mellowRestaker.getDeposited(mellowVaults[0].vaultAddress);
        const pendingMellowWithdrawalsAfter = await mellowRestaker.pendingWithdrawalAmount();
        rewards =
          vault1DelegatedAfter + pendingMellowWithdrawalsAfter - vault1DelegatedBefore - pendingMellowWithdrawalsBefore;
        vault1Delegated += rewards;
        totalDeposited += rewards;
        //Update ratio
        const calculatedRatio = await calculateRatio(iVault, iToken);
        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        ratio = await iVault.ratio();
        ratioDiff = ratioBefore - ratio;

        const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        expect((pendingMellowWithdrawalsBefore * vault1DelegatedAfter) / vault1DelegatedBefore).to.be.closeTo(
          pendingMellowWithdrawalsAfter,
          transactErr,
        );
        expect((totalPendingMellowWithdrawalsBefore * vault1DelegatedAfter) / vault1DelegatedBefore).to.be.closeTo(
          totalPendingMellowWithdrawalsAfter,
          transactErr,
        );
        expect(totalDeposited).to.be.closeTo(await iVault.getTotalDeposited(), transactErr);
      });

      it("Staker withdraws shares2", async function () {
        assets2 = e18;
        const shares = await iVault.convertToShares(assets2);
        console.log(`Staker is going to withdraw:\t${assets2.format()}`);
        await iVault.connect(staker).withdraw(shares, staker2.address);
        console.log(
          `Staker2's pending withdrawals:\t${(await iVault.getPendingWithdrawalOf(staker2.address)).format()}`,
        );
      });

      it("New undelegateFrom from the same vault will replace pending one", async function () {
        const ratioBeforeUndelegate = await iVault.ratio();

        const amount = assets2;
        await expect(iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[0].vaultAddress, amount))
          .to.emit(iVault, "StartMellowWithdrawal")
          //TODO fix address
          .withArgs(anyValue, assets => {
            expect(assets).to.be.closeTo(amount, transactErr);
            return true;
          });
        const pendingMellowWithdrawalsAfter = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const ratioAfter = await calculateRatio(iVault, iToken);

        expect(pendingMellowWithdrawalsAfter).to.be.closeTo(amount, transactErr);
        expect(totalPendingMellowWithdrawalsAfter).to.be.closeTo(amount, transactErr);
        expect(totalDeposited - totalDelegatedAfter).to.be.closeTo(amount, transactErr);
        expect(ratioAfter).to.be.closeTo(ratioBeforeUndelegate, ratioErr);
      });

      it("New undelegateFrom from the another vault", async function () {
        const pendingMellowWithdrawalsBefore = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();

        await expect(iVault.connect(iVaultOperator).undelegateFrom(mellowVaults[1].vaultAddress, assets1))
          .to.emit(iVault, "StartMellowWithdrawal")
          //TODO fix address
          .withArgs(anyValue, assets => {
            expect(assets).to.be.closeTo(assets1, transactErr);
            return true;
          });
        const pendingMellowWithdrawalsAfter = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDelegatedAfter = await iVault.getTotalDelegated();

        expect(pendingMellowWithdrawalsAfter - pendingMellowWithdrawalsBefore).to.be.closeTo(assets1, transactErr);
        expect(totalPendingMellowWithdrawalsAfter - totalPendingMellowWithdrawalsBefore).to.be.closeTo(
          assets1,
          transactErr,
        );
        expect(totalDeposited - totalDelegatedAfter).to.be.closeTo(assets1 + assets2, transactErr);
        expect(await iVault.ratio()).to.be.eq(await calculateRatio(iVault, iToken));
      });

      it("Process vault1 request to transfer pending funds to mellowRestaker", async function () {
        const restakerBalanceBefore = await mellowRestaker.claimableAmount();
        const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Pending from Mellow before:\t\t${totalPendingMellowWithdrawalsBefore.format()}`);

        await mellowVaults[0].curator.processWithdrawals([mellowRestaker.address]);

        const restakerBalanceAfter = await mellowRestaker.claimableAmount();
        const pendingMellowWithdrawalsAfter = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t\t${totalPendingMellowWithdrawalsAfter.format()}`);
        console.log(`Restaker balance diff:\t\t\t${(restakerBalanceAfter - restakerBalanceBefore).format()}`);

        expect(restakerBalanceAfter - restakerBalanceBefore).to.be.closeTo(assets2, transactErr);
        expect(pendingMellowWithdrawalsAfter).to.be.closeTo(assets1, transactErr);
        expect(totalPendingMellowWithdrawalsAfter).to.be.closeTo(totalPendingMellowWithdrawalsBefore, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(await iVault.ratio()).to.be.eq(await calculateRatio(iVault, iToken));
      });

      it("Process vault2 request", async function () {
        const restakerBalanceBefore = await mellowRestaker.claimableAmount();
        const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Pending from Mellow before:\t\t${totalPendingMellowWithdrawalsBefore.format()}`);

        await mellowVaults[1].curator.processWithdrawals([mellowRestaker.address]);

        const restakerBalanceAfter = await mellowRestaker.claimableAmount();
        const pendingMellowWithdrawalsAfter = await mellowRestaker.pendingWithdrawalAmount();
        const totalPendingMellowWithdrawalsAfter = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Pending from Mellow:\t\t\t${totalPendingMellowWithdrawalsAfter.format()}`);
        console.log(`Restaker balance diff:\t\t\t${(restakerBalanceAfter - restakerBalanceBefore).format()}`);

        expect(restakerBalanceAfter - restakerBalanceBefore).to.be.closeTo(assets1, transactErr);
        expect(pendingMellowWithdrawalsAfter).to.be.eq(0n);
        expect(totalPendingMellowWithdrawalsAfter).to.be.eq(totalPendingMellowWithdrawalsBefore);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(await iVault.ratio()).to.be.eq(await calculateRatio(iVault, iToken));
      });

      it("Claim Mellow withdrawal transfer funds from restaker to vault", async function () {
        const totalPendingMellowWithdrawalsBefore = await iVault.getPendingWithdrawalAmountFromMellow();
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).claimCompletedWithdrawals();
        console.log("getTotalDelegated", await iVault.getTotalDelegated());
        console.log("totalAssets", await iVault.totalAssets());
        console.log("getPendingWithdrawalAmountFromMellow", await iVault.getPendingWithdrawalAmountFromMellow());
        console.log("redeemReservedAmount", await iVault.redeemReservedAmount());
        console.log("depositBonusAmount", await iVault.depositBonusAmount());

        const totalAssetsAfter = await iVault.totalAssets();
        const restakerBalanceAfter = await mellowRestaker.claimableAmount();

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(totalPendingMellowWithdrawalsBefore, transactErr);
        expect(restakerBalanceAfter).to.be.eq(0n, transactErr);

        console.log("vault ratio:", await iVault.ratio());
        console.log("calculated ratio:", await calculateRatio(iVault, iToken));

        expect(await iVault.ratio()).to.be.eq(await calculateRatio(iVault, iToken));
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
        expect(await iVault.ratio()).to.be.eq(await calculateRatio(iVault, iToken));
      });
    });
  });
});
