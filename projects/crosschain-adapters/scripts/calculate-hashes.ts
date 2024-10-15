import { keccak256, toUtf8Bytes } from "ethers";

async function main() {
    // Define the event signatures as strings
    const retryableTicketCreatedSignature = "RetryableTicketCreated(uint256)";
    const redemptionFailedSignature = "RedemptionFailed(uint256)";

    // Calculate the keccak256 hash for the event signatures
    const retryableTicketCreatedHash = keccak256(toUtf8Bytes(retryableTicketCreatedSignature));
    const redemptionFailedHash = keccak256(toUtf8Bytes(redemptionFailedSignature));

    // Log the event signature hashes
    console.log("RetryableTicketCreated signature hash:", retryableTicketCreatedHash);
    console.log("RedemptionFailed signature hash:", redemptionFailedHash);
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
