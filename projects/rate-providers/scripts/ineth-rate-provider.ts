import { ethers, run } from "hardhat";
import { sleep } from "./utils";

const inETHAddress = "0xf073bAC22DAb7FaF4a3Dd6c6189a70D54110525C";

async function main() {
  const args = [inETHAddress];

  const rateProvider = await ethers.deployContract("InEthRateProvider", args);
  await rateProvider.waitForDeployment();

  const block = await ethers.provider.getBlockNumber();
  while ((await ethers.provider.getBlockNumber()) < block + 5) {
    console.log("waiting before verification...");
    await sleep(6_000);
  }

  await run("verify:verify", {
    address: await rateProvider.getAddress(),
    constructorArguments: args,
    contract: "contracts/RateProvider.sol:InEthRateProvider",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
