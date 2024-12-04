import { ethers } from "hardhat";

async function main() {
    const proxyAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";
    const previousImplementation = "0x8c674c6257ae0e589d9710ab57438cda591d1129";

    console.log(`Reverting proxy ${proxyAddress} to previous implementation: ${previousImplementation}`);

    const adminFunctionFragment = "function admin() view returns (address)";
    const iface = new ethers.Interface([adminFunctionFragment]);
    const adminFunctionData = iface.encodeFunctionData("admin");

    const proxyAdminAddress = await ethers.provider.call({
        to: proxyAddress,
        data: adminFunctionData,
    });

    const proxyAdminDecoded = iface.decodeFunctionResult("admin", proxyAdminAddress)[0];
    console.log(`Proxy Admin Address: ${proxyAdminDecoded}`);

    if (!proxyAdminDecoded || proxyAdminDecoded === ethers.ZeroAddress) {
        throw new Error("Unable to fetch the Proxy Admin address.");
    }

    const proxyAdmin = await ethers.getContractAt(
        [
            "function upgrade(address proxy, address implementation) external",
            "function getProxyImplementation(address proxy) view returns (address)",
        ],
        proxyAdminDecoded
    );

    const currentImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
    console.log(`Current implementation: ${currentImplementation}`);

    console.log("Returning previous implementation...");
    const tx = await proxyAdmin.upgrade(proxyAddress, previousImplementation);
    console.log(`Upgrade transaction submitted: ${tx.hash}`);
    await tx.wait();

    const newImplementation = await proxyAdmin.getProxyImplementation(proxyAddress);
    console.log(`New implementation: ${newImplementation}`);

    if (newImplementation.toLowerCase() === previousImplementation.toLowerCase()) {
        console.log("The proxy now points to the previous implementation.");
    } else {
        console.error("Fail.");
    }
}

main().catch((error) => {
    console.error("Error", error);
    process.exitCode = 1;
});
