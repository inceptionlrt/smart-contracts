const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inwstETHVault_S",
  TokenName = "Inception Symbiotic Restaked wstETH",
  TokenSymbol = "inwstETHs",
  mellowWrappers = [],
  mellowVaults = [],
  asset = "0x3F1c547b21f65e10480dE3ad8E19fAAC46C95034",
  wrappedAddress = "0x8d09a4502Cc8Cf1547aD300E066060D043f6982D";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, mellowWrappers, mellowVaults, asset, wrappedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });