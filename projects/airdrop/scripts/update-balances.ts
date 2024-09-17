import { ethers } from "ethers";
import * as fs from "fs";
import csvParser from "csv-parser";
import dotenv from "dotenv";

dotenv.config();

const CSV_FILE_PATH = "airdrop_config.csv";
const BATCH_SIZE = 1000;

async function main() {
    const airdropAddress = process.env.AIRDROP_ADDRESS;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    if (!airdropAddress || !provider || !wallet) {
        console.error("Please set all env variables!");
        process.exit(1);
    }

    const inceptionAirdrop = new ethers.Contract(
        airdropAddress,
        [
            "function updateAirdrop(address[] recipients, uint256[] newBalances) external",
        ],
        wallet
    );

    const recipients: string[] = [];
    const newBalances: bigint[] = [];

    await new Promise<void>((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csvParser())
            .on("data", (row: { address: string; token_amount: string }) => {
                try {
                    const address = ethers.getAddress(row.address);
                    console.log(`Valid address: ${address}`);

                    const amount = BigInt(row.token_amount) * 10n ** 18n;
                    console.log(`Valid amount: ${amount} wei for address ${address}`);

                    recipients.push(address);
                    newBalances.push(amount);
                } catch (error) {
                    console.error(`Invalid row in CSV: ${JSON.stringify(row)}`, error.message);
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

        // Send the tx, finally!
        try {
            const tx = await inceptionAirdrop.updateAirdrop(batchRecipients, batchBalances);
            await tx.wait();
            console.log(`Batch ${batchCount} airdrop updated successfully 👍`);
        } catch (error) {
            console.error(`Error updating airdrop for batch 👎 ${batchCount}:`, error);
        }
    }
}

main().catch((error) => {
    console.error("Sorry, got an error 🔫:", error);
    process.exit(1);
});
