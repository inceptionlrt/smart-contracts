import { ethers, upgrades } from "hardhat";

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Fixing proxy at address: ${proxyAddress}`);

    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    console.log(`Force importing the proxy with InceptionOmniVault factory...`);
    await upgrades.forceImport(proxyAddress, InceptionOmniVault, { kind: "transparent" });

    console.log(`Upgrading proxy to ensure correct implementation for InceptionOmniVault...`);
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, InceptionOmniVault, { redeployImplementation: 'always' });

    await upgradedContract.waitForDeployment();

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Proxy now points to implementation: ${newImplementationAddress}`);
}

main().catch((error) => {
    console.error("Error fixing the proxy:", error);
    process.exitCode = 1;
});
