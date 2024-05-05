const { ethers } = require("hardhat");

async function main() {
  const BeaconProxyPatternV1 = await ethers.getContractFactory("InceptionStaker");
  const beaconImpl = await BeaconProxyPatternV1.deploy();
  await beaconImpl.deployed();
  console.log(`-------- Restaker has been deployed at the address: ${beaconImpl.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
