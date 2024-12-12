import { ethers } from "hardhat";

async function main() {
    const INCEPTION_BRIDGE_ADDRESS = "0xC00cD5599F7E128FC5Ed5563147a45B12e83B3ac".toLowerCase();
    const LOCKBOX_ADDRESS = "0xb86d7BfB30E4e9552Ba1Dd6208284667DF2E8c0E".toLowerCase();
    const INCEPTION_BRIDGE_ABI = [
        "event Deposited(uint256 destinationChain, address indexed destinationBridge, address indexed sender, address indexed receiver, address fromToken, address toToken, uint256 amount, uint256 nonce, (bytes32 name, bytes32 symbol, uint256 originChain, address originAddress) metadata)",
        "event Withdrawn(bytes32 receiptHash, address indexed sender, address indexed receiver, address fromToken, address toToken, uint256 amount)"
    ];
    const LOCKBOX_ABI = [
        "event Withdraw(address _sender, uint256 _amount)"
    ];

    const fromTokenFilter = "0xf073bac22dab7faf4a3dd6c6189a70d54110525c".toLowerCase();
    const destinationChainFilter = 10;

    const provider = ethers.provider;
    const inceptionBridgeContract = new ethers.Contract(INCEPTION_BRIDGE_ADDRESS, INCEPTION_BRIDGE_ABI, provider);
    const lockboxContract = new ethers.Contract(LOCKBOX_ADDRESS, LOCKBOX_ABI, provider);


    console.log("Fetching Deposited events...");
    const depositEvents = await inceptionBridgeContract.queryFilter(inceptionBridgeContract.filters.Deposited());

    const filteredDepositEvents = depositEvents.filter((event) => {
        const decodedEvent = inceptionBridgeContract.interface.decodeEventLog("Deposited", event.data, event.topics);
        const { destinationChain, fromToken } = decodedEvent;
        return (
            Number(destinationChain) === destinationChainFilter &&
            fromToken.toLowerCase() === fromTokenFilter
        );
    });

    let totalAmount = 0n;

    console.log(`Found ${filteredDepositEvents.length} matching Deposited events:`);
    for (const event of filteredDepositEvents) {
        const decodedEvent = inceptionBridgeContract.interface.decodeEventLog("Deposited", event.data, event.topics);
        totalAmount += BigInt(decodedEvent.amount);
        console.log({
            destinationChain: decodedEvent.destinationChain.toString(),
            sender: decodedEvent.sender,
            receiver: decodedEvent.receiver,
            fromToken: decodedEvent.fromToken,
            toToken: decodedEvent.toToken,
            amount: decodedEvent.amount.toString(),
            nonce: decodedEvent.nonce.toString(),
        });
    }

    // Fetch Withdrawn events
    console.log("Fetching Withdrawn events...");
    const withdrawnEvents = await inceptionBridgeContract.queryFilter(inceptionBridgeContract.filters.Withdrawn());
    console.log(`withdrawnEvents length: ${withdrawnEvents.length}`);

    // Filter Withdrawn events by toToken
    const filteredWithdrawnEvents = withdrawnEvents.filter((event) => {
        const decodedEvent = inceptionBridgeContract.interface.decodeEventLog("Withdrawn", event.data, event.topics);
        const { toToken } = decodedEvent;
        return toToken.toLowerCase() === fromTokenFilter;
    });
    console.log(`filteredWithdrawnEvents length: ${filteredWithdrawnEvents.length}`);

    // Filter Transfer logs in receipts
    let withdrawnAmount = 0n;
    for (const event of filteredWithdrawnEvents) {
        const txHash = event.transactionHash;
        console.log(`Processing transaction: ${txHash}`);

        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.logs) {
            receipt.logs
                .filter(log => log.address.toLowerCase() === LOCKBOX_ADDRESS.toLowerCase()
                ).forEach(log => {
                    try {
                        const decodedEvent = lockboxContract.interface.decodeEventLog("Withdraw", log.data, log.topics);
                        console.log(`_amount: ${BigInt(decodedEvent._amount).toString()}`);
                        withdrawnAmount += BigInt(decodedEvent._amount);
                    } catch (error) {
                        console.warn(`Error decoding Transfer event: ${error}`);
                    }
                });
        } else {
            console.warn(`No logs found for tx ${txHash}`);
        }
    }


    console.log(`Total Amount from Matching InceptionBridge.Deposited events: ${totalAmount}`);
    console.log(`Total Amount from Matching Lockbox.Withdraw events: ${withdrawnAmount}`);

    console.log(`Result: ${totalAmount - withdrawnAmount}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
