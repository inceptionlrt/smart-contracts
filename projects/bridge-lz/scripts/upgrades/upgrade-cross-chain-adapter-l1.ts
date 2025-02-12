import { ethers, upgrades, network } from "hardhat";
import hre from "hardhat";

async function main() {
  let proxyAddress: String;

  if (network.name === "mainnet") {
    proxyAddress = "0x1E0Bd0291165F789b794e9513Eb07a76849c1448";
  } else if (network.name === "holesky") {
    proxyAddress = "0xA2c902810eAE3C24208580e043cA0de36Ae66c3E";
  } else {
    throw new Error(`Unknown network: ${network.name}`);
  }

  const LZCrossChainAdapterL1 = await ethers.getContractFactory(
    "LZCrossChainAdapterL1",
  );

  const currentImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(
    `Current implementation address before upgrade: ${currentImplementationAddress}`,
  );

  console.log(`Upgrading LZCrossChainAdapterL1 at address: ${proxyAddress}...`);
  const upgradedContract = await upgrades.upgradeProxy(
    proxyAddress,
    LZCrossChainAdapterL1,
  );

  await upgradedContract.waitForDeployment();

  const newImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(
    `New implementation address after upgrade: ${newImplementationAddress}`,
  );

  console.log(
    `Successfully upgraded CrossChainAdapterArbitrumL2. Proxy address remains: ${proxyAddress}`,
  );

  console.log(`Verifying new implementation on Etherscan...`);
  await hre.run("verify:verify", {
    address: newImplementationAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
