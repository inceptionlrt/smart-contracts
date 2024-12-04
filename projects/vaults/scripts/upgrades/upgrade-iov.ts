import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import hre from "hardhat";

async function main() {
    let proxyAddress: string;

    if (network.name === "arbitrum") {
        proxyAddress = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E";
    } else if (network.name === "optimism") {
        proxyAddress = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E";
    } else if (network.name === "optimismSepolia") {
        proxyAddress = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
    } else if (network.name === "arbitrumSepolia") {
        proxyAddress = "";
        throw new Error(`Not configured yet: ${network.name}`);
    } else {
        throw new Error(`Unknown network: ${network.name}`);
    }

    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    console.log(`Force importing proxy at address: ${proxyAddress}`);
    await upgrades.forceImport(proxyAddress, InceptionOmniVault, { kind: "transparent" });

    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Current implementation address before upgrade: ${currentImplementationAddress}`);

    console.log(`Upgrading InceptionOmniVault at address: ${proxyAddress}...`);
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, InceptionOmniVault);

    await upgradedContract.waitForDeployment();

    console.log("Contract upgraded successfully");

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`New implementation address after upgrade: ${newImplementationAddress}`);

    console.log(`Successfully upgraded InceptionOmniVault. Proxy address remains: ${proxyAddress}`);

    console.log(`Verifying new implementation on Etherscan...`);
    await hre.run("verify:verify", {
        address: newImplementationAddress,
    });
}

main().catch((error) => {
    console.error("Error during upgrade:", error);
    process.exitCode = 1;
});
