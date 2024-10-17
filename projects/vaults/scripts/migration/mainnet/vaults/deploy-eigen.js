/**
 * EIGEN Token
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "InEigenVault",
  TokenName = "Inception Restaked EIGEN",
  TokenSymbol = "inEIGEN";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
