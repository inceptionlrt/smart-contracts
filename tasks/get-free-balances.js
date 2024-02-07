const fs = require("fs").promises;
const path = require("path");
const addressesPath = "./scripts/migration/addresses";

async function readJsonFiles(dirPath) {
  const vaults = new Map();
  try {
    const files = await fs.readdir(dirPath);
    const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === ".json");

    for (const file of jsonFiles) {
      const filePath = path.join(dirPath, file);
      const fileContent = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(fileContent);
      const modifiedName = file.replace("mainnet_", "").replace(".json", "");
      vaults.set(modifiedName, jsonData);
    }
  } catch (error) {
    console.error("Error reading JSON files:", error);
  }

  return vaults;
}

task("get-free-balance", "It returns the current state of Inception").setAction(async (taskArgs) => {
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
  console.log(` ======== EXTRA amount: ${ethers.formatEther(extraAmount).toString()} | ${extraAmount.toString()} ========`);
  console.log("###### ###### ######  ######\n");
};
