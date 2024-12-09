import { ethers } from "hardhat";

async function main() {
    // Address of the deployed InceptionOmniVault contract
    const vaultAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    // ABI for the deposit function
    const vaultAbi = [
        "function deposit(address receiver) payable returns (uint256)"
    ];



    // Connect to the first signer (sender of the transaction)
    const [signer] = await ethers.getSigners();

    // Receiver address for the deposit (can be the same as the sender)
    const receiverAddress = signer.address;

    // Connect to the InceptionOmniVault contract
    const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, signer);

    console.log("Calling deposit function...");
    try {
        // Call the deposit function with msg.value = 10000 wei
        const tx = await vaultContract.deposit(receiverAddress, {
            value: ethers.parseEther("0.001") // 10000 wei
        });

        console.log(`Transaction sent. Hash: ${tx.hash}`);
        console.log("Waiting for transaction to be mined...");

        // Wait for the transaction to be confirmed
        const receipt = await tx.wait();
        console.log("Transaction mined successfully!");

        // Log the transaction receipt
        console.log(`Transaction Receipt:`, receipt);
    } catch (error) {
        console.error("Error while calling deposit:", error);
    }
}

main()
    .catch((error) => {
        console.error("Error:", error);
        process.exitCode = 1;
    });
