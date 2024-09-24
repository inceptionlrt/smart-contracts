import {ethers, upgrades} from "hardhat";
import {expect} from "chai";
import {takeSnapshot} from "@nomicfoundation/hardhat-network-helpers";
import {e18, randomBI} from "../../vaults/test/helpers/utils.js";
import {deployConfig, deployLiquidRestaking} from "./helpers/deploy";
import {
    ArbBridgeMock,
    CrossChainAdapterArbitrum, CrossChainAdapterOptimism,
    CToken, OptBridgeMock,
    ProtocolConfig,
    Rebalancer,
    RestakingPool,
    TransactionStorage
} from "../typechain-types";
import {SnapshotRestorer} from "@nomicfoundation/hardhat-network-helpers/src/helpers/takeSnapshot";

BigInt.prototype.format = function () {
    return this.toLocaleString("de-DE");
};

const ARB_ID = 42161;
const OPT_ID = 10;
const RESTAKING_POOL_DISTRIBUTE_GAS_LIMIT = 250_000n;
const RESTAKING_POOL_MAX_TVL = 32n * e18;
const RESTAKING_POOL_MIN_STAKE = 1000n;

describe("Omnivault integration tests", function () {
    this.timeout(15000);
    let ratioFeed, arbInboxMock, arbOutboxMock, lockboxMock;
    let inEth: CToken;
    let rebalancer: Rebalancer;
    let txStorage: TransactionStorage;
    let restakingPool: RestakingPool
    let arbBridgeMock: ArbBridgeMock;
    let arbAdapter: CrossChainAdapterArbitrum;
    let optBridgeMock: OptBridgeMock;
    let optAdapter: CrossChainAdapterOptimism;
    let restakingPoolConfig: ProtocolConfig;

    let owner, operator, treasury, signer1, signer2, signer3, target;
    let MAX_THRESHOLD, ratioThresh;
    let clean_snapshot: SnapshotRestorer;
    let snapshot: SnapshotRestorer;

    async function init(owner, operator, treasury, target) {
        const block = await ethers.provider.getBlock("latest");
        console.log(`Starting at block number: ${block.number}`);

        //Restaking pool and cToken = inEth
        const restakingPoolConfig = await deployConfig([owner, operator, treasury]);
        const {restakingPool, ratioFeed, cToken} = await deployLiquidRestaking({
            protocolConfig: restakingPoolConfig,
            tokenName: "Inception eth",
            tokenSymbol: "inEth",
            distributeGasLimit: RESTAKING_POOL_DISTRIBUTE_GAS_LIMIT,
            maxTVL: RESTAKING_POOL_MAX_TVL,
        });
        restakingPool.address = await restakingPool.getAddress();
        ratioFeed.address = await ratioFeed.getAddress();
        cToken.address = await cToken.getAddress();


        console.log('=== TransactionStorage');
        const txStorage = await ethers.deployContract("TransactionStorage", [owner.address]);
        txStorage.address = await txStorage.getAddress();

        console.log('=== CrossChainAdapterArbitrum');
        const arbAdapter = await ethers.deployContract("CrossChainAdapterArbitrum", [txStorage.address]);
        arbAdapter.address = await arbAdapter.getAddress();

        console.log('=== CrossChainAdapterOptimism');
        const optAdapter = await ethers.deployContract("CrossChainAdapterOptimism", [txStorage.address]);
        optAdapter.address = await optAdapter.getAddress();

        //===L2 mocks
        console.log('=== ArbOutboxMock');
        const arbOutboxMock = await ethers.deployContract("ArbOutboxMock", [target]);
        arbOutboxMock.address = await arbOutboxMock.getAddress();

        console.log('=== ArbBridgeMock');
        const arbBridgeMock = await ethers.deployContract("ArbBridgeMock", [arbAdapter.address, arbOutboxMock.address]);
        arbBridgeMock.address = await arbBridgeMock.getAddress();

        console.log('=== ArbInboxMock');
        const arbInboxMock = await ethers.deployContract("ArbInboxMock", [arbBridgeMock.address]);
        arbInboxMock.address = await arbInboxMock.getAddress();

        console.log('=== OptimismBridgeMock');
        const optBridgeMock = await ethers.deployContract("OptBridgeMock", [optAdapter.address]);
        optBridgeMock.address = await optBridgeMock.getAddress();

        console.log('=== MockLockbox');
        const lockboxMock = await ethers.deployContract("MockLockbox", [cToken.address, cToken.address, true]);
        lockboxMock.address = await lockboxMock.getAddress();

        console.log('=== Rebalancer');
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await upgrades.deployProxy(Rebalancer, [
            cToken.address,
            lockboxMock.address,
            restakingPool.address,
            txStorage.address,
            ratioFeed.address
        ]);
        rebalancer.address = await rebalancer.getAddress();

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
            lockboxMock,
            restakingPoolConfig,
            optAdapter,
            optBridgeMock
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
            lockboxMock,
            restakingPoolConfig,
            optAdapter,
            optBridgeMock
        ] = await init(owner, operator, treasury, target);
        clean_snapshot = await takeSnapshot();

        await txStorage.connect(owner).addChainId(ARB_ID);
        await txStorage.connect(owner).addAdapter(ARB_ID, arbAdapter.address);
        await txStorage.connect(owner).addChainId(OPT_ID);
        await txStorage.connect(owner).addAdapter(OPT_ID, optAdapter.address);

        MAX_THRESHOLD = await ratioFeed.MAX_THRESHOLD();
        ratioThresh = MAX_THRESHOLD / 100n; //1%
        await ratioFeed.connect(owner).setRatioThreshold(ratioThresh); //Default threshold 1%
        await ratioFeed.connect(operator).updateRatio(inEth.address, e18); //Default ratio 1

        //Arbitrum adapter
        await arbAdapter.setInbox(arbInboxMock.address);
        await arbAdapter.setL2Sender(target);
        await arbAdapter.setRebalancer(rebalancer.address);
        await optAdapter.setInbox(optBridgeMock.address);
        await optAdapter.setL2Sender(target);
        await optAdapter.setRebalancer(rebalancer.address);

        //Restaking pool
        await restakingPool.connect(owner).setFlashUnstakeFeeParams(30n * 10n ** 7n, 5n * 10n ** 7n, 25n * 10n ** 8n);
        await restakingPool.connect(owner).setStakeBonusParams(15n * 10n ** 7n, 25n * 10n ** 6n, 25n * 10n ** 8n);
        await restakingPool.connect(owner).setProtocolFee(50n * 10n ** 8n);
        await restakingPool.connect(owner).setTargetFlashCapacity(1n);
        await restakingPool.connect(owner).setMinStake(RESTAKING_POOL_MIN_STAKE);

        await restakingPoolConfig.connect(owner).setRebalancer(rebalancer.address);

        snapshot = await takeSnapshot();
    });

    describe("Restaking pool", function () {
        describe("After deployments checks", function () {
            before(async function () {
                await snapshot.restore();
            })

            it("Signer can stake", async function () {
                await restakingPool.connect(signer1)["stake()"]({value: 16n * e18});
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
            it("MAX_DIFF", async function () {
                expect(await rebalancer.MAX_DIFF()).to.be.eq(50_000_000_000_000_000n);
            })

            it("MULTIPLIER", async function () {
                expect(await rebalancer.MULTIPLIER()).to.be.eq(e18);
            })

            //Addresses
            it("inEth address", async function () {
                expect(await rebalancer.inETHAddress()).to.be.eq(inEth.address);
            })

            it("lockbox address", async function () {
                expect(await rebalancer.lockboxAddress()).to.be.eq(lockboxMock.address);
            })

            it("restaking pool address", async function () {
                expect(await rebalancer.liqPool()).to.be.eq(restakingPool.address);
            })

            it("transaction storage address", async function () {
                expect(await rebalancer.transactionStorage()).to.be.eq(txStorage.address);
            })

            it("ratio feed address", async function () {
                expect(await rebalancer.ratioFeed()).to.be.eq(ratioFeed.address);
            })

            //Values
            it("getRatioL2", async function () {
                expect(await rebalancer.getRatioL2(e18, e18)).to.be.eq(e18);
            })

            it("Default total amount to withdraw is 0", async function () {
                expect(await rebalancer.totalAmountToWithdraw()).to.be.eq(0n);
            })
        })

        describe("Setters", function () {
            beforeEach(async function () {
                await snapshot.restore();
            })

            const setters = [
                {
                    name: "transactionStorage address",
                    setter: "setTransactionStorage",
                    getter: "transactionStorage",
                    event: "TxStorageChanged"
                },
                {
                    name: "inEth address",
                    setter: "setInETHAddress",
                    getter: "inETHAddress",
                    event: "InEthChanged"
                },
                {
                    name: "lockbox address",
                    setter: "setLockboxAddress",
                    getter: "lockboxAddress",
                    event: "LockboxChanged"
                },
                {
                    name: "restaking pool address",
                    setter: "setLiqPool",
                    getter: "liqPool",
                    event: "LiqPoolChanged"
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

            before(async function () {
                await snapshot.restore();
                const amount = 32n * e18;
                await restakingPool.connect(signer1)["stake()"]({value: amount});
                expect(await inEth.totalSupply()).to.be.eq(amount);
            })

            const args = [
                {
                    name: "Increase amount and supply for the first time ARB only",
                    arb: {
                        l2Balance: e18,
                        l2TotalSupply: e18,
                    },
                },
                {
                    name: "Increase amount and supply for the first time OPT only",
                    opt: {
                        l2Balance: e18,
                        l2TotalSupply: e18,
                    },
                },
                {
                    name: "Increase amount and supply ARB and OPT",
                    arb: {
                        l2Balance: 2n * e18,
                        l2TotalSupply: 2n * e18,
                    },
                    opt: {
                        l2Balance: 2n * e18,
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Increase only eth amount ARB",
                    arb: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Increase only eth amount OPT",
                    opt: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Increase only inEth supply ARB",
                    arb: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: ethers.parseEther("2.5"),
                    }
                },
                {
                    name: "Increase only inEth supply OPT",
                    opt: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: ethers.parseEther("2.5"),
                    }
                },
                {
                    name: "Update to the same values ARB and OPT",
                    arb: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: ethers.parseEther("2.5"),
                    },
                    opt: {
                        l2Balance: ethers.parseEther("2.5"),
                        l2TotalSupply: ethers.parseEther("2.5"),
                    }
                },
                {
                    name: "Decrease amount and total supply ARB only",
                    arb: {
                        l2Balance: 2n * e18,
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Decrease amount and total supply OPT only",
                    opt: {
                        l2Balance: 2n * e18,
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Decrease only eth amount ARB and OPT",
                    arb: {
                        l2Balance: e18,
                        l2TotalSupply: 2n * e18,
                    },
                    opt: {
                        l2Balance: e18,
                        l2TotalSupply: 2n * e18,
                    }
                },
                {
                    name: "Decrease only total supply ARB abd OPT",
                    arb: {
                        l2Balance: e18,
                        l2TotalSupply: e18,
                    },
                    opt: {
                        l2Balance: e18,
                        l2TotalSupply: e18,
                    }
                },
                {
                    name: "Increase for ARB and decrease for OPT for the same amount",
                    arb: {
                        l2Balance: ethers.parseEther("1.5"),
                        l2TotalSupply: ethers.parseEther("1.5"),
                    },
                    opt: {
                        l2Balance: ethers.parseEther("0.5"),
                        l2TotalSupply: ethers.parseEther("0.5"),
                    }
                },
                {
                    name: "Decrease to 0 ARB",
                    arb: {
                        l2Balance: 0n,
                        l2TotalSupply: 0n,
                    }
                },
                {
                    name: "Decrease to 0 OPT",
                    opt: {
                        l2Balance: 0n,
                        l2TotalSupply: 0n,
                    }
                },
            ]

            args.forEach(function (arg) {
                it(`updateTreasuryData: ${arg.name}`, async () => {
                    const block = await ethers.provider.getBlock("latest");
                    const timestamp = block.timestamp;

                    const arbStateBefore = await txStorage.getTransactionData(ARB_ID);
                    const optStateBefore = await txStorage.getTransactionData(OPT_ID);
                    let arbl2BalanceNew, arbl2TotalSupplyNew;
                    let optl2BalanceNew, optl2TotalSupplyNew;
                    if (arg.arb) {
                        arbl2BalanceNew = arg.arb.l2Balance;
                        arbl2TotalSupplyNew = arg.arb.l2TotalSupply;
                        await arbBridgeMock.receiveL2Info(timestamp, arbl2BalanceNew, arbl2TotalSupplyNew);
                    } else {
                        arbl2BalanceNew = arbStateBefore.ethBalance;
                        arbl2TotalSupplyNew = arbStateBefore.inEthBalance;
                    }
                    if (arg.opt) {
                        optl2BalanceNew = arg.opt.l2Balance;
                        optl2TotalSupplyNew = arg.opt.l2TotalSupply;
                        await optBridgeMock.receiveL2Info(timestamp, optl2BalanceNew, optl2TotalSupplyNew);
                    } else {
                        optl2BalanceNew = optStateBefore.ethBalance;
                        optl2TotalSupplyNew = optStateBefore.inEthBalance;
                    }
                    const expectedTotalSupplyDiff = optl2TotalSupplyNew + arbl2TotalSupplyNew - arbStateBefore.inEthBalance - optStateBefore.inEthBalance
                    const expectedLockboxBalance = optl2TotalSupplyNew + arbl2TotalSupplyNew;
                    const totalSupplyBefore = await inEth.totalSupply();

                    let tx = await rebalancer.updateTreasuryData();


                    const totalSupplyAfter = await inEth.totalSupply();
                    const lockboxBalanceAfter = await inEth.balanceOf(lockboxMock.address);
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

            it("Repeated call for updateTreasuryData takes no effect", async function() {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp;
                await arbBridgeMock.receiveL2Info(timestamp, e18, e18);
                await optBridgeMock.receiveL2Info(timestamp, e18, e18);
                await rebalancer.updateTreasuryData();

                const totalSupplyBefore = await inEth.totalSupply();
                const lockboxBalanceBefore = await inEth.balanceOf(lockboxMock.address);
                await rebalancer.updateTreasuryData();

                const totalSupplyAfter = await inEth.totalSupply();
                const lockboxBalanceAfter = await inEth.balanceOf(lockboxMock.address);
                expect(totalSupplyAfter).to.be.eq(totalSupplyBefore);
                expect(lockboxBalanceAfter).to.be.eq(lockboxBalanceBefore);
            })

            it("inEth leftover on rebalancer will be transferred to the lockbox", async function() {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp;
                await arbBridgeMock.receiveL2Info(timestamp, e18, e18);
                await optBridgeMock.receiveL2Info(timestamp, e18, e18);
                await rebalancer.updateTreasuryData();

                const amount = randomBI(18);
                await inEth.connect(signer1).transfer(rebalancer.address, amount);

                const totalSupplyBefore = await inEth.totalSupply();
                const lockboxBalanceBefore = await inEth.balanceOf(lockboxMock.address);
                await expect(rebalancer.updateTreasuryData())
                    .to.emit(rebalancer, "InETHDepositedToLockbox")
                    .withArgs(amount);

                const totalSupplyAfter = await inEth.totalSupply();
                const lockboxBalanceAfter = await inEth.balanceOf(lockboxMock.address);
                expect(totalSupplyAfter).to.be.eq(totalSupplyBefore);
                expect(lockboxBalanceAfter - lockboxBalanceBefore).to.be.eq(amount);
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
                    .to.be.revertedWith("Chain ID already exists");
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
                    .to.revertedWith("Adapter already exists for this Chain ID");
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
                await expect(txStorage.connect(owner).replaceAdapter(randomBI(6), adapter))
                    .to.revertedWith("Adapter does not exist for this Chain ID");
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

        describe("handleL2Info", function() {
            it("handleL2Info reverts when called by not an adapter", async function() {
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
        describe("Setters", function () {
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
            ]

            setters.forEach(function (arg) {
                it(`Set new ${arg.name}`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(arbAdapter[arg.setter](newValue))
                        .to.emit(arbAdapter, arg.event)
                        .withArgs(newValue);

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
        })

        describe("receiveL2Eth", function () {
            before(async function () {
                await snapshot.restore();
            })

            const args = [
                {
                    name: "Random amount ~ 1e19",
                    amount: async () => randomBI(19)
                },
                {
                    name: "Restaking pool min amount",
                    amount: async () => await restakingPool.getMinStake()
                }
            ];

            args.forEach(function (arg) {
                it(arg.name, async function () {
                    const amount = await arg.amount();
                    const lockboxInEthBalanceBefore = await inEth.balanceOf(lockboxMock.address);

                    const tx = arbBridgeMock.connect(signer1).receiveL2Eth({value: amount});
                    await expect(tx)
                        .and.emit(arbAdapter, "L2EthDeposit").withArgs(amount)
                        .and.emit(rebalancer, "ETHReceived").withArgs(arbAdapter.address, arg.amount)
                        .and.emit(restakingPool, "Staked").withArgs(rebalancer.address, amount, amount);
                    await expect(tx).to.changeEtherBalance(restakingPool.address, amount);
                    await expect(tx).to.changeEtherBalance(signer1.address, -amount);

                    const lockboxInEthBalanceAfter = await inEth.balanceOf(lockboxMock.address);
                    console.log("Signer eth balance after: ", await ethers.provider.getBalance(signer1.address));
                    console.log("Restaking pool eth balance: ", await ethers.provider.getBalance(restakingPool.address));
                    console.log("lockbox inEth balance: ", await inEth.balanceOf(lockboxMock.address));

                    //Everything was transferred to the lockbox, nothing is left on rebalancer
                    expect(lockboxInEthBalanceAfter - lockboxInEthBalanceBefore).to.be.eq(amount);
                })
            })

            it("Reverts when amount < restaking pool min stake", async function () {
                const amount = await restakingPool.getMinStake() - 1n;
                await expect(arbBridgeMock.connect(signer1).receiveL2Eth({value: amount}))
                    .to.revertedWith("Address: unable to send value, recipient may have reverted");
            })
        })

        describe("handleL2Info", function () {
            let lastHandleTime;
            before(async function () {
                await snapshot.restore();
            })

            it("handleL2Info", async () => {
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


            it("Reverts: when there is a message with this timestamp", async function () {
                const balance = 200;
                const totalSupply = 200;

                await expect(arbBridgeMock.receiveL2Info(lastHandleTime, balance, totalSupply))
                    .to.revertedWith("Time before than prev recorded");
            })

            it("Reverts: when timestamp in the future", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(arbBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(arbAdapter, "FutureTimestamp");
            })

            it("Reverts: when called by not a bridge", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(arbAdapter.connect(signer1).receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(arbAdapter, "NotBridge");
            })

        })
    })

    describe("Crosschain adapter Optimism", function () {
        describe("Setters", function () {
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
                    name: "l2 sender address",
                    setter: "setL2Sender",
                    getter: "l2Sender",
                    event: "L2SenderChanged"
                },
                {
                    name: "optimism inbox",
                    setter: "setInbox",
                    getter: "inbox",
                    event: "InboxChanged"
                },
            ]

            setters.forEach(function (arg) {
                it(`Set new ${arg.name}`, async function () {
                    const newValue = ethers.Wallet.createRandom().address;
                    await expect(optAdapter[arg.setter](newValue))
                        .to.emit(optAdapter, arg.event)
                        .withArgs(newValue);

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
        })

        describe("receiveL2Eth", function () {
            before(async function () {
                await snapshot.restore();
            })

            const args = [
                {
                    name: "Random amount ~ 1e19",
                    amount: async () => randomBI(19)
                },
                {
                    name: "Restaking pool min amount",
                    amount: async () => await restakingPool.getMinStake()
                }
            ];

            args.forEach(function (arg) {
                it(arg.name, async function () {
                    const amount = await arg.amount();
                    const lockboxInEthBalanceBefore = await inEth.balanceOf(lockboxMock.address);

                    const tx = optBridgeMock.connect(signer1).receiveL2Eth({value: amount});
                    await expect(tx)
                        .and.emit(optAdapter, "L2EthDeposit").withArgs(amount)
                        .and.emit(rebalancer, "ETHReceived").withArgs(optAdapter.address, arg.amount)
                        .and.emit(restakingPool, "Staked").withArgs(rebalancer.address, amount, amount);
                    await expect(tx).to.changeEtherBalance(restakingPool.address, amount);
                    await expect(tx).to.changeEtherBalance(signer1.address, -amount);

                    const lockboxInEthBalanceAfter = await inEth.balanceOf(lockboxMock.address);
                    console.log("Signer eth balance after: ", await ethers.provider.getBalance(signer1.address));
                    console.log("Restaking pool eth balance: ", await ethers.provider.getBalance(restakingPool.address));
                    console.log("lockbox inEth balance: ", await inEth.balanceOf(lockboxMock.address));

                    //Everything was transferred to the lockbox, nothing is left on rebalancer
                    expect(lockboxInEthBalanceAfter - lockboxInEthBalanceBefore).to.be.eq(amount);
                })
            })

            it("Reverts when amount < restaking pool min stake", async function () {
                const amount = await restakingPool.getMinStake() - 1n;
                await expect(optBridgeMock.connect(signer1).receiveL2Eth({value: amount}))
                    .to.revertedWithCustomError(optAdapter, "TransferToRebalancerFailed");
            })

            it("Reverts when called by not a bridge", async function () {
                const amount = e18;
                await expect(optAdapter.connect(signer1).receiveL2Eth({value: amount}))
                    .to.revertedWithCustomError(optAdapter, "NotBridge");
            })
        })

        describe("handleL2Info", function () {
            let lastHandleTime;
            before(async function () {
                await snapshot.restore();
            })
            it("handleL2Info", async () => {
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

            it("Reverts: when timestamp is older than the last message", async function () {
                const balance = 100;
                const totalSupply = 100;

                await expect(optBridgeMock.receiveL2Info(lastHandleTime, balance, totalSupply))
                    .to.revertedWith("Time before than prev recorded");
            })

            it("Reverts: when timestamp in the future", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(optBridgeMock.receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(optAdapter, "FutureTimestamp");
            })

            it("Reverts: when called by not a bridge", async function () {
                const block = await ethers.provider.getBlock("latest");
                const timestamp = block.timestamp + 100;
                const balance = 100;
                const totalSupply = 100;

                await expect(optAdapter.connect(signer1).receiveL2Info(timestamp, balance, totalSupply))
                    .to.revertedWithCustomError(optAdapter, "NotBridge");
            })

        })
    })
})