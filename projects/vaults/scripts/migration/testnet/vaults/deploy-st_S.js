const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inwstETHVault_S",
  TokenName = "Inception Symbiotic Restaked wstETH",
  TokenSymbol = "inwstETHs",
  mellowWrappers = [],
  mellowVaults = [],
  asset = "0xB82381A3fBD3FaFA77B3a7bE693342618240067b",
  ratioFeed = "0xF155Db20A00e53671880611cBb626B66539c418A";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, mellowWrappers, mellowVaults, asset, ratioFeed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
