/**
 * EIGEN Token
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "InEigenVault",
  TokenName = "Inception Restaked EIGEN",
  TokenSymbol = "inEIGEN";

async function main() {
  await deployVault(addresses, "0xf21014B114bb976F890E15c19900cE9bE5Fb1e12", VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
