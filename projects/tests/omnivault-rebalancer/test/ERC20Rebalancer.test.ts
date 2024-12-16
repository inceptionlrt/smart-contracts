import { ethers, network, upgrades } from "hardhat";
import { expect } from "chai";
import { takeSnapshot, time } from "@nomicfoundation/hardhat-network-helpers";
import { e18, getSlotByName, impersonateWithEth, randomBI, randomBIMax, toWei } from "./helpers/utils.js";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";
import { AbiCoder, Signer } from "ethers";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import {
  EndpointMock,
  ERC20,
  InceptionERC20OmniVault,
  InceptionRatioFeed,
  InceptionToken,
  FerryAdapter,
  LZCrossChainAdapterL1,
  LZCrossChainAdapterL2,
  ERC20Rebalancer,
  RatioFeed,
  RestakingPool,
  InceptionVault,
} from "../typechain-types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { min } from "hardhat/internal/util/bigint";

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const FRAX_ID = 252n;
const ETH_ID = 1n;
const FRAX_EID = 30255n;
const FRAX_TESTNET_EID = 40255n;
const ETH_EID = 30111n;
const eIds = [ETH_EID, FRAX_EID];
const chainIds = [ETH_ID, FRAX_ID];
const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();

describe("Omnivault integration tests", function () {
  this.timeout(150000);
  //Adapters
  let adapterL1: LZCrossChainAdapterL1;
  let maliciousAdapterL1: LZCrossChainAdapterL1;
  let adapterFrax: LZCrossChainAdapterL2;

  let ethEndpoint: EndpointMock;
  let fraxEndpoint: EndpointMock;

  let maliciousAdapterL2: LZCrossChainAdapterL2;

  // ============ L1 ============
  let ratioFeedL1: RatioFeed;
  let underlyingToken: InceptionToken;
  let rebalancer: ERC20Rebalancer;
  let inceptionVault: InceptionVault;

  // ============ L2 ============
  let iToken: InceptionToken;
  let fraxToken: ERC20;
  let omniVault: InceptionERC20OmniVault; // Frax chain
  let ratioFeedL2: InceptionRatioFeed;

  let owner: Signer;
  let operator: Signer;
  let treasury: Signer;
  let signer1: Signer;
  let signer2: Signer;
  let signer3: Signer;
  let target: Signer;

  let snapshot: SnapshotRestorer;
  let lockboxAddress: String;

  let TARGET = toWei(10);

  async function init(owner: Signer, operator: Signer) {
    const block = await ethers.provider.getBlock("latest");
    console.log(`Starting at block number: ${block.number}`);
    lockboxAddress = network.config.addresses.lockbox;

    //    ____                        _           _                   _             _
    //   / ___|_ __ ___  ___ ___  ___| |__   __ _(_)_ __     __ _  __| | __ _ _ __ | |_ ___ _ __ ___
    //  | |   | '__/ _ \/ __/ __|/ __| '_ \ / _` | | '_ \   / _` |/ _` |/ _` | '_ \| __/ _ \ '__/ __|
    //  | |___| | | (_) \__ \__ \ (__| | | | (_| | | | | | | (_| | (_| | (_| | |_) | ||  __/ |  \__ \
    //   \____|_|  \___/|___/___/\___|_| |_|\__,_|_|_| |_|  \__,_|\__,_|\__,_| .__/ \__\___|_|  |___/
    //                                                                       |_|
    console.log("============ Crosschain adapters ============");
    console.log("=== CrossChainAdapterL1");
    const ethEndpoint = await ethers.deployContract("EndpointMock", [ETH_EID]);
    (ethEndpoint as any).address = await ethEndpoint.getAddress();
    const LZCrossChainAdapterL1 = await ethers.getContractFactory("LZCrossChainAdapterL1");
    const adapterL1 = await upgrades.deployProxy(LZCrossChainAdapterL1, [
      (ethEndpoint as any).address,
      (ethEndpoint as any).address,
      eIds,
      chainIds,
    ]);
    (adapterL1 as any).address = await adapterL1.getAddress();

    console.log("=== Frax LZCrossChainAdapterL2");
    const fraxEndpoint = await ethers.deployContract("EndpointMock", [FRAX_EID]);
    (fraxEndpoint as any).address = await fraxEndpoint.getAddress();
    const LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");
    const adapterFrax = await upgrades.deployProxy(LZCrossChainAdapterL2, [
      (fraxEndpoint as any).address,
      (owner as any).address,
      ETH_ID,
      eIds,
      chainIds,
    ]);
    adapterFrax.address = await adapterFrax.getAddress();
    adapterFrax.sendData = async function (timestamp, vaultBalance, totalSupply) {
      const message = encodePayload(timestamp, vaultBalance, totalSupply);
      const fees = await this.quote(message, options);
      return await this.sendDataL1(message, options, { value: fees });
    };

    // Connect endpoints
    await fraxEndpoint.setDestLzEndpoint(adapterL1.address, ethEndpoint.address);
    await ethEndpoint.setDestLzEndpoint(adapterFrax.address, fraxEndpoint.address);

    /************************************
     ******** Malicious adapters ********
     ************************************/

    const maliciousAdapterL1 = await upgrades.deployProxy(LZCrossChainAdapterL1, [
      ethEndpoint.address,
      owner.address,
      eIds,
      chainIds,
    ]);
    maliciousAdapterL1.address = await maliciousAdapterL1.getAddress();

    const maliciousAdapterL2 = await upgrades.deployProxy(LZCrossChainAdapterL2, [
      fraxEndpoint.address,
      owner.address,
      ETH_ID,
      eIds,
      chainIds,
    ]);
    maliciousAdapterL2.address = await maliciousAdapterL2.getAddress();

    //   ____   _
    //   | |   / |
    //   | |   | |
    //   | |___| |
    //   |_____| |

    console.log("============ FraxETH ============");

    const sfrxETH = await ethers.getContractAt("ERC20", network.config.addresses.sfrxETH);

    //   impersonateStaker: async (staker, iVault, asset, assetPool) => {
    //     const donor = await impersonateWithEth("0xe7d40d9a77caddd8e8b4b484ed14c42f3b8d763a", toWei(1));
    //     console.log(`balance of the donor: ${(await asset.balanceOf(donor.address)).toString()}`);
    //     await asset.connect(donor).transfer(staker.address, toWei(1000));
    //     const balanceAfter = await asset.balanceOf(staker.address);
    //     await asset.connect(staker).approve(await iVault.getAddress(), balanceAfter);
    //     return staker;
    //   },
    // },

    console.log("============ InceptionVault Layer1 ============");
    // console.log("=== ProtocolConfig");
    // const protocolConfigAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.restakingPoolConfig);
    // let slot = "0x" + (0).toString(16);
    // let value = ethers.zeroPadValue(owner.address, 32);
    // await network.provider.send("hardhat_setStorageAt", [protocolConfigAdminAddress, slot, value]);

    // const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig", owner);
    // const restakingPoolConfig = await upgrades.upgradeProxy(network.config.addresses.restakingPoolConfig, ProtocolConfig);
    // //Updating governance address
    // slot = "0x" + getSlotByName("genesis.config.Governance");
    // value = ethers.zeroPadValue(owner.address, 32);
    // await network.provider.send("hardhat_setStorageAt", [network.config.addresses.restakingPoolConfig, slot, value]);

    console.log("=== InceptionVault");
    console.log(network.config.addresses.inceptionVault);
    const restakingPoolAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.inceptionVault);
    let slot = "0x" + (0).toString(16);
    let value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [restakingPoolAdminAddress, slot, value]);

    const InceptionVaultFactory = await ethers.getContractFactory("InceptionVault", {
      signer: owner,
      libraries: { InceptionLibrary: network.config.addresses.lib },
    });
    await upgrades.forceImport(network.config.addresses.inceptionVault, InceptionVaultFactory);
    const inceptionVault = await upgrades.upgradeProxy(network.config.addresses.inceptionVault, InceptionVaultFactory, {
      unsafeAllowLinkedLibraries: true,
    });
    inceptionVault.address = await inceptionVault.getAddress();

    console.log("=== InceptionToken");
    const inceptionTokenAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.inceptionToken);
    console.log(inceptionTokenAdminAddress);
    slot = "0x" + (0).toString(16);
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [inceptionTokenAdminAddress, slot, value]);
    const InceptionTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
    await upgrades.forceImport(network.config.addresses.inceptionToken, InceptionTokenFactory);
    const inceptionToken = await upgrades.upgradeProxy(network.config.addresses.inceptionToken, InceptionTokenFactory);
    inceptionToken.address = await inceptionToken.getAddress();

    console.log("=== RatioFeed");
    const ratioFeedAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.ratioFeed);
    slot = "0x" + (0).toString(16);
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [ratioFeedAdminAddress, slot, value]);
    const RatioFeed = await ethers.getContractFactory("RatioFeed", owner);
    const ratioFeedL1 = await upgrades.upgradeProxy(network.config.addresses.ratioFeed, RatioFeed);
    ratioFeedL1.address = await ratioFeedL1.getAddress();

    console.log("=== ERC20Rebalancer");
    const Rebalancer = await ethers.getContractFactory("ERC20Rebalancer");
    const rebalancer = await upgrades.deployProxy(Rebalancer, [
      inceptionToken.address,
      lockboxAddress,
      inceptionVault.address,
      adapterL1.address,
      ratioFeedL1.address,
      operator.address,
    ]);
    rebalancer.address = await rebalancer.getAddress();
    await rebalancer.connect(owner).addChainId(FRAX_ID);
    // await rebalancer.connect(owner).addChainId(OPT_ID);
    // await restakingPoolConfig.connect(owner).setRebalancer(rebalancer.address);

    //    ___                  ___     __          _ _     _     ____
    //   / _ \ _ __ ___  _ __ (_) \   / /_ _ _   _| | |_  | |   |___ \
    //  | | | | '_ ` _ \| '_ \| |\ \ / / _` | | | | | __| | |     __) |
    //  | |_| | | | | | | | | | | \ V / (_| | |_| | | |_  | |___ / __/
    //   \___/|_| |_| |_|_| |_|_|  \_/ \__,_|\__,_|_|\__| |_____|_____|
    //
    console.log("============ OmniVault Layer2 ============");
    console.log("=== iToken");
    const iTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
    const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
    await iToken.waitForDeployment();
    iToken.address = await iToken.getAddress();

    console.log("=== InceptionRatioFeed");
    const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed", owner);
    const ratioFeedL2 = await upgrades.deployProxy(iRatioFeedFactory, []);
    await ratioFeedL2.waitForDeployment();
    ratioFeedL2.address = await ratioFeedL2.getAddress();
    await (await ratioFeedL2.updateRatioBatch([iToken.address], [e18])).wait();

    console.log("=== OmniVault");
    const omniVaultFactory = await ethers.getContractFactory("InceptionERC20OmniVault", owner);
    // const omniVault = await upgrades.deployProxy(
    //   omniVaultFactory,
    //   ["OmniVault", operator.address, iToken.address, await sfrxETH.getAddress(), adapterFrax.address],
    //   {
    //     initializer: "init",
    //   },
    // );
    omniVault.address = await omniVault.getAddress();
    await omniVault.setRatioFeed(ratioFeedL2.address);
    await omniVault.setTreasuryAddress(treasury.address);
    await iToken.setVault(omniVault.address);

    //Adapters final setup
    await adapterL1.setTargetReceiver(rebalancer.address);
    await adapterL1.setPeer(FRAX_EID, ethers.zeroPadValue(adapterFrax.address, 32));
    await adapterFrax.setTargetReceiver(omniVault.address);
    await adapterFrax.setPeer(ETH_EID, ethers.zeroPadValue(adapterL1.address, 32));

    await maliciousAdapterL1.setPeer(FRAX_EID, ethers.zeroPadValue(adapterFrax.address, 32));
    await maliciousAdapterL2.setPeer(ETH_EID, ethers.zeroPadValue(adapterL1.address, 32));

    return [
      adapterL1,
      ethEndpoint,
      adapterFrax,
      fraxEndpoint,
      inceptionToken,
      rebalancer,
      ratioFeedL1,
      inceptionVault,
      iToken,
      ratioFeedL2,
      omniVault,
      maliciousAdapterL1,
      maliciousAdapterL2,
    ];
  }

  async function addReplenishBonusToOmniVault(amount) {
    if (amount > 0n) {
      expect(await iToken.balanceOf(signer3.address)).to.be.eq(0n);
      await omniVault.connect(signer3).deposit(signer3.address, { value: amount });
      const shares = await iToken.balanceOf(signer3.address);
      await omniVault.connect(signer3).flashWithdraw(shares, signer3.address);
    }
    return await omniVault.depositBonusAmount();
  }

  function encodePayload(timestamp, ethAmount, totalSupply) {
    const abiCoder = new AbiCoder();
    return abiCoder.encode(["uint256", "uint256", "uint256"], [timestamp, totalSupply, ethAmount]);
  }

  before(async function () {
    [owner, operator, treasury, signer1, signer2, signer3, target] = await ethers.getSigners();
    [
      adapterL1,
      ethEndpoint,
      adapterFrax,
      fraxEndpoint,
      underlyingToken,
      rebalancer,
      ratioFeedL1,
      inceptionVault,
      iToken,
      ratioFeedL2,
      omniVault,
      maliciousAdapterL1,
      maliciousAdapterL2,
    ] = await init(owner, operator);

    snapshot = await takeSnapshot();
  });

  describe("InceptionVault", function () {
    describe("After deployments checks", function () {
      before(async function () {
        await snapshot.restore();
      });

      it("Signer can stake", async function () {
        await inceptionVault.connect(signer1).deposit(2n * e18, signer1);
      });

      it("Get min stake amount", async function () {
        console.log("Min stake amount: ", await inceptionVault.minAmount());
      });
    });
  });

  describe("Bridge base flow", function () {
    const TARGET = e18 / 10n;
    let iTokenOpt: InceptionToken;
    let omniVaultOpt: InceptionERC20OmniVault;
    let ratioFeedL2Opt: InceptionRatioFeed;
    before(async function () {
      await snapshot.restore();

      console.log("============ OmniVault Layer2 Optimism============");
      console.log("=== iTokenOpt");
      const iTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
      iTokenOpt = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
      await iTokenOpt.waitForDeployment();
      iTokenOpt.address = await iTokenOpt.getAddress();

      console.log("=== InceptionRatioFeed");
      const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed", owner);
      ratioFeedL2Opt = await upgrades.deployProxy(iRatioFeedFactory, []);
      ratioFeedL2Opt.waitForDeployment();
      ratioFeedL2Opt.address = await ratioFeedL2Opt.getAddress();
      await (await ratioFeedL2Opt.updateRatioBatch([iTokenOpt.address], [e18])).wait();

      console.log("=== OmniVault");
      const omniVaultFactory = await ethers.getContractFactory("InceptionERC20OmniVault", owner);
      omniVaultOpt = await upgrades.deployProxy(
        omniVaultFactory,
        ["omniVault", operator.address, iTokenOpt.address, adapterFrax.address],
        { initializer: "initialize" },
      );
      omniVaultOpt.address = await omniVaultOpt.getAddress();
      await omniVaultOpt.setRatioFeed(ratioFeedL2Opt.address);
      await omniVaultOpt.setTreasuryAddress(treasury.address);
      await iTokenOpt.setVault(omniVaultOpt.address);

      await omniVault.setTargetFlashCapacity(TARGET);
      await omniVaultOpt.setTargetFlashCapacity(TARGET);

      // await rebalancer.setUpdateable(true);
    });

    it("Sync ratio from ETH to FRAX", async function () {
      const l1Ratio = await underlyingToken.ratio();
      console.log("L1 ratio:", l1Ratio.format());
      await ratioFeedL2.updateRatioBatch([iToken.address], [l1Ratio]);
      await ratioFeedL2Opt.updateRatioBatch([iTokenOpt.address], [l1Ratio]);
      console.log("Frax ratio:", (await omniVault.ratio()).format());
    });

    it("Stake on FRAX", async function () {
      await omniVault.connect(signer1).deposit(TARGET + e18, signer1);
      await omniVault.connect(signer2).deposit(e18, signer2);
      expect(await omniVault.getFreeBalance()).to.be.eq(e18 + e18);
      console.log(await iToken.totalSupply());
      console.log(await omniVault.getFlashCapacity());
      console.log(await omniVault.getFreeBalance());
      console.log(await ethers.provider.getBalance(omniVault.address));
    });

    let mintShares = 0n;
    it("Send info from FRAX", async function () {
      const totalSupply = await iToken.totalSupply();
      mintShares += totalSupply;
      const ethBalance = await omniVault.getFlashCapacity();

      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
      const fee = await omniVault.quoteSendAssetsInfoToL1(options);
      const timestamp = (await time.latest()) + 1;
      const tx = await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });

      const txData = await rebalancer.getTransactionData(FRAX_ID);
      await expect(tx).to.emit(rebalancer, "L2InfoReceived").withArgs(FRAX_ID, timestamp, ethBalance, totalSupply);
      expect(txData.inceptionTokenSupply).to.be.eq(totalSupply);
      expect(txData.underlyingBalance).to.be.eq(ethBalance);
      expect(txData.timestamp).to.be.eq(timestamp);
    });

    it("Add OPT and send data from OPT", async function () {
      await rebalancer.connect(owner).addChainId(OPT_ID);
      // await adapterOpt.connect(owner).setTargetReceiver(omniVaultOpt.address);

      const totalSupply = await iTokenOpt.totalSupply();
      mintShares += totalSupply;
      const ethBalance = await omniVaultOpt.getFlashCapacity();

      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
      const fee = await omniVaultOpt.quoteSendAssetsInfoToL1(options);
      const timestamp = (await time.latest()) + 1;
      const tx = await omniVaultOpt.connect(operator).sendAssetsInfoToL1(options, { value: fee });

      const txData = await rebalancer.getTransactionData(OPT_ID);
      await expect(tx).to.emit(rebalancer, "L2InfoReceived").withArgs(OPT_ID, timestamp, ethBalance, totalSupply);
      expect(txData.inceptionTokenBalance).to.be.eq(totalSupply);
      expect(txData.ethBalance).to.be.eq(ethBalance);
      expect(txData.timestamp).to.be.eq(timestamp);
    });

    it("Update data and mint", async function () {
      const inEthSupplyBefore = await underlyingToken.totalSupply();

      const tx = await rebalancer.connect(signer1).updateTreasuryData();

      const inEthSupplyAfter = await underlyingToken.totalSupply();
      await expect(tx).to.emit(rebalancer, "SyncedSupplyChanged").withArgs(0n, mintShares);
      await expect(tx).to.emit(rebalancer, "TreasuryUpdateMint").withArgs(mintShares);
      await expect(tx).changeTokenBalance(underlyingToken, lockboxAddress, mintShares);
      expect(inEthSupplyAfter - inEthSupplyBefore).to.be.eq(mintShares);
    });

    it("updateTreasuryData reverts when there are no changes", async function () {
      await expect(rebalancer.connect(signer1).updateTreasuryData()).to.be.revertedWithCustomError(
        rebalancer,
        "NoRebalancingRequired",
      );
    });

    it("Send free balance from ARB", async function () {
      const inEthSupplyBefore = await underlyingToken.totalSupply();

      const freeBalance = await omniVault.getFreeBalance();

      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, freeBalance).toHex().toString();
      const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
      const tx = await omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee });

      const inEthSupplyAfter = await underlyingToken.totalSupply();
      console.log(await omniVault.getFlashCapacity());
      console.log(await omniVault.getFreeBalance());
      console.log(await ethers.provider.getBalance(omniVault.address));

      await expect(tx).changeEtherBalance(rebalancer, freeBalance);
      expect(inEthSupplyAfter).to.be.eq(inEthSupplyBefore);
    });

    /**
     * Stake() only transfers Eth to inceptionVault without minting new shares,
     * as the number of shares managed separately by updateTreasuryData()
     */
    it("Stake eth by rebalancer", async function () {
      const inEthSupplyBefore = await underlyingToken.totalSupply();
      const pendingBefore = await inceptionVault.getPending();

      const amount = await ethers.provider.getBalance(rebalancer.address);
      const tx = await rebalancer.connect(operator).stake(amount);

      const pendingAfter = await inceptionVault.getPending();

      await expect(tx).changeEtherBalance(inceptionVault, amount);
      const inEthSupplyAfter = await underlyingToken.totalSupply();
      expect(inEthSupplyAfter).to.be.eq(inEthSupplyBefore);
      expect(pendingAfter - pendingBefore).to.be.eq(amount);
    });

    let burntShares;
    it("Flash withdraw on ARB", async function () {
      const iTokenSupplyBefore = await iToken.totalSupply();

      burntShares = await omniVault.convertToShares(await omniVault.getFlashCapacity());
      await omniVault.connect(signer2).flashWithdraw(burntShares, signer2.address);

      console.log(await omniVault.getFlashCapacity());
      console.log(await omniVault.getFreeBalance());
      console.log(await ethers.provider.getBalance(omniVault.address));

      const iTokenSupplyAfter = await iToken.totalSupply();
      expect(iTokenSupplyBefore - iTokenSupplyAfter).to.be.eq(burntShares);
    });

    it("Update data and burn", async function () {
      mintShares = await iToken.totalSupply();
      const ethBalance = await omniVault.getFlashCapacity();

      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
      const fee = await omniVault.quoteSendAssetsInfoToL1(options);
      const timestamp = (await time.latest()) + 1;
      let tx = await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });
      await expect(tx).to.emit(omniVault, "MessageToL1Sent").withArgs(mintShares, ethBalance);

      const txData = await rebalancer.getTransactionData(ARB_ID);
      await expect(tx).to.emit(rebalancer, "L2InfoReceived").withArgs(ARB_ID, timestamp, ethBalance, mintShares);
      expect(txData.inceptionTokenBalance).to.be.eq(mintShares);
      expect(txData.ethBalance).to.be.eq(ethBalance);
      expect(txData.timestamp).to.be.eq(timestamp);

      const inEthSupplyBefore = await underlyingToken.totalSupply();
      const syncBefore = await rebalancer.syncedSupply();
      tx = await rebalancer.connect(signer1).updateTreasuryData();

      const inEthSupplyAfter = await underlyingToken.totalSupply();
      await expect(tx)
        .to.emit(rebalancer, "SyncedSupplyChanged")
        .withArgs(syncBefore, syncBefore - burntShares);
      await expect(tx).to.emit(rebalancer, "TreasuryUpdateBurn").withArgs(burntShares);
      await expect(tx).changeTokenBalance(underlyingToken, lockboxAddress, -burntShares);
      expect(inEthSupplyBefore - inEthSupplyAfter).to.be.eq(burntShares);
    });

    it("Deposit on ARB", async function () {
      const depositBonus = await omniVault.depositBonusAmount();
      const amount = e18 * 2n;
      const expectedShars = await omniVault.convertToShares(amount + depositBonus);
      const balanceBefore = await iToken.balanceOf(signer2);

      let tx = await omniVault.connect(signer2).deposit(signer2, { value: amount });

      const balanceAfter = await iToken.balanceOf(signer2);

      expect(balanceAfter - balanceBefore).to.be.closeTo(expectedShars, 1n);
      mintShares = balanceAfter - balanceBefore;
      console.log(await omniVault.getFlashCapacity());
      console.log(await omniVault.getFreeBalance());
      console.log(await ethers.provider.getBalance(omniVault.address));
    });

    it("Send free balance from ARB", async function () {
      const freeBalance = await omniVault.getFreeBalance();
      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, freeBalance).toHex().toString();
      const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
      let tx = await omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee });

      await expect(tx).changeEtherBalance(rebalancer, freeBalance);
      console.log(await omniVault.getFlashCapacity());
      console.log(await omniVault.getFreeBalance());
      console.log(await ethers.provider.getBalance(omniVault.address));

      const inEthSupplyBefore = await underlyingToken.totalSupply();
      const amount = await ethers.provider.getBalance(rebalancer.address);
      tx = await rebalancer.connect(operator).stake(amount);

      await expect(tx).changeEtherBalance(inceptionVault, amount);
      const inEthSupplyAfter = await underlyingToken.totalSupply();
      expect(inEthSupplyAfter).to.be.eq(inEthSupplyBefore);
    });

    it("Send info and update data", async function () {
      const totalSupplyArb = await iToken.totalSupply();
      const ethBalance = await omniVault.getFlashCapacity();

      const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
      const fee = await omniVault.quoteSendAssetsInfoToL1(options);
      const timestamp = (await time.latest()) + 1;
      let tx = await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });

      const txData = await rebalancer.getTransactionData(ARB_ID);
      await expect(tx).to.emit(rebalancer, "L2InfoReceived").withArgs(ARB_ID, timestamp, ethBalance, totalSupplyArb);
      expect(txData.inceptionTokenBalance).to.be.eq(totalSupplyArb);
      expect(txData.ethBalance).to.be.eq(ethBalance);
      expect(txData.timestamp).to.be.eq(timestamp);

      const inEthSupplyBefore = await underlyingToken.totalSupply();
      const syncBefore = await rebalancer.syncedSupply();
      tx = await rebalancer.connect(signer1).updateTreasuryData();

      const inEthSupplyAfter = await underlyingToken.totalSupply();
      const syncAfter = await rebalancer.syncedSupply();
      await expect(tx)
        .to.emit(rebalancer, "SyncedSupplyChanged")
        .withArgs(syncBefore, syncBefore + mintShares);
      await expect(tx).to.emit(rebalancer, "TreasuryUpdateMint").withArgs(mintShares);
      await expect(tx).changeTokenBalance(underlyingToken, lockboxAddress, mintShares);
      expect(inEthSupplyAfter - inEthSupplyBefore).to.be.eq(mintShares);
      expect(syncAfter - syncBefore).to.be.eq(mintShares);
    });

    it("Stake to restaking pool", async function () {
      const amount = await inceptionVault.availableToStake();
      const expectedShares = await underlyingToken.convertToShares(amount);
      const totalSupplyBefore = await underlyingToken.totalSupply();
      const pendingBefore = await inceptionVault.getPending();

      let tx = await inceptionVault.connect(signer1)["stake()"]({ value: amount });

      const totalSupplyAfter = await underlyingToken.totalSupply();
      const pendingAfter = await inceptionVault.getPending();

      await expect(tx).changeEtherBalance(inceptionVault, amount);
      await expect(tx).changeTokenBalance(underlyingToken, signer1, expectedShares);
      expect(totalSupplyAfter - totalSupplyBefore).to.be.eq(expectedShares);
      expect(pendingAfter - pendingBefore).to.be.eq(amount);
    });
  });
  return;
  describe("Rebalancer", function () {
    describe("Deployments checks", function () {
      let NativeRebalancer;
      before(async function () {
        await snapshot.restore();
        NativeRebalancer = await ethers.getContractFactory("NativeRebalancer");
      });

      it("MULTIPLIER", async function () {
        expect(await rebalancer.MULTIPLIER()).to.be.eq(e18);
      });

      it("Inception token address", async function () {
        expect(await rebalancer.inceptionToken()).to.be.eq(underlyingToken.address);
      });

      it("Lockbox address", async function () {
        expect(await rebalancer.lockboxAddress()).to.be.eq(lockboxAddress);
      });

      it("Restaking pool address", async function () {
        expect(await rebalancer.liqPool()).to.be.eq(inceptionVault.address);
      });

      it("Default adapter", async function () {
        expect(await rebalancer.defaultAdapter()).to.be.eq(adapterL1.address);
      });

      it("Ratio feed address", async function () {
        expect(await rebalancer.ratioFeed()).to.be.eq(ratioFeedL1.address);
      });

      it("Operator address", async function () {
        expect(await rebalancer.operator()).to.be.eq(operator.address);
      });

      it("Owner", async function () {
        expect(await rebalancer.owner()).to.be.eq(owner.address);
      });

      const args = [
        {
          name: "invalid iToken address",
          args: () => [
            ethers.ZeroAddress,
            lockboxAddress,
            inceptionVault.address,
            adapterL1.address,
            ratioFeedL1.address,
            operator.address,
          ],
        },
        {
          name: "invalid lockbox address",
          args: () => [
            iToken.address,
            ethers.ZeroAddress,
            inceptionVault.address,
            adapterL1.address,
            ratioFeedL1.address,
            operator.address,
          ],
        },
        {
          name: "invalid restaking pool address",
          args: () => [
            iToken.address,
            lockboxAddress,
            ethers.ZeroAddress,
            adapterL1.address,
            ratioFeedL1.address,
            operator.address,
          ],
        },
        {
          name: "invalid adapter address",
          args: () => [
            iToken.address,
            lockboxAddress,
            inceptionVault.address,
            ethers.ZeroAddress,
            ratioFeedL1.address,
            operator.address,
          ],
        },
        {
          name: "invalid ratio feed address",
          args: () => [
            iToken.address,
            lockboxAddress,
            inceptionVault.address,
            adapterL1.address,
            ethers.ZeroAddress,
            operator.address,
          ],
        },
        {
          name: "invalid operator address",
          args: () => [
            iToken.address,
            lockboxAddress,
            inceptionVault.address,
            adapterL1.address,
            ratioFeedL1.address,
            ethers.ZeroAddress,
          ],
        },
      ];

      args.forEach(function (arg) {
        it(`NativeRebalancer: ${arg.name}`, async function () {
          const args = arg.args();
          await expect(upgrades.deployProxy(NativeRebalancer, args)).to.be.reverted;
        });
      });

      it("Synced Supply", async function () {
        expect(await rebalancer.syncedSupply()).to.be.eq(0n);
      });
    });

    describe("Getters and setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await rebalancer.connect(owner).addChainId(OPT_ID);
      });

      const setters = [
        {
          name: "default adapter address",
          setter: "setDefaultAdapter",
          getter: "defaultAdapter",
          event: "DefaultBridgeChanged",
        },
        {
          name: "Inception token address",
          setter: "setInceptionToken",
          getter: "inceptionToken",
          event: "InceptionTokenChanged",
        },
        {
          name: "restaking pool address",
          setter: "setLiqPool",
          getter: "liqPool",
          event: "LiqPoolChanged",
        },
        {
          name: "lockbox address",
          setter: "setLockboxAddress",
          getter: "lockboxAddress",
          event: "LockboxChanged",
        },
        {
          name: "operator address",
          setter: "setOperator",
          getter: "operator",
          event: "OperatorChanged",
        },
      ];

      setters.forEach(function (arg) {
        it(`Set new ${arg.name}`, async function () {
          const prevValue = await rebalancer[arg.getter]();
          const newValue = ethers.Wallet.createRandom().address;
          await expect(rebalancer[arg.setter](newValue)).to.emit(rebalancer, arg.event).withArgs(prevValue, newValue);

          expect(await rebalancer[arg.getter]()).to.be.eq(newValue);
        });

        it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
          const newValue = ethers.Wallet.createRandom().address;
          await expect(rebalancer.connect(signer1)[arg.setter](newValue))
            .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
            .withArgs(signer1.address);
        });

        it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
          const newValue = ethers.ZeroAddress;
          await expect(rebalancer[arg.setter](newValue)).to.be.revertedWithCustomError(
            rebalancer,
            "SettingZeroAddress",
          );
        });
      });

      it("addChainId owner can", async function () {
        let chain = randomBI(4);
        await expect(rebalancer.connect(owner).addChainId(chain)).to.emit(rebalancer, "ChainIdAdded").withArgs(chain);
        expect(await rebalancer.chainIds(2n)).to.be.eq(chain);
      });

      it("addChainId skips if the chain has been added already", async function () {
        let chain = randomBI(4);
        await rebalancer.connect(owner).addChainId(chain);
        await expect(rebalancer.connect(owner).addChainId(chain)).to.not.emit(rebalancer, "ChainIdAdded");
      });

      it("addChainId reverts when called by not an owner", async function () {
        await expect(rebalancer.connect(signer1).addChainId(randomBI(4)))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      it("deleteChainId operator can delete the 1st chain in the list", async function () {
        const chain = ARB_ID;
        await expect(rebalancer.connect(owner).deleteChainId(chain))
          .to.emit(rebalancer, "ChainIdDeleted")
          .withArgs(chain, 0n);
        expect(await rebalancer.chainIds(0n)).to.be.eq(OPT_ID);
        await expect(rebalancer.chainIds(1n)).to.be.reverted;
      });

      it("deleteChainId owner can delete the last chain in the list", async function () {
        const chain = OPT_ID;
        await expect(rebalancer.connect(owner).deleteChainId(chain))
          .to.emit(rebalancer, "ChainIdDeleted")
          .withArgs(chain, 1n);
        expect(await rebalancer.chainIds(0n)).to.be.eq(ARB_ID);
        await expect(rebalancer.chainIds(1n)).to.be.reverted;
      });

      it("deleteChainId reverts when chain does not exist", async function () {
        let chain = randomBI(4);
        await expect(rebalancer.connect(owner).deleteChainId(chain))
          .to.be.revertedWithCustomError(rebalancer, "ChainIdNotFound")
          .withArgs(chain);
      });

      it("addChainId reverts when called by not an owner", async function () {
        await expect(rebalancer.connect(signer1).deleteChainId(ARB_ID))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      it("addAdapter for a new chain", async function () {
        let adapter = ethers.Wallet.createRandom().address;
        let chain = randomBI(4);
        await expect(rebalancer.connect(owner).addAdapter(chain, adapter))
          .to.emit(rebalancer, "AdapterAdded")
          .withArgs(chain, adapter)
          .and.to.emit(rebalancer, "ChainIdAdded")
          .withArgs(chain);

        const [adapterAddress, isDefault] = await rebalancer.getAdapter(chain);
        expect(adapterAddress).to.be.eq(adapter);
        expect(isDefault).to.be.false;
      });

      it("addAdapter for existing chain", async function () {
        let adapter = ethers.Wallet.createRandom().address;
        let chain = ARB_ID;
        await expect(rebalancer.connect(owner).addAdapter(chain, adapter))
          .to.emit(rebalancer, "AdapterAdded")
          .withArgs(chain, adapter)
          .and.to.not.emit(rebalancer, "ChainIdAdded");

        const [adapterAddress, isDefault] = await rebalancer.getAdapter(chain);
        expect(adapterAddress).to.be.eq(adapter);
        expect(isDefault).to.be.false;
      });

      it("addAdapter reverts when adapter address is 0", async function () {
        let adapter = ethers.ZeroAddress;
        let chain = randomBI(4);
        await expect(rebalancer.connect(owner).addAdapter(chain, adapter)).to.be.revertedWithCustomError(
          rebalancer,
          "SettingZeroAddress",
        );
      });

      it("addAdapter reverts when called by not an owner", async function () {
        let adapter = ethers.Wallet.createRandom().address;
        let chain = randomBI(4);
        await expect(rebalancer.connect(signer1).addAdapter(chain, adapter))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      it("getAdapter returns default adapter if no other set", async function () {
        const [adapterAddress, isDefault] = await rebalancer.getAdapter(ARB_ID);
        expect(adapterAddress).to.be.eq(adapterL1.address);
        expect(isDefault).to.be.true;
      });

      it("getTransactionData when there is no data for the chain", async function () {
        let chain = randomBI(4);
        const txData = await rebalancer.getTransactionData(chain);
        expect(txData.timestamp).to.be.eq(0n);
        expect(txData.ethBalance).to.be.eq(0n);
        expect(txData.inceptionTokenBalance).to.be.eq(0n);
      });

      it("Enable and disable update", async function () {
        expect(await rebalancer.updateable()).to.be.false;

        await expect(rebalancer.setUpdateable(true)).to.emit(rebalancer, "UpdateableChanged").withArgs(false, true);
        expect(await rebalancer.updateable()).to.be.true;

        await expect(rebalancer.setUpdateable(false)).to.emit(rebalancer, "UpdateableChanged").withArgs(true, false);
        expect(await rebalancer.updateable()).to.be.false;
      });

      it("setUpdateable reverts when called by not an owner", async function () {
        await expect(rebalancer.connect(signer1).setUpdateable(true))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      it("setSyncedSupply owner can", async function () {
        const prevValue = await rebalancer.syncedSupply();
        const newValue = randomBI(18);
        await expect(rebalancer.setSyncedSupply(newValue))
          .to.emit(rebalancer, "SyncedSupplyChanged")
          .withArgs(prevValue, newValue);

        expect(await rebalancer.syncedSupply()).to.be.eq(newValue);
      });

      it("setSyncedSupply reverts when called by not an owner", async function () {
        const newValue = randomBI(18);
        await expect(rebalancer.connect(signer1).setSyncedSupply(newValue))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });
    });

    describe("Update data", function () {
      let currentArbAmount = 0n;
      let currentArbSupply = 0n;
      let currentOptAmount = 0n;
      let currentOptSupply = 0n;
      let initialLockBoxBalance;

      before(async function () {
        await snapshot.restore();
        await rebalancer.connect(owner).addChainId(OPT_ID);
        initialLockBoxBalance = await underlyingToken.balanceOf(lockboxAddress);
        await rebalancer.setUpdateable(true);
      });

      it("Reverts when there is no data for one of the chains", async function () {
        //Call when there is no data at all
        await expect(rebalancer.updateTreasuryData()).to.revertedWithCustomError(
          rebalancer,
          "MissingOneOrMoreL2Transactions",
        );

        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        const balance = randomBI(19);
        const totalSupply = randomBI(19);
        const message = encodePayload(timestamp, balance, totalSupply);

        //Send data for the 1 chain of 2
        const fees = await adapterFrax.quote(message, options);
        await adapterFrax.sendDataL1(message, options, { value: fees });
        await expect(rebalancer.updateTreasuryData())
          .to.revertedWithCustomError(rebalancer, "MissingOneOrMoreL2Transactions")
          .withArgs(OPT_ID);
      });

      const args = [
        {
          name: "Increase amount and supply ARB and OPT",
          arb: {
            l2BalanceDiff: () => ethers.parseEther("1.5"),
            l2TotalSupplyDiff: () => e18,
          },
          opt: {
            l2BalanceDiff: () => ethers.parseEther("1.5"),
            l2TotalSupplyDiff: () => e18,
          },
        },
        {
          name: "Increase only underlyingToken supply ARB",
          arb: {
            l2BalanceDiff: () => e18,
            l2TotalSupplyDiff: () => ethers.parseEther("1.5"),
          },
        },
        {
          name: "Increase only underlyingToken supply OPT",
          opt: {
            l2BalanceDiff: () => e18,
            l2TotalSupplyDiff: () => ethers.parseEther("1.5"),
          },
        },
        {
          name: "Decrease amount and total supply ARB only",
          arb: {
            l2BalanceDiff: () => -ethers.parseEther("0.5"),
            l2TotalSupplyDiff: () => -ethers.parseEther("0.5"),
          },
        },
        {
          name: "Decrease amount and total supply OPT only",
          opt: {
            l2BalanceDiff: () => -ethers.parseEther("0.5"),
            l2TotalSupplyDiff: () => -ethers.parseEther("0.5"),
          },
        },
        {
          name: "Decrease only total supply ARB abd OPT",
          arb: {
            l2BalanceDiff: () => 0n,
            l2TotalSupplyDiff: () => -e18,
          },
          opt: {
            l2BalanceDiff: () => 0n,
            l2TotalSupplyDiff: () => -e18,
          },
        },
        {
          name: "Increase for ARB and decrease for OPT for the same amount",
          arb: {
            l2BalanceDiff: () => e18,
            l2TotalSupplyDiff: () => e18,
          },
          opt: {
            l2BalanceDiff: () => -ethers.parseEther("0.5"),
            l2TotalSupplyDiff: () => -ethers.parseEther("0.5"),
          },
        },
        {
          name: "Decrease to 0 ARB",
          arb: {
            l2BalanceDiff: () => -currentArbSupply,
            l2TotalSupplyDiff: () => -currentArbSupply,
          },
        },
        {
          name: "Decrease to 0 OPT",
          opt: {
            l2BalanceDiff: () => -currentOptSupply,
            l2TotalSupplyDiff: () => -currentOptSupply,
          },
        },
      ];

      args.forEach(function (arg) {
        it(`updateTreasuryData: ${arg.name}`, async () => {
          const block = await ethers.provider.getBlock("latest");
          const timestamp = block.timestamp;
          let expectedTotalSupplyDiff = 0n;
          if (arg.arb) {
            expectedTotalSupplyDiff += arg.arb.l2TotalSupplyDiff();
            currentArbAmount += arg.arb.l2BalanceDiff();
            currentArbSupply += arg.arb.l2TotalSupplyDiff();
            await adapterFrax.sendData(timestamp, currentArbAmount, currentArbSupply);
          }
          if (arg.opt) {
            expectedTotalSupplyDiff += arg.opt.l2TotalSupplyDiff();
            currentOptAmount += arg.opt.l2BalanceDiff();
            currentOptSupply += arg.opt.l2TotalSupplyDiff();
            await adapterOpt.sendData(timestamp, currentOptAmount, currentOptSupply);
          }
          const totalSupplyBefore = await underlyingToken.totalSupply();
          const lockboxBalanceBefore = await underlyingToken.balanceOf(lockboxAddress);
          const syncedSupplyBefore = await rebalancer.syncedSupply();

          let tx = await rebalancer.updateTreasuryData();
          await expect(tx)
            .to.emit(rebalancer, "SyncedSupplyChanged")
            .withArgs(syncedSupplyBefore, syncedSupplyBefore + expectedTotalSupplyDiff);

          const totalSupplyAfter = await underlyingToken.totalSupply();
          const lockboxBalanceAfter = await underlyingToken.balanceOf(lockboxAddress);
          const syncedSupplyAfter = await rebalancer.syncedSupply();

          console.log("Total supply diff:", (totalSupplyAfter - totalSupplyBefore).format());
          console.log("Lockbox balance diff:", (lockboxBalanceAfter - lockboxBalanceBefore).format());
          console.log("Synced supply diff:", (syncedSupplyAfter - syncedSupplyBefore).format());

          expect(totalSupplyAfter - totalSupplyBefore).to.be.eq(expectedTotalSupplyDiff);
          expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.eq(expectedTotalSupplyDiff);
          expect(syncedSupplyAfter - syncedSupplyBefore).to.be.eq(expectedTotalSupplyDiff);
          if (expectedTotalSupplyDiff > 0n) {
            console.log("Mint");
            await expect(tx).emit(rebalancer, "TreasuryUpdateMint").withArgs(expectedTotalSupplyDiff);
          }
          if (expectedTotalSupplyDiff == 0n) {
            console.log("No mint, no burn");
            await expect(tx)
              .to.not.emit(rebalancer, "TreasuryUpdateMint")
              .and.to.not.emit(rebalancer, "TreasuryUpdateBurn");
          }
          if (expectedTotalSupplyDiff < 0n) {
            console.log("Burn");
            await expect(tx).emit(rebalancer, "TreasuryUpdateBurn").withArgs(-expectedTotalSupplyDiff);
          }
        });
      });

      it("Lockbox balance is the ame after all", async function () {
        expect(await underlyingToken.balanceOf(lockboxAddress)).to.be.eq(initialLockBoxBalance);
      });

      it("updateTreasuryData reverts when total supply is the same", async function () {
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        await adapterFrax.sendData(timestamp, e18, e18);
        await adapterOpt.sendData(timestamp, e18, e18);
        await rebalancer.updateTreasuryData();

        await expect(rebalancer.updateTreasuryData()).to.be.revertedWithCustomError(
          rebalancer,
          "NoRebalancingRequired",
        );
      });

      it("Reverts when updateable is false", async function () {
        await snapshot.restore();
        await expect(rebalancer.updateTreasuryData()).to.revertedWithCustomError(rebalancer, "TreasuryUpdatesPaused");
      });

      it("underlyingToken leftover on rebalancer will be transferred to the lockbox", async function () {
        await snapshot.restore();
        await rebalancer.setUpdateable(true);
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        await inceptionVault.connect(signer1)["stake()"]({ value: 2n * e18 });

        const totalSupplyBefore = await underlyingToken.totalSupply();
        const lockboxBalanceBefore = await underlyingToken.balanceOf(lockboxAddress);
        //Report L2 info
        const inEthChange = e18;
        const supplyChange = e18;
        await adapterFrax.sendData(timestamp, inEthChange, supplyChange);
        await adapterOpt.sendData(timestamp, inEthChange, supplyChange);

        const amount = randomBI(17);
        await underlyingToken.connect(signer1).transfer(rebalancer.address, amount);

        await expect(rebalancer.updateTreasuryData())
          .to.emit(rebalancer, "InceptionTokenDepositedToLockbox")
          .withArgs(amount);
        console.log(`Total supply: ${(await underlyingToken.totalSupply()).format()}`);

        const totalSupplyAfter = await underlyingToken.totalSupply();
        const lockboxBalanceAfter = await underlyingToken.balanceOf(lockboxAddress);
        // expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(supplyChange * 2n, 1n);
        expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(supplyChange, 1n);
        // expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.closeTo(supplyChange * 2n + amount, 1n);
        expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.closeTo(supplyChange + amount, 1n);
      });
    });

    describe("Stake", function () {
      beforeEach(async function () {
        await snapshot.restore();
        await rebalancer.connect(owner).addChainId(OPT_ID);
      });

      const args = [
        {
          name: "Part of the balance",
          balance: async () => await inceptionVault.availableToStake(),
          amount: async amount => amount / 2n,
        },
        {
          name: "All balance",
          balance: async () => await inceptionVault.availableToStake(),
          amount: async amount => amount,
        },
        {
          name: "Restaking pool min amount",
          balance: async () => await inceptionVault.availableToStake(),
          amount: async () => await inceptionVault.getMinStake(),
        },
        {
          name: "Less than restaking pool min amount",
          balance: async () => await inceptionVault.availableToStake(),
          amount: async () => (await inceptionVault.getMinStake()) - 1n,
        },
      ];

      args.forEach(function (arg) {
        it(`${arg.name}`, async function () {
          const balance = await arg.balance();
          await signer1.sendTransaction({ value: balance, to: rebalancer.address });

          const amount = await arg.amount(balance);
          const shares = await underlyingToken.convertToShares(amount);
          const lockboxInEthBalanceBefore = await underlyingToken.balanceOf(lockboxAddress);

          const tx = await rebalancer.connect(operator).stake(amount);
          await expect(tx).emit(inceptionVault, "Received").withArgs(rebalancer.address, amount);

          const lockboxInEthBalanceAfter = await underlyingToken.balanceOf(lockboxAddress);
          console.log("Signer eth balance after: ", await ethers.provider.getBalance(signer1.address));
          console.log("Restaking pool eth balance: ", await ethers.provider.getBalance(inceptionVault.address));
          console.log("lockbox underlyingToken balance: ", await underlyingToken.balanceOf(lockboxAddress));

          //No new shares minted
          expect(lockboxInEthBalanceAfter).to.be.eq(lockboxInEthBalanceBefore);
          expect(await underlyingToken.balanceOf(rebalancer.address)).to.be.eq(0n);
        });
      });

      it("Reverts when amount > available to stake from restaking pool", async function () {
        const amount = (await inceptionVault.availableToStake()) + 1n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount)).to.revertedWithCustomError(
          rebalancer,
          "StakeAmountExceedsMaxTVL",
        );
      });

      it("Reverts when amount > eth balance", async function () {
        const amount = (await inceptionVault.availableToStake()) / 2n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount + 1n)).to.revertedWithCustomError(
          rebalancer,
          "StakeAmountExceedsEthBalance",
        );
      });

      it.skip("Reverts when amount < restaking pool min stake", async function () {
        const amount = (await inceptionVault.getMinStake()) - 1n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount)).to.revertedWithCustomError(
          inceptionVault,
          "PoolStakeAmLessThanMin",
        );
      });

      it("Reverts when called by not an operator", async function () {
        const amount = (await inceptionVault.availableToStake()) / 2n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(signer1).stake(amount)).to.revertedWithCustomError(rebalancer, "OnlyOperator");
      });
    });

    describe("sendEthToL2", function () {
      beforeEach(async function () {
        await snapshot.restore();
        const balance = await inceptionVault.availableToStake();
        await signer1.sendTransaction({ value: balance, to: rebalancer.address });
      });

      const args = [
        {
          name: "Part of the balance to ARB",
          amount: async amount => amount / 2n,
          chainId: ARB_ID,
          adapter: () => adapterFrax,
          sender: () => operator,
        },
        {
          name: "Part of the balance to ARB by owner",
          amount: async amount => amount / 2n,
          chainId: ARB_ID,
          adapter: () => adapterFrax,
          sender: () => owner,
        },
        {
          name: "Part of the balance to OPT",
          amount: async amount => amount / 2n,
          chainId: OPT_ID,
          adapter: () => adapterOpt,
          sender: () => operator,
        },
        {
          name: "All balance to ARB",
          amount: async amount => amount,
          chainId: ARB_ID,
          adapter: () => adapterFrax,
          sender: () => operator,
        },
        {
          name: "All balance to OPT",
          amount: async amount => amount,
          chainId: OPT_ID,
          adapter: () => adapterOpt,
          sender: () => operator,
        },
      ];

      args.forEach(function (arg) {
        it(`${arg.name}`, async function () {
          const balance = await ethers.provider.getBalance(rebalancer.address);
          const amount = await arg.amount(balance);

          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fees = await rebalancer.quoteSendEthToL2(arg.chainId, options);
          const tx = await rebalancer.connect(arg.sender()).sendEthToL2(arg.chainId, amount, options, { value: fees });
          await expect(tx).to.emit(adapterL1, "CrossChainMessageSent");
          await expect(tx).to.changeEtherBalance(omniVault, amount);
          await expect(tx).to.changeEtherBalance(rebalancer, -amount);
          await expect(tx).to.changeEtherBalance(arg.sender(), -fees, { includeFee: false });
        });
      });

      it("Reverts when amount > eth balance", async function () {
        const amount = (await ethers.provider.getBalance(rebalancer.address)) + 1n;
        const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
        const fees = await rebalancer.quoteSendEthToL2(ARB_ID, options);
        await expect(
          rebalancer.connect(operator).sendEthToL2(ARB_ID, amount, options, { value: fees }),
        ).to.revertedWithCustomError(rebalancer, "SendAmountExceedsEthBalance");
      });

      it("Reverts when called by not an operator", async function () {
        const amount = await ethers.provider.getBalance(rebalancer.address);
        const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
        const fees = await rebalancer.quoteSendEthToL2(ARB_ID, options);
        await expect(
          rebalancer.connect(signer1).sendEthToL2(ARB_ID, amount, options, { value: fees }),
        ).to.revertedWithCustomError(rebalancer, "OnlyOperator");
      });

      it("Reverts when there is no adapter for the chain", async function () {
        const amount = await ethers.provider.getBalance(rebalancer.address);
        const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
        const fees = await rebalancer.quoteSendEthToL2(ARB_ID, options);
        await expect(
          rebalancer.connect(operator).sendEthToL2(randomBI(8), amount, options, { value: fees }),
        ).to.revertedWithCustomError(adapterFrax, "NoPeer");
      });
    });

    describe("handleL2Info", function () {
      it("handleL2Info reverts when called by not an adapter", async function () {
        const block = await ethers.provider.getBlock("latest");
        const chainId = ARB_ID;
        const timestamp = block.timestamp;
        const balance = e18;
        const totalSupply = e18;

        await expect(
          rebalancer.connect(owner).handleL2Info(chainId, timestamp, balance, totalSupply),
        ).to.be.revertedWithCustomError(rebalancer, "OnlyAdapter");
      });
    });
  });

  describe("Adapters", function () {
    before(async function () {
      await snapshot.restore();
    });

    describe("Deployment", function () {
      let LZCrossChainAdapterL1;
      let LZCrossChainAdapterL2;
      before(async function () {
        LZCrossChainAdapterL1 = await ethers.getContractFactory("LZCrossChainAdapterL1");
        LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");
      });

      const argsL1 = [
        {
          name: "invalid endpoint address",
          args: () => [ethers.ZeroAddress, owner.address, eIds, chainIds],
        },
        {
          name: "invalid delegator address",
          args: () => [ethEndpoint.address, ethers.ZeroAddress, eIds, chainIds],
        },
        {
          name: "Id arrays lengths do not match",
          args: () => [ethEndpoint.address, owner.address, [ARB_EID], [ARB_ID, OPT_ID]],
        },
      ];

      argsL1.forEach(function (arg) {
        it(`LZCrossChainAdapterL1: ${arg.name}`, async function () {
          const args = arg.args();
          await expect(upgrades.deployProxy(LZCrossChainAdapterL1, args)).to.be.reverted;
        });
      });

      const argsL2 = [
        {
          name: "invalid endpoint address",
          args: () => [ethers.ZeroAddress, owner.address, ETH_ID, eIds, chainIds],
        },
        {
          name: "invalid delegator address",
          args: () => [ethEndpoint.address, ethers.ZeroAddress, ETH_ID, eIds, chainIds],
        },
        {
          name: "Id arrays lengths do not match",
          args: () => [ethEndpoint.address, owner.address, ETH_ID, [ARB_EID], [ARB_ID, OPT_ID]],
        },
      ];

      argsL2.forEach(function (arg) {
        it(`LZCrossChainAdapterL2: ${arg.name}`, async function () {
          const args = arg.args();
          await expect(upgrades.deployProxy(LZCrossChainAdapterL2, args)).to.be.reverted;
        });
      });
    });

    //=== Getters and setters
    const adapters = [
      {
        name: "layer1",
        adapter: () => adapterL1,
        endpoint: () => ethEndpoint,
      },
      {
        name: "layer2",
        adapter: () => adapterFrax,
        endpoint: () => arbEndpoint,
      },
    ];
    adapters.forEach(function (adapterArg) {
      let adapter;
      describe(`Getters and setters ${adapterArg.name}`, function () {
        beforeEach(async function () {
          await snapshot.restore();
          adapter = adapterArg.adapter();
        });

        const setters = [
          {
            name: "receiver address",
            setter: "setTargetReceiver",
            getter: "targetReceiver",
            event: "TargetReceiverChanged",
          },
        ];

        setters.forEach(function (setterArg) {
          it(`Set new ${setterArg.name}`, async function () {
            const prevValue = await adapter[setterArg.getter]();
            const newValue = ethers.Wallet.createRandom().address;

            await expect(adapter[setterArg.setter](newValue))
              .to.emit(adapter, setterArg.event)
              .withArgs(prevValue, newValue);
            expect(await adapter[setterArg.getter]()).to.be.eq(newValue);
          });

          it(`Reverts: ${setterArg.setter} when called by not an owner`, async function () {
            const newValue = ethers.Wallet.createRandom().address;
            await expect(adapter.connect(signer1)[setterArg.setter](newValue)).to.be.revertedWithCustomError(
              adapter,
              "OwnableUnauthorizedAccount",
            );
          });

          it(`Reverts: ${setterArg.setter} new value is 0 address`, async function () {
            const newValue = ethers.ZeroAddress;
            await expect(adapter[setterArg.setter](newValue)).to.be.revertedWithCustomError(
              adapter,
              "SettingZeroAddress",
            );
          });
        });

        it("setPeer sets target address by chain", async function () {
          const eid = randomBI(8);
          const target = ethers.Wallet.createRandom();
          const peer = ethers.zeroPadValue(target.address, 32);

          await expect(adapter.setPeer(eid, peer)).to.emit(adapter, "PeerSet").withArgs(eid, peer);
          expect(await adapter.peers(eid)).to.be.eq(peer);
        });

        it("setPeer reverts when called by not an owner", async function () {
          const eid = randomBI(8);
          const target = ethers.Wallet.createRandom();
          const peer = ethers.zeroPadValue(target.address, 32);

          await expect(adapter.connect(signer1).setPeer(eid, peer)).to.be.revertedWithCustomError(
            adapter,
            "OwnableUnauthorizedAccount",
          );
        });

        it("setChainIdFromEid maps chaind id by eid", async function () {
          const eid = randomBI(8);
          const chainId = randomBI(8);

          await expect(adapter.setChainIdFromEid(eid, chainId)).to.emit(adapter, "ChainIdAdded").withArgs(chainId);
          expect(await adapter.getChainIdFromEid(eid)).to.be.eq(chainId);
          expect(await adapter.getEidFromChainId(chainId)).to.be.eq(eid);
        });

        it("setChainIdFromEid reverts when called by not an owner", async function () {
          const eid = randomBI(8);
          const chainId = randomBI(8);

          await expect(adapter.connect(signer1).setChainIdFromEid(eid, chainId)).to.be.revertedWithCustomError(
            adapter,
            "OwnableUnauthorizedAccount",
          );
        });

        it("Owner", async function () {
          expect(await adapter.owner()).to.be.eq(owner.address);
        });

        it("Transfer ownership in two steps", async function () {
          // Generate a new owner address and connect it to the provider
          const newOwner = ethers.Wallet.createRandom().connect(ethers.provider);

          // Fund newOwner with some ETH from the current owner
          await owner.sendTransaction({
            to: newOwner.address,
            value: ethers.parseEther("1"), // Transfer 1 ETH for gas fees
          });

          // Initiate ownership transfer (step 1)
          await expect(adapter.transferOwnership(newOwner.address))
            .to.emit(adapter, "OwnershipTransferStarted")
            .withArgs(owner.address, newOwner.address);

          // Ensure that the new owner is set as the pending owner
          expect(await adapter.pendingOwner()).to.equal(newOwner.address);

          // Simulate the new owner accepting the ownership (step 2)
          await expect(adapter.connect(newOwner).acceptOwnership())
            .to.emit(adapter, "OwnershipTransferred")
            .withArgs(owner.address, newOwner.address);

          // Check that the ownership transfer is complete
          expect(await adapter.owner()).to.equal(newOwner.address);
        });

        it("Endpoint", async function () {
          const endpoint = adapterArg.endpoint();
          expect(await adapter.endpoint()).to.be.eq(endpoint.address);
        });
      });
    });

    //=== Send eth between layers
    const directions = [
      {
        name: "L2 -> L1",
        fromAdapter: () => adapterFrax,
        fromEndpoint: () => arbEndpoint,
        fromChainID: ARB_ID,
        fromChainEID: ARB_EID,
        toAdapter: () => adapterL1,
        toEndpoint: () => ethEndpoint,
        toChainID: ETH_ID,
        target: () => rebalancer,
        maliciousAdapter: () => maliciousAdapterL2,
      },
      {
        name: "L1 -> L2",
        fromAdapter: () => adapterL1,
        fromEndpoint: () => ethEndpoint,
        fromChainID: ETH_ID,
        fromChainEID: ETH_EID,
        toAdapter: () => adapterFrax,
        toEndpoint: () => arbEndpoint,
        toChainID: ARB_ID,
        target: () => omniVault,
        maliciousAdapter: () => maliciousAdapterL1,
      },
    ];
    directions.forEach(function (direction) {
      describe(`Send eth ${direction.name}`, function () {
        let fromAdapter;
        let fromEndpoint;
        let toAdapter;
        let toEndpoint;
        let target;

        before(async function () {
          await snapshot.restore();
          fromAdapter = direction.fromAdapter();
          fromEndpoint = direction.fromEndpoint();
          toAdapter = direction.toAdapter();
          toEndpoint = direction.toEndpoint();
          target = direction.target();
        });

        const args = [
          {
            name: "1eth",
            amount: async () => e18,
          },
          {
            name: "Random amount ~ 1e17",
            amount: async () => randomBI(17),
          },
          {
            name: "1wei",
            amount: async () => 1n,
          },
          {
            name: "Restaking pool min amount",
            amount: async () => await inceptionVault.getMinStake(),
          },
          {
            name: "Greater than available to stake",
            amount: async () => (await inceptionVault.availableToStake()) + 1n,
          },
        ];

        args.forEach(function (arg) {
          it(arg.name, async function () {
            const amount = await arg.amount();
            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
            const amountWithFees = await fromAdapter.quoteSendEth(direction.toChainID, options);
            const fee = amountWithFees - amount;
            const tx = await fromAdapter
              .connect(owner)
              .sendEthCrossChain(direction.toChainID, options, { value: amountWithFees });

            await expect(tx)
              .emit(fromAdapter, "CrossChainMessageSent")
              .withArgs(direction.toChainID, amount, "0x", fee);
            await expect(tx).emit(toAdapter, "CrossChainEthDeposit").withArgs(direction.fromChainID, amount);
            if (direction.toChainID === ETH_ID) {
              await expect(tx).emit(target, "ETHReceived").withArgs(toAdapter.address, amount);
            }
            await expect(tx).to.changeEtherBalance(target.address, amount);
            await expect(tx).to.changeEtherBalance(owner.address, -amountWithFees, { includeFee: false });
          });
        });

        it(`Send 0th ${direction.name}`, async function () {
          const amount = 0n;
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const amountWithFees = await fromAdapter.quoteSendEth(direction.toChainID, options);
          const tx = await fromAdapter
            .connect(owner)
            .sendEthCrossChain(direction.toChainID, options, { value: amountWithFees });

          await expect(tx)
            .emit(fromAdapter, "CrossChainMessageSent")
            .withArgs(direction.toChainID, 0n, "0x", 3202200000000000n);
          await expect(tx).not.emit(toAdapter, "CrossChainEthDeposit");
          await expect(tx).not.emit(rebalancer, "ETHReceived");
          await expect(tx).to.changeEtherBalance(target.address, amount);
          await expect(tx).to.changeEtherBalance(owner.address, -amountWithFees, { includeFee: false });
        });

        it("sendEthCrossChain reverts when called by not a target", async function () {
          await snapshot.restore();

          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fees = await fromAdapter.quoteSendEth(direction.toChainID, options);
          await expect(fromAdapter.connect(signer1).sendEthCrossChain(direction.toChainID, options, { value: fees }))
            .to.revertedWithCustomError(toAdapter, "NotTargetReceiver")
            .withArgs(signer1.address);
        });

        it("sendEthCrossChain reverts when caller is not endpoint", async function () {
          await snapshot.restore();
          const maliciousEndpoint = await ethers.deployContract("EndpointMock", [direction.toChainID]);
          maliciousEndpoint.address = await maliciousEndpoint.getAddress();
          await fromEndpoint.setDestLzEndpoint(toAdapter.address, maliciousEndpoint.address);

          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fees = await fromAdapter.quoteSendEth(direction.toChainID, options);

          await expect(fromAdapter.sendEthCrossChain(direction.toChainID, options, { value: fees }))
            .to.revertedWithCustomError(toAdapter, "OnlyEndpoint")
            .withArgs(maliciousEndpoint.address);
        });

        it("sendEthCrossChain reverts when sent from unknown adapter", async function () {
          await snapshot.restore();
          const maliciousAdapter = direction.maliciousAdapter();

          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fees = await maliciousAdapter.quoteSendEth(direction.toChainID, options);
          await expect(maliciousAdapter.sendEthCrossChain(direction.toChainID, options, { value: fees }))
            .to.be.revertedWithCustomError(toAdapter, "OnlyPeer")
            .withArgs(direction.fromChainEID, ethers.zeroPadValue(maliciousAdapter.address, 32));
        });

        it("sendEthCrossChain reverts when chain is unknown", async function () {
          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const amountWithFees = await fromAdapter.quoteSendEth(direction.toChainID, options);
          await expect(
            fromAdapter.connect(owner).sendEthCrossChain(randomBI(4), options, { value: amountWithFees }),
          ).to.be.revertedWithCustomError(fromAdapter, "NoPeer");
        });

        it("sendEthCrossChain reverts there is not enough fee", async function () {
          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const amountWithFees = await fromAdapter.quoteSendEth(direction.toChainID, options);
          await expect(
            fromAdapter.connect(owner).sendEthCrossChain(direction.toChainID, options, { value: amountWithFees - 1n }),
          ).to.be.revertedWith("LayerZeroMock: not enough native for fees");
        });

        it("quoteSendEth reverts when chain is unknown", async function () {
          const chain = randomBI(4);
          const amount = randomBI(18);
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          await expect(fromAdapter.quoteSendEth(chain, options))
            .to.be.revertedWithCustomError(fromAdapter, "NoDestEidFoundForChainId")
            .withArgs(chain);
        });

        it("quoteSendEth reverts when options value is invalid", async function () {
          await expect(fromAdapter.quoteSendEth(direction.toChainID, "0x"))
            .to.be.revertedWithCustomError(fromEndpoint, "LZ_ULN_InvalidWorkerOptions")
            .withArgs(0n);
        });
      });
    });

    describe("sendDataL1 receiveL2Info", function () {
      let lastHandleTime;
      before(async function () {
        await snapshot.restore();
      });

      it("sendDataL1 reverts when called by not a target", async function () {
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        const balance = randomBI(19);
        const totalSupply = randomBI(19);
        const message = encodePayload(timestamp, balance, totalSupply);
        const fees = await adapterFrax.quote(message, options);
        await expect(adapterFrax.connect(signer1).sendDataL1(message, options, { value: fees }))
          .to.be.revertedWithCustomError(adapterFrax, "NotTargetReceiver")
          .withArgs(signer1.address);
      });

      it("receiveL2Info", async () => {
        const block = await ethers.provider.getBlock("latest");
        lastHandleTime = block.timestamp - 1000;
        const _balance = 100;
        const _totalSupply = 100;

        await expect(adapterFrax.sendData(lastHandleTime, _balance, _totalSupply))
          .to.emit(rebalancer, "L2InfoReceived")
          .withArgs(ARB_ID, lastHandleTime, _balance, _totalSupply);

        const chainDataAfter = await rebalancer.getTransactionData(ARB_ID);
        expect(chainDataAfter.timestamp).to.be.eq(lastHandleTime);
        expect(chainDataAfter.ethBalance).to.be.eq(_balance);
        expect(chainDataAfter.inceptionTokenBalance).to.be.eq(_totalSupply);
      });

      it("Reverts when there is a message with this timestamp", async function () {
        const balance = 200;
        const totalSupply = 200;

        await expect(adapterFrax.sendData(lastHandleTime, balance, totalSupply))
          .to.revertedWithCustomError(rebalancer, "TimeBeforePrevRecord")
          .withArgs(lastHandleTime);
      });

      it("Reverts when timestamp is in the future", async function () {
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp + 100;
        const balance = 100;
        const totalSupply = 100;

        await expect(adapterFrax.sendData(timestamp, balance, totalSupply))
          .to.revertedWithCustomError(rebalancer, "TimeCannotBeInFuture")
          .withArgs(timestamp);
      });

      it("Reverts when caller is not endpoint", async function () {
        const maliciousEndpoint = await ethers.deployContract("EndpointMock", [ETH_EID]);
        maliciousEndpoint.address = await maliciousEndpoint.getAddress();
        await arbEndpoint.setDestLzEndpoint(adapterL1.address, maliciousEndpoint.address);

        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp - 1;
        const balance = 300;
        const totalSupply = 300;

        await expect(adapterFrax.sendData(timestamp, balance, totalSupply))
          .to.revertedWithCustomError(adapterL1, "OnlyEndpoint")
          .withArgs(maliciousEndpoint.address);
      });

      it("Reverts when l2 sender is unknown", async function () {
        await snapshot.restore();
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp + 100;
        const balance = 100;
        const totalSupply = 100;
        const message = encodePayload(timestamp, balance, totalSupply);

        const fees = await maliciousAdapterL2.quote(message, options);
        await expect(maliciousAdapterL2.sendDataL1(message, options, { value: fees }))
          .to.be.revertedWithCustomError(adapterL1, "OnlyPeer")
          .withArgs(ARB_EID, ethers.zeroPadValue(maliciousAdapterL2.address, 32));
      });

      it("quoteSendEth reverts when options value is invalid", async function () {
        await snapshot.restore();
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp + 100;
        const balance = 100;
        const totalSupply = 100;
        const message = encodePayload(timestamp, balance, totalSupply);

        await expect(adapterFrax.quote(message, "0x"))
          .to.be.revertedWithCustomError(arbEndpoint, "LZ_ULN_InvalidWorkerOptions")
          .withArgs(0n);
      });
    });

    describe("Recover funds", function () {
      it("recoverFunds owner can send funds from adapter to the target", async function () {
        const amount = randomBI(18);
        await signer1.sendTransaction({ value: amount, to: adapterL1.address });
        expect(await ethers.provider.getBalance(adapterL1.address)).to.be.eq(amount);

        const tx = await adapterL1.connect(owner).recoverFunds();
        await expect(tx).to.emit(adapterL1, "RecoverFundsInitiated").withArgs(amount);
        await expect(tx).changeEtherBalance(adapterL1, -amount);
        await expect(tx).changeEtherBalance(rebalancer, amount);
      });

      it("recoverFunds reverts when called by not an owner", async function () {
        const amount = randomBI(18);
        await signer1.sendTransaction({ value: amount, to: adapterL1.address });
        expect(await ethers.provider.getBalance(adapterL1.address)).to.be.eq(amount);

        await expect(adapterL1.connect(signer1).recoverFunds()).to.revertedWithCustomError(
          adapterL1,
          "OwnableUnauthorizedAccount",
        );
      });
    });
  });

  describe("OmniVault", function () {
    describe("Base flow", function () {
      let deposited, freeBalance, depositFees;

      before(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
      });

      it("Initial ratio", async function () {
        const ratio = await omniVault.ratio();
        console.log(`Initial ratio:\t\t${ratio.format()}`);
      });

      it("Deposit to vault", async function () {
        freeBalance = randomBI(19);
        deposited = TARGET + freeBalance;
        const expectedShares = (deposited * e18) / (await omniVault.ratio());
        const tx = await omniVault.connect(signer1).deposit(signer1.address, { value: deposited });
        const receipt = await tx.wait();
        const events = receipt?.logs.filter(e => e.eventName === "Deposit");
        expect(events.length).to.be.eq(1);
        expect(events[0].args["sender"]).to.be.eq(signer1.address);
        expect(events[0].args["receiver"]).to.be.eq(signer1.address);
        expect(events[0].args["amount"]).to.be.eq(deposited);
        expect(events[0].args["iShares"]).to.be.closeTo(expectedShares, 1n);
        expect(receipt?.logs.find(l => l.eventName === "DepositBonus")).to.be.undefined; //Because there is no replenish rewards has been collected yet
        console.log(`Ratio after:\t\t${(await omniVault.ratio()).format()}`);

        expect(await iToken.balanceOf(signer1.address)).to.be.closeTo(expectedShares, 1n);
        expect(await omniVault.totalAssets()).to.be.eq(deposited);
        expect(await omniVault.getFlashCapacity()).to.be.eq(deposited);
        expect(await omniVault.ratio()).to.be.eq(e18);
      });

      it("Flash withdraw all", async function () {
        const sharesBefore = await iToken.balanceOf(signer1);
        const senderBalanceBefore = await ethers.provider.getBalance(signer1);
        const receiver = signer2;
        const receiverBalanceBefore = await ethers.provider.getBalance(receiver);
        const treasuryBalanceBefore = await ethers.provider.getBalance(treasury);
        const totalAssetsBefore = await omniVault.totalAssets();
        const flashCapacityBefore = await omniVault.getFlashCapacity();
        console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

        const amount = await omniVault.convertToAssets(sharesBefore);
        const expectedFee = await omniVault.calculateFlashWithdrawFee(amount);
        console.log(`Amount:\t\t\t\t\t${amount.format()}`);
        console.log(`Shares:\t\t\t\t\t${sharesBefore.format()}`);
        console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

        let tx = await omniVault.connect(signer1).flashWithdraw(sharesBefore, receiver.address);
        const receipt = await tx.wait();
        const txFee = BigInt(receipt.gasUsed * receipt.gasPrice);
        const withdrawEvent = receipt?.logs.filter(e => e.eventName === "FlashWithdraw");
        expect(withdrawEvent.length).to.be.eq(1);
        expect(withdrawEvent[0].args["sender"]).to.be.eq(signer1.address);
        expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
        expect(withdrawEvent[0].args["owner"]).to.be.eq(signer1.address);
        expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
        expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(sharesBefore, 1n);
        expect(withdrawEvent[0].args["fee"]).to.be.closeTo(expectedFee, 1n);
        const collectedFees = withdrawEvent[0].args["fee"];
        depositFees = collectedFees / 2n;

        const sharesAfter = await iToken.balanceOf(signer1);
        const senderBalanceAfter = await ethers.provider.getBalance(signer1);
        const receiverBalanceAfter = await ethers.provider.getBalance(receiver);
        const treasuryBalanceAfter = await ethers.provider.getBalance(treasury);
        const totalAssetsAfter = await omniVault.totalAssets();
        const flashCapacityAfter = await omniVault.getFlashCapacity();
        console.log(`Shares balance diff:\t${(sharesBefore - sharesAfter).format()}`);
        console.log(`Sender balance diff:\t${(senderBalanceBefore - senderBalanceAfter).format()}`);
        console.log(`Receiver balance diff:\t${(receiverBalanceAfter - receiverBalanceBefore).format()}`);
        console.log(`Treasury balance diff:\t${(treasuryBalanceAfter - treasuryBalanceBefore).format()}`);
        console.log(`Total assets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
        console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);
        console.log(`Fee collected:\t\t\t${collectedFees.format()}`);

        expect(sharesBefore - sharesAfter).to.be.eq(sharesBefore);
        expect(senderBalanceBefore - senderBalanceAfter).to.be.closeTo(txFee, 1n);
        expect(receiverBalanceAfter - receiverBalanceBefore).to.be.closeTo(amount - expectedFee, 1n);
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(expectedFee / 2n, 1n);
        expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - expectedFee / 2n, 1n);
        expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
      });
    });

    describe("Deposit", function () {
      let TARGET;

      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
      });

      const args = [
        {
          name: "1st time < TARGET",
          predepositAmount: () => 0n,
          amount: async () => TARGET / 2n,
          withdrawFeeFrom: () => 0n,
          receiver: () => signer1.address,
        },
        {
          name: "1st time > TARGET",
          predepositAmount: () => 0n,
          amount: async () => randomBIMax(TARGET),
          withdrawFeeFrom: () => 0n,
          receiver: () => signer1.address,
        },
        {
          name: "more wo rewards",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => 0n,
          receiver: () => signer1.address,
        },
        {
          name: "more with rewards",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => TARGET,
          receiver: () => signer1.address,
        },
        {
          name: "min amount",
          predepositAmount: () => 0n,
          amount: async () => await omniVault.minAmount(),
          withdrawFeeFrom: () => TARGET,
          receiver: () => signer1.address,
        },
        {
          name: "and redeem all rewards",
          predepositAmount: () => TARGET / 10n,
          amount: async () => (TARGET * 8n) / 10n,
          withdrawFeeFrom: () => TARGET / 10n,
          receiver: () => signer1.address,
        },
        {
          name: "up to target cap and above",
          predepositAmount: () => TARGET / 10n,
          amount: async () => TARGET,
          withdrawFeeFrom: () => TARGET / 2n,
          receiver: () => signer1.address,
        },
        {
          name: "above target cap",
          predepositAmount: () => TARGET + 1n,
          amount: async () => randomBI(19),
          withdrawFeeFrom: () => TARGET,
          receiver: () => signer1.address,
        },
        {
          name: "to another address",
          predepositAmount: () => TARGET / 10n,
          amount: async () => TARGET,
          withdrawFeeFrom: () => TARGET,
          receiver: () => signer2.address,
        },

        //Ratio < 1
        {
          name: "more wo rewards when ratio < 1",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => 0n,
          ratio: toWei(0.9),
          receiver: () => signer1.address,
        },
        {
          name: "more with rewards when ratio < 1",
          predepositAmount: () => TARGET / 3n,
          amount: async () => randomBIMax(TARGET / 3n),
          withdrawFeeFrom: () => TARGET,
          ratio: toWei(0.9),
          receiver: () => signer1.address,
        },
        {
          name: "min amount when ratio < 1",
          predepositAmount: () => 0n,
          amount: async () => await omniVault.minAmount(),
          withdrawFeeFrom: () => TARGET,
          ratio: toWei(0.9),
          receiver: () => signer1.address,
        },
      ];

      args.forEach(function (arg) {
        it(`Deposit ${arg.name}`, async function () {
          //Predeposit
          const predepositAmount = arg.predepositAmount();
          if (predepositAmount > 0n) {
            const randomAddress = ethers.Wallet.createRandom().address;
            await omniVault.connect(signer3).deposit(randomAddress, { value: predepositAmount });
            expect(await omniVault.getFlashCapacity()).to.be.closeTo(predepositAmount, 2n);
          }

          //Add rewards
          let availableBonus = await addReplenishBonusToOmniVault(arg.withdrawFeeFrom());

          if (arg.ratio) {
            await ratioFeedL2.updateRatioBatch([await iToken.getAddress()], [arg.ratio]);
            console.log(`Ratio updated:\t\t\t${(await omniVault.ratio()).format()}`);
          }

          const receiver = arg.receiver();
          const stakerSharesBefore = await iToken.balanceOf(receiver);
          const totalAssetsBefore = await omniVault.totalAssets();
          const flashCapacityBefore = await omniVault.getFlashCapacity();
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          console.log(`Amount:\t\t\t\t\t${amount.format()}`);
          const calculatedBonus = await omniVault.calculateDepositBonus(amount);
          console.log(`Preview bonus:\t\t\t${calculatedBonus.format()}`);
          console.log(`Available bonus:\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t${expectedBonus.format()}`);
          const convertedShares = await omniVault.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await omniVault.ratio())) / e18;

          const tx = await omniVault.connect(signer1).deposit(receiver, { value: amount });
          const receipt = await tx.wait();
          const depositEvent = receipt?.logs.filter(e => e.eventName === "Deposit");
          expect(depositEvent.length).to.be.eq(1);
          expect(depositEvent[0].args["sender"]).to.be.eq(signer1.address);
          expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
          expect(depositEvent[0].args["amount"]).to.be.eq(amount);
          expect(depositEvent[0].args["iShares"]).to.be.closeTo(convertedShares, 1n);
          //DepositBonus event
          const actualBonus = receipt?.logs.find(l => l.eventName === "DepositBonus")?.args.amount || 0n;
          console.log(`Actual bonus:\t\t\t${actualBonus.format()}`);

          const stakerSharesAfter = await iToken.balanceOf(receiver);
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          console.log(`Bonus after:\t\t\t${availableBonus.format()}`);

          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, 1n);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, 1n);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.eq(amount); //omniVault balance is the same
          expect(actualBonus).to.be.closeTo(expectedBonus, 1n);
          expect(flashCapacityAfter - flashCapacityBefore).to.be.closeTo(amount + expectedBonus, 1n); //rewarded bonus goes to flash capacity
        });
        it(`Deposit with referral code ${arg.name}`, async function () {
          //Predeposit
          const predepositAmount = arg.predepositAmount();
          if (predepositAmount > 0n) {
            const randomAddress = ethers.Wallet.createRandom().address;
            await omniVault.connect(signer3).deposit(randomAddress, { value: predepositAmount });
            expect(await omniVault.getFlashCapacity()).to.be.closeTo(predepositAmount, 2n);
          }

          //Add rewards
          let availableBonus = await addReplenishBonusToOmniVault(arg.withdrawFeeFrom());

          if (arg.ratio) {
            await ratioFeedL2.updateRatioBatch([await iToken.getAddress()], [arg.ratio]);
            console.log(`Ratio updated:\t\t\t${(await omniVault.ratio()).format()}`);
          }

          const receiver = arg.receiver();
          const stakerSharesBefore = await iToken.balanceOf(receiver);
          const totalAssetsBefore = await omniVault.totalAssets();
          const flashCapacityBefore = await omniVault.getFlashCapacity();
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          console.log(`Amount:\t\t\t\t\t${amount.format()}`);
          const calculatedBonus = await omniVault.calculateDepositBonus(amount);
          console.log(`Preview bonus:\t\t\t${calculatedBonus.format()}`);
          console.log(`Available bonus:\t\t${availableBonus.format()}`);
          const expectedBonus = calculatedBonus <= availableBonus ? calculatedBonus : availableBonus;
          availableBonus -= expectedBonus;
          console.log(`Expected bonus:\t\t\t${expectedBonus.format()}`);
          const convertedShares = await omniVault.convertToShares(amount + expectedBonus);
          const expectedShares = ((amount + expectedBonus) * (await omniVault.ratio())) / e18;

          const code = ethers.encodeBytes32String("code");
          const tx = await omniVault.connect(signer1).depositWithReferral(receiver, code, { value: amount });
          const receipt = await tx.wait();
          const depositEvent = receipt?.logs.filter(e => e.eventName === "Deposit");
          expect(depositEvent.length).to.be.eq(1);
          expect(depositEvent[0].args["sender"]).to.be.eq(signer1.address);
          expect(depositEvent[0].args["receiver"]).to.be.eq(receiver);
          expect(depositEvent[0].args["amount"]).to.be.eq(amount);
          expect(depositEvent[0].args["iShares"]).to.be.closeTo(convertedShares, 1n);
          await expect(tx).to.emit(omniVault, "ReferralCode").withArgs(signer1.address, code);

          //DepositBonus event
          const actualBonus = receipt?.logs.find(l => l.eventName === "DepositBonus")?.args.amount || 0n;
          console.log(`Actual bonus:\t\t\t${actualBonus.format()}`);

          const stakerSharesAfter = await iToken.balanceOf(receiver);
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          console.log(`Bonus after:\t\t\t${availableBonus.format()}`);

          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(expectedShares, 1n);
          expect(stakerSharesAfter - stakerSharesBefore).to.be.closeTo(convertedShares, 1n);
          expect(totalAssetsAfter - totalAssetsBefore).to.be.eq(amount); //omniVault balance is the same
          expect(actualBonus).to.be.closeTo(expectedBonus, 1n);
          expect(flashCapacityAfter - flashCapacityBefore).to.be.closeTo(amount + expectedBonus, 1n); //rewarded bonus goes to flash capacity
        });
      });

      const invalidArgs = [
        {
          name: "amount is 0",
          amount: async () => 0n,
          receiver: () => signer1.address,
          customError: "LowerMinAmount",
        },
        {
          name: "amount < min",
          amount: async () => (await omniVault.minAmount()) - 1n,
          receiver: () => signer1.address,
          customError: "LowerMinAmount",
        },
        {
          name: "to zero address",
          amount: async () => randomBI(18),
          receiver: () => ethers.ZeroAddress,
          customError: "NullParams",
        },
      ];

      invalidArgs.forEach(function (arg) {
        it(`Reverts when deposit ${arg.name}`, async function () {
          const amount = await arg.amount();
          const receiver = arg.receiver();
          if (arg.customError) {
            await expect(omniVault.connect(signer1).deposit(receiver, { value: amount })).to.be.revertedWithCustomError(
              omniVault,
              arg.customError,
            );
          } else {
            await expect(omniVault.connect(signer1).deposit(receiver, { value: amount })).to.be.revertedWith(arg.error);
          }
        });
      });

      it("Reverts when omniVault is paused", async function () {
        await omniVault.pause();
        const depositAmount = randomBI(19);
        await expect(
          omniVault.connect(signer1).deposit(signer1.address, { value: depositAmount }),
        ).revertedWithCustomError(omniVault, "EnforcedPause");
        await omniVault.unpause();
      });

      it("Reverts when shares is 0", async function () {
        await omniVault.setMinAmount(0n);
        await expect(omniVault.connect(signer1).deposit(signer1.address, { value: 0n })).revertedWithCustomError(
          omniVault,
          "DepositInconsistentResultedState",
        );
      });
    });

    describe("Deposit bonus params setter and calculation", function () {
      let TARGET, MAX_PERCENT, localSnapshot;
      before(async function () {
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const depositBonusSegment = [
        {
          fromUtilization: async () => 0n,
          fromPercent: async () => await omniVault.maxBonusRate(),
          toUtilization: async () => await omniVault.depositUtilizationKink(),
          toPercent: async () => await omniVault.optimalBonusRate(),
        },
        {
          fromUtilization: async () => await omniVault.depositUtilizationKink(),
          fromPercent: async () => await omniVault.optimalBonusRate(),
          toUtilization: async () => await omniVault.MAX_PERCENT(),
          toPercent: async () => await omniVault.optimalBonusRate(),
        },
        {
          fromUtilization: async () => await omniVault.MAX_PERCENT(),
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
          flashCapacity: () => 0n,
          amount: async () => (await omniVault.convertToAssets(await omniVault.minAmount())) + 1n,
        },
        {
          name: "1 wei from 0",
          flashCapacity: () => 0n,
          amount: async () => 1n,
        },
        {
          name: "from 0 to 25% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => (TARGET * 25n) / 100n,
        },
        {
          name: "from 0 to 25% + 1wei of TARGET",
          flashCapacity: () => 0n,
          amount: async () => (TARGET * 25n) / 100n,
        },
        {
          name: "from 25% to 100% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amount: async () => (TARGET * 75n) / 100n,
        },
        {
          name: "from 0% to 100% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => TARGET,
        },
        {
          name: "from 0% to 200% of TARGET",
          flashCapacity: () => 0n,
          amount: async () => TARGET * 2n,
        },
      ];

      args.forEach(function (arg) {
        it(`setDepositBonusParams: ${arg.name}`, async function () {
          await snapshot.restore();
          TARGET = e18;
          await omniVault.connect(owner).setTargetFlashCapacity(TARGET);

          await expect(
            omniVault.setDepositBonusParams(
              arg.newMaxBonusRate,
              arg.newOptimalBonusRate,
              arg.newDepositUtilizationKink,
            ),
          )
            .to.emit(omniVault, "DepositBonusParamsChanged")
            .withArgs(arg.newMaxBonusRate, arg.newOptimalBonusRate, arg.newDepositUtilizationKink);

          expect(await omniVault.maxBonusRate()).to.be.eq(arg.newMaxBonusRate);
          expect(await omniVault.optimalBonusRate()).to.be.eq(arg.newOptimalBonusRate);
          expect(await omniVault.depositUtilizationKink()).to.be.eq(arg.newDepositUtilizationKink);
          localSnapshot = await takeSnapshot();
        });

        amounts.forEach(function (amount) {
          it(`calculateDepositBonus for ${amount.name}`, async function () {
            await localSnapshot.restore();
            let flashCapacity = amount.flashCapacity();
            if (flashCapacity > 0n) {
              await omniVault.connect(signer1).deposit(signer1.address, { value: flashCapacity });
            }
            let _amount = await amount.amount();
            let depositBonus = 0n;
            while (_amount > 0n) {
              for (const feeFunc of depositBonusSegment) {
                const utilization = (flashCapacity * MAX_PERCENT) / TARGET;
                const fromUtilization = await feeFunc.fromUtilization();
                const toUtilization = await feeFunc.toUtilization();
                if (_amount > 0n && fromUtilization <= utilization && utilization < toUtilization) {
                  const fromPercent = await feeFunc.fromPercent();
                  const toPercent = await feeFunc.toPercent();
                  const upperBound = (toUtilization * TARGET) / MAX_PERCENT;
                  const replenished = upperBound > flashCapacity + _amount ? _amount : upperBound - flashCapacity;
                  const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                  const bonusPercent = fromPercent + (slope * (flashCapacity + replenished / 2n)) / TARGET;
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
            let contractBonus = await omniVault.calculateDepositBonus(await amount.amount());
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
            omniVault.setDepositBonusParams(
              arg.newMaxBonusRate(),
              arg.newOptimalBonusRate(),
              arg.newDepositUtilizationKink(),
            ),
          ).to.be.revertedWithCustomError(omniVault, arg.customError);
        });
      });

      it("setDepositBonusParams reverts when caller is not an owner", async function () {
        await expect(
          omniVault
            .connect(signer1)
            .setDepositBonusParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
        ).to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });
    });

    describe("Flash withdraw", function () {
      let TARGET, MAX_PERCENT, ratio;
      beforeEach(async function () {
        await snapshot.restore();
        TARGET = toWei(10);
        await omniVault.setTargetFlashCapacity(TARGET);
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const args = [
        {
          name: "some amount when capacity > TARGET",
          poolCapacity: () => TARGET * 2n,
          amount: async () => randomBIMax(TARGET / 2n),
          receiver: () => signer1,
        },
        {
          name: "all capacity above TARGET",
          poolCapacity: () => TARGET * 2n,
          amount: async () => (await omniVault.getFlashCapacity()) - TARGET,
          receiver: () => signer1,
        },
        {
          name: "all when pool capacity > TARGET",
          poolCapacity: () => TARGET + e18,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => signer1,
        },
        {
          name: "partially when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => signer1,
        },
        {
          name: "all when pool capacity = TARGET",
          poolCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => signer1,
        },
        {
          name: "partially when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => signer1,
        },
        {
          name: "all when pool capacity < TARGET",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => signer1,
        },
        {
          name: "to another address",
          poolCapacity: () => (TARGET * 3n) / 4n,
          amount: async () => (await omniVault.getFlashCapacity()) / 2n,
          receiver: () => signer2,
        },
        {
          name: "after protocol fee has been changed",
          poolCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
          receiver: () => signer1,
          protocolFee: () => BigInt(25 * 10 ** 8),
        },
      ];

      args.forEach(function (arg) {
        it(`flashWithdraw: ${arg.name}`, async function () {
          ratio = toWei(0.8);
          await ratioFeedL2.updateRatioBatch([iToken.address], [ratio]);
          //Deposit
          const predepositAmount = arg.poolCapacity();
          await omniVault.connect(signer1).deposit(signer1.address, { value: predepositAmount });
          //Set protocol fee
          let protocolFee = await omniVault.protocolFee();
          if (arg.protocolFee) {
            protocolFee = arg.protocolFee();
            await omniVault.setProtocolFee(protocolFee);
          }
          //flashWithdraw
          const ratioBefore = await omniVault.ratio();
          console.log(`Ratio before:\t\t\t${ratioBefore.format()}`);

          const receiver = await arg.receiver();
          const sharesBefore = await iToken.balanceOf(signer1);
          const assetBalanceBefore = await ethers.provider.getBalance(receiver);
          const treasuryBalanceBefore = await ethers.provider.getBalance(treasury);
          const totalAssetsBefore = await omniVault.totalAssets();
          const flashCapacityBefore = await omniVault.getFlashCapacity();
          console.log(`Flash capacity before:\t${flashCapacityBefore.format()}`);

          const amount = await arg.amount();
          const shares = await omniVault.convertToShares(amount);
          const expectedFee = await omniVault.calculateFlashWithdrawFee(amount);
          console.log(`Expected fee:\t\t\t${expectedFee.format()}`);

          let tx = await omniVault.connect(signer1).flashWithdraw(shares, receiver.address);
          const receipt = await tx.wait();
          const txFee = receiver.address === signer1.address ? BigInt(receipt.gasUsed * receipt.gasPrice) : 0n;
          const withdrawEvent = receipt?.logs.filter(e => e.eventName === "FlashWithdraw");
          expect(withdrawEvent.length).to.be.eq(1);
          expect(withdrawEvent[0].args["sender"]).to.be.eq(signer1.address);
          expect(withdrawEvent[0].args["receiver"]).to.be.eq(receiver.address);
          expect(withdrawEvent[0].args["owner"]).to.be.eq(signer1.address);
          expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 2n);
          expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, 2n);
          const actualFee = withdrawEvent[0].args["fee"];
          console.log(`Actual fee:\t\t\t\t${actualFee.format()}`);

          const sharesAfter = await iToken.balanceOf(signer1);
          const assetBalanceAfter = await ethers.provider.getBalance(receiver);
          const treasuryBalanceAfter = await ethers.provider.getBalance(treasury);
          const totalAssetsAfter = await omniVault.totalAssets();
          const flashCapacityAfter = await omniVault.getFlashCapacity();
          console.log(`Shares diff:\t\t\t${(sharesBefore - sharesAfter).format()}`);
          console.log(`Receiver balance diff:\t${(assetBalanceAfter - assetBalanceBefore).format()}`);
          console.log(`TotalAssets diff:\t\t${(totalAssetsBefore - totalAssetsAfter).format()}`);
          console.log(`Flash capacity diff:\t${(flashCapacityBefore - flashCapacityAfter).format()}`);

          expect(sharesBefore - sharesAfter).to.be.eq(shares);
          expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee - txFee, 2n);
          expect(actualFee).to.be.closeTo(expectedFee, 2n);
          const toDepositBonus = (expectedFee * (MAX_PERCENT - protocolFee)) / MAX_PERCENT;
          const toTreasury = (expectedFee * protocolFee) / MAX_PERCENT;
          expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(toTreasury, 2n);
          expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - toDepositBonus, 2n);
          expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 2n);
        });
      });

      it("Reverts when capacity is not sufficient", async function () {
        await omniVault.connect(signer1).deposit(signer1.address, { value: toWei(1) });
        ratio = toWei(0.8);
        await ratioFeedL2.updateRatioBatch([iToken.address], [ratio]);
        const shares = await iToken.balanceOf(signer1.address);
        const capacity = await omniVault.getFlashCapacity();
        await expect(omniVault.connect(signer1).flashWithdraw(shares, signer1.address))
          .to.be.revertedWithCustomError(omniVault, "InsufficientCapacity")
          .withArgs(capacity);
      });

      it("Reverts when amount < min", async function () {
        await omniVault.connect(signer1).deposit(signer1.address, { value: toWei(1) });
        const minAmount = await omniVault.minAmount();
        const shares = (await omniVault.convertToShares(minAmount)) - 1n;
        await expect(omniVault.connect(signer1).flashWithdraw(shares, signer1.address))
          .to.be.revertedWithCustomError(omniVault, "LowerMinAmount")
          .withArgs(minAmount);
      });

      it("Reverts when omniVault is paused", async function () {
        await omniVault.connect(signer1).deposit(signer1.address, { value: toWei(1) });
        await omniVault.pause();
        const shares = await iToken.balanceOf(signer1.address);
        await expect(
          omniVault.connect(signer1).flashWithdraw(shares / 2n, signer1.address),
        ).to.be.revertedWithCustomError(omniVault, "EnforcedPause");
      });

      it("Reverts when withdraws to 0 address", async function () {
        await omniVault.connect(signer1).deposit(signer1.address, { value: toWei(1) });
        const shares = await iToken.balanceOf(signer1.address);
        await expect(
          omniVault.connect(signer1).flashWithdraw(shares / 2n, ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("Reverts when shares = 0", async function () {
        await omniVault.connect(signer1).deposit(signer1.address, { value: toWei(1) });
        await expect(omniVault.connect(signer1).flashWithdraw(0n, signer1.address)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });
    });

    describe("Withdraw fee params setter and calculation", function () {
      let TARGET, MAX_PERCENT, localSnapshot;
      before(async function () {
        MAX_PERCENT = await omniVault.MAX_PERCENT();
      });

      const withdrawFeeSegment = [
        {
          fromUtilization: async () => 0n,
          fromPercent: async () => await omniVault.maxFlashFeeRate(),
          toUtilization: async () => await omniVault.withdrawUtilizationKink(),
          toPercent: async () => await omniVault.optimalWithdrawalRate(),
        },
        {
          fromUtilization: async () => await omniVault.withdrawUtilizationKink(),
          fromPercent: async () => await omniVault.optimalWithdrawalRate(),
          toUtilization: async () => await omniVault.MAX_PERCENT(),
          toPercent: async () => await omniVault.optimalWithdrawalRate(),
        },
        {
          fromUtilization: async () => await omniVault.MAX_PERCENT(),
          fromPercent: async () => 0n,
          toUtilization: async () => ethers.MaxUint256,
          toPercent: async () => 0n,
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
          flashCapacity: () => TARGET * 2n,
          amount: async () => await omniVault.getFlashCapacity(),
        },
        {
          name: "from 100% to 0% of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => await omniVault.getFlashCapacity(),
        },
        {
          name: "1 wei from 100%",
          flashCapacity: () => TARGET,
          amount: async () => 1n,
        },
        {
          name: "min amount from 100%",
          flashCapacity: () => TARGET,
          amount: async () => (await omniVault.convertToAssets(await omniVault.minAmount())) + 1n,
        },
        {
          name: "from 100% to 25% of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => (TARGET * 75n) / 100n,
        },
        {
          name: "from 100% to 25% - 1wei of TARGET",
          flashCapacity: () => TARGET,
          amount: async () => (TARGET * 75n) / 100n + 1n,
        },
        {
          name: "from 25% to 0% of TARGET",
          flashCapacity: () => (TARGET * 25n) / 100n,
          amount: async () => await omniVault.getFlashCapacity(),
        },
      ];

      args.forEach(function (arg) {
        it(`setFlashWithdrawFeeParams: ${arg.name}`, async function () {
          await snapshot.restore();
          TARGET = e18;
          await omniVault.connect(owner).setTargetFlashCapacity(TARGET);

          await expect(
            omniVault.setFlashWithdrawFeeParams(
              arg.newMaxFlashFeeRate,
              arg.newOptimalWithdrawalRate,
              arg.newWithdrawUtilizationKink,
            ),
          )
            .to.emit(omniVault, "WithdrawFeeParamsChanged")
            .withArgs(arg.newMaxFlashFeeRate, arg.newOptimalWithdrawalRate, arg.newWithdrawUtilizationKink);

          expect(await omniVault.maxFlashFeeRate()).to.be.eq(arg.newMaxFlashFeeRate);
          expect(await omniVault.optimalWithdrawalRate()).to.be.eq(arg.newOptimalWithdrawalRate);
          expect(await omniVault.withdrawUtilizationKink()).to.be.eq(arg.newWithdrawUtilizationKink);
          localSnapshot = await takeSnapshot();
        });

        amounts.forEach(function (amount) {
          it(`calculateFlashWithdrawFee for: ${amount.name}`, async function () {
            await localSnapshot.restore();
            if (amount.flashCapacity() > 0n) {
              await omniVault.connect(signer1).deposit(signer1.address, { value: amount.flashCapacity() });
            }
            let flashCapacity = await omniVault.getFlashCapacity();
            console.log(`flash capacity: ${flashCapacity.format()}`);
            let _amount = await amount.amount();
            let withdrawFee = 0n;
            while (_amount > 0n) {
              for (const feeFunc of withdrawFeeSegment) {
                const utilization = (flashCapacity * MAX_PERCENT) / TARGET;
                const fromUtilization = await feeFunc.fromUtilization();
                const toUtilization = await feeFunc.toUtilization();
                if (_amount > 0n && fromUtilization < utilization && utilization <= toUtilization) {
                  console.log(`Utilization:\t\t\t${utilization.format()}`);
                  const fromPercent = await feeFunc.fromPercent();
                  const toPercent = await feeFunc.toPercent();
                  const lowerBound = (fromUtilization * TARGET) / MAX_PERCENT;
                  const replenished = lowerBound > flashCapacity - _amount ? flashCapacity - lowerBound : _amount;
                  const slope = ((toPercent - fromPercent) * MAX_PERCENT) / (toUtilization - fromUtilization);
                  const withdrawFeePercent = fromPercent + (slope * (flashCapacity - replenished / 2n)) / TARGET;
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
            let contractFee = await omniVault.calculateFlashWithdrawFee(await amount.amount());
            console.log(`Expected withdraw fee:\t${withdrawFee.format()}`);
            console.log(`Contract withdraw fee:\t${contractFee.format()}`);
            expect(contractFee).to.be.closeTo(withdrawFee, 1n);
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
            omniVault.setFlashWithdrawFeeParams(
              arg.newMaxFlashFeeRate(),
              arg.newOptimalWithdrawalRate(),
              arg.newWithdrawUtilizationKink(),
            ),
          ).to.be.revertedWithCustomError(omniVault, arg.customError);
        });
      });

      it("calculateFlashWithdrawFee reverts when capacity is not sufficient", async function () {
        await snapshot.restore();
        await omniVault.connect(signer1).deposit(signer1.address, { value: randomBI(19) });
        const capacity = await omniVault.getFlashCapacity();
        await expect(omniVault.calculateFlashWithdrawFee(capacity + 1n))
          .to.be.revertedWithCustomError(omniVault, "InsufficientCapacity")
          .withArgs(capacity);
      });

      it("setFlashWithdrawFeeParams reverts when caller is not an owner", async function () {
        await expect(
          omniVault
            .connect(signer1)
            .setFlashWithdrawFeeParams(BigInt(2 * 10 ** 8), BigInt(0.2 * 10 ** 8), BigInt(25 * 10 ** 8)),
        ).to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });
    });

    describe("Setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      it("setTreasuryAddress(): only owner can", async function () {
        const newTreasury = ethers.Wallet.createRandom().address;

        const currentTreasury = await omniVault.treasury();

        await expect(omniVault.setTreasuryAddress(newTreasury))
          .to.emit(omniVault, "TreasuryUpdated")
          .withArgs(currentTreasury, newTreasury);

        expect(await omniVault.treasury()).to.be.eq(newTreasury);
      });

      it("setTreasuryAddress(): reverts when set to zero address", async function () {
        await expect(omniVault.setTreasuryAddress(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });

      it("setTreasuryAddress(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setTreasuryAddress(signer1.address)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setRatioFeed(): only owner can", async function () {
        const ratioFeed = await omniVault.ratioFeed();
        const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
        const newRatioFeed = await upgrades.deployProxy(iRatioFeedFactory, []);
        newRatioFeed.address = await newRatioFeed.getAddress();
        await expect(omniVault.setRatioFeed(newRatioFeed.address))
          .to.emit(omniVault, "RatioFeedChanged")
          .withArgs(ratioFeed, newRatioFeed.address);
        expect(await omniVault.ratioFeed()).to.be.eq(newRatioFeed.address);

        const ratio = randomBI(18);
        await newRatioFeed.updateRatioBatch([await iToken.getAddress()], [ratio]);
        expect(await omniVault.ratio()).to.be.eq(ratio);
      });

      it("setRatioFeed(): reverts when new value is zero address", async function () {
        await expect(omniVault.setRatioFeed(ethers.ZeroAddress)).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setRatioFeed(): reverts when caller is not an owner", async function () {
        const newRatioFeed = ethers.Wallet.createRandom().address;
        await expect(omniVault.connect(signer1).setRatioFeed(newRatioFeed)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setOperator(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;
        await expect(omniVault.setOperator(newValue))
          .to.emit(omniVault, "OperatorChanged")
          .withArgs(operator.address, newValue);
        expect(await omniVault.operator()).to.be.eq(newValue);
      });

      it("setOperator(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setOperator(signer1.address)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setOperator(): reverts when set to 0 address", async function () {
        await expect(omniVault.setOperator(ethers.ZeroAddress)).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("ratio() reverts when ratioFeed is 0 address", async function () {
        const omniVaultFactory = await ethers.getContractFactory("InceptionERC20OmniVault");
        const omniVault = await upgrades.deployProxy(
          omniVaultFactory,
          ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
          { initializer: "initialize" },
        );
        omniVault.address = await omniVault.getAddress();
        await iToken.setVault(omniVault.address);
        await expect(omniVault.ratio()).to.be.reverted;
      });

      it("setCrossChainAdapter(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;

        // Capture the current cross-chain adapter address before making the change
        const currentAdapter = await omniVault.crossChainAdapter();

        // Expect the event to include both the previous and new cross-chain adapter addresses
        await expect(omniVault.setCrossChainAdapter(newValue))
          .to.emit(omniVault, "CrossChainAdapterChanged")
          .withArgs(currentAdapter, newValue);

        // Verify the cross-chain adapter address has been updated
        expect(await omniVault.crossChainAdapter()).to.be.eq(newValue);
      });

      it("setCrossChainAdapter(): reverts when set to zero address", async function () {
        await expect(omniVault.setCrossChainAdapter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
          omniVault,
          "NullParams",
        );
      });

      it("setCrossChainAdapter(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setCrossChainAdapter(signer1.address)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setMinAmount(): only owner can", async function () {
        const prevValue = await omniVault.minAmount();
        const newMinAmount = randomBI(4);
        await expect(omniVault.setMinAmount(newMinAmount))
          .to.emit(omniVault, "MinAmountChanged")
          .withArgs(prevValue, newMinAmount);
        expect(await omniVault.minAmount()).to.be.eq(newMinAmount);
        await expect(omniVault.connect(signer1).deposit(signer1.address, { value: newMinAmount - 1n }))
          .to.be.revertedWithCustomError(omniVault, "LowerMinAmount")
          .withArgs(newMinAmount);
      });

      it("setMinAmount(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(signer1).setMinAmount(randomBI(3))).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setTargetFlashCapacity(): only owner can", async function () {
        const prevValue = await omniVault.targetCapacity();
        const newValue = randomBI(18);
        await expect(omniVault.setTargetFlashCapacity(newValue))
          .to.emit(omniVault, "TargetCapacityChanged")
          .withArgs(prevValue, newValue);
        expect(await omniVault.targetCapacity()).to.be.eq(newValue);
      });

      it("setTargetFlashCapacity(): reverts when called by not an owner", async function () {
        const newValue = randomBI(18);
        await expect(omniVault.connect(signer1).setTargetFlashCapacity(newValue)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setTargetFlashCapacity(): reverts when sets to 0", async function () {
        await expect(omniVault.setTargetFlashCapacity(0n)).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setProtocolFee(): sets share of flashWithdrawFee that goes to treasury", async function () {
        const prevValue = await omniVault.protocolFee();
        const newValue = randomBI(10);
        await expect(omniVault.setProtocolFee(newValue))
          .to.emit(omniVault, "ProtocolFeeChanged")
          .withArgs(prevValue, newValue);
        expect(await omniVault.protocolFee()).to.be.eq(newValue);
      });

      it("setProtocolFee(): reverts when > MAX_PERCENT", async function () {
        const newValue = (await omniVault.MAX_PERCENT()) + 1n;
        await expect(omniVault.setProtocolFee(newValue))
          .to.be.revertedWithCustomError(omniVault, "ParameterExceedsLimits")
          .withArgs(newValue);
      });

      it("setProtocolFee(): reverts when caller is not an owner", async function () {
        const newValue = randomBI(10);
        await expect(omniVault.connect(signer1).setProtocolFee(newValue)).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setName(): only owner can", async function () {
        const prevValue = await omniVault.name();
        const newValue = "New name";
        await expect(omniVault.setName(newValue)).to.emit(omniVault, "NameChanged").withArgs(prevValue, newValue);
        expect(await omniVault.name()).to.be.eq(newValue);
      });

      it("setName(): reverts when new name is blank", async function () {
        await expect(omniVault.setName("")).to.be.revertedWithCustomError(omniVault, "NullParams");
      });

      it("setName(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(signer1).setName("New name")).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("pause(): only owner can", async function () {
        expect(await omniVault.paused()).is.false;
        await expect(omniVault.pause()).to.emit(omniVault, "Paused").withArgs(owner.address);
        expect(await omniVault.paused()).is.true;
      });

      it("pause(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(signer1).pause()).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });

      it("pause(): reverts when already paused", async function () {
        await omniVault.pause();
        await expect(omniVault.pause()).revertedWithCustomError(omniVault, "EnforcedPause");
      });

      it("unpause(): only owner can", async function () {
        await omniVault.pause();
        expect(await omniVault.paused()).is.true;

        await expect(omniVault.unpause()).to.emit(omniVault, "Unpaused").withArgs(owner.address);
        expect(await omniVault.paused()).is.false;
      });

      it("unpause(): reverts when called by not an owner", async function () {
        await omniVault.pause();
        expect(await omniVault.paused()).is.true;
        await expect(omniVault.connect(signer1).unpause()).to.be.revertedWithCustomError(
          omniVault,
          "OwnableUnauthorizedAccount",
        );
      });
    });

    describe("Bridge", function () {
      describe("Send eth", function () {
        let TARGET = e18;

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        const args = [
          {
            name: "without extra value",
            extraValue: 0n,
            sender: () => operator,
            amount: async () => await omniVault.getFreeBalance(),
          },
          {
            name: "with extra value by operator",
            extraValue: randomBI(16),
            sender: () => operator,
            amount: async () => await omniVault.getFreeBalance(),
          },
          {
            name: "with extra value by owner",
            extraValue: randomBI(16),
            sender: () => owner,
            amount: async () => await omniVault.getFreeBalance(),
          },
          {
            name: "options amount < freeBalance",
            extraValue: 0n,
            sender: () => operator,
            amount: async () => 1n,
          },
        ];
        args.forEach(function (arg) {
          it(`sendEthToL1 ${arg.name}`, async function () {
            await omniVault.connect(signer1).deposit(signer1, { value: TARGET + e18 });
            const freeBalance = await omniVault.getFreeBalance();
            const amount = await arg.amount();
            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
            const sender = arg.sender();

            const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
            console.log("fee", fee.format());
            const extraValue = arg.extraValue;
            const tx = await omniVault.connect(sender).sendEthCrossChain(ETH_ID, options, { value: fee + extraValue });

            await expect(tx).emit(omniVault, "EthCrossChainSent").withArgs(amount, ETH_ID);
            await expect(tx).to.changeEtherBalance(rebalancer.address, amount);
            await expect(tx).to.changeEtherBalance(sender.address, -fee, { includeFee: false });
            await expect(tx).to.changeEtherBalance(omniVault.address, -amount); //Extra value returned to sender

            if (extraValue > 0n) {
              await expect(tx).to.emit(omniVault, "UnusedFeesSentBackToOperator").withArgs(extraValue);
            }
          });
        });

        it("Reverts freeBalance < options amount", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET + e18 });
          const amount = await omniVault.getFreeBalance();
          const options = Options.newOptions()
            .addExecutorLzReceiveOption(200_000n, amount + 1n)
            .toHex()
            .toString();

          const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
          await expect(
            omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee }),
          ).to.be.revertedWith("LayerZeroMock: not enough native for fees");
        });

        it("Reverts when fee is not enough", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET + e18 });
          const amount = await omniVault.getFreeBalance();
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();

          const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
          await expect(omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee - 1n }))
            .to.revertedWithCustomError(omniVault, "FeesAboveMsgValue")
            .withArgs(fee - 1n);
        });

        it("Reverts when there is no free balance", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET - 10n });
          expect(await omniVault.getFreeBalance()).to.be.eq(0n);

          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
          await expect(
            omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: 0n }),
          ).to.revertedWithCustomError(omniVault, "FreeBalanceTooLow");
        });

        it("Reverts when called by not an operator", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET * 2n });
          const amount = await omniVault.getFreeBalance();

          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
          await expect(
            omniVault.connect(signer1).sendEthCrossChain(ETH_ID, options, { value: fee }),
          ).to.revertedWithCustomError(omniVault, "OnlyOwnerOrOperator");
        });
      });

      describe("Send info", function () {
        let TARGET = e18;

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        const args = [
          {
            name: "When there are no eth and shares",
            depositedEthAmount: () => 0n,
            msgSender: () => operator,
          },
          {
            name: "After deposit",
            depositedEthAmount: () => randomBI(18),
            msgSender: () => operator,
          },
          {
            name: "After deposit when deposit bonus > 0",
            depositedEthAmount: () => e18,
            depositBonus: true,
            msgSender: () => operator,
          },
          {
            name: "When there are shares, but eth was sent to L1",
            depositedEthAmount: () => TARGET + e18,
            depositBonus: true,
            sentToL1EthAmount: amount => amount - TARGET,
            msgSender: () => operator,
          },
          {
            name: "Owner can call",
            depositedEthAmount: () => TARGET + randomBI(18),
            depositBonus: true,
            sentToL1EthAmount: amount => amount - TARGET,
            msgSender: () => owner,
          },
          {
            name: "With extra fee operator",
            depositedEthAmount: () => TARGET + randomBI(18),
            depositBonus: true,
            sentToL1EthAmount: amount => amount - TARGET,
            msgSender: () => operator,
            extra: randomBI(16),
          },
          {
            name: "With extra fee owner",
            depositedEthAmount: () => TARGET + randomBI(18),
            depositBonus: true,
            sentToL1EthAmount: amount => amount - TARGET,
            msgSender: () => owner,
            extra: randomBI(16),
          },
        ];
        args.forEach(function (arg) {
          it(`sendAssetsInfoToL1 ${arg.name}`, async function () {
            let amount = arg.depositedEthAmount();
            if (amount > 0n) {
              await omniVault.connect(signer1).deposit(signer1, { value: amount });
            }

            if (arg.depositBonus) {
              await addReplenishBonusToOmniVault(TARGET);
            }
            const depositBonus = await omniVault.depositBonusAmount();

            let sentToL1Amount = 0n;
            if (arg.sentToL1EthAmount) {
              sentToL1Amount = arg.sentToL1EthAmount(amount);
              const options = Options.newOptions()
                .addExecutorLzReceiveOption(200_000n, sentToL1Amount)
                .toHex()
                .toString();
              const fee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
              await omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee });
            }

            const vaultBalance = await ethers.provider.getBalance(omniVault.address);
            const freeBalance = await omniVault.getFreeBalance();
            const totalSupply = await iToken.totalSupply();
            const expectedVaultBalance = amount + depositBonus - sentToL1Amount;
            console.log("Vault balance:\t\t", vaultBalance.format());
            console.log("Free balance:\t\t", freeBalance.format());
            console.log("Deposit bonus:\t\t", depositBonus.format());
            console.log("Sent to L1 eth:\t\t", sentToL1Amount.format());
            console.log("Total deposited:\t", (await omniVault.getFlashCapacity()).format());
            expect(vaultBalance).to.be.eq(expectedVaultBalance);

            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
            let extraValue = 0n;
            if (arg.extra) {
              extraValue = arg.extra;
            }
            const fee = await omniVault.quoteSendAssetsInfoToL1(options);
            const sender = arg.msgSender();
            const tx = await omniVault.connect(sender).sendAssetsInfoToL1(options, { value: fee + extraValue });
            const rec = await tx.wait();
            const block = await ethers.provider.getBlock(rec?.blockNumber);
            await expect(tx)
              .emit(omniVault, "MessageToL1Sent")
              .withArgs(totalSupply, amount - sentToL1Amount);

            const txData = await rebalancer.getTransactionData(ARB_ID);
            expect(txData.timestamp).to.be.eq(block?.timestamp);
            expect(txData.ethBalance).to.be.eq(amount - sentToL1Amount);
            expect(txData.inceptionTokenBalance).to.be.eq(totalSupply);
            await expect(tx).to.changeEtherBalance(sender.address, -fee, { includeFee: false });
            if (extraValue > 0n) {
              await expect(tx).to.emit(omniVault, "UnusedFeesSentBackToOperator").withArgs(extraValue);
            }
          });
        });

        it("Reverts when called by not an operator", async function () {
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
          const fee = await omniVault.quoteSendAssetsInfoToL1(options);
          await expect(
            omniVault.connect(signer1).sendAssetsInfoToL1(options, { value: fee }),
          ).to.revertedWithCustomError(omniVault, "OnlyOwnerOrOperator");
        });

        it("Reverts when fee is not enough", async function () {
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
          const fee = await omniVault.quoteSendAssetsInfoToL1(options);
          await expect(omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee - 1n }))
            .to.revertedWithCustomError(omniVault, "FeesAboveMsgValue")
            .withArgs(fee - 1n);
        });

        it("Reverts when crosschain adapter is 0 address", async function () {
          const omniVaultFactory = await ethers.getContractFactory("InceptionERC20OmniVault");
          const newOmniVault = await upgrades.deployProxy(
            omniVaultFactory,
            ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
            { initializer: "initialize" },
          );
          newOmniVault.address = await newOmniVault.getAddress();
          await newOmniVault.setRatioFeed(ratioFeedL2.address);
          await iToken.setVault(newOmniVault.address);

          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
          const fee = await omniVault.quoteSendAssetsInfoToL1(options);
          await expect(
            newOmniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee }),
          ).to.revertedWithCustomError(newOmniVault, "CrossChainAdapterNotSet");
        });
      });
    });
  });
});

