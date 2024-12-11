import { ethers } from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0xC00cD5599F7E128FC5Ed5563147a45B12e83B3ac";
  const CONTRACT_ABI = [
    "event Deposited(uint256 destinationChain, address indexed destinationBridge, address indexed sender, address indexed receiver, address fromToken, address toToken, uint256 amount, uint256 nonce, (bytes32 name, bytes32 symbol, uint256 originChain, address originAddress) metadata)"
  ];

  const provider = ethers.provider;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

  const fromTokenFilter = "0xf073bac22dab7faf4a3dd6c6189a70d54110525c".toLowerCase();
  const destinationChainFilter = 10;

  console.log("Fetching Deposited events...");
  const events = await contract.queryFilter(contract.filters.Deposited());

  const filteredEvents = events.filter((event) => {
    const decodedEvent = contract.interface.decodeEventLog("Deposited", event.data, event.topics);
    const { destinationChain, fromToken } = decodedEvent;
    return (
      Number(destinationChain) === destinationChainFilter &&
      fromToken.toLowerCase() === fromTokenFilter
    );
  });

  let totalAmount = 0n;

  console.log(`Found ${filteredEvents.length} matching events:`);
  for (const event of filteredEvents) {
    const decodedEvent = contract.interface.decodeEventLog("Deposited", event.data, event.topics);
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

  console.log(`Total Amount: ${totalAmount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
