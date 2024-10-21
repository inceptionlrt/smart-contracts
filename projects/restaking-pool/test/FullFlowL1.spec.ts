import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("CrossChainAdapterL1 Test with fixture", function () {
    async function deployContractsFixture() {
        const [deployer, user] = await ethers.getSigners();

        // Deploy the mock contract LZCrossChainBridgeMock
        const LZCrossChainBridgeMock = await ethers.getContractFactory("CrossChainBridgeMock");
        const lzCrossChainBridgeMock = await LZCrossChainBridgeMock.deploy(deployer.address);
        await lzCrossChainBridgeMock.waitForDeployment();

        const lzCrossChainBridgeMockAddress = await lzCrossChainBridgeMock.getAddress();

        // Deploy TransactionStorage
        const TransactionStorage = await ethers.getContractFactory("TransactionStorage");
        const transactionStorage = await TransactionStorage.deploy(deployer.address);
        await transactionStorage.waitForDeployment();

        const transactionStorageAddress = await transactionStorage.getAddress();

        // Deploy Rebalancer
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await Rebalancer.deploy();
        await rebalancer.initialize(
            deployer.address,             // _inETHAddress (placeholder)
            deployer.address,             // _lockbox (placeholder)
            deployer.address,             // _liqPool (placeholder)
            transactionStorageAddress,    // _transactionStorage
            deployer.address,             // _ratioFeed (placeholder)
            deployer.address              // _operator (placeholder)
        );
        await rebalancer.waitForDeployment();

        const rebalancerAddress = await rebalancer.getAddress();

        // Deploy CrossChainAdapterL1 as an upgradeable contract
        const CrossChainAdapterL1 = await ethers.getContractFactory("CrossChainAdapterL1");
        const crossChainAdapterL1 = await upgrades.deployProxy(
            CrossChainAdapterL1,
            [
                lzCrossChainBridgeMockAddress,
                rebalancerAddress,
                transactionStorageAddress
            ],
            { initializer: 'initialize' }
        );
        await crossChainAdapterL1.waitForDeployment();

        const crossChainAdapterL1Address = await crossChainAdapterL1.getAddress();

        await lzCrossChainBridgeMock.setAdapter(crossChainAdapterL1Address);

        // Link the CrossChainAdapterL1 as the adapter in TransactionStorage
        await transactionStorage.setAdapter(crossChainAdapterL1Address);

        return {
            crossChainAdapterL1,
            transactionStorage,
            rebalancer,
            deployer,
            user,
            lzCrossChainBridgeMock,
        };
    }

    it("Should call handleCrossChainData() successfully", async function () {
        const { crossChainAdapterL1, transactionStorage } = await loadFixture(deployContractsFixture);

        const chainId = 11155111;
        const timestamp = Math.floor(Date.now() / 1000);
        const balance = ethers.parseUnits("17", 18);
        const totalSupply = ethers.parseUnits("1122", 18);

        // Encode payload
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256"],
            [timestamp, balance, totalSupply]
        );

        // Ensure handleCrossChainData succeeds without reverting
        await expect(
            crossChainAdapterL1.handleCrossChainData(chainId, payload)
        ).to.not.be.reverted;

        // Verify that the transaction data was stored correctly
        const transaction = await transactionStorage.getTransactionData(chainId);
        expect(transaction.timestamp).to.equal(timestamp);
        expect(transaction.ethBalance).to.equal(balance);
        expect(transaction.inEthBalance).to.equal(totalSupply);
    });

    it("Should call receiveCrosschainEth() successfully", async function () {
        const { crossChainAdapterL1, rebalancer } = await loadFixture(deployContractsFixture);

        const chainId = 11155111;
        const ethAmount = ethers.parseEther("5.024");

        // Call receiveCrosschainEth and send 5 ETH
        await expect(
            crossChainAdapterL1.receiveCrosschainEth(chainId, { value: ethAmount })
        ).to.emit(crossChainAdapterL1, "L2EthDeposit").withArgs(chainId, ethAmount);

        // Check that the rebalancer received the ETH
        const rebalancerBalance = await ethers.provider.getBalance(rebalancer.getAddress());
        expect(rebalancerBalance).to.equal(ethAmount);
    });

    it("Should call sendEthToL2() from Rebalancer and emit event on CrossChainBridgeMock", async function () {
        const {
            rebalancer,
            lzCrossChainBridgeMock,
            deployer,
        } = await loadFixture(deployContractsFixture);

        // Set chainId
        const chainId = 11155111n;

        // Set rebalancer's balance to 10 ETH
        await deployer.sendTransaction({
            to: await rebalancer.getAddress(),
            value: ethers.parseEther("10"), // Send 10 ETH to Rebalancer
        });

        // Call quoteSendEthToL2 to get the fees
        const fee = await rebalancer.quoteSendEthToL2(chainId);

        // Call sendEthToL2 with 2 ETH and additional fees
        const ethAmount = ethers.parseEther("2"); // 2 ETH to send to L2

        // Call sendEthToL2 and check event
        await expect(
            rebalancer.sendEthToL2(chainId, ethAmount, { value: fee })
        ).to.not.be.reverted;

        // Check the final balance of Rebalancer
        const rebalancerFinalBalance = await ethers.provider.getBalance(await rebalancer.getAddress());
        const expectedFinalBalance = ethers.parseEther("10") - ethAmount;
        expect(rebalancerFinalBalance).to.equal(expectedFinalBalance);

        const totalAmount = fee + ethAmount;
        // Verify the correct event is emitted by CrossChainBridgeMock
        await expect(
            rebalancer.sendEthToL2(chainId, ethAmount, { value: fee })
        ).to.emit(lzCrossChainBridgeMock, "CrossChainMessageSent")
            .withArgs(chainId, totalAmount, "0x", fee); // raw `0x` for empty payload
    });

    it("Should simulate receiving ETH with an empty payload", async function () {
        const { lzCrossChainBridgeMock, crossChainAdapterL1 } = await loadFixture(deployContractsFixture);
        const chainId = 11155111;
        const ethAmount = ethers.parseEther("5.52");

        // Simulate receiving ETH with empty payload
        await expect(
            lzCrossChainBridgeMock.mockLzReceive(40161, "0x", { value: ethAmount })
        ).to.emit(lzCrossChainBridgeMock, "CrossChainMessageReceived")
            .withArgs(chainId, ethAmount, "0x");

        // Check if rebalancer received the ETH
        const rebalancerBalance = await ethers.provider.getBalance(crossChainAdapterL1.rebalancer());
        expect(rebalancerBalance).to.equal(ethAmount);
    });

    it("Should simulate receiving data with no ETH", async function () {
        const { lzCrossChainBridgeMock } = await loadFixture(deployContractsFixture);

        const chainId = 11155111;
        const timestamp = Math.floor(Date.now() / 1000) - 1000;
        const timestampSecond = Math.floor(Date.now() / 1000) - 500;
        const balance = ethers.parseUnits("17", 18);
        const totalSupply = ethers.parseUnits("1122", 18);

        // Encode payload
        const payload = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256"],
            [timestamp, balance, totalSupply]
        );

        const payloadSecond = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "uint256", "uint256"],
            [timestampSecond, balance, totalSupply]
        );

        // Simulate receiving payload with no ETH
        await expect(
            lzCrossChainBridgeMock.mockLzReceive(40161, payload)
        ).to.emit(lzCrossChainBridgeMock, "CrossChainMessageReceived")
            .withArgs(chainId, 0, payload);

        // Verify that handleCrossChainData was successfully relayed
        await expect(
            lzCrossChainBridgeMock.mockLzReceive(40161, payloadSecond)
        ).to.emit(lzCrossChainBridgeMock, "CrossChainDataSuccessfullyRelayed")
            .withArgs(chainId);
    });

});
