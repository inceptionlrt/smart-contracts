import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("InceptionOmniVault contract", function () {
    async function deployInceptionOmniVaultFixture() {
        const [owner] = await ethers.getSigners();
        const deployerAddress = await owner.getAddress();

        // Deploy InceptionToken (Mock for IERC20)
        const InceptionTokenFactory = await ethers.getContractFactory("MockERC20");
        const inceptionToken = await InceptionTokenFactory.deploy("TEST InceptionLRT Token", "tINt", 18);
        await inceptionToken.waitForDeployment();  // Replaced .deployed()

        // Deploy CrossChainAdapter (Mock)
        const CrossChainAdapterFactory = await ethers.getContractFactory("MockCrossChainAdapterL2");
        const crossChainAdapter = await CrossChainAdapterFactory.deploy();
        await crossChainAdapter.waitForDeployment();  // Replaced .deployed()

        // Deploy MockRatioFeed (Mock for RatioFeed)
        const MockRatioFeedFactory = await ethers.getContractFactory("MockRatioFeed");
        const mockRatioFeed = await MockRatioFeedFactory.deploy();
        await mockRatioFeed.waitForDeployment();



        // Deploy InceptionOmniVault as an upgradeable proxy
        const InceptionOmniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");

        const inceptionOmniVault = await upgrades.deployProxy(
            InceptionOmniVaultFactory,
            ["InceptionVault", await inceptionToken.getAddress(), await crossChainAdapter.getAddress()],
            { initializer: '__InceptionOmniVault_init' }
        );

        // Set the RatioFeed in the vault
        await mockRatioFeed.updateMockRatio(await inceptionToken.getAddress(), ethers.parseUnits('1', 18));  // Example ratio of 1
        await inceptionOmniVault.setRatioFeed(mockRatioFeed.getAddress());
        inceptionOmniVault.transferOwnership(deployerAddress);
        await inceptionOmniVault.waitForDeployment();  // Replaced .deployed()

        // Set the RatioFeed for InceptionOmniVault
        await inceptionOmniVault.setRatioFeed(await mockRatioFeed.getAddress());

        return { inceptionOmniVault, inceptionToken, crossChainAdapter, mockRatioFeed, owner };
    }

    describe("Initialization", function () {
        it("Should initialize with correct values", async function () {
            const { inceptionOmniVault, inceptionToken, crossChainAdapter, mockRatioFeed } = await loadFixture(deployInceptionOmniVaultFixture);

            expect(await inceptionOmniVault.name()).to.equal("InceptionVault");
            expect(await inceptionOmniVault.inceptionToken()).to.equal(await inceptionToken.getAddress());
            expect(await inceptionOmniVault.crossChainAdapter()).to.equal(await crossChainAdapter.getAddress());
            expect(await inceptionOmniVault.ratioFeed()).to.equal(await mockRatioFeed.getAddress());
        });
    });

    describe("Deposits", function () {
        it("Should allow deposit and mint tokens correctly", async function () {
            const { inceptionOmniVault, inceptionToken, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const depositAmount = ethers.parseEther("1");
            const ownerAddress = await owner.getAddress();

            // Approve and deposit ETH into the contract
            await inceptionToken.mint(ownerAddress, depositAmount); // Mock mint tokens
            await inceptionToken.approve(await inceptionOmniVault.getAddress(), depositAmount); // Approve the vault contract
            const tx = await inceptionOmniVault.deposit(ownerAddress, { value: depositAmount });
            await tx.wait();

            const mintedBalance = await inceptionToken.balanceOf(ownerAddress);
            expect(mintedBalance).to.be.gt(0); // Check minted balance
        });

        it("Should revert deposit when amount is less than minimum amount", async function () {
            const { inceptionOmniVault, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const ownerAddress = await owner.getAddress();
            const depositAmount = ethers.parseUnits("50", "wei");

            await expect(
                inceptionOmniVault.deposit(ownerAddress, { value: depositAmount })
            ).to.be.revertedWithCustomError(inceptionOmniVault, "LowerMinAmount");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow withdrawals and reduce balance accordingly", async function () {
            const { inceptionOmniVault, inceptionToken, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const depositAmount = ethers.parseEther("1"); // Ensure sufficient deposit (1 ETH)
            const ownerAddress = await owner.getAddress();

            // Mint and approve tokens
            await inceptionToken.mint(ownerAddress, depositAmount); // Mint tokens to the owner
            await inceptionToken.approve(await inceptionOmniVault.getAddress(), depositAmount); // Approve the vault contract

            // Deposit ETH into the vault
            const depositTx = await inceptionOmniVault.deposit(ownerAddress, { value: depositAmount });
            await depositTx.wait(); // Wait for the deposit to be mined

            // Check total assets after deposit
            const totalAssets = await inceptionOmniVault.totalAssets();
            console.log(`Total Assets after deposit: ${totalAssets.toString()}`);

            // Check flash capacity before withdrawal
            const flashCapacity = await inceptionOmniVault.getFlashCapacity();
            console.log(`Flash Capacity: ${flashCapacity.toString()}`);

            // Assert the flash capacity is greater than zero
            expect(flashCapacity).to.be.gt(0); // This checks if the vault has capacity to withdraw

            console.log("Frog 🐸");


            // Withdraw the same amount that was deposited
            const withdrawTx = await inceptionOmniVault.flashWithdraw(depositAmount, ownerAddress);
            await withdrawTx.wait(); // Wait for the withdrawal to be mined

            // Check that the balance of the inceptionToken has been reduced after withdrawal
            const remainingBalance = await inceptionToken.balanceOf(ownerAddress);
            expect(remainingBalance).to.be.eq(0);
        });


        it("Should revert withdrawal if not enough capacity", async function () {
            const { inceptionOmniVault, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const withdrawAmount = ethers.parseEther("10"); // Exceeds available capacity

            await expect(
                inceptionOmniVault.flashWithdraw(withdrawAmount, await owner.getAddress())
            ).to.be.revertedWith("InsufficientCapacity");
        });
    });

    describe("Cross-Chain Adapter", function () {
        it("Should send assets info to L1", async function () {
            const { inceptionOmniVault, crossChainAdapter, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const ownerAddress = await owner.getAddress();

            // Mock sending assets info to L1
            await expect(inceptionOmniVault.sendAssetsInfoToL1()).to.emit(crossChainAdapter, "AssetsInfoSentToL1");

            // Check if assets info was correctly sent
            const sentTokens = await crossChainAdapter.getLastTokensSent();
            const sentEth = await crossChainAdapter.getLastEthSent();

            expect(sentTokens).to.be.gt(0);
            expect(sentEth).to.be.gt(0);
        });

        it("Should send ETH to L1", async function () {
            const { inceptionOmniVault, owner } = await loadFixture(deployInceptionOmniVaultFixture);
            const sendAmount = ethers.parseEther("1");
            const fees = ethers.parseEther("0.1");

            // Send ETH to contract
            await owner.sendTransaction({
                to: await inceptionOmniVault.getAddress(),
                value: sendAmount,
            });

            // Send ETH to L1
            await expect(inceptionOmniVault.sendEthToL1(sendAmount, fees)).to.emit(inceptionOmniVault, "EthSentToL1");

            // Check balance after sending
            const totalEth = await inceptionOmniVault.getTotalEth();
            expect(totalEth).to.equal(0);
        });
    });
});
