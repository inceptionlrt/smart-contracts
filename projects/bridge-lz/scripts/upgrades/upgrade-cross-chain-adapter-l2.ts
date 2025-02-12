import { ethers, upgrades, network } from "hardhat";
import hre from 'hardhat';

async function main() {

    let proxyAddress: String;

    if (network.name === "arbitrum") {
        proxyAddress = "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522";
    } else if (network.name === "optimism") {
        proxyAddress = "0x19Ba5CcC603e1224B8502C56087e4147cEDD2522";
    } else if (network.name === "optimismSepolia") {
        proxyAddress = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
    } else if (network.name === "arbitrumSepolia") {
        proxyAddress = "";
        throw new Error(`Not configured yet: ${network.name}`);
    }
    else {
        throw new Error(`Unknown network: ${network.name}`);
    }

    const CrossChainAdapterArbitrumL2 = await ethers.getContractFactory("LZCrossChainAdapterL2");

    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Current implementation address before upgrade: ${currentImplementationAddress}`);

    console.log(`Upgrading CrossChainAdapterArbitrumL2 at address: ${proxyAddress}...`);
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, CrossChainAdapterArbitrumL2);

    await upgradedContract.waitForDeployment();

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`New implementation address after upgrade: ${newImplementationAddress}`);

    console.log(`Successfully upgraded CrossChainAdapterArbitrumL2. Proxy address remains: ${proxyAddress}`);

    console.log(`Verifying new implementation on Etherscan...`);
    await hre.run("verify:verify", {
        address: newImplementationAddress,
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
