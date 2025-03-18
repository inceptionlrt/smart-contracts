const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const { ZeroAddress } = require("ethers");
const {
  addRewardsToStrategy,
  impersonateWithEth,
  calculateRatio,
  toWei,
  mineBlocks,
  e18,
} = require("./helpers/utils.js");

const assets = [
  {
    vaultName: "InstEthVault",
    vaultFactory: "InVault_S_E2",
    assetName: "stETH",
    assetAddress: "0x8d09a4502cc8cf1547ad300e066060d043f6982d",
    assetPoolName: "LidoMockPool",
    backedAssetAddress: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    assetPool: "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
    assetStrategy: "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3",
    strategyManager: "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6",
    iVaultOperator: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    delegationManager: "0xA44151489861Fe9e3055d95adC98FbD462B948e7",
    rewardsCoordinator: "0xAcc1fb458a1317E886dB376Fc8141540537E68fE",
    withdrawalDelayBlocks: 400,
    ratioErr: 2n,
    transactErr: 5n,
    blockNumber: 3338549,
    url: "https://holesky.drpc.org",
    impersonateStaker: async function(staker, iVault) {
      const wstETHDonorAddress = "0x0000000000a2d441d85315e5163dEEC094bf6FE1";
      const donor1 = await impersonateWithEth(wstETHDonorAddress, toWei(10));

      const wstAmount = toWei(100);
      const wstEth = await ethers.getContractAt("IWSteth", this.assetAddress);
      await wstEth.connect(donor1).transfer(staker.address, wstAmount);
      await wstEth.connect(staker).approve(await iVault.getAddress(), wstAmount);

      const stETHDonorAddress = "0x66b25CFe6B9F0e61Bd80c4847225Baf4EE6Ba0A2";
      const donor2 = await impersonateWithEth(stETHDonorAddress, toWei(1));
      const stEth = await ethers.getContractAt("stETH", this.backedAssetAddress);
      const stEthAmount = toWei(1000);
      await stEth.connect(donor2).transfer(staker.address, stEthAmount);
      await stEth.connect(staker).approve(iVault, stEthAmount);

      return staker;
    },
  },
];

const eigenLayerVaults = [
  "0x78FDDe7a5006cC64E109aeD99cA7B0Ad3d8687bb",
  "0x1B71f18fc496194b21D0669B5ADfE299a8cFEc42",
  "0x4Dbfa8bcccb1740d8044E1A093F9A078A88E45FE",
  "0x5B9A8c72B29Ee17e72ba8B9626Bf43a75B15FB3d",
  "0x139A091BcAad0ee1DAabe93cbBd194736B197FB6",
];

const initVault = async a => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting at block number: ${block.number}`);
  console.log("... Initialization of Inception ....");

  console.log("- Asset");
  const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
  asset.address = await asset.getAddress();

  /// =============================== Inception Vault ===============================
  console.log("- Emergency claimer");
  const emergencyClaimerFactory = await ethers.getContractFactory("EmergencyClaimer");
  let emergencyClaimer = await upgrades.deployProxy(emergencyClaimerFactory);
  emergencyClaimer.address = await emergencyClaimer.getAddress();

  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- iVault operator");
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);

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
    [a.vaultName, a.iVaultOperator, a.assetAddress, iToken.address],
    {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();

  console.log("- EigenLayer Adapter");
  let [deployer] = await ethers.getSigners();
  const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapterWrap");
  let eigenLayerAdapter = await upgrades.deployProxy(eigenLayerAdapterFactory, [
    await deployer.getAddress(),
    a.rewardsCoordinator,
    a.delegationManager,
    a.strategyManager,
    a.assetStrategy,
    a.assetAddress,
    a.iVaultOperator,
    iVault.address,
  ]);
  eigenLayerAdapter.address = await eigenLayerAdapter.getAddress();

  console.log("- Withdrawal Queue");
  const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [], [], 0]);
  withdrawalQueue.address = await withdrawalQueue.getAddress();

  await emergencyClaimer.setEigenAdapter(eigenLayerAdapter.address);
  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.addAdapter(eigenLayerAdapter.address);
  await iVault.setWithdrawalQueue(withdrawalQueue.address);
  await eigenLayerAdapter.setInceptionVault(iVault.address);
  await eigenLayerAdapter.setEmergencyClaimer(emergencyClaimer.address);
  await iToken.setVault(iVault.address);

  console.log("... iVault initialization completed ....");

  return [
    iToken,
    iVault,
    ratioFeed,
    asset,
    iVaultOperator,
    eigenLayerAdapter,
    withdrawalQueue,
  ];
};

assets.forEach(function(a) {
  describe(`Inception Symbiotic Vault ${a.assetName}`, function() {
    const coder = new ethers.AbiCoder();
    const encodedSignatureWithExpiry = coder.encode(
      ["tuple(uint256 expiry, bytes signature)"],
      [{ expiry: 0, signature: ethers.ZeroHash }],
    );
    const delegateData = [ethers.ZeroHash, encodedSignatureWithExpiry];

    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, eigenLayerAdapter, iLibrary, withdrawalQueue;
    let iVaultOperator, deployer, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;

    before(async function() {
      await network.provider.send("hardhat_reset", [
        {
          forking: {
            jsonRpcUrl: a.url ? a.url : network.config.forking.url,
            blockNumber: a.blockNumber ? a.blockNumber : network.config.forking.blockNumber,
          },
        },
      ]);

      [iToken, iVault, ratioFeed, asset, iVaultOperator, eigenLayerAdapter, withdrawalQueue] =
        await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();

      staker = await a.impersonateStaker(staker, iVault);
      staker2 = await a.impersonateStaker(staker2, iVault);
      staker3 = await a.impersonateStaker(staker3, iVault);
      treasury = await iVault.treasury(); //deployer

      snapshot = await helpers.takeSnapshot();
    });

    after(async function() {
      if (iVault) {
        await iVault.removeAllListeners();
      }
    });

    describe("InceptionEigenAdapter", function() {
      let adapter, iVaultMock, trusteeManager;

      beforeEach(async function() {
        await snapshot.restore();
        iVaultMock = staker2;
        trusteeManager = staker3;

        console.log(`iVaultMock balance of asset after: ${await asset.balanceOf(iVaultMock.address)}`);
        console.log(`trusteeManager balance of asset after: ${await asset.balanceOf(trusteeManager.address)}`);

        const InceptionEigenAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapterWrap", iVaultMock);
        adapter = await upgrades.deployProxy(InceptionEigenAdapterFactory, [
          await deployer.getAddress(),
          a.rewardsCoordinator,
          a.delegationManager,
          a.strategyManager,
          a.assetStrategy,
          a.assetAddress,
          trusteeManager.address,
          iVault.address,
        ]);
      });

      it("getOperatorAddress: equals 0 address before any delegation", async function() {
        expect(await adapter.getOperatorAddress()).to.be.eq(ethers.ZeroAddress);
      });

      it("getOperatorAddress: reverts when _data length is < 2", async function() {
        const amount = toWei(0);
        console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await expect(adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], amount, [])).to.be.revertedWithCustomError(adapter, "InvalidDataLength");
      });

      it("getOperatorAddress: equals operator after delegation", async function() {
        console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
        await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);
        expect(await adapter.getOperatorAddress()).to.be.eq(eigenLayerVaults[0]);
      });

      it("delegateToOperator: reverts when called by not a trustee", async function() {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

        await expect(
          adapter.connect(staker).delegate(eigenLayerVaults[0], 0n, delegateData),
        ).to.be.revertedWithCustomError(adapter, "NotVaultOrTrusteeManager");
      });

      it("delegateToOperator: reverts when delegates to 0 address", async function() {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

        await expect(
          adapter.connect(trusteeManager).delegate(ethers.ZeroAddress, 0n, delegateData),
        ).to.be.revertedWithCustomError(adapter, "NullParams");
      });

      it("delegateToOperator: reverts when delegates unknown operator", async function() {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);

        const unknownOperator = ethers.Wallet.createRandom().address;
        await expect(adapter.connect(trusteeManager)
          .delegate(unknownOperator, 0n, delegateData))
          .to.be.revertedWithCustomError(iVault, "OperatorNotRegistered");
      });

      it("withdrawFromEL: reverts when called by not a trustee", async function() {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);
        await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);

        await expect(adapter.connect(staker).withdraw(ZeroAddress, amount / 2n, [], false)).to.be.revertedWithCustomError(
          adapter,
          "NotVaultOrTrusteeManager",
        );
      });

      it("getVersion: equals 3", async function() {
        expect(await adapter.getVersion()).to.be.eq(3);
      });

      it("pause(): only owner can", async function() {
        expect(await adapter.paused()).is.false;
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;
      });

      it("pause(): another address can not", async function() {
        await expect(adapter.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("unpause(): only owner can", async function() {
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;

        await adapter.connect(iVaultMock).unpause();
        expect(await adapter.paused()).is.false;
      });

      it("unpause(): another address can not", async function() {
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;
        await expect(adapter.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("EigenLayer | Base flow no flash", function() {
      let totalDeposited = 0n;
      let delegatedEL = 0n;
      let tx;
      let undelegateEpoch;

      before(async function() {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      it("Initial stats", async function() {
        expect(await iVault.ratio()).to.be.eq(e18);
        expect(await iVault.totalAssets()).to.be.eq(0n);
        expect(await iVault.getTotalDeposited()).to.be.eq(0n);
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
        expect(await iVault.getFlashCapacity()).to.be.eq(0n);
        expect(await iVault.getFreeBalance()).to.be.eq(0n);
      });

      it("User can deposit to iVault", async function() {
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
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
      });

      it("Delegate to EigenLayer#1", async function() {
        const amount = (await iVault.getFreeBalance()) / 3n;
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);

        delegatedEL += amount;
      });

      it("Delegate all to eigenOperator#1", async function() {
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
        delegatedEL += amount;
      });

      it("Update ratio", async function() {
        const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      it("Update asset ratio", async function() {
        console.log("totalDelegatedBefore", await iVault.getTotalDelegated());
        await addRewardsToStrategy(a.assetStrategy, e18, staker3);
        console.log("totalDelegatedAfter", await iVault.getTotalDelegated());
        const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).lt(e18);
      });

      it("User can withdraw all", async function() {
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

        const withdrawalEpoch = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
        const totalPW = withdrawalEpoch[1];

        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
        expect(totalPW).to.be.closeTo(shares, transactErr);
      });

      // it("Update ratio after all shares burn", async function () {
      //   const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
      //   console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
      //   expect(calculatedRatio).to.be.eq(999999045189759685n); //Because all shares have been burnt at this point
      //
      //   await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
      //   console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
      //   expect(await iVault.ratio()).eq(calculatedRatio);
      // });

      it("Undelegate from EigenLayer", async function() {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        undelegateEpoch = await withdrawalQueue.currentEpoch();

        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);

        tx = await iVault
          .connect(iVaultOperator)
          .undelegate(
            [eigenLayerAdapter.address], [eigenLayerVaults[0]], [totalDelegatedBefore], [[]],
          );
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();

        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      });

      it("Claim from EigenLayer", async function() {
        const receipt = await tx.wait();

        const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapterWrap");
        let withdrawalQueuedEvent;
        receipt.logs.forEach(log => {
          try {
            const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
            if (parsedLog) {
              console.log("🔹 Event Detected:");
              withdrawalQueuedEvent = parsedLog.args;
              return;
            }
          } catch (error) {
          }
        });

        const wData = {
          staker1: withdrawalQueuedEvent["stakerAddress"],
          staker2: eigenLayerVaults[0],
          staker3: eigenLayerAdapter.address,
          nonce1: withdrawalQueuedEvent["nonce"],
          nonce2: withdrawalQueuedEvent["withdrawalStartBlock"],
          tokens: [withdrawalQueuedEvent["strategy"]],
          shares: [withdrawalQueuedEvent["shares"]],
        };

        console.log(wData);

        // Encode the data
        const _data = [
          coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
          coder.encode(["address[][]"], [[[a.backedAssetAddress]]]),
          coder.encode(["bool[]"], [[true]]),
        ];

        await mineBlocks(50);

        await iVault.connect(iVaultOperator).claim(
          undelegateEpoch, [eigenLayerAdapter.address], [eigenLayerVaults[0]], [_data],
        );

        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();

        console.log(`Total deposited after claim:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated after claim:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets after claim:\t\t\t${totalAssetsBefore.format()}`);
      });

      it("Staker is able to redeem", async function() {
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

        console.log(`staker2PWBefore: ${staker2PWBefore.toString()}`);
        console.log(`staker2PWBefore: ${(await iVault.redeemReservedAmount()).toString()}`);
        console.log(`staker2PWBefore: ${(await asset.balanceOf(iVault.address)).toString()}`);
        console.log(`staker2PWBefore: ${(await eigenLayerAdapter.getDepositedShares()).toString()}`);

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
        expect(totalAssetsAfter).to.be.closeTo(0n, transactErr * 3n);
      });
    });

    describe("Emergency undelegate", function() {
      let undelegateTx;

      before(async function() {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      it("Initial stats", async function() {
        expect(await iVault.ratio()).to.be.eq(e18);
        expect(await iVault.totalAssets()).to.be.eq(0n);
        expect(await iVault.getTotalDeposited()).to.be.eq(0n);
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
        expect(await iVault.getFlashCapacity()).to.be.eq(0n);
        expect(await iVault.getFreeBalance()).to.be.eq(0n);
      });

      it("User can deposit to iVault", async function() {
        let totalDeposited = toWei(20);
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
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
      });

      it("Delegate to EigenLayer#1", async function() {
        const amount = await iVault.getFreeBalance();
        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);
        expect(await iVault.getTotalDelegated()).to.be.closeTo(toWei(20), transactErr);
      });

      it("Emergency undelegate", async function() {
        undelegateTx = await iVault.connect(iVaultOperator)
          .emergencyUndelegate([eigenLayerAdapter.address], [eigenLayerVaults[0]], [toWei(5)], [[]]);

        expect(await iVault.getTotalPendingWithdrawals()).to.be.eq(0);
        expect(await iVault.getTotalDelegated()).to.be.closeTo(toWei(15), transactErr);
        expect(await iVault.getTotalPendingEmergencyWithdrawals()).to.be.closeTo(toWei(5), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(toWei(1), ratioErr);
      });

      it("User withdraw", async function() {
        const tx = await iVault.connect(staker).withdraw(toWei(2), staker);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Withdraw");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.eq(toWei(2));
        expect(events[0].args["iShares"]).to.be.eq(toWei(2));
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(toWei(1), ratioErr);
      });

      it("Emergency claim", async function() {
        const receipt = await undelegateTx.wait();

        const eigenLayerAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapterWrap");
        let withdrawalQueuedEvent;
        receipt.logs.forEach(log => {
          try {
            const parsedLog = eigenLayerAdapterFactory.interface.parseLog(log);
            if (parsedLog) {
              console.log("🔹 Event Detected:");
              withdrawalQueuedEvent = parsedLog.args;
              return;
            }
          } catch (error) {
          }
        });

        const wData = {
          staker1: withdrawalQueuedEvent["stakerAddress"],
          staker2: eigenLayerVaults[0],
          staker3: eigenLayerAdapter.address,
          nonce1: withdrawalQueuedEvent["nonce"],
          nonce2: withdrawalQueuedEvent["withdrawalStartBlock"],
          tokens: [withdrawalQueuedEvent["strategy"]],
          shares: [withdrawalQueuedEvent["shares"]],
        };

        console.log(wData);

        // Encode the data
        const _data = [
          coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
          coder.encode(["address[][]"], [[[a.backedAssetAddress]]]),
          coder.encode(["bool[]"], [[true]]),
        ];

        await mineBlocks(50);

        await iVault.connect(iVaultOperator).emergencyClaim(
          [eigenLayerAdapter.address], [eigenLayerVaults[0]], [_data],
        );

        expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(5), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(toWei(1), ratioErr);
      });

      it("Force undelegate & claim", async function() {
        await iVault.connect(iVaultOperator).undelegate([], [], [], []);

        expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(5), transactErr);
        expect(await withdrawalQueue.totalAmountRedeem()).to.be.closeTo(toWei(2), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(toWei(1), ratioErr);
        // ----------------
      });

      it("Redeem", async function() {
        const tx = await iVault.connect(staker).redeem(staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter(e => e.eventName === "Redeem");

        expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
        expect(await asset.balanceOf(iVault.address)).to.be.closeTo(toWei(3), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(toWei(1), ratioErr);
      });
    });
  });
});

