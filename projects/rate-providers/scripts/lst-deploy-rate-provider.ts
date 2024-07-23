import { ethers } from "hardhat";
import { sleep, readJsonFiles } from "./utils";

type VaultData = {
  iVaultAddress?: string;
};

// TODO
const addressesPath = "./scripts/migration/addresses";
const inputVaultName: string = "";

async function main() {
  const vaults = await readJsonFiles(addressesPath);
  for (const [vaultName, vaultData] of vaults) {
    if (vaultName == inputVaultName) {
      const [factoryNameStr, vaultAddress] = await getRateProviderFactory(vaultName, vaultData);
      await deployRateProvider(factoryNameStr, vaultAddress);
    }
  }

  const rateProvider = await ethers.deployContract("InEthRateProvider", [inputVaultName]);
  await rateProvider.waitForDeployment();

  const block = await ethers.provider.getBlockNumber();
  while ((await ethers.provider.getBlockNumber()) < block + 5) {
    console.log("waiting before verification...");
    await sleep(6_000);
  }

  //   await run("verify:verify", {
  //     address: await rateProvider.getAddress(),
  //     constructorArguments: args,
  //     contract: "contracts/RateProvider.sol:InEthRateProvider",
  //   });
}
const deployRateProvider = async (factoryNameStr: string, vaultAddress: string) => {
  const RateProviderFactory = await ethers.getContractFactory(factoryNameStr);
  const rateProvider = await RateProviderFactory.deploy(vaultAddress);
  await rateProvider.waitForDeployment();

  console.log("RateProvider address: ", (await rateProvider.getAddress()).toString());
};

const getRateProviderFactory = async (vaultName: string, vaultData?: VaultData): Promise<[string, string]> => {
  let rateProviderFactory: string = "";
  switch (vaultName) {
    case "InstEthVault":
      rateProviderFactory = "InstETHRateProvider";
      break;
    case "InrEthVault":
      rateProviderFactory = "InrETHRateProvider";
      break;
    case "InosEthVault":
      rateProviderFactory = "InosETHRateProvider";
      break;
    case "InoEthVault":
      rateProviderFactory = "InoETHRateProvider";
      break;
    case "InankrEthVault":
      rateProviderFactory = "InankrETHRateProvider";
      break;
    case "InwbEthVault":
      rateProviderFactory = "InwbETHRateProvider";
      break;
    case "IncbEthVault":
      rateProviderFactory = "IncbETHRateProvider";
      break;
    case "InswEthVault":
      rateProviderFactory = "InswETHRateProvider";
      break;
    case "InEthxVault":
      rateProviderFactory = "InETHxRateProvider";
      break;
    case "InsfrxEthVault":
      rateProviderFactory = "InsfrxETHRateProvider";
      break;
    case "InmEthVault":
      rateProviderFactory = "InmETHRateProvider";
      break;
    case "InlsEthVault":
      rateProviderFactory = "InlsETHRateProvider";
      break;
    default:
      throw new Error("The vault is not supported");
  }

  const vaultAddress = vaultData?.iVaultAddress || "";
  if (!vaultAddress) {
    throw new Error("Vault address is missing");
  }

  return [rateProviderFactory, vaultAddress];
};
