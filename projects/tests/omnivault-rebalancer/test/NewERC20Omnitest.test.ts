import { ethers, network, upgrades } from "hardhat";
import { expect } from "chai";
import { takeSnapshot, time } from "@nomicfoundation/hardhat-network-helpers";
import { e18, getSlotByName, impersonateWithEth, randomBI, randomBIMax, toWei, approx } from "./helpers/utils.js";
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
import { text } from "stream/consumers";
import { zeroAddress } from "ethereumjs-util";

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
            (ferryL2 as any).address, // ferry mock bridge (actually set later)
            (fraxEndpoint as any).address, // endpoint
            (owner as any).address, // delegate
            ETH_ID, // chainID
            eIds,
            chainIds,
        ]);
        (adapterFrax as any).address = await adapterFrax.getAddress();
        await fraxEndpoint.setDestLzEndpoint(await adapterL1.getAddress(), await ethEndpoint.getAddress())



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

        const InceptionVaultFactory = await ethers.getContractFactory("InceptionVault_EL", {
            signer: owner,
            libraries: { InceptionLibrary: network.config.addresses.lib },
        });
        await upgrades.forceImport(network.config.addresses.inceptionVault, InceptionVaultFactory);
        const inceptionVault = await upgrades.upgradeProxy(network.config.addresses.inceptionVault, InceptionVaultFactory, {
            unsafeAllowLinkedLibraries: true,
        });
        inceptionVault.address = await inceptionVault.getAddress();

        console.log("=== InceptionToken");
        /*
        const inceptionTokenAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.inceptionToken);
        console.log(inceptionTokenAdminAddress);
        slot = "0x" + (0).toString(16);
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [inceptionTokenAdminAddress, slot, value]);
        const InceptionTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
        await upgrades.forceImport(network.config.addresses.inceptionToken, InceptionTokenFactory);
        const inceptionToken = await upgrades.upgradeProxy(network.config.addresses.inceptionToken, InceptionTokenFactory);
        */
        const iTokenFactoryL1 = await ethers.getContractFactory("InceptionToken");
        const inceptionToken = await upgrades.deployProxy(iTokenFactoryL1, ["InsfrxETH", "InsfrxETH"], { kind: "transparent" });
        await inceptionToken.waitForDeployment();
        inceptionToken.address = await inceptionToken.getAddress();

        // 3. set the vault
        let tx = await inceptionToken.setVault(inceptionVault.address);
        await tx.wait();


        console.log("=== RatioFeed");
        /*
        const ratioFeedAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.ratioFeed);
        slot = "0x" + (0).toString(16);
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [ratioFeedAdminAddress, slot, value]);
        const RatioFeed = await ethers.getContractFactory("RatioFeed", owner);
        const ratioFeedL1 = await upgrades.upgradeProxy(network.config.addresses.ratioFeed, RatioFeed);
        ratioFeedL1.address = await ratioFeedL1.getAddress();
*/
        const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed", owner);
        const ratioFeedL1 = await upgrades.deployProxy(iRatioFeedFactory, []);
        await ratioFeedL1.waitForDeployment();
        ratioFeedL1.address = await ratioFeedL1.getAddress();
        await (await ratioFeedL1.updateRatioBatch([await inceptionToken.getAddress()], [e18])).wait();

        console.log("=== ERC20Rebalancer");
        const Rebalancer = await ethers.getContractFactory("ERC20Rebalancer");
        const rebalancer = await upgrades.deployProxy(Rebalancer, [
            // def chainid
            // incToken
            // underlying asset
            // lockbox
            // ivault
            // adapter
            // operator
            31337,
            inceptionToken.address,
            underlyingL1.address,
            lockboxAddress,
            inceptionVault.address,
            adapterL1.address,
            //ratioFeedL1.address,
            operator.address,
        ]);
        rebalancer.address = await rebalancer.getAddress();
        await rebalancer.connect(owner).setDefaultChainId(FRAX_ID);
        await rebalancer.connect(owner).setInfoMaxDelay(3600n);

        tx = await inceptionToken.setRebalancer(rebalancer.address);
        await tx.wait();

        ///////////// end layer 1 /////////////

        console.log("============ OmniVault Layer2 ============");
        console.log("=== iToken");
        const iTokenFactory = await ethers.getContractFactory("InceptionToken", owner);
        const iToken = await upgrades.deployProxy(iTokenFactory, ["TEST InceptionLRT Token", "tINt"]);
        await iToken.waitForDeployment();
        iToken.address = await iToken.getAddress();

        console.log("=== InceptionRatioFeed");
        //const iRatioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed", owner);
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
        await adapterFrax.setDestination(await rebalancer.getAddress())

        await ratioFeedL1.updateRatioBatch([inceptionToken.address], [e18]);
        await ratioFeedL2.updateRatioBatch([iToken.address], [e18]);

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

        let sharesReceived = 0n;
        it("Stake on FRAX", async function () {
            await underlyingL2.mint(signer1, TARGET + e18);
            await underlyingL2.mint(signer2, e18);
            await underlyingL2.connect(signer1).approve(omniVault, TARGET + e18);
            await omniVault.connect(signer1).deposit(TARGET + e18, signer1);
            await underlyingL2.connect(signer2).approve(omniVault, e18);
            await omniVault.connect(signer2).deposit(e18, signer2);
            expect(await omniVault.getFreeBalance()).to.be.approximately(TARGET + e18 + e18, 10n);
            console.log(await iTokenL2.totalSupply());
            console.log(await omniVault.getFlashCapacity());
            console.log(await omniVault.getFreeBalance());
            console.log(await ethers.provider.getBalance(omniVault.getAddress()));
        });

        it("updateTreasuryData reverts when nothing was ever received", async function () {
            await expect(rebalancer.connect(signer1).updateTreasuryData()).to.be.reverted;
        });

        let mintShares = 0n;
        let l2Balance = 0n;
        it("Send info from FRAX", async function () {
            const totalSupply = await iTokenL2.totalSupply();
            mintShares += totalSupply;
            const ethBalance = await omniVault.getFlashCapacity();
            l2Balance = ethBalance;

            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
            const fee = await omniVault.quoteSendAssetsInfoToL1(options);
            const timestamp = (await time.latest()) + 1;
            const tx = await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });

            const txData = await rebalancer.getTransactionData();
            await expect(tx).to.emit(rebalancer, "L2InfoReceived").withArgs(FRAX_ID, timestamp, ethBalance, totalSupply);
            expect(txData.inceptionTokenSupply).to.be.eq(totalSupply);
            expect(txData.underlyingBalance).to.be.eq(ethBalance);
            expect(txData.timestamp).to.be.eq(timestamp);
        });

        it("Update data and mint", async function () {
            const inEthSupplyBefore = await iTokenL1.totalSupply();

            const tx = await rebalancer.connect(signer1).updateTreasuryData();

            const inEthSupplyAfter = await iTokenL1.totalSupply();
            await expect(tx).to.emit(rebalancer, "SyncedSupplyChanged").withArgs(0n, mintShares);
            await expect(tx).to.emit(rebalancer, "TreasuryUpdateMint").withArgs(mintShares);
            await expect(tx).changeTokenBalance(iTokenL1, lockboxAddress, mintShares);
            expect(inEthSupplyAfter - inEthSupplyBefore).to.be.eq(mintShares);
        });

        it("updateTreasuryData reverts when there are no changes", async function () {
            await expect(rebalancer.connect(signer1).updateTreasuryData()).to.be.revertedWithCustomError(rebalancer, "NoRebalancingRequired");
        });

        it("updateTreasuryData reverts when the data packet is expired", async function () {
            await time.increase(3601);
            await expect(rebalancer.connect(signer1).updateTreasuryData()).to.be.revertedWithCustomError(rebalancer, "OutdatedAssetInfo");;
        });

        it("Flash withdraw on FRAX", async function () {
            let iBalance = await iTokenL2.balanceOf(signer2);
            let underPreBal = await underlyingL2.balanceOf(signer2);
            await omniVault.connect(signer2).flashWithdraw(iBalance, await signer2.getAddress())
            expect(await iTokenL2.balanceOf(signer2)).to.be.eq(0n);
            expect(await underlyingL2.balanceOf(signer2)).to.be.above(underPreBal)
        });

        it("Burn tokens on L1 after the withdrawal on L2", async () => {
            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
            const fee = await omniVault.quoteSendAssetsInfoToL1(options);
            const timestamp = (await time.latest()) + 1;
            let tx = await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });

            const txData = await rebalancer.getTransactionData();
            await expect(tx).to.emit(rebalancer, "L2InfoReceived");

            const inEthSupplyBefore = await iTokenL1.totalSupply();

            tx = await rebalancer.connect(signer1).updateTreasuryData();

            const inEthSupplyAfter = await iTokenL1.totalSupply();
            await expect(tx).to.emit(rebalancer, "SyncedSupplyChanged")//.withArgs(mintShares, mintShares-e18);
            await expect(tx).to.emit(rebalancer, "TreasuryUpdateBurn")//.withArgs(approx(e18, 100n));
            await expect(tx).changeTokenBalance(iTokenL1, lockboxAddress, -e18+1n);
            expect(inEthSupplyBefore- inEthSupplyAfter).to.be.approximately(e18, 100n);
        })

        let amountFerried = 0n;
        let snap2;
        it("Move tokens from L2 to L1 and stake immediately", async function () {
            snap2 = await takeSnapshot();

            await underlyingL2.mint(signer1, TARGET + e18);
            await underlyingL2.mint(signer2, e18);
            await underlyingL2.connect(signer1).approve(omniVault, TARGET + e18);
            await omniVault.connect(signer1).deposit(TARGET + e18, signer1);
            await underlyingL2.connect(signer2).approve(omniVault, e18);
            await omniVault.connect(signer2).deposit(e18, signer2);


            const options = Options.newOptions().addExecutorLzReceiveOption(200_000n, 0n).toHex().toString();
            const fee = await omniVault.quoteSendAssetsInfoToL1(options);
            const timestamp = (await time.latest()) + 1;
            await omniVault.connect(operator).sendAssetsInfoToL1(options, { value: fee });


            await expect(omniVault.sendERC20ToL1(1n)).to.emit(ferryL2, "Embark").withArgs(
                anyValue,
                anyValue,
                anyValue,
                (v: bigint) => {
                    amountFerried = v;
                    console.log(v);
                    return true;
                },
                anyValue);
            // just mint ferried tokens to L1 rebalancer without emulating the actual disembark
            await underlyingL1.mint(await rebalancer.getAddress(), amountFerried)
            expect(await rebalancer.connect(signer1).updateTreasuryData()).to.emit(rebalancer, "TransferToInceptionVault").withArgs(amountFerried);
            await snap2.restore();
        })

        it("Won't stake by non-op and other negative scenarios", async () => {
            const oldAF = amountFerried;
            const s = await takeSnapshot();

            expect(rebalancer.connect(owner).setInceptionToken(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");

            await expect(omniVault.sendERC20ToL1(1n)).to.emit(ferryL2, "Embark").withArgs(
                anyValue,
                anyValue,
                anyValue,
                (v: bigint) => {
                    amountFerried = v;
                    console.log(v);
                    return true;
                },
                anyValue);
            // just mint ferried tokens to L1 rebalancer without emulating the actual disembark
            await underlyingL1.mint(await rebalancer.getAddress(), amountFerried)
            const s2 = await takeSnapshot();
            await expect(rebalancer.connect(owner).setInceptionVault(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            //await expect(rebalancer.connect(operator).stake(amountFerried)).to.be.revertedWithCustomError(rebalancer, "InceptionVaultNotSet");
            await s2.restore();
            await expect(rebalancer.connect(signer3).stake(amountFerried)).to.be.revertedWithCustomError(rebalancer, "OnlyOperator");

            await s.restore();
            amountFerried = oldAF;
        })

        it("Separate stake() by rebalancer", async function () {
            await expect(omniVault.sendERC20ToL1(1n)).to.emit(ferryL2, "Embark").withArgs(
                anyValue,
                anyValue,
                anyValue,
                (v: bigint) => {
                    amountFerried = v;
                    console.log(v);
                    return true;
                },
                anyValue);
            // just mint ferried tokens to L1 rebalancer without emulating the actual disembark
            await underlyingL1.mint(await rebalancer.getAddress(), amountFerried)

            const beforeDepo = await underlyingL1.balanceOf(inceptionVault.address);
            //console.log(beforeDepo);
            await expect(rebalancer.connect(operator).stake(amountFerried*4n)).to.be.revertedWithCustomError(rebalancer, "StakeAmountExceedsBalance");
            let tx = await rebalancer.connect(operator).stake(amountFerried)
            await tx.wait();
            expect(tx).to.emit(rebalancer, "TransferToInceptionVault").withArgs(amountFerried);
            const afterDepo = await await underlyingL1.balanceOf(inceptionVault.address);
            //console.log(afterDepo);
            expect(afterDepo - beforeDepo).to.be.eq(amountFerried);
        });

        it("Rebalancer access control and validation", async () => {
            const sn = await takeSnapshot();
            await expect(rebalancer.connect(operator).setDefaultAdapter(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setDefaultAdapter(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setDefaultAdapter(adapterL1.address)).to.emit(rebalancer, "DefaultAdapterChanged").withArgs(adapterL1.address);

            await expect(rebalancer.connect(operator).setInceptionToken(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setInceptionToken(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setInceptionToken(iTokenL1.address)).to.emit(rebalancer, "InceptionTokenChanged").withArgs(iTokenL1.address);

            await expect(rebalancer.connect(operator).setUnderlyingAsset(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setUnderlyingAsset(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setUnderlyingAsset(underlyingL1.address)).to.emit(rebalancer, "UnderlyingAssetChanged").withArgs(underlyingL1.address);

            await expect(rebalancer.connect(operator).setLockbox(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setLockbox(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setLockbox(lockboxAddress)).to.emit(rebalancer, "LockboxChanged").withArgs(lockboxAddress);

            await expect(rebalancer.connect(operator).setInceptionVault(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setInceptionVault(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setInceptionVault(inceptionVault.address)).to.emit(rebalancer, "LiqPoolChanged").withArgs(inceptionVault.address);

            await expect(rebalancer.connect(operator).setOperator(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setOperator(zeroAddress())).to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
            expect(await rebalancer.connect(owner).setOperator(operator)).to.emit(rebalancer, "OperatorChanged").withArgs(operator);

            await expect(rebalancer.connect(operator).setDefaultChainId(228n)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setDefaultChainId(0n)).to.be.revertedWithCustomError(rebalancer, "SettingZeroChainId");

            await expect(rebalancer.connect(operator).setInfoMaxDelay(228n)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(rebalancer.connect(owner).setInfoMaxDelay(0n)).to.be.revertedWithCustomError(rebalancer, "SettingZeroDelay");
            await sn.restore();
        })

        it("L2 adapter access control and validation", async () => {
            const sn = await takeSnapshot();

            await expect(adapterFrax.connect(operator).setFerry(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(adapterFrax.connect(owner).setFerry(zeroAddress())).to.be.revertedWithCustomError(adapterFrax, "errNullFerry");
            expect(await adapterFrax.connect(owner).setFerry(ferryL2.address)).to.emit(adapterFrax, "DefaultAdapterChanged").withArgs(ferryL2.address);

            await expect(adapterFrax.connect(operator).setDestination(adapterL1.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(adapterFrax.connect(owner).setDestination(zeroAddress())).to.be.revertedWithCustomError(adapterFrax, "errNullDestination");
            expect(await adapterFrax.connect(owner).setDestination(rebalancer.address)).to.emit(adapterFrax, "DestinationChanged").withArgs(rebalancer.address);

            await expect(adapterFrax.connect(operator).sendDataL1(
                "0x000000000000000000000000c671A6a4bF4Dcd0EE94d8D5558cD8B6EAdFD5A19",
                "0x000000000000000000000000c671A6a4bF4Dcd0EE94d8D5558cD8B6EAdFD5A19"
            )).to.be.revertedWithCustomError(adapterFrax, "NotTargetReceiver");

            await expect(adapterFrax.connect(operator).recoverFunds()).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await adapterFrax.connect(owner).recoverFunds()).to.emit("IERC20", "Transfer");

            await expect(adapterFrax.connect(operator).sendEthCrossChain(0n, "0x0001")).to.be.revertedWithCustomError(adapterFrax, "NotAllowedInThisAdapterType");

            await expect(adapterFrax.connect(operator).quoteSendEth(0n, "0x0001")).to.be.revertedWithCustomError(adapterFrax, "NotAllowedInThisAdapterType");

            await sn.restore();
        })
    })
})

