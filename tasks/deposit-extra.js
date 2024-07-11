const addressesPath = "./scripts/migration/addresses";
const { readJsonFiles } = require("./utils");

task("deposit-extra", "Deposits extra assets straight away to EigenLayer")
  .addParam("vault", "The name of the vault")
  .setAction(async taskArgs => {
    const inputVaultName = taskArgs["vault"];
    const vaults = await readJsonFiles(addressesPath);
    for (const [vaultName, vaultData] of vaults) {
      if (vaultName == inputVaultName) {
        await depositExtra(vaultData.iVaultAddress);
      }
    }
  });

const depositExtra = async vaultAddress => {
  const InceptionVaultFactory = await hre.ethers.getContractFactory("InVault_E1");
  const iVault = await InceptionVaultFactory.attach(vaultAddress);

  [operator] = await ethers.getSigners();
  console.log(operator.getAddress());

  const tx = await iVault.connect(operator).depositExtra();
  const receipt = await tx.wait();

  console.log(`receipt: ${receipt.hash}`);
};
