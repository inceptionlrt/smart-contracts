/**
 * Wrapped Binance Beacon Ethereum LST
 */

const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault");

const VaultName = "InwbEthVault",
  TokenName = "Inception Restaked wbETH",
  TokenSymbol = "InwbETH";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
