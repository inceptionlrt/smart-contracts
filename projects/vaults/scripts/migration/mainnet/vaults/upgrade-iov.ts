import { ethers, upgrades } from "hardhat";

const PROXY_ADMIN_ABI = [
    "function upgradeAndCall(address proxy, address implementation, bytes data) external",
    "function getProxyImplementation(address proxy) view returns (address)",
    "function getProxyAdmin(address proxy) view returns (address)"
];

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Preparing to upgrade InceptionOmniVault at address ${proxyAddress}`);

    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    console.log(`Proxy Admin address: ${proxyAdminAddress}`);

    const proxyAdmin = await ethers.getContractAt(PROXY_ADMIN_ABI, proxyAdminAddress);

    const InceptionOmniVault = await ethers.getContractFactory("InceptionOmniVault");

    const newImp = await upgrades.prepareUpgrade(proxyAddress, InceptionOmniVault, {
        kind: "transparent",
    });

    console.log(`New implementation deployed at: ${newImp}`);

    const upgradeTx = await proxyAdmin.upgradeAndCall(proxyAddress, newImp, "0x");
    console.log(`Upgrade transaction submitted: ${upgradeTx.hash}`);

    const receipt = await upgradeTx.wait();
    console.log(`Upgrade transaction confirmed in block ${receipt.blockNumber}`);

    const verifiedImplAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Verified new implementation address: ${verifiedImplAddress}`);

    const factoryAbi = JSON.parse(InceptionOmniVault.interface.formatJson() as string);
    const updatedDeployment = {
        address: proxyAddress,
        abi: factoryAbi,
        implementation: verifiedImplAddress,
    };

    const { save } = require("hardhat-deploy/dist/src/deployments");
    await save("InceptionOmniVault", updatedDeployment);
    console.log(`Deployment metadata for InceptionOmniVault updated.`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
