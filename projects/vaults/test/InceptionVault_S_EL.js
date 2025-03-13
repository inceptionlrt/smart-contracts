const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const {
  addRewardsToStrategyWrap,
  impersonateWithEth,
  withdrawDataFromTx,
  setBlockTimestamp,
  getRandomStaker,
  calculateRatio,
  toWei,
  randomBI,
  mineBlocks,
  randomBIMax,
  randomAddress,
  e18,
  day,
} = require("./helpers/utils.js");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ZeroAddress } = require("ethers");
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
    rewardsCoordinator: "0x7750d328b314EfFa365A0402CcfD489B80B0adda",
    delegationManager: "0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A",
    strategyManager: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategy: "0x93c4b944D05dfe6df7645A86cd2206016c51564D",
    ratioErr: 3n,
    transactErr: 5n,
    blockNumber: 21861027,
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
let MAX_TARGET_PERCENT;

const eigenLayerVaults = [
  "0xDbEd88D83176316fc46797B43aDeE927Dc2ff2F5",
  "0xe25480334fc57a4f38F081e87cdFeeEAF09779C9",
  "0x1f8C8b1d78d01bCc42ebdd34Fae60181bD697662",
];

//https://docs.mellow.finance/mellow-lrt-lst-primitive/contract-deployments
const mellowVaults = [
  {
    name: "P2P",
    vaultAddress: "0x7a4EffD87C2f3C55CA251080b1343b605f327E3a",
    wrapperAddress: "0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d",
    bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
    curatorAddress: "0x4a3c7F2470Aa00ebE6aE7cB1fAF95964b9de1eF4",
    configuratorAddress: "0x84b240E99d4C473b5E3dF1256300E2871412dDfe",
  },
  {
    name: "Mev Capital",
    vaultAddress: "0x5fD13359Ba15A84B76f7F87568309040176167cd",
    wrapperAddress: "0xdC1741f9bD33DD791942CC9435A90B0983DE8665",
    bondStrategyAddress: "0xc3A149b5Ca3f4A5F17F5d865c14AA9DBb570F10A",
    curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
    configuratorAddress: "0x2dEc4fDC225C1f71161Ea481E23D66fEaAAE2391",
  },
  {
    name: "Re7",
    vaultAddress: "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a",
    wrapperAddress: "0x70cD3464A41B6692413a1Ba563b9D53955D5DE0d",
    bondStrategyAddress: "0xcE3A8820265AD186E8C1CeAED16ae97176D020bA",
    curatorAddress: "0xE86399fE6d7007FdEcb08A2ee1434Ee677a04433",
    configuratorAddress: "0x214d66d110060dA2848038CA0F7573486363cAe4",
  },
];

const symbioticVaults = [
  {
    name: "Gauntlet Restaked wstETH",
    vaultAddress: "0xc10A7f0AC6E3944F4860eE97a937C51572e3a1Da",
    collateral: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    burner: "0xDB0737bd7eBEA50135e4c8af56900b029b858371",
    delegator: "0x1f16782a9b75FfFAD87e7936791C672bdDBCb8Ec",
    slasher: "0x541c86eb2C5e7F3E0C04eF82aeb68EA6A86409ef",
  },
  {
    name: "Ryabina wstETH",
    vaultAddress: "0x93b96D7cDe40DC340CA55001F46B3B8E41bC89B4",
    collateral: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
    burner: "0x80918bcD2d1e343ed46E201CD09238149dB5A5bF",
    delegator: "0x742DD9676086579994E9a3DD536C9CCc0Cc6e78D",
    slasher: "0xCCA42120Dc4fc945F2fBd227d7D9EA5963bba490",
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

  /// =============================== Symbiotic Vaults ===============================

  for (const sVaultInfo of symbioticVaults) {
    console.log(`- Symbiotic ${sVaultInfo.name}`);
    sVaultInfo.vault = await ethers.getContractAt("IVault", sVaultInfo.vaultAddress);
  }

  /// =============================== Inception Vault ===============================
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  iToken.address = await iToken.getAddress();

  console.log("- iVault operator");
  const iVaultOperator = await impersonateWithEth(a.iVaultOperator, e18);

  console.log("- Mellow Adapter");
  const mellowAdapterFactory = await ethers.getContractFactory("IMellowAdapter");
  let mellowAdapter = await upgrades.deployProxy(mellowAdapterFactory, [
    [mellowVaults[0].vaultAddress],
    a.assetAddress,
    a.iVaultOperator,
  ]);
  mellowAdapter.address = await mellowAdapter.getAddress();

  console.log("- Symbiotic Adapter");
  const symbioticAdapterFactory = await ethers.getContractFactory("ISymbioticAdapter");
  let symbioticAdapter = await upgrades.deployProxy(symbioticAdapterFactory, [
    [symbioticVaults[0].vaultAddress],
    a.assetAddress,
    a.iVaultOperator,
  ]);
  symbioticAdapter.address = await symbioticAdapter.getAddress();

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
  ]);
  eigenLayerAdapter.address = await eigenLayerAdapter.getAddress();

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

  console.log("- Withdrawal Queue");
  const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [], [], 0]);
  withdrawalQueue.address = await withdrawalQueue.getAddress();

  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.addAdapter(symbioticAdapter.address);
  await iVault.addAdapter(mellowAdapter.address);
  await iVault.addAdapter(eigenLayerAdapter.address);
  await iVault.setWithdrawalQueue(withdrawalQueue.address);
  await mellowAdapter.setInceptionVault(iVault.address);
  await symbioticAdapter.setInceptionVault(iVault.address);
  await eigenLayerAdapter.setInceptionVault(iVault.address);
  await iToken.setVault(iVault.address);
  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  console.log("... iVault initialization completed ....");

  iVault.withdrawFromMellowAndClaim = async function (mellowVaultAddress, amount) {
    await this.connect(iVaultOperator).undelegateFromMellow(mellowVaultAddress, amount, 1296000);
    await mellowVaults[0].curator.processWithdrawals([mellowAdapter.address]);
    await this.connect(iVaultOperator).claimCompletedWithdrawalsMellow();
  };

  return [
    iToken,
    iVault,
    ratioFeed,
    asset,
    iVaultOperator,
    mellowAdapter,
    symbioticAdapter,
    eigenLayerAdapter,
    iLibrary,
    withdrawalQueue
  ];
};

assets.forEach(function (a) {
  describe(`Inception Symbiotic Vault ${a.assetName}`, function () {
    const coder = new ethers.AbiCoder();
    const encodedSignatureWithExpiry = coder.encode(
      ["tuple(uint256 expiry, bytes signature)"],
      [{ expiry: 0, signature: ethers.ZeroHash }],
    );
    const delegateData = [ethers.ZeroHash, encodedSignatureWithExpiry];

    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowAdapter, symbioticAdapter, eigenLayerAdapter, iLibrary, withdrawalQueue;
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

      [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, symbioticAdapter, eigenLayerAdapter, iLibrary, withdrawalQueue] =
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

    after(async function () {
      if (iVault) {
        await iVault.removeAllListeners();
      }
    });

    describe("InceptionEigenAdapter", function () {
      let adapter, iVaultMock, trusteeManager;

      beforeEach(async function () {
        await snapshot.restore();
        iVaultMock = staker2;
        trusteeManager = staker3;
        const wstEth = await ethers.getContractAt("IWSteth", "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0");
        const stEth = await ethers.getContractAt("stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84");
        await wstEth.connect(iVaultMock).unwrap(toWei(10));
        await wstEth.connect(trusteeManager).unwrap(toWei(10));
        asset = wstEth;
        console.log(`iVaultMock balance of asset after: ${await asset.balanceOf(iVaultMock.address)}`);
        console.log(`trusteeManager balance of asset after: ${await asset.balanceOf(trusteeManager.address)}`);

        const InceptionEigenAdapterFactory = await ethers.getContractFactory("InceptionEigenAdapterWrap", iVaultMock);
        adapter = await upgrades.deployProxy(InceptionEigenAdapterFactory, [
          await deployer.getAddress(),
          a.rewardsCoordinator,
          a.delegationManager,
          a.strategyManager,
          a.assetStrategy,
          await wstEth.getAddress(),
          trusteeManager.address,
        ]);
      });

      it("getOperatorAddress: equals 0 address before any delegation", async function () {
        expect(await adapter.getOperatorAddress()).to.be.eq(ethers.ZeroAddress);
      });

      it("getOperatorAddress: reverts when _data length is < 2", async function () {
        const amount = toWei(0);
        console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await expect(adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], amount, [])).to.be.revertedWithCustomError(adapter, "InvalidDataLength");
      });

      it("getOperatorAddress: equals operator after delegation", async function () {
        console.log(`asset address: ${await asset.balanceOf(trusteeManager.address)}`);
        await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);
        expect(await adapter.getOperatorAddress()).to.be.eq(eigenLayerVaults[0]);
      });

      it("delegateToOperator: reverts when called by not a trustee", async function () {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

        await expect(
          adapter.connect(staker).delegate(eigenLayerVaults[0], 0n, delegateData),
        ).to.be.revertedWithCustomError(adapter, "NotVaultOrTrusteeManager");
      });

      it("delegateToOperator: reverts when delegates to 0 address", async function () {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, []);

        await expect(
          adapter.connect(trusteeManager).delegate(ethers.ZeroAddress, 0n, delegateData),
        ).to.be.revertedWithCustomError(adapter, "NullParams");
      });

      it("delegateToOperator: reverts when delegates unknown operator", async function () {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);

        const unknownOperator = ethers.Wallet.createRandom().address;
        await expect(adapter.connect(trusteeManager).delegate(unknownOperator, 0n, delegateData)).to.be.revertedWith(
          "DelegationManager._delegate: operator is not registered in EigenLayer",
        );
      });

      it("withdrawFromEL: reverts when called by not a trustee", async function () {
        const amount = toWei(1);
        await asset.connect(trusteeManager).approve(await adapter.getAddress(), amount);
        await adapter.connect(trusteeManager).delegate(ZeroAddress, amount, delegateData);
        await adapter.connect(trusteeManager).delegate(eigenLayerVaults[0], 0n, delegateData);

        await expect(adapter.connect(staker).withdraw(ZeroAddress, amount / 2n, [])).to.be.revertedWithCustomError(
          adapter,
          "NotVaultOrTrusteeManager",
        );
      });

      it("getVersion: equals 3", async function () {
        expect(await adapter.getVersion()).to.be.eq(3);
      });

      it("pause(): only owner can", async function () {
        expect(await adapter.paused()).is.false;
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;
      });

      it("pause(): another address can not", async function () {
        await expect(adapter.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("unpause(): only owner can", async function () {
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;

        await adapter.connect(iVaultMock).unpause();
        expect(await adapter.paused()).is.false;
      });

      it("unpause(): another address can not", async function () {
        await adapter.connect(iVaultMock).pause();
        expect(await adapter.paused()).is.true;
        await expect(adapter.connect(staker).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
      });
    });

    describe("EigenLayer | Base flow no flash", function () {
      let totalDeposited = 0n;
      let delegatedEL = 0n;
      let tx;
      let undelegateEpoch;

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
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
      });

      it("Delegate to EigenLayer#1", async function () {
        const amount = (await iVault.getFreeBalance()) / 3n;
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, eigenLayerVaults[0], 0n, delegateData);

        delegatedEL += amount;
      });

      it("Delegate all to eigenOperator#1", async function () {
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault.connect(iVaultOperator).delegate(eigenLayerAdapter.address, ZeroAddress, amount, []);
        delegatedEL += amount;
      });

      it("Update ratio", async function () {
        const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      it("Update asset ratio", async function () {
        await addRewardsToStrategyWrap(a.assetStrategy, a.assetAddress, e18, staker3);
        const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`New ratio is:\t\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).lt(e18);
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

        const withdrawalEpoch = await withdrawalQueue.withdrawals(await withdrawalQueue.currentEpoch());
        const totalPW = withdrawalEpoch[1];

        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
        expect(totalPW).to.be.closeTo(shares, transactErr);
      });

      it("Update ratio after all shares burn", async function () {
        const calculatedRatio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${calculatedRatio.format()}`);
        expect(calculatedRatio).to.be.eq(999999045189759686n); //Because all shares have been burnt at this point

        await ratioFeed.updateRatioBatch([iToken.address], [calculatedRatio]);
        console.log(`iVault ratio after:\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(calculatedRatio);
      });

      it("Undelegate from EigenLayer", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();

        undelegateEpoch = await withdrawalQueue.currentEpoch();
        const withdrawalEpoch = await withdrawalQueue.withdrawals(undelegateEpoch);

        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Undelegate shares:\t\t\t${await iVault.convertToAssets(withdrawalEpoch[1])}`);
        
        tx = await iVault
          .connect(iVaultOperator)
          .undelegate(
            [eigenLayerAdapter.address], [eigenLayerVaults[0]], [withdrawalEpoch[1]], [[]]
          );
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalDelegatedAfter = await iVault.getTotalDelegated();

        console.log(`Total deposited after:\t\t\t${totalDepositedAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
      });

      it("Claim from EigenLayer", async function () {
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
          } catch (error) {}
        });

       const wData = {
          staker1: withdrawalQueuedEvent["stakerAddress"],
          staker2: eigenLayerVaults[0],
          staker3: eigenLayerAdapter.address,
          nonce1:  withdrawalQueuedEvent["nonce"]-1n,
          nonce2:withdrawalQueuedEvent["withdrawalStartBlock"],
          tokens: [withdrawalQueuedEvent["strategy"]],
          shares:  [withdrawalQueuedEvent["shares"]],
       };

        console.log(wData);

          // Encode the data
        const _data = [
          coder.encode(["tuple(address staker1,address staker2,address staker3,uint256 nonce1,uint256 nonce2,address[] tokens,uint256[] shares)"], [wData]),
          coder.encode(["address[][]"], [[["0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"]]]),
          coder.encode(["uint256[]"], [["0"]]),
          coder.encode(["bool[]"], [[true]])
        ];


        await mineBlocks(100000);

        await iVault.connect(iVaultOperator).claim(undelegateEpoch, [eigenLayerAdapter.address], [eigenLayerVaults[0]], [_data]);

        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();

        console.log(`Total deposited after claim:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated after claim:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets after claim:\t\t\t${totalAssetsBefore.format()}`);
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

      it("Redeem withdraw", async function () {
        const balanceBefore = await asset.balanceOf(staker2.address);
        const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

        console.log(`staker2PWBefore: ${staker2PWBefore.toString()}`);
        console.log(`staker2PWBefore: ${(await iVault.redeemReservedAmount()).toString()}`);
        console.log(`staker2PWBefore: ${(await asset.balanceOf(iVault.address)).toString()}`);
        console.log(`staker2PWBefore: ${( await eigenLayerAdapter.getDepositedShares()).toString()}`);

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
        expect(totalDepositedAfter).to.be.closeTo(0n, transactErr*3n);
        expect(totalAssetsAfter).to.be.closeTo(0n, transactErr*3n);
      });
    });
  });
});

