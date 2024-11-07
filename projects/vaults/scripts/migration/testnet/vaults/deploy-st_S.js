const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "",
  TokenName = "",
  TokenSymbol = "",
  mellowWrappers = [],
  mellowVaults = [],
  asset = "",
  trusteeManager = "";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, mellowWrappers, mellowVaults, asset, trusteeManager);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
