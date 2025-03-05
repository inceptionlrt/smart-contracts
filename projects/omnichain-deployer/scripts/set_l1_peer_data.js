const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("./gnosis-safe/gnosis-safe")

const adapterAddr = "0x53207e057e8cc72312f6981a889fc286fafa59dc" // L1 adapter
const adapterL2 = "0x7EEd6897D9F032AbccffD2f6AAFCfb59b24BD58E"
const peerValue = "0x000000000000000000000000" + adapterL2.substring(2)

async function main() {
    // @openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol:Ownable2StepUpgradeable
    const [deployer] = await ethers.getSigners();
    const provider = await deployer.provider.getNetwork();

  const bb = new BatchBuilder("", `Repair LZ config`, "Repair LZ config that was erased by setting receive lib", provider)


    let contract = await ethers.getContractAt("LZCrossChainAdapterL1", adapterAddr);
    bb.add(
        {
        to: contract,
        value: 0,
        method: "setChainIdFromEid",
        args: { _eid:"30255", _chainId:"252"}
        },
        JSON.parse(await contract.interface.formatJson())
    ).add(
        {
            to: contract,
            value: 0,
            method: "setPeer",
            args: {_eid:"30255", _peer:peerValue}
            },
            JSON.parse(await contract.interface.formatJson())
    ).save();

  //bb.save();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
