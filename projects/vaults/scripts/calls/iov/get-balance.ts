import { ethers } from "hardhat";

async function main() {
    const contractAddress = "0x55ec970B8629E01d26BAA7b5d092DD26784136bb";

    console.log(`Fetching ETH balance of contract at address: ${contractAddress}`);

    try {
        const balance = await ethers.provider.getBalance(contractAddress);

        // Convert the balance to ETH for readability
        const balanceInEth = ethers.formatEther(balance);

        console.log(`Contract ETH Balance: ${balance.toString()} wei (${balanceInEth} ETH)`);
    } catch (error) {
        console.error("Error while fetching balance:", error);
    }
}

main()
    .catch((error) => {
        console.error("Error:", error);
        process.exitCode = 1;
    });
