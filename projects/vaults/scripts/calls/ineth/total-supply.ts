import { ethers } from "hardhat";

async function main() {
    const erc20Address = "0xB1692ED9B08f8dd641f4109568ed6F471166c7E5";

    const erc20Abi = [
        "function totalSupply() view returns (uint256)"
    ];

    const [signer] = await ethers.getSigners();
    const erc20Contract = new ethers.Contract(erc20Address, erc20Abi, signer);

    console.log("Calling totalSupply...");
    try {
        const totalSupply = await erc20Contract.totalSupply();

        console.log(`Total Supply: ${totalSupply.toString()}`);
    } catch (error) {
        console.error("Error while calling totalSupply:", error);
    }
}

main()
    .catch((error) => {
        console.error("Error:", error);
        process.exitCode = 1;
    });
