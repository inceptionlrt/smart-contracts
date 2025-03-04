const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inwstETHVault_S",
  TokenName = "Inception Symbiotic Restaked wstETH",
  TokenSymbol = "inwstETHs",
  mellowWrappers = ["0xdC1741f9bD33DD791942CC9435A90B0983DE8665"],
  mellowVaults = ["0x5fD13359Ba15A84B76f7F87568309040176167cd"],
  asset = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  ratioFeed = "0xFd73Be536503B5Aa80Bf99D1Fd65b1306c69B191";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, mellowWrappers, mellowVaults, asset, ratioFeed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });