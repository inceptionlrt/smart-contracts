import { ethers, upgrades } from "hardhat";

const PROXY_ADMIN_ABI = [
    "function upgradeAndCall(address proxy, address implementation, bytes data) external",
    "function getProxyImplementation(address proxy) view returns (address)",
    "function getProxyAdmin(address proxy) view returns (address)"
];

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Preparing to upgrade InceptionOmniVault at address ${proxyAddress}`);

    let proxyAdminAddress;

    try {
        proxyAdminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
        if (proxyAdminAddress === ethers.ZeroAddress) {
            throw new Error("Proxy Admin address is 0x0");
        }
    } catch (error) {
        console.log(
            "Proxy Admin not managed by Hardhat. Attempting to resolve manually from storage slot."
        );
        const proxyAdminSlot = ethers.keccak256(
            ethers.toUtf8Bytes("eip1967.proxy.admin") + "00".repeat(12)
        );
        const adminAddress = await ethers.provider.getStorage(proxyAddress, proxyAdminSlot);
        proxyAdminAddress = ethers.getAddress(`0x${adminAddress.slice(-40)}`);
    }

    console.log(`Proxy Admin address: ${proxyAdminAddress}`);

    const proxyAdmin = new ethers.Contract(proxyAdminAddress, PROXY_ADMIN_ABI, ethers.provider.getSigner());

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
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
