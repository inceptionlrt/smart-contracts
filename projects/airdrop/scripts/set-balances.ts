import { ethers } from "ethers";
import * as fs from "fs";
import csvParser from "csv-parser";
import dotenv from "dotenv";
import { HardhatRuntimeEnvironment } from "hardhat/types";

dotenv.config();

const CSV_FILE_PATH = "swell_non_contract_airdrop.csv";
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

  const inceptionAirdrop = new ethers.Contract(
    airdropAddress,
    [
      "function setAirdropBalances(address[] recipients, uint256[] newBalances) external",
      "function airdropBalances(address) view returns (uint256)",
    ],
    wallet
  );

  const recipients: string[] = [];
  const newBalances: bigint[] = [];

  // Read CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csvParser())
      .on("data", (row: { address: string; swell_blockchain_format: string }) => {
        try {
          // Validate address format
          const address = ethers.getAddress(row.address);
          if (row.address !== address) {
            throw new Error("address not in checksum format.");
          }
          console.log(`Valid address: ${address}`);

          // Validate amount
          const amount = BigInt(row.swell_blockchain_format);
          if (amount <= 0) {
            throw new Error("0 or less amount assigned.");
          }
          console.log(`Valid amount: ${amount} wei for address ${address}`);

          recipients.push(address);
          newBalances.push(amount);
        } catch (error) {
          console.error(`Invalid row in CSV: ${JSON.stringify(row)} - ${error.message}`);
          reject(new Error(`Invalid row in CSV: ${JSON.stringify(row)}`)); // Stop execution if an invalid row is found
          process.exit(1);
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

  let totalGasUsed = BigInt(0); // Track total gas used across all batches
  let totalGasCost = BigInt(0); // Track total gas cost in wei

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
      const tx = await inceptionAirdrop.setAirdropBalances(batchRecipients, batchBalances);
      const receipt = await tx.wait();

      console.log(`Batch ${batchCount} airdrop updated successfully 👍`);

      // Calculate gas used and cost for this transaction
      const gasUsed = receipt.gasUsed;
      const gasPrice = tx.gasPrice ? BigInt(tx.gasPrice.toString()) : BigInt(0);
      const gasCost = gasUsed * gasPrice;

      console.log(`Gas used for batch ${batchCount}: ${gasUsed.toString()}`);
      console.log(`Gas cost for batch ${batchCount}: ${ethers.formatEther(gasCost)} ETH`);

      totalGasUsed += gasUsed;
      totalGasCost += gasCost;

      // Check the airdrop balance for each recipient after the transaction
      for (const recipient of batchRecipients) {
        const updatedBalance = await inceptionAirdrop.airdropBalances(recipient);
        console.log(`Updated airdrop balance for ${recipient}: ${ethers.formatUnits(updatedBalance, 18)} tokens`);
      }
    } catch (error) {
      console.error(`Error updating airdrop for batch 👎 ${batchCount}:`, error);
      process.exit(1); // Exit if the transaction fails
    }
  }

  // Output total gas usage and cost
  console.log(`Total gas used: ${totalGasUsed.toString()}`);
  console.log(`Total gas cost: ${ethers.formatEther(totalGasCost)} ETH`);
}

main(hre)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Sorry, got an error 🔫:", error);
    process.exit(1);
  });
