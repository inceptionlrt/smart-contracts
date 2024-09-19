import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("Rebalancer, InETH, CrossChainAdapter, Lockbox and LiquidPool contracts", function () {
    async function deployContractsFixture() {

        const block = await ethers.provider.getBlock("latest");
        console.log(`Starting at block number: ${block.number}`);
        console.log("... Initialization of Inception ....");
        // Get signers
        const [owner] = await ethers.getSigners();
        const deployerAddress = await owner.getAddress();

        // Deploy InETH contract
        const InETHFactory = await ethers.getContractFactory("MockCToken");
        const inETH = await InETHFactory.deploy();
        const inETHAddress = await inETH.getAddress();

        // Deploy TxStorage contract
        const transactionStorageFactory = await ethers.getContractFactory("TransactionStorage");
        const transactionStorage = await transactionStorageFactory.deploy(deployerAddress);
        const transactionStorageAddress = await transactionStorage.getAddress();

        // Deploy InceptionRatioFeed
        const ratioFeedFactory = await ethers.getContractFactory("MockInceptionRatioFeed");
        const ratioFeed = await ratioFeedFactory.deploy();
        await ratioFeed.waitForDeployment();
        const ratioFeedAddress = await ratioFeed.getAddress();

        // Deploy RestakingPool mock
        const restakingPoolFactory = await ethers.getContractFactory("MockRestakingPool");
        const restakingPool = await restakingPoolFactory.deploy(inETHAddress, ratioFeedAddress);
        await restakingPool.waitForDeployment();
        const restakingPoolAddress = await restakingPool.getAddress();

        // Deploy ArbcrossChainAdapter
        const adapterFactory = await ethers.getContractFactory("MockCrossChainAdapter");
        const crossChainAdapter = await adapterFactory.deploy(transactionStorageAddress, restakingPoolAddress);
        await crossChainAdapter.waitForDeployment();
        const crossChainAdapterAddress = await crossChainAdapter.getAddress();

        // Add the chainId to the TransactionStorage
        const chainId = 42161; // Example Chain ID (Arbitrum)
        const addChainTx = await transactionStorage.addChainId(chainId);
        await addChainTx.wait();
        const setAdapterTx = await transactionStorage.addAdapter(chainId, crossChainAdapterAddress);
        await setAdapterTx.wait();


        // Deploy Lockbox
        const lockboxFactory = await ethers.getContractFactory("MockLockbox");
        const lockbox = await lockboxFactory.deploy(inETHAddress, inETHAddress, false);
        await lockbox.waitForDeployment();
        const lockboxAddress = await lockbox.getAddress();

        // Deploy Rebalancer
        const rebalancerFactory = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await upgrades.deployProxy(
            rebalancerFactory,
            [inETHAddress, lockboxAddress, restakingPoolAddress, transactionStorageAddress, ratioFeedAddress],
            { initializer: 'initialize' }  // Calling the initializer function
        );
        await rebalancer.waitForDeployment();

        return { inETH, rebalancer, crossChainAdapter, lockbox, restakingPool, transactionStorage, owner };
    }

    describe("updateTreasuryData() Function", function () {
        it.only("Should update treasury data when L1 ratio - L2 ratio is lower than MAX_DIFF", async function () {

            const { inETH, rebalancer, transactionStorage, lockbox, owner } = await loadFixture(deployContractsFixture);
            const lockboxAddress = await lockbox.getAddress();

            const block = await ethers.provider.getBlock("latest");

            const timestamp = block.timestamp - 10000000; // Timestamp needs to be in the past
            const balance = ethers.parseUnits("1000", 18); // Example balance: 1000 ETH
            const totalSupply = ethers.parseUnits("800", 18); // Example total supply: 800 InETH

            // Call handleL2Info with test data
            const chainId = 42161; // Example Chain ID (Arbitrum)
            const ownerAddress = await owner.getAddress();
            const txAddAdpter = await transactionStorage.replaceAdapter(chainId, ownerAddress);
            await txAddAdpter.wait();
            const handleL2InfoTx = await transactionStorage.handleL2Info(chainId, timestamp, balance, totalSupply);
            await handleL2InfoTx.wait();

            console.log("TransactionStorage.handleL2Info() called.");

            // Fetch the updated transaction data from storage
            const updatedTransaction = await transactionStorage.getTransactionData(chainId);

            // Log the updated data to the console for verification
            console.log("Updated Transaction Data:");
            console.log("Timestamp:", updatedTransaction.timestamp);
            console.log("ETH Balance:", ethers.formatUnits(updatedTransaction.ethBalance, 18));
            console.log("InETH Balance:", ethers.formatUnits(updatedTransaction.inEthBalance, 18));

            // Get initial InETH balance of the Lockbox before updating treasury data
            const initialLockboxInETHBalance = await inETH.balanceOf(lockboxAddress);
            console.log(`Initial Lockbox InETH Balance: ${ethers.formatUnits(initialLockboxInETHBalance, 18)} InETH`);

            // Call rebalancer.updateTreasuryData() to update the treasury and sync balances
            const updateTreasuryTx = await rebalancer.updateTreasuryData();
            await updateTreasuryTx.wait();
            console.log("Rebalancer.updateTreasuryData() called.");

            // Get the updated InETH balance of the Lockbox after calling updateTreasuryData()
            const updatedLockboxInETHBalance = await inETH.balanceOf(lockboxAddress);
            const expectedLockboxBalance = ethers.parseUnits("800");
            expect(updatedLockboxInETHBalance).to.be.eq(expectedLockboxBalance);

            console.log("end!");
        });


    });


});
