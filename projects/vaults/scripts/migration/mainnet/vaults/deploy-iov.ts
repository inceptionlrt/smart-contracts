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
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO! Insert LZCrossChainBridgeL2 address for Arbitrum here
            break;
        case "optimism":
            INCEPTION_TOKEN_ADDRESS = "0x5A7a183B6B44Dc4EC2E3d2eF43F98C5152b1d76d";
            CROSS_CHAIN_BRIDGE_ADDRESS_L2 = ""; // TODO! Insert LZCrossChainBridgeL2 address for Optimism here
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

    const vaultName = "Inception OmniVault";

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
            initializer: "__InceptionOmniVault_init",
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

    console.log("Deployment complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error deploying InceptionOmniVault:", error);
        process.exit(1);
    });
