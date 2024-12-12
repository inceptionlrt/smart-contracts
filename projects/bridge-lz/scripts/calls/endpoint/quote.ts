import { ethers, network } from "hardhat";
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
    let endpointAddress: string;

    if (network.config.chainId === 42161) { //Arbitrum
        endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
    } else if (network.config.chainId === 10) { //Optimism
        endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
    } else if (network.config.chainId === 8453) { //Base
        endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
    } else if (network.config.chainId === 81457) { //Blast
        endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
    } else if (network.config.chainId === 56) { //BSC
        endpointAddress = "0x1a44076050125825900e736c501f859c50fE728c";
    } else if (network.config.chainId === 11155420) { //Optimism Sepolia
        endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    } else if (network.config.chainId === 421614 || network.config.chainId === 31337) { //Arbitrum Sepolia
        endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
    } else {
        throw Error(`Unrecognized network: ${network.config.chainId}`);
    }

    console.log(`You are running using ${network.name} network`);


    const abi = [
        "function quote((uint32 dstEid, bytes32 receiver, bytes message, bytes options, bool payInLzToken) _params, address _sender) view returns ((uint256 nativeFee, uint256 lzTokenFee))",
        "function lzToken() view returns (address)"
    ];

    const provider = ethers.provider;
    const [deployer] = await ethers.getSigners();

    const contract = new ethers.Contract(endpointAddress, abi, provider);

    const options = Options.newOptions()
        .addExecutorLzReceiveOption(200_000n, 0n)
        .toHex();
    console.log(`Options: ${options}`);

    const receiver = ethers.zeroPadValue(deployer.address, 32);
    console.log(`Receiver: ${receiver}`);

    const rawMessage = "0x0000000000000000000000000000000000000000000000000000000067594772000000000000000000000000000000000000000000000000002E966F2E694D310000000000000000000000000000000000000000000000000000000001FC5262";
    const message = ethers.hexlify(ethers.getBytes(rawMessage));
    console.log(`Message: ${message}`);

    const params = {
        dstEid: 30101,
        receiver: receiver,
        message: message,
        options: options,
        payInLzToken: false,
    };

    const sender = deployer.address;
    console.log(`Sender: ${sender}`);

    try {
        console.log("Simulating quote call...");
        const result = await contract.quote(params, sender);

        console.log("Quote result:");
        console.log(`Native Fee: ${ethers.formatEther(result.nativeFee)} ETH`);
    } catch (error) {
        console.error("Error during simulation:", error);
    }
}

main().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
});
