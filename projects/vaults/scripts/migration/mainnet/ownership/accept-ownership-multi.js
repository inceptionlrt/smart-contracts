const { ethers, upgrades } = require("hardhat");
const { BatchBuilder } = require("../../gnosis-safe/gnosis-safe");

const addressesToAccept = [
    "0x203d19635e6df0263a431c4d9b8e654dec723f62", // L1 rebalancer
    "0x53207e057e8cc72312f6981a889fc286fafa59dc" // L1 adapter
]

async function main() {
    // @openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol:Ownable2StepUpgradeable
    const [deployer] = await ethers.getSigners();

  const bb = new BatchBuilder("", `Accepting ownerships`, "Batch-accept ownerships as multisig", provider)


  addressesToAccept.forEach(async (element) => {
    let contract = await ethers.getContractAt("@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol:Ownable2StepUpgradeable", element);
    bb.add(
        {
        to: element,
        value: 0,
        method: "acceptOwnership",
        args: {}
        },
        JSON.parse(await contract.interface.formatJson()))
  });

  bb.save();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
