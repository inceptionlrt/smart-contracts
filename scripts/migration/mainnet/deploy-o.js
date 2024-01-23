/**
 * Origin Protol Ethereum LST
 */

const { addresses } = require("./config-addresses");
const { deployVault } = require("../deploy-vault");

const VaultName = "InoEthVault",
  TokenName = "Inception Restaked oETH",
  TokenSymbol = "InoETH";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
