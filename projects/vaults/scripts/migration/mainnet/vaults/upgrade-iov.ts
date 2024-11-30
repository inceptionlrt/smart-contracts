import { ethers, upgrades } from "hardhat";

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Preparing to upgrade InceptionOmniVault at address ${proxyAddress}`);

    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    const newImplementationAddress = await upgrades.prepareUpgrade(proxyAddress, InceptionOmniVault);
    console.log(`New implementation deployed at: ${newImplementationAddress}`);

    const upgraded = await upgrades.upgradeProxy(proxyAddress, InceptionOmniVault);
    console.log(`InceptionOmniVault upgraded at address: ${upgraded.address}`);

    const newImplAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Verified implementation address: ${newImplAddress}`);
}

// Run the script
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
