const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inwstETHVault_S",
  TokenName = "Inception Symbiotic Restaked wstETH",
  TokenSymbol = "inwstETHs",
  // [P2P, MEV]
  mellowWrappers = ["0x41A1FBEa7Ace3C3a6B66a73e96E5ED07CDB2A34d", "0xdC1741f9bD33DD791942CC9435A90B0983DE8665"],
  mellowVaults = ["0x7a4EffD87C2f3C55CA251080b1343b605f327E3a", "0x5fD13359Ba15A84B76f7F87568309040176167cd"],
  asset = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wrappedAddress = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, mellowWrappers, mellowVaults, asset, wrappedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
