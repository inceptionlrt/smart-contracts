import {ethers, network, upgrades, deployments} from "hardhat";
import {expect} from "chai";
import {takeSnapshot} from "@nomicfoundation/hardhat-network-helpers";
import {randomBI, e18} from "./helpers/math";
import {SnapshotRestorer} from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";
import {AbiCoder, keccak256, toUtf8Bytes} from 'ethers';
import {
    ArbBridgeMock,
    CrossChainAdapterArbitrumL1, CrossChainAdapterL1, CrossChainAdapterOptimismL1,
    CToken,
    OptBridgeMock, ProtocolConfig,
    Rebalancer,
    RestakingPool,
    TransactionStorage
} from "../typechain-types";

BigInt.prototype.format = function () {
    return this.toLocaleString("de-DE");
};

const ARB_ID = 42161;
const OPT_ID = 10;
const RESTAKING_POOL_DISTRIBUTE_GAS_LIMIT = 250_000n;
const RESTAKING_POOL_MAX_TVL = 32n * e18;
const RESTAKING_POOL_MIN_STAKE = 1000n;

describe("Omnivault integration tests", function () {
    this.timeout(150000);
    let ratioFeed, arbInboxMock, arbOutboxMock;
    let inEth: CToken;
    let rebalancer: Rebalancer;
    let txStorage: TransactionStorage;
    let restakingPool: RestakingPool
    let arbBridgeMock: ArbBridgeMock;
    let arbAdapter: CrossChainAdapterArbitrumL1;
    let optBridgeMock: OptBridgeMock;
    let optAdapter: CrossChainAdapterOptimismL1;
    let restakingPoolConfig: ProtocolConfig;
    let adapter: CrossChainAdapterL1;

    let owner, operator, treasury, signer1, signer2, signer3, target;
    let MAX_THRESHOLD, ratioThresh;
    let clean_snapshot: SnapshotRestorer;
    let snapshot: SnapshotRestorer;
    let lockboxAddress;
    const optimismStandardBridge = network.config.addresses.optimismInbox;

    async function init(owner, operator, treasury, target) {
        const block = await ethers.provider.getBlock("latest");
        console.log(`Starting at block number: ${block.number}`);
        lockboxAddress = network.config.addresses.lockbox;

        /*      const restakingPoolConfig = await deployConfig([owner, operator, treasury]);
              const {restakingPool, ratioFeed, cToken} = await deployLiquidRestaking({
                  protocolConfig: restakingPoolConfig,
                  tokenName: "Inception eth",
                  tokenSymbol: "inEth",
                  distributeGasLimit: RESTAKING_POOL_DISTRIBUTE_GAS_LIMIT,
                  maxTVL: RESTAKING_POOL_MAX_TVL,
              });
              restakingPool.address = await restakingPool.getAddress();
              ratioFeed.address = await ratioFeed.getAddress();
              cToken.address = await cToken.getAddress();*/

        //===Restaking pool config upgrade
        const protocolConfigAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.restakingPoolConfig);
        let slot = "0x" + (0).toString(16);
        let value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [protocolConfigAdminAddress, slot, value]);

        const ProtocolConfig = await ethers.getContractFactory("ProtocolConfig", owner);
        const restakingPoolConfig = await upgrades.upgradeProxy(network.config.addresses.restakingPoolConfig, ProtocolConfig);
        //Updating governance address
        slot = "0x" + getSlotByName("genesis.config.Governance");
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [network.config.addresses.restakingPoolConfig, slot, value]);

        //===Restaking pool upgrade
        const restakingPoolAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.restakingPool);
        slot = "0x" + (0).toString(16);
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [restakingPoolAdminAddress, slot, value]);
        const RestakingPool = await ethers.getContractFactory("RestakingPool", {
            signer: owner,
            libraries: {InceptionLibrary: network.config.addresses.lib},
        });
        await upgrades.forceImport(network.config.addresses.restakingPool, RestakingPool);
        const restakingPool = await upgrades.upgradeProxy(
            network.config.addresses.restakingPool,
            RestakingPool,
            {unsafeAllowLinkedLibraries: true});
        restakingPool.address = await restakingPool.getAddress();

        //===cToken
        const cTokenAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.cToken);
        slot = "0x" + (0).toString(16);
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [cTokenAdminAddress, slot, value]);
        const CToken = await ethers.getContractFactory("cToken", owner);
        const cToken = await upgrades.upgradeProxy(network.config.addresses.cToken, CToken);
        cToken.address = await cToken.getAddress();

        //===RatioFeed
        const ratioFeedAdminAddress = await upgrades.erc1967.getAdminAddress(network.config.addresses.ratioFeed);
        slot = "0x" + (0).toString(16);
        value = ethers.zeroPadValue(owner.address, 32);
        await network.provider.send("hardhat_setStorageAt", [ratioFeedAdminAddress, slot, value]);
        const RatioFeed = await ethers.getContractFactory("RatioFeed", owner);
        const ratioFeed = await upgrades.upgradeProxy(network.config.addresses.ratioFeed, RatioFeed);
        ratioFeed.address = await ratioFeed.getAddress();

        console.log('=== TransactionStorage');
        const txStorage = await ethers.deployContract("TransactionStorage", [owner.address]);
        txStorage.address = await txStorage.getAddress();

        //===Arbitrum
        console.log('=== ArbInboxMock');
        const arbInboxMock = await ethers.deployContract("ArbInboxMock", []);
        arbInboxMock.address = await arbInboxMock.getAddress();

        console.log('=== ArbOutboxMock');
        const arbOutboxMock = await ethers.deployContract("ArbOutboxMock", [target]);
        arbOutboxMock.address = await arbOutboxMock.getAddress();

        console.log('=== CrossChainAdapterArbitrumL1');
        const ArbAdapter = await ethers.getContractFactory("CrossChainAdapterArbitrumL1");
        const arbAdapter = await upgrades.deployProxy(ArbAdapter, [
            txStorage.address,
            arbInboxMock.address,
            operator.address
        ]);
        arbAdapter.address = await arbAdapter.getAddress();

        console.log('=== ArbBridgeMock');
        const arbBridgeMock = await ethers.deployContract("ArbBridgeMock", [arbAdapter.address, arbOutboxMock.address]);
        arbBridgeMock.address = await arbBridgeMock.getAddress();
        await arbInboxMock.setBridge(arbBridgeMock.address);

        //===Optimism
        console.log('=== OptimismBridgeMock');
        const optBridgeMock = await ethers.deployContract("OptBridgeMock", [target.address]);
        optBridgeMock.address = await optBridgeMock.getAddress();

        console.log('=== CrossChainAdapterOptimismL1');
        const OptAdapter = await ethers.getContractFactory("CrossChainAdapterOptimismL1");
        const optAdapter = await upgrades.deployProxy(OptAdapter, [
            optBridgeMock.address,
            optimismStandardBridge,
            txStorage.address,
            operator.address
        ]);
        optAdapter.address = await optAdapter.getAddress();
        await optBridgeMock.setAdapter(optAdapter.address);

        console.log('=== Rebalancer');
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await upgrades.deployProxy(Rebalancer, [
            cToken.address,
            lockboxAddress,
            restakingPool.address,
            txStorage.address,
            ratioFeed.address,
            operator.address
        ]);
        rebalancer.address = await rebalancer.getAddress();

        console.log("=== LZ crosschain bridge");
        const eIds = [30101, 30110, 30111]
        const chainIds = [1, 42161, 10]
        const crosschainBridge = await ethers.deployContract(
            "LZCrossChainBridge",
            [
                "0x1a44076050125825900e736c501f859c50fE728c", //TODO move to config https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts
                owner.address,
                eIds,
                chainIds
            ]);
        crosschainBridge.address = await crosschainBridge.getAddress();

        console.log("=== CrossChainAdapterL1");
        const Adapter = await ethers.getContractFactory("CrossChainAdapterL1");
        const adapter = await upgrades.deployProxy(Adapter, [
            crosschainBridge.address,
            rebalancer.address,
            txStorage.address
        ]);
        adapter.address = await adapter.getAddress();

        return [
            cToken,
            arbAdapter,
            rebalancer,
            txStorage,
            ratioFeed,
            restakingPool,
            arbBridgeMock,
            arbInboxMock,
            arbOutboxMock,
            restakingPoolConfig,
            optAdapter,
            optBridgeMock,
            adapter
        ]
    }

    before(async function () {
        [owner, operator, treasury, signer1, signer2, signer3, target] = await ethers.getSigners();
        [
            inEth,
            arbAdapter,
            rebalancer,
            txStorage,
            ratioFeed,
            restakingPool,
            arbBridgeMock,
            arbInboxMock,
            arbOutboxMock,
            restakingPoolConfig,
            optAdapter,
            optBridgeMock,
            adapter
        ] = await init(owner, operator, treasury, target);
        clean_snapshot = await takeSnapshot();

        await rebalancer.connect(owner).setAdapter(adapter.address);
        await txStorage.connect(owner).addChainId(ARB_ID);
        // await txStorage.connect(owner).addAdapter(ARB_ID, arbAdapter.address);
        await txStorage.connect(owner).addChainId(OPT_ID);
        await txStorage.connect(owner).setAdapter(adapter.address);
        // await txStorage.connect(owner).addAdapter(OPT_ID, optAdapter.address);


        // MAX_THRESHOLD = await ratioFeed.MAX_THRESHOLD();
        // ratioThresh = MAX_THRESHOLD / 100n; //1%
        // await ratioFeed.connect(owner).setRatioThreshold(ratioThresh); //Default threshold 1%
        // await ratioFeed.connect(operator).updateRatio(inEth.address, e18); //Default ratio 1

        //Arbitrum adapter
        await arbAdapter.setL2Sender(target);
        await arbAdapter.setRebalancer(rebalancer.address);
        await arbAdapter.setL2Receiver(target.address);
        await optAdapter.setL2Sender(target);
        await optAdapter.setRebalancer(rebalancer.address);
        await optAdapter.setL2Receiver(target.address);

        //Restaking pool
        await restakingPoolConfig.connect(owner).setRebalancer(rebalancer.address);

        // await restakingPool.connect(owner).setFlashUnstakeFeeParams(30n * 10n ** 7n, 5n * 10n ** 7n, 25n * 10n ** 8n);
        // await restakingPool.connect(owner).setStakeBonusParams(15n * 10n ** 7n, 25n * 10n ** 6n, 25n * 10n ** 8n);
        // await restakingPool.connect(owner).setProtocolFee(50n * 10n ** 8n);
        // await restakingPool.connect(owner).setTargetFlashCapacity(1n);
        // await restakingPool.connect(owner).setMinStake(RESTAKING_POOL_MIN_STAKE);

        snapshot = await takeSnapshot();
    });

    describe("Restaking pool", function () {
        describe("After deployments checks", function () {
            before(async function () {
                await snapshot.restore();
            })

            it("Signer can stake", async function () {
                await restakingPool.connect(signer1)["stake()"]({value: 2n * e18});
            })

            it("Get min stake amount", async function () {
                console.log("Min stake amount: ", await restakingPool.getMinStake());
            })
        })
    })

    describe("Rebalancer", function () {
        describe("After deployments checks", function () {
            before(async function () {
                await snapshot.restore();
            })

            //Constants
            it("MULTIPLIER", async function () {
                expect(await rebalancer.MULTIPLIER()).to.be.eq(e18);
            })

            //Addresses
            it("inEth address", async function () {
                expect(await rebalancer.inETHAddress()).to.be.eq(inEth.address);
            })

            it("restaking pool address", async function () {
                expect(await rebalancer.liqPool()).to.be.eq(restakingPool.address);
            })

            it("lockbox address", async function () {
                expect(await rebalancer.lockboxAddress()).to.be.eq(lockboxAddress);
            })

            it("operator address", async function () {
                expect(await rebalancer.operator()).to.be.eq(operator.address);
            })

            it("owner", async function () {
                expect(await rebalancer.owner()).to.be.eq(owner.address);
            })

            it("ratio feed address", async function () {
                expect(await rebalancer.ratioFeed()).to.be.eq(ratioFeed.address);
            })

            it("transaction storage address", async function () {
                expect(await rebalancer.transactionStorage()).to.be.eq(txStorage.address);
            })
        })

        describe("Getters and setters", function () {
            beforeEach(async function () {
                await snapshot.restore();
            })

            const setters = [
                {
                    name: "inEth address",
                    setter: "setInETHAddress",
                    getter: "inETHAddress",
                    event: "InEthChanged",
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
                {
                    name: "transactionStorage address",
                    setter: "setTransactionStorage",
                    getter: "transactionStorage",
                    event: "TxStorageChanged",
                },
            ]

            setters.forEach(function (arg) {
                it(`Set new ${arg.name}`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(rebalancer[arg.setter](newValue))
                        .to.emit(rebalancer, arg.event)
                        .withArgs(newValue);

                    expect(await rebalancer[arg.getter]()).to.be.eq(newValue);
                })

                it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(rebalancer.connect(signer1)[arg.setter](newValue))
                        .to.be.revertedWithCustomError(rebalancer, "OwnableUnauthorizedAccount")
                        .withArgs(signer1.address);
                })

                it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
                    const newValue = ethers.ZeroAddress;
                    await expect(rebalancer[arg.setter](newValue))
                        .to.be.revertedWithCustomError(rebalancer, "SettingZeroAddress");
                })
            })
        })

        describe("Update data", function () {
            let initialArbAmount, initialArbSupply;
            let initialOptAmount, initialOptSupply;

            before(async function () {
                await snapshot.restore();
                const amount = 2n * e18;
                await restakingPool.connect(signer1)["stake()"]({value: amount});
                const initialAmount = await inEth.balanceOf(lockboxAddress);
                initialArbAmount = initialAmount / 2n;
                initialArbSupply = initialAmount / 2n;
                initialOptAmount = initialAmount - initialArbAmount;
                initialOptSupply = initialAmount - initialArbAmount;
            })

            it("Reverts when there is no data for one of the chains", async function () {
                await expect(rebalancer.updateTreasuryData())
                    .to.revertedWithCustomError(rebalancer, "MissingOneOrMoreL2Transactions");
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp;
                await arbBridgeMock.receiveL2Info(timestamp, e18, e18);

                await expect(rebalancer.updateTreasuryData())
                    .to.revertedWithCustomError(rebalancer, "MissingOneOrMoreL2Transactions");
            })

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
                    }
                },
                {
                    name: "Increase only inEth supply ARB",
                    arb: {
                        l2BalanceDiff: () => 0n,
                        l2TotalSupplyDiff: () => ethers.parseEther("1.5"),
                    }
                },
                {
                    name: "Increase only inEth supply OPT",
                    opt: {
                        l2BalanceDiff: () => 0n,
                        l2TotalSupplyDiff: () => ethers.parseEther("1.5"),
                    }
                },
                {
                    name: "Decrease amount and total supply ARB only",
                    arb: {
                        l2BalanceDiff: () => -ethers.parseEther("0.5"),
                        l2TotalSupplyDiff: () => -ethers.parseEther("0.5"),
                    }
                },
                {
                    name: "Decrease amount and total supply OPT only",
                    opt: {
                        l2BalanceDiff: () => -ethers.parseEther("0.5"),
                        l2TotalSupplyDiff: () => -ethers.parseEther("0.5"),
                    }
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
                    }
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
                    }
                },
                {
                    name: "Decrease to 0 ARB",
                    arb: {
                        l2BalanceDiff: () => -initialArbSupply,
                        l2TotalSupplyDiff: () => -initialArbSupply,
                    }
                },
                {
                    name: "Decrease to 0 OPT",
                    opt: {
                        l2BalanceDiff: () => -initialOptSupply,
                        l2TotalSupplyDiff: () => -initialOptSupply,
                    }
                },
            ]

            args.forEach(function (arg) {
                it(`updateTreasuryData: ${arg.name}`, async () => {
                    const block = await ethers.provider.getBlock("latest");
                    const timestamp = block.timestamp;

                    let expectedTotalSupplyDiff = 0n;
                    if (arg.arb) {
                        expectedTotalSupplyDiff += arg.arb.l2TotalSupplyDiff();
                        initialArbAmount += arg.arb.l2BalanceDiff();
                        initialArbSupply += arg.arb.l2TotalSupplyDiff();
                        await arbBridgeMock.receiveL2Info(timestamp, initialArbAmount, initialArbSupply);
                    }
                    if (arg.opt) {
                        expectedTotalSupplyDiff += arg.opt.l2TotalSupplyDiff();
                        initialOptAmount += arg.opt.l2BalanceDiff();
                        initialOptSupply += arg.opt.l2TotalSupplyDiff();
                        await optBridgeMock.receiveL2Info(timestamp, initialOptAmount, initialOptSupply);
                    }
                    console.log(`Total supply diff: ${expectedTotalSupplyDiff.format()}`);
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
                            .and
                            .to.not.emit(rebalancer, "TreasuryUpdateBurn")
                    }
                    if (expectedTotalSupplyDiff < 0n) {
                        await expect(tx).to.emit(rebalancer, "TreasuryUpdateBurn").withArgs(0n - expectedTotalSupplyDiff);
                    }
                })
            })

            it("updateTreasuryData reverts when total supply is the same", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp;
                await arbBridgeMock.receiveL2Info(timestamp, e18, e18);
                await optBridgeMock.receiveL2Info(timestamp, e18, e18);
                await rebalancer.updateTreasuryData();

                await expect(rebalancer.updateTreasuryData())
                    .to.be.revertedWithCustomError(rebalancer, "NoRebalancingRequired");
            })

            it("inEth leftover on rebalancer will be transferred to the lockbox", async function () {
                await snapshot.restore();
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp;
                await restakingPool.connect(signer1)["stake()"]({value: 2n * e18});

                const totalSupplyBefore = await inEth.totalSupply();
                const lockboxBalanceBefore = await inEth.balanceOf(lockboxAddress);
                //Report L2 info
                const l2SupplyChange = e18;
                await arbBridgeMock.receiveL2Info(timestamp, lockboxBalanceBefore / 2n, lockboxBalanceBefore / 2n + l2SupplyChange);
                await optBridgeMock.receiveL2Info(timestamp, lockboxBalanceBefore / 2n, lockboxBalanceBefore / 2n + l2SupplyChange);

                const amount = randomBI(17);
                await inEth.connect(signer1).transfer(rebalancer.address, amount);

                await expect(rebalancer.updateTreasuryData())
                    .to.emit(rebalancer, "InETHDepositedToLockbox")
                    .withArgs(amount);
                console.log(`Total supply: ${(await inEth.totalSupply()).format()}`)

                const totalSupplyAfter = await inEth.totalSupply();
                const lockboxBalanceAfter = await inEth.balanceOf(lockboxAddress);
                expect(totalSupplyAfter - totalSupplyBefore).to.be.closeTo(l2SupplyChange * 2n, 1n);
                expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.closeTo(l2SupplyChange * 2n + amount, 1n);
            })
        })

        describe("Stake", function () {
            beforeEach(async function () {
                await snapshot.restore();
            })

            const args = [
                {
                    name: "Part of the balance",
                    balance: async () => await restakingPool.availableToStake(),
                    amount: async (amount) => amount / 2n
                },
                {
                    name: "All balance",
                    balance: async () => await restakingPool.availableToStake(),
                    amount: async (amount) => amount
                },
                {
                    name: "Restaking pool min amount",
                    balance: async () => await restakingPool.availableToStake(),
                    amount: async () => await restakingPool.getMinStake()
                }
            ]

            args.forEach(function (arg) {
                it(`${arg.name}`, async function () {
                    const balance = await arg.balance();
                    await signer1.sendTransaction({value: balance, to: rebalancer.address});

                    const amount = await arg.amount(balance);
                    const shares = await inEth.convertToShares(amount);
                    const lockboxInEthBalanceBefore = await inEth.balanceOf(lockboxAddress);

                    const tx = await rebalancer.connect(operator).stake(amount);
                    await expect(tx)
                        .and.emit(rebalancer, "InETHDepositedToLockbox").withArgs(shares)
                        .and.emit(restakingPool, "Staked").withArgs(rebalancer.address, amount, shares);

                    const lockboxInEthBalanceAfter = await inEth.balanceOf(lockboxAddress);
                    console.log("Signer eth balance after: ", await ethers.provider.getBalance(signer1.address));
                    console.log("Restaking pool eth balance: ", await ethers.provider.getBalance(restakingPool.address));
                    console.log("lockbox inEth balance: ", await inEth.balanceOf(lockboxAddress));

                    //Everything was staked goes to the lockbox
                    expect(lockboxInEthBalanceAfter - lockboxInEthBalanceBefore).to.be.eq(shares);
                    expect(await inEth.balanceOf(rebalancer.address)).to.be.eq(0n);
                })
            })

            it("Reverts when amount > available to stake from restaking pool", async function () {
                const amount = await restakingPool.availableToStake() + 1n;
                await signer1.sendTransaction({value: amount, to: rebalancer.address});
                await expect(rebalancer.connect(operator).stake(amount))
                    .to.revertedWithCustomError(rebalancer, "StakeAmountExceedsMaxTVL");
            })

            it("Reverts when amount > eth balance", async function () {
                const amount = await restakingPool.availableToStake() / 2n;
                await signer1.sendTransaction({value: amount, to: rebalancer.address});
                await expect(rebalancer.connect(operator).stake(amount + 1n))
                    .to.revertedWithCustomError(rebalancer, "StakeAmountExceedsEthBalance");
            })

            it("Reverts when amount < restaking pool min stake", async function () {
                const amount = await restakingPool.getMinStake() - 1n;
                await signer1.sendTransaction({value: amount, to: rebalancer.address});
                await expect(rebalancer.connect(operator).stake(amount))
                    .to.revertedWithCustomError(restakingPool, "PoolStakeAmLessThanMin");
            })

            it("Reverts when called by not an operator", async function () {
                const amount = await restakingPool.availableToStake() / 2n;
                await signer1.sendTransaction({value: amount, to: rebalancer.address});
                await expect(rebalancer.connect(signer1).stake(amount))
                    .to.revertedWithCustomError(rebalancer, "OnlyOperator");
            })
        })

        describe("sendEthToL2", function () {
            before(async function () {
                const balance = await restakingPool.availableToStake();
                await signer1.sendTransaction({value: balance, to: rebalancer.address});
                await arbAdapter.setInbox("0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f");
                // await arbAdapter.connect(owner).setGasParameters(
                //     2n * 10n ** 15n,
                //     200_000n,
                //     100_000_000n
                // );
            })

            const args = [
                {
                    name: "Part of the balance to ARB",
                    amount: async (amount) => amount / 2n,
                    feeParams: () => encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n),
                    fees: 2n * 10n ** 16n,
                    chainId: ARB_ID,
                    event: "RetryableTicketCreated",
                    adapter: () => arbAdapter,
                },
                {
                    name: "Part of the balance to OPT",
                    amount: async (amount) => amount / 2n,
                    feeParams: () => encodeOptimismFees(200_000n),
                    fees: 0n,
                    chainId: OPT_ID,
                    event: "CrossChainTxOptimismSent",
                    adapter: () => optAdapter,
                },
                {
                    name: "All balance to ARB",
                    amount: async (amount) => amount,
                    feeParams: () => encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n),
                    fees: 2n * 10n ** 16n,
                    chainId: ARB_ID,
                    event: "RetryableTicketCreated",
                    adapter: () => arbAdapter,
                },
                {
                    name: "All balance to OPT",
                    amount: async (amount) => amount,
                    feeParams: () => encodeOptimismFees(200_000n),
                    fees: 0n,
                    chainId: OPT_ID,
                    event: "CrossChainTxOptimismSent",
                    adapter: () => optAdapter,
                }
            ]

            args.forEach(function (arg) {
                it(`${arg.name}`, async function () {
                    const balance = await ethers.provider.getBalance(rebalancer.address);
                    const amount = await arg.amount(balance);
                    const adapter = arg.adapter();
                    const feeParams = arg.feeParams();
                    const fees = arg.fees;
                    const tx = await rebalancer.connect(operator)
                        .sendEthToL2(arg.chainId, amount, feeParams, {value: fees});
                    await expect(tx).to.emit(adapter, arg.event);
                    await expect(tx).to.changeEtherBalance(rebalancer, -amount);
                    await expect(tx).to.changeEtherBalance(adapter, 0n);
                    await expect(tx).to.changeEtherBalance(operator, -fees, {includeFee: false});
                })
            })

            it("Reverts when amount > eth balance", async function () {
                const fees = 2n * 10n ** 15n;
                await signer1.sendTransaction({value: e18, to: rebalancer.address});
                const amount = await ethers.provider.getBalance(rebalancer.address);
                const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
                await expect(rebalancer.connect(operator).sendEthToL2(ARB_ID, amount + 1n, feeParams, {value: fees}))
                    .to.revertedWithCustomError(rebalancer, "SendAmountExceedsEthBalance");
            })

            it("Reverts when called by not an operator", async function () {
                const fees = 2n * 10n ** 15n;
                await signer1.sendTransaction({value: e18, to: rebalancer.address});
                const amount = await ethers.provider.getBalance(rebalancer.address);
                const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
                await expect(rebalancer.connect(signer1).sendEthToL2(ARB_ID, amount, feeParams, {value: fees}))
                    .to.revertedWithCustomError(rebalancer, "OnlyOperator");
            })

            it("Reverts when there is no adapter for the chain", async function () {
                await signer1.sendTransaction({value: e18, to: rebalancer.address});
                const fees = 2n * 10n ** 15n;
                const amount = await ethers.provider.getBalance(rebalancer.address);
                const feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
                await expect(rebalancer.connect(operator).sendEthToL2(randomBI(4), amount, feeParams, {value: fees}))
                    .to.revertedWithCustomError(rebalancer, "CrosschainAdapterNotSet");
            })
        })
    })

    describe("Transaction storage", function () {
        describe("Setters", function () {
            let chain = randomBI(4);
            let adapter = ethers.Wallet.createRandom().address;
            let newAdapter = ethers.Wallet.createRandom().address;

            it("addChainId only owner can", async function () {
                const chainsBefore = await txStorage.getAllChainIds();
                await txStorage.connect(owner).addChainId(chain);

                const chainsAfter = await txStorage.getAllChainIds();
                expect([...chainsAfter]).to.include.members([...chainsBefore])
                expect(chainsAfter).to.include(chain);
            })

            it("addChainId reverts when chain is added already", async function () {
                await expect(txStorage.connect(owner).addChainId(chain))
                    .to.be.revertedWithCustomError(txStorage, "ChainIdAlreadyExists")
                    .withArgs(chain);
            })

            it("addChainId reverts when called by not an owner", async function () {
                await expect(txStorage.connect(signer1).addChainId(chain + 1n))
                    .to.be.revertedWithCustomError(txStorage, "OwnableUnauthorizedAccount")
                    .withArgs(signer1.address);
            })

            it("addAdapter only owner can", async function () {
                await expect(txStorage.connect(owner).addAdapter(chain, adapter))
                    .to.emit(txStorage, "AdapterAdded")
                    .withArgs(chain, adapter);

                expect(await txStorage.adapters(chain)).to.be.eq(adapter);
            })

            it("addAdapter reverts when adapter is already set for the chain", async function () {
                await expect(txStorage.connect(owner).addAdapter(chain, adapter))
                    .to.revertedWithCustomError(txStorage, "AdapterAlreadyExists")
                    .withArgs(chain);
            })

            it("addAdapter reverts when called by not an owner", async function () {
                const anotherChain = randomBI(5);
                await txStorage.connect(owner).addChainId(anotherChain);

                const anotherAdapter = ethers.Wallet.createRandom().address;
                await expect(txStorage.connect(signer1).addAdapter(anotherChain, anotherAdapter))
                    .to.be.revertedWithCustomError(txStorage, "OwnableUnauthorizedAccount")
                    .withArgs(signer1.address);
            })

            it("replaceAdapter only owner can", async function () {
                newAdapter = ethers.Wallet.createRandom().address;
                await expect(txStorage.connect(owner).replaceAdapter(chain, newAdapter))
                    .to.emit(txStorage, "AdapterReplaced")
                    .withArgs(chain, adapter, newAdapter);

                expect(await txStorage.adapters(chain)).to.be.eq(newAdapter);
            })

            it("replaceAdapter reverts when adapter is not set", async function () {
                const chainId = randomBI(6);
                await expect(txStorage.connect(owner).replaceAdapter(chainId, adapter))
                    .to.revertedWithCustomError(txStorage, "NoAdapterForThisChainId")
                    .withArgs(chainId);
            })

            it("replaceAdapter reverts when called by not an owner", async function () {
                await expect(txStorage.connect(signer1).replaceAdapter(chain, newAdapter))
                    .to.be.revertedWithCustomError(txStorage, "OwnableUnauthorizedAccount")
                    .withArgs(signer1.address);
            })

            it("getTransactionData when there is not such", async function () {
                const res = await txStorage.getTransactionData(chain);
                console.log(res);
            })
        })

        describe("handleL2Info", function () {
            it("handleL2Info reverts when called by not an adapter", async function () {
                const block = await ethers.provider.getBlock("latest");
                const chainId = ARB_ID;
                const timestamp = block.timestamp;
                const balance = e18;
                const totalSupply = e18;

                await expect(txStorage.connect(owner).handleL2Info(chainId, timestamp, balance, totalSupply))
                    .to.be.revertedWithCustomError(txStorage, "MsgNotFromAdapter")
                    .withArgs(owner.address);
            })
        })
    })

    describe("Crosschain adapter Arbitrum", function () {
        describe("Getters and setters", function () {
            beforeEach(async function () {
                await snapshot.restore();
            })

            const setters = [
                {
                    name: "rebalancer address",
                    setter: "setRebalancer",
                    getter: "rebalancer",
                    event: "RebalancerChanged"
                },
                {
                    name: "txStorage address",
                    setter: "setTxStorage",
                    getter: "transactionStorage",
                    event: "TxStorageChanged"
                },
                {
                    name: "l2 sender address",
                    setter: "setL2Sender",
                    getter: "l2Sender",
                    event: "L2SenderChanged"
                },
                {
                    name: "arbitrum inbox",
                    setter: "setInbox",
                    getter: "inbox",
                    event: "InboxChanged"
                },
                {
                    name: "l2 receiver",
                    setter: "setL2Receiver",
                    getter: "l2Receiver",
                    event: "L2ReceiverChanged"
                },
            ]

            setters.forEach(function (arg) {
                it(`Set new ${arg.name}`, async function () {
                    const prevValue = await arbAdapter[arg.getter]()
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(arbAdapter[arg.setter](newValue))
                        .to.emit(arbAdapter, arg.event)
                        .withArgs(prevValue, newValue);

                    expect(await arbAdapter[arg.getter]()).to.be.eq(newValue);
                })

                it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(arbAdapter.connect(signer1)[arg.setter](newValue))
                        .to.be.revertedWith("Ownable: caller is not the owner");
                })

                it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
                    const newValue = ethers.ZeroAddress;
                    await expect(arbAdapter[arg.setter](newValue))
                        .to.be.revertedWithCustomError(arbAdapter, "SettingZeroAddress");
                })
            })

            it("Chain id", async function () {
                expect(await arbAdapter.getChainId()).to.be.eq(ARB_ID);
                expect(await arbAdapter.ARBITRUM_CHAIN_ID()).to.be.eq(ARB_ID);
            })

            it("Owner", async function () {
                expect(await arbAdapter.owner()).to.be.eq(owner.address);
            })

            it("Operator", async function () {
                expect(await arbAdapter.operator()).to.be.eq(operator.address);
            })
        })

        describe("receiveL2Eth", function () {
            before(async function () {
                await snapshot.restore();
            })

            const args = [
                {
                    name: "Random amount ~ 1e17",
                    amount: async () => randomBI(17)
                },
                {
                    name: "Restaking pool min amount",
                    amount: async () => await restakingPool.getMinStake()
                },
                {
                    name: "Greater than available to stake",
                    amount: async () => await restakingPool.availableToStake() + 1n
                }
            ];

            args.forEach(function (arg) {
                it(arg.name, async function () {
                    const amount = await arg.amount();

                    const tx = arbBridgeMock.connect(signer1).receiveL2Eth({value: amount});
                    await expect(tx)
                        .and.emit(arbAdapter, "L2EthDeposit").withArgs(amount)
                        .and.emit(rebalancer, "ETHReceived").withArgs(arbAdapter.address, arg.amount);
                    await expect(tx).to.changeEtherBalance(rebalancer.address, amount);
                    await expect(tx).to.changeEtherBalance(signer1.address, -amount);
                })
            })

            it("Reverts when called by not a bridge", async function () {
                const amount = e18;
                await expect(arbAdapter.connect(signer1).receiveL2Eth({value: amount}))
                    .to.revertedWithCustomError(arbAdapter, "NotBridge");
            })
        })

        describe("receiveL2Info", function () {
            let lastHandleTime;
            before(async function () {
                await snapshot.restore();
            })

            it("receiveL2Info", async () => {
                const block = await ethers.provider.getBlock("latest");
                lastHandleTime = block.timestamp - 1000;
                const _balance = 100;
                const _totalSupply = 100;

                await expect(arbBridgeMock.receiveL2Info(lastHandleTime, _balance, _totalSupply))
                    .to.emit(txStorage, "L2InfoReceived")
                    .withArgs(ARB_ID, lastHandleTime, _balance, _totalSupply);

                const chainDataAfter = await txStorage.getTransactionData(ARB_ID);
                expect(chainDataAfter.timestamp).to.be.eq(lastHandleTime);
                expect(chainDataAfter.ethBalance).to.be.eq(_balance);
                expect(chainDataAfter.inEthBalance).to.be.eq(_totalSupply);
            })

            it("Reverts when there is a message with this timestamp", async function () {
                const balance = 200;
                const totalSupply = 200;

                await expect(arbBridgeMock.receiveL2Info(lastHandleTime, balance, totalSupply))
                    .to.revertedWithCustomError(txStorage, "TimeBeforePrevRecord")
                    .withArgs(lastHandleTime);
            })

            it("Reverts when timestamp is in the future", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(arbBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(txStorage, "TimeCannotBeInFuture")
                    .withArgs(timestamp);
            })

            it("Reverts when l2 sender is unknown", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                const unknownSender = ethers.Wallet.createRandom().address;
                await arbOutboxMock.setL2Sender(unknownSender);

                await expect(arbBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(arbAdapter, "UnauthorizedOriginalSender");
            })

            it("Reverts when called by not a bridge", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(arbAdapter.connect(signer1).receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(arbAdapter, "NotBridge");
            })


        })

        describe("sendEthToL2", function () {
            before(async function () {
                await snapshot.restore();
                await arbAdapter.setRebalancer(signer1.address);
            })

            it("Reverts when called by not a rebalancer", async function () {
                const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
                const value = e18;
                await expect(arbAdapter.connect(signer2).sendEthToL2(value, feesParams, {value: value}))
                    .to.be.revertedWithCustomError(arbAdapter, "OnlyRebalancerCanCall")
                    .withArgs(signer2.address);
            })

            it("Reverts amount > value", async function () {
                const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
                const value = e18;
                await expect(arbAdapter.connect(signer1).sendEthToL2(value + 1n, feesParams, {value: value}))
                    .to.be.revertedWithCustomError(arbAdapter, "InvalidValue");
            })

            it("Reverts when gas params are zero", async function () {
                const value = e18;
                let feeParams = encodeArbitrumFees(0n, 200_000n, 100_000_000n);
                await expect(arbAdapter.connect(signer1).sendEthToL2(value, feeParams, {value: value}))
                    .to.revertedWithCustomError(arbAdapter, "SettingZeroGas");

                feeParams = encodeArbitrumFees(2n * 10n ** 15n, 0n, 100_000_000n);
                await expect(arbAdapter.connect(signer1).sendEthToL2(value, feeParams, {value: value}))
                    .to.revertedWithCustomError(arbAdapter, "SettingZeroGas");

                feeParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 0n);
                await expect(arbAdapter.connect(signer1).sendEthToL2(value, feeParams, {value: value}))
                    .to.revertedWithCustomError(arbAdapter, "SettingZeroGas");
            })
        })

        describe("recoverFunds", function () {
            before(async function () {
                await snapshot.restore();
            })

            it("Operator can transfer funds from adapter to rebalancer", async function () {
                const amount = e18;
                await expect(signer1.sendTransaction({to: arbAdapter.address, value: amount}))
                    .to.emit(arbAdapter, "ReceiveTriggered")
                    .withArgs(signer1.address, amount);

                const tx = arbAdapter.connect(operator).recoverFunds();
                await expect(tx).to.changeEtherBalance(arbAdapter, -amount);
                await expect(tx).to.changeEtherBalance(rebalancer, amount);
            })

            it("Reverts when called by not an operator", async function () {
                const amount = e18;
                await expect(signer1.sendTransaction({to: arbAdapter.address, value: amount}))
                    .to.emit(arbAdapter, "ReceiveTriggered")
                    .withArgs(signer1.address, amount);

                await expect(arbAdapter.connect(signer1).recoverFunds())
                    .to.be.revertedWithCustomError(arbAdapter, "OnlyOperatorCanCall");
            })


        })
    })

    describe("Crosschain adapter Optimism", function () {
        describe("Getters and setters", function () {
            beforeEach(async function () {
                await snapshot.restore();
            })

            const setters = [
                {
                    name: "rebalancer address",
                    setter: "setRebalancer",
                    getter: "rebalancer",
                    event: "RebalancerChanged"
                },
                {
                    name: "txStorage address",
                    setter: "setTxStorage",
                    getter: "transactionStorage",
                    event: "TxStorageChanged"
                },
                {
                    name: "l2 sender address",
                    setter: "setL2Sender",
                    getter: "l2Sender",
                    event: "L2SenderChanged"
                },
                {
                    name: "l2 receiver",
                    setter: "setL2Receiver",
                    getter: "l2Receiver",
                    event: "L2ReceiverChanged"
                },
            ]

            setters.forEach(function (arg) {
                it(`Set new ${arg.name}`, async function () {
                    const prevValue = await optAdapter[arg.getter]()
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(optAdapter[arg.setter](newValue))
                        .to.emit(optAdapter, arg.event)
                        .withArgs(prevValue, newValue);

                    expect(await optAdapter[arg.getter]()).to.be.eq(newValue);
                })

                it(`Reverts: ${arg.setter} when called by not an owner`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(optAdapter.connect(signer1)[arg.setter](newValue))
                        .to.be.revertedWith("Ownable: caller is not the owner");
                })

                it(`Reverts: ${arg.setter} new value is 0 address`, async function () {
                    const newValue = ethers.ZeroAddress;
                    await expect(optAdapter[arg.setter](newValue))
                        .to.be.revertedWithCustomError(optAdapter, "SettingZeroAddress");
                })
            })

            it("Chain id", async function () {
                expect(await optAdapter.getChainId()).to.be.eq(OPT_ID);
                expect(await optAdapter.OPTIMISM_CHAIN_ID()).to.be.eq(OPT_ID);
            })

            it("l1CrossDomainMessenger", async function () {
                expect(await optAdapter.l1CrossDomainMessenger()).to.be.eq(optBridgeMock.address);
            })

            it("l1StandardBridge", async function () {
                expect(await optAdapter.l1StandardBridge()).to.be.eq(optimismStandardBridge);
            })

            it("Owner", async function () {
                expect(await optAdapter.owner()).to.be.eq(owner.address);
            })

            it("Operator", async function () {
                expect(await optAdapter.operator()).to.be.eq(operator.address);
            })
        })

        describe("receiveL2Eth", function () {
            before(async function () {
                await snapshot.restore();
            })

            const args = [
                {
                    name: "Random amount ~ 1e19",
                    amount: async () => randomBI(17)
                },
                {
                    name: "Restaking pool min amount",
                    amount: async () => await restakingPool.getMinStake()
                },
                {
                    name: "Greater than available to stake",
                    amount: async () => await restakingPool.availableToStake() + 1n
                }
            ];

            args.forEach(function (arg) {
                it(arg.name, async function () {
                    const amount = await arg.amount();

                    const tx = optBridgeMock.connect(signer1).receiveL2Eth({value: amount});
                    await expect(tx)
                        .and.emit(optAdapter, "L2EthDeposit").withArgs(amount)
                        .and.emit(rebalancer, "ETHReceived").withArgs(optAdapter.address, arg.amount);
                    await expect(tx).to.changeEtherBalance(rebalancer.address, amount);
                    await expect(tx).to.changeEtherBalance(signer1.address, -amount);
                })
            })

            it("Reverts when called by not a bridge", async function () {
                const amount = e18;
                await expect(optAdapter.connect(signer1).receiveL2Eth({value: amount}))
                    .to.revertedWithCustomError(optAdapter, "NotBridge");
            })


        })

        describe("receiveL2Info", function () {
            let lastHandleTime;
            before(async function () {
                await snapshot.restore();
            })
            it("receiveL2Info", async () => {
                const block = await ethers.provider.getBlock("latest");
                lastHandleTime = block.timestamp - 1000;
                const _balance = 100;
                const _totalSupply = 100;

                await expect(optBridgeMock.receiveL2Info(lastHandleTime, _balance, _totalSupply))
                    .to.emit(txStorage, "L2InfoReceived")
                    .withArgs(OPT_ID, lastHandleTime, _balance, _totalSupply);

                const chainDataAfter = await txStorage.getTransactionData(OPT_ID);
                expect(chainDataAfter.timestamp).to.be.eq(lastHandleTime);
                expect(chainDataAfter.ethBalance).to.be.eq(_balance);
                expect(chainDataAfter.inEthBalance).to.be.eq(_totalSupply);
            })

            it("Reverts when timestamp is older than the last message", async function () {
                const balance = 200;
                const totalSupply = 200;

                await expect(optBridgeMock.receiveL2Info(lastHandleTime, balance, totalSupply))
                    .to.revertedWithCustomError(txStorage, "TimeBeforePrevRecord")
                    .withArgs(lastHandleTime);
            })

            it("Reverts when timestamp is in the future", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(optBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(txStorage, "TimeCannotBeInFuture")
                    .withArgs(timestamp);
            })

            it("Reverts when called by not a bridge", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(optAdapter.connect(signer1).receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(optAdapter, "NotBridge");
            })

            it("Reverts when l2 sender is unknown", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                const unknownSender = ethers.Wallet.createRandom().address;
                await optBridgeMock.setL2Sender(unknownSender);

                await expect(optBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(arbAdapter, "UnauthorizedOriginalSender");
            })

        })

        describe("sendEthToL2", function () {
            before(async function () {
                await snapshot.restore();
                await optAdapter.setRebalancer(signer1.address);
            })

            it("Sends funds to L2", async function () {
                const feesParams = encodeOptimismFees(200_000n);
                const value = e18;
                await expect(optAdapter.connect(signer1).sendEthToL2(value, feesParams, {value: value}))
                    .to.be.emit(optAdapter, "CrossChainTxOptimismSent");
            })

            it("Reverts when called by not a rebalancer", async function () {
                const feesParams = encodeOptimismFees(200_000n);
                const value = e18;
                await expect(optAdapter.connect(signer2).sendEthToL2(value, feesParams, {value: value}))
                    .to.be.revertedWithCustomError(optAdapter, "OnlyRebalancerCanCall")
                    .withArgs(signer2.address);
            })

            it("Reverts amount > value", async function () {
                const feesParams = encodeOptimismFees(200_000n);
                const value = e18;
                await expect(optAdapter.connect(signer1).sendEthToL2(value + 1n, feesParams, {value: value}))
                    .to.be.revertedWithCustomError(optAdapter, "InvalidValue");
            })

            it("Reverts when there is no gas params", async function () {
                const value = e18;
                await expect(optAdapter.connect(signer1).sendEthToL2(value, [], {value: value}))
                    .to.be.revertedWithCustomError(optAdapter, "GasDataNotProvided");
            })


        })

        describe("recoverFunds", function () {
            before(async function () {
                await snapshot.restore();
            })

            it("Operator can transfer funds from adapter to rebalancer", async function () {
                const amount = e18;
                await expect(signer1.sendTransaction({to: optAdapter.address, value: amount}))
                    .to.emit(optAdapter, "ReceiveTriggered")
                    .withArgs(signer1.address, amount);

                const tx = optAdapter.connect(operator).recoverFunds();
                await expect(tx).to.changeEtherBalance(optAdapter, -amount);
                await expect(tx).to.changeEtherBalance(rebalancer, amount);
            })

            it("Reverts when called by not an operator", async function () {
                const amount = e18;
                await expect(signer1.sendTransaction({to: optAdapter.address, value: amount}))
                    .to.emit(optAdapter, "ReceiveTriggered")
                    .withArgs(signer1.address, amount);

                await expect(optAdapter.connect(signer1).recoverFunds())
                    .to.be.revertedWithCustomError(optAdapter, "OnlyOperatorCanCall");
            })
        })
    })

    describe("Contracts config test", function () {
        beforeEach(async function () {
            await clean_snapshot.restore();
            await txStorage.connect(owner).addChainId(ARB_ID);
            await txStorage.connect(owner).addAdapter(ARB_ID, arbAdapter.address);
            await txStorage.connect(owner).addChainId(OPT_ID);
            await txStorage.connect(owner).addAdapter(OPT_ID, optAdapter.address);
        })

        it("ArbitrumAdapterL1.receiveL2Eth reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await arbAdapter.setL2Sender(target);
            await arbAdapter.setL2Receiver(target.address);

            await expect(arbBridgeMock.connect(signer1).receiveL2Eth({value: e18}))
                .to.revertedWithCustomError(arbAdapter, "RebalancerNotSet");
        })

        it("ArbitrumAdapterL1.sendEthToL2 reverts when l2 receiver is not set", async function () {
            //Arbitrum adapter
            await arbAdapter.setRebalancer(signer1.address)
            await arbAdapter.setL2Sender(target.address);

            const feesParams = encodeArbitrumFees(2n * 10n ** 15n, 200_000n, 100_000_000n);
            const value = e18;
            await expect(arbAdapter.connect(signer1).sendEthToL2(value, feesParams, {value: value}))
                .to.revertedWithCustomError(arbAdapter, "L2ReceiverNotSet");
        })

        it("ArbitrumAdapterL1.receiveL2Info reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await arbAdapter.setL2Sender(target);
            await arbAdapter.setL2Receiver(target.address);

            const block = await ethers.provider.getBlock("latest");
            const timestamp = block.timestamp + 100;
            const balance = 100;
            const totalSupply = 100;
            await expect(arbBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                .to.revertedWithCustomError(arbAdapter, "RebalancerNotSet");
        })

        it("ArbitrumAdapterL1.recoverFunds reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await arbAdapter.setL2Sender(target);
            await arbAdapter.setL2Receiver(target.address);

            await signer1.sendTransaction({to: arbAdapter.address, value: e18});
            await expect(arbAdapter.connect(operator).recoverFunds())
                .to.be.revertedWithCustomError(arbAdapter, "RebalancerNotSet");
        })

        it("OptimismAdapterL1.receiveL2Eth reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await optAdapter.setL2Sender(target);
            await optAdapter.setL2Receiver(target.address);

            await expect(optBridgeMock.connect(signer1).receiveL2Eth({value: e18}))
                .to.revertedWithCustomError(optAdapter, "RebalancerNotSet");
        })

        it("OptimismAdapterL1.receiveL2Info reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await optAdapter.setL2Sender(target);
            await optAdapter.setL2Receiver(target.address);

            const block = await ethers.provider.getBlock("latest");
            const timestamp = block.timestamp + 100;
            const balance = 100;
            const totalSupply = 100;
            await expect(optBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                .to.revertedWithCustomError(optAdapter, "RebalancerNotSet");
        })

        it("OptimismAdapterL1.sendEthToL2 reverts when l2 receiver is not set", async function () {
            //Arbitrum adapter
            await optAdapter.setRebalancer(signer1.address);
            await optAdapter.setL2Sender(target.address);

            const feesParams = encodeOptimismFees(200_000n);
            const value = e18;
            await expect(optAdapter.connect(signer1).sendEthToL2(value, feesParams, {value: value}))
                .to.revertedWithCustomError(optAdapter, "L2ReceiverNotSet");
        })

        it("OptimismAdapterL1.recoverFunds reverts when rebalancer is not set", async function () {
            //Arbitrum adapter
            await optAdapter.setL2Sender(target);
            await optAdapter.setL2Receiver(target.address);

            await signer1.sendTransaction({to: optAdapter.address, value: e18});
            await expect(optAdapter.connect(operator).recoverFunds())
                .to.be.revertedWithCustomError(optAdapter, "RebalancerNotSet");
        })

    })
})

function encodeArbitrumFees(maxSubmissionCost, maxGas, gasPriceBid) {
    const abiCoder = new AbiCoder();
    return [abiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [maxSubmissionCost, maxGas, gasPriceBid]
    )];
}

function encodeOptimismFees(maxGas) {
    const abiCoder = new AbiCoder();
    return [abiCoder.encode(
        ["uint256"],
        [maxGas]
    )];
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