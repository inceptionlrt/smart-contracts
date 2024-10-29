import { ethers, network, upgrades, deployments } from "hardhat";
import { expect } from "chai";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";
import { toWei, randomBI, e18, randomBIMax } from "./helpers/utils.js";
import { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";
import { AbiCoder, keccak256, Signer, toUtf8Bytes } from "ethers";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import {
  CToken,
  EndpointMock, InceptionOmniVault, InceptionRatioFeed, InceptionToken,
  LZCrossChainAdapterL1,
  LZCrossChainAdapterL2,
  ProtocolConfig,
  RatioFeed,
  NativeRebalancer,
  RestakingPool,
} from "../typechain-types";

BigInt.prototype.format = function () {
  return this.toLocaleString("de-DE");
};

const ARB_ID = 42161n;
const OPT_ID = 10n;
const ETH_ID = 1n;
const ARB_EID = 30101n;
const OPT_EID = 30110n;
const ETH_EID = 30111n;
const eIds = [ETH_EID, ARB_EID, OPT_EID];
const chainIds = [ETH_ID, ARB_ID, OPT_ID];
const RESTAKING_POOL_DISTRIBUTE_GAS_LIMIT = 250_000n;
const RESTAKING_POOL_MAX_TVL = 32n * e18;
const RESTAKING_POOL_MIN_STAKE = 1000n;
const options = "0x00030100110100000000000000000000000000030d40";

describe("Omnivault integration tests", function () {
  this.timeout(150000);
  //Adapters
  let adapterEth: LZCrossChainAdapterL1;
  let adapterArb: LZCrossChainAdapterL2;
  let adapterOpt: LZCrossChainAdapterL2;
  let ethEndpoint: EndpointMock;
  let arbEndpoint: EndpointMock;
  let optEndpoint: EndpointMock;
  //L1
  let ratioFeedL1: RatioFeed;
  let inEth: CToken;
  let rebalancer: NativeRebalancer;
  let restakingPool: RestakingPool;
  let restakingPoolConfig: ProtocolConfig;
  //L2
  let iToken: InceptionToken;
  let omniVault: InceptionOmniVault;
  let ratioFeedL2: InceptionRatioFeed;

  let owner: Signer;
  let operator: Signer;
  let treasury: Signer;
  let signer1: Signer;
  let signer2: Signer;
  let signer3: Signer;
  let target: Signer;

  let MAX_THRESHOLD, ratioThresh;
  let clean_snapshot: SnapshotRestorer;
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
    ethEndpoint.address = await ethEndpoint.getAddress();
    const LZCrossChainAdapterL1 = await ethers.getContractFactory("LZCrossChainAdapterL1");
    const adapterEth = await upgrades.deployProxy(LZCrossChainAdapterL1, [
      ethEndpoint.address,
      owner.address,
      eIds,
      chainIds,
    ]);
    adapterEth.address = await adapterEth.getAddress();

    console.log("=== Arbitrum LZCrossChainAdapterL2");
    const arbEndpoint = await ethers.deployContract("EndpointMock", [ARB_EID]);
    arbEndpoint.address = await arbEndpoint.getAddress();
    const LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");
    const adapterArb = await upgrades.deployProxy(LZCrossChainAdapterL2, [
      arbEndpoint.address,
      owner.address,
      ETH_ID,
      eIds,
      chainIds,
    ]);
    adapterArb.address = await adapterArb.getAddress();
    adapterArb.sendData = async function (timestamp, vaultBalance, totalSupply) {
      const message = encodePayload(timestamp, vaultBalance, totalSupply);
      const fees = await this.quote(message, options);
      return await this.sendDataL1(message, options, { value: fees });
    };

    console.log("=== Optimism LZCrossChainAdapterL2");
    const optEndpoint = await ethers.deployContract("EndpointMock", [OPT_EID]);
    optEndpoint.address = await optEndpoint.getAddress();
    const adapterOpt = await upgrades.deployProxy(LZCrossChainAdapterL2, [
      optEndpoint.address,
      owner.address,
      ETH_ID,
      eIds,
      chainIds,
    ]);
    adapterOpt.address = await adapterOpt.getAddress();
    adapterOpt.sendData = async function (timestamp, vaultBalance, totalSupply) {
      const message = encodePayload(timestamp, vaultBalance, totalSupply);
      const fees = await this.quote(message, options);
      return await this.sendDataL1(message, options, { value: fees });
    };

    //Connect endpoints
    await arbEndpoint.setDestLzEndpoint(adapterEth.address, ethEndpoint.address);
    await optEndpoint.setDestLzEndpoint(adapterEth.address, ethEndpoint.address);
    await ethEndpoint.setDestLzEndpoint(adapterArb.address, arbEndpoint.address);
    await ethEndpoint.setDestLzEndpoint(adapterOpt.address, optEndpoint.address);

    //   ____           _        _    _                                 _   _     _
    //  |  _ \ ___  ___| |_ __ _| | _(_)_ __   __ _   _ __   ___   ___ | | | |   / |
    //  | |_) / _ \/ __| __/ _` | |/ / | '_ \ / _` | | '_ \ / _ \ / _ \| | | |   | |
    //  |  _ <  __/\__ \ || (_| |   <| | | | | (_| | | |_) | (_) | (_) | | | |___| |
    //  |_| \_\___||___/\__\__,_|_|\_\_|_| |_|\__, | | .__/ \___/ \___/|_| |_____|_|
    //                                        |___/  |_|
    console.log("============ Restaking Pool Layer1 ============");
    console.log("=== ProtocolConfig");
    const protocolConfigAdminAddress = await upgrades.erc1967.getAdminAddress(
      network.config.addresses.restakingPoolConfig,
    );
    let slot = "0x" + (0).toString(16);
    let value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [protocolConfigAdminAddress, slot, value]);

    const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig", owner);
    const restakingPoolConfig = await upgrades.upgradeProxy(
      network.config.addresses.restakingPoolConfig,
      ProtocolConfig,
    );
    //Updating governance address
    slot = "0x" + getSlotByName("genesis.config.Governance");
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [network.config.addresses.restakingPoolConfig, slot, value]);

    console.log("=== RestakingPool");
    const restakingPoolAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.restakingPool);
    slot = "0x" + (0).toString(16);
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [restakingPoolAdminAddress, slot, value]);
    const RestakingPool = await ethers.getContractFactory("RestakingPool", {
      signer: owner,
      libraries: { InceptionLibrary: network.config.addresses.lib },
    });
    await upgrades.forceImport(network.config.addresses.restakingPool, RestakingPool);
    const restakingPool = await upgrades.upgradeProxy(network.config.addresses.restakingPool, RestakingPool, {
      unsafeAllowLinkedLibraries: true,
    });
    restakingPool.address = await restakingPool.getAddress();

    console.log("=== cToken");
    const cTokenAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.cToken);
    slot = "0x" + (0).toString(16);
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [cTokenAdminAddress, slot, value]);
    const CToken = await ethers.getContractFactory("cToken", owner);
    const cToken = await upgrades.upgradeProxy(network.config.addresses.cToken, CToken);
    cToken.address = await cToken.getAddress();

    console.log("=== RatioFeed");
    const ratioFeedAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.ratioFeed);
    slot = "0x" + (0).toString(16);
    value = ethers.zeroPadValue(owner.address, 32);
    await network.provider.send("hardhat_setStorageAt", [ratioFeedAdminAddress, slot, value]);
    const RatioFeed = await ethers.getContractFactory("RatioFeed", owner);
    const ratioFeedL1 = await upgrades.upgradeProxy(network.config.addresses.ratioFeed, RatioFeed);
    ratioFeedL1.address = await ratioFeedL1.getAddress();

    console.log("=== NativeRebalancer");
    const Rebalancer = await ethers.getContractFactory("NativeRebalancer");
    const rebalancer = await upgrades.deployProxy(Rebalancer, [
      cToken.address,
      lockboxAddress,
      restakingPool.address,
      adapterEth.address,
      ratioFeedL1.address,
      operator.address,
    ]);
    rebalancer.address = await rebalancer.getAddress();

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
    const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault", owner);
    const omniVault = await upgrades.deployProxy(
        omniVaultFactory,
        ["OmniVault", operator.address, iToken.address, adapterArb.address],
        { initializer: "__InceptionOmniVault_init" },
    );
    omniVault.address = await omniVault.getAddress();
    await omniVault.setRatioFeed(ratioFeedL2.address);
    await iToken.setVault(omniVault.address)

    return [
      adapterEth,
      ethEndpoint,
      adapterArb,
      arbEndpoint,
      adapterOpt,
      optEndpoint,
      cToken,
      rebalancer,
      ratioFeedL1,
      restakingPool,
      restakingPoolConfig,
      iToken,
      ratioFeedL2,
      omniVault
    ];
  }

  async function addReplenishBonus(amount) {
    let collectedFee = 0n;
    if (amount > 0n) {
      await omniVault.connect(signer3).deposit(signer3.address, { value: amount });
      const shares = await iToken.balanceOf(signer3.address);
      const tx = await omniVault.connect(signer3).flashWithdraw(shares, signer3.address);
      const rec = await tx.wait();
      collectedFee += (rec?.logs.find(l => l.eventName === "FlashWithdraw")?.args.fee || 0n) / 2n;
      console.log("Collected bonus:\t\t", collectedFee.format());
    }
    return collectedFee;
  }

  function encodePayload(timestamp, ethAmount, totalSupply) {
    const abiCoder = new AbiCoder();
    return abiCoder.encode(["uint256", "uint256", "uint256"], [timestamp, ethAmount, totalSupply]);
  }

  /**
   * @return slot number for the value by its internal name for restaking balance ProtocolConfig
   */
  function getSlotByName(name) {
    // Perform keccak256 hashing of the string
    const governanceHash = keccak256(toUtf8Bytes(name));

    // Convert the resulting hash to a BigInt
    const governanceUint = BigInt(governanceHash);

    // Subtract 1 from the hash
    const governanceUintMinus1 = governanceUint - 1n;

    // Use the AbiCoder to encode the uint256 type
    const abiCoder = new AbiCoder();
    const encodedValue = abiCoder.encode(["uint256"], [governanceUintMinus1]);

    // Re-hash the encoded result
    const finalHash = keccak256(encodedValue);

    // Perform bitwise AND operation with ~0xff (mask out the last byte)
    const mask = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00");
    const governanceSlot = BigInt(finalHash) & mask;

    // Return the result as a hex string (without '0x' prefix)
    return governanceSlot.toString(16);
  }

  before(async function () {
    [owner, operator, treasury, signer1, signer2, signer3, target] = await ethers.getSigners();
    [
      adapterEth,
      ethEndpoint,
      adapterArb,
      arbEndpoint,
      adapterOpt,
      optEndpoint,
      inEth,
      rebalancer,
      ratioFeedL1,
      restakingPool,
      restakingPoolConfig,
      iToken,
      ratioFeedL2,
      omniVault
    ] = await init(owner, operator);
    clean_snapshot = await takeSnapshot();

    await rebalancer.connect(owner).addChainId(ARB_ID);
    await rebalancer.connect(owner).addChainId(OPT_ID);

    await adapterEth.setTargetReceiver(rebalancer.address);
    await adapterEth.setPeer(ARB_EID, ethers.zeroPadValue(adapterArb.address, 32));
    await adapterEth.setPeer(OPT_EID, ethers.zeroPadValue(adapterOpt.address, 32));
    await adapterArb.setTargetReceiver(omniVault.address);
    await adapterArb.setPeer(ETH_EID, ethers.zeroPadValue(adapterEth.address, 32));
    await adapterOpt.setPeer(ETH_EID, ethers.zeroPadValue(adapterEth.address, 32));

    //Restaking pool
    await restakingPoolConfig.connect(owner).setRebalancer(rebalancer.address);
    // await restakingPool.connect(owner).setFlashUnstakeFeeParams(30n * 10n ** 7n, 5n * 10n ** 7n, 25n * 10n ** 8n);
    // await restakingPool.connect(owner).setStakeBonusParams(15n * 10n ** 7n, 25n * 10n ** 6n, 25n * 10n ** 8n);
    // await restakingPool.connect(owner).setProtocolFee(50n * 10n ** 8n);
    // await restakingPool.connect(owner).setTargetFlashCapacity(1n);
    // await restakingPool.connect(owner).setMinStake(RESTAKING_POOL_MIN_STAKE);

    //OmniVault
    await omniVault.setTreasuryAddress(treasury.address);

    snapshot = await takeSnapshot();
  });

  describe("Restaking pool", function () {
    describe("After deployments checks", function () {
      before(async function () {
        await snapshot.restore();
      });

      it("Signer can stake", async function () {
        await restakingPool.connect(signer1)["stake()"]({ value: 2n * e18 });
      });

      it("Get min stake amount", async function () {
        console.log("Min stake amount: ", await restakingPool.getMinStake());
      });
    });
  });

  describe("Rebalancer", function () {
    describe("After deployments checks", function () {
      before(async function () {
        await snapshot.restore();
      });

      //Constants
      it("MULTIPLIER", async function () {
        expect(await rebalancer.MULTIPLIER()).to.be.eq(e18);
      });

      //Addresses
      it("Inception token address", async function () {
        expect(await rebalancer.inceptionToken()).to.be.eq(inEth.address);
      });

      it("Restaking pool address", async function () {
        expect(await rebalancer.liqPool()).to.be.eq(restakingPool.address);
      });

      it("Lockbox address", async function () {
        expect(await rebalancer.lockboxAddress()).to.be.eq(lockboxAddress);
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
    });

    describe("Getters and setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
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

      let chain = randomBI(4);
      let adapter = ethers.Wallet.createRandom().address;
      let newAdapter = ethers.Wallet.createRandom().address;

      it("addChainId only owner can", async function () {
        // const chainsBefore = await rebalancer.chainIds();
        await rebalancer.connect(owner).addChainId(chain);

        // const chainsAfter = await rebalancer.chainIds();
        // expect([...chainsAfter]).to.include.members([...chainsBefore])
        // expect(chainsAfter).to.include(chain);
      });

      it("addChainId reverts when chain is added already", async function () {
        await expect(rebalancer.connect(owner).addChainId(chain))
          .to.be.revertedWithCustomError(rebalancer, "ChainIdAlreadyExists")
          .withArgs(chain);
      });

      it("addChainId reverts when called by not an owner", async function () {
        await expect(rebalancer.connect(signer1).addChainId(chain + 1n))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      it("addAdapter only owner can", async function () {
        await expect(rebalancer.connect(owner).addAdapter(chain, adapter))
          .to.emit(rebalancer, "AdapterAdded")
          .withArgs(chain, adapter);

        expect(await rebalancer.adapters(chain)).to.be.eq(adapter);
      });

      it("addAdapter reverts when adapter is already set for the chain", async function () {
        await expect(rebalancer.connect(owner).addAdapter(chain, adapter))
          .to.revertedWithCustomError(rebalancer, "AdapterAlreadyExists")
          .withArgs(chain);
      });

      it("addAdapter reverts when called by not an owner", async function () {
        const anotherChain = randomBI(5);
        await rebalancer.connect(owner).addChainId(anotherChain);

        const anotherAdapter = ethers.Wallet.createRandom().address;
        await expect(rebalancer.connect(signer1).addAdapter(anotherChain, anotherAdapter))
          .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
          .withArgs(signer1.address);
      });

      // it("replaceAdapter only owner can", async function () {
      //     newAdapter = ethers.Wallet.createRandom().address;
      //     await expect(rebalancer.connect(owner).replaceAdapter(chain, newAdapter))
      //         .to.emit(rebalancer, "AdapterReplaced")
      //         .withArgs(chain, adapter, newAdapter);
      //
      //     expect(await rebalancer.adapters(chain)).to.be.eq(newAdapter);
      // })
      //
      // it("replaceAdapter reverts when adapter is not set", async function () {
      //     const chainId = randomBI(6);
      //     await expect(rebalancer.connect(owner).replaceAdapter(chainId, adapter))
      //         .to.revertedWithCustomError(rebalancer, "NoAdapterForThisChainId")
      //         .withArgs(chainId);
      // })
      //
      // it("replaceAdapter reverts when called by not an owner", async function () {
      //     await expect(rebalancer.connect(signer1).replaceAdapter(chain, newAdapter))
      //         .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
      //         .withArgs(signer1.address);
      // })

      it("getTransactionData when there is not such", async function () {
        const res = await rebalancer.getTransactionData(chain);
        console.log(res);
      });
    });

    describe("Update data", function () {
      let initialArbAmount, initialArbSupply;
      let initialOptAmount, initialOptSupply;

      before(async function () {
        await snapshot.restore();
        const amount = 2n * e18;
        await restakingPool.connect(signer1)["stake()"]({ value: amount });
        const initialAmount = await inEth.balanceOf(lockboxAddress);
        initialArbAmount = initialAmount / 2n;
        initialArbSupply = initialAmount / 2n;
        initialOptAmount = initialAmount - initialArbAmount;
        initialOptSupply = initialAmount - initialArbAmount;
      });

      it("Reverts when there is no data for one of the chains", async function () {
        await expect(rebalancer.updateTreasuryData()).to.revertedWithCustomError(
          rebalancer,
          "MissingOneOrMoreL2Transactions",
        );
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        const balance = randomBI(19);
        const totalSupply = randomBI(19);
        const message = encodePayload(timestamp, balance, totalSupply);

        const fees = await adapterArb.quote(message, options);
        await adapterArb.sendDataL1(message, options, { value: fees });

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
          name: "Increase only inEth supply ARB",
          arb: {
            l2BalanceDiff: () => 0n,
            l2TotalSupplyDiff: () => ethers.parseEther("1.5"),
          },
        },
        {
          name: "Increase only inEth supply OPT",
          opt: {
            l2BalanceDiff: () => 0n,
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
            l2BalanceDiff: () => -initialArbSupply,
            l2TotalSupplyDiff: () => -initialArbSupply,
          },
        },
        {
          name: "Decrease to 0 OPT",
          opt: {
            l2BalanceDiff: () => -initialOptSupply,
            l2TotalSupplyDiff: () => -initialOptSupply,
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
            initialArbAmount += arg.arb.l2BalanceDiff();
            initialArbSupply += arg.arb.l2TotalSupplyDiff();

            const message = encodePayload(timestamp, initialArbAmount, initialArbSupply);
            const fees = await adapterArb.quote(message, options);
            await adapterArb.sendDataL1(message, options, { value: fees });
          }
          if (arg.opt) {
            expectedTotalSupplyDiff += arg.opt.l2TotalSupplyDiff();
            initialOptAmount += arg.opt.l2BalanceDiff();
            initialOptSupply += arg.opt.l2TotalSupplyDiff();

            const message = encodePayload(timestamp, initialOptAmount, initialOptSupply);
            const fees = await adapterOpt.quote(message, options);
            await adapterOpt.sendDataL1(message, options, { value: fees });
          }
          console.log(`Expected supply diff: ${expectedTotalSupplyDiff.format()}`);
          const expectedLockboxBalance = initialArbSupply + initialOptSupply;
          const totalSupplyBefore = await inEth.totalSupply();

          let tx = await rebalancer.updateTreasuryData();

          const totalSupplyAfter = await inEth.totalSupply();
          const lockboxBalanceAfter = await inEth.balanceOf(lockboxAddress);
          console.log("Lockbox inEth balance:", lockboxBalanceAfter.format());

          expect(totalSupplyAfter - totalSupplyBefore).to.be.eq(expectedTotalSupplyDiff);
          expect(lockboxBalanceAfter).to.be.eq(expectedLockboxBalance);
          if (expectedTotalSupplyDiff > 0n) {
            await expect(tx).to.emit(rebalancer, "TreasuryUpdateMint").withArgs(expectedTotalSupplyDiff);
          }
          if (expectedTotalSupplyDiff == 0n) {
            await expect(tx)
              .to.not.emit(rebalancer, "TreasuryUpdateMint")
              .and.to.not.emit(rebalancer, "TreasuryUpdateBurn");
          }
          if (expectedTotalSupplyDiff < 0n) {
            await expect(tx)
              .to.emit(rebalancer, "TreasuryUpdateBurn")
              .withArgs(0n - expectedTotalSupplyDiff);
          }
        });
      });

      it("updateTreasuryData reverts when total supply is the same", async function () {
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        await adapterArb.sendData(timestamp, e18, e18);
        await adapterOpt.sendData(timestamp, e18, e18);
        await rebalancer.updateTreasuryData();

        await expect(rebalancer.updateTreasuryData()).to.be.revertedWithCustomError(
          rebalancer,
          "NoRebalancingRequired",
        );
      });

      it("inEth leftover on rebalancer will be transferred to the lockbox", async function () {
        await snapshot.restore();
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp;
        await restakingPool.connect(signer1)["stake()"]({ value: 2n * e18 });

        const totalSupplyBefore = await inEth.totalSupply();
        const lockboxBalanceBefore = await inEth.balanceOf(lockboxAddress);
        //Report L2 info
        const l2SupplyChange = e18;
        await adapterArb.sendData(timestamp, lockboxBalanceBefore / 2n, lockboxBalanceBefore / 2n + l2SupplyChange);
        await adapterOpt.sendData(timestamp, lockboxBalanceBefore / 2n, lockboxBalanceBefore / 2n + l2SupplyChange);

        const amount = randomBI(17);
        await inEth.connect(signer1).transfer(rebalancer.address, amount);

        await expect(rebalancer.updateTreasuryData()).to.emit(rebalancer, "InETHDepositedToLockbox").withArgs(amount);
        console.log(`Total supply: ${(await inEth.totalSupply()).format()}`);

        const totalSupplyAfter = await inEth.totalSupply();
        const lockboxBalanceAfter = await inEth.balanceOf(lockboxAddress);
        expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(l2SupplyChange * 2n, 1n);
        expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.closeTo(l2SupplyChange * 2n + amount, 1n);
      });
    });

    describe("Stake", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      const args = [
        {
          name: "Part of the balance",
          balance: async () => await restakingPool.availableToStake(),
          amount: async amount => amount / 2n,
        },
        {
          name: "All balance",
          balance: async () => await restakingPool.availableToStake(),
          amount: async amount => amount,
        },
        {
          name: "Restaking pool min amount",
          balance: async () => await restakingPool.availableToStake(),
          amount: async () => await restakingPool.getMinStake(),
        },
      ];

      args.forEach(function (arg) {
        it(`${arg.name}`, async function () {
          const balance = await arg.balance();
          await signer1.sendTransaction({ value: balance, to: rebalancer.address });

          const amount = await arg.amount(balance);
          const shares = await inEth.convertToShares(amount);
          const lockboxInEthBalanceBefore = await inEth.balanceOf(lockboxAddress);

          const tx = await rebalancer.connect(operator).stake(amount);
          await expect(tx)
            .emit(rebalancer, "InceptionTokenDepositedToLockbox").withArgs(shares)
            .and
            .emit(restakingPool, "Staked").withArgs(rebalancer.address, amount, shares);

          const lockboxInEthBalanceAfter = await inEth.balanceOf(lockboxAddress);
          console.log("Signer eth balance after: ", await ethers.provider.getBalance(signer1.address));
          console.log("Restaking pool eth balance: ", await ethers.provider.getBalance(restakingPool.address));
          console.log("lockbox inEth balance: ", await inEth.balanceOf(lockboxAddress));

          //Everything was staked goes to the lockbox
          expect(lockboxInEthBalanceAfter - lockboxInEthBalanceBefore).to.be.eq(shares);
          expect(await inEth.balanceOf(rebalancer.address)).to.be.eq(0n);
        });
      });

      it("Reverts when amount > available to stake from restaking pool", async function () {
        const amount = (await restakingPool.availableToStake()) + 1n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount)).to.revertedWithCustomError(
          rebalancer,
          "StakeAmountExceedsMaxTVL",
        );
      });

      it("Reverts when amount > eth balance", async function () {
        const amount = (await restakingPool.availableToStake()) / 2n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount + 1n)).to.revertedWithCustomError(
          rebalancer,
          "StakeAmountExceedsEthBalance",
        );
      });

      it("Reverts when amount < restaking pool min stake", async function () {
        const amount = (await restakingPool.getMinStake()) - 1n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(operator).stake(amount)).to.revertedWithCustomError(
          restakingPool,
          "PoolStakeAmLessThanMin",
        );
      });

      it("Reverts when called by not an operator", async function () {
        const amount = (await restakingPool.availableToStake()) / 2n;
        await signer1.sendTransaction({ value: amount, to: rebalancer.address });
        await expect(rebalancer.connect(signer1).stake(amount)).to.revertedWithCustomError(rebalancer, "OnlyOperator");
      });
    });

    describe("sendEthToL2", function () {
      before(async function () {
        const balance = await restakingPool.availableToStake();
        await signer1.sendTransaction({ value: balance, to: rebalancer.address });
        // await arbAdapter.setInbox("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f");
        // await arbAdapter.connect(owner).setGasParameters(
        //     2n * 10n ** 15n,
        //     200_000n,
        //     100_000_000n
        // );
      });

      const args = [
        {
          name: "Part of the balance to ARB",
          amount: async amount => amount / 2n,
          feeParams: () => encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n),
          fees: 2n * 10n ** 16n,
          chainId: ARB_ID,
          event: "RetryableTicketCreated",
          adapter: () => adapterArb,
        },
        {
          name: "Part of the balance to OPT",
          amount: async amount => amount / 2n,
          feeParams: () => encodeOptimismFees(200_000n),
          fees: 0n,
          chainId: OPT_ID,
          event: "CrossChainTxOptimismSent",
          adapter: () => adapterOpt,
        },
        {
          name: "All balance to ARB",
          amount: async amount => amount,
          feeParams: () => encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n),
          fees: 2n * 10n ** 16n,
          chainId: ARB_ID,
          event: "RetryableTicketCreated",
          adapter: () => adapterArb,
        },
        {
          name: "All balance to OPT",
          amount: async amount => amount,
          feeParams: () => encodeOptimismFees(200_000n),
          fees: 0n,
          chainId: OPT_ID,
          event: "CrossChainTxOptimismSent",
          adapter: () => adapterOpt,
        },
      ];

      args.forEach(function (arg) {
        it(`${arg.name}`, async function () {
          const balance = await ethers.provider.getBalance(rebalancer.address);
          const amount = await arg.amount(balance);
          const adapter = arg.adapter();
          const feeParams = arg.feeParams();
          const fees = arg.fees;
          const tx = await rebalancer.connect(operator).sendEthToL2(arg.chainId, amount, feeParams, { value: fees });
          await expect(tx).to.emit(adapter, arg.event);
          await expect(tx).to.changeEtherBalance(rebalancer, -amount);
          await expect(tx).to.changeEtherBalance(adapter, 0n);
          await expect(tx).to.changeEtherBalance(operator, -fees, { includeFee: false });
        });
      });

      it("Reverts when amount > eth balance", async function () {
        const fees = 2n * 10n ** 15n;
        await signer1.sendTransaction({ value: e18, to: rebalancer.address });
        const amount = await ethers.provider.getBalance(rebalancer.address);
        const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
        await expect(
          rebalancer.connect(operator).sendEthToL2(ARB_ID, amount + 1n, feeParams, { value: fees }),
        ).to.revertedWithCustomError(rebalancer, "SendAmountExceedsEthBalance");
      });

      it("Reverts when called by not an operator", async function () {
        const fees = 2n * 10n ** 15n;
        await signer1.sendTransaction({ value: e18, to: rebalancer.address });
        const amount = await ethers.provider.getBalance(rebalancer.address);
        const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
        await expect(
          rebalancer.connect(signer1).sendEthToL2(ARB_ID, amount, feeParams, { value: fees }),
        ).to.revertedWithCustomError(rebalancer, "OnlyOperator");
      });

      it("Reverts when there is no adapter for the chain", async function () {
        await signer1.sendTransaction({ value: e18, to: rebalancer.address });
        const fees = 2n * 10n ** 15n;
        const amount = await ethers.provider.getBalance(rebalancer.address);
        const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
        await expect(
          rebalancer.connect(operator).sendEthToL2(randomBI(4), amount, feeParams, { value: fees }),
        ).to.revertedWithCustomError(rebalancer, "CrosschainAdapterNotSet");
      });
    });

    describe("handleL2Info", function () {
      it("handleL2Info reverts when called by not an adapter", async function () {
        const block = await ethers.provider.getBlock("latest");
        const chainId = ARB_ID;
        const timestamp = block.timestamp;
        const balance = e18;
        const totalSupply = e18;

        await expect(rebalancer.connect(owner).handleL2Info(chainId, timestamp, balance, totalSupply))
          .to.be.revertedWithCustomError(rebalancer, "MsgNotFromAdapter")
          .withArgs(owner.address);
      });
    });
  });

  describe("Crosschain adapter Arbitrum", function () {
    describe("Getters and setters", function () {
      beforeEach(async function () {
        await snapshot.restore();
      });

      const setters = [
        {
          name: "receiver address",
          setter: "setTargetReceiver",
          getter: "targetReceiver",
          event: "TargetReceiverChanged",
        },
      ];

      setters.forEach(function (arg) {
        it(`Set new ${arg.name}`, async function () {
          const prevValue = await adapterArb[arg.getter]();
          const newValue = ethers.Wallet.createRandom().address;
          await expect(adapterArb[arg.setter](newValue)).to.emit(adapterArb, arg.event).withArgs(prevValue, newValue);

          expect(await adapterArb[arg.getter]()).to.be.eq(newValue);
        });

        it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
          const newValue = ethers.Wallet.createRandom().address;
          await expect(adapterArb.connect(signer1)[arg.setter](newValue)).to.be.revertedWith(
            "Ownable: caller is not the owner",
          );
        });

        it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
          const newValue = ethers.ZeroAddress;
          await expect(adapterArb[arg.setter](newValue)).to.be.revertedWithCustomError(
            adapterArb,
            "SettingZeroAddress",
          );
        });
      });

      it("setPeer: sets target address by chain", async function () {
        const eid = randomBI(8);
        const target = ethers.Wallet.createRandom();
        const peer = ethers.zeroPadValue(target.address, 32);

        await expect(adapterArb.setPeer(eid, peer)).to.emit(adapterArb, "PeerSet").withArgs(eid, peer);

        expect(await adapterArb.peers(eid)).to.be.eq(peer);
      });

      it("setPeer reverts when called by not an owner", async function () {
        const eid = randomBI(8);
        const target = ethers.Wallet.createRandom();
        const peer = ethers.zeroPadValue(target.address, 32);

        await expect(adapterArb.connect(signer1).setPeer(eid, peer)).to.be.revertedWithCustomError(
          adapterArb,
          "OwnableUnauthorizedAccount",
        );
      });

      it("setChainIdFromEid: maps chaind id by eid", async function () {
        const eid = randomBI(8);
        const chainId = randomBI(8);
        await expect(adapterArb.setChainIdFromEid(eid, chainId)).to.emit(adapterArb, "ChainIdAdded").withArgs(chainId);
        expect(await adapterArb.getChainIdFromEid(eid)).to.be.eq(chainId);
        expect(await adapterArb.getEidFromChainId(chainId)).to.be.eq(eid);
      });

      it("setChainIdFromEid reverts when called by not an owner", async function () {
        const eid = randomBI(8);
        const chainId = randomBI(8);

        await expect(adapterArb.connect(signer1).setChainIdFromEid(eid, chainId)).to.be.revertedWithCustomError(
          adapterArb,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Owner", async function () {
        expect(await adapterArb.owner()).to.be.eq(owner.address);
      });

      it("Endpoint", async function () {
        expect(await adapterArb.endpoint()).to.be.eq(arbEndpoint.address);
      });

      it("Operator", async function () {
        expect(await adapterArb.operator()).to.be.eq(operator.address);
      });
    });

    describe("receiveL2Eth", function () {
      before(async function () {
        await snapshot.restore();
      });

      const args = [
        {
          name: "Random amount ~ 1e17",
          amount: async () => randomBI(17),
        },
        {
          name: "Restaking pool min amount",
          amount: async () => await restakingPool.getMinStake(),
        },
        {
          name: "Greater than available to stake",
          amount: async () => (await restakingPool.availableToStake()) + 1n,
        },
      ];

      args.forEach(function (arg) {
        it(arg.name, async function () {
          const amount = await arg.amount();
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const fees = await adapterArb.quoteSendEth(ETH_ID, options);
          const tx = await adapterArb.connect(owner).sendEthCrossChain(ETH_ID, options, { value: fees });
          await expect(tx)
            .and.emit(adapterEth, "CrossChainEthDeposit")
            .withArgs(ARB_ID, amount)
            .and.emit(rebalancer, "ETHReceived")
            .withArgs(adapterEth.address, amount);
          await expect(tx).to.changeEtherBalance(rebalancer.address, amount);
          await expect(tx).to.changeEtherBalance(owner.address, -fees, { includeFee: false });
        });
      });

      it("Reverts when caller is not endpoint", async function () {
        const maliciousEndpoint = await ethers.deployContract("EndpointMock", [ETH_EID]);
        maliciousEndpoint.address = await maliciousEndpoint.getAddress();
        await arbEndpoint.setDestLzEndpoint(adapterEth.address, maliciousEndpoint.address);

        const amount = randomBI(18);
        const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
        const fees = await adapterArb.quoteSendEth(ETH_ID, options);
        await expect(adapterArb.sendEthCrossChain(ETH_ID, options, { value: fees }))
          .to.revertedWithCustomError(adapterEth, "OnlyEndpoint")
          .withArgs(maliciousEndpoint.address);
      });

      it("Reverts when sent from unknown address", async function () {
        await arbEndpoint.setDestLzEndpoint(adapterEth.address, ethEndpoint.address);
        const LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");
        const maliciousAdapter = await upgrades.deployProxy(LZCrossChainAdapterL2, [
          arbEndpoint.address,
          owner.address,
          ETH_ID,
          eIds,
          chainIds,
        ]);
        maliciousAdapter.address = await maliciousAdapter.getAddress();
        maliciousAdapter.sendData = async function (timestamp, vaultBalance, totalSupply) {
          const message = encodePayload(timestamp, vaultBalance, totalSupply);
          const fees = await this.quote(message, options);
          return await this.sendDataL1(message, options, { value: fees });
        };
        await maliciousAdapter.setPeer(ETH_EID, ethers.zeroPadValue(adapterEth.address, 32));

        const amount = randomBI(18);
        const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
        const fees = await maliciousAdapter.quoteSendEth(ETH_ID, options);
        await expect(maliciousAdapter.sendEthCrossChain(ETH_ID, options, { value: fees }))
          .to.be.revertedWithCustomError(adapterEth, "OnlyPeer")
          .withArgs(ARB_EID, ethers.zeroPadValue(maliciousAdapter.address, 32));
      });
    });

    describe("receiveL2Info", function () {
      let lastHandleTime;
      before(async function () {
        await snapshot.restore();
      });

      it("receiveL2Info", async () => {
        const block = await ethers.provider.getBlock("latest");
        lastHandleTime = block.timestamp - 1000;
        const _balance = 100;
        const _totalSupply = 100;

        await expect(adapterArb.sendData(lastHandleTime, _balance, _totalSupply))
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

        await expect(adapterArb.sendData(lastHandleTime, balance, totalSupply))
          .to.revertedWithCustomError(rebalancer, "TimeBeforePrevRecord")
          .withArgs(lastHandleTime);
      });

      it("Reverts when timestamp is in the future", async function () {
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp + 100;
        const balance = 100;
        const totalSupply = 100;

        await expect(adapterArb.sendData(timestamp, balance, totalSupply))
          .to.revertedWithCustomError(rebalancer, "TimeCannotBeInFuture")
          .withArgs(timestamp);
      });

      it("Reverts when caller is not endpoint", async function () {
        const maliciousEndpoint = await ethers.deployContract("EndpointMock", [ETH_EID]);
        maliciousEndpoint.address = await maliciousEndpoint.getAddress();
        await arbEndpoint.setDestLzEndpoint(adapterEth.address, maliciousEndpoint.address);

        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp - 1;
        const balance = 300;
        const totalSupply = 300;

        await expect(adapterArb.sendData(timestamp, balance, totalSupply))
          .to.revertedWithCustomError(adapterEth, "OnlyEndpoint")
          .withArgs(maliciousEndpoint.address);
      });

      it("Reverts when l2 sender is unknown", async function () {
        await arbEndpoint.setDestLzEndpoint(adapterEth.address, ethEndpoint.address);
        const block = await ethers.provider.getBlock("latest");
        const timestamp = block.timestamp + 100;
        const balance = 100;
        const totalSupply = 100;

        const LZCrossChainAdapterL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");
        const maliciousAdapter = await upgrades.deployProxy(LZCrossChainAdapterL2, [
          arbEndpoint.address,
          owner.address,
          ETH_ID,
          eIds,
          chainIds,
        ]);
        maliciousAdapter.address = await maliciousAdapter.getAddress();
        maliciousAdapter.sendData = async function (timestamp, vaultBalance, totalSupply) {
          const message = encodePayload(timestamp, vaultBalance, totalSupply);
          const fees = await this.quote(message, options);
          return await this.sendDataL1(message, options, { value: fees });
        };
        await maliciousAdapter.setPeer(ETH_EID, ethers.zeroPadValue(adapterEth.address, 32));

        await expect(maliciousAdapter.sendData(timestamp, balance, totalSupply))
          .to.be.revertedWithCustomError(adapterEth, "OnlyPeer")
          .withArgs(ARB_EID, ethers.zeroPadValue(maliciousAdapter.address, 32));
      });
    });

    describe("sendEthToL2", function () {
      before(async function () {
        await snapshot.restore();
        // await arbAdapter.setRebalancer(signer1.address);
      });

      it("Reverts when called by not a rebalancer", async function () {
        const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
        const value = e18;
        await expect(arbAdapter.connect(signer2).sendEthToL2(value, feesParams, { value: value }))
          .to.be.revertedWithCustomError(arbAdapter, "OnlyRebalancerCanCall")
          .withArgs(signer2.address);
      });

      it("Reverts amount > value", async function () {
        const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
        const value = e18;
        await expect(
          arbAdapter.connect(signer1).sendEthToL2(value + 1n, feesParams, { value: value }),
        ).to.be.revertedWithCustomError(arbAdapter, "InvalidValue");
      });

      it("Reverts when gas params are zero", async function () {
        const value = e18;
        let feeParams = encodeArbitrumFees(0n, 200_000n, 100_000_000n);
        await expect(
          arbAdapter.connect(signer1).sendEthToL2(value, feeParams, { value: value }),
        ).to.revertedWithCustomError(arbAdapter, "SettingZeroGas");

        feeParams = encodeArbitrumFees(2n * 10n ** 15n, 0n, 100_000_000n);
        await expect(
          arbAdapter.connect(signer1).sendEthToL2(value, feeParams, { value: value }),
        ).to.revertedWithCustomError(arbAdapter, "SettingZeroGas");

        feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 0n);
        await expect(
          arbAdapter.connect(signer1).sendEthToL2(value, feeParams, { value: value }),
        ).to.revertedWithCustomError(arbAdapter, "SettingZeroGas");
      });
    });

    describe("recoverFunds", function () {
      before(async function () {
        await snapshot.restore();
      });

      it("Operator can transfer funds from adapter to rebalancer", async function () {
        const amount = e18;
        await expect(signer1.sendTransaction({ to: arbAdapter.address, value: amount }))
          .to.emit(arbAdapter, "ReceiveTriggered")
          .withArgs(signer1.address, amount);

        const tx = arbAdapter.connect(operator).recoverFunds();
        await expect(tx).to.changeEtherBalance(arbAdapter, -amount);
        await expect(tx).to.changeEtherBalance(rebalancer, amount);
      });

      it("Reverts when called by not an operator", async function () {
        const amount = e18;
        await expect(signer1.sendTransaction({ to: arbAdapter.address, value: amount }))
          .to.emit(arbAdapter, "ReceiveTriggered")
          .withArgs(signer1.address, amount);

        await expect(arbAdapter.connect(signer1).recoverFunds()).to.be.revertedWithCustomError(
          arbAdapter,
          "OnlyOperatorCanCall",
        );
      });
    });
  });

  // describe("Contracts config test", function () {
  //   beforeEach(async function () {
  //     await clean_snapshot.restore();
  //     await txStorage.connect(owner).addChainId(ARB_ID);
  //     await txStorage.connect(owner).addAdapter(ARB_ID, arbAdapter.address);
  //     await txStorage.connect(owner).addChainId(OPT_ID);
  //     await txStorage.connect(owner).addAdapter(OPT_ID, optAdapter.address);
  //   });
  //
  //   it("ArbitrumAdapterL1.receiveL2Eth reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await arbAdapter.setL2Sender(target);
  //     await arbAdapter.setL2Receiver(target.address);
  //
  //     await expect(arbBridgeMock.connect(signer1).receiveL2Eth({ value: e18 })).to.revertedWithCustomError(
  //       arbAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  //
  //   it("ArbitrumAdapterL1.sendEthToL2 reverts when l2 receiver is not set", async function () {
  //     //Arbitrum adapter
  //     await arbAdapter.setRebalancer(signer1.address);
  //     await arbAdapter.setL2Sender(target.address);
  //
  //     const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
  //     const value = e18;
  //     await expect(
  //       arbAdapter.connect(signer1).sendEthToL2(value, feesParams, { value: value }),
  //     ).to.revertedWithCustomError(arbAdapter, "L2ReceiverNotSet");
  //   });
  //
  //   it("ArbitrumAdapterL1.receiveL2Info reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await arbAdapter.setL2Sender(target);
  //     await arbAdapter.setL2Receiver(target.address);
  //
  //     const block = await ethers.provider.getBlock("latest");
  //     const timestamp = block.timestamp + 100;
  //     const balance = 100;
  //     const totalSupply = 100;
  //     await expect(arbBridgeMock.receiveL2Info(timestamp, balance, totalSupply)).to.revertedWithCustomError(
  //       arbAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  //
  //   it("ArbitrumAdapterL1.recoverFunds reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await arbAdapter.setL2Sender(target);
  //     await arbAdapter.setL2Receiver(target.address);
  //
  //     await signer1.sendTransaction({ to: arbAdapter.address, value: e18 });
  //     await expect(arbAdapter.connect(operator).recoverFunds()).to.be.revertedWithCustomError(
  //       arbAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  //
  //   it("OptimismAdapterL1.receiveL2Eth reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await optAdapter.setL2Sender(target);
  //     await optAdapter.setL2Receiver(target.address);
  //
  //     await expect(optBridgeMock.connect(signer1).receiveL2Eth({ value: e18 })).to.revertedWithCustomError(
  //       optAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  //
  //   it("OptimismAdapterL1.receiveL2Info reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await optAdapter.setL2Sender(target);
  //     await optAdapter.setL2Receiver(target.address);
  //
  //     const block = await ethers.provider.getBlock("latest");
  //     const timestamp = block.timestamp + 100;
  //     const balance = 100;
  //     const totalSupply = 100;
  //     await expect(optBridgeMock.receiveL2Info(timestamp, balance, totalSupply)).to.revertedWithCustomError(
  //       optAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  //
  //   it("OptimismAdapterL1.sendEthToL2 reverts when l2 receiver is not set", async function () {
  //     //Arbitrum adapter
  //     await optAdapter.setRebalancer(signer1.address);
  //     await optAdapter.setL2Sender(target.address);
  //
  //     const feesParams = encodeOptimismFees(200_000n);
  //     const value = e18;
  //     await expect(
  //       optAdapter.connect(signer1).sendEthToL2(value, feesParams, { value: value }),
  //     ).to.revertedWithCustomError(optAdapter, "L2ReceiverNotSet");
  //   });
  //
  //   it("OptimismAdapterL1.recoverFunds reverts when rebalancer is not set", async function () {
  //     //Arbitrum adapter
  //     await optAdapter.setL2Sender(target);
  //     await optAdapter.setL2Receiver(target.address);
  //
  //     await signer1.sendTransaction({ to: optAdapter.address, value: e18 });
  //     await expect(optAdapter.connect(operator).recoverFunds()).to.be.revertedWithCustomError(
  //       optAdapter,
  //       "RebalancerNotSet",
  //     );
  //   });
  // });

  describe("OmniVault", function () {

    it("Treasury", async function() {
      console.log(await omniVault.treasury());
    })

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
          let availableBonus = await addReplenishBonus(arg.withdrawFeeFrom());

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
        await expect(omniVault.connect(signer1).deposit(signer1.address, { value: depositAmount }))
            .revertedWithCustomError(omniVault, "EnforcedPause");;
        await omniVault.unpause();
      });

      it("Reverts when shares is 0", async function () {
        await omniVault.setMinAmount(0n);
        await expect(omniVault.connect(signer1).deposit(signer1.address, { value: 0n }))
            .revertedWithCustomError(omniVault, "ResultISharesZero");
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
          expect(withdrawEvent[0].args["amount"]).to.be.closeTo(amount - expectedFee, 1n);
          expect(withdrawEvent[0].args["iShares"]).to.be.closeTo(shares, 1n);
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
          expect(assetBalanceAfter - assetBalanceBefore).to.be.closeTo(amount - expectedFee - txFee, 1n);
          expect(actualFee).to.be.closeTo(expectedFee, 1n);
          const toDepositBonus = (expectedFee * (MAX_PERCENT - protocolFee)) / MAX_PERCENT;
          const toTreasury = (expectedFee * protocolFee) / MAX_PERCENT;
          expect(treasuryBalanceAfter - treasuryBalanceBefore).to.be.closeTo(toTreasury, 1n);
          expect(totalAssetsBefore - totalAssetsAfter).to.be.closeTo(amount - toDepositBonus, 1n);
          expect(flashCapacityBefore - flashCapacityAfter).to.be.closeTo(amount, 1n);
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
        await expect(omniVault.connect(signer1).flashWithdraw(shares / 2n, signer1.address))
            .to.be.revertedWithCustomError(omniVault, "EnforcedPause");
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
        await expect(omniVault.setTreasuryAddress(newTreasury))
            .to.emit(omniVault, "TreasuryUpdated")
            .withArgs(newTreasury);
        expect(await omniVault.treasury()).to.be.eq(newTreasury);
      });

      it("setTreasuryAddress(): reverts when set to zero address", async function () {
        await expect(omniVault.setTreasuryAddress(ethers.ZeroAddress)).to.be.revertedWithCustomError(
            omniVault,
            "NullParams",
        );
      });

      it("setTreasuryAddress(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setTreasuryAddress(signer1.address))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).setRatioFeed(newRatioFeed))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });

      it("setOperator(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;
        await expect(omniVault.setOperator(newValue))
            .to.emit(omniVault, "OperatorChanged")
            .withArgs(operator.address, newValue);
        expect(await omniVault.operator()).to.be.eq(newValue);
      });

      it("setOperator(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setOperator(signer1.address))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });

      it("ratio() reverts when ratioFeed is 0 address", async function () {
        const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
        const omniVault = await upgrades.deployProxy(
            omniVaultFactory,
            ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
            { initializer: "__InceptionOmniVault_init" },
        );
        omniVault.address = await omniVault.getAddress();
        await iToken.setVault(omniVault.address);
        await expect(omniVault.ratio()).revertedWithCustomError(omniVault, "RatioFeedNotSet");
      });

      it("setCrossChainAdapter(): only owner can", async function () {
        const newValue = ethers.Wallet.createRandom().address;
        await expect(omniVault.setCrossChainAdapter(newValue))
            .to.emit(omniVault, "CrossChainAdapterChanged")
            .withArgs(newValue);
        expect(await omniVault.crossChainAdapter()).to.be.eq(newValue);
      });

      it("setCrossChainAdapter(): reverts when set to zero address", async function () {
        await expect(omniVault.setCrossChainAdapter(ethers.ZeroAddress)).to.be.revertedWithCustomError(
            omniVault,
            "NullParams",
        );
      });

      it("setCrossChainAdapter(): reverts when caller is not an owner", async function () {
        await expect(omniVault.connect(signer1).setCrossChainAdapter(signer1.address))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).setMinAmount(randomBI(3)))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).setTargetFlashCapacity(newValue))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).setProtocolFee(newValue))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).setName("New name"))
            .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });

      it("pause(): only owner can", async function () {
        expect(await omniVault.paused()).is.false;
        await expect(omniVault.pause()).to.emit(omniVault, "Paused").withArgs(owner.address);
        expect(await omniVault.paused()).is.true;
      });

      it("pause(): reverts when called by not an owner", async function () {
        await expect(omniVault.connect(signer1).pause()).to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
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
        await expect(omniVault.connect(signer1).unpause()).to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
      });
    });

    describe("Bridge", function () {
      describe("Send info", function () {
        let TARGET = e18;

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        it("Adapter is set", async function () {
          expect(await omniVault.crossChainAdapter()).to.be.eq(adapterArb.address);
        });

        const args = [
          {
            name: "When there are no eth and shares",
            depositAmount: () => 0n,
            msgSender: () => operator,
          },
          {
            name: "After deposit",
            depositAmount: () => randomBI(11),
            msgSender: () => operator,
          },
          {
            name: "After deposit when deposit bonus > 0",
            depositAmount: () => randomBI(11),
            depositBonus: true,
            msgSender: () => operator,
          },
          {
            name: "When there are shares, but eth was sent to L1",
            depositAmount: () => TARGET + randomBI(11),
            depositBonus: true,
            sentToL1: amount => amount - TARGET,
            msgSender: () => operator,
          },
          {
            name: "Owner can call",
            depositAmount: () => TARGET + randomBI(11),
            depositBonus: true,
            sentToL1: amount => amount - TARGET,
            msgSender: () => owner,
          },
        ];
        args.forEach(function (arg) {
          it(`sendAssetsInfoToL1 ${arg.name}`, async function () {
            const msgSender = arg.msgSender();

            let amount = arg.depositAmount();
            if (amount > 0n) {
              await omniVault.connect(signer1).deposit(signer1, { value: amount });
            }

            let depositBonus = 0n;
            if (arg.depositBonus) {
              let collectedBonus = await addReplenishBonus(TARGET);
              expect(await omniVault.depositBonusAmount()).to.be.closeTo(collectedBonus, 1n);
              depositBonus = await omniVault.depositBonusAmount();
            }

            let sentToL1Amount = 0n;
            if (arg.sentToL1) {
              sentToL1Amount = arg.sentToL1(amount);
              const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, sentToL1Amount).toHex().toString();
              const amountWithFee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
              const fee = amountWithFee - sentToL1Amount;
              await omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee });
            }

            const freeBalance = await omniVault.getFreeBalance();
            const vaultBalance = await ethers.provider.getBalance(omniVault.address);
            const totalSupply = await iToken.totalSupply();
            const expectedVaultBalance = amount + depositBonus - sentToL1Amount;
            console.log("Deposited amt:\t\t", amount.format());
            console.log("Vault balance:\t\t", vaultBalance.format());
            console.log("Free balance:\t\t", freeBalance.format());
            console.log("Deposit bonus:\t\t", depositBonus.format());
            console.log("Actual sent:\t\t", sentToL1Amount.format());
            console.log("Total deposited:\t\t", (await omniVault.getTotalDeposited()).format());

            expect(vaultBalance).to.be.eq(expectedVaultBalance);

            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
            const feeParams = await omniVault.quoteSendAssetsInfoToL1(options);
            console.log("Fees: ", feeParams.format());
            await expect(omniVault.connect(msgSender).sendAssetsInfoToL1(options, {value: feeParams}))
                .to.emit(omniVault, "MessageToL1Sent")
                .withArgs(totalSupply, amount - sentToL1Amount);
          });
        });

        it("Reverts when called by not an operator", async function () {
          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(signer1).sendAssetsInfoToL1(feeParams)).revertedWithCustomError(
              omniVault,
              "OnlyOwnerOrOperator",
          );
        });

        it("Reverts when crosschain adapter is 0 address", async function () {
          const omniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
          const omniVault = await upgrades.deployProxy(
              omniVaultFactory,
              ["Omnivault", operator.address, iToken.address, ethers.ZeroAddress],
              { initializer: "__InceptionOmniVault_init" },
          );
          omniVault.address = await omniVault.getAddress();
          await omniVault.setRatioFeed(ratioFeedL2.address);
          await iToken.setVault(omniVault.address);

          const feeParams = adapterInfo.feesFunc();
          await expect(omniVault.connect(operator).sendAssetsInfoToL1(feeParams)).revertedWithCustomError(
              omniVault,
              "CrossChainAdapterNotSet",
          );
        });
      });

      describe("Send eth", function () {
        let TARGET = e18;

        beforeEach(async function () {
          await snapshot.restore();
          await omniVault.setTargetFlashCapacity(TARGET);
        });

        const args = [
          {
            name: "with extra value",
            extraValue: 3n * 10n ** 16n,
          },
          {
            name: "without extra value",
            extraValue: 0n,
          },
        ];
        args.forEach(function (arg) {
          it(`sendEthToL1 ${arg.name}`, async function () {
            await omniVault.connect(signer1).deposit(signer1, { value: TARGET + e18 });
            const amount = await omniVault.getFreeBalance();
            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
            const amountWithFee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
            const fee = amountWithFee - amount;
            const extraValue = arg.extraValue;

            const tx = await omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: fee + extraValue });
            await expect(tx).emit(omniVault, "EthCrossChainSent").withArgs(amountWithFee + extraValue, ETH_ID);
            await expect(tx).to.changeEtherBalance(rebalancer.address, amount);
            await expect(tx).to.changeEtherBalance(operator.address, -fee - extraValue, { includeFee: false });
            await expect(tx).to.changeEtherBalance(omniVault.address, -amount + extraValue); //Extra value stays at omniVault
          });
        });

        it("Reverts when there is no free balance", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET - 1n });
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();

          await expect(omniVault.connect(operator).sendEthCrossChain(ETH_ID, options, { value: 0n }))
              .to.revertedWithCustomError(omniVault, "FreeBalanceIsZero");
        });

        it("Reverts when called by not an operator", async function () {
          await omniVault.connect(signer1).deposit(signer1, { value: TARGET * 2n });
          const amount = await omniVault.getFreeBalance();
          const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, amount).toHex().toString();
          const amountWithFee = await omniVault.quoteSendEthCrossChain(ETH_ID, options);
          const fee = amountWithFee - amount;

          await expect(omniVault.connect(signer1).sendEthCrossChain(ETH_ID, options, { value: fee }))
              .to.revertedWithCustomError(omniVault, "OnlyOwnerOrOperator");
        });
      });
    });

    describe("Adapter", function () {
      describe("Getters and setters", function () {
        beforeEach(async function () {
          await snapshot.restore();
        });

        const setters = [
          {
            name: "operator address",
            setter: "setOperator",
            getter: "operator",
            event: "OperatorChanged",
          },
          {
            name: "l1 target address",
            setter: "setL1Target",
            getter: "l1Target",
            event: "L1TargetChanged",
          },
          {
            name: "vault address",
            setter: "setVault",
            getter: "vault",
            event: "VaultChanged",
          },
          {
            name: "arbsys",
            setter: "setArbSys",
            getter: "arbsys",
            event: "ArbSysChanged",
          },
        ];

        setters.forEach(function (arg) {
          it(`Set new ${arg.name}`, async function () {
            const prevValue = await adapter[arg.getter]();
            const newValue = ethers.Wallet.createRandom().address;
            await expect(adapter[arg.setter](newValue)).to.emit(adapter, arg.event).withArgs(prevValue, newValue);

            expect(await adapter[arg.getter]()).to.be.eq(newValue);
          });

          it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
            const newValue = ethers.Wallet.createRandom().address;
            await expect(adapter.connect(signer1)[arg.setter](newValue))
                .to.be.revertedWithCustomError(omniVault, "OwnableUnauthorizedAccount");
          });

          it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
            const newValue = ethers.ZeroAddress;
            await expect(adapter[arg.setter](newValue)).to.be.revertedWithCustomError(adapter, "SettingZeroAddress");
          });
        });

        it("Owner", async function () {
          expect(await adapter.owner()).to.be.eq(owner.address);
        });
      });

      describe("Send permissions", function () {
        it("sendAssetsInfoToL1 reverts when called by not vault", async function () {
          const tokensAmount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
              adapter.connect(signer1).sendAssetsInfoToL1(tokensAmount, ethAmount, []),
          ).to.be.revertedWithCustomError(adapter, "OnlyVault");
        });

        it("sendAssetsInfoToL1 reverts when l1 target is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: ethers.ZeroAddress,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          const amount = randomBI(18);
          await signer1.sendTransaction({ to: adapter.address, value: amount });
          await adapter.setVault(signer1.address);

          const tokensAmount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
              adapter.connect(signer1).sendAssetsInfoToL1(tokensAmount, ethAmount, []),
          ).to.be.revertedWithCustomError(adapter, "L1TargetNotSet");
        });

        it("sendEthToL1 reverts when called by not vault", async function () {
          const amount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
              adapter.connect(signer1).sendEthToL1(amount, [], { value: ethAmount }),
          ).to.be.revertedWithCustomError(adapter, "OnlyVault");
        });

        it("sendEthToL1 reverts when l1 target is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: ethers.ZeroAddress,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          await adapter.setVault(signer1.address);

          const amount = randomBI(18);
          const ethAmount = randomBI(18);
          await expect(
              adapter.connect(signer1).sendEthToL1(amount, [], { value: ethAmount }),
          ).to.be.revertedWithCustomError(adapter, "L1TargetNotSet");
        });
      });

      describe("Recover funds", function () {
        beforeEach(async function () {
          await snapshot.restore();
        });

        it("recoverFunds sends eth back to vault", async function () {
          const amount = randomBI(18);
          await signer1.sendTransaction({ to: adapter.address, value: amount });

          const tx = await adapter.connect(operator).recoverFunds();
          await expect(tx).changeEtherBalance(adapter.address, -amount);
          await expect(tx).changeEtherBalance(omniVault.address, amount);
          await expect(tx).emit(adapter, "RecoverFundsInitiated").withArgs(amount);
        });

        it("recoverFunds reverts when called by not an operator", async function () {
          const amount = randomBI(18);
          await signer1.sendTransaction({ to: adapter.address, value: amount });

          await expect(adapter.connect(signer1).recoverFunds())
              .to.be.revertedWithCustomError(adapter, "OnlyOperatorCanCall")
              .withArgs(signer1.address);
        });

        it("Cannot recover when vault is not set", async function () {
          const adapter = await adapterInfo.deploy({
            targetL1: targetL1.address,
            owner,
            operator,
            optMessenger: adapterInfo.optMessenger,
            optBridge: adapterInfo.optBridge,
          });
          const amount = randomBI(18);
          await signer1.sendTransaction({ to: adapter.address, value: amount });

          await expect(adapter.connect(operator).recoverFunds()).to.be.revertedWithCustomError(adapter, "VaultNotSet");
        });
      });
    });
  });
});
