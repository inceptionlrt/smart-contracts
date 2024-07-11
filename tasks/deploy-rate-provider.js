const addressesPath = "./scripts/migration/addresses";
const { readJsonFiles } = require("./utils");

task("deploy-rate-provider", "Deploys a new RateProvider for a vault")
  .addParam("vault", "The name of the vault")
  .setAction(async taskArgs => {
    const inputVaultName = taskArgs["vault"];
    const vaults = await readJsonFiles(addressesPath);
    for (const [vaultName, vaultData] of vaults) {
      if (vaultName == inputVaultName) {
        const [factoryNameStr, vaultAddress] = await getRateProviderFactory(vaultName, vaultData);
        await deployRateProvider(factoryNameStr, vaultAddress);
      }
    }
  });

const deployRateProvider = async (factoryNameStr, vaultAddress) => {
  const RateProviderFactory = await hre.ethers.getContractFactory(factoryNameStr);
  const rateProvider = await RateProviderFactory.deploy(vaultAddress);
  await rateProvider.waitForDeployment();

  console.log("RateProvider address: ", (await rateProvider.getAddress()).toString());
};

const getRateProviderFactory = async (vaultName, vaultData) => {
  let rateProviderFactory;
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
      console.log("the vault is not supported");
  }
  return [rateProviderFactory, vaultData.iVaultAddress];
};
