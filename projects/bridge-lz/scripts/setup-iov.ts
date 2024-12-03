import { ethers, network } from "hardhat";

async function main() {
    console.log("Setting up InceptionOmniVault...");

    const networkName = network.name;
    console.log(`Network: ${networkName}`);

    let INCEPTION_TOKEN_ADDRESS: string;
    let CROSS_CHAIN_BRIDGE_ADDRESS_L2: string;
    let IOV_ADDRESS: string;
    let RATIO_FEED: string;

    switch (networkName) {
        case "arbitrum":
            IOV_ADDRESS = ""; // TODO: Insert InceptionOmniVault address for Arbitrum here
            INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO: Insert LZCrossChainBridgeL2 address for Arbitrum here
            RATIO_FEED = "0xfE715358368416E01d3A961D3a037b7359735d5e"; // Value from inception-service contracts-prod.yaml
            break;
        case "optimism":
            IOV_ADDRESS = ""; // TODO: Insert InceptionOmniVault address for Optimism here
            INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO: Insert LZCrossChainBridgeL2 address for Optimism here
            RATIO_FEED = "0xfD07fD5EBEa6F24888a397997E262179Bf494336"; // Value from inception-service contracts-prod.yaml
            break;
        case "arbitrumSepolia":
            IOV_ADDRESS = ""; // TODO: Insert InceptionOmniVault address for Arbitrum Sepolia here
            INCEPTION_TOKEN_ADDRESS = "";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0xb7A8CA74cbfe313804c3D52663e9b0C0585B5C4e";
            RATIO_FEED = ""; // TODO: Insert IInceptionRatioFeed address here
            break;
        case "optimismSepolia":
            IOV_ADDRESS = ""; // TODO: Insert InceptionOmniVault address for Optimism Sepolia here
            INCEPTION_TOKEN_ADDRESS = "0xb1692ed9b08f8dd641f4109568ed6f471166c7e5";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
            RATIO_FEED = ""; // TODO: Insert IInceptionRatioFeed address here
            break;
        default:
            throw new Error(`Unsupported network: ${networkName}`);
    }

    if (!IOV_ADDRESS) {
        throw new Error("Please set the IOV_ADDRESS for the current network");
    }

    if (!RATIO_FEED) {
        throw new Error("Please set the RATIO_FEED for the current network");
    }

    const operatorAddress = process.env.OPERATOR_ADDRESS;
    if (!operatorAddress) {
        throw new Error("Please set the OPERATOR_ADDRESS environment variable");
    }

    console.log("Deployment parameters:");
    console.log("Network:", networkName);
    console.log("Operator Address:", operatorAddress);
    console.log("Inception Token Address:", INCEPTION_TOKEN_ADDRESS);
    console.log("Inception Omni Vault:", IOV_ADDRESS);
    console.log("CrossChainBridge Address:", CROSS_CHAIN_BRIDGE_ADDRESS_L2);
    console.log("Ratio Feed:", RATIO_FEED);

    console.log("Setting target receiver on LZCrossChainAdapterL2...");

    const lzCrossChainAdapterL2 = await ethers.getContractAt(
        "LZCrossChainAdapterL2",
        CROSS_CHAIN_BRIDGE_ADDRESS_L2
    );

    const tx1 = await lzCrossChainAdapterL2.setTargetReceiver(IOV_ADDRESS);
    console.log("Waiting for target receiver transaction to complete...");
    await tx1.wait();

    console.log(
        `Target receiver set successfully on LZCrossChainAdapterL2: ${IOV_ADDRESS}`
    );

    console.log("Setting Ratio Feed on InceptionOmniVault...");

    const inceptionOmniVaultABI = [
        "function setRatioFeed(address newRatioFeed) external",
    ];
    const inceptionOmniVault = await ethers.getContractAt(
        inceptionOmniVaultABI,
        IOV_ADDRESS
    );

    const tx2 = await inceptionOmniVault.setRatioFeed(RATIO_FEED);
    console.log("Waiting for Ratio Feed transaction to complete...");
    await tx2.wait();

    console.log(
        `Ratio Feed set successfully on InceptionOmniVault: ${RATIO_FEED}`
    );

    console.log("Deployment complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying InceptionOmniVault:", error);
        process.exit(1);
    });
