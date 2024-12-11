import { ethers, artifacts } from "hardhat";

async function main() {
  const contractAddress = "0x113A5A84F42B7485970D0Ea6061dD2CbeD35f7fA";

  // Load the ABI dynamically
  const contractArtifact = await artifacts.readArtifact("NativeRebalancer");
  const abi = contractArtifact.abi;

  // Connect to the contract
  const [signer] = await ethers.getSigners();
  const nativeRebalancer = new ethers.Contract(contractAddress, abi, signer);

  console.log("Fetching chainIds...");

  const chainIds = [];
  let index = 0;

  while (true) {
    try {
      console.log(`Querying chainId at index ${index}...`); // Debug log
      const chainId = await nativeRebalancer["chainIds(uint256)"](index);
      console.log(`Found chainId: ${chainId.toString()}`); // Debug log
      chainIds.push(chainId);
      index++;
    } catch (error) {
      if (error.message.includes("reverted")) {
        console.log("No more chainIds found, exiting loop."); // Debug log
        break;
      }
      throw error;
    }
  }

  if (chainIds.length === 0) {
    console.log("No chainIds found in the contract.");
    return;
  }

  console.log(`Chain IDs: ${chainIds.map((id) => id.toString()).join(", ")}`);

  console.log("Fetching txs data for each Chain ID...");
  const transactions = await Promise.all(
    chainIds.map(async (chainId) => {
      console.log(`Fetching tx data for chainId: ${chainId.toString()}`); // Debug log
      const txData = await nativeRebalancer.txs(chainId);
      return {
        chainId: chainId.toString(),
        timestamp: txData.timestamp.toString(),
        ethBalance: txData.ethBalance.toString(),
        inceptionTokenBalance: txData.inceptionTokenBalance.toString(),
      };
    })
  );

  console.log("Transactions stored in txs mapping:");
  transactions.forEach((tx) => {
    console.log(
      `Chain ID: ${tx.chainId}, Timestamp: ${tx.timestamp}, ETH Balance: ${tx.ethBalance}, InceptionToken Balance: ${tx.inceptionTokenBalance}`
    );
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
