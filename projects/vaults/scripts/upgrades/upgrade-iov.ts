import { ethers, upgrades, network } from "hardhat";
import hre from "hardhat";

async function main() {
    let proxyAddress: string;

    if (network.name === "arbitrum") {
        proxyAddress = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E";
    } else if (network.name === "optimism") {
        proxyAddress = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E";
    } else if (network.name === "optimismSepolia") {
        proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";
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

    console.log(`Upgrading InceptionOmniVault at address: ${proxyAddress} using upgradeAndCall...`);

    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    const proxyAdmin = await ethers.getContractAt(
        ["function upgradeAndCall(address proxy, address implementation, bytes data) external"],
        proxyAdminAddress
    );

    const newImplementation = await upgrades.prepareUpgrade(proxyAddress, InceptionOmniVault);
    console.log(`New implementation deployed at: ${newImplementation}`);

    const data = "0x";

    const tx = await proxyAdmin.upgradeAndCall(proxyAddress, newImplementation, data);
    console.log(`Upgrade transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Upgrade transaction confirmed in block: ${receipt.blockNumber}`);

    const updatedImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`New implementation address after upgrade: ${updatedImplementationAddress}`);

    console.log(`Verifying new implementation on Etherscan...`);
    await hre.run("verify:verify", {
        address: updatedImplementationAddress,
    });

    console.log(`Successfully upgraded InceptionOmniVault. Proxy address remains: ${proxyAddress}`);
}

main().catch((error) => {
    console.error("Error during upgrade:", error);
    process.exitCode = 1;
});
