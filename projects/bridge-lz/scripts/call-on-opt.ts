const { ethers } = require("hardhat");

const Options = require("@layerzerolabs/lz-v2-utilities").Options;
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

async function main() {
    // const myOAppAddressA = "0xB9B9AfA6B41c26A4EC360248ebC7787d60f85AFd";
    const myOAppAddressA = "0x64c1e6D05750657AE1b1Cb056Fc41E6D654716dC";
    // const MyOAppA = await ethers.getContractAt("MyOApp", myOAppAddressA);
    const MyOAppA = await ethers.getContractAt("CrosschainBridge", myOAppAddressA);

    // Set peers before quoting
    const destinationEid = 40161;

    // Define message and options
    const message = ethers.utils.toUtf8Bytes("");
    const options = Options.newOptions().addExecutorLzReceiveOption(200000, 1000).toHex().toString();


    // Estimate fees
    const [nativeFee] = await MyOAppA.quote(destinationEid, message, options, false);

    console.log(`nativeFee: ${nativeFee}`);


    // Send message with some ETH for messaging fees
    const tx = await MyOAppA.sendCrosschain(destinationEid, message, options, {
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
