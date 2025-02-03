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
    IERC20Mintable,
    MockFraxferry,
    FraxFerryLZCrossChainAdapterL2,
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
    let underlyingL1, underlyingL2: IERC20Mintable;
    let ferryL2: MockFraxferry;
    let adapterFrax: FraxFerryLZCrossChainAdapterL2;
    // end new
    //Adapters
    let adapterL1: LZCrossChainAdapterL1;
    //let maliciousAdapterL1: LZCrossChainAdapterL1;
    //let adapterFrax: LZCrossChainAdapterL2;
    let ethEndpoint: EndpointMock;
    let fraxEndpoint: EndpointMock;

    //let maliciousAdapterL2: LZCrossChainAdapterL2;

    // ============ L1 ============
    let ratioFeedL1: RatioFeed;
    let iTokenL1: InceptionToken;
    let rebalancer: ERC20Rebalancer;
    let inceptionVault: InceptionVault;

    // ============ L2 ============
    let iTokenL2: InceptionToken;
    //let fraxToken: ERC20;
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

        // Deploy fake ERC20 and Ferries
        // then deploy L1 incToken
        // L1 reb
        // L2 CCA
        // L2 incToken
        // deploy and set ratio feeds
        // set target receivers
        // set reb in L1it
        // set reb delays
        // set ratios

        console.log("=== Underlying asset mocks");
        const DummyTokenFactory = await ethers.getContractFactory("DummyToken");
        underlyingL1 = await DummyTokenFactory.deploy();
        (underlyingL1 as any).address = await underlyingL1.getAddress();

        underlyingL2 = await DummyTokenFactory.deploy();
        (underlyingL2 as any).address = await underlyingL2.getAddress();
        await underlyingL2.mint(signer1, 2n * e18)

        console.log("=== Ferry mocks");
        const MockFerryFactory = await ethers.getContractFactory("MockFraxferry");
        ferryL2 = await MockFerryFactory.deploy(underlyingL2);
        (ferryL2 as any).address = await ferryL2.getAddress();

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
        const FraxFerryLZCrossChainAdapterL2 = await ethers.getContractFactory("FraxFerryLZCrossChainAdapterL2");
        const adapterFrax = await upgrades.deployProxy(FraxFerryLZCrossChainAdapterL2, [
            (underlyingL2 as any).address, // underlying token
            (ferryL2 as any).address, // ferry mock bridge
            (fraxEndpoint as any).address, // endpoint
            (owner as any).address, // delegate
            ETH_ID, // chainID
            eIds,
            chainIds,
        ]);
        (adapterFrax as any).address = await adapterFrax.getAddress();


        // TODO malicious adapters

        console.log("============ FraxETH ============");
        const sfrxETH = await ethers.getContractAt("ERC20", (network.config as any).addresses.sfrxETH);

        console.log("============ InceptionVault Layer1 ============");

        console.log("=== InceptionVault");
        console.log((network.config as any).addresses.inceptionVault);
        const restakingPoolAdminAddress = await upgrades.erc1967.getAdminAddress((network.config as any).addresses.inceptionVault);
        let slot = "0x" + (0).toString(16);
        let value = ethers.zeroPadValue((owner as any).address, 32);
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
            31337, // def chainid
            // incToken
            // underlying asset
            // lockbox
            // ivault
            // adapter
            // operator
            inceptionToken.address,
            lockboxAddress,
            inceptionVault.address,
            adapterL1.address,
            ratioFeedL1.address,
            operator.address,
        ]);
        rebalancer.address = await rebalancer.getAddress();
        await rebalancer.connect(owner).setDefaultChainId(FRAX_ID);
        ///////////// end layer 1 /////////////

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
        const omniVaultFactory = await ethers.getContractFactory("ERC20OmniVault_E2", owner);
        const omniVault = await upgrades.deployProxy(omniVaultFactory, [
            "OmniVault",
            operator.address,
            iToken.address,
            await underlyingL2.getAddress(),
            adapterFrax.address,
        ]);
        omniVault.address = await omniVault.getAddress();
        await omniVault.setRatioFeed(ratioFeedL2.address);
        await omniVault.setTreasuryAddress(treasury.address);
        await iToken.setVault(omniVault.address);

        // Adapters final setup
        await adapterL1.setTargetReceiver(rebalancer.address);
        await adapterL1.setPeer(FRAX_EID, ethers.zeroPadValue(adapterFrax.address, 32));
        await adapterFrax.setTargetReceiver(omniVault.address);
        await adapterFrax.setPeer(ETH_EID, ethers.zeroPadValue(adapterL1.address, 32));

        return [
            adapterL1, // l1 receiver adapter
            ethEndpoint,
            adapterFrax, // l2 adapter
            fraxEndpoint,
            inceptionToken, // l1 token
            rebalancer,
            ratioFeedL1,
            inceptionVault, // l1
            iToken, // l2
            ratioFeedL2,
            omniVault, // l2
            //            maliciousAdapterL1,
            //            maliciousAdapterL2,
        ];
    }


    before(async function () {
        [owner, operator, treasury, signer1, signer2, signer3, target] = await ethers.getSigners();
        [
            adapterL1, // l1 receiver adapter
            ethEndpoint,
            adapterFrax, // l2 adapter
            fraxEndpoint,
            iTokenL1, // l1 token
            rebalancer,
            ratioFeedL1,
            inceptionVault, // l1
            iTokenL2, // l2
            ratioFeedL2,
            omniVault,
        ] = await init(owner, operator);

        snapshot = await takeSnapshot();
    });

    describe("InceptionVault", function () {
        describe("After deployments checks", function () {
            before(async function () {
                await snapshot.restore();
            });

            it("Signer can stake", async function () {
                await underlyingL2.connect(signer1).approve(omniVault.getAddress(), 2n * e18)
                await omniVault.connect(signer1).deposit(2n * e18, signer1);
            });

            it("Get min stake amount", async function () {
                console.log("Min stake amount: ", await omniVault.minAmount());
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
        })


        it("Sync ratio from ETH to FRAX", async function () {
            const l1Ratio = await inceptionVault.ratio();
            console.log("L1 ratio:", l1Ratio.format());
            await ratioFeedL2.updateRatioBatch([iTokenL2.address], [l1Ratio]);
            console.log("Frax ratio:", (await omniVault.ratio()).format());
        });

        it("Stake on FRAX", async function () {
            await underlyingL2.mint(signer1, TARGET + e18);
            await underlyingL2.mint(signer2, e18);
            await underlyingL2.connect(signer1).approve(omniVault, TARGET + e18);
            await omniVault.connect(signer1).deposit(TARGET + e18, signer1);
            await underlyingL2.connect(signer2).approve(omniVault, e18);
            await omniVault.connect(signer2).deposit(e18, signer2);
            expect(await omniVault.getFreeBalance()).to.be.approximately(TARGET + e18 + e18, e18/1000000000000000n);
            console.log(await iTokenL2.totalSupply());
            console.log(await omniVault.getFlashCapacity());
            console.log(await omniVault.getFreeBalance());
            console.log(await ethers.provider.getBalance(omniVault.getAddress()));
        });

        let mintShares = 0n;
        it("Send info from FRAX", async function () {
            const totalSupply = await iTokenL2.totalSupply();
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
    })
})

