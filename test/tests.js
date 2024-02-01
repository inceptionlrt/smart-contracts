const helpers = require("@nomicfoundation/hardhat-network-helpers");
const { ethers, upgrades, network } = require("hardhat");
const config = require("../hardhat.config");
const { expect } = require("chai");
const {
  addRewardsToStrategy,
  withdrawDataFromTx,
  impersonateWithEth,
  getRandomStaker,
  mineBlocks,
  toWei,
  randomBI,
  randomAddress,
  format,
  e18,
} = require("./helpers/utils.js");

/**
 * To run the tests for the specific assets, list their names in the env ASSETS like so:
 * Windows: export ASSETS=athc,wbeth && npx hardhat test
 * macOS: ASSETS=athc,wbeth npx hardhat test
 */

assets = [
  {
    assetName: "sfrxEth",
    assetAddress: "0xac3e018457b222d93114458476f3e3416abbe38f",
    assetPoolName: "MockPool",
    assetPoolAddress: "x_x_x",
    vaultName: "InsfrxEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x8CA7A5d6f3acd3A7A8bC468a8CD0FB14B6BD28b6",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 18943377,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x46782D268FAD71DaC3383Ccf2dfc44C861fb4c7D", toWei(1));
      console.log(`balance: ${await asset.balanceOf(donor.address)}`);
      await asset.connect(donor).transfer(staker.address, toWei(100));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      console.log(`allowance: ${await asset.allowance(staker.address, await iVault.getAddress())}`);
      return staker;
    },
  },
  {
    assetName: "mEth",
    assetAddress: "0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa",
    assetPoolName: "MockPool",
    assetPoolAddress: "x_x_x",
    vaultName: "InmEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x298aFB19A105D59E74658C4C334Ff360BadE6dd2",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 18943377,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0xf89d7b9c864f589bbF53a82105107622B35EaA40", toWei(1));
      console.log(`balance: ${await asset.balanceOf(donor.address)}`);
      await asset.connect(donor).transfer(staker.address, toWei(100));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      console.log(`allowance: ${await asset.allowance(staker.address, await iVault.getAddress())}`);
      return staker;
    },
  },
  {
    assetName: "lsEth",
    assetAddress: "0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549",
    assetPoolName: "MockPool",
    assetPoolAddress: "x_x_x",
    vaultName: "InmEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0xAe60d8180437b5C34bB956822ac2710972584473",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 18943377,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x7286fCB1f0B9652063325f9d9Dc6fef092D6E711", toWei(1));
      console.log(`balance: ${await asset.balanceOf(donor.address)}`);
      await asset.connect(donor).transfer(staker.address, toWei(100));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      console.log(`allowance: ${await asset.allowance(staker.address, await iVault.getAddress())}`);
      return staker;
    },
  },
  {
    assetName: "Ethx",
    assetAddress: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
    assetPoolName: "MockPool",
    assetPoolAddress: "x_x_x",
    vaultName: "InEthxVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x9d7eD45EE2E8FC5482fa2428f15C971e6369011d",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 18922369,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x1a0EBB8B15c61879a8e8DA7817Bb94374A7c4007", toWei(1));
      console.log(`balance: ${await asset.balanceOf(donor.address)}`);
      await asset.connect(donor).transfer(staker.address, toWei(100));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      console.log(`allowance: ${await asset.allowance(staker.address, await iVault.getAddress())}`);
      return staker;
    },
  },
  {
    assetName: "SwEth",
    assetAddress: "0xf951e335afb289353dc249e82926178eac7ded78",
    assetPoolName: "MockPool",
    assetPoolAddress: "x_x_x",
    vaultName: "InswEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x0fe4f44bee93503346a3ac9ee5a26b130a5796d6",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 18911486,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0x1D812A7E929D4dBe237926ED8e7c31434b9Ab469", toWei(1));
      await asset.connect(donor).transfer(staker.address, toWei(100));
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
  {
    assetName: "OEth",
    assetAddress: "0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3",
    assetPoolName: "VaultCore",
    assetPoolAddress: "0x39254033945AA2E4809Cc2977E7087BEE48bd7Ab",
    vaultName: "InoEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0xa4c637e0f704745d182e4d38cab7e7485321d059",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const stETHAddress = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";
      console.log(`- stETH`);
      const stEth = await ethers.getContractAt("stETH", stETHAddress);
      console.log(`- LidoMockPool`);
      const stEthPool = await ethers.getContractAt("LidoMockPool", stETHAddress);

      await stEthPool.connect(staker).submit(ethers.ZeroAddress, { value: toWei(20) });
      const balanceOfStEth = await stEth.balanceOf(staker.address);
      await stEth.connect(staker).approve(await assetPool.getAddress(), balanceOfStEth);

      await assetPool.connect(staker).mint(stETHAddress, balanceOfStEth, balanceOfStEth - e18);
      const balanceAfter = await asset.balanceOf(staker.address);
      console.log(`balanceAfter: ${balanceAfter}`);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);

      return staker;
    },
  },
  {
    assetName: "WBEth",
    assetAddress: "0xa2e3356610840701bdf5611a53974510ae27e2e1",
    assetPoolName: "WBEth",
    assetPoolAddress: "0xa2e3356610840701bdf5611a53974510ae27e2e1",
    vaultName: "InwbEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x7CA911E83dabf90C90dD3De5411a10F1A6112184",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      await assetPool.connect(staker).deposit(ethers.ZeroAddress, { value: toWei(20) });
      const balanceAfter = await asset.balanceOf(staker.address);
      console.log(`balanceAfter: ${balanceAfter}`);

      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);

      return staker;
    },
  },
  {
    assetName: "stETH",
    assetAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    assetPoolName: "LidoMockPool",
    assetPoolAddress: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    vaultName: "InstEthVault",
    vaultFactory: "InVault_E2",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x93c4b944D05dfe6df7645A86cd2206016c51564D",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    blockNumber: 17453047,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      await assetPool.connect(staker).submit("0x0000000000000000000000000000000000000000", { value: toWei(20) });
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
  {
    assetName: "OsEth",
    assetAddress: "0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38",
    assetPoolName: "StakeWiseVault",
    assetPoolAddress: "0x64f2907F92631619ED7Ea510982835F9e1024767",
    vaultName: "InosEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x57ba429517c3473b6d34ca9acd56c0e735b94c02",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      await assetPool.connect(staker).deposit(staker.address, ethers.ZeroAddress, { value: toWei(20) });
      await assetPool.connect(staker).mintOsToken(staker.address, toWei(15), ethers.ZeroAddress);
      const balanceAfter = await asset.balanceOf(staker.address);
      console.log(`balanceAfter: ${balanceAfter}`);

      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);

      return staker;
    },
  },
  {
    assetName: "AETHC",
    assetAddress: "0xe95a203b1a91a908f9b9ce46459d101078c2c3cb",
    assetPoolName: "AnkrStakingPool",
    assetPoolAddress: "0x84db6ee82b7cf3b47e8f19270abde5718b936670",
    vaultName: "InankrEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x13760f50a9d7377e4f20cb8cf9e4c26586c658ff",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 1,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      await assetPool.connect(staker).stakeAndClaimAethC({ value: toWei(20) });
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
  {
    assetName: "rETH",
    assetAddress: "0xae78736cd615f374d3085123a210448e74fc6393",
    assetPoolName: "RocketMockPool",
    assetPoolAddress: "0xDD3f50F8A6CafbE9b31a427582963f465E745AF8",
    vaultName: "InrEthVault",
    vaultFactory: "InVault_E2",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x1bee69b7dfffa4e2d53c2a2df135c388ad25dcd2",
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    withdrawalDelayBlocks: 50400,
    ratioErr: 2,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      await assetPool.connect(staker).deposit({ value: toWei(20) });
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter.toString());
      return staker;
    },
  },
  {
    assetName: "CbEth",
    assetAddress: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704",
    assetPoolName: "MockPool",
    assetPoolAddress: "0x64f2907F92631619ED7Ea510982835F9e1024767",
    vaultName: "IncbEthVault",
    vaultFactory: "InVault_E1",
    strategyManagerAddress: "0x858646372CC42E1A627fcE94aa7A7033e7CF075A",
    assetStrategyAddress: "0x54945180db7943c0ed0fee7edab2bd24620256bc",
    withdrawalDelayBlocks: 50400,
    operatorAddress: "0xa4341b5Cf43afD2993e1ae47d956F44A2d6Fc08D",
    ratioErr: 2,
    transactErr: 2,
    impersonateStaker: async (staker, iVault, asset, assetPool) => {
      const donor = await impersonateWithEth("0xED1F7bb04D2BA2b6EbE087026F03C96Ea2c357A8", toWei(1));
      await asset.connect(donor).transfer(staker.address, 1000_000_000_000_000_000_000n);
      const balanceAfter = await asset.balanceOf(staker.address);
      await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
      return staker;
    },
  },
];
const initVault = async (a) => {
  const block = await ethers.provider.getBlock("latest");
  console.log(`Starting block number: ${block.number}`);
  console.log(`... Initialization of Inception ....`);

  console.log("- Asset");
  const asset = await ethers.getContractAt(a.assetName, a.assetAddress);
  console.log("- Asset pool");
  const assetPool = await ethers.getContractAt(a.assetPoolName, a.assetPoolAddress);
  console.log("- Strategy");
  const strategy = await ethers.getContractAt("IStrategy", a.assetStrategyAddress);

  // 1. Inception token
  console.log("- iToken");
  const iTokenFactory = await ethers.getContractFactory("InceptionToken");
  const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
  // 2. Impersonate operator
  const operator = await impersonateWithEth(a.operatorAddress, e18);
  // 3. Inception vault
  console.log("- iVault");
  const iVaultFactory = await ethers.getContractFactory(a.vaultFactory);
  const iVault = await upgrades.deployProxy(iVaultFactory, [
    a.vaultName,
    a.operatorAddress,
    a.strategyManagerAddress,
    await iToken.getAddress(),
    a.assetStrategyAddress,
  ]);
  await iToken.setVault(await iVault.getAddress());
  console.log(`... iVault initialization completed ....`);

  iVault.withdrawFromELAndClaim = async function () {
    const tx = await iVault.connect(operator).withdrawFromEL();
    const data = await withdrawDataFromTx(tx, this);
    await mineBlocks(a.withdrawalDelayBlocks);
    await iVault.claimCompletedWithdrawals(data[0], data[1]);
  };

  return [iToken, iVault, asset, assetPool, strategy, operator];
};

assets.forEach(function (a) {
  describe(`Inception ${a.assetName}`, function () {
    let iToken, iVault, asset, assetPool, strategy, operator, deployer, staker, staker2, staker3, snapshotter, ratioErr, transactErr;
    this.timeout(150000);

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

      [iToken, iVault, asset, assetPool, strategy, operator] = await initVault(a);
      ratioErr = a.ratioErr;
      transactErr = a.transactErr;

      [deployer, staker, staker2, staker3] = await ethers.getSigners();
      staker = await a.impersonateStaker(staker, iVault, asset, assetPool);
      staker2 = await a.impersonateStaker(staker2, iVault, asset, assetPool);
      staker3 = await a.impersonateStaker(staker3, iVault, asset, assetPool);
      snapshotter = await helpers.takeSnapshot();
    });

    describe("Base flow", function () {
      before(async function () {
        await snapshotter.restore();
      });

      it("Initial ratio is 1e18", async function () {
        const ratio = await iVault.ratio();
        console.log(`Current ratio is: ${ratio.toString()}`);
        expect(ratio).to.be.eq(e18);
      });

      it("Deposit to Vault", async function () {
        const amount = 9_292_557_565_124_725_653n;
        const expectedShares = (amount * e18) / (await iVault.ratio());
        const tx = await iVault.connect(staker).deposit(amount, staker.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => {
          return e.eventName === "Deposit";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, transactErr);

        expect(await iToken.balanceOf(staker.address)).to.be.closeTo(expectedShares, transactErr);
        expect(await iVault.totalAssets()).to.be.closeTo(amount, transactErr);
        expect(await iVault.getTotalDeposited()).to.be.closeTo(amount, transactErr);
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("DepositExtra to EigenLayer", async function () {
        const amount = await iVault.totalAssets();
        const depositedToELBefore = await strategy.userUnderlyingView(await iVault.getAddress());
        await iVault.connect(operator).depositExtra();
        const depositedToELAfter = await strategy.userUnderlyingView(await iVault.getAddress());
        expect(depositedToELAfter - depositedToELBefore).to.be.closeTo(amount, transactErr);
      });

      it("Update strategy ratio - add rewards", async function () {
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);
        console.log(`New ratio is: ${format(await iVault.ratio())}`);
        expect(await iVault.ratio()).lt(e18);
      });

      it("Withdraw all", async function () {
        const shares = await iToken.balanceOf(staker.address);
        const assetValue = await iVault.convertToAssets(shares);
        console.log(`shares:\t\t\t\t\t${format(shares)}`);
        console.log(`asset value:\t\t\t${format(assetValue)}`);
        const tx = await iVault.connect(staker).withdraw(shares, staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => {
          return e.eventName === "Withdraw";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(staker.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["owner"]).to.be.eq(staker.address);
        expect(events[0].args["amount"]).to.be.eq(assetValue);
        expect(events[0].args["iShares"]).to.be.eq(shares);

        const stakerPW = await iVault.getPendingWithdrawalOf(staker.address);
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const totalPW = await iVault.totalAmountToWithdraw();
        expect(stakerPW[0]).to.be.eq(0);
        expect(staker2PW[0]).to.be.closeTo(assetValue, transactErr);
        expect(totalPW).to.be.closeTo(assetValue, transactErr);
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Withdraw from EigenLayer and claim", async function () {
        const totalAssetsBefore = await iVault.totalAssets();
        const totalDepositedBefore = await iVault.getTotalDeposited();
        const depositedToELBefore = await strategy.userUnderlyingView(await iVault.getAddress());
        const staker2PW = await iVault.getPendingWithdrawalOf(staker2.address);
        const amount = await iVault.totalAmountToWithdraw();
        console.log(`Total deposited after:\t${format(totalDepositedBefore)}`);
        console.log(`Total assets before:\t\t\t${totalAssetsBefore}`);
        console.log(`Staker2 pending withdrawals:\t${format(staker2PW[0])}`);

        await iVault.withdrawFromELAndClaim();

        const totalAssetsAfter = await iVault.totalAssets();
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const depositedToELAfter = await strategy.userUnderlyingView(await iVault.getAddress());

        console.log(`Available withdrawals:\t${await iVault.isAbleToRedeem(staker2.address)}`);
        console.log(`Total deposited after:\t${format(totalDepositedAfter)}`);
        console.log(`Total assets after:\t\t${format(totalAssetsAfter)}`);

        expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr);
        expect(depositedToELBefore - depositedToELAfter).to.be.closeTo(amount, transactErr);
        expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
        expect(await iVault.isAbleToRedeem(staker2.address)).to.be.true;
        expect(await iVault.ratio()).to.be.eq(e18);
      });

      it("Redeem withdraw", async function () {
        const balanceBefore = await asset.balanceOf(staker2.address);
        const staker2PWBefore = await iVault.getPendingWithdrawalOf(staker2.address);

        const tx = await iVault.connect(operator).redeem(staker2.address);
        const receipt = await tx.wait();
        const events = receipt.logs?.filter((e) => {
          return e.eventName === "Redeem";
        });
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(operator.address);
        expect(events[0].args["receiver"]).to.be.eq(staker2.address);
        expect(events[0].args["amount"]).to.be.eq(staker2PWBefore[0]);

        const staker2PWAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const balanceAfter = await asset.balanceOf(staker2.address);
        const totalDepositedAfter = await iVault.getTotalDeposited();
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Total assets after:\t\t\t${format(totalAssetsAfter)}`);
        console.log(`Total deposited after:\t\t${format(totalDepositedAfter)}`);
        console.log(`Pending withdrawals after:\t${format(staker2PWAfter[0])}`);
        console.log(`Ratio after:\t${(await iVault.ratio()).toString()}`);

        expect(staker2PWAfter[0]).to.be.eq(0);
        expect(balanceAfter - balanceBefore).to.be.closeTo(staker2PWBefore[0], transactErr);
        expect(totalDepositedAfter).to.be.closeTo(0, transactErr * 4);
        expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
      });
    });

    describe("iToken management", function () {
      beforeEach(async function () {
        await snapshotter.restore();
      });

      it("Reverts: when not an owner mints", async function() {
        await expect(iToken.connect(staker).mint(staker.address, toWei(1)))
          .to.be.revertedWith("InceptionToken: only vault allowed");
      });

      it("Reverts: when not an owner burns", async function () {
        const amount = toWei(1);
        await iVault.connect(staker).deposit(amount, staker.address);
        await expect(iToken.connect(staker).burn(staker.address, toWei(1) / 2n))
          .to.be.revertedWith("InceptionToken: only vault allowed");
      });

      it("setVault(): only owner can", async function () {
        await expect(iToken.setVault(staker2.address))
          .to.emit(iToken, "VaultChanged")
          .withArgs(await iVault.getAddress(), staker2.address);
        expect(await iToken.vault()).to.be.eq(staker2.address);
      });

      it("setVault(): another address can not", async function () {
        await expect(iToken.connect(staker).setVault(staker2.address))
          .to.be.revertedWith("Ownable: caller is not the owner");
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
        await expect(iVault.connect(staker).deposit(toWei(1), staker.address))
          .to.be.revertedWith("InceptionToken: token transfer while paused");
      });

      it("Reverts: deposit to iVault when iToken is paused", async function () {
        await iToken.pause();
        await expect(iVault.connect(staker).deposit(toWei(1), staker.address)).to.be.revertedWith(
          "InceptionToken: token transfer while paused"
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

    describe("iVault setters", function () {
      beforeEach(async function () {
        await snapshotter.restore();
      });

      it("setOperator(): only owner can", async function () {
        await expect(iVault.setOperator(staker2.address))
            .to.emit(iVault, "OperatorChanged").withArgs(operator.address, staker2.address);
        const amount = toWei(2);
        await iVault.connect(staker).deposit(amount, staker.address);
        await expect(iVault.connect(staker2).updateEpoch(4n)).to.be.fulfilled;
      });

      it("setOperator(): reverts when set to zero address", async function () {
        await expect(iVault.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(iVault, "NullParams");
      });

      it("setOperator(): another address can not", async function () {
        await expect(iVault.connect(staker).setOperator(staker2.address))
            .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("setMinAmount(): only owner can", async function () {
        const prevValue = await iVault.minAmount();
        const newValue = randomBI(3);
        await expect(iVault.setMinAmount(newValue)).to.emit(iVault, "MinAmountChanged").withArgs(prevValue, newValue);
        expect(await iVault.minAmount()).to.be.eq(newValue);
      });

      it("setMinAmount(): another address can not", async function () {
        await expect(iVault.connect(staker).setMinAmount(randomBI(3)))
            .to.be.revertedWith("Ownable: caller is not the owner");
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

      it("updateEpoch(): only operator can", async function () {
        const currentEpoch = await iVault.epoch();
        const newEpoch = currentEpoch + 1n;
        await iVault.connect(operator).updateEpoch(newEpoch);
        expect(await iVault.epoch()).to.be.eq(newEpoch);
      });

      it("updateEpoch(): reverts when is not greater than current", async function () {
        const currentEpoch = await iVault.epoch();
        await expect(iVault.connect(operator).updateEpoch(currentEpoch))
            .to.be.revertedWithCustomError(iVault, "WrongEpoch");
      });

      it("updateEpoch(): another address can not", async function () {
        const currentEpoch = await iVault.epoch();
        const newEpoch = currentEpoch + 1n;
        await expect(iVault.connect(staker).updateEpoch(newEpoch))
            .to.be.revertedWith("EigenLayerHandler: only operator allowed");
      });

      it("pause(): only owner can", async function () {
        expect(await iVault.paused()).is.false;
        await iVault.pause();
        expect(await iVault.paused()).is.true;
      });

      it("pause(): another address can not", async function () {
        await expect(iVault.connect(staker).pause()).to.be.revertedWith("Ownable: caller is not the owner");
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
    });

    describe("Deposit: user can restake asset", function () {
      let ratio;

      before(async function () {
        await snapshotter.restore();
        try {
          await iVault.connect(staker3).deposit(e18, staker3);
          await iVault.connect(operator).depositExtra();
          await addRewardsToStrategy(a.assetStrategyAddress, e18, staker3);
        } catch (e) {
          console.warn("Deposit to strategy failed");
        }
        ratio = await iVault.ratio();
        console.log(`Initial ratio is: ${format(ratio)}`);
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
          const events = receipt.logs?.filter((e) => {
            return e.eventName === "Deposit";
          });
          expect(events.length).to.be.eq(1);
          expect(events[0].args["sender"]).to.be.eq(staker.address);
          expect(events[0].args["receiver"]).to.be.eq(receiver);
          expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
          expect(events[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);

          const balanceAfter = await iToken.balanceOf(receiver);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalAssetsAfter = await iVault.totalAssets();

          expect(balanceAfter - balanceBefore).to.be.closeTo(expectedShares, transactErr);
          expect(balanceAfter - balanceBefore).to.be.closeTo(convertedShares, transactErr);

          expect(totalDepositedAfter - totalDepositedBefore).to.be.closeTo(amount, transactErr);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.closeTo(amount, transactErr); //Everything stays on iVault after deposit
          expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr); //Ratio stays the same
        });

        it(`Deposit with Referral code amount ${arg.amount}`, async function () {
          const receiver = arg.receiver();
          const balanceBefore = await iToken.balanceOf(receiver);
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const totalAssetsBefore = await iVault.totalAssets();
          const amount = await arg.amount();
          const convertedShares = await iVault.convertToShares(amount);
          const expectedShares = (amount * (await iVault.ratio())) / e18;
          const code = ethers.encodeBytes32String(randomAddress().slice(0, 8));
          const tx = await iVault.connect(staker2).depositWithReferral(amount, receiver, code);
          const receipt = await tx.wait();
          let events = receipt.logs?.filter((e) => {
            return e.eventName === "Deposit";
          });
          expect(events.length).to.be.eq(1);
          expect(events[0].args["sender"]).to.be.eq(staker2.address);
          expect(events[0].args["receiver"]).to.be.eq(receiver);
          expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);
          expect(events[0].args["iShares"] - expectedShares).to.be.closeTo(0, transactErr);
          //Code event
          events = receipt.logs?.filter((e) => {
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

        it("Deposit extra", async function () {
          const totalDepositedBefore = await iVault.getTotalDeposited();
          const depositedToELBefore = await strategy.userUnderlyingView(await iVault.getAddress());
          console.log(`Total deposited before: ${totalDepositedBefore}`);

          const amount = await iVault.totalAssets();
          const tx = await iVault.connect(operator).depositExtra();
          const receipt = await tx.wait();
          const events = receipt.logs?.filter((e) => {
            return e.eventName === "DepositedToEL";
          });
          expect(events.length).to.be.eq(1);
          expect(events[0].args["amount"]).to.be.closeTo(amount, transactErr);

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const depositedToELAfter = await strategy.userUnderlyingView(await iVault.getAddress());
          const totalAssetsAfter = await iVault.totalAssets();

          expect(depositedToELAfter - depositedToELBefore).to.be.closeTo(amount, transactErr);
          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, transactErr);
          expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
        });
      });

      const depositInvalidArgs = [
        {
          name: "amount is 0",
          amount: async () => 0n,
          receiver: () => staker.address,
          isCustom: false,
          error: "InceptionVault: deposited less than min amount",
        },
        {
          name: "amount < min",
          amount: async () => (await iVault.minAmount()) - 1n,
          receiver: () => staker.address,
          isCustom: false,
          error: "InceptionVault: deposited less than min amount",
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
            await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWithCustomError(iVault, arg.error);
          } else {
            await expect(iVault.connect(staker).deposit(amount, receiver)).to.be.revertedWith(arg.error);
          }
        });
      });

      it("Reverts: deposit when iVault is paused", async function () {
        await iVault.pause();
        const depositAmount = randomBI(19);
        await expect(iVault.connect(staker).deposit(depositAmount, staker.address)).to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
      });

      it("Reverts: depositWithReferral when iVault is paused", async function () {
        await iVault.pause();
        const depositAmount = randomBI(19);
        const code = ethers.encodeBytes32String(randomAddress().slice(0, 8));
        await expect(iVault.connect(staker).depositWithReferral(depositAmount, staker, code))
            .to.be.revertedWith("Pausable: paused");
        await iVault.unpause();
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

    describe("DepositExtra: deposits from iVault to EigenLayer", function () {
      let ratio, firstDeposit;

      beforeEach(async function () {
        await snapshotter.restore();
        await iVault.connect(staker3).deposit(e18, staker3.address);
        firstDeposit = await iVault.totalAssets();
        await iVault.connect(operator).depositExtra();
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker3);
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${ratio}`);
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
        it(`Deposit and depositExtra ${arg.name} many times`, async function () {
          let totalDeposited = 0n;
          const count = 10;
          for (let i = 0; i < count; i++) {
            const deposited = await arg.depositAmount();
            await iVault.connect(staker).deposit(deposited, staker.address);
            await iVault.connect(operator).depositExtra();
            totalDeposited = totalDeposited + deposited;
          }
          console.log(`Final ratio:\t${await iVault.ratio()}`);
          console.log(`Total deposited:\t${format(totalDeposited)}`);

          const balanceExpected = (totalDeposited * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = count * transactErr * 2;

          const balanceAfter = await iToken.balanceOf(staker.address);
          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalSupplyAfter = await iToken.totalSupply();
          const totalAssetsAfter = await iVault.totalAssets();
          console.log(`Staker balance after: ${format(balanceAfter)}`);
          console.log(`Total deposited after: ${format(totalDepositedAfter)}`);
          console.log(`Total assets after: ${format(totalAssetsAfter)}`);

          expect(balanceAfter - balanceExpected).to.be.closeTo(0, err);
          expect(totalDepositedAfter - ((firstDeposit * e18) / ratio + totalDeposited)).to.be.closeTo(0, err);
          expect(totalSupplyAfter - totalSupplyExpected).to.be.closeTo(0, err);
          expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
          expect(await iVault.ratio()).to.be.closeTo(ratio, count * ratioErr);
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
        it(`Deposit many times and depositExtra once ${arg.name}`, async function () {
          let totalDeposited = 0n;
          const count = 10;
          for (let i = 0; i < count; i++) {
            const staker = await arg.staker();
            const deposited = await randomBI(18);
            await iVault.connect(staker).deposit(deposited, staker.address);
            totalDeposited = totalDeposited + deposited;
          }

          await iVault.connect(operator).depositExtra();
          console.log(`Final ratio:\t${await iVault.ratio()}`);
          console.log(`Total deposited:\t${format(totalDeposited)}`);

          const balanceExpected = (totalDeposited * ratio) / e18;
          const totalSupplyExpected = balanceExpected + firstDeposit;
          const err = count * transactErr * 2;

          const totalDepositedAfter = await iVault.getTotalDeposited();
          const totalSupplyAfter = await iToken.totalSupply();
          const totalAssetsAfter = await iVault.totalAssets();
          console.log(`Total deposited after: ${format(totalDepositedAfter)}`);
          console.log(`Total assets after: ${format(totalAssetsAfter)}`);

          expect(totalDepositedAfter - ((firstDeposit * e18) / ratio + totalDeposited)).to.be.closeTo(0, err);
          expect(totalSupplyAfter - totalSupplyExpected).to.be.closeTo(0, err);
          expect(totalAssetsAfter).to.be.closeTo(0, transactErr);
          expect(await iVault.ratio()).to.be.closeTo(ratio, count * ratioErr);
        });
      });

      it("Unable to depositExtra while there are uncovered pending withdrawals", async function () {
        //deposit
        const depositAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositAmount, staker.address);
        await iVault.connect(operator).depositExtra();
        //withdraw
        const withdrawAmount = await iToken.balanceOf(staker.address);
        await iVault.connect(staker).withdraw(withdrawAmount, staker.address);
        await iVault.connect(staker2).deposit(depositAmount / 2n, staker2.address);
        //depositExtra
        const totalDepositBefore = await iVault.totalAssets();
        await iVault.connect(operator).depositExtra();
        const totalDepositAfter = await iVault.totalAssets();
        expect(totalDepositAfter).to.be.eq(totalDepositBefore);
      });

      it("Can depositExtra the remainder of pending withdrawals", async function () {
        //deposit
        const depositAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositAmount, staker.address);
        await iVault.connect(operator).depositExtra();
        //withdraw
        const withdrawAmount = (await iToken.balanceOf(staker.address)) / 2n;
        await iVault.connect(staker).withdraw(withdrawAmount, staker.address);
        await iVault.connect(staker2).deposit(depositAmount, staker2.address);
        //depositExtra
        const pendingWithdrawals = await iVault.getPendingWithdrawalOf(staker.address);
        await iVault.connect(operator).depositExtra();
        const totalDepositAfter = await iVault.totalAssets();
        expect(totalDepositAfter).to.be.closeTo(pendingWithdrawals[0], transactErr);
      });

      it("Reverts: depositExtra when iVault is paused", async function () {
        const depositAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositAmount, staker.address);
        await iVault.pause();
        await expect(iVault.connect(operator).depositExtra()).to.be.revertedWith("Pausable: paused");
      });

      it("Reverts: depositExtra if not an operator", async function () {
        const depositAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositAmount, staker.address);
        await expect(iVault.connect(staker).depositExtra())
            .to.be.revertedWith("EigenLayerHandler: only operator allowed");
      });
    });

    describe("Withdraw: user can unstake", function () {
      let ratio, totalDeposited;

      before(async function () {
        await snapshotter.restore();
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);
        totalDeposited = await iVault.getTotalDeposited();
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${format(ratio)}`);
      });

      const testData = [
        {
          name: "random e18",
          amount: async (shares) => 724399519262012598n,
          receiver: () => staker.address,
        },
        {
          name: "999999999999999999",
          amount: async (shares) => 999999999999999999n,
          receiver: () => staker2.address,
        },
        {
          name: "888888888888888888",
          amount: async (shares) => 888888888888888888n,
          receiver: () => staker2.address,
        },
        {
          name: "777777777777777777",
          amount: async (shares) => 777777777777777777n,
          receiver: () => staker2.address,
        },
        {
          name: "666666666666666666",
          amount: async (shares) => 666666666666666666n,
          receiver: () => staker2.address,
        },
        {
          name: "555555555555555555",
          amount: async (shares) => 555555555555555555n,
          receiver: () => staker2.address,
        },
        {
          name: "444444444444444444",
          amount: async (shares) => 444444444444444444n,
          receiver: () => staker2.address,
        },
        {
          name: "333333333333333333",
          amount: async (shares) => 333333333333333333n,
          receiver: () => staker2.address,
        },
        {
          name: "222222222222222222",
          amount: async (shares) => 222222222222222222n,
          receiver: () => staker2.address,
        },
        {
          name: "111111111111111111",
          amount: async (shares) => 111111111111111111n,
          receiver: () => staker2.address,
        },
        {
          name: "min amount",
          amount: async (shares) => (await iVault.convertToAssets(await iVault.minAmount())) + 1n,
          receiver: () => staker2.address,
        },
        {
          name: "all",
          amount: async (shares) => shares,
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
          const events = receipt.logs?.filter((e) => {
            return e.eventName === "Withdraw";
          });

          expect(events.length).to.be.eq(1);
          expect(events[0].args["sender"]).to.be.eq(staker.address);
          expect(events[0].args["receiver"]).to.be.eq(test.receiver());
          expect(events[0].args["owner"]).to.be.eq(staker.address);
          expect(events[0].args["amount"]).to.be.closeTo(assetValue, transactErr);
          expect(events[0].args["iShares"]).to.be.eq(amount);

          expect(balanceBefore - (await iToken.balanceOf(staker.address))).to.be.eq(amount);
          expect((await iVault.getPendingWithdrawalOf(test.receiver()))[0] - stakerPWBefore[0])
              .to.be.closeTo(assetValue, transactErr);
          expect((await iVault.totalAmountToWithdraw()) - totalPWBefore).to.be.closeTo(assetValue, transactErr);
          expect(await iVault.getTotalDeposited()).to.be.closeTo(totalDeposited, transactErr);

          //If did withdraw all ratio = 1
          if ((await iToken.totalSupply()) > 0n) {
            expect(await iVault.ratio()).to.be.closeTo(ratioBefore, ratioErr);
          } else {
            expect(await iVault.ratio()).to.eq(e18);
          }
        });
      });
    });

    describe("Withdraw: negative cases", function () {
      before(async function () {
        await snapshotter.restore();
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);
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
          isCustom: false,
          error: "InceptionVault: amount is less than the minimum withdrawal",
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
            await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWithCustomError(iVault, test.error);
          } else {
            await expect(iVault.connect(staker).withdraw(amount, receiver)).to.be.revertedWith(test.error);
          }
        });
      });

      it("Withdraw small amount many times", async function () {
        const ratioBefore = await iVault.ratio();
        console.log(`Ratio before:\t${format(ratioBefore)}`);

        const count = 100;
        const amount = await iVault.minAmount();
        for (let i = 0; i < count; i++) {
          await iVault.connect(staker).withdraw(amount, staker.address);
        }
        const ratioAfter = await iVault.ratio();
        console.log(`Ratio after:\t${format(ratioAfter)}`);

        expect(ratioBefore - ratioAfter).to.be.closeTo(0, count);

        await iVault.connect(staker).withdraw(e18, staker.address);
        console.log(`Ratio after withdraw 1eth:\t${await iVault.ratio()}`);
        expect(await iVault.ratio()).to.be.closeTo(ratioAfter, ratioErr);
      });

      it("Reverts: withdraw when iVault is paused", async function () {
        await iVault.pause();
        await expect(iVault.connect(staker).withdraw(toWei(1), staker.address)).to.be.revertedWith("Pausable: paused");
      });
    });

    describe("WithdrawFromEL: operator can take assets back from EL", function () {
      let ratio, ratioDiff, depositedAmount, withdrawal1Amount, withdrawal2Amount, withdrawalData, withdrawalAssets, shares1, shares2;

      before(async function () {
        await snapshotter.restore();
        //Deposit and withdraw
        depositedAmount = randomBI(19);
        console.log(`Deposit amount: ${depositedAmount}`);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        await iVault.connect(operator).depositExtra();

        ratio = await iVault.ratio();
        console.log(`Ratio ${format(ratio)}`);
      });

      it("Staker1 withdraws#1", async function () {
        shares1 = 460176234800292249n;
        withdrawal1Amount = await iVault.convertToAssets(shares1);
        console.log(`--- Staker going to withdraw: ${shares1}/${withdrawal1Amount}`);
        await iVault.connect(staker).withdraw(shares1, staker.address);
        console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
      });

      it("Reverts: not an operator", async function () {
        await expect(iVault.connect(staker).withdrawFromEL()).to.be.revertedWith("EigenLayerHandler: only operator allowed");
      });

      it("Operator can withdrawFromEL", async function () {
        const tx = await iVault.connect(operator).withdrawFromEL();
        const receipt = await tx.wait();
        const startWithdrawal = receipt.logs?.filter((e) => {
          return e.eventName === "StartWithdrawal";
        });
        expect(startWithdrawal.length).to.be.eq(1);

        const withdrawalQueued = receipt.logs?.filter((e) => {
          return e.eventName === "WithdrawalQueued";
        });
        expect(withdrawalQueued.length).to.be.eq(1);
        expect(await iVault.totalAssets()).to.be.eq(0);
        expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
        console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
        expect(await iVault.getPendingWithdrawalAmountFromEL()).to.be.closeTo(shares1, 2);

        const WithdrawalQueuedEvent = receipt.logs[2].args.toObject();
        withdrawalData = [
          WithdrawalQueuedEvent.strategies.toArray(),
          WithdrawalQueuedEvent.shares.toArray(),
          await iVault.getAddress(),
          [await iVault.getAddress(), WithdrawalQueuedEvent.nonce],
          WithdrawalQueuedEvent.withdrawalStartBlock,
          WithdrawalQueuedEvent.delegatedAddress,
        ];
        withdrawalAssets = [];
        const StrategyBaseFactory = await ethers.getContractFactory("StrategyBaseDummy");
        for (const strategyAddress of WithdrawalQueuedEvent.strategies.toArray()) {
          const strategy = StrategyBaseFactory.attach(strategyAddress);
          const assetAddress = await strategy.underlyingToken();
          withdrawalAssets.push(assetAddress);
        }
      });

      it("Staker1 withdraws#2", async function () {
        shares2 = 460176234800292249n;
        withdrawal2Amount = await iVault.convertToAssets(shares2);
        console.log(`--- Staker going to withdraw: ${shares2}/${withdrawal2Amount}`);
        await iVault.connect(staker).withdraw(shares2, staker2.address);
        console.log(`Pending withdrawal staker2:\t${(await iVault.getPendingWithdrawalOf(staker2.address))[0]}`);
      });

      it("Update ratio", async function () {
        const ratioBefore = await iVault.ratio();
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);
        ratio = await iVault.ratio();
        ratioDiff = ratioBefore - ratio;
      });

      it("Reverts: when prior withdrawal has not been claimed", async function () {
        await expect(iVault.connect(operator).withdrawFromEL())
            .to.be.revertedWithCustomError(iVault, "RebalanceNotInProgress");
      });

      it("Claim withdrawal from EL", async function () {
        await mineBlocks(a.withdrawalDelayBlocks);
        await expect(iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets))
          .to.emit(iVault, "WithdrawalClaimed");

        const ratio = await iVault.ratio();
        const totalAssetsBefore = await iVault.totalAssets();
        const pendingWwls = await iVault.getPendingWithdrawalOf(staker.address);
        const pendingWwlsEL = await iVault.getPendingWithdrawalAmountFromEL();

        console.log(`Ratio:\t\t\t\t${format(ratio)}`);
        console.log(`iVault assets:\t\t${format(totalAssetsBefore)}`);
        console.log(`Pending withdrawal:\t${format(pendingWwls[0])}`);
        console.log(`Pending withdrawal EL:\t\t${format(pendingWwlsEL)}`);
        console.log(`Extra before:\t\t\t${format(totalAssetsBefore - withdrawal1Amount)}`);

        await iVault.connect(operator).depositExtra();
        const totalAssetsAfter = await iVault.totalAssets();
        console.log(`Extra after:\t\t\t${format(totalAssetsAfter - withdrawal1Amount)}`);
        expect(pendingWwlsEL).to.be.eq(0);
      });

      it("Staker is able to redeem", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
      });

      it("Staker redeems withdrawals", async function () {
        console.log(`Ratio: ${await iVault.ratio()}`);
        const stakerBalanceBefore = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
        console.log(`#############Redeem`);
        await iVault.redeem(staker.address);
        const stakerBalanceAfter = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

        console.log(`Staker balance after: ${stakerBalanceAfter}`);
        console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
        expect(stakerPendingWithdrawalsBefore[0] - stakerPendingWithdrawalsAfter[0])
            .to.be.closeTo(withdrawal1Amount, 5);
        expect(stakerBalanceAfter - stakerBalanceBefore)
            .to.be.closeTo(withdrawal1Amount, 5);
        console.log(`Ratio: ${await iVault.ratio()}`);
        console.log(`Total asset: ${await iVault.totalAssets()}`);
      });
    });

    describe("WithdrawFromEL: negative cases", function () {
      let depositedAmount;

      beforeEach(async function () {
        await snapshotter.restore();
      });

      it("Reverts: when nothing was withdrawn to EL yet", async function () {
        depositedAmount = toWei(10);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);

        const amount = toWei(1);
        await iVault.connect(staker).withdraw(amount, staker.address);

        console.log(`iVault assets:\t\t\t\t${await iVault.totalAssets()}`);
        console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

        await expect(iVault.connect(operator).withdrawFromEL())
            .to.be.revertedWithCustomError(iVault, "WithdrawFutile");
      });

      it("Reverts: totalAssets is enough to cover pending withdrawals", async function () {
        depositedAmount = toWei(10);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        await iVault.connect(operator).depositExtra();

        const amount = toWei(1);
        await iVault.connect(staker).deposit(amount, staker.address);
        await iVault.connect(staker).withdraw(amount / 2n, staker.address);

        console.log(`iVault assets:\t\t\t\t${await iVault.totalAssets()}`);
        console.log(`Pending withdrawal staker:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

        await expect(iVault.connect(operator).withdrawFromEL())
            .to.be.revertedWithCustomError(iVault, "WithdrawFutile");
      });

      it("Reverts: when iVault is paused", async function () {
        await iVault.connect(staker).deposit(toWei(10), staker.address);
        await iVault.connect(operator).depositExtra();
        await iVault.connect(staker).withdraw(toWei(1), staker.address);
        await iVault.pause();
        await expect(iVault.connect(operator).withdrawFromEL())
            .to.be.revertedWith("Pausable: paused");
      });
    });

    describe("claimCompletedWithdrawals: claims withdrawal from EL", function () {
      let ratio, depositedAmount, withdrawalAmount, withdrawalData, withdrawalAssets;

      before(async function () {
        await snapshotter.restore();
        ratio = await iVault.ratio();

        //Deposit and withdraw
        depositedAmount = randomBI(19);
        await iVault.connect(staker).deposit(depositedAmount, staker.address);
        await iVault.connect(operator).depositExtra();
        withdrawalAmount = randomBI(18);
        await iVault.connect(staker).withdraw(withdrawalAmount, staker.address);
        console.log(`Pending withdrawals: ${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);

        const tx = await iVault.connect(operator).withdrawFromEL();
        [withdrawalData, withdrawalAssets] = await withdrawDataFromTx(tx, iVault);
      });

      beforeEach(async function () {
        if (await iVault.paused()) {
          await iVault.unpause();
        }
      });

      it("Reverts: when iVault is paused", async function () {
        await iVault.pause();
        await expect(iVault.claimCompletedWithdrawals(withdrawalData, withdrawalAssets))
            .to.be.revertedWith("Pausable: paused");
      });

      it("Reverts: when claim without delay", async function () {
        await expect(iVault.claimCompletedWithdrawals(withdrawalData, withdrawalAssets)).to.be.revertedWith(
          "StrategyManager.completeQueuedWithdrawal: withdrawalDelayBlocks period has not yet passed"
        );
      });

      it("Successful claim from EL", async function () {
        await mineBlocks(a.withdrawalDelayBlocks);
        console.log(`iVault assets before: ${await iVault.totalAssets()}`);
        const epochBefore = await iVault.epoch();

        await iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets);
        console.log(`iVault assets after: ${await iVault.totalAssets()}`);

        expect(await iVault.totalAssets()).to.be.closeTo(await iVault.convertToAssets(withdrawalAmount), 5);
        expect(await iVault.epoch()).to.be.eq(epochBefore + 1n);
        expect(await iVault.ratio()).to.be.closeTo(ratio, 2);
      });

      it("getTotalDeposited() = iVault + EL", async function () {
        const amount = await iVault.getTotalDeposited();
        console.log(`getTotalDeposited: ${amount}`);
        expect(amount).to.be.closeTo(depositedAmount, 5);
      });

      it("Reverts: when claim the 2nd time", async function () {
        await expect(iVault.connect(staker).claimCompletedWithdrawals(withdrawalData, withdrawalAssets))
            .to.be.revertedWith("InceptionVault: there is no withdrawal");
      });
    });

    describe("Redeem: retrieves assets after they were taken from EL", function () {
      let ratio, stakerUnstakeAmount, staker2UnstakeAmount;

      before(async function () {
        await snapshotter.restore();
        await iVault.connect(staker3).deposit(toWei(2), staker3.address);
        await iVault.connect(operator).depositExtra();
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker3);
        ratio = await iVault.ratio();
        console.log(`Initial ratio: ${await iVault.ratio()}`);
      });

      it("Stakers deposit", async function () {
        await iVault.connect(staker).deposit(9399680561290658040n, staker.address);
        await iVault.connect(staker2).deposit(1348950494309030813n, staker2.address);
        await iVault.connect(operator).depositExtra();
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker has nothing to claim yet", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
      });

      it("Staker withdraws half", async function () {
        const shares = await iToken.balanceOf(staker.address);
        stakerUnstakeAmount = shares / 2n;
        await iVault.connect(staker).withdraw(stakerUnstakeAmount, staker.address);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is not able to claim yet", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
      });

      it("Reverts: when redeem the same epoch", async function () {
        await expect(iVault.connect(operator).redeem(staker.address))
            .to.be.revertedWith("InceptionVault: claimer is not able to claim");
      });

      it("Staker3 withdraws during claim from EL", async function () {
        const tx = await iVault.connect(operator).withdrawFromEL();
        const data = await withdrawDataFromTx(tx, iVault);

        await iVault.connect(staker3).withdraw(toWei(1), staker3.address);
        expect(await iVault.isAbleToRedeem(staker3.address)).to.be.false;

        await mineBlocks(a.withdrawalDelayBlocks);
        await iVault.claimCompletedWithdrawals(data[0], data[1]);

        console.log(`Total assets:\t\t${format(await iVault.totalAssets())}`);
        console.log(`Pending withdrawals:\t${format((await iVault.getPendingWithdrawalOf(staker.address))[0])}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is now able to redeem", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
      });

      it("Staker3 is not enable for redeem yet", async function () {
        expect(await iVault.isAbleToRedeem(staker3.address)).to.be.false;
      });

      it("Staker2 withdraws < staker pending withdrawal", async function () {
        const stakerPendingWithdrawal = await iVault.getPendingWithdrawalOf(staker.address);
        staker2UnstakeAmount = stakerPendingWithdrawal[0] / 10n;
        await iVault.connect(staker2).withdraw(staker2UnstakeAmount, staker2.address);
      });

      it("Staker2 is not able to claim yet", async function () {
        expect(await iVault.isAbleToRedeem(staker2.address)).to.be.false;
      });

      it("Staker is still able to claim", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
      });

      it("Reverts: when staker2 redeems out of turn", async function () {
        await expect(iVault.connect(operator).redeem(staker2.address))
            .to.be.revertedWith("InceptionVault: claimer is not able to claim");
      });

      it("Staker withdraws again which makes redeem epoch been reset", async function () {
        const shares = await iToken.balanceOf(staker.address);
        await iVault.connect(staker).withdraw(shares / 2n, staker.address);
        stakerUnstakeAmount = stakerUnstakeAmount + shares / 2n;
        console.log(`Pending withdrawals:\t${format((await iVault.getPendingWithdrawalOf(staker.address))[0])}`);
        console.log(`Unstake amount:\t\t${format(stakerUnstakeAmount)}`);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker is not able to claim again", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
      });

      it("Withdraw and claim from EL", async function () {
        await iVault.withdrawFromELAndClaim();
        console.log(`Ratio: ${format(await iVault.ratio())}`);
      });

      it("Staker is able to claim", async function () {
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
      });

      it("Staker2 is able to claim", async function () {
        expect(await iVault.isAbleToRedeem(staker2.address)).to.be.true;
      });

      it("Staker3 is able to claim", async function () {
        expect(await iVault.isAbleToRedeem(staker3.address)).to.be.true;
      });

      it("Reverts: unable to redeem when iVault is paused", async function () {
        await iVault.pause();
        await expect(iVault.redeem(staker.address)).to.be.revertedWith("Pausable: paused");
      });

      it("Staker redeems withdrawals", async function () {
        try {
          await iVault.unpause();
        } catch (e) {}

        console.log(`Ratio: ${await iVault.ratio()}`);
        const stakerBalanceBefore = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
        const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(stakerUnstakeAmount);
        await iVault.redeem(staker.address);
        const stakerBalanceAfter = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

        console.log(`Balance after:\t\t\t${format(stakerBalanceAfter)}`);
        console.log(`Pending withdrawals before:\t${format(stakerPendingWithdrawalsBefore[0])}`);
        console.log(`Pending withdrawals after:\t${format(stakerPendingWithdrawalsAfter[0])}`);
        console.log(`Unstake amount asset value:\t${format(stakerUnstakeAmountAssetValue)}`);

        expect(stakerPendingWithdrawalsBefore[0] - stakerPendingWithdrawalsAfter[0])
            .to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
        expect(stakerBalanceAfter - stakerBalanceBefore)
            .to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
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
        console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
        const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(staker2UnstakeAmount);
        expect(stakerPendingWithdrawalsBefore[0] - stakerPendingWithdrawalsAfter[0])
            .to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
        expect(stakerBalanceAfter - stakerBalanceBefore)
            .to.be.closeTo(stakerUnstakeAmountAssetValue, transactErr * 2);
      });

      it("Ratio is ok after all", async function () {
        console.log(`Ratio: ${format(await iVault.ratio())}`);
        expect(await iVault.ratio()).to.be.closeTo(ratio, ratioErr);
      });
    });

    describe("Redeem: to the different addresses", function () {
      let ratio, recipients, pendingShares;

      before(async function () {
        await snapshotter.restore();
        await iVault.connect(staker).deposit("9292557565124725653", staker.address);
        await iVault.connect(operator).depositExtra();
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
          let tx = await iVault.connect(operator).withdrawFromEL();
          const data = await withdrawDataFromTx(tx, iVault);

          await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);
          ratio = await iVault.ratio();
          console.log(`New ratio is: ${ratio}`);

          await mineBlocks(a.withdrawalDelayBlocks);
          await iVault.connect(staker).claimCompletedWithdrawals(...data);
          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Total withdrawn shares to assets ${await iVault.convertToAssets(pendingShares)}`);
          console.log(`Ratio: ${await iVault.ratio()}`);
        });

        it(`${j} Recipients claim`, async function () {
          for (const r of recipients) {
            expect(await iVault.isAbleToRedeem(r)).to.be.true;

            const rBalanceBefore = await asset.balanceOf(r);
            const rPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(r);
            await iVault.redeem(r);
            const rBalanceAfter = await asset.balanceOf(r);
            const rPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(r);

            expect(rBalanceBefore).to.be.eq(0);
            expect(rBalanceAfter - rPendingWithdrawalsBefore[0]).to.be.closeTo(0, transactErr * 2);
            expect(rPendingWithdrawalsAfter[0]).to.be.closeTo(0, transactErr * 2);
          }
          expect(await iVault.ratio()).to.be.lte(ratio);
          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Ratio: ${await iVault.ratio()}`);
        });

        it(`${j} Deposit extra from iVault`, async function () {
          const totalDepositedBefore = await iVault.getTotalDeposited();

          await iVault.connect(operator).depositExtra();
          const totalDepositedAfter = await iVault.getTotalDeposited();

          console.log(`Total assets: ${await iVault.totalAssets()}`);
          console.log(`Ratio: ${await iVault.ratio()}`);

          expect(totalDepositedAfter).to.be.closeTo(totalDepositedBefore, 1);
          expect(await iVault.totalAssets()).to.be.lte(100);
          expect(await iVault.ratio()).to.be.lte(ratio);
        });
      }

      it("Update asset ratio and withdraw the rest", async function () {
        await addRewardsToStrategy(a.assetStrategyAddress, e18, staker2);

        //Withdraw all and take from EL
        const shares = await iToken.balanceOf(staker.address);
        await iVault.connect(staker).withdraw(shares, staker.address);
        await iVault.withdrawFromELAndClaim();
        await iVault.connect(operator).redeem(staker.address);

        console.log(`iVault total assets: ${await iVault.totalAssets()}`);
        console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
        console.log(`iVault total assets: ${await iVault.totalAssets()}`);
        console.log(`Total deposited: ${await iVault.getTotalDeposited()}`);
        console.log(`New ratio is: ${format(await iVault.ratio())}`);
        expect(await iVault.totalAssets()).to.be.lte(100);
      });
    });

    describe("WithdrawFromEL and redeem in a loop", function () {
      let ratio, stakers;

      before(async function () {
        await snapshotter.restore();
        stakers = [staker, staker2];
        //Deposit
        for (const s of stakers) {
          await iVault.connect(s).deposit(randomBI(19), s.address);
        }
        await iVault.connect(operator).depositExtra();

        ratio = await iVault.ratio();
        console.log(`Ratio ${ratio.toString()}`);
      });

      const count = 5;
      for (let i = 0; i < count; i++) {
        it(`${i}. Iteration`, async function () {
          //Withdraw staker and staker2
          for (const s of stakers) {
            const shares = randomBI(16);
            await iVault.connect(s).withdraw(shares, s.address);
          }
          await iVault.withdrawFromELAndClaim();

          const pwStaker1 = (await iVault.getPendingWithdrawalOf(staker.address))[0];
          const pwStaker2 = (await iVault.getPendingWithdrawalOf(staker2.address))[0];
          console.log(`Pending withdrawal staker1:\t${pwStaker1}`);
          console.log(`Pending withdrawal staker2:\t${pwStaker2}`);
          console.log(`Pending withdrawal sum:\t\t${pwStaker1 + pwStaker2}`);
          console.log(`Pending withdrawal EL:\t\t${await iVault.getPendingWithdrawalAmountFromEL()}`);
          console.log(`iToken balance staker1:\t${await iToken.balanceOf(staker.address)}`);
          console.log(`iToken balance staker2:\t${await iToken.balanceOf(staker2.address)}`);

          //Redeem
          console.log(`### Staker1 redeems`);
          await iVault.redeem(staker.address);
          console.log(`Pending withdrawal staker1:\t${(await iVault.getPendingWithdrawalOf(staker.address))[0]}`);
          console.log(`Ratio: ${await iVault.ratio()}`);

          console.log(`### Staker2 redeems`);
          await iVault.redeem(staker2.address);
          console.log(`iToken balance staker2:\t\t${await iToken.balanceOf(staker2.address)}`);
          console.log(`Pending withdrawal staker2:\t${(await iVault.getPendingWithdrawalOf(staker2.address))[0]}`);
          console.log(`Ratio: ${await iVault.ratio()}`);
        });
      }

      it("Stakers withdraw all and redeem", async function () {
        //Stakers withdraw all
        for (const s of stakers) {
          const shares = await iToken.balanceOf(s.address);
          await iVault.connect(s).withdraw(shares, s.address);
        }
        await iVault.withdrawFromELAndClaim();

        //Redeem
        let stakerCounter = 1;
        for (const s of stakers) {
          console.log(`iVault assets before:\t\t\t\t${await iVault.totalAssets()}`);
          console.log(`Pending withdrawal staker${stakerCounter} before:\t${(await iVault.getPendingWithdrawalOf(s.address))[0]}`);
          console.log(`### Staker${stakerCounter} redeems`);
          await iVault.redeem(s.address);
          console.log(`Pending withdrawal staker${stakerCounter} after:\t${(await iVault.getPendingWithdrawalOf(s.address))[0]}`);
          stakerCounter++;
        }
        console.log(`Ratio: ${await iVault.ratio()}`);
        expect(await iVault.getTotalDeposited()).to.be.lt(100);
        expect(await iVault.totalAssets()).to.be.lt(100);
      });
    });

    describe("Redeem all when nothing has been deposited to EL", function () {
      before(async function () {
        await snapshotter.restore();
      });

      it("Stakers deposit", async function () {
        await iVault.connect(staker).deposit(toWei(1), staker.address);
        await iVault.connect(staker2).deposit(toWei(1), staker2.address);
        console.log(`Ratio: ${format(await iVault.ratio())}`);
      });

      it("Transfer asset to iVault", async function () {
        await asset.connect(staker3).transfer(await iVault.getAddress(), toWei(1));
        console.log(`Ratio: ${format(await iVault.ratio())}`);
      });

      it("Stakers withdraw", async function () {
        const stakerBalance = await iToken.balanceOf(staker.address);
        await iVault.connect(staker).withdraw(stakerBalance, staker.address);
        const staker2Balance = await iToken.balanceOf(staker2.address);
        await iVault.connect(staker2).withdraw(staker2Balance, staker2.address);
        console.log(`Ratio: ${format(await iVault.ratio())}`);
      });

      it("Update epoch by 1 - stakers can not redeem just yet", async function () {
        const epoch = await iVault.epoch();
        await iVault.connect(operator).updateEpoch(epoch + 1n);
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.false;
        expect(await iVault.isAbleToRedeem(staker2.address)).to.be.false;
      });

      it("Update epoch by 2 - stakers can redeem", async function () {
        const epoch = await iVault.epoch();
        await iVault.connect(operator).updateEpoch(epoch + 1n);
        expect(await iVault.isAbleToRedeem(staker.address)).to.be.true;
        expect(await iVault.isAbleToRedeem(staker2.address)).to.be.true;
      });

      it("Staker redeems withdrawals", async function () {
        console.log(`Ratio: ${await iVault.ratio()}`);
        const stakerUnstakeAmount = await iToken.balanceOf(staker.address);
        const stakerBalanceBefore = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker.address);
        const stakerUnstakeAmountAssetValue = await iVault.convertToAssets(stakerUnstakeAmount);
        await iVault.redeem(staker.address);
        const stakerBalanceAfter = await asset.balanceOf(staker.address);
        const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker.address);

        console.log(`Balance after:\t\t\t${format(stakerBalanceAfter)}`);
        console.log(`Pending withdrawals before:\t${format(stakerPendingWithdrawalsBefore[0])}`);
        console.log(`Pending withdrawals after:\t${format(stakerPendingWithdrawalsAfter[0])}`);
        console.log(`Unstake amount asset value:\t${format(stakerUnstakeAmountAssetValue)}`);
        console.log(`Balance diff:\t${format(stakerBalanceAfter - stakerBalanceBefore)}`);

        expect(stakerBalanceAfter - stakerBalanceBefore)
          .to.be.closeTo(stakerPendingWithdrawalsBefore[0] - stakerPendingWithdrawalsAfter[0], transactErr * 2);
        console.log(`Ratio: ${await iVault.ratio()}`);
      });

      it("Staker2 redeems withdrawals", async function () {
        console.log(`Ratio: ${await iVault.ratio()}`);
        const stakerBalanceBefore = await asset.balanceOf(staker2.address);
        const stakerPendingWithdrawalsBefore = await iVault.getPendingWithdrawalOf(staker2.address);
        await iVault.redeem(staker2.address);
        const stakerBalanceAfter = await asset.balanceOf(staker2.address);
        const stakerPendingWithdrawalsAfter = await iVault.getPendingWithdrawalOf(staker2.address);
        const totalAssetsAfter = await iVault.totalAssets();

        console.log(`Staker balance after: ${stakerBalanceAfter}`);
        console.log(`Staker pending withdrawals after: ${stakerPendingWithdrawalsAfter[0]}`);
        console.log(`Total assets after: ${format(totalAssetsAfter)}`);
        console.log(`Ratio: ${await iVault.ratio()}`);

        expect(stakerBalanceAfter - stakerBalanceBefore)
          .to.be.closeTo(stakerPendingWithdrawalsBefore[0] - stakerPendingWithdrawalsAfter[0], transactErr * 2);
        expect(totalAssetsAfter).to.be.lt(100n);
      });
    });

    describe("iToken ratio depends on", function () {
      before(async function () {
        await snapshotter.restore();
        await iVault.connect(staker).deposit(e18, staker.address);
      });

      const testData = [
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" },
        { amount: "1000000000000000000" }];

      it("Ratio is not affected by strategy rewards until the first deposit to EL", async function () {
        const ratioBefore = await iVault.ratio();
        await addRewardsToStrategy(a.assetStrategyAddress, toWei(1), staker2);
        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${format(ratioBefore)}`);
        console.log(`Ratio after:\t${format(ratioAfter)}`);
        console.log(`Diff:\t\t\t${format(ratioBefore - ratioAfter)}`);

        expect(ratioAfter).to.be.eq(ratioBefore);
      });

      it("Ratio declines along with the ratio of rebase-like asset", async function () {
        const ratioBefore = await iVault.ratio();
        await asset.connect(staker2).transfer(await iVault.getAddress(), toWei(1));
        const ratioAfter = await iVault.ratio();

        console.log(`Ratio before:\t${format(ratioBefore)}`);
        console.log(`Ratio after:\t${format(ratioAfter)}`);
        console.log(`Diff:\t\t\t${format(ratioBefore - ratioAfter)}`);

        expect(ratioAfter).to.be.lt(ratioBefore);
      });

      testData.forEach(function (test) {
        it(`Ratio declines when the strategy rewards are growing: ${test.amount}`, async function () {
          await iVault.connect(operator).depositExtra();
          const ratioBefore = await iVault.ratio();
          await addRewardsToStrategy(a.assetStrategyAddress, test.amount, staker2);
          const ratioAfter = await iVault.ratio();

          console.log(`Ratio before:\t${format(ratioBefore)}`);
          console.log(`Ratio after:\t${format(ratioAfter)}`);
          console.log(`Diff:\t\t\t${format(ratioBefore - ratioAfter)}`);

          expect(ratioAfter).to.be.lt(ratioBefore);
        });
      });
    });
  });
});
