import { ethers, upgrades, run } from "hardhat";

async function main() {
    const proxyAddress = "0xd13469584C26c329D56176b243f0507f84Fb778A";

    console.log(`Preparing to upgrade NativeRebalancer at address: ${proxyAddress}`);

    const NativeRebalancerFactory = await ethers.getContractFactory("NativeRebalancer");
    console.log("Got contract factory for NativeRebalancer");

    const newImplementation = await upgrades.prepareUpgrade(proxyAddress, NativeRebalancerFactory);
    console.log(`New implementation deployed at: ${newImplementation}`);

    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    console.log(`Proxy Admin address: ${proxyAdminAddress}`);

    const proxyAdmin = await ethers.getContractAt(
        [
            "function upgradeAndCall(address proxy, address implementation, bytes data) external",
        ],
        proxyAdminAddress
    );

    console.log("Upgrading proxy...");
    const upgradeTx = await proxyAdmin.upgradeAndCall(proxyAddress, newImplementation, "0x");
    console.log(`Upgrade transaction sent: ${upgradeTx.hash}`);

    const receipt = await upgradeTx.wait();
    console.log(`Upgrade transaction confirmed in block ${receipt.blockNumber}`);

    const newImplementationVerified = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Verified new implementation address: ${newImplementationVerified}`);

    console.log("Verifying new NativeRebalancer implementation on Etherscan...");
    try {
        await run("verify:verify", {
            address: newImplementation,
            constructorArguments: [],
        });
        console.log("New NativeRebalancer implementation verified successfully!");
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

main()
    .catch((error) => {
        console.error("Error during upgrade:", error);
        process.exitCode = 1;
    });
