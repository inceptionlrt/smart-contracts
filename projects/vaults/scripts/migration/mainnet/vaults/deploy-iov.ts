import { ethers, upgrades } from "hardhat";

async function main() {
    console.log("Deploying InceptionOmniVault...");

    const network = await ethers.provider.getNetwork();
    const networkName = network.name.toLowerCase();

    let INCEPTION_TOKEN_ADDRESS: string;
    let CROSS_CHAIN_BRIDGE_ADDRESS_L2: string;

    switch (networkName) {
        case "arbitrum":
            INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO: Insert LZCrossChainBridgeL2 address for Arbitrum here
            break;
        case "optimism":
            INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO: Insert LZCrossChainBridgeL2 address for Optimism here
            break;
        case "arbitrumSepolia":
            INCEPTION_TOKEN_ADDRESS = "";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0xb7A8CA74cbfe313804c3D52663e9b0C0585B5C4e";
            break;
        case "optimismSepolia":
            INCEPTION_TOKEN_ADDRESS = "0xb1692ed9b08f8dd641f4109568ed6f471166c7e5";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = "0x838a7fe80f1AF808Bc5ad0f9B1AC6e26B2475E17";
            break;
        default:
            throw new Error(`Unsupported network: ${networkName}`);
    }

    if (!CROSS_CHAIN_BRIDGE_ADDRESS_L2) {
        throw new Error("Please set the CROSS_CHAIN_BRIDGE_ADDRESS_L2 for the current network");
    }

    const operatorAddress = process.env.OPERATOR_ADDRESS;
    if (!operatorAddress) {
        throw new Error("Please set the OPERATOR_ADDRESS environment variable");
    }

    const vaultName = "InceptionOmniVault";

    console.log("Deployment parameters:");
    console.log("Network:", networkName);
    console.log("Vault Name:", vaultName);
    console.log("Operator Address:", operatorAddress);
    console.log("Inception Token Address:", INCEPTION_TOKEN_ADDRESS);
    console.log("CrossChainBridge Address:", CROSS_CHAIN_BRIDGE_ADDRESS_L2);

    const InceptionOmniVaultFactory = await ethers.getContractFactory("InceptionOmniVault");
    console.log("Deploying Transparent Proxy...");

    const inceptionOmniVault = await upgrades.deployProxy(
        InceptionOmniVaultFactory,
        [vaultName, operatorAddress, INCEPTION_TOKEN_ADDRESS, CROSS_CHAIN_BRIDGE_ADDRESS_L2],
        {
            initializer: "initialize",
        }
    );

    console.log("Waiting for deployment...");
    await inceptionOmniVault.waitForDeployment();

    const deployedAddress = await inceptionOmniVault.getAddress();
    console.log("InceptionOmniVault deployed to (proxy):", deployedAddress);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(deployedAddress);
    console.log("InceptionOmniVault implementation deployed at:", implementationAddress);

    const adminAddress = await upgrades.erc1967.getAdminAddress(deployedAddress);
    console.log("Proxy Admin Address:", adminAddress);

    console.log("Setting bridge limits on IXERC20 contract...");

    const ixerc20 = await ethers.getContractAt("IXERC20", INCEPTION_TOKEN_ADDRESS);


    const bigNumberLimit = BigInt(900719925474099100000);


    const tx1 = await ixerc20.setBridgeLimits(deployedAddress, bigNumberLimit, bigNumberLimit);

    console.log("Waiting for bridge limits transaction to complete...");
    await tx1.wait();

    console.log(`Bridge limits set successfully on IXERC20 contract for bridge: ${deployedAddress}`);

    console.log("Setting target receiver on LZCrossChainAdapterL2...");

    const lzCrossChainAdapterL2 = await ethers.getContractAt(
        "LZCrossChainAdapterL2",
        CROSS_CHAIN_BRIDGE_ADDRESS_L2
    );

    const tx2 = await lzCrossChainAdapterL2.setTargetReceiver(deployedAddress);

    console.log("Waiting for target receiver transaction to complete...");
    await tx2.wait();

    console.log(
        `Target receiver set successfully on LZCrossChainAdapterL2: ${deployedAddress}`
    );

    console.log("Deployment complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying InceptionOmniVault:", error);
        process.exit(1);
    });
