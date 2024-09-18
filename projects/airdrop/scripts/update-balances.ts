import { ethers } from "ethers";
import * as fs from "fs";
import csvParser from "csv-parser";
import dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";

dotenv.config();

const CSV_FILE_PATH = "airdrop_config.csv";
const BATCH_SIZE = 1000;

async function main(hre: HardhatRuntimeEnvironment) {
    const networkName = hre.network.name;
    const networkConfig = hre.config.networks[networkName];

    if (!networkConfig) {
        console.error(`Network ${networkName} not configured!`);
        process.exit(1);
    }

    const rpcUrl = networkConfig.url;
    console.log(`rpcUrl is ${rpcUrl}`);

    const airdropAddress = process.env.AIRDROP_ADDRESS;

    if (!rpcUrl || !airdropAddress) {
        console.error("Error: RPC URL or AIRDROP_ADDRESS is missing.");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    // Check if the Airdrop contract exists at the specified address
    const code = await provider.getCode(airdropAddress);
    if (code === "0x") {
        console.error(`Error: No contract found at address ${airdropAddress}`);
        process.exit(1);
    }

    console.log(`Airdrop contract exists at ${airdropAddress}`);

    const inceptionAirdrop = new ethers.Contract(
        airdropAddress,
        [
            "function updateAirdrop(address[] recipients, uint256[] newBalances) external",
        ],
        wallet
    );

    const recipients: string[] = [];
    const newBalances: bigint[] = [];

    // Read CSV file
    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csvParser())
            .on("data", (row: { address: string; token_amount: string }) => {
                try {
                    const address = ethers.getAddress(row.address);
                    console.log(`Valid address: ${address}`);

                    const amount = BigInt(row.token_amount);
                    console.log(`Valid amount: ${amount} wei for address ${address}`);

                    recipients.push(address);
                    newBalances.push(amount);
                } catch (error) {
                    const err = error as Error;
                    console.error(`Invalid row in CSV: ${JSON.stringify(row)}`, err.message);
                }
            })
            .on("end", () => {
                console.log("CSV file successfully processed.");
                resolve();
            })
            .on("error", (error) => {
                console.error("Error reading CSV file:", error);
                reject(error);
            });
    });

    if (recipients.length === 0 || newBalances.length === 0) {
        console.error("Error: No valid data found in the CSV file.");
        process.exit(1);
    }

    // Batches
    let batchCount = 0;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batchCount++;
        const batchRecipients = recipients.slice(i, i + BATCH_SIZE);
        const batchBalances = newBalances.slice(i, i + BATCH_SIZE);

        console.log(`Sending batch ${batchCount} with ${batchRecipients.length} recipients`);

        // Fetch the deployer's balance before sending the transaction
        const balance = await provider.getBalance(wallet.address);
        console.log(`Deployer's balance before batch ${batchCount}: ${ethers.formatEther(balance)} ETH`);

        // Send the transaction
        try {
            const tx = await inceptionAirdrop.updateAirdrop(batchRecipients, batchBalances);
            await tx.wait();
            console.log(`Batch ${batchCount} airdrop updated successfully 👍`);
        } catch (error) {
            console.error(`Error updating airdrop for batch 👎 ${batchCount}:`, error);
        }
    }
}

main(hre)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Sorry, got an error 🔫:", error);
        process.exit(1);
    });
