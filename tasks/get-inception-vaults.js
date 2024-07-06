const addressesPath = "./scripts/migration/addresses";
const { readJsonFiles } = require("./utils");

task("get-vaults", "It returns the supported Inception Vaults").setAction(async taskArgs => {
  const vaults = await readJsonFiles(addressesPath);
  for (const [vaultName, vaultData] of vaults) {
    await printVaultData(vaultName, vaultData);
  }
});

const printVaultData = async (vaultName, vaultData) => {
  console.log(`################## (${vaultName}) ########################`);
  console.log(
    `Name: ${vaultName} | vaultAddress: ${vaultData.iVaultAddress} | iTokenAddress: ${vaultData.iTokenAddress}\n`,
  );
};
