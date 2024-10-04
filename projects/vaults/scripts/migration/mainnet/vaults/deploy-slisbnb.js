/**
 * Staked Lista BNB
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "InslisBnbVault",
  TokenName = "Inception Restaked slisBNB",
  TokenSymbol = "inslisBNB";

async function main() {
  await deployVault(addresses, "0x74D1984A64F447371Be4019920180b52A33aDAdD", VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
