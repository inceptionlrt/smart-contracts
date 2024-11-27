const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Replace with your deployed contract addresses
    const myOAppAddressA = "0x07E146B89606828A34D7d096E21be78207700a69"; //0x07E146B89606828A34D7d096E21be78207700a69
    const MyOAppA = await ethers.getContractAt("MyOApp", myOAppAddressA);

    const myOAppAddressB = "0xB9B9AfA6B41c26A4EC360248ebC7787d60f85AFd";
    const MyOAppB = await ethers.getContractAt("MyOApp", myOAppAddressB);

    // Set peers before quoting
    const destinationEid = 40232;

    // Define message and options
    const message = "Hello from L1!";
    const options = "0x";  // Empty options in hex format

    // Estimate fees
    const [nativeFee] = await MyOAppA.quote(destinationEid, message, options, false);

    // Send message with some ETH for messaging fees
    const tx = await MyOAppA.send(destinationEid, message, options, {
        value: nativeFee.toString(), // Ensure to provide enough fee
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
