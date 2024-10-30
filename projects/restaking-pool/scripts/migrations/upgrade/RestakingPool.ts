import { ethers, upgrades, run } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    const proxyAddress = "RESTAKING_POOL_PROXY_ADDRESS"; //TODO: change before firing the script
    console.log(`Upgrading contract RestakingPool with account: ${deployer.address}`);
    const network = await ethers.provider.getNetwork();
    console.log(`Network chain ID: ${network.chainId}`);
    console.log(`RestakingPool proxy: ${proxyAddress}`);

    const RestakingPool = await ethers.getContractFactory("RestakingPool");

    console.log("Starting the upgrade...");
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, RestakingPool);
    await upgradedContract.waitForDeployment();
    console.log("Upgrade completed, new implementation deployed at:", upgradedContract.address);

    try {
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("Implementation address to verify:", implementationAddress);

        await run("verify:verify", {
            address: implementationAddress,
            constructorArguments: [],
        });

        console.log("Verification successful!");
    } catch (error) {
        console.error("Error during verification:", error);
    }
}

main().catch((error) => {
    console.error("Error during upgrade:", error);
    process.exit(1);
});
