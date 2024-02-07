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

task("deposit-extra", "TODO")
  .addParam("vault", "The name of the vault")
  .setAction(async (taskArgs) => {
    const inputVaultName = taskArgs["vault"];
    const vaults = await readJsonFiles(addressesPath);
    for (const [vaultName, vaultData] of vaults) {
      if (vaultName == inputVaultName) {
        await depositExtra(vaultData.iVaultAddress);
      }
    }
  });

const depositExtra = async (vaultAddress) => {
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InVault_E1");
  const iVault = await InceptionVaultFactory.attach(vaultAddress);

  [operator] = await ethers.getSigners();
  console.log(operator.getAddress());

  const tx = await iVault.connect(operator).depositExtra();
  const receipt = await tx.wait();

  console.log(`receipt: ${receipt.hash}`);
};
