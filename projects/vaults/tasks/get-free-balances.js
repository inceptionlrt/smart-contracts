const addressesPath = "./scripts/migration/addresses";
const { readJsonFiles } = require("./utils");

task("get-free-balances", "It returns the current state of Inception").setAction(async taskArgs => {
  const vaults = await readJsonFiles(addressesPath);
  for (const [vaultName, vaultData] of vaults) {
    await getState(vaultName, vaultData.iVaultAddress);
  }
});

const getState = async (vaultName, vaultAddress) => {
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InVault_E1");
  const iVault = await InceptionVaultFactory.attach(vaultAddress);

  const totalAssets = await iVault.totalAssets();
  const totalAmountToWithdraw = await iVault.totalAmountToWithdraw();
  const extraAmount = totalAssets - totalAmountToWithdraw;
  if (extraAmount <= 0) {
    return;
  }
  console.log(`###### VAULT (${vaultName}) ######`);
  console.log(
    ` ======== EXTRA amount: ${ethers.formatEther(extraAmount).toString()} | ${extraAmount.toString()} ========`,
  );
  console.log("###### ###### ######  ######\n");
};
