import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Use BigInt for balance calculations
    const initBalance: BigInt = BigInt(await deployer.provider!.getBalance(deployer.address));
    console.log("Account balance:", initBalance.toString());

    // 1. Deploy InceptionToken (InETH)
    const inETHFactory = await ethers.getContractFactory("InceptionToken");
    const inETH = await upgrades.deployProxy(inETHFactory, ["InceptionToken", "InETH"], { kind: "transparent" });
    await inETH.waitForDeployment();
    const inETHAddress = await inETH.getAddress();
    console.log(`InceptionToken deployed at: ${inETHAddress}`);

    // 2. Deploy ArbCrossChainAdapter
    const adapterFactory = await ethers.getContractFactory("ArbCrossChainAdapter");
    const crossChainAdapter = await adapterFactory.deploy(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"  // L1 target address
    );
    await crossChainAdapter.waitForDeployment();
    const crossChainAdapterAddress = await crossChainAdapter.getAddress();
    console.log(`ArbCrossChainAdapter deployed at: ${crossChainAdapterAddress}`);

    // 3. Deploy InceptionRatioFeed
    const ratioFeedFactory = await ethers.getContractFactory("InceptionRatioFeed");
    const ratioFeed = await ratioFeedFactory.deploy();
    await ratioFeed.waitForDeployment();
    const ratioFeedAddress = await ratioFeed.getAddress();
    console.log(`InceptionRatioFeed deployed at: ${ratioFeedAddress}`);

    // 4. Deploy InceptionOmniVault
    const vaultFactory = await ethers.getContractFactory("InceptionOmniVault");
    const inceptionOmniVault = await upgrades.deployProxy(
        vaultFactory,
        ["InceptionVault", inETHAddress, crossChainAdapterAddress], // Vault name, token address, cross chain adapter
        { initializer: "__InceptionOmniVault_init", kind: "transparent" }
    );
    await inceptionOmniVault.waitForDeployment();
    const inceptionOmniVaultAddress = await inceptionOmniVault.getAddress();
    console.log(`InceptionOmniVault deployed at: ${inceptionOmniVaultAddress}`);

    const setVaultTx = await crossChainAdapter.setVault(inceptionOmniVaultAddress);
    await setVaultTx.wait();
    console.log("Vault address set in ArbCrossChainAdapter");

    // 5. Set the RatioFeed in InceptionOmniVault
    const setRatioFeedTx = await inceptionOmniVault.setRatioFeed(ratioFeedAddress);
    await setRatioFeedTx.wait();
    console.log("RatioFeed address set in InceptionOmniVault");

    // 6. Set the vault address in InceptionToken
    const tx = await inETH.setVault(inceptionOmniVaultAddress);
    await tx.wait();
    console.log("Vault address set in InceptionToken");

    // 7. Update Ratio in InceptionRatioFeed to be less than 1
    const updateRatioTx = await ratioFeed.updateRatioBatch(
        [inETHAddress], // Array of token addresses
        [ethers.parseUnits("0.8", 18)] // New ratio - 0.8 InceptionTokens per 1 ETH
    );
    await updateRatioTx.wait();
    console.log("Updated the ratio for InceptionToken in InceptionRatioFeed");

    // 8. Call the vault function to mint 20 InETH tokens to itself
    const mintAmount = ethers.parseUnits("20", 18); // 20 InETH
    // const mintTx = await inceptionOmniVault.mintTokensToVault(mintAmount);
    // await mintTx.wait();
    console.log(`Minted 20 InETH to InceptionOmniVault at ${inceptionOmniVaultAddress}`);

    // 9. Get the InETH balance of InceptionOmniVault
    const vaultBalance = await inETH.balanceOf(inceptionOmniVaultAddress);
    console.log(`InceptionOmniVault balance: ${ethers.formatUnits(vaultBalance, 18)} InETH`);

    // Use BigInt for final balance
    const finalBalance: BigInt = BigInt(await deployer.provider!.getBalance(deployer.address));
    console.log(`Deployment completed. Gas spent: ${(initBalance - finalBalance).toString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
