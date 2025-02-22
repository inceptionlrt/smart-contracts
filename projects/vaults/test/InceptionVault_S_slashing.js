const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const { expect } = require("chai");
const {
  impersonateWithEth,
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
BigInt.prototype.format = function() {
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
    blockNumber: 21850700, //21687985,
    impersonateStaker: async function(staker, iVault) {
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
    addRewardsMellowVault: async function(amount, mellowVault) {
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
    applySymbioticSlash: async function(symbioticVault, slashAmount) {
      const slasherAddressStorageIndex = 3;

      [deployer] = await ethers.getSigners();
      deployer.address = await deployer.getAddress();

      await helpers.setStorageAt(
        await symbioticVault.getAddress(),
        slasherAddressStorageIndex,
        ethers.AbiCoder.defaultAbiCoder().encode(["address"], [deployer.address]),
      );

      await symbioticVault.connect(deployer).onSlash(slashAmount, await symbioticVault.currentEpochStart());
    },
  },
];
let MAX_TARGET_PERCENT;
let emptyBytes = [
  "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
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
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory);
  withdrawalQueue.address = await withdrawalQueue.getAddress();


  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.addAdapter(symbioticAdapter.address);
  await iVault.addAdapter(mellowAdapter.address);
  await iVault.setWithdrawalQueue(withdrawalQueue.address);
  await mellowAdapter.setInceptionVault(iVault.address);
  await symbioticAdapter.setInceptionVault(iVault.address);
  await mellowAdapter.setEthWrapper("0x7A69820e9e7410098f766262C326E211BFa5d1B1");
  await iToken.setVault(iVault.address);
  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  console.log("... iVault initialization completed ....");

  iVault.withdrawFromMellowAndClaim = async function(mellowVaultAddress, amount) {
    await this.connect(iVaultOperator).undelegate(
      await mellowAdapter.getAddress(),
      mellowVaultAddress,
      amount,
      emptyBytes,
    );
    // await mellowVaults[0].curator.processWithdrawals([mellowAdapter.address]);
    await helpers.time.increase(1209900);
    await mellowAdapter.claimPending();
    await this.connect(iVaultOperator).claim(await mellowAdapter.getAddress(), emptyBytes);
  };

  return [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, symbioticAdapter, iLibrary, withdrawalQueue];
};

async function skipEpoch(symbioticVault) {
  let epochDuration = await symbioticVault.vault.epochDuration();
  let nextEpochStart = await symbioticVault.vault.nextEpochStart();
  await setBlockTimestamp(Number(nextEpochStart + epochDuration + 1n));
}

assets.forEach(function(a) {
  describe(`Inception Symbiotic Vault ${a.assetName}`, function() {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowAdapter, symbioticAdapter, iLibrary, withdrawalQueue;
    let iVaultOperator, deployer, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;
    let params;

    const abi = ethers.AbiCoder.defaultAbiCoder();

    before(async function() {
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

      [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapter, symbioticAdapter, iLibrary, withdrawalQueue] =
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

    describe("Symbiotic", function() {
      beforeEach(async function() {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      it("one withdrawal without slash", async function() {
        // deposit
        let tx = await iVault.connect(staker).deposit(toWei(10), staker.address);
        await tx.wait();
        // ----------------

        // delegate
        tx = await iVault.connect(iVaultOperator)
          .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
        await tx.wait();
        // ----------------

        // one withdraw
        let shares = await iToken.balanceOf(staker.address);
        tx = await iVault.connect(staker).withdraw(shares, staker.address);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // undelegate
        let withdrawalEpoch = await withdrawalQueue.withdrawals(0);
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, withdrawalEpoch[1], emptyBytes);
        let receipt = await tx.wait();
        let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

        expect(events[0].args["adapter"]).to.be.eq(symbioticAdapter.address);
        expect(events[0].args["actualAmounts"]).to.be.eq(toWei(10));
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // redeem
        tx = await iVault.connect(staker).redeem(staker.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");

        expect(events[0].args["amount"]).to.be.closeTo(toWei(10), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------
      });

      it("2 withdraw & slash between undelegate", async function() {
        // deposit
        let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
        await tx.wait();

        tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
        await tx.wait();
        // ----------------

        // delegate
        tx = await iVault.connect(iVaultOperator)
          .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
        await tx.wait();
        // ----------------

        // one withdraw
        tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // undelegate
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(2), emptyBytes);
        let receipt = await tx.wait();
        let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // second withdraw
        tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.eq(toWei(1));
        // ----------------

        // apply slash
        let totalStake = await symbioticVaults[0].vault.totalStake();
        await a.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

        let ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        expect(ratio).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // update ratio
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        // ----------------

        // undelegate
        let withdrawalEpoch = await withdrawalQueue.withdrawals(1);
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, withdrawalEpoch[1], emptyBytes);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker).redeem(staker.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker2).redeem(staker2.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(toWei(1.8), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------
      });

      it("2 withdraw & slash after undelegate", async function() {
        // deposit
        let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
        await tx.wait();

        tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
        await tx.wait();
        // ----------------

        // delegate
        tx = await iVault.connect(iVaultOperator)
          .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
        await tx.wait();
        // ----------------

        // one withdraw
        tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
        await tx.wait();
        // ----------------

        // undelegate
        let withdrawalEpoch = await withdrawalQueue.withdrawals(0);
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, withdrawalEpoch[1], emptyBytes);
        let receipt = await tx.wait();
        let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
        // ----------------

        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();
        // ----------------

        // second withdraw
        tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
        await tx.wait();
        // ----------------

        // undelegate
        withdrawalEpoch = await withdrawalQueue.withdrawals(1);
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, withdrawalEpoch[1], emptyBytes);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");
        // ----------------

        // apply slash
        let totalStake = await symbioticVaults[0].vault.totalStake();
        await a.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

        let ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        expect(ratio).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // update ratio
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        // ----------------

        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker).redeem(staker.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(toWei(2), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker2).redeem(staker2.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(toWei(1.8), transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1111111111111111111n, ratioErr);
        // ----------------
      });

      it("slash between withdraw", async function() {
        // deposit
        let tx = await iVault.connect(staker).deposit(toWei(5), staker.address);
        await tx.wait();

        tx = await iVault.connect(staker2).deposit(toWei(5), staker2.address);
        await tx.wait();
        // ----------------

        // delegate
        tx = await iVault.connect(iVaultOperator)
          .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(10), emptyBytes);
        await tx.wait();
        // ----------------

        // one withdraw
        tx = await iVault.connect(staker).withdraw(toWei(2), staker.address);
        await tx.wait();
        // ----------------

        await calculateRatio(iVault, iToken, withdrawalQueue);

        // apply slash
        let totalStake = await symbioticVaults[0].vault.totalStake();
        await a.applySymbioticSlash(symbioticVaults[0].vault, totalStake * 10n / 100n);

        let ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        expect(ratio).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------

        // update ratio
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        // ----------------

        // one withdraw
        tx = await iVault.connect(staker2).withdraw(toWei(2), staker2.address);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------

        // deposit
        tx = await iVault.connect(staker3).deposit(toWei(2), staker3.address);
        await tx.wait();
        // ----------------

        // delegate
        tx = await iVault.connect(iVaultOperator)
          .delegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, toWei(2), emptyBytes);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------

        // undelegate
        let withdrawalEpoch = await withdrawalQueue.withdrawals(0);
        tx = await iVault.connect(iVaultOperator)
          .undelegate(symbioticAdapter.address, symbioticVaults[0].vaultAddress, withdrawalEpoch[1], emptyBytes);
        let receipt = await tx.wait();
        let events = receipt.logs?.filter(e => e.eventName === "UndelegatedFrom");

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------


        // claim
        await skipEpoch(symbioticVaults[0]);

        params = abi.encode(
          ["address", "uint256"],
          [symbioticVaults[0].vaultAddress, (await symbioticVaults[0].vault.currentEpoch()) - 1n],
        );

        tx = await iVault.connect(iVaultOperator).claim(events[0].args["epoch"], symbioticAdapter.address, [params]);
        await tx.wait();

        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker).redeem(staker.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(1797344482370384621n, transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------

        // redeem
        tx = await iVault.connect(staker2).redeem(staker2.address);
        receipt = await tx.wait();
        events = receipt.logs?.filter(e => e.eventName === "Redeem");
        expect(events[0].args["amount"]).to.be.closeTo(1797344482370384621n, transactErr);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(1112752741401218766n, ratioErr);
        // ----------------
      });
    });

  });
});

