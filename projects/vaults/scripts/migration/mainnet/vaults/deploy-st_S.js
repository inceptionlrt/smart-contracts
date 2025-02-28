const { addresses } = require("../config-addresses");
const { deployVault } = require("../../deploy-vault_S");

const VaultName = "inLsETHVault_S",
  TokenName = "Inception Symbiotic Restaked LsETH",
  TokenSymbol = "inLsETHs",
  asset = "0x8c1BEd5b9a0928467c9B1341Da1D7BD5e10b6549",
  ratioFeed = "0xFd73Be536503B5Aa80Bf99D1Fd65b1306c69B191";

async function main() {
  await deployVault(addresses, VaultName, TokenName, TokenSymbol, asset, ratioFeed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
