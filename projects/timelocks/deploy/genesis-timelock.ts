import { ethers, run } from "hardhat";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer, governance] = await ethers.getSigners();

  const blocksPerDay = 7200;
  const args = [blocksPerDay, [deployer.address], [governance.address]];

  const timelock = await ethers.deployContract("GenesisTimeLock", args);
  await timelock.waitForDeployment();

  const block = await ethers.provider.getBlockNumber();
  while ((await ethers.provider.getBlockNumber()) < block + 5) {
    console.log("waiting before verification...");
    await sleep(6_000);
  }

  await run("verify:verify", {
    address: await timelock.getAddress(),
    constructorArguments: args,
    contract: "contracts/GenesisTimeLock.sol:GenesisTimeLock",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
