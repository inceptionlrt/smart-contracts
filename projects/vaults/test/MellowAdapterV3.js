import helpers from "@nomicfoundation/hardhat-network-helpers";
import hardhat from "hardhat";

const { ethers, upgrades, network } = hardhat;
import { expect } from "chai";
import { impersonateWithEth, calculateRatio, toWei, e18 } from "./helpers/utils.js";

BigInt.prototype.format = function() {
  return this.toLocaleString("de-DE");
};


const assets = [
  {
    vaultName: "InstEthVault",
    vaultFactory: "InVault_S_E2",
    assetName: "wETH",
    assetAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    iVaultOperator: "0xd87D15b80445EC4251e33dBe0668C335624e54b7",
    lidoWithdrawalQueue: "0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1",
    assetDonor: "0x57757E3D981446D585Af0D9Ae4d7DF6D64647806",
    wstETH: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    wstETHDonor: "0xd85351181b3F264ee0FDFa94518464d7c3DefaDa",
    ratioErr: 3n,
    transactErr: 5n,
    blockNumber: 22166925,
    impersonateStaker: async function(staker, iVault) {
      // add wETH
      const donor = await impersonateWithEth(this.assetDonor, toWei(1));
      const weth = await ethers.getContractAt("IERC20", this.assetAddress);
      const wethAmount = toWei(1000);
      await weth.connect(donor).transfer(staker.address, wethAmount);
      await weth.connect(staker).approve(await iVault.getAddress(), wethAmount);

      // add wstETH
      const donor1 = await impersonateWithEth(this.wstETHDonor, toWei(10));
      const wstAmount = toWei(100);
      const wstEth = await ethers.getContractAt("IERC20", this.wstETH);
      await wstEth.connect(donor1).transfer(staker.address, wstAmount);
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
    vaultAddress: "0xb11C95eeB53FF748B6Dd4e2F9f4294F8F4030aF0",
    wrapperAddress: "0xfd4a4922d1afe70000ce0ec6806454e78256504e",
    bondStrategyAddress: "0xA0ea6d4fe369104eD4cc18951B95C3a43573C0F6",
    curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
    configuratorAddress: "0x84b240E99d4C473b5E3dF1256300E2871412dDfe",
  },
  {
    name: "Mev Capital",
    vaultAddress: "0xcAfC35fB68DFCD6AF2BC264E687c6c0279284068",
    wrapperAddress: "0xfd4a4922d1afe70000ce0ec6806454e78256504e",
    bondStrategyAddress: "0xc3A149b5Ca3f4A5F17F5d865c14AA9DBb570F10A",
    curatorAddress: "0xA1E38210B06A05882a7e7Bfe167Cd67F07FA234A",
    configuratorAddress: "0x2dEc4fDC225C1f71161Ea481E23D66fEaAAE2391",
  },
  // {
  //   name: "Re7",
  //   vaultAddress: "0x84631c0d0081FDe56DeB72F6DE77abBbF6A9f93a",
  //   wrapperAddress: "0x70cD3464A41B6692413a1Ba563b9D53955D5DE0d",
  //   bondStrategyAddress: "0xcE3A8820265AD186E8C1CeAED16ae97176D020bA",
  //   curatorAddress: "0xE86399fE6d7007FdEcb08A2ee1434Ee677a04433",
  //   configuratorAddress: "0x214d66d110060dA2848038CA0F7573486363cAe4",
  // },
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

  console.log("- Mellow Adapter");
  const mellowAdapterFactory = await ethers.getContractFactory("IMellowAdapterV3");
  let mellowAdapterV3 = await upgrades.deployProxy(mellowAdapterFactory, [
    [mellowVaults[0].vaultAddress],
    a.assetAddress,
    a.iVaultOperator,
  ]);
  mellowAdapterV3.address = await mellowAdapterV3.getAddress();

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
  const iVault = await upgrades.deployProxy(iVaultFactory, [
      a.vaultName, a.iVaultOperator, a.assetAddress, iToken.address,
    ], {
      unsafeAllowLinkedLibraries: true,
    },
  );
  iVault.address = await iVault.getAddress();

  console.log("- Withdrawal Queue");
  const withdrawalQueueFactory = await ethers.getContractFactory("WithdrawalQueue");
  let withdrawalQueue = await upgrades.deployProxy(withdrawalQueueFactory, [iVault.address, [], [], 0]);
  withdrawalQueue.address = await withdrawalQueue.getAddress();

  await iVault.addAdapter(mellowAdapterV3.address);
  await iVault.setRatioFeed(ratioFeed.address);
  await iVault.setWithdrawalQueue(withdrawalQueue.address);
  await mellowAdapterV3.setInceptionVault(iVault.address);
  await mellowAdapterV3.setEthWrapper("0xfd4a4922d1afe70000ce0ec6806454e78256504e");
  await mellowAdapterV3.setLidoWithdrawalQueue(a.lidoWithdrawalQueue);
  await iToken.setVault(iVault.address);

  MAX_TARGET_PERCENT = await iVault.MAX_TARGET_PERCENT();
  console.log("... iVault initialization completed ....");

  return [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapterV3, iLibrary, withdrawalQueue];
};

assets.forEach(function(a) {
  describe(`Inception Vault ${a.assetName}`, function() {
    this.timeout(150000);
    let iToken, iVault, ratioFeed, asset, mellowAdapterV3, iLibrary, withdrawalQueue;
    let iVaultOperator, deployer, staker, staker2, staker3, treasury;
    let ratioErr, transactErr;
    let snapshot;
    let params;

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

      [iToken, iVault, ratioFeed, asset, iVaultOperator, mellowAdapterV3, iLibrary, withdrawalQueue] =
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

    describe("Base flow no flash", function() {
      before(async function() {
        await snapshot.restore();
        await iVault.setTargetFlashCapacity(1n);
      });

      let totalDeposited, delegatedMellow, undelegatedEpoch;
      let rewardsMellow = 0n;

      it("Initial stats", async function() {
        expect(await iVault.ratio()).to.be.eq(e18);
        expect(await iVault.totalAssets()).to.be.eq(0n);
        expect(await iVault.getTotalDeposited()).to.be.eq(0n);
        expect(await iVault.getTotalDelegated()).to.be.eq(0n);
        expect(await iVault.getFlashCapacity()).to.be.eq(0n);
        expect(await iVault.getFreeBalance()).to.be.eq(0n);
      });

      it("User can deposit to iVault", async function() {
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
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, 1n);
      });


      it("Delegate to mellowVault#1", async function() {
        const amount = (await iVault.getFreeBalance()) / 3n;
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress, amount, emptyBytes);
        delegatedMellow = amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowAdapterV3.address);
        const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowAdapterV3.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress);
        const delegatedTo2 = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress);
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
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
      });

      it("Add new mellowVault", async function() {
        await expect(mellowAdapterV3.addMellowVault(mellowVaults[1].vaultAddress))
          .to.emit(mellowAdapterV3, "VaultAdded")
          .withArgs(mellowVaults[1].vaultAddress);
      });

      it("Delegate all to mellowVault#2", async function() {
        const amount = await iVault.getFreeBalance();
        expect(amount).to.be.gt(0n);
        const totalAssetsBefore = await iVault.totalAssets();

        await iVault
          .connect(iVaultOperator)
          .delegate(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress, amount, emptyBytes);
        delegatedMellow += amount;

        const mellowBalance = await mellowVaults[0].vault.balanceOf(mellowAdapterV3.address);
        const mellowBalance2 = await mellowVaults[1].vault.balanceOf(mellowAdapterV3.address);
        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const delegatedTo2 = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();

        console.log("Mellow LP token balance: ", mellowBalance.format());
        console.log("Mellow LP token balance2: ", mellowBalance2.format());
        console.log("Amount delegated: ", delegatedMellow.format());

        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount, transactErr);
        expect(totalDelegatedAfter).to.be.closeTo(delegatedMellow, transactErr * 2n);
        expect(delegatedTo2).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDeposited, transactErr * 2n);
        expect(mellowBalance2).to.be.gte(amount / 2n);
        expect(await calculateRatio(iVault, iToken, withdrawalQueue)).to.be.closeTo(e18, ratioErr);
      });


      it("Update ratio", async function() {
        const ratio = await calculateRatio(iVault, iToken, withdrawalQueue);
        console.log(`Calculated ratio:\t\t\t${ratio.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratio]);
        console.log(`iVault ratio:\t\t\t\t${(await iVault.ratio()).format()}`);
        expect(await iVault.ratio()).eq(ratio);
      });

      it("Add rewards to Mellow protocol and estimate ratio", async function() {
        const ratioBefore = await calculateRatio(iVault, iToken, withdrawalQueue);
        const totalDelegatedToBefore = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress);
        const totalDelegatedBefore = await iVault.getTotalDelegated();
        console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);
        console.log(`Delegated to before:\t${totalDelegatedToBefore.format()}`);

        const wstETHAsset = await ethers.getContractAt("IERC20", a.wstETH);
        await wstETHAsset.connect(staker3).transfer(mellowVaults[0].vaultAddress, e18);

        const ratioAfter = await calculateRatio(iVault, iToken, withdrawalQueue);
        const totalDelegatedToAfter = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress);
        const totalDelegatedAfter = await iVault.getTotalDelegated();

        rewardsMellow += totalDelegatedToAfter - totalDelegatedToBefore;

        console.log(`Ratio after:\t\t\t${ratioAfter.format()}`);
        console.log(`Delegated to after:\t\t${totalDelegatedToAfter.format()}`);
        console.log(`mellow rewards:\t\t\t${rewardsMellow.format()}`);
        await ratioFeed.updateRatioBatch([iToken.address], [ratioAfter]);
        expect(totalDelegatedAfter - totalDelegatedBefore).to.be.eq(totalDelegatedToAfter - totalDelegatedToBefore);
      });


      it("Estimate the amount that user can withdraw", async function() {
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        expect(assetValue).closeTo(totalDeposited + rewardsMellow, transactErr * 10n);
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
        const epochShares = await withdrawalQueue.getRequestedShares(await withdrawalQueue.currentEpoch());
        expect(stakerPW).to.be.eq(0n);
        expect(staker2PW).to.be.closeTo(assetValue, transactErr);
        expect(epochShares).to.be.closeTo(shares, transactErr);
      });

      let undelegateClaimer1;
      let undelegateClaimer2;

      it("Undelegate from Mellow", async function() {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const totalDelegatedBefore = await iVault.getTotalDelegated();

        console.log(`Total deposited before:\t\t\t${totalDepositedBefore.format()}`);
        console.log(`Total delegated before:\t\t\t${totalDelegatedBefore.format()}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log("Mellow1 delegated", await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress));
        console.log("Mellow2 delegated", await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress));

        const assets1 = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress);
        const assets2 = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress);

        undelegatedEpoch = await withdrawalQueue.currentEpoch();
        const tx = await iVault
          .connect(iVaultOperator)
          .undelegate(
            [await mellowAdapterV3.getAddress(), await mellowAdapterV3.getAddress()],
            [mellowVaults[0].vaultAddress, mellowVaults[1].vaultAddress],
            [assets1, assets2],
            [emptyBytes, emptyBytes],
          );

        const receipt = await tx.wait();
        const events = receipt.logs?.filter(log => log.address === mellowAdapterV3.address)
          .map(log => mellowAdapterV3.interface.parseLog(log));
        expect(events.length).to.be.eq(2);
        undelegateClaimer1 = events[0].args["claimer"];
        undelegateClaimer2 = events[1].args["claimer"];

        console.log("Mellow1 delegated", await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress));
        console.log("Mellow2 delegated", await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress));

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDelegatedAfter = await iVault.getTotalDelegated();
        const totalDelegatedTo = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[0].vaultAddress);
        const totalDelegatedTo2 = await iVault.getDelegatedTo(await mellowAdapterV3.getAddress(), mellowVaults[1].vaultAddress);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);
        console.log(`Total delegated after:\t\t${totalDelegatedAfter.format()}`);
        console.log(`Total deposited after:\t\t${totalDepositedAfter.format()}`);

        expect(totalDelegatedAfter).to.be.closeTo(0n, transactErr);
        expect(totalDelegatedTo).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        expect(totalDelegatedTo2).to.be.closeTo(0n, transactErr); //Everything was requested for withdrawal from Mellow
        // expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr * 2n); //Total deposited amount did not change
      });

      it("Claim Mellow wstETH to adapter", async function() {
        await helpers.time.increase(1209900);

        const params1 = abi.encode(["address", "address"], [mellowVaults[0].vaultAddress, undelegateClaimer1]);
        const params2 = abi.encode(["address", "address"], [mellowVaults[1].vaultAddress, undelegateClaimer2]);

        await mellowAdapterV3.connect(iVaultOperator).claimFromMellow([params1], false);
        await mellowAdapterV3.connect(iVaultOperator).claimFromMellow([params2], false);
      });

      it("Claim from Lido", async function() {
        await helpers.time.increase(1209900);

        const pendingWithdrawalsMellowBefore = await iVault.getPendingWithdrawals(await mellowAdapterV3.getAddress());
        const totalAssetsBefore = await iVault.totalAssets();
        const withdrawalEpochBefore = await withdrawalQueue.withdrawals(undelegatedEpoch);

        const params1 = abi.encode(["address"], [undelegateClaimer1]);
        const params2 = abi.encode(["address"], [undelegateClaimer2]);

        await mellowAdapterV3.connect(iVaultOperator).claim([params1], false);
        await mellowAdapterV3.connect(iVaultOperator).claim([params2], false);

        const withdrawalEpochAfter = await withdrawalQueue.withdrawals(1);
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets before:\t\t\t${totalAssetsBefore.format()}`);
        console.log(`Total assets after:\t\t\t${totalAssetsAfter.format()}`);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);
        expect(withdrawalEpochAfter[2] - withdrawalEpochBefore[2]).to.be.closeTo(pendingWithdrawalsMellowBefore, transactErr);

        const wqueue = await ethers.getContractAt("ILidoWithdrawalQueue", "0x889edc2edab5f40e902b864ad4d7ade8e412f9b1");
        console.log(await wqueue.finalize(0, 0));
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

      /*
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

      */
    });
  });
});
