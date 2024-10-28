import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { NativeRebalancer, CToken, XERC20Lockbox, RatioFeed, ProtocolConfig, RestakingPool } from "../typechain-types";

describe("NativeRebalancer", function () {
    async function deployFixture() {
        const [deployer] = await ethers.getSigners();

        // Deploy ProtocolConfig
        const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig");
        const protocolConfig = await upgrades.deployProxy(ProtocolConfig, [
            deployer.address,
            deployer.address,
            deployer.address,
        ]) as ProtocolConfig;
        await protocolConfig.waitForDeployment();

        // Deploy RatioFeed
        const RatioFeed = await ethers.getContractFactory("RatioFeed");
        const ratioFeed = await upgrades.deployProxy(RatioFeed, [
            await protocolConfig.getAddress(),
            1000000n, // ratio threshold
        ]) as RatioFeed;
        await ratioFeed.waitForDeployment();

        const CToken = await ethers.getContractFactory("cToken");
        const cToken = await upgrades.deployProxy(CToken, [
            await protocolConfig.getAddress(),
            "inETH",
            "inETH",
        ]) as CToken;
        await cToken.waitForDeployment();

        const initialRatio = 1n * 10n ** 18n;
        await ratioFeed.updateRatio(await cToken.getAddress(), initialRatio);
        console.log("Initial Ratio Set:", await ratioFeed.getRatio(await cToken.getAddress()));

        // Deploy InceptionLibrary
        const InceptionLibrary = await ethers.getContractFactory("InceptionLibrary");
        const inceptionLibrary = await InceptionLibrary.deploy();
        await inceptionLibrary.waitForDeployment();

        // Deploy RestakingPool
        const RestakingPool = await ethers.getContractFactory("RestakingPool", {
            libraries: {
                InceptionLibrary: await inceptionLibrary.getAddress(),
            },
        });
        const restakingPool = await upgrades.deployProxy(RestakingPool, [
            await protocolConfig.getAddress(),
            30000000n, // min value
            100000000n, // max value
        ], { unsafeAllowLinkedLibraries: true }) as RestakingPool;
        await restakingPool.waitForDeployment();

        // Set target capacity and stake bonus parameters
        await restakingPool.setTargetFlashCapacity(1000000n);
        await restakingPool.setStakeBonusParams(10n, 5n, 50n);
        await restakingPool.setFlashUnstakeFeeParams(5n, 3n, 50n);
        const newMaxTVL = ethers.parseEther("101");
        await restakingPool.setMaxTVL(newMaxTVL);

        // Deploy XERC20Lockbox
        const XERC20Lockbox = await ethers.getContractFactory("XERC20LockboxMock");
        const xerc20Lockbox = await XERC20Lockbox.deploy(
            await cToken.getAddress(),
            await cToken.getAddress(),
            true
        ) as XERC20Lockbox;
        await xerc20Lockbox.waitForDeployment();

        // Deploy NativeRebalancer
        const NativeRebalancer = await ethers.getContractFactory("NativeRebalancer");
        const rebalancer = await upgrades.deployProxy(NativeRebalancer, [
            await cToken.getAddress(),
            await xerc20Lockbox.getAddress(),
            await restakingPool.getAddress(),
            "0xbCc523818C16e5F955EEe112665d57F35a8000e4",
            await ratioFeed.getAddress(),
            deployer.address,
        ]) as NativeRebalancer;
        await rebalancer.waitForDeployment();

        await rebalancer.addChainId(40231n);
        await rebalancer.addChainId(40232n);

        // Setup ProtocolConfig with addresses
        await protocolConfig.setRatioFeed(await ratioFeed.getAddress());
        await protocolConfig.setRestakingPool(await restakingPool.getAddress());
        await protocolConfig.setRebalancer(await rebalancer.getAddress());
        await protocolConfig.setCToken(await cToken.getAddress());

        return { rebalancer, cToken, xerc20Lockbox, ratioFeed, protocolConfig, restakingPool, deployer };
    }

    describe("updateTreasuryData", function () {
        it("should mint tokens when total L2 inETH is greater than the last update", async function () {
            const { rebalancer, cToken, xerc20Lockbox } = await deployFixture();

            const l2BalanceArb = 1n * 10n ** 17n;
            const l2BalanceOpt = 3n * 10n ** 17n;
            const chainId1 = 40231;
            const chainId2 = 40232;

            const pastTimestamp1 = Math.floor(Date.now() / 1000) - 2000;
            const pastTimestamp2 = Math.floor(Date.now() / 1000) - 1800;

            await rebalancer.handleL2Info(chainId1, pastTimestamp1, l2BalanceArb, l2BalanceArb);
            await rebalancer.handleL2Info(chainId2, pastTimestamp2, l2BalanceOpt, l2BalanceOpt);

            // Call updateTreasuryData, which should mint tokens to match the increase
            await expect(rebalancer.updateTreasuryData())
                .to.emit(rebalancer, "TreasuryUpdateMint")
                .withArgs(l2BalanceArb + l2BalanceOpt);

            // Check balance after minting
            expect(await cToken.balanceOf(await xerc20Lockbox.getAddress())).to.equal(l2BalanceArb + l2BalanceOpt);
        });

        it("should burn tokens when total L2 inETH is less than the last update", async function () {
            const { rebalancer, cToken, xerc20Lockbox } = await deployFixture();

            const chainIdArb1 = 40231;
            const chainIdOpt1 = 40232;

            const initValueArb = 5n * 10n ** 17n;
            const initValueOpt = 7n * 10n ** 17n;
            const nextValueArb = 3n * 10n ** 17n;
            const nextValueOpt = 1n * 10n ** 17n;

            const initialL2BalanceArb1 = initValueArb;
            const pastTimestampArb1 = Math.floor(Date.now() / 1000) - 5000;

            const initialL2BalanceOpt1 = initValueOpt;
            const pastTimestampOpt1 = Math.floor(Date.now() / 1000) - 5000;

            await rebalancer.handleL2Info(chainIdArb1, pastTimestampArb1, initialL2BalanceArb1, initialL2BalanceArb1);
            await rebalancer.handleL2Info(chainIdOpt1, pastTimestampOpt1, initialL2BalanceOpt1, initialL2BalanceOpt1);
            await rebalancer.updateTreasuryData();

            const nextL2BalanceArb2 = nextValueArb;
            const pastTimestampArb2 = Math.floor(Date.now() / 1000) - 3000;

            const nextL2BalanceOpt2 = nextValueOpt;
            const pastTimestampOpt2 = Math.floor(Date.now() / 1000) - 3000;

            await rebalancer.handleL2Info(chainIdArb1, pastTimestampArb2, nextL2BalanceArb2, nextL2BalanceArb2);
            await rebalancer.handleL2Info(chainIdOpt1, pastTimestampOpt2, nextL2BalanceOpt2, nextL2BalanceOpt2);

            // Call updateTreasuryData, which should burn tokens to match the decrease
            await expect(rebalancer.updateTreasuryData())
                .to.emit(rebalancer, "TreasuryUpdateBurn")
                .withArgs(initValueArb + initValueOpt - nextValueArb - nextValueOpt);

            // Check balance after burning
            expect(await cToken.balanceOf(await xerc20Lockbox.getAddress())).to.equal(nextValueArb + nextValueOpt);
        });

        it("should revert if no rebalancing is required", async function () {
            const { rebalancer, cToken, xerc20Lockbox } = await deployFixture();

            const chainIdArb1 = 40231;
            const chainIdOpt1 = 40232;

            const sameValue = 4n * 10n ** 17n;

            const initialL2BalanceArb1 = sameValue;
            const pastTimestampArb1 = Math.floor(Date.now() / 1000) - 5000;

            const initialL2BalanceOpt1 = sameValue;
            const pastTimestampOpt1 = Math.floor(Date.now() / 1000) - 5000;

            await rebalancer.handleL2Info(chainIdArb1, pastTimestampArb1, initialL2BalanceArb1, initialL2BalanceArb1);
            await rebalancer.handleL2Info(chainIdOpt1, pastTimestampOpt1, initialL2BalanceOpt1, initialL2BalanceOpt1);
            await rebalancer.updateTreasuryData();

            const nextL2BalanceArb2 = sameValue;
            const pastTimestampArb2 = Math.floor(Date.now() / 1000) - 3000;

            const nextL2BalanceOpt2 = sameValue;
            const pastTimestampOpt2 = Math.floor(Date.now() / 1000) - 3000;

            await rebalancer.handleL2Info(chainIdArb1, pastTimestampArb2, nextL2BalanceArb2, nextL2BalanceArb2);
            await rebalancer.handleL2Info(chainIdOpt1, pastTimestampOpt2, nextL2BalanceOpt2, nextL2BalanceOpt2);

            await expect(rebalancer.updateTreasuryData()).to.be.revertedWithCustomError(rebalancer, "NoRebalancingRequired");

            // Check balance after burning
            expect(await cToken.balanceOf(await xerc20Lockbox.getAddress())).to.equal(sameValue + sameValue);

        });
    });
});
