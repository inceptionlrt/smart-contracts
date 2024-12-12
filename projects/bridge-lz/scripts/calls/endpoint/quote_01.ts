import { ethers } from "hardhat";
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
    const contractAddress = "0x1a44076050125825900e736c501f859c50fE728c";

    const abi = [
        "function quote((uint32 dstEid, bytes32 receiver, bytes message, bytes options, bool payInLzToken) _params, address _sender) view returns ((uint256 nativeFee, uint256 lzTokenFee))",
        "function lzToken() view returns (address)"
    ];

    const provider = ethers.provider;
    const [deployer] = await ethers.getSigners();

    const contract = new ethers.Contract(contractAddress, abi, provider);

    const options = Options.newOptions()
        .addExecutorLzReceiveOption(400_000n, 0n)
        .toHex();
    console.log(`Options: ${options}`);

    const receiver = ethers.zeroPadValue(deployer.address, 32);
    console.log(`Receiver: ${receiver}`);

    const params = {
        dstEid: 30101,
        receiver: "0x292fC68C55572cf8bb680e6eED639899e83D2e06",
        message: ethers.toUtf8Bytes("Hello World"),
        options: options,
        payInLzToken: false,
    };

    const sender = deployer.address;
    console.log(`Sender: ${sender}`);

    try {
        console.log("Checking lzToken...");
        const lzToken = await contract.lzToken();
        console.log(`lzToken: ${lzToken}`);

        console.log("Simulating quote call...");
        const result = await contract.quote(params, sender);

        console.log("Quote result:");
        console.log(`  Native Fee: ${ethers.formatEther(result.nativeFee)} ETH`);
    } catch (error) {
        console.error("Error during simulation:", error);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
});