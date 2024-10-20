const { ethers } = require("hardhat");

const Options = require("@layerzerolabs/lz-v2-utilities").Options;
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

async function main() {
    // const myOAppAddressA = "0xB9B9AfA6B41c26A4EC360248ebC7787d60f85AFd";
    const myOAppAddressA = "0x160cC2E8A0f27D8DE07Df1Ac9ea5b7582ae23605";
    // const MyOAppA = await ethers.getContractAt("MyOApp", myOAppAddressA);
    const MyOAppA = await ethers.getContractAt("LZCrossChainBridge", myOAppAddressA);

    // Destination - Ethereum Sepolia, so we're setting its Chain ID
    const chainId = 11155111;
    //LZ Endpoint ID for Ethereum Sepolia
    const eId = 40161;

    // let's set the eid and chainId
    // const txSetChainId = await MyOAppA.setChainIdFromEid(eId, chainId);
    // txSetChainId.wait();
    // console.log("Chain ID and eID set");


    // Define message and options

    // Define the message with BigInt values
    const timestamp = BigInt(Math.floor(Date.now() / 1000)); // Current timestamp in seconds
    const balance = ethers.utils.parseUnits("1000", 18);   // BigInt Balance
    const totalSupply = ethers.utils.parseUnits("50000", 18); // BigInt Total supply

    // ABI encode the BigInt values
    // const message = ethers.utils.defaultAbiCoder.encode(
    //     ["uint256", "uint256", "uint256"],
    //     [timestamp, balance, totalSupply]
    // );

    const message = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256"],
        [timestamp, balance, totalSupply]
    );

    const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();


    // Estimate fees
    const nativeFee = await MyOAppA.quote(chainId, message, options, false);

    console.log(`nativeFee: ${nativeFee}`);


    // Send message with some ETH for messaging fees
    const tx = await MyOAppA.sendCrosschain(chainId, message, options, {
        value: nativeFee, // Ensure to provide enough fee
        gasLimit: 500000, // You can set a manual gas limit
    });

    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be confirmed
    await tx.wait();
    console.log("Message sent successfully!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
