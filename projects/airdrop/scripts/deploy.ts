import { ethers, network, run } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    const operatorAddress = process.env.OPERATOR_ADDRESS;
    const tokenAddress = process.env.TOKEN_ADDRESS;

    if (!operatorAddress || !tokenAddress) {
        console.error("Error: Please set both OPERATOR_ADDRESS and TOKEN_ADDRESS in your environment variables.");
        process.exit(1);
    }

    const [deployer] = await ethers.getSigners();

    console.log(`Deploying contracts with the account: ${deployer.address}`);

    const initialBalance = await ethers.provider.getBalance(deployer.address);

    // Deploy the InceptionAirdrop contract
    const InceptionAirdropFactory = await ethers.getContractFactory("InceptionAirdrop");
    const inceptionAirdrop = await InceptionAirdropFactory.deploy({
        gasLimit: 1_000_000,
    });
    await inceptionAirdrop.waitForDeployment();
    const inceptionAirdropAddress = await inceptionAirdrop.getAddress();
    console.log(`InceptionAirdrop deployed at: ${inceptionAirdropAddress}`);

    const tx = await inceptionAirdrop.initialize(deployer.address, operatorAddress, tokenAddress);
    await tx.wait();
    console.log(`InceptionAirdrop initialized with owner: ${deployer.address}, operator: ${operatorAddress}, token: ${tokenAddress}`);

    // Only attempt to verify if the network supports verification
    const supportedChains = [1, 4, 5, 42, 56, 137, 17000];

    const networkData = await ethers.provider.getNetwork();
    const chainId = Number(networkData.chainId);

    if (supportedChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract on Etherscan...");
        try {
            await run("verify:verify", {
                address: inceptionAirdropAddress,
                constructorArguments: [],
            });
            console.log("Contract verified successfully!");
        } catch (error) {
            console.error("Verification failed:", error);
        }
    } else {
        console.log(
            `Skipping verification. Network with chain ID ${chainId} is not supported for verification.`
        );
    }

    const finalBalance = await ethers.provider.getBalance(deployer.address);

    const deploymentCost = initialBalance - finalBalance;
    console.log(`Deployment cost: ${ethers.formatEther(deploymentCost)} ETH`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
