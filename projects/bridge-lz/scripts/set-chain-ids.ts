const { ethers } = require("hardhat");

const Options = require("@layerzerolabs/lz-v2-utilities").Options;
const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString();

async function main() {
    const myOAppAddressA = "0x3f2dF8698b09c02Ea7aeBC5aC3E56a05afb870cf";
    const MyOAppA = await ethers.getContractAt("LZCrossChainBridge", myOAppAddressA);

    // Destination - Ethereum Sepolia, so we're setting its Chain ID
    const chainId = 11155111;
    //LZ Endpoint ID for Ethereum Sepolia
    const eId = 40161;

    //LZ Endpoint ID for Optimism Sepolia
    const chainIdOpt = 11155420;
    const eIdOpt = 40232;


    //LZ Endpoint ID for Arbitrum Sepolia
    const chainIdArb = 421614;
    const eIdArb = 40231;

    // let's set the eid and chainId
    let txSetChainId = await MyOAppA.setChainIdFromEid(eId, chainId);
    txSetChainId.wait();
    txSetChainId = await MyOAppA.setChainIdFromEid(eIdOpt, chainIdOpt);
    txSetChainId.wait();
    txSetChainId = await MyOAppA.setChainIdFromEid(eIdArb, chainIdArb);
    txSetChainId.wait();
    console.log("Chain IDs and eIDs set");


}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
