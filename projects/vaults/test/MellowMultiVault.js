const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ZeroAddress } = require("ethers");
const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const { impersonateWithEth, calculateRatio, toWei, e18 } = require("./helpers/utils.js");

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const assets = [
  {
    vaultName: "inUSBDVault_S",
    vaultFactory: "InVault_S_E1",
    assetName: "BIMA USBD",
    assetAddress: "0x6bedE1c6009a78c222D9BDb7974bb67847fdB68c",
    iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
    assetDonor: "0x3F3B0272cD337eb386F2596eD25351316A165809",
    ratioErr: 3n,
    transactErr: 5n,
    blockNumber: 22276903,
    impersonateStaker: async function (staker, iVault) {
      const donor = await impersonateWithEth(this.assetDonor, toWei(1));

      console.log("asset address: ", this.assetAddress);
      console.log("donor address: ", donor.address);

      const asset = await ethers.getContractAt("IERC20", this.assetAddress);
      console.log("Donor balance: ", await asset.balanceOf(donor));

      /// The donor's balance is 142 ETH
      const amount = toWei(40);
      await asset.connect(donor).transfer(staker.address, amount);
      await asset.connect(staker).approve(await iVault.getAddress(), amount);
      console.log("Donor balance after: ", await asset.balanceOf(donor));
      return staker;
    },
    addRewardsMellowVault: async function (amount, mellowVault) {
      const donor = await impersonateWithEth(this.assetDonor, toWei(1));
      const asset = await ethers.getContractAt("IERC20", this.assetAddress);
      await asset.connect(donor).transfer(mellowVault, amount);
    },
    // finalizeLidoWithdrawal: async function (requestId) {
    //   const [deployer] = await ethers.getSigners();
    //   const targetAddress = await deployer.getAddress();

    //   const FINALIZE_ROLE = "0x485191a2ef18512555bd4426d18a716ce8e98c80ec2de16394dcf86d7d91bc80";
    //   const withdrawalQueueAddress = "0x889edc2edab5f40e902b864ad4d7ade8e412f9b1";
    //   const adminAddress = "0x3e40d73eb977dc6a537af587d48316fee66e9c8c";
    //   const withdrawalQueueABI = [
    //     "function finalize(uint256 _lastRequestIdToBeFinalized, uint256 _maxShareRate) external",
    //     "function grantRole(bytes32 role, address account) external",
    //   ];

    //   await network.provider.request({ method: "hardhat_impersonateAccount", params: [adminAddress] });
    //   const adminSigner = await ethers.getSigner(adminAddress);
    //   await impersonateWithEth(adminAddress, toWei(10));

    //   const withdrawalQueue = await ethers.getContractAt(withdrawalQueueABI, withdrawalQueueAddress);

    //   const grantTx = await withdrawalQueue.connect(adminSigner).grantRole(FINALIZE_ROLE, targetAddress);
    //   await grantTx.wait();

    //   const finalizeTx = await withdrawalQueue.connect(deployer).finalize(requestId, toWei(1000));
    //   await finalizeTx.wait();
    // },
  },
];

let MAX_TARGET_PERCENT;
let emptyBytes = [
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
];

//https://docs.mellow.finance/mellow-lrt-lst-primitive/contract-deployments
const mellowVaults = [
  {
    name: "rsUSBD",
    vaultAddress: "0x7DD12E437C226018A374Bfa2BdAf48340B9942bC",
    wrapperAddress: "0x0000000000000000000000000000000000000000",
    bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
    curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
    configuratorAddress: "0x0000000000000000000000000000000000000000",
  },
];

const abi = ethers.AbiCoder.defaultAbiCoder();

const initVault = async a => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt("IERC20", a.assetAddress);
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

  console.log("-------------- Ratio feed");
  const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
  const ratioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
  await ratioFeed.updateRatioBatch([iToken.address], [e18]); //Set initial ratio e18
  ratioFeed.address = await ratioFeed.getAddress();

  console.log("-------------- InceptionLibrary");
  const iLibrary = await ethers.deployContract("InceptionLibrary");
  await iLibrary.waitForDeployment();

  console.log("-------------- iVault");

  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory, {
    libraries: { InceptionLibrary: await iLibrary.getAddress() },
  });
  const iVault = await upgrades.deployProxy(
    iVaultFactory,
    [a.vaultName, a.iVaultOperator, a.assetAddress, iToken.address, ZeroAddress, ZeroAddress],
    {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();

  console.log("- MellowMultiVault Restaker/Adapter");
  const mellowAdapterFactory = await ethers.getContractFactory("IMellowMultiVaultRestaker");
  let mellowAdapterV3 = await upgrades.deployProxy(mellowAdapterFactory, [
    [mellowVaults[0].vaultAddress],
    a.assetAddress,
    a.iVaultOperator,
    iVault.address,
  ]);
  mellowAdapterV3.address = await mellowAdapterV3.getAddress();

  await iVault.setMellowMultiVaultRestaker(mellowAdapterV3.address);
  await iVault.setRatioFeed(ratioFeed.address);
  await mellowAdapterV3.setClaimer("0x25024a3017B8da7161d8c5DCcF768F8678fB5802");

  await iToken.setVault(iVault.address);

  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  console.log("... iVault initialization completed ....");

  return [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapterV3, iLibrary];
};

assets.forEach(function (a) {
  describe(`Inception Vault ${a.assetName}`, function () {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowAdapterV3, iLibrary;
    let iVaultOperator, deployer, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;
    let params;

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

      [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapterV3, iLibrary] = await initVault(a);
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
      before(async function () {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      let totalDeposited, delegatedMellow, undelegatedEpoch;
      let rewardsMellow = 0n;

      it("Initial stats", async function () {
        expect(await iVault.ratio()).to.be.eq(e18);
        expect(await iVault.totalAssets()).to.be.eq(0n);
        expect(await iVault.getTotalDeposited()).to.be.eq(0n);
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
        expect(await iVault.getFlashCapacity()).to.be.eq(0n);
        expect(await iVault.getFreeBalance()).to.be.eq(0n);
      });

      it("User can deposit to iVault", async function () {
        totalDeposited = toWei(20);
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
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);

        const totalAssetsBefore = await iVault.totalAssets();

        await iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
        delegatedMellow = amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowAdapterV3.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();

        console.log("Mellow LP token balance: ", mellowBalance.format());
        console.log("Amount delegated: ", delegatedMellow.format());

        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
        expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr);
        expect(delegatedTo).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr);
        expect(mellowBalance).to.be.gte(amount / 2n);
        expect(await calculateRatio(iVault, iToken)).to.be.closeTo(e18, ratioErr);
      });

      it("Update ratio", async function () {
        const ratio = await calculateRatio(iVault, iToken);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      it("Add rewards to Mellow protocol and estimate ratio", async function () {
        const ratioBefore = await calculateRatio(iVault, iToken);
        const totalDelegatedToBefore = await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress);
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
        console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

        await a.addRewardsMellowVault(e18, mellowVaults[0].vaultAddress);

        const ratioAfter = await calculateRatio(iVault, iToken);
        const totalDelegatedToAfter = await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress);
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

        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
      });

      it("Undelegate from Mellow", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();

        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log("Mellow1 delegated", await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress));

        const assets1 = await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress);

        const tx = await iVault
          .connect(iVaultOperator)
          .undelegate(
            await mellowAdapterV3.getAddress(),
            mellowVaults[0].vaultAddress,
            assets1,
            emptyBytes,
          );

        console.log(
          "Mellow1 delegated",
          await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress),
        );

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedTo = await iVault.getDelegatedToMellowMultiVault(mellowVaults[0].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);

        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
        expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
      });

      it("Claim from Mellow", async function () {
        await helpers.time.increase(1209900);

        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawalAmountFromMellowMultiVault();
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault
          .connect(iVaultOperator)
          .claim(await mellowAdapterV3.getAddress(), []);

        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
      });

      it("Staker is able to redeem", async function () {
        const pendingWithdrawalByStaker = await iVault.getPendingWithdrawalOf(staker2.address);
        const redeemReserve = await iVault.redeemReservedAmount();
        const freeBalance = await iVault.getFreeBalance();

        console.log("Pending withdrawal by staker", pendingWithdrawalByStaker.format());
        console.log("Redeem reserve", redeemReserve.format());
        console.log("Free balance", freeBalance.format());

        console.log("Redeem reserve after", await iVault.redeemReservedAmount());
        expect((await iVault.isAbleToRedeem(staker2.address))[0]).to.be.true;
      });


      it("Redeem withdraw", async function() {
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
        expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore, transactErr + 13n);
        expect(totalDepositedAfter).to.be.closeTo(0n, transactErr + 13n);
        expect(totalAssetsAfter).to.be.closeTo(0n, transactErr + 13n);
      });

    });
  });
});

