import { ethers, upgrades, network } from "hardhat";
import hre from 'hardhat';

async function main() {

    let proxyAddress: string;

    if (network.name === "mainnet") {
        proxyAddress = "";
        throw new Error(`Mainnet not configured yet.`);
    } else if (network.name === "holesky") {
        proxyAddress = "0xd13469584C26c329D56176b243f0507f84Fb778A";
    } else {
        throw new Error(`Unknown network: ${network.name}`);
    }

    const NativeRebalancer = await ethers.getContractFactory("NativeRebalancer");

    const currentImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`Current implementation address before upgrade: ${currentImplementationAddress}`);

    console.log(`Upgrading NativeRebalancer at address: ${proxyAddress}...`);
    const upgradedContract = await upgrades.upgradeProxy(proxyAddress, NativeRebalancer);

    await upgradedContract.waitForDeployment();

    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`New implementation address after upgrade: ${newImplementationAddress}`);

    console.log(`Successfully upgraded NativeRebalancer. Proxy address remains: ${proxyAddress}`);

    console.log(`Verifying new implementation on Etherscan...`);
    await hre.run("verify:verify", {
        address: newImplementationAddress,
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
