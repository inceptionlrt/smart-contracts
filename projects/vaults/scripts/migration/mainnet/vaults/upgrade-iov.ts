import { ethers, upgrades } from "hardhat";

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Preparing to upgrade InceptionOmniVault at address ${proxyAddress}`);

    // Get the contract factory for the new implementation
    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    // Prepare the new implementation
    const newImplementationAddress = await upgrades.prepareUpgrade(proxyAddress, InceptionOmniVault);
    console.log(`New implementation deployed at: ${newImplementationAddress}`);

    // Perform the upgrade
    const upgraded = await upgrades.upgradeProxy(proxyAddress, InceptionOmniVault);
    console.log(`InceptionOmniVault upgraded at address: ${upgraded.address}`);

    // Optionally, fetch and display the new implementation address
    const newImplAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Verified implementation address: ${newImplAddress}`);
}

// Run the script
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
